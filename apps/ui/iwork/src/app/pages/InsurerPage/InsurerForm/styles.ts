import { Box, Typography, styled } from "@mui/material";
import { Button } from "@ui/ui-lib";

export const StyledKycGstCard = styled(Box)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(2),
  overflow: "hidden",
}));

export const StyledKycGstCardHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5, 3),
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
}));

export const StyledKycGstCardTitle = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.semiBold,
  fontSize: theme.typography.fontSizes.md,
  color: theme.palette.text.primary,
}));

export const StyledKycGstCardContent = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
}));

export const StyledPageContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(5),
}));
export const StyledCrumbContainer = styled(Box)(({ theme }) => ({
  margin: "0 auto",
  maxWidth: "1254px",
}));

export const StyledPrevButton = styled(Button)(({ theme }) => ({
  minWidth: "fit-content",
  paddingLeft: theme.spacing(5),
  paddingRight: theme.spacing(5),
}));
export const StyledNextButton = styled(Button)(({ theme }) => ({
  minWidth: "fit-content",
  paddingLeft: theme.spacing(5),
  paddingRight: theme.spacing(5),
}));

export const StyledCancelButton = styled(Button)(({ theme }) => ({
  textDecoration: "none",
  "&:hover": {
    textDecoration: "none",
  },
}));

export const StyledInsurerFormContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(9),
}));

// Logo Upload Styles
export const StyledLogoUploadBox = styled(Box)<{ hasLogo?: boolean }>(
  ({ theme, hasLogo }) => ({
    border: "2px dashed",
    borderColor: theme.palette.divider,
    borderRadius: theme.spacing(2),
    padding: theme.spacing(2),
    cursor: hasLogo ? "default" : "pointer",
    backgroundColor: hasLogo ? theme.palette.background.paper : "transparent", // Replaced with theme color
    maxWidth: 400,
    minWidth: 300,
    "&:hover": {
      borderColor: hasLogo ? theme.palette.divider : theme.palette.primary.main,
      backgroundColor: hasLogo
        ? theme.palette.background.paper // Replaced with theme color
        : theme.palette.action.hover,
    },
  })
);

export const StyledLogoLoadingBox = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "200px",
  gap: theme.spacing(1),
}));

export const StyledLogoPreviewContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

export const StyledLogoPreviewBox = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "200px",
  backgroundColor: theme.palette.background.paper, // Replaced with theme color
  borderRadius: theme.spacing(1),
  border: "1px solid",
  borderColor: theme.palette.divider,
  overflow: "hidden",
  color: theme.palette.text.primary, // Replaced with theme color
}));

export const StyledLogoActionsBox = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(1),
}));

export const StyledLogoUploadEmptyBox = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "200px",
}));

export const StyledLogoUploadIcon = styled(Box)(({ theme }) => ({
  fontSize: 48,
  color: theme.palette.grey[400],
  marginBottom: theme.spacing(2),
}));

// AutoImageCropper Styled Components
export const StyledCropperContainer = styled(Box)(({ theme }) => ({
  width: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(2.5), // 20px
  padding: theme.spacing(1), // 8px
}));

export const StyledCropperOuterBox = styled(Box)<{
  divWidth?: number;
  divHeight?: number;
}>(({ theme, divWidth = 400, divHeight = 225 }) => ({
  position: "relative",
  width: divWidth,
  height: divHeight,
  border: "3px solid transparent",
  borderRadius: theme.spacing(2), // 16px
  overflow: "hidden",
  // backgroundColor: theme.palette.background.paper, // Changed from black to white
  backgroundColor: "#000", // Changed from black to white
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
  background: "linear-gradient(145deg, #f0f0f0, #ffffff)",
  padding: "3px",
}));

export const StyledCropperInnerBox = styled(Box)(({ theme }) => ({
  width: "100%",
  height: "100%",
  borderRadius: "13px",
  overflow: "hidden",
  // backgroundColor: theme.palette.background.paper, // Changed from black to white
  backgroundColor: "#000", // Changed from black to white
  position: "relative",
}));

export const StyledZoomControlContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2), // 16px
  width: "320px",
  backgroundColor: theme.palette.background.lightBlue,
  padding: theme.spacing(1.5, 2), // 12px 16px
  borderRadius: "25px",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
}));

export const StyledZoomLabel = styled("span")(({ theme }) => ({
  fontSize: "14px",
  color: theme.palette.text.mutedSlate,
  minWidth: "45px",
  fontWeight: 500,
}));

export const StyledZoomSlider = styled("input")(({ theme }) => ({
  flex: 1,
  height: "6px",
  background: "linear-gradient(to right, #667eea 0%, #764ba2 100%)",
  borderRadius: "3px",
  outline: "none",
  cursor: "pointer",
  WebkitAppearance: "none",
  appearance: "none",

  // Webkit slider thumb styling
  "&::-webkit-slider-thumb": {
    WebkitAppearance: "none",
    appearance: "none",
    height: "18px",
    width: "18px",
    borderRadius: "50%",
    background: theme.palette.chips.primary,
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
  },

  // Firefox slider thumb styling
  "&::-moz-range-thumb": {
    height: "18px",
    width: "18px",
    borderRadius: "50%",
    background: theme.palette.chips.primary,
    cursor: "pointer",
    border: "none",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
  },
}));

export const StyledZoomPercentage = styled("span")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xs,
  color: theme.palette.text.mediumGrey,
  minWidth: "30px",
  textAlign: "right",
}));