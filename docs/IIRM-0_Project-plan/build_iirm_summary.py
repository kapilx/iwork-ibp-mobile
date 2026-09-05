"""
╔══════════════════════════════════════════════════════════════════════════════╗
║           DESIGN CONTRACT — READ THIS BEFORE MODIFYING THE SCRIPT          ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  CORE REQUIREMENT                                                            ║
║  ─────────────────                                                           ║
║  The Excel file this script generates MUST be fully dynamic.                ║
║  When a user updates the STATUS column in the source sheet                  ║
║  ("SOW, Feedbacks-Bug & CR_Items"), every count, percentage, and             ║
║  label in ALL summary sheets must update automatically — with NO            ║
║  need to re-run this script.                                                 ║
║                                                                              ║
║  HOW IT WORKS                                                                ║
║  ─────────────                                                               ║
║  Python is ONLY used to BUILD the file structure (sheets, layout,           ║
║  styles). It NEVER calculates a count or percentage and writes it           ║
║  as a number into a cell.                                                    ║
║                                                                              ║
║  All live values come from Excel formulas written as strings:               ║
║    • COUNTIF / COUNTIFS  → all counts and totals                            ║
║    • VLOOKUP             → Status → Category / Bucket mapping               ║
║    • IFERROR             → graceful fallback for blank/unknown rows         ║
║                                                                              ║
║  DATA FLOW (never break this chain)                                         ║
║  ──────────────────────────────────                                          ║
║                                                                              ║
║    "SOW, Feedbacks-Bug & CR_Items"   ← user edits STATUS here ONLY           ║
║                    │                                                         ║
║                    ▼                                                         ║
║              Helper sheet              ← hidden; VLOOKUP derives           ║
║          (row-by-row formulas)           Category + Bucket per row          ║
║                    │                                                         ║
║         ┌──────────┼──────────┐                                             ║
║         ▼          ▼          ▼                                             ║
║   ① Exec       ③ Milestone  📅 Week sheets                                  ║
║   Summary      Summary      (STATIC snapshots —                             ║
║  (COUNTIFS)   (COUNTIFS)    regenerate by re-running script)                ║
║                                                                              ║
║  ⚠️  WEEKLY PLAN SHEETS ARE STATIC (not live)                              ║
║  ─────────────────────────────────────────────                               ║
║  The 📅 per-week plan sheets are written by Python at build time.           ║
║  They are NOT connected to the source sheet via formulas.                   ║
║  → Do NOT edit STATUS in the week sheets — it won't flow anywhere.         ║
║  → To update: edit STATUS in the source sheet, then re-run this script.    ║
║  → Executive Summary recalculates live; week sheets need a script rerun.   ║
║                                                                              ║
║  RULES — AI AND HUMANS MUST FOLLOW THESE                                    ║
║  ──────────────────────────────────────                                      ║
║  1. NEVER write a Python integer/float directly into a summary cell.        ║
║     Wrong : ws.cell(r, 3, 42)          ← hardcoded, breaks live update     ║
║     Right : ws.cell(r, 3, '=COUNTIF(…)')  ← formula string, stays live    ║
║                                                                              ║
║  2. NEVER modify or add columns to the source sheet                         ║
║     ("SOW, Feedbacks-Bug & CR_Items"). It must stay exactly as               ║
║     the client/user gave it. All derived columns go to Helper only.         ║
║     The script READS the client-maintained 'Requested Date'                ║
║     column (weekly intake) but never writes to the source sheet.           ║
║                                                                              ║
║  3. NEVER hide rows manually to filter the Pending Roadmap.                 ║
║     Use AutoFilter with a FilterColumn condition instead, so the            ║
║     filter dropdown shows all values and the user can toggle them.          ║
║     Wrong : ws.row_dimensions[r].hidden = True                              ║
║     Right : fc = FilterColumn(colId=5); fc.filters = Filters(…)            ║
║                                                                              ║
║  4. Adding a new STATUS value?                                               ║
║     → Add it to STATUS_MAP dict (top of script) only.                      ║
║     The Config sheet is built from STATUS_MAP automatically.                ║
║     Do NOT hardcode it anywhere else.                                        ║
║                                                                              ║
║  5. Source sheet has more rows than before?                                  ║
║     → Just re-run the script with the new file. The Helper sheet           ║
║     range auto-extends to last_row. No manual changes needed.               ║
║  6. Items with NO ETA?                                                     ║
║     → Parked in the CURRENT week sheet (planning rule), under an           ║
║     "Unscheduled" sub-header. Set in build_weekly_sheets() only.           ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  IIRM SOW Executive Summary Builder                                         ║
║  Project : IIRM — Insurance Platform (iWork / IBP / Framework)             ║
║  Client  : Suryamohan Surampudi (IIRM)                                     ║
║  Owner   : Nithin / Divami                                                  ║
║                                                                              ║
║  PURPOSE                                                                     ║
║  Appends summary sheets to the SOW Excel file:                              ║
║    ① Executive Summary  — completion %, pending count, module table        ║
║    📋 Per-module sheets — pending items grouped by ETA week (one per module)║
║    ③ Milestone Summary  — pending counts in milestone × module grid        ║
║                                                                              ║
║  USAGE                                                                       ║
║    python build_iirm_summary.py                                             ║
║        --input  "SOW_file.xlsx"                                             ║
║        --output "IIRM_SOW_Executive_Summary.xlsx"                           ║
║                                                                              ║
║  VERSION HISTORY                                                             ║
║    v1.0  2025-05-21  Initial build                                          ║
║    v1.1  2025-05-22  Fixed Pending Roadmap filter — use AutoFilter          ║
║                      instead of manual row hiding                            ║
║    v1.2  2025-05-22  Added design contract block to prevent AI/human        ║
║                      from accidentally breaking the dynamic formula link     ║
║    v1.3  2025-06-22  Replaced single Pending Roadmap with per-module        ║
║                      weekly plan sheets (📋 iWork, 📋 IBP, etc.)           ║
║                      Items grouped by ETA week; unscheduled at bottom.      ║
║                      Module sheets are STATIC snapshots — re-run script     ║
║                      after updating source sheet to refresh them.           ║
║    v1.4  2026-06-23  Replaced per-module sheets with per-WEEK sheets       ║
║                      (all modules combined, sorted by ETA, pending only).  ║
║                      No-ETA items parked in the CURRENT week (rule).       ║
║                      main() now strips prior-run sheets first, so the      ║
║                      input may be a previously-generated file.             ║
║    v1.5  2026-06-25  Week sheets now show DELIVERED + PENDING (completed   ║
║                      view); banner shows per-week delivered/pending split. ║
║                      New 'VRK Feedbacks' sheet collects all                ║
║                      'VRK - PROD Feedback:' rows (sorted by status, ETA)   ║
║                      and excludes them from the week sheets.               ║
║    v1.6  2026-06-25  Week sheets limited to current week, current - 1, and ║
║                      future weeks (older history dropped). The single past ║
║                      week is labelled LAST WEEK rather than OVERDUE.       ║
║    v1.7  2026-06-25  Added MODULE view (📋 one sheet per module, broken     ║
║                      up by week inside) alongside the WEEK view. Shared    ║
║                      selection refactored into _prepare_plan_items().      ║
║    v1.8  2026-06-25  Module view: Framework, DPDP and NFR are clubbed      ║
║                      into one sheet (see MODULE_GROUPS).                   ║
║    v1.9  2026-06-25  Module groups: iWork(+CR), IBP(+CR,IBP/iWork),        ║
║                      Framework/DPDP/NFR. VRK sheet now broken up by        ║
║                      week too (all weeks, with a No-ETA section).          ║
║    v1.10 2026-06-25  Fixed module-view week sub-header count to show       ║
║                      dated items only (was incl. parked unscheduled).      ║
║    v1.11 2026-07-03  Unplanned (no-ETA pending) items moved out of the     ║
║                      week/module views into a dedicated 'Unplanned         ║
║                      (no ETA)' sheet, grouped by module.                   ║
║    v1.12 2026-07-03  Added status 'Not a bug' -> Delivered.                ║
║    v1.13 2026-07-03  Exec Summary now embeds the milestone x module        ║
║                      pending grid, and adds a WEEKLY INTAKE block (items   ║
║                      added last/this week by a 'Date Added' column).       ║
║    v1.14 2026-07-06  Added a milestone x status matrix (live COUNTIFS on   ║
║                      Phase x Category) to the Exec Summary and ③ sheet.    ║
║    v2.0  2026-07-13  Intake by 'Requested Date' (weekly from 01-Jun-26     ║
║                      + Before rollup + No-date row), placed right after    ║
║                      OVERALL COMPLETION. Exactly 4 week sheets (last/      ║
║                      current/next/upcoming) with client category           ║
║                      sections, sorted by Requested Date then ETA;          ║
║                      overdue section in current week. Module sheets &      ║
║                      ③ Milestone Summary removed. 'Date Added' retired.    ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

import argparse
import re
import shutil
from datetime import timedelta
from pathlib import Path

import openpyxl
import pandas as pd
from openpyxl.formatting.rule import DataBarRule, FormulaRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.filters import FilterColumn, Filters

# ── Default paths (edit these if running directly without CLI args) ───────────
INPUT_FILE  = "IIRM_-_SOW_-_Yet_to_Deliver_Items_21-May-2026.xlsx"
OUTPUT_FILE = "IIRM_SOW_Executive_Summary.xlsx"

# ── Source sheet name (keep exactly as-is) ────────────────────────────────────
SOURCE_SHEET = "SOW, Feedbacks-Bug & CR_Items"

# Report anchor date ("as of") — set from --asof in main(); None = the run date.
# Anchors the banner, the week-sheet windows and the intake rows, so a report
# can be generated retrospectively (e.g. Friday's report finalized on Monday).
ASOF = None

def report_today():
    return (ASOF if ASOF is not None else pd.Timestamp.now()).normalize()

# Source column positions (1-based) — update if the SOW sheet layout changes
COL_AREA        = 1   # A
COL_FEATURE     = 2   # B
COL_FUNC        = 3   # C
COL_MODULE      = 4   # D
COL_PHASE       = 5   # E
COL_STATUS      = 6   # F
COL_REMARKS     = 7   # G
COL_ETA         = 10  # J
COL_RESOURCE    = 11  # K
HEADER_ROW      = 1
DATA_START_ROW  = 2

# ── Status → (Category, Delivery Bucket) mapping ─────────────────────────────
# Category  : human-readable label shown in summaries
# Bucket    : "Delivered" | "Pending" | "N/A"
#   Delivered = counts toward completion numerator
#   Pending   = counts toward completion denominator (still to do)
#   N/A       = excluded from % calculation (duplicates etc.)
STATUS_MAP = {
    "Delivered":           ("Delivered",         "Delivered"),
    "Dev - Done":          ("Dev Complete",       "Delivered"),
    "DEV - Done":          ("Dev Complete",       "Delivered"),
    "Dev - WIP":           ("In Development",     "Pending"),
    "DEV - WIP":           ("In Development",     "Pending"),
    "QA - WIP":            ("In QA",              "Pending"),
    "Pre-PROD":            ("Pre-PROD / UAT",     "Pending"),
    "UAT - WIP":           ("Pre-PROD / UAT",     "Pending"),
    "Yet to start":        ("Not Started",        "Pending"),
    "Delivered - Deficit": ("Partial Delivery",   "Pending"),
    "Duplicate":           ("N/A",                "N/A"),
    "Not a bug":           ("Delivered",          "Delivered"),
    "Not in scope":        ("Delivered",          "Delivered"),
}

# ── Module display names & ordering ──────────────────────────────────────────
MOD_DISP = {
    "iWork":     "iWork (Backlog)",
    "iWork - CR":"iWork (Change Requests)",
    "IBP":       "IBP (Backlog)",
    "IBP - CR":  "IBP (Change Requests)",
    "IBP/iWork": "IBP / iWork (Shared)",
    "IBP/iWork - CR": "IBP / iWork (Shared CRs)",
    "Framework": "Framework",
    "DPDP":      "DPDP",
    "NFR":       "NFR",
}
MOD_ORDER   = list(MOD_DISP.keys())
MILESTONES  = [f"Milestone {i}" for i in range(1, 8)]

# Week header accent colours (cycling if >4 weeks)
WEEK_ACCENTS = ["1F4E79", "2E5F8A", "285E7A", "1A3A5C"]

# ── Status category styles (bg_hex, text_hex) ─────────────────────────────────
CAT_STYLES = {
    "Delivered":       ("E2EFDA", "375623"),
    "Dev Complete":    ("D4F0F0", "006B6B"),
    "In Development":  ("DEEAF1", "1F4E79"),
    "In QA":           ("BDD7EE", "2E5F8A"),
    "Pre-PROD / UAT":  ("FCE4D6", "843C0C"),
    "Not Started":     ("FFC7CE", "9C0006"),
    "Partial Delivery":("FFEB9C", "7F6000"),
    "N/A":             ("EDEDED", "595959"),
    "Unknown":         ("EDEDED", "595959"),
}

# Status breakdown strip — 8 categories shown as KPI boxes
KCATS = ["Delivered","Dev Complete","In Development","In QA",
         "Pre-PROD / UAT","Not Started","Partial Delivery","N/A"]
KBGS  = ["E2EFDA","D4F0F0","DEEAF1","BDD7EE","FCE4D6","FFC7CE","FFEB9C","EDEDED"]
KTXS  = ["375623","006B6B","1F4E79","2E5F8A","843C0C","9C0006","7F6000","595959"]

# ── Palette ───────────────────────────────────────────────────────────────────
C_NAVY   = "2E4057"
C_DGREY  = "3D3D3D"
C_WHITE  = "FFFFFF"
C_LGREY  = "F2F2F2"
C_ACCENT = "4472C4"
C_GOLD   = "C9A227"


# ═════════════════════════════════════════════════════════════════════════════
# Style helpers
# ═════════════════════════════════════════════════════════════════════════════

def fill(hex_color):
    return PatternFill("solid", fgColor=hex_color)

def font(bold=False, size=10, color="000000"):
    return Font(name="Arial", bold=bold, size=size, color=color)

def align(h="left", v="center", wrap=False):
    return Alignment(horizontal=h, vertical=v, wrap_text=wrap)

def thin_border(color="BFBFBF"):
    s = Side(style="thin", color=color)
    return Border(top=s, bottom=s, left=s, right=s)


# ═════════════════════════════════════════════════════════════════════════════
# Helper: column-letter formula reference
# ═════════════════════════════════════════════════════════════════════════════

def col_ref(sheet, col_letter, absolute=True):
    """Return e.g. \"'Sheet Name'!$A:$A\" """
    prefix = "$" if absolute else ""
    return f"'{sheet}'!{prefix}{col_letter}:{prefix}{col_letter}"


# ═════════════════════════════════════════════════════════════════════════════
# SECTION 1 — Config sheet (hidden)
# Provides a VLOOKUP table: Status → Category / Bucket
# ═════════════════════════════════════════════════════════════════════════════

def build_config(wb):
    wc = wb.create_sheet("Config")
    wc["A1"] = "Status_Raw"
    wc["B1"] = "Category"
    wc["C1"] = "Bucket"
    for i, (status, (cat, bucket)) in enumerate(STATUS_MAP.items(), start=2):
        wc.cell(i, 1, status)
        wc.cell(i, 2, cat)
        wc.cell(i, 3, bucket)
    wc.sheet_state = "hidden"


# ═════════════════════════════════════════════════════════════════════════════
# SECTION 2 — Helper sheet (hidden)
# Mirrors source sheet row-by-row; derives Category and Bucket via VLOOKUP.
# All summary sheets read from Helper — NOT from the source sheet directly —
# so that the summary is always in sync with whatever STATUS is in the source.
# ═════════════════════════════════════════════════════════════════════════════

def build_helper(wb, source_sheet, last_row, req_date_col=None):
    wh = wb.create_sheet("Helper")
    wh["A1"] = "Module"    # col A → source col D
    wh["B1"] = "Phase"     # col B → source col E
    wh["C1"] = "Status"    # col C → source col F
    wh["D1"] = "Category"  # col D → VLOOKUP(C, Config!A:B)
    wh["E1"] = "Bucket"    # col E → VLOOKUP(C, Config!A:C, 3)
    if req_date_col:
        wh["F1"] = "ReqDate"   # col F → source 'Requested Date' column (if present)

    src = f"'{source_sheet}'"
    for r in range(DATA_START_ROW, last_row + 1):
        wh.cell(r, 1, f"={src}!D{r}")   # Module
        wh.cell(r, 2, f"={src}!E{r}")   # Phase
        wh.cell(r, 3, f"=TRIM({src}!F{r})")   # Status — TRIM guards against stray
        # leading/trailing spaces in the source cell (e.g. "Dev - WIP ") that
        # would otherwise fail the exact-text VLOOKUP below and silently land
        # in Category "Unknown" / Bucket "N/A" instead of their real status.
        wh.cell(r, 4, f'=IFERROR(VLOOKUP(C{r},Config!$A:$B,2,0),"Unknown")')
        wh.cell(r, 5, f'=IFERROR(VLOOKUP(C{r},Config!$A:$C,3,0),"N/A")')
        if req_date_col:
            wh.cell(r, 6, f'=IF({src}!{req_date_col}{r}="","",{src}!{req_date_col}{r})')   # Requested Date (blank-safe)

    wh.sheet_state = "hidden"


# ═════════════════════════════════════════════════════════════════════════════
# SECTION 3 — Executive Summary sheet
# ═════════════════════════════════════════════════════════════════════════════

def _draw_milestone_grid(ws, r0, present_mods, present_ms, df_src,
                         set_widths=True, label_fn=None):
    """Draw the milestone × module PENDING grid starting at row r0.
    Returns the last row used (the grand-total row)."""
    if label_fn is None:
        label_fn = lambda m: MOD_DISP.get(m, m)
    H  = "Helper"
    HM = col_ref(H, "A"); HP = col_ref(H, "B"); HB = col_ref(H, "E")
    HR = r0

    c = ws.cell(HR, 1, "Milestone")
    c.font = font(bold=True, size=9, color=C_WHITE); c.fill = fill(C_DGREY)
    c.alignment = align("center", "center"); c.border = thin_border()
    if set_widths:
        ws.column_dimensions["A"].width = 16

    for i, mod in enumerate(present_mods, start=2):
        c = ws.cell(HR, i, label_fn(mod))
        c.font = font(bold=True, size=8, color=C_WHITE); c.fill = fill(C_DGREY)
        c.alignment = align("center", "center", wrap=True); c.border = thin_border()
        if set_widths:
            ws.column_dimensions[get_column_letter(i)].width = 14

    tot_col = len(present_mods) + 2
    c = ws.cell(HR, tot_col, "TOTAL PENDING")
    c.font = font(bold=True, size=8, color=C_WHITE); c.fill = fill(C_GOLD)
    c.alignment = align("center", "center", wrap=True); c.border = thin_border()
    if set_widths:
        ws.column_dimensions[get_column_letter(tot_col)].width = 14
    ws.row_dimensions[HR].height = 28

    r = HR + 1
    for ms in present_ms:
        cm = ws.cell(r, 1, ms)
        cm.font = font(bold=True, size=9, color=C_DGREY); cm.fill = fill(C_LGREY)
        cm.alignment = align("left", "center"); cm.border = thin_border()
        for i, mod in enumerate(present_mods, start=2):
            f = f'=COUNTIFS({HP},"{ms}",{HM},"{mod}",{HB},"Pending")'
            c = ws.cell(r, i, f); c.font = font(size=9, color=C_DGREY)
            has_pending = len(df_src[
                (df_src["Phase"] == ms) & (df_src["Module"] == mod) &
                (df_src["Status"].map(
                    lambda s: STATUS_MAP.get(str(s).strip(), ("", "N/A"))[1]) == "Pending")
            ]) > 0
            c.fill = fill("FFC7CE" if has_pending else C_WHITE)
            c.alignment = align("center", "center"); c.border = thin_border()
        last_mod_col = get_column_letter(len(present_mods) + 1)
        ct = ws.cell(r, tot_col, f"=SUM(B{r}:{last_mod_col}{r})")
        ct.font = font(bold=True, size=9, color="7F6000"); ct.fill = fill("FFEB9C")
        ct.alignment = align("center", "center"); ct.border = thin_border()
        ws.row_dimensions[r].height = 18
        r += 1

    cm = ws.cell(r, 1, "TOTAL")
    cm.font = font(bold=True, size=9, color=C_WHITE); cm.fill = fill(C_NAVY)
    cm.alignment = align("left", "center"); cm.border = thin_border()
    for i in range(2, tot_col + 1):
        L = get_column_letter(i)
        c = ws.cell(r, i, f"=SUM({L}{HR+1}:{L}{r-1})")
        c.font = font(bold=True, size=9, color=C_WHITE); c.fill = fill(C_NAVY)
        c.alignment = align("center", "center"); c.border = thin_border()
    ws.row_dimensions[r].height = 20
    return r


# Weekly intake starts here; earlier requests are rolled into one "Before" line
INTAKE_START = "2026-06-01"   # a Monday


def _draw_weekly_intake(ws, r0, req_date_col):
    """WEEKLY INTAKE — items requested (by Requested Date), live formulas.

    One row per week from INTAKE_START to the current week, preceded by a
    'Before' roll-up and followed by a 'No Requested Date' row and a TOTAL.
    Uses Helper col F (mirrors the source 'Requested Date' column).
    Returns the last row used."""
    ws.merge_cells(f"A{r0}:M{r0}")
    h = ws.cell(r0, 1, "WEEKLY INTAKE  —  items requested (by Requested Date)")
    h.font = font(bold=True, size=11, color=C_WHITE); h.fill = fill(C_ACCENT)
    h.alignment = align("left", "center"); ws.row_dimensions[r0].height = 20
    r = r0 + 1

    if not req_date_col:
        ws.merge_cells(f"A{r}:M{r}")
        n = ws.cell(r, 1, "No 'Requested Date' column found in the source sheet — "
                          "add it and re-run to populate weekly intake.")
        n.font = font(size=9, color="843C0C"); n.fill = fill("FFF2CC")
        n.alignment = align("left", "center"); ws.row_dimensions[r].height = 18
        return r

    HD = col_ref("Helper", "F"); HB = col_ref("Helper", "E")
    for i, t in enumerate(["Period", "Added", "Delivered", "Pending", "% Closed"], start=1):
        c = ws.cell(r, i, t); c.font = font(bold=True, size=9, color=C_WHITE)
        c.fill = fill(C_DGREY); c.alignment = align("center", "center"); c.border = thin_border()
    ws.row_dimensions[r].height = 18

    def dfml(ts):
        return f"DATE({ts.year},{ts.month},{ts.day})"

    start = pd.Timestamp(INTAKE_START)
    today = report_today()
    current_week = (today - pd.to_timedelta(today.dayofweek, unit="D")).normalize()

    # (label, added_criteria, tint) rows; criteria = COUNTIFS date conditions on F
    periods = [(
        f"Before {start.strftime('%d-%b-%Y')}",
        f'{HD},"<"&{dfml(start)}',
        "EDEDED",
    )]
    wk = start
    while wk <= current_week:
        tag = "  — this week" if wk == current_week else (
              "  — last week" if wk == current_week - pd.Timedelta(days=7) else "")
        periods.append((
            f"Week of {wk.strftime('%d %b %Y')}{tag}",
            f'{HD},">="&{dfml(wk)},{HD},"<="&{dfml(wk + pd.Timedelta(days=6))}',
            None,
        ))
        wk += pd.Timedelta(days=7)
    # Future-dated requests (after the current week) — catch-all so TOTAL = all rows
    cur_end = current_week + pd.Timedelta(days=6)
    periods.append((
        f"Requested ahead (after {cur_end.strftime('%d %b')})",
        f'{HD},">"&{dfml(cur_end)}',
        "EDEDED",
    ))
    periods.append(("No Requested Date", f'{HD},""', "EDEDED"))

    r += 1
    first_data = r
    for label, crit, tint in periods:
        if label == "No Requested Date":
            added = ("=COUNTA(Helper!$C$2:$C$5000)"
                     "-COUNT(Helper!$F$2:$F$5000)")
        else:
            added = f"=COUNTIFS({crit})"
        vals = [
            label,
            added,
            f'=COUNTIFS({crit},{HB},"Delivered")',
            f'=COUNTIFS({crit},{HB},"Pending")',
            f"=IFERROR(C{r}/B{r},0)",
        ]
        for i, v in enumerate(vals, start=1):
            c = ws.cell(r, i, v); c.font = font(size=9, color=C_DGREY)
            c.alignment = align("left" if i == 1 else "center", "center")
            c.border = thin_border()
            if i == 5:
                c.number_format = "0%"
            if tint:
                c.fill = fill(tint)
            elif i == 3:
                c.fill = fill("E2EFDA")
            elif i == 4:
                c.fill = fill("FFE3E6")
        ws.row_dimensions[r].height = 16
        r += 1

    # TOTAL row
    vals = ["TOTAL",
            f"=SUM(B{first_data}:B{r-1})",
            f"=SUM(C{first_data}:C{r-1})",
            f"=SUM(D{first_data}:D{r-1})",
            f"=IFERROR(C{r}/B{r},0)"]
    for i, v in enumerate(vals, start=1):
        c = ws.cell(r, i, v)
        c.font = font(bold=True, size=9, color=C_WHITE); c.fill = fill(C_NAVY)
        c.alignment = align("left" if i == 1 else "center", "center")
        c.border = thin_border()
        if i == 5:
            c.number_format = "0%"
    ws.row_dimensions[r].height = 18
    return r


def _draw_milestone_status_matrix(ws, r0, present_ms, set_widths=False):
    """Milestone × status matrix: rows = milestones, columns = status categories,
    cells = live COUNTIFS(Phase, Category). Returns the last row used."""
    H = "Helper"; HP = col_ref(H, "B"); HC = col_ref(H, "D")
    cats = ["Delivered", "Dev Complete", "In Development", "In QA",
            "Pre-PROD / UAT", "Not Started", "Partial Delivery"]

    HR = r0
    c = ws.cell(HR, 1, "Milestone")
    c.font = font(bold=True, size=9, color=C_WHITE); c.fill = fill(C_DGREY)
    c.alignment = align("center", "center"); c.border = thin_border()
    if set_widths:
        ws.column_dimensions["A"].width = 16
    for i, cat in enumerate(cats, start=2):
        bg, tx = CAT_STYLES.get(cat, CAT_STYLES["Unknown"])
        c = ws.cell(HR, i, cat)
        c.font = font(bold=True, size=8, color=tx); c.fill = fill(bg)
        c.alignment = align("center", "center", wrap=True); c.border = thin_border()
        if set_widths:
            ws.column_dimensions[get_column_letter(i)].width = 12
    tot_col = len(cats) + 2
    c = ws.cell(HR, tot_col, "TOTAL")
    c.font = font(bold=True, size=8, color=C_WHITE); c.fill = fill(C_GOLD)
    c.alignment = align("center", "center", wrap=True); c.border = thin_border()
    if set_widths:
        ws.column_dimensions[get_column_letter(tot_col)].width = 10
    ws.row_dimensions[HR].height = 28

    r = HR + 1
    for ms in present_ms:
        cm = ws.cell(r, 1, ms)
        cm.font = font(bold=True, size=9, color=C_DGREY); cm.fill = fill(C_LGREY)
        cm.alignment = align("left", "center"); cm.border = thin_border()
        for i, cat in enumerate(cats, start=2):
            c = ws.cell(r, i, f'=COUNTIFS({HP},"{ms}",{HC},"{cat}")')
            c.font = font(size=9, color=C_DGREY)
            c.alignment = align("center", "center"); c.border = thin_border()
        L_last = get_column_letter(len(cats) + 1)
        ct = ws.cell(r, tot_col, f"=SUM(B{r}:{L_last}{r})")
        ct.font = font(bold=True, size=9, color="7F6000"); ct.fill = fill("FFEB9C")
        ct.alignment = align("center", "center"); ct.border = thin_border()
        ws.row_dimensions[r].height = 18
        r += 1

    cm = ws.cell(r, 1, "TOTAL")
    cm.font = font(bold=True, size=9, color=C_WHITE); cm.fill = fill(C_NAVY)
    cm.alignment = align("left", "center"); cm.border = thin_border()
    for i in range(2, tot_col + 1):
        L = get_column_letter(i)
        c = ws.cell(r, i, f"=SUM({L}{HR+1}:{L}{r-1})")
        c.font = font(bold=True, size=9, color=C_WHITE); c.fill = fill(C_NAVY)
        c.alignment = align("center", "center"); c.border = thin_border()
    ws.row_dimensions[r].height = 20
    return r


# ── SOW scope comparison (Original 'SOW - Actual Items' vs current tracker) ──
# STATIC snapshot — computed by Python at build time (cross-sheet fuzzy name
# matching isn't practical as a live Excel formula). Recomputes on every re-run.
# Skipped entirely if the 'SOW - Actual Items' reference sheet isn't present.

SOW_ACTUAL_SHEET = "SOW - Actual Items"

# Module values that did not exist in the original SOW scope at all —
# any current row under these is structurally "new", not organic growth.
SOW_NEW_MODULES = {"dpdp", "nfr", "iwork - cr", "ibp - cr", "ibp/iwork - cr"}


def _norm_key(s):
    return re.sub(r"\s+", " ", str(s)).strip().casefold() if pd.notna(s) else ""


def _last_data_row_ABCD(ws):
    """Last row with data in columns A-D (the sheet may have hundreds of
    blank formatting rows below the real content)."""
    last = 1
    for r in range(1, ws.max_row + 1):
        if any(ws.cell(r, c).value not in (None, "") for c in range(1, 5)):
            last = r
    return last


def read_sow_actual_items(wb):
    """
    Read the original-scope reference sheet (Feature, Functionality, Module,
    Milestone in cols A-D; header row 1). Returns a DataFrame in row order
    (index 0 == sheet row 2), or None if the sheet isn't present / empty.
    """
    if SOW_ACTUAL_SHEET not in wb.sheetnames:
        return None
    ws = wb[SOW_ACTUAL_SHEET]
    last = _last_data_row_ABCD(ws)
    if last < 2:
        return None
    rows = list(ws.iter_rows(min_row=2, max_row=last, min_col=1, max_col=4, values_only=True))
    return pd.DataFrame(rows, columns=["Feature", "Functionality", "Module", "Milestone"])


def _sow_match_keys(sow_df, cur_df):
    """Shared (Module, Feature) matching, case/whitespace-insensitive.
    Returns (sow_keyed_df, cur_keyed_df, matched_keys)."""
    sow = sow_df.copy()
    cur = cur_df.copy()
    sow["_k"] = sow["Module"].map(_norm_key) + "||" + sow["Feature"].map(_norm_key)
    cur["_k"] = cur["Module"].map(_norm_key) + "||" + cur["Feature"].map(_norm_key)
    matched_keys = set(sow["_k"]) & set(cur["_k"])
    return sow, cur, matched_keys


def _sow_row_has_note(ws, r):
    """True if any column to the right of 'Match Status' (col E, i.e. F+) is
    filled for this row — a human already investigated/resolved the row."""
    return any(ws.cell(r, cc).value not in (None, "") for cc in range(6, ws.max_column + 1))


def compute_sow_comparison(sow_df, cur_df, wb=None):
    """
    Compare original SOW scope vs the current tracker.
    Returns a stats dict, or None if sow_df is empty/None.

    If `wb` is given, uncovered SOW items are further split into:
      sow_mapped   — no automatic match, but a human left a note (col F+)
      sow_open_gap — no automatic match AND no note (genuine open item)
    """
    if sow_df is None or sow_df.empty:
        return None
    sow, cur, matched_keys = _sow_match_keys(sow_df, cur_df)

    sow_total    = len(sow)
    sow_covered  = int(sow["_k"].isin(matched_keys).sum())
    sow_uncovered = sow_total - sow_covered
    cur_total    = len(cur)
    cur_matched  = int(cur["_k"].isin(matched_keys).sum())
    cur_unmatched = cur_total - cur_matched

    cur_modnorm = cur["Module"].map(_norm_key)
    new_struct = int(((~cur["_k"].isin(matched_keys)) & cur_modnorm.isin(SOW_NEW_MODULES)).sum())
    new_organic = cur_unmatched - new_struct

    sow_mapped = sow_open_gap = None
    if wb is not None and SOW_ACTUAL_SHEET in wb.sheetnames:
        ws = wb[SOW_ACTUAL_SHEET]
        last = _last_data_row_ABCD(ws)
        sow_mapped = 0
        uncovered_mask = ~sow["_k"].isin(matched_keys)
        for i in range(len(sow)):
            r = i + 2
            if r > last or not uncovered_mask.iloc[i]:
                continue
            if _sow_row_has_note(ws, r):
                sow_mapped += 1
        sow_open_gap = sow_uncovered - sow_mapped

    return {
        "sow_total":    sow_total,
        "sow_covered":  sow_covered,
        "sow_uncovered": sow_uncovered,
        "sow_mapped":   sow_mapped,
        "sow_open_gap": sow_open_gap,
        "cur_total":    cur_total,
        "cur_matched":  cur_matched,
        "new_struct":   new_struct,
        "new_organic":  new_organic,
        "net_growth":   cur_total - sow_total,
    }


def mark_sow_actual_items(wb, sow_df, cur_df):
    """
    Annotate the SOW - Actual Items reference sheet IN PLACE with a
    'Match Status' column: ✓ Found in tracker / ⚠ NOT in tracker, per row,
    colour-coded. Idempotent — reuses an existing 'Match Status' column
    (by header name) instead of adding a new one on every re-run, so the
    marks refresh in place as the current tracker changes over time.

    THREE states, since a human may have already investigated a mismatch:
      ✓ Found in tracker      — exact Module+Feature match (automatic)
      🔗 Mapped (see note)    — no automatic match, but a note exists in any
                                column to the right (e.g. 'Map to line N in
                                ...') — someone already resolved this by hand,
                                so it is NOT flagged as an open gap.
      ⚠ NOT in tracker        — no automatic match AND no note — a genuine
                                open item needing review.
    """
    if sow_df is None or sow_df.empty:
        return
    ws = wb[SOW_ACTUAL_SHEET]
    last = _last_data_row_ABCD(ws)
    _, _, matched_keys = _sow_match_keys(sow_df, cur_df)

    status_col = None
    for c in range(1, ws.max_column + 1):
        if str(ws.cell(1, c).value).strip().lower() == "match status":
            status_col = c
            break
    if status_col is None:
        status_col = 5  # column E — right after the original A-D reference data

    hc = ws.cell(1, status_col, "Match Status")
    hc.font = font(bold=True, size=9, color=C_WHITE)
    hc.fill = fill(C_DGREY)
    hc.alignment = align("center", "center")
    ws.column_dimensions[get_column_letter(status_col)].width = 24

    found_bg, found_tx = "E2EFDA", "375623"
    mapped_bg, mapped_tx = "DEEAF1", "1F4E79"
    miss_bg,  miss_tx  = "FFC7CE", "9C0006"

    for i, row in sow_df.reset_index(drop=True).iterrows():
        r = i + 2  # data starts at sheet row 2
        if r > last:
            break
        k = _norm_key(row["Module"]) + "||" + _norm_key(row["Feature"])
        is_matched = k in matched_keys
        has_note = _sow_row_has_note(ws, r)
        if is_matched:
            val, bg, tx = "✓ Found in tracker", found_bg, found_tx
        elif has_note:
            val, bg, tx = "🔗 Mapped (see note)", mapped_bg, mapped_tx
        else:
            val, bg, tx = "⚠ NOT in tracker", miss_bg, miss_tx
        c = ws.cell(r, status_col, val)
        c.font = font(bold=(not is_matched and not has_note), size=9, color=tx)
        c.fill = fill(bg)
        c.alignment = align("center", "center")
        c.border = thin_border()


def _draw_sow_comparison(ws, r0, stats):
    """Simple totals block comparing original SOW scope vs current tracker.
    Returns the last row used."""
    ws.merge_cells(f"A{r0}:M{r0}")
    h = ws.cell(r0, 1, "SOW SCOPE  —  ORIGINAL vs CURRENT ITEMS")
    h.font = font(bold=True, size=11, color=C_WHITE); h.fill = fill(C_ACCENT)
    h.alignment = align("left", "center"); ws.row_dimensions[r0].height = 20
    r = r0 + 1

    ws.merge_cells(f"A{r}:M{r}")
    n = ws.cell(r, 1,
        "Static comparison vs the 'SOW - Actual Items' reference sheet "
        "(original contracted scope). Matched by Module + Feature name. "
        "Recomputed on each re-run of the script.")
    n.font = font(size=8, color="7A7A7A"); n.alignment = align("left", "center", wrap=True)
    ws.row_dimensions[r].height = 14
    r += 2

    rows = [
        ("Original SOW items",                          stats["sow_total"],   C_LGREY, C_DGREY, False),
        ("Currently tracked (all items)",                stats["cur_total"],   C_LGREY, C_DGREY, False),
        ("— new: DPDP / NFR / Change Requests",          stats["new_struct"],  "DEEAF1", "1F4E79", False),
        ("— new: organic growth (existing modules)",     stats["new_organic"], "FFEB9C", "7F6000", False),
        (f"Net growth vs original SOW ({stats['sow_total']} → {stats['cur_total']})",
                                                          stats["net_growth"],  C_NAVY,  C_WHITE,  True),
    ]
    for label, val, bg, tx, bold in rows:
        ws.merge_cells(f"A{r}:F{r}")
        lc = ws.cell(r, 1, label)
        lc.font = font(bold=bold, size=9, color=tx); lc.fill = fill(bg)
        lc.alignment = align("left", "center"); lc.border = thin_border()
        for cc in range(2, 7):
            ws.cell(r, cc).fill = fill(bg); ws.cell(r, cc).border = thin_border()
        vc = ws.cell(r, 7, ("+" if bold and val >= 0 else "") + str(val))
        vc.font = Font(name="Arial", bold=True, size=9, color=tx)
        vc.fill = fill(bg); vc.alignment = align("center", "center"); vc.border = thin_border()
        ws.row_dimensions[r].height = 16
        r += 1

    if stats.get("sow_mapped") is not None:
        # Split view: mapped-by-note vs genuinely open gaps
        if stats["sow_open_gap"]:
            ws.merge_cells(f"A{r}:M{r}")
            w = ws.cell(r, 1,
                f"⚠  {stats['sow_open_gap']} original SOW item(s) still need review — no "
                "matching row in the tracker and no mapping note yet.")
            w.font = font(size=8, color="843C0C"); w.fill = fill("FFF2CC")
            w.alignment = align("left", "center"); ws.row_dimensions[r].height = 14
            r += 1
        if stats["sow_mapped"]:
            ws.merge_cells(f"A{r}:M{r}")
            w = ws.cell(r, 1,
                f"🔗  {stats['sow_mapped']} item(s) already mapped by hand to a renamed/"
                "restructured tracker row — see notes in 'SOW - Actual Items'.")
            w.font = font(size=8, color="1F4E79"); w.fill = fill("DEEAF1")
            w.alignment = align("left", "center"); ws.row_dimensions[r].height = 14
            r += 1
    elif stats["sow_uncovered"]:
        ws.merge_cells(f"A{r}:M{r}")
        w = ws.cell(r, 1,
            f"⚠  {stats['sow_uncovered']} original SOW item(s) have no matching row in the "
            "current tracker (renamed, merged, or dropped — pending team review).")
        w.font = font(size=8, color="843C0C"); w.fill = fill("FFF2CC")
        w.alignment = align("left", "center"); ws.row_dimensions[r].height = 14
        r += 1

    return r


def build_executive_summary(wb, df_src, present_mods, present_ms, req_date_col=None,
                             sow_stats=None, sheet_name="① Executive Summary"):
    ws = wb.create_sheet(sheet_name)
    ws.sheet_view.showGridLines = False

    H  = "Helper"
    HM = col_ref(H, "A")   # Module column
    HC = col_ref(H, "D")   # Category column
    HB = col_ref(H, "E")   # Bucket column

    # ── Title banner ──────────────────────────────────────────────────────────
    ws.merge_cells("A1:M3")
    ws["A1"].value = "PROJECT DELIVERY PLAN"
    ws["A1"].font  = Font(name="Arial", bold=True, size=22, color=C_WHITE)
    ws["A1"].fill  = fill(C_NAVY)
    ws["A1"].alignment = align("center", "center")

    ws.merge_cells("A4:M4")
    ws["A4"].value = (
        "iWork · IBP · Framework  (IIRM SOW)   |   "
        "Status Overview & Forward Roadmap   ·   As of "
        + report_today().strftime("%d-%b-%Y")
    )
    ws["A4"].font      = font(size=10, color="C9D3DD")
    ws["A4"].fill      = fill("1A2E40")
    ws["A4"].alignment = align("center", "center")

    for row, h in [(1,28),(2,28),(3,28),(4,18),(5,10)]:
        ws.row_dimensions[row].height = h

    # ── Overall completion / remaining work headline (rows 6-9) ──────────────
    ws.merge_cells("A6:F6")
    ws["A6"].value = "OVERALL COMPLETION"
    ws["A6"].font  = font(bold=True, size=11, color=C_DGREY)
    ws["A6"].alignment = align("left", "center")
    ws.row_dimensions[6].height = 22

    ws.merge_cells("A7:C9")
    ws["A7"].value = (
        f'=ROUND(COUNTIF({HB},"Delivered")'
        f'/(COUNTIF({HB},"Delivered")+COUNTIF({HB},"Pending")),3)'
    )
    ws["A7"].number_format = "0%"
    ws["A7"].font          = Font(name="Arial", bold=True, size=44, color="375623")
    ws["A7"].fill          = fill("E2EFDA")
    ws["A7"].alignment     = align("center", "center")

    ws.merge_cells("D7:F9")
    ws["D7"].value = (
        f'=COUNTIF({HB},"Delivered")&" of "'
        f'&(COUNTIF({HB},"Delivered")+COUNTIF({HB},"Pending"))'
        f'&" scope items delivered"'
    )
    ws["D7"].font      = font(bold=True, size=13, color=C_DGREY)
    ws["D7"].fill      = fill("F2F7ED")
    ws["D7"].alignment = align("center", "center", wrap=True)

    for row in (7, 8, 9):
        ws.row_dimensions[row].height = 26

    ws.merge_cells("H6:M6")
    ws["H6"].value     = "REMAINING WORK"
    ws["H6"].font      = font(bold=True, size=11, color=C_DGREY)
    ws["H6"].alignment = align("left", "center")

    ws.merge_cells("H7:I9")
    ws["H7"].value     = f'=COUNTIF({HB},"Pending")'
    ws["H7"].font      = Font(name="Arial", bold=True, size=44, color="9C0006")
    ws["H7"].fill      = fill("FFC7CE")
    ws["H7"].alignment = align("center", "center")

    ws.merge_cells("J7:M9")
    ws["J7"].value = (
        "items still to deliver across all modules — "
        "planned week by week in the weekly sheets"
    )
    ws["J7"].font      = font(bold=True, size=11, color=C_DGREY)
    ws["J7"].fill      = fill("FDEEEF")
    ws["J7"].alignment = align("center", "center", wrap=True)

    ws.row_dimensions[10].height = 12

    # Column widths (shared by all tables below)
    for col, w in {1:24, 2:16, 3:7, 4:10, 5:9, 6:6, 7:11}.items():
        ws.column_dimensions[get_column_letter(col)].width = w
    for col in range(8, 14):
        ws.column_dimensions[get_column_letter(col)].width = 7

    # ── WEEKLY INTAKE — right after the completion headline ──────────────────
    r_cursor = 11
    if sow_stats is not None:
        r_cursor = _draw_sow_comparison(ws, r_cursor, sow_stats) + 2
    intake_end = _draw_weekly_intake(ws, r_cursor, req_date_col)
    r = intake_end + 2

    # ── Status breakdown strip ────────────────────────────────────────────────
    ws.merge_cells(f"A{r}:M{r}")
    c = ws.cell(r, 1, "STATUS BREAKDOWN  (all items)")
    c.font = font(bold=True, size=11, color=C_WHITE)
    c.fill = fill(C_ACCENT); c.alignment = align("left", "center")
    ws.row_dimensions[r].height = 20
    base = r + 1

    ws.row_dimensions[base].height     = 30
    ws.row_dimensions[base + 1].height = 16
    ws.row_dimensions[base + 2].height = 30
    ws.row_dimensions[base + 3].height = 16

    positions = [
        (base,     1), (base,     4), (base,     7), (base,     10),
        (base + 2, 1), (base + 2, 4), (base + 2, 7), (base + 2, 10),
    ]
    for cat, bg, tx, (rw, cl) in zip(KCATS, KBGS, KTXS, positions):
        ws.merge_cells(start_row=rw,   start_column=cl, end_row=rw,   end_column=cl+2)
        ws.merge_cells(start_row=rw+1, start_column=cl, end_row=rw+1, end_column=cl+2)
        cn = ws.cell(rw,   cl, f'=COUNTIF({HC},"{cat}")')
        cn.font = Font(name="Arial", bold=True, size=20, color=tx)
        cn.fill = fill(bg); cn.alignment = align("center", "center")
        lc = ws.cell(rw+1, cl, cat)
        lc.font = font(bold=True, size=8, color=tx)
        lc.fill = fill(bg); lc.alignment = align("center", "center")

    r = base + 4
    ws.row_dimensions[r].height = 12
    r += 1

    # ── Module progress table ─────────────────────────────────────────────────
    ws.merge_cells(f"A{r}:M{r}")
    c = ws.cell(r, 1, "PROGRESS BY MODULE")
    c.font = font(bold=True, size=11, color=C_WHITE)
    c.fill = fill(C_ACCENT); c.alignment = align("left", "center")
    ws.row_dimensions[r].height = 20
    r += 1

    HDR = ["Module","Type","Total","Delivered","Pending","N/A","% Complete"]
    hdr_row = r
    for i, h in enumerate(HDR, start=1):
        c = ws.cell(r, i, h)
        c.font = font(bold=True, size=9, color=C_WHITE)
        c.fill = fill(C_DGREY)
        c.alignment = align("center", "center", wrap=True)
        c.border = thin_border()
    ws.merge_cells(start_row=r, start_column=8, end_row=r, end_column=13)
    pc = ws.cell(r, 8, "Progress")
    pc.font = font(bold=True, size=9, color=C_WHITE)
    pc.fill = fill(C_DGREY); pc.alignment = align("center", "center")
    for cc in range(8, 14):
        ws.cell(r, cc).border = thin_border()
    ws.row_dimensions[r].height = 24

    r += 1
    first_mod_row = r
    toggle = True
    for mod in present_mods:
        itype = "Change Request" if mod.endswith("- CR") else "Backlog"
        is_cr = itype == "Change Request"
        row_bg = "E8F0FE" if is_cr else ("F7F9FB" if toggle else C_WHITE)

        vals = [
            MOD_DISP.get(mod, mod),
            itype,
            f'=COUNTIF({HM},"{mod}")',
            f'=COUNTIFS({HM},"{mod}",{HB},"Delivered")',
            f'=COUNTIFS({HM},"{mod}",{HB},"Pending")',
            f'=COUNTIFS({HM},"{mod}",{HB},"N/A")',
            f"=IFERROR(D{r}/(D{r}+E{r}),0)",
        ]
        for j, v in enumerate(vals, start=1):
            c = ws.cell(r, j, v)
            c.font      = font(bold=is_cr, size=9, color=C_NAVY if is_cr else C_DGREY)
            c.fill      = fill(row_bg)
            c.alignment = align("center" if j > 2 else "left", "center")
            c.border    = thin_border()
            if j == 7:
                c.number_format = "0%"
            if j == 4:
                c.fill = fill("E2EFDA"); c.font = font(bold=True, size=9, color="375623")
            if j == 5:
                c.fill = fill("FFE3E6"); c.font = font(bold=True, size=9, color="9C0006")

        ws.merge_cells(start_row=r, start_column=8, end_row=r, end_column=13)
        bar = ws.cell(r, 8, f"=G{r}")
        bar.number_format = "0%"
        bar.font = font(size=9, color=C_DGREY)
        bar.fill = fill(row_bg); bar.alignment = align("center", "center")
        for cc in range(8, 14):
            ws.cell(r, cc).border = thin_border()

        ws.row_dimensions[r].height = 18
        toggle = not toggle
        r += 1

    # Totals row
    tr = r
    totals = [
        "TOTAL", "All",
        f"=COUNTA(Helper!$A$2:$A$5000)",
        f'=COUNTIF({HB},"Delivered")',
        f'=COUNTIF({HB},"Pending")',
        f'=COUNTIF({HB},"N/A")',
        f"=IFERROR(D{tr}/(D{tr}+E{tr}),0)",
    ]
    for j, v in enumerate(totals, start=1):
        c = ws.cell(tr, j, v)
        c.font      = font(bold=True, size=9, color=C_WHITE)
        c.fill      = fill(C_NAVY)
        c.alignment = align("center" if j > 2 else "left", "center")
        c.border    = thin_border()
        if j == 7:
            c.number_format = "0%"
    ws.merge_cells(start_row=tr, start_column=8, end_row=tr, end_column=13)
    bc = ws.cell(tr, 8, f"=G{tr}")
    bc.number_format = "0%"
    bc.font = font(bold=True, size=9, color=C_WHITE)
    bc.fill = fill(C_NAVY); bc.alignment = align("center", "center")
    for cc in range(8, 14):
        ws.cell(tr, cc).border = thin_border()
    ws.row_dimensions[tr].height = 20

    ws.conditional_formatting.add(
        f"G{first_mod_row}:G{tr-1}",
        DataBarRule(
            start_type="num", start_value=0,
            end_type="num",   end_value=1,
            color="63BE7B", showValue=True,
        ),
    )

    # ── Embedded milestone x module pending grid ──
    ms_hdr = tr + 2
    ws.merge_cells(f"A{ms_hdr}:M{ms_hdr}")
    mh = ws[f"A{ms_hdr}"]
    mh.value = "PENDING BY MILESTONE & MODULE"
    mh.font = font(bold=True, size=11, color=C_WHITE); mh.fill = fill(C_ACCENT)
    mh.alignment = align("left", "center"); ws.row_dimensions[ms_hdr].height = 20
    grid_end = _draw_milestone_grid(ws, ms_hdr + 1, present_mods, present_ms,
                                    df_src, set_widths=False, label_fn=lambda m: m)

    # ── Milestone x status matrix ──
    sm_hdr = grid_end + 2
    ws.merge_cells(f"A{sm_hdr}:M{sm_hdr}")
    sh = ws[f"A{sm_hdr}"]
    sh.value = "ITEMS BY MILESTONE & STATUS"
    sh.font = font(bold=True, size=11, color=C_WHITE); sh.fill = fill(C_ACCENT)
    sh.alignment = align("left", "center"); ws.row_dimensions[sm_hdr].height = 20
    matrix_end = _draw_milestone_status_matrix(ws, sm_hdr + 1, present_ms, set_widths=False)

    # Footer note
    fr = matrix_end + 2
    ws.merge_cells(f"A{fr}:M{fr}")
    ws[f"A{fr}"].value = (
        "% Complete = Delivered ÷ (Delivered + Pending).  "
        "N/A items (duplicates) are excluded from the calculation.  "
        "All figures update live from the 'SOW, Feedbacks-Bug & CR_Items' sheet."
    )
    ws[f"A{fr}"].font      = font(size=8, color="7A7A7A")
    ws[f"A{fr}"].alignment = align("left", "center", wrap=True)
    ws.row_dimensions[fr].height = 26


# ═════════════════════════════════════════════════════════════════════════════
# SECTION 3B — Stablization Summary sheet
# Scoped to source rows where Area = "Stablization", broken up by Feature.
# Same live-formula pattern as the Module table above (COUNTIFS on the source
# sheet's Area/Feature columns + Helper's Category/Bucket columns) — nothing
# here is a hardcoded Python number.
# ═════════════════════════════════════════════════════════════════════════════

STAB_AREA_LABEL   = "Stablization"
STAB_DEADLINE     = pd.Timestamp("2026-08-14")
STAB_SUMMARY_SHEET = "② Stablization Summary"
STAB_LOG_BANNER   = "DAILY PROGRESS  —  toward the 14-Aug-2026 deadline"
STAB_LOG_HDR      = ["Date", "Total", "Planned Delivered", "Delivered", "Planned Pending", "Pending",
                      "Delivered Today", "% Complete", "Ahead/Behind Plan", "Days Left", "Req. Pace/day"]
# The only facts that must survive a rebuild — everything else in STAB_LOG_HDR
# (Planned Delivered/Pending, Ahead/Behind Plan, Days Left, Req. Pace, even
# Delivered Today) is derived purely from these plus the date, so it's always
# recomputed fresh rather than carried over.
STAB_LOG_FACT_COLS = ["Total", "Delivered", "Pending"]


def _extract_stab_daily_log(wb, sheet_name):
    """Pull prior days' captured facts out of the sheet before it's rebuilt,
    keyed by date. Looked up by header name (not position) so this survives
    STAB_LOG_HDR gaining/reordering columns across script versions.

    build_stablization_summary() is rebuilt fresh every run like every other
    summary sheet — EXCEPT the historical facts in the daily-log section,
    which must survive (see the note in build_stablization_summary). Since
    the whole sheet gets deleted and recreated, this must run first to save
    them, and the caller re-derives the rest after rebuilding the top."""
    if sheet_name not in wb.sheetnames:
        return {}
    old_ws = wb[sheet_name]
    marker_row = None
    for r in range(1, old_ws.max_row + 1):
        if old_ws.cell(r, 1).value == STAB_LOG_BANNER:
            marker_row = r
            break
    if not marker_row:
        return {}
    hdr_row = marker_row + 1
    hdr = {str(old_ws.cell(hdr_row, c).value).strip(): c
           for c in range(1, old_ws.max_column + 1) if old_ws.cell(hdr_row, c).value}
    if "Date" not in hdr or not all(h in hdr for h in STAB_LOG_FACT_COLS):
        return {}
    facts = {}
    for r in range(hdr_row + 1, old_ws.max_row + 1):
        d = old_ws.cell(r, hdr["Date"]).value
        if d is None:
            continue
        vals = {h: old_ws.cell(r, hdr[h]).value for h in STAB_LOG_FACT_COLS}
        if all(vals[h] not in (None, "—") for h in STAB_LOG_FACT_COLS):
            facts[pd.Timestamp(d).normalize()] = vals
    return facts


PRIORITY_ORDER = ["Critical", "High", "Medium", "Low"]


def _draw_priority_status_matrix(ws, r0, area_range, area_crit, priority_range, present_priorities):
    """Priority x status matrix, scoped to the Stablization Area — rows =
    priorities, columns = status categories, cells = live
    COUNTIFS(Area, Priority, Category). Same shape as
    _draw_milestone_status_matrix, but includes N/A (a priority can still be
    set on a duplicate/out-of-scope item, unlike a milestone/phase) AND
    Unknown — any status not in STATUS_MAP defaults to Category "Unknown"
    (see build_helper), which every other table in this sheet counts via
    Bucket (also "N/A" for unmapped statuses, so it's never lost there).
    This table groups by Category instead, so without this column an
    unmapped status would silently vanish from its TOTAL row while still
    showing up everywhere else — exactly the 60-vs-57 mismatch found
    04-Aug-2026 (two "UAT - WIP" rows, now mapped into STATUS_MAP)."""
    HC = col_ref("Helper", "D")
    cats = KCATS + ["Unknown"]

    HR = r0
    c = ws.cell(HR, 1, "Priority")
    c.font = font(bold=True, size=9, color=C_WHITE); c.fill = fill(C_DGREY)
    c.alignment = align("center", "center"); c.border = thin_border()
    for i, cat in enumerate(cats, start=2):
        bg, tx = CAT_STYLES.get(cat, CAT_STYLES["Unknown"])
        c = ws.cell(HR, i, cat)
        c.font = font(bold=True, size=8, color=tx); c.fill = fill(bg)
        c.alignment = align("center", "center", wrap=True); c.border = thin_border()
    tot_col = len(cats) + 2
    c = ws.cell(HR, tot_col, "TOTAL")
    c.font = font(bold=True, size=8, color=C_WHITE); c.fill = fill(C_GOLD)
    c.alignment = align("center", "center", wrap=True); c.border = thin_border()
    ws.row_dimensions[HR].height = 28

    r = HR + 1
    for p in present_priorities:
        p_esc = p.replace('"', '""')
        cm = ws.cell(r, 1, p)
        cm.font = font(bold=True, size=9, color=C_DGREY); cm.fill = fill(C_LGREY)
        cm.alignment = align("left", "center"); cm.border = thin_border()
        for i, cat in enumerate(cats, start=2):
            c = ws.cell(r, i, f'=COUNTIFS({area_range},{area_crit},{priority_range},"{p_esc}",{HC},"{cat}")')
            c.font = font(size=9, color=C_DGREY)
            c.alignment = align("center", "center"); c.border = thin_border()
        L_last = get_column_letter(len(cats) + 1)
        ct = ws.cell(r, tot_col, f"=SUM(B{r}:{L_last}{r})")
        ct.font = font(bold=True, size=9, color="7F6000"); ct.fill = fill("FFEB9C")
        ct.alignment = align("center", "center"); ct.border = thin_border()
        ws.row_dimensions[r].height = 18
        r += 1

    cm = ws.cell(r, 1, "TOTAL")
    cm.font = font(bold=True, size=9, color=C_WHITE); cm.fill = fill(C_NAVY)
    cm.alignment = align("left", "center"); cm.border = thin_border()
    for i in range(2, tot_col + 1):
        L = get_column_letter(i)
        c = ws.cell(r, i, f"=SUM({L}{HR+1}:{L}{r-1})")
        c.font = font(bold=True, size=9, color=C_WHITE); c.fill = fill(C_NAVY)
        c.alignment = align("center", "center"); c.border = thin_border()
    ws.row_dimensions[r].height = 20
    return r


def build_stablization_summary(wb, df_src, present_features, sheet_name=STAB_SUMMARY_SHEET,
                                today=None, source_sheet=None):
    source_sheet = source_sheet or SOURCE_SHEET
    prior_facts = _extract_stab_daily_log(wb, sheet_name)
    if sheet_name in wb.sheetnames:
        del wb[sheet_name]
    ws = wb.create_sheet(sheet_name)
    ws.sheet_view.showGridLines = False

    SA = col_ref(source_sheet, "A")  # Area column
    SF = col_ref(source_sheet, "B")  # Feature column
    H  = "Helper"
    HC = col_ref(H, "D")   # Category column
    HB = col_ref(H, "E")   # Bucket column
    area_crit = f'"{STAB_AREA_LABEL}"'

    priority_col = get_column_letter(df_src.columns.get_loc("Priority") + 1) if "Priority" in df_src.columns else None
    SP = col_ref(source_sheet, priority_col) if priority_col else None

    # ── Title banner ──────────────────────────────────────────────────────────
    ws.merge_cells("A1:M3")
    ws["A1"].value = "STABILIZATION — STATUS OVERVIEW"
    ws["A1"].font  = Font(name="Arial", bold=True, size=22, color=C_WHITE)
    ws["A1"].fill  = fill(C_NAVY)
    ws["A1"].alignment = align("center", "center")

    ws.merge_cells("A4:M4")
    ws["A4"].value = (
        "Stabilization Area  |  Break-up by Feature   ·   As of "
        + report_today().strftime("%d-%b-%Y")
    )
    ws["A4"].font      = font(size=10, color="C9D3DD")
    ws["A4"].fill      = fill("1A2E40")
    ws["A4"].alignment = align("center", "center")

    for row, h in [(1,28),(2,28),(3,28),(4,18),(5,10)]:
        ws.row_dimensions[row].height = h

    # ── Overall completion / remaining work headline (rows 6-9) ──────────────
    ws.merge_cells("A6:F6")
    ws["A6"].value = "OVERALL COMPLETION"
    ws["A6"].font  = font(bold=True, size=11, color=C_DGREY)
    ws["A6"].alignment = align("left", "center")
    ws.row_dimensions[6].height = 22

    ws.merge_cells("A7:C9")
    ws["A7"].value = (
        f'=ROUND(COUNTIFS({SA},{area_crit},{HB},"Delivered")'
        f'/(COUNTIFS({SA},{area_crit},{HB},"Delivered")+COUNTIFS({SA},{area_crit},{HB},"Pending")),3)'
    )
    ws["A7"].number_format = "0%"
    ws["A7"].font          = Font(name="Arial", bold=True, size=44, color="375623")
    ws["A7"].fill          = fill("E2EFDA")
    ws["A7"].alignment     = align("center", "center")

    ws.merge_cells("D7:F9")
    ws["D7"].value = (
        f'=COUNTIFS({SA},{area_crit},{HB},"Delivered")&" of "'
        f'&(COUNTIFS({SA},{area_crit},{HB},"Delivered")+COUNTIFS({SA},{area_crit},{HB},"Pending"))'
        f'&" Stabilization items delivered"'
    )
    ws["D7"].font      = font(bold=True, size=13, color=C_DGREY)
    ws["D7"].fill      = fill("F2F7ED")
    ws["D7"].alignment = align("center", "center", wrap=True)

    for row in (7, 8, 9):
        ws.row_dimensions[row].height = 26

    ws.merge_cells("H6:M6")
    ws["H6"].value     = "REMAINING WORK"
    ws["H6"].font      = font(bold=True, size=11, color=C_DGREY)
    ws["H6"].alignment = align("left", "center")

    ws.merge_cells("H7:I9")
    ws["H7"].value     = f'=COUNTIFS({SA},{area_crit},{HB},"Pending")'
    ws["H7"].font      = Font(name="Arial", bold=True, size=44, color="9C0006")
    ws["H7"].fill      = fill("FFC7CE")
    ws["H7"].alignment = align("center", "center")

    ws.merge_cells("J7:M9")
    ws["J7"].value = "Stabilization items still to deliver, broken up by Feature below"
    ws["J7"].font      = font(bold=True, size=11, color=C_DGREY)
    ws["J7"].fill      = fill("FDEEEF")
    ws["J7"].alignment = align("center", "center", wrap=True)

    ws.row_dimensions[10].height = 12

    # Column widths
    for col, w in {1:24, 2:16, 3:7, 4:10, 5:9, 6:6, 7:11}.items():
        ws.column_dimensions[get_column_letter(col)].width = w
    for col in range(8, 14):
        ws.column_dimensions[get_column_letter(col)].width = 7

    r = 11

    # ── Status breakdown strip ────────────────────────────────────────────────
    ws.merge_cells(f"A{r}:M{r}")
    c = ws.cell(r, 1, "STATUS BREAKDOWN  (Stabilization items)")
    c.font = font(bold=True, size=11, color=C_WHITE)
    c.fill = fill(C_ACCENT); c.alignment = align("left", "center")
    ws.row_dimensions[r].height = 20
    base = r + 1

    ws.row_dimensions[base].height     = 30
    ws.row_dimensions[base + 1].height = 16
    ws.row_dimensions[base + 2].height = 30
    ws.row_dimensions[base + 3].height = 16

    positions = [
        (base,     1), (base,     4), (base,     7), (base,     10),
        (base + 2, 1), (base + 2, 4), (base + 2, 7), (base + 2, 10),
    ]
    for cat, bg, tx, (rw, cl) in zip(KCATS, KBGS, KTXS, positions):
        ws.merge_cells(start_row=rw,   start_column=cl, end_row=rw,   end_column=cl+2)
        ws.merge_cells(start_row=rw+1, start_column=cl, end_row=rw+1, end_column=cl+2)
        cn = ws.cell(rw,   cl, f'=COUNTIFS({SA},{area_crit},{HC},"{cat}")')
        cn.font = Font(name="Arial", bold=True, size=20, color=tx)
        cn.fill = fill(bg); cn.alignment = align("center", "center")
        lc = ws.cell(rw+1, cl, cat)
        lc.font = font(bold=True, size=8, color=tx)
        lc.fill = fill(bg); lc.alignment = align("center", "center")

    r = base + 4
    ws.row_dimensions[r].height = 12
    r += 1

    # ── Feature progress table ────────────────────────────────────────────────
    ws.merge_cells(f"A{r}:M{r}")
    c = ws.cell(r, 1, "BREAKDOWN BY FEATURE")
    c.font = font(bold=True, size=11, color=C_WHITE)
    c.fill = fill(C_ACCENT); c.alignment = align("left", "center")
    ws.row_dimensions[r].height = 20
    r += 1

    HDR = ["Feature", "Total", "Delivered", "Pending", "N/A", "% Complete"]
    for i, h in enumerate(HDR, start=1):
        c = ws.cell(r, i, h)
        c.font = font(bold=True, size=9, color=C_WHITE)
        c.fill = fill(C_DGREY)
        c.alignment = align("center", "center", wrap=True)
        c.border = thin_border()
    ws.merge_cells(start_row=r, start_column=7, end_row=r, end_column=13)
    pc = ws.cell(r, 7, "Progress")
    pc.font = font(bold=True, size=9, color=C_WHITE)
    pc.fill = fill(C_DGREY); pc.alignment = align("center", "center")
    for cc in range(7, 14):
        ws.cell(r, cc).border = thin_border()
    ws.row_dimensions[r].height = 24

    r += 1
    first_feat_row = r
    toggle = True
    for feat in present_features:
        feat_esc = feat.replace('"', '""')
        row_bg = "F7F9FB" if toggle else C_WHITE

        vals = [
            feat,
            f'=COUNTIFS({SA},{area_crit},{SF},"{feat_esc}")',
            f'=COUNTIFS({SA},{area_crit},{SF},"{feat_esc}",{HB},"Delivered")',
            f'=COUNTIFS({SA},{area_crit},{SF},"{feat_esc}",{HB},"Pending")',
            f'=COUNTIFS({SA},{area_crit},{SF},"{feat_esc}",{HB},"N/A")',
            f"=IFERROR(C{r}/(C{r}+D{r}),0)",
        ]
        for j, v in enumerate(vals, start=1):
            c = ws.cell(r, j, v)
            c.font      = font(size=9, color=C_DGREY)
            c.fill      = fill(row_bg)
            c.alignment = align("center" if j > 1 else "left", "center")
            c.border    = thin_border()
            if j == 6:
                c.number_format = "0%"
            if j == 3:
                c.fill = fill("E2EFDA"); c.font = font(bold=True, size=9, color="375623")
            if j == 4:
                c.fill = fill("FFE3E6"); c.font = font(bold=True, size=9, color="9C0006")

        ws.merge_cells(start_row=r, start_column=7, end_row=r, end_column=13)
        bar = ws.cell(r, 7, f"=F{r}")
        bar.number_format = "0%"
        bar.font = font(size=9, color=C_DGREY)
        bar.fill = fill(row_bg); bar.alignment = align("center", "center")
        for cc in range(7, 14):
            ws.cell(r, cc).border = thin_border()

        ws.row_dimensions[r].height = 18
        toggle = not toggle
        r += 1

    # Totals row
    tr = r
    totals = [
        "TOTAL",
        f'=COUNTIFS({SA},{area_crit})',
        f'=COUNTIFS({SA},{area_crit},{HB},"Delivered")',
        f'=COUNTIFS({SA},{area_crit},{HB},"Pending")',
        f'=COUNTIFS({SA},{area_crit},{HB},"N/A")',
        f"=IFERROR(C{tr}/(C{tr}+D{tr}),0)",
    ]
    for j, v in enumerate(totals, start=1):
        c = ws.cell(tr, j, v)
        c.font      = font(bold=True, size=9, color=C_WHITE)
        c.fill      = fill(C_NAVY)
        c.alignment = align("center" if j > 1 else "left", "center")
        c.border    = thin_border()
        if j == 6:
            c.number_format = "0%"
    ws.merge_cells(start_row=tr, start_column=7, end_row=tr, end_column=13)
    bc = ws.cell(tr, 7, f"=F{tr}")
    bc.number_format = "0%"
    bc.font = font(bold=True, size=9, color=C_WHITE)
    bc.fill = fill(C_NAVY); bc.alignment = align("center", "center")
    for cc in range(7, 14):
        ws.cell(tr, cc).border = thin_border()
    ws.row_dimensions[tr].height = 20

    ws.conditional_formatting.add(
        f"F{first_feat_row}:F{tr-1}",
        DataBarRule(
            start_type="num", start_value=0,
            end_type="num",   end_value=1,
            color="63BE7B", showValue=True,
        ),
    )

    # Footer note
    fr2 = tr + 2
    ws.merge_cells(f"A{fr2}:M{fr2}")
    ws[f"A{fr2}"].value = (
        "Scope: rows where Area = 'Stablization' in the source sheet.  "
        "% Complete = Delivered ÷ (Delivered + Pending).  N/A items excluded.  "
        "Counts update live from the source sheet; re-run the script only if a "
        "new Feature value is added under this Area (to add its row here)."
    )
    ws[f"A{fr2}"].font      = font(size=8, color="7A7A7A")
    ws[f"A{fr2}"].alignment = align("left", "center", wrap=True)
    ws.row_dimensions[fr2].height = 26

    # ── Priority x Status matrix ──────────────────────────────────────────────
    pr = fr2 + 2
    if SP is not None:
        ws.merge_cells(f"A{pr}:M{pr}")
        c = ws.cell(pr, 1, "PRIORITY vs STATUS")
        c.font = font(bold=True, size=11, color=C_WHITE)
        c.fill = fill(C_ACCENT); c.alignment = align("left", "center")
        ws.row_dimensions[pr].height = 20
        pr += 1

        stab_priority = df_src.loc[
            df_src.get("Area", pd.Series(dtype=object)).astype(str).str.strip() == STAB_AREA_LABEL,
            "Priority",
        ]
        present_priorities = [p for p in PRIORITY_ORDER
                               if (stab_priority.astype(str).str.strip() == p).any()]
        pr = _draw_priority_status_matrix(ws, pr, SA, area_crit, SP, present_priorities)

        fr4 = pr + 2
        ws.merge_cells(f"A{fr4}:M{fr4}")
        ws[f"A{fr4}"].value = (
            "Scope: rows where Area = 'Stablization', grouped by the 'Priority' "
            "column. Counts update live from the source sheet; re-run the script "
            "only if a new Priority value is used (to add its row here)."
        )
        ws[f"A{fr4}"].font      = font(size=8, color="7A7A7A")
        ws[f"A{fr4}"].alignment = align("left", "center", wrap=True)
        ws.row_dimensions[fr4].height = 26
        fr2 = fr4

    # ── Daily progress (toward the 14-Aug-2026 deadline) ─────────────────────
    # Unlike everything above, this section is NOT a live formula — a
    # point-in-time capture can't be one (Excel has no way to ask "what was
    # Pending 3 days ago"). It's a historical log: literal numbers frozen at
    # the moment each regen runs, one row per calendar day, preserved across
    # runs by _extract_stab_daily_log() above. Re-running the same day
    # updates that day's row in place rather than adding a duplicate.
    today = (today if today is not None else pd.Timestamp.now()).normalize()

    # Scope this whole section to items that actually HAVE a plan to hit the
    # deadline — i.e. an ETA on or before 14-Aug. An item with no ETA, or an
    # ETA past the deadline, was never scheduled to land by then, so it must
    # not be smeared across the daily curve as if it were (that was the bug:
    # the previous version ramped ALL 61 items to 0 pending by 14-Aug, when
    # only a subset were ever actually scheduled that soon). Those items are
    # reported once, separately, below the table — not folded into "Pending".
    stab_all  = df_src[df_src.get("Area", pd.Series(dtype=object)).astype(str).str.strip() == STAB_AREA_LABEL]
    eta       = pd.to_datetime(stab_all.get("ETA", pd.Series(dtype="datetime64[ns]")), errors="coerce")
    in_plan   = eta.notna() & (eta <= STAB_DEADLINE)
    planned_etas   = eta[in_plan]
    unplanned_count = int(len(stab_all) - in_plan.sum())

    total     = int(in_plan.sum())
    delivered = int((stab_all["_bucket"][in_plan] == "Delivered").sum())
    pending   = int((stab_all["_bucket"][in_plan] == "Pending").sum())

    # Show every calendar date from the earliest known snapshot through the
    # deadline (not just days the script happened to be re-run on), so the
    # runway to 14-Aug is visible up front. Only today gets a live capture;
    # earlier real snapshots are preserved as-is; any day with no capture
    # (a skipped day, or a future day that hasn't arrived yet) stays blank —
    # never fabricated — and fills in for real once a regen actually runs on it.
    facts = dict(prior_facts)
    facts[today] = {"Total": total, "Delivered": delivered, "Pending": pending}
    range_start = min(facts.keys())
    full_dates = pd.date_range(range_start, STAB_DEADLINE, freq="D")

    # Planned Delivered(d) = how many of the ETA-scheduled items were due on
    # or before day d — a real cumulative schedule, not a smoothed ramp. This
    # only depends on ETA values (known for every day, past or future), so —
    # unlike Delivered/Pending — it never needs historical preservation; it's
    # recomputed fresh every run. If ETAs get edited later, the whole curve
    # (including past days) shifts to match, same as Total already does.
    log_rows = []
    last_known_delivered = None
    for d in full_dates:
        d_days_left   = max((STAB_DEADLINE - d).days, 0)
        planned_deliv = int((planned_etas <= d).sum())
        planned_pend  = total - planned_deliv

        if d in facts:
            f = facts[d]
            d_delivered, d_pending = f["Delivered"], f["Pending"]
            delivered_today = (d_delivered - last_known_delivered) if last_known_delivered is not None else "—"
            last_known_delivered = d_delivered
            d_pct  = round(d_delivered / (d_delivered + d_pending), 4) if (d_delivered + d_pending) else 0
            d_pace = d_pending if d_days_left == 0 else round(d_pending / d_days_left, 1)
            row = [
                d.to_pydatetime(), f["Total"], planned_deliv, d_delivered, planned_pend, d_pending,
                delivered_today, d_pct, d_delivered - planned_deliv, d_days_left, d_pace,
            ]
        else:
            row = [d.to_pydatetime(), None, planned_deliv, None, planned_pend, None,
                   None, None, None, d_days_left, None]
        log_rows.append(row)

    lr = fr2 + 2
    ws.merge_cells(f"A{lr}:M{lr}")
    lh = ws.cell(lr, 1, STAB_LOG_BANNER)
    lh.font = font(bold=True, size=11, color=C_WHITE)
    lh.fill = fill(C_ACCENT); lh.alignment = align("left", "center")
    ws.row_dimensions[lr].height = 20
    lr += 1

    for i, h in enumerate(STAB_LOG_HDR, start=1):
        c = ws.cell(lr, i, h)
        c.font      = font(bold=True, size=9, color=C_WHITE)
        c.fill      = fill(C_DGREY)
        c.alignment = align("center", "center", wrap=True)
        c.border    = thin_border()
    ws.row_dimensions[lr].height = 18
    lr += 1

    # column indices: 1 Date, 2 Total, 3 Planned Delivered, 4 Delivered,
    # 5 Planned Pending, 6 Pending, 7 Delivered Today, 8 % Complete,
    # 9 Ahead/Behind Plan, 10 Days Left, 11 Req. Pace/day
    for row in log_rows:
        has_actual = row[3] is not None
        for i, v in enumerate(row, start=1):
            c = ws.cell(lr, i, v if v is not None else ("—" if i > 1 else v))
            c.font      = font(size=9, color=C_DGREY)
            c.alignment = align("left" if i == 1 else "center", "center")
            c.border    = thin_border()
            if i == 1:
                c.number_format = "dd-mmm-yyyy"
            if i == 8 and has_actual:
                c.number_format = "0%"
            if i in (3, 5):
                c.fill = fill("DEEAF1")  # planned columns — pale blue, distinct from actual
            if not has_actual and i not in (1, 3, 5, 10):
                c.fill = fill("EDEDED")
            elif i == 4:
                c.fill = fill("E2EFDA"); c.font = font(bold=True, size=9, color="375623")
            elif i == 6:
                c.fill = fill("FFE3E6"); c.font = font(bold=True, size=9, color="9C0006")
            elif i == 9 and has_actual:
                ahead = v >= 0
                c.fill = fill("E2EFDA" if ahead else "FFE3E6")
                c.font = font(bold=True, size=9, color="375623" if ahead else "9C0006")
        ws.row_dimensions[lr].height = 16
        lr += 1

    # Items with no ETA (or an ETA past the deadline) were never scheduled
    # to land by 14-Aug — reported once here, not smeared across the daily
    # curve above.
    ws.merge_cells(start_row=lr, start_column=1, end_row=lr, end_column=2)
    uc = ws.cell(lr, 1, "Unplanned (no ETA / ETA beyond 14-Aug)")
    uc.font = font(bold=True, size=9, color="7F6000")
    uc.fill = fill("FFEB9C"); uc.alignment = align("left", "center")
    nc = ws.cell(lr, 3, unplanned_count)
    nc.font = font(bold=True, size=9, color="7F6000")
    nc.fill = fill("FFEB9C"); nc.alignment = align("center", "center")
    for cc in (1, 2, 3):
        ws.cell(lr, cc).border = thin_border()
    ws.row_dimensions[lr].height = 16
    lr += 1

    fr3 = lr + 1
    ws.merge_cells(f"A{fr3}:M{fr3}")
    ws[f"A{fr3}"].value = (
        f"Scope: only the {total} Stablization items with an ETA on or before "
        "14-Aug-2026 — that's the actual plan for this deadline. Planned "
        "Delivered/Pending = cumulative count of those items due on or before "
        "that day, from their real ETA dates (not a smoothed ramp); recomputed "
        "every run, so it shifts if ETAs or the item set change. Ahead/Behind "
        "Plan = Delivered − Planned Delivered for that day. The "
        f"{unplanned_count} item(s) with no ETA (or an ETA after 14-Aug) are "
        "listed above, not counted toward this deadline."
    )
    ws[f"A{fr3}"].font      = font(size=8, color="7A7A7A")
    ws[f"A{fr3}"].alignment = align("left", "center", wrap=True)
    ws.row_dimensions[fr3].height = 26

    return sheet_name


# ═════════════════════════════════════════════════════════════════════════════
# SECTION 4 — Plan sheets: 4 WEEK sheets + UNPLANNED + VRK  (STATIC)
#
# WEEK SHEETS (exactly four, client categories inside each):
#   📅 <last Mon>   — LAST WEEK      (ETA in current week - 1)
#   📍 <curr Mon>   — CURRENT WEEK   (ETA in current week; overdue section on top)
#   📅 <next Mon>   — NEXT WEEK      (ETA in current week + 1)
#   📅 Upcoming     — everything with ETA beyond next week
#
# Inside every sheet the items are grouped into CATEGORY_GROUPS sections
# (iWork incl. shared, IBP, Framework/DPDP/NFR) and sorted by Requested Date
# then ETA (blank Requested Date last).
#
# OVERDUE: pending items whose ETA-week is OLDER than last week appear in a red
# "Overdue" section at the top of the CURRENT week sheet. Delivered items with
# past ETAs outside the window are history and are dropped.
#
# UNPLANNED: pending items with NO ETA live in the 'Unplanned (no ETA)' sheet,
# sectioned by the same categories.
#
# VRK: rows whose Feature starts with "VRK - PROD Feedback:" go to the
# 'VRK Feedbacks' sheet only (broken up by week, not windowed) and are excluded
# from the week/unplanned views. They still count in the ① Executive Summary.
#
# ⚠️  All these sheets are STATIC snapshots — re-run the script to refresh.
# ═════════════════════════════════════════════════════════════════════════════

# Rows whose Feature begins with this prefix are VRK feedback items
VRK_PREFIX = "VRK - PROD Feedback:"

# Sort order — open/in-flight work first, delivered last
STATUS_ORDER = {
    "Yet to start":        1,
    "Dev - WIP":           2,
    "DEV - WIP":           2,
    "QA - WIP":            3,
    "Pre-PROD":            4,
    "Delivered - Deficit": 5,
    "Dev - Done":          6,
    "Delivered":           7,
    "Not a bug":           8,
    "Not in scope":        9,
    "Duplicate":           10,
}

# Client-facing categories: each entry is (section label, [modules in it]).
# Shared IBP/iWork items count under iWork per Nithin (13-Jul-2026).
CATEGORY_GROUPS = [
    ("iWork (Backlog & CRs)",            ["iWork", "iWork - CR", "IBP/iWork", "IBP/iWork - CR"]),
    ("IBP (Backlog & CRs)",              ["IBP", "IBP - CR"]),
    ("Framework (DPDP, NFR, Framework)", ["Framework", "DPDP", "NFR"]),
]

# ── Shared plan-row layout (week / unplanned / VRK sheets) ────────────────────
PLAN_COLS = [
    ("#",              4),
    ("Module",        13),
    ("Feature",       22),
    ("Functionality", 36),
    ("Status",        16),
    ("Milestone",     12),
    ("Requested",     12),
    ("ETA",           12),
    ("Resource",      12),
    ("Remarks",       26),
]
PLAN_LAST_COL = get_column_letter(len(PLAN_COLS))


def _plan_safe(v):
    return "" if v is None or (isinstance(v, float) and pd.isna(v)) else str(v)


def _add_buckets(df):
    """Add _bucket / _cat / _eta_str / _req / _req_str helper columns."""
    df["_bucket"] = df["Status"].apply(
        lambda s: STATUS_MAP.get(str(s).strip(), ("", "Unknown"))[1]
        if pd.notna(s) else "Unknown"
    )
    df["_cat"] = df["Status"].apply(
        lambda s: STATUS_MAP.get(str(s).strip(), ("Unknown", ""))[0]
        if pd.notna(s) else "Unknown"
    )
    df["_eta_str"] = df["ETA"].dt.strftime("%d-%b-%Y").fillna("")
    req = pd.to_datetime(df.get("Requested Date"), errors="coerce")
    df["_req"]     = req
    df["_req_str"] = req.dt.strftime("%d-%b-%Y").fillna("")
    return df


def _prepare_plan_items(df_src):
    """
    Shared selection for the week + unplanned views. Returns
    (items, current_week): Delivered + Pending, VRK excluded, with _week set.
    Unplanned = pending rows where _week is NaT.
    """
    df = _add_buckets(df_src.copy())
    df["_week"] = (
        df["ETA"] - pd.to_timedelta(df["ETA"].dt.dayofweek, unit="D")
    ).dt.normalize()

    feat = df["Feature"].astype(str).str.strip()
    df = df[~feat.str.startswith(VRK_PREFIX)]

    items = df[df["_bucket"].isin(["Delivered", "Pending"])].copy()

    today        = report_today()
    current_week = (today - pd.to_timedelta(today.dayofweek, unit="D")).normalize()
    return items, current_week


def _week_meta(wk, current_week):
    """(end_ts, banner_fill, banner_text_color, tag_label, tab_prefix) for a week."""
    end_ts = wk + pd.Timedelta(days=6)
    prev   = current_week - pd.Timedelta(days=7)
    nxt    = current_week + pd.Timedelta(days=7)
    if wk == current_week:
        return end_ts, C_GOLD,   C_DGREY, "CURRENT WEEK", "📍"
    if wk == prev:
        return end_ts, "B26A00", C_WHITE, "LAST WEEK",    "📅"
    if wk == nxt:
        return end_ts, C_NAVY,   C_WHITE, "NEXT WEEK",    "📅"
    if wk <  prev:
        return end_ts, "6B6B6B", C_WHITE, "PAST",         "📅"
    return end_ts, C_NAVY,   C_WHITE, "",             "📅"


def write_plan_header(ws):
    """Column widths + the row-5 header band + freeze panes (title lives above)."""
    for i, (_, w) in enumerate(PLAN_COLS, start=1):
        ws.column_dimensions[get_column_letter(i)].width = w
    for i, (h, _) in enumerate(PLAN_COLS, start=1):
        c = ws.cell(5, i, h)
        c.font      = font(bold=True, size=9, color=C_WHITE)
        c.fill      = fill(C_DGREY)
        c.alignment = align("center", "center", wrap=True)
        c.border    = thin_border(color="D0D0D0")
    ws.row_dimensions[5].height = 22
    ws.freeze_panes = "A6"


def write_plan_row(ws, row, seq, item, toggle):
    """Write one item row using PLAN_COLS; Status cell is colour-coded."""
    cat        = item.get("_cat", "Unknown")
    bg_s, tx_s = CAT_STYLES.get(cat, CAT_STYLES["Unknown"])
    base_bg    = "F0F4F8" if toggle else C_WHITE
    vals = [
        seq,
        _plan_safe(item.get("Module")),
        _plan_safe(item.get("Feature")),
        _plan_safe(item.get("Functionality")),
        _plan_safe(item.get("Status")),
        _plan_safe(item.get("Phase")),
        item.get("_req_str", ""),
        item.get("_eta_str", ""),
        _plan_safe(item.get("Resource")),
        _plan_safe(item.get("Remarks")),
    ]
    for j, v in enumerate(vals, start=1):
        c = ws.cell(row, j, v)
        c.font      = font(bold=True, size=8, color=tx_s) if j == 5 \
                      else font(size=8, color=C_DGREY)
        c.fill      = fill(bg_s) if j == 5 else fill(base_bg)
        c.alignment = align("left" if j in (3, 4, 10) else "center", "center",
                            wrap=(j in (4, 10)))
        c.border = thin_border(color="D0D0D0")
    ws.row_dimensions[row].height = 15
    return not toggle


def _title_banner(ws, text, bfill, btx):
    ws.merge_cells(f"A1:{PLAN_LAST_COL}2")
    ws["A1"].value     = text
    ws["A1"].font      = Font(name="Arial", bold=True, size=14, color=btx)
    ws["A1"].fill      = fill(bfill)
    ws["A1"].alignment = align("left", "center")
    ws.row_dimensions[1].height = 22
    ws.row_dimensions[2].height = 22


def _instruction_strip(ws, text):
    ws.merge_cells(f"A3:{PLAN_LAST_COL}3")
    ws["A3"].value     = text
    ws["A3"].font      = font(size=8, color="843C0C")
    ws["A3"].fill      = fill("FFF2CC")
    ws["A3"].alignment = align("left", "center")
    ws.row_dimensions[3].height = 14
    ws.row_dimensions[4].height = 6


def _band(ws, row, label, fill_hex):
    """A full-width coloured band row (category / section sub-headers)."""
    ws.merge_cells(f"A{row}:{PLAN_LAST_COL}{row}")
    c = ws.cell(row, 1, label)
    c.font      = Font(name="Arial", bold=True, size=10, color=C_WHITE)
    c.fill      = fill(fill_hex)
    c.alignment = align("left", "center")
    ws.row_dimensions[row].height = 18


def _sort_plan(df):
    """ETA then Requested Date, blanks last (ETA-first per client review flow)."""
    return df.sort_values(["ETA", "_req"], na_position="last")


def _write_category_sections(ws, r, items, seq_start=0):
    """Write CATEGORY_GROUPS sections for `items` starting at row r.
    Returns (next_row, next_seq)."""
    seq = seq_start
    grouped = {m for _, g in CATEGORY_GROUPS for m in g}
    sections = [(label, items[items["Module"].isin(mods)])
                for label, mods in CATEGORY_GROUPS]
    other = items[~items["Module"].isin(grouped)]
    if not other.empty:
        sections.append(("Other / Unassigned", other))

    toggle = True
    for label, csub in sections:
        if csub.empty:
            continue
        ndel = int((csub["_bucket"] == "Delivered").sum())
        npen = int((csub["_bucket"] == "Pending").sum())
        _band(ws, r, f"  {label}     ·     {len(csub)} item{'s' if len(csub) != 1 else ''}"
                     f"  ·  {ndel} delivered  ·  {npen} pending", C_NAVY)
        r += 1
        for _, item in _sort_plan(csub).iterrows():
            seq += 1
            toggle = write_plan_row(ws, r, seq, item.to_dict(), toggle)
            r += 1
    return r, seq


def build_weekly_sheets(wb, df_src):
    """Exactly four week sheets (last / current / next / upcoming), each with
    category sections sorted by Requested Date then ETA. Returns tab names."""
    items, current_week = _prepare_plan_items(df_src)
    prev_week = current_week - pd.Timedelta(days=7)
    next_week = current_week + pd.Timedelta(days=7)

    overdue = items[(items["_bucket"] == "Pending") & items["_week"].notna()
                    & (items["_week"] < prev_week)]

    sheets = [
        (prev_week,    items[items["_week"] == prev_week],    None),
        (current_week, items[items["_week"] == current_week], overdue),
        (next_week,    items[items["_week"] == next_week],    None),
        ("UPCOMING",   items[items["_week"].notna() & (items["_week"] > next_week)], None),
    ]

    created_tabs = []
    for wk, wk_items, ovd in sheets:
        ndel = int((wk_items["_bucket"] == "Delivered").sum())
        npen = int((wk_items["_bucket"] == "Pending").sum())

        if wk == "UPCOMING":
            tab, bfill, btx = "📅 Upcoming", "4A6741", C_WHITE
            title = (f"UPCOMING  (ETA beyond {next_week.strftime('%d %b')} week)"
                     f"   —   {len(wk_items)} items  ·  {ndel} delivered  ·  {npen} pending")
            flag = ""
        else:
            end_ts, bfill, btx, tagtxt, pfx = _week_meta(wk, current_week)
            tab = f"{pfx} {wk.strftime('%d-%b')}"
            n_ov = len(ovd) if ovd is not None else 0
            ovtxt = f"  ·  {n_ov} overdue" if n_ov else ""
            title = (f"WEEK OF {wk.strftime('%d %b %Y')}  →  {end_ts.strftime('%d %b %Y')}"
                     f"   —   {len(wk_items)} items  ·  {ndel} delivered  ·  {npen} pending"
                     f"{ovtxt}  ·  {tagtxt}")
            flag = f"  [{tagtxt}]"

        ws = wb.create_sheet(tab)
        ws.sheet_view.showGridLines = False
        write_plan_header(ws)
        _title_banner(ws, title, bfill, btx)
        _instruction_strip(
            ws,
            "⚠️  Static snapshot.  To update: edit STATUS/ETA in the source sheet, "
            "then re-run build_iirm_summary.py",
        )

        r, seq = 6, 0
        if ovd is not None and not ovd.empty:
            _band(ws, r, f"  ⚠  OVERDUE — ETA already passed     ·     "
                         f"{len(ovd)} item{'s' if len(ovd) != 1 else ''}", "9C0006")
            r += 1
            toggle = True
            for _, item in ovd.sort_values(["ETA", "_req"], na_position="last").iterrows():
                seq += 1
                toggle = write_plan_row(ws, r, seq, item.to_dict(), toggle)
                r += 1

        r, seq = _write_category_sections(ws, r, wk_items, seq)
        created_tabs.append(tab)
        print(f"  Built: {tab:14s} — {len(wk_items):3d} items "
              f"({ndel} deliv, {npen} pend)"
              + (f" + {len(ovd)} overdue" if ovd is not None and not ovd.empty else "")
              + flag)

    return created_tabs


def build_unplanned_sheet(wb, df_src):
    """Pending items with NO ETA, sectioned by CATEGORY_GROUPS.
    Within a category: status order then Requested Date. Returns tab or None."""
    items, _ = _prepare_plan_items(df_src)
    unplanned = items[(items["_bucket"] == "Pending") & items["_week"].isna()].copy()
    if unplanned.empty:
        print("  Unplanned       — none")
        return None

    unplanned["_sord"] = unplanned["Status"].map(
        lambda s: STATUS_ORDER.get(str(s).strip(), 99))

    tab = "Unplanned (no ETA)"
    ws  = wb.create_sheet(tab)
    ws.sheet_view.showGridLines = False
    write_plan_header(ws)
    _title_banner(
        ws,
        f"UNPLANNED — PENDING, NO ETA     ·     {len(unplanned)} items",
        "5D6D7E", C_WHITE,
    )
    _instruction_strip(
        ws,
        "Pending items with no ETA yet.  Assign an ETA in the source sheet to move "
        "an item into its week.  Static snapshot — re-run to refresh.",
    )

    grouped = {m for _, g in CATEGORY_GROUPS for m in g}
    sections = [(label, unplanned[unplanned["Module"].isin(mods)])
                for label, mods in CATEGORY_GROUPS]
    other = unplanned[~unplanned["Module"].isin(grouped)]
    if not other.empty:
        sections.append(("Other / Unassigned", other))

    r, toggle, seq = 6, True, 0
    for label, gsub in sections:
        if gsub.empty:
            continue
        gsub = gsub.sort_values(["_sord", "_req"], na_position="last")
        _band(ws, r, f"  {label}     ·     {len(gsub)} item"
                     f"{'s' if len(gsub) != 1 else ''}", C_NAVY)
        r += 1
        for _, item in gsub.iterrows():
            seq += 1
            toggle = write_plan_row(ws, r, seq, item.to_dict(), toggle)
            r += 1

    print(f"  Built: {tab:14s} — {len(unplanned)} unplanned items")
    return tab


def build_vrk_sheet(wb, df_src):
    """
    'VRK Feedbacks' sheet: every 'VRK - PROD Feedback:' row, broken up by week
    (ALL weeks — not windowed), each week sorted by status then ETA, with a
    'No ETA' section at the end. Excluded from other views; still counted in
    summaries. Returns tab name or None.
    """
    df = _add_buckets(df_src.copy())
    df["_week"] = (
        df["ETA"] - pd.to_timedelta(df["ETA"].dt.dayofweek, unit="D")
    ).dt.normalize()

    feat = df["Feature"].astype(str).str.strip()
    vrk  = df[feat.str.startswith(VRK_PREFIX)].copy()
    if vrk.empty:
        print("  VRK Feedbacks   — no matching rows, sheet skipped")
        return None

    vrk["_sord"] = vrk["Status"].map(lambda s: STATUS_ORDER.get(str(s).strip(), 99))
    today        = report_today()
    current_week = (today - pd.to_timedelta(today.dayofweek, unit="D")).normalize()

    ndel = int((vrk["_bucket"] == "Delivered").sum())
    npen = int((vrk["_bucket"] == "Pending").sum())

    tab = "VRK Feedbacks"
    ws  = wb.create_sheet(tab)
    ws.sheet_view.showGridLines = False
    write_plan_header(ws)
    _title_banner(
        ws,
        f"VRK — PROD FEEDBACK TRACKER     ·     {len(vrk)} items"
        f"  ·  {ndel} delivered  ·  {npen} pending",
        "5B2C6F", C_WHITE,
    )
    _instruction_strip(
        ws,
        "All 'VRK - PROD Feedback:' items, broken up by week (status then ETA "
        "within a week).  Excluded from the other views.  Static snapshot.",
    )

    def _vrk_week_subheader(row, wk, count):
        end_ts, bfill, btx, tagtxt, pfx = _week_meta(wk, current_week)
        ws.merge_cells(f"A{row}:{PLAN_LAST_COL}{row}")
        tag = f"   ·   {tagtxt}" if tagtxt else ""
        c = ws.cell(
            row, 1,
            f"  {pfx}  WEEK OF {wk.strftime('%d %b')} → {end_ts.strftime('%d %b %Y')}"
            f"{tag}     ·     {count} item{'s' if count != 1 else ''}",
        )
        c.font      = Font(name="Arial", bold=True, size=10, color=btx)
        c.fill      = fill(bfill)
        c.alignment = align("left", "center")
        ws.row_dimensions[row].height = 18

    r, toggle, seq = 6, True, 0
    weeks = sorted(vrk["_week"].dropna().unique())
    for wk in weeks:
        wk    = pd.Timestamp(wk)
        wsub  = vrk[vrk["_week"] == wk].sort_values(["_sord", "ETA"])
        _vrk_week_subheader(r, wk, len(wsub))
        r += 1
        for _, item in wsub.iterrows():
            seq += 1
            toggle = write_plan_row(ws, r, seq, item.to_dict(), toggle)
            r += 1

    noeta = vrk[vrk["_week"].isna()].sort_values("_sord")
    if not noeta.empty:
        _band(ws, r, f"  🗓  No ETA assigned     ·     {len(noeta)} item"
                     f"{'s' if len(noeta) != 1 else ''}", "7F8C8D")
        r += 1
        for _, item in noeta.iterrows():
            seq += 1
            toggle = write_plan_row(ws, r, seq, item.to_dict(), toggle)
            r += 1

    print(f"  Built: {tab:14s} — {len(vrk)} VRK items in {len(weeks)} week(s)"
          f" + {len(noeta)} no-ETA ({ndel} deliv, {npen} pend)")
    return tab





# ═════════════════════════════════════════════════════════════════════════════
# MAIN
# ═════════════════════════════════════════════════════════════════════════════

def main(input_file, output_file, asof=None):
    global ASOF
    ASOF = pd.Timestamp(asof).normalize() if asof else None
    print(f"Input  : {input_file}")
    print(f"Output : {output_file}")
    print(f"As of  : {report_today():%d-%b-%Y}" + ("" if asof else " (today)"))

    # Copy source file — keeps original untouched, source sheet stays as-is
    shutil.copy(input_file, output_file)

    # Load for analysis (data_only to read actual values)
    df_src = pd.read_excel(input_file, sheet_name=SOURCE_SHEET)
    print(f"Rows in source: {len(df_src)}")

    # Derive Delivery bucket from Status for analysis
    df_src["_bucket"] = df_src["Status"].apply(
        lambda s: STATUS_MAP.get(str(s).strip(), ("Unknown","N/A"))[1]
        if pd.notna(s) else "N/A"
    )
    deliv   = (df_src["_bucket"] == "Delivered").sum()
    pending = (df_src["_bucket"] == "Pending").sum()
    na      = (df_src["_bucket"] == "N/A").sum()
    print(f"  Delivered : {deliv}")
    print(f"  Pending   : {pending}")
    print(f"  N/A       : {na}")
    pct = round(deliv / (deliv + pending) * 100, 1) if (deliv + pending) else 0
    print(f"  Completion: {pct}%")

    # Determine which modules and milestones are actually present in the data
    present_mods = [m for m in MOD_ORDER if (df_src["Module"] == m).any()]
    present_ms   = [m for m in MILESTONES if (df_src["Phase"] == m).any()]
    print(f"Modules found : {present_mods}")
    print(f"Milestones    : {present_ms}")

    # Feature values present under the "Stablization" Area, for the dedicated
    # Stablization Summary sheet (sorted alphabetically — Feature is free text,
    # unlike Module, so there's no fixed canonical order to follow).
    stab_mask = df_src.get("Area", pd.Series(dtype=object)).astype(str).str.strip() == STAB_AREA_LABEL
    present_features = sorted(
        df_src.loc[stab_mask, "Feature"].dropna().astype(str).str.strip().unique()
    ) if "Area" in df_src.columns else []
    print(f"Stablization Features : {present_features}")

    # Open the copied file and add sheets
    wb = openpyxl.load_workbook(output_file)

    # Read the original-scope reference sheet BEFORE cleanup (if present) —
    # it's preserved below like the source sheet, so it survives re-runs.
    sow_actual_df = read_sow_actual_items(wb)
    if sow_actual_df is not None:
        print(f"SOW - Actual Items : {len(sow_actual_df)} reference rows")

    # Strip any sheets from a prior run — keep ONLY the source sheet (and the
    # SOW - Actual Items reference sheet, if present), so the input may itself
    # be a previously-generated file (idempotent re-runs) and we never
    # accumulate duplicate Helper/Config/Config1/Helper1 sheets.
    _keep = {SOURCE_SHEET, SOW_ACTUAL_SHEET, STAB_SUMMARY_SHEET}
    for _name in list(wb.sheetnames):
        if _name not in _keep:
            del wb[_name]
    print(f"Cleaned workbook — kept: {wb.sheetnames}")

    # Find last data row in source sheet
    ws_src   = wb[SOURCE_SHEET]
    last_row = ws_src.max_row
    while last_row > DATA_START_ROW and all(
        ws_src.cell(last_row, c).value in (None, "")
        for c in range(1, 8)
    ):
        last_row -= 1
    print(f"Source last row: {last_row}")

    # Build sheets
    build_config(wb)
    req_date_col = None
    for _c in ws_src[HEADER_ROW]:
        if _c.value and str(_c.value).strip().lower() in (
            "requested date", "request date", "requested", "req date"):
            req_date_col = _c.column_letter
            break
    print(f"Requested Date column : {req_date_col or 'not found'}")
    build_helper(wb, SOURCE_SHEET, last_row, req_date_col)

    # SOW scope comparison is now folded directly into the main Exec Summary
    # (no more separate compare sheet — merged in per Nithin, 25-Jul-2026).
    sow_stats = compute_sow_comparison(sow_actual_df, df_src, wb)
    build_executive_summary(wb, df_src, present_mods, present_ms, req_date_col,
                            sow_stats=sow_stats)
    stab_tab = build_stablization_summary(wb, df_src, present_features)
    if sow_stats is not None:
        mark_sow_actual_items(wb, sow_actual_df, df_src)
        print(f"Marked {sow_stats['sow_covered']} matched / {sow_stats['sow_mapped']} mapped-by-note / "
              f"{sow_stats['sow_open_gap']} open-gap row(s) in '{SOW_ACTUAL_SHEET}'")

    week_tabs   = build_weekly_sheets(wb, df_src)
    vrk_tab     = build_vrk_sheet(wb, df_src)
    unplan_tab  = build_unplanned_sheet(wb, df_src)

    # Set tab order: source first, exec summary, module sheets, milestone, helpers hidden
    desired_order = (
        [SOURCE_SHEET]
        + ["① Executive Summary", stab_tab]
        + week_tabs
        + ([unplan_tab] if unplan_tab else [])
        + ([vrk_tab] if vrk_tab else [])
        # 'SOW - Actual Items' is a reference/audit sheet, not client priority —
        # kept last among visible tabs per Nithin, 27-Jul-2026.
        + ([SOW_ACTUAL_SHEET] if sow_actual_df is not None else [])
        + ["Helper", "Config"]
    )
    wb._sheets.sort(
        key=lambda s: desired_order.index(s.title)
        if s.title in desired_order else 99
    )

    wb.save(output_file)
    print(f"\n✅  Saved → {output_file}")
    print("    Open in Excel/LibreOffice and update STATUS in the source sheet.")
    print("    All summary sheets will recalculate automatically.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build IIRM SOW Executive Summary")
    parser.add_argument("--input",  default=INPUT_FILE,  help="Path to source SOW Excel file")
    parser.add_argument("--output", default=OUTPUT_FILE, help="Path for output Excel file")
    parser.add_argument("--asof",   default=None,
                        help="Report 'as of' date, e.g. 10-July-2026. Anchors the banner, "
                             "week windows and intake rows. Defaults to today.")
    args = parser.parse_args()
    main(args.input, args.output, args.asof)
