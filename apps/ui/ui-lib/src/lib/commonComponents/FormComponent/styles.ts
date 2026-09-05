import { SxProps, Theme } from "@mui/material";

export const getDynamicFormGridContainerSx = (
  renderAsTable: boolean,
  overrides: SxProps<Theme> = {}
): SxProps<Theme> => ({
  columnGap: "60px",
  rowGap: renderAsTable ? "0" : "32px",
  width: "unset",
  "&&": {
    marginLeft: "0px",
  },
  ...overrides,
});

export const dynamicFormSectionBoxSx: SxProps<Theme> = {
  border: "1px solid #E4E8F0",
  borderRadius: "10px",
  padding: "16px",
  backgroundColor: "#F8FAFD",
  margin: "24px 0px",
};
