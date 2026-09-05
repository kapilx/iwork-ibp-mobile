import { endPoints } from "@ui/ui-lib";

export const opportunityLostConfig = [
  {
    key: "reasonForLossLid",
    name: "reasonForLossLid",
    type: "select",
    label: "Reason for loss",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
    },
    apiDependencies: {
      endPoint: endPoints.lookUpByName("REASON_FOR_OPPORTUNITY_LOSS"),
    },
  },
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
      placeholder: "",
    },
  },
];
