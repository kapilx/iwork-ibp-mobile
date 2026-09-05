import { Box, Typography, styled } from "@mui/material";
import { Button } from "@ui/ui-lib";

export const PageContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(8),
  display: "flex",
  flexDirection: "column",
}));

export const Title = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
  overflow: "hidden",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  textOverflow: "ellipsis",
}));
export const DefaultImageContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "325px",
  width: "590px",
}));
export const SubTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.grey,
}));

export const ContactsContainer = styled(Box)(({ theme }) => ({
  border: `${theme.shape.borderSizes.thin} solid ${theme.palette.neutral.divider}`,
  borderRadius: theme.shape.borderRadii.medium,
  padding: theme.spacing(3),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  marginTop: theme.spacing(4),
  height: "500px",
  overflowY: "auto",
}));

export const ContactsHeader = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.bold,
}));

export const ContactList = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

export const ContactButtonsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
  marginTop: theme.spacing(4),
  justifyContent: "flex-end",
}));

export const ContactSelectorContactName = styled("span")<{
  highlight?: boolean;
  isInactive?: boolean;
}>(({ theme, highlight, isInactive }) => ({
  fontWeight: highlight ? "bold" : "normal",
  color: isInactive
    ? theme.palette.text.mediumGrey
    : theme.palette.text.primary,
}));

export const NewContactTag = styled("span")(({ theme }) => ({
  color: theme.palette.background.completedProgressColor,
}));

export const DividerContainer = styled(Box)(({ theme }) => ({
  margin: `${theme.spacing(4)} 0`,
}));
export const StyledPrevButton = styled(Button)(({ theme }) => ({
  minWidth: "fit-content",
  paddingLeft: theme.spacing(5),
  paddingRight: theme.spacing(5),
}));

export const InactiveContactTag = styled("span")(({ theme }) => ({
  color: theme.palette.text.mediumGrey,
  marginLeft: theme.spacing(1),
  fontSize: theme.typography.fontSizes.sm,
}));
