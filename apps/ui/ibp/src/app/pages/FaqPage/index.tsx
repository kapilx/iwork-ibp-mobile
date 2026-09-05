import { useEffect, useMemo, useState } from "react";
import {
  endPoints,
  useApiQuery,
  setToastMessage,
  ibpTheme as theme,
} from "@ui/ui-lib";
import { useDispatch, useSelector } from "react-redux";
import CommonAccordion from "../../common/CommonAccordion";
import FAQAccordionList from "../../common/FAQAccordionList";
import {
  AccordionContainer,
  BackArrowButton,
  ChipsWrapper,
  ChipsWrapperContainer,
  Container,
  FaqBackArrowButton,
  FaqPageHeader,
  FaqPageOuter,
  FaqPageTitle,
  HeaderContainer,
  HeaderTypography,
  MainContainer,
  NoDataMessage,
  TitleContainer,
  TitleSection,
  SubHeaderTypography
} from "./styles";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import CommonChip from "../../common/CommonChip";
import CommonLoader from "../../common/CommonLoader";
import { FREQUENTLY_ASKED_QUESTIONS, NO_FAQS_AVAILABLE } from "../../constants";
import NoDataPage from "../../common/NoData";
import { useNavigate } from "react-router-dom";
import faqIcon from "../../assets/svgs/faq-icon.svg";
import { AppDispatch, RootState } from "../../redux/store";
import { fetchCompanyTemplate } from "../../redux/companyTemplateSlice";
import { usePolicyTemplateFaqs } from "../../hooks/usePolicyTemplateFaqs";

type FaqItem = {
  id: string | number;
  question: string;
  answer: string;
};

type TemplateFaqItem = FaqItem & {
  category?: string;
  heading?: string;
};

type FaqApiResponse = {
  statusCode: number;
  message: string;
  data: {
    faqs: Array<{
      id: number;
      question: string;
      answer: string;
    }>;
    availableCategories: string[];
  };
};

type ChipVariant = "outlined" | "filled";

type FaqPageProps = {
  isPadding?: boolean;
};

const FaqPage = ({ isPadding = true }: FaqPageProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const userDetails = JSON.parse(sessionStorage.getItem("user") || "{}");
  const employeeId = userDetails.id || "";
  const companyId = userDetails.companyId || "";
  const { data: companyTemplate, loading: templateLoading } = useSelector(
    (state: RootState) => state.companyTemplate,
  );
  const { faqs: policyFaqs } = usePolicyTemplateFaqs();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    if (companyId) {
      dispatch(fetchCompanyTemplate(companyId));
    }
  }, [companyId, dispatch]);

  const apiUrl = useMemo(() => {
    const baseUrl = `${endPoints.faqsList}?employeeId=${employeeId}`;
    if (selectedCategory === "All") {
      return baseUrl;
    }
    return `${baseUrl}&category=${encodeURIComponent(selectedCategory)}`;
  }, [employeeId, selectedCategory]);

  const {
    data: apiData,
    isLoading,
    error,
  } = useApiQuery({
    queryKey: ["employeeFaqs", employeeId, selectedCategory],
    url: apiUrl,
    enabled: Boolean(employeeId),
  });

  const templateFaqs = useMemo<TemplateFaqItem[]>(() => {
    const sourceFaqs = companyTemplate?.config?.faqs ?? [];
    if (!Array.isArray(sourceFaqs)) return [];

    return sourceFaqs
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
        const category =
          faq?.category ??
          faq?.attributes?.category ??
          faq?.type ??
          faq?.attributes?.type;
        const heading =
          faq?.heading ??
          faq?.attributes?.heading ??
          faq?.header ??
          faq?.attributes?.header;
        const sequenceRaw =
          faq?.sequencenumber ??
          faq?.sequenceNumber ??
          faq?.attributes?.sequencenumber ??
          faq?.attributes?.sequenceNumber;
        const sequence = Number(sequenceRaw);

        return {
          id: faq?.id ?? faq?.attributes?.id ?? index + 1,
          question: typeof question === "string" ? question : "",
          answer: typeof answer === "string" ? answer : "",
          category: typeof category === "string" ? category : undefined,
          heading: typeof heading === "string" ? heading : undefined,
          sequence: Number.isFinite(sequence) ? sequence : Number.MAX_SAFE_INTEGER,
          index,
        };
      })
      .filter((faq) => faq.question && faq.answer)
      .sort((a, b) => {
        if (a.sequence !== b.sequence) {
          return a.sequence - b.sequence;
        }
        return a.index - b.index;
      })
      .map(({ id, question, answer, category, heading }) => ({
        id,
        question,
        answer,
        category,
        heading,
      }));
  }, [companyTemplate]);

  // Company FAQs first, then policy-template FAQs (already sorted by sequence).
  const combinedTemplateFaqs = useMemo<TemplateFaqItem[]>(
    () => [...templateFaqs, ...policyFaqs],
    [templateFaqs, policyFaqs],
  );

  const apiFaqs: FaqItem[] = useMemo(() => {
    const json = apiData as FaqApiResponse | undefined;
    if (!json?.data?.faqs) return [];
    return json.data.faqs.map((f) => ({
      id: f.id,
      question: f.question,
      answer: f.answer,
    }));
  }, [apiData]);

  const faqs: FaqItem[] = combinedTemplateFaqs.length
    ? combinedTemplateFaqs
    : apiFaqs;

  const templateCategories: string[] = useMemo(() => {
    if (!combinedTemplateFaqs.length) return [];
    const set = new Set(
      combinedTemplateFaqs.map((f) => f.category).filter(Boolean) as string[],
    );
    return ["All", ...Array.from(set)];
  }, [combinedTemplateFaqs]);

  const apiCategories: string[] = useMemo(() => {
    const json = apiData as FaqApiResponse | undefined;
    const apiCats = json?.data?.availableCategories || [];
    return ["All", ...apiCats];
  }, [apiData]);

  const categories: string[] =
    templateCategories.length > 1 ? templateCategories : apiCategories;

  const filteredFaqs = useMemo(() => {
    if (selectedCategory === "All") return faqs;
    if (combinedTemplateFaqs.length) {
      return combinedTemplateFaqs.filter((f) => f.category === selectedCategory);
    }
    return faqs;
  }, [selectedCategory, faqs, combinedTemplateFaqs]);

  useEffect(() => {
    if (error) {
      dispatch(
        setToastMessage({
          message: error?.message || "Failed to load FAQs. Please try again.",
        }),
      );
    }
  }, [error, dispatch]);

  if (!isLoading && !error && faqs.length === 0) {
    if (isPadding) {
      return (
        <FaqPageOuter>
          <FaqPageHeader>
            <FaqBackArrowButton onClick={() => navigate("/dashboard")} aria-label="Go back">
              <ArrowBackIosNewIcon fontSize="small" />
            </FaqBackArrowButton>
            <FaqPageTitle>{FREQUENTLY_ASKED_QUESTIONS}</FaqPageTitle>
          </FaqPageHeader>
          <Container isPadding={isPadding} hasTopHeader>
            <NoDataPage
              title="No frequently asked questions available at the moment."
              subtitle="We're working on adding helpful FAQs for you. Please check back later or contact support if you have any questions."
              onBreadcrumbClick={() => navigate("/dashboard")}
              showFlyingBirds={true}
              showDivider={true}
            />
          </Container>
        </FaqPageOuter>
      );
    }
    return (
      <NoDataPage
        title="No frequently asked questions available at the moment."
        subtitle="We're working on adding helpful FAQs for you. Please check back later or contact support if you have any questions."
        breadcrumbText={isPadding ? "FAQs" : undefined}
        onBreadcrumbClick={isPadding ? () => navigate(-1) : undefined}
        showFlyingBirds={true}
        showDivider={true}
      />
    );
  }

  return (
    <FaqPageOuter>
    <Container isPadding={isPadding} hasTopHeader={isPadding}>
      <HeaderContainer>
        <ChipsWrapperContainer>
          {!isLoading && !error && faqs.length > 0 && (
            <ChipsWrapper>
              {categories.map((cat) => (
                <CommonChip
                  key={cat}
                  label={cat}
                  variant={
                    (selectedCategory === cat
                      ? "filled"
                      : "outlined") as ChipVariant
                  }
                  backgroundColor={
                    selectedCategory === cat
                      ? "transparent"
                      : "transparent"
                  }
                  textColor={
                    selectedCategory === cat
                      ? theme.palette.text.chipDefault
                      : theme.palette.primary.main
                  }
                  borderColor={
                    selectedCategory === cat
                      ? theme.palette.text.chipDefault
                      : undefined
                  }
                  onClick={() => setSelectedCategory(cat)}
                />
              ))}
            </ChipsWrapper>
          )}
        </ChipsWrapperContainer>
      </HeaderContainer>
      <TitleContainer>
        {isPadding && (
          <BackArrowButton onClick={() => navigate(-1)} aria-label="Go back">
            <ArrowBackIosNewIcon fontSize="small" />
          </BackArrowButton>
        )}
        <img src={faqIcon} alt="faq" />
        <TitleSection>
          <HeaderTypography>
            {templateFaqs[0]?.heading
              ? templateFaqs[0].heading
              : FREQUENTLY_ASKED_QUESTIONS}
          </HeaderTypography>
          <SubHeaderTypography>Quick answers to common benefit questions.</SubHeaderTypography>
        </TitleSection>
      </TitleContainer>
      <MainContainer>
        <AccordionContainer>
          {(isLoading || templateLoading) && <CommonLoader />}
          {/* {!isLoading && !error && filteredFaqs.length === 0 && (
              <NoDataMessage>{NO_FAQS_AVAILABLE}</NoDataMessage>
            )} */}

          {!isLoading && !error && faqs.length > 0 && (
            <FAQAccordionList faqs={filteredFaqs} />
          )}
        </AccordionContainer>
      </MainContainer>
    </Container>
    </FaqPageOuter>
  );
};

export default FaqPage;
