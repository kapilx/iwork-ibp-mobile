import React from "react";
import {
  StyledChip,
  DotStyles,
  ChipLabelContainer,
  ImageStyles,
  ChipLabelVariableContainer,
} from "./styles";
import { CHIP_IMAGE } from "../../constants";

export interface ChipRendererProps {
  value: any;
  styleMap?: Record<
    string,
    {
      backgroundColor?: string;
      color?: string;
      dotColor?: string;
      imageSrc?: string; // Optional image source
    }
  >;
  variant?: "normal" | "withDot" | "withImage" | "variable"; // Added 'withImage' variant
  size?: "small" | "medium";
  imageSrc?: string; // Optional image source for 'withImage' variant
  labelPrefix?: string; // Optional label prefix for 'withImage' variant
  labelClass?: string;
  padding?: string;
  maxWidth?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  ChipStyles?: React.CSSProperties;
  ChipLabelContainerStyles?: React.CSSProperties;
  isClickable?: boolean;
  bordercolor?: string;
  onDelete?: () => void; // Add onDelete prop for close icon
  imageOnRight?: boolean;
  className?: string; // Lets callers wrap this in styled() and target the chip root
}

const ChipRenderer: React.FC<ChipRendererProps> = ({
  value,
  styleMap = {},
  variant = "normal",
  size = "small",
  imageSrc = styleMap?.[value]?.imageSrc,
  labelPrefix,
  labelClass,
  padding,
  maxWidth,
  ChipStyles,
  onClick,
  ChipLabelContainerStyles,
  imageOnRight,
  isClickable,
  bordercolor,
  onDelete,
  className,
}) => {
  const normalizedValue =
    typeof value === "string" ? value?.toLowerCase() || "" : value?.value;
  const styleEntry = styleMap[normalizedValue] || styleMap["default"] || {};

  const backgroundColor = styleEntry.backgroundColor;
  const color = styleEntry?.color;
  const dotColor = styleEntry.dotColor;
  const chipImageSrc = styleEntry.imageSrc; // Extract image source dynamically

  if (!value) return <>--</>;
  const testId = `chip-${value}`.replace(" ", "-").toLowerCase();

  return (
    <StyledChip
      className={className}
      style={ChipStyles}
      data-testid={testId}
      padding={padding}
      maxWidth={maxWidth}
      isClickable={isClickable}
      bordercolor={bordercolor}
      role="custom-chip"
      onDelete={onDelete}
      label={
        variant === "withImage" && (chipImageSrc || imageSrc) ? (
          <ChipLabelContainer
            customStyles={ChipLabelContainerStyles}
            imageOnRight={imageOnRight}
          >
            {!imageOnRight && (
              <ImageStyles src={chipImageSrc || imageSrc} alt={CHIP_IMAGE} />
            )}
            <span>{labelPrefix}</span>
            <span className={labelClass}>{value}</span>
            {imageOnRight && (
              <ImageStyles src={chipImageSrc || imageSrc} alt={CHIP_IMAGE} />
            )}
          </ChipLabelContainer>
        ) : variant === "withDot" ? (
          <ChipLabelContainer customStyles={ChipLabelContainerStyles}>
            <DotStyles dotColor={dotColor} />
            <span>{labelPrefix}</span>
            <span className={labelClass}>{value}</span>
          </ChipLabelContainer>
        ) : variant === "variable" ? (
          <ChipLabelVariableContainer>
            <span>{labelPrefix}</span>
            <span className={labelClass}>{value}</span>
          </ChipLabelVariableContainer>
        ) : (
          <ChipLabelContainer customStyles={ChipLabelContainerStyles}>
            <span>{labelPrefix}</span>
            <span className={labelClass}>{value}</span>
          </ChipLabelContainer>
        )
      }
      size={size}
      backgroundcolor={backgroundColor}
      textcolor={color}
      onClick={onClick}
    />
  );
};

export default ChipRenderer;
