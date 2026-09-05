# My Documents — PRD

**Module:** Employee Document Library (IBP) · **Route:** `/my-documents`, `/my-documents/preview`
**Backend:** `ibp-service` (`company-employee` controller), fronted by `api-gateway`
**Created on:** 2026-07-20 · **Status:** Draft (documents current behavior + two requested fixes)
**Related:** [My-Documents-TRD.md](./My-Documents-TRD.md) — technical design, root-cause analysis, decision log

---

## 1. Overview

**My Documents** is the employee-facing document library inside IBP where an employee can find, filter, preview, and download every document associated with their policies and employment — policy certificates, claim forms, life-event proofs, personal documents, support tickets, and company-issued additional documents.

Entry point: top nav → **My Documents**. Page header: *"My Documents — Manage and download your uploaded documents."*

This PRD documents the **current as-is behavior** of the module (so it's an accurate reference, not aspirational), then specifies **two concrete fixes** requested by the business:

1. The document **preview** ("View") must reliably show the actual document, not a generic failure message.
2. **"Download All"** must only become available once the employee has actually made a selection (via "Select All" or individual checkboxes) — not be available by default.

## 2. Users & Use Cases

- **Primary user:** any enrolled employee, viewing their own documents only (scoped by `employeeId`/`companyId` resolved from the logged-in session).
- **Key jobs-to-be-done:**
  - "Find my policy certificate to send to a hospital / new employer."
  - "Check my claim form status by pulling up the document I submitted."
  - "Download every document from my last claim in one go, to email to someone."
  - "Confirm a document exists and is legible before relying on it."

## 3. Current Functionality (As-Is)

### 3.1 Page layout

- **Search bar** — "Search by document name or keyword…" (free-text, server-side for the policy-feature document set).
- **Filter row:**
  - **"All Documents"** — category dropdown (Policies, Additional Documents, Claims, Life Events, Personal Documents, Support Tickets, Communications, Other).
  - **"Document type"** — Policy Certificate, Additional Document, Claim Form, Life Event Proof, Personal Document, Support Ticket, Communication, Document.
  - **Sort** — "Latest First" / "Oldest First".
  - **"Clear all"** — resets every filter.
- **Sectioned card grid** — documents are grouped into named sections (e.g. "Policies Document", "Additional Documents"), each with a count badge, a **"Select All"** control, and a **"Download All"** control, followed by a grid of document cards.
- **Document card** — file-type icon (PDF/image/etc.), name, document type, "Latest modify \<date\>", a checkbox, and **View** / **Download** actions.
- **Document Preview page** (`/my-documents/preview`) — reached via "View". Shows a **"Document Preview"** pane on the left and a **"Properties"** panel on the right (File name, Document Type, Associated Context, Uploaded By, Latest modify), plus a page-level **Download** link.

### 3.2 Data sourcing

The list is actually a **client-side merge of two independent backend calls**:

1. **Policy-feature documents** — server-filtered/searched/sorted by the query params the user sets (category, document type, search, sort).
2. **Company additional documents** — fetched unconditionally (all of them, always), then filtered and sorted **entirely client-side**.

This is invisible to the employee today, but it means the two documents sets behave slightly differently under the same filter UI (see §5, GAP-3).

### 3.3 Selection & bulk download (current rule)

- Checking documents (individually or via "Select All") within a section fills a per-section selection.
- **"Download All" is currently enabled only once 2 or more documents in that section are selected** — checking exactly one document, or zero, leaves it disabled.
- This is the behavior being changed by FR-2 below.

### 3.4 View → Preview (current behavior)

- "View" navigates to the preview page, passing document metadata (file name, mime type, document type, associated context, uploaded-by, last-modified) directly in the navigation state — the **Properties panel always renders correctly** from this, independent of whether the preview itself loads.
- The **preview pane** separately fetches the actual file bytes. When that fetch fails for **any** reason, the pane shows a single generic message: *"Unable to load the document preview. Try downloading the file instead."* — this is what's currently being seen in practice (see TRD §6 for root-cause detail).

## 4. Known Gaps (documented for visibility — not all are in scope of this PRD's fixes)

| # | Gap | Impact |
|---|---|---|
| GAP-1 | Preview pane fails generically; the underlying cause (missing file in storage vs. auth/network failure) is discarded, not surfaced or logged. | Employees can't tell if it's *their* document that's broken or a general outage; support can't diagnose from the error shown. **In scope — FR-1.** |
| GAP-2 | "Download All" requires ≥2 selections, not ≥1. Looks like a bug next to a "Select All" control that a user might expect to immediately enable bulk download. | Confusing UX — selecting exactly one document offers no bulk-download affordance even though "Download All" is visible and looks actionable. **In scope — FR-2.** |
| GAP-3 | Selecting the **"Additional Document"** document-type filter sends a value the backend's allow-list validation doesn't recognize, causing that specific server-side call to fail (400). The additional documents still appear because they come from the unconditional, client-filtered call — but the two documents sets are being filtered by two different code paths under one dropdown. | Filter behaves inconsistently depending on which document set is being filtered; a future backend allow-list change (e.g. tightening validation elsewhere) could break this silently. **Out of scope for this round — flagged for follow-up.** |
| GAP-4 | A "Personal Documents" upload widget (drag/drop) is fully built in the page but has no visible entry point (its trigger button is commented out) — currently unreachable by any user. | Dead feature code sitting in production; either finish wiring it up or remove it. **Out of scope — flagged for product decision.** |
| GAP-5 | A 3-tab structure ("Policy Feature" / "TPA Card" / "Policy Confirmation Document") is defined in config but never rendered — the page always shows a single hardcoded tab. | Legacy scaffolding with no functional effect today; safe to remove once confirmed unused. **Out of scope — flagged for cleanup.** |

## 5. Functional Requirements (in scope)

### FR-1 — Document preview must reliably render the actual document

- When "View" is used on a document whose underlying file is retrievable, the preview pane **must render that file** (PDF/image), not a generic failure.
- When the file genuinely cannot be retrieved (deleted from storage, corrupted record, etc.), the error shown should still fall back to "Try downloading the file instead," but the **underlying failure must be logged/surfaced** (distinguishing "file not found" from "network/auth failure") so it's diagnosable rather than a black box.
- The **Properties panel must always show the details already available** (file name, document type, associated context, uploaded by, last modified) regardless of whether the preview binary itself loads — this already works today and must not regress.

**Acceptance criteria:**
- AC-1.1: Opening "View" on a document with a valid, retrievable file shows the rendered PDF/image preview.
- AC-1.2: Opening "View" on a document whose file is missing/corrupted shows a clear error state with a working "Download" fallback, and the failure reason is captured server-side/client-side logs (not just swallowed).
- AC-1.3: The Properties panel (file name, type, context, uploader, date) is populated correctly in both the success and failure cases.

### FR-2 — "Download All" is only enabled after a selection is made

- **"Download All" must be disabled by default** for a section with no selection.
- **"Download All" must become enabled as soon as at least one document in that section is selected** — via "Select All" or by checking any individual document(s). It should not require a minimum of two.
- Unchecking back down to zero selected must disable it again.

**Acceptance criteria:**
- AC-2.1: With 0 documents selected in a section, "Download All" is disabled.
- AC-2.2: Selecting exactly 1 document in a section enables "Download All" for that section.
- AC-2.3: Clicking "Select All" enables "Download All" (already true today, must be preserved).
- AC-2.4: "Download All" downloads exactly the currently-selected documents in that section (already true today, must be preserved).

## 6. Non-Functional Requirements

- **Security/Scope:** All document access remains scoped to the authenticated employee's own records; no change to the auth/ACL trust boundary (see TRD §3).
- **No new endpoints required** for FR-1/FR-2 — both are frontend logic changes plus (for FR-1) improved backend/frontend error diagnostics; TRD proposes not adding new network calls.
- **Backward compatibility:** No change to document type/category enums or existing API contracts as part of this round (GAP-3 stays a documented follow-up, not a breaking change now).

## 7. Out of Scope

- Fixing the "Additional Document" filter's server-side validation mismatch (GAP-3).
- Wiring up or removing the dormant "Personal Documents" upload widget (GAP-4).
- Removing the unused 3-tab scaffolding (GAP-5).
- Any change to how documents are categorized, uploaded, or which backend service owns them.

## 8. Open Questions

- Should the preview failure state distinguish "file missing" vs. "temporary network error" **in the UI itself** (e.g. suggest "try again" for transient failures), or is logging-only sufficient for this round? (TRD §6 proposes logging-only as the minimal fix; escalate if product wants a differentiated UI message.)
- Is a 2-vote (≥2 selected) "Download All" threshold intentional anywhere else in the app (consistency check), or unique to this screen? Assumed unique/unintentional here per this PRD's FR-2.
