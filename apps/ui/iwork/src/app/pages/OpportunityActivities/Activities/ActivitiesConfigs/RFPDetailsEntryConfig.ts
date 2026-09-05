import { limitPercentageDecimals } from "@ui/ui-lib/utils";

export const rfpDetailsConfig = [
  {
    key: "descriptionRequirements",
    config: [
      {
        key: "description",
        name: "description",
        type: "textarea",
        label: "Description",
        rules: {
          required: {
            value: true,
            message: "Description is required.",
          },
          validate:
            '#(value) => { return (value?.length <= 1000 || "Requirements should not exceed 1000 characters.")}',
        },
        gridColumn: 9,
        componentProps: {
          rows: 3,
          fullWidth: true,
          multiline: true,
        },
      },
      {
        key: "requirements",
        name: "requirements",
        type: "textarea",
        label: "Requirements",
        rules: {
          required: {
            value: true,
            message: "Requirements are required.",
          },
          validate:
            '#(value) => { return (value.length <= 1000 || "Requirements should not exceed 1000 characters.")}',
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
      description: "",
      requirements: "",
    },
  },
  {
    key: "preferredInsurers",
    title: "Preferred Insurers",
    config: [
      {
        key: "insurerId",
        name: "insurerId",
        type: "selectFieldByApi",
        label: "Insurer name",
        rules: {
          required: "Insurer name is required.",
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
          preventDuplicateSelections: true,
          excludeSelectedValuesFrom: ["excludedInsurers.insurerId"],
        },
        apiDependencies: {
          endPoint: "#endPoints.insurersList",
          utilityFunction: "#insurerListUtilityFunction",
          clearFieldsOnChange: [
            "insurerLocationId",
            "insurerBranchId",
            "insurerContactId",
          ],
          customParams: { searchBy: "firstName" },
        },
      },
      {
        key: "insurerLocationId",
        name: "insurerLocationId",
        type: "select",
        label: "Location",
        rules: {
          required: {
            value: true,
            message: "Location is required.",
          },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
        apiDependencies: {
          endPoint: "#endPoints.insurerById",
          dependentField: "insurerId",
          utilityFunction: "#insurerLocationListUtilityFunction",
          clearFieldsOnChange: ["insurerBranchId", "insurerContactId"],
        },
      },
      {
        key: "insurerBranchId",
        name: "insurerBranchId",
        type: "select",
        label: "Branch (BranchType-Code-Address1)",
        rules: {
          required: {
            value: true,
            message: "Branch is required.",
          },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
        apiDependencies: {
          endPoint: "#endPoints.insurerById",
          dependentField: "insurerId",
          utilityFunction: "#insurerLocationAddressUtilityFunction",
          utilityDependent: "insurerLocationId",
          clearFieldsOnChange: ["insurerContactId"],
        },
      },
      {
        key: "insurerContactId",
        name: "insurerContactId",
        type: "select",
        label: "Contact",
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
        apiDependencies: {
          endPoint: "#endPoints.insurerById",
          dependentField: "insurerId",
          utilityFunction: "#insurerBranchContactUtilityFunction",
          utilityDependent: "insurerBranchId",
        },
      },
    ],
    isMultiple: true,
    defaultValues: [
      {
        insurerBranchId: null,
        insurerContactId: null,
        insurerId: null,
        insurerLocationId: null,
      },
    ],
  },
  {
    key: "preferredTPA",
    title: "Preferred TPAs",
    config: [
      {
        key: "tpaId",
        name: "tpaId",
        type: "selectFieldByApi",
        label: "TPA name",
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
          preventDuplicateSelections: true,
          excludeSelectedValuesFrom: ["excludedTPA.tpaId"],
        },
        apiDependencies: {
          endPoint: "#endPoints.tpasList",
          utilityFunction: "#tpaUtilityFunction",
          clearFieldsOnChange: ["locationId", "branchId", "contactId"],
          customParams: { searchBy: "firstName" },
        },
      },
      {
        key: "locationId",
        name: "locationId",
        type: "select",
        label: "Location",
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
        apiDependencies: {
          endPoint: "#endPoints.tpaByID",
          dependentField: "tpaId",
          utilityFunction: "#tpaLocationListUtilityFunction",
          clearFieldsOnChange: ["branchId", "contactId"],
        },
      },
      {
        key: "branchId",
        name: "branchId",
        type: "select",
        label: "Branch",
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
        apiDependencies: {
          endPoint: "#endPoints.tpaByID",
          dependentField: "tpaId",
          utilityFunction: "#tpaLocationAddressUtilityFunction",
          utilityDependent: "locationId",
          clearFieldsOnChange: ["contactId"],
        },
      },
      {
        key: "contactId",
        name: "contactId",
        type: "select",
        label: "Contact",
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
        apiDependencies: {
          endPoint: "#endPoints.tpaContactList",
          dependentField: "tpaId",
          utilityFunction: "#tpaContactPersonUtilityFunction",
        },
      },
    ],
    isMultiple: true,
    defaultValues: [
      {
        tpaId: null,
        branchId: null,
        contactId: null,
        locationId: null,
      },
    ],
  },
  {
    key: "dynamicQuote",
    title: "Deal Dynamics for quote procurement",
    config: [
      {
        key: "multipleBrokerInvolved",
        name: "multipleBrokerInvolved",
        type: "segmentedcontrol",
        label: "Multiple broker involved",
        rules: {
          required: "This field is required.",
        },
        gridColumn: 5,
        apiDependencies: {
          endPoint: '#endPoints.lookUpByName("TOGGLE_TYPE")',
        },
      },
      {
        key: "isMarketAllocationDone",
        name: "isMarketAllocationDone",
        type: "segmentedcontrol",
        label: "Is market allocation done",
        rules: {
          validate:
            '#(value, formValues) => {if (formValues.multipleBrokerInvolved === ${TOGGLE_YES}) {if (!value) { return "Please select market allocation."}}return true',
        },
        gridColumn: 5,
        apiDependencies: {
          endPoint: '#endPoints.lookUpByName("TOGGLE_TYPE")',
          showCondition:
            '#(watch) => !!watch("multipleBrokerInvolved") && watch("multipleBrokerInvolved") !== ${TOGGLE_NO}',
        },
      },
    ],
    defaultValues: {
      isMarketAllocationDone: null,
      multipleBrokerInvolved: "#${TOGGLE_NO}",
    },
    containerStyles: {
      gap: "16px",
      display: "flex",
      flexDirection: "column",
    },
  },
  {
    key: "clientContactDetails",
    title: "Client Contact Details",
    config: [
      {
        key: "contactId",
        name: "contactId",
        type: "selectFieldByApi",
        label: "Select Contact",
        rules: {
          required: "Select Contact is required.",
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
        apiDependencies: {
          endPoint: "#endPoints.companyContacts(companyId)",
          utilityFunction: "#companyContactsUtilityFunction",
          customParams: { status: "ACTIVE" },
        },
      },
      {
        key: "decisionInfluencers",
        name: "decisionInfluencers",
        type: "multiselect",
        label: "Who influences the ultimate decision",
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
        apiDependencies: {
          endPoint: '#endPoints.lookUpByName("CONTACT_TAG")',
        },
      },
      {
        key: "expectedPremium",
        name: "expectedPremium",
        type: "number",
        label: "Expected premium of client",
        rules: {
          required: "Expected premium is required.",
        },
        gridColumn: 5,
        formatNumber: true,
        isDecimal: true,
        componentProps: {
          fullWidth: true,
          placeholder: "Enter premium amount",
        },
      },
    ],
    defaultValues: {
      contactId: null,
      expectedPremium: null,
      decisionInfluencers: [],
    },
    containerStyles: {
      gap: "16px",
      display: "flex",
      flexDirection: "column",
    },
  },
  {
    key: "excludedTPA",
    title: "Excluded TPAs",
    config: [
      {
        key: "tpaId",
        name: "tpaId",
        type: "selectFieldByApi",
        label: "TPA name",
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
          preventDuplicateSelections: true,
          excludeSelectedValuesFrom: ["preferredTPA.tpaId"],
        },
        apiDependencies: {
          endPoint: "#endPoints.tpasList",
          utilityFunction: "#tpaUtilityFunction",
          clearFieldsOnChange: ["locationId", "branchId", "contactId"],
          customParams: { searchBy: "firstName" },
        },
      },
      {
        key: "locationId",
        name: "locationId",
        type: "select",
        label: "Location",
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
        apiDependencies: {
          endPoint: "#endPoints.tpaByID",
          dependentField: "tpaId",
          utilityFunction: "#tpaLocationListUtilityFunction",
          clearFieldsOnChange: ["branchId", "contactId"],
        },
      },
      {
        key: "branchId",
        name: "branchId",
        type: "select",
        label: "Branch",
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
        apiDependencies: {
          endPoint: "#endPoints.tpaByID",
          dependentField: "tpaId",
          utilityFunction: "#tpaLocationAddressUtilityFunction",
          utilityDependent: "locationId",
          clearFieldsOnChange: ["contactId"],
        },
      },
      {
        key: "contactId",
        name: "contactId",
        type: "select",
        label: "Contact",
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
        apiDependencies: {
          endPoint: "#endPoints.tpaContactList",
          dependentField: "tpaId",
          utilityFunction: "#tpaContactPersonUtilityFunction",
        },
      },
    ],
    isMultiple: true,
    defaultValues: [
      {
        tpaId: null,
        branchId: null,
        contactId: null,
        locationId: null,
      },
    ],
  },
  {
    key: "excludedInsurers",
    title: "Excluded Insurers",
    config: [
      {
        key: "insurerId",
        name: "insurerId",
        type: "selectFieldByApi",
        label: "Insurer name",
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
          preventDuplicateSelections: true,
          excludeSelectedValuesFrom: ["preferredInsurers.insurerId"],
        },
        apiDependencies: {
          endPoint: "#endPoints.insurersList",
          utilityFunction: "#insurerListUtilityFunction",
          clearFieldsOnChange: [
            "insurerLocationId",
            "insurerBranchId",
            "insurerContactId",
          ],
          customParams: { searchBy: "firstName" },
        },
      },
      {
        key: "insurerLocationId",
        name: "insurerLocationId",
        type: "select",
        label: "Location",
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
        apiDependencies: {
          endPoint: "#endPoints.insurerById",
          dependentField: "insurerId",
          utilityFunction: "#insurerLocationListUtilityFunction",
          clearFieldsOnChange: ["insurerBranchId", "insurerContactId"],
        },
      },
      {
        key: "insurerBranchId",
        name: "insurerBranchId",
        type: "select",
        label: "Branch (BranchType-Code-Address1)",
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
        apiDependencies: {
          endPoint: "#endPoints.insurerById",
          dependentField: "insurerId",
          utilityFunction: "#insurerLocationAddressUtilityFunction",
          utilityDependent: "insurerLocationId",
          clearFieldsOnChange: ["insurerContactId"],
        },
      },
      {
        key: "insurerContactId",
        name: "insurerContactId",
        type: "select",
        label: "Contact",
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
        apiDependencies: {
          endPoint: "#endPoints.insurerById",
          dependentField: "insurerId",
          utilityFunction: "#insurerBranchContactUtilityFunction",
          utilityDependent: "insurerBranchId",
        },
      },
    ],
    isMultiple: true,
    defaultValues: [
      {
        insurerBranchId: null,
        insurerContactId: null,
        insurerId: null,
        insurerLocationId: null,
      },
    ],
  },
  {
    key: "clientConsiderations",
    config: [
      {
        key: "clientConsiderations",
        name: "clientConsiderations",
        type: "textarea",
        label: "Clients other expectations on coverage/service deliverables",
        rules: {
          required: {
            value: true,
            message: "Client considerations are required.",
          },
          validate:
            '#(value) => { return (value?.length <= 1000 || "Client considerations should not exceed 1000 characters.")}',
        },
        gridColumn: 9,
        componentProps: {
          rows: 3,
          fullWidth: true,
          multiline: true,
        },
      },
      {
        key: "threatsFromExistingInsurer",
        name: "threatsFromExistingInsurer",
        type: "textarea",
        label: "Threats from existing insurer",
        rules: {
          required: {
            value: true,
            message: "Threats from existing insurer is required.",
          },
          validate:
            '#(value) => { return (value.length <= 1000 || "Threats from existing insurer should not exceed 1000 characters.")}',
        },
        gridColumn: 9,
        componentProps: {
          rows: 3,
          fullWidth: true,
          multiline: true,
        },
      },
      {
        key: "threatsFromExistingBroker",
        name: "threatsFromExistingBroker",
        type: "textarea",
        label: "Threats from existing broker/ other brokers in the deal",
        rules: {
          required: {
            value: true,
            message: "Threats from existing broker is required.",
          },
          validate:
            '#(value) => { return (value.length <= 1000 || "Threats from existing broker should not exceed 1000 characters.")}',
        },
        gridColumn: 9,
        componentProps: {
          rows: 3,
          fullWidth: true,
          multiline: true,
        },
      },
      {
        key: "extraneousFactors",
        name: "extraneousFactors",
        type: "textarea",
        label:
          "Any extraneous factors influencing/affecting/likely to affect decision by client",
        rules: {
          required: {
            value: true,
            message: "Extraneous factors are required.",
          },
          validate:
            '#(value) => { return (value.length <= 1000 || "Threats from existing broker should not exceed 1000 characters.")}',
        },
        gridColumn: 9,
        componentProps: {
          rows: 3,
          fullWidth: true,
          multiline: true,
        },
      },
      {
        key: "planForClosingDetail",
        name: "planForClosingDetail",
        type: "textarea",
        label: "Our strategy/Plan for closing the deal",
        rules: {
          required: {
            value: true,
            message: "Plan for closing detail is required.",
          },
          validate:
            '#(value) => { return (value.length <= 1000 || "Plan for closing detail should not exceed 1000 characters.")}',
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
      clientConsiderations: null,
      threatsFromExistingInsurer: null,
      threatsFromExistingBroker: null,
      extraneousFactors: null,
      planForClosingDetail: null,
    },
  },
  {
    key: "targetQcrDate",
    config: [
      {
        key: "targetQcrDate",
        name: "targetQcrDate",
        type: "date",
        label: "Target QCR date",
        rules: {
          required: {
            value: true,
            message: "Target QCR date is required.",
          },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
      },
    ],
    defaultValues: {
      targetQcrDate: null,
    },
  },
  {
    key: "creditSharing",
    title: "Credit Sharing",
    config: [
      {
        key: "executiveId",
        name: "executiveId",
        type: "selectFieldByApi",
        label: "Add Executives",
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
        apiDependencies: {
          endPoint: "#endPoints.usersListInEmployee",
          utilityFunction: "#usersListUtilityFunction",
          customParams: { searchBy: "firstName" },
        },
        rules: {
          validate: (value, formValues) => {
            const matchedRow = formValues?.retArray?.find(
              (row) => row.executiveId === value
            );
            if (
              matchedRow?.percentage &&
              (value === undefined || value === null || value === "")
            ) {
              return "Executive id is required.";
            }
            return true;
          },
        },
      },
      {
        key: "percentage",
        name: "percentage",
        type: "number",
        label: "Credit sharing percentage",
        isDecimal: true,
        gridColumn: 5,
        componentProps: {
          type: "number",
          fullWidth: true,
          inputProps: {
            max: 100,
            min: 0,
            onInput: limitPercentageDecimals,
          },
        },
        rules: {
          validate: (value, formValues) => {
            const matchedRow = formValues?.retArray?.find(
              (row) => row.percentage === value
            );
            if (
              matchedRow?.executiveId &&
              (value === undefined || value === null || value === "")
            ) {
              return "Credit sharing percentage is required.";
            }
            return true;
          },
        },
      },
    ],
    isMultiple: true,
    defaultValues: [
      {
        percentage: null,
        executiveId: null,
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
