import { Box, styled, Typography } from "@mui/material";
import Button from "../Button";

export const SummaryCardContainer = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
  padding: theme.spacing(5),
  borderRadius: theme.shape.borderRadii.medium,
  background: theme.palette.background.purple,
  [theme.breakpoints.down("md")]: {
    padding: theme.spacing(3),
    gap: theme.spacing(2),
  },
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2),
    gap: theme.spacing(1.5),
  },
}));

export const LogoSection = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
}));

export const LinkText = styled("a")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.button.secondary,
  textDecoration: "none",
  fontSize: theme.typography.fontSizes.sm,
  gap: theme.spacing(2),

  svg: {
    fontSize: theme.typography.fontSizes.md,
    marginLeft: theme.spacing(1),
  },
}));

export const ItemSection = styled("div")({
  display: "flex",
  flexDirection: "column",
});

export const SummaryCardLabel = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.medium,
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.primary,
}));

export const SummaryCardValue = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
}));

export const LogoContainer = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  border: `${theme.shape.borderSizes.thin} solid ${theme.palette.button.secondary}`,
  borderRadius: theme.shape.borderRadii.medium,
  padding: theme.spacing(2, 3),
  backgroundColor: theme.palette.background.paper,
  cursor: "pointer",
  "&:hover": {
    backgroundColor: theme.palette.button.secondaryHover,
  },
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(1.5, 2),
  },
}));

export const CompanyNameContainer = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(2),
  flexWrap: "wrap",
  [theme.breakpoints.down("lg")]: {
    gap: theme.spacing(1.5),
  },
  [theme.breakpoints.down("md")]: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: theme.spacing(2),
  },
}));

export const CompanyNameLabel = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xxl,
  fontWeight: theme.typography.fontWeights.bold,
  color: theme.palette.gradients.purple.text,
  maxWidth: "400px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  [theme.breakpoints.down("lg")]: {
    fontSize: theme.typography.fontSizes.xl,
    maxWidth: "300px",
  },
  [theme.breakpoints.down("md")]: {
    fontSize: theme.typography.fontSizes.lg,
    maxWidth: "100%",
    whiteSpace: "normal",
    wordBreak: "break-word",
  },
  [theme.breakpoints.down("sm")]: {
    fontSize: theme.typography.fontSizes.md,
  },
}));

export const CompanySentimentLabel = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.primary,
}));

export const CompanyNameSection = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(5),
  flexWrap: "wrap",
  flex: 1,
  [theme.breakpoints.down("lg")]: {
    gap: theme.spacing(3),
  },
  [theme.breakpoints.down("md")]: {
    gap: theme.spacing(2),
    width: "100%",
  },
  [theme.breakpoints.down("sm")]: {
    gap: theme.spacing(1.5),
    flexDirection: "column",
    alignItems: "flex-start",
  },
}));

export const TracxnButton = styled(Button)(({ theme }) => ({
  border: `${theme.shape.borderSizes.thin} solid ${theme.palette.primary.main}`,
  "&.tracxn-button": {
    minWidth: "unset",
    width: "108px",
    [theme.breakpoints.down("md")]: {
      width: "auto",
      padding: theme.spacing(1, 2),
    },
  },
}));

export const ButtonLogoContainer = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
}));

export const ButtonText = styled("span")(({ theme }) => ({
  color: theme.palette.primary.main,
}));
export const LinkedInButtonStyles = styled(Button)(({ theme }) => ({
  backgroundColor: "transparent",
  "&:disabled": {
    filter: "grayscale(1)",
    PointerEvents: "none",
    cursor: "not-allowed",
  },
}));

export const ViewMoreIndicator = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(1),
  cursor: "pointer"
}));

export const ViewMoreTypography = styled(Typography)(({theme}) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.button.secondary
}));

export const StyledImg = styled("img")<{isOpened: boolean}>(({ theme, isOpened }) => ({
    transform: isOpened ? "rotate(0deg)" : "rotate(180deg)",
    transition: "transform 0.2s",
}));

export const ClickableCompanyName = styled(Typography)(({ theme }) => ({
  cursor: "pointer",
  color: theme.palette.button.secondary,
  "&:hover": {
    textDecoration: "underline",
  },
}));

export const VerticalDivider = styled(Box)(({ theme }) => ({
  width: "1px",
  height: "24px",
  backgroundColor: theme.palette.text.primary,
  margin: theme.spacing(0, 1),
  [theme.breakpoints.down("sm")]: {
    display: "none",
  },
}));
