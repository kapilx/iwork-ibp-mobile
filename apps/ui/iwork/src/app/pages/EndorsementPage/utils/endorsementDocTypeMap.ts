import { endPoints } from "@ui/ui-lib";

export type DocTypeKey =
  | "policy_employee_enrollment_data"
  | "policy_employee_data"
  | "policy_employee_dependent_data"
  | "policy_employee_data_with_benefits"
  | "policy_asset_enrollment_data"
  | "policy_extension"
  | "policy_employee_bypass_enrollment"
  | "policy_endorsement_member_upload";

export const endorsementDocTypeMap: Record<
  DocTypeKey,
  {
    label: string;
    download: (policyId: number, endorsementType?: string) => string;
    process: (policyId: number) => string;
  }
> = {
  policy_employee_enrollment_data: {
    label: "Employee + Dependents Data with Insurance Benefits",
    download: (id) => endPoints.downloadEmployeeEnrollmentTemplate(id),
    process: (id) => endPoints.processEmployeeData(id),
  },
  policy_employee_data: {
    label: "Only Employee Data",
    download: (id) => endPoints.downloadEmployeeDataTemplate(id),
    process: (id) => endPoints.processEmployeeData(id),
  },
  policy_employee_dependent_data: {
    label: "Employee and Dependents Data",
    download: (id) => endPoints.downloadEmployeeDataTemplate(id),
    process: (id) => endPoints.processEmployeeData(id),
  },
  policy_employee_data_with_benefits: {
    label: "Employee Data with Insurance Benefits",
    download: (id) => endPoints.downloadEmployeeDataTemplate(id),
    process: (id) => endPoints.processEmployeeData(id),
  },
  policy_asset_enrollment_data: {
    label: "Asset + Sub Asset Data with Insurance Benefits",
    download: (_id) => endPoints.downloadAssetAndSubAssetEnrollmentTemplate(),
    process: (id) => endPoints.processAssetEnrollmentData(id),
  },
  policy_extension: {
    label: "Policy Extension",
    download: (id) => endPoints.downloadPolicyExtensionTemplate(id),
    process: (id) => endPoints.processPolicyExtension(id),
  },
  policy_employee_bypass_enrollment: {
    label: "Employee Details with Premiums",
    download: (id, endorsementType) =>
      endPoints.downloadBypassEnrollmentTemplate(id, endorsementType),
    process: (id) => endPoints.processEmployeeData(id),
  },
  policy_endorsement_member_upload: {
    label: "Member Data Upload",
    download: (id) => endPoints.downloadEmployeeEnrollmentTemplate(id),
    process: (id) => endPoints.processEmployeeData(id),
  },
};
