/* eslint-disable @nx/enforce-module-boundaries */
import {
  CardBackground,
  formatNumberShort,
  useLocalization,
  BUSINESS_PERFORMANCE,
  useApiQuery,
  endPoints,
  buildQueryString,
  formatNumberByLocalization,
  getBreadcrumbsFromState,
  createBreadcrumbEntry,
  DETAILS_LABELS,
  DETAILS_KEYS,
  BREADCRUMB_KEYS,
  buildBreadcrumbState,
  CLIENT_PORTFOLIO,
  MANAGE_CLAIMS,
} from "@ui/ui-lib";
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ALL_VALUE } from "../../../constants";
import { CircularProgress, Typography } from "@mui/material";
import {
  StyledButton,
  StyledCardTitle,
  StyledClaimHeader,
  StyledClaimsKpis,
  StyledClaimsValueBlock,
  StyledClaimValue,
  StyledClaimValueBlock,
  StyledClaimValueImage,
  StyledErrorContainer,
  StyledImg,
  StyledKpiCard,
  StyledKpiPercentage,
  StyledKpiTxt,
  StyledKpiValue,
  StyledLoadingContainer,
  StyledNoDataContainer,
  StyledTotalValueTxt,
} from "./styles";

import UserIcon from "../../../assets/svgs/claim-user.svg";
import NoteIcon from "../../../assets/svgs/claim-note.svg";
import WarningIcon from "../../../assets/svgs/claim-warning.svg";
import CustomersIcon from "../../../assets/svgs/overview-customers.svg";
import OverviewDollar from "../../../assets/svgs/overview-premium.svg";
import OverviewBrokerage from "../../../assets/svgs/overview-brokerage.svg";

interface OverviewCardProps {
  type: "claimsOverview" | "businessOverview";
  filters?: Record<string, unknown>;
}

interface BusinessOverviewData {
  totalCompanies: number;
  totalPolicies: number;
  totalPremiumCollected: number;
  totalBrokerageCollected: number;
}

interface ClaimsOverviewData {
  totalClaimsCount: number;
  totalClaimAmount: number;
  policiesWithClaimsCount: number;
  companiesWithClaimsCount: number;
}

interface KpiData {
  icon: string;
  iconAlt: string;
  iconWidth: number;
  value: string;
  text: string;
  percentage: string;
}

interface ClaimValueBlockData {
  value: number;
  totalValueText: string;
  icon: string;
  iconAlt: string;
  iconWidth: number;
}

interface TransformedData {
  header: string;
  buttonText: string;
  claimValueBlock: ClaimValueBlockData;
  kpis: KpiData[];
}

/**
 * Validates that filters parameter is a valid object
 */
const validateFilters = (filters: Record<string, unknown>): void => {
  if (!filters || typeof filters !== "object") {
    throw new Error("Filters must be a valid object");
  }
};

/**
 * Validates that type parameter is provided
 */
const validateRequiredType = (type: string): void => {
  if (!type?.trim()) {
    throw new Error("Type is required for OverviewCard component");
  }
};

/**
 * Strips out empty, null, undefined, and "ALL" values from filters
 */
const stripAllValues = (
  filters: Record<string, unknown>
): Record<string, unknown> => {
  const cleanedFilters: Record<string, unknown> = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (
      value !== ALL_VALUE &&
      value !== "" &&
      value !== null &&
      value !== undefined
    ) {
      cleanedFilters[key] = value;
    }
  });
  return cleanedFilters;
};

/**
 * Clean values for navigation, similar to BusinessPerformance component
 */
// Uncomments filters are required to retain filters when navigating
// const cleanValues = (filterValues: Record<string, unknown>): Record<string, unknown> => {
//   return Object.fromEntries(
//     Object.entries(filterValues).filter(
//       ([, value]) => value !== ALL_VALUE && value !== "" && value !== null
//     )
//   );
// };

/**
 * Renders loading state component
 */
const renderLoadingState = (): JSX.Element => (
  <CardBackground>
    <StyledLoadingContainer>
      <CircularProgress />
    </StyledLoadingContainer>
  </CardBackground>
);

/**
 * Renders error state component
 */
const renderErrorState = (): JSX.Element => (
  <CardBackground>
    <StyledErrorContainer>
      <Typography color="error">
        Failed to load overview data. Please try again.
      </Typography>
    </StyledErrorContainer>
  </CardBackground>
);

/**
 * Renders no data state component
 */
const renderNoDataState = (): JSX.Element => (
  <CardBackground>
    <StyledNoDataContainer>
      <Typography>No data available</Typography>
    </StyledNoDataContainer>
  </CardBackground>
);

function OverviewCard({ type, filters = {} }: OverviewCardProps): JSX.Element {
  // Validate required props following IIRM guidelines
  validateRequiredType(type);
  validateFilters(filters);

  const { localizationData } = useLocalization();
  const localization = localizationData?.data;
  const navigate = useNavigate();

  // Clean filters and build query string
  const cleanedFilters = stripAllValues(filters);
  const queryString = buildQueryString(cleanedFilters);

  // API call for overview data (handles both claims and business overview)
  const overviewUrl = `${endPoints.OverviewQuery}${queryString}`;
  const {
    data: overviewApiResponse,
    isLoading,
    error,
  } = useApiQuery({
    url: overviewUrl,
    queryKey: [BUSINESS_PERFORMANCE.QUERY_KEYS.OVERVIEW_DATA, overviewUrl],
    enabled: true, // Always enabled since we use this API for both card types
  });

  const claimsOverviewData = overviewApiResponse?.data
    ?.claimsOverview as ClaimsOverviewData;
  const businessOverviewData = overviewApiResponse?.data
    ?.businessOverview as BusinessOverviewData;

  const getTransformedData = (): TransformedData | null => {
    if (type === BUSINESS_PERFORMANCE.OVERVIEW_CARD_TYPES.CLAIMS) {
      if (!claimsOverviewData) {
        return null;
      }

      return {
        header: "Claims Overview",
        buttonText: BUSINESS_PERFORMANCE.LABELS.MANAGE_CLAIMS,
        claimValueBlock: {
          value: claimsOverviewData.totalClaimAmount || 0,
          totalValueText: BUSINESS_PERFORMANCE.LABELS.TOTAL_CLAIM_AMOUNT,
          icon: "",
          iconAlt: "Dollar",
          iconWidth: 32,
        },
        kpis: [
          {
            icon: UserIcon,
            iconAlt: "Companies",
            iconWidth: 16,
            value:
              formatNumberByLocalization(
                claimsOverviewData.companiesWithClaimsCount
              ) || "0",
            text: BUSINESS_PERFORMANCE.LABELS.CUSTOMER_COUNT,
            percentage: "",
          },
          {
            icon: NoteIcon,
            iconAlt: "Claims",
            iconWidth: 16,
            value:
              formatNumberByLocalization(
                claimsOverviewData.policiesWithClaimsCount
              ) || "0",
            text: BUSINESS_PERFORMANCE.LABELS.POLICY_COUNT,
            percentage: "",
          },
          {
            icon: WarningIcon,
            iconAlt: "Policies",
            iconWidth: 16,
            value:
              formatNumberByLocalization(claimsOverviewData.totalClaimsCount) ||
              "0",
            text: BUSINESS_PERFORMANCE.LABELS.CLAIM_COUNT,
            percentage: "",
          },
        ],
      };
    } else {
      if (!businessOverviewData) {
        return null;
      }

      return {
        header: "Business Service Overview",
        buttonText: BUSINESS_PERFORMANCE.LABELS.VIEW_MY_PORTFOLIO,
        claimValueBlock: {
          value: businessOverviewData.totalCompanies || 0,
          totalValueText: BUSINESS_PERFORMANCE.LABELS.TOTAL_CUSTOMERS,
          icon: CustomersIcon,
          iconAlt: "Customers",
          iconWidth: 32,
        },
        kpis: [
          {
            icon: NoteIcon,
            iconAlt: "Policies",
            iconWidth: 16,
            value:
              formatNumberByLocalization(businessOverviewData.totalPolicies) ||
              "0",
            text: BUSINESS_PERFORMANCE.LABELS.POLICIES,
            percentage: "",
          },
          {
            icon: OverviewDollar,
            iconAlt: "Premium",
            iconWidth: 16,
            value: formatNumberShort(
              businessOverviewData.totalPremiumCollected || 0,
              localization
            ),
            text: BUSINESS_PERFORMANCE.LABELS.PREMIUM,
            percentage: "",
          },
          {
            icon: OverviewBrokerage,
            iconAlt: "Brokerage",
            iconWidth: 16,
            value: formatNumberShort(
              businessOverviewData.totalBrokerageCollected || 0,
              localization
            ),
            text: BUSINESS_PERFORMANCE.LABELS.BROKERAGE,
            percentage: "",
          },
        ],
      };
    }
  };

  const location = useLocation();
  const existingBreadcrumbs = getBreadcrumbsFromState(location.state);
  const dashboardBreadcrumb =
    existingBreadcrumbs.length > 0
      ? existingBreadcrumbs
      : [
          createBreadcrumbEntry({
            label: DETAILS_LABELS.DASHBOARD,
            path: "/dashboard",
            key: DETAILS_KEYS.DASHBOARD,
            state: {
              filters: filters,
              fromDashboard: true,
            },
          }),
        ];

  const handleButtonClick = (): void => {
    if (type === BUSINESS_PERFORMANCE.OVERVIEW_CARD_TYPES.CLAIMS) {
      const destinationConfig = {
        label: MANAGE_CLAIMS,
        path: "/manage-claims",
        key: BREADCRUMB_KEYS.CLAIMS,
      };
      const destinationState = buildBreadcrumbState({
        breadcrumbs: dashboardBreadcrumb,
        crumb: destinationConfig,
        state: {
          formDashboard: true,
        },
      });

      navigate(destinationConfig.path, {
        state: destinationState,
      });

      // navigate("/manage-claims", {
      //   state: {
      //     formDashboard: true,
      //   },
      // });
    } else {
      // Process filters similar to BusinessPerformance component
      // Uncomments filters are required to retain filters when navigating
      // const filteredValues = cleanValues(filters);
      // const { userId, owner, ...rest } = filteredValues ?? {};

      // const updateFilter = {
      //   ...rest,
      //   viewBy: filteredValues.owner,
      //   ownerId: filteredValues.userId,
      // };

      const destinationConfig = {
        label: CLIENT_PORTFOLIO,
        path: "/my-client-portfolio",
        key: BREADCRUMB_KEYS.CLIENT_PORTFOLIO,
      };
      const destinationState = buildBreadcrumbState({
        breadcrumbs: dashboardBreadcrumb,
        crumb: destinationConfig,
        state: {
          formDashboard: true,
          // filters: updateFilter, // Uncomments filters are required to retain filters when navigating
        },
      });

      navigate(destinationConfig.path, {
        state: destinationState,
      });
      // navigate("/my-client-portfolio", {
      //   state: {
      //     formDashboard: true,
      //   },
      // });
    }
  };

  // Show loading state
  if (isLoading) {
    return renderLoadingState();
  }

  // Show error state
  if (error) {
    return renderErrorState();
  }

  const data = getTransformedData();

  // Return early if no data is available
  if (!data) {
    return renderNoDataState();
  }

  const { header, buttonText, claimValueBlock, kpis } = data;

  return (
    <CardBackground>
      <StyledClaimHeader>
        <StyledCardTitle>{header}</StyledCardTitle>
        <StyledButton sizeType="small" onClick={handleButtonClick}>
          {buttonText}
        </StyledButton>
      </StyledClaimHeader>
      <StyledClaimValueBlock>
        <StyledClaimsValueBlock>
          <StyledClaimValue>
            {formatNumberShort(claimValueBlock.value, localization)}
          </StyledClaimValue>
          <StyledTotalValueTxt>
            {claimValueBlock.totalValueText}
          </StyledTotalValueTxt>
        </StyledClaimsValueBlock>
        {claimValueBlock.icon && (
          <StyledClaimValueImage
            src={claimValueBlock.icon}
            width={claimValueBlock.iconWidth}
            alt={claimValueBlock.iconAlt}
          />
        )}
      </StyledClaimValueBlock>
      <StyledClaimsKpis>
        {kpis.map((kpi: KpiData, idx: number) => (
          <StyledKpiCard key={`kpi-${idx}`}>
            <StyledImg src={kpi.icon} alt={kpi.iconAlt} width={kpi.iconWidth} />
            <StyledKpiValue>{kpi.value}</StyledKpiValue>
            <StyledKpiTxt>{kpi.text}</StyledKpiTxt>
            <StyledKpiPercentage>{kpi.percentage}</StyledKpiPercentage>
          </StyledKpiCard>
        ))}
      </StyledClaimsKpis>
    </CardBackground>
  );
}

export default OverviewCard;
