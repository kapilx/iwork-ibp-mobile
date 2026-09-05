import React from "react";
import {
  RequestContainer,
  RequestCard,
  DateContainer,
  RequestDate,
  DateLine,
  RequestFieldsGrid,
  FieldContainer,
  FieldLabel,
  FieldValue,
  DescriptionContainer,
  DescriptionLabel,
  DescriptionText,
  ResubmitButton,
} from "./styles";

interface FieldConfig {
  label: string;
  value: string;
}

interface SupportRequestData {
  date: string;
  fields: FieldConfig[];
  description?: string;
}

interface SupportRequestComponentProps {
  data: SupportRequestData;
  onResubmit?: () => void;
  showResubmitButton?: boolean;
  showDateLine?: boolean;
  gridColumns?: number;
}

const SupportRequestComponent: React.FC<SupportRequestComponentProps> = ({
  data,
  onResubmit,
  showResubmitButton = true,
  showDateLine = false,
  gridColumns = 2,
}) => {
  return (
    <RequestContainer>
      <DateContainer>
        <RequestDate>{data.date}</RequestDate>
        {showDateLine && <DateLine />}
      </DateContainer>
      <RequestCard>
        <RequestFieldsGrid columns={gridColumns}>
          {data.fields.map((field, index) => (
            <FieldContainer key={index}>
              <FieldLabel>{field.label}</FieldLabel>
              <FieldValue>{field.value}</FieldValue>
            </FieldContainer>
          ))}
        </RequestFieldsGrid>

        {data.description && (
          <DescriptionContainer>
            <FieldLabel>Description</FieldLabel>
            <DescriptionText>{data.description}</DescriptionText>
          </DescriptionContainer>
        )}

        {showResubmitButton && (
          <ResubmitButton variant="contained" onClick={onResubmit}>
            Re-submit Ticket
          </ResubmitButton>
        )}
      </RequestCard>
    </RequestContainer>
  );
};

export default SupportRequestComponent;
