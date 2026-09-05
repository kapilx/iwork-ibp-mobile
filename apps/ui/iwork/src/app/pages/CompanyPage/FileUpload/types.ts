import { FormFieldConfig } from "@ui/ui-lib";

export interface FileUploadWrapperProps {
    multiple?: boolean;
    formConfig?: FormFieldConfig[];
    defaultValues?: FileUploadInitialData;
  }

  export interface FileUploadInitialData {
    file: string;
  }

  export interface Company {
    companyName: string;
    displayName: string;
    id: number;
  }