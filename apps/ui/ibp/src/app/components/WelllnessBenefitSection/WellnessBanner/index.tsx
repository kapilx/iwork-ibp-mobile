import React from "react";
import {
  InsuranceContainer,
  InsuranceHeading,
  InsuranceImage,
  InsuranceImageWrapper,
  InsuranceSubtext,
  InsuranceTextBlock,
  LinesImage,
} from "./styles";
import bannerLines from "../../../assets/svgs/insurance-banner-lines.svg";
import bannerImage from "../../../assets/svgs/insurance-banner-bg.svg";
import CommonButton from "../../../common/Button";
import { ibpTheme as theme } from "@ui/ui-lib";
import { BannerData } from "../constants";
import { useNavigate } from "react-router-dom";

const InsuranceBanner = () => {
   const navigate = useNavigate();
  const handleActionClick = () => {
    navigate("/work-in-progress");
  };
  return (
    <InsuranceContainer>
      <InsuranceTextBlock data-testid="ibp-insurance-banner-text-block">
        <InsuranceHeading>
          {BannerData.title}
        </InsuranceHeading>
        <InsuranceSubtext>
          {BannerData.subtitle}
        </InsuranceSubtext>
        <LinesImage
          src={bannerLines}
          alt="Decorative lines"
          aria-hidden="true"
        />
        <CommonButton
          label={BannerData.ButtonText}
          variant="outlined"
          buttonType="primary"
          bgcolor={theme.palette.neutral.medium}
          width="230px"
          color={theme.palette.background.paper}
          onClick={() => handleActionClick()}
        />
      </InsuranceTextBlock>
      <InsuranceImageWrapper>
        <InsuranceImage src={bannerImage} alt="Banner Image" />
      </InsuranceImageWrapper>
    </InsuranceContainer>
  );
};

export default InsuranceBanner;
