import dayjs from "dayjs";
import { Company } from "../types";
import {
  activityUtilityFunction,
  opportunityUtilityFunction,
} from "../MeetingForm/formConfig";
import {
  FormFieldConfig,
  DynamicObject,
  endPoints,
  textErrorMessage,
  convertToTreeData,
} from "@ui/ui-lib";
// import { hierarchyField } from "../../../../components/BusinessPerformance/businessPerformanceConfig";

const companyUtilityFunction = (
  data: DynamicObject,
  globalState: DynamicObject
) => {
  let companyData = data?.data?.data || [];
  const companyId = globalState?.companyId;
  if (companyId) {
    //in edit mode we have to filter the current company options
    companyData = companyData.filter(
      (company: Company) => company.id !== companyId
    );
  }

  return companyData.map((company: Company) => ({
    value: company.id,
    label: company.companyName,
  }));
};

export const hierarchyField: FormFieldConfig = {
  key: "userId",
  name: "userId",
  label: "Owner",
  type: "treeSelect",
  apiDependencies: {
    endPoint: endPoints.totalEmployeeHierarchy,
    utilityFunction: convertToTreeData,
    // clearFieldsOnChange: ["owner"],
  },
  componentProps: {
    fullWidth: true,
  },
} as const;

export const TaskDetailsFormFields: FormFieldConfig[] = [
  {
    key: "taskSubject",
    name: "taskSubject",
    label: "Task Subject",
    type: "text",
    gridColumn: 5,
    rules: {
      maxLength: {
        value: 255,
        message: textErrorMessage("Task subject", 255),
      },
      required: {
        value: true,
        message: "Task Subject is required",
      },
    },
    componentProps: {
      fullWidth: true,
      placeholder: "Enter text here ...",
    },
  },
  {
    key: "description",
    name: "description",
    label: "Description",
    type: "text",
    gridColumn: 9,
    componentProps: {
      fullWidth: true,
      placeholder: "Enter description here ...",
      multiline: true,
      rows: 4,
      sx: {
        "& .MuiInputBase-root.MuiOutlinedInput-root": {
          padding: "0px",
        },
      },
    },
  },
  {
    key: "assigneeId",
    name: "assigneeId",
    label: "Assigned to",
    type: "treeSelect",
    gridColumn: 5,
    apiDependencies: {
      ...hierarchyField.apiDependencies,
      // Removed dependentField since subTaskTypeLid no longer exists
    },
    componentProps: {
      ...hierarchyField.componentProps,
      controlledSearchInput: false,
      fullWidth: true,
    },
    rules: {
      required: {
        value: true,
        message: "Assigned to is required",
      },
    },
  },
  {
    key: "dueDate",
    name: "dueDate",
    label: "Due Date",
    type: "date",
    gridColumn: 5,
    rules: {
      required: {
        value: true,
        message: "Task due date is required",
      },
    },
    componentProps: {
      fullWidth: true,
      minDate: dayjs(),
      onChange: (value: unknown) => {
        return value;
      },
    },
  },
];

export const TaskExtraFields: FormFieldConfig[] = [
  {
    key: "priority",
    name: "priority",
    label: "Priority",
    type: "select",
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.lookUpByName("PRIORITY", "DESC"),
    },
    componentProps: {
      fullWidth: true,
    },
  },
  {
    key: "taskStatusLid",
    name: "taskStatusLid",
    label: "Status",
    type: "select",
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.lookUpByName("TASK_STATUS"),
    },
    componentProps: {
      fullWidth: true,
    },
  },
];

export const TaskLinkFields = (
  isFromOptyActivityPage = false
): FormFieldConfig[] => [
  {
    key: "companyId",
    name: "companyId",
    label: "Company",
    type: "selectFieldByApi",
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.companiesListInSelectField,
      utilityFunction: companyUtilityFunction,
      clearFieldsOnChange: ["opportunityId", "activityId"],
    },
    componentProps: {
      fullWidth: true,
    },
    disabled: isFromOptyActivityPage,
  },
  {
    key: "opportunityId",
    name: "opportunityId",
    label: "Opportunity",
    type: "selectFieldByApi",
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.opportunityByCompanyId,
      dependentField: "companyId",
      utilityFunction: opportunityUtilityFunction,
    },
    componentProps: {
      fullWidth: true,
      placeholder: "Enter text here ...",
    },
    disabled: isFromOptyActivityPage,
  },
  {
    key: "activityId",
    name: "activityId",
    label: "Activity",
    type: "select",
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.opportunityActivityByOppurtunityId,
      dependentField: "opportunityId",
      utilityFunction: (data) =>
        activityUtilityFunction(data, isFromOptyActivityPage),
    },
    componentProps: {
      fullWidth: true,
      placeholder: "Enter text here ...",
    },
  },
];

export const closeTaskModalConfig = {
  key: "closeTask",
  config: [
    {
      key: "comments",
      name: "comments",
      label: "Comments",
      type: "textarea",
      gridColumn: 9,
      componentProps: {
        fullWidth: true,
        multiline: true,
        rows: 3,
        placeholder: "Enter comments",
        style: { width: "100%" },
      },
    },
  ],
} as const;
