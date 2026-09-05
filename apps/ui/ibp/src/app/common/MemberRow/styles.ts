import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

export const MemberSelectionContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
}));

export const MemberSelectionHeader = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "2fr 1fr 2fr",
  alignItems: "center",
  padding: theme.spacing(2, 0),
  borderBottom: `2px solid ${theme.palette.divider}`,
  marginBottom: theme.spacing(1),
}));

export const HeaderText = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.semiBold,
  fontSize: theme.typography.fontSizes.md,
  color: theme.palette.text.secondary,
}));

export const MemberRowContainer = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "2fr 1fr 2fr",
  alignItems: "center",
  padding: theme.spacing(3, 0),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

interface MemberRowContainerProps {
  isActuallyDisabled?: boolean;
}

interface MemberRowWrapperProps {
  isLastRow?: boolean;
}

export const MemberRowWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isLastRow",
})<MemberRowWrapperProps>(({ theme, isLastRow }) => ({
  display: "grid",
  gridTemplateColumns: "2fr 1fr 2fr",
  alignItems: "center",
  padding: theme.spacing(3, 0),
  borderBottom: isLastRow ? "none" : `1px solid ${theme.palette.divider}`,
}));

export const MemberName = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.medium,
  fontSize: theme.typography.fontSizes.lg,
  color: theme.palette.text.tertiary,
}));

export const MemberRelation = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.lg,
  color: theme.palette.text.tertiary,
}));

export const ActionsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(6),
}));

interface ActionBoxProps {
  isActuallyDisabled?: boolean;
  isSelf?: boolean;
}

export const ActionBox = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isActuallyDisabled" && prop !== "isSelf",
})<ActionBoxProps>(({ theme, isActuallyDisabled, isSelf }) => ({
  position: "relative",
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  cursor: (isActuallyDisabled || isSelf) ? "not-allowed" : "pointer",
  opacity: (isActuallyDisabled || isSelf) ? 0.6 : 1,
}));

interface ActionTextProps {
  covered?: boolean;
  isNotCover?: boolean;
}

export const ActionText = styled(Typography, {
  shouldForwardProp: (prop) => prop !== "covered" && prop !== "isNotCover",
})<ActionTextProps>(({ theme, covered, isNotCover }) => ({
  fontSize: theme.typography.fontSizes.md,
  color: covered 
    ? theme.palette.success.main 
    : isNotCover 
      ? theme.palette.error.main 
      : theme.palette.text.disabled,
  fontWeight: (covered || isNotCover) ? theme.typography.fontWeights.semiBold : theme.typography.fontWeights.regular,
}));

export const NotCoverIcon = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "20px",
  height: "20px",
  borderRadius: "50%",
  backgroundColor: theme.palette.error.main,
  color: theme.palette.common.white,
}));

export const CelebrationContainer = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: "0",
  left: "0",
  width: "20px",
  height: "20px",
}));

export const RibbonContainer = styled(Box)(({ theme }) => ({
  position: "absolute",
  width: 40,
  height: 40,
  pointerEvents: "none",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
}));