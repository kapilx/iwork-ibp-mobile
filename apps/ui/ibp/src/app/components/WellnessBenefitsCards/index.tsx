import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CardsContainer,
  CardItem,
  CardContent,
  CardTitle,
  CardSubTitle,
  CardDescription,
  EnrollButton,
  DateCircle,
  IllustrationImage,
  CardImageContainer,
  CardTextContainer,
  ContainerTitle,
  WellnessBenefitsCardsContainer,
  WellnessCardFeatures,
  WellnessFeatureItem,
  ExpandArrowImage,
} from "./styles";
import ArrowIcon from "../../../assets/svgs/arrow-icon.svg";
import BackgroundImage from "../../../assets/svgs/card-background-image.svg";
import { CARDS_DATA } from "../../constants";
import { useDispatch } from "react-redux";
import { setToastMessage } from "../../redux/slice";

type WellnessBenefitsCard = {
  title: string;
  subtitle: string;
  descriptionItems: string[];
  buttonLabel: string;
  date: string;
};

interface WellnessBenefitsCardsProps {
  heading?: string;
  cards?: WellnessBenefitsCard[];
}

const WellnessBenefitsCards: React.FC<WellnessBenefitsCardsProps> = ({
  heading,
  cards,
}) => {
  // Set the first card (index 0) as open by default
  const [hoveredIndex, setHoveredIndex] = useState<number>(0);
  const disptach = useDispatch();
  const navigate = useNavigate();

  const handleActionClick = () => {
    navigate("/work-in-progress");
  };

  const resolvedHeading = heading ?? CARDS_DATA.heading;
  const resolvedCards = useMemo(() => {
    return CARDS_DATA.cards.map((card, index) => {
      const override = cards?.[index];
      return {
        title: override?.title ?? card.TITLE,
        subtitle: override?.subtitle ?? card.SUBTITLE,
        descriptionItems: override?.descriptionItems ?? card.DESCRIPTION,
        buttonLabel: override?.buttonLabel ?? card.BUTTON_LABEL,
        date: override?.date ?? card.DATE,
      };
    });
  }, [cards]);

  return (
    <WellnessBenefitsCardsContainer data-testid="ibp-wellness-benefits-cards-section">
      <ContainerTitle>{resolvedHeading}</ContainerTitle>
      <CardsContainer>
        {resolvedCards.map((card, index) => {
          const isExpanded = hoveredIndex === index;
          const baseCard = CARDS_DATA.cards[index];

          return (
            <CardItem
              data-testid="ibp-wellness-benefit-card"
              key={index}
              bgcolor={baseCard?.COLOR}
              expanded={isExpanded}
              bgimage={BackgroundImage}
              onMouseEnter={() => setHoveredIndex(index)}
            >
              <CardContent expanded={isExpanded}>
                {/* Image Container */}
                <CardImageContainer expanded={isExpanded}>
                  {baseCard?.IMAGE && isExpanded && (
                    <IllustrationImage src={baseCard.IMAGE} alt="Yoga Tree" />
                  )}
                </CardImageContainer>
                {/* Text Container */}
                <CardTextContainer expanded={isExpanded}>
                  <CardTitle>{card.title}</CardTitle>
                  <CardSubTitle>{card.subtitle}</CardSubTitle>
                  {isExpanded && card.descriptionItems && (
                    <>
                      {/* <CardDescription>{card.DESCRIPTION}</CardDescription> */}
                      <WellnessCardFeatures>
                        {card.descriptionItems.map((feature, index) => (
                          <WellnessFeatureItem key={index}>
                            {feature}
                          </WellnessFeatureItem>
                        ))}
                      </WellnessCardFeatures>
                      <EnrollButton onClick={() => handleActionClick()}>
                        {card.buttonLabel}
                      </EnrollButton>
                      {/* <DateCircle>
                                                <span className="date-main">
                                                    {card.DATE?.slice(0, card.DATE.lastIndexOf(' '))}
                                                </span>
                                                <span className="date-year">
                                                    {card.DATE?.slice(card.DATE.lastIndexOf(' ') + 1)}
                                                </span>
                                            </DateCircle> */}
                    </>
                  )}
                  {!isExpanded && (
                    <ExpandArrowImage src={ArrowIcon} alt="Arrow" />
                  )}
                </CardTextContainer>
              </CardContent>
            </CardItem>
          );
        })}
      </CardsContainer>
    </WellnessBenefitsCardsContainer>
  );
};

export default WellnessBenefitsCards;
