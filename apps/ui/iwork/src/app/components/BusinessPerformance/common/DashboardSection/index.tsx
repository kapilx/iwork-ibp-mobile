import React from "react";
import { SectionSubtitle, SectionTitle, SectionWrapper } from "./styles";

interface DashboardSectionProps {
  heading: string;
  subHeading: string;
  hideHeader?: boolean;
  isLoading?: boolean;
  hasError?: boolean;
  hasNoData?: boolean;
  loadingContent?: React.ReactNode;
  errorContent?: React.ReactNode;
  noDataContent?: React.ReactNode;
  children?: React.ReactNode;
}

const DashboardSection: React.FC<DashboardSectionProps> = ({
  heading,
  subHeading,
  hideHeader = false,
  isLoading = false,
  hasError = false,
  hasNoData = false,
  loadingContent,
  errorContent,
  noDataContent,
  children,
}) => {
  let content = children;

  if (isLoading) {
    content = loadingContent;
  } else if (hasError) {
    content = errorContent;
  } else if (hasNoData) {
    content = noDataContent;
  }

  return (
    <SectionWrapper>
      {!hideHeader && (
        <>
          <SectionTitle>{heading}</SectionTitle>
          <SectionSubtitle>{subHeading}</SectionSubtitle>
        </>
      )}
      {content}
    </SectionWrapper>
  );
};

export default DashboardSection;
