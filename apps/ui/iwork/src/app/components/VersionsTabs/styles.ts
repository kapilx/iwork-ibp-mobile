import { Box, InputBase, styled, Tab, Tabs, Typography } from "@mui/material";

export const TabContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  width: "100%",
  height: "100%",
  position: "relative",

  // Show EditIcon on hover of version tab
  "&:hover img": {
    opacity: 1,
  },
}));

export const VersionTabsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  borderBottom: `1px solid ${theme.palette.neutral.light}`,
}));

export const TabTypography = styled(Typography, {
  shouldForwardProp: (prop) => prop !== "selected",
})<{
  selected?: boolean;
}>(({ theme, selected }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: selected ? theme.palette.button.secondary : theme.palette.text.primary,
  marginRight: theme.spacing(1),
}));

export const CircleIconBlue = styled("img")(({ theme }) => ({
  width: "8px",
  height: "8px",
  alt: "CircleIcon",
  marginRight: theme.spacing(1),
}));

export const AddVersionIcon = styled("img")(({ theme }) => ({
  width: "20px",
  height: "20px",
  alt: "AddIcon",
  marginRight: theme.spacing(1),
}));

export const IconTypography = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.button.secondary,
  marginLeft: theme.spacing(1),
}));

export const DuplicateVersionIcon = styled("img")(({ theme }) => ({
  width: "20px",
  height: "20px",
  alt: "DuplicateIcon",
  marginRight: theme.spacing(1),
}));

export const VersionTab = styled(Tab)(({ theme }) => ({
  minHeight: "48px",
}));

export const VersionInputBase = styled(InputBase)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  width: "120px",
}));

export const EditIcon = styled("img")(({ theme }) => ({
  width: "20px",
  height: "20px",
  alt: "EditIcon",
  cursor: "pointer",
  opacity: 0,
  transition: "opacity 0.3s ease",

}));

export const CoverDetailsWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  gap: theme.spacing(1),
  marginLeft: theme.spacing(4),
  marginRight: theme.spacing(4),
}));

export const CoverTypography = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  color: theme.palette.text.primary,
  fontWeight: theme.typography.fontWeights.medium,
  lineHeight: theme.spacing(5),
}));

export const IconAndTextWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
}));

export const StyledIconButton = styled(Box)`
  flex-grow: 1;
`;

export const StyledTabs = styled(Tabs)(({ theme }) => ({
  "& .MuiTabs-indicator": {
    backgroundColor: theme.palette.button.secondary,
  },
}));
