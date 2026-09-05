import {
    FormFieldConfig,
    endPoints,
    textErrorMessage,
} from "@ui/ui-lib";
import dayjs from "dayjs";
import { insurerSelectListUtilityFunction } from "../../InsurerPage/AddInsurerBranch/formConfig";
import {
    rewardCategoryUtilityFunction,
    generateRewardYearOptions,
} from "../RewardTable/tableConfig";
import { generateBusinessMonthOptions, getCurrentFinancialYearStart } from "../constants";

export const rewardFormDefaultValues = {
    rewardCategoryLid: "",
    insurerId: "",
    // Default to the current financial year (start year, as the option value).
    financialYear: String(getCurrentFinancialYearStart()),
    businessMonths: [] as string[],
    dateOfIncome: dayjs().format("YYYY-MM-DD"),
    incomeMonthLabel: dayjs().format("MMM YYYY"),
    rewardAmount: "",
    remarks: "",
    documents: [] as any[],
};

// Fields in the order required by the spec. `isEditMode` keeps category and
// insurer immutable on edit (category is immutable per BR-001).
// `startYear` drives the business-month options (Apr startYear .. Mar startYear+1).
export const getRewardFormFields = (isEditMode = false, startYear?: number): FormFieldConfig[] => {
const businessMonthOptions = startYear
    ? generateBusinessMonthOptions(startYear)
    : generateBusinessMonthOptions(new Date().getMonth() >= 3 ? new Date().getFullYear() : new Date().getFullYear() - 1);
return [
    {
        key: "rewardCategoryLid",
        name: "rewardCategoryLid",
        label: "Reward category",
        type: "select",
        gridColumn: 5,
        placeholder: "Select category",
        rules: {
            required: { value: true, message: "Reward category is required" },
        },
        apiDependencies: {
            endPoint: endPoints.lookUpByName("REWARD_CATEGORY"),
            // Generic selectable; Specific disabled (BR-001).
            utilityFunction: rewardCategoryUtilityFunction,
        },
        componentProps: {
            fullWidth: true,
            disabled: isEditMode,
        },
    },
    {
        key: "insurerId",
        name: "insurerId",
        label: "Insurer",
        type: "selectFieldByApi",
        gridColumn: 5,
        placeholder: "Search insurer",
        rules: {
            required: { value: true, message: "Insurer is required" },
        },
        apiDependencies: {
            endPoint: endPoints.insurerSelectList,
            // ponytail: select-list returns { id, insurerName } only; no isActive
            // flag, so the "(Inactive)" suffix cannot be rendered yet. Add the
            // flag to insurerSelectListUtilityFunction once the endpoint exposes it.
            utilityFunction: insurerSelectListUtilityFunction,
        },
        componentProps: {
            fullWidth: true,
            disabled: isEditMode,
        },
    },
    {
        key: "financialYear",
        name: "financialYear",
        label: "Financial year",
        type: "select",
        gridColumn: 5,
        placeholder: "Select financial year",
        componentProps: { fullWidth: true },
        options: generateRewardYearOptions(),
    },
    {
        key: "businessMonths",
        name: "businessMonths",
        label: "Business month",
        type: "multiselect",
        gridColumn: 5,
        placeholder: "Select one or more months",
        helperText: "Reward amount is cumulative across selected months",
        options: businessMonthOptions,
        rules: {
            required: {
                value: true,
                message: "Select at least one business month",
            },
            validate: (value: string[]) =>
                (Array.isArray(value) && value.length > 0) ||
                "Select at least one business month",
        },
        componentProps: { fullWidth: true },
    },
    {
        key: "dateOfIncome",
        name: "dateOfIncome",
        label: "Date of income",
        type: "date",
        gridColumn: 5,
        rules: {
            required: { value: true, message: "Date of income is required" },
        },
        componentProps: { fullWidth: true },
    },
    {
        key: "incomeMonthLabel",
        name: "incomeMonthLabel",
        label: "Income month",
        type: "text",
        gridColumn: 5,
        placeholder: "Auto-derived from date of income",
        componentProps: {
            fullWidth: true,
            disabled: true,
        },
    },
    {
        key: "rewardAmount",
        name: "rewardAmount",
        label: "Reward amount",
        type: "number",
        gridColumn: 5,
        placeholder: "Enter reward amount",
        rules: {
            required: { value: true, message: "Reward amount is required" },
            validate: (value: any) =>
                Number(value) > 0 || "Reward amount must be greater than 0",
        },
        // Indian-locale thousand grouping applied by NumberField.
        formatNumber: true,
        isDecimal: true,
        componentProps: {
            fullWidth: true,
        },
    },
    {
        key: "remarks",
        name: "remarks",
        label: "Remarks",
        type: "text",
        gridColumn: 9,
       
        rules: {
            maxLength: {
                value: 500,
                message: textErrorMessage("Remarks", 500),
            },
        },
        componentProps: { fullWidth: true, multiline: true, rows: 3 },
    },
    {
        key: "documents",
        name: "documents",
        label: "Documents",
        type: "documentupload",
        gridColumn: 9,
        hideDropdown: true, // no document-type dropdown for rewards
        companyId: -1,
        componentProps: {
            fullWidth: true,
            companyType: "reward",
            placeholder: "Upload files...",
            multiple: true,
            allowMultipleFiles: true,
            accept: ".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls,.csv",
            formFieldName: "documents",
            customVariant: "ternary",
        },
    },
];
};

export const rewardBreadcrumbs = (isEditMode: boolean) => [
    { label: "Insurer Rewards", path: "/insurer-rewards" },
    { label: isEditMode ? "Edit reward" : "Add reward" },
];
