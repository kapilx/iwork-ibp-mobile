import React from "react";
import {
  ImageTextSectionImageContainer,
  ImageTextSectionImageIcon,
  ImageTextSectionTitle,
} from "./styles";

interface SectionImageProps {
  sectionImage?: string;
  sectionTitle: string;
  containerStyles?: React.CSSProperties;
  imageStyles?: React.CSSProperties;
  titleStyles?: React.CSSProperties;
}

const ImageText: React.FC<SectionImageProps> = ({
  sectionImage,
  sectionTitle,
  containerStyles,
  imageStyles,
  titleStyles,
}) => {
  return (
    <ImageTextSectionImageContainer customStyles={containerStyles}>
      {sectionImage && (
        <ImageTextSectionImageIcon
          src={sectionImage}
          alt={sectionTitle}
          customStyles={imageStyles}
        />
      )}
      <ImageTextSectionTitle customStyles={titleStyles} data-testid={`section-title-${sectionTitle}`.replace(/[\s\-]+/g, "-").toLowerCase()}>
        {sectionTitle}
      </ImageTextSectionTitle>
    </ImageTextSectionImageContainer>
  );
};

export default ImageText;
