import { Box, styled } from "@mui/material";

export const StyledCard = styled("div")(({ theme }) => ({
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  width: "100%",
  // maxWidth: "1254px",
  border: `${theme.shape.borderSizes.thin} solid ${theme.palette.neutral.tableBorder}`,
  borderRadius: theme.shape.borderRadii.medium,
  padding: theme.spacing(5),
  alignSelf: "stretch",
  flexGrow: 0,
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[7],
  gap: theme.spacing(15),
  overflow: "visible",
}));

export const StyledFormHeading = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  justifyContent: "space-between",
}));

export const FormHeadingImageContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  cursor: "pointer",
}));

export const FormHeadingContainerText = styled("span")(({ theme }) => ({
  color: theme.palette.button.secondary,
}));

export const FormHeadingSaperator = styled("span")(({ theme }) => ({
  color: theme.palette.neutral.light,
}));

export const FormHeadingImageAndTextContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  flexWrap: "wrap",
}));

export const Divider = styled("div")(({ theme }) => ({
  width: "100%",
  height: "1px",
  backgroundColor: theme.palette.background.divider,
}));

export const NestedDynamicButtonsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
  justifyContent: "flex-end",
  alignItems: "center",
}));

export const StyledFormButtonsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));
