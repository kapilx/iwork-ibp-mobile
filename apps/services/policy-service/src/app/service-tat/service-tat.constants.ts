export const SERVICE_TAT_MESSAGES = {
  MONTHLY_SUMMARY_SUCCESS: "Service TAT monthly summary retrieved successfully.",
  MONTHLY_DETAILS_SUCCESS: "Service TAT monthly service details retrieved successfully.",
};

export const SERVICE_TAT_ERRORS = {
  INVALID_MONTH_FORMAT: "Month must be provided in YYYY-MM format.",
  MONTHLY_SUMMARY_FAILED: "Unable to retrieve Service TAT monthly summary.",
  MONTHLY_DETAILS_FAILED: "Unable to retrieve Service TAT monthly details.",
  MISSING_USER_CONTEXT:
    "Unable to resolve Service TAT context for the current user.",
};

// Source-entity mapping for the Service Score summary-details calculation (IIRM-6282).
// Each entry's `serviceName` must match a `mstr_service.service_name` row exactly.
export const SERVICE_SCORE_CLAIM_STATUS = "SETTLED";
export const SERVICE_SCORE_MIR_PUBLISHED_STATUS = "published";
export const SERVICE_SCORE_QCR_ACTIVITY_NAME_PATTERN = "%QCR Generation%";
export const SERVICE_SCORE_MEETING_STATUS_COMPLETED_PATTERN =
  "%MEETING_STATUS_COMPLETED%";
export const SERVICE_SCORE_MEETING_TYPE_LOOKUP_KEYS = {
  MONTHLY: "MEETING_TYPE_MONTHLY",
  QUARTERLY: "MEETING_TYPE_QUARTERLY",
  MULTILATERAL: "MEETING_TYPE_MULTILATERAL",
} as const;

// Non-group endorsements (policy_asset_endorsement) treat "EXTENSION" type
// endorsements specially — see mir-report.service.ts's nonGroupEndorsementTatQuery,
// the validated precedent for this exact split.
export const SERVICE_SCORE_ENDORSEMENT_EXTENSION_TYPE = "EXTENSION";
export const SERVICE_SCORE_ENDORSEMENT_REQUEST_RECEIVED_STATUS =
  "ENDORSEMENT_REQUEST_RECEIVED";

// Health/Non-Health claim classification via policy_type_segregation ->
// lookup_data.value on irdai_policy_type_lid (IIRM-6282 TODO-2) — NOT a
// static policy_type_lid lookup_key allowlist (that approach, mirrored from
// mir-report.service.ts's HEALTH_KEYS/NON_HEALTH_KEYS, was rejected).
export const SERVICE_SCORE_HEALTH_POLICY_TYPE_VALUES = ["Health", "Life"];

export const SERVICE_SCORE_SERVICE_NAMES = {
  ENDORSEMENT: "Endorsement",
  HEALTH_CLAIMS: "Health Claims",
  NON_HEALTH_CLAIMS: "Non Health Claims",
  MIR: "MIR",
  QUARTERLY_MEETING: "Quarterly Meeting",
  MONTHLY_MEETING: "Monthly Meeting",
  MULTILATERAL_MEETINGS: "Multilateral Meetings",
  QCR_SUBMISSION: "QCR Submission",
} as const;
