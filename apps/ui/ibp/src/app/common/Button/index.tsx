import React from "react";
import { CircularProgress } from "@mui/material";
import { StyledButton } from "./styles";
import { ibpTheme as theme } from "@ui/ui-lib";
interface CommonButtonProps {
  label: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  loading?: boolean;
  variant?:
    | "contained"
    | "outlined"
    | "text"
    | "link"
    | "gradient"
    | "gradient-outlined";
  buttonType: "primary" | "secondary";
  color?: string; // MUI color prop, e.g., 'primary', 'secondary'
  bgcolor?: string; // Custom color for the button background
  border?: string; // Custom border style for the button (e.g., "1px solid red")
  fullWidth?: boolean;
  className?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  width?: string | number;
  height?: string | number;
  cursor?: string; // Custom cursor style for the button (e.g., "pointer", "not-allowed", "disabled")
}

const CommonButton: React.FC<CommonButtonProps> = ({
  label,
  onClick,
  type = "button",
  disabled = false,
  loading = false,
  variant = "contained",
  buttonType = "primary", // 'primary' or 'secondary'
  color = variant === "link"
    ? theme.palette.border.secondary
    : buttonType === "primary"
    ? theme.palette.neutral.dark
    : theme.palette.neutral.veryLight, // Default color, can be overridden by MUI theme
  bgcolor = variant === "link"
    ? "transparent" // Let CSS handle link background
    : buttonType === "primary"
    ? theme.palette.neutral.veryLight
    : theme.palette.border.secondary, // Default background color
  border,
  fullWidth = false,
  className = "",
  startIcon,
  endIcon,
  width = "auto",
  height = "40px",
  cursor = "pointer", // Default cursor style
}) => {
  // If disabled, override background color to dark grey
  const finalBgColor = disabled ? theme.palette.button.disabled : bgcolor;
  const finalCursor = disabled || loading ? "not-allowed" : cursor;
  
  // Don't apply backgroundColor for gradient variants to avoid overriding styled component styles
  const shouldApplyBgColor = variant !== "gradient" && variant !== "gradient-outlined";
  
  return (
    <StyledButton
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      variant={variant}
      fullWidth={fullWidth}
      startIcon={!loading && startIcon}
      endIcon={!loading && endIcon}
      className={className}
      style={{
        ...(width !== "auto" && { width }),
        height,
        ...(shouldApplyBgColor && { backgroundColor: finalBgColor }),
        color,
        cursor: finalCursor,
        ...(border && { border }),
      }}
    >
      {loading ? <CircularProgress size={24} color="inherit" /> : label}
    </StyledButton>
  );
};

export default CommonButton;
