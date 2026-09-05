import { Box, CircularProgress, styled } from "@mui/material";
import Button from "../Button";

export const FormSectionContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

export const SmartAssistFormContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(4),
  minWidth: 300,
}));

export const ResponseText = styled(Box)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.neutral.dark,
  textAlign: "center",
}));

export const AdditionalOptionsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(0.5),
  marginBottom: "20px",
}));

export const MessageContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flex: "column",
  justifyContent: "center",
}));

export const FooterContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
  alignItems: "flex-end",
}));

export const CompanyButtonsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
}));

export const SmartAssistLoader = styled(CircularProgress)({
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  zIndex: 1,
});
export const StyledNextButton = styled(Button)(({ theme }) => ({
  minWidth: "100px",
  paddingLeft: theme.spacing(5),
  paddingRight: theme.spacing(5),
}));
export const StyledPageContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(5),
}));
