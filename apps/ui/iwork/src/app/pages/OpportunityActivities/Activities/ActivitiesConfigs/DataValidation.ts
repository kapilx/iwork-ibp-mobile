export const dataValidationConfig = [
  {
    key: "remarks",
    config: [
      {
        key: "description",
        name: "description",
        type: "textarea",
        label: "Remarks",
        gridColumn: 9,
        componentProps: {
          rows: 4,
          fullWidth: true,
          multiline: true,
          placeholder:
            "Mention any specifics to be considered for this opportunity",
        },
      },
    ],
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
