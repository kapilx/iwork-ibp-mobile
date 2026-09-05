import { styled, Box, Button, Typography } from "@mui/material";

export const SupportFormContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  marginTop: theme.spacing(5),
  gap: theme.spacing(4),
}));

export const FormButtonsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: theme.spacing(2),
  marginTop: theme.spacing(2),
}));

export const FormNote = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.tertiary,
  fontWeight: theme.typography.fontWeights.regular,
  marginRight: "auto",
}));

export const CancelButton = styled(Button)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights.medium,
  fontSize: theme.typography.fontSizes.md,
  textTransform: "none",
  padding: theme.spacing(2.5, 10),
  borderRadius: theme.spacing(3),
  borderColor: "transparent",
  color: theme.palette.background.DarkBlue,
  "&:hover": {
    background:"transparent",
    borderColor: theme.palette.background.DarkBlue,
  },
  "@media (max-width: 480px)": {
    padding: theme.spacing(2, 5),
    fontSize: "14px",
  },
  "@media (max-width: 420px)": {
    padding: theme.spacing(1.5, 4),
    fontSize: "13px",
  },
}));

export const SubmitButton = styled(Button)(({ theme }) => ({
  background:theme.palette.background.DarkBlue,
  color: theme.palette.common.white,
  fontWeight: theme.typography.fontWeights.medium,
  fontSize: theme.typography.fontSizes.md,
  textTransform: "none",
  padding: theme.spacing(2.5, 10),
  borderRadius: theme.spacing(3),
  "@media (max-width: 480px)": {
    padding: theme.spacing(2, 5),
    fontSize: "14px",
  },
  "@media (max-width: 420px)": {
    padding: theme.spacing(1.5, 4),
    fontSize: "13px",
  },
}));
