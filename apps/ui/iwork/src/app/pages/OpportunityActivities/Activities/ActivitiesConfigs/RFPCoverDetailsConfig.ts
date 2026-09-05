export const rfpDetailCoversConfig = [
  {
    key: "coversConfig",
    title: "Basic Covers",
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
          placeholder: "Remarks...",
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
