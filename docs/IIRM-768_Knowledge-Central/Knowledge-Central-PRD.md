# Knowledge Central & iLearn · PRD

**Module:** IIRM-768_Knowledge-Central | **Apps:** iWork | **Date:** 2026-06-22 | **Status:** Draft | **Mode:** Reverse-engineered (as-built)

> **Implementation status tags** — every User Story, Business Rule, and Acceptance Criterion below is tagged against the current codebase:
> 🟢 **Live** — implemented and working as described · 🟡 **Deficit** — implemented but partial, buggy, or with a gap · 🔴 **Yet to start** — the described behavior or control is not in code yet.
> For items that describe a gap, the tag reflects the state of the *correct/intended* behavior (so an unguarded action reads 🔴/🟡, not 🟢).

---

## Overview

Knowledge Central is the iWork content library where internal users browse, search, and download the firm's sales and operational collateral — sales decks, brochures, presentations, legal documents, and FAQs. iLearn is the same content library scoped to a single category, Training Material, and serves as the internal learning/onboarding shelf. Both are read-first surfaces for the wider user base and author-controlled for a smaller set of users who can add, edit, and delete documents.

This PRD is **reverse-engineered from the existing implementation** rather than written ahead of build. It is therefore **descriptive (as-built), not prescriptive** — it captures what the code does today so the behavior can be reviewed, signed off, and carried into Jira and the TRD. There is no upstream BRD for this module; user stories trace to observed code behavior (cited inline) instead of BRD use-cases. Anything that looks like a gap or a candidate change is parked in [Open Questions](#open-questions) for Tech Lead review rather than asserted as a requirement.

The reader of this doc is a product owner signing off the feature, a developer extending it, or a QA engineer writing test cases against the acceptance criteria. The single most important thing to understand up front: **Knowledge Central and iLearn are one feature.** They share the same React pages' building blocks, the same `AddEditDocumentDrawer`, and the same backend knowledge service and `knowledge_central` data store. The only thing that separates them is a category filter — iLearn is "Knowledge Central where category = Training Material." Wherever this PRD says "the library," it means logic common to both; differences are called out explicitly in the [parity matrix](#knowledge-central-vs-ilearn--parity-matrix).

---

## Scope

### In scope (documented here)

- Browsing the document library by category, with "Recently Added" and "Most Popular" shelves (Knowledge Central).
- Client-side search across title, summary, and tags (Knowledge Central).
- Adding, editing, and deleting documents through a shared drawer (currently open to any user reaching the page — see BR-KC-021).
- Two content shapes: **uploaded files** (PDF/DOC/DOCX/TXT/JPG/JPEG/PNG) and **link documents** (Stream URL / Document URL / Website URL).
- Downloading files (with server-side password protection where configured) and opening link documents in a new tab.
- Access-count ("views") tracking per document.
- iLearn as a single-category (Training Material) variant of the same library.
- Permission gating of download via feature flags + ACL.

### Out of scope / not implemented (confirmed absent in code)

- No inline video/audio player and no in-browser document viewer — files download; links open in a new tab.
- No favorites, bookmarks, sharing, or "recently viewed by me" features.
- No bulk actions (no multi-select, bulk delete, or bulk edit).
- No server-side / API-based search — search is client-side filtering of already-loaded documents.
- No frontend file-size limit and no frontend MIME validation beyond the file-picker `accept` hint.
- No category navigation, search, or virtual shelves in iLearn — it is a single flat list.

### Deferred to TRD (Stage 40b)

Exact database DDL, file-storage layout (S3 vs local), password-protection mechanism, and precise endpoint contracts are described here only at the behavioral level; the TRD owns the implementation truth.

---

## Roles & Permissions

The library has effectively **one enforced access boundary today: file-download permission.** Everything else — viewing, opening links, and authoring (add/edit/delete) — is open to any authenticated user who can reach the page. The code does not check `ROLE_ADMIN`-style role constants in these pages. Download is governed by a feature flag plus the ACL system, resolved through a `useHasPermission` hook; nothing else is gated.

| Capability | Gated by | Behavior when denied |
|---|---|---|
| View / browse the library | Authenticated session only | — (no per-document or per-category restriction exists) |
| Download a file | `FF_IWORK_DOCUMENT_DOWNLOAD` flag + ACL on `EXPORT_KNOWLEDGE_DOCUMENT` (KC) / `EXPORT_ILEARN_DOCUMENT` (iLearn) | Download icon hidden; card not download-clickable; access attempt blocked |
| Open a link document | **Not gated** — no permission check | — (always opens; see BR-KC-018) |
| Add / Edit / Delete a document | **Not gated** — `CAN_EDIT` is hardcoded `true` in both pages | — (no denial path exists today; see BR-KC-021) |

Three consequences worth flagging for sign-off:

- **View is open to all authenticated users.** There is no per-category or per-document visibility restriction in code — if you can reach the page, you see every active document, and (because there is no tenant scoping, BR-KC-022) every document across all companies.
- **Authoring is also open.** Add/Edit/Delete has no RBAC gate today (`CAN_EDIT` hardcoded `true`). This is a gap, not a designed decision — see BR-KC-021 and Open Question 10.
- **Download is the only gated action — and only for files.** A user can be blocked from downloading a file, but link documents (Stream/Document/Website URL) bypass the gate entirely (BR-KC-018).

---

## Information Architecture & Navigation

### Knowledge Central

Knowledge Central opens to a category-organized browse page. At the top sit category chips that act as quick-jump anchors — clicking a chip smooth-scrolls to that category's section rather than navigating away. Below the chips, the page renders one horizontal section per category, plus two **virtual shelves** that are not real categories:

- **Recently Added** — newest documents first, capped at the page size.
- **Most Popular** — highest access-count first, capped at the page size.

Each category section shows up to 8 documents (the page size); a **View More** control loads the next page for that category on demand. Documents render as cards in a grid. A card displays: a file-type icon (derived from the file extension), the title, the creation date (`DD MMM YYYY`), the access count ("views"), and the first tag (with a `+N` indicator when more tags exist). The document summary appears as a tooltip on the icon. An edit affordance appears on card hover for users with edit rights.

Search is a single text field that filters the currently loaded documents by title, summary, and tags. It is client-side — it narrows what is already on screen and does not call the API.

### iLearn

iLearn is deliberately simpler. It is a single flat list of Training Material documents with no category chips, no search, and no virtual shelves. It shows explicit loading, empty, and unavailable states:

- Loading: a spinner while data loads.
- No category configured: "Training materials are not available right now."
- Category present but empty: "No training resources found."

iLearn is reachable from the `ilearn` route (and an alternate `iTicket` route maps to the same page).

---

## Content Model — Categories & Document Types

A document in this library is defined by two independent classifications: **which category it belongs to** (a business grouping) and **what type of content it is** (a file vs a link, and what kind). These are stored as lookup values, seeded in `knowledge_central.sql`.

### Business categories

These are the shelves a document can live on. Knowledge Central displays all of them **except** Training Material; iLearn displays **only** Training Material.

| Display name | Value code | Shown in Knowledge Central | Shown in iLearn |
|---|---|---|---|
| Sales Collateral | `SALES_COLLATERAL` | Yes | No |
| Presentations | `PRESENTATIONS` | Yes | No |
| Brochures | `BROCHURES` | Yes | No |
| Legal Docs | `LEGAL` | Yes | No |
| FAQs | `FAQ` | Yes | No |
| Training Material | `TRAINING` | No (filtered out) | Yes (only this) |

The split is enforced in code, not by configuration: Knowledge Central explicitly filters out the Training category, and iLearn explicitly fetches and shows only the Training category.

### Document types

The document type decides whether the drawer asks for a **file** or a **URL**, and how the document is later opened. There are seven types in two families.

| Display name | Value code | Family | How it opens |
|---|---|---|---|
| Document | `DOCUMENT` | File upload | Downloads the file |
| Video | `VIDEO` | File upload | Downloads the file (browser plays it) |
| Audio | `AUDIO` | File upload | Downloads the file (browser plays it) |
| Image | `IMAGE` | File upload | Downloads the file |
| Stream URL | `STREAM_URL` | Link | Opens URL in a new tab |
| Document URL | `DOCUMENT_URL` | Link | Opens URL in a new tab |
| Website URL | `WEBSITE_URL` | Link | Opens URL in a new tab |

The three link types behave identically at runtime — they all open the stored URL in a new tab (`target="_blank"`, `noopener,noreferrer`), with `https://` prepended if the author omitted the scheme. The distinction between them is purely descriptive/organizational, not functional.

---

## User Stories

Each story is written from the perspective of one of the two audiences and maps to behavior present in the code today. Numbering is `US-KC-NNN`. Each story carries an implementation-status tag (see legend at top). iLearn-specific stories are flagged.

- **US-KC-001** · 🟢 Live — As a **viewer**, I want to browse documents grouped by category so that I can find collateral by the kind of material I need.
- **US-KC-002** · 🟢 Live — As a **viewer**, I want a "Recently Added" shelf so that I can see the newest documents without hunting through categories.
- **US-KC-003** · 🟢 Live — As a **viewer**, I want a "Most Popular" shelf so that I can find the documents my colleagues use most.
- **US-KC-004** · 🟡 Deficit — As a **viewer**, I want to search by title, summary, and tags so that I can locate a document by keyword. *(Search only filters the already-loaded page; matches in unloaded "View More" pages are not found, and there is no "no results" state — see BR-KC-015.)*
- **US-KC-005** · 🟢 Live — As a **viewer**, I want to load more documents within a category on demand so that the page stays fast and uncluttered.
- **US-KC-006** · 🟢 Live — As a **viewer**, I want to download a file document so that I can use it offline, provided I have download permission.
- **US-KC-007** · 🟢 Live — As a **viewer**, I want to open a link document in a new tab so that I can reach streamed or externally-hosted content.
- **US-KC-008** · 🟢 Live — As a **viewer**, I want to see how many times a document has been accessed so that I can judge its relevance.
- **US-KC-009** · 🟢 Live — As an **author**, I want to add a file document with a title, category, type, summary, and tags so that it appears in the right shelf.
- **US-KC-010** · 🟢 Live — As an **author**, I want to add a link document by entering a URL so that I can publish externally-hosted material without uploading a file.
- **US-KC-011** · 🟢 Live — As an **author**, I want to edit a document's metadata, replace its file, or change its URL so that I can keep content current.
- **US-KC-012** · 🟢 Live — As an **author**, I want to delete a document with a confirmation step so that I don't remove content accidentally.
- **US-KC-013** · 🟢 Live — As an **iLearn author**, I want the category locked to Training Material so that training content can't be misfiled into another shelf.
- **US-KC-014** · 🟢 Live — As an **iLearn viewer**, I want a clear empty/loading/unavailable state so that I understand when no training material exists yet.
- **US-KC-015** · 🟢 Live — As the **system owner**, I want file download gated by permission so that only entitled users can pull files out of the library.
- **US-KC-016** · 🟡 Deficit — As an **author**, I want to change a document's type and category on edit — including moving content into or out of Training (between Knowledge Central and iLearn) — so that I can re-file content. *(Works today, but a file→link change orphans the old stored file and KC↔iLearn moves are unguarded — see BR-KC-016.)*
- **US-KC-017** · 🔴 Yet to start — As the **system owner**, I want create/edit/delete/download actions recorded for audit so that document changes are traceable. *(No activity/audit logging exists, despite an ACTIVITY-HISTORY module in the platform.)*
- **US-KC-018** · 🔴 Yet to start — As the **system owner**, I want documents scoped to the correct country/organization so that each tenant sees only its own content. *(List/catalog queries have no country/org filter — the library is global; see BR-KC-022.)*
- **US-KC-019** · 🔴 Yet to start — As the **system owner**, I want Add/Edit/Delete restricted to authorized users so that not every viewer can mutate the library. *(`CAN_EDIT` is hardcoded `true`; authoring is ungated — see BR-KC-021.)*

---

## Business Rules

Rules that govern how the library behaves regardless of who is using it. Numbering is `BR-KC-NNN`. Each rule carries an implementation-status tag (see legend at top).

- **BR-KC-001** · 🟢 Live — **Category/module binding.** Knowledge Central renders every category except Training Material; iLearn renders only Training Material. A document's category alone determines which surface it appears on. *Example:* a document filed under `LEGAL` appears in Knowledge Central and never in iLearn.
- **BR-KC-002** · 🟢 Live — **Type determines required input.** When the selected document type is a **link** type (`STREAM_URL`, `DOCUMENT_URL`, `WEBSITE_URL`), the drawer shows a URL field and hides the file field. For all other (file) types, it shows the file field and hides the URL field.
- **BR-KC-003** · 🟢 Live — **URL normalization.** A link document's URL is opened with `https://` prepended if the stored value has no scheme. *Example:* `intranet.example.com/x` opens as `https://intranet.example.com/x`.
- **BR-KC-004** · 🟡 Deficit — **Accepted file formats.** The file picker accepts only `.pdf, .doc, .docx, .txt, .jpg, .jpeg, .png`. This is a client-side picker hint only; the backend does not re-validate extension/MIME, and zero-byte/empty files are not blocked (see Open Question 1).
- **BR-KC-005** · 🟢 Live — **No password-protected uploads.** The backend rejects an uploaded file that is itself password-protected.
- **BR-KC-006** · 🟢 Live — **Access count increments on file access, not link access.** Downloading a file increments the document's access count. Opening a link document does **not** increment it. *Consequence:* the "Most Popular" shelf is biased toward file documents.
- **BR-KC-007** · 🟢 Live — **iLearn locks the category.** In iLearn the category field is disabled and auto-set to Training Material; the author cannot change it.
- **BR-KC-008** · 🟢 Live — **Delete is a soft delete.** Deleting a document marks it deleted (status + timestamp) and excludes it from all queries; the underlying file/URL is retained. Deletion requires explicit confirmation in the drawer.
- **BR-KC-009** · 🟢 Live — **Edit has three distinct save paths.** Editing routes to one of three operations depending on what changed: metadata-only update, file replacement, or URL update. A file replacement creates a new version of the document rather than overwriting in place.
- **BR-KC-010** · 🟢 Live — **Page size is 8.** Each category section and each virtual shelf shows up to 8 documents before "View More."
- **BR-KC-011** · 🟢 Live — **Download permission gate.** A file download requires the document-download feature flag and the corresponding ACL entitlement (`EXPORT_KNOWLEDGE_DOCUMENT` for Knowledge Central, `EXPORT_ILEARN_DOCUMENT` for iLearn). Without it, the download affordance is hidden and access is blocked.
- **BR-KC-012** · 🟢 Live — **Server-side password protection on download.** Where module password protection is configured (per country/organization), downloaded files are protected before being returned. The protection password is derived from user identity fields, with a configured default fallback.
- **BR-KC-013** · 🟢 Live — **Search is client-side and field-scoped.** Search filters already-loaded documents by title, summary, and tags only; it does not query the server and does not search file contents. *(Coverage gap captured in BR-KC-015.)*
- **BR-KC-014** · 🟢 Live — **Tags are comma-separated.** Tags are authored as a comma-separated string and stored as a list, with empty entries discarded. Tags are display-only — clicking a tag does nothing — and there is no max-count or max-length limit.
- **BR-KC-015** · 🟡 Deficit — **Search reaches only loaded pages.** Because search filters the already-paged subset, a matching document not yet loaded via "View More" is not found; and when the filtered set is empty, no "no results" message is shown (the grid renders blank).
- **BR-KC-016** · 🟡 Deficit — **Type and category are freely editable on edit.** An author can change a document's type across families (file ↔ link) and its category — including moving it into or out of Training, which moves it between Knowledge Central and iLearn. There is no guard or warning, and a file→link change leaves the old stored file orphaned (not deleted).
- **BR-KC-017** · 🟢 Live — **View-count semantics.** Every file download increments the count with no per-user dedupe (the author's own downloads and repeat downloads all count). The count is carried forward when a file is replaced (new version). Only the latest version is retrievable; prior versions are soft-deleted and inaccessible.
- **BR-KC-018** · 🟡 Deficit — **Link documents bypass the download gate.** Opening a link document (Stream/Document/Website URL) performs no permission check; the download gate (BR-KC-011) applies to files only. A user denied downloads can still open link documents.
- **BR-KC-019** · 🟡 Deficit — **URL scheme is not validated.** URL validation checks general shape only; dangerous schemes (`javascript:`, `data:`) are accepted and stored, then opened on click — a stored-XSS exposure.
- **BR-KC-020** · 🟡 Deficit — **Shelves are not deduplicated.** "Recently Added" and "Most Popular" are not deduplicated against each other or against category sections, so a single document can appear two or three times. "Most Popular" has no tie-break for equal access counts (order is undefined).
- **BR-KC-021** · 🔴 Yet to start — **Authoring is not access-controlled.** `CAN_EDIT` is hardcoded `true` in both pages, so any user who can reach the page can add, edit, and delete documents. RBAC gating of authoring is not implemented.
- **BR-KC-022** · 🔴 Yet to start — **No tenant scoping.** List and catalog queries apply no country/organization filter; every authenticated user sees the entire global library regardless of their company.
- **BR-KC-023** · 🟡 Deficit — **Duplicate titles allowed; minimal validation.** Document titles are not unique (duplicates persist). Title length is enforced only at the database (255 chars) — not in the API or UI; summary length is unbounded.
- **BR-KC-024** · 🟢 Live — **Storage/transfer failures surface as errors.** If a file is missing from storage (deleted underneath its DB record) or an upload/download fails, the user gets an error toast rather than silent success; an HTML error payload returned in place of a binary file is detected and reported.

---

## Acceptance Criteria

Given/When/Then criteria that constitute client sign-off, grouped under the stories they verify. Numbering is `AC-KC-NNN`. Each criterion carries an implementation-status tag (see legend at top). IDs 001–016 are stable; gap/edge-case criteria are appended as 017+ so existing IDs don't shift.

**Browsing & shelves (US-KC-001/002/003/005)**
- **AC-KC-001** · 🟢 Live — Given documents exist across multiple categories, when a viewer opens Knowledge Central, then one section per non-Training category is shown, each capped at 8 documents.
- **AC-KC-002** · 🟢 Live — Given more than 8 documents in a category, when the viewer clicks "View More" on that section, then the next page of that category loads and appends to the section.
- **AC-KC-003** · 🟢 Live — Given documents exist, when the viewer opens Knowledge Central, then a "Recently Added" shelf shows the newest documents first and a "Most Popular" shelf shows the highest-access-count documents first.
- **AC-KC-004** · 🟢 Live — Given a category chip is clicked, when the page responds, then it smooth-scrolls to that category's section without navigating away.

**Search (US-KC-004)**
- **AC-KC-005** · 🟢 Live — Given documents are loaded, when the viewer types a term matching a title, summary, or tag, then only matching documents remain visible; clearing the term restores the full set.

**Access (US-KC-006/007/008)**
- **AC-KC-006** · 🟢 Live — Given a file document and a user with download permission, when they trigger download, then the file is delivered as an attachment and the document's access count increments by one.
- **AC-KC-007** · 🟢 Live — Given a file document and a user **without** download permission, when they view the card, then no download affordance is shown and download is blocked.
- **AC-KC-008** · 🟢 Live — Given a link document, when any viewer activates it, then the stored URL opens in a new tab (with `https://` added if missing) and the access count does **not** change.
- **AC-KC-009** · 🟢 Live — Given a configured password-protection policy, when an entitled user downloads a file, then the returned file is password-protected per policy.

**Authoring (US-KC-009/010/011/012)**
- **AC-KC-010** · 🟢 Live — Given an author opens "Add Document," when they submit without a title, category, or type, then a validation error is shown for each missing required field and the document is not created.
- **AC-KC-011** · 🟡 Deficit — Given a file-type document, when the author selects a file outside `.pdf/.doc/.docx/.txt/.jpg/.jpeg/.png`, then the file picker does not offer it. *(Frontend picker only; a non-conforming file submitted directly is not rejected by the backend — BR-KC-004.)*
- **AC-KC-012** · 🟢 Live — Given a link-type document, when the author submits, then a URL field is required and an invalid URL is rejected with "Invalid website URL."
- **AC-KC-013** · 🟢 Live — Given an existing document, when the author edits metadata only, replaces the file, or changes the URL, then the correct save path runs and a success toast confirms the update; a file replacement produces a new version.
- **AC-KC-014** · 🟢 Live — Given an author chooses Delete, when the confirmation dialog appears and they confirm, then the document is soft-deleted, disappears from the library, and a success toast is shown; choosing "Go Back" cancels with no change.

**iLearn (US-KC-013/014)**
- **AC-KC-015** · 🟢 Live — Given iLearn, when an author opens the drawer, then the category field is disabled and fixed to Training Material.
- **AC-KC-016** · 🟢 Live — Given iLearn with no training documents, when it loads, then "No training resources found." is shown; when no training category is configured, "Training materials are not available right now." is shown; while loading, a spinner is shown.

**Edge cases & known gaps (US-KC-004/016/017/018/019)**
- **AC-KC-017** · 🟡 Deficit — Given a category with more than one page of documents, when a viewer searches for a term matching a document on an unloaded page, then that document is **not** found (search covers only loaded pages). [BR-KC-015]
- **AC-KC-018** · 🔴 Yet to start — Given a search that matches nothing in the loaded set, when results render, then no "no results" message is shown — the grid is simply empty. [BR-KC-015]
- **AC-KC-019** · 🟡 Deficit — Given an author edits a file document and changes its type to a link type, when they save, then the document becomes a link document and the previously stored file is left orphaned in storage (not deleted). [BR-KC-016]
- **AC-KC-020** · 🟡 Deficit — Given an author changes a Knowledge Central document's category to Training Material, when they save, then the document moves out of Knowledge Central and into iLearn with no warning. [BR-KC-016]
- **AC-KC-021** · 🟢 Live — Given the same user downloads the same file multiple times, when each download completes, then the access count increments on every download (no dedupe). [BR-KC-017]
- **AC-KC-022** · 🟢 Live — Given a file document is replaced with a new file, when the new version is saved, then the access count is carried forward and only the latest version is retrievable. [BR-KC-017]
- **AC-KC-023** · 🟡 Deficit — Given a user without download permission, when they open a link document, then it opens normally — the download gate does not apply to links. [BR-KC-018]
- **AC-KC-024** · 🟡 Deficit — Given an author enters a `javascript:` or `data:` URL for a link document, when they save, then it is accepted and stored, and is opened on click. [BR-KC-019]
- **AC-KC-025** · 🟡 Deficit — Given a document appears in "Recently Added" or "Most Popular," when the page renders, then the same document may also appear in its category section (no dedupe). [BR-KC-020]
- **AC-KC-026** · 🔴 Yet to start — Given two users where one lacks authoring rights, when each opens Knowledge Central, then both can add/edit/delete — authoring is ungated (`CAN_EDIT` hardcoded `true`). [BR-KC-021]
- **AC-KC-027** · 🔴 Yet to start — Given documents created by different companies/countries, when any authenticated user opens the library, then they see all documents globally — there is no tenant scoping. [BR-KC-022]
- **AC-KC-028** · 🟡 Deficit — Given two documents created with identical titles, when both are saved, then both persist (titles are not unique). [BR-KC-023]
- **AC-KC-029** · 🟢 Live — Given a file is missing from storage or an upload/download fails, when the user triggers the action, then an error toast is shown rather than a silent failure. [BR-KC-024]
- **AC-KC-030** · 🔴 Yet to start — Given any create/edit/delete/download action, when it completes, then no audit/activity record is written. [US-KC-017]
- **AC-KC-031** · 🟢 Live — Given an empty category in Knowledge Central, when the page renders, then the section header shows with an empty grid and no "View More" control. [BR-KC-010]

---

## Data Contract

This section describes the **logical shape** of what the library consumes and produces, not the storage implementation (the TRD owns that). Field names reflect the observed document model.

### Document (logical entity)

A document is identified by a stable `documentId` and carries a `version` that increments when its file is replaced. Its descriptive fields are `title`, `summary`, `tags[]`, `category`, and `docType`. Its content pointer is a single relative path/URL plus an `extension` (null for link documents). Operational fields are `accessCount`, audit stamps (`createdAt`, `updatedAt`, `createdBy`, `updatedBy`), a `status` (active/deleted), and a soft-delete timestamp.

| Field | Shape | Notes |
|---|---|---|
| `documentId` | identifier | Stable across versions; immutable |
| `version` | integer | Increments on file replacement |
| `title` | string (≤255) | Required |
| `summary` | text | Optional |
| `tags` | string[] | Comma-authored, empties stripped |
| `category` | lookup code | One of the six business categories |
| `docType` | lookup code | One of the seven document types |
| `path/url` | string | File path for file types; URL for link types |
| `extension` | string \| null | Null for link documents |
| `accessCount` | integer | Increments on file download only |
| `status` | lookup code | Active / Deleted |
| audit | `createdAt/By`, `updatedAt/By`, `deletedAt` | User identity + timestamps |

### API surface (observed, method + intent)

The knowledge service exposes a small CRUD-plus-download surface. Endpoints distinguish file documents from link documents at create and update time.

| Intent | Method | Path (observed) |
|---|---|---|
| Create file document | POST | `/knowledge/file` |
| Create link document | POST | `/knowledge/url` |
| Replace file on a document | PUT | `/knowledge/file/:documentId` |
| Update a document's URL | PUT | `/knowledge/:documentId/url` |
| Update metadata only | PUT | `/knowledge/:documentId` |
| Soft-delete a document | DELETE | `/knowledge/:documentId` |
| List documents (paged, by category) | GET | `/knowledge` |
| List catalog (categories + documents) | GET | `/knowledge/catalog` |
| Download a file (with protection) | GET | `/knowledge/:documentId/download` |
| Increment access count | POST | `/knowledge/:documentId/access` |

> The exact request/response schemas, storage backend, and password-protection internals are intentionally left to the TRD. The paths above are recorded from the implementation for traceability and should be re-confirmed against the controller during TRD authoring.

---

## Knowledge Central vs iLearn — Parity Matrix

The two surfaces share one codebase; this table is the definitive list of where they diverge. Everything not listed is identical.

| Aspect | Knowledge Central | iLearn |
|---|---|---|
| Categories shown | All except Training Material | Training Material only |
| Add / Edit / Delete | Yes (ungated — `CAN_EDIT` hardcoded true) | Yes (ungated — `canEdit` hardcoded true) |
| Category field in drawer | Selectable | Disabled, fixed to Training Material |
| Virtual shelves (Recently Added, Most Popular) | Yes | No |
| Search | Yes (client-side) | No |
| Category chips / quick-jump | Yes | No |
| Explicit loading / empty / unavailable states | Not emphasized | Yes (three distinct states) |
| Accepted file formats | Same (shared drawer) | Same (shared drawer) |
| Download permission flag | `EXPORT_KNOWLEDGE_DOCUMENT` | `EXPORT_ILEARN_DOCUMENT` |
| Page size | 8 | 8 |
| Backend service / data store | Shared `knowledge` service | Shared `knowledge` service |

---

## Non-Functional & Constraints

- **Performance:** category sections are paged at 8 to avoid loading the full library; search is in-memory over loaded documents.
- **Security:** file download is permission-gated and, where configured, files are password-protected server-side; uploads of password-protected files are rejected. However: view and authoring are **not** gated (anyone reaching the page can add/edit/delete — BR-KC-021), link documents bypass the download gate (BR-KC-018), there is no tenant scoping (BR-KC-022), and URL schemes are not sanitized (BR-KC-019). These are the headline security gaps for TL review.
- **Data integrity:** deletes are soft (audit trail preserved); `documentId` is immutable and file replacement is versioned.
- **Resilience:** the download path detects an HTML error payload returned in place of a binary file and surfaces a user-facing error rather than downloading a corrupt file.

---

## Open Questions

Items for Tech Lead / Product Owner resolution before or during TRD. Several are candidate changes — per project convention they are raised here for review rather than assumed.

1. **Backend file-type validation.** The accepted-format list is enforced only by the file-picker `accept` hint; the API does not appear to re-validate extension/MIME. Is server-side validation required, or is the picker hint considered sufficient? *(Potential security/data-quality change — needs TL review.)*
2. **File-size limits.** No frontend size limit exists. Is there an effective backend/storage limit, and should the UI communicate it?
3. **Access-count asymmetry.** Link documents never increment access count, so "Most Popular" under-counts link content. Is this intended, or should link opens be tracked too?
4. **View visibility.** View is open to every authenticated user with no per-category restriction. Is category- or role-scoped visibility a requirement for any content (e.g. Legal Docs)?
5. **Video/audio experience.** Video/Audio types currently download rather than play inline. Is an inline player expected, or is download acceptable for V1?
6. **iLearn search/navigation.** iLearn has no search or category navigation. As training content grows, is search needed there too?
7. **`iTicket` route.** An `iTicket` route maps to the iLearn page. Is this a legacy alias to keep, or should it be removed?
8. **Storage backend confirmation.** S3 vs local-filesystem behavior and the password-protection mechanism need confirmation in the TRD against the running service.
9. **Tenant scoping (HIGH).** The library has no country/organization filter — every user sees all documents globally (BR-KC-022). Is cross-company visibility intended, or must documents be scoped per tenant? *(Likely a significant data-model + query change — needs TL review.)*
10. **Authoring access control (HIGH).** `CAN_EDIT` is hardcoded `true`; Add/Edit/Delete is open to anyone who can reach the page (BR-KC-021). Should authoring be RBAC-gated, and to which role(s)? *(Security/permissions change — needs TL review.)*
11. **Link-document permission parity (MED).** Opening Stream/Document/Website URLs bypasses the download gate that applies to files (BR-KC-018). Should link access honor the same entitlement?
12. **URL scheme validation (MED, security).** `javascript:`/`data:` URLs are accepted, stored, and opened on click (BR-KC-019) — a stored-XSS risk. Should link URLs be restricted to `http(s)` and sanitized? *(Security change — needs TL review.)*
13. **Audit logging (MED).** No create/edit/delete/download actions are recorded (US-KC-017). Should these write to the ACTIVITY-HISTORY module for traceability?
14. **Edit-time re-filing & cleanup.** Should changing a document's type (file↔link) clean up the orphaned file, and should moving a document between Knowledge Central and iLearn (category in/out of Training) warn the author or be restricted? (BR-KC-016)
15. **Shelf dedup & search depth.** Should "Recently Added"/"Most Popular" be deduplicated against category sections (BR-KC-020), and should search query the server so it reaches beyond loaded pages (BR-KC-015)?

---

## Approval

> Client sign-off authority. Large weight class — two approvals required.

```
Approved by:
Role:
Date:

Approved by:
Role:
Date:
```
