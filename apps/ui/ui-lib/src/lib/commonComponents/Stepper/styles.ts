import { Box, CircularProgress, Typography, styled } from "@mui/material";
import { WarningRounded as IncompleteIcon } from "@mui/icons-material";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";

// Styled component for the outer container of the ProgressWizard
export const ProgressWizardContainer = styled(Box)<{ gradient: string }>(
  ({ gradient, theme }) => ({
    position: "relative",
    display: "flex",
    flexDirection: "column",
    padding: theme.spacing(4, 5),
    borderRadius: theme.shape.borderRadii.normal,
    marginTop: theme.spacing(4), // Remove later if not needed
    maxWidth: "1254px",
    background: gradient, // Dynamically apply the gradient
    marginBottom: theme.spacing(5),
    width: "100%",
    marginLeft: "auto",
    marginRight: "auto",
  })
);

// Styled component for the stepper header container
export const StepperProgressHeaderContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  width: "100%",
  marginBottom: theme.spacing(5),
  position: "absolute",
  maxWidth: "fit-content",
  right: "4%",
  top: "-56px",
}));

// Styled component for the stepper body container
export const StepperBodyContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  position: "relative",
  width: "100%",
  maxWidth: "calc(100% - 200px)",
}));

// Styled component for the StepItem container
export const StepItemContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "start",
  zIndex: 1,
  maxWidth: 40,
  justifyContent: "center",
}));

// Styled component for the StepItem icon container
export const StepItemIconContainer = styled(Box)(({ theme }) => ({
  position: "relative",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
}));

// Styled component for the StepItem icon
export const StepItemIcon = styled(Box)<{ isClickable: boolean }>(
  ({ isClickable, theme }) => ({
    cursor: isClickable ? "pointer" : "not-allowed",
    opacity: isClickable ? 1 : 0.7,
    width: 40,
    height: 40,
    borderRadius: theme.shape.borderRadii.circle,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    transition: "all 0.3s ease",
    backgroundColor: "transparent",
  })
);

// Styled component for the StepItem label

export const StepItemLabel = styled(Typography)<{ isActive: boolean }>(
  ({ isActive, theme }) => ({
    fontSize: isActive
      ? theme.typography.fontSizes.md
      : theme.typography.fontSizes.sm,
    fontWeight: isActive
      ? theme.typography.fontWeights.semiBold
      : theme.typography.fontWeights.medium,
    paddingLeft: isActive ? theme.spacing(1) : theme.spacing(4),
    textAlign: "center",
    color: theme.palette.neutral.veryLight,
    maxWidth: "250px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  })
);

// Styled component for the StepConnector
export const StepConnectorContainer = styled(Box)(({ theme }) => ({
  position: "relative",
  flex: 1,
  height: 2,
  backgroundColor: theme.palette.background.stepConnectorContainerBg,
  alignSelf: "center",
  marginBottom: theme.spacing(5),
  maxWidth: "240px",
}));

// Styled component for the StepConnector progress
export const StepConnectorProgress = styled(Box)<{ width: string }>(
  ({ width, theme }) => ({
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
    backgroundColor: theme.palette.neutral.veryLight,
    transition: "width 0.5s ease",
    width, // Dynamically apply the width
  })
);

export const MessageBoxArrow = styled(Box)(({ theme }) => ({
  position: "absolute",
  right: "-8px",
  top: "50%",
  transform: "translateY(-50%)",
  width: 0,
  height: 0,
  borderTop: `${theme.spacing(2)} solid transparent`,
  borderBottom: `${theme.spacing(2)} solid transparent`,
  borderLeft: `${theme.spacing(2)} solid ${theme.palette.border.primary}`, // Match border color
}));

export const MessageBoxContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: "16px",
  background:
    "linear-gradient(163.92deg, rgba(67, 198, 2, 0.3) 17.21%, rgba(214, 250, 232, 0.05) 98.22%), rgba(67, 198, 2, 0.2)",

  border: "1px solid #68C995",
  boxShadow: "0px 0px 15px rgba(0, 0, 0, 0.3)",
  borderRadius: "8px",
  padding: "16px",
  paddingLeft: "0px",
  position: "absolute",
  top: "105px",
  zIndex: 999,
  width: "447px",
  height: "55px",
  right: "0px",
  boxSizing: "border-box",
}));

export const IconContainer = styled(Box)({
  position: "absolute",
  left: "16px",
  top: "5px",
});

export const MessageBoxText = styled(Typography)({
  fontFamily: "Figtree, sans-serif",
  fontWeight: 500,
  fontSize: "16px",
  lineHeight: "19px",
  display: "flex",
  alignItems: "center",
  color: "#04544D",
  flexGrow: 1,
  marginLeft: "20%",
});

export const StepperCloseButton = styled(Box)({
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "24px",
  height: "24px",
  "&:hover": {
    opacity: 0.7,
  },
  zIndex: 9999,
});

// Styled component for the ProgressWrapper
export const ProgressWrapper = styled("div")(({ theme }) => ({
  position: "relative",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: 112,
  width: 112,
  borderRadius: theme.shape.borderRadii.circle,
  backgroundColor: theme.palette.background.progressWrapperBg,
}));

// Styled component for the CircularProgress styles
export const CircularProgressStyles = styled(CircularProgress)<{
  backgroundColor: string;
}>(({ backgroundColor, theme }) => ({
  borderRadius: theme.shape.borderRadii.circle,
  strokeLinecap: "round",
  padding: theme.spacing(1),
  color: theme.palette.neutral.veryLight,
  backgroundColor, // Dynamically apply the background color
  "& .MuiCircularProgress-svg": {
    transform: "rotate(277deg)",
    transformOrigin: "50% 50%",
  },
}));

// Styled component for the Typography inside ProgressCircle
export const ProgressTypography = styled(Typography)(({ theme }) => ({
  position: "absolute",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 600,
  fontSize: theme.typography.fontSizes.xll,
  lineHeight: "20px",
  letterSpacing: "0%",
  textAlign: "center",
  verticalAlign: "middle",
  color: theme.palette.neutral.veryLight,
}));

// Styled component for the custom active icon (outer ring)
export const OuterRing = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: 3,
  left: 3,
  width: 34,
  height: 34,
  borderRadius: theme.shape.borderRadii.circle,
  opacity: 0.2,
  backgroundColor: theme.palette.neutral.veryLight,
}));

// Styled component for the custom active icon (middle ring)
export const MiddleRing = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: 9,
  left: 9,
  width: 22,
  height: 22,
  borderRadius: theme.shape.borderRadii.circle,
  opacity: 0.5,
  backgroundColor: theme.palette.neutral.veryLight,
}));

// Styled component for the custom active icon (inner dot)
export const InnerDot = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: 16,
  left: 15.79,
  width: 8,
  height: 8,
  borderRadius: theme.shape.borderRadii.circle,
  backgroundColor: theme.palette.neutral.veryLight,
}));

// Styled component for the default incomplete icon
export const DefaultIncompleteIcon = styled(Box)(({ theme }) => ({
  color: theme.palette.neutral.incompleteIcon,
  height: 8,
  width: 8,
  borderRadius: theme.shape.borderRadii.circle,
  border: `${theme.shape.borderSizes.thin} solid ${theme.palette.neutral.veryLight}`,
  background: theme.palette.background.incompleteIconBg,
}));

export const customActiveIcon = styled(Box)(({ theme }) => ({
  position: "relative",
  width: 40,
  height: 40,
}));

export const StyledCompletedIcon = styled(TaskAltOutlinedIcon)(({ theme }) => ({
  color: theme.palette.neutral.veryLight,
}));

export const StyledIncompleteIcon = styled(IncompleteIcon)(({ theme }) => ({
  color: theme.palette.neutral.veryLight,
}));

export const CustomActiveIconContainer = styled(Box)(() => ({
  position: "relative",
  width: 40,
  height: 40,
}));

export const StepperHeaderBox = styled(Box)(() => ({
  display: "flex",
  alignItems: "center",
}));

export const StyledImgBg = styled("img")(() => ({
  position: "absolute",
}));

export const StepperContainer = styled(Box)(({ theme }) => ({
  position: "relative",
}));
