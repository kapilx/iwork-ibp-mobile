import { Select, TextField } from "@mui/material";
import { styled } from "@mui/material/styles";

export const FieldsStyledTextField = styled(TextField)(
  ({ theme, customStyles }) => ({
    "& .MuiOutlinedInput-root": {
      backgroundColor: theme.palette.background.paper,
      borderRadius: theme.shape.borderRadii.medium,
      border: `${theme.shape.borderSizes.thin} solid ${theme.palette.neutral.lightMedium}`,
      marginTop: theme.spacing(1.25),
      "&:hover .MuiOutlinedInput-notchedOutline": {
        boxShadow: theme.shadows[4],
      },
      "&.Mui-focused": {
        border: `${theme.shape.borderSizes.thin} solid ${theme.palette.button.secondary}`,
        boxShadow: theme.shadows[4],
      },
      "& fieldset": {
        border: "none",
      },
      "&.Mui-error": {
        border: `${theme.shape.borderSizes.thin} solid ${theme.palette.text.error}`,
      },
    },
    "& .MuiOutlinedInput-input": {
      padding: theme.spacing(2.5),
      // ✅ Remove scroll arrows for number inputs
      MozAppearance: "textfield", // Firefox
      "&::-webkit-outer-spin-button": {
        WebkitAppearance: "none",
      },
      "&::-webkit-inner-spin-button": {
        WebkitAppearance: "none",
      },
    },
    "& .MuiInputAdornment-root.start-adornment": {
      color: theme.palette.button.secondary,
      borderRight: `${theme.shape.borderSizes.thin} solid ${theme.palette.neutral.light}`,
      paddingRight: theme.spacing(2),
      display: "flex",
      alignItems: "center",
      marginRight: theme.spacing(0),
      "& p": {
        color: `${theme.palette.button.secondary} !important`,
      },
    },
    "& .MuiInputAdornment-root.end-adornment": {
      color: theme.palette.button.secondary,
      borderLeft: `${theme.shape.borderSizes.thin} solid ${theme.palette.neutral.light}`,
      paddingLeft: theme.spacing(2),
      display: "flex",
      alignItems: "center",
      "& p": {
        color: `${theme.palette.button.secondary} !important`,
      },
    },
    "&& .MuiFormHelperText-root": {
      marginLeft: 0,
      marginRight: 0, // if you also want to reset the right margin
    },
    ...customStyles,
  })
);

export const SelectStyles = styled(Select)(({ theme }) => ({
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
