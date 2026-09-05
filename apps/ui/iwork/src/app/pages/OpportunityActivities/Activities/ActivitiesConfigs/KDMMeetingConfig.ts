export const kdmMeetingConfig = [
  {
    key: "kdmMeetingFormFields",
    title: "Enter new KDM meeting details or select from existing one",
    config: [
      {
        key: "kdmMeetingTypeLid",
        name: "kdmMeetingTypeLid",
        type: "segmentedcontrol",
        label: "Select KDM Meeting as",
        rules: {
          required: {
            value: true,
            message: "Please select KDM Meeting type.",
          },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
        apiDependencies: {
          endPoint: '#endPoints.lookUpByName("SELECT_MEETING")',
          clearFieldsOnChange: ["selectMeeting"],
        },
      },
      {
        key: "selectMeeting",
        name: "selectMeeting",
        type: "select",
        label: "Select Meeting",
        rules: {
          validate:
            '#validateRequiredIfEqual("kdmMeetingTypeLid", ${SELECT_MEETING_EXISTING_MEETING}, "Please select a meeting.")',
        },
        gridColumn: 5,
        componentProps: {
          onChange: "handleSelectMeeting",
          fullWidth: true,
        },
        invokeFunction: "fetchMeetingDetails",
        apiDependencies: {
          endPoint: "#endPoints.meetingList(opportunityActivityId)",
          showCondition:
            '#(watch) => !!watch("kdmMeetingTypeLid") && watch("kdmMeetingTypeLid") === ${SELECT_MEETING_EXISTING_MEETING}',
          utilityFunction: "#meetingUtilityFunction",
        },
      },
      {
        key: "meetingDate",
        name: "meetingDate",
        type: "date",
        label: "Meeting Date",
        rules: {
          required: {
            value: true,
            message: "Please select the meeting date.",
          },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
      },
      {
        key: "meetingTime",
        name: "meetingTime",
        type: "timerange",
        label: "Meeting time",
        rules: {
          required: {
            value: true,
            message: "Please select the available meeting time.",
          },
        },
        toName: "availableTo",
        toLabel: "Available to",
        fromName: "availableFrom",
        fromLabel: "Available from",
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
      },
      {
        key: "meetingTypeLid",
        name: "meetingTypeLid",
        type: "select",
        label: "Type of meeting",
        rules: {
          required: "Please select the meeting type.",
        },
        gridColumn: 5,
        componentProps: {
          disabled: true,
          fullWidth: true,
          placeholder: "Select...",
        },
        apiDependencies: {
          endPoint: '#endPoints.lookUpByName("MEETING_TYPE")',
        },
      },
      {
        key: "locationTypeLid",
        name: "locationTypeLid",
        type: "select",
        label: "Location (Held At)",
        rules: {
          required: "Please select the location type.",
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
        apiDependencies: {
          endPoint: '#endPoints.lookUpByName("MEETING_LOCATION")',
        },
      },
    ],
    defaultValues: {
      availableTo: null,
      meetingDate: "#dayjs().format(`YYYY-MM-DD`)",
      availableFrom: null,
      selectMeeting: null,
      meetingTypeLid: "#${MEETING_TYPE_KDM}",
      locationTypeLid: null,
      kdmMeetingTypeLid: "#${SELECT_MEETING_NEW_MEETING}",
    },
    containerStyles: {
      gap: "16px",
      display: "flex",
      flexDirection: "column",
    },
  },
  {
    key: "participants",
    title: "Participants",
    config: [
      {
        key: "companyContactPerson",
        name: "companyContactPerson",
        type: "multiselect",
        label: "Company Contact Persons",
        rules: {
          required: {
            value: true,
            message: "Please select at least one contact person.",
          },
        },
        gridColumn: 5,
        apiDependencies: {
          endPoint: "#endPoints.contactsByOpportunityId(opportunityId)",
          utilityFunction: "#contactsByOpportunityIdUtilityFunction",
        },
      },
      {
        key: "employees",
        name: "employees",
        type: "multiSelectFieldByApi",
        label: "Employee Participants",
        rules: {
          required: {
            value: true,
            message: "Please select at least one employee participant.",
          },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
        apiDependencies: {
          endPoint: "#endPoints.usersListInEmployee",
          utilityFunction: "#usersListUtilityFunction",
          customParams: { searchBy: "firstName" },
        },
      },
    ],
    containerStyles: {
      gap: "16px",
      display: "flex",
      flexDirection: "column",
    },
  },
  {
    key: "remarksMomSection",
    config: [
      {
        key: "mom",
        name: "mom",
        type: "textarea",
        label: "Agenda/MOM",
        rules: {
          required: {
            value: true,
            message: "MOM is required.",
          },
          validate:
            '#(value) => { return (value.length <= 1000 || "Mom should not exceed 1000 characters.")}',
        },
        gridColumn: 9,
        componentProps: {
          rows: 3,
          fullWidth: true,
          multiline: true,
        },
      },
      {
        key: "remarks",
        name: "remarks",
        type: "textarea",
        label: "Remarks",
        rules: {
          validate:
            '#(value) => { return (value.length <= 1000 || "Remarks should not exceed 1000 characters.")}',
        },
        gridColumn: 9,
        componentProps: {
          rows: 3,
          fullWidth: true,
          multiline: true,
        },
      },
    ],
    defaultValues: {
      mom: "",
      remarks: "",
    },
  },
  {
    key: "documents",
    config: [
      {
        key: "documents",
        name: "documents",
        type: "documentupload",
        label: "Documents",
        companyId: "#${companyId}",
        gridColumn: 9,
        componentProps: {
          isDocumentTypeRequired: true,
          isDocumentRequired: true,
          fullWidth: true,
          companyType: "opportunity",
        },
      },
    ],
    defaultValues: [
      {
        documentId: null,
        documentTypeLid: null,
      },
    ],
  },
];
