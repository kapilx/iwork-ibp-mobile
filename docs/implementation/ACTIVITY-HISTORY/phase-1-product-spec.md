# PRD - Phase 1

## 1. Module Overview

- **Purpose:** Provide a unified, chronological log of key user and system activities across the Insurance Wellness Hub.
- **Business Value:** Improves transparency, support efficiency, and compliance by making high-impact actions traceable and easy to audit.
- **User Value:** Gives users and HR visibility into what happened, when, and where, reducing confusion and helping resolve issues quickly.
- **Module Type:** Core
- **Phase 1 Scope:** Core tracking and contextual metadata for the activities listed below, with basic filters and standardized display.

## 2. Scope & Boundaries

- **In Scope:**
    - Capture and display the following activities with timestamps, actor, and contextual metadata: Signed in, Logged in, Dependents add (saved), Choices selected (saved), Enrolment submitted, Documents viewed, Documents downloaded, Claim initiated, Claim submitted, Claim tracking view, Scheduled Callback request, Contacted support, Enrolment status viewed, Claim Summary viewed.
    - Filters: activity type and date range.
    - Linking to source module identifiers (policy ID, claim ID, document name).

- **Dependencies:**
    - Auth-service (user identity and sessions), IBP-service (enrolment, dependents, choices), Document-service (documents), Claim-service (claims), Notification/Support service (scheduled callbacks, support contact events).
- **Dependents:**
    - Support tools, HR portal views, and potential  modules in later phases.

## 3. User Personas & Contexts

- **Persona:** Employee
    - **Goals:** Verify recent actions (login, enrolment, claims, documents).
    - **Context:** During enrolment periods, claims journeys, and document review.
    - **Pain Points:** Uncertainty about whether actions were saved or submitted.

- **Persona:** HR/Admin
    - **Goals:** Troubleshoot employee issues using activity evidence.
    - **Context:** Responding to tickets and audits.
    - **Pain Points:** Lack of consolidated activity view across modules.

## 4. User Stories

### Employee
- **US-ACTIVITY-HISTORY-001:** As an employee, I want to see a timeline of my recent activities so that I can confirm my actions were recorded.
  - **Priority:** High
  - **Acceptance Criteria:**
    - Given I am logged in, when I open Activity History, then I see a chronological list with timestamp, activity type, and context.
    - Given activities exist, when I filter by date range, then only activities in the range are shown.

- **US-ACTIVITY-HISTORY-002:** As an employee, I want document view/download entries to include the document name so that I know exactly what I viewed or downloaded.
  - **Priority:** High
  - **Acceptance Criteria:**
    - Given I view any supported document, when I open Activity History, then an entry appears as “{Document Name} viewed” with timestamp.
    - Given I download any supported document, when I open Activity History, then an entry appears as “{Document Name} downloaded” with timestamp.

- **US-ACTIVITY-HISTORY-003:** As an employee, I want enrolment-related activities to show whether I saved dependents/choices or fully submitted enrolment so that I can distinguish incomplete vs complete actions.
  - **Priority:** High
  - **Acceptance Criteria:**
    - Given I save dependents without submission, when I open Activity History, then an entry “Dependents saved” appears with count.
    - Given I save choices without submission, when I open Activity History, then an entry “Choices saved” appears with selected options summary.
    - Given I submit enrolment, when I open Activity History, then an entry “Enrolment submitted” appears with the submission timestamp.

## 5. Functional Requirements

- **FR-ACTIVITY-HISTORY-001:** Log authentication events (Signed in, Logged in) with timestamp and user ID.
  - **Module Context:** Source from auth-service session lifecycle.

- **FR-ACTIVITY-HISTORY-002:** Log enrolment preparation events (Dependents saved, Choices saved) with counts and options summary.
  - **Module Context:** Source from IBP-service enrolment flows prior to submission.

- **FR-ACTIVITY-HISTORY-003:** Log enrolment submission events with submission timestamp and enrolment context.
  - **Module Context:** Source from IBP-service when enrolment transitions to submitted.

- **FR-ACTIVITY-HISTORY-004:** Log document interactions with document name and action (viewed/downloaded).
  - **Module Context:** Source from document-service with supported document types.

- **FR-ACTIVITY-HISTORY-005:** Log claim events (initiated, submitted, tracking view) with claim ID, policy type, and status.
  - **Module Context:** Source from claim-service flows.

- **FR-ACTIVITY-HISTORY-006:** Log support interactions (Scheduled Callback request, Contacted support) with channel/reference ID.
  - **Module Context:** Source from notification/support services.

- **FR-ACTIVITY-HISTORY-007:** Provide retrieval API supporting filters by activity type and date range.
  - **Module Context:** Activity History service endpoint aggregates activity entries across modules.

## 6. Business Rules & Logic

- **BR-ACTIVITY-HISTORY-001:** Enrolment submitted supersedes prior draft actions as the definitive state.
  - **Example:** If dependents and choices are saved and then enrolment is submitted, show “Enrolment submitted” reflecting completion.
  - **Edge Cases:** If a user saves dependents/choices but never submits, only saved actions appear.

- **BR-ACTIVITY-HISTORY-002:** Document interactions must use standardized labels.
  - **Example:** “Policy Feature viewed” or “TPA Cards downloaded”.
  - **Edge Cases:** Unsupported document types are ignored in Phase 1.

- **BR-ACTIVITY-HISTORY-003:** Claims entries include reference metadata.
  - **Example:** “Claim initiated” with claim ID and policy type.
  - **Edge Cases:** If claim ID unavailable, log with placeholder and mark incomplete.

## 7. User Interface Requirements

- **Screen/Page:** Activity History
  - **Purpose:** Display a chronological list of activities with metadata.
  - **Key Elements:** Filters (type, date range), timeline list, activity badges, metadata snippets.
  - **User Flow:** Open Activity History → optionally set filters → view list → click-through to source module (Phase 1 may include IDs without navigation).
  - **Validation Rules:** Date range selection must be valid; activity type must be from supported set.

## 8. Data Requirements

- **Input Data:**
  - From auth-service: session events.
  - From IBP-service: dependents/choices saved events; enrolment submission events.
  - From document-service: view/download events with document name.
  - From claim-service: initiation/submission/tracking view events.
  - From support/notification: callback requests; contacted support events.
- **Output Data:**
  - Aggregated activity entries via Activity History API (JSON): id, timestamp, userId, type, label, context.
- **Stored Data:**
  - Activity entries persisted with audit trail; retention aligned to compliance (Phase 1: minimum 12 months; configurable later).

## 9. Integration Specifications

- **APIs/Interfaces:**
  - Ingest endpoints or event listeners per source service; or periodic fetch where events are not emitted.
  - Retrieval endpoint: `GET /activity-history?userId=&type=&from=&to=`.
- **Events:**
  - Subscribe to source services’ event topics where available; otherwise, capture via service hooks.
- **Data Flow:**
  - Source service emits/calls → Activity History stores normalized entry → UI retrieves via filters.
- **Error Handling:**
  - If a source event lacks required metadata, store with status “incomplete” and display minimal label.

## 10. Performance & Quality Requirements

- **Performance:** Page loads under 2 seconds for last 90 days of activities; retrieval API returns within 1 second for typical queries.
- **Reliability:** 99.9% retrieval API uptime.
- **Security:** Enforce authorization—users see only their activities; admins require scoped access.
- **Usability:** Clear labels and consistent metadata formatting; accessible timeline view.

## 11. Success Metrics

- **Business Metrics:** Reduced support resolution time due to clear activity traces.
- **User Metrics:** % of users who view Activity History during enrolment/claims; reduction in “status unclear” tickets.
- **Technical Metrics:** API latency, ingestion success rate, event completeness ratio.
- **Adoption Metrics:** Usage rate of filters; activity views per active user.

## 12. Edge Cases & Error Scenarios

- **Error Case 1:** Missing claim ID.
  - **User Experience:** Show entry with generic label and note “ID unavailable”.
  - **System Behavior:** Store as incomplete; attempt reconciliation later.
- **Edge Case 1:** Multiple document views of same type.
  - **Business Logic:** Log each view with timestamp; deduplication not applied in Phase 1.
  - **User Impact:** Timeline shows separate entries.
- **Edge Case 2:** Saved but abandoned enrolment.
  - **Business Logic:** Show saved entries only; no submitted entry.
  - **User Impact:** User can infer incomplete state.

## 13. Future Considerations

- **Enhancement 1:** Analytics dashboard (counts, trends, nudges for incomplete enrolments).
- **Enhancement 2:** Admin export and cross-user query tools.

## 14. Acceptance Criteria Summary

- [ ] All user stories implemented and tested
- [ ] All business rules enforced
- [ ] Integration points working as specified
- [ ] Performance requirements met
- [ ] Security requirements implemented
- [ ] Success metrics tracking in place

## 15. Open Questions

- **Question 1:** Should Activity History include navigation links to source modules in Phase 1 or only display IDs?
- **Question 2:** What is the definitive retention policy per tenant for audit entries (beyond 12 months)?
