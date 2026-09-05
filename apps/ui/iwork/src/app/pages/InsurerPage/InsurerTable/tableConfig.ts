import { ColDef } from "ag-grid-community";
import {
  TOTAL_ACTIVE_INSURERS,
  TOTAL_ACTIVE_POLICIES_WITH_INSURER,
  BROKERAGE_AMOUNT,
  NET_PREMIUM,
} from "../../../constants";
import {
  theme,
  endPoints,
  FormFieldConfig,
  masterDataUtilityCitySearchFunction,
  distinctStringUtilityFunction,
  formatNumberByLocalization,
} from "@ui/ui-lib";
import { organisationUtility } from "../../OpportunitiesPage/OpportunitiesListing/tableConfig";

export const searchDefaultValues = {
  insurerNameFilter: "",
  organisationId: "",
  branchTypeLid: "",
  branchCode: "",
  branchName: "",
  city: "",
};

interface OverallData {
  totalActiveInsurers?: number;
  totalActivepolacies?: number;
  count?: number;
  totalActivePolicies?: number;
  totalActiveTpa?: number;
  kpisData?: {
    totalActiveInsurers?: number;
    totalActivePolicies?: number;
    brokerageAmount?: number;
    netPremium?: number;
  };
}

export const entityTypeTitles: Record<
  string,
  { manageTitle: string; listTitle: string }
> = {
  insurer: {
    manageTitle: "Add insurer",
    listTitle: "Insurers list",
  },
  tpa: {
    manageTitle: "Add TPA",
    listTitle: "TPAs list",
  },
  broker: {
    manageTitle: "Add broker",
    listTitle: "Brokers list",
  },
};
export const getColumns = (entityType: string): ColDef[] => {
  switch (entityType) {
    case "insurer":
      return [
        {
          headerName: "Insurer name",
          field: "insurerName",
          cellClass: "clickable-cell",
          valueFormatter: ({ value }) =>
            value !== null && value !== undefined ? value : "--",
          flex: 1,
          tooltipField: "insurerName",
          headerTooltip: "Insurer name",
        },
        {
          headerName: "Branch type",
          field: "branchType",
          disableSort: true,
          valueGetter: (params) =>
            params.data.insurerAddresses?.[0]?.branchType?.lookUpValue ?? "--",
          flex: 1,
          headerTooltip: "Branch type",
          tooltipValueGetter: (params) =>
            params.data.insurerAddresses?.[0]?.branchType?.lookUpValue ?? "--",
        },
        {
          headerName: "Branch name",
          field: "branchName",
          disableSort: true,
          valueGetter: (params) =>
            params.data.insurerAddresses?.[0]?.branchName ?? "--",
          flex: 1,
          headerTooltip: "Branch name",
          tooltipValueGetter: (params) =>
            params.data.insurerAddresses?.[0]?.branchName ?? "--",
        },
        {
          headerName: "Branch code",
          field: "branchCode",
          disableSort: true,
          valueGetter: (params) =>
            params.data.insurerAddresses?.[0]?.branchCode ?? "--",
          flex: 1,
          headerTooltip: "Branch code",
          tooltipValueGetter: (params) =>
            params.data.insurerAddresses?.[0]?.branchCode ?? "--",
        },
        {
          headerName: "Address",
          field: "insurerAddresses",
          disableSort: true,
          valueGetter: (params) => {
            const address = params.data.insurerAddresses?.[0];
            return address ? address.address1 : "--"; // Return cityId or an empty string if not available
          },
          flex: 1,
          tooltipValueGetter: (params) =>
            params.data.insurerAddresses?.[0]?.address1,
          headerTooltip: "Address",
        },
        {
          headerName: "City",
          field: "cityId", // Keep the field for consistency
          disableSort: true,
          valueGetter: (params) => {
            const primaryAddress = params.data.insurerAddresses?.[0];
            return primaryAddress ? primaryAddress.city.name : "--"; // Return cityId or an empty string if not available
          },
          flex: 1,
          tooltipValueGetter: (params) => {
            const primaryAddress = params.data.insurerAddresses?.[0];
            return primaryAddress ? primaryAddress.city.name : "--"; // Return cityId or an empty string if not available
          },
          headerTooltip: "City",
        },
        {
          headerName: "State",
          field: "stateId", // Keep the field for consistency
          disableSort: true,
          valueGetter: (params) => {
            const primaryAddress = params.data.insurerAddresses?.[0];
            return primaryAddress ? primaryAddress.state.name : "--"; // Return stateId or an empty string if not available
          },
          flex: 1,
          headerTooltip: "State",
          tooltipValueGetter: (params) =>
            params.data.insurerAddresses?.[0]?.state?.name,
        },
        {
          headerName: "Phone",
          field: "phoneNumber",
          valueGetter: (params) => {
            const primaryAddress = params.data.insurerAddresses?.[0];
            return primaryAddress ? primaryAddress.phoneNumber : "--";
          },
          flex: 1,
          headerTooltip: "Phone",
          tooltipValueGetter: (params) =>
            params.data.insurerAddresses?.[0]?.phoneNumber,
        },
      ];
    case "tpa":
      return [
        {
          headerName: "TPA name",
          field: "tpaName",
          cellClass: "clickable-cell",
          flex: 1,
          headerTooltip: "TPA name",
          tooltipField: "tpaName",
        },
        {
          headerName: "Address",
          field: "tpaAddresses",
          disableSort: true,
          valueGetter: (params) =>
            params.data.tpaAddresses?.[0]?.address1 || "--",
          flex: 1,
          headerTooltip: "Address",
          tooltipValueGetter: (params) =>
            params.data.tpaAddresses?.[0]?.address1 || "--",
        },
        {
          headerName: "City",
          field: "cityId",
          disableSort: true,
          valueGetter: (params) =>
            params.data.tpaAddresses?.[0]?.cityId?.name || "--",
          flex: 1,
          headerTooltip: "City",
          tooltipValueGetter: (params) =>
            params.data.tpaAddresses?.[0]?.cityId?.name || "--",
        },
        {
          headerName: "State",
          field: "stateId",
          disableSort: true,
          valueGetter: (params) =>
            params.data.tpaAddresses?.[0]?.stateId?.name || "--",
          flex: 1,
          headerTooltip: "State",
          tooltipValueGetter: (params) =>
            params.data.tpaAddresses?.[0]?.stateId?.name || "--",
        },
        {
          headerName: "Phone",
          field: "phoneNumber",
          valueGetter: (params) =>
            params.data.tpaAddresses?.[0]?.phoneNumber || "--",
          flex: 1,
          headerTooltip: "Phone",
          tooltipValueGetter: (params) =>
            params.data.tpaAddresses?.[0]?.phoneNumber || "--",
        },
      ];
    case "broker":
      return [
        {
          headerName: "Broker name",
          field: "brokerName",
          cellClass: "clickable-cell",
          flex: 1,
          headerTooltip: "Broker name",
          tooltipField: "brokerName",
        },
        {
          headerName: "Address",
          field: "brokerAddresses",
          disableSort: true,
          valueGetter: (params) =>
            params.data.brokerAddresses?.[0]?.address1 || "--",
          flex: 1,
          headerTooltip: "Address",
          tooltipValueGetter: (params) =>
            params.data.brokerAddresses?.[0]?.address1 || "--",
        },
        {
          headerName: "City",
          field: "cityId",
          disableSort: true,
          valueGetter: (params) =>
            params.data.brokerAddresses?.[0]?.city?.name || "--",
          flex: 1,
          headerTooltip: "City",
          tooltipValueGetter: (params) =>
            params.data.brokerAddresses?.[0]?.city?.name || "--",
        },
        {
          headerName: "State",
          field: "stateId",
          disableSort: true,
          valueGetter: (params) =>
            params.data.brokerAddresses?.[0]?.state?.name || "--",
          flex: 1,
          headerTooltip: "State",
          tooltipValueGetter: (params) =>
            params.data.brokerAddresses?.[0]?.state?.name || "--",
        },
        {
          headerName: "Phone",
          field: "phoneNumber",
          valueGetter: (params) =>
            params.data.brokerAddresses?.[0]?.phoneNumber || "--",
          flex: 1,
          headerTooltip: "Phone",
          tooltipValueGetter: (params) =>
            params.data.brokerAddresses?.[0]?.phoneNumber || "--",
        },
      ];
    default:
      return [];
  }
};

export const getTableSearchConfig = (entityType: string): FormFieldConfig[] => {
  switch (entityType) {
    case "insurer":
      return [
        {
          key: "organisationId",
          name: "organisationId",
          label: "Organisation",
          type: "select",
          gridColumn: 2.9,
          componentProps: { fullWidth: true },
          placeholder: "Select organisation",
          apiDependencies: {
            endPoint: endPoints.masterOrganisation,
            utilityFunction: (data: any[]) => organisationUtility(data),
          },
        },
        {
          key: "insurerNameFilter",
          name: "insurerNameFilter",
          label: "Insurer name",
          type: "selectFieldByApi",
          gridColumn: 2.9,
          placeholder: "Type to search insurer name",
          apiDependencies: {
            endPoint: endPoints.insurerDistinctNames,
            utilityFunction: distinctStringUtilityFunction,
            defaultValue: "",
          },
          componentProps: { fullWidth: true },
        },
        {
          key: "branchTypeLid",
          name: "branchTypeLid",
          label: "Branch type",
          type: "select",
          gridColumn: 2.9,
          placeholder: "Type to select branch type",
          componentProps: { fullWidth: true },
          apiDependencies: {
            endPoint: endPoints.lookUpByName("INSURER_BRANCH_TYPE"),
            isSmartSearch: true,
          },
        },
        {
          key: "branchName",
          name: "branchName",
          label: "Branch name",
          type: "selectFieldByApi",
          gridColumn: 2.9,
          placeholder: "Type to search branch name",
          apiDependencies: {
            endPoint: endPoints.insurerDistinctBranchNames,
            utilityFunction: distinctStringUtilityFunction,
            defaultValue: "",
          },
          componentProps: { fullWidth: true },
        },
        {
          key: "branchCode",
          name: "branchCode",
          label: "Branch code",
          type: "selectFieldByApi",
          gridColumn: 2.9,
          placeholder: "Type to search branch code",
          apiDependencies: {
            endPoint: endPoints.insurerDistinctBranchCodes,
            utilityFunction: distinctStringUtilityFunction,
            defaultValue: "",
          },
          componentProps: { fullWidth: true },
        },
        {
          key: "city",
          name: "city",
          label: "City",
          type: "selectFieldByApi",
          gridColumn: 2.9,
          apiDependencies: {
            endPoint: endPoints.masterDataByName("city"),
            utilityFunction: masterDataUtilityCitySearchFunction,
            defaultValue: "",
            customParams: { searchBy: "name" },
          },
          placeholder: "Type to search city ",
        },
      ];
    case "tpa":
      return [
        {
          key: "tpaName",
          name: "tpaName",
          label: "TPA name",
          type: "text",
          gridColumn: 2.9,
          componentProps: { fullWidth: true, placeholder: "Enter TPA name" },
        },
      ];
    case "broker":
      return [
        {
          key: "brokerName",
          name: "brokerName",
          label: "Broker name",
          type: "text",
          gridColumn: 2.9,
          componentProps: { fullWidth: true, placeholder: "Enter broker name" },
        },
      ];
    default:
      return [];
  }
};

export const insurerkpiData = (
  overallData: OverallData,
  totalRows: number,
  entityType: string,
) => {
  switch (entityType) {
    case "insurer":
      return [
        {
          // Raw count, not pre-formatted: KPICards applies formatNumberByLocalization
          // itself using the localization it resolves (prop or its own hook).
          title: TOTAL_ACTIVE_INSURERS,
          count: overallData?.kpisData?.totalActiveInsurers ?? 0,
          percentage:
            ((overallData?.kpisData?.totalActiveInsurers ?? 0) / totalRows) * 100,
          backgroundColor: theme.palette.kpiColors.purple,
          textColor: theme.palette.text.purple,
        },
        {
          title: TOTAL_ACTIVE_POLICIES_WITH_INSURER,
          count: overallData?.kpisData?.totalActivePolicies ?? 0,
          percentage:
            ((overallData?.kpisData?.totalActivePolicies ?? 0) / totalRows) * 100,
          backgroundColor: theme.palette.kpiColors.yellow,
          textColor: theme.palette.text.yellow,
        },
        {
          title: BROKERAGE_AMOUNT,
          count: overallData?.kpisData?.brokerageAmount ?? 0,
          percentage: 0,
          isFloatable: true,
          backgroundColor: theme.palette.kpiColors.purple,
          textColor: theme.palette.text.purple,
        },
        {
          title: NET_PREMIUM,
          count: overallData?.kpisData?.netPremium ?? 0,
          percentage: 0,
          isFloatable: true,
          backgroundColor: theme.palette.kpiColors.yellow,
          textColor: theme.palette.text.yellow,
        },
      ];
    case "tpa":
      return [
        {
          title: "Total active TPAs",
          count: overallData?.totalActiveTpa ?? 0,
          percentage:
            ((overallData?.totalActiveInsurers ?? 0) / totalRows) * 100,
          backgroundColor: theme.palette.kpiColors.purple,
          textColor: theme.palette.text.purple,
        },
        {
          title: "Total active policies with TPA",
          count: overallData?.totalActivepolacies ?? 0,
          percentage:
            ((overallData?.totalActivepolacies ?? 0) / totalRows) * 100,
          backgroundColor: theme.palette.kpiColors.yellow,
          textColor: theme.palette.text.yellow,
        },
      ];
    case "broker":
      return [
        {
          title: "Total brokers",
          count: overallData?.count ?? 0,
          percentage: ((overallData?.count ?? 0) / totalRows) * 100,
          backgroundColor: theme.palette.kpiColors.purple,
          textColor: theme.palette.text.purple,
        },
      ];
    default:
      return [];
  }
};
