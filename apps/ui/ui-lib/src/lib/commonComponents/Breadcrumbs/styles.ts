import { Breadcrumbs, Link, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

export const StyledBreadcrumbs = styled(Breadcrumbs)(({ theme }) => ({
  textWrap: "nowrap",
  "& .MuiBreadcrumbs-separator": {
    margin: theme.spacing(0, 1),
  },
}));

export const StyledLink = styled(Link)(({ theme }) => ({
  cursor: "pointer",
  color: theme.palette.button.secondary,
  textDecoration: "none",
  "&:hover": {
    color: theme.palette.button.secondary,
  },
}));

export const BreadCrumbStyledTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  fontWeight: `${theme.typography.fontWeights.semiBold}`,
  cursor: "default",
  maxWidth: "250px",
  overflow: "hidden",
  textOverflow: "ellipsis",
}));

export const StyledTooltipBreadcrumb = styled("div")(({ theme }) => ({
  cursor: "pointer",
  padding: theme.spacing(0.5, 1),
  whiteSpace: "nowrap",
  "&:hover": { textDecoration: "underline" },
}));
