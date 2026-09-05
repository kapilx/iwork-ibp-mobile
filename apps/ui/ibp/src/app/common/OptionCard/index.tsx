import React from "react";
import {
  OptionCardContainer,
  OptionCardIcon,
  OptionCardTitle,
  OptionCardSubtext,
} from "./styles";

export interface OptionCardProps {
  icon: string;
  title: string;
  subtext: string;
  onClick?: () => void;
  backgroundColor?: string;
}

const truncateMiddle = (text: string, maxLength: number = 30): string => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  const charsToShow = maxLength - 3;
  const frontChars = Math.ceil(charsToShow / 2);
  const backChars = Math.floor(charsToShow / 2);
  return text.substr(0, frontChars) + "..." + text.substr(text.length - backChars);
};

const OptionCard: React.FC<OptionCardProps> = ({
  icon,
  title,
  subtext,
  onClick,
  backgroundColor,
}) => {
  const displaySubtext = truncateMiddle(subtext);

  return (
    <OptionCardContainer onClick={onClick} backgroundColor={backgroundColor}>
      <OptionCardIcon src={icon} alt={title} />
      <OptionCardTitle>{title}</OptionCardTitle>
      <OptionCardSubtext title={subtext}>{displaySubtext}</OptionCardSubtext>
    </OptionCardContainer>
  );
};

export default OptionCard;
