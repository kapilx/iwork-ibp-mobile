import { Company } from "../types";
import { activityUtilityFunction,opportunityUtilityFunction, notesActivityUtilityFunction} from "../MeetingForm/formConfig";
import {
  FormFieldConfig,
  DynamicObject,
  endPoints,
} from "@ui/ui-lib";

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

export const NotesFormFields: FormFieldConfig[] = [
  {
    key: "title",
    name: "title",
    label: "Note Title",
    type: "text",
    gridColumn: 5,
    rules: {
      required: {
        value: true,
        message: "Note Title is required",
      },
    },
    componentProps: {
      fullWidth: true,
      placeholder: "Enter note title ...",
    },
  },
  {
    key: "content",
    name: "content",
    label: "Note Content",
    type: "text",
    gridColumn: 9,
    componentProps: {
      fullWidth: true,
      placeholder: "Enter note content ...",
      multiline: true,
      rows: 4,
      sx: {
        "& .MuiInputBase-root.MuiOutlinedInput-root": {
          padding: "0px",
        },
      },
    },
    rules: {
      required: {
        value: true,
        message: "Note content is required",
      },
    },
  },
];

export const NotesLinkFields = (
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
    type: "selectFieldByApi",
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.opportunityActivityByOppurtunityId,
      dependentField: "opportunityId",
      utilityFunction: (data: DynamicObject, globalState: DynamicObject) =>
        notesActivityUtilityFunction(data, globalState, isFromOptyActivityPage),
    },
    componentProps: {
      fullWidth: true,
      placeholder: "Enter text here ...",
    },
  },
];
