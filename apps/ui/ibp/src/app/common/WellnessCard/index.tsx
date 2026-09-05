import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import {
  WellnessWrapper,
  WellnessCardWrapper,
  WellnessCardIcon,
  WellnessCardTitle,
  WellnessCardDescription,
  WellnessCardFeatures,
  WellnessFeatureItem,
  WellnessButton,
  WellnessTitle,
  WellnessContainer,
  WellnessCardContainer,
} from "./styles";
import {
  cardBackgroundColors,
  wellnessCardsData,
} from "../../components/Dashboard/constants";
import { useNavigate } from "react-router-dom";
import CommonLoader from "../../common/CommonLoader";
import { RootState } from "../../redux/store";
import { CompanyPortalDashboardConfig } from "../../types";

type WellnessJourneyCard = {
  title: string;
  description: string;
  features: string[];
  buttonLabel: string;
};

interface WellnessCardProps {
  title?: string;
  cards?: WellnessJourneyCard[];
}

const WellnessCard: React.FC<WellnessCardProps> = ({ title, cards }) => {
  const navigate = useNavigate();
  const { data: portalConfig, loading: portalConfigLoading } = useSelector(
    (state: RootState) => state.portalConfig
  );

  const dashboardConfig: CompanyPortalDashboardConfig | null =
    portalConfig?.companyPortalDashboardConfig?.wellness ??
    portalConfig?.companyPortalDashboardConfig ??
    null;

  const handleActionClick = (card: any) => {
    if (card?.path) {
      navigate(card.path);
      return;
    }
    navigate("/work-in-progress");
  };

  // Filter cards based on API configuration enabled status
  const resolvedCards = useMemo(() => {
    const overrides = cards ?? [];

    return wellnessCardsData.cards.map((card, index) => {
      const override = overrides[index];
      return {
        ...card,
        title: override?.title ?? card.title,
        description: override?.description ?? card.description,
        button: override?.buttonLabel ?? card.button,
        _featureLabels: override?.features ?? Object.values(card.features),
      };
    });
  }, [cards]);

  const enabledCards = resolvedCards.filter((card) => {
    const cardType = card.type as keyof CompanyPortalDashboardConfig;
    return dashboardConfig?.[cardType]?.enabled === true;
  });

  // Get enabled features for a card
  const getEnabledFeatures = (card: any) => {
    const cardType = card.type as keyof CompanyPortalDashboardConfig;
    const cardOptions = dashboardConfig?.[cardType]?.options || {};
    const entries = Object.entries(card.features);
    const labels: string[] = card._featureLabels || entries.map(([, value]) => value);

    return entries
      .filter(([key]) => cardOptions[key as keyof typeof cardOptions] === true)
      .map(([, value], index) => labels[index] ?? value);
  };

  if (portalConfigLoading && !portalConfig?.companyPortalDashboardConfig) {
    return (
      <WellnessContainer data-testid="ibp-wellness-card-component-section">
        <CommonLoader />
      </WellnessContainer>
    );
  }

  if (!dashboardConfig || !enabledCards.length) {
    return (
      <WellnessContainer data-testid="ibp-wellness-card-component-section">
        <WellnessTitle>{wellnessCardsData.title}</WellnessTitle>
        <WellnessWrapper>
          <WellnessCardWrapper>
            <WellnessCardContainer
              background={cardBackgroundColors[0].background}
              data-testid="ibp-wellness-card-empty-state"
            >
              <WellnessCardTitle>No wellness programs are available</WellnessCardTitle>
              <WellnessCardDescription>
                Please check back later for your company&apos;s wellness offerings.
              </WellnessCardDescription>
            </WellnessCardContainer>
          </WellnessCardWrapper>
        </WellnessWrapper>
      </WellnessContainer>
    );
  }

  return (
    <WellnessContainer data-testid="ibp-wellness-card-component-section">
      <WellnessTitle>{title ?? wellnessCardsData.title}</WellnessTitle>
      <WellnessWrapper>
        <WellnessCardWrapper>
          {enabledCards.map((card, index) => (
            <WellnessCardContainer
              key={card.title}
              background={cardBackgroundColors[index].background}
              data-testid="ibp-wellness-card"
            >
              <WellnessCardIcon src={card.icon} alt={card.title} />
              <WellnessCardTitle>{card.title}</WellnessCardTitle>
              <WellnessCardDescription>
                {card.description}
              </WellnessCardDescription>
              <WellnessCardFeatures>
                {getEnabledFeatures(card).map((feature, featureIndex) => (
                  <WellnessFeatureItem key={featureIndex}>
                    {feature}
                  </WellnessFeatureItem>
                ))}
              </WellnessCardFeatures>
              <WellnessButton onClick={() => handleActionClick(card)}>
                {card.button}
              </WellnessButton>
            </WellnessCardContainer>
          ))}
        </WellnessCardWrapper>
      </WellnessWrapper>
    </WellnessContainer>
  );
};

export default WellnessCard;
