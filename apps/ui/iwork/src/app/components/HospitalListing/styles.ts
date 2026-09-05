import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Button } from "@ui/ui-lib";
import { TextField } from "@mui/material";

export const Container = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(5),

  ".highlighted-field": {
    display: "flex",
    flexDirection: "column !important",
  },
  ".clickable-cell": {
    cursor: "pointer",
  },
}));

export const ButtonContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: theme.spacing(3),
}));

export const Buttons = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
}));

export const DownloadButton = styled(Button)(({ theme }) => ({
  gap: theme.spacing(1),
  color: theme.palette.text.primary,
  fontWeight: theme.typography.fontWeights.medium,
}));

export const ViewAuditButton = styled(Button)(({ theme }) => ({
  gap: theme.spacing(1),
}));

export const FilterChipsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: "0px",
  marginBottom: theme.spacing(3),
  marginTop: theme.spacing(3),
  border: `1px solid ${theme.palette.grey[300]}`,
  borderRadius: theme.spacing(4),
  width: "fit-content",
  padding: theme.spacing(1),
  backgroundColor: theme.palette.grey[200],
}));

export const FilterChip = styled(Box)<{ isActive: boolean }>(
  ({ theme, isActive }) => ({
    padding: theme.spacing(1, 2),
    cursor: "pointer",
    backgroundColor: isActive
      ? theme.palette.background.paper
      : theme.palette.grey[200],
    color: theme.palette.text.primary,
    fontWeight: isActive
      ? theme.typography.fontWeights.semiBold
      : theme.typography.fontWeights.regular,
    fontSize: theme.typography.fontSizes.sm,
    borderRadius: theme.spacing(3),
    transition: "all 0.2s ease-in-out",
  })
);

export const SearchBarContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  width: "100%",
  backgroundColor: theme.palette.grey[100],
  borderRadius: theme.spacing(2),
}));

export const SearchField = styled(TextField)(({ theme }) => ({
  width: "100%",
  "& .MuiOutlinedInput-root": {
    borderColor: theme.palette.grey[50],
    outline: " none",
    "& fieldset": {
      borderColor: theme.palette.grey[50],
    },
    "&:hover fieldset": {
      borderColor: theme.palette.grey[50],
    },
    "&.Mui-focused fieldset": {
      borderColor: theme.palette.grey[300],
    },
  },
  "& .MuiOutlinedInput-input": {
    padding: theme.spacing(1.5, 2),
  },
}));

export const DrawerContent = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
}));

export const DrawerTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.bold,
  color: theme.palette.primary.main,
}));

export const DrawerSubTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.primary.main,
  marginTop: theme.spacing(0.5),
}));

export const Cards = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(4),
  marginTop: theme.spacing(6),
  paddingBottom: theme.spacing(2),
}));

export const DrawerContentWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  height: "calc(100vh - 80px)", // Subtract header height
  overflow: "hidden",
}));

export const DrawerScrollableContent = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: "auto",
  overflowX: "hidden",
  paddingBottom: theme.spacing(2),
}));

export const DrawerFooter = styled(Box)(({ theme }) => ({
  flexShrink: 0,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: theme.spacing(2, 3),
  backgroundColor: theme.palette.background.paper,
  borderTop: `1px solid ${theme.palette.divider}`,
  zIndex: 10,
}));

export const RecordCount = styled(Box)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.primary,
  fontWeight: theme.typography.fontWeights.regular,
}));

// Filter Section Styles
export const FiltersContainer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[10],
  borderRadius: theme.spacing(2.5),
  border: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(5),
  display: "flex",
  alignItems: "flex-end",
  gap: theme.spacing(5),
  // marginBottom: theme.spacing(7.5),
  paddingBottom: theme.spacing(6), // Extra padding to accommodate error messages
  marginBottom: theme.spacing(6),
}));

export const FiltersContainerSearch = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1.5), // Reduced gap
}));

export const FiltersContainerHeading = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSize.sm,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(0.5),
}));

export const StyledSearchField = styled(TextField)(({ theme }) => ({
  backgroundColor: theme.palette.background.grayVariant,
  borderRadius: theme.spacing(2),
  width: "280px",

  "& .MuiOutlinedInput-root": {
    height: "44px",
    fontSize: "14px",
    backgroundColor: theme.palette.background.grayVariant,

    "& fieldset": {
      border: "none",
    },

    "&:hover fieldset": {
      border: "none",
    },

    "&.Mui-focused": {
      backgroundColor: theme.palette.background.grayVariant,

      "& fieldset": {
        border: "none",
      },
    },
  },

  "& .MuiOutlinedInput-input": {
    padding: "10px 0px",
    fontSize: theme.typography.fontSizes.sm,
    color: theme.palette.text.primary,
  },
  "& .MuiInputAdornment-root": {
    marginRight: theme.spacing(2),

    "& .MuiSvgIcon-root": {
      color: "#9CA3AF",
      fontSize: theme.typography.fontSizes.xl,
    },
  },
}));

export const FiltersContainerForm = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(5),
  width: "80%",
  alignItems: "flex-end",
  "& .MuiGrid-root": {
    columnGap: "30px !important",
  },
  // Make each form control a positioning context
  "& .MuiFormControl-root": {
    position: "relative",
  },
  // Position error messages absolutely - expands downward only
  "& .MuiFormHelperText-root": {
    position: "absolute",
    top: "100%", // Position right below the input field
  },
}));
export const ButtonText = styled("span")(({ theme }) => ({
  marginLeft: theme.spacing(1),
}));

export const SearchButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.background.paleOrange,
  "&:hover": { backgroundColor: theme.palette.background.paleOrange },
}));

export const ClearButton = styled(Button)(({ theme }) => ({
  borderColor: theme.palette.background.paleOrange,
  color: theme.palette.background.paleOrange,
  "&:hover": {
    color: theme.palette.text.primary,
    backgroundColor: theme.palette.background.linenPeach,
  },
}));

export const ClearAllText = styled("span")(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.regular,
}));
