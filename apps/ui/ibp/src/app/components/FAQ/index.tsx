import { useNavigate } from "react-router-dom";
import CommonLoader from "../../common/CommonLoader";
import faqIcon from "../../assets/svgs/faq-icon.svg";
import { NO_FAQS_AVAILABLE } from "../../constants";
import {
  FAQContainer,
  FAQHeaderContainer,
  FAQIconWrapper,
  FAQHeaderContent,
  FAQTitle,
  FAQSubtitle,
  FAQHeaderLeftSideContainer,
  ButtonContainer,
} from "./styles";
import FAQAccordionList from "../../common/FAQAccordionList";
import { useMemo } from "react";
import { ArrowForward } from "@mui/icons-material";
import { RootState } from "../../redux/store";
import { useSelector } from "react-redux";
import { usePolicyTemplateFaqs } from "../../hooks/usePolicyTemplateFaqs";

type FAQItem = {
  id: string | number;
  question: string;
  answer: string;
};

type FAQProps = {
  title?: string;
  subtitle?: string;
  showViewMore?: boolean;
  limit?: number;
  faqsData?: FAQItem[];
};

const FAQ = ({ title, subtitle, showViewMore, limit, faqsData }: FAQProps) => {
  const navigate = useNavigate();
  const { data: companyTemplate, loading, error } = useSelector(
    (state: RootState) => state.companyTemplate,
  );

  const { faqs: policyFaqs } = usePolicyTemplateFaqs();

  const faqs = useMemo(() => {
    const sourceFaqs =
      (faqsData?.length ? faqsData : companyTemplate?.config?.faqs) ?? [];

    const companyFaqs = !Array.isArray(sourceFaqs)
      ? []
      : sourceFaqs
          .map((faq: any, index: number) => {
            const question =
              faq?.question ??
              faq?.attributes?.question ??
              faq?.title ??
              faq?.attributes?.title;
            const answer =
              faq?.answer ??
              faq?.attributes?.answer ??
              faq?.description ??
              faq?.attributes?.description;

            return {
              id: faq?.id ?? faq?.attributes?.id ?? index + 1,
              question: typeof question === "string" ? question : "",
              answer: typeof answer === "string" ? answer : "",
            };
          })
          .filter((faq) => faq.question && faq.answer);

    // Company FAQs first, then policy-template FAQs (already sorted by sequence).
    return [...companyFaqs, ...policyFaqs];
  }, [faqsData, companyTemplate, policyFaqs]);

  const isLoading = loading && faqs.length === 0;

  const visibleFaqs = useMemo(() => {
    if (!faqs || faqs.length === 0) return [];
    return limit ? faqs.slice(0, limit) : faqs;
  }, [faqs, limit]);

  const handleViewMore = () => {
    navigate("/faqs");
  };

  return (
    <FAQContainer>
      {(title || subtitle) && (
        <FAQHeaderContainer>
          <FAQHeaderLeftSideContainer>
            <FAQIconWrapper>
              <img src={faqIcon} alt="FAQ Icon" />
            </FAQIconWrapper>
            <FAQHeaderContent>
              {title && <FAQTitle>{title}</FAQTitle>}
              {subtitle && <FAQSubtitle>{subtitle}</FAQSubtitle>}
            </FAQHeaderContent>
          </FAQHeaderLeftSideContainer>

          {showViewMore && faqs.length > 5 && (
            <ButtonContainer variantType="link" onClick={handleViewMore}>
              View More FAQs
              <ArrowForward />
            </ButtonContainer>
          )}
        </FAQHeaderContainer>
      )}

      {isLoading && <CommonLoader />}

      {!isLoading && !error && visibleFaqs.length === 0 && (
        <FAQSubtitle>{NO_FAQS_AVAILABLE}</FAQSubtitle>
      )}

      {!isLoading && !error && <FAQAccordionList faqs={visibleFaqs} />}
    </FAQContainer>
  );
};

export default FAQ;
