import { Box, Select, styled, Typography } from "@mui/material";

export const DisplayUploadedFileContainer = styled(Box)<{
  customVariant?: string;
}>(({ theme, customVariant }) => ({
  display: "flex",
  width: "100%",
  maxWidth: customVariant === "endorsementDoc" ? "100%" : "570px",
  height: "40px",
  borderRadius: theme.spacing(2),
  alignItems: "center",
  justifyContent: "space-between",
  "&:hover .document-actions": {
    opacity: 1,
    pointerEvents: "auto",
  },
  boxShadow: customVariant === "endorsementDoc" ? theme.shadows[7] : "none",
}));

export const UploadFileContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  width: "100%",
  alignItems: "center",
  gap: theme.spacing(7.5),
  marginTop: theme.spacing(4),
}));

export const DocumentDetailsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  marginLeft: theme.spacing(3),
  marginTop: theme.spacing(1.5),
  marginBottom: theme.spacing(1.5),
  flex: 1,
  minWidth: 0,
}));

export const DocumentActionsContainer = styled(Box)<{ customVariant?: string }>(
  ({ theme, customVariant }) => ({
    display: "flex",
    gap: theme.spacing(2),
    marginRight: theme.spacing(3),
    marginTop: theme.spacing(2.5),
    marginBottom: theme.spacing(2.5),
    opacity: customVariant === "endorsementDoc" ? 1 : 0,
    pointerEvents: "none",
    transition: "opacity 0.2s",
    alignItems: "center",
  })
);

export const DocumentTypeIcon = styled("img")(({ theme }) => ({
  width: "28px",
  height: "28px",
}));

export const CommonActionIcon = styled("img")(({ theme }) => ({
  width: "20px",
  height: "20px",
  cursor: "pointer",
}));

export const SpanTypography = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xs,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.grey,
}));

export const CommonTypography = styled(Typography)<{
  hideDropdown?: boolean;
  customVariant?: string;
}>(({ theme, hideDropdown, customVariant }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.primary,
  maxWidth:
    customVariant === "endorsementDoc"
      ? "500px"
      : hideDropdown
      ? "250px"
      : "300px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  position: "relative",
  flex: 1,
  minWidth: 0,
  width: "100%",
  display: "inline-block",
  marginRight: theme.spacing(1),
}));

export const CommonTypographyForNoData = styled(Typography)<{
  hideDropdown?: boolean;
  customVariant?: string;
}>(({ theme, hideDropdown, customVariant }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.primary,
  maxWidth:
    customVariant === "endorsementDoc"
      ? "500px"
      : hideDropdown
      ? "130px"
      : "300px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  position: "relative",
  display: "inline-block",
  marginRight: theme.spacing(1),
}));

export const UploadedFileStyledSelect = styled(Select)(({ theme }) => ({
  width: "200px",
  height: "40px",
  borderRadius: theme.spacing(2),
  border: "none",
  outline: "none",
}));
