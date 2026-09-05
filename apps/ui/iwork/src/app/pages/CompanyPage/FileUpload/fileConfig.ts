import {
  endPoints,
  FormFieldConfig,
  companyUtilityFunction,
} from "@ui/ui-lib";
import businessCardIcon from "../../../assets/svgs/file-upload-business-card.svg";
import policyDocIcon from "../../../assets/svgs/file-upload-policy-doc.svg";
import { Company, FileUploadInitialData } from "./types";


export const fileUploadInitialData: FileUploadInitialData = {
  file: "",
};

export const fileUploadInputFields: FormFieldConfig[] = [
  {
    key: "companyId",
    name: "companyId",
    label: "",
    type: "text",
    rules: {
      maxLength: {
        value: 200,
        message: "Company Name cannot exceed 200 characters",
      },
    },
    rightIcon: true,
    componentProps: {
      fullWidth: true,
      placeholder: "Enter Company Name",
    },
    apiDependencies: {
      endPoint: endPoints.companiesList,
      utilityFunction: companyUtilityFunction,
    },
  },
];

export const fileUploadFields: FormFieldConfig[] = [
  {
    key: "bussinessCard",
    name: "file",
    // label: "Business Card",
    type: "fileupload",
    gridColumn: 3.5,
    rules: {
      required: "File is required",
    },
    apiDependencies: {
      endPoint: endPoints.businessCard,
    },
    componentProps: {
      multiple: true,
      accept: ".jpg,.jpeg,.png,.webp",
      helperText: "Please upload a valid business card (.jpg, .jpeg, .png, .webp)",
      customVariant: "info",
    },
    UploadIcon: businessCardIcon,
  },
  {
    key: "pdfAnalyzer",
    name: "file2",
    label: "Policy Document",
    type: "fileupload",
    gridColumn: 3.5,
    rules: {
      required: "File is required",
    },
    apiDependencies: {
      endPoint: endPoints.pdfAnalyzer,
    },
    componentProps: {
      multiple: true,
      accept: ".pdf",
      helperText: "Please upload a valid PDF document",
      customVariant: "primary",
    },
    UploadIcon: policyDocIcon,
  },
];
