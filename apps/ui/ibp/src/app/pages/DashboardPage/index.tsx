import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  CustomModal,
  DocumentPreview,
  endPoints,
  useApiQuery,
} from "@ui/ui-lib";
import {
  DashboardSectionWrapper,
  DashboardWelcomeText,
  DashboardActionsGrid,
  DashboardActionItem,
  DashboardActionIcon,
  DashboardActionLabel,
  DashboardPoliciesSection,
  DashboardBottomImagesWrapper,
  BottomOverlayRightDecoration,
  BannerLeftImage,
  BannerRightSectionFirstImage,
  BannerRightSectionSecondImage,
  DashboardContainer,
  DashboardLoader,
  DashboardTopSpacer,
} from "./styles";
import { getFilteredDashboardActions } from "../../constants/index";
import MedicalCover from "../../components/MedicalCover";
import CommonLoader from "../../common/CommonLoader";
import PersonalInsurances from "../../components/Dashboard/PersonalInsurances";
import WellnessSummary from "../../components/Dashboard/WellnessSummary";
import ClaimSummary from "../../components/Dashboard/ClaimSummary";
import DashboardBannerSection from "../../components/Dashboard/DashboardBannerSection";
import grassSvg from "../../assets/svgs/border-grass-decoration.svg";
import familygroupImg from "../../assets/svgs/group-members-illustration.svg";
import plantSvg from "../../assets/svgs/plants-decoration.svg";
import WellnessCard from "../../common/WellnessCard";
import CompanyInsurances from "../../components/Dashboard/CompanyInsurances";
import WellnessBenefitsCards from "../../components/WellnessBenefitsCards";
import { useSelector } from "react-redux";
import { Box, Typography } from "@mui/material";
import { theme } from "@ui/ui-lib";
import { RootState } from "../../redux/store";
import { flattenPoliciesWithStatus } from "../../utils/flattenPolicies";
import EmployeeDetails from "../../components/EmployeeDetails";
import EnrollmentBannerCard from "../../common/EnrollmentBannerCard";
import { DashboardBannerCardsWrapper } from "./styles";
import DashboardBenefitsSection from "../../components/DashboardBenifitsSection";
import FAQ from "../../components/FAQ";

type ClaimsOverviewResponse = {
  policyTabs: { policyType: string; label: string }[];
  policies: Array<{
    policyNumber?: string;
    policyExpiry?: string;
    isParentalPolicy: boolean;
    sumInsured?: number;
    claimsStatusCounts?: {
      total?: number;
      approved?: number;
      pending?: number;
      actionRequired?: number;
      settled?: number;
      inProgress?: number;
      isParentalPolicy?: boolean;
    };
    coverage?: { claimed?: number; available?: number };
    claims?: Array<{
      memberName: string;
      relation?: string | null;
      claimNumber: string;
      claimDate?: string;
      claimAmount?: number;
      settledAmount?: number;
      documentsLabel?: string;
      status?: string;
    }>;
    familyMembersCovered?: Array<{ name: string; relation: string }>;
  }>;
};

type EmployeeDetailsResponse = {
  data?: {
    employeeName?: string;
    employeeId?: string | number;
    dateOfBirth?: string;
    email?: string;
    phoneNumber?: string;
  };
};

interface PoliciesData {
  data?: {
    employeePolicies?: Array<Record<string, unknown>>;
    enrolledPolicies?: Array<Record<string, unknown>>;
  };
}

type DashboardBannerResponse = {
  data: {
    id: number;
    welcomeTitlePrefix: string;
    welcomeTitleSuffix: string;
    description: string;
    cards: { id: number; heading: string; content: string }[];
    welcomeText: string;
    actionItems: { id: number; label: string }[];
    wellnessBenefitsHeading: string;
    wellnessBenefitsCards: {
      id: number;
      title: string;
      subtitle: string;
      descriptionItems: string[];
      buttonLabel: string;
      date: string;
    }[];
    wellnessJourneyTitle: string;
    wellnessJourneyCards: {
      id: number;
      title: string;
      description: string;
      features: string[];
      buttonLabel: string;
    }[];
    medicalCover: {
      headerTitle: string;
      headerSubtitle: string;
      headerPrefix: string;
      benefitItems: string[];
      buttonLabel: string;
      buttonEditLabel: string;
      buttonViewLabel: string;
      buttonText: string;
    };
    personalInsurancesHeading: { heading: string };
    claimSummaryLabels: {
      pageTitle: string;
      claimStatus: string;
      totalClaims: string;
      approved: string;
      pending: string;
      actionRequired: string;
      policyNumber: string;
      policyExpiry: string;
      sumInsured: string;
      available: string;
      claimed: string;
      claimRequested: string;
      claimAmount: string;
    };
  } | null;
};

const DashboardTopSection: React.FC = () => {
  const navigate = useNavigate();
  const [policiesData, setPoliciesData] = useState<PoliciesData | undefined>();
  const [isEmployeeDetailsCollapsed, setIsEmployeeDetailsCollapsed] =
    useState<boolean>(false);
  const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);
  const [selectedPolicyForModal, setSelectedPolicyForModal] =
    useState<any>(null);

  const userDetails = JSON.parse(sessionStorage.getItem("user") || "{}");
  const employeeId = userDetails?.id;
  const userName = userDetails?.employeeName || userDetails?.fullName;
  const employeeDetailsSpacerHeight = isEmployeeDetailsCollapsed
    ? "100px"
    : "290px";

  const handleEmployeeDetailsToggle = useCallback(() => {
    setIsEmployeeDetailsCollapsed((previous) => !previous);
  }, []);

  const handleActionClick = (path: string) => {
    navigate(path);
  };

  // Fetch employee details for the dashboard banner.
  const { data: employeeDetailsResponse } = useApiQuery({
    queryKey: ["employeeDetails", employeeId],
    url: employeeId ? endPoints.employeeDetails : "",
    enabled: Boolean(employeeId),
  });

  const { data: policyFeatureDocsResponse } = useApiQuery({
    queryKey: ["policyFeatureDocsForModal", employeeId],
    url: endPoints.policyFeatureDocumentsByEmployee(employeeId),
    enabled: Boolean(employeeId),
  });

  const employeeDetails = useMemo(() => {
    const payload = employeeDetailsResponse as
      | EmployeeDetailsResponse
      | undefined;
    return payload?.data ?? (payload as any)?.data?.data ?? null;
  }, [employeeDetailsResponse]);

  // const { data: Policies, isLoading: isPoliciesLoading } = useApiQuery({
  //   queryKey: ["policiesData"],
  //   url: endPoints.employeePolicies(employeeId),
  //   enabled: false,
  // });

  const policies = useSelector(
    (state: RootState) => state.policyData.policiesData,
  );
  const isPoliciesLoading = useSelector(
    (state: RootState) => state.policyData.loading,
  );
  const wellnessConfig = useSelector(
    (state: RootState) =>
      state.portalConfig.data?.companyPortalDashboardConfig?.wellness,
  );
  const showWellnessSections = Boolean(
    wellnessConfig?.physicalWellness?.enabled ||
      wellnessConfig?.emotionalWellness?.enabled,
  );

  // Check for Group Mediclaim Policy availability
  const groupMediclaimPolicyId = useMemo(() => {
    if (!policies) return null;

    // Helper to find the policy within a specific array
    const findIn = (arr?: any[]) =>
      arr?.find((p) => p?.policyName?.includes("Group Mediclaim Policy"))
        ?.policyId || null;

    // Try employeePolicies first, then enrolledPolicies
    return (
      findIn(policies.employeePolicies) ||
      findIn(policies.enrolledPolicies) ||
      null
    );
  }, [policies]);

  const {
    data: claimsOverviewResponse,
    isLoading: isClaimsLoading,
    isFetching: isClaimsFetching,
  } = useApiQuery({
    queryKey: ["claimsOverviewDashboard", employeeId],
    url: employeeId ? endPoints.employeeClaimsOverview(employeeId) : "",
    enabled: Boolean(employeeId),
  });


  const claimsSummaryData = useMemo(() => {
    const claimsData: ClaimsOverviewResponse | undefined =
      (claimsOverviewResponse as any)?.data?.data ??
      (claimsOverviewResponse as any)?.data;
    if (!claimsData?.policies?.length) return null;

    return claimsData;
  }, [claimsOverviewResponse?.data]);

  const policiesDataFromRedux = useSelector(
    (state: any) => state.policyData.policiesData,
  );

  const flattenedPolicies = flattenPoliciesWithStatus(policiesDataFromRedux);

  const dashboardContent: DashboardBannerResponse["data"] | null = null;

  // Get filtered dashboard actions based on Group Mediclaim Policy availability
  const dashboardActions = useMemo(() => {
    return getFilteredDashboardActions(
      !!groupMediclaimPolicyId,
      flattenedPolicies,
    );
  }, [groupMediclaimPolicyId, flattenedPolicies]);

  const displayActions = useMemo(() => {
    if (!dashboardContent?.actionItems?.length) {
      return dashboardActions;
    }

    return dashboardActions.map((action, index) => ({
      ...action,
      label: dashboardContent.actionItems[index]?.label ?? action.label,
    }));
  }, [dashboardActions, dashboardContent?.actionItems]);

  useEffect(() => {
    if (policies) {
      setPoliciesData(policies);
    }
  }, [policies]);

  const policyDocument = useMemo(() => {
    const payload =
      policyFeatureDocsResponse?.data?.data ??
      policyFeatureDocsResponse?.data ??
      [];
    if (!Array.isArray(payload) || payload.length === 0) return null;

    const matchByPolicy = (doc: any) => {
      if (!selectedPolicyForModal) return false;
      const selectedPolicyId = String(selectedPolicyForModal?.policyId ?? "");
      const selectedPolicyNumber = String(
        selectedPolicyForModal?.policyNumber ?? "",
      );
      const selectedPolicyName = String(
        selectedPolicyForModal?.policyName ?? "",
      ).toLowerCase();

      return (
        (doc?.policyId &&
          selectedPolicyId &&
          String(doc.policyId) === selectedPolicyId) ||
        (doc?.policyNumber &&
          selectedPolicyNumber &&
          String(doc.policyNumber) === selectedPolicyNumber) ||
        (doc?.policyName &&
          selectedPolicyName &&
          String(doc.policyName).toLowerCase() === selectedPolicyName)
      );
    };

    const firstDoc =
      payload.find(matchByPolicy) ??
      payload.find((doc: any) => doc?.policyId || doc?.policyNumber) ??
      payload[0];

    return {
      documentId:
        firstDoc?.documentId ??
        firstDoc?.fileId ??
        firstDoc?.id ??
        firstDoc?.document?.id,
      fileName: firstDoc?.fileName ?? firstDoc?.name ?? "Policy Features.pdf",
      mimeType:
        firstDoc?.mimeType ??
        firstDoc?.fileMimeType ??
        firstDoc?.document?.mimeType ??
        "application/pdf",
      lastUpdated:
        firstDoc?.lastUpdated ??
        firstDoc?.updatedAt ??
        firstDoc?.uploadedAt ??
        null,
      policyName: firstDoc?.policyName ?? firstDoc?.name ?? "Policy Document",
    };
  }, [policyFeatureDocsResponse, selectedPolicyForModal]);

  // Block render until loading is false and policiesData is available
  if (isPoliciesLoading || !policiesData || policiesData.length === 0) {
    return (
      <DashboardLoader>
        <CommonLoader />
      </DashboardLoader>
    );
  }

  return (
    <DashboardContainer>
      {/* === Employee Details === */}
      <DashboardTopSpacer height={employeeDetailsSpacerHeight} />
      <EmployeeDetails
        name={employeeDetails?.employeeName || userName}
        employeeCode={employeeDetails?.companyEmployeeId?.toString()}
        dateOfBirth={employeeDetails?.dateOfBirth}
        email={employeeDetails?.email}
        phone={employeeDetails?.phone}
        isCollapsed={isEmployeeDetailsCollapsed}
        onToggle={handleEmployeeDetailsToggle}
      />
      <DashboardBenefitsSection
        onOpenPolicyFeatures={(policy) => {
          setSelectedPolicyForModal(policy);
          setIsEnrollmentModalOpen(true);
        }}
      />
      <CustomModal
        open={isEnrollmentModalOpen}
        handleClose={() => setIsEnrollmentModalOpen(false)}
        heading={
          <Typography sx={{ color: theme.palette.primary.main }}>
            Policy Features
          </Typography>
        }
        modalBoxStyles={{ maxWidth: "90%", width: "85%" }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {policyDocument?.documentId ? (
            <DocumentPreview
              fileId={policyDocument.documentId}
              fileName={policyDocument.fileName}
              mimeType={policyDocument.mimeType}
              getFileDownloadUrl={endPoints.ibpFileUploadDownloadById}
              previewHeight="60vh"
              toolbarPlacement="bottom"
              showFileMeta={false}
              toolbarAlignment="start"
              showDownloadButton={false}
            />
          ) : (
            <Typography>No policy feature document available.</Typography>
          )}

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variantType="gradient"
              onClick={() => {
                setIsEnrollmentModalOpen(false);
                if (selectedPolicyForModal?.isEditable === false) {
                  navigate("/unified-summary");
                  return;
                }
                navigate("/unified-enrollment", {
                  state: {
                    policyInfo: selectedPolicyForModal,
                  },
                });
              }}
            >
              Continue Enrolment
            </Button>
          </Box>
        </Box>
      </CustomModal>
      {/* <DashboardBannerCardsWrapper> */}
      <EnrollmentBannerCard
        header="Enrolment window for 2026-27 is open"
        subheader="Additional coverage you can choose to enhance your protection"
        buttonText="Start Your Enrolment"
        background="linear-gradient(90deg, #9BE8F6 0%, #67DFE8 99.39%)"
        // onButtonClick={() => {
        //   console.log("hrjnkjn");
        //   navigate("/unified-enrollment");
        // }}
      />
      <FAQ
        title="Frequently Asked Questionsknnkjnkjnjk"
        subtitle="Additional coverage you can choose to enhance your protection"
        showViewMore={true}
        limit={5}
      />
      <EnrollmentBannerCard
        header="Need help understanding your benefits?"
        subheader="Explore your coverage details and optional add-ons in one place"
        buttonText="Start Your Enrolment"
        background="linear-gradient(90deg, #BBF69B 0%, #ABF086 99.39%)"
        onButtonClick={() => navigate("/unified-enrollment")}
      />
      {/* </DashboardBannerCardsWrapper> */}
      {/* === Wellness Banner === */}
      <DashboardBannerSection userName={userName} banner={dashboardContent} />
      {/* === Welcome Action Section === */}
      <DashboardSectionWrapper data-testid="ibp-dashboard-action-section">
        <DashboardWelcomeText>
          {dashboardContent?.welcomeText ?? ""}
        </DashboardWelcomeText>

        <DashboardActionsGrid>
          {displayActions.map((action, index) => (
            <DashboardActionItem
              data-testid="ibp-dashboard-action-item"
              key={index}
              onClick={() => handleActionClick(action.path)}
              style={{ cursor: "pointer" }}
            >
              <DashboardActionIcon src={action.icon} alt={action.label} />
              <DashboardActionLabel>{action.label}</DashboardActionLabel>
            </DashboardActionItem>
          ))}
        </DashboardActionsGrid>
        <DashboardBottomImagesWrapper>
          <BannerLeftImage src={grassSvg} alt="Left decoration" />
          <BottomOverlayRightDecoration>
            <BannerRightSectionFirstImage
              src={plantSvg}
              alt="Plant illustration"
            />
            <BannerRightSectionSecondImage
              src={familygroupImg}
              alt="Family illustration"
            />
          </BottomOverlayRightDecoration>
        </DashboardBottomImagesWrapper>
      </DashboardSectionWrapper>
      <WellnessCard
        title={dashboardContent?.wellnessJourneyTitle}
        cards={dashboardContent?.wellnessJourneyCards}
      />

      {/* Policies Section */}
      {isPoliciesLoading ? (
        <CommonLoader />
      ) : (
        <DashboardPoliciesSection>
          {/* {policiesData && policiesData?.employeePolicies?.length > 0 && ( */}
          <MedicalCover
            policiesData={policiesData}
            userName={userName}
            content={dashboardContent?.medicalCover}
          />
          {/* )} */}
          {policiesData && policiesData?.enrolledPolicies?.length > 0 && (
            <CompanyInsurances policiesData={policiesData} />
          )}
        </DashboardPoliciesSection>
      )}

      <PersonalInsurances
        heading={dashboardContent?.personalInsurancesHeading?.heading}
      />
      {showWellnessSections && <WellnessSummary />}
      <Box
        maxWidth="1366px"
        margin="auto"
        padding={theme.spacing(0, 18.75, 10)}
      >
        {claimsSummaryData ? (
          <ClaimSummary
            summary={claimsSummaryData}
            labelsOverride={dashboardContent?.claimSummaryLabels}
            employeeId={employeeId}
          />
        ) : (
          <CommonLoader />
        )}
      </Box>
      {showWellnessSections && (
        <WellnessBenefitsCards
          heading={dashboardContent?.wellnessBenefitsHeading}
          cards={dashboardContent?.wellnessBenefitsCards}
        />
      )}
    </DashboardContainer>
  );
};

export default DashboardTopSection;
