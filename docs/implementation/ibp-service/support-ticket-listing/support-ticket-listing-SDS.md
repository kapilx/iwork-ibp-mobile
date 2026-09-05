# Support Ticket Listing — Software Design Specification (SDS)

**Document Version:** 2.0
**Date:** 2026-05-19
**Author:** IIRM Engineering Team
**Jira Reference:** TBD
**Related Documents:**
- PRD: `support-ticket-listing-PRD.md`
- TRD: `support-ticket-listing-TRD.md`

---

## 1. Intentionally minimal

This feature has no UI scope in this spec batch. Both consuming surfaces are owned outside the documents in this folder:

| Surface | Status | Owner |
| --- | --- | --- |
| HR Portal — "Support Tickets" screen | Already built and merged on the user's branch. Will go live the moment the backend seed (TASK-STL-002) is applied. | User's branch |
| Employee Portal — "My Raised Tickets" listing | Out of spec scope. The data is already being fetched in `SupportPage` for verification; the rendering layer is handled outside this batch. | Outside this spec |

Because no new components are designed in this batch, this SDS does not describe layouts, columns, filter UX, pagination affordances, or visual states. The PRD captures the business intent at the capability level, and the TRD captures the backend contract that both UIs (existing and future) consume.

If a future iteration introduces a new UI surface or alters either consumer significantly, this SDS should be replaced — not appended to — so the document does not drift from reality.

---

## 2. API contracts the UIs depend on

Both consumers depend only on the API contracts defined in the TRD. There is no SDS-layer prescription on how those contracts are rendered.

| Consumer | Endpoint | TRD ref |
| --- | --- | --- |
| Employee Portal | `GET /company-employee/:employeeId/tickets` | TRD §2 |
| HR Portal | `POST /hr-module/generate/hr_support_tickets` | TRD §3 |

Any change to the response envelope, filter parameters, or pagination semantics of either endpoint must come through a [change record](../../../.daksh) and be reflected in the TRD before either consumer is updated.

---

## 3. Change log

| Version | Date | Author | Notes |
| --- | --- | --- | --- |
| 1.0 | 2026-05-19 | IIRM Engineering | Initial draft covering Employee and HR Portal UI layouts. |
| 2.0 | 2026-05-19 | IIRM Engineering | Reduced to a stub. UI work for both portals moved outside this spec batch. |
