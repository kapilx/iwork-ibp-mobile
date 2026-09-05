export const premiumCalculationConfig = [
  {
    key: "premiumCalculationDetails",
    title: "Asset Details",
    config: [],
    containerStyles: {
      gap: "16px",
      display: "flex",
      flexDirection: "column",
    },
    isCoversRequired: true,
  },
  {
    key: "remarksSection",
    config: [
      {
        key: "remarks",
        name: "remarks",
        type: "textarea",
        label: "Remarks",
        gridColumn: 9,
        componentProps: {
          rows: 3,
          fullWidth: true,
          multiline: true,
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
