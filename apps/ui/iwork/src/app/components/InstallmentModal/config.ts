// eslint-disable-next-line @nx/enforce-module-boundaries
import { endPoints, FormFieldConfig, requiredErrorMessage } from "@ui/ui-lib";

export const installmentFormConfig = (
  isEdit = false,
  editData: any = null,
): FormFieldConfig[] => {
  // Prepare documents for file upload field
  let documents: any[] = [];
  if (editData?.sourceFile) {
    documents = [
      {
        documentId: editData.sourceFile.id,
        fileName: editData.sourceFile.fileName,
        fileSize: editData.sourceFile.fileSize || 0,
        downloadable: true,
        documentName: editData.sourceFile.fileName,
        fileUpload: {
          id: editData.sourceFile.id,
          fileName: editData.sourceFile.fileName,
          fileSize: editData.sourceFile.fileSize || 0,
        },
      },
    ];
  }

  return [
    //   {
    //     key: "installmentNo",
    //     name: "installmentNo",
    //     type: "number",
    //     label: "Installment Number",
    //     gridColumn: 3.5,
    //     rules: {
    //       required: { value: true, message: requiredErrorMessage("Installment number") },
    //     },
    //     componentProps: {
    //       fullWidth: true,
    //       placeholder: "Sequence number",
    //     },
    //   },
    {
      key: "insurerEndorsementNumber",
      name: "insurerEndorsementNumber",
      type: "text",
      label: "Insurer Endorsement Number",
      gridColumn: 3.5,
      rules: {
        required: {
          value: true,
          message: requiredErrorMessage("Insurer endorsement number"),
        },
      },
      componentProps: {
        fullWidth: true,
        placeholder: "e.g., END-2026-001",
      },
    },
    {
      key: "installmentDate",
      name: "installmentDate",
      type: "date",
      label: "Installment Date",
      gridColumn: 3.5,
      rules: {
        required: {
          value: true,
          message: requiredErrorMessage("Installment date"),
        },
      },
      componentProps: {
        fullWidth: true,
        disabled: isEdit, // Disabled in edit mode, enabled in add mode
      },
    },
    {
      key: "totalInstallmentAmount",
      name: "totalInstallmentAmount",
      type: "number",
      label: "Total Installment Amount (Net Premium + Other Amount)",
      gridColumn: 3.5,
      isDecimal: true,
      rules: {
        required: {
          value: true,
          message: requiredErrorMessage("Total installment amount"),
        },
      },
      componentProps: {
        fullWidth: true,
        disabled: true,
      },
      formatNumber: true,
    },
    {
      key: "installmentPercentage",
      name: "installmentPercentage",
      type: "number",
      label: "Installment Premium %",
      gridColumn: 3.5,
      isDecimal: true,
      rules: {
        required: {
          value: true,
          message: requiredErrorMessage("Installment premium percentage"),
        },
      },
      componentProps: {
        fullWidth: true,
        disabled: isEdit,
        placeholder: "Auto-calculated from total amount",
      },
    },
    {
      key: "installmentNetAmount",
      name: "installmentNetAmount",
      type: "number",
      label: "Installment Premium Amount",
      gridColumn: 3.5,
      isDecimal: true,
      rules: {
        required: {
          value: true,
          message: requiredErrorMessage("Premium amount"),
        },
      },
      componentProps: {
        fullWidth: true,
        disabled: isEdit,
        placeholder: "Auto-calculated from total amount",
      },
      formatNumber: true,
    },
    {
      key: "premiumCollectionDate",
      name: "premiumCollectionDate",
      type: "date",
      label: "Installment Collection Date",
      gridColumn: 3.5,
      rules: {
        required: {
          value: true,
          message: requiredErrorMessage("Installment collection date"),
        },
      },
      componentProps: {
        fullWidth: true,
      },
    },
    {
      key: "premiumCollectedAmount",
      name: "premiumCollectedAmount",
      type: "number",
      label: "Installment Collected Amount",
      gridColumn: 3.5,
      rules: {
        required: {
          value: true,
          message: requiredErrorMessage("Installment collected amount"),
        },
      },
      componentProps: {
        fullWidth: true,
        placeholder: "Enter installment collected amount",
      },
      formatNumber: true,
      isDecimal: true,
    },
    {
      key: "taxPercentage",
      name: "taxPercentage",
      type: "number",
      label: "Tax % (On Collected Amount)",
      gridColumn: 3.5,
      isDecimal: true,
      rules: {
        required: {
          value: true,
          message: requiredErrorMessage("Tax percentage"),
        },
      },
      componentProps: {
        fullWidth: true,
        placeholder: "e.g., 18",
      },
    },
    {
      key: "taxAmount",
      name: "taxAmount",
      type: "number",
      label: "Tax Amount",
      gridColumn: 3.5,
      rules: {
        required: { value: true, message: requiredErrorMessage("Tax amount") },
        min: { value: 0, message: "Tax amount cannot be negative" },
      },
      componentProps: {
        fullWidth: true,
        placeholder: "Enter tax amount",
      },
      formatNumber: true,
      isDecimal: true,
    },
    {
      key: "collectedGrossAmount",
      name: "collectedGrossAmount",
      type: "number",
      label: "Collected Gross Amount (Premium + Tax)",
      gridColumn: 3.5,
      rules: {
        required: {
          value: true,
          message: requiredErrorMessage("Collected gross amount"),
        },
      },
      componentProps: {
        fullWidth: true,
        disabled: true,
      },
      formatNumber: true,
      isDecimal: true,
    },
    {
      key: "transactionMode",
      name: "transactionMode",
      label: "Transaction mode",
      gridColumn: 3.5,
      type: "select",
      componentProps: {
        fullWidth: true,
        disablePortal: true,
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
      key: "invoiceNo",
      name: "invoiceNo",
      type: "text",
      label: "Invoice No",
      gridColumn: 3.5,
      rules: {
        required: {
          value: true,
          message: requiredErrorMessage("Invoice number"),
        },
      },
      componentProps: {
        fullWidth: true,
        placeholder: "Enter invoice number",
      },
    },
    {
      key: "transactionChequeNumber",
      name: "transactionChequeNumber",
      type: "text",
      label: "Transaction/Cheque Number",
      gridColumn: 3.5,
      rules: {
        required: {
          value: true,
          message: requiredErrorMessage("Transaction/Cheque number"),
        },
      },
      componentProps: {
        fullWidth: true,
        placeholder: "Enter transaction or cheque number",
      },
    },
    {
      key: "bankName",
      name: "bankName",
      type: "text",
      label: "Bank Name",
      gridColumn: 3.5,
      componentProps: {
        fullWidth: true,
        placeholder: "Enter bank name",
      },
    },
    {
      key: "status",
      name: "status",
      type: "select",
      label: "Payment Status",
      gridColumn: 3.5,
      rules: {
        required: {
          value: true,
          message: requiredErrorMessage("Payment status"),
        },
      },
      apiDependencies: {
        endPoint: endPoints.lookUpByName("INSTALMENT_STATUS"),
      },
      componentProps: {
        fullWidth: true,
        placeholder: "Select payment status",
        disablePortal: true,
      },
    },
    {
      key: "attachment",
      name: "attachment",
      type: "documentupload",
      hideDropdown: true,
      label: "File Upload",
      gridColumn: 12,
      componentProps: {
        fullWidth: true,
        accept: ".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx",
        placeholder: "Upload any relevant document",
        documents: documents, // Include existing files for edit mode
      },
    },
  ];
};
