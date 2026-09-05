import {
  InputLabel,
  Select,
  Button,
  TextField,
  Typography,
  Box,
  FormHelperText,
  Paper,
  Popper,
  Checkbox,
  IconButton,
  Radio,
  FormLabel,
  LinearProgress,
} from "@mui/material";
import DatePicker from "../../DatePicker";
import DateTimePicker from "../../DateTimePicker";
import Autocomplete from "@mui/material/Autocomplete";
import { styled } from "@mui/material/styles";
import "react-quill/dist/quill.snow.css";
import FormControl from "@mui/material/FormControl";
import ChipRenderer from "../../Chip";
import TimePicker from "../../TimePicker";
import React from "react";
import { FileFieldVariant, FileFieldVariantProps } from "../types";

export const StyledAutocomplete = styled(Autocomplete)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    minHeight: "42px",
    borderRadius: theme.shape.borderRadii.medium,
    marginTop: theme.spacing(1),
    border: `${theme.shape.borderSizes.thin} solid ${theme.palette.neutral.lightMedium}`,
    paddingRight: "32px", // space for dropdown icon
    paddingBottom: "9px",
    paddingTop: "9px",
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
  },

  "& .MuiOutlinedInput-input": {
    padding: theme.spacing(2.5),
  },
}));

export const EllipsisOption = styled("span")(({ theme }) => ({
  whiteSpace: "normal",
  wordBreak: "break-word",
}));
export const RichTextContainer = styled("div")(({ theme }) => ({
  borderRadius: theme.shape.borderRadii.medium,
  backgroundColor: theme.palette.background.paper,
  width: "100%",
  margin: theme.spacing(2.5, 0),
  padding: theme.spacing(2.5),
}));

export const RichTextLabel = styled("div")(({ theme }) => ({
  marginBottom: theme.spacing(2),
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
}));

export const StyledQuillEditorWrapper = styled("div")(({ theme }) => ({
  border: `${theme.shape.borderSizes.thin} solid ${theme.palette.neutral.lightMedium}`,
  borderRadius: theme.shape.borderRadii.medium,
  padding: theme.spacing(2),
  backgroundColor: theme.palette.neutral.veryLight,
  display: "flex",
  flexDirection: "column",

  "&& .ql-toolbar.ql-snow .ql-formats": {
    marginRight: 0,
  },

  ".editor-container": {
    display: "flex",
    flexDirection: "column-reverse", // 👈 reverse the order
  },

  ".ql-toolbar": {
    backgroundColor: theme.palette.background.tableHeader,
    borderRadius: `${theme.shape.borderRadii.small}`,
    border: "none",
    marginRight: theme.spacing(0),
    columnGap: theme.spacing(1),
    display: "flex",
  },
  ".ql-container": {
    border: "none",
    fontSize: theme.typography.fontSizes.sm,
    borderRadius: `0 0 ${theme.shape.borderRadii.medium} ${theme.shape.borderRadii.medium}`,
  },
  ".ql-editor": {
    padding: theme.spacing(3),
    wordWrap: "unset",
    wordBreak: "break-all",
  },
  ".quill": {
    display: "flex",
    flexDirection: "column-reverse", // 👈 reverse the order
  },
  ".ql-formats": {
    paddingRight: theme.spacing(0),
    paddignLeft: theme.spacing(2.5),
    borderRight: `${theme.shape.borderSizes.thin} solid ${theme.palette.neutral.light}`,
    margin: theme.spacing(0),
    marginRight: 0, // Explicitly remove margin-right
  },
  ".ql-toolbar button": {
    background: "transparent",
    borderRadius: theme.shape.borderRadii.medium,
    transition: "background-color 0.3s",

    "&:hover, &:focus, &:active": {
      backgroundColor: theme.palette.background.lightBlueActive, // light blue background on hover/focus/active
      width: "25",
      height: "25",
      borderRadius: theme.shape.borderRadii.medium,
    },

    "&.ql-active": {
      backgroundColor: theme.palette.background.lightBlueActive, // slightly darker when the button is active (e.g., for bold already applied)
    },
  },
}));

export interface SelectStylesProps extends SelectProps {
  customStyles?: React.CSSProperties;
}

export const DynamicFormSelectStyles = styled(Select)<SelectStylesProps>(
  ({ theme, customStyles }) => ({
    height: "42px",
    borderRadius: theme.shape.borderRadii.medium,
    marginTop: theme.spacing(1),
    border: `${theme.shape.borderSizes.thin} solid ${theme.palette.neutral.lightMedium}`,
    width: "100%",

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
    ...customStyles, // <-- allow custom style overrides
  })
);

export const SelectFieldLabel = styled(InputLabel)(({ theme }) => ({
  top: "-7px !important",
  pointerEvents: "none",
  "&.MuiInputLabel-shrink": {
    transform: "translate(14px, 0px) scale(0.75)",
  },
  "&.Mui-error": {
    color: `${theme.palette.text.error} !important`,
  },
}));

export const StyledDatePickerWrapper = styled(DatePicker)<{ error?: boolean }>(
  ({ theme, error }) => ({
    width: "100%",
    minWidth: "0 !important",
    "& .MuiInputBase-input.MuiOutlinedInput-input": {
      padding: theme.spacing(2.5),
      height: "21px",
    },
    "& .MuiInputBase-root.MuiOutlinedInput-root": {
      borderRadius: theme.shape.borderRadii.medium,
      border: error ? `1px solid ${theme.palette.error.main}` : undefined,
      lineHeight: "unset",

      "&:hover .MuiOutlinedInput-notchedOutline": {
        border: error ? "none" : undefined,
      },

      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
        border: error
          ? "none"
          : `${theme.shape.borderSizes.thin} solid ${theme.palette.button.secondary}`,
      },
    },
    padding: theme.spacing(0),
    "& .MuiButtonBase-root.MuiIconButton-root": {
      paddingTop: theme.spacing(1),
      paddingBottom: theme.spacing(1),
    },
  })
);

export const StyledDateTimePickerWrapper = styled(DateTimePicker)<{
  error?: boolean;
}>(({ theme, error }) => ({
  width: "100%",
  minWidth: "0 !important",
  "& .MuiInputBase-input.MuiOutlinedInput-input": {
    padding: theme.spacing(2.5),
    height: "21px",
    fontSize: theme.typography.fontSize.sm,
  },
  "& .MuiInputBase-root.MuiOutlinedInput-root": {
    borderRadius: theme.shape.borderRadii.medium,
    border: error
      ? `${theme.shape.borderSizes.thin} solid ${theme.palette.text.error}`
      : `${theme.shape.borderSizes.thin} solid ${theme.palette.neutral.lightMedium}`,
    lineHeight: "unset",
    marginTop: theme.spacing(1),

    "&:hover .MuiOutlinedInput-notchedOutline": {
      border: "none",
      boxShadow: theme.shadows[4],
    },

    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      border: "none",
    },

    "&.Mui-focused": {
      border: `${theme.shape.borderSizes.thin} solid ${theme.palette.button.secondary} !important`,
      boxShadow: theme.shadows[4],
    },

    "&.Mui-error": {
      border: `${theme.shape.borderSizes.thin} solid ${theme.palette.text.error}`,
    },

    "& fieldset": {
      borderColor: "transparent !important",
    },
  },
  padding: theme.spacing(0),
  "& .MuiButtonBase-root.MuiIconButton-root": {
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    color: theme.palette.button.secondary,
  },
  // Time picker specific styling
  "& .MuiPickersLayout-root .MuiClock-root": {
    "& .MuiClockNumber-root": {
      fontSize: theme.typography.fontSizes.xs,
      fontFamily: theme.typography.fontFamily,
    },
    "& .MuiClockPointer-root": {
      "& .MuiClockPointer-thumb": {
        fontSize: theme.typography.fontSizes.xs,
      },
    },
  },
  "& .MuiPickersLayout-root .MuiMultiSectionDigitalClock-root": {
    "& .MuiMenuItem-root": {
      fontSize: theme.typography.fontSizes.xs,
      fontFamily: theme.typography.fontFamily,
    },
  },
  "& .MuiPickersDay-root": {
    fontSize: theme.typography.fontSizes.xs,
    fontFamily: theme.typography.fontFamily,
  },
  // Additional time picker elements
  "& .MuiTimeClock-root": {
    "& .MuiClockNumber-root": {
      fontSize: `${theme.typography.fontSizes.sm} !important`,
      fontFamily: theme.typography.fontFamily,
    },
  },
  "& .MuiDigitalClock-root": {
    "& .MuiMenuItem-root": {
      fontSize: `${theme.typography.fontSizes.xs} !important`,
      fontFamily: theme.typography.fontFamily,
    },
  },
}));

export const TimePickerWrapperStyles = styled(TimePicker)(({ theme }) => ({
  width: "100%",
  minWidth: "0 !important",
  "& .MuiInputBase-input.MuiOutlinedInput-input": {
    padding: theme.spacing(2.5),
    height: "21px",
    order: 1,
  },
  "& .MuiInputBase-root.MuiOutlinedInput-root": {
    borderRadius: theme.shape.borderRadii.medium,
    lineHeight: "unset",
    order: 0,
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      border: `${theme.shape.borderSizes.thin} solid ${theme.palette.button.secondary} `,
    },
  },
  padding: theme.spacing(0),
}));

export const FormFieldStyledButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.primary.dark,
  borderRadius: theme.shape.borderRadii.small,
  "&:hover": {
    backgroundColor: theme.palette.primary.main,
  },
}));

export const StyledTextField = styled(TextField)(
  ({ theme, customStyles, componentStyles }) => ({
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
    "& input[type='password']::-ms-reveal, & input[type='password']::-ms-clear":
      {
        display: "none",
      },
    ...customStyles,
    ...componentStyles,
  })
);

export const StyledTextAreaField = styled(TextField)(({ theme }) => ({
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
    padding: theme.spacing(1.5),
  },
  "& .MuiInputBase-root": {
    padding: "0px",
  },
  "&& .MuiFormHelperText-root": {
    marginLeft: 0,
    marginRight: 0,
  },
}));

export const StyledTypography = styled(Typography, {
  shouldForwardProp: (prop: string) => prop !== "error",
})<{ error?: boolean }>(({ theme, error }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
  color: error
    ? `${theme.palette.text.error} !important`
    : `${theme.palette.text.labelColor} !important`,
}));

// Secondary line under a field label (FormFieldConfig.subLabel) — qualifies
// what the field means, e.g. which date column a From/To pair filters on.
export const StyledSubLabel = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xs,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.primary,
}));

export const AutocompleteStyles = styled(Autocomplete)(({ theme }) => ({
  borderRadius: theme.shape.borderRadii.medium,
  marginTop: theme.spacing(1.25),
  // MUI only reveals the clear "X" on hover/focus (its own rule injects
  // visibility:hidden); keep it visible whenever a value is selected so
  // clearing a pick (e.g. the toolbar Company filter) is discoverable. The
  // doubled ampersand out-specifies MUI's built-in rule. MUI renders the
  // indicator only when a value exists, so this never shows an X on empty
  // fields.
  "&& .MuiAutocomplete-clearIndicator": {
    visibility: "visible",
  },
  // Room for both the clear "X" and the dropdown arrow (the 32px default
  // fits only one icon, clipping the X).
  "& .MuiOutlinedInput-root.MuiInputBase-adornedEnd": {
    paddingRight: "56px",
  },
  "& fieldset": {
    border: "none",
  },
  "& .MuiOutlinedInput-root": {
    height: "42px",
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: theme.spacing(2),
    paddingRight: "32px",
    border: `${theme.shape.borderSizes.thin} solid ${theme.palette.neutral.lightMedium}`,
    borderRadius: theme.shape.borderRadii.medium,
  },
  "& .MuiOutlinedInput-root .MuiAutocomplete-input": {
    padding: `0 ${theme.spacing(1)}px`,
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    boxShadow: theme.shadows[4],
  },
  "&.Mui-error": {
    border: `${theme.shape.borderSizes.thin} solid ${theme.palette.text.error}`,
  },
  "&& .MuiFormHelperText-root": {
    marginLeft: theme.spacing(0),
    marginRight: theme.spacing(0),
    marginTop: theme.spacing(0.75),
    fontSize: theme.typography.fontSizes.xs,
    lineHeight: 1.66,
  },
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

export const CustomRadioLabel = styled("label")(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  cursor: "pointer",
  position: "relative",
  userSelect: "none",
  gap: theme.spacing(1),
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
  lineHeight: "26px",
  textAlign: "left",
}));

export const HiddenRadioInput = styled("input")({
  position: "absolute",
  opacity: 0,
  cursor: "pointer",
});

export const Checkmark = styled("span")(({ theme }) => ({
  position: "relative",
  top: 0,
  left: 0,
  height: "18px",
  width: "18px",
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadii.circle,
  border: `${theme.shape.borderSizes.thin} solid ${theme.palette.grey[500]}`,
  transition: "all 0.3s",
  cursor: "pointer",

  // Here is the important part:
  [`input[type="radio"]:checked + &`]: {
    borderColor: theme.palette.primary.main,
  },

  [`input[type="radio"]:checked + &::before`]: {
    content: '""',
    position: "absolute",
    top: "-2px",
    right: "-2px",
    width: "8px",
    height: "10px",
    backgroundColor: theme.palette.background.paper,
  },

  [`input[type="radio"]:checked + &::after`]: {
    content: '""',
    position: "absolute",
    display: "block",
    left: "7px",
    top: "-2px",
    width: "6px",
    height: "12px",
    border: `${theme.shape.borderSizes.thin} solid ${theme.palette.primary.main}`,
    borderWidth: "0 1px 1px 0",
    transform: "rotate(45deg)",
  },
}));

export const imageStyles = styled("img")({
  width: "18px",
  height: "18px",
});
export const MaxLengthStyles = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  fontSize: theme.typography.fontSizes.xs,
  color: theme.palette.neutral.lightMedium,
  marginTop: theme.spacing(1),
}));

export const FormComponentWrapper = styled(Box)<{ customVariant?: string }>(
  ({ theme, customVariant }) => ({
    display: "flex",
    border: `${theme.shape.borderSizes.thin} solid ${theme.palette.neutral.lightMedium}`,
    borderRadius: theme.shape.borderRadii.medium,
    width: customVariant === "primary" ? undefined : "400px",
    marginTop: theme.spacing(1),
    minHeight: "40px",
  })
);

export const SegmentedControlContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== "inlineLabel",
})<{ inlineLabel?: boolean }>(({ theme, inlineLabel }) => ({
  display: "flex",
  flexDirection: inlineLabel ? "row" : "column",
  ...(inlineLabel
    ? {
        alignItems: "center",
        gap: theme.spacing(2),
        marignTop: theme.spacing(5),
      }
    : {}),
}));

export const SegmentedControlLabel = styled(StyledTypography, {
  shouldForwardProp: (prop) =>
    prop !== "inlineLabel" &&
    prop !== "labelMinWidth" &&
    prop !== "labelCustomStyles",
})<{
  inlineLabel?: boolean;
  labelMinWidth?: number | string;
  labelCustomStyles?: React.CSSProperties;
}>(({ inlineLabel, labelMinWidth = 140, labelCustomStyles }) => ({
  ...(inlineLabel
    ? {
        minWidth: labelMinWidth,
        marginBottom: 0,
      }
    : {}),
  ...(labelCustomStyles || {}),
}));

export const SegmentedControlFormWrapper = styled(FormComponentWrapper, {
  shouldForwardProp: (prop) =>
    prop !== "inlineLabel" && prop !== "wrapSegments",
})<{ inlineLabel?: boolean; wrapSegments?: boolean }>(
  ({ inlineLabel, wrapSegments }) => ({
    ...(inlineLabel
      ? {
          flex: 1,
          marginTop: 0,
        }
      : {}),
    ...(wrapSegments
      ? { flexWrap: "wrap" as const, overflow: "hidden" as const }
      : {}),
  })
);

export const Segment = styled(Box, {
  shouldForwardProp: (prop) =>
    prop !== "isSelected" && prop !== "disabled" && prop !== "wrapSegments",
})<{
  isSelected: boolean;
  disabled?: boolean;
  customVariant?: string;
  disableHover: boolean;
  wrapSegments?: boolean;
}>(({
  theme,
  isSelected,
  disabled,
  customVariant,
  disableHover = false,
  wrapSegments = false,
}) => ({
  flex: 1,
  padding:
    customVariant === "primary"
      ? theme.spacing(2.25, 0)
      : theme.spacing(2.5, 0),
  textAlign: "center",
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.primary,
  backgroundColor: isSelected
    ? theme.palette.background.selectedSegment
    : theme.palette.background.paper,
  borderRight: `${theme.shape.borderSizes.thin} solid ${theme.palette.neutral.lightMedium}`,
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.5 : 1,
  "&:first-child": {
    borderRadius: `${theme.shape.borderRadii.medium} 0 0 ${theme.shape.borderRadii.medium}`,
  },
  "&:last-child": {
    borderRight: "none",
    borderRadius: `0 ${theme.shape.borderRadii.medium} ${theme.shape.borderRadii.medium} 0`,
  },
  "&:hover": disableHover
    ? {}
    : {
        backgroundColor:
          !disabled && !isSelected
            ? theme.palette.background.selectedSegment
            : undefined,
      },
  // Declared last so these win over the single-row :first-child / :last-child
  // rules above. The wrapper clips the outer corners, so the only positional
  // concern left is where each segment's divider goes.
  ...(wrapSegments
    ? {
        flex: "0 0 50%",
        maxWidth: "50%",
        "&:first-child, &:last-child": {
          borderRadius: 0,
        },
        // Every second segment closes a row, so it drops the side divider; from
        // the second row on, the divider moves to the top edge instead.
        "&:nth-of-type(2n)": {
          borderRight: "none",
        },
        "&:nth-of-type(n+3)": {
          borderTop: `${theme.shape.borderSizes.thin} solid ${theme.palette.neutral.lightMedium}`,
        },
      }
    : {}),
}));

interface StyledFormContainerProps {
  customStyles?: React.CSSProperties;
}

export const StyledFormContainer = styled(Box)<StyledFormContainerProps>(
  ({ theme, customStyles }) => ({
    width: "100%",
    ...customStyles,
  })
);

// export const UploadDropZone = styled("div")(({ theme }) => ({
//   display: "flex",
//   flexDirection: "row",
//   alignItems: "center",
//   justifyContent: "center",
//   border: `${theme.shape.borderSizes.thin} dashed #FF7104`,
//   borderRadius: theme.shape.borderRadii.medium,
//   textAlign: "center",
//   padding: theme.spacing(3, 7.5),
//   cursor: "pointer",
//   backgroundColor: "#FFF7F0",
//   maxHeight: theme.spacing(10.5),
//   "&:hover": {
//     backgroundColor: theme.palette.background.paper,
//   },
// }));
export const UploadDropZone = styled("div")<FileFieldVariant>(
  ({ theme, customVariant = "default" }) => {
    let borderStyle: string;
    let bgColor: string;
    let paddingStyle: string;
    let maxHeight: string | undefined;
    let width: string | undefined;
    let height: string | undefined;

    switch (customVariant) {
      case "primary":
        paddingStyle = theme.spacing(3);
        height = "190px";
        break;
      case "secondary":
        paddingStyle = theme.spacing(3);
        height = "60px";
        break;
      case "info":
        paddingStyle = theme.spacing(3);
        height = "250px";
        break;
      case "ternary":
        paddingStyle = theme.spacing(3, 7.5);
        height = "150px";
        width = "100%";
        break;
      default:
        paddingStyle = theme.spacing(3, 7.5);
        // height = "250px";
        maxHeight = theme.spacing(10.5);
    }

    return {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      border: borderStyle
        ? borderStyle
        : `${theme.shape.borderSizes.thin} dashed ${theme.palette.chips.senary}`,
      borderRadius: theme.shape.borderRadii.medium,
      textAlign: "center",
      padding: paddingStyle,
      cursor: "pointer",
      backgroundColor: bgColor ? bgColor : theme.palette.background.uploadFile,
      transition: "background-color 0.3s ease",
      maxHeight,
      width: width,
      height: height,
      "&:hover": {
        backgroundColor: theme.palette.background.paper,
      },
    };
  }
);

export const UploadFormControl = styled(FormControl, {
  shouldForwardProp: (prop) => prop !== "disabled",
})<{
  disabled?: boolean;
}>(({ theme, disabled }) => ({
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.5 : 1,
  pointerEvents: disabled ? "none" : "auto", // optional: prevents interaction
}));

export const UploadIcon = styled("img")<{ customVariant: FileFieldVariant }>(
  ({ theme, customVariant = "default" }) => {
    let width: string | undefined;
    let height: string | undefined;

    switch (customVariant) {
      case "info":
        width = "80px";
        height = "100px";
        break;
      case "endorsementDoc":
        width = "48px";
        height = "60px";
        break;
    }

    return {
      width: width,
      height: height,
      margin: theme.spacing(0, 2.5),
    };
  }
);

export const UploadTitle = styled("div")(({ theme }) => ({
  color: theme.palette.text.primary,
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  lineHeight: theme.spacing(5),
  marginBottom: theme.spacing(2.5),
}));

export const StyledSpan = styled("span")<FileFieldVariant>(
  ({ theme, customVariant }) => ({
    "&&": {
      color: customVariant === "primary" && theme.palette.chips.senary,
    },
  })
);

export const UploadInstruction = styled("div")<FileFieldVariant>(
  ({ theme, customVariant = "default" }) => {
    let lineHeight: string | undefined;
    let marginTop: string | undefined;
    let textAlign: string | undefined;

    switch (customVariant) {
      case "info":
        lineHeight = "15px";
        marginTop = theme.spacing(2);
        textAlign = "left";
        break;
      default:
        lineHeight = "20px";
    }

    return {
      color: theme.palette.text.primary,
      fontSize: theme.typography.fontSizes.xss,
      fontWeight: theme.typography.fontWeights.regular,
      lineHeight: lineHeight,
      marginTop: marginTop,
      textAlign: textAlign,

      span: {
        color: theme.palette.secondary.selected,
        cursor: "pointer",
      },
    };
  }
);

export const DisclaimerMessage = styled("p")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xxxs,
  textAlign: "left",
}));

export const UploadedFileNameContainer = styled("div")(({ theme }) => ({
  margin: theme.spacing(2),
}));

export const UploadFileTitle = styled("span")(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.bold,
  marginRight: theme.spacing(1.25),
}));

// Container for uploaded file section
export const UploadedFileContainer = styled("div")(({ theme }) => ({
  marginTop: theme.spacing(2),
}));

// Styled heading
export const UploadedFileTitle = styled("strong")(({ theme }) => ({
  display: "block",
  marginBottom: theme.spacing(1),
  color: theme.palette.text.primary,
}));

// File list (unstyled list)
export const UploadedFileList = styled("ul")(({ theme }) => ({
  listStyle: "none",
  padding: 0,
  margin: 0,
}));

// List item
export const UploadedFileItem = styled("li")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.25),
}));

export const StyledFileUploadTypography = styled(Typography, {
  shouldForwardProp: (prop: string) => prop !== "error",
})<{ error?: boolean }>(({ theme, error }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.neutral.dark,
  // color:theme.palette.text.
  marginBottom: theme.spacing(1),
}));

export const StyledHelperText = styled(FormHelperText)(({ theme }) => ({
  marginLeft: theme.spacing(0),
}));
export const StyledRichTextContainer = styled(Box)(({ theme }) => ({}));
export const StyledTextAreaContainer = styled(Box)(({ theme }) => ({
  width: "100%",
}));

export const StyledPlaceholder = styled("span")(({ theme }) => ({
  color: theme.palette.neutral.placeholderColor,
}));
export const ChipContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "nowrap",
  gap: theme.spacing(0.5),
}));

export const CustomChipRendererStyles = styled(ChipRenderer)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  borderRadius: theme.shape.borderRadii.medium,
  marginRight: theme.spacing(2),
  minWidth: "80px",
}));

export const StyledTitle = styled(Typography)<{ isBold?: boolean; fontSize?: string }>(
  ({ theme, isBold, fontSize }) => ({
    fontSize: fontSize
      ? (theme.typography.fontSizes as Record<string, string>)[fontSize] ?? fontSize
      : theme.typography.fontSizes.sm,
    fontWeight: isBold
      ? theme.typography.fontWeights.bold
      : theme.typography.fontWeights.light,
    color: theme.palette.neutral.dark,
  })
);

export const StyledReadOnlyRichText = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isDisabled" && prop !== "hasText",
})<{
  isDisabled: boolean;
  hasText: boolean;
}>(({ theme, isDisabled, hasText }) => ({
  minHeight: "100px",
  border: ` ${theme.shape.borderSizes.hairline} solid ${theme.palette.neutral.medium}`,
  borderRadius: theme.shape.borderRadii.medium,
  padding: theme.spacing(2.5),
  cursor: isDisabled ? "not-allowed" : "text",
  color: theme.palette.text.primary,
  backgroundColor: `${theme.palette.neutral.veryLight}`,
  wordBreak: "break-all",
  "& p": {
    margin: 0,
    fontSize: theme.typography.fontSizes.sm,
    color: theme.palette.text.primary,
  },
  "& span": {
    color: "unset",
    fontSize: theme.typography.fontSizes.sm,
    wordBreak: "break-all",
  },
}));

export const CombinedDatePickerWrapper = styled(DatePicker)(({ theme }) => ({
  width: "100%",

  "& .MuiInputBase-input.MuiOutlinedInput-input": {
    padding: theme.spacing(0),
    paddingLeft: theme.spacing(1.2),
  },

  "& .MuiOutlinedInput-root": {
    "& fieldset": {
      border: "none",
      order: 0,
    },
  },
  "& .MuiInputBase-input": {
    order: 1,
  },
  "& .MuiInputBase-root.MuiOutlinedInput-root": {
    lineHeight: "unset",
    alignItems: "center",
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      border: "none",
    },
  },
  padding: theme.spacing(0),
  "& .MuiButtonBase-root.MuiIconButton-root": {
    paddingLeft: theme.spacing(0),
    paddingRight: theme.spacing(0),
    marginRight: theme.spacing(0),

    "&:hover": {
      backgroundColor: "transparent",
    },
  },
}));

export const StyledPickerBox = styled(Box)<{ error?: boolean }>(
  ({ theme, error }) => ({
    display: "flex",
    height: "41px",
    width: "100%",
    alignItems: "center",
    justifyContent: "space-between",
    border: error
      ? `1px solid ${theme.palette.error.main}`
      : `${theme.shape.borderSizes.thin} solid ${theme.palette.neutral.lightMedium}`,
    borderRadius: theme.shape.borderRadii.medium,
  })
);

export const CombinedDivider = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  height: theme.spacing(5),
  width: "1px",
  backgroundColor: theme.palette.grey[500],
}));

export const StyledPickerLabelContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  marginBottom: theme.spacing(0.5),
}));

export const StyledLabelTypography = styled(Typography, {
  shouldForwardProp: (prop) => prop !== "isDisabled" && prop !== "error",
})<{
  isDisabled?: boolean;
  error?: boolean;
}>(({ theme, isDisabled, error }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
  width: "50%",
  color: error
    ? theme.palette.text.error
    : isDisabled
    ? theme.palette.text.disabled
    : theme.palette.text.labelColor,
}));

export const StyledLinearProgress = styled(LinearProgress)(({ theme }) => ({
  marginBottom: "10px",
}));

export const StyledPickerFormController = styled(FormControl)(() => ({
  "& .MuiStack-root": {
    overflow: "hidden",
    paddingTop: "0px",
  },
}));

export const CombinedTimePickerWrapper = styled(TimePicker, {
  shouldForwardProp: (prop) => prop !== "isDisabled",
})<{
  isDisabled?: boolean;
}>(({ theme, isDisabled }) => ({
  width: "100%",
  minWidth: "0 !important",
  pointerEvents: isDisabled ? "none" : "auto",
  opacity: isDisabled ? 0.6 : 1,
  cursor: isDisabled ? "not-allowed" : "auto",
  "& .MuiInputBase-input.MuiOutlinedInput-input": {
    padding: theme.spacing(0),
    paddingLeft: theme.spacing(1.2),
  },
  "& .MuiOutlinedInput-root": {
    "& fieldset": {
      border: "none",
      order: 0,
    },
  },
  "& .MuiInputBase-input": {
    order: 1,
  },
  "& .MuiInputBase-root.MuiOutlinedInput-root": {
    lineHeight: "unset",
    alignItems: "center",
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      border: "none",
    },
  },
  padding: theme.spacing(0),
  "& .MuiButtonBase-root.MuiIconButton-root": {
    paddingLeft: theme.spacing(0),
    paddingRight: theme.spacing(0),
    marginRight: theme.spacing(0),
    "&:hover": {
      backgroundColor: "transparent",
    },
  },
}));

// For Document Upload Field
export const MainContainer = styled(Box)<{ customVariant?: string }>(
  ({ theme, customVariant }) => ({
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(2),
    maxWidth: "860px",
    marginBottom: theme.spacing(0),
    marginTop: customVariant === "endorsementDoc" ? 0 : theme.spacing(5),
    border:
      customVariant === "endorsementDoc"
        ? "none"
        : `${theme.shape.borderSizes.thin} solid ${theme.palette.neutral.tableBorder}`,
    borderRadius:
      customVariant === "endorsementDoc"
        ? "none"
        : theme.shape.borderRadii.medium,
    padding: customVariant === "endorsementDoc" ? "none" : theme.spacing(5),
    alignSelf: "stretch",
    flexGrow: 0,
    backgroundColor: theme.palette.background.paper,
    boxShadow: customVariant === "endorsementDoc" ? "none" : theme.shadows[7],
  })
);

export const StyledSelectBox = styled(Box)(({ theme }) => ({
  width: "200px",
}));

export const DocumentsTypography = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.primary,
}));

export const DocumentUploadSection = styled(Box)<{ customVariant?: string }>(
  ({ theme, customVariant }) => ({
    display: "flex",
    gap: theme.spacing(7.5),
    alignItems: "center",
    marginTop: customVariant === "endorsementDoc" ? "none" : theme.spacing(4),
  })
);

export const FileBox = styled(Box)<FileFieldVariantProps>(
  ({ theme, customVariant = "default", hideDropdown }) => {
    let maxWidth: string | undefined = "570px";

    switch (customVariant) {
      case "ternary":
        maxWidth = "100%";
        break;
      case "endorsementDoc":
        maxWidth = "100%";
        break;
      default:
        maxWidth = "570px";
        break;
    }

    return {
      width: "100%",
      maxWidth: hideDropdown
        ? customVariant === "endorsementDoc"
          ? maxWidth
          : "100%"
        : maxWidth,
      marginTop:
        customVariant === "endorsementDoc"
          ? theme.spacing(0)
          : theme.spacing(5.5),
    };
  }
);

export const SelectBox = styled(Box)(({ theme }) => ({
  display: "flex",
  width: "200px",
  alignItems: "center",
  justifyContent: "space-between",
  border: `1px solid ${theme.palette.grey[400]}`,
  borderRadius: 6,
  padding: theme.spacing(1, 3.5),
  minHeight: 42,
  cursor: "pointer",
  backgroundColor: theme.palette.background.paper,
  "&:hover": {
    borderColor: theme.palette.primary.main,
  },
}));

export const SelectedText = styled(Box)(({ theme }) => ({
  color: theme.palette.text.secondary,
  overflowX: "auto",
  whiteSpace: "nowrap",
  flex: 1,
  marginRight: theme.spacing(1),
}));

export const TreeViewWrapper = styled(Box)(({ theme }) => ({
  "& .MuiRichTreeView-itemLabel": {
    paddingTop: 6,
    paddingBottom: 6,
    margin: 1,
  },
  "& .MuiRichTreeView-itemContent:hover": {
    backgroundColor: theme.palette.action.hover,
    borderRadius: theme.shape.borderRadius,
  },
  "& .MuiRichTreeView-itemIconContainer": {
    padding: 10,
  },
}));

export const LabelWrapper = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
});

export const StyledFormControl = styled(FormControl)({
  marginTop: 3,
  width: "100%",
});

export const PopperPaper = styled(StyledPaper)(({ theme }) => ({
  marginTop: theme.spacing(1),
  maxHeight: 300,
  overflow: "auto",
  padding: theme.spacing(1),
}));

export const StyledPopper = styled(Popper)(({ theme }) => ({
  border: `1px solid ${theme.palette.neutral.lightMedium}`,
  borderRadius: theme.shape.borderRadius,
  zIndex: theme.zIndex.modal,
}));

export const NoDataContainer = styled(StyledPaper)(({ theme }) => ({
  padding: theme.spacing(2),
  minHeight: 40,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "none",
}));
export const NoDataText = styled("p")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.neutral.dark,
  alignContent: "center",
  margin: 0,
  padding: 0,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
}));

// Icon wrapper box (clickable) — rendered as a rounded +/- toggle button
export const ExpandIconBox = styled(Box)(({ theme }) => ({
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginRight: 8,
  width: 24,
  height: 24,
  flexShrink: 0,
  borderRadius: theme.shape.borderRadii.small,
  border: `${theme.shape.borderSizes.thin} solid ${theme.palette.neutral.light}`,
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.purple,
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.bold,
  lineHeight: 1,
}));

// Spacer box (non-clickable)
export const SpacerBox = styled(Box)(() => ({
  width: 24,
  height: 24,
  marginRight: 8,
  flexShrink: 0,
}));

// Tree option row — highlights only the node that actually matched the
// search term, leaving ancestor rows (shown for reporting-line context) plain.
export const TreeOptionRow = styled("li")<{ isMatch?: boolean }>(
  ({ theme, isMatch }) => ({
    display: "flex",
    alignItems: "center",
    position: "relative",
    borderRadius: theme.shape.borderRadii.small,
    ...(isMatch && {
      backgroundColor: theme.palette.background.purpleVariant,
      fontWeight: theme.typography.fontWeights.semiBold,
    }),
  })
);

// Title text
export const TitleBox = styled(Box)(() => ({
  lineHeight: 1.5,
}));

// Count badge shown next to parent nodes (groups/roles)
export const TreeCountBadge = styled(Box)(({ theme }) => ({
  minWidth: 26,
  height: 22,
  padding: `0 ${theme.spacing(1)}px`,
  marginLeft: "auto",
  borderRadius: theme.shape.borderRadii.small,
  backgroundColor: theme.palette.background.purpleVariant,
  color: theme.palette.text.purple,
  fontSize: theme.typography.fontSizes.xs,
  fontWeight: theme.typography.fontWeights.semiBold,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
}));

// Dashed connector line drawn to the left of a nested tree row
export const TreeConnectorLine = styled("span")(({ theme }) => ({
  position: "absolute",
  top: 0,
  bottom: 0,
  borderLeft: `${theme.shape.borderSizes.thin} dashed ${theme.palette.neutral.light}`,
}));

// Hint bar shown below the tree list
export const TreeSelectFooter = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  padding: theme.spacing(1.5, 2),
  borderTop: `${theme.shape.borderSizes.thin} solid ${theme.palette.neutral.tableBorder}`,
  color: theme.palette.neutral.lightMedium,
  fontSize: theme.typography.fontSizes.xs,
  "& svg": {
    fontSize: theme.typography.fontSizes.md,
    flexShrink: 0,
  },
}));

// Circular icon shown inside the closed field
export const TreeSelectIconAvatar = styled(Box)(({ theme }) => ({
  width: 28,
  height: 28,
  borderRadius: theme.shape.borderRadii.circle,
  backgroundColor: theme.palette.background.purpleVariant,
  color: theme.palette.text.purple,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginRight: theme.spacing(1),
  flexShrink: 0,
}));

// Tree-specific input styling — extends the shared AutocompleteStyles so
// SelectField/SelectFieldByApi (which also use AutocompleteStyles) stay unaffected.
export const TreeAutocompleteStyles = styled(AutocompleteStyles)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: theme.shape.borderRadii.normal,
    paddingLeft: theme.spacing(1),
  },
  "&& .MuiOutlinedInput-root.Mui-focused": {
    borderColor: theme.palette.text.purple,
    boxShadow: `0 0 0 3px ${theme.palette.background.purpleVariant}`,
  },
}));

// Tree-specific popper/listbox styling — extends the shared StyledPopper so
// SelectField/SelectFieldByApi (which also use StyledPopper) stay unaffected.
export const TreePopperComponent = styled(StyledPopper)(({ theme }) => ({
  borderRadius: theme.shape.borderRadii.normal,
  boxShadow: theme.shadows[8],
  overflow: "hidden",
  "& .MuiAutocomplete-paper": {
    boxShadow: "none",
    borderRadius: 0,
    margin: 0,
    backgroundColor: "#f5faff",
  },
  "& .MuiAutocomplete-listbox": {
    padding: theme.spacing(1),
    paddingLeft: theme.spacing(3),
    maxHeight: 320,
  },
  "& .MuiAutocomplete-option": {
    borderRadius: theme.shape.borderRadii.small,
    minHeight: 40,
  },
  // MUI's own listbox styles include a compound
  // `[aria-selected="true"].Mui-focused` rule for the hovered-while-selected
  // state, which outranks a plain comma-separated override on specificity
  // alone — force ours to win regardless of hover/focus/selected combination.
  [`& .MuiAutocomplete-option:hover,
    & .MuiAutocomplete-option.Mui-focused,
    & .MuiAutocomplete-option[aria-selected="true"]`]: {
    backgroundColor: `${theme.palette.background.purpleVariant} !important`,
  },
}));

export const SelectMenuItem = styled(Box)(({ theme }) => ({
  width: "100%",
  maxWidth: 350,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  display: "block",
  left: 297,
  top: 70,
}));

export const StyledHelperTypography = styled(Box)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
  color: `${theme.palette.text.labelColor} !important`,
  fontStyle: "italic",
  marginTop: theme.spacing(1),
}));

export const StyledTimeRangeContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isDisabled",
})<{
  isDisabled: boolean;
}>(({ isDisabled, theme }) => ({
  pointerEvents: isDisabled ? "none" : "auto",
  opacity: isDisabled ? 0.6 : 1,
  cursor: isDisabled ? "not-allowed" : "auto",
}));
export const CheckboxMainContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  width: "100%",
  padding: "8px 12px",
  // "&:hover": {
  //   backgroundColor: theme.palette.action.hover,
  // },
}));

export const FormComponentStyledCheckbox = styled(Checkbox)(({ theme }) => ({
  color: "#222222",
  "&.Mui-checked": {
    color: "#222222",
  },
}));

export const multiSelectCustomStyles = (theme) => ({
  "& .MuiOutlinedInput-input": {
    padding: theme.spacing(2.25),
    width: "78%",
  },
});

export const HoverContainer = styled(Box)({
  position: "relative",
  "&:hover .clear-icon, &:focus-within .clear-icon": {
    opacity: 1,
    pointerEvents: "auto",
  },
});

export const HoverIconButton = styled(IconButton)({
  position: "absolute",
  top: "25px",
  right: "25px",
  transform: "translateY(-50%)",
  zIndex: 1,
  opacity: 1, 
  pointerEvents: "auto",
  transition: "opacity 0.2s",
});

export const StyledMultiSelectTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    padding: "0",
    minHeight: "unset",
  },
}));

export const StyledMultiSelectInputProps = styled(Box)(({ theme }) => ({
  maxWidth: "80%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  paddingTop: theme.spacing(1),
  paddingBottom: theme.spacing(1),
}));

interface StyledMultiSelectInputPropsStyled {
  isDisplayTextVisible: boolean;
}

export const StyledMultiSelectInput = styled(
  "input"
)<StyledMultiSelectInputPropsStyled>(({ theme, isDisplayTextVisible }) => ({
  maxWidth: "80%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  color: isDisplayTextVisible ? theme.palette.text.primary : undefined,
  paddingTop: theme.spacing(1),
  paddingBottom: theme.spacing(1),
}));

export const StyledMultiSelectInputBase = styled(Box)(({ theme }) => ({
  maxWidth: "80%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  paddingTop: theme.spacing(1),
  paddingBottom: theme.spacing(1),
}));

export const EndorsementDocContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
  // border: `1px dashed ${theme.palette.neutral.lightMedium}`,
  // borderRadius: theme.spacing(3),
  padding: theme.spacing(6),
  flexWrap: "wrap",
  height: "100%",
  alignItems: "center",
}));

export const EndorsementDocContainerWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  justifyContent: "center",
  gap: theme.spacing(1),
  border: `1px dashed ${theme.palette.neutral.lightMedium}`,
  height: "280px",
  borderRadius: theme.spacing(3),
  padding: theme.spacing(7),
  flexWrap: "wrap",
}));

export const DragAndDropText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: theme.typography.fontWeights.semiBold,
}));

export const DownloadIconContainer = styled("img")(({ theme }) => ({
  width: "18px",
  height: "18px",
  marginRight: theme.spacing(2),
}));
export const StyledCheckboxDescription = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: theme.spacing(0.5),
  color: theme.palette.text.primary,
}));

export const StyledCheckboxDescriptionOptions = styled(Box)(({ theme }) => ({
  maxHeight: 150,
  overflowY: "auto",
  marginTop: theme.spacing(2),
  color: theme.palette.text.primary,
}));

export const StyledRadioGroupField = styled(Radio)(({ theme }) => ({
  color: theme.palette.background.tableHeaderHover,
  "&.Mui-checked": {
    color: theme.palette.button.secondary,
  },
}));

export const StyledCheckboxDescriptionFormControl = styled(FormControl)(
  ({ theme }) => ({
    width: "100%",
  })
);

export const StyledRadioGroupFieldFormLabel = styled(FormLabel)(
  ({ theme }) => ({
    color: theme.palette.text.primary,
  })
);

export const StyledCheckboxDescriptionError = styled("span")<{
  error?: boolean;
}>(({ theme, error }) => ({
  fontSize: 14,
  color: error
    ? "var(--mui-palette-error-main)"
    : "var(--mui-palette-text-secondary)",
}));

export const StyledCheckboxDescriptionClear = styled("button")(({ theme }) => ({
  all: "unset",
  cursor: "pointer",
  fontSize: theme.typography.fontSizes.sm,
}));

export const StyledCheckboxDescriptionOption = styled("label")<{
  disabled?: boolean;
}>(({ theme, disabled }) => ({
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 8,
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.6 : 1,
}));

export const StyledCheckboxDescriptionLabel = styled("label")(({ theme }) => ({
  maxWidth: 520,
  whiteSpace: "pre-wrap",
  lineHeight: 1.4,
  fontSize: theme.typography.fontSizes.md,
}));
export const FilePreviewContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  flexWrap: "wrap",
}));

export const SelectedFileText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.medium,
}));
export const FilePreviewName = styled("button")(({ theme }) => ({
  all: "unset",
  cursor: "pointer",
  color: theme.palette.text.linkBlue,
  textDecoration: "underline",
  fontSize: 14,
  flex: "1 1 auto",
  minWidth: 0,
  maxWidth: 250,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
}));

export const NoDataToShowText = styled(FormHelperText)(({ theme }) => ({
  color: theme.palette.text.primary,
}));
