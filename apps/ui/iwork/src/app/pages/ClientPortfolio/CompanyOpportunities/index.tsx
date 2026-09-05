import React from "react";
import {
  Table,
  useTableController,
  endPoints,
  useLocalization,
  buildBreadcrumbState,
  DETAILS_KEYS,
  DETAILS_LABELS,
} from "@ui/ui-lib";
import { Typography } from "@mui/material";
import { CellClickedEvent } from "ag-grid-community";
import { useNavigate } from "react-router-dom";
import { CardBackground } from "../CompanyOverView/styles.js";
import { getColumns } from "./tableConfig";

interface CompanyOpportunitiesProps {
  companyData: any;
  type: "RO" | "SO";
  title: string;
  breadcrumbInfo?: any;
  filters?: any;
}

// Drill-down list of a company's active RO or SO opportunities.
// RO rows link to the referenced policy (via refPolicyId) for the policy flow.
const CompanyOpportunities: React.FC<CompanyOpportunitiesProps> = ({
  companyData,
  type,
  title,
  breadcrumbInfo,
  filters,
}) => {
  const navigate = useNavigate();
  const { localizationData } = useLocalization();
  const columns = React.useMemo(
    () => getColumns(type, localizationData?.data),
    [type, localizationData]
  );

  const {
    rowData,
    totalRows,
    currentPage,
    loading,
    setCurrentPage,
    pageSize,
    setPageSize,
    PAGE_SIZE_OPTIONS,
    setSort,
    setSmartSearch,
  } = useTableController({
    endpoint: endPoints.opportunitiesByCompany(companyData?.companyId),
    searchFieldName: "companyName",
    customPathParam: `type=${type}&activeOnly=true`,
  });

  // Forward ONLY the owner scope (ownerId/viewBy) the portfolio overview used,
  // so this drill-down's count matches the overview card. useTableController
  // maps ownerId/viewBy to query params; other filter keys would leak into the
  // company-name search string, so we deliberately exclude them.
  React.useEffect(() => {
    const ownerScope: Record<string, any> = {};
    if (filters?.ownerId !== undefined && filters?.ownerId !== null) {
      ownerScope.ownerId = filters.ownerId;
    }
    if (filters?.viewBy !== undefined && filters?.viewBy !== null) {
      ownerScope.viewBy = filters.viewBy;
    }
    setSmartSearch(ownerScope);
  }, [filters, setSmartSearch]);

  const onCellClicked = (event: CellClickedEvent) => {
    if (
      event.colDef.field === "opportunityId" &&
      event.data?.opportunityId
    ) {
      const destinationConfig = {
        label:
          type === "RO"
            ? DETAILS_LABELS.RENEWAL_OPPORTUNITY
            : DETAILS_LABELS.SALES_OPPORTUNITY,
        path: `/opportunities/${event.data.opportunityId}`,
        key:
          type === "RO"
            ? DETAILS_KEYS.RENEWAL_OPPORTUNITY
            : DETAILS_KEYS.SALES_OPPORTUNITY,
      };
      const destinationState = buildBreadcrumbState({
        breadcrumbs: breadcrumbInfo,
        crumb: destinationConfig,
        state: { from: "clientPortfolio" },
      });
      navigate(destinationConfig.path, { state: destinationState });
      return;
    }
    if (
      type === "RO" &&
      event.colDef.field === "policyId" &&
      event.data?.refPolicyId
    ) {
      const destinationConfig = {
        label: DETAILS_LABELS.POLICY,
        path: `/policies/${event.data.refPolicyId}`,
        key: DETAILS_KEYS.POLICY,
      };
      const destinationState = buildBreadcrumbState({
        breadcrumbs: breadcrumbInfo,
        crumb: destinationConfig,
        state: { from: "clientPortfolio" },
      });
      navigate(destinationConfig.path, { state: destinationState });
    }
  };

  return (
    <CardBackground>
      <Typography variant="h1" mb={4}>
        {title} - {companyData?.companyName}
      </Typography>
      <Table
        columns={columns}
        rowData={rowData}
        totalRows={totalRows}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        loading={loading}
        pageSize={pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        setPageSize={setPageSize}
        onCellClicked={onCellClicked}
        setSort={setSort}
        title=""
        domLayout="autoHeight"
      />
    </CardBackground>
  );
};

export default CompanyOpportunities;
