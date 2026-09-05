import { useEffect, useRef, useState } from "react";
import {
  httpMethods,
  MAX_FILE_SIZE_MB,
  UPLOAD_INSTRUCTION,
} from "../constants/index.js";
import { endPoints } from "@ui/ui-lib/constants/endPoints";
import useApi from "./useApi.js";
import { useDispatch } from "react-redux";
import { setToastMessage } from "@ui/ui-lib/redux/slice";

export interface UploadedFile {
  id: number;
  fileName: string;
  fileBuffer: string; // base64 string
  mimeType?: string;
}

export function useFileUpload(
  existingFile?: UploadedFile,
  endpoint?: string,
  hideDropdown?: boolean,
  replaceEndpoint?: string,
  replaceMethod: "POST" | "PUT" = "PUT"
) {
  const dispatch = useDispatch();
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(
    existingFile || null
  );
  const { doFetch, data: fileUploadResponse, loading } = useApi();
  const token = sessionStorage.getItem("user")
    ? JSON.parse(sessionStorage.getItem("user") as string)?.accessToken
        ?.accessToken
    : null;
  const callbackRef = useRef<((value: any) => void) | null>(null);

  const handleFileUpload = (
    file: File,
    companyType: string,
    companyId: string | number,
    documentType: string,
    onChange?: (value: any) => void,
    opportunityId?: string,
    opportunityActivityId?: string,
    policyId?: string | number,
    claimActivityId?: string | number,
    endorsementId?: string | number,
    uploadCategory?: string
  ) => {
    callbackRef.current = onChange ?? null;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("companyType", companyType);
    formData.append("companyId", String(companyId));
    formData.append("documentTypeLid", !hideDropdown ? documentType : "");
    // Only append documentTypeLid if hideDropdown is false and documentType is provided
    // if (!hideDropdown && documentType) {
    //   formData.append("documentTypeLid", documentType);
    // }

    const appendIfPresent = (key: string, value?: string | number) => {
      if (value === undefined || value === null || value === "") return;
      formData.append(key, String(value));
    };

    appendIfPresent("opportunityId", opportunityId);
    appendIfPresent("opportunityActivityId", opportunityActivityId);
    appendIfPresent("policyId", policyId);
    appendIfPresent("claimActivityId", claimActivityId);
    appendIfPresent("endorsementId", endorsementId);
    appendIfPresent("uploadCategory", uploadCategory);

    const isReplace = Boolean(existingFile?.id);
    const resolvedEndpoint = isReplace
      ? replaceEndpoint || endPoints.fileUploadReplace
      : endpoint;
    const resolvedMethod = isReplace
      ? replaceMethod === "POST"
        ? httpMethods.POST
        : httpMethods.PUT
      : httpMethods.POST;
    const resolvedUrl =
      isReplace && resolvedMethod === httpMethods.PUT
        ? `${resolvedEndpoint}/${existingFile?.id}`
        : `${resolvedEndpoint}`;

    doFetch(resolvedUrl, {
      method: resolvedMethod,
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    companyType: string,
    companyId: string | number,
    documentType: string,
    onChange?: (value: any) => void,
    opportunityId?: string,
    opportunityActivityId?: string,
    policyId?: string | number,
    claimActivityId?: string | number,
    endorsementId?: string | number,
    uploadCategory?: string
  ) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const selectedFile = files[0];
      const fileSizeMB = selectedFile.size / (1024 * 1024);
      if (fileSizeMB > MAX_FILE_SIZE_MB) {
        dispatch(setToastMessage(UPLOAD_INSTRUCTION));
        event.target.value = "";
        return;
      }
      handleFileUpload(
        selectedFile,
        companyType,
        companyId,
        documentType ? documentType : "",
        onChange,
        opportunityId,
        opportunityActivityId,
        policyId,
        claimActivityId,
        endorsementId,
        uploadCategory
      );
      event.target.value = "";
    }
  };

  useEffect(() => {
    if (
      fileUploadResponse?.data &&
      typeof fileUploadResponse?.data === "object"
    ) {
      setUploadedFile(fileUploadResponse.data);

      if (callbackRef.current) {
        callbackRef.current(fileUploadResponse.data);
        callbackRef.current = null;
      }
    }
  }, [fileUploadResponse]);

  return {
    uploadedFile,
    handleFileChange,
    handleFileUpload,
    fileUploadResponse,
    loading,
  };
}
