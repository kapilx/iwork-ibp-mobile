import React, { useState } from "react";
import { RadioGroup, Typography, LinearProgress } from "@mui/material";
import Button from "@ui/ui-lib/commonComponents/Button";
import { useDispatch } from "react-redux";
import fileUpload from "../../assets/svgs/employee-data-upload.svg";
import {
  Container,
  Title,
  CustomRadio,
  RadioLabel,
  UploadBox,
  UploadContentWrapper,
  UploadCenterBox,
  UploadText,
  UploadLink,
  PointsNote,
  NoteHeading,
  ProgressBox,
  ButtonContainer,
  UploadContainer,
  StyledLinearProgress,
  StyledTypography,
  StyledProgressBox,
  StyledList,
} from "./styles";
import { apiRequest } from "@ui/ui-lib/utils/apiRequest";
import { useParams } from "react-router-dom";
import { endPoints, HTTP_METHODS, Table } from "@ui/ui-lib";
import { LookUpValues } from "../../constants/lookupValues";
import { useLookupIdByKey } from "@ui/ui-lib/hooks/useLookupIdByKey";
import { useApiMutation } from "@ui/ui-lib/hooks/useMutation";
import { UPLOAD_DATA } from "../../constants";
import { setToastMessage } from "@ui/ui-lib/redux/slice";

interface Props {
  onUploadSuccess?: () => void;
  onClose?: () => void;
}

const UploadEmployeeData: React.FC<Props> = ({ onUploadSuccess, onClose }) => {
  const dispatch = useDispatch();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [progress, setProgress] = useState(0);
  const { id: policyId } = useParams<{ id: string }>();

  const radioOptions = [
    {
      label: "Employee",
      url: endPoints.downloadEmployeeDataTemplate(
        policyId ? parseInt(policyId, 10) : 0
      ),
      key: "policy_employee_data",
    },
    {
      label: "Employee + Dependents",
      url: endPoints.downloadEmployeeDataTemplate(
        policyId ? parseInt(policyId, 10) : 0
      ),
      key: "policy_employee_data",
    },
    {
      label: "Employee + Dependents + Enrolment data",
      url: endPoints.downloadEmployeeEnrollmentTemplate(
        policyId ? parseInt(policyId, 10) : 0
      ),
      key: "policy_employee_enrollment_data",
    },
  ];

  const [selectedOption, setSelectedOption] = useState(radioOptions[2].label);
  // const [selectedOption, setSelectedOption] = useState(radioOptions[0].label);

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedOption(e.target.value);
  };

  // ✅ File only selected, not uploaded
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const processMutation = useApiMutation({
    config: {
      onSuccess: (response) => {
        dispatch(
          setToastMessage(response?.message || "Processing successful.")
        );
        setIsUploading(false);
        setUploadSuccess(true);
        onUploadSuccess?.();
      },
      onError: (error) => {
        console.error("Processing error:", error);
        const errorMessage = Array.isArray(error?.message)
          ? error.message[0]
          : error?.message ?? "Something went wrong while processing the file.";
        dispatch(setToastMessage(errorMessage));
      },
    },
  });

  const documentTypeId = useLookupIdByKey(
    LookUpValues.DOCUMENT_TYPE_POLICY_DOCUMENT
  );

  // ✅ Upload triggered only on button click
  const handleUploadClick = async () => {
    if (!file) return;

    setIsUploading(true);
    setProgress(0);
    setUploadSuccess(false);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("companyType", "policy");
    formData.append("companyId", policyId || "");
    formData.append("documentTypeLid", documentTypeId || "");

    // Get token from sessionStorage the correct way
    const token = sessionStorage.getItem("user")
      ? JSON.parse(sessionStorage.getItem("user") as string)?.accessToken
          ?.accessToken
      : null;

    try {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", endPoints.fileUpload);

      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          const documentId = response?.data?.id;

          if (!documentId) {
            dispatch(
              setToastMessage("Upload successful, but no document ID returned.")
            );
            return;
          }

          processMutation.mutate({
            endpoint: endPoints.processEmployeeData(
              policyId ? parseInt(policyId, 10) : 0
            ),
            method: HTTP_METHODS.POST,
            data: {
              documentId,
              documentType:
                radioOptions.find((opt) => opt.label === selectedOption)?.key ||
                "policy_employee_data",
            },
          });
        } else {
          console.error("Upload failed:", xhr.responseText);
          dispatch(setToastMessage("Upload failed. Try again."));
        }
      };

      xhr.onerror = () => {
        setIsUploading(false);
        console.error("XHR error occurred");
        dispatch(setToastMessage("Upload failed. Try again."));
      };

      xhr.send(formData);
    } catch (err) {
      setIsUploading(false);
      console.error("Upload error:", err);
      dispatch(setToastMessage("Upload failed. Try again."));
    }
  };
  const handleDownload = async () => {
    try {
      const selected = radioOptions.find((opt) => opt.label === selectedOption);
      if (!selected) {
        dispatch(setToastMessage("Invalid selection."));
        return;
      }

      const templateResponse = await apiRequest(selected.url, {
        method: "GET",
      });

      const documentId = templateResponse?.data?.documentId;
      const fallbackFileName =
        templateResponse?.data?.fileName || "template.xlsx";

      if (!documentId) {
        dispatch(setToastMessage("Template generation failed."));
        return;
      }

      const downloadUrl = `${endPoints.fileUploadDownload}/${documentId}/download`;
      const response = await apiRequest(downloadUrl, {
        method: "GET",
        responseType: "blob",
      });

      const blob = response.data as Blob;

      // Check for HTML error response without corrupting the blob
      const clone = blob.slice();
      const textCheck = await clone.text();
      if (blob.type.includes("text/html") && textCheck.includes("<html")) {
        dispatch(
          setToastMessage("Download failed — server returned an error page.")
        );
        return;
      }

      // Extract filename from content-disposition header if available
      let filename = fallbackFileName;
      const contentDisposition =
        response.headers?.["content-disposition"] ||
        response.headers?.get?.("content-disposition");

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      // Create a download link for the blob
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      dispatch(setToastMessage("Template downloaded successfully."));
    } catch (err) {
      console.error("Download error:", err);
      dispatch(setToastMessage("Download failed. Try again."));
    }
  };

  return (
    <Container>
      {isUploading ? (
        <UploadBox>
          <StyledProgressBox>
            <StyledLinearProgress variant="determinate" value={progress} />
            <StyledTypography>
              {UPLOAD_DATA.UPLOADING} {file?.name || "file"} — {progress}%
            </StyledTypography>
          </StyledProgressBox>
        </UploadBox>
      ) : (
        <UploadContainer>
          <Title>
            Select and upload - Employee + Dependents + Enrolment data file for
            processing
            {/* {UPLOAD_DATA.SELECT_AND_UPLOAD_EMPLOYEE} */}
          </Title>

          {/* Todo - will be used in future */}
          {/* <RadioGroup row value={selectedOption} onChange={handleRadioChange}>
            {radioOptions.map((option, idx) => (
              <RadioLabel
                key={idx}
                value={option.label}
                control={<CustomRadio />}
                label={option.label}
              />
            ))}
          </RadioGroup> */}

          <UploadBox>
            <UploadContentWrapper>
              <UploadCenterBox>
                <label htmlFor="upload-button">
                  <input
                    type="file"
                    id="upload-button"
                    hidden
                    accept=".xlsx,.xls,"
                    onChange={handleFileChange} // ✅ Fixed here
                  />
                  <UploadText>
                    <img src={fileUpload} alt="Upload Icon" width={40} />
                    {file ? (
                      <Typography fontSize={14} mt={1}>
                        {UPLOAD_DATA.FILE_SELECTED}{" "}
                        <span style={{ color: "#007BFF", fontWeight: 600 }}>
                          {file.name}
                        </span>{" "}
                        {UPLOAD_DATA.CLICK_AND_UPLOAD}
                      </Typography>
                    ) : (
                      <>
                        <UploadLink>{UPLOAD_DATA.CLICK_TO_UPLOAD}</UploadLink>
                        {/* &nbsp;{UPLOAD_DATA.OR_DRAG_AND_DROP} */}
                      </>
                    )}
                  </UploadText>
                </label>
              </UploadCenterBox>

              <PointsNote>
                <NoteHeading>{UPLOAD_DATA.POINTS_TO_CONSIDER}</NoteHeading>
                <StyledList>
                  <li>
                    <Typography>
                      {UPLOAD_DATA.DOWNLOAD_SAMPLE_TEMPLATE}{" "}
                      <UploadLink onClick={handleDownload}>
                        {UPLOAD_DATA.DOWNLOAD}
                      </UploadLink>
                    </Typography>
                  </li>
                  <li>
                    <Typography>{UPLOAD_DATA.FIRST_ROW}</Typography>
                  </li>
                  <li>
                    <Typography>{UPLOAD_DATA.SECOND_ROW}</Typography>
                  </li>
                  <li>
                    <Typography>{UPLOAD_DATA.THIRD_ROW}</Typography>
                  </li>
                </StyledList>
              </PointsNote>
            </UploadContentWrapper>
          </UploadBox>
        </UploadContainer>
      )}

      <ButtonContainer>
        <Button variantType="secondary" onClick={onClose}>
          {UPLOAD_DATA.CANCEL}
        </Button>
        <Button
          variantType="primary"
          disabled={!file || isUploading}
          onClick={handleUploadClick}
        >
          {isUploading
            ? UPLOAD_DATA.UPLOADING
            : UPLOAD_DATA.UPLOAD_AND_PROGRESS}
        </Button>
      </ButtonContainer>
    </Container>
  );
};

export default UploadEmployeeData;
