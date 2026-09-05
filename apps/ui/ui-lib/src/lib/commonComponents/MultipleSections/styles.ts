import { Box, Divider, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

// Styled Box for the container
export const MultiSectionStyledBox = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center", // Vertically center the divider and button
  marginTop: theme.spacing(2), // Use theme spacing
}));

// Styled Divider
export const MultiSectionStyledDivider = styled(Divider)(({ theme }) => ({
  flexGrow: 1, // Let the divider take up the remaining space
  marginTop: theme.spacing(2), // Use theme spacing
}));

export const MultipleSectionStyledContainer = styled("form")(({ theme }) => ({
  width: "100%",
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(5),
}));

export const StyledButtonContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "flex-end",
  gap: theme.spacing(2),
  paddingBottom: theme.spacing(3.5),
  marginLeft: theme.spacing(2),
  width: "100%",
}));

// export const StyledFormContainer = styled(Box)(({ theme }) => ({
//   display: "flex",
//   flexDirection: "column",
//   gap: theme.spacing(5),
//   width: "100%",
// }));

export const MultipleSectionsSectionTitle = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontStyle: "normal",
  fontWeight: theme.typography.fontWeights.medium,
  fontSize: theme.typography.fontSizes.md,
  lineHeight: "100%",
  color: theme.palette.neutral.dark,
  whiteSpace: "nowrap",
}));
