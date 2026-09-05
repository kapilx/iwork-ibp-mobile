import { theme } from "@ui/ui-lib";
import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";

export const OpportunityStepperWrapper = styled("div")({
  border: `${theme.shape.borderSizes.thin} solid ${theme.palette.neutral.light}`,
  borderRadius: theme.shape.borderRadii.normal,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
  overflow: "hidden",
  backgroundColor: "#EDD8FF",
  [theme.breakpoints.down("lg")]: {
    borderRadius: theme.shape.borderRadii.small,
  },
  [theme.breakpoints.down("sm")]: {
    borderRadius: theme.spacing(1),
  },
});

export const ContentWrapper = styled(Box)({
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(2, 4),
  gap: theme.spacing(2.5),
  [theme.breakpoints.down("md")]: {
    padding: theme.spacing(2, 3),
    gap: theme.spacing(2),
  },
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(1.5, 2),
    gap: theme.spacing(1.5),
  },
});
