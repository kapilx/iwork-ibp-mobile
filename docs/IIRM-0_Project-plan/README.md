# IIRM SOW Tracker — Project README

**Project** : IIRM Insurance Platform (iWork / IBP / Framework)  
**Client**  : Suryamohan Surampudi (IIRM)  
**Owner**   : Nithin / Divami  

---

## What this project does

Takes the SOW tracking Excel file that the team maintains
(`iWork,IBP & Framework_SOW Items` sheet) and generates a
client-facing Excel with an executive summary, per-week plan sheets, and a
milestone summary. The summary counts update live; the week sheets are
static snapshots (re-run to refresh).

---

## Folder structure

```
iirm-sow-tracker/
│
├── build_iirm_summary.py          ← main script — version-control this
├── README.md                      ← this file
│
├── source_data/                   ← drop updated SOW files here
│   └── IIRM_SOW_21-May-2026.xlsx
│
├── outputs/                       ← generated files (can be gitignored)
│   └── IIRM_SOW_Executive_Summary.xlsx
│
└── archive/                       ← older Excel versions for reference
    ├── v1_Project_Tracker_Enhanced.xlsx
    ├── v2_Project_Tracker_Dynamic.xlsx
    └── v3_Project_Plan_Client_Facing.xlsx
```

---

## How to run

```bash
# Install dependencies (first time only)
pip install openpyxl pandas

# Generate the summary Excel
python build_iirm_summary.py \
    --input  "IIRM_SOW_Executive_Summary_10-July-2026.xlsx" \
    --output "IIRM_SOW_Executive_Summary_17-July-2026.xlsx" \
    --asof   "17-July-2026"        # optional; defaults to today
```

`--asof` anchors the banner ("As of …"), the week-sheet windows
(last/current/next/upcoming) and the intake rows — use it to finalize a
back-dated report (e.g. Friday's report generated on Monday).

**Weekly cadence**: each Friday file is FROZEN once generated with its
`--asof` date — stop editing its source sheet. Continue the week's edits in
the next dated file (generated from the frozen one), and finalize it next
Friday with `--asof`.

Re-run whenever a new version of the SOW file is received from the
client or updated internally.

**The input may be a previously-generated file.** On every run the script
strips all sheets except the source (`iWork,IBP & Framework_SOW Items`) and
rebuilds the rest, so you can keep one master file and re-run on it — no need
for a clean source-only copy.

---

## Output sheets

| Sheet | Purpose |
|---|---|
| `iWork,IBP & Framework_SOW Items` | Source — kept exactly as given, untouched. The client-maintained **`Requested Date`** column drives the Weekly Intake block; fill it for every new row. (The older `Date Added` col was retired 13-Jul-2026.) |
| `① Executive Summary` | Completion % → **SOW Scope comparison** (original vs current, if `SOW - Actual Items` is present) → **Weekly Intake** (one row per week from 01-Jun-2026 by `Requested Date`, plus a Before roll-up, a No-date row and a TOTAL) → status breakdown → progress by module → **milestone × module pending grid** → **milestone × status matrix**. All live formulas except the SOW Scope block (static, see below). |
| `SOW - Actual Items` *(if provided)* | Original contracted-scope reference — preserved as-is across re-runs. Annotated with a **`Match Status`** column: ✓ found automatically / 🔗 mapped by hand (a note in any column to its right) / ⚠ genuine open gap. |
| 📅 *Week sheets* (exactly 4: last / 📍 current / next / Upcoming) | Delivered + pending items by ETA-week. Inside each sheet: **category sections** — iWork (Backlog & CRs, incl. IBP/iWork shared), IBP (Backlog & CRs), Framework (DPDP, NFR, Framework) — sorted by **ETA then Requested Date**. Current week gets an **Overdue** section on top when pending ETAs have passed. `Upcoming` collects everything beyond next week. **Static snapshot.** |
| `Unplanned (no ETA)` | Pending items with **no ETA yet**, in the same category sections. Assign an ETA in the source to move an item into its week. **Static snapshot.** |
| `VRK Feedbacks` | All `VRK - PROD Feedback:` rows (every status), **broken up by week** (all weeks, plus a No-ETA section); within a week sorted by status then ETA. Excluded from the other views; still counted in the summaries. **Static snapshot.** |
| `Helper` *(hidden)* | Row-by-row formula engine; derives Category + Bucket |
| `Config` *(hidden)* | VLOOKUP table: Status → Category / Bucket |

---

## SOW Scope comparison (original vs current)

If a `SOW - Actual Items` sheet is present in the input (the original contracted
scope — Feature/Functionality/Module/Milestone in cols A-D), the script compares
it against the live tracker by **Module + Feature** identity (case/whitespace
insensitive) and shows the result as a block on `① Executive Summary`, right
after Overall Completion: original item count, current item count, how many
matched, how much growth is DPDP/NFR/CR (structurally new) vs organic, and the
net change.

This is a **static snapshot** (Python-computed, not a live formula — cross-sheet
fuzzy name matching isn't practical in Excel) that recomputes on every re-run.

**The `SOW - Actual Items` sheet itself is preserved untouched across re-runs**
(like the source sheet) and gets a `Match Status` column:
- **✓ Found in tracker** — exact match, automatic.
- **🔗 Mapped (see note)** — no automatic match, but someone left a note in any
  column to the right (e.g. `Map to line N in ...`) — already investigated and
  resolved by hand, so it's not flagged as an open gap.
- **⚠ NOT in tracker** — no match and no note. A genuine open item to review.

To resolve a gap: either rename the item in the tracker to match the original
SOW wording (auto-resolves to ✓), or add a note in any column right of
`Match Status` explaining where it actually lives (resolves to 🔗).

---

## Plan sheets — 4 weekly sheets with category sections

Exactly four sheets, built by `build_weekly_sheets()`: **last week (📅)**,
**current week (📍)**, **next week (📅)** and **📅 Upcoming** (every ETA beyond
next week). Delivered + pending items are placed by their ETA-week.

Inside every sheet the items sit in three client **category sections** (see
`CATEGORY_GROUPS`): `iWork (Backlog & CRs)` — incl. IBP/iWork shared items,
`IBP (Backlog & CRs)`, and `Framework (DPDP, NFR, Framework)`; each section is
sorted by **ETA then Requested Date** (blanks last), and its band shows
`N items · X delivered · Y pending`.

- **Overdue**: pending items whose ETA-week has already passed appear in a red
  `⚠ OVERDUE` section at the top of the current-week sheet.
- **`VRK - PROD Feedback:` rows are excluded** — they live in the `VRK Feedbacks`
  sheet instead.
- **Pending items with no ETA go to the dedicated `Unplanned (no ETA)` sheet**
  (same category sections). Assign an ETA to move an item into its week.
  Delivered items with no ETA are done and not shown.
- These sheets are **static snapshots** (Python-built, not formula-linked).
  Edit STATUS/ETA/Requested Date in the source sheet, then re-run the script to
  refresh them. The ① Executive Summary still updates live.

---

## The most important thing — keeping it dynamic

**All summary values are Excel formulas, never Python numbers.**

When the user opens the output Excel and edits STATUS in the source
sheet, every count and percentage in the three summary sheets
recalculates automatically — no need to re-run the script.

```
Source sheet  →  Helper (VLOOKUP)  →  Summary sheets (COUNTIFS)
```

**If you ask an AI (Claude, Copilot, etc.) to modify this script,
paste the design contract at the top of `build_iirm_summary.py`
into your prompt.** It contains explicit rules that prevent the
common mistake of writing hardcoded numbers into cells instead of
formula strings.

---

## How to add a new STATUS value

1. Open `build_iirm_summary.py`
2. Find the `STATUS_MAP` dictionary (near the top)
3. Add your new entry:
   ```python
   "New Status Label": ("Category Name", "Pending"),
   #                    ↑ display name    ↑ Delivered / Pending / N/A
   ```
4. Re-run the script — Config and Helper update automatically

Do **not** touch the Excel file directly for this; it will be
overwritten the next time the script runs.

---

## Version history of generated Excel files

| File | Description |
|---|---|
| `v1_Project_Tracker_Enhanced.xlsx` | First attempt — counts were hardcoded (Python numbers, not formulas). Did not update when status changed. |
| `v2_Project_Tracker_Dynamic.xlsx` | Switched to live COUNTIFS formulas. Internal tracker format. Separate editable data sheet. |
| `v3_Project_Plan_Client_Facing.xlsx` | Client-facing layout with pending roadmap. Built on old SOW format. |
| `IIRM_SOW_Executive_Summary.xlsx` | Source sheet kept as-is; all summaries live via Helper + COUNTIFS. Filter bug fixed (AutoFilter, not row hiding). |
| `IIRM_SOW_Executive_Summary_<date>.xlsx` | **Current (per-week).** Per-module sheets replaced by one sheet per ETA-week (all modules, sorted by ETA, pending only). No-ETA items parked in the current week. Input may be a previously-generated file. |

---

## Troubleshooting

**Summary counts didn't update after I changed a status**  
→ Make sure you changed STATUS in the `iWork,IBP & Framework_SOW Items`
sheet, not in a week sheet. The week sheets are static snapshots — typing
in them changes nothing and is overwritten on the next re-run.

**A status value shows as "Unknown" in the summary**  
→ The status text in your SOW sheet doesn't match any entry in
`STATUS_MAP`. Add it (see "How to add a new STATUS value" above)
and re-run the script.

**New rows I added to the SOW sheet aren't appearing**  
→ Re-run the script with the updated file. The Helper sheet range
extends to the last populated row automatically.

**The Delivery column filter only shows one value**  
→ This was a bug in v1.0 (rows were manually hidden). v1.1+ uses
AutoFilter properly. Re-run the script to get the fixed version.
