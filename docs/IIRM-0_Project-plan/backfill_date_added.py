"""Backfill 'Date Added' by diffing dated SOW snapshots (first-seen dating).

Phase 1 (default): dry-run — print distribution, suspected edits, verification.
Phase 2 (--write):  write the Date Added column into the current master
                    (IIRM_SOW_Executive_Summary_03-July-2026.xlsx source sheet).
"""
import re, sys, warnings
import pandas as pd
import openpyxl

warnings.simplefilter("ignore")

ROOT    = "/Users/nithin/Documents/Projects/IIRM/new-insurance-wellness-hub/docs/IIRM-0_Project-plan"
SCRATCH = ("/private/tmp/claude-502/-Users-nithin-Documents-Projects-IIRM-new-insurance-wellness-hub/"
           "f9000778-67fd-41c3-9716-219a51c6186a/scratchpad")
SHEET   = "iWork,IBP & Framework_SOW Items"
MASTER  = f"{ROOT}/IIRM_SOW_Executive_Summary_03-July-2026.xlsx"

# (path, assigned date)  — chronological
SNAPSHOTS = [
    (f"{ROOT}/IIRM_SOW_Executive_Summary_19-June-2026.xlsx", "2026-06-19"),
    (f"{ROOT}/IIRM_SOW_Executive_Summary_22-June-2026.xlsx", "2026-06-22"),
    (f"{ROOT}/IIRM_SOW_23-June-2026.xlsx",                   "2026-06-23"),
    (f"{SCRATCH}/snap_25jun_committed.xlsx",                 "2026-06-25"),
    (f"{ROOT}/IIRM_SOW_Executive_Summary_25-June-2026.xlsx", "2026-07-03"),
    (MASTER,                                                 "2026-07-06"),
]

def norm(v):
    if v is None or (isinstance(v, float) and pd.isna(v)):
        return ""
    return re.sub(r"\s+", " ", str(v)).strip().casefold()

def keyed_rows(path):
    """Return list of (key, occurrence_index) in sheet row order."""
    df = pd.read_excel(path, sheet_name=SHEET)
    seen, out = {}, []
    for _, row in df.iterrows():
        k = norm(row.get("Module")) + "||" + norm(row.get("Feature")) + "||" + norm(row.get("Functionality"))
        seen[k] = seen.get(k, 0) + 1
        out.append((k, seen[k]))
    return df, out

# ── build first-seen map ──────────────────────────────────────────────────────
first_seen = {}
snap_keys  = {}
for path, date in SNAPSHOTS:
    df, rows = keyed_rows(path)
    snap_keys[date] = set(rows)
    fresh = 0
    for kr in rows:
        if kr not in first_seen:
            first_seen[kr] = date
            fresh += 1
    print(f"{date}: {len(rows):3d} rows, {fresh:3d} first seen here")

# ── date the current master rows ──────────────────────────────────────────────
mdf, mrows = keyed_rows(MASTER)
dates = [first_seen[kr] for kr in mrows]
mdf["_date_added"] = dates

print("\n=== Date Added distribution (current master) ===")
print(pd.Series(dates).value_counts().sort_index().to_string())

# ── suspected edits: dated after 19-Jun but same Module+Feature existed earlier ─
print("\n=== rows dated AFTER baseline — true adds vs suspected edits ===")
mf_first = {}
for path, date in SNAPSHOTS:
    df, _ = keyed_rows(path)
    for _, row in df.iterrows():
        mf = norm(row.get("Module")) + "||" + norm(row.get("Feature"))
        mf_first.setdefault(mf, date)

sus = 0
for (kr, d, (_, row)) in zip(mrows, dates, mdf.iterrows()):
    if d == "2026-06-19":
        continue
    mf = norm(row.get("Module")) + "||" + norm(row.get("Feature"))
    if row.get("Feature") is not None and not (isinstance(row.get("Feature"), float) and pd.isna(row.get("Feature"))):
        if mf_first.get(mf, d) < d:
            sus += 1
            if sus <= 12:
                print(f"  [edit?] {d}  {str(row.get('Module'))[:10]:10s} "
                      f"{str(row.get('Feature'))[:38]:38s} {str(row.get('Functionality'))[:40]}")
print(f"suspected edits (Module+Feature seen earlier than the row's date): {sus}")

# ── self-verification: every non-baseline row must be ABSENT from the prior snapshot ─
print("\n=== verification ===")
order = [d for _, d in SNAPSHOTS]
bad = 0
for kr, d in zip(mrows, dates):
    i = order.index(d)
    if i > 0 and kr in snap_keys[order[i-1]]:
        bad += 1
prev_ok = "PASS" if bad == 0 else f"FAIL ({bad} rows present in prior snapshot)"
print(f"first-seen correctness (absent from prior snapshot): {prev_ok}")
present = sum(1 for kr, d in zip(mrows, dates) if kr in snap_keys[d])
print(f"presence in assigned snapshot: {present}/{len(mrows)} "
      f"{'PASS' if present == len(mrows) else 'FAIL'}")

# ── phase 2: write into master ────────────────────────────────────────────────
if "--write" in sys.argv:
    wb = openpyxl.load_workbook(MASTER)
    ws = wb[SHEET]
    hdr = [c.value for c in ws[1]]
    if any(str(h).strip().lower() == "date added" for h in hdr if h):
        sys.exit("Date Added column already exists — aborting to avoid overwrite.")
    col = ws.max_column + 1
    ws.cell(1, col, "Date Added")
    ws.cell(1, col).font = openpyxl.styles.Font(bold=True)
    for i, d in enumerate(dates, start=2):
        c = ws.cell(i, col, pd.Timestamp(d).to_pydatetime())
        c.number_format = "dd-mmm-yyyy"
    wb.save(MASTER)
    print(f"\nWROTE 'Date Added' at column {openpyxl.utils.get_column_letter(col)} "
          f"({len(dates)} rows) → {MASTER}")
else:
    print("\n(dry-run only — rerun with --write to add the column)")