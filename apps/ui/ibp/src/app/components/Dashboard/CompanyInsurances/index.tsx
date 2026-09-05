import React, { useState } from "react";
import {
  InsuranceContainer,
  InsuranceContent,
  InsuranceCards,
  DogOverlayImage,
  InsuranceTitle,
  ArrowContainer,
  ArrowButton,
  CarouselWrapper,
  Container,
  Chevron,
  PaginationDots,
  Dot,
  CarouselSection,
  CardContainer,
} from "./styles";
import CommonInsuranceCard from "../../../common/CommonInsuranceCard";
import dog from "../../../assets/svgs/pet-insurance-illustration.svg";
import { companyInsuranceData } from "../constants";
import ChevronLeft from "../../../assets/svgs/chevronLeft.svg";
import ChevronRight from "../../../assets/svgs/chevronRight.svg";
import { useNavigate } from "react-router-dom";
import { useLocalization } from "@ui/ui-lib";

export interface CompanyInsurancesProps {
  policiesData?: {
    enrolledPolicies?: Array<Record<string, unknown>>;
    employeePolicies?: Array<Record<string, unknown>>;
  };
}

const CARD_WIDTH = 325;
const GAP_WIDTH = 30;
const CARDS_PER_PAGE = 3;

const CompanyInsurances: React.FC<CompanyInsurancesProps> = ({
  policiesData,
}) => {
  const displayData =
    policiesData?.enrolledPolicies || companyInsuranceData.cards;
  const totalPages = Math.ceil(displayData.length / CARDS_PER_PAGE);
  const hasCarousel = displayData.length > CARDS_PER_PAGE;

  const [currentPage, setCurrentPage] = useState(0);
  const navigate = useNavigate();
  const { localizationData } = useLocalization();

  const slideDistance = CARDS_PER_PAGE * (CARD_WIDTH + GAP_WIDTH);

  const handlePrev = () => setCurrentPage((prev) => Math.max(prev - 1, 0));
  const handleNext = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1));
  const handleDotClick = (page: number) => setCurrentPage(page);

  const handlePolicyCardClick = (policy: Record<string, unknown>) => {
    if (!policy?.policyId) return;
    if (policy?.isEditable) {
      navigate("/unified-enrollment", {
        state: {
          policyInfo: policy,
        },
      });
    } else {
      navigate("/view-summary", {
        state: {
          policyInfo: policy,
          isViewOnlyFromEnrolled: true,
        },
      });
    }
  };
  return (
    <InsuranceContainer data-testid="ibp-company-insurances-section">
      <Container>
        <InsuranceTitle>{companyInsuranceData.title}</InsuranceTitle>

        {hasCarousel && (
          <ArrowContainer>
            <ArrowButton onClick={handlePrev} disabled={currentPage === 0}>
              <Chevron src={ChevronLeft} />
            </ArrowButton>
            <ArrowButton
              onClick={handleNext}
              disabled={currentPage === totalPages - 1}
            >
              <Chevron src={ChevronRight} />
            </ArrowButton>
          </ArrowContainer>
        )}
      </Container>

      <InsuranceContent>
        <CarouselSection>
          <CarouselWrapper>
            <InsuranceCards
              sx={{
                transform: `translateX(-${currentPage * slideDistance}px)`,
                transition: "transform 0.5s ease",
              }}
            >
              {displayData.map(
                (card: Record<string, unknown>, index: number) => {
                  const cardProps = {
                    title: card.title || card.policyName || card.name || "",
                    policyNumber:
                      card.policyNumber || card.policyNo || card.id || "",
                    sumInsured: card.sumInsured || card.sumInsuredAmount || "",
                    balance: card.balance || card.availableBalance || "",
                    dependentsCount:
                      card.dependentsCount || card.dependents || 0,
                    dueDate:
                      card.dueDate || card.expiryDate || card.validTill || "",
                    claimsCount: card.claimsCount || card.claims || 0,
                    insurerLogoFileId: card.insurerLogoFileId || "",
                  };

                  return (
                    <CardContainer
                      onClick={() => handlePolicyCardClick(card)}
                      key={index}
                      data-testid="ibp-company-insurance-card"
                    >
                      <CommonInsuranceCard
                        {...cardProps}
                        fromDashboard={true}
                        localizationConfig={localizationData?.data}
                      />
                    </CardContainer>
                  );
                }
              )}
            </InsuranceCards>
          </CarouselWrapper>

          {hasCarousel && (
            <PaginationDots>
              {Array.from({ length: totalPages }).map((_, i) => (
                <Dot
                  key={i}
                  active={i === currentPage}
                  onClick={() => handleDotClick(i)}
                />
              ))}
            </PaginationDots>
          )}
        </CarouselSection>

        <DogOverlayImage
          src={dog}
          alt="Decorative dog"
          aria-hidden="true"
          hasCarousel={hasCarousel}
        />
      </InsuranceContent>
    </InsuranceContainer>
  );
};

export default CompanyInsurances;
