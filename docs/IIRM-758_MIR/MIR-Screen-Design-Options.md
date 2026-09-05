# MIR Screen — Redesign Options

Based on the existing iWork MIR entry screen (33-page scroll, raw data tables, no visual summary).

---

## Problems with the current screen

| Problem | Impact |
|---|---|
| 33-page single scroll | User loses context, no sense of progress |
| Raw policy IDs (e.g. `GMC-0723002819P105344870`) as row labels | Unreadable, not client-friendly |
| Risk Matrix: 100+ rows, most empty | Cognitive overload, forces scrolling past noise |
| Claim Aging table appears twice | Duplicate data, confusion |
| No KPI summary at top | CRM has no quick read on client health |
| Submit button buried at page 33 | Easy to miss, accidental navigation |
| Manual textarea for everything | No structure, no validation, no defaults |

---

## Option A — Sectioned Dashboard with Inline Editing

**Concept:** One page, but broken into 6 named sections with anchor navigation. Auto-populated data shown as read-only KPI cards. Manual fields appear inline below each section. Think of it like a well-organized report with editable callouts.

```
┌──────────────────────────────────────────────────────────────────────┐
│  Monthly Information Report                           [Draft ▼]      │
│  TeamLease Services Ltd  ·  May 2026  ·  Due: 5 Jun 2026 (3d left) │
├────────────┬──────────┬───────────┬────────────┬────────┬───────────┤
│ ① Summary  │ ② Claims │ ③ Renewal │ ④ Portfolio│ ⑤ Risk │ ⑥ Plan   │  ← sticky
└────────────┴──────────┴───────────┴────────────┴────────┴───────────┘

① EXECUTIVE SUMMARY
┌─────────────────────────────────────────────────────────────────────┐
│  ⚠ Critical Attention Items  (auto-pulled from expiring/high-risk)  │
│  ┌───────────────┬────────────┬────────────┬───────────────────────┐ │
│  │ Policy        │ Policies   │ Premium    │ CRM Remarks  [+flag]  │ │
│  │ GMC           │ 1          │ ₹1.43 Cr   │ [_________________]  │ │
│  │ WC            │ 1          │ ₹90.5 L    │ [_________________]  │ │
│  └───────────────┴────────────┴────────────┴───────────────────────┘ │
│  AI Insight: "3 policies approaching renewal. Loss ratio on GMC      │
│  is 182% — above industry benchmark."         [Copy to Summary ↗]   │
└─────────────────────────────────────────────────────────────────────┘

② CLAIMS
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Open Claims │ │ Received MTD │ │   Paid MTD   │ │  Aging >45d  │
│     127      │ │     108      │ │   ₹2.4 Cr    │ │   6 claims   │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘

  Claim Status by Policy (read-only, snapshot at creation)
  ┌────────────┬──────┬──────────┬──────┬─────────┬──────────────────┐
  │ Policy     │ Open │ Received │ Paid │ Closing │ CRM Remarks      │
  │ GMC (×8)  ▼│  44  │   108    │  42  │   109   │ [_____________]  │
  │ GPA (×6)  ▼│   6  │     0    │   0  │     6   │ [_____________]  │
  └────────────┴──────┴──────────┴──────┴─────────┴──────────────────┘
  [Expand all policies]

  Pending Claims Requiring Action
  ┌──────────┬──────────────────────┬─────────┬───────────┬─────────┐
  │ Ref#     │ Policy               │ Amount  │ Date      │ Reason  │
  │ 541497   │ GMC-0723.../00727    │ ₹3,950  │ 11Sep2013 │ [____]  │
  └──────────┴──────────────────────┴─────────┴───────────┴─────────┘

④ RISK MATRIX  (only policies with active coverage shown — 18 of 100+)
  ┌──────────────────┬──────────────┬──────────┬──────────┬──────────┐
  │ Risk Category    │ Policy Type  │ Exposure │ Cover    │ Adequate │
  │ People Risk      │ GMC          │ ✓        │ ✓        │ ✓        │
  │ People Risk      │ GPA          │ ✓        │ ✓        │ —        │
  │ Property Risk    │ Fire         │ ✓        │ ✓        │ ✓        │
  └──────────────────┴──────────────┴──────────┴──────────┴──────────┘
  AI Risk Gap: "No Cyber Insurance detected for IT industry. Consider
  adding EPLI coverage."

                                              [Save Draft]  [Submit →]
```

**Key design decisions:**
- Policies grouped by type (GMC ×8 = one expandable row, not 8 rows)
- Risk Matrix pre-filtered to active policies only — zero-value rows hidden
- CRM remarks inline next to each data row, not in a separate section
- AI Insight panel per section, not a separate tab
- Submission CTA visible at bottom of every section via sticky footer
- "Internal Only" flag toggle on every remarks field (🔒 icon)

---

## Option B — Guided Step Wizard

**Concept:** Break the MIR into 5 focused steps. Each step is one concern only. CRM moves through it like filling out a structured form. Progress is saved after each step. Final step is a PDF preview before submission.

This works best if CRM fills MIR fresh each month — forces completeness.

```
┌────────────────────────────────────────────────────────────┐
│  MIR · TeamLease · May 2026          Step 2 of 5          │
│  ①Review ──●②Claims ──○③Portfolio ──○④Risk ──○⑤Review    │
└────────────────────────────────────────────────────────────┘

STEP 2 — CLAIMS REVIEW

  System has pre-filled claim data as of today. Review and add remarks.

  ┌─────────────────────────────────────────────────────────────────┐
  │ CLAIM STATUS SNAPSHOT                              (read-only)  │
  │ ┌──────────┬─────────┬──────────────┬──────────┬─────────────┐ │
  │ │ Policy   │ Opening │ + Received   │ - Paid   │ Closing     │ │
  │ │ GMC      │   44    │    + 108     │   - 42   │   109       │ │
  │ │ GPA      │    6    │    +   0     │    - 0   │     6       │ │
  │ └──────────┴─────────┴──────────────┴──────────┴─────────────┘ │
  └─────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────┐
  │ CLAIM AGING  — Reimbursement Only                               │
  │                                                                 │
  │  Outstanding: 24 claims                                         │
  │  ████████████░░░░░░░░░░░░  >45 days: 6   (25%)  ← flagged red  │
  │  ████████░░░░░░░░░░░░░░░░  >30 days: 3   (12%)                 │
  │  ████░░░░░░░░░░░░░░░░░░░░  >15 days: 2    (8%)                 │
  │  ██░░░░░░░░░░░░░░░░░░░░░░  <15 days: 13  (54%)                 │
  └─────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────┐
  │ MANUAL INPUTS — What do you want to report to the client?       │
  │                                                                 │
  │  Claim Documentation Status                                     │
  │  [41 GPA Claims pending documentation ________________]  🔒     │
  │                                                                 │
  │  Policy Documentation Issues                                    │
  │  [No endorsements pending _____________________________]  🔒     │
  │                                                                 │
  │  Uncovered Risks (Optional)                                     │
  │  [________________________________________________]  🔒         │
  └─────────────────────────────────────────────────────────────────┘

             [← Back: Executive Summary]   [Save & Continue →]


STEP 5 — REVIEW & SUBMIT

  ┌──────────────────────────────────────────────────────────────┐
  │  PDF PREVIEW                                [Download PDF]   │
  │  ┌────────────────────────────────────────────────────────┐  │
  │  │  MONTHLY INFORMATION REPORT — May 2026                 │  │
  │  │  TeamLease Services Ltd                                │  │
  │  │                                                        │  │
  │  │  ▸ Executive Summary  ▸ Claims  ▸ Portfolio            │  │
  │  │  ▸ Risk Analysis      ▸ Next Month Plan                │  │
  │  └────────────────────────────────────────────────────────┘  │
  │                                                              │
  │  Completeness Check                                         │
  │  ✓ Executive Summary filled        ✓ Claims reviewed        │
  │  ✓ Portfolio data present          ✗ Risk Matrix incomplete  │
  │  ✓ Current month plan filled                                │
  │                                                              │
  │  Submitting to: Ramakrishna V (Lead CRM) for approval       │
  │                                                              │
  │        [← Edit Section]            [Submit for Approval →]  │
  └──────────────────────────────────────────────────────────────┘
```

**Key design decisions:**
- Progress bar makes long MIR feel manageable — CRM knows where they are
- Claim aging shown as a visual progress bar, not a raw table
- Manual fields grouped separately from auto-data so CRM never confuses them
- PDF preview before submission = client sees exactly what HR will see
- Completeness check blocks submission if key sections are empty
- "Internal Only" 🔒 toggle on every manual field

---

## Comparison

| Aspect | Option A (Dashboard) | Option B (Wizard) |
|---|---|---|
| First impression | Full overview at a glance | Focused, one task at a time |
| Best for | Experienced CRM reviewing/editing | First-time or infrequent users |
| Navigation | Jump to any section instantly | Must go step by step (or use back) |
| Suited for | Monthly review + quick edits | Monthly creation from scratch |
| Risk of incomplete MIR | Higher (easy to skip sections) | Lower (completeness check per step) |
| PDF Preview | Separate action | Built into Step 5 |

**Recommendation:** Option A for CRM-facing entry; embed the completeness check from Option B as a pre-submit validation panel in Option A's final step.
