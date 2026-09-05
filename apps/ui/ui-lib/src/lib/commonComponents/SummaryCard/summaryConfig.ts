import { theme } from "@ui/ui-lib/styles/Theme";
import { sentimentStyleMap } from "@ui/ui-lib/constants/styleMap";

export const cardSections = [
  {
    fields: [
      { label: "Industry", key: "industry" },
      {
        label: "Sentiment",
        key: "sentiment",
        renderAsChip: true,
        styleMap: sentimentStyleMap,
        variant: "withImage",
        labelStyles: "sentiment-label",
      },
    ],
    itemStyles: {
      display: "flex",
    },
    customStyles: {
      marginTop: 0,
    },
    containerStyles: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: theme.spacing(1.3),
    },
    keyStyles: {
      fontWeight: `${theme.typography.fontWeights.semiBold} !important`,
      fontSize: theme.typography.fontSizes.sm,
    },
  },
];
