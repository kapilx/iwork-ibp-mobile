import { Box, styled } from "@mui/material";

export const StyledTatBlock = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  // padding: theme.spacing(2),
  marginTop: theme.spacing(4),
}));

export const StyledValueContainer = styled(Box)<{ tatStatus?: string }>(
  ({ theme }) => ({
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    justifyContent: "space-between",
    padding: theme.spacing(2),
  })
);

export const StyledTatValue = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  fontSize: theme.typography.fontSizes.xs,
  color: theme.palette.text.primary,
  fontWeight: "600",
}));

export const StyledDot = styled(Box)<{ tatStatus?: string }>(
  ({ theme, tatStatus }) => {
    const getBackgroundColor = () => {
      switch (tatStatus) {
        case "green":
          return theme.palette.text.darkGreen;
        case "blue":
          return theme.palette.text.darkBlue;
        case "red":
          return theme.palette.text.darkRed;
        case "orange":
          return theme.palette.text.darkOrange;
        case "yellow":
        default:
          return theme.palette.text.darkYellow;
      }
    };

    return {
      width: "6px",
      height: "6px",
      backgroundColor: getBackgroundColor(),
      borderRadius: "50%",
      marginRight: theme.spacing(1),
    };
  }
);

export const StyledTatCount = styled(Box)<{ tatStatus?: string }>(
  ({ theme, tatStatus }) => {
    const getBackgroundColor = () => {
      switch (tatStatus) {
        case "green":
          return theme.palette.background.lightGreen;
        case "blue":
          return theme.palette.background.lightSkyBlue;
        case "orange":
          return theme.palette.background.lightOrange;
        case "red":
          return theme.palette.background.lightRed;
        case "yellow":
        default:
          return theme.palette.background.lightYellow;
      }
    };

    // Method to get text color based on status - currently not used
    // const getTextColor = () => {
    //   switch (tatStatus) {
    //     case "green":
    //       return theme.palette.text.darkGreen;
    //     case "blue":
    //       return theme.palette.text.darkBlue;
    //     case "red":
    //       return theme.palette.text.darkRed;
    //     case "yellow":
    //     default:
    //       return theme.palette.text.darkYellow;
    //   }
    // };

    return {
      fontSize: theme.typography.fontSizes.xs,
      backgroundColor: getBackgroundColor(),
      color: theme.palette.text.black,
      fontWeight: "600",
      padding: theme.spacing(0.5, 3),
      display: "flex",
      justifyContent: "center",
      borderRadius: "10px",
    };
  }
);

export const StyledTitle = styled(Box)(({ theme }) => ({
  fontSize: "18px",
  fontWeight: 700,
  color: "#555555",
}));

export const StyledSubTitle = styled(Box)(({ theme }) => ({
  fontSize: "14px",
  fontWeight: "400",
  color: theme.palette.text.lightGrey,
}));
