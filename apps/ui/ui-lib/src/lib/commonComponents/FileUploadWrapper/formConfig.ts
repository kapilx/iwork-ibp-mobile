import { FormFieldConfig } from "../FormComponent/types";
import { FileUploadInitialData } from "./types";
import businessCardIcon from "../../assets/svgs/file-upload-business-card.svg";

export const fileUploadInitialData: FileUploadInitialData = {
  file: "",
}

export const fileUploadFields: FormFieldConfig[] = [
  {
    key: "file",
    name: "file",
    label: "Business Card",
    type: "file",
    gridColumn: 3.5,
    rules: {
      required: "File is required",
    },
    componentProps: {
      multiple: true,
      helperText: "Please upload a valid file with extension .pdf, .xlsx, .jpg, .jpeg, .png, .doc, .docx",
    },
    UploadIcon: businessCardIcon,
  },
];