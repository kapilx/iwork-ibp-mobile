import { styled } from "@mui/material/styles";
import { Box, Link, Typography } from "@mui/material";

export const StyledLinkContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: theme.spacing(2),
  marginBottom: theme.spacing(1),
  [theme.breakpoints.down("md")]: {
    gap: theme.spacing(1.5),
  },
  [theme.breakpoints.down("sm")]: {
    gap: theme.spacing(1),
    marginBottom: theme.spacing(0.5),
  },
}));

export const StyledLink = styled(Link)<{ type: string }>(({ theme, type }) => ({
  display: "flex",
  alignItems: "center",
  textDecoration: "none",
  cursor: "pointer",
  gap: theme.spacing(1),
  fontWeight: type === "current" ? theme.typography.fontWeights.semiBold : theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.sm,
  color:
    type === "current"
      ? theme.palette.chips.senary
      : type === "past" || type === "justCurrent"
      ? theme.palette.success.main
      : theme.palette.text.primary,
  transition: "color 0.3s ease",
  [theme.breakpoints.down("md")]: {
    fontSize: theme.typography.fontSizes.xs,
    gap: theme.spacing(0.75),
  },
  [theme.breakpoints.down("sm")]: {
    fontSize: theme.typography.fontSizes.xxs,
    gap: theme.spacing(0.5),
  },
}));

export const DoneIconStyled = styled("img")(({ theme }) => ({
  width: 16,
  height: 16,
  [theme.breakpoints.down("sm")]: {
    width: 14,
    height: 14,
  },
}));

export const JustCurrentDoneIconStyled = styled("img")(({ theme }) => ({
  width: 16,
  height: 16,
}));

export const NextIconStyled = styled("img")(({ theme }) => ({
  width: 24,
  height: 24,
}));

export const UpcomingNextIconStyled = styled("img")(({ theme }) => ({
  width: 24,
  height: 24,
  marginRight: theme.spacing(1),
  [theme.breakpoints.down("md")]: {
    width: 20,
    height: 20,
    marginRight: theme.spacing(0.75),
  },
  [theme.breakpoints.down("sm")]: {
    width: 16,
    height: 16,
    marginRight: theme.spacing(0.5),
  },
}));

export const UpcomingIconStyled = styled("img")(({ theme }) => ({
  width: 16,
  height: 16,
  marginRight: theme.spacing(1),
  [theme.breakpoints.down("sm")]: {
    width: 14,
    height: 14,
    marginRight: theme.spacing(0.5),
  },
}));

export const ToolTipTypography = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xs,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.primary,
  lineHeight: "1.5",
  marginBottom: theme.spacing(1),
  marginTop: theme.spacing(1),
}));

export const SelectedCompletedActivityDiv = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
}));

export const OpportunityLostTypography = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.red,
}));