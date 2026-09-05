import React, { useState } from "react";
import accordionExpandIcon from "../../../../assets/svgs/Accordion-expand-icon.svg";
import accordionCollapseIcon from "../../../assets/svgs/accordion-collapse-icon.svg";
import enrolledIcon from "../../../assets/svgs/enroll-icon.svg";
import calendarIcon from "../../../assets/svgs/calender-icon.svg";
import {
  AccordionChildCalendar,
  AccordionChildContainer,
  AccordionChildContent,
  AccordionChildDescription,
  AccordionChildDetails,
  AccordionChildEnrolledButton,
  AccordionChildIcon,
  AccordionChildTitle,
  AccordionChildWrapper,
  AccordionContainer,
  AccordionContent,
  AccordionDescription,
  AccordionIcon,
  AccordionIconWrapper,
  AccordionMainContainer,
  Accordions,
  AccordionShowSummary,
  AccordionTitle,
  BottomText,
  EnrollBottomSection,
  EnrollBottomTextContainer,
  EnrollmentButtonContainer,
  //   AccordionChildrenWrapper,
} from "./styles";
import { benefitsAccordionData, EnrollmentBottomSection } from "../constants";
import {
  COLLAPSE,
  ENROLL_NOW,
  ENROLLED,
  EXPAND,
  MEDICAL_COVER,
  SHOW_SUMMARY,
} from "../../../constants/index";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import CommonButton from "../../../common/Button";
import {
  flattenPoliciesWithStatus,
  getEnrollmentButtonLabel,
  PolicyStatus,
} from "../../../utils/flattenPolicies";

const AccordionChild = ({ children }) => {
  const navigate = useNavigate();
  const handleEnrollNow = (policy) => {
    navigate("/enrollment", {
      state: {
        policyInfo: policy,
        // policyCount: policiesData?.employeePolicies?.length,
      },
    });
  };

  const handleViewSummary = (policy) => {
    navigate("/view-summary", {
      state: {
        policyInfo: policy,
        isViewOnlyFromEnrolled: true,
      },
    });
  };
  const futureDate = dayjs().add(10, "day").format("MMMM D, YYYY");
  return (
    <>
      {children.map((child, index) => (
        <AccordionChildWrapper data-testid="ibp-benefits-accordion-child">
          <AccordionChildContent>
            <AccordionChildDetails>
              <AccordionChildTitle>{child.title}</AccordionChildTitle>
              <AccordionChildDescription>
                {child.description}
              </AccordionChildDescription>
            </AccordionChildDetails>
            {child.isEnrolled ? (
              <AccordionChildEnrolledButton>
                <AccordionChildIcon src={enrolledIcon} />
                {ENROLLED}
              </AccordionChildEnrolledButton>
            ) : (
              <AccordionChildCalendar>
                <AccordionChildIcon src={calendarIcon} />
                {/* need to change the date dynamically */}
                {futureDate}
              </AccordionChildCalendar>
            )}
          </AccordionChildContent>
          {child?.isEditable ? (
            <AccordionShowSummary onClick={() => handleEnrollNow(child)}>
              Edit Enroll
            </AccordionShowSummary>
          ) : child.isEnrolled ? (
            <AccordionShowSummary onClick={() => handleViewSummary(child)}>
              {SHOW_SUMMARY}
            </AccordionShowSummary>
          ) : (
            <AccordionShowSummary onClick={() => handleEnrollNow(child)}>
              {ENROLL_NOW}
            </AccordionShowSummary>
          )}
        </AccordionChildWrapper>
      ))}
    </>
  );
};
const accordionContainerStyles = [
  {
    background: "linear-gradient(216.85deg, #FCFCFC -40.03%, #B6E4BF 252.14%)",
  },
  {
    background: "linear-gradient(143.56deg, #FCFCFC -36.9%, #FFF2B1 196.07%)",
  },
  {
    background: "linear-gradient(157.86deg, #FFFFFF -45.96%, #1740D2 624.02%)",
  },
];
const BenefitsAccordion = () => {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const handleToggle = (index) => {
    if (index === 0) {
      setExpandedIndex((prevIndex) => (prevIndex === index ? null : index));
    }
  };

  const policiesData = useSelector(
    (state: any) => state.policyData.policiesData
  );

  const { employeePolicies = [], enrolledPolicies = [] } = policiesData ?? {};

  const flattenedPolicies = flattenPoliciesWithStatus(policiesData);

  const isAllPoliciesLocked = flattenedPolicies.every(
    (policy) => policy.status === PolicyStatus.LOCKED
  );

  const isEnrolledPolicyAvailable = flattenedPolicies.some(
    (policy) =>
      policy.status === PolicyStatus.LOCKED ||
      policy.status === PolicyStatus.EDIT_ENROLL
  );

  const policies = [
    ...employeePolicies.map((p) => ({ ...p, isEnrolled: false })),
    ...enrolledPolicies.map((p) => ({ ...p, isEnrolled: true })),
  ];

  const policyOrder = ["GMC", "GPA", "GTL"];
  const modifiedPoliciesData = [...policies].sort(
    (a: { policyName: string }, b: { policyName: string }) =>
      policyOrder.indexOf(a.policyName) - policyOrder.indexOf(b.policyName)
  );
  const updatedPoliciesData = modifiedPoliciesData?.map((policy) => {
    const match = benefitsAccordionData[0].children.find(
      (child) => child.key === policy?.policyName
    );
    return match
      ? {
          ...policy,
          title: match.title,
          description: match.description,
        }
      : policy;
  });

  const accordionData = benefitsAccordionData.map((accordion, idx) => {
    if (idx === 0) {
      return { ...accordion, children: updatedPoliciesData };
    }
    return accordion;
  });

  const navigate = useNavigate();

  const handleEnrollAll = () => {
    navigate("/unified-enrollment");
  };

  const handleViewUnifiedSummary = () => {
    navigate("/unified-summary");
  };

  return (
    <Accordions data-testid="ibp-benefits-accordion-section">
      {accordionData.map((accordion, index) => {
        const isExpanded = expandedIndex === index;
        return (
          <AccordionMainContainer
            containerStyles={accordionContainerStyles[index]}
            data-testid="ibp-benefits-accordion"
          >
            <AccordionContainer
              onClick={() => handleToggle(index)}
              disabled={index !== 0}
            >
              <AccordionContent>
                <AccordionTitle>{accordion.title}</AccordionTitle>
                <AccordionDescription>
                  {accordion.description}
                </AccordionDescription>
              </AccordionContent>

              <AccordionIconWrapper disabled={index !== 0}>
                <AccordionIcon
                  src={isExpanded ? accordionCollapseIcon : accordionExpandIcon}
                  alt={isExpanded ? COLLAPSE : EXPAND}
                />
                {isExpanded ? COLLAPSE : EXPAND}
              </AccordionIconWrapper>
            </AccordionContainer>

            {/* children inside the same container */}
            {isExpanded && accordion.children && (
              <>
                <AccordionChildContainer data-testid="ibp-benefits-accordion-children-container">
                  <AccordionChild children={accordion.children} />
                </AccordionChildContainer>
                <EnrollBottomSection>
                  <EnrollBottomTextContainer>
                    <BottomText>
                      {EnrollmentBottomSection.EnrollmentText}
                    </BottomText>
                  </EnrollBottomTextContainer>
                  <EnrollmentButtonContainer>
                    <>
                      {isEnrolledPolicyAvailable && (
                        <CommonButton
                          variant="outlined"
                          buttonType="primary"
                          label={EnrollmentBottomSection.PrimaryButtonText}
                          fullWidth={true}
                          bgcolor="transparent"
                          width={"274px"}
                          onClick={handleViewUnifiedSummary}
                        />
                      )}
                    </>
                    <CommonButton
                      variant="outlined"
                      buttonType="primary"
                      fullWidth={true}
                      bgcolor="black"
                      color="white"
                      width={"25%"}
                      label={getEnrollmentButtonLabel(flattenedPolicies)}
                      onClick={handleEnrollAll}
                      disabled={isAllPoliciesLocked}
                    />
                  </EnrollmentButtonContainer>
                </EnrollBottomSection>
              </>
            )}
          </AccordionMainContainer>
        );
      })}
    </Accordions>
  );
};

export default BenefitsAccordion;
