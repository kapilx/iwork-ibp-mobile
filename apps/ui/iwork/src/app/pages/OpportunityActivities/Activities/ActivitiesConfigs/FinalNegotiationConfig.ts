//Duplicating the config for sri lankan users and need to refactor in the future

import { REGEX_PATTERNS } from "@ui/ui-lib";
import { withPercentageClamp } from "@ui/ui-lib/utils";
import { buildInsurerSectionConfigs } from "./sharedInsurerConfig";

export const finalNegotiationConfig = (formValues = {}, dyamicvalues = {}) => {
  const { leadFields, leadDefaults, insurerDetailsSection } =
    buildInsurerSectionConfigs({
      formValues,
      dynamicValues: dyamicvalues,
      leadSectionKey: "policyDetails",
      leadFieldKeys: { leadPays: "isLeadInsurerPayCommissionLid" },
      basePremiumPath: "selectFinalisedQuote.basicPremium",
      brokerageAmountPath: "selectFinalisedQuote.basicBrokerageAmount",
      totalBrokerageAmountPath: "selectFinalisedQuote.totalBrokerageAmount",
      runExternalValidatorsOnChange: true,
      additionalCommissions: [
        {
          percentageKey: "terrorismBrokeragePercentage",
          amountKey: "terrorismBrokerageAmount",
          label: "Terrorism brokerage amount",
          sharePercentageKey: "terrorismSharePercentage",
          shareAmountKey: "terrorismShareAmount",
          shareLabel: "Terrorism",
          premiumBasePath: "selectFinalisedQuote.terrorism",
          policyAmountPath: "selectFinalisedQuote.tcBrokerageAmount",
          showField: () => {
            const storedUser = window.sessionStorage.getItem("user");
            if (!storedUser) return false;
            try {
              const parsed = JSON.parse(storedUser);
              return parsed?.organisationKey !== "iirm_srilanka";
            } catch (_err) {
              return false;
            }
          },
        },
      ],
    });

  return [
    {
      key: "meetingDetails",
      title: "Meeting Details",
      config: [
        {
          key: "isFinalNegotiationTypeLid",
          name: "isFinalNegotiationTypeLid",
          type: "segmentedcontrol",
          label: "Did the meeting already happen",
          rules: {
            required: {
              value: true,
              message: "Please select Meeting type.",
            },
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          apiDependencies: {
            endPoint: "#endPoints.lookUpByName(`SELECT_MEETING`)",
            clearFieldsOnChange: ["selectMeeting"],
          },
          activityOrder: 1,
        },
        {
          key: "selectMeeting",
          name: "selectMeeting",
          type: "select",
          label: "Select Meeting",
          rules: {
            validate:
              '#validateRequiredIfEqual("isFinalNegotiationTypeLid", ${SELECT_MEETING_EXISTING_MEETING}, "Please select a meeting.")',
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
              '#(watch) => !!watch("isFinalNegotiationTypeLid") && watch("isFinalNegotiationTypeLid") === ${SELECT_MEETING_EXISTING_MEETING}',
            utilityFunction: "#meetingUtilityFunction",
          },
          activityOrder: 2,
        },
        {
          key: "meetingDate",
          name: "meetingDate",
          type: "date",
          label: "Meeting date",
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
          activityOrder: 3,
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
          activityOrder: 4,
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
            endPoint: "#endPoints.lookUpByName(`MEETING_TYPE`)",
          },
          activityOrder: 5,
        },
        {
          key: "locationTypeLid",
          name: "locationTypeLid",
          type: "select",
          label: "Location (Held At)",
          rules: {
            required: {
              value: true,
              message: "Please select the location.",
            },
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          apiDependencies: {
            endPoint: "#endPoints.lookUpByName(`MEETING_LOCATION`)",
          },
          activityOrder: 6,
        },
      ],
      defaultValues: {
        availableTo: null,
        meetingDate: "#dayjs().format(`YYYY-MM-DD`)",
        availableFrom: null,
        selectMeeting: null,
        meetingTypeLid: "#${MEETING_TYPE_FINAL_NEGOTIATION}",
        locationTypeLid: null,
        isFinalNegotiationTypeLid: "#${SELECT_MEETING_NEW_MEETING}",
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
          activityOrder: 7,
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
          activityOrder: 8,
        },
      ],
      defaultValues: [
        {
          companyId: null,
          companyContactPerson: [],
        },
      ],
      containerStyles: {
        gap: "16px",
        display: "flex",
        flexDirection: "column",
      },
    },
    {
      key: "insurerParticipants",
      title: "Insurer Participants",
      config: [
        {
          key: "insurerId",
          name: "insurerId",
          type: "selectFieldByApi",
          label: "Insurer Participants",
          rules: {
            required: {
              value: true,
              message: "Please select an insurer.",
            },
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          apiDependencies: {
            endPoint: "#endPoints.insurersList",
            utilityFunction: "#insurerListUtilityFunction",
            clearFieldsOnChange: ["insurerContactPerson"],
          },
          activityOrder: 9,
        },
        {
          key: "insurerContactPerson",
          name: "insurerContactPerson",
          type: "multiselect",
          label: "Insurer Contact Person",
          rules: {
            required: {
              value: true,
              message: "Please select at least one contact person.",
            },
          },
          gridColumn: 5,
          apiDependencies: {
            endPoint: "#endPoints.insurerContactList",
            dependentField: "insurerId",
            utilityFunction: "#insurerContactPersonUtilityFunction",
          },
          activityOrder: 10,
        },
      ],
      defaultValues: {
        insurerId: "",
        insurerContactPerson: [],
      },
      containerStyles: {
        gap: "16px",
        display: "flex",
        flexDirection: "column",
      },
    },
    {
      key: "tpaParticipants",
      title: "TPA Participants",
      config: [
        {
          key: "tpaId",
          name: "tpaId",
          type: "selectFieldByApi",
          label: "TPA Participants",
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          apiDependencies: {
            endPoint: "#endPoints.tpasList",
            utilityFunction: "#tpaUtilityFunction",
            clearFieldsOnChange: ["tpaContactPerson"],
            customParams: { searchBy: "firstName" },
          },
          activityOrder: 11,
        },
        {
          key: "tpaContactPerson",
          name: "tpaContactPerson",
          type: "multiselect",
          label: "TPA Contact Person",
          gridColumn: 5,
          apiDependencies: {
            endPoint: "#endPoints.tpaContactList",
            dependentField: "tpaId",
            utilityFunction: "#tpaContactPersonUtilityFunction",
          },
          activityOrder: 12,
        },
      ],
      containerStyles: {
        gap: "16px",
        display: "flex",
        flexDirection: "column",
      },
    },
    {
      key: "meetingSummary",
      config: [
        {
          key: "mom",
          name: "mom",
          type: "textarea",
          label: "Agenda/MOM",
          rules: {
            required: {
              value: true,
              message: "Please enter the MOM.",
            },
          },
          gridColumn: 9,
          componentProps: {
            rows: 3,
            fullWidth: true,
            multiline: true,
          },
          activityOrder: 13,
        },
      ],
      defaultValues: {
        mom: "",
      },
    },
    {
      key: "selectFinalisedQuote",
      title: "Select Finalised Quote",
      renderActions: [
        {
          key: "addQuoteButton",
          variant: "button",
          text: "Add Quote",
          onClick: "handleAddQuoteClick",
          componentProps: {
            variantType: "secondary",
          },
        },
      ],
      config: [
        {
          key: "finalizedVersionId",
          name: "finalizedVersionId",
          type: "select",
          label: "Finalised version quote",
          rules: {
            required: {
              value: true,
              message: "Please select a finalised version quote.",
            },
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          apiDependencies: {
            endPoint: "#endPoints.brokingSlipVersions(opportunityId)",
            utilityFunction: "#versionUtilityFunction",
            clearFieldsOnChange: [
              "finalizedQuoteId",
              "insurerId",
              "quoteReceivedOn",
              "terrorism",
              "netPremium",
              "basicPremium",
              "basicBrokeragePercentage",
              "basicBrokerageAmount",
              "insurerLocationId",
              "adminCharges",
              "other",
              "cessAmount",
              "fee",
              "gstPercentage",
              "gstAmount",
              "grossPremium",
              "srccPercentage",
              "srccBrokerageAmount",
            ],
          },
          activityOrder: 14,
        },
        {
          key: "finalizedQuoteId",
          name: "finalizedQuoteId",
          type: "select",
          label: "Finalised quote",
          rules: {
            required: {
              value: true,
              message: "Please select a finalised quote.",
            },
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          invokeFunction: "handleFinalizedQuoteSelection",
          apiDependencies: {
            endPoint: "#endPoints.getAllQuotesByBrokingSlipId",
            dependentField: "finalizedVersionId",
            utilityFunction: "#quoteUtilityFunction",
            clearFieldsOnChange: [
              "finalizedQuoteId",
              "insurerId",
              "quoteReceivedOn",
              "terrorism",
              "netPremium",
              "basicPremium",
              "basicBrokeragePercentage",
              "basicBrokerageAmount",
              "insurerLocationId",
              "adminCharges",
              "other",
              "cessAmount",
              "fee",
              "gstPercentage",
              "gstAmount",
              "grossPremium",
              "srccPercentage",
              "srccBrokerageAmount",
            ],
          },
          activityOrder: 15,
        },
        {
          key: "insurerId",
          name: "insurerId",
          type: "selectFieldByApi",
          label: "Select Insurer",
          rules: {
            required: {
              value: true,
              message: "Insurer type is required",
            },
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
            placeholder: "Select Insurer",
            disabled: true,
          },
          apiDependencies: {
            endPoint: "#endPoints.insurersList",
            utilityFunction: "#insurerListUtilityFunction",
            dependentField: "finalizedVersionId",
            clearFieldsOnChange: ["insurerLocationId"],
          },
          activityOrder: 16,
        },
        {
          key: "insurerLocationId",
          name: "insurerLocationId",
          label: "Select Insurer Location",
          type: "selectFieldByApi",
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
            placeholder: "Select Insurer Location",
            disabled: true,
          },
          rules: {
            required: { value: true, message: "Insurer location is required" },
          },
          apiDependencies: {
            endPoint: "#endPoints.insurerLocationsById",
            utilityFunction: "#getLocationOptionsByEntityName",
            dependentField: "insurerId",
          },
          activityOrder: 17,
        },
        {
          key: "quoteReceivedOn",
          name: "quoteReceivedOn",
          type: "date",
          label: "Quote received on",
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          activityOrder: 18,
        },
        {
          key: "isQuoteEdited",
          name: "isQuoteEdited",
          type: "segmentedcontrol",
          label: "Would you like to edit quote?",
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          apiDependencies: {
            endPoint: "#endPoints.lookUpByName(`TOGGLE_TYPE`)",
          },
          activityOrder: 19,
        },
        {
          key: "basicPremium",
          name: "basicPremium",
          type: "number",
          isDecimal: true,
          label: "Basic premium",
          rules: {
            required: {
              value: true,
              message: "Basic premium is required",
            },
          },
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            type: "number",
            fullWidth: true,
          },
          activityOrder: 20,
        },
        {
          key: "terrorism",
          name: "terrorism",
          type: "number",
          isDecimal: true,
          label: "Terrorism premium",
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            fullWidth: true,
          },
          activityOrder: 21,
        },
        {
          key: "netPremium",
          name: "netPremium",
          type: "number",
          isDecimal: true,
          label: "Net premium",
          gridColumn: 5,
          formatNumber: true,
          disabled:true,
          componentProps: {
            fullWidth: true,
          },
          activityOrder: 22,
        },
        {
          key: "gstPercentage",
          name: "gstPercentage",
          label: "GST percentage",
          type: "number",
          isDecimal: true,
          gridColumn: 5,
          componentProps: withPercentageClamp({
            fullWidth: true,
            type: "number",
          }),
          rules: {
            min: {
              value: 0,
              message: "GST percentage cannot be negative",
            },
            max: {
              value: 100,
              message: "GST percentage cannot exceed 100",
            },
            required: {
              value: true,
              message: "GST percentage is required",
            },
          },
          activityOrder: 23,
        },
        {
          key: "gstAmount",
          name: "gstAmount",
          label: "GST amount",
          type: "number",
          isDecimal: true,
          formatNumber: true,
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
            type: "number",
          },
          // disabled: true,
          rules: {
            pattern: {
              value: "REGEX_PATTERNS.NUMERIC",
              message: "GST amount must be a positive numeric value",
            },
            required: {
              value: true,
              message: "GST amount is required",
            },
          },
          activityOrder: 24,
        },
        {
          key: "fee",
          name: "fee",
          type: "number",
          isDecimal: true,
          label: "Fee",
          rules: {
            required: {
              value: true,
              message: "Fee is required",
            },
          },
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            fullWidth: true,
          },
          activityOrder: 25,
        },
        {
          key: "other",
          name: "other",
          type: "number",
          isDecimal: true,
          label: "Other amount",
          formatNumber: true,
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          activityOrder: 26,
        },
        {
          key: "grossPremium",
          name: "grossPremium",
          type: "number",
          isDecimal: true,
          label: "Gross premium",
          rules: {
            required: {
              value: true,
              message: "Gross premium is required",
            },
          },
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            fullWidth: true,
            disabled: true,
          },
          activityOrder: 27,
        },
        {
          key: "basicBrokeragePercentage",
          name: "basicBrokeragePercentage",
          type: "number",
          label: "Basic brokerage percentage",
          rules: {
            max: {
              value: 100,
              message: "Basic brokerage percentage cannot be more than 100%",
            },
            min: {
              value: 0,
              message: "Basic brokerage percentage cannot be less than 0%",
            },
            required: {
              value: true,
              message: "Basic brokerage percentage is required",
            },
          },
          isDecimal: true,
          gridColumn: 5,
          componentProps: withPercentageClamp({
            fullWidth: true,
          }),
          activityOrder: 28,
        },

        {
          key: "terrorismBrokeragePercentage",
          name: "terrorismBrokeragePercentage",
          label: "Terrorism brokerage percentage",
          type: "number",
          isDecimal: true,
          gridColumn: 5,
          componentProps: withPercentageClamp({
            fullWidth: true,
            type: "number",
          }),
          rules: {
            min: {
              value: 0,
              message: "Terrorism brokerage percentage cannot be negative",
            },
            max: {
              value: 100,
              message: "Terrorism brokerage percentage cannot exceed 100",
            },
            required: {
              value: true,
              message: "Terrorism brokerage percentage is required",
            },
          },
          activityOrder: 29,
        },
        {
          key: "basicBrokerageAmount",
          name: "basicBrokerageAmount",
          type: "number",
          isDecimal: true,
          label: "Basic brokerage amount",
          rules: {
            required: {
              value: true,
              message: "Basic brokerage amount is required",
            },
          },
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            type: "number",
            fullWidth: true,
          },
          activityOrder: 30,
        },
        {
          key: "tcBrokerageAmount",
          name: "tcBrokerageAmount",
          type: "number",
          isDecimal: true,
          label: "Terrorism brokerage amount",
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          formatNumber: true,
          disabled: true,
          activityOrder: 31,
        },
        {
          key: "totalBrokerageAmount",
          name: "totalBrokerageAmount",
          type: "number",
          isDecimal: true,
          label: "Total brokerage amount",
          gridColumn: 5,
          disabled: true,
          componentProps: {
            fullWidth: true,
          },
          formatNumber: true,
          // Rules removed (was required in India version)
          activityOrder: 32, // Changed from 24 to 27
        },
      ],
      defaultValues: {
        isQuoteEdited: "#${TOGGLE_YES}",
      },
      containerStyles: {
        gap: "16px",
        border: "1px solid #eaeaea",
        display: "flex",
        padding: "16px",
        borderRadius: "8px",
        flexDirection: "column",
      },
    },
    {
      key: "policyDetails",
      config: leadFields,
      defaultValues: {
        ...leadDefaults,
      },
      containerStyles: {
        gap: "16px",
        display: "flex",
        flexDirection: "column",
      },
    },
    insurerDetailsSection,
    {
      key: "netPremiumDetails",
      config: [
        {
          key: "insurerRemarks",
          name: "insurerRemarks",
          type: "textarea",
          label: "Insurer's remarks",
          gridColumn: 9,
          componentProps: {
            rows: 4,
            fullWidth: true,
            multiline: true,
          },
          activityOrder: 30,
        },
      ],
    },
    {
      key: "quoteDocuments",
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
          activityOrder: 33,
        },
      ],
      defaultValues: [
        {
          documentId: null,
          documentTypeLid: null,
        },
      ],
    },
    {
      key: "covers",
      title: "Basic covers",
      config: [],
      containerStyles: {
        gap: "24px",
        border: "1px solid #eaeaea",
        display: "flex",
        padding: "16px",
        borderRadius: "8px",
        flexDirection: "column",
        backgroundColor: "#FAFAFA",
      },
      isCoversRequired: true,
    },
    {
      key: "otherCommentsFromInsurer",
      config: [
        {
          key: "remarks",
          name: "remarks",
          type: "textarea",
          label: "Other comments from insurer",
          gridColumn: 9,
          componentProps: {
            rows: 3,
            fullWidth: true,
            multiline: true,
            placeholder: "",
          },
          activityOrder: 34,
        },
      ],
      defaultValues: {
        remarks: "",
      },
    },
    {
      key: "variationIssuesFromQCR",
      title: "Variation/issues from QCR",
      config: [
        {
          key: "issue",
          name: "issue",
          type: "textarea",
          label: "Deviations",
          gridColumn: 9,
          componentProps: {
            rows: 3,
            fullWidth: true,
            multiline: true,
            placeholder: "",
          },
          activityOrder: 35,
        },
      ],
      isMultiple: true,
      defaultValues: [
        {
          issue: "",
        },
      ],
    },
    {
      key: "insurerServiceLevelAgreement",
      title: "Insurer service level agreement",
      config: [
        {
          key: "serviceTypeId",
          name: "serviceTypeId",
          type: "select",
          label: "Type of service",
          gridColumn: 5,
          apiDependencies: {
            endPoint: '#endPoints.lookUpByName("SERVICE_NO_OF_DAYS")',
          },
          activityOrder: 36,
        },
        {
          key: "numberOfDays",
          name: "numberOfDays",
          type: "number",
          label: "Number of days",
          gridColumn: 5,
          componentProps: {
            type: "number",
            fullWidth: true,
          },
          activityOrder: 37,
        },
      ],
      isMultiple: true,
      defaultValues: [
        {
          numberOfDays: null,
          serviceTypeId: null,
        },
      ],
    },
    {
      key: "remarks",
      config: [
        {
          key: "remarks",
          name: "remarks",
          type: "textarea",
          label: "Remarks",
          gridColumn: 9,
          componentProps: {
            minRows: 3,
            fullWidth: true,
            multiline: true,
            placeholder: "",
          },
          activityOrder: 38,
        },
      ],
      defaultValues: {
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
          activityOrder: 39,
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
};

export const finalNegotiationConfigLanka = (
  formValues = {},
  dyamicvalues = {}
) => {
  const {
    leadFields: leadFieldsLanka,
    leadDefaults: leadDefaultsLanka,
    insurerDetailsSection: insurerDetailsSectionLanka,
  } = buildInsurerSectionConfigs({
    formValues,
    dynamicValues: dyamicvalues,
    showLeadFieldsOnlyForMultiple: true,
    leadSectionKey: "policyDetails",
    leadFieldKeys: { leadPays: "isLeadInsurerPayCommissionLid" },
    basePremiumPath: "selectFinalisedQuote.basicPremium",
    brokerageAmountPath: "selectFinalisedQuote.basicBrokerageAmount",
    runExternalValidatorsOnChange: true,
  });

  return [
    {
      key: "meetingDetails",
      title: "Meeting Details",
      config: [
        {
          key: "isFinalNegotiationTypeLid",
          name: "isFinalNegotiationTypeLid",
          type: "segmentedcontrol",
          label: "Did the meeting already happen",
          rules: {
            required: {
              value: true,
              message: "Please select Meeting type.",
            },
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          apiDependencies: {
            endPoint: "#endPoints.lookUpByName(`SELECT_MEETING`)",
            clearFieldsOnChange: ["selectMeeting"],
          },
          activityOrder: 1,
        },
        {
          key: "selectMeeting",
          name: "selectMeeting",
          type: "select",
          label: "Select Meeting",
          rules: {
            validate:
              '#validateRequiredIfEqual("isFinalNegotiationTypeLid", ${SELECT_MEETING_EXISTING_MEETING}, "Please select a meeting.")',
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
              '#(watch) => !!watch("isFinalNegotiationTypeLid") && watch("isFinalNegotiationTypeLid") === ${SELECT_MEETING_EXISTING_MEETING}',
            utilityFunction: "#meetingUtilityFunction",
          },
          activityOrder: 2,
        },
        {
          key: "meetingDate",
          name: "meetingDate",
          type: "date",
          label: "Meeting date",
          rules: {
            required: {
              value: true,
              message: "Please select the meeting date.",
            },
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
            minDate: "#dayjs()",
          },
          activityOrder: 3,
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
          activityOrder: 4,
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
            endPoint: "#endPoints.lookUpByName(`MEETING_TYPE`)",
          },
          activityOrder: 5,
        },
        {
          key: "locationTypeLid",
          name: "locationTypeLid",
          type: "select",
          label: "Location (Held At)",
          rules: {
            required: {
              value: true,
              message: "Please select the location.",
            },
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          apiDependencies: {
            endPoint: "#endPoints.lookUpByName(`MEETING_LOCATION`)",
          },
          activityOrder: 6,
        },
      ],
      defaultValues: {
        availableTo: null,
        meetingDate: "#dayjs().format(`YYYY-MM-DD`)",
        availableFrom: null,
        selectMeeting: null,
        meetingTypeLid: "#${MEETING_TYPE_FINAL_NEGOTIATION}",
        locationTypeLid: null,
        isFinalNegotiationTypeLid: "#${SELECT_MEETING_NEW_MEETING}",
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
          activityOrder: 7,
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
          activityOrder: 8,
        },
      ],
      defaultValues: [
        {
          companyId: null,
          companyContactPerson: [],
        },
      ],
      containerStyles: {
        gap: "16px",
        display: "flex",
        flexDirection: "column",
      },
    },
    {
      key: "insurerParticipants",
      title: "Insurer Participants",
      config: [
        {
          key: "insurerId",
          name: "insurerId",
          type: "selectFieldByApi",
          label: "Insurer Participants",
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          apiDependencies: {
            endPoint: "#endPoints.insurersList",
            utilityFunction: "#insurerListUtilityFunction",
            clearFieldsOnChange: ["insurerContactPerson"],
          },
          activityOrder: 9,
        },
        {
          key: "insurerContactPerson",
          name: "insurerContactPerson",
          type: "multiselect",
          label: "Insurer Contact Person",
          gridColumn: 5,
          apiDependencies: {
            endPoint: "#endPoints.insurerContactList",
            dependentField: "insurerId",
            utilityFunction: "#insurerContactPersonUtilityFunction",
          },
          activityOrder: 10,
        },
      ],
      containerStyles: {
        gap: "16px",
        display: "flex",
        flexDirection: "column",
      },
    },
    {
      key: "tpaParticipants",
      title: "TPA Participants",
      config: [
        {
          key: "tpaId",
          name: "tpaId",
          type: "selectFieldByApi",
          label: "TPA Participants",
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          apiDependencies: {
            endPoint: "#endPoints.tpasList",
            utilityFunction: "#tpaUtilityFunction",
            clearFieldsOnChange: ["tpaContactPerson"],
            customParams: { searchBy: "firstName" },
          },
          activityOrder: 11,
        },
        {
          key: "tpaContactPerson",
          name: "tpaContactPerson",
          type: "multiselect",
          label: "TPA Contact Person",
          gridColumn: 5,
          apiDependencies: {
            endPoint: "#endPoints.tpaContactList",
            dependentField: "tpaId",
            utilityFunction: "#tpaContactPersonUtilityFunction",
          },
          activityOrder: 12,
        },
      ],
      containerStyles: {
        gap: "16px",
        display: "flex",
        flexDirection: "column",
      },
    },
    {
      key: "meetingSummary",
      config: [
        {
          key: "mom",
          name: "mom",
          type: "textarea",
          label: "Agenda/MOM",
          rules: {
            required: {
              value: true,
              message: "Please enter the MOM.",
            },
          },
          gridColumn: 9,
          componentProps: {
            rows: 3,
            fullWidth: true,
            multiline: true,
          },
          activityOrder: 13,
        },
      ],
      defaultValues: {
        mom: "",
      },
    },
    {
      key: "selectFinalisedQuote",
      title: "Select Finalised Quote",
      renderActions: [
        {
          key: "addQuoteButton",
          variant: "button",
          text: "Add Quote",
          onClick: "handleAddQuoteClick",
          componentProps: {
            variantType: "secondary",
          },
        },
      ],
      config: [
        {
          key: "finalizedVersionId",
          name: "finalizedVersionId",
          type: "select",
          label: "Finalised version quote",
          rules: {
            required: {
              value: true,
              message: "Please select a finalised version quote.",
            },
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          apiDependencies: {
            endPoint: "#endPoints.brokingSlipVersions(opportunityId)",
            utilityFunction: "#versionUtilityFunction",
            clearFieldsOnChange: [
              "finalizedQuoteId",
              "insurerId",
              "quoteReceivedOn",
              "terrorism",
              "netPremium",
              "basicPremium",
              "brokeragePercentage",
              // "brokerageAmount",
              "insurerLocationId",
              "srccAmount",
              "netPremium",
              "adminCharges",
              "other",
              "cessAmount",
              "serviceTaxPercentage",
              "fee",
              "totalGrossPremiumIncTaxCharges",
              "basicPremiumPercentage",
              "srccPercentage",
              "terrorismBrokeragePercentage",
              "basicBrokerageAmount",
              "tcBrokerageAmount",
              // "brokerageAmount",
            ],
          },
          activityOrder: 14,
        },
        {
          key: "finalizedQuoteId",
          name: "finalizedQuoteId",
          type: "select",
          label: "Finalised quote",
          rules: {
            required: {
              value: true,
              message: "Please select a finalised quote.",
            },
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          invokeFunction: "handleFinalizedQuoteSelection",
          apiDependencies: {
            endPoint: "#endPoints.getAllQuotesByBrokingSlipId",
            dependentField: "finalizedVersionId",
            utilityFunction: "#quoteUtilityFunction",
            clearFieldsOnChange: [
              "insurerId",
              "quoteReceivedOn",
              "terrorism",
              "netPremium",
              "basicPremium",
              "brokeragePercentage",
              // "brokerageAmount",
              "insurerLocationId",
              "srccAmount",
              "netPremium",
              "adminCharges",
              "other",
              "cessAmount",
              "serviceTaxPercentage",
              "fee",
              "totalGrossPremiumIncTaxCharges",
              "basicPremiumPercentage",
              "srccPercentage",
              "terrorismBrokeragePercentage",
              "basicBrokerageAmount",
              "tcBrokerageAmount",
              // "brokerageAmount",
            ],
          },
          activityOrder: 15,
        },
        {
          key: "insurerId",
          name: "insurerId",
          type: "selectFieldByApi",
          label: "Select Insurer",
          rules: {
            required: {
              value: true,
              message: "Insurer type is required",
            },
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
            placeholder: "Select Insurer",
            disabled: true,
          },
          apiDependencies: {
            endPoint: "#endPoints.insurersList",
            utilityFunction: "#insurerListUtilityFunction",
            dependentField: "finalizedVersionId",
            clearFieldsOnChange: ["insurerLocationId"],
          },
          activityOrder: 16,
        },
        {
          key: "insurerLocationId",
          name: "insurerLocationId",
          label: "Select Insurer Location",
          type: "selectFieldByApi",
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
            placeholder: "Select Insurer Location",
            disabled: true,
          },
          rules: {
            required: { value: true, message: "Insurer location is required" },
          },
          apiDependencies: {
            endPoint: "#endPoints.insurerLocationsById",
            utilityFunction: "#getLocationOptionsByEntityName",
            dependentField: "insurerId",
          },
          activityOrder: 17,
        },
        {
          key: "quoteReceivedOn",
          name: "quoteReceivedOn",
          type: "date",
          label: "Quote received on",
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          activityOrder: 18,
        },
        {
          key: "isQuoteEdited",
          name: "isQuoteEdited",
          type: "segmentedcontrol",
          label: "Would you like to edit quote?",
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          apiDependencies: {
            endPoint: "#endPoints.lookUpByName(`TOGGLE_TYPE`)",
          },
          activityOrder: 19,
        },
        {
          key: "basicPremium",
          name: "basicPremium",
          label: "Basic premium",
          type: "number",
          isDecimal: true,
          formatNumber: true,
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
            type: "number",
          },
          rules: {
            pattern: {
              value: REGEX_PATTERNS.NUMERIC,
              message: "Basic premium amount must be a positive numeric value",
            },
            required: {
              value: true,
              message: "Basic premium amount is required",
            },
          },
          activityOrder: 20,
        },
        {
          key: "srccAmount",
          name: "srccAmount",
          label: "SRCC premium amount",
          isDecimal: true,
          type: "number",
          formatNumber: true,
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
            type: "number",
          },
          rules: {
            pattern: {
              value: REGEX_PATTERNS.NUMERIC,
              message: "SRCC premium amount must be a positive numeric value",
            },
            required: {
              value: true,
              message: "SRCC premium amount is required",
            },
          },
          activityOrder: 21,
        },
        {
          key: "terrorism",
          name: "terrorism",
          type: "number",
          isDecimal: true,
          label: "TC premium amount",
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          formatNumber: true,
          activityOrder: 22,
        },
        {
          key: "netPremium",
          name: "netPremium",
          type: "number",
          isDecimal: true,
          label: "Total net premium",
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            fullWidth: true,
          },
          disabled: true,
          activityOrder: 23,
        },
        {
          key: "adminCharges",
          name: "adminCharges",
          label: "Admin Charges",
          type: "number",
          isDecimal: true,
          formatNumber: true,
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
            type: "number",
          },
          rules: {
            pattern: {
              value: REGEX_PATTERNS.NUMERIC,
              message: "Admin Charges must be a positive numeric value",
            },
            required: {
              value: true,
              message: "Admin Charges is required",
            },
          },
          activityOrder: 24,
        },
        {
          key: "other",
          name: "other",
          label: "Stamp duty",
          type: "number",
          isDecimal: true,
          formatNumber: true,
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
            type: "number",
          },
          rules: {
            pattern: {
              value: REGEX_PATTERNS.NUMERIC,
              message: "Stamp duty must be a positive numeric value",
            },
            required: {
              value: true,
              message: "Stamp duty is required",
            },
          },
          activityOrder: 25,
        },
        {
          key: "cessAmount",
          name: "cessAmount",
          label: "cess",
          isDecimal: true,
          type: "number",
          formatNumber: true,
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
            type: "number",
          },
          rules: {
            pattern: {
              value: REGEX_PATTERNS.NUMERIC,
              message: "cess amount must be a positive numeric value",
            },
            required: {
              value: true,
              message: "cess amount is required",
            },
          },
          activityOrder: 26,
        },
        {
          key: "fee",
          name: "fee",
          label: "Policy Fee",
          type: "number",
          isDecimal: true,
          formatNumber: true,
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
            type: "number",
          },
          rules: {
            pattern: {
              value: REGEX_PATTERNS.NUMERIC,
              message: "Policy Fee must be a positive numeric value",
            },
            required: {
              value: true,
              message: "Policy Fee is required",
            },
          },
          activityOrder: 29,
        },
        {
          key: "serviceTaxPercentage",
          name: "serviceTaxPercentage",
          label: "VAT percentage",
          type: "number",
          isDecimal: true,
          gridColumn: 5,
          componentProps: withPercentageClamp({
            fullWidth: true,
            type: "number",
          }),
          rules: {
            min: {
              value: 0,
              message: "VAT percentage cannot be negative",
            },
            max: {
              value: 100,
              message: "VAT percentage cannot exceed 100",
            },
            required: {
              value: true,
              message: "VAT percentage is required",
            },
          },
          activityOrder: 27,
        },
        {
          key: "serviceTaxAmount",
          name: "serviceTaxAmount",
          label: "VAT",
          isDecimal: true,
          type: "number",
          formatNumber: true,
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
            type: "number",
          },
          // disabled: true,
          rules: {
            pattern: {
              value: REGEX_PATTERNS.NUMERIC,
              message: "VAT must be a positive numeric value",
            },
            required: {
              value: true,
              message: "VAT is required",
            },
          },
          activityOrder: 28,
        },
        {
          key: "totalGrossPremiumIncTaxCharges",
          name: "totalGrossPremiumIncTaxCharges",
          label: "Total gross premium including tax & other charges",
          type: "number",
          isDecimal: true,
          disabled: true,
          formatNumber: true,
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
            type: "number",
          },
          rules: {
            pattern: {
              value: REGEX_PATTERNS.NUMERIC,
              message:
                "Total gross premium including tax & other charges must be a positive numeric value",
            },
            required: {
              value: true,
              message:
                "Total gross premium including tax & other charges is required",
            },
          },
          activityOrder: 30,
        },
        {
          key: "basicPremiumPercentage",
          name: "basicPremiumPercentage",
          label: "Basic brokerage percentage",
          type: "number",
          isDecimal: true,
          gridColumn: 5,
          componentProps: withPercentageClamp({
            fullWidth: true,
            type: "number",
          }),
          rules: {
            min: {
              value: 0,
              message: "Basic brokerage percentage cannot be negative",
            },
            max: {
              value: 100,
              message: "Basic brokerage percentage cannot exceed 100",
            },
            required: {
              value: true,
              message: "Basic brokerage percentage is required",
            },
          },
          activityOrder: 31,
        },
        {
          key: "srccPercentage",
          name: "srccPercentage",
          label: "SRCC brokerage percentage",
          type: "number",
          isDecimal: true,
          gridColumn: 5,
          componentProps: withPercentageClamp({
            fullWidth: true,
            type: "number",
          }),
          rules: {
            min: {
              value: 0,
              message: "SRCC brokerage percentage cannot be negative",
            },
            max: {
              value: 100,
              message: "SRCC brokerage percentage cannot exceed 100",
            },
            required: {
              value: true,
              message: "SRCC brokerage percentage is required",
            },
          },
          activityOrder: 32,
        },
        {
          key: "terrorismBrokeragePercentage",
          name: "terrorismBrokeragePercentage",
          label: "TC brokerage percentage",
          type: "number",
          isDecimal: true,
          gridColumn: 5,
          componentProps: withPercentageClamp({
            fullWidth: true,
            type: "number",
          }),
          rules: {
            min: {
              value: 0,
              message: "TC brokerage percentage cannot be negative",
            },
            max: {
              value: 100,
              message: "TC brokerage percentage cannot exceed 100",
            },
            required: {
              value: true,
              message: "TC brokerage percentage is required",
            },
          },
          activityOrder: 33,
        },
        {
          key: "basicBrokerageAmount",
          name: "basicBrokerageAmount",
          type: "number",
          isDecimal: true,
          label: "Basic brokerage amount",
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          formatNumber: true,
          disabled: true,
          activityOrder: 34,
        },
        {
          key: "srccBrokerageAmount",
          name: "srccBrokerageAmount",
          type: "number",
          isDecimal: true,
          label: "SRCC brokerage amount",
          rules: {
            required: {
              value: true,
              message: "SRCC brokerage amount is required",
            },
          },
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            type: "number",
            fullWidth: true,
          },
          disabled: true,
          activityOrder: 35,
        },
        {
          key: "tcBrokerageAmount",
          name: "tcBrokerageAmount",
          type: "number",
          isDecimal: true,
          label: "TC brokerage amount",
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          formatNumber: true,
          disabled: true,
          activityOrder: 36,
        },
        {
          key: "brokerageAmount",
          name: "brokerageAmount",
          type: "number",
          isDecimal: true,
          label: "Total brokerage amount",
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          formatNumber: true,
          activityOrder: 37,
        },
      ],
      defaultValues: {
        isQuoteEdited: "#${TOGGLE_YES}",
      },
      containerStyles: {
        gap: "16px",
        border: "1px solid #eaeaea",
        display: "flex",
        padding: "16px",
        borderRadius: "8px",
        flexDirection: "column",
      },
    },
    {
      key: "policyDetails",
      title: "Policy Placement",
      config: leadFieldsLanka,
      defaultValues: {
        ...leadDefaultsLanka,
      },
      containerStyles: {
        gap: "16px",
        display: "flex",
        flexDirection: "column",
      },
    },
    insurerDetailsSectionLanka,
    {
      key: "netPremiumDetails",
      config: [
        {
          key: "insurerRemarks",
          name: "insurerRemarks",
          type: "textarea",
          label: "Insurer's remarks",
          gridColumn: 9,
          componentProps: {
            rows: 4,
            fullWidth: true,
            multiline: true,
          },
          activityOrder: 38,
        },
      ],
    },
    {
      key: "quoteDocuments",
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
          activityOrder: 39,
        },
      ],
      defaultValues: [
        {
          documentId: null,
          documentTypeLid: null,
        },
      ],
    },
    {
      key: "covers",
      title: "Basic covers",
      config: [],
      containerStyles: {
        gap: "24px",
        border: "1px solid #eaeaea",
        display: "flex",
        padding: "16px",
        borderRadius: "8px",
        flexDirection: "column",
        backgroundColor: "#FAFAFA",
      },
      isCoversRequired: true,
    },
    {
      key: "otherCommentsFromInsurer",
      config: [
        {
          key: "remarks",
          name: "remarks",
          type: "textarea",
          label: "Other comments from insurer",
          gridColumn: 9,
          componentProps: {
            rows: 3,
            fullWidth: true,
            multiline: true,
            placeholder: "",
          },
          activityOrder: 40,
        },
      ],
      defaultValues: {
        remarks: "",
      },
    },
    {
      key: "variationIssuesFromQCR",
      title: "Variation/issues from QCR",
      config: [
        {
          key: "issue",
          name: "issue",
          type: "textarea",
          label: "Deviations",
          gridColumn: 9,
          componentProps: {
            rows: 3,
            fullWidth: true,
            multiline: true,
            placeholder: "",
          },
          activityOrder: 41,
        },
      ],
      isMultiple: true,
      defaultValues: [
        {
          issue: "",
        },
      ],
    },
    {
      key: "insurerServiceLevelAgreement",
      title: "Insurer service level agreement",
      config: [
        {
          key: "serviceTypeId",
          name: "serviceTypeId",
          type: "select",
          label: "Type of service",
          gridColumn: 5,
          apiDependencies: {
            endPoint: '#endPoints.lookUpByName("SERVICE_NO_OF_DAYS")',
          },
          activityOrder: 42,
        },
        {
          key: "numberOfDays",
          name: "numberOfDays",
          type: "number",
          label: "Number of days",
          gridColumn: 5,
          componentProps: {
            type: "number",
            fullWidth: true,
          },
          activityOrder: 43,
        },
      ],
      isMultiple: true,
      defaultValues: [
        {
          numberOfDays: null,
          serviceTypeId: null,
        },
      ],
    },
    {
      key: "remarks",
      config: [
        {
          key: "remarks",
          name: "remarks",
          type: "textarea",
          label: "Remarks",
          gridColumn: 9,
          componentProps: {
            minRows: 3,
            fullWidth: true,
            multiline: true,
            placeholder: "",
          },
          activityOrder: 44,
        },
      ],
      defaultValues: {
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
          activityOrder: 45,
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
};
