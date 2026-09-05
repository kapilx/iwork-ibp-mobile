import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ButtonContainer,
  Container,
  EditButton,
  Buttons,
  LoaderContainer,
  OpportunitiesDetailsStyledContainer,
} from "./styles";

import { CircularProgress, Typography } from "@mui/material";
import editIcon from "../../../assets/svgs/edit-icon.svg";
import { EDIT, MANAGE_QUOTES } from "../../../constants";
import {
  opportunityBreadcrumbs,
  opportunityClaimExperience,
  opportunityOverview,
  opportunitySalesPitch,
  opportunityTabsConfig,
  previousPlacementDetails,
  setLocalizationConfig,
} from "./detailsConfig";
import OpportunityCard from "../../../components/OpportunityProgressStepper";
import {
  CardGridBackground,
  OverviewCardBackground,
} from "../../CompanyPage/CompanyDetails/styles";
import OpportunityActivities from "../../OpportunityActivities";
import { useDispatch, useSelector } from "react-redux";
import OpportunityLost from "../../../components/OpportunityLost";
import OpportunityHistory from "../OpportunityHistory";
import { useTransformedActivities } from "../../OpportunityActivities/Constants/activityConstants";

import {
  CommonBreadcrumb,
  NO_DATA_AVAILABLE,
  endPoints,
  useApi,
  CustomTabs,
  CommonDetailsSection,
  TabsContact,
  CardGrid,
  useLocalization,
  selectHasPermission,
  FeatureKey,
  StrategySection,
  DisplayDocuments,
  setCurrentOpportunityType,
  getBreadcrumbsFromState,
} from "@ui/ui-lib";
import { filterActivitiesByRole } from "../../OpportunityActivities/Constants/activityRoleVisibility";
import { useScopedActivityRoleVisibility } from "../../../Utils/useScopedActivityRoleVisibility";

const sectionMap = {
  opportunityOverview,
  opportunityClaimExperience,
  previousPlacementDetails,
  OpportunityActivities,
};

const componentMap: Record<string, React.FC> = {
  TabsContact,
};

const OpportunitiesDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [opportunityData, setOpportunityData] = useState<any | null>(null);
  const { data, doFetch } = useApi();
  const [breadCumbSep, setBreadCumbStep] = React.useState(0);
  const [submittedBreadCumb, setSubmittedBreadCumb] = React.useState(0);
  const [isOpportunityLost, setIsOpportunityLost] = useState(false);
  const [isOptyWorkInProgress, setIsOptyWorkInProgress] = useState(false);
  const [isOpportunityWon, setIsOpportunityWon] = useState(false);
  const { localizationData } = useLocalization();
  const {
    transformedActivities,
    setTransformedActivities,
    isLoading: isActivitiesLoading,
    isError: isActivitiesError,
  } = useTransformedActivities();
  React.useEffect(() => {
    setLocalizationConfig(localizationData?.data);
  }, [localizationData]);

  const canUpdateOpportunity = useSelector((state: any) =>
    selectHasPermission(FeatureKey.EDIT_OPPORTUNITY)(state)
  );

  // Summary card (progress stepper) must show only the current user's role
  // activities, mirroring the activities accordion. Filter with the same predicate
  // so both stay in sync on breadCumbSep.
  const { canViewBD, canViewISG } = useScopedActivityRoleVisibility();
  const visibleActivities = filterActivitiesByRole(
    transformedActivities,
    canViewBD,
    canViewISG
  );

  const { id: opportunityId } = useParams(); //id to fecth user contact details
  const activityStepIdFromRoute = location.state?.opportunities?.activityStep;
  useEffect(() => {
    if (opportunityId) {
      doFetch(endPoints.oppurtunityById(Number(opportunityId)));
    }
  }, []);
  useEffect(() => {
    if (activityStepIdFromRoute) {
      setBreadCumbStep(activityStepIdFromRoute);
    }
  }, [activityStepIdFromRoute]);
  useEffect(() => {
    if (data) {
      setOpportunityData(data?.data);
    }
  }, [data]);
  // Publish the opportunity type (SO/RO) so the sidebar can highlight the
  // correct menu item even when the detail page is opened via a direct URL.
  useEffect(() => {
    const type = opportunityData?.opportunityType?.lookUpValue;
    if (type) {
      dispatch(setCurrentOpportunityType(type));
    }
  }, [opportunityData, dispatch]);
  useEffect(() => {
    return () => {
      dispatch(setCurrentOpportunityType(null));
    };
  }, [dispatch]);
  useEffect(() => {
    if (data?.status === 403) {
      navigate("/unauthorized", { replace: true });
    }
  }, [opportunityData, navigate]);

  const handleUpdateOpportunity = () => {
    // Update contact details
    if (opportunityId) {
      navigate(`/opportunities/${opportunityId}/edit`, {
        state: location.state,
      });
    }
  };

  const tabs = opportunityTabsConfig?.map((tab) => {
    if (tab.sectionKey === "opportunityOverview") {
      const allSections = opportunityOverview(
        opportunityData?.opportunityType?.lookUpValue
      );
      return {
        ...tab,
        content: (
          <div>
            {allSections.map((section, index) => (
              <OverviewCardBackground key={`section-${index}`}>
                <CommonDetailsSection
                  sections={[section]}
                  data={opportunityData}
                />
              </OverviewCardBackground>
            ))}
          </div>
        ),
      };
    }

    if (tab.componentKey === "opportunityContacts") {
      const rows = opportunityData?.contacts || [];
      return {
        ...tab,
        content: (
          <CardGridBackground key={`section-${tab.sectionKey}`}>
            <CardGrid
              contacts={rows}
              companyName={opportunityData?.company?.companyName}
              companyId={opportunityData?.company?.id}
              hideAddContact={true}
            />
          </CardGridBackground>
        ),
      };
    }

    if (tab.sectionKey === "previousPlacementDetails") {
      const allSections = [...previousPlacementDetails];
      return {
        ...tab,
        content: (
          <div>
            {allSections.map((section, index) => (
              <OverviewCardBackground key={`section-${index}`}>
                <CommonDetailsSection
                  sections={[section]}
                  data={opportunityData}
                />
              </OverviewCardBackground>
            ))}
          </div>
        ),
      };
    }
    if (tab.sectionKey) {
      const section = sectionMap[tab.sectionKey];
      return {
        ...tab,
        content: (
          <OverviewCardBackground>
            <CommonDetailsSection sections={section} data={opportunityData} />
          </OverviewCardBackground>
        ),
      };
    }
    if (tab.componentKey === "OpportunityActivities") {
      return {
        ...tab,
        content: (
          // <CardGridBackground>
          <OpportunityActivities
            breadCumbSep={breadCumbSep}
            setBreadCumbStep={setBreadCumbStep}
            submittedBreadCumb={submittedBreadCumb}
            setSubmittedBreadCumb={setSubmittedBreadCumb}
            opportunityData={opportunityData}
            setIsOptyWorkInProgress={setIsOptyWorkInProgress}
            setIsOpportunityWon={setIsOpportunityWon}
            transformedActivities={transformedActivities}
            setTransformedActivities={setTransformedActivities}
            isActivitiesLoading={isActivitiesLoading}
            isActivitiesError={isActivitiesError}
          />
          // </CardGridBackground>
        ),
      };
    }
    if (tab.componentKey === "OpportunityLost") {
      return {
        ...tab,
        content: (
          <OpportunitiesDetailsStyledContainer>
            <OpportunityLost setIsOpportunityLost={setIsOpportunityLost} />
          </OpportunitiesDetailsStyledContainer>
        ),
      };
    }
    if (tab.componentKey === "OpportunitySalesPitch") {
      return {
        ...tab,
        content: (
          <StrategySection
            profile={opportunitySalesPitch}
            data={opportunityData}
          />
        ),
      };
    }

    if (tab.componentKey === "documents") {
    const opportunityType =
      opportunityData?.opportunityType?.lookUpValue === "RO"
        ? "renewal_opportunity"
        : "sales_opportunity";
    const prefix = `${opportunityType}_${opportunityId || "unknown"}`;
      return {
        ...tab,
        content: (
          <DisplayDocuments
            endPoint={endPoints.opportunityDocs(Number(opportunityId))}
            fileNamePrefix={prefix}
            downloadModuleKey="opportunity"
            permissionFeatureKey={FeatureKey.EXPORT_OPPORTUNITY}
          />
        ),
      };
    }

    if (tab.componentKey === "OpportunityHistory") {
      return {
        ...tab,
        content: (
          <OpportunityHistory
            isRenewal={opportunityData?.opportunityType?.lookUpValue === "RO"}
          />
        ),
      };
    }

    const Component = tab?.componentKey
      ? componentMap[tab.componentKey]
      : undefined;
    return {
      ...tab,
      content: Component ? <Component /> : null,
    };
  });
  if (!data && !opportunityData) {
    return (
      <Container>
        <LoaderContainer>
          <CircularProgress />
        </LoaderContainer>
      </Container>
    );
  }
  if (data && !opportunityData) {
    return (
      <Container>
        <Typography variant="h6" align="center" color="textSecondary">
          {NO_DATA_AVAILABLE}
        </Typography>
      </Container>
    );
  }

  return (
    <Container>
      <ButtonContainer>
        <CommonBreadcrumb
          crumbs={
            // When the user arrived from Manage Quotes, prefer the state-provided
            // breadcrumb trail so "back" returns to /manage-quotes rather than the
            // type-based /opportunities | /renewal-opportunities (spec §11.2b).
            location.state?.from === MANAGE_QUOTES &&
            getBreadcrumbsFromState(location.state).length > 0
              ? getBreadcrumbsFromState(location.state)
              : opportunityBreadcrumbs(
                  opportunityData.companyName,
                  opportunityData.opportunityType?.lookUpValue,
                  location.state?.filters ? location.state?.filters : null
                )
          }
        />

        {canUpdateOpportunity &&
          (opportunityData?.editable === undefined ||
            opportunityData?.editable) &&
          breadCumbSep < 2 && (
            <Buttons>
              <EditButton
                variantType="secondary"
                onClick={handleUpdateOpportunity}
              >
                <img src={editIcon} alt={EDIT} /> {EDIT}
              </EditButton>
            </Buttons>
          )}
      </ButtonContainer>
      <OpportunityCard
        opportunityDetails={{
          companyName: opportunityData?.company?.companyName as string,
          companyId: opportunityData?.company?.id,
          expiryDate: opportunityData?.expiryDate as string,
          policyType: opportunityData?.policyType?.lookUpValue,
          opportunityType: opportunityData?.opportunityType
            ?.lookUpValue as string,
          premium: opportunityData?.premiumPaid as string,
          brokerage: opportunityData?.estimatedBrokerage as string,
          crmLead: opportunityData?.owner as string,
          opportunityStatus: opportunityData?.status?.lookUpValue as string,
          opportunityId: opportunityData?.opportunityId as number,
        }}
        breadCumbSep={breadCumbSep}
        setBreadCumbStep={setBreadCumbStep}
        submittedBreadCumb={submittedBreadCumb}
        setSubmittedBreadCumb={setSubmittedBreadCumb}
        startDate={opportunityData?.soCreatedDate as string}
        endDate={opportunityData?.expiryDate as string}
        isOpportunityLost={isOpportunityLost}
        setIsOpportunityLost={setIsOpportunityLost}
        isOpportunityWon={isOpportunityWon}
        isOptyWorkInProgress={isOptyWorkInProgress}
        transformedActivities={visibleActivities}
        isActivitiesLoading={isActivitiesLoading}
      />
      {/* <SummaryCard
        data={{
          policyType: opportunityData?.policyType?.lookUpValue,
          companyName: opportunityData?.company?.companyName as string,
          expiryDate: opportunityData?.expiryDate as string,
          serviceLevel: opportunityData?.serviceLevel?.lookUpValue as string,
          opportunityType: opportunityData?.opportunityType.lookUpValue as string,
          opportunitySource: opportunityData?.opportunitySource?.lookUpValue as string,
        }}
        sections={opportunitySummaryCard}
        headerConfig={{
          titleKey: "companyName",
        }}
      /> */}
      <CustomTabs tabs={tabs} />
    </Container>
  );
};

export default OpportunitiesDetails;
