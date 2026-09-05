import React from "react";
import {
  NudgeCardContainer,
  NudgeCardContent,
  IconWrapper,
  ContentWrapper,
  NudgeTitle,
  InsightText,
  ActionText,
} from "./styles";

export interface NudgeCardProps {
  title: string;
  icon: string;
  insight: string;
  action: string;
  backgroundColor?: string;
  onClick?: () => void;
  dataTestid?: string;
}

const NudgeCard: React.FC<NudgeCardProps> = ({
  title,
  icon,
  insight,
  action,
  backgroundColor = "#FFF7ED",
  onClick,
  dataTestid = "nudge-card",
}) => {
  return (
    <NudgeCardContainer onClick={onClick} data-testid={dataTestid}>
      <NudgeCardContent>
        <IconWrapper style={{ backgroundColor }}>
          <img src={icon} alt={`${title} icon`} />
        </IconWrapper>
        <ContentWrapper>
          <NudgeTitle>{title}</NudgeTitle>
          <InsightText>{insight}</InsightText>
          <ActionText>{action}</ActionText>
        </ContentWrapper>
      </NudgeCardContent>
    </NudgeCardContainer>
  );
};

export default NudgeCard;
