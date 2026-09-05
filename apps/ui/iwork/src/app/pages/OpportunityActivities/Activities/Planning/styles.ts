import {
  Autocomplete,
  Box,
  Chip,
  FormControl,
  styled,
  TextField,
  Typography,
  Select,
  MenuItem,
  Paper,
  Checkbox,
} from "@mui/material";
import { getChipColorFromLabel } from "@ui/ui-lib";

export const MainContainer = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "1fr 2fr",
  gap: 4,
  width: "100%",
  marginTop: theme.spacing(5),
}));

export const StyledPaper = styled(Paper)(({ theme }) => ({
  border: `1px solid ${theme.palette.neutral.lightMedium}`,
  [`& .MuiAutocomplete-noOptions`]: {
    color: theme.palette.neutral.dark,
    backgroundColor: theme.palette.background.paper,
    textAlign: "center",
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.medium,
  },
}));

export const OppFormContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
}));

export const HeaderStyles = styled(Box)(({ theme }) => ({
  display: "grid",
  height: "20px",
  gap: theme.spacing(2),
  gridTemplateColumns: "repeat(3, 1fr)",
  fontWeight: theme.typography.fontWeights.medium,
  fontSize: theme.typography.fontSizes.sm,
}));

export const LabelStyles = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
}));

export const LabelDot = styled(Box, {
  shouldForwardProp: (prop) => prop !== "activity" && prop !== "index",
})(({ theme, activity, index }) => ({
  width: 6,
  height: 6,
  borderRadius: theme.shape.borderRadii.circle,
  backgroundColor: getChipColorFromLabel(activity, index),
  marginLeft: theme.spacing(5),
}));
export const ActivityBox = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: theme.spacing(2),
  alignItems: "start",
  padding: theme.spacing(1, 0),
  ".multi-select": {
    width: "196px",
    height: "28px",
    fontSize: "14px",
  },
  ".MuiSelect-select-MuiInputBase-input-MuiOutlinedInput-input": {
    fontSize: "10px",
  },
  ".MuiInputBase-root.MuiOutlinedInput-root": {
    width: "100%",
    height: "28px",
    paddingLeft: theme.spacing(2),

    ".MuiSvgIcon-root ": {
      width: "16px",
      height: "17px",
    },
  },
  "& .MuiInputBase-input.MuiOutlinedInput-input": {
    padding: "0 !important",
  },
  "&:hover": {
    backgroundColor: theme.palette.background.tableHeader, // update to your desired hover
    "&::before": {
      borderRightColor: theme.palette.background.tableHeader,
    },
  },
  "& .MuiOutlinedInput-root": {
    display: "flex",
    flexWrap: "nowrap",
    overflowX: "hidden",
    textOverflow: "ellipsis",
  },
}));

export const HeadingStyles = styled("h5")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  margin: theme.spacing(0),
  color: theme.palette.primary.main,
}));
export const ButtonStyles = styled("div")(({ theme }) => ({
  display: "flex",
  width: "100%",
  justifyContent: "flex-end",
  marginTop: theme.spacing(5),
}));

export const ActivityLabelStyles = styled("div")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  marginLeft: theme.spacing(6),
}));

export const StagedActivities = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
}));

export const FormComponentStyledCheckbox = styled(Checkbox)(({ theme }) => ({
  color: "#222222",
  "&.Mui-checked": {
    color: "#222222",
  },
}));

export const AutocompleteStyles = styled(Autocomplete)(({ theme }) => ({
  paddingTop: theme.spacing(1),
  borderRadius: theme.shape.borderRadii.medium,
  overflow: "hidden",
  "& .MuiOutlinedInput-root": {
    width: "100% !important",
    display: "flex",
    alignItems: "center",
    border: "none",
    borderRadius: theme.shape.borderRadii.medium,
    flexWrap: "nowrap",
    overflowX: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
  },
  "& .MuiAutocomplete-tag": {
    flexShrink: 0,
  },
  "& .MuiAutocomplete-input": {
    padding: 0,
    margin: 0,
    height: "auto",
  },
  "& .MuiChip-root": {
    height: "22px",
    fontSize: theme.typography.fontSizes.xs,
    borderRadius: theme.shape.borderRadii.medium,
    // minWidth: "80px",
    backgroundColor: theme.palette.background.default,
    "& .MuiSvgIcon-root[data-testid='CancelIcon']": {
      display: "none",
    },
  },
  "& .MuiAutocomplete-inputRoot": {
    padding: 0,
  },
  "&:hover": {
    backgroundColor: "transparent",
    "& .MuiAutocomplete-endAdornment": {
      backgroundColor: theme.palette.background.tableHeader,
    },
  },
}));

export const AutocompleteTypographystyles = styled(TextField)(({ theme }) => ({
  border: "0",
}));

export const NChipStyles = styled(Chip)(({ theme }) => ({
  height: "22px",
  fontSize: "12px",
  padding: theme.spacing(1, 1),
  borderRadius: theme.shape.borderRadii.medium,
  backgroundColor: theme.palette.background.default,
  pointerEvents: "none",
  width: "50px",
}));

export const HeadingIsgStyles = styled("h5")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  margin: theme.spacing(0),
  color: theme.palette.primary.main,
  flex: 1,
  textAlign: "left",
}));

export const RightContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  gap: "16px",
  alignItems: "center",
}));

export const FormSelectField = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
}));

export const ApprovalContainerStyles = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  gap: theme.spacing(8),
}));

export const PlanningMainContainer = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "1fr 2fr",
  gap: 4,
  width: "100%",
  marginTop: theme.spacing(5),
}));

export const FormControlStyles = styled(FormControl)(({ theme }) => ({
  width: "200px",
  height: "40px",
  ".MuiOutlinedInput-root": {
    height: "40px",
    borderRadius: theme.shape.borderRadii.medium,
  },
}));
export const SelectFieldContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
}));
export const SelectFieldStyles = styled(Select)(({ theme }) => ({
  height: "30px",
  backgroundColor: "white",
  border: "none",
  boxShadow: "none",

  "& .MuiOutlinedInput-root": {
    "& fieldset": {
      borderWidth: "1px",
    },
    "&:hover fieldset": {
      borderWidth: "1px",
    },
    "&.Mui-focused fieldset": {
      borderWidth: "1px",
    },
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderWidth: "1px !important",
  },
}));

export const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  position: "sticky",
  top: 0,
  "&:first-of-type": {
    zIndex: 1,
    backgroundColor: "#ffffff",
  },
}));

export const ApprovalFieldsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  gap: theme.spacing(4),
  alignItems: "end",
}));

export const MainContainerStyles = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));
export const SelectFieldTitleStyles = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(1),
}));
export const AutocompleteOption = styled("li")<{ $selected?: boolean }>(
  ({ $selected, theme }) => ({
    backgroundColor: $selected
      ? theme.palette.button.disabled
      : theme.palette.neutral.veryLight,
  })
);

export const StyledSearchTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    padding: "0px",
    "& .MuiOutlinedInput-notchedOutline": {
      border: "none",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      border: "none",
    },
  },
  "& .Mui-focused": {
    boxShadow: "none",
  },
}));
