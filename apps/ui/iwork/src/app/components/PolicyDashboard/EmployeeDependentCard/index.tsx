import React from "react";
import {
  BackgroundImage,
  CardContainer,
  CardHeader,
  GroupTitle,
  StatGroup,
  StatItem,
  StatsCount,
  StatsLabel,
  StyledCard,
  TitleSection,
  WarningBox,
  WarningText,
  StatsCountContainer,
  Title,
  ViewDetailsSection,
} from "./styles";
import { Box } from "@mui/material";
import needAttentionIcon from "../../../assets/svgs/need-attention.svg";
import warningIcon from "../../../assets/svgs/warning-xs.svg";

interface CardStat {
  value: number | string;
  label: string;
  warning?: string; // <-- NEW
}

interface StatGroupType {
  groupTitle: string;
  icon?: string;
  stats: CardStat[];
  showViewDetails?: boolean;
  viewDetailsText?: string;
  onViewDetailsClick?: () => void;
}

interface CardData {
  id: string;
  icon: React.ReactNode;
  title: string;
  bgGradient: string;
  statGroups: StatGroupType[];
  backgroundImage?: string | null;
  onClick?: () => void;
  cardOnClick?: () => void;
  viewDetails?: boolean;
}

interface Props {
  data: CardData[];
}

const EmployeeDependentCard: React.FC<Props> = ({ data }) => {
  return (
    <CardContainer>
      {data?.map((card, idx) => (
        <StyledCard
          key={idx}
          bgGradient={card.bgGradient}
          elevation={1}
          onClick={card.cardOnClick}
          data-testid="details-section"
        >
          {card.statGroups?.map((group, gIdx) => (
            <Box key={gIdx} mb={2}>
              <CardHeader>
                <TitleSection>
                  <Title>
                    <img
                      src={group.icon || needAttentionIcon}
                      alt="Icon"
                      width={30}
                      height={group.height || 30}
                    />
                    <GroupTitle>{group.groupTitle || card.title}</GroupTitle>
                  </Title>
                  {(group.showViewDetails ?? card.viewDetails) && (
                    <ViewDetailsSection
                      onClick={(e) => {
                        e.stopPropagation(); // don't trigger card click
                        group.onViewDetailsClick?.();
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      {group.viewDetailsText}
                    </ViewDetailsSection>
                  )}
                </TitleSection>
              </CardHeader>

              <StatGroup>
                {group.stats.map((stat, i) => (
                  <StatItem key={i}>
                    <StatsCountContainer>
                      <StatsCount>{stat.value}</StatsCount>
                      <StatsLabel>{stat.label}</StatsLabel>
                    </StatsCountContainer>
                    {/* ✅ Warning Box */}
                    {stat?.warning?.length > 0 && (
                      <WarningBox>
                        <img src={warningIcon} alt="Warning" />
                        <WarningText>{stat.warning}</WarningText>
                      </WarningBox>
                    )}
                  </StatItem>
                ))}
              </StatGroup>
            </Box>
          ))}

          {card.backgroundImage && (
            <BackgroundImage src={card.backgroundImage} alt={card.title} />
          )}
        </StyledCard>
      ))}
    </CardContainer>
  );
};

export default EmployeeDependentCard;
