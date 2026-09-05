import { colors } from "@ui/ui-lib/styles";
import { ColDef } from "ag-grid-community";
import { theme, endPoints, FormFieldConfig } from "@ui/ui-lib";
import { KeyboardEvent } from "react";

// Filter constants
export const FILTER_CONSTANTS = {
  SEARCH_HOSPITAL: "Search by Keyword",
  SEARCH_PLACEHOLDER: "Search by hospital name or address",
  APPLY_FILTER_BUTTON: "Search",
  CLEAR_ALL_BUTTON: "Clear All",
};

// Filter utility functions
export const addressesUtilityFunction = (data: any) => {
  return (
    data?.data?.states?.map((item: string) => ({
      value: item,
      label: item,
    })) || []
  );
};

export const citiesUtilityFunction = (data: any) => {
  return (
    data?.data?.cities?.map((item: string) => ({
      value: item,
      label: item,
    })) || []
  );
};

type HospitalFilterFormOptions = {
  onPinCodeEnter?: () => void;
};

// Filter form configuration
export const HOSPITAL_FILTER_FORM_CONFIG = (
  policyId: string | number,
  options?: HospitalFilterFormOptions
): FormFieldConfig[] => [
  {
    key: "state",
    name: "state",
    label: "Search by State",
    type: "select",
    gridColumn: 3.5,
    placeholder: "Select state",
    apiDependencies: {
      endPoint: endPoints.portalConfigHospitalNetworkLocations(policyId),
      clearFieldsOnChange: ["city"],
      utilityFunction: addressesUtilityFunction,
    },
  },
  {
    key: "city",
    name: "city",
    label: "Search by City",
    type: "select",
    placeholder: "Select city",
    gridColumn: 3.5,
    apiDependencies: {
      endPoint: (state: id) =>
        `${endPoints.portalConfigHospitalNetworkLocations(
          policyId
        )}?state=${state}`,
      dependentField: "state",
      utilityFunction: citiesUtilityFunction,
    },
  },
  {
    key: "pinCode",
    name: "pinCode",
    label: "Search by PIN Code",
    type: "text",
    gridColumn: 3.5,
    componentProps: {
      placeholder: "Enter PIN code",
      type: "number",
      onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
          event.preventDefault();
          options?.onPinCodeEnter?.();
        }
      },
      sx: {
        "& .MuiOutlinedInput-input": {
          padding: theme.spacing(2),
        },
      },
    },
    // rules: {
    //   pattern: {
    //     value: /^\d{6}$/,
    //     message: "Please enter a valid pin code.",
    //   },
    // },
  },
];

// Filter initial values
export const initialHospitalFilterValues = {
  state: "",
  city: "",
  pinCode: "",
};

// Filter values type
export type HospitalFilterValues = typeof initialHospitalFilterValues;

// Utility function to check if value exists
export const hasValue = (value: unknown): boolean => {
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return value !== null && value !== undefined;
};

export interface HospitalData {
  id: string;
  hospital: string;
  adress: string;
  city: string;
  state: string;
  pincode: string;
  status: "Hospital Network" | "Excluded Hospitals";
}

// Style map for status colors
export const statusStyleMap = {
  "hospital network": {
    backgroundColor: colors.background.greenVariant,
    color: colors.text.primary,
  },
  "excluded hospitals": {
    backgroundColor: colors.background.orangeVariant,
    color: colors.text.primary,
  },
};

// Table column definitions
export const getColumns = (): ColDef[] => [
  {
    field: "name",
    headerName: "Hospital Name",
    flex: 1,
    minWidth: 200,
    tooltipField: "name",
    headerTooltip: "Hospital Name",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    field: "address",
    headerName: "Address",
    flex: 1,
    minWidth: 200,
    tooltipField: "addresses.addressLine1",
    valueGetter: (params) => params.data?.addresses?.addressLine1 ?? "--",
    headerTooltip: "Address",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    field: "city",
    headerName: "City",
    flex: 1,
    minWidth: 150,
    tooltipField: "addresses.cityName",
    headerTooltip: "City",
    valueGetter: (params) => params.data?.addresses?.cityName ?? "--",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    field: "state",
    headerName: "State",
    flex: 1,
    minWidth: 150,
    tooltipField: "addresses.stateName",
    headerTooltip: "State",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    valueGetter: (params) => params.data?.addresses?.stateName ?? "--",
  },
  {
    field: "pinCode",
    headerName: "Pincode",
    flex: 0.8,
    minWidth: 120,
    tooltipField: "addresses.pinCode",
    headerTooltip: "Pincode",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    valueGetter: (params) => params.data?.addresses?.pinCode ?? "--",
  },
  {
    field: "hospitalType",
    headerName: "Hospital Type",
    flex: 0.8,
    minWidth: 180,
    tooltipField: "status",
    headerTooltip: "Hospital Type",
    cellRenderer: "ChipRenderer",
    cellRendererParams: {
      styleMap: statusStyleMap,
      variant: "normal",
    },
    valueGetter: (params) => {
      const isNetworkHospital =
        params.data?.policyMappings?.[0]?.isNetworkHospital;
      if (isNetworkHospital === true) {
        return "Hospital Network";
      } else if (isNetworkHospital === false) {
        return "Excluded Hospitals";
      }
      return "--";
    },
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  // {
  //   headerName: "Actions",
  //   field: "actions",
  //   headerTooltip: "Actions",
  //   cellRenderer: "ActionButton",
  //   sortable: false,
  //   filter: false,
  //   minWidth: 100,
  //   flex: 0.5,
  // },
];

// KPI data calculation function
export const getHospitalKPIData = (data: any) => {
  const includedCount = data?.networkHospitalCount || 0;
  const excludedCount = data?.excludedHospitalCount || 0;

  return [
    {
      title: "Total Hospitals",
      count: includedCount + excludedCount,
      backgroundColor: colors.background.purpleVariant,
      textColor: colors.text.primary,
    },
    {
      title: "Hospital Network",
      count: includedCount,
      backgroundColor: colors.background.greenVariant,
      textColor: colors.text.primary,
    },
    {
      title: "Excluded Hospitals",
      count: excludedCount,
      backgroundColor: colors.background.orangeVariant,
      textColor: colors.text.primary,
    },
  ];
};

export const hospitalBreadcrumbs = (policyId: string) => {
  return [
    {
      label: "Manage policies",
      path: "/policies",
    },
    { label: "Policy Details", path: `/policies/${policyId}` },
    { label: "View Hospitals", path: `/policies/${policyId}/hospitals` },
  ];
};
