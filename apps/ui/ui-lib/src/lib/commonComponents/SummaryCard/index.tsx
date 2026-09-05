import ChipRenderer from "../Chip";
import CommonDetailsSection from "../CommonDetailsSection";
import {
  ButtonLogoContainer,
  SummaryCardContainer,
  CompanyNameContainer,
  CompanyNameLabel,
  CompanyNameSection,
  TracxnButton,
  ButtonText,
  LinkedInButtonStyles,
  ViewMoreIndicator,
  ViewMoreTypography,
  StyledImg,
  VerticalDivider,
  ClickableCompanyName,
} from "./styles";
import tracxnIcon from "../../assets/svgs/tracxn-image.svg";
import { LESS, MORE, TRACXN, VIEW } from "../../constants";
import linkedInButton from "../../assets/svgs/linkedInIcon.svg";
import { Tooltip, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import UpArrowIcon from "../../assets/svgs/up-arrow.svg";
import ViewMoreDetails from "../ViewMoreDetailsSection";
type ViewMoreItem = {
  label: string;
  key: string; // key to access data from the object
  fallback?: string; // optional fallback value
  formatter?: (value: any) => string | null; // optional value formatter
  handleClick?: () => void; // optional click handler
};
type SummaryCardProps = {
  data: Record<string, any>;
  nameLink: string;
  sections: string[];
  viewMore: boolean;
  viewMoreItems?: ViewMoreItem[];
  alwaysExpanded?: boolean; // when true, view-more details render expanded with no toggle
  onCompanyNameClick?: (data: Record<string, any>) => void;
  headerConfig?: {
    titleKey: string; // e.g. "companyName"
    chip?: {
      key: string;
      styleMap?: Record<string, any>;
      variant?: "withDot" | "withImage" | "normal";
      imageSrc?: string;
      labelPrefix?: string; // Optional prefix for the chip label
      labelStyles?: string; // Optional class for the label
      ChipStyles?: React.CSSProperties; // Optional styles for the chip
    }[];
    button?: {
      label: string;
      onClick?: (data: Record<string, any>) => void;
    };
    linkedInButton?: {
      label?: string;
      onClick?: (data: Record<string, any>) => void;
    };
    customButton?: {
      label: string;
      onClick?: () => void;
      variant?: string;
      icon?: React.ReactNode;
      className?: string;
    };
  };
};

const SummaryCard = ({
  data,
  sections,
  headerConfig,
  nameLink,
  viewMore,
  viewMoreItems,
  alwaysExpanded,
  onCompanyNameClick,
}: SummaryCardProps) => {
  const [isOpened, setIsOpened] = useState(false);
  const showViewMoreDetails = alwaysExpanded || isOpened;
  const title = headerConfig?.titleKey
    ? data[headerConfig.titleKey]
    : undefined;

  // Generate label value
  const generateViewMoreData = useMemo(() => {
    if (!viewMoreItems?.length) return [];

    return viewMoreItems?.map((item) => ({
      label: item.label,
      value: item.formatter
        ? item.formatter(data[item.key])
        : data[item.key] || item.fallback || "--",
      handleClick: item.handleClick,
    }));
  }, [viewMoreItems, data]);

  // Handle chip rendering by mapping through the chip configurations
  const renderChips = () => {
    return headerConfig?.chip?.map((chipConfig, index) => {
      const chipValue = data[chipConfig.key];

      // If chip value exists, render the chip with the specified configuration
      if (chipValue) {
        return (
          <ChipRenderer
            key={index}
            styleMap={chipConfig.styleMap}
            variant={chipConfig.variant || "normal"}
            value={chipValue}
            labelPrefix={chipConfig.labelPrefix} // Dynamically pass the labelPrefix
            imageSrc={chipConfig.imageSrc} // Dynamically pass the imageSrc
            labelClass={chipConfig.labelStyles} // Dynamically pass the labelClass
            ChipStyles={chipConfig.ChipStyles} // Dynamically pass the ChipStyles
          />
        );
      }

      return null; // Return null if the chip value is undefined
    });
  };

  // const handleButtonClick = () => {
  //   if (headerConfig?.button?.onClick) {
  //     headerConfig.button.onClick(data);
  //   }
  // };
  const handleLinkedInClick = () => {
    if (headerConfig?.linkedInButton?.onClick) {
      headerConfig.linkedInButton.onClick(data);
    }
  };

  const handleTracxnClick = () => {
    window.open(nameLink, "_blank");
  };
  return (
    <SummaryCardContainer data-testid="summary-card">
      {title && (
        <CompanyNameContainer data-testid="summary-card-details">
          <CompanyNameSection>
            <Tooltip title={title} arrow data-testid="summary-card-title">
              <CompanyNameLabel>{title}</CompanyNameLabel>
            </Tooltip>
            {viewMore && (
              <>
                {onCompanyNameClick ? (
                  <ClickableCompanyName
                    data-testid="summary-card-company-name"
                    onClick={() => onCompanyNameClick(data)}
                  >
                    {data?.companyName ?? "--"}
                  </ClickableCompanyName>
                ) : (
                  <Typography data-testid="summary-card-company-name">
                    {data?.companyName ?? "--"}
                  </Typography>
                )}
                <VerticalDivider />
                <Typography data-testid="summary-card-lead-insurer-name">
                  {data?.leadInsurer?.displayName ?? "--"}
                </Typography>
                <VerticalDivider />
                <Typography data-testid="summary-card-tpa-name">
                  {data?.tpaDetails?.displayName ?? "--"}
                </Typography>
              </>
            )}

            {/* Render chips conditionally */}
            {headerConfig?.chip?.length && renderChips()}
          </CompanyNameSection>

          {viewMore && !alwaysExpanded && (
            <ViewMoreIndicator onClick={() => setIsOpened(!isOpened)}>
              <ViewMoreTypography
                data-testid={`view-${isOpened ? "less" : "more"}`}
              >
                {VIEW} {isOpened ? LESS : MORE}
              </ViewMoreTypography>
              <StyledImg
                isOpened={isOpened}
                src={UpArrowIcon}
                alt="Arrow Icon"
              />
            </ViewMoreIndicator>
          )}

          {headerConfig?.button && (
            <TracxnButton
              onClick={handleTracxnClick}
              variantType="secondary"
              sizeType="small"
              children={
                <ButtonLogoContainer>
                  <img src={tracxnIcon} alt="Tracxn" />
                  <ButtonText>{TRACXN}</ButtonText>
                </ButtonLogoContainer>
              }
              className="tracxn-button"
            />
          )}

          {headerConfig?.customButton && (
            <TracxnButton
              onClick={headerConfig.customButton.onClick}
              variantType={headerConfig.customButton.variant || "secondary"}
              sizeType="small"
              className={headerConfig.customButton.className || "custom-button"}
            >
              <ButtonLogoContainer>
                {headerConfig.customButton.icon}
                <ButtonText>{headerConfig.customButton.label}</ButtonText>
              </ButtonLogoContainer>
            </TracxnButton>
          )}

          {headerConfig?.linkedInButton && (
            <LinkedInButtonStyles
              onClick={handleLinkedInClick} // Call the LinkedIn button click handler
              variantType="icon"
              sizeType="small"
              disabled={!data?.linkedInUrl} // Disable button if no LinkedIn URL
              className="linkedin-button"
            >
              <img src={linkedInButton} alt="LinkedIn Button" />
            </LinkedInButtonStyles>
          )}
        </CompanyNameContainer>
      )}
      {showViewMoreDetails && viewMoreItems?.length && (
        <ViewMoreDetails items={generateViewMoreData} />
      )}
      {!viewMore && <CommonDetailsSection sections={sections} data={data} />}
    </SummaryCardContainer>
  );
};

export default SummaryCard;
