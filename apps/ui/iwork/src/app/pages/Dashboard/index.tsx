import React, { useLayoutEffect, useRef, useState } from "react";
import { CircularProgress, Typography, RadioGroup, FormControlLabel, Radio } from "@mui/material";
// Material-UI imports removed - using custom SVG icons instead
import BusinessPerformance from "../../components/BusinessPerformance";
import ManageEngagements from "../ManageEngagements";
import {
  DashboardContainer,
  DashboardHeader,
  DashboardLeftColumn,
  DashboardMainContent,
  DashboardRightColumn,
  DashboardSubtitle,
  DashboardTitle,
  LeftCardBackground,
  SectionHeader,
  RightCardBackground,
  CenteredLoadingContainer,
  ANNOUNCEMENT_ACCORDION_STYLES,
} from "./styles";
import {
  FeatureKey,
  selectHasPermission,
  useApiQuery,
  endPoints,
  getCurrentFinancialYearDefault,
  CommonAccordion,
} from "@ui/ui-lib";
import { BREADCRUMB_KEYS, BUSINESS_PERFORMANCE } from "@ui/ui-lib/constants";
import { useSelector } from "react-redux";
import Announcement from "../../components/Announcement";
import CelebrationsCard from "../../components/CelebrationsCard";
import Unauthorized from "../UnauthorizedPage";
import TatSummary from "./TatSummary";
import PolicyIcon from "../../assets/svgs/new-policy.svg";
import ProcessClaimIcon from "../../assets/svgs/process-claim.svg";
import EndorsementIcon from "../../assets/svgs/endorsement.svg";
import { useLocation } from "react-router-dom";
import SmartActions from "./SmartActions";
import {
  POLICY_EXPIRY_BEYOND_90_DRILLDOWN_DAYS,
  POLICY_EXPIRY_BUCKET_DAY_MAP,
  POLICY_EXPIRY_BUCKET_LABELS,
} from "../../components/BusinessPerformance/tatDrilldownConfig";

// TypeScript interfaces for API responses
interface TatBucket {
  label: string;
  range: {
    from: number;
    to: number | null;
  };
  count: number;
}

interface TatSection {
  title: string;
  totalCount: number;
  buckets: TatBucket[];
}

interface TatSummaryApiResponse {
  endorsements: TatSection;
  claims: TatSection;
}

interface PolicySummaryApiResponse {
  policyTypesDistribution: Array<{
    iirmPolicyTypeLid: number;
    iirmPolicyType: string;
    premiumAmount: number;
    brokerageAmount: number;
    policyCount: number;
  }>;
  policyExpiryTimeline: Array<{
    label: string;
    count: number;
  }>;
}

// Transform Policy Summary API response to TatData format for policy expiry timeline
const transformPolicyExpiryTimelineData = (
  data: PolicySummaryApiResponse | undefined
) => {
  if (!data || !data.policyExpiryTimeline) return [];

  return data.policyExpiryTimeline.map((item) => {
    let tatStatus: "red" | "yellow" | "blue" | "green" = "green";
    let days = 0;
    const normalizedLabel = item.label.toLowerCase();
    const includesBucket = (bucketLabel: string) =>
      normalizedLabel.includes(bucketLabel.toLowerCase());

    // Determine status based on label (time period)
    if (includesBucket(POLICY_EXPIRY_BUCKET_LABELS.NEXT_30_DAYS)) {
      tatStatus = "red";
      days = POLICY_EXPIRY_BUCKET_DAY_MAP[POLICY_EXPIRY_BUCKET_LABELS.NEXT_30_DAYS] ?? 0;
    } else if (includesBucket(POLICY_EXPIRY_BUCKET_LABELS.NEXT_60_DAYS)) {
      tatStatus = "yellow";
      days = POLICY_EXPIRY_BUCKET_DAY_MAP[POLICY_EXPIRY_BUCKET_LABELS.NEXT_60_DAYS] ?? 0;
    } else if (includesBucket(POLICY_EXPIRY_BUCKET_LABELS.NEXT_90_DAYS)) {
      tatStatus = "blue";
      days = POLICY_EXPIRY_BUCKET_DAY_MAP[POLICY_EXPIRY_BUCKET_LABELS.NEXT_90_DAYS] ?? 0;
    } else if (includesBucket(POLICY_EXPIRY_BUCKET_LABELS.BEYOND_90_DAYS)) {
      tatStatus = "green";
      days = POLICY_EXPIRY_BEYOND_90_DRILLDOWN_DAYS;
    }

    return {
      tatStatus,
      label: item.label,
      count: item.count || 0,
      days: days || 0,
    };
  });
};

// Transform TAT Summary API response to TatData format
const transformTatSummaryData = (data: TatSummaryApiResponse | undefined) => {
  if (!data) return { endorsements: [], claims: [] };

  const transformBuckets = (
    buckets: TatBucket[],
    type: "endorsement" | "claim"
  ) => {
    return (
      buckets?.map((bucket) => {
        let tatStatus: "green" | "yellow" | "orange" | "red" = "green";

        // Determine color based on the range.to value
        const toValue = bucket.range?.to;

        if (toValue !== null && toValue !== undefined) {
          if (toValue <= 3) {
            tatStatus = "green"; // < 3 Days → Green
          } else if (toValue <= 7) {
            tatStatus = "yellow"; // < 7 Days → Yellow
          } else if (toValue <= 14) {
            tatStatus = "orange"; // < 14 Days → Orange
          } else {
            tatStatus = "red"; // > 14 Days → Red
          }
        } else {
          // Fallback: if no 'to' value, it is the "> 14 Days" bucket
          tatStatus = "red";
        }

        return {
          tatStatus,
          label: bucket.label,
          count: bucket.count || 0,
        };
      }) || []
    );
  };

  return {
    endorsements: transformBuckets(data.endorsements?.buckets, "endorsement"),
    claims: transformBuckets(data.claims?.buckets, "claim"),
  };
};

interface DashboardPageProps {
  showIframe?: boolean;
}

const DashboardPage: React.FC<DashboardPageProps> = () => {
  const viewCelebrationsAnnouncements = useSelector((state: unknown) =>
    selectHasPermission(FeatureKey.VIEW_DASHBOARD)(state)
  );
  const [announcementsOpen, setAnnouncementsOpen] = useState(true);
  const userData = sessionStorage.getItem("user");
  // Get user data from sessionStorage to extract ownerId
  const getUserId = () => {
    try {
      if (userData) {
        const parsedUser = JSON.parse(userData);
        return parsedUser?.userId || null;
      }
    } catch (error) {
      console.error("Error parsing user data from sessionStorage:", error);
    }
    return null;
  };

  const userId = getUserId();
  const organisationId = userData ? JSON.parse(userData)?.organisationId : null;

  const [viewBy, setViewBy] = useState<"self" | "self_team" | "self_org">("self");

  // TAT Summary API call with ownerId and viewBy parameters
  const tatSummaryUrl = userId
    ? `${endPoints.tatSummaryData}?ownerId=${userId}&viewBy=team`
    : endPoints.tatSummaryData;
  const {
    data: tatSummaryData,
    isLoading: tatSummaryLoading,
    error: tatSummaryError,
  } = useApiQuery({
    url: tatSummaryUrl,
    queryKey: [BUSINESS_PERFORMANCE.QUERY_KEYS.TAT_SUMMARY_DATA, tatSummaryUrl],
    enabled: true,
  });

  // Policy Summary API call without any filters
  const currentFinancialYear = getCurrentFinancialYearDefault().value;
  const policySummaryUrl = `${endPoints.policySummaryData}?userId=${userId}&owner=team&organisationId=${organisationId}&financialYear=${currentFinancialYear}`;
  const {
    data: policySummaryData,
    isLoading: policySummaryLoading,
    error: policySummaryError,
  } = useApiQuery({
    url: policySummaryUrl,
    queryKey: [
      BUSINESS_PERFORMANCE.QUERY_KEYS.POLICY_SUMMARY_DATA,
      policySummaryUrl,
    ],
    enabled: true,
  });

  // Transform TAT Summary data
  const transformedTatData = transformTatSummaryData(tatSummaryData?.data);
  const endorsementData = transformedTatData.endorsements;
  const claimsData = transformedTatData.claims;
  const location = useLocation();
  const policyListingRef = useRef<HTMLDivElement | null>(null);

  const fromPolicyListing =
    location.state?.lastRemovedBreadcrumb?.key === BREADCRUMB_KEYS.POLICY;

  useLayoutEffect(() => {
    if (!fromPolicyListing) return;

    // The dashboard paints first and widgets fill in as their data loads, so
    // the target may not be laid out yet. Poll with rAF until it has real
    // height, then scroll. A time cap prevents waiting forever.
    let rafId: number;
    const start = performance.now();
    const MAX_WAIT_MS = 8000;

    const tryScroll = () => {
      const node = policyListingRef.current;
      if (node && node.offsetHeight > 0) {
        node.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      if (performance.now() - start < MAX_WAIT_MS) {
        rafId = requestAnimationFrame(tryScroll);
      }
    };

    rafId = requestAnimationFrame(tryScroll);
    return () => cancelAnimationFrame(rafId);
  }, [fromPolicyListing]);

  // Transform Policy Expiry Timeline data
  const policyExpiryData = transformPolicyExpiryTimelineData(
    policySummaryData?.data
  );

  // Smart Actions data
  const smartActionsData = [
    {
      icon: PolicyIcon,
      label: "New Policy",
      actionType: "create-policy",
    },
    {
      icon: ProcessClaimIcon,
      label: "Process Claim",
      actionType: "create-claim",
    },
    {
      icon: EndorsementIcon,
      label: "Endorsement",
      actionType: "create-endorsement",
    },
  ];

  return (
    <DashboardContainer>
      <DashboardHeader>
        <DashboardTitle>Welcome to Your Dashboard</DashboardTitle>
        <DashboardSubtitle>
          An overview of your business performance, tasks and team updates
        </DashboardSubtitle>
      </DashboardHeader>
      <DashboardMainContent>
        <DashboardLeftColumn>
          <LeftCardBackground>
            <SectionHeader sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
              My Actionable
              <RadioGroup
                row
                value={viewBy}
                onChange={(_, value) => setViewBy(value as "self" | "self_team" | "self_org")}
              >
                <FormControlLabel value="self" control={<Radio size="small" sx={{ color: "text.primary", "&.Mui-checked": { color: "primary.main" } }} />} label={<Typography sx={{ fontWeight: viewBy === "self" ? 700 : 400 }}>Manager</Typography>} />
                <FormControlLabel value="self_team" control={<Radio size="small" sx={{ color: "text.primary", "&.Mui-checked": { color: "primary.main" } }} />} label={<Typography sx={{ fontWeight: viewBy === "self_team" ? 700 : 400 }}>Manager + Team</Typography>} />
                {/* <FormControlLabel value="self_org" control={<Radio size="small" sx={{ color: "text.primary", "&.Mui-checked": { color: "primary.main" } }} />} label={<Typography sx={{ fontWeight: viewBy === "self_org" ? 700 : 400 }}>Manager + Org</Typography>} /> */}
              </RadioGroup>
            </SectionHeader>
            <ManageEngagements
              hideHeader={true}
              headerCustomStyles={{ height: "fit-content" }}
              viewBy={viewBy}
            />
          </LeftCardBackground>
          <LeftCardBackground>
            <BusinessPerformance />
          </LeftCardBackground>
        </DashboardLeftColumn>
        <DashboardRightColumn>
          {/* <RightCardBackground>
            <SmartActions
              actionsData={smartActionsData}
              title="Smart Actions"
              subTitle=""
            />
          </RightCardBackground> */}
          {/* Endorsement TAT Widget */}
          {/* <RightCardBackground ref={policyListingRef}>
            {tatSummaryLoading ? (
              <CenteredLoadingContainer>
                <CircularProgress />
              </CenteredLoadingContainer>
            ) : tatSummaryError ? (
              <Typography color="error">
                {BUSINESS_PERFORMANCE.ERRORS.ENDORSEMENT_TAT_DATA}
              </Typography>
            ) : (
              <TatSummary
                tatData={endorsementData}
                dataType={BUSINESS_PERFORMANCE.DATA_TYPES.ENDORSEMENT}
              />
            )}
          </RightCardBackground> */}

          {/* Claims TAT Widget */}
          {/* <RightCardBackground>
            {tatSummaryLoading ? (
              <CenteredLoadingContainer>
                <CircularProgress />
              </CenteredLoadingContainer>
            ) : tatSummaryError ? (
              <Typography color="error">
                {BUSINESS_PERFORMANCE.ERRORS.CLAIMS_TAT_DATA}
              </Typography>
            ) : (
              <TatSummary
                tatData={claimsData}
                dataType={BUSINESS_PERFORMANCE.DATA_TYPES.CLAIMS}
              />
            )}
          </RightCardBackground> */}

          {/* Policy Expiry Timeline Widget */}
          {/* <RightCardBackground ref={policyListingRef}>
            {policySummaryLoading ? (
              <CenteredLoadingContainer>
                <CircularProgress />
              </CenteredLoadingContainer>
            ) : policySummaryError ? (
              <Typography color="error">
                {BUSINESS_PERFORMANCE.ERRORS.POLICY_EXPIRY_TIMELINE_DATA}
              </Typography>
            ) : (
              // <TatSummary
              //   showIndicator={false}
              //   tatData={policyExpiryData}
              //   dataType={BUSINESS_PERFORMANCE.DATA_TYPES.POLICIES}
              // />

              <TatSummary
                showIndicator={false}
                tatData={policyExpiryData}
                dataType={BUSINESS_PERFORMANCE.DATA_TYPES.POLICIES}
              />
            )}
          </RightCardBackground> */}

          <RightCardBackground>
            <SectionHeader>My Team Celebrations</SectionHeader>
            {viewCelebrationsAnnouncements ? (
              <CelebrationsCard />
            ) : (
              <Unauthorized />
            )}
          </RightCardBackground>

            <CommonAccordion
              expanded={announcementsOpen}
              onToggle={() => setAnnouncementsOpen((prev) => !prev)}
              customStyles={{
                accordion: ANNOUNCEMENT_ACCORDION_STYLES,
                details: { background: "transparent" },
              }}
              title={<SectionHeader>Announcements & Alerts</SectionHeader>}
              summary={<SectionHeader>Announcements & Alerts</SectionHeader>}
              details={
                viewCelebrationsAnnouncements ? (
                  <Announcement />
                ) : (
                  <Unauthorized />
                )
              }
            />
        </DashboardRightColumn>
      </DashboardMainContent>
    </DashboardContainer>
  );
};

export default DashboardPage;
