export const policyDocketConfig = [
  {
    key: "placementSlipDetailsSection",
    // title: "Placement slip details",
    config: [
      {
        key: "issuanceDate",
        name: "issuanceDate",
        type: "date",
        label: "Policy issuance date",
        rules: {
          required: {
            value: true,
            message: "Policy issuance date is required",
          },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
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
    key: "serviceLevelAgreementSection",
    title: "Service level agreement",
    config: [
      {
        key: "heldCoverNote",
        name: "heldCoverNote",
        type: "number",
        label: "Held cover note (days)",
        gridColumn: 5,
        componentProps: {
          type: "number",
          fullWidth: true,
          inputProps: {
            max: 100,
            min: 1,
          },
        },
      },
      {
        key: "policyDocument",
        name: "policyDocument",
        type: "number",
        label: "Policy document (days)",
        gridColumn: 5,
        componentProps: {
          type: "number",
          fullWidth: true,
          inputProps: {
            max: 100,
            min: 1,
          },
        },
      },
      {
        key: "policyDocket",
        name: "policyDocket",
        type: "number",
        label: "Policy docket (days)",
        gridColumn: 5,
        componentProps: {
          type: "number",
          fullWidth: true,
          inputProps: {
            max: 100,
            min: 1,
          },
        },
      },
      {
        key: "endorsement",
        name: "endorsement",
        type: "number",
        label: "Endorsement (days)",
        gridColumn: 5,
        componentProps: {
          type: "number",
          fullWidth: true,
          inputProps: {
            max: 100,
            min: 1,
          },
        },
      },
      {
        key: "healthClaims",
        name: "healthClaims",
        type: "number",
        label: "Health claims (days)",
        gridColumn: 5,
        componentProps: {
          type: "number",
          fullWidth: true,
          inputProps: {
            max: 100,
            min: 1,
          },
        },
      },
      {
        key: "nonHealthClaims",
        name: "nonHealthClaims",
        type: "number",
        label: "Non health claims (Days)",
        gridColumn: 5,
        componentProps: {
          type: "number",
          fullWidth: true,
          inputProps: {
            max: 100,
            min: 1,
          },
        },
      },
      {
        key: "mir",
        name: "mir",
        type: "number",
        label: "MIR (days)",
        gridColumn: 5,
        componentProps: {
          type: "number",
          fullWidth: true,
          inputProps: {
            max: 100,
            min: 1,
          },
        },
      },
      {
        key: "monthlyMeeting",
        name: "monthlyMeeting",
        type: "number",
        label: "Monthly meeting (days)",
        gridColumn: 5,
        componentProps: {
          type: "number",
          fullWidth: true,
          inputProps: {
            max: 100,
            min: 1,
          },
        },
      },
      {
        key: "quarterlyMeeting",
        name: "quarterlyMeeting",
        type: "number",
        label: "Quarterly meeting (days)",
        gridColumn: 5,
        componentProps: {
          type: "number",
          fullWidth: true,
          inputProps: {
            max: 100,
            min: 1,
          },
        },
      },
      {
        key: "renewalNotice",
        name: "renewalNotice",
        type: "number",
        label: "Renewal notice (days)",
        gridColumn: 5,
        componentProps: {
          type: "number",
          fullWidth: true,
          inputProps: {
            max: 100,
            min: 1,
          },
        },
      },
      {
        key: "dataCollection",
        name: "dataCollection",
        type: "number",
        label: "Data collection (days)",
        gridColumn: 5,
        componentProps: {
          type: "number",
          fullWidth: true,
          inputProps: {
            max: 100,
            min: 1,
          },
        },
      },
      {
        key: "remarks",
        name: "remarks",
        type: "textarea",
        label: "Remarks",
        gridColumn: 9,
        componentProps: {
          rows: 4,
          fullWidth: true,
          multiline: true,
          placeholder: "Enter Text here...",
        },
      },
    ],
    defaultValues: [
      {
        mir: 0,
        remarks: "",
        endorsement: 0,
        healthClaims: 0,
        policyDocket: 0,
        heldCoverNote: 0,
        renewalNotice: 0,
        dataCollection: 0,
        monthlyMeeting: 0,
        policyDocument: 0,
        nonHealthClaims: 0,
        quarterlyMeeting: 0,
      },
    ],
    containerStyles: {
      gap: "16px",
      display: "flex",
      flexDirection: "column",
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
