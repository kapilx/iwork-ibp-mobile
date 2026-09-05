import React from "react";
import DynamicForm from "../FormComponent";
import { fileUploadFields, fileUploadInitialData } from "./formConfig";
import { useForm } from "react-hook-form";
import { FileUploadWrapperProps } from "./types";
import { FileUploadForm } from "./styles";
import { useDispatch } from "react-redux";
import { setToastMessage } from "@ui/ui-lib/redux/slice";
import { FILE_UPLOAD_SUCCESS_MESSAGE } from "../../constants";

const FileUploadWrapper: React.FC<FileUploadWrapperProps> = ({
  multiple,
  formConfig = fileUploadFields,
  defaultValues = fileUploadInitialData,
}) => {
  const [formMethods, setFormMethods] =
    React.useState<ReturnType<typeof useForm>>();

  const dispatch = useDispatch();

  const onFileUpload = (data: any, isApiRes: boolean = false) => {
    if (isApiRes) {
      if (data?.success === false) {
        dispatch(setToastMessage(data?.error));
        return;
      } else {
        //show the this toast message when the file is uploaded successfully
        const fileData = data?.data[0];
        const message = FILE_UPLOAD_SUCCESS_MESSAGE(fileData?.companyName);
        // show for 7 seconds.
        dispatch(setToastMessage({ message, duration: 7000 }));
      }
    }
  };

  return (
    <FileUploadForm>
      <DynamicForm
        formConfig={formConfig}
        formMethods={setFormMethods}
        defaultValues={defaultValues}
        sx={{
          padding: "0px",
        }}
        onFileUpload={onFileUpload}
      />
    </FileUploadForm>
  );
};

export default FileUploadWrapper;
