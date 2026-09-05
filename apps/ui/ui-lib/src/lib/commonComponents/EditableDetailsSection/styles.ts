import { styled } from "@mui/material/styles";
import { Box } from "@mui/material";
import { Button } from "@ui/ui-lib";

export const EditableHeaderContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: theme.spacing(5),
  gap: theme.spacing(3),
}));

export const EditableHeaderContent = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  flex: 1,
  minHeight: theme.spacing(7),
}));

export const HeaderTitle = styled("h3")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.bold,
  margin: 0,
  color: theme.palette.primary.main,
}));

export const ActionsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(3),
}));

export const FormWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(5),
}));

export const FormApprovalContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  gap: theme.spacing(3),
}));

export const EditableEditButton = styled(Button)(({ theme }) => ({
  border: "unset",
  padding: 0,
  minWidth: "unset",
  gap: theme.spacing(1),
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.regular,
  color: "#187FE3",
  ":hover": {
    backgroundColor: "unset",
  },
}));
