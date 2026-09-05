import { styled, Theme } from "@mui/material/styles";

// Container for the checkbox and label
export const CheckBoxStyledContainer = styled("div")(
  ({ theme }: { theme: Theme }) => ({
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(2),
    justifyContent: "space-between",
  })
);

// Label wrapper
export const StyledLabel = styled("label")(({ theme }: { theme: Theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.primary,
  cursor: "pointer",
}));

export const HiddenCheckbox = styled("input")({
  display: "none",
});

export const StyledCheckbox = styled("span")<{
  isChecked: boolean;
  variant?: "default" | "documentType";
  isIndeterminate?: boolean;
  isDisabled?: boolean;
}>(({ theme, isChecked, variant, isIndeterminate, isDisabled }) => ({
  width: theme.spacing(4.5),
  height: theme.spacing(4.5),
  border: `${theme.shape.borderSizes.thin} solid ${
    variant === "documentType"
      ? isChecked
        ? "#1976D2"
        : "#7B7B7B"
      : theme.palette.neutral.light
  }`,
  backgroundColor:
    variant === "documentType" && isChecked
      ? "#1976D2"
      : "transparent",
  borderRadius: theme.shape.borderRadii.small,
  position: "relative",
  transition: "all 0.2s ease",
  cursor: isDisabled ? "not-allowed" : "pointer",
  opacity: isDisabled ? 0.6 : 1,
  color: isDisabled
    ? theme.palette.text.mediumGrey
    : theme.palette.text.primary,

  // Hover State
  ...(isDisabled
    ? {}
    : {
        "&:hover": {
          border: `${theme.shape.borderSizes.thin} solid ${
            variant === "documentType"
              ? isChecked
                ? "#1976D2"
                : "#7B7B7B"
              : theme.palette.button.secondary
          }`,
          backgroundColor:
            variant === "documentType"
              ? isChecked
                ? "#1976D2"
                : "#FFFFFF"
              : theme.palette.background.tableHeaderHover,
        },
      }),

  // Selected State
  ...(isChecked && {
    border: `${theme.shape.borderSizes.thin} solid ${
      variant === "documentType" ? "#1976D2" : theme.palette.button.secondary
    }`,
    backgroundColor:
      variant === "documentType"
        ? "#1976D2"
        : theme.palette.background.tableHeaderHover,

    "&::after": {
      content: '""',
      position: "absolute",
      top: "46%",
      left: "50%",
      transform: isIndeterminate
        ? "translate(-50%, -50%)"
        : "translate(-50%, -50%) rotate(45deg)",
      width: isIndeterminate ? "8px" : "4px",
      height: isIndeterminate ? "1px" : "8px",
      backgroundColor: isIndeterminate
        ? variant === "documentType"
          ? "#FFFFFF"
          : theme.palette.button.secondary
        : "transparent",
      border: isIndeterminate
        ? "none"
        : `solid ${
            variant === "documentType"
              ? "#FFFFFF"
              : theme.palette.button.secondary
          }`,
      borderWidth: isIndeterminate
        ? "none"
        : `0 ${theme.shape.borderSizes.thin} ${theme.shape.borderSizes.thin} 0`,
    },
  }),
}));
export const CheckBoxImageContainer = styled("div")(() => ({}));
