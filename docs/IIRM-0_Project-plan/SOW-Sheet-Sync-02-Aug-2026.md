# SOW Sheet Sync — 02-Aug-2026 (main file <- _Latest)

Sheet: `SOW, Feedbacks-Bug & CR_Items`. Compared row-by-row (matched by
Module + Feature + Functionality, not by row position, since the two files
have diverged in row order) against `_Latest.xlsx` (which has no Jira ID
column, and a header typo — column F is literally labeled "Phase" a second
time in that file, though the data in it is clearly Status values) and
patched the main file's columns A-J with the newer values from `_Latest`,
keeping the Jira ID column (K) untouched throughout.

`_Latest.xlsx`'s data is considered current as of 02-Aug-2026 per Nithin.
The regenerated summary sheets, however, are anchored with `--asof
31-Jul-2026` per his explicit instruction — finalizing this file under its
own date identity despite the newer underlying data.

## Matching approach

350 data rows in `_Latest`, all 350 matched to a row in the main file (no
genuinely new rows). 354 data rows in the main file — 4 have no match in
`_Latest` at all (see "Orphan rows" below). Positional (same row index)
alignment only held for 281/350 rows; the rest had shifted because rows
were inserted/removed at different points in each file's history, so
content-based matching was necessary to avoid mis-patching the wrong row.

## Changes applied (51 field updates across 38 rows)

Mostly natural progression: Status moving forward (e.g. "Dev - WIP" →
"Pre-PROD" or "Delivered"), ETA dates pushed out (mostly to 03-Aug-2026 or
07-Aug-2026), one Resource reassignment (row 296, Manjusha → Jagadeesh), a
Remarks trim (row 79), and a batch of Area relabels from "DPDP" to
"Framework: DPDP" across ~13 DPDP-module rows (134–145, 161–163) — a
systematic, apparently intentional recategorization, not spot edits.

## Diffs found but NOT applied (3 field-level exclusions)

- **Row 257 (Security)**: `_Latest` clears the ETA (10-Jul-2026 → blank),
  but the item is already Status = "Delivered" in both files. A blank ETA
  on a completed item serves no purpose and looks like a gap in the
  `_Latest` export rather than an intentional edit — kept the main file's
  original value (10-Jul-2026).
- **Rows 116 and 348**: the only "difference" flagged was a trailing
  newline character at the end of the Functionality text in `_Latest` —
  not a real content change, left as-is.

## Orphan rows (in main file, not in `_Latest` — left untouched)

| Row | Feature | Notes |
|---|---|---|
| 343 | Application Performance (IIRM-10799) | Same orphan as the 31-Jul-2026 sync — confirmed by Nithin (2026-07-28) to stay, no change. |
| 349 | VRK - PROD Feedback: 13-Jul-2026 (Enhanced screen: My Client Portfolio) | New since the last sync — added to the main file after `_Latest` was exported. |
| 354 | Manage Insurer (Insurer-branch-edit) | Same as above. |
| 355 | BizDone - Data Updates | Same as above. |

## Other changes in this update

- **New sheet added**: `Stablization Items` (28 rows × 10 cols, formatting
  preserved) — copied as-is from `_Latest.xlsx` per Nithin, no content
  changes.
- **`Jira Report` and `Stablization Items` re-added after the regen** —
  `build_iirm_summary.py` only preserves the source sheet and `SOW - Actual
  Items` across a rebuild; both were stripped by the regen and manually
  restored afterward (Jira Report: header row only, no data yet;
  Stablization Items: full re-copy from `_Latest`).
- Summary sheets regenerated with `--asof 31-Jul-2026`: 78.0% completion
  (276 delivered / 78 pending of 354 rows).
