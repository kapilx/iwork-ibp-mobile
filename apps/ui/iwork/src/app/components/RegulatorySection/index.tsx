import { ImageText, caseConvertor } from "@ui/ui-lib";
import React from "react";
import {
  SectionContainer,
  Image,
  Heading,
  Subheading,
  SectionCard,
  SectionCardsContainer,
} from "./styles";

interface RegulatorySectionData {
  id: number;
  imageSrc: string;
  heading: string;
  subheading: string;
}

interface RegulatorySectionProps {
  sectionTitle?: string;
  data: RegulatorySectionData[];
  sectionImage?: string;
}

const RegulatorySection: React.FC<RegulatorySectionProps> = ({
  sectionTitle,
  sectionImage,
  data,
}) => {
  const container = ("regulatory-section-" + sectionTitle).replace(/ /g,"-").toLowerCase();
  const card = "regulatory-section-card-";
  return (
    <SectionContainer>
      {sectionTitle && (
        <ImageText sectionTitle={sectionTitle} sectionImage={sectionImage} />
      )}
      <SectionCardsContainer data-testid={container}>
        {data.map((item,index) => (
          <SectionCard key={item.id} data-testid={card + index}>
            <Image src={item.imageSrc} alt={item.heading} />
            <Heading>{caseConvertor(item.heading)}</Heading>
            <Subheading>{item.subheading}</Subheading>
          </SectionCard>
        ))}
      </SectionCardsContainer>
    </SectionContainer>
  );
};

export default RegulatorySection;
