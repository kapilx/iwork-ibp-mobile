# Daksh ↔ Jira Sync Setup — new-insurance-wellness-hub

**Project** : IIRM Holdings (Jira project key `IIRM`)
**Owner**   : Nithin / Divami
**Purpose** : Get `/daksh jira push|pull|status` working for this repo, so
Jira ticket status stays reflected in `docs/implementation/*/tasks.md`.

---

## Credentials — auto-loaded via direnv

**Decision (2026-07-28): build a standing VS Code ↔ Jira ↔ Claude handshake,
not one-off pushes.** No `/daksh jira push` has been run — this section
covers the infrastructure only.

| Var | Value |
|---|---|
| `JIRA_SERVER` | `https://divami.atlassian.net` |
| `JIRA_EMAIL` | `nithin@divami.com` |
| `JIRA_TOKEN` | set locally in `.env.jira` — never pasted into chat/committed |

Setup:
- `direnv` installed via Homebrew; hook added to `~/.zshrc`
  (`eval "$(direnv hook zsh)"`).
- `.envrc` (repo root) → `dotenv .env.jira`. Already `direnv allow`-ed.
- `.env.jira` (repo root) holds the three vars — **covered by the existing
  `.env*` line in `.gitignore`**, confirmed via `git check-ignore`.
- Any terminal (including VS Code's integrated terminal) opened in this
  repo now has all three vars set automatically — no manual `export` needed.
- `jira` Python package (v3.10.5) installed into `.venv` — required by
  `jira-sync.py`'s `make_client()` for real push/pull (not needed for
  `--dry-run`).

**Manual step still pending:** the token used to verify auth earlier
(2026-07-28) was pasted directly into the Claude chat transcript, so it
should be treated as burned. Generate a **fresh** token at
https://id.atlassian.com/manage-profile/security/api-tokens, paste it
directly into `.env.jira` (never into chat), then revoke the old one from
the same page.

---

## Manifest config (`docs/.daksh/manifest.json` → `jira`)

```json
{
  "project_key": "IIRM",
  "board_id": null,
  "ticket_map": {},
  "user_map": {},
  "workflow_preset": "divami-engineering-jira-standard"
}
```

`project_key` is already set. `board_id` is **required** by
`jira-sync.py` before push/pull will even dry-run (`validate_jira_manifest`
checks it unconditionally). It controls which board's **sprints** get
used when a task has a `Sprint` field — epics/stories go to the project
regardless of board.

### Boards found under project IIRM

| id | name | type | team | closed sprints | notes |
|---|---|---|---|---|---|
| 434 | IIRM board | scrum | — | 48 | identical sprint data to 764 |
| **764** | **IIRM-Dev** | scrum | **main board** | 48 | full history, all the way back |
| 2131 | IIRM-NFR | scrum | NFR team | 9 | team-specific backlog |
| 2164 | IIRM-IBP | scrum | IBP team | 11 | team-specific backlog, 83 issues currently on board |
| 2263 | IIRM-Backlog | scrum | Backlog team | 23 | team-specific backlog |

**Decided: `board_id = 764`** (IIRM-Dev), confirmed by the team as
**the main board**. 2131/2164/2263 are dedicated per-team backlogs
(NFR / IBP / Backlog teams respectively) — not the right scope for a
project-wide sync. 434 carries identical sprint data to 764 but isn't
the one the team actually treats as canonical. Set in
`docs/.daksh/manifest.json` on 2026-07-28.

---

## Modules registered vs. tasks.md present

`manifest.modules` (18 tracked) vs. `docs/implementation/*/tasks.md`:

- **`EXTHR`** has a `tasks.md` but is **not** in `manifest.modules` — will
  be silently skipped by push/pull until added.
- **`ibp-service`** is registered but has **no top-level `tasks.md`** —
  its actual work lives in subfolders (`hr-analytics`, `enrollment-status`,
  etc.). Pushing it today creates an empty epic only.

---

## Known gap in the sync script

`push` writes new Jira keys into `manifest.json → jira.ticket_map`
**only** — it does not write the ticket key back into `tasks.md`.
`pull` is the one that touches `tasks.md`, and only the `Status` column.
If ticket keys should be visible inline in the docs, `update_tasks_md()`
in `scripts/jira-sync.py` needs a small extension — not done yet.

---

## Next steps

1. ~~Confirm board id → set `manifest.jira.board_id`.~~ Done (434).
2. `export JIRA_SERVER=... JIRA_EMAIL=... JIRA_TOKEN=...` in your shell.
3. `/daksh jira push --dry-run` to preview.
4. `/daksh jira push` for real.
5. `/daksh jira pull` going forward to keep `tasks.md` Status columns current.
