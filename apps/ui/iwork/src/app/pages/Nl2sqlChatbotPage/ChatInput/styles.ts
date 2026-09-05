import { Box, TextField, Typography, IconButton, styled } from "@mui/material";
import { Send } from "@mui/icons-material";
import { visuallyHidden } from "@mui/utils";

export const ChatInputContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "flex-end",
  gap: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(2),
  border: `1px solid #CCCCCCB2`,
  boxShadow: theme.shadows[1],
})) as typeof Box;

export const TextAreaWrapper = styled(Box)(() => ({
  flexGrow: 1,
  position: "relative",
  display: "flex",
  flexDirection: "column",
})) as typeof Box;

export const StyledTextArea = styled(TextField)(({ theme }) => ({
  width: "100%",
  "& .MuiOutlinedInput-root": {
    backgroundColor: "#fff9e5",
    borderRadius: theme.shape.borderRadius,
    maxHeight: "120px", // Limit to approximately 3 rows
    minHeight: "50px",
    overflow: "auto", // Enable scrolling
    paddingRight: "40px", // Add padding to prevent text overlay on cross icon
    "& fieldset": {
      borderColor: "#CCCCCCB2",
    },
    "&:hover fieldset": {
      borderColor: "#CCCCCCB2", // Keep same color on hover
    },
    "&.Mui-focused fieldset": {
      borderColor: "#CCCCCCB2", // Keep same color on focus
      borderWidth: 1, // Keep same width
    },
  },
  "& .MuiInputBase-input": {
    color: theme.palette.text.primary,
    paddingRight: "40px", // Add padding to input text
    "&::placeholder": {
      color: "#9e9e9e",
      opacity: 1,
    },
  },
  "& .MuiInputBase-inputMultiline": {
    maxHeight: "100px", // Limit textarea height
    overflow: "auto", // Enable scrolling
    paddingRight: "40px", // Add padding to multiline input
  },
})) as typeof TextField;
export const ErrorText: typeof Typography = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.caption.fontSize,
  position: "absolute",
  top: "-35px",
  right: 0,
  zIndex: 10,
  backgroundColor: theme.palette.error.main,
  color: "#FFFFFF",
  padding: theme.spacing(0.5, 1),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[3],
  whiteSpace: "nowrap",
  "&::after": {
    content: '""',
    position: "absolute",
    top: "100%",
    right: "12px",
    border: "4px solid transparent",
    borderTopColor: theme.palette.error.main,
  },
}));

export const VisuallyHiddenLabel = styled("label")(() => ({
  ...visuallyHidden,
}));

export const SendButton = styled(IconButton)(({ theme }) => ({
  marginLeft: theme.spacing(2),
  marginBottom: theme.spacing(0.5),
  width: 48,
  height: 48,
  backgroundColor: "transparent",
  color: "#333333",
  transition: "all 0.2s ease-in-out",
  "&:hover:not(.Mui-disabled)": {
    backgroundColor: "transparent",
    color: "#333333",
    transform: "scale(1.1)",
  },
  "&.Mui-disabled": {
    backgroundColor: "transparent",
    color: "#9AA5BA",
    cursor: "not-allowed !important",
    pointerEvents: "auto", // Ensure pointer events are enabled to show cursor
    "&:hover": {
      cursor: "not-allowed !important",
      transform: "none",
      backgroundColor: "transparent",
      color: "#9AA5BA",
    },
  },
  // Additional specificity for disabled state
  "&.Mui-disabled:hover": {
    cursor: "not-allowed !important",
  },
}));

export const CrossIconButton = styled(IconButton)(() => ({
  padding: 4,
  position: "absolute",
  right: 8,
  top: 15,
  zIndex: 1,
}));

export const SendIcon = styled(Send)(() => ({
  fontSize: 32,
  fontWeight: "bold",
}));

export const AnimatedPlaceholder = styled("div")<{ isTransitioning: boolean }>(
  ({ isTransitioning }) => ({
    position: "absolute",
    left: "14px",
    top: "50%",
    color: "#9e9e9e",
    fontSize: "16px",
    pointerEvents: "none",
    zIndex: 1,
    transition: "all 0.6s ease-in-out",
    opacity: isTransitioning ? 0 : 0.7,
    transform: isTransitioning ? "translateY(-150%)" : "translateY(-50%)",
    overflow: "hidden",
    whiteSpace: "nowrap",
    maxWidth: "calc(100% - 80px)", // Account for padding and buttons
    textOverflow: "ellipsis",
  })
);
