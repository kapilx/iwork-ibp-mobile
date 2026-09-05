import React from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  StyledAccordion,
  StyledAccordionSummary,
  StyledAccordionDetails,
  SummaryBox,
  ActionBox,
  CustomDivider,
} from "./styles";
import Button from "../Button";

export enum AccordionVariant {
  DEFAULT = "default",
  EDITABLE = "editable",
}

interface CommonAccordionProps {
  summary: React.ReactNode;
  details: React.ReactNode;
  customStyles?: {
    accordion?: React.CSSProperties;
    summary?: React.CSSProperties;
    details?: React.CSSProperties;
  };
  variant?: AccordionVariant;
  onReset?: () => void;
  hideActions?: boolean;
  hideSummary?: boolean;
  expanded: boolean;
  onToggle: () => void;
  title?: React.ReactNode;
}

const CommonAccordion: React.FC<CommonAccordionProps> = ({
  summary,
  details,
  customStyles,
  variant = AccordionVariant.DEFAULT,
  onReset,
  hideActions = false,
  hideSummary = false,
  expanded,
  onToggle,
  title,
}) => {
  return (
    <StyledAccordion
      data-testid="Root-Accordion"
      expanded={expanded}
      style={customStyles?.accordion}
    >
      {(variant === AccordionVariant.DEFAULT || !expanded) ? (
        <StyledAccordionSummary
          expandIcon={
            variant === AccordionVariant.DEFAULT ? <ExpandMoreIcon /> : null
          }
          style={customStyles?.summary}
          onClick={onToggle}
        >
          {!hideSummary && (
            <SummaryBox>{expanded ? summary : title}</SummaryBox>
          )}
          {variant === AccordionVariant.EDITABLE && !hideActions && (
            <ActionBox>
              {onReset && (
                <Button variantType="link" onClick={onReset} label="Reset" />
              )}
              <CustomDivider />
              <Button variantType="link" onClick={onToggle} label="Edit" />
            </ActionBox>
          )}
        </StyledAccordionSummary>
      ) : null}

      <StyledAccordionDetails
        style={customStyles?.details}
        data-testid="accordion-details"
      >
        {expanded && details}
      </StyledAccordionDetails>
    </StyledAccordion>
  );
};
export default CommonAccordion;
