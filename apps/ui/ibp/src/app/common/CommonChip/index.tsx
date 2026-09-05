import React from "react";
import { ChipProps } from "@mui/material";
import { StyledChip } from "./styles";

interface CommonChipProps extends ChipProps {
  label: string;
  icon?: React.ReactElement;
  onDelete?: () => void;
  onClick?: () => void;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
}

const CommonChip: React.FC<CommonChipProps> = ({
  label,
  icon,
  onClick,
  onDelete,
  variant = "filled",
  color = "default",
  size = "medium",
  backgroundColor,
  textColor,
  borderColor,
  ...rest
}) => {
  return (
    <StyledChip
      label={label}
      icon={icon}
      onClick={onClick}
      onDelete={onDelete}
      variant={variant}
      color={color}
      style={{
        backgroundColor,
        color: textColor,
        border: borderColor ? `1px solid ${borderColor}` : 'none',
      }}
      size={size}
      clickable={!!onClick}
      {...rest}
    />
  );
};

export default CommonChip;
