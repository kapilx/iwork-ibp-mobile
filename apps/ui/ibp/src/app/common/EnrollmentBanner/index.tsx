import { VIEW_ENROLLMENT_SUMMARY } from "../../constants";
import BackgroundImage from "../../assets/svgs/enrollment-banner-background.svg";
import PipeSeparator from "../../assets/svgs/separator-pipe-symbol.svg";
import {
  BannerContainer,
  HeaderTypography,
  BannerBox,
  LeftSection,
  BackgroundImg,
  RightSection,
  InfoItem,
  IconWrapper,
  InfoContent,
  ValueTypography,
  LabelTypography,
  GstLabelTypography,
  Separator,
} from "./styles";

/**
 * Interface defining the structure of enrollment item
 */
interface EnrollmentItem {
  /** Icon/image source for the item */
  image: string;
  /** Label text for the item */
  label: string;
  /** Value to display */
  value: string;
  /** Whether the item should be rendered */
  isVisible?: boolean;
  /** GST footnote shown below the value, e.g. "incl. 18% GST". Only rendered when both isGstApplicable && showGst are true in the caller. */
  gstLabel?: string;
}

/**
 * Props interface for EnrollmentBanner component
 */
export interface EnrollmentBannerProps {
  /** Array of enrollment items to display */
  enrollmentInfo: EnrollmentItem[];
}

/**
 * EnrollmentBanner Component
 *
 * Displays a summary banner showing enrollment information with icons.
 * Left section shows background image, right section shows items with icons, labels and values.
 *
 * @param {EnrollmentBannerProps} props - Component props
 * @returns {JSX.Element} Rendered enrollment banner
 */
const EnrollmentBanner: React.FC<EnrollmentBannerProps> = ({
  enrollmentInfo,
}) => {
  const visibleItems = (enrollmentInfo || []).filter(
    (item) => item?.isVisible !== false,
  );

  return (
    <BannerContainer>
      {/* <HeaderTypography>{VIEW_ENROLLMENT_SUMMARY}</HeaderTypography> */}
      <BannerBox>
        {/* <LeftSection> */}
        <BackgroundImg src={BackgroundImage} alt="Enrollment Background" />
        {/* </LeftSection> */}
        <RightSection>
          {visibleItems?.map((item, index) => (
            <>
              <InfoItem key={index}>
                <IconWrapper>
                  <img src={item.image} alt={item.label} />
                </IconWrapper>
                <InfoContent>
                  <ValueTypography>{item.value}</ValueTypography>
                  <LabelTypography>{item.label}</LabelTypography>
                  {item.gstLabel && (
                    <GstLabelTypography>{item.gstLabel}</GstLabelTypography>
                  )}
                </InfoContent>
              </InfoItem>
              {index < visibleItems.length - 1 && (
                <Separator src={PipeSeparator} alt="separator" />
              )}
            </>
          ))}
        </RightSection>
      </BannerBox>
    </BannerContainer>
  );
};

export default EnrollmentBanner;
