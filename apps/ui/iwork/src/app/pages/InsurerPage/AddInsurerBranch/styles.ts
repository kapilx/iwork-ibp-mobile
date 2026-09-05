import { Box, styled } from "@mui/material";
import { Button } from "@ui/ui-lib";

export const StyledPageContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(5),
}));

export const StyledCrumbContainer = styled(Box)({
  margin: "0 auto",
  maxWidth: "1254px",
});

export const StyledFormContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(9),
}));

export const StyledNextButton = styled(Button)(({ theme }) => ({
  minWidth: "fit-content",
  paddingLeft: theme.spacing(5),
  paddingRight: theme.spacing(5),
}));

export const StyledHelperTextSpan = styled("span")({
  color: "#5B5B5B",
  fontSize: 13,
});

export const StyledGoThereLink = styled("button")({
  fontSize: 13,
  fontWeight: 600,
  verticalAlign: "baseline",
  color: "#1F1F1F",
  cursor: "pointer",
  background: "none",
  border: "none",
  padding: 0,
  textDecoration: "underline",
});
