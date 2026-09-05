// Response messages copied verbatim from HCL Interface Document v1.4
// (05-Feb-2024) sample OUTPUT Responses, per operation type / sub-case. Do
// not paraphrase these — HCL's HRMS is expected to swap only the endpoint
// URL, so the response text it already parses against must match exactly.

export const HCL_AD_MESSAGES = {
  // IS_EMCP=1, IS_EMPAD=1
  EMCP_ACTIVATED: "Employee EMCP activated successfully.",
  // IS_EMCP=0, IS_EMPAD=1
  GHMI_ACTIVATED: "Employee GHMI activated successfully.",
  // IS_EMCP=1, IS_EMPAD=0
  EMCP_DEACTIVATED: "Employee EMCP de-activated successfully.",
  // IS_EMCP=0, IS_EMPAD=0
  GHMI_DEACTIVATED: "Employee GHMI de-activated successfully.",
} as const;

export const HCL_BI_MESSAGES = {
  WITH_DEPENDENTS: "Employee and dependents successfully updated",
  WITHOUT_DEPENDENTS: "Employee details successfully updated",
} as const;

export const HCL_DD_MESSAGE = "Employee dependents deleted successfully";
export const HCL_ED_MESSAGE = "Employee deleted successfully."; 
export const HCL_ES_MESSAGE = "Employee deleted successfully.";
export const HCL_ET_MESSAGE = "Employee Transferred TO EMCP Successfully";
export const HCL_NA_MESSAGE = "Natural addition added successfully.";

export const HCL_INVALID_CREDENTIALS_MESSAGE = "Invalid credentials";

// Env var names for HCL's inbound credentials. Deliberately distinct from
// any future real-HCL secret name so swapping test creds for production
// ones later is a config change, not a code change.
export const HCL_ENV_USERNAME_KEY = "HCL_USERNAME";
export const HCL_ENV_PASSWORD_KEY = "HCL_PASSWORD";
