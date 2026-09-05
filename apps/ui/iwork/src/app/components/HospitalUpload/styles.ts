import {
  Box,
  styled,
  Typography,
  Button,
  IconButton,
  Stack,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

export const ModalHeadingContainer = styled(Typography)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1.5),
}));

export const ModalMainHeading = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.primary,
}));

export const ModalSubHeading = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  color: theme.palette.text.lightGrey,
}));

export const ButtonContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  gap: theme.spacing(2),
  marginTop: theme.spacing(6),
}));

export const StyledCancelButton = styled(Button)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.semiBold,
  border: `1px solid ${theme.palette.divider}`,
  color: theme.palette.primary.main,
}));

export const StyledUploadButton = styled(Button)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.semiBold,
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  "&:disabled": {
    backgroundColor: theme.palette.action.disabledBackground,
  },
}));

export const SelectedFileContainer = styled(Box)(({ theme }) => ({
  border: "2px solid #7BF1A7",
  borderRadius: theme.spacing(2),
  padding: theme.spacing(4),
  marginTop: theme.spacing(2),
  position: "relative",
  backgroundColor: "#F0FFF4",
}));

export const CloseIconButton = styled(IconButton)(({ theme }) => ({
  position: "absolute",
  right: "20px",
  top: "50%",
  transform: "translateY(-50%)",
  width: "24px",
  height: "24px",
  color: theme.palette.text.mediumGrey,
  "&:hover": {
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    color: theme.palette.text.primary,
  },
}));

export const FileSizeAndStatusContainer = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: theme.spacing(2.5),
}));

export const FileNameTypography = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.primary,
}));

export const FileSubTitle = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.semiBold,
}));

export const FileSizeTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.light,
}));

// New styled components for restructured layout
export const FileHeaderContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

export const FileIconTypography = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xxl,
}));

export const FileContentContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
}));

export const CheckTypography = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.darkGreen,
  fontWeight: theme.typography.fontWeights.medium,
}));

export const CheckmarkIcon = styled(CheckCircleIcon)(({ theme }) => ({
  width: "18px",
  height: "18px",
  color: "#36BA67",
}));

export const ReadyToUploadContainer = styled(Stack)(({ theme }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: theme.spacing(1),
}));

export const UploadModeContainer = styled(Box)(({ theme }) => ({
  width: "100%",
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(3),
  transition: "all 0.2s ease",
  borderRadius: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
}));

export const UploadModeTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  marginBottom: theme.spacing(2),
  color: theme.palette.text.primary,
}));

export const OptionsWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
  flexWrap: "wrap",
}));

export const WarningContainer = styled(Box)<{ shouldDisplay: boolean }>(
  ({ theme, shouldDisplay }) => ({
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1.5),
    padding: theme.spacing(1.5, 2),
    backgroundColor: "#fcf8da",
    border: `1px solid ${theme.palette.secondary.border}`,
    borderRadius: theme.spacing(2),
    marginTop: theme.spacing(2),
    visibility: shouldDisplay ? "visible" : "hidden",
  })
);

export const WarningImage = styled("img")(({ theme }) => ({
  width: 20,
  height: 20,
  backgroundColor: "transparent",
}));

export const WarningText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xs,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.orange,
}));
