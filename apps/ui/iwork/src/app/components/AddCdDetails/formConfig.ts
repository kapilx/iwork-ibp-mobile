import { endPoints } from "@ui/ui-lib/constants/endPoints";
import { FormFieldConfig } from "@ui/ui-lib/commonComponents/FormComponent/types";
import { requiredErrorMessage } from "@ui/ui-lib/constants/errors";

type AddCDConfigArgs = {
  requireChequeFields: boolean;
  rtgsReferenceTypeId: number | null;
};

export const addCDDetailsConfig = ({
  requireChequeFields,
  rtgsReferenceTypeId,
}: AddCDConfigArgs): FormFieldConfig[] => [
  {
    key: "transactionType",
    name: "transactionType",
    label: "Transaction type",
    gridColumn: 4.9,
    type: "select",
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Transaction type"),
      },
    },
    apiDependencies: {
      endPoint: endPoints.lookUpByName("BALANCE_TRANSACTION"),
    },
    componentProps: {
      fullWidth: true,
    },
    disabled: true,
  },
  {
    key: "transactionAmount",
    name: "transactionAmount",
    label: "Transaction amount",
    gridColumn: 4.9,
    type: "number",
    formatNumber: true,
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Transaction amount"),
      },
    },
    componentProps: {
      fullWidth: true,
    },
  },
   {
    key: "referenceType",
    name: "referenceType",
    label: "Transaction mode",
    gridColumn: 4.9,
    type: "select",
    componentProps: {
      fullWidth: true,
    },
    apiDependencies: {
      endPoint: endPoints.lookUpByName("TRANSACTION_TYPE"),
    },
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Transaction mode"),
      },
    },
  },
  {
    key: "chequeNumber",
    name: "chequeNumber",
    label: "Transaction/Cheque number",
    gridColumn: 4.9,
    type: "text",
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Transaction number"),
      },
    },

    componentProps: {
      fullWidth: true,
    },
  },
  {
    key: "ifscCode",
    name: "ifscCode",
    label: "IFSC code",
    gridColumn: 4.9,
    type: "text",
    showField: (watch) =>
      !!rtgsReferenceTypeId &&
      watch("referenceType") === rtgsReferenceTypeId,
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("IFSC code"),
      },
    },
    componentProps: {
      fullWidth: true,
    },
  },
  {
    key: "bankName",
    name: "bankName",
    label: "Bank name",
    gridColumn: 4.9,
    type: "text",
    componentProps: {
      fullWidth: true,
    },
  },
  // {
  //   key: "chequeNumber",
  //   name: "chequeNumber",
  //   label: "Cheque number",
  //   gridColumn: 4.9,
  //   type: "text",
  //   rules: requireChequeFields
  //     ? {
  //         required: {
  //           value: true,
  //           message: requiredErrorMessage("Cheque number"),
  //         },
  //       }
  //     : undefined,
  //   componentProps: { fullWidth: true },
  // },
  {
    key: "chequeDate",
    name: "chequeDate",
    label: "Transaction date",
    gridColumn: 4.9,
    type: "date",
    rules: requireChequeFields
      ? {
          required: {
            value: true,
            message: requiredErrorMessage("Transaction date"),
          },
        }
      : undefined,
    componentProps: { fullWidth: true },
  },

  {
    key: "remarks",
    name: "remarks",
    label: "Remarks",
    gridColumn: 9,
    type: "textarea",
    componentProps: {
      fullWidth: true,
      rows: 3,
      multiline: true,
    },
  },
];

export const addCDDetailsDefaultValues = (creditId: number) => ({
  transactionType: creditId,
  transactionAmount: null,
  transactionReferenceId: "",
  referenceType: null,
  bankName: "",
  // ifscCode: "",
  chequeNumber: "",
  chequeDate: null,
  remarks: "",
});

export const addCDBalanceBreadcrumbsData = (
  from?: string,
  policyId?: string | number
) => {
  if (from === "CDManagement") {
    return [
      { label: "CD management", path: "/cd-management" },
      { label: "Add CD balance" },
    ];
  }
  if (policyId) {
    return [
      { label: "Manage policy", path: `/policies/${policyId}` },
      { label: "Add CD balance" },
    ];
  }
  return [
    { label: "CD management", path: "/cd-management" },
    { label: "Add CD balance" },
  ];
};
