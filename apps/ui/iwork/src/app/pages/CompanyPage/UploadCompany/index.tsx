import { useEffect, useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Button,
  TreeNode,
  useApiQuery,
  endPoints,
  AccordionTitles,
} from "@ui/ui-lib";
import {
  AccordionContainer,
  AccordionTitle,
  UploadCompanyButtonsContainer,
  ProceedButton,
  StyledAccordion,
  StyledAccordionDetails,
  StyledAccordionSummary,
  StyledCardBackground,
  StyledLinkButton,
  UploadContainer,
  AccordionImage,
  AccordionHeaderContainer,
  SelectedValue,
} from "./styles";
import accordionDeselected from "../../../assets/svgs/accordion-deselected.svg";
import accordionSelected from "../../../assets/svgs/accordion-selected.svg";
import { useLocation, useNavigate } from "react-router-dom";
import { getAccordionData } from "./uploadConfig";
import { GO_BACK, PROCEED } from "../../../constants";

const accordionOrder = [
  AccordionTitles.COMPANY_SELECTION,
  AccordionTitles.CONTACT_SELECTION,
  AccordionTitles.OPPORTUNITY_SELECTION,
];

// Helper function to transform API data
const transformApiData = (apiData: any[]): TreeNode[] => {
  return apiData.map((company) => ({
    id: company.id.toString(),
    label: company.companyName || "Unknown", // Fallback to "Unknown"
    children: company.childCompanies?.map((child: any) => ({
      id: child.id.toString(),
      label: child.companyName || "Unknown",
    })),
  }));
};

const contactTransformApiData = (apiData: any[]): any[] => {
  return apiData.map((contact) => ({
    id: contact.id.toString(),
    label:
      `${contact.firstName || ""} ${contact.lastName || ""}`.trim() ||
      "Unknown",
  }));
};

export type CompanyMatchResult = {
  isNameMatched: boolean;
  details: {
    id?: string;
    label?: string;
  };
};

function findCompanyMatch(data: any[], name: string): CompanyMatchResult {
  const target = name.toLowerCase();

  function search(nodes: any[]): CompanyMatchResult {
    for (const node of nodes) {
      const nodeLabel = (node.label ?? "").toString().toLowerCase();

      if (nodeLabel === target) {
        return {
          isNameMatched: true,
          details: {
            id: node.id,
            label: node.label,
          },
        };
      }

      if (Array.isArray(node.children)) {
        const result = search(node.children);
        if (result.isNameMatched) return result;
      }
    }

    return {
      isNameMatched: false,
      details: {},
    };
  }

  return search(data);
}

const UploadCompany = ({
  debouncedName,
  handleGoBack,
  setName,
  aiExtractedCompanyData,
}: {
  debouncedName: string;
  handleGoBack: () => void;
  entityType: AccordionTitles;
  setName: React.Dispatch<React.SetStateAction<string>>;
  aiExtractedCompanyData: any;
}) => {
  const [selectedTreeNode, setSelectedTreeNode] = useState<TreeNode | null>(
    null
  );
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>(
    AccordionTitles.COMPANY_SELECTION
  );
  const [accordionStates, setAccordionStates] = useState<{
    [key in AccordionTitles]: {
      isSelected: boolean;
      value?: string[];
    };
  }>({
    [AccordionTitles.COMPANY_SELECTION]: { isSelected: false },
    [AccordionTitles.CONTACT_SELECTION]: {
      isSelected: false,
      value: [],
    },
    [AccordionTitles.OPPORTUNITY_SELECTION]: {
      isSelected: false,
    },
  });

  const navigate = useNavigate();
  const { state: overallRouteState } = useLocation();

  const fullUrl = `${endPoints.companyHierarchy}?page=1&limit=1000&search=${encodeURIComponent(debouncedName)}`;
  const contactUrl = endPoints.companyDetailsById(Number(selectedTreeNode?.id));

  useEffect(() => {
    if (overallRouteState?.pathname === AccordionTitles.COMPANY_SELECTION) {
      const node = {
        id: overallRouteState?.[
          AccordionTitles.COMPANY_SELECTION
        ]?.id.toString(),
        label: overallRouteState?.[AccordionTitles.COMPANY_SELECTION]?.label,
      };
      handleTreeNodeSelect(node);
    }
    if (overallRouteState?.pathname === AccordionTitles.CONTACT_SELECTION) {
      const node = {
        id: overallRouteState?.[AccordionTitles.COMPANY_SELECTION]?.id,
        label: overallRouteState?.[AccordionTitles.COMPANY_SELECTION]?.label,
      };
      handleTreeNodeSelect(node);
      setExpandedAccordion(overallRouteState?.pathname);
    }

    if (overallRouteState?.pathname === AccordionTitles.OPPORTUNITY_SELECTION) {
      setAccordionStates((prevState) => ({
        ...prevState,
        [AccordionTitles.COMPANY_SELECTION as AccordionTitles]: {
          isSelected: true,
          value: [
            {
              id: overallRouteState?.[AccordionTitles.COMPANY_SELECTION]?.id,

              title:
                overallRouteState?.[AccordionTitles.COMPANY_SELECTION]?.label,
            },
          ],
        },
        [AccordionTitles.CONTACT_SELECTION as AccordionTitles]: {
          isSelected: true,
          value: overallRouteState?.[AccordionTitles.CONTACT_SELECTION]?.values,
        },
        [AccordionTitles.OPPORTUNITY_SELECTION as AccordionTitles]: {
          isSelected: true,
        },
      }));
      setExpandedAccordion(overallRouteState?.pathname);
    }
  }, [overallRouteState]);

  const {
    data,
    isLoading: loading,
    error,
  } = useApiQuery({
    url: fullUrl,
    queryKey: [fullUrl],
  });

  const {
    data: contactData,
    isLoading: contactLoading,
    error: contactError,
  } = useApiQuery({
    url: contactUrl,
    queryKey: [contactUrl],
    enabled: expandedAccordion === AccordionTitles.CONTACT_SELECTION,
  });

  const treeData = data?.data?.data ? transformApiData(data.data.data) : [];
  const contactDataTransformed = contactData?.data?.contacts
    ? contactTransformApiData(contactData.data.contacts)
    : [];

  const matchedCompanyResult = useMemo(
    () => findCompanyMatch(treeData, debouncedName),
    [treeData, debouncedName, !selectedTreeNode]
  );

  useEffect(() => {
    if (
      !selectedTreeNode &&
      matchedCompanyResult.isNameMatched
      //  &&
      // !overallRouteState
    ) {
      // If a match is found and no node is selected, set the selected node

      handleTreeNodeSelect(matchedCompanyResult.details as TreeNode);
    }
  }, [matchedCompanyResult, selectedTreeNode]);

  // Handle tree node selection
  const handleTreeNodeSelect = (node: TreeNode) => {
    setSelectedTreeNode(node);
    setAccordionStates((prevState) => ({
      ...prevState,
      [expandedAccordion as AccordionTitles]: {
        isSelected: true,
        value: [{ id: node.id, title: node.label }],
      },
    }));
  };

  const handleCheckboxChange = (checked: boolean, contactLabel?: any) => {
    const currentValues =
      accordionStates[expandedAccordion as AccordionTitles]?.value || [];

    const updatedValue = currentValues.some(
      (item: any) => item.id === contactLabel.id
    )
      ? currentValues.filter((item: any) => item.id !== contactLabel.id)
      : [...currentValues, { ...contactLabel, title: contactLabel.label }];

    setAccordionStates((prevState) => ({
      ...prevState,
      [expandedAccordion as AccordionTitles]: {
        ...prevState[expandedAccordion as AccordionTitles],
        value: updatedValue,
      },
    }));
  };

  const handleProceedClick = () => {
    const findNextKey =
      accordionOrder.findIndex((item) => item === expandedAccordion) + 1;

    if (findNextKey >= accordionOrder.length) {
      return;
    }

    setExpandedAccordion(accordionOrder[findNextKey]);
  };

  const isValid =
    accordionStates[expandedAccordion]?.value?.length > 0 || false;

  const accordionData = getAccordionData(
    treeData,
    {
      handleTreeNodeSelect,
      handleCheckboxChange,
      selectedTreeNode,
    },
    contactDataTransformed,
    debouncedName,
    matchedCompanyResult
  );

  const handleLinkClick = (path: string) => {
    // this is used to create a new company, contact and opportunity
    const paramState: any = {};

    paramState[AccordionTitles.COMPANY_SELECTION] = {
      companyName: debouncedName, //when we navigate to company page, we need to pass the company name
      //where as this id is used to prefill the company name in the form after navigating to contact page
      id: selectedTreeNode?.id, //companyId
      label: selectedTreeNode?.label,
      createChildCompany: false,
      aiExtractedCompanyData: aiExtractedCompanyData,
    };

    if (expandedAccordion === AccordionTitles.OPPORTUNITY_SELECTION) {
      paramState[AccordionTitles.CONTACT_SELECTION] = {
        values: accordionStates[AccordionTitles.CONTACT_SELECTION].value,
      };
    }
    navigate(path, {
      state: paramState,
    });
  };

  const isLinkButtonEnabled =
    expandedAccordion === AccordionTitles.CONTACT_SELECTION ||
    expandedAccordion === AccordionTitles.OPPORTUNITY_SELECTION
      ? true
      : !matchedCompanyResult.isNameMatched;

  return (
    <UploadContainer>
      <StyledCardBackground>
        <Typography variant="h4">
          {matchedCompanyResult.isNameMatched
            ? `Found a perfect match for “${debouncedName}” !`
            : treeData.length === 0
            ? `No companies found matching “${debouncedName}”. Would you like to create a new company?`
            : `Here are the match results for “${debouncedName}”:`}
        </Typography>
        <AccordionContainer>
          {accordionData.map((item) => (
            <StyledAccordion
              key={item.title}
              disabled={
                expandedAccordion !== item.title &&
                (!accordionStates[item.title as AccordionTitles]?.value ||
                  accordionStates[item.title as AccordionTitles]?.value
                    ?.length === 0)
              }
              expanded={expandedAccordion === item.title}
            >
              <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
                <AccordionHeaderContainer
                  style={{
                    display: "flex",
                    width: "100%",
                    justifyContent: "space-between",
                    flexDirection: "row",
                    marginRight: "15px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      flexDirection: "row",
                    }}
                  >
                    <AccordionImage
                      src={
                        accordionStates[item.title].value?.length > 0
                          ? accordionSelected
                          : accordionDeselected
                      }
                      alt={`${item.title} status`}
                    />
                    <AccordionTitle>{item.title}</AccordionTitle>
                    {accordionStates[item.title].value?.length > 0 && (
                      <SelectedValue>
                        -{" "}
                        {accordionStates[item.title as any].value
                          ?.map((item) => item.title)
                          .join(", ")}
                      </SelectedValue>
                    )}
                  </div>
                  <>
                    {item.link &&
                      expandedAccordion === item.title &&
                      isLinkButtonEnabled && (
                        <StyledLinkButton
                          onClick={() => handleLinkClick(item.link!.path)}
                        >
                          {item.link.label}{" "}
                          {expandedAccordion ===
                            AccordionTitles.COMPANY_SELECTION &&
                            "with - " + debouncedName}
                        </StyledLinkButton>
                      )}
                  </>
                </AccordionHeaderContainer>
              </StyledAccordionSummary>
              <StyledAccordionDetails>
                <Box>
                  {/* Conditional Rendering */}
                  {Array.isArray(item.content)
                    ? // If item.content is an array, map over it and render each item
                      item.content.map((contentItem, index) => (
                        <Box key={index}>{contentItem}</Box>
                      ))
                    : // If item.content is not an array, render it directly
                      item.content}

                  {/* {item.link && isLinkButtonEnabled && (
                    <StyledLinkButton
                      onClick={() => handleLinkClick(item.link!.path)}
                    >
                      {item.link.label}{" "}
                      {expandedAccordion ===
                        AccordionTitles.COMPANY_SELECTION &&
                        "with - " + debouncedName}
                    </StyledLinkButton>
                  )} */}
                </Box>
              </StyledAccordionDetails>
            </StyledAccordion>
          ))}
        </AccordionContainer>
        {/* Buttons */}
        <UploadCompanyButtonsContainer>
          <Button variantType="link" onClick={handleGoBack}>
            {GO_BACK}
          </Button>
          <ProceedButton
            variantType="secondary"
            onClick={handleProceedClick}
            disabled={!isValid}
          >
            {PROCEED}
          </ProceedButton>
        </UploadCompanyButtonsContainer>
      </StyledCardBackground>
    </UploadContainer>
  );
};

export default UploadCompany;
