import React, { useMemo, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useLocation, useNavigate } from "react-router-dom";
import {
  useDebounce,
  useApiQuery,
  endPoints,
  BUTTON_LABELS,
  BUTTON_VARIANTS,
  CREATE,
  StyledTextField,
  SimpleTreeView,
  FileUploadWrapper,
  TreeNode,
  FeatureKey,
  selectHasPermission,
  setFileUploaded,
  isCopyPasteAllowedForOrg,
  AccordionTitles,
} from "@ui/ui-lib";
import {
  PageContainer,
  LeftContainer,
  RightContainer,
  VerticalDivider,
  ResultContainer,
  SummaryLine,
  CreateRow,
  HeaderContainer,
  Title,
  SubTitle,
  RowContainer,
  CreatePrompt,
  ActionButton,
  StyledPrevButton,
  FileUploadContainer,
  SummaryLineText,
  DefaultIMageContainer,
  SummaryContainer,
  LoadingContainer,
} from "./styles";
import {
  UNKNOWN,
  UPLOAD_DOCUMENT_INSTRUCTION,
  CREATE_NEW_COMPANY_TEXT,
  HELP_CREATE_COMPANY_TITLE,
  HELP_CREATE_CONTACT_TITLE,
  HELP_CREATE_OPPORTUNITY_TITLE,
  HELP_CREATE_CONTACT_SUBTITLE,
  HELP_CREATE_OPPORTUNITY_SUBTITLE,
  NO_COMPANY_FOUND_MESSAGE,
  COMPANY_MATCH_EXACT_MESSAGE,
  COMPANY_MATCH_PROMPT,
  COMPANY_SIMILAR_FOUND_MESSAGE,
  NO_DATA_IMAGE_ALT,
  ENTER_COMPANY_NAME,
  PLACEHOLDER_TEXT,
  CREATE_QUICK_COMPANY,
  BUSINESS_CARD,
} from "../../../constants";
import {
  fileUploadFields,
  fileUploadInitialData,
} from "../FileUpload/fileConfig";
import defaultimage from "../../../assets/svgs/DefaultImage.svg";
import noDataImage from "../../../assets/webp/no-data-found-background-image.webp";
import { CompanyMatchResult } from "../UploadCompany";
import { useDispatch, useSelector } from "react-redux";

// helper to transform API data
const transformApiData = (apiData: any[]): TreeNode[] => {
  return apiData.map((company) => ({
    id: company.id.toString(),
    label: company.companyName || UNKNOWN,
    status: company?.status,
    children: company.childCompanies?.map((child: any) => ({
      id: child.id.toString(),
      label: child.companyName || UNKNOWN,
      status: child?.status,
      country: child.country || UNKNOWN,
    })),
    country: company.country || UNKNOWN,
  }));
};

export type EntryType = "company" | "contact" | "opportunity";

export type CompanyMatch = {
  isNameMatched: boolean;
  details: { id?: string; label?: string };
};

function findCompanyMatch(data: any[], name: string): CompanyMatch {
  const target = name.toLowerCase();
  function search(nodes: any[]): CompanyMatch {
    for (const node of nodes) {
      const nodeLabel = (node.label ?? "").toString().toLowerCase();
      if (nodeLabel === target) {
        return {
          isNameMatched: true,
          details: { id: node.id, label: node.label },
        };
      }
      if (Array.isArray(node.children)) {
        const result = search(node.children);
        if (result.isNameMatched) return result;
      }
    }
    return { isNameMatched: false, details: {} };
  }
  return search(data);
}

const CreateCompany = () => {
  const businessCardUploadFile = useSelector(
    (state: any) => state?.user?.uploadedFile
  );

  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const entry: EntryType = location.state?.pageTitle || "company";

  const [companyName, setCompanyName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedName = useDebounce(companyName, 300);
  const [businessCardData, setBusinessCardData] = useState<any>(null);

  React.useEffect(() => {
    const companyState = location.state?.[AccordionTitles.COMPANY_SELECTION];
    const searchedString = location.state?.searchedString || "";
    if (companyState?.label) {
      setCompanyName(searchedString);
      setSearchTerm(searchedString);
    }
  }, [location.state]);

  React.useEffect(() => {
    if (!businessCardUploadFile) return;

    let extractedCompanyName = "";

    // Case 1: businessCardUploadFile is an array (Business Card)
    if (Array.isArray(businessCardUploadFile)) {
      const data = businessCardUploadFile[0];
      if (data?.companyName) {
        extractedCompanyName = data.companyName;
      }
      setBusinessCardData(data);
    }

    // Case 2: businessCardUploadFile is a single object (Policy Document)
    else if (businessCardUploadFile) {
      extractedCompanyName =
        businessCardUploadFile?.companyInfo?.insuredDetails?.companyName || "";
      setBusinessCardData(businessCardUploadFile);
    }

    setCompanyName(extractedCompanyName);
  }, [businessCardUploadFile]);

  // update search term automatically when 5 chars entered
  React.useEffect(() => {
    if (debouncedName.length <= 2) {
      setSearchTerm("");
    } else if (debouncedName.length >= 3) {
      setSearchTerm(debouncedName);
    }
  }, [debouncedName]);
  const hasCompanyWritePermission = useSelector(
    selectHasPermission(FeatureKey.CREATE_COMPANY)
  );

  const searchUrl = `${endPoints.companyHierarchy}?page=1&limit=1000&search=${encodeURIComponent(searchTerm)}`;
  const { data, isLoading,isFetching  } = useApiQuery({
    url: searchUrl,
    queryKey: ["createCompany",searchUrl],
    enabled: !!searchTerm,
  });
  const treeData = data?.data?.data ? transformApiData(data.data.data) : [];
  const matched = useMemo(
    () => findCompanyMatch(treeData, searchTerm),
    [treeData, searchTerm]
  );
  const handleSelectNode = (node: TreeNode) => {
    const state: any = {
      ...location.state,
      pathname: AccordionTitles.CONTACT_SELECTION,
      searchedString: searchTerm,
    };

    if (state[AccordionTitles.COMPANY_SELECTION]?.label !== node.label) {
      state.newContactIds = [];
    }
    state[AccordionTitles.COMPANY_SELECTION] = {
      id: node.id,
      label: node.label,
      businessCardInfo: businessCardData,
    };
    if (!state.origin) {
      state.origin = location.pathname;
    }
    dispatch(setFileUploaded(null));

    navigate("/create2", { state });
  };

  const handleCreateCompany = () => {
    const paramState: any = {
      ...location.state,
      newContactIds: [],
    };
    paramState[AccordionTitles.COMPANY_SELECTION] = {
      companyName,
      createChildCompany: false,
      businessCardInfo: businessCardData,
    };
    dispatch(setFileUploaded(null));

    navigate("/companies/new", { state: paramState });
  };

  const handleCreateQuickCompany = () => {
    const paramState: any = {
      ...location.state,
      newContactIds: [],
      pathname: AccordionTitles.COMPANY_SELECTION,
    };
    paramState[AccordionTitles.COMPANY_SELECTION] = {
      companyName,
      createChildCompany: false,
      businessCardInfo: businessCardData,
    };
    dispatch(setFileUploaded(null));

    navigate("/smart-assist-create", { state: paramState });
  };

  const handleCancel = () => {
    const path = location.state?.originPath || "/dashboard";
    navigate(path, {
      state: {
        activeTabKey: location.state?.activeTabKey,
      },
    });
  };

  let title = HELP_CREATE_COMPANY_TITLE;
  let subTitle: string | undefined;
  if (entry === "contact") {
    title = HELP_CREATE_CONTACT_TITLE;
    subTitle = HELP_CREATE_CONTACT_SUBTITLE;
  } else if (entry === "opportunity") {
    title = HELP_CREATE_OPPORTUNITY_TITLE;
    subTitle = HELP_CREATE_OPPORTUNITY_SUBTITLE;
  }

  let summary1 = "";
  let summary2 = "";
  if (searchTerm.length >= 1) {
    if (treeData.length === 0) {
      summary1 = NO_COMPANY_FOUND_MESSAGE;
    } else if (matched.isNameMatched) {
      summary1 = COMPANY_MATCH_EXACT_MESSAGE;
      summary2 = COMPANY_MATCH_PROMPT;
    } else {
      summary1 = COMPANY_SIMILAR_FOUND_MESSAGE;
      summary2 = COMPANY_MATCH_PROMPT;
    }
  }

  const createDisabled =
    !companyName.trim() ||
    companyName.trim().length < 3 ||
    companyName.trim().length > 200 ||
    (matched.isNameMatched && treeData.length > 0) ||
    !hasCompanyWritePermission;
    const loading = isFetching || isLoading;
  return (
    <PageContainer data-testid="wizard-page">
      <HeaderContainer>
        <Title variant="h4">{title}</Title>
        {subTitle && <SubTitle>{subTitle}</SubTitle>}
      </HeaderContainer>

      <RowContainer>
        <RightContainer>
          <Typography>{UPLOAD_DOCUMENT_INSTRUCTION}</Typography>
          <FileUploadContainer>
            <Typography>{BUSINESS_CARD}</Typography>
            <FileUploadWrapper
              formConfig={[fileUploadFields[0]]}
              defaultValues={fileUploadInitialData}
            />
          </FileUploadContainer>
        </RightContainer>
        <VerticalDivider orientation="vertical" flexItem />
        <LeftContainer>
          <Typography>{ENTER_COMPANY_NAME}</Typography>
          <StyledTextField
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            onPaste={(e) => {
              if (!isCopyPasteAllowedForOrg()) {
                e.preventDefault();
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                setSearchTerm(companyName.trim());
              }
            }}
            customStyles={{ width: "100%", mt: theme.spacing(1) }}
            placeholder={PLACEHOLDER_TEXT}
            data-testid="company-name-field"
            inputProps={{ "data-testid": "company-name-input" }}
          />
          <ResultContainer data-testid="company-search-result-container">
            {searchTerm ? (
              loading ? (
                <LoadingContainer>
                  <CircularProgress color="secondary" />
                </LoadingContainer>
              ) : (
                <>
                  <SummaryContainer>
                    {summary1 && <SummaryLineText>{summary1}</SummaryLineText>}
                    {summary2 && <SummaryLine>{summary2}</SummaryLine>}
                  </SummaryContainer>
                  {treeData.length === 0 ? (
                    <DefaultIMageContainer data-testid="no-data-image">
                      <img
                        src={noDataImage}
                        alt={NO_DATA_IMAGE_ALT}
                        width="100%"
                      />
                    </DefaultIMageContainer>
                  ) : (
                    <SimpleTreeView
                      data={treeData}
                      onSelectNode={handleSelectNode}
                      selectedTreeNode={null}
                      debouncedName={debouncedName}
                      matchedCompanyResult={matched as CompanyMatchResult}
                      containerSx={{ maxHeight: "100px" }}
                    />
                  )}
                </>
              )
            ) : (
              <DefaultIMageContainer>
                <img src={defaultimage} alt={NO_DATA_IMAGE_ALT} width="100%" />
              </DefaultIMageContainer>
            )}
          </ResultContainer>
        </LeftContainer>
      </RowContainer>
      <CreateRow>
        <CreatePrompt
          disabled={createDisabled}
          data-testid="create-company-prompt"
        >
          {`${CREATE_NEW_COMPANY_TEXT} "${companyName}"?`}
        </CreatePrompt>
        <Box>
          <StyledPrevButton
            variantType={BUTTON_VARIANTS.SECONDARY}
            onClick={handleCancel}
            label={BUTTON_LABELS.CANCEL}
            sizeType="small"
          />
          <ActionButton
            variantType={BUTTON_VARIANTS.PRIMARY}
            onClick={handleCreateQuickCompany}
            disabled={createDisabled || loading}
            sizeType="small"
          >
            {CREATE_QUICK_COMPANY}
          </ActionButton>
          <ActionButton
            variantType={BUTTON_VARIANTS.PRIMARY}
            onClick={handleCreateCompany}
            disabled={createDisabled || loading}
            sizeType="small"
          >
            {CREATE}
          </ActionButton>
        </Box>
      </CreateRow>
    </PageContainer>
  );
};

export default CreateCompany;
