import React from "react";
import {
  BannerBackgroundImage,
  BannerBirdImage,
  BannerCardFlower,
  BannerContainer,
  BannerCoudImageLeft,
  BannerCoudImageRight,
  BannerCoudImageRightSide,
  BannerFlowerImage,
  BannerSectionCard,
  BannerSectionCardContent,
  BannerSectionCards,
  BannerSectionContent,
  BannerSectionDescription,
  BannerSectionTitle,
  BannerWrapper,
} from "./styles";
import bannerBackground from "../../../assets/svgs/banner-background.svg";
import bannerCardFlower from "../../../assets/svgs/banner-card-flower.svg";
import bannerFlower from "../../../assets/svgs/banner-flower.svg";
import bannerBirdImage from "../../../assets/svgs/banner-birds.svg";
import bannerCloudImage from "../../../assets/svgs/banner-cloud.svg";
import { cardsStyles } from "../constants";

interface DashboardBannerSectionProps {
  userName: string;
  banner: BannerAttributes | null;
}

interface BannerCard {
  heading: string;
  content: string;
}

interface BannerAttributes {
  welcomeTitlePrefix: string;
  welcomeTitleSuffix: string;
  description: string;
  cards: BannerCard[];
}

const DashboardBannerSection: React.FC<DashboardBannerSectionProps> = ({
  userName,
  banner,
}) => {
  return (
    <BannerContainer>
      <BannerWrapper>
        <BannerBackgroundImage src={bannerBackground} alt="Banner background" />
        <BannerFlowerImage src={bannerFlower} alt="Banner flower" />
        <BannerBirdImage src={bannerBirdImage} alt="Banner bird" />
        <BannerCoudImageLeft src={bannerCloudImage} alt="Banner cloud left" />
        <BannerCoudImageRight src={bannerCloudImage} alt="Banner cloud right" />
        <BannerCoudImageRightSide
          src={bannerCloudImage}
          alt="Banner cloud right"
        />
        {banner && (
          <BannerSectionContent>
            <BannerSectionTitle>
              {banner.welcomeTitlePrefix} {userName}
              {banner.welcomeTitleSuffix}
            </BannerSectionTitle>
            <BannerSectionDescription>
              {banner.description}
            </BannerSectionDescription>
          </BannerSectionContent>
        )}
        {banner?.cards?.length ? (
          <BannerSectionCards>
            {banner.cards.map((card, index) => (
              <BannerSectionCard
                key={`${card.heading}-${index}`}
                background={cardsStyles[index]?.background}
                index={index}
              >
                <BannerSectionTitle color={cardsStyles[index]?.color}>
                  {card.heading}
                </BannerSectionTitle>
                <BannerSectionCardContent>
                  {card.content}
                </BannerSectionCardContent>
                <BannerCardFlower
                  src={bannerCardFlower}
                  alt="banner-card-flower"
                />
              </BannerSectionCard>
            ))}
          </BannerSectionCards>
        ) : null}
      </BannerWrapper>
    </BannerContainer>
  );
};

export default DashboardBannerSection;
