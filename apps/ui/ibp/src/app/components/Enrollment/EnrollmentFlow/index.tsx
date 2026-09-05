import {
  AccordionAction,
  AccordionActionStyles,
  AccordionButtonsRow,
  AccordionCollapsedIconStyles,
  AccordionContainer,
  AccordionFlow,
  AccordionHeaderContent,
  AccordionItem,
  AccordionTitle,
  AccordionWrapper,
  AddPolicyButton,
  ArrowButton,
  ArrowContainer,
  BasePolicyContainer,
  BasePolicyExpandedContainer,
  BasePolicyImage,
  CancelButton,
  CardsContainer,
  CarouselWrapper,
  Chevron,
  EnrolledIconStyles,
  EnrollmentHeading,
  EnrollmentHeadingContainer,
  EnrollmentSection,
  ExpandedAccordionTitle,
  NotEnrolledIconWrapper,
  PolicyItemsContainer,
  PolicyItemsTitle,
  PolicySummaryContainer,
  PolicySummaryItem,
  PolicySummaryLabel,
  PolicySummaryValue,
  PreviousPageImage,
  StyledPolicySection,
} from "./styles";
import { useLocation, useNavigate } from "react-router-dom";
import { ACTIVE, useLocalization, formatAmountWithCurrency } from "@ui/ui-lib";
import React, { useEffect, useMemo, useState } from "react";
import AccordionExpandIcon from "../../../../assets/svgs/Accordion-expand-icon.svg";
import ChevronLeft from "../../../assets/svgs/chevronLeft.svg";
import ChevronRight from "../../../assets/svgs/chevronRight.svg";
import EnrolledIcon from "../../../../assets/svgs/enrolled-icon.svg";
import NotEnrolledIcon from "../../../../assets/svgs/not-enrolled-icon.svg";
import PreviousPageIcon from "../../../../assets/svgs/previouspage-icon.svg";
import BasePolicyIcon from "../../../../assets/svgs/basehealth-policy.svg";
import accordionTagImg from "../../../assets/pngs/policy-accordion-tag.png";
import CommonLoader from "../../../common/CommonLoader";
import CommonPolicyCard from "../../../common/CommonPolicyCard";
import {
  CANCEL,
  CLICKED,
  CONTINUE,
  ENROLLED,
  ENROLLMENT_HEADING,
  NOT_ENROLLED,
} from "../../../constants";
import { ResponseType } from "../../../types";
import { generatePolicyStructureForSingleEnrollment } from "../../PolicyConfiguration/utils";
import EmployeeDetails from "./EmployeeDetails";
import FamilyMembersManagement from "./FamilyMembersManagement";
import EnrolledBadge from "../../../common/EnrolledBadge";
import { policyTypeKeys } from "../../WelllnessBenefitSection/constants";

interface RelationOption {
  name: string;
  maxAge?: string;
  minAge?: string;
  enabled: boolean;
  maxAgeError?: string;
}

interface RelationType {
  type: string;
  enabled: boolean;
  maxCount: string;
  maxCountError?: string;
  configuredOptions: RelationOption[];
}

interface RelationshipData {
  familyMaxPolicyLevel?: string;
  enabledPolicyRelations: RelationType[];
}

interface RelationConstraints {
  isRelationshipGroup?: boolean;
  relationships?: RelationshipData;
  constraints?: Record<string, unknown>;
  dependents?: unknown[];
  employeeChosenChoices?: unknown[];
  policyComponentsConfiguration?: Record<string, unknown>;
}

interface EnrollmentFlowProps {
  policyData?: ResponseType;
  policyConfigurationData: any[];
  setPolicyConfigurationData: React.Dispatch<React.SetStateAction<any[]>>;
  isLoading: boolean;
  isPolicyComponentsLoading?: boolean;
  familyMemberDetails: Record<string, any[]>;
  profileSuggestedDependents?: any[];
  onProfileSuggestedDepDeleted?: (dep: any) => void;
  onFamilyMemberChange: (updated: Record<string, any[]>) => void;
  setShouldResetSelections: React.Dispatch<React.SetStateAction<boolean>>;
  shouldResetSelections: boolean;
  isReadOnly?: boolean;
  resetTrigger?: boolean;
  setResetTrigger: React.Dispatch<React.SetStateAction<boolean>>;
}

const CARD_WIDTH = 315;
const GAP_WIDTH = 16;
const CARDS_PER_PAGE = 3;

const getDefaultChoice = (policyOption: any) => {
  const availableChoices = policyOption?.choices?.filter(
    (choice: any) => choice.isAvailable !== false
  );

  if (!availableChoices || availableChoices.length === 0) {
    return null;
  }

  // For single card scenarios, don't auto-select - let user choose manually
  if (availableChoices.length === 1) {
    return null;
  }

  return (
    availableChoices.find((choice: any) => choice.isDefault === true) ?? {
      ...availableChoices[0],
      group: policyOption.group,
    } ??
    null
  );
};

const EnrollmentFlow: React.FC<EnrollmentFlowProps> = ({
  policyData,
  policyConfigurationData,
  setPolicyConfigurationData,
  isLoading,
  isPolicyComponentsLoading = false,
  familyMemberDetails,
  profileSuggestedDependents,
  onProfileSuggestedDepDeleted,
  onFamilyMemberChange,
  setShouldResetSelections,
  shouldResetSelections,
  isReadOnly = false,
  resetTrigger = false,
  setResetTrigger,
}) => {
  console.log("policyConfigurationData", policyConfigurationData);
  const navigate = useNavigate();
  const { localizationData } = useLocalization();
  const [accordionIndex, setAccordionIndex] = useState<number | null>(null);
  const [carouselPages, setCarouselPages] = useState<{ [key: number]: number }>(
    {}
  );
  const [pendingSelections, setPendingSelections] = useState<(any | null)[]>(
    []
  );
  const [dirtyFlags, setDirtyFlags] = useState<boolean[]>([]);

  const policyOptions = useMemo(() => {
    if (!policyData) return [];
    return generatePolicyStructureForSingleEnrollment(
      policyData?.policyComponentsConfiguration
    );
  }, [policyData]);

  // Reset all accordion data to initial state (API data)
  const resetAllAccordionsToInitial = () => {
    // Reset dirty flags
    setDirtyFlags(policyOptions.map(() => false));
    // Reset pending selections directly to committed API data
    setPendingSelections(
      policyOptions.map((policy, index) => {
        const committedSelection = policyConfigurationData[index];
        if (committedSelection) {
          return { ...committedSelection, group: (policy as any).group };
        }
        // Only fall back to default if no API data exists
        return null;
      })
    );
  };

  // Listen for reset trigger from parent
  useEffect(() => {
    if (resetTrigger) {
      resetAllAccordionsToInitial();
      setResetTrigger(false);
    }
  }, [resetTrigger]);

  // Calculate total pages based on current policy options
  const totalPages = useMemo(() => {
    if (accordionIndex === null) return 1;

    const currentPolicy = policyOptions[accordionIndex];
    if (!currentPolicy) return 1;

    const availableChoices =
      currentPolicy?.choices?.filter((choice: any) => choice.isAvailable) ?? [];
    return Math.ceil(availableChoices.length / CARDS_PER_PAGE);
  }, [accordionIndex, policyOptions]);

  const handlePrev = (event: React.MouseEvent, accordionIndex: number) => {
    event.stopPropagation();
    setCarouselPages((prev) => ({
      ...prev,
      [accordionIndex]: Math.max((prev[accordionIndex] || 0) - 1, 0),
    }));
  };

  const handleNext = (event: React.MouseEvent, accordionIndex: number) => {
    event.stopPropagation();
    setCarouselPages((prev) => ({
      ...prev,
      [accordionIndex]: Math.min(
        (prev[accordionIndex] || 0) + 1,
        totalPages - 1
      ),
    }));
  };

  const handleBackNavigation = () => {
    navigate(-1); // Go back to the previous page in history
  };

  // useEffect(() => {
  //   if (policyOptions.length > 0) {
  //     setAccordionIndex(0);
  //   }
  // }, [policyOptions]);

  useEffect(() => {
    if (shouldResetSelections) {
      const reconciledCommittedSelections = policyOptions.map((policy, index) => {
        const committedSelection = policyConfigurationData?.[index] ?? null;
        if (!committedSelection) return null;

        const availableChoices =
          policy?.choices?.filter((choice: any) => choice?.isAvailable !== false) ??
          [];

        const match = availableChoices.find(
          (choice: any) =>
            choice?.sumInsuredId === committedSelection?.sumInsuredId,
        );

        if (!match) {
          return null;
        }

        return {
          ...match,
          id: committedSelection?.id,
        };
      });

      setPolicyConfigurationData(reconciledCommittedSelections);
      setDirtyFlags(policyOptions.map(() => false)); // reset to default
      setPendingSelections(
        policyOptions.map((policy, index) => {
          const availableChoices =
            policy?.choices?.filter((choice: any) => choice?.isAvailable) ?? [];
          const committedSelection =
            reconciledCommittedSelections?.[index] ?? null;

          if (
            committedSelection &&
            availableChoices.some(
              (choice: any) =>
                choice?.sumInsuredId === committedSelection?.sumInsuredId
            )
          ) {
            return { ...committedSelection, group: (policy as any).group };
          }

          return getDefaultChoice(policy);
        })
      );
      setShouldResetSelections(false);
    }
  }, [
    shouldResetSelections,
    policyOptions,
    policyConfigurationData,
    setShouldResetSelections,
  ]);

  useEffect(() => {
    setDirtyFlags((prev) => {
      const next = policyOptions.map((_, index) => prev[index] ?? false);
      return next;
    });
  }, [policyOptions]);

  useEffect(() => {
    setPendingSelections((prev) => {
      const next = policyOptions.map((policy, index) => {
        if (dirtyFlags[index]) {
          return prev[index] ?? getDefaultChoice(policy);
        }

        const committedSelection = policyConfigurationData?.[index] ?? null;
        if (committedSelection) {
          return { ...committedSelection, group: policy?.group };
        }

        const existingSelection = prev[index];

        if (
          typeof existingSelection !== "undefined" &&
          existingSelection !== null
        ) {
          return existingSelection;
        }

        return getDefaultChoice(policy);
      });

      return next;
    });
  }, [policyConfigurationData, policyOptions, dirtyFlags]);

  const updateDirtyFlag = (index: number, value: boolean) => {
    setDirtyFlags((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleCardSelection = (
    policy: any,
    index: number,
    group: string = "optional"
  ) => {
    if (isReadOnly) {
      return;
    }
    setPendingSelections((prev) => {
      const updated = [...prev];
      const currentSelection = updated[index];

      // Toggle behavior: if same card is selected, unselect it
      if (
        currentSelection &&
        currentSelection.sumInsuredId === policy.sumInsuredId
      ) {
        updated[index] = null; // Unselect
      } else {
        updated[index] = { ...policy, group }; // Select new card
      }
      return updated;
    });
    updateDirtyFlag(index, true);
  };

  const ensureArrayLength = (data: any[], index: number) => {
    const updated = [...data];
    while (updated.length <= index) {
      updated.push(null);
    }
    return updated;
  };

  // Build a list of valid accordion indexes
  const validIndexes = useMemo(() => {
    return policyOptions?.reduce<number[]>((acc, policy, index) => {
      const availableChoices =
        policy?.choices?.filter((choice: any) => choice.isAvailable) ?? [];
      if (availableChoices.length > 0) {
        acc.push(index);
      }
      return acc;
    }, []);
  }, [policyOptions]);

  useEffect(() => {
    if (validIndexes.length > 0) {
      setAccordionIndex(validIndexes[0]);
    }
  }, [validIndexes]);

  // Reset carousel page when accordion is closed
  useEffect(() => {
    if (accordionIndex === null) {
      setCarouselPages({});
    }
  }, [accordionIndex]);

  const handleEnrollSelection = (index: number) => {
    if (isReadOnly) {
      return;
    }
    const selectedPolicy = pendingSelections[index];

    if (!selectedPolicy) return;

    setPolicyConfigurationData((prev: any) => {
      const currentData = Array.isArray(prev) ? prev : [];
      const adjusted = ensureArrayLength(currentData, index);
      const previous = adjusted[index];

      const updatedPolicy = {
        ...selectedPolicy,
        id: previous?.id,
      };

      adjusted[index] = updatedPolicy;
      return adjusted;
    });

    updateDirtyFlag(index, false);

    // Move to next accordion or close all if last
    setAccordionIndex((prev) => {
      const currentPos = validIndexes.indexOf(index);
      const nextIndex = validIndexes[currentPos + 1];
      return nextIndex !== undefined ? nextIndex : null;
    });

    // setAccordionIndex((prev) => {
    //   const nextIndex = index + 1;
    //   if (nextIndex < policyOptions.length) {
    //     // open next accordion
    //     return nextIndex;
    //   }
    //   // last accordion - close all
    //   return null;
    // });
  };

  const handleCancelSelection = (index: number) => {
    if (isReadOnly) {
      setAccordionIndex(null);
      return;
    }
    const committedSelection = policyConfigurationData[index] ?? null;
    const pendingSelection = pendingSelections[index] ?? null;

    if (
      pendingSelection &&
      committedSelection &&
      pendingSelection.sumInsuredId !== committedSelection.sumInsuredId
    ) {
      setPendingSelections((prev) => {
        const updated = [...prev];
        updated[index] = committedSelection;
        return updated;
      });
      updateDirtyFlag(index, false);
      // Close the accordion after canceling
      setAccordionIndex(null);
      return;
    }

    // Clear pending selection (deselect card)
    setPendingSelections((prev) => {
      const updated = [...prev];
      updated[index] = null;
      return updated;
    });

    // Clear policy configuration data
    setPolicyConfigurationData((prev: any) => {
      const currentData = Array.isArray(prev) ? prev : [];
      const adjusted = ensureArrayLength(currentData, index);
      adjusted[index] = null;
      return adjusted;
    });

    updateDirtyFlag(index, false);
    setAccordionIndex(null);
  };

  const formatAmount = (value: number | string | undefined) => {
    if (value === null || value === undefined) {
      return "--";
    }

    const rawValue =
      typeof value === "string" ? value.replace(/[^0-9.-]/g, "") : value;

    const numericValue = Number(rawValue);

    if (Number.isNaN(numericValue) || rawValue === "") {
      return String(value);
    }

    return `${formatAmountWithCurrency(numericValue, localizationData?.data)}`;
  };

  if (isLoading) {
    return (
      <EnrollmentSection>
        <CommonLoader fullScreen={true} />
      </EnrollmentSection>
    );
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const location = useLocation();
  const policyName = location.state?.policyInfo.policyName;
  const policyTypeKey = location.state?.policyInfo.policyTypeKey;

  // Helper function to check if there are any valid relationship options (excluding "Self")
  const hasValidRelationshipOptions = (policyData?: any) => {
    // Handle nested structure from API (relationConstraints.relationships)
    const relationshipData = policyData?.relationships || policyData;

    if (!relationshipData?.enabledPolicyRelations) return false;

    // Check if there are any enabled relations that are not "Self"
    const hasValidOptions = relationshipData.enabledPolicyRelations.some(
      (relation: any) =>
        relation.enabled &&
        relation.type.toLowerCase() !== "self" &&
        relation.configuredOptions.some((option: any) => option.enabled)
    );

    return hasValidOptions;
  };

  const isPolicyGMC = policyTypeKey?.includes("POLICY_TYPE_GMC");
  const hasValidOptions = hasValidRelationshipOptions(policyData);
  const shouldShowFamilySection = isPolicyGMC && hasValidOptions;

  let displayIndex = 0;

  return (
    <EnrollmentSection>
      <EnrollmentHeadingContainer>
        <PreviousPageImage
          src={PreviousPageIcon}
          onClick={handleBackNavigation}
        />
        <EnrollmentHeading>{ENROLLMENT_HEADING}</EnrollmentHeading>
      </EnrollmentHeadingContainer>
      <EmployeeDetails isReadOnly={isReadOnly} />
      {shouldShowFamilySection && (
        <FamilyMembersManagement
          relationConstraints={policyData as any}
          familyMemberDetails={familyMemberDetails}
          profileSuggestedDependents={profileSuggestedDependents}
          onProfileSuggestedDepDeleted={onProfileSuggestedDepDeleted}
          onFamilyMemberChange={onFamilyMemberChange}
          isPolicyComponentsLoading={isPolicyComponentsLoading}
          isReadOnly={isReadOnly}
        />
      )}
      {policyOptions.map((policy, index) => {
        // Filter available choices once
        const availableChoices =
          policy?.choices?.filter((choice) => choice.isAvailable) ?? [];

        // Skip policies that have no available choices
        if (availableChoices.length === 0) return null;

        displayIndex += 1;

        const isExpanded = accordionIndex === index;
        const committedSelection = policyConfigurationData[index];
        const isSelected = Boolean(committedSelection);
        const pendingSelection = pendingSelections[index];

        const totalPremium = committedSelection
          ? Number(
              committedSelection?.companyContribution ??
                committedSelection?.companyPay ??
                0
            ) +
            Number(
              committedSelection?.employeeContribution ??
                committedSelection?.employeePay ??
                0
            )
          : 0;

        const hasCarousel = availableChoices.length > CARDS_PER_PAGE;
        const slideDistance = CARDS_PER_PAGE * (CARD_WIDTH + GAP_WIDTH);
        const group = policy.group || "optional";

        return (
          <AccordionWrapper
            key={`${policy.id}-${index}`}
            data-testid="ibp-enrollment-accordion-wrapper"
          >
            <AccordionItem isExpanded={isExpanded} colorIndex={index}>
              {/* Accordion Header */}
              <AccordionContainer
                onClick={() => {
                  setAccordionIndex((prev) => {
                    const nextIndex = prev === index ? null : index;

                    // Clean up pending selections when closing/switching accordions
                    if (prev !== null) {
                      const prevCommittedData =
                        policyConfigurationData[prev] ?? null;
                      const prevPendingData = pendingSelections[prev];
                      const prevDirty = dirtyFlags[prev];

                      // Reset to committed data if pending differs
                      if (
                        prevDirty ||
                        (prevPendingData &&
                          prevCommittedData &&
                          prevPendingData.sumInsuredId !==
                            prevCommittedData.sumInsuredId)
                      ) {
                        setPendingSelections((prevSelections) => {
                          const updated = [...prevSelections];
                          updated[prev] = {
                            ...prevCommittedData,
                            group: group,
                          };
                          return updated;
                        });
                        updateDirtyFlag(prev, false);
                      }
                    }

                    // Sync pending data when opening a new accordion
                    if (nextIndex !== null) {
                      setPendingSelections((prevSelections) => {
                        const updated = [...prevSelections];
                        const defaultChoice = getDefaultChoice(
                          policyOptions[nextIndex]
                        );
                        updated[nextIndex] = policyConfigurationData[
                          nextIndex
                        ] ?? { ...defaultChoice, group: group };
                        return updated;
                      });
                      updateDirtyFlag(nextIndex, false);
                    }

                    return nextIndex;
                  });
                }}
              >
                <AccordionActionStyles>
                  <AccordionHeaderContent>
                    {isExpanded ? (
                      <BasePolicyContainer>
                        <BasePolicyImage src={BasePolicyIcon} />
                        <ExpandedAccordionTitle
                          enrolled={isSelected}
                          title={policy.label || ""}
                          data-testid="accordion-title"
                        >
                          {policy.label || ""}
                        </ExpandedAccordionTitle>
                      </BasePolicyContainer>
                    ) : (
                      <BasePolicyExpandedContainer>
                        <BasePolicyImage src={accordionTagImg} />
                        <AccordionFlow>
                          {String(displayIndex).padStart(2, "0")}
                        </AccordionFlow>
                      </BasePolicyExpandedContainer>
                    )}

                    {!isExpanded && (
                      <NotEnrolledIconWrapper data-testid="enrolled-badge-wrapper">
                        <AccordionTitle
                          enrolled={isSelected}
                          title={policy.label || ""}
                          data-testid="accordion-title"
                        >
                          {policy.label || ""}
                        </AccordionTitle>
                        <EnrolledBadge
                          label={isSelected ? ENROLLED : NOT_ENROLLED}
                        />
                      </NotEnrolledIconWrapper>
                    )}
                  </AccordionHeaderContent>

                  {!isExpanded && committedSelection && (
                    <PolicySummaryContainer data-testid="policy-summary-container">
                      <PolicySummaryItem>
                        <PolicySummaryValue>
                          {formatAmount(committedSelection?.sumInsured)}
                        </PolicySummaryValue>
                        <PolicySummaryLabel>Sum insured</PolicySummaryLabel>
                      </PolicySummaryItem>
                      {/* <PolicySummaryItem>
                        <PolicySummaryValue>
                          {formatAmount(totalPremium)}
                        </PolicySummaryValue>
                        <PolicySummaryLabel>Total premium</PolicySummaryLabel>
                      </PolicySummaryItem> */}
                      {
                        <PolicySummaryItem>
                          {committedSelection?.showCompanyContribution ? (
                            <>
                              <PolicySummaryValue>
                                {formatAmount(
                                  committedSelection?.companyContribution
                                )}
                              </PolicySummaryValue>
                              <PolicySummaryLabel>
                                Company contribution
                              </PolicySummaryLabel>
                            </>
                          ) : null}
                        </PolicySummaryItem>
                      }
                      <PolicySummaryItem>
                        <PolicySummaryValue>
                          {formatAmount(
                            committedSelection?.employeeContribution ??
                              committedSelection?.employeePay
                          )}
                        </PolicySummaryValue>
                        <PolicySummaryLabel>
                          Your contribution
                        </PolicySummaryLabel>
                      </PolicySummaryItem>
                    </PolicySummaryContainer>
                  )}
                </AccordionActionStyles>

                <AccordionAction>
                  <AccordionCollapsedIconStyles
                    src={AccordionExpandIcon}
                    alt="Expand"
                    expanded={isExpanded}
                  />
                  {isExpanded ? "Close" : "Expand"}
                </AccordionAction>
              </AccordionContainer>
              {isExpanded && (
                <StyledPolicySection>
                  <PolicyItemsContainer>
                    <PolicyItemsTitle>{"Choose Your Plan"}</PolicyItemsTitle>
                    {hasCarousel && (
                      <ArrowContainer>
                        <ArrowButton
                          onClick={(e) => handlePrev(e, index)}
                          disabled={
                            !carouselPages[index] || carouselPages[index] === 0
                          }
                          data-testid="chevron-left"
                        >
                          <Chevron src={ChevronLeft} />
                        </ArrowButton>
                        <ArrowButton
                          onClick={(e) => handleNext(e, index)}
                          disabled={carouselPages[index] === totalPages - 1}
                          data-testid="chevron-right"
                        >
                          <Chevron src={ChevronRight} />
                        </ArrowButton>
                      </ArrowContainer>
                    )}
                  </PolicyItemsContainer>
                  <CarouselWrapper>
                    <CardsContainer
                      data-testid="ibp-enrollment-policy-cards-container"
                      sx={{
                        transform: `translateX(-${
                          (carouselPages[index] || 0) * slideDistance
                        }px)`,
                        transition: "transform 0.5s ease",
                      }}
                    >
                      {availableChoices.map((choice) => {
                        const isSelected =
                          pendingSelection?.sumInsuredId ===
                          choice.sumInsuredId;
                        const isCardReadOnly = isReadOnly && !isSelected;
                        const selectedMemberCount =
                          Object.values(familyMemberDetails).flat().length + 1;

                        return (
                          <CommonPolicyCard
                            key={`${choice.sumInsuredId}-${policy.id}`}
                            sumInsured={choice?.sumInsured || "0"}
                            premiumPerFamily={(
                              choice.companyContribution +
                              choice.employeeContribution
                            ).toString()}
                            companyPays={choice.companyContribution.toString()}
                            myPay={choice.employeeContribution.toString()}
                            premiumPerLife={choice.premiumPerLife}
                            selectedMemberCount={selectedMemberCount}
                            showCompanyContribution={
                              choice.showCompanyContribution
                            }
                            state={isSelected ? CLICKED : ACTIVE}
                            onClick={() =>
                              handleCardSelection(
                                choice,
                                index,
                                policy?.group || "optional"
                              )
                            }
                            isReadOnly={isCardReadOnly}
                            localization={localizationData?.data}
                          />
                        );
                      })}
                    </CardsContainer>
                  </CarouselWrapper>

                  {/* Buttons */}
                  {!isReadOnly && (
                    <AccordionButtonsRow>
                      {(pendingSelection || committedSelection) && (
                        <CancelButton
                          variant="outlined"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleCancelSelection(index);
                          }}
                        >
                          {CANCEL}
                        </CancelButton>
                      )}

                      <AddPolicyButton
                        variant="contained"
                        disableElevation
                        disabled={!pendingSelection}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleEnrollSelection(index);
                        }}
                      >
                        {CONTINUE}
                      </AddPolicyButton>
                    </AccordionButtonsRow>
                  )}
                </StyledPolicySection>
              )}
            </AccordionItem>
          </AccordionWrapper>
        );
      })}
    </EnrollmentSection>
  );
};

export default EnrollmentFlow;
