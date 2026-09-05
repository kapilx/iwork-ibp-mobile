import React from "react";
import ExpandMore from "../../../assets/svgs/accordain-open-icon.svg";
import {
  AccordionWrapper,
  AccordionSummaryStyled,
  AccordionDetailsStyled,
  QuestionTypography,
  AnswerTypography,
} from "./styles";

interface CommonAccordionProps {
  question: string;
  answer: string;
  expanded: boolean;
  onChange: () => void;
}

const CommonAccordion: React.FC<CommonAccordionProps> = ({
  question,
  answer,
  expanded,
  onChange,
}) => {
  return (
    <AccordionWrapper expanded={expanded} onChange={onChange}>
      <AccordionSummaryStyled
        expandIcon={<img src={ExpandMore} alt="expand more" />}
      >
        <QuestionTypography>{question}</QuestionTypography>
      </AccordionSummaryStyled>
      <AccordionDetailsStyled>
        <AnswerTypography>{answer}</AnswerTypography>
      </AccordionDetailsStyled>
    </AccordionWrapper>
  );
};

export default CommonAccordion;
