import { environment, FormFieldConfig } from "@ui/ui-lib";
import dayjs from "dayjs";
import {
  BYPASS_ENROLLMENT_TEMP_NUM,
  ENROLLMENT_TEMP_NUM,
  MEMBER_UPLOAD_TEMP_NUM,
  TEMP_NUM,
} from "../../../constants";
import { endorsementDocTypeMap } from "../utils/endorsementDocTypeMap";

const { FF_IWORK_ENROLMENT_PREMIUM_BASED } = environment.featureFlag;

export const getEndorsementDataUploadConfig = (
  isEnrolmentPremiumBased = false,
  showMemberDataUpload = false
): FormFieldConfig[] => {
  const documentTypeOptions = showMemberDataUpload
    ? [
        {
          value: MEMBER_UPLOAD_TEMP_NUM,
          label: endorsementDocTypeMap.policy_endorsement_member_upload.label,
        },
      ]
    : ([
        !isEnrolmentPremiumBased && {
          value: TEMP_NUM,
          label: endorsementDocTypeMap.policy_employee_enrollment_data.label,
        },
        {
          value: ENROLLMENT_TEMP_NUM,
          label: endorsementDocTypeMap.policy_employee_data.label,
        },
        isEnrolmentPremiumBased &&
          FF_IWORK_ENROLMENT_PREMIUM_BASED && {
            value: BYPASS_ENROLLMENT_TEMP_NUM,
            label: endorsementDocTypeMap.policy_employee_bypass_enrollment.label,
          },
      ].filter(Boolean) as { value: string | number; label: string }[]);

  return [
    {
      key: "enrollmentStartDate",
      name: "enrollmentStartDate",
      label: "Enrollment Start Date",
      type: "date",
      gridColumn: 5,
      componentProps: { fullWidth: true, minDate: dayjs() },
      rules: { required: { value: true, message: "Field is required" } },
    },
    {
      key: "enrollmentEndDate",
      name: "enrollmentEndDate",
      label: "Enrollment End Date",
      type: "date",
      gridColumn: 5,
      componentProps: { fullWidth: true, minDate: dayjs() },
      rules: { required: { value: true, message: "Field is required" } },
    },
    {
      key: "noOfEmployees",
      name: "noOfEmployees",
      label: "Number of Employees",
      type: "number",
      gridColumn: 5,
      formatNumber: true,
      componentProps: { placeholder: "Enter employee count", fullWidth: true },
      rules: { required: { value: true, message: "Field is required" } },
    },
    {
      key: "noOfDependents",
      name: "noOfDependents",
      label: "Number of Dependents",
      type: "number",
      formatNumber: true,
      gridColumn: 5,
      rules: { required: { value: true, message: "Field is required" } },
      componentProps: { placeholder: "Enter dependent count", fullWidth: true },
    },
    {
      key: "documentType",
      name: "documentType",
      label: "Data Type",
      type: "select",
      gridColumn: 9,
      componentProps: { fullWidth: true, placeholder: "Select Data Type" },
      options: documentTypeOptions,
      rules: { required: "Please select a data type" },
    },
    {
      key: "uploadEmployeeFile",
      name: "uploadEmployeeFile",
      label: "Upload File",
      type: "file",
      gridColumn: 9,
      componentProps: {
        fullWidth: true,
        customVariant: "endorsementDoc",
        accept: ".xlsx,.xls",
        requireDocumentType: false,
      },
    },
  ];
};
