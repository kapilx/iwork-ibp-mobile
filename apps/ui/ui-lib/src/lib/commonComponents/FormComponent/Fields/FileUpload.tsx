import { useEffect, useRef, useState } from "react";
import {
  AI_CARD_TYPE,
  CLICK_TO_UPLOAD,
  DRAG_AND_DROP,
  INVALID_FILE_FORMAT,
  MAX_FILE_SIZE_MB,
  UPLOAD_INSTRUCTION,
  UPLOADED_FILE,
} from "../../../constants";
import { endPoints } from "@ui/ui-lib/constants/endPoints";
import useApi from "@ui/ui-lib/hooks/useApi";
import { FieldComponentProps, FileFieldProps } from "../types";
import { ControlledField } from "../utils";
import {
  DisclaimerMessage,
  StyledFileUploadTypography,
  StyledSpan,
  StyledTypography,
  UploadDropZone,
  UploadedFileContainer,
  UploadedFileItem,
  UploadedFileList,
  UploadedFileNameContainer,
  UploadedFileTitle,
  UploadFileTitle,
  UploadFormControl,
  UploadIcon,
  UploadInstruction,
  UploadTitle,
} from "./styles";
import fileUpload from "../../../assets/svgs/file-upload.svg";
import { useDispatch } from "react-redux";
import { setFileUploaded, setToastMessage } from "@ui/ui-lib/redux/slice";
import { SmartAssistLoader } from "../../SmartAssistForm/styles";

export interface UploadedFile {
  id: number;
  fileName: string;
  fileBuffer: string; // base64 string
  mimeType?: string;
}

const FileUpload = ({ field, control, onFileUpload }: FieldComponentProps) => {
  const dispatch = useDispatch();
  const { componentProps } = field;
  const fileProps = componentProps as FileFieldProps;
  const accept = fileProps?.accept || "*";
  const multiple = fileProps?.multiple || false;
  const uploadEndpoint = field?.apiDependencies?.endPoint;

  const replaceEndpoint = field?.apiDependencies?.endPoint;
  const manualUpload = fileProps?.manualUpload;
  const inputRef = useRef<HTMLInputElement>(null);

  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);

  const { doFetch, data: fileUploadResponse, loading, error } = useApi();
  const token = sessionStorage.getItem("user")
    ? JSON.parse(sessionStorage.getItem("user") as string)?.accessToken
        ?.accessToken
    : null;

  const onChangeRef = useRef<((value: any) => void) | undefined>();

  const handleFileUpload = (file: File, onChange?: (value: any) => void) => {
    onChangeRef.current = onChange; // store it for later use

    if (manualUpload) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedFile({
          id: 0,
          fileName: file.name,
          fileBuffer: (reader.result as string)?.split(",")[1] || "",
          mimeType: file.type,
        });
        onChange?.(file);
      };
      reader.readAsDataURL(file);
      return;
    }

    if (onFileUpload) {
      onFileUpload(file);
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("companyType", componentProps?.companyType || "");
    formData.append(
      "documentTypeLid",
      componentProps?.documentTypeLid || ""
    );
    formData.append("companyId", componentProps?.companyId || "");

    const endpoint = uploadedFile
      ? replaceEndpoint || endPoints?.fireUploadReplace
      : uploadEndpoint || endPoints?.fileUpload;

    if (uploadEndpoint) {
      doFetch(
        `${endpoint}${uploadedFile?.id ? `?id=${uploadedFile?.id}` : ""}`,
        {
          method: uploadedFile?.id ? "PUT" : "POST",
          data: formData,
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
    }
  };

  useEffect(() => {
    if (fileUploadResponse) {
      if (fileUploadResponse?.data) {
        setUploadedFile(fileUploadResponse.data); // local state
        onChangeRef.current?.(fileUploadResponse?.data);
        dispatch(setFileUploaded(fileUploadResponse?.data)); // update redux state
      }
      if (onFileUpload) {
        onFileUpload(fileUploadResponse, true); // callback to parent component
      }
    }
  }, [fileUploadResponse]);

  useEffect(() => {
    if (error) {
      if (onFileUpload) {
        onFileUpload(error, true); // callback to parent component
      }
    }
  }, [error]);

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    onChange?: (value: any) => void
  ) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      const selectedFile = multiple ? fileArray[0] : fileArray[0];
      const fileSizeMB = selectedFile.size / (1024 * 1024);
      // Check file size
      if (fileSizeMB > MAX_FILE_SIZE_MB) {
        dispatch(setToastMessage(UPLOAD_INSTRUCTION));
        event.target.value = ""; // Reset input
        return;
      }

      handleFileUpload(multiple ? fileArray[0] : fileArray[0], onChange); // upload one (or first one if multiple)
      event.target.value = ""; // reset input
    }
  };

  const handleFileDrop = (
    event: React.DragEvent<HTMLDivElement>,
    onChange?: (value: any) => void
  ) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      for (const file of fileArray) {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
        const acceptedExts = accept
          .split(",")
          .map((a) => a.replace(".", "").toLowerCase());
        if (accept !== "*" && !acceptedExts.includes(ext)) {
          dispatch(setToastMessage(INVALID_FILE_FORMAT(accept)));
          continue;
        }
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > MAX_FILE_SIZE_MB) {
          dispatch(setToastMessage(UPLOAD_INSTRUCTION));
          continue;
        }
        handleFileUpload(file, onChange);
        if (!multiple) break;
      }
    }
  };

  const getMimeTypeFromFileName = (name: string): string => {
    const fileExtension = name?.split(".")?.pop()?.toLowerCase();
    switch (fileExtension) {
      case "pdf":
        return "application/pdf";
      case "xlsx":
        return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "png":
        return "image/png";
      case "doc":
        return "application/msword";
      case "docx":
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      default:
        return "application/octet-stream";
    }
  };

  useEffect(() => {
    if (!manualUpload && fileUploadResponse?.data) {
      const { fileBuffer, id, mimeType, fileName } = fileUploadResponse.data;
      const resolvedMime = mimeType || getMimeTypeFromFileName(fileName || "");
      const dataUrl = `data:${resolvedMime};base64,${fileBuffer}`;

      setUploadedFile(fileUploadResponse.data);
    }
  }, [fileUploadResponse, manualUpload]);

  const didUpdateFormRef = useRef(false);

  return (
    <ControlledField
      field={field}
      control={control}
      render={({ error, onChange }) => {
        const handleClick = () => inputRef.current?.click();

        useEffect(() => {
          if (
            !manualUpload &&
            fileUploadResponse?.data &&
            !didUpdateFormRef.current
          ) {
            onChange?.(fileUploadResponse.data); // full object
            didUpdateFormRef.current = true;
          }
        }, [fileUploadResponse, onChange, manualUpload]);

        console.log("FileUpload field:", uploadedFile?.fileName);

        return (
          <>
            {loading && <SmartAssistLoader data-testid="loader" />}

            {field.label && (
              <StyledFileUploadTypography variant="body2">
                {field.rules?.required ? `${field.label} *` : field.label}
              </StyledFileUploadTypography>
            )}

            {uploadedFile?.fileName &&
              field?.componentProps?.variantType === "primary" && (
                <UploadedFileNameContainer>
                  <UploadFileTitle>Uploaded File:</UploadFileTitle>
                  {uploadedFile?.fileName}
                </UploadedFileNameContainer>
              )}
            <UploadFormControl
              disabled={field?.componentProps?.disabled}
              fullWidth
              error={!!error}
            >
              <input
                hidden
                ref={inputRef}
                accept={accept}
                id={field.name}
                type="file"
                multiple={multiple}
                onChange={(e) => handleFileChange(e, onChange)}
              />

              <UploadDropZone
                onClick={handleClick}
                onDrop={(e) => handleFileDrop(e, onChange)}
                onDragOver={(e) => e.preventDefault()}
                customVariant={field.componentProps?.customVariant}
              >
                <UploadIcon
                  customVariant={field.componentProps?.customVariant}
                  src={field.UploadIcon ?? fileUpload}
                />
                <UploadInstruction
                  customVariant={field.componentProps?.customVariant}
                >
                  <StyledSpan
                    customVariant={field.componentProps?.customVariant}
                  >
                    {CLICK_TO_UPLOAD}
                  </StyledSpan>{" "}
                  {DRAG_AND_DROP}
                  {componentProps?.customVariant == "info" && (
                    <DisclaimerMessage>{AI_CARD_TYPE}</DisclaimerMessage>
                  )}
                </UploadInstruction>
              </UploadDropZone>
            </UploadFormControl>
          </>
        );
      }}
    />
  );
};

export default FileUpload;
