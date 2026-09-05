import dayjs from "dayjs";
import { Company } from "../types";
import {
  FormFieldConfig,
  DynamicObject,
  endPoints,
  MEETING_FORM_ERROR_MESSAGE,
  insurerContactPersonUtilityFunction,
  insurerUtilityFunction,
  tpaContactPersonUtilityFunction,
  tpaUtilityFunction,
  formatNumberInputByLocalization,
  LocalizationConfig,
} from "@ui/ui-lib";
import {
  KDM_KEYWORDS,
  FINAL_NEG_KEYWORDS,
  HANDOVER_KEYWORDS,MEETING_SUPPORTER_MESSAGE
} from "../../../../constants";

//modify the utility and use imports if available in somefile
//utility function to get participatants
export const participantsUtilityFunction = (data: DynamicObject) => {
  const employees = data?.data?.data || [];
  return employees.map((emp: DynamicObject) => ({
    value: emp.userId, // or emp.id based on your API response
    label: emp.firstName + (emp.lastName ? " " + emp.lastName : ""),
    email: emp.emailId, // include if you want to use/display email
  }));
};

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

const companyContactsUtilityFunction = (data: any) => {
  let companyData = data?.data?.data || [];
  return companyData.map((contact: any) => ({
    value: contact.id,
    label: contact.displayName,
  }));
};

export const activityUtilityFunction = (
  data: DynamicObject,
  isFromOptyActivityPage: boolean = false
) => {
  const activitiesRoot = data?.data?.data;
  if (!activitiesRoot || typeof activitiesRoot !== "object") {
    return [];
  }

  const allActivities: { label: string; value: string }[] = [];

  Object.keys(activitiesRoot).forEach((sectionKey) => {
    const stages = activitiesRoot[sectionKey];
    if (Array.isArray(stages)) {
      stages.forEach((stage: any) => {
        if (Array.isArray(stage.activities)) {
          stage.activities.forEach((activity: any) => {
            const shouldIncludeActivity =
              activity?.activityName &&
              (isFromOptyActivityPage ? activity?.completedAt === null : true);

            if (shouldIncludeActivity) {
              allActivities.push({
                label: activity.activityName.trim(),
                value: activity.opportunityActivityId,
              });
            }
          });
        }
      });
    }
  });

  return allActivities;
};

// Utility function for meeting activities - filters based on current activity context
export const meetingActivityUtilityFunction = (
  data: DynamicObject,
  globalState: DynamicObject,
  isFromOptyActivityPage: boolean = false,
  isOnOpportunityPage: boolean = false
) => {
  const activitiesRoot = data?.data?.data;
  if (!activitiesRoot || typeof activitiesRoot !== "object") {
    return [];
  }

  const allActivities: { label: string; value: string; activityKey?: string; activityName: string }[] = [];

  // Collect all activities with their metadata
  Object.keys(activitiesRoot).forEach((sectionKey) => {
    const stages = activitiesRoot[sectionKey];
    if (Array.isArray(stages)) {
      stages.forEach((stage: any) => {
        if (Array.isArray(stage.activities)) {
          stage.activities.forEach((activity: any) => {
            const shouldIncludeActivity =
              activity?.activityName &&
              (isFromOptyActivityPage ? activity?.completedAt === null : true);

            if (shouldIncludeActivity) {
              allActivities.push({
                label: activity.activityName.trim(),
                value: activity.opportunityActivityId,
                activityKey: activity.activityKey?.toLowerCase() || "",
                activityName: activity.activityName.toLowerCase().trim(),
              });
            }
          });
        }
      });
    }
  });

  // Filter to only meeting-related activities (KDM, Final Negotiation, Handover)
  const meetingActivities = allActivities.filter((activity) => {
    const matchText = `${activity.activityKey} ${activity.activityName}`;
    return (
      KDM_KEYWORDS.some((kw) => matchText.includes(kw)) ||
      FINAL_NEG_KEYWORDS.some((kw) => matchText.includes(kw)) ||
      HANDOVER_KEYWORDS.some((kw) => matchText.includes(kw))
    );
  });

  // If NOT from opportunity activity page OR NOT on opportunity page, return all activities
  if (!isFromOptyActivityPage || !isOnOpportunityPage) {
    return allActivities.map(({ label, value }) => ({ label, value }));
  }

  // From here onwards: we're on opportunity page in activity context
  // Return the 3 meeting activities with filtering based on current activity

  // Get current activity ID from globalState
  const currentActivityId = globalState?.activityId;
  
  if (!currentActivityId) {
    return meetingActivities.map(({ label, value }) => ({ label, value }));
  }

  // Find current activity
  const currentActivity = meetingActivities.find((a) => a.value === currentActivityId);
  
  if (!currentActivity) {
    return meetingActivities.map(({ label, value }) => ({ label, value }));
  }

  const currentMatchText = `${currentActivity.activityKey} ${currentActivity.activityName}`;

  // Filter based on current activity - show only next activities (current is prefilled)
  if (KDM_KEYWORDS.some((kw) => currentMatchText.includes(kw))) {
    // Current is KDM - show Final Negotiation and Handover only (exclude KDM since it's prefilled)
    return meetingActivities
      .filter((activity) => {
        const matchText = `${activity.activityKey} ${activity.activityName}`;
        return (
          FINAL_NEG_KEYWORDS.some((kw) => matchText.includes(kw)) ||
          HANDOVER_KEYWORDS.some((kw) => matchText.includes(kw))
        );
      })
      .map(({ label, value }) => ({ label, value }));
  } else if (FINAL_NEG_KEYWORDS.some((kw) => currentMatchText.includes(kw))) {
    // Current is Final Negotiation - show only Handover (exclude Final Negotiation since it's prefilled)
    return meetingActivities
      .filter((activity) => {
        const matchText = `${activity.activityKey} ${activity.activityName}`;
        return HANDOVER_KEYWORDS.some((kw) => matchText.includes(kw));
      })
      .map(({ label, value }) => ({ label, value }));
  } else if (HANDOVER_KEYWORDS.some((kw) => currentMatchText.includes(kw))) {
    // Current is Handover - show only Handover
    return meetingActivities
      .filter((activity) => {
        const matchText = `${activity.activityKey} ${activity.activityName}`;
        return HANDOVER_KEYWORDS.some((kw) => matchText.includes(kw));
      })
      .map(({ label, value }) => ({ label, value }));
  }

  return meetingActivities.map(({ label, value }) => ({ label, value }));
};

// Utility function for notes activities - shows current and next activities only
export const notesActivityUtilityFunction = (
  data: DynamicObject,
  globalState: DynamicObject,
  isFromOptyActivityPage: boolean = false
) => {
  const activitiesRoot = data?.data?.data;
  if (!activitiesRoot || typeof activitiesRoot !== "object") {
    return [];
  }

  const allActivities: { label: string; value: string; completedAt: any }[] = [];
  let currentActivityFound = false;
  let currentActivityIndex = -1;

  // Collect all activities in order
  Object.keys(activitiesRoot).forEach((sectionKey) => {
    const stages = activitiesRoot[sectionKey];
    if (Array.isArray(stages)) {
      stages.forEach((stage: any) => {
        if (Array.isArray(stage.activities)) {
          stage.activities.forEach((activity: any) => {
            if (activity?.activityName) {
              allActivities.push({
                label: activity.activityName.trim(),
                value: activity.opportunityActivityId,
                completedAt: activity.completedAt,
              });
            }
          });
        }
      });
    }
  });

  // If not from opportunity activity page, show all incomplete activities
  if (!isFromOptyActivityPage) {
    return allActivities
      .filter((activity) => activity.completedAt === null)
      .map(({ label, value }) => ({ label, value }));
  }

  // Get current activity ID from globalState
  const currentActivityId = globalState?.activityId;

  if (!currentActivityId) {
    return allActivities
      .filter((activity) => activity.completedAt === null)
      .map(({ label, value }) => ({ label, value }));
  }

  // Find current activity index
  currentActivityIndex = allActivities.findIndex((a) => a.value === currentActivityId);

  if (currentActivityIndex === -1) {
    return allActivities
      .filter((activity) => activity.completedAt === null)
      .map(({ label, value }) => ({ label, value }));
  }

  // Return current activity and all next incomplete activities
  return allActivities
    .slice(currentActivityIndex)
    .filter((activity) => activity.completedAt === null)
    .map(({ label, value }) => ({ label, value }));
};

export const opportunityUtilityFunction = (
  data: DynamicObject,
  globalState: DynamicObject,
  localization?: LocalizationConfig
) => {
  const opportunities = data?.data?.data || [];

  return opportunities.map((item: DynamicObject) => {
    const policyType = item.policyType || "";
    const premium = item.premium;

    // Format the premium with comma separation based on localization
    let formattedPremium = "";
    if (premium !== null && premium !== undefined && !isNaN(Number(premium))) {
      formattedPremium = formatNumberInputByLocalization(
        Number(premium),
        localization
      );
    }

    // Combine policy type and formatted premium with space
    let label = "";
    if (policyType) {
      label = `${policyType} (${formattedPremium || "0"})`;
    } else if (item.opportunityIdentifier) {
      label = item.opportunityIdentifier;
    } else if (formattedPremium) {
      label = `(${formattedPremium})`;
    } else {
      label = String(item.opportunityId ?? "");
    }

    return {
      label,
      value: item.opportunityId,
    };
  });
};

export const MeetingDetailsFields: FormFieldConfig[] = [
  {
    key: "meetingType",
    name: "meetingType",
    label: "Meeting Type",
    type: "select",
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.lookUpByName("MEETING_TYPE"),
    },
    rules: {
      required: {
        value: true,
        message: "Meeting type is required",
      },
    },
  },
  {
    key: "subject",
    name: "subject",
    label: "Meeting Subject",
    type: "text",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      placeholder: "Enter text here ...",
      // sx: (theme) => subjectField(theme), // Add this if you have a subjectField style
    },
    rules: {
      required: {
        value: true,
        message: MEETING_FORM_ERROR_MESSAGE.SUBJECT_REQUIRED_MESSAGE,
      },
    },
  },
  {
    key: "meetingAgenda",
    name: "meetingAgenda",
    label: "Meeting Agenda",
    type: "text",
    gridColumn: 9,
    componentProps: {
      fullWidth: true,
      placeholder: "Enter agenda content ...",
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
        message: MEETING_FORM_ERROR_MESSAGE.AGENDA_REQUIRED_MESSAGE,
      },
    },
  },
  {
    key: "Date",
    name: "Date",
    label: "Meeting Date",
    type: "date",
    gridColumn: 5,
    componentProps: {
      onChange: (value: any) => {
        return value;
      },
      // sx: (theme) => dateField(theme), // Add this if you have a dateField style
    },
    rules: {
      required: {
        value: true,
        message: MEETING_FORM_ERROR_MESSAGE.DATE_REQUIRED_MESSAGE,
      },
    },
  },
  {
    key: "meetingTime",
    name: "meetingTime",
    label: "Meeting time",
    type: "timerange",
    fromName: "availableFrom",
    toName: "availableTo",
    fromLabel: "From",
    toLabel: "To",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
    },
    rules: {
      required: {
        value: true,
        message: MEETING_FORM_ERROR_MESSAGE.MEETING_TIME_REQUIRED,
      },
    },
  },
  {
    key: "Location",
    name: "Location",
    label: "Location Held At",
    type: "select",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
    },
    apiDependencies: {
      endPoint: endPoints.lookUpByName("MEETING_LOCATION"),
    },
  },
  {
    key: "meetingStatusLid",
    name: "meetingStatusLid",
    label: "Status",
    type: "select",
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.lookUpByName("MEETING_STATUS"),
    },
    componentProps: {
      fullWidth: true,
    },
  },
];

export const MeetingFormFields: FormFieldConfig[] = [
  {
    key: "attachments",
    name: "attachments",
    label: "Attachments",
    type: "documentupload",
    hideDropdown: true, // no document type dropdown
    companyId: -1, // pulled from meeting form field
    gridColumn: 9,
    componentProps: {
      fullWidth: true,
      companyType: "meeting", // or "meeting" depending on backend
      placeholder: "Upload files...",
      multiple: true,
      accept: ".pdf,.doc,.docx,.jpg,.jpeg,.png",
      supportedFormatsMessage: MEETING_SUPPORTER_MESSAGE,
      formFieldName: "attachments",
      downloadModuleKey: "task_and_meetings",
    },
  },
];

export const MeetingLinkingAndParticipantsFields = (
  isFromOptyActivityPage = false,
  isOnOpportunityPage = false
): FormFieldConfig[] => [
  {
    key: "MeetingLinks",
    name: "MeetingLinks",
    label: "Meeting Links",
    type: "title",
  },
  {
    key: "companyId",
    name: "companyId",
    label: "Company",
    type: "selectFieldByApi",
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.companiesListInSelectField,
      utilityFunction: companyUtilityFunction,
      clearFieldsOnChange: ["opportunityId", "activityId", "companyContact"],
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
        meetingActivityUtilityFunction(data, globalState, isFromOptyActivityPage, isOnOpportunityPage),
    },
    componentProps: {
      fullWidth: true,
      placeholder: "Enter text here ...",
    },
  },
  {
    key: "MeetingParticipants",
    name: "MeetingParticipants",
    label: "Meeting Participants",
    type: "title",
  },
  {
    key: "companyContact",
    name: "companyContact",
    label: "Company Contacts",
    type: "multiSelectFieldByApi", // Use supported type
    enableSearch: true,
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.companyContacts,
      dependentField: "companyId",
      utilityFunction: companyContactsUtilityFunction,
      customParams: {
        status: "ACTIVE", // or any other status you want to filter by
      },
    },
    componentProps: {
      fullWidth: true,
      placeholder: "Enter text here ...",
    },
    rules: {
      validate: (value: any, allValues: any) => {
        if (allValues?.companyId) {
          if (!value || value.length === 0) {
            return MEETING_FORM_ERROR_MESSAGE.COMPANY_CONTACTS_REQUIRED;
          }
        }
        return true;
      },
    },
  },
  {
    key: "internalEmployee",
    name: "internalEmployee",
    label: "Internal Employees",
    type: "multiSelectFieldByApi", // Use supported type
    enableSearch: true,
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      placeholder: "Select Internal Employee as participants...",
      options: [], // will be set from API
    },
    apiDependencies: {
      endPoint: endPoints.usersListInEmployee, // should point to /employee/list-of-values
      utilityFunction: participantsUtilityFunction,
      customParams: { searchBy: "firstName" },
    },
    rules: {
      validate: (value, allValues) => {
        const noCompany = !allValues?.companyId;
        const noTpa = !allValues?.tpa;
        const noInsurer = !allValues?.insure;

        const shouldBeRequired = noCompany && noTpa && noInsurer;

        if (shouldBeRequired) {
          if (!value || value.length === 0) {
            return MEETING_FORM_ERROR_MESSAGE.INTERNAL_EMPLOYEES_REQUIRED;
          }
        }

        return true;
      },
    },
  },
  {
    key: "tpa",
    name: "tpa",
    label: "TPA",
    type: "selectFieldByApi", // Use supported type
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      placeholder: "Select participants...",
      options: [], // will be set from API
    },
    apiDependencies: {
      endPoint: endPoints.tpasList, // should point to /employee/list-of-values
      utilityFunction: tpaUtilityFunction,
      clearFieldsOnChange: ["tpaContact"],
      customParams: { searchBy: "tpaName" },
    },
  },
  {
    key: "tpaContact",
    name: "tpaContact",
    label: "TPA Contacts",
    type: "multiSelectFieldByApi", // Use supported type
    enableSearch: true,
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      placeholder: "Select participants...",
      options: [], // will be set from API
    },
    apiDependencies: {
      endPoint: endPoints.tpaContactList, // should point to /employee/list-of-values
      utilityFunction: tpaContactPersonUtilityFunction,
      dependentField: "tpa", // this field will be used to fetch contacts based on selected TPA
      customParams: { status: "ACTIVE" },
    },
    rules: {
      validate: (value: any, allValues: any) => {
        if (allValues?.tpa) {
          if (!value || value.length === 0) {
            return MEETING_FORM_ERROR_MESSAGE.TPA_CONTACTS_REQUIRED;
          }
        }
        return true;
      },
    },
  },
  {
    key: "insure",
    name: "insure",
    label: "Insurer",
    type: "selectFieldByApi", // Use supported type
    enableSearch: true,
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      placeholder: "Select participants...",
      options: [], // will be set from API
    },
    apiDependencies: {
      endPoint: endPoints.insurersList, // should point to /employee/list-of-values
      clearFieldsOnChange: ["insureContact"],
      utilityFunction: insurerUtilityFunction,
      customParams: { searchBy: "insurerName" },
    },
  },
  {
    key: "insureContact",
    name: "insureContact",
    label: "Insurer Contacts",
    type: "multiSelectFieldByApi", // Use supported type
    enableSearch: true,
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      placeholder: "Select participants...",
      options: [], // will be set from API
    },
    apiDependencies: {
      endPoint: endPoints.insurerContactList, // should point to /employee/list-of-values
      utilityFunction: insurerContactPersonUtilityFunction,
      dependentField: "insure", // this field will be used to fetch contacts based on selected Insurer
      customParams: { status: "ACTIVE" },
    },
    rules: {
      validate: (value: any, allValues: any) => {
        if (allValues?.insure) {
          if (!value || value.length === 0) {
            return MEETING_FORM_ERROR_MESSAGE.INSURER_CONTACTS_REQUIRED;
          }
        }
        return true;
      },
    },
  },
];

export const MeetingLinkingAndParticipantsFields_ForInternalMeeting = (
  isFromOptyActivityPage = false
): FormFieldConfig[] => [
    {
      key: "internalEmployee",
      name: "internalEmployee",
      label: "Internal Employees",
      type: "multiSelectFieldByApi", // Use supported type
      enableSearch: true,
      gridColumn: 5,
      componentProps: {
        fullWidth: true,
        placeholder: "Select Internal Employee as participants...",
        options: [], // will be set from API
      },
      apiDependencies: {
        endPoint: endPoints.usersListInEmployee, // should point to /employee/list-of-values
        utilityFunction: participantsUtilityFunction,
        customParams: { searchBy: "firstName" },
      },
      rules: {
        validate: (value, allValues) => {
          const noCompany = !allValues?.companyId;
          const noTpa = !allValues?.tpa;
          const noInsurer = !allValues?.insure;

          const shouldBeRequired = noCompany && noTpa && noInsurer;

          if (shouldBeRequired) {
            if (!value || value.length === 0) {
              return "Internal Employees are required if no Company, TPA, or Insurer is selected.";
            }
          }

          return true;
        },
      },
    },
  ];
