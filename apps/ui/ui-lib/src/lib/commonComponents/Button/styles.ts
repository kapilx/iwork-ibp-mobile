// ButtonStyles.ts
import { CSSObject } from "@mui/material/styles";
import { ButtonProps } from ".";
import { theme } from "@ui/ui-lib/styles/Theme";

/**
 * Custom styled MUI Button with conditional styles based on variantType, sizeType, and hasLargeLabel
 */
export const getButtonStyles = ({
  variantType = "primary",
  sizeType = "large",
}: ButtonProps): CSSObject => {
  const width = sizeType === "large" ? 180 : 120;

  const commonStyles: CSSObject = {
    height: 40,
    minWidth: width,
    // borderRadius: border.radius.medium,
    borderRadius: theme.shape.borderRadii.medium,
    fontWeight: theme.typography.fontWeights.medium,
    textTransform: "none",
    boxShadow: "none",
    disableElevation: true,
  };

  switch (variantType) {
    case "primary":
      return {
        ...commonStyles,
        background: theme.palette.primary.main,
        color: theme.palette.neutral.veryLight,
        "&:hover": {
          background: theme.palette.primary.main,
          boxShadow: theme.shadows[5],
        },
        "&.Mui-disabled": {
          background: theme.palette.button.disabled, // Disabled state background
          color: theme.palette.neutral.veryLight,
          cursor: "not-allowed",
        },
      };

    case "secondary":
      return {
        ...commonStyles,
        backgroundColor: "transparent",
        border: `${theme.shape.borderSizes.thin} solid ${theme.palette.primary.main}`,
        color: theme.palette.primary.main,
        "&:hover": {
          backgroundColor: theme.palette.button.secondaryHover,
        },
        "&.Mui-disabled": {
          borderColor: theme.palette.neutral.lightMedium,
          color: theme.palette.neutral.lightMedium,
        },
      };

    case "link":
      return {
        ...commonStyles,
        backgroundColor: "transparent",
        color: theme.palette.button.secondary,
        padding: theme.spacing(0),
        minWidth: "auto",
        "&:hover": {
          textDecoration: "underline",
        },
        "&.Mui-disabled": {
          color: theme.palette.neutral.lightMedium,
        },
      };

    case "icon":
      return {
        ...commonStyles,
        backgroundColor: theme.palette.primary.main,
        minWidth: 40,
        width: 40,
        padding: theme.spacing(0),
        borderRadius: theme.shape.borderRadii.medium,
        color: theme.palette.button.secondary,
        "&.Mui-disabled": {
          color: theme.palette.neutral.lightMedium,
        },
      };
    case "addButton":
      return {
        ...commonStyles,
        border: `${theme.shape.borderSizes.thin} solid ${theme.palette.button.secondary}`,
        minWidth: 40,
        width: 40,
        padding: theme.spacing(0),
        borderRadius: theme.shape.borderRadii.circle,
        color: theme.palette.button.secondary,
        "&.Mui-disabled": {
          color: theme.palette.neutral.lightMedium,
        },
        "&:hover": {
          backgroundColor: theme.palette.button.secondaryHover,
        },
        "&:active": {
          backgroundColor: theme.palette.button.secondary,
        },
      };

    case "gradient":
      return {
        ...commonStyles,
        minWidth: "80px",
        background:
          "linear-gradient(136.55deg, #2A93FB 12.99%, #4BA4FD 41.03%, #68B4FF 53.7%, #47A2FD 68.47%, #2A93FB 92.72%)",
        boxShadow: "0px 4px 4px 0px #00000026",
        borderRadius: "6px",
        color: theme.palette.text.secondary,
        opacity: 1,
        "&:hover": {
          background:
            "linear-gradient(136.55deg, #2A93FB 12.99%, #4BA4FD 41.03%, #68B4FF 53.7%, #47A2FD 68.47%, #2A93FB 92.72%)",
          opacity: 0.9,
        },
        "&.Mui-disabled": {
          background: theme.palette.button.disabled,
          color: theme.palette.neutral.veryLight,
          opacity: 0.6,
        },
      };

    default:
      return commonStyles;
  }
};
