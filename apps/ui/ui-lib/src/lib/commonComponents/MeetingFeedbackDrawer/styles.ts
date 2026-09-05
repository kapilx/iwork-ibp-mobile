import { Box, Typography } from "@mui/material";
import { styled } from "@mui/system";
import Button from "../Button";
import ChipRenderer from "../Chip";

export const FeedbackDrawerStyledButton = styled(Button)(({ theme }) => ({
  "&.button": {
    minWidth: "unset",
  },
}));

export const ButtonsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(4), // Equivalent to gap: 2 (assuming theme spacing(2) = 8px)
  justifyContent: "flex-end",
}));

export const DrawerContainer = styled(Box)(({ theme }) => ({
  width: 360,
  padding: theme.spacing(4),
  height: "92vh",
  display: "flex",
  justifyContent: "space-between",
  flexDirection: "column",
}));

export const DrawerContent = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: "auto",
}));

export const MeetingsSectionBox = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(7.5),
}));

export const ChipsRow = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(3),
  flexWrap: "wrap",
  marginTop: theme.spacing(3),
}));

export const CustomChip = styled(ChipRenderer)(({ theme }) => ({
  borderRadius: 8,
  fontWeight: theme?.typography?.fontWeights.regular,
  fontSize: theme?.typography?.fontSizes?.xs,
  padding: theme.spacing(0, 2),
  "&.MuiChip-colorPrimary": {
    background: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
  },
  "&.MuiChip-colorDefault": {
    background: theme.palette.grey[200],
    color: theme.palette.text.primary,
  },
}));

export const CustomRatingWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  marginTop: theme.spacing(3),
}));

export const MeetingStyledTypography = styled(Typography)(({ theme }) => ({
  fontWeight: theme?.typography?.fontWeights?.semiBold,
  fontSize: theme?.typography?.fontSizes?.sm,
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(1),
}));
