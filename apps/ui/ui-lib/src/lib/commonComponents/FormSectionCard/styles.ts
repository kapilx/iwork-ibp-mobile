import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  styled,
} from "@mui/material";

// Styled components
export const FormSectionStyledCard = styled(Card)(({ theme }) => ({
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  width: "100%",
  maxWidth: "1254px",
  border: `${theme.shape.borderSizes.thin} solid ${theme.palette.neutral.tableBorder}`,
  borderRadius: theme.shape.borderRadii.medium,
  margin: "0 auto",
  padding: theme.spacing(5),
  alignSelf: "stretch",
  flexGrow: 0,
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[7],
  gap: theme.spacing(15),
  marginBottom: theme.spacing(10),
  overflow: "visible",
}));

export const FormSectionStyledCardContent = styled(CardContent)({
  padding: 0,
  position: "relative",
  "&:last-child": { paddingBottom: 0 },
});

export const FormSectionHeader = styled(Box, {
  shouldForwardProp: (prop) => prop !== "addMarginTop",
})<{ addMarginTop?: boolean }>(({ theme, addMarginTop }) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  padding: theme.spacing(0),
  gap: theme.spacing(2.5),
  width: "100%",
  minWidth: "600px",
  height: theme.spacing(5.5),
  borderRadius: theme.spacing(0),
  marginBottom: theme.spacing(6),
  ...(addMarginTop && { marginTop: theme.spacing(3) }),
}));
export const FormSectionCardSectionTitle = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontStyle: "normal",
  fontWeight: 500,
  fontSize: theme.typography.fontSizes.lg,
  lineHeight: "100%",
  color: theme.palette.neutral.dark,
  whiteSpace: "nowrap",
}));

export const SectionDivider = styled("div")(({ theme }) => ({
  width: "100%",
  height: theme.spacing(0.25), // Adjusted height using theme spacing
  border: `${theme.shape.borderSizes.thin} solid #D4D4D4`,
  flexGrow: 1,
}));

export const FormFieldsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  flexWrap: "wrap",
  alignItems: "flex-start",
  alignContent: "flex-start",
  padding: theme.spacing(0),
  gap: `${theme.spacing(8)} ${theme.spacing(15)}`,
  width: "100%",
}));

export const ActionButton = styled(Button)(({ theme }) => ({
  bottom: theme.spacing(0), // adjust this for your desired bottom offset
  right: theme.spacing(0), // adjust this for your desired right offset
  borderRadius: theme.shape.borderRadii.circle,
  padding: theme.spacing(0),
  minWidth: "fit-content",
}));
