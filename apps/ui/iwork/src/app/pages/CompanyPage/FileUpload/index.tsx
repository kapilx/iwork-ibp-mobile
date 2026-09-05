import { useEffect, useState } from "react";
import {
  FileUploadWrapper,
  SEARCH,
  TreeNode,
  useDebounce,
  AccordionTitles,
  StyledTextField,
  endPoints,
  useApi,
  isCopyPasteAllowedForOrg,
} from "@ui/ui-lib";
import {
  COMPANY,
  COMPANY_NAME_ERROR_MSG,
  CONTACT,
  FILE_UPLOAD_OR,
  HOW_DO_YOU_WANT_TO_ADD_A,
  MANUALLY,
  OPPORTUNITY,
  OR_WE_CAN_FETCH_IT_FOR_YOU,
} from "../../../constants";
import { fileUploadFields, fileUploadInitialData } from "./fileConfig";
import {
  FileUploadContainer,
  FileUploadInputLabelContainer,
  FileUploadPageContainer,
  FileUploadPageHeader,
  Line,
  OrText,
  SeparatorContainer,
} from "./styles";
import { useLocation, useNavigate } from "react-router-dom";
import UploadCompany from "../UploadCompany";
import { InputAdornment } from "@mui/material";
import arrow from "../../../assets/svgs/map-arrow.svg";

// Helper function to transform API data
export const transformApiData = (apiData: any[]): TreeNode[] => {
  return apiData.map((company) => ({
    id: company.id.toString(),
    label: company.companyName || "Unknown", // Fallback to "Unknown" if companyName is missing
    children: company.childCompanies?.map((child: any) => ({
      id: child.id.toString(),
      label: child.companyName || "Unknown",
    })),
  }));
};

const FileUploadPage = () => {
  const [companyData, setCompanyData] = useState<any[]>([]);
  const [name, setName] = useState<string>("");
  const debouncedName = useDebounce(name, 300);
  const [isNameEntered, setIsNameEntered] = useState(false);
  const [triedSubmit, setTriedSubmit] = useState(false);
  const [extractedCompanyData, setExtractedCompanyData] = useState<any>();
  const { doFetch, data }: any = useApi();

  const isValid = name.trim().length >= 3;
  const showError = triedSubmit && !isValid;

  const { state: overallRouteState } = useLocation();
  const pageTitle = overallRouteState?.pageTitle;
  const pathName =
    overallRouteState?.pathname === AccordionTitles.CONTACT_SELECTION
      ? CONTACT
      : overallRouteState?.pathname === AccordionTitles.OPPORTUNITY_SELECTION
      ? OPPORTUNITY
      : undefined;

  const finalTitle = pathName ?? pageTitle ?? COMPANY;

  const navigate = useNavigate();

  const handleFileUploadCallback = (fileData: any) => {
    const formData = new FormData();
    if (Array.isArray(fileData)) {
      fileData.forEach((f) => formData.append("file", f));
    } else {
      formData.append("file", fileData);
    }
    const fileExtension = fileData.name.split(".").pop()?.toLowerCase();

    let apiEndpoint = "";
    if (["pdf", "xlsx", "doc", "docx"].includes(fileExtension)) {
      apiEndpoint = `${endPoints.pdfAnalyzer}?policyDetails=false&company=true`; // Document analyzer API
    } else if (["jpg", "jpeg", "png"].includes(fileExtension)) {
      apiEndpoint = endPoints.businessCard; // Business card analyzer API
    }

    doFetch(apiEndpoint, {
      method: "POST",
      data: formData,
      headers: {
        Accept: "application/json",
      },
    });
  };

  const handleCompanySearch = (companyName: string) => {
    doFetch(`${endPoints.companySearch}`, {
      method: "POST",
      data: { query: companyName },
      headers: {
        Accept: "application/json",
      },
    });
  };

  useEffect(() => {
    console.log("Company data:>>>", data);
    if (data?.data) {
      setExtractedCompanyData(data.data);
      if (Array.isArray(data.data)) {
        setName(data.data[0]?.companyName);
      } else if (
        Object.hasOwnProperty.call(
          data.data.companyBasicInfo || data.data.companyInfo?.insuredDetails,
          "companyName"
        )
      ) {
        const extractedCompanyName =
          data.data.companyBasicInfo?.companyName ||
          data.data.companyInfo?.insuredDetails?.companyName;
        setName(extractedCompanyName);
      }
      setIsNameEntered(true);
    } else {
      setIsNameEntered(false);
      setName("");
    }
  }, [data]);

  useEffect(() => {
    const companyName =
      overallRouteState?.[AccordionTitles.COMPANY_SELECTION]?.companyName;
    if (companyName) {
      setName(companyName);
    }
  }, [overallRouteState]);

  const handleIconClick = () => {
    if (isValid) {
      setIsNameEntered(true);
    } else {
      setTriedSubmit(true);
    }
  };

  const handleGoBack = () => {
    setIsNameEntered(false);
    setName("");
    setTriedSubmit(false);

    navigate(location.pathname, { replace: true, state: null });
  };

  const handleEnterKeyPress = () => {
    handleCompanySearch(name);
    // handleIconClick();
  };

  return (
    <FileUploadPageContainer>
      {isNameEntered || (overallRouteState !== null && !pageTitle) ? (
        <UploadCompany
          entityType={AccordionTitles.COMPANY_SELECTION}
          debouncedName={debouncedName.trim()}
          handleGoBack={handleGoBack}
          setName={setName}
          aiExtractedCompanyData={extractedCompanyData}
          // selectedNode={selectedNode}
        />
      ) : (
        <FileUploadContainer>
          <FileUploadPageHeader>
            {HOW_DO_YOU_WANT_TO_ADD_A} {finalTitle}
            {"?"}
          </FileUploadPageHeader>

          <FileUploadInputLabelContainer>
            {MANUALLY}
          </FileUploadInputLabelContainer>

          <StyledTextField
            id="outlined-basic"
            value={name}
            onChange={(e) => setName(e.target.value)}
            variant="outlined"
            placeholder={SEARCH}
            error={showError}
            helperText={showError ? COMPANY_NAME_ERROR_MSG : ""}
            onPaste={(e) => {
              if (!isCopyPasteAllowedForOrg()) {
                e.preventDefault();
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleEnterKeyPress();
              }
            }}
            InputProps={{
              endAdornment: isValid ? (
                <InputAdornment
                  position="end"
                  disabled={!isValid}
                  onClick={() => handleEnterKeyPress()}
                >
                  <img src={arrow} alt="right-icon" />
                </InputAdornment>
              ) : null,
            }}
            customStyles={{
              width: "100%",
              borderRadius: "8px",
              "& .MuiInputAdornment-root ": {
                cursor: "pointer",
                width: "24px",
                height: "24px",
              },
            }}
          />
          <SeparatorContainer>
            <Line />
            <OrText>{FILE_UPLOAD_OR}</OrText>
            <Line />
          </SeparatorContainer>

          <FileUploadInputLabelContainer>
            {OR_WE_CAN_FETCH_IT_FOR_YOU}
          </FileUploadInputLabelContainer>

          <FileUploadWrapper
            formConfig={fileUploadFields}
            defaultValues={fileUploadInitialData}
            companyId={companyData[0]?.id}
            documentType={fileUploadFields[0]?.name}
            onFileUpload={handleFileUploadCallback}
          />
        </FileUploadContainer>
      )}
    </FileUploadPageContainer>
  );
};

export default FileUploadPage;
