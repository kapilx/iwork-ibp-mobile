export function makeBrokingSlipGenerationChangeSets({
  dynamicValues,
  organisationKey,
}: {
  dynamicValues: any;
  organisationKey: string;
}) {
  const organisationBasedConfig = {
    iirm_srilanka: {
      removedFields: [
        {
          section: "versionDetails",
          activityOrders: [3, 4], // brokeragePercentage
        },
      ],
      replacedFields: [
        {
          section: "versionDetails",
          fields: [
            {
              key: "policyFrom",
              name: "policyFrom",
              label: "Policy from",
              type: "date",
              syncFieldName: "renewalDate",
              gridColumn: 5,
              componentProps: {
                fullWidth: true,
                type: "date",
              },
              rules: {
                required: "Policy from date is required",
              },
              activityOrder: 2, // Changed from 3 to 2
            },
            {
              key: "policyTo",
              name: "policyTo",
              label: "Policy to",
              type: "date",
              gridColumn: 5,
              componentProps: {
                fullWidth: true,
                type: "date",
              },
              rules: {
                required: "Policy to date is required",
              },
              activityOrder: 3, // Changed from 4 to 3
            },
            {
              key: "renewalDate",
              name: "renewalDate",
              label: "Renewal Date",
              type: "date",
              gridColumn: 5,
              componentProps: {
                fullWidth: true,
                type: "date",
              },
              rules: {
                required: "Renewal date is required",
              },
              activityOrder: 4, // Changed from 5 to 4
            },
            {
              key: "quoteReceiptTimeline",
              name: "quoteReceiptTimeline",
              label: "Timeline for Quote Receipt",
              type: "date",
              gridColumn: 5,
              componentProps: {
                fullWidth: true,
                type: "date",
              },
              rules: {
                required: "Timeline for Quote Receipt is required",
              },
              activityOrder: 5, // Changed from 6 to 5
            },
          ],
        },
      ],
      newlyAddedFields: [],
    },
    iirm_kenya: {
      removedFields: [],
      replacedFields: [],
      newlyAddedFields: [],
    },
    iirm_india: {
      removedFields: [],
      replacedFields: [],
      newlyAddedFields: [],
    },
  };
  const { removedFields, replacedFields, newlyAddedFields } =
    organisationBasedConfig[organisationKey] || {
      removedFields: [],
      replacedFields: [],
      newlyAddedFields: [],
    };
  return { removedFields, replacedFields, newlyAddedFields };
}
