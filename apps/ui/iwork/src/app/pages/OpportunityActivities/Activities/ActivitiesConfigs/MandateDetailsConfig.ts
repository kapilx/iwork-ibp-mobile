import { validateDateRange } from "@ui/ui-lib/utils/masterUserDataUtility";

const isValueMissing = (value: unknown): boolean =>
  value === null || value === undefined || value === "";

export const mandateDetailsConfig = (formValues, dyamicvalues) => {
  const isBrokeragePercentage =
    formValues?.mandateDetailsFromFields?.compensationTypeLid ===
    dyamicvalues?.COMPENSATION_BROKERAGE_TYPE;
  return [
    {
      key: "mandateDetailsFromFields",
      config: [
        {
          key: "mandateTypeLid",
          name: "mandateTypeLid",
          type: "segmentedcontrol",
          label: "Mandate type",
          rules: {
            required: "Please select a mandate type.",
          },
          gridColumn: 5,
          apiDependencies: {
            endPoint: '#endPoints.lookUpByName("MANDATE_TYPE")',
          },
        },
        {
          key: "mandateDetailsContacts",
          name: "mandateDetailsContacts",
          type: "multiSelectFieldByApi",
          label: "Signed by",
          rules: {
            required: "Please select a contact.",
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
            placeholder: "Select...",
          },
          apiDependencies: {
            endPoint: "#endPoints.companyContacts(companyId)",
            utilityFunction: "#companyContactsUtilityFunction",
            customParams: { status: "ACTIVE" },
          },
        },
        {
          key: "mandateDetails",
          name: "mandateDetails",
          type: "daterange",
          label: "Mandate details",
          toName: "validTo",
          toLabel: "Valid to",
          fromName: "validFrom",
          fromLabel: "Valid from",
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          rules: {
            required: {
              value: true,
              message: "Valid from and to dates are required.",
            },
            validate: validateDateRange(
              "validFrom",
              "validTo",
              "Valid from",
              "Valid to"
            ),
          },
        },
        {
          key: "compensationTypeLid",
          name: "compensationTypeLid",
          type: "segmentedcontrol",
          label: "Compensation type",
          rules: {
            required: "End time is required.",
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          apiDependencies: {
            endPoint: '#endPoints.lookUpByName("COMPENSATION_TYPE")',
            clearFieldsOnChange: ["compensationPayable"],
          },
        },
        {
          key: "compensationPayable",
          name: "compensationPayable",
          type: "number",
          label: "Compensation payable*",
          rules: {
            validate: (value) => {
              if (isBrokeragePercentage && isValueMissing(value)) {
                return "Brokerage percentage is required";
              }
              if (isBrokeragePercentage && (value < 0 || value > 100)) {
                return "Brokerage percentage must be between 0 and 100";
              }
              if (!isBrokeragePercentage && isValueMissing(value)) {
                return "Compensation payable is required";
              }
              return true;
            },
          },

          isDecimal:true,
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            type: "number",
            fullWidth: true,
          },
        },
        {
          key: "issuedOn",
          name: "issuedOn",
          type: "date",
          label: "Issued on ",
          rules: {
            required: "Issued date is required.",
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
        },
        {
          key: "remarks",
          name: "remarks",
          type: "textarea",
          label: "Remarks",
          gridColumn: 9.1,
          componentProps: {
            rows: 3,
            fullWidth: true,
            multiline: true,
          },
        },
      ],
      defaultValues: {
        remarks: "",
        compensationPayable: 0,
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
};
