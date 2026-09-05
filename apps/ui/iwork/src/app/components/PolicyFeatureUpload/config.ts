import { FormFieldConfig } from "@ui/ui-lib";

export const PolicyFeatureUploadConfig: FormFieldConfig[] = [
  {
    key: "uploadEmployeeFile",
    name: "uploadEmployeeFile",
    label: "Upload File",
    type: "file",
    gridColumn: 9,
    componentProps: {
      fullWidth: true,
      customVariant: "endorsementDoc",
      accept: ".pdf",
      disableWhileUploading: true,
      requireDocumentType: false,
      maxLimit: 1,
      supportedFormatsMessage: "Upload PDF only (max 25 MB)",
    },
  },
];
