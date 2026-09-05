import { useRef, useState } from "react";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { Box, Typography } from "@mui/material";
import DOMPurify from "dompurify";
import {
  AnswerText,
  ExpandIcon,
  QuestionSubTitle,
  QuestionTitle,
  StyledFAQAccordion,
  StyledFAQAccordionDetails,
  StyledFAQAccordionSummary,
} from "../../components/FAQ/styles";

type FAQItem = {
  id: string | number;
  question: string;
  subtitle?: string;
  answer: string | React.ReactNode;
};

type FAQListProps = {
  faqs: FAQItem[];
};

const FAQAccordionList = ({ faqs }: FAQListProps) => {
  const [expandedPanels, setExpandedPanels] = useState<Array<string | number>>(
    [],
  );

  const accordionRefs = useRef<Record<string | number, HTMLDivElement | null>>(
    {},
  );

  const handleAccordionChange =
    (panel: string | number) =>
    (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpandedPanels((prev) =>
        isExpanded ? [...prev, panel] : prev.filter((id) => id !== panel),
      );

      if (isExpanded && accordionRefs.current[panel]) {
        setTimeout(() => {
          const el = accordionRefs.current[panel];
          if (el) {
            window.scrollTo({
              top: el.getBoundingClientRect().top + window.pageYOffset - 400,
              behavior: "smooth",
            });
          }
        }, 100);
      }
    };

  return (
    <Box>      
      {faqs.map((faq, index) => {
        const isExpanded = expandedPanels.includes(faq.id);
        const isFirst = index === 0;
        const isLast = index === faqs.length - 1;

        return (
          <StyledFAQAccordion
            key={faq.id}
            ref={(el) => (accordionRefs.current[faq.id] = el)}
            expanded={isExpanded}
            onChange={handleAccordionChange(faq.id)}
            className={`${isFirst ? 'first-accordion' : ''} ${isLast ? 'last-accordion' : ''}`}
          >
            <StyledFAQAccordionSummary
              expandIcon={
                <ExpandIcon>
                  {isExpanded ? (
                    <KeyboardArrowUpIcon />
                  ) : (
                    <KeyboardArrowDownIcon />
                  )}
                </ExpandIcon>
              }
            >
              <Box>
                <QuestionTitle>{faq.question}</QuestionTitle>
                {faq.subtitle && (
                  <QuestionSubTitle

                  >
                    {faq.subtitle}
                  </QuestionSubTitle>
                )}
              </Box>
            </StyledFAQAccordionSummary>

            <StyledFAQAccordionDetails>
              <AnswerText
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(
                    typeof faq.answer === "string" ? faq.answer : ""
                  ),
                }}
              />
            </StyledFAQAccordionDetails>
          </StyledFAQAccordion>
        );
      })}
    </Box>
  );
};

export default FAQAccordionList;
