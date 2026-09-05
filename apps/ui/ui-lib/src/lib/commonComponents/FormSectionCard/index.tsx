import React from "react";
import {
  ActionButton,
  FormFieldsContainer,
  FormSectionHeader,
  SectionDivider,
  FormSectionCardSectionTitle,
  FormSectionStyledCard,
  FormSectionStyledCardContent,
} from "./styles";

import addIcon from "../../assets/svgs/add-card.svg";

export interface FormCardProps {
  title?: string;
  children: React.ReactNode;
  showActionButton?: boolean;
  onActionClick?: () => void;
  showDivider?: boolean;
  showHeader?: boolean;
  hideCardBackground?: boolean; // Prop to control card background and header margin
}

const FormSection: React.FC<FormCardProps> = ({
  title,
  children,
  showActionButton = false,
  onActionClick,
  showDivider = true,
  showHeader = true,
  hideCardBackground = false,
}) => {
  if (hideCardBackground) {
    return (
      <>
        {showHeader && (
          <FormSectionHeader addMarginTop>
            <FormSectionCardSectionTitle>{title}</FormSectionCardSectionTitle>
            {showDivider && <SectionDivider />}
          </FormSectionHeader>
        )}
        <FormFieldsContainer>{children}</FormFieldsContainer>
        {showActionButton && (
          <ActionButton onClick={onActionClick}>
            <img src={addIcon} alt="Add" />
          </ActionButton>
        )}
      </>
    );
  }

  // Default rendering with card background
  return (
    <FormSectionStyledCard>
      <FormSectionStyledCardContent>
        {showHeader && (
          <FormSectionHeader>
            <FormSectionCardSectionTitle>{title}</FormSectionCardSectionTitle>
            {showDivider && <SectionDivider />}
          </FormSectionHeader>
        )}
        <FormFieldsContainer>{children}</FormFieldsContainer>
        {showActionButton && (
          <ActionButton onClick={onActionClick}>
            <img src={addIcon} alt="Add" />
          </ActionButton>
        )}
      </FormSectionStyledCardContent>
    </FormSectionStyledCard>
  );
};

export default FormSection;
