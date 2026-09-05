import { FormFieldConfig } from "../FormComponent/types";

export interface FileUploadWrapperProps {
    multiple?: boolean;
    formConfig?: FormFieldConfig[];
    defaultValues?: FileUploadInitialData;
    onFileUpload?: (files: File[] | File) => void;
}

export interface FileUploadInitialData {
    file: string;
}