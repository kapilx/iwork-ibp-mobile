import { Box, Typography, styled } from "@mui/material";
import { CardBackground } from "@ui/ui-lib";

export const KnowledgeCentralContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  padding: theme.spacing(5),
}));

export const TitleContainer = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(5),
}));

export const ChipsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: theme.spacing(2),
  marginBottom: theme.spacing(2),
  marginTop: theme.spacing(2),
  marginLeft: theme.spacing(1), // Align with the left padding of the container
}));

export const AddDocumentLink = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  color: theme.palette.button.secondary,
  cursor: "pointer",
  textDecoration: "none",
}));

export const CategoryChipWrapper = styled(Box)(({ theme }) => ({
  // This targets the .MuiChip-root class of the Chip component rendered by ChipRenderer
  "& .MuiChip-root": {
    backgroundColor: theme.palette.neutral.veryLight, // #FFFFFF
    border: `1px solid ${theme.palette.neutral.light}`, // #CCCCCC
    color: theme.palette.text.primary, // Default text color
    "&:hover": {
      backgroundColor: theme.palette.background.lightBlue, // #e0e7ff
      borderColor: theme.palette.button.secondary, // #f9faff
      // The color of the text on hover can also be specified if needed:
      // color: theme.palette.primary.main,
    },
    // Ensure the clickable area covers the chip
    cursor: "pointer",
  },
}));

export const SectionContainer = styled(CardBackground)(({ theme }) => ({
  marginTop: theme.spacing(4),
  position: "relative",
  boxShadow: "unset",
}));

export const SectionHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: theme.spacing(3),
}));

export const DocumentsGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
  gap: theme.spacing(3),
  marginTop: theme.spacing(5),
}));

export const ViewMoreLink = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.button.secondary,
  cursor: "pointer",
  textDecoration: "none",
  alignSelf: "flex-end",
  marginTop: theme.spacing(5),
  display: "flex",
  justifyContent: "center",
}));

export const StyledHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  width: "100%",
}));

export const StyledDrawer = styled(Box)(({ theme }) => ({
  width: "430px",
  padding: "16px",
}));

export const StyledButtonContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  gap: theme.spacing(2),
  marginTop: theme.spacing(8),
}));
