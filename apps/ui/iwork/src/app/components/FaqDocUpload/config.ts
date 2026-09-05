import { FormFieldConfig } from "@ui/ui-lib";

export const FaqUploadConfig: FormFieldConfig[] = [
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
