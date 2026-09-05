import { Card, Divider, Link, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

export const StaticIcon = styled("img")({
  width: "48px",
  height: "48px",
  cursor: "pointer",
});

export const FloatingAssistantStyledDivider = styled(Divider)(({ theme }) => ({
  marginBottom: theme.spacing(2.5),
  borderColor: theme.palette.text.mediumGrey,
}));

export const AssistantWrapper = styled("div")(({ theme }) => ({
  position: "fixed",
  bottom: 88,
  right: 16,
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  zIndex: theme.zIndex.SmartAssistant,
}));

export const AssistantCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[15],
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(2),
  paddingLeft: theme.spacing(3),
  paddingRight: theme.spacing(3),
  width: 200,
}));

export const AssistantTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.chips.senary,
  fontWeight: theme.typography.fontWeights.bold,
  fontSize: theme.typography.fontSizes.md,
  paddingBottom: theme.spacing(1),
  lineHeight: "20px",
  letterSpacing: theme.spacing(0),
  fontFamily: theme.typography.fontFamily,
}));

export const AssistantLink = styled("span")(({ theme }) => ({
  color: theme.palette.text.lightBlue,
  display: "block",
  paddingTop: theme.spacing(0.5),
  paddingBottom: theme.spacing(0.5),
  fontSize: theme.typography.fontSizes.xss,
  fontWeight: theme.typography.fontWeights.regular,
  lineHeight: "20px",
  borderBottom: `1px solid ${theme.palette.neutral.light}`,
  textDecoration: "none",
  "&.no-border": {
    borderBottom: "none",
  },
  cursor: "pointer",
}));

export const DisabledText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.disabled,
  display: "block",
  fontSize: theme.typography.fontSizes.xss,
  lineHeight: "20px",
  paddingTop: theme.spacing(0.5),
  paddingBottom: theme.spacing(0.5),
  borderBottom: `1px solid ${theme.palette.text.neutralwhite}`,
  "&.no-border": {
    borderBottom: "none",
  },
}));

export const MenuItem = styled("div")({
  width: "100%",
});
