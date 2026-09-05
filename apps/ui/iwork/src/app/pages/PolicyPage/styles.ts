import { Select } from "@mui/material";
import { styled } from "@mui/material/styles";

export const PolicySelectStyles = styled(Select)(({ theme }) => ({
  borderRadius: theme.shape.borderRadii.medium,
  marginTop: theme.spacing(1),
  border: `${theme.shape.borderSizes.thin} solid ${theme.palette.neutral.lightMedium}`,
  height: theme.spacing(11),
  "& fieldset": {
    borderColor: "transparent !important",
    borderRadius: theme.shape.borderRadii.medium,
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    boxShadow: theme.shadows[4],
  },
  "&.Mui-focused": {
    border: `${theme.shape.borderSizes.thin} solid ${theme.palette.button.secondary} !important`,
    boxShadow: theme.shadows[4],
  },
  "&.Mui-error": {
    border: `${theme.shape.borderSizes.thin} solid ${theme.palette.text.error}`,
  },
  "& .MuiOutlinedInput-input": {
    padding: theme.spacing(2.5),
  },
}));
