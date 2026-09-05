import { styled } from "@mui/material/styles";
import { Box, Popover, Typography } from "@mui/material";

export const PopoverContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(5, 4),
  width: 600,
  boxShadow: theme.shadows[15],
}));

export const NoticeHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  marginBottom: theme.spacing(1),
  gap: theme.spacing(2.5),
}));

export const AlertIcon = styled("img")(({ theme }) => ({
  width: 18,
  height: 20,
}));

export const CrossIcon = styled("img")(({ theme }) => ({
  width: 18,
  height: 20,
  position: "absolute",
  right: 10,
  top: 10,
  cursor: "pointer",
}));

export const NoticeTitle = styled(Typography)<{ heading?: string }>(
  ({ theme, heading }) => ({
    fontWeight: heading === "create" ? theme.typography.fontWeights.semiBold : theme.typography.fontWeights.medium,
    fontSize: theme.typography.fontSizes.sm,
    color:
      heading === "create"
        ? theme.palette.neutral.dark
        : theme.palette.background.paleOrange,
  })
);

export const NoticeContent = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.medium,
  fontSize: theme.typography.fontSizes.sm,
}));

export const CustomDivider = styled(Box)(({ theme }) => ({
  height: 1,
  backgroundColor: theme.palette.divider,
  margin: theme.spacing(4, 0),
}));

export const NoticePoints = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
  margin: theme.spacing(3,0),
}));

export const NoticePoint = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  fontWeight: theme.typography.fontWeights.medium,
  fontSize: theme.typography.fontSizes.sm,
}));

export const ClaimsLink = styled("a", {
  shouldForwardProp: (prop) => prop !== "ref", // ✅ allow ref to pass
})(({ theme }) => ({
  textDecoration: "none",
  color: theme.palette.secondary.selected,
  fontWeight: theme.typography.fontWeights.medium,
  fontSize: theme.typography.fontSizes.sm,
  cursor: "pointer",
}));

export const MUIPopover = styled(Popover)(({ theme }) => ({
  marginTop: theme.spacing(2),
}));

export const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.semiBold,
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.neutral.dark,
  marginTop: theme.spacing(3),
}));

export const SectionDescription = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.primary,
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(2),
  lineHeight: 1.5,
}));

export const OptionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.semiBold,
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.neutral.dark,
  marginTop: theme.spacing(3),
}));

export const ButtonContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
  marginTop: theme.spacing(4),
}));
