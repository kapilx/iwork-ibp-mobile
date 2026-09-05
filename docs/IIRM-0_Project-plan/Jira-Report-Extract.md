# Jira Report Extract

## Purpose

Populates the **`Jira Report`** sheet in the current dated
`IIRM_SOW_Executive_Summary_<date>.xlsx` working file (default:
`IIRM_SOW_Executive_Summary_07-Aug-2026.xlsx` — update `DEFAULT_EXCEL` in
the script each time a new dated file becomes the working copy) with a
general-purpose, on-demand extract of Jira issues — separate from (and
unrelated in mechanism to) the `Jira ID` column matching effort documented
in `Jira-ID-Matching-Log.md`. That other effort links specific SOW tracker
rows to specific Jira issues by hand-verified content matching. This one is
a straight, mechanical pull of whatever issues match a JQL filter you give
it, run via the standalone script `jira_report_extract.py`.

**Scope guard: frozen files are never touched.** The script refuses to run
against any file with "24-Jul-2026" in its name — that frozen file must
never be modified. Pass `--file` to target a specific dated file.

## Columns and their Jira source

| Column | Jira source field | Rule |
|---|---|---|
| **Sl. #** | *(not from Jira)* | Plain sequential number, assigned once per unique Jira ID the first time it's added. Stable across re-runs — existing rows keep their number. |
| **Jira ID** | `key` | The issue key exactly as Jira shows it (e.g. `IIRM-8015`). Used as the match key for incremental updates. |
| **Issue Type** | `issuetype.name` | Work item type name. Lookup — see below. |
| **Summary** | `summary` | Free text, the issue title, as-is. |
| **Status** | `status.name` | Raw status name (not the To Do/In Progress/Done category). Lookup — see below. |
| **Reporter** | `reporter.displayName` | Reporter's display name. Not a fixed list — any project member. |
| **Product** | `customfield_10228` | Custom radio-button field. Lookup — see below. |
| **Parent** | `parent` | Formatted as `"<Key> — <Summary>"`. This is the direct parent link (Epic, for most Stories/Tasks/Bugs; parent task, for Sub-tasks). Blank if the issue has no parent (typically Epics). |

## Lookup values

**Issue Type** — authoritative, pulled directly from the project's
issue-type configuration (17 total, as of 30-Jul-2026):
Epic, Story, Task, Bug, Sub-task, Design Sub Task, QAlity Test, Risk,
CR - Subtask, Extension - Subtask, Clarification, Process, Process Sub Task,
CR - Story, Build Certification Testing, NFR, NFR - Subtask

**Product** — authoritative, pulled directly from the field's configured
options (closed list, 4 values):
Framework, iWork, IBP, None

**Status** — **not authoritative** — observed across all 7,958 issues in
the project as of the 03-Aug-2026 full extract, but different issue types
use different workflows, and new statuses can still be added later. Treat
it as a starting point to validate against, not a closed set:
Done, Draft, Open, Completed, WORK IN PROGRESS, Done - Not Reproducible,
PENDING PEER or LEAD REVIEW, Pushed to Backlog, Ready for QA, Reopen, To Do,
Done - Not a Bug, SELF TESTED, Duplicate, QA in Progress, Maintenance,
QA Verified, EXTERNAL REVIEW PENDING, On Hold, RELEASED, QA Failed,
Passed in QA, Not - Reproducible, In Progress, Pushed to UAT, Blocked,
Development in Progress, Internal Review Pending, UAT Client Certified,
Test on Staging

## How to run

From the repo root (direnv auto-loads `JIRA_SERVER`/`JIRA_EMAIL`/`JIRA_TOKEN`
from `.env.jira` — see `Jira-Sync-Setup.md`):

```bash
# Incremental (default): pulls only issues updated since the last extract below,
# matching your JQL filter. Safe to re-run any time.
.venv/bin/python3 docs/IIRM-0_Project-plan/jira_report_extract.py \
    --jql 'project = IIRM AND labels = "IBP"'

# Full pull: ignores the last-extract timestamp, gets everything matching --jql.
# Use for the first run, or whenever you want to force a full refresh.
.venv/bin/python3 docs/IIRM-0_Project-plan/jira_report_extract.py \
    --jql 'project = IIRM AND labels = "IBP"' --full
```

Existing rows (matched by Jira ID) get their Issue Type/Summary/Status/
Reporter/Product/Parent refreshed in place. New issues get appended with
the next Sl. #. Nothing already in the sheet is ever deleted by this script.

**Auth note:** the token in `.env.jira` was flagged in `Jira-Sync-Setup.md`
as burned (pasted into a chat transcript on 2026-07-28) with rotation still
pending as of that writing. If the script fails with a 401, generate a
fresh token at https://id.atlassian.com/manage-profile/security/api-tokens,
update `.env.jira` directly (never paste it into chat), and revoke the old
one from the same page.

## Last extract

2026-08-03T14:12:57+0530
