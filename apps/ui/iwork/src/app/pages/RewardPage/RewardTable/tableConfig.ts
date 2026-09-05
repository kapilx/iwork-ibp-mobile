import { ColDef } from "ag-grid-community";
import dayjs from "dayjs";
import {
    theme,
    endPoints,
    FormFieldConfig,
    formatNumberByLocalization,
} from "@ui/ui-lib";
import { insurerSelectListUtilityFunction } from "../../InsurerPage/AddInsurerBranch/formConfig";
import {
    MONTH_LABEL_FORMAT,
    PERIOD_TYPE,
    REWARD_CATEGORY_KEY,
} from "../constants";
import { generateYearOptions } from "@ui/ui-lib";
export const generateRewardYearOptions = generateYearOptions;

export interface RewardKpisData {
    totalRewardAmount?: number;
    genericRewardAmount?: number;
    specificRewardAmount?: number;
}

export interface RewardOverallData {
    count?: number;
    kpisData?: RewardKpisData;
}

export const searchDefaultValues = {
    rewardCategoryLid: "",
    insurerId: "",
    // Object form ({value,label}) because the smart-search select binds on value.value.
    periodType: { value: PERIOD_TYPE.BUSINESS_MONTH, label: "Business month" },
    financialYear: "",
    from: "",
    to: "",
};

// "YYYY-MM-01" / Date -> "MMM YYYY". Returns "--" when missing/invalid.
export const formatMonthLabel = (value?: string | Date | null): string => {
    if (!value) return "--";
    const d = dayjs(value);
    return d.isValid() ? d.format(MONTH_LABEL_FORMAT) : "--";
};

// Join a reward's businessMonths -> "Apr 2026, May 2026".
export const formatBusinessMonths = (
    businessMonths?: Array<{ businessMonth?: string }>
): string => {
    if (!Array.isArray(businessMonths) || businessMonths.length === 0)
        return "--";
    const labels = businessMonths
        .map((bm) => formatMonthLabel(bm?.businessMonth))
        .filter((l) => l !== "--");
    return labels.length ? labels.join(", ") : "--";
};

// Maps the REWARD_CATEGORY lookup options. Only Generic is selectable in
// Phase 1 (BR-001).
// ponytail: the shared SelectField (MUI Autocomplete) does not honour a
// per-option `disabled` flag, so we cannot render Specific as a greyed but
// visible option without forking the shared component. We therefore drop
// Specific from the selectable list (effectively disabled). The Specific
// label is preserved for display fallbacks (e.g. a saved Specific record).
export const isSpecificCategory = (item: any): boolean =>
    (item?.lookUpKey || "").includes(REWARD_CATEGORY_KEY.SPECIFIC);

export const rewardCategoryUtilityFunction = (data: any) =>
    (Array.isArray(data) ? data : data?.data ?? [])
        .filter((item: any) => !isSpecificCategory(item))
        .map((item: any) => ({
            value: item.id,
            label: item.lookUpValue,
        }));

export const getTableSearchConfig = (): FormFieldConfig[] => [
    {
        key: "rewardCategoryLid",
        name: "rewardCategoryLid",
        label: "Reward category",
        type: "select",
        gridColumn: 2.9,
        placeholder: "Select category",
        componentProps: { fullWidth: true },
        apiDependencies: {
            endPoint: endPoints.lookUpByName("REWARD_CATEGORY"),
            utilityFunction: rewardCategoryUtilityFunction,
            isSmartSearch: true,
        },
    },
    {
        key: "insurerId",
        name: "insurerId",
        label: "Insurer",
        type: "selectFieldByApi",
        gridColumn: 2.9,
        placeholder: "Type to search insurer",
        apiDependencies: {
            endPoint: endPoints.insurerSelectList,
            utilityFunction: insurerSelectListUtilityFunction,
            defaultValue: "",
        },
        componentProps: { fullWidth: true },
    },
    {
        key: "periodType",
        name: "periodType",
        label: "Period type",
        type: "select",
        gridColumn: 2.9,
        placeholder: "Select period type",
        componentProps: { fullWidth: true },
        options: [
            { label: "Business month", value: PERIOD_TYPE.BUSINESS_MONTH },
            { label: "Income month", value: PERIOD_TYPE.INCOME_MONTH },
        ],
    },
    {
        key: "financialYear",
        name: "financialYear",
        label: "Financial year",
        type: "select",
        gridColumn: 2.9,
        placeholder: "Select financial year",
        componentProps: { fullWidth: true },
        options: generateRewardYearOptions(),
    },
    {
        key: "from",
        name: "from",
        label: "Reward Date (From)",
        type: "date",
        gridColumn: 2.9,
        componentProps: { fullWidth: true },
    },
    {
        key: "to",
        name: "to",
        label: "Reward Date (To)",
        type: "date",
        gridColumn: 2.9,
        componentProps: { fullWidth: true },
    },
];

export const getColumns = (): ColDef[] => {
    const columns: ColDef[] = [
        {
            headerName: "Reward category",
            field: "rewardCategory",
            valueGetter: (params) =>
                params.data?.rewardCategory?.lookUpValue ?? "--",
            flex: 1,
            headerTooltip: "Reward category",
            tooltipValueGetter: (params) =>
                params.data?.rewardCategory?.lookUpValue ?? "--",
        },
        {
            headerName: "Insurer",
            field: "insurer",
            valueGetter: (params) =>
                params.data?.insurer?.insurerName ??
                params.data?.insurer?.name ??
                "--",
            flex: 1,
            headerTooltip: "Insurer",
            tooltipValueGetter: (params) =>
                params.data?.insurer?.insurerName ??
                params.data?.insurer?.name ??
                "--",
        },
        {
            headerName: "Business month",
            field: "businessMonths",
            sortable: false, // OneToMany array, not sortable on backend yet
            valueGetter: (params) =>
                formatBusinessMonths(params.data?.businessMonths),
            flex: 1.4,
            headerTooltip: "Business month",
            tooltipValueGetter: (params) =>
                formatBusinessMonths(params.data?.businessMonths),
        },
        {
            headerName: "Income month",
            field: "dateOfIncome",
            valueGetter: (params) => formatMonthLabel(params.data?.dateOfIncome),
            flex: 1,
            headerTooltip: "Income month",
            tooltipValueGetter: (params) =>
                formatMonthLabel(params.data?.dateOfIncome),
        },
        {
            headerName: "Date of income",
            field: "dateOfIncomeRaw",
            hide: true,
            valueGetter: (params) => {
                const d = params.data?.dateOfIncome;
                return d && dayjs(d).isValid()
                    ? dayjs(d).format("DD/MM/YYYY")
                    : "--";
            },
            flex: 1,
            headerTooltip: "Date of income",
            tooltipValueGetter: (params) => {
                const d = params.data?.dateOfIncome;
                return d && dayjs(d).isValid()
                    ? dayjs(d).format("DD/MM/YYYY")
                    : "--";
            },
        },
        {
            headerName: "Reward amount",
            field: "rewardAmount",
            cellClass: "right-aligned-cell",
            valueGetter: (params) => {
                const amt = Number(params.data?.rewardAmount);
                return isNaN(amt) ? "--" : formatNumberByLocalization(amt);
            },
            flex: 1,
            headerTooltip: "Reward amount",
        },
        {
            headerName: "Remarks",
            field: "remarks",
            valueGetter: (params) => params.data?.remarks ?? "--",
            flex: 1.5,
            headerTooltip: "Remarks",
            tooltipValueGetter: (params) => params.data?.remarks ?? "--",
        },
        {
            headerName: "Documents",
            field: "docMaps",
            sortable: false, // OneToMany array, not sortable on backend yet
            valueGetter: (params) => {
                const count = Array.isArray(params.data?.docMaps)
                    ? params.data.docMaps.length
                    : 0;
                return count > 0 ? `${count} file(s)` : "--";
            },
            flex: 1,
            headerTooltip: "Documents",
        },
        {
            headerName: "Created date",
            field: "createdAt",
            valueGetter: (params) => {
                const d = params.data?.createdAt;
                return d && dayjs(d).isValid()
                    ? dayjs(d).format("DD/MM/YYYY")
                    : "--";
            },
            flex: 1,
            headerTooltip: "Created date",
        },
    ];

    return columns;
};

export const rewardKpiData = (overallData: RewardOverallData) => [
    {
        // Reward amounts are currency, not counts — isFloatable matches every
        // other premium/brokerage card's compact Cr/L/K display + full-precision
        // hover, instead of showing a plain comma-grouped integer.
        title: "Total Reward Amount",
        count: overallData?.kpisData?.totalRewardAmount ?? 0,
        isFloatable: true,
        percentage: 0,
        backgroundColor: theme.palette.kpiColors.purple,
        textColor: theme.palette.text.purple,
    },
    {
        title: "Generic Reward Amount",
        count: overallData?.kpisData?.genericRewardAmount ?? 0,
        isFloatable: true,
        percentage: 0,
        backgroundColor: theme.palette.kpiColors.yellow,
        textColor: theme.palette.text.yellow,
    },
    {
        // ponytail: Specific is a future phase (BR-001); always 0 and greyed.
        title: "Specific Reward Amount (future phase)",
        count: overallData?.kpisData?.specificRewardAmount ?? 0,
        isFloatable: true,
        percentage: 0,
        backgroundColor: theme.palette.grey[200],
        textColor: theme.palette.text.disabled,
    },
];
