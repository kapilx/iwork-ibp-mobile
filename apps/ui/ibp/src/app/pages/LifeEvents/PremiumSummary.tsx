import React, { useEffect, useMemo, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useLocalization, getTaxLabel } from '@ui/ui-lib';
import { useDispatch, useSelector } from 'react-redux';
import { DECLARATION_DATA } from '../../constants';
import { LIFE_EVENTS_PREMIUM_SUMMARY_COPY } from './constants';
import ColoredShiledIcon from '../../assets/svgs/colored-shield-icon.svg';
import OptionalIcon from '../../assets/svgs/optional-benefits-icon.svg';
import AccordionExpandIcon from '../../assets/svgs/accordion-arrow.svg';
import PipeSeparator from '../../assets/svgs/separator-pipe-symbol.svg';
import {
  StyledPolicyCardWrapper,
  PlanCard,
  PolicyHeader,
  PolicyIcon,
  PolicyTitle,
  PlanInfoSection,
  PlanInfoGrid,
  InfoColumn,
  InfoLabel,
  InfoValue,
  Separator,
  SummarySectionsWrapper,
  SummarySectionContainer,
  SummarySectionAccordionWrapper,
  SummarySectionAccordionHeader,
  SummarySectionAccordionContent,
  SummarySectionAccordionContentInner,
  SummarySectionHeaderContent,
  SummarySectionIconWrapper,
  SummarySectionIcon,
  SummarySectionText,
  SummarySectionTitle,
  SummarySectionSubtitle,
  SummarySectionArrow,
} from '../../components/MultiEnrollment/MultiEnrollmentSummary/styles';
import { AppDispatch, RootState } from '../../redux/store';
import { fetchCompanyTemplate } from '../../redux/companyTemplateSlice';
import {
  DeclarationCheckbox,
  DeclarationContent,
  DeclarationPoint,
  DeclarationPointLabel,
  DeclarationSection,
  DeclarationTitle,
} from '../../components/EnrollmentSummary/styles';
import {
  AdditionDetailsFooterActions,
  AdditionDetailsFooterRightGroup,
  AdditionDetailsPrimaryButton,
  AdditionDetailsSecondaryButton,
  LoadingButtonContent,
  PremiumSummaryPage,
  PremiumSummaryLabel,
  PremiumSummaryValue,
  SummaryDivider,
  PremiumSummaryCardForSummary,
  PremiumTotalSummaryRowWithBorder,
} from './styles';
import { getLifeEventDependentKey } from './policyChoices';
import { getPolicyIcon as getPolicyIconShared } from '../../components/MultiEnrollment/MultiEnrollmentSummary';

interface PolicySummary {
  policyId: string | number;
  selectionGroupKey?: string;
  policyTypeKey?: string;
  policyName?: string;
  policyLabel: string;
  policyType: string;
  sumInsured: string | number;
  premium?: number;
  totalPremium: number;
  companyContribution: number;
  employeeContribution: number;
  premiumPerLife?: boolean;
  showCompanyContribution?: boolean;
  existingDependentsCount?: number;
  selectedDependentKeys?: string[];
  isRelationshipGroup?: boolean;
  isOptional?: boolean;
}

interface DependentSummary {
  name?: string;
  relationship?: string;
  relation?: string;
}

interface PolicyGroup {
  key: string;
  title: string;
  initials: string;
  gradient: string;
  borderGradient: string;
  policies: PolicySummary[];
}

interface PremiumSummaryProps {
  selectedRelation: string | null;
  selectedPolicySummaries: PolicySummary[];
  dependentsData: DependentSummary[];
  currentTotalPremium: number;
  newTotalPremium: number;
  additionalPremium: number;
  monthlyDeduction: number | null;
  isSubmitting?: boolean;
  onBack: () => void;
  onExit?: () => void;
  onContinue: () => void;
  formatCurrency: (value: unknown) => string;
  isGstApplicable?: boolean;
  showGst?: boolean;
  gstRate?: number;
}

type DisclaimerNote = { content: string; isMandatory: boolean };

const extractDisclaimerNotes = (notes: any): DisclaimerNote[] => {
  if (Array.isArray(notes)) {
    return notes
      .map((note: any) => {
        const text =
          note?.text ??
          note?.attributes?.text ??
          note?.description ??
          note?.attributes?.description;
        const isMandatory = Boolean(
          note?.isMandatory ?? note?.attributes?.isMandatory ?? false,
        );
        return {
          content: typeof text === 'string' ? text.trim() : '',
          isMandatory,
        };
      })
      .filter((note) => Boolean(note.content));
  }

  if (Array.isArray(notes?.data)) {
    return extractDisclaimerNotes(notes.data);
  }

  if (Array.isArray(notes?.data?.data)) {
    return extractDisclaimerNotes(notes.data.data);
  }

  return [];
};

// A policy whose coverage period has already ended, or that's still in its
// open enrollment window (not yet locked), can't take life events — mirrors
// the eligibility rule used inside the actual add/remove-dependent flow.
const isPolicyExpired = (dueDate: unknown): boolean => {
  if (!dueDate) return false;

  const parsedEndDate = new Date(dueDate as string);
  if (Number.isNaN(parsedEndDate.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  parsedEndDate.setHours(0, 0, 0, 0);

  return parsedEndDate.getTime() < today.getTime();
};

const normalizePolicyGroupKey = (
  policySummary: Pick<PolicySummary, 'policyId' | 'policyName' | 'policyTypeKey' | 'policyType'>,
) =>
  String(
    policySummary.policyTypeKey ||
      policySummary.policyId ||
      policySummary.policyName ||
      policySummary.policyType ||
      'policy',
  )
    .trim()
    .toLowerCase();

const prettifyPolicyTitle = (value: string) =>
  value
    .replace(/^policy[_\s-]*type[_\s-]*/i, '')
    .replace(/^group[_\s-]*/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((segment) =>
      segment ? segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase() : segment,
    )
    .join(' ');

const PremiumSummary: React.FC<PremiumSummaryProps> = ({
  selectedRelation: _selectedRelation,
  selectedPolicySummaries,
  dependentsData,
  currentTotalPremium,
  additionalPremium: _additionalPremium,
  monthlyDeduction: _monthlyDeduction,
  isSubmitting = false,
  onBack,
  onExit,
  onContinue,
  formatCurrency,
  isGstApplicable = false,
  showGst = false,
  gstRate = 0.18,
}) => {
  const withGst = (val: number) =>
    isGstApplicable ? parseFloat((val * (1 + gstRate)).toFixed(2)) : val;
  const { localizationData } = useLocalization();
  const taxLabel = getTaxLabel(localizationData?.data);
  const dispatch = useDispatch<AppDispatch>();
  const relationConstraints = useSelector(
    (state: RootState) => state.policyData.relationDependentData,
  );
  const policiesData = useSelector(
    (state: RootState) => state.policyData.policiesData,
  );
  const { data: companyTemplate } = useSelector(
    (state: RootState) => state.companyTemplate,
  );

  const userDetails = JSON.parse(sessionStorage.getItem('user') || '{}');
  const companyId = userDetails?.companyId;

  useEffect(() => {
    if (companyId) {
      dispatch(fetchCompanyTemplate(companyId));
    }
  }, [companyId, dispatch]);

  const gmcPolicy = useMemo(() => {
    if (!Array.isArray(relationConstraints)) return null;

    const employeePolicies = policiesData?.employeePolicies ?? [];
    const enrolledPolicies = policiesData?.enrolledPolicies ?? [];
    const editabilityMap = new Map<string, boolean | null>();
    const dueDateMap = new Map<string, string | null>();
    [...employeePolicies, ...enrolledPolicies].forEach((policy: any) => {
      if (policy?.policyId != null) {
        editabilityMap.set(String(policy.policyId), policy?.isEditable ?? null);
        dueDateMap.set(String(policy.policyId), policy?.dueDate ?? null);
      }
    });

    return (
      relationConstraints.find(
        (policy: { policyId?: string | number; policyTypeKey?: string }) => {
          if (!String(policy?.policyTypeKey || '').toLowerCase().includes('gmc')) {
            return false;
          }

          const policyId = policy?.policyId;
          const isEditable =
            policyId != null ? editabilityMap.get(String(policyId)) : null;
          if (isEditable !== false) return false;

          const dueDate =
            policyId != null ? dueDateMap.get(String(policyId)) : null;
          return !isPolicyExpired(dueDate);
        },
      ) ?? null
    );
  }, [relationConstraints, policiesData]);

  // Function to check if company contribution should be shown for a policy
  const shouldShowCompanyContribution = (policySummary: PolicySummary): boolean => {
    // Check constraint-level flag
    const constraintsData =
      gmcPolicy?.configuration?.constraints ??
      gmcPolicy?.constraints ?? {};
    const showEmployeeContrib =
      constraintsData?.showEmployeeContribution === true;
    
    // Check policy-level flag
    const policyShowsContribution = policySummary?.showCompanyContribution === true;
    
    // Both must be true to show company contribution
    return showEmployeeContrib && policyShowsContribution;
  };

  const constraints = gmcPolicy?.configuration?.constraints;
  const policyDisclaimerNoteTexts = useMemo(
    () => extractDisclaimerNotes(gmcPolicy?.configuration?.disclaimerNotes),
    [gmcPolicy],
  );
  const companyDisclaimerNoteTexts = useMemo(
    () => extractDisclaimerNotes(companyTemplate?.config?.disclaimerNotes),
    [companyTemplate],
  );

  const declarationPoints = useMemo(() => {
    const points: Array<{ content: string; isMandatory: boolean }> = [];

    if (
      !constraints?.enrollmentConfirmationRequired &&
      !String(constraints?.customDisclaimerBeforeSubmission || '').trim()
    ) {
      return [];
    }

    // Custom disclaimer: mandatory only when enrollment confirmation is required,
    // otherwise optional.
    if (constraints?.customDisclaimerBeforeSubmission) {
      points.push({
        content: String(constraints.customDisclaimerBeforeSubmission).trim(),
        isMandatory: Boolean(constraints?.enrollmentConfirmationRequired),
      });
    }

    policyDisclaimerNoteTexts.forEach((note) => {
      points.push({ content: note.content, isMandatory: note.isMandatory });
    });
    companyDisclaimerNoteTexts.forEach((note) => {
      points.push({ content: note.content, isMandatory: note.isMandatory });
    });

    const deduped: Array<{ content: string; isMandatory: boolean }> = [];
    const seenOptional = new Set<string>();
    points.forEach((point) => {
      const content = String(point.content || '').trim();
      if (!content) return;
      if (!point.isMandatory) {
        if (seenOptional.has(content)) return;
        seenOptional.add(content);
      }
      deduped.push({ ...point, content });
    });

    deduped.sort((left, right) => {
      if (left.isMandatory === right.isMandatory) return 0;
      return left.isMandatory ? -1 : 1;
    });

    if (deduped.length === 0) {
      return (DECLARATION_DATA.points || []).map((point) => ({
        content: point.content,
        isMandatory: true,
      }));
    }

    return deduped;
  }, [
    companyDisclaimerNoteTexts,
    constraints?.customDisclaimerBeforeSubmission,
    constraints?.enrollmentConfirmationRequired,
    policyDisclaimerNoteTexts,
  ]);

  const [checkedDeclarations, setCheckedDeclarations] = useState<boolean[]>([]);
  const [sectionExpanded, setSectionExpanded] = useState<{ compulsory: boolean; optional: boolean }>({
    compulsory: true,
    optional: true,
  });

  const toggleSection = (section: 'compulsory' | 'optional') => {
    setSectionExpanded((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    setCheckedDeclarations(declarationPoints.map(() => false));
  }, [declarationPoints]);

  const showDeclarations = declarationPoints.length > 0;

  const areAllDeclarationsChecked =
    !showDeclarations ||
    declarationPoints.length === 0 ||
    declarationPoints.every((point, index) => {
      if (!point.isMandatory) return true;
      return checkedDeclarations[index] === true;
    });

  const handleDeclarationChange = (index: number) => {
    setCheckedDeclarations((previousState) => {
      const updatedState = [...previousState];
      updatedState[index] = !updatedState[index];
      return updatedState;
    });
  };

  const displayedPolicySummaries = selectedPolicySummaries;

  const getPolicyIconMeta = (policySummary: PolicySummary) =>
    getPolicyIconShared(
      policySummary.policyName || policySummary.policyTypeKey || policySummary.policyType
    );

  const getPolicyGroupTitle = (policySummary: PolicySummary) => {
    const explicitName = String(policySummary.policyName || '').trim();
    if (explicitName) {
      return explicitName;
    }

    const policyTypeKey = String(policySummary.policyTypeKey || '').trim();
    if (policyTypeKey) {
      const cleaned = prettifyPolicyTitle(policyTypeKey);
      return cleaned ? `Group ${cleaned}` : 'Policy';
    }

    const name = `${policySummary.policyName || ''} ${policySummary.policyType || ''}`.toLowerCase();

    if (name.includes('accident') || name.includes('gpa') || name.includes('personal')) {
      return 'Group Personal Accident (GPA)';
    }

    if (name.includes('term') || name.includes('life') || name.includes('gtl')) {
      return 'Group Term Life (GTL)';
    }

    return 'Group Mediclaim (GMC)';
  };

  const selfName = [
    userDetails?.firstName,
    userDetails?.lastName,
  ]
    .filter(Boolean)
    .join(' ')
    .trim() || userDetails?.name || userDetails?.fullName || 'Self';

  const getDependentComponentIds = (dependent: any): number[] => {
    const componentIds = new Set<number>();
    const mainComponentId = Number(dependent?.policyComponentActionTypeId);
    if (Number.isFinite(mainComponentId)) {
      componentIds.add(mainComponentId);
    }
    (dependent?.choices || []).forEach((choice: any) => {
      const choiceComponentId = Number(choice?.policyComponentActionTypeId);
      if (Number.isFinite(choiceComponentId)) {
        componentIds.add(choiceComponentId);
      }
    });
    return Array.from(componentIds);
  };

  const existingDependentsByComponentId = new Map<number, string[]>();
  (gmcPolicy?.configuration?.dependents || []).forEach((dependent: any) => {
    const relation = dependent?.relationship || dependent?.relation || '';
    const relationLabel = relation
      ? relation.charAt(0).toUpperCase() + relation.slice(1).toLowerCase()
      : 'Dependent';
    const dependentLabel = `${dependent?.name || '--'} (${relationLabel})`;
    getDependentComponentIds(dependent).forEach((componentId) => {
      const existing = existingDependentsByComponentId.get(componentId) || [];
      existingDependentsByComponentId.set(componentId, [...existing, dependentLabel]);
    });
  });

  const policyTemplate = gmcPolicy?.configuration?.policyTemplate ?? null;

  const getEligibleRelationsForComponent = (componentId: number): string[] => {
    if (!policyTemplate || !Number.isFinite(componentId)) return [];
    const id = Number(componentId);
    if (Number(policyTemplate?.basePolicy?.mainPolicyId) === id) {
      return policyTemplate.basePolicy.eligibleRelations || [];
    }
    const baseAddon = (policyTemplate?.basePolicy?.addonIds || []).find(
      (addon: any) => Number(addon?.optionId) === id,
    );
    if (baseAddon) return baseAddon.eligibleRelations || [];
    if (Number(policyTemplate?.parentalPolicy?.mainPolicyId) === id) {
      return policyTemplate.parentalPolicy.eligibleRelations || [];
    }
    const parentalAddon = (policyTemplate?.parentalPolicy?.addonIds || []).find(
      (addon: any) => Number(addon?.optionId) === id,
    );
    if (parentalAddon) return parentalAddon.eligibleRelations || [];
    return [];
  };

  const getMembersCoveredTextForPolicy = (policySummary: PolicySummary) => {
    const componentId = Number(policySummary.policyId);
    const existingMembers = Number.isFinite(componentId)
      ? existingDependentsByComponentId.get(componentId) || []
      : [];
    const selectedDependentKeys = new Set(policySummary.selectedDependentKeys || []);
    const selectedNewDependents = selectedDependentKeys.size
      ? (dependentsData || [])
          .filter((dependent) =>
            selectedDependentKeys.has(getLifeEventDependentKey(dependent)),
          )
          .map((dependent) => {
            const relation = dependent.relationship || dependent.relation || '';
            const relationLabel = relation
              ? relation.charAt(0).toUpperCase() + relation.slice(1).toLowerCase()
              : 'Dependent';
            return `${dependent.name || '--'} (${relationLabel})`;
          })
      : [];

    // Determine if Self should be shown.
    // Priority 1: policyTemplate eligibleRelations for this component (most accurate).
    // Priority 2: policyType — only 'base' covers self.
    let showSelf: boolean;
    if (policyTemplate && Number.isFinite(componentId)) {
      const eligibleRelations = getEligibleRelationsForComponent(Number(componentId));
      if (eligibleRelations.length > 0) {
        showSelf = eligibleRelations.some(
          (r: string) => String(r).trim().toLowerCase() === 'self',
        );
      } else {
        showSelf = String(policySummary.policyType || '').toLowerCase() === 'base';
      }
    } else {
      showSelf = String(policySummary.policyType || '').toLowerCase() === 'base';
    }

    const allMembers = [
      ...(showSelf ? [`${selfName} (Self)`] : []),
      ...existingMembers,
      ...selectedNewDependents,
    ].filter(Boolean);
    const uniqueMembers = allMembers.filter(
      (member, index, collection) => collection.indexOf(member) === index,
    );
    return uniqueMembers.join(', ');
  };
  const uniqueDependentKeys = new Set(
    (dependentsData || []).map((dependent: any) =>
      String(
        dependent?.id ??
          dependent?.dependentId ??
          `${dependent?.name || ''}|${dependent?.relationship || dependent?.relation || ''}|${dependent?.dateOfBirth || dependent?.dob || ''}`,
      ),
    ),
  );
  const newDependentsCount = Math.max(0, uniqueDependentKeys.size);

  const getBasePremium = (policySummary: PolicySummary) =>
    Number(policySummary.premium ?? policySummary.totalPremium ?? 0) || 0;

  const getPostAdditionMultiplier = (policySummary: PolicySummary) => {
    if (!policySummary.premiumPerLife) return 1;
    const existingDependentsCount = Number(policySummary.existingDependentsCount || 0);
    return Math.max(1, 1 + existingDependentsCount + newDependentsCount);
  };

  const getEffectiveCompanyContribution = (
    policySummary: PolicySummary,
    value: number,
  ) => {
    const baseValue = Number(value || 0);
    if (!Number.isFinite(baseValue)) return 0;
    return baseValue * getPostAdditionMultiplier(policySummary);
  };

  const getEffectiveEmployeeContribution = (
    policySummary: PolicySummary,
    value: number,
  ) => {
    const baseValue = Number(value || 0);
    if (!Number.isFinite(baseValue)) return 0;
    return baseValue * getPostAdditionMultiplier(policySummary);
  };

  const getEffectivePremium = (policySummary: PolicySummary) => {
    const basePremium = getBasePremium(policySummary);
    return basePremium * getPostAdditionMultiplier(policySummary);
  };

  const groupPoliciesByType = (policies: PolicySummary[]): PolicyGroup[] =>
    policies.reduce<PolicyGroup[]>((accumulator, policySummary) => {
      const iconMeta = getPolicyIconMeta(policySummary);
      const groupTitle = getPolicyGroupTitle(policySummary);
      const groupKey = normalizePolicyGroupKey(policySummary);
      const existingGroup = accumulator.find((group) => group.key === groupKey);

      if (existingGroup) {
        existingGroup.policies.push(policySummary);
        return accumulator;
      }

      accumulator.push({
        key: groupKey,
        title: groupTitle,
        initials: iconMeta.initials,
        gradient: iconMeta.gradient,
        borderGradient: iconMeta.borderGradient,
        policies: [policySummary],
      });

      return accumulator;
    }, []);

  // Same rule the enrolment and dashboard buckets use: an `optional` component,
  // or one the configurator flagged `isOptional`, belongs under Optional.
  // Compared against true so components saved before the flag existed stay
  // Compulsory.
  const isOptionalPolicySummary = (p: PolicySummary) =>
    String(p.policyType || '').toLowerCase() === 'optional' ||
    p.isOptional === true;

  const compulsoryPolicyGroups = useMemo(
    () => groupPoliciesByType(
      displayedPolicySummaries.filter((p) => !isOptionalPolicySummary(p)),
    ),
    [displayedPolicySummaries],
  );

  const optionalPolicyGroups = useMemo(
    () => groupPoliciesByType(
      displayedPolicySummaries.filter(isOptionalPolicySummary),
    ),
    [displayedPolicySummaries],
  );

  const getPlanLabel = (policySummary: PolicySummary) => {
    const label = String(policySummary.policyLabel || '').trim();
    if (!label) {
      return 'Base policy';
    }

    if (label.toLowerCase() === 'base') {
      return 'Base policy';
    }

    return label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
  };

  const displayCurrentTotalPremium = Number(currentTotalPremium || 0);

  const currentlyEnrolledComponentIds = useMemo(
    () =>
      new Set<number>(
        (gmcPolicy?.configuration?.employeeChosenChoices || [])
          .map((choice: any) => Number(choice?.policyComponentActionTypeId))
          .filter((id: number) => Number.isFinite(id)),
      ),
    [gmcPolicy],
  );

  // Use the pre-computed additionalPremium from AdditionSteps — it correctly accounts
  // for per-life vs per-family, enrolled vs new, and employee-only contribution.
  const additionalPremiumForNewDependent = Number(_additionalPremium || 0);

  const updatedTotalPremium =
    Number(displayCurrentTotalPremium || 0) +
    Number(additionalPremiumForNewDependent || 0);

  const renderPolicyGroups = (groups: PolicyGroup[]) =>
    groups.map((group) => (
      <StyledPolicyCardWrapper key={group.key}>
        {group.policies.map((policySummary) => {
          const membersCoveredText = getMembersCoveredTextForPolicy(policySummary);
          return (
            <PlanCard key={String(policySummary.policyId)} borderGradient={group.borderGradient}>
              <PolicyHeader>
                <PolicyIcon gradient={group.gradient}>{group.initials}</PolicyIcon>
                <PolicyTitle>{getPlanLabel(policySummary)}</PolicyTitle>
              </PolicyHeader>

              <PlanInfoSection>
                <PlanInfoGrid>
                  <InfoColumn>
                    <InfoLabel>Sum Insured</InfoLabel>
                    <InfoValue>{formatCurrency(policySummary.sumInsured)}</InfoValue>
                  </InfoColumn>

                  {shouldShowCompanyContribution(policySummary) && (
                    <>
                      <Separator src={PipeSeparator} alt="separator" />
                      <InfoColumn>
                        <InfoLabel>Premium</InfoLabel>
                        <InfoValue>{formatCurrency(withGst(getEffectivePremium(policySummary)))}</InfoValue>
                      </InfoColumn>

                      <Separator src={PipeSeparator} alt="separator" />

                      <InfoColumn>
                        <InfoLabel>Company contribution</InfoLabel>
                        <InfoValue>
                          {formatCurrency(
                            withGst(getEffectiveCompanyContribution(
                              policySummary,
                              Number(policySummary.companyContribution || 0),
                            )),
                          )}
                        </InfoValue>
                        {isGstApplicable && showGst && (
                          <InfoLabel style={{ fontSize: 10, opacity: 0.75, marginTop: 2 }}>
                            incl. {Math.round(gstRate * 100)}% {taxLabel}
                          </InfoLabel>
                        )}
                      </InfoColumn>
                    </>
                  )}

                  <Separator src={PipeSeparator} alt="separator" />

                  <InfoColumn>
                    <InfoLabel>Your contribution</InfoLabel>
                    <InfoValue>
                      {formatCurrency(
                        withGst(getEffectiveEmployeeContribution(
                          policySummary,
                          Number(policySummary.employeeContribution || 0),
                        )),
                      )}
                    </InfoValue>
                    {isGstApplicable && showGst && (
                      <InfoLabel style={{ fontSize: 10, opacity: 0.75, marginTop: 2 }}>
                        incl. {Math.round(gstRate * 100)}% {taxLabel}
                      </InfoLabel>
                    )}
                  </InfoColumn>
                </PlanInfoGrid>

                {membersCoveredText && (
                  <Box>
                    <InfoLabel sx={{ mb: 1, fontSize: '14px' }}>Members covered</InfoLabel>
                    <Typography variant="body2">{membersCoveredText}</Typography>
                  </Box>
                )}
              </PlanInfoSection>
            </PlanCard>
          );
        })}
      </StyledPolicyCardWrapper>
    ));

  return (
    <PremiumSummaryPage>
      <SummarySectionsWrapper>
        {compulsoryPolicyGroups.length > 0 && (
          <SummarySectionContainer isExpanded={sectionExpanded.compulsory} sectionType="compulsory">
            <SummarySectionAccordionWrapper>
              <SummarySectionAccordionHeader
                isExpanded={sectionExpanded.compulsory}
                onClick={() => toggleSection('compulsory')}
              >
                <SummarySectionHeaderContent>
                  <SummarySectionIconWrapper>
                    <SummarySectionIcon src={ColoredShiledIcon} alt="Compulsory benefits" />
                  </SummarySectionIconWrapper>
                  <SummarySectionText>
                    <SummarySectionTitle>Compulsory Benefits</SummarySectionTitle>
                    <SummarySectionSubtitle>Automatically provided to all employees</SummarySectionSubtitle>
                  </SummarySectionText>
                </SummarySectionHeaderContent>
                <SummarySectionArrow
                  src={AccordionExpandIcon}
                  alt="toggle compulsory section"
                  expanded={sectionExpanded.compulsory}
                />
              </SummarySectionAccordionHeader>
              <SummarySectionAccordionContent isExpanded={sectionExpanded.compulsory}>
                <SummarySectionAccordionContentInner isExpanded={sectionExpanded.compulsory}>
                  {renderPolicyGroups(compulsoryPolicyGroups)}
                </SummarySectionAccordionContentInner>
              </SummarySectionAccordionContent>
            </SummarySectionAccordionWrapper>
          </SummarySectionContainer>
        )}

        {optionalPolicyGroups.length > 0 && (
          <SummarySectionContainer isExpanded={sectionExpanded.optional} sectionType="optional">
            <SummarySectionAccordionWrapper>
              <SummarySectionAccordionHeader
                isExpanded={sectionExpanded.optional}
                onClick={() => toggleSection('optional')}
              >
                <SummarySectionHeaderContent>
                  <SummarySectionIconWrapper>
                    <SummarySectionIcon src={OptionalIcon} alt="Optional benefits" />
                  </SummarySectionIconWrapper>
                  <SummarySectionText>
                    <SummarySectionTitle>Optional Benefits</SummarySectionTitle>
                    <SummarySectionSubtitle>These benefits have been added by you for extra protection.</SummarySectionSubtitle>
                  </SummarySectionText>
                </SummarySectionHeaderContent>
                <SummarySectionArrow
                  src={AccordionExpandIcon}
                  alt="toggle optional section"
                  expanded={sectionExpanded.optional}
                />
              </SummarySectionAccordionHeader>
              <SummarySectionAccordionContent isExpanded={sectionExpanded.optional}>
                <SummarySectionAccordionContentInner isExpanded={sectionExpanded.optional}>
                  {renderPolicyGroups(optionalPolicyGroups)}
                </SummarySectionAccordionContentInner>
              </SummarySectionAccordionContent>
            </SummarySectionAccordionWrapper>
          </SummarySectionContainer>
        )}
      </SummarySectionsWrapper>

      <PremiumSummaryCardForSummary>
        <PremiumTotalSummaryRowWithBorder>
          <PremiumSummaryLabel>
            {LIFE_EVENTS_PREMIUM_SUMMARY_COPY.currentTotalPremiumLabel}
          </PremiumSummaryLabel>
          <PremiumSummaryValue>{formatCurrency(displayCurrentTotalPremium)}</PremiumSummaryValue>
        </PremiumTotalSummaryRowWithBorder>

        <PremiumTotalSummaryRowWithBorder>
          <PremiumSummaryLabel>
            {LIFE_EVENTS_PREMIUM_SUMMARY_COPY.additionalPremiumLabel}
          </PremiumSummaryLabel>
          <PremiumSummaryValue sx={{ color: '#2F6CF6' }}>
            +{formatCurrency(additionalPremiumForNewDependent)}
          </PremiumSummaryValue>
        </PremiumTotalSummaryRowWithBorder>

        <SummaryDivider />

        <PremiumTotalSummaryRowWithBorder>
          <PremiumSummaryLabel>Total Updated Premium</PremiumSummaryLabel>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <PremiumSummaryValue>{formatCurrency(updatedTotalPremium)}</PremiumSummaryValue>
          </div>
        </PremiumTotalSummaryRowWithBorder>
      </PremiumSummaryCardForSummary>

      {showDeclarations && (
        <DeclarationSection>
          <DeclarationTitle>{DECLARATION_DATA.title}</DeclarationTitle>
          <DeclarationContent>
            {declarationPoints.map((point, index) => (
              <DeclarationPoint key={`${point.content}-${index}`}>
                <DeclarationCheckbox
                  type="checkbox"
                  checked={checkedDeclarations[index] || false}
                  onChange={() => handleDeclarationChange(index)}
                />
                <DeclarationPointLabel>
                  {point.content}
                  {point.isMandatory ? (
                    <span style={{ color: '#e20f13' }}> *</span>
                  ) : null}
                </DeclarationPointLabel>
              </DeclarationPoint>
            ))}
          </DeclarationContent>
        </DeclarationSection>
      )}

      <AdditionDetailsFooterActions>
        <AdditionDetailsSecondaryButton type="button" onClick={onBack}>
          {LIFE_EVENTS_PREMIUM_SUMMARY_COPY.backButton}
        </AdditionDetailsSecondaryButton>

        <AdditionDetailsFooterRightGroup>
          {onExit && (
            <AdditionDetailsSecondaryButton type="button" onClick={onExit}>
              Quit / Exit
            </AdditionDetailsSecondaryButton>
          )}

          <AdditionDetailsPrimaryButton
            type="button"
            onClick={onContinue}
            disabled={!areAllDeclarationsChecked || isSubmitting}
            sx={{ minWidth: 180 }}
          >
            {isSubmitting ? (
              <LoadingButtonContent>
                <CircularProgress size={16} color="inherit" />
                Submitting...
              </LoadingButtonContent>
            ) : (
              LIFE_EVENTS_PREMIUM_SUMMARY_COPY.continueButton
            )}
          </AdditionDetailsPrimaryButton>
        </AdditionDetailsFooterRightGroup>
      </AdditionDetailsFooterActions>
    </PremiumSummaryPage>
  );
};

export default PremiumSummary;
