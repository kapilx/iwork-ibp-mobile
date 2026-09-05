import { CurrencyDisplayMode, FormFieldConfig } from "@ui/ui-lib";

export const USER_DETAILS_FORM_CONFIG: FormFieldConfig[] = [
  {
    key: "currencyDisplayMode",
    name: "currencyDisplayMode",
    label: "Currency format",
    type: "segmentedcontrol",
    gridColumn: 12,
    options: [
      {
        value: CurrencyDisplayMode.LAKHS,
        label: "Lakhs",
      },
      {
        value: CurrencyDisplayMode.CRORES,
        label: "Crores",
      },
      {
        value: CurrencyDisplayMode.INDIAN,
        label: "Lakhs & Crores",
      },
      {
        value: CurrencyDisplayMode.INTERNATIONAL,
        label: "Millions & Billions",
      },
    ],
    componentProps: {
      fullWidth: true,
      variantType: "primary",
      inlineLabel: true,
      wrapSegments: true,
      labelMinWidth: 140,
      labelCustomStyles: {
        fontSize: "18px",
        fontWeight: "bold",
        color: "#000000 !important",
      }
    },
  },
];
