# [Feature Name] · PRD

**Module:** [JIRA-ID_Module-Name] | **Apps:** [iWork / IBP / Both] | **Date:** [YYYY-MM-DD] | **Status:** Draft

---

## Overview

<!-- 
  2–3 sentences. Answer: what is this feature, why does it exist, and who reads this doc?
  Do NOT describe how it will be built — that belongs in the TRD.
-->

---

## Roles

<!--
  Table of every user type that interacts with this feature.
  Columns: Role | System Identity | What they can do in this feature
-->

| Role | System Identity | Action |
|---|---|---|
| | | |

---

## Scope

### In Scope
<!--
  Bullet list of what this PRD covers. Be explicit — ambiguity here causes scope creep.
-->

### Out of Scope (Phase 1)
<!--
  Bullet list of what is deliberately excluded. "Deferred to Phase 2" is a valid reason.
  If something is excluded, say why — so reviewers don't re-raise it.
-->

---

## Lifecycle

<!--
  State machine diagram for this feature's core entity (e.g. Opportunity, Endorsement).
  Show states and transitions as a simple ASCII or mermaid flowchart.
  Follow each diagram with a table: State | Trigger | What happens
-->

```
State A → State B → State C
```

| State | Trigger | Behavior |
|---|---|---|
| | | |

---

## User Stories

<!--
  Format: US-[MODULE]-NNN
  Each story = one user goal. No implementation detail.
  Group by theme (Configuration / Enforcement / Notifications / etc.)
  Every story must trace to at least one Business Rule.

  Template per story:
    **US-[MODULE]-NNN**
    As a [role], I want [action] so that [outcome].
    - Traces to: BR-[MODULE]-NNN
-->

---

## Business Rules

<!--
  Format: BR-[MODULE]-NNN
  State the rule plainly. Include edge cases and concrete examples where needed.
  If a rule is TBD / pending stakeholder answer, mark it as such and reference the Open Question ID.

  Template per rule:
    **BR-[MODULE]-NNN — [Short rule title]**
    [Rule body. Edge cases. Examples.]
-->

---

## Acceptance Criteria

<!--
  Format: AC-[MODULE]-NNN (one per user story)
  Use Given / When / Then format only.
  These are the client sign-off criteria — be precise enough that a tester can verify them cold.

  Template per criterion:
    **AC-[MODULE]-NNN** (for US-[MODULE]-NNN)
    - Given [precondition]
    - When [action]
    - Then [expected outcome]
-->

---

## Data Contract

<!--
  What this feature reads from other modules and what it writes/produces.
  No implementation shapes (no column names, no API signatures) — that's the TRD's job.
  At the end, list any cross-module contracts that must be aligned before TRD begins.
-->

### Consumed

| Source Module | Data Needed | Purpose |
|---|---|---|
| | | |

### Produced

| Data | Who Consumes It |
|---|---|
| | |

### Cross-Module Contracts to Raise
<!--
  List any interfaces that require alignment with another module's TL before Stage 40b begins.
-->

---

## Open Questions

<!--
  Anything unresolved that blocks writing Acceptance Criteria or the TRD.
  Every TBD in this document should have a corresponding row here.
  These must be resolved before Stage 40b (TRD) begins.
-->

| ID | Question | Owner | Due |
|---|---|---|---|
| OQ-001 | | | |

---

## Approval

*Requires 2 sign-offs per Daksh manifest rules (weight class: large).*

```
Approved by:
Role:
Date:

Approved by:
Role:
Date:
```

---

*Stage 40a — /daksh prd. Resolve all Open Questions before TRD (Stage 40b) begins.*
