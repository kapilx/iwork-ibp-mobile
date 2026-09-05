import { ImageText, NOT_AVAILABLE } from "@ui/ui-lib";
// components/GstSection.tsx
import React from "react";
import {
  CardContent,
  CardList,
  GstCard,
  GstInnerCircle,
  GstTypeCircle,
  GstTypeContent,
  GSTCardLabel,
  SectionContainer,
  GSTCardValue,
} from "./styles";
import { GST_NUMBER, STATE } from "../../constants";

type GstItem = {
  gstNumber: string;
  gstCategory: {
    lookUpValue: string;
  };
  state: {
    name: string;
  };
};

type GstSectionProps = {
  data: GstItem[];
  sectionTitle?: string;
  sectionImage?: string;
};

const GstSection: React.FC<GstSectionProps> = ({
  data,
  sectionTitle,
  sectionImage,
}) => {
  if (!data?.length) return null;

  return (
    <SectionContainer>
      {sectionTitle && (
        <ImageText sectionTitle={sectionTitle} sectionImage={sectionImage} />
      )}
      <CardList>
        {data.map((item, idx) => (
          <GstCard key={idx} data-testid="gst-card">
            <GstTypeCircle data-testid="gst-circle">
              <GstInnerCircle>
                <GstTypeContent>
                  {item.gstCategory?.lookUpValue || NOT_AVAILABLE}
                </GstTypeContent>
              </GstInnerCircle>
            </GstTypeCircle>

            <CardContent data-testid="gst-content">
              <GSTCardLabel>{STATE}</GSTCardLabel>
              <GSTCardValue>{item.state?.name || NOT_AVAILABLE}</GSTCardValue>
            </CardContent>

            <CardContent data-testid="gst-content">
              <GSTCardLabel>{GST_NUMBER}</GSTCardLabel>
              <GSTCardValue>{item.gstNumber || NOT_AVAILABLE}</GSTCardValue>
            </CardContent>
          </GstCard>
        ))}
      </CardList>
    </SectionContainer>
  );
};

export default GstSection;
