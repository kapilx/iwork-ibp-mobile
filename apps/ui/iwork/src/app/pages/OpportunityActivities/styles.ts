import { Box, styled, Typography } from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

export const StyledAccordianContainer = styled(Box)(({ theme }) => ({
  width: "100%",
  padding: theme.spacing(5, 0),
  height: "85vh",
  overflowY: "auto",
  "& .MuiAccordion-root": {
    transition: "transform 0.2s ease, background-color 0.2s ease",
  },
  "& .MuiAccordion-root:not(.Mui-expanded):hover": {
    transform: "scale(1.005)",
    // same tint as ag-grid alpine's --ag-row-hover-color on listing rows
    backgroundColor: "rgba(33, 150, 243, 0.1)",
  },
}));

export const CompletedTick = styled(CheckCircleRoundedIcon)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  color: theme.palette.text.darkGreen,
  marginLeft: theme.spacing(2),
}));

export const TitleContainer = styled(Typography)(({ theme }) => ({
  margin: "0 auto",
  maxWidth: "1254px",
  marginBottom: theme.spacing(5),
}));

export const HeadingContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(3),
  // padding: theme.spacing(4, 2),
}));

export const SlipGenerationTypography = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.bold,
  color: theme.palette.text.primary,
  lineHeight: theme.spacing(5),
}));

export const VerticalDivider = styled("div")(({ theme }) => ({
  width: "1px",
  height: theme.spacing(6),
  backgroundColor: theme.palette.neutral.tableBorder,
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

export const ChipTypography = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xss,
  fontWeight: theme.typography.fontWeights.regular,
  lineHeight: theme.spacing(5),
  marginBottom: theme.spacing(0.7),
}));

export const TitleStyles = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.neutral.dark,
  display: "flex",
  alignItems: "center",
}));

export const ActivityIndexCircle = styled("span")(
  ({ theme, $bgcolor, $color }) => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "20px",
    height: "20px",
    borderRadius: theme.shape.borderRadii.circle,
    backgroundColor: `${$bgcolor}26`,
    color: $color || theme.palette.text.primary,
    marginRight: theme.spacing(3),
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: theme.typography.fontWeights.regular,
  })
);
export const ActivityTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
}));

export const StyledErrorBoundary = styled(Box)(({ theme }) => ({
  width: "100%",
  height: "calc(100vh - 500px)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
}));
