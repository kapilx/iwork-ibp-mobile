import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  StyledTatBlock,
  StyledValueContainer,
  StyledTatValue,
  StyledDot,
  StyledTatCount,
  StyledTitle,
  StyledSubTitle,
} from "./styles";
import { BREADCRUMB_KEYS, BUSINESS_PERFORMANCE, DETAILS_LABELS } from "@ui/ui-lib/constants";
import { getBreadcrumbsFromState,DETAILS_KEYS,buildBreadcrumbState, formatNumberByLocalization, getSessionStorageData, createBreadcrumbEntry } from "@ui/ui-lib";

type TatStatus = "green" | "orange" | "yellow" | "red" | "blue";

export interface TatData {
  tatStatus: TatStatus;
  label: string;
  count: number;
  days: number;
}

type DataType = "endorsement" | "claims" | "policies";

interface TatSummaryProps {
  tatData: TatData[];
  showIndicator?: boolean;
  dataType?: DataType;
}

function TatSummary({
  tatData,
  showIndicator = true,
  dataType,
}: TatSummaryProps) {
  const navigate = useNavigate();

  const userData = useMemo(() => getSessionStorageData("user"), []);
  const location = useLocation();

  const policyFilters = {
    ownerId: {
      value: userData?.userId,
      label: userData?.firstName,
    },
    viewBy: {
      value:"team",
      label:"Manager + Team"
    },
  
    organisationId: {
      value: userData?.organisationId,
      label: userData?.organisationName,
    },
  };

    const existingBreadcrumbs = getBreadcrumbsFromState(location.state);
    const dashboardBreadcrumb =
      existingBreadcrumbs.length > 0
        ? existingBreadcrumbs
        : [
            createBreadcrumbEntry({
              label: DETAILS_LABELS.DASHBOARD,
              path: "/dashboard",
              key: DETAILS_KEYS.DASHBOARD,
            
            }),
          ];

  // handleItemClick: Navigate with appropriate TAT filter
  const handleItemClick = (tatStatus: TatStatus, label: string, days: number) => {
    if (!dataType) return;


    switch (dataType) {
      case "endorsement":
        navigate("/manage-endorsements", {
          state: {
            formDashboard: true,
            filters: {
              tatRange: 
               {
                value: label,
                label: label
              } ,
              viewBy: {
                value: "team",
                label: "Manager + Team"
              }
            },
          },
        });
        break;
      case "claims":
        navigate("/manage-claims", {
          state: {
            formDashboard: true,
            filters: {
              tatRange: 
               {
                value: label,
                label: label
              } ,
              viewBy: {
                value: "team",
                label: "Manager + Team"
              }
            },
          },
        });
        break;
      case "policies": {
        const destinationConfig = {
          label: DETAILS_LABELS.DASHBOARD,
          path: `/policies`,
          key: DETAILS_KEYS.DASHBOARD,

        };

        const destinationState = buildBreadcrumbState({
          breadcrumbs: dashboardBreadcrumb,
          crumb: destinationConfig,
          state: {
            formDashboard: true,
            days: days,
            filters: policyFilters,
          },
        });

        navigate(destinationConfig.path, {
          state: destinationState,
        });

        // navigate("/policies", {
        //   state: {
        //     formDashboard: true,
        //     days: days,
        //     filters: policyFilters,
        //   },
        // });
        break;
      }
      default:
        break;
    }
  };

  return (
    <>
      <StyledTitle>
        {dataType === BUSINESS_PERFORMANCE.DATA_TYPES.ENDORSEMENT
          ? BUSINESS_PERFORMANCE.LABELS.ENDORSEMENT_TAT
          : dataType === BUSINESS_PERFORMANCE.DATA_TYPES.CLAIMS
          ? BUSINESS_PERFORMANCE.LABELS.CLAIMS_TAT
          : dataType === BUSINESS_PERFORMANCE.DATA_TYPES.POLICIES
          ? BUSINESS_PERFORMANCE.LABELS.POLICY_EXPIRY_TIMELINE
          : ""}
      </StyledTitle>
      {dataType === BUSINESS_PERFORMANCE.DATA_TYPES.POLICIES && (
        <StyledSubTitle>
          {BUSINESS_PERFORMANCE.DESCRIPTIONS.POLICIES_EXPIRING}
        </StyledSubTitle>
      )}
      <StyledTatBlock>
        {tatData.map(({ tatStatus, label, count, days }, idx) => (
          <StyledValueContainer
            key={tatStatus + idx}
            // onClick={()=>handleTatDataClick(tatStatus, label, count)}
            onClick={dataType ? () => handleItemClick(tatStatus, label, days) : undefined}
            style={{ cursor: dataType ? "pointer" : "default" }}
          >
            <StyledTatValue>
              {showIndicator && <StyledDot tatStatus={tatStatus} />}
              {label}
            </StyledTatValue>
            <StyledTatCount tatStatus={tatStatus}>
              {formatNumberByLocalization(count)}
            </StyledTatCount>
          </StyledValueContainer>
        ))}
      </StyledTatBlock>
    </>
  );
}

export default TatSummary;
