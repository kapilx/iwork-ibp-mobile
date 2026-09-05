import React from "react";
import {
  StyledRadio,
  TextWrapper,
  Heading,
  Subheading,
  OptionCardContainer,
} from "./styles.js";

interface OptionCardProps {
  optionKey: string;
  heading: string;
  subheading: string;
  selected: string;
  onSelect: (key: string) => void;
  warning?: boolean; // Add warning prop
}

const OptionCard: React.FC<OptionCardProps> = ({
  optionKey,
  heading,
  subheading,
  selected,
  onSelect,
  warning = false, // Default to false
}) => {
  return (
    <OptionCardContainer
      selected={selected === optionKey}
      warning={warning && selected === optionKey} // Pass warning state
      onClick={() => onSelect(optionKey)}
    >
      <StyledRadio
        checked={selected === optionKey}
        onChange={() => onSelect(optionKey)}
        value={optionKey}
        name="upload-mode"
      />
      <TextWrapper>
        <Heading variant="body1">{heading}</Heading>
        <Subheading variant="body2">{subheading}</Subheading>
      </TextWrapper>
    </OptionCardContainer>
  );
};

export default OptionCard;
