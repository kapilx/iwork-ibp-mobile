import React from "react";
import { Typography, Badge } from "@mui/material";
import {
  CardContainer,
  TitleSection,
  IconImage,
  TopStatsWrapper,
  StatBox,
  ActionsWrapper,
  ActionItem,
  CardsWrapper, // wrap all cards in flex/grid
  ActionLabelText,
  TopStatsHeadingText,
  TopStatsSubHeadingText,
  CardTopContentContainer,
} from "./styles";

interface TopStat {
  value: string;
  label: string;
}

interface Action {
  icon: string;
  label: string;
  badgeCount?: number;
  onClick: () => void;
}

interface CardData {
  title: string;
  titleIcon?: string; // Optional icon for the title
  topStats: TopStat[];
  actions: Action[];
}

interface Props {
  data: CardData[];
}

const EndorsementCard: React.FC<Props> = ({ data }) => {
  return (
    <CardsWrapper>
      {data?.map((card, idx) => (
        <CardContainer key={idx} data-testid="details-section">
          <CardTopContentContainer>
            <TitleSection>
              <IconImage src={card?.titleIcon} alt="icon" />
              <Typography
                variant="subtitle1"
                fontWeight={600}
                data-testid="section-title"
              >
                {card.title}
              </Typography>
            </TitleSection>

            <TopStatsWrapper data-testid="section-details">
              {card.topStats.map((item, index) => (
                <StatBox key={index} data-testid={`section-details-${index}`}>
                  <TopStatsHeadingText
                    data-testid={`section-details-${index}-count`}
                  >
                    {item.value}
                  </TopStatsHeadingText>
                  <TopStatsSubHeadingText
                    data-testid={`section-details-${index}-label`}
                  >
                    {item.label}
                  </TopStatsSubHeadingText>
                </StatBox>
              ))}
            </TopStatsWrapper>
          </CardTopContentContainer>
          {/* <ActionsWrapper data-testid="section-details-links">
            {card.actions.map((action, index) => (
              <ActionItem key={index} onClick={action.onClick} data-testid={`section-details-link-${index}`}>
                <img src={action.icon} alt={action.label} />
                <ActionLabelText>{action.label}</ActionLabelText>
              </ActionItem>
            ))}
          </ActionsWrapper> */}
        </CardContainer>
      ))}
    </CardsWrapper>
  );
};

export default EndorsementCard;
