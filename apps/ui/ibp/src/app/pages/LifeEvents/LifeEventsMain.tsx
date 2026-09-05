import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Box, IconButton, Typography } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { ArrowBackIosNew, ChevronLeft, ChevronRight } from '@mui/icons-material';
import {
  ADDITION_LIFE_EVENTS,
  DELETION_LIFE_EVENTS,
  FLOW_TYPE_KEY,
  LIFE_EVENTS_PAGE_COPY,
  LIFE_EVENTS_DEPENDENT_REMOVAL_COPY,
  SELECTED_EVENT_KEY,
} from './constants';
import {
  DisabledLifeEventsFlowCard,
  NotEligibleBadge,
  LifeEventsCardActionButton,
  LifeEventsCardBody,
  LifeEventsCarouselContainer,
  LifeEventsCarouselNavButton,
  LifeEventsCarouselTrack,
  LifeEventsCarouselViewport,
  LifeEventsCardFooter,
  LifeEventsCardIllustration,
  LifeEventsCommonReasonsTitle,
  LifeEventsFlowCard,
  LifeEventsFlowCardContent,
  LifeEventsFlowDescription,
  LifeEventsFlowTitle,
  LifeEventsHeaderIcon,
  LifeEventsHeaderSection,
  LifeEventsHeaderSubtitle,
  LifeEventsHeaderText,
  LifeEventsHeaderTitle,
  LifeEventsMainContainer,
  LifeEventsMainSubtitle,
} from './styles';
import lifeEventsIcon from '../../assets/svgs/life-events-image.svg';
import adoptionIcon from '../../../assets/svgs/adoption-of-child-card.svg';
import ageDependentIcon from '../../../assets/svgs/age-dependent-addition-card.svg';
import ageLimitExceededIcon from '../../../assets/svgs/age-limit-exceed-card.svg';
import childBirthIcon from '../../../assets/svgs/child-birth-card.svg';
import dependentDeathIcon from '../../../assets/svgs/dependent-death-card.svg';
import divorceIcon from '../../../assets/svgs/divorce-card.svg';
import marriageIcon from '../../../assets/svgs/marriage-card.svg';
import noLongerEligibleIcon from '../../../assets/svgs/no-longer-card.svg';
import { getRelationTypeForRelationship } from '../../components/Enrollment/EnrollmentFlow/utils/relationshipFilters';
import { endPoints, useApiQuery } from '@ui/ui-lib';
import { usePoliciesFlags } from '../../hooks/usePoliciesFlags';
import navigationArrow from '../../assets/svgs/navigation-arrow.svg';
// apps/ui/ibp/src/app/assets/svgs/navigation-arrow.svg

type LifeEventsMainProps = Record<string, never>;

const CARD_WIDTH = 290;
const CARD_GAP = 24;
const CAROUSEL_SCROLL_DISTANCE = CARD_WIDTH + CARD_GAP;

const EVENT_ICONS: Record<string, string> = {
  marriage: marriageIcon,
  child_birth: childBirthIcon,
  adoption: adoptionIcon,
  age_eligibility: ageDependentIcon,
  divorce: divorceIcon,
  dependent_death: dependentDeathIcon,
  age_limit_exceeded: ageLimitExceededIcon,
  no_longer_eligible: noLongerEligibleIcon,
};

const normalizeLifeEventRelationship = (relationshipName?: string) =>
  String(relationshipName || '').toLowerCase().trim();

const getLifeEventRelationshipAliases = (relationshipName: string): string[] => {
  const normalized = normalizeLifeEventRelationship(relationshipName);
  if (!normalized) return [];

  if (['partner', 'spouse', 'spouse/partner', 'wife', 'husband'].includes(normalized)) {
    return ['partner', 'spouse', 'spouse/partner', 'wife', 'husband'];
  }

  if (['parent', 'parents', 'father', 'mother'].includes(normalized)) {
    return ['parent', 'parents', 'father', 'mother'];
  }

  if (['child', 'children', 'son', 'daughter'].includes(normalized)) {
    return ['child', 'children', 'son', 'daughter'];
  }

  return [normalized];
};

const SINGLETON_RELATION_ALIASES = new Set([
  'spouse',
  'wife',
  'husband',
  'partner',
  'parent',
  'parents',
  'father',
  'mother',
]);

const isSingletonLifeEventRelationship = (relationshipName: string) =>
  getLifeEventRelationshipAliases(relationshipName).some((alias) =>
    SINGLETON_RELATION_ALIASES.has(alias),
  );

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

const LifeEventsMain: React.FC<LifeEventsMainProps> = () => {
  const navigate = useNavigate();
  const additionTrackRef = useRef<HTMLDivElement | null>(null);
  const deletionTrackRef = useRef<HTMLDivElement | null>(null);
  const relationConstraints = useSelector(
    (state: any) => state.policyData.relationDependentData
  );
  const policiesData = useSelector(
    (state: any) => state.policyData.policiesData
  );
  const { hasAnyPolicyForLifeEvents } = usePoliciesFlags();
  const isEnrollmentBlocked = !hasAnyPolicyForLifeEvents;
  
  // Get employee gender from the profile API (same source as ProfileSection)
  const employeeId = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('user') || '{}')?.id;
    } catch {
      return undefined;
    }
  }, []);

  const { data: employeeDetailsResponse } = useApiQuery({
    queryKey: ['employeeDetails', employeeId],
    url: employeeId ? endPoints.employeeDetails : '',
    enabled: Boolean(employeeId),
  });

  const employeeGender = useMemo(() => {
    const payload = employeeDetailsResponse as any;
    const details = payload?.data?.data ?? payload?.data ?? null;
    const g = details?.gender;
    const raw = (typeof g === 'string' ? g : (g?.key ?? g?.value ?? '')).toLowerCase().trim();
    if (raw === 'gender_type_male' || raw === 'm' || raw === 'male') return 'male';
    if (raw === 'gender_type_female' || raw === 'f' || raw === 'female') return 'female';
    return 'male';
  }, [employeeDetailsResponse]);

  const [additionCarouselState, setAdditionCarouselState] = useState({
    canScrollPrev: false,
    canScrollNext: false,
  });
  const [deletionCarouselState, setDeletionCarouselState] = useState({
    canScrollPrev: false,
    canScrollNext: false,
  });

  const lifeEventPolicySources = useMemo(() => {
    if (!Array.isArray(relationConstraints)) {
      return [];
    }

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

    return relationConstraints.filter((policy: any) => {
      const policyId = policy?.policyId;
      const isEditable =
        policyId != null
          ? editabilityMap.get(String(policyId))
          : policy?.isEditable ?? null;
      if (isEditable !== false) return false;

      const dueDate = policyId != null ? dueDateMap.get(String(policyId)) : null;
      if (isPolicyExpired(dueDate)) return false;

      return Boolean(
        policy?.configuration?.policyComponentsConfiguration ||
          policy?.configuration?.policyTemplate ||
          policy?.configuration?.relationships,
      );
    });
  }, [relationConstraints, policiesData]);

  const mergedLifeEventRelationships = useMemo(() => {
    const relationMap = new Map<string, any>();

    lifeEventPolicySources.forEach((policy: any) => {
      const enabledPolicyRelations =
        policy?.configuration?.relationships?.enabledPolicyRelations || [];
      enabledPolicyRelations.forEach((relation: any) => {
        const key = String(relation?.type || '').toLowerCase().trim();
        if (!key) return;

        const existing = relationMap.get(key);
        if (!existing) {
          relationMap.set(key, relation);
          return;
        }

        const currentMax = Number.parseInt(existing?.maxCount, 10);
        const incomingMax = Number.parseInt(relation?.maxCount, 10);
        const mergedMax =
          Number.isFinite(currentMax) && Number.isFinite(incomingMax)
            ? Math.max(currentMax, incomingMax)
            : existing?.maxCount ?? relation?.maxCount ?? null;

        relationMap.set(key, {
          ...existing,
          ...relation,
          enabled: existing?.enabled !== false || relation?.enabled !== false,
          maxCount: mergedMax,
        });
      });
    });

    return { enabledPolicyRelations: Array.from(relationMap.values()) };
  }, [lifeEventPolicySources]);

  const resolveRelationForRelationshipName = (relationshipName: string) => {
    const relationships = mergedLifeEventRelationships;
    if (!relationships || typeof relationshipName !== 'string') return null;

    const enabledPolicyRelations = relationships.enabledPolicyRelations || [];
    const relationType = getRelationTypeForRelationship(
      relationships,
      relationshipName,
    );
    if (!relationType) {
      const requestedAliases = getLifeEventRelationshipAliases(relationshipName);
      return (
        enabledPolicyRelations.find((relation: any) => {
          if (!relation?.enabled) return false;

          const relationAliases = getLifeEventRelationshipAliases(relation?.type || '');
          if (relationAliases.some((alias) => requestedAliases.includes(alias))) {
            return true;
          }

          const configuredOptions = Array.isArray(relation?.configuredOptions)
            ? relation.configuredOptions
            : [];

          return configuredOptions.some((option: any) =>
            getLifeEventRelationshipAliases(option?.name || '').some((alias) =>
              requestedAliases.includes(alias),
            ),
          );
        }) || null
      );
    }
    return (
      enabledPolicyRelations.find(
        (relation: any) =>
          relation?.enabled &&
          typeof relation?.type === 'string' &&
          relation.type.toLowerCase().trim() === relationType.toLowerCase().trim(),
      ) || null
    );
  };

  const getUsedCountForRelation = (policy: any, relation: any) => {
    const relationType = relation?.type || '';
    if (!relationType) return 0;

    const relationAliases = getLifeEventRelationshipAliases(relationType);
    const existingDependents = policy?.configuration?.dependents || [];
    if (!Array.isArray(existingDependents) || relationAliases.length === 0) {
      return 0;
    }

    return existingDependents.reduce((count: number, dep: any) => {
      const dependentRelationName =
        dep?.relationshipType || dep?.relationship || dep?.relation || '';
      if (!dependentRelationName) return count;

      const dependentType =
        getRelationTypeForRelationship(policy, dependentRelationName) ||
        dependentRelationName;
      const dependentAliases = getLifeEventRelationshipAliases(dependentType);
      const matches = dependentAliases.some((alias) => relationAliases.includes(alias));
      return matches ? count + 1 : count;
    }, 0);
  };

  const hasCapacityForRelationship = (relationshipName: string) =>
    (() => {
      let matchedPolicy = false;
      const singletonRelationship = isSingletonLifeEventRelationship(relationshipName);

      for (const policy of lifeEventPolicySources) {
        const relationType = getRelationTypeForRelationship(
          policy?.configuration?.relationships,
          relationshipName,
        );

        if (!relationType) {
          continue;
        }

        matchedPolicy = true;

        const enabledPolicyRelations =
          policy?.configuration?.relationships?.enabledPolicyRelations || [];
        const relation = enabledPolicyRelations.find(
          (entry: any) => entry?.type === relationType,
        );

        if (!relation?.type) {
          return false;
        }

        const parsedMax = relation.maxCount ? parseInt(relation.maxCount, 10) : NaN;
        const maxCount = Number.isNaN(parsedMax)
          ? Number.POSITIVE_INFINITY
          : parsedMax;
        const usedCount = getUsedCountForRelation(policy, relation);

        if (singletonRelationship) {
          if (usedCount > 0) {
            return false;
          }
          continue;
        }

        if (usedCount >= maxCount) {
          return false;
        }
      }

      return matchedPolicy;
    })();

  const hasSelectableRelationshipOptions = React.useCallback(
    (relationshipName: string) => {
      const relation = resolveRelationForRelationshipName(relationshipName);
      if (!relation?.type || !relation?.enabled) return false;

      if (relation.configuredOptions && Array.isArray(relation.configuredOptions)) {
        const hasValidOptions = relation.configuredOptions.some((option: any) => {
          if (!option?.enabled || option.enabled === false || !option?.name) return false;

          const optionName = String(option.name).toLowerCase().trim();
          if (employeeGender === 'male' && optionName === 'husband') {
            return false;
          }
          if (employeeGender === 'female' && optionName === 'wife') {
            return false;
          }

          return true;
        });

        if (!hasValidOptions) return false;
      }

      return true;
    },
    [employeeGender],
  );

  const hasCapacityAndSelectableOptions = React.useCallback(
    (relationshipName: string) =>
      hasCapacityForRelationship(relationshipName) &&
      hasSelectableRelationshipOptions(relationshipName),
    [hasSelectableRelationshipOptions],
  );

  const hasAnyForRelationship = React.useCallback(
    (relationshipName: string) =>
      lifeEventPolicySources.some((policy: any) => {
        const relation = resolveRelationForRelationshipName(relationshipName);
        if (!relation?.type) return false;

        return getUsedCountForRelation(policy, relation) > 0;
      }),
    [lifeEventPolicySources],
  );

  const isLifeEventEligible = (
    flowType: 'addition' | 'deletion',
    event:
      | (typeof ADDITION_LIFE_EVENTS)[number]
      | (typeof DELETION_LIFE_EVENTS)[number],
  ) =>
    event.requiredRelationships.some((relationship) => {
      const relation = resolveRelationForRelationshipName(relationship);
      if (!relation?.type) return false;
      return flowType === 'addition'
        ? hasCapacityAndSelectableOptions(relationship)
        : hasAnyForRelationship(relationship);
    });

  const updateCarouselState = useCallback(
    (
      trackRef: React.RefObject<HTMLDivElement | null>,
      setState: React.Dispatch<
        React.SetStateAction<{ canScrollPrev: boolean; canScrollNext: boolean }>
      >,
    ) => {
      const node = trackRef.current;
      if (!node) return;

      const { scrollLeft, clientWidth, scrollWidth } = node;
      setState({
        canScrollPrev: scrollLeft > 4,
        canScrollNext: scrollLeft + clientWidth < scrollWidth - 4,
      });
    },
    [],
  );

  useEffect(() => {
    updateCarouselState(additionTrackRef, setAdditionCarouselState);
    updateCarouselState(deletionTrackRef, setDeletionCarouselState);
  }, [relationConstraints, updateCarouselState]);

  useEffect(() => {
    const additionNode = additionTrackRef.current;
    const deletionNode = deletionTrackRef.current;

    const handleAdditionScroll = () =>
      updateCarouselState(additionTrackRef, setAdditionCarouselState);
    const handleDeletionScroll = () =>
      updateCarouselState(deletionTrackRef, setDeletionCarouselState);
    const handleResize = () => {
      updateCarouselState(additionTrackRef, setAdditionCarouselState);
      updateCarouselState(deletionTrackRef, setDeletionCarouselState);
    };

    additionNode?.addEventListener('scroll', handleAdditionScroll);
    deletionNode?.addEventListener('scroll', handleDeletionScroll);
    window.addEventListener('resize', handleResize);

    return () => {
      additionNode?.removeEventListener('scroll', handleAdditionScroll);
      deletionNode?.removeEventListener('scroll', handleDeletionScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [updateCarouselState]);

  const scrollCarousel = (
    trackRef: React.RefObject<HTMLDivElement | null>,
    direction: 'left' | 'right',
  ) => {
    trackRef.current?.scrollBy({
      left: direction === 'right' ? CAROUSEL_SCROLL_DISTANCE : -CAROUSEL_SCROLL_DISTANCE,
      behavior: 'smooth',
    });
  };

  const handleLifeEventSelection = (
    flowType: 'addition' | 'deletion',
    eventId: string,
  ) => {
    sessionStorage.setItem(FLOW_TYPE_KEY, flowType);
    sessionStorage.setItem(SELECTED_EVENT_KEY, eventId);
    navigate('/life-events/flow');
  };

  return (
    <>
        <LifeEventsHeaderSection>
          <LifeEventsHeaderIcon
            src={lifeEventsIcon}
            alt={LIFE_EVENTS_PAGE_COPY.title}
          />
          <LifeEventsHeaderText>
            <LifeEventsHeaderTitle sx={{ display: "flex", alignItems: "center" }}>
              <IconButton
                onClick={() => navigate("/dashboard")}
                aria-label="Go back"
                sx={{ p: 0, mr: 1, color: "inherit" }}
              >
                <ArrowBackIosNew sx={{ fontSize: "inherit" }} />
              </IconButton>
              {LIFE_EVENTS_PAGE_COPY.title}
            </LifeEventsHeaderTitle>
            <LifeEventsHeaderSubtitle>
              {LIFE_EVENTS_PAGE_COPY.subtitle}
            </LifeEventsHeaderSubtitle>
          </LifeEventsHeaderText>
        </LifeEventsHeaderSection>
      <LifeEventsMainContainer>
        {isEnrollmentBlocked && (
          <Box sx={{
            display: "flex", alignItems: "flex-start", gap: "12px",
            px: "18px", py: "14px", mb: 1,
            background: "linear-gradient(135deg, #EFF6FF 0%, #F0F9FF 100%)",
            border: "1.5px solid #BFDBFE",
            borderRadius: "10px",
          }}>
            <InfoOutlinedIcon sx={{ fontSize: 22, color: "#2563EB", mt: "1px", flexShrink: 0 }} />
            <Box>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#1E40AF", mb: "3px" }}>
                Complete Your Enrollment to Unlock Life Events
              </Typography>
              <Typography sx={{ fontSize: 13, color: "#3B82F6", lineHeight: 1.6 }}>
                Life Events let you update your coverage when big moments happen — a new marriage, a newborn, or other family changes. These actions will become available once your policy enrollment is finalized by your HR team.
              </Typography>
            </Box>
          </Box>
        )}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <Box>
            <Box sx={{ mb: 2 }}>
              <LifeEventsCommonReasonsTitle>
                Add a Dependent
              </LifeEventsCommonReasonsTitle>
              <LifeEventsMainSubtitle sx={{ textAlign: "left", margin: 0 }}>
                Select a reason to add a new dependent to your benefits coverage
              </LifeEventsMainSubtitle>
            </Box>
            <LifeEventsCarouselContainer>
              <LifeEventsCarouselNavButton
                type="button"
                side="left"
                disabled={!additionCarouselState.canScrollPrev}
                onClick={() => scrollCarousel(additionTrackRef, 'left')}
              >
                <ChevronLeft />
              </LifeEventsCarouselNavButton>
              <LifeEventsCarouselNavButton
                type="button"
                side="right"
                disabled={!additionCarouselState.canScrollNext}
                onClick={() => scrollCarousel(additionTrackRef, 'right')}
              >
                <ChevronRight />
              </LifeEventsCarouselNavButton>
              <LifeEventsCarouselViewport ref={additionTrackRef}>
                <LifeEventsCarouselTrack>
                  {ADDITION_LIFE_EVENTS.map((event) => {
                    const isEligible = !isEnrollmentBlocked && isLifeEventEligible('addition', event);
                    const isDisabled = isEnrollmentBlocked || !isLifeEventEligible('addition', event);
                    const CardComponent = isDisabled
                      ? DisabledLifeEventsFlowCard
                      : LifeEventsFlowCard;

                    return (
                      <Box
                        key={event.id}
                        sx={{
                          flex: "0 0 290px",
                          minWidth: 290,
                        }}
                      >
                        <CardComponent
                          flowType="addition"
                          onClick={() => {
                            if (isDisabled) return;
                            handleLifeEventSelection("addition", event.id);
                          }}
                          sx={{ width: "100%", maxWidth: "none" }}
                          title={
                            isEnrollmentBlocked
                              ? "Complete your enrollment to access Life Events"
                              : !isEligible
                              ? `${LIFE_EVENTS_DEPENDENT_REMOVAL_COPY.requiredRelationshipsMessage} ${event.requiredRelationships.join(', ')}`
                              : undefined
                          }
                        >
                          {isEnrollmentBlocked && <NotEligibleBadge>Enrollment Required</NotEligibleBadge>}
                          {!isEnrollmentBlocked && !isEligible && <NotEligibleBadge>Not Eligible</NotEligibleBadge>}
                          <LifeEventsFlowCardContent>
                            <LifeEventsCardBody>
                              <LifeEventsFlowTitle>{event.title}</LifeEventsFlowTitle>
                              <LifeEventsFlowDescription>
                                {event.description}
                              </LifeEventsFlowDescription>
                            </LifeEventsCardBody>

                            <LifeEventsCardFooter>
                              <LifeEventsCardIllustration>
                                <img src={EVENT_ICONS[event.id]} alt={event.title} />
                              </LifeEventsCardIllustration>

                              <LifeEventsCardActionButton
                                type="button"
                                onClick={(eventClick) => {
                                  eventClick.stopPropagation();
                                  if (isDisabled) return;
                                  handleLifeEventSelection("addition", event.id);
                                }}
                                aria-label={`Start ${event.title}`}
                                disabled={isDisabled}
                              >
                                <img src={navigationArrow} alt="navigationArrow" />
                              </LifeEventsCardActionButton>
                            </LifeEventsCardFooter>
                          </LifeEventsFlowCardContent>
                        </CardComponent>
                      </Box>
                    );
                  })}
                </LifeEventsCarouselTrack>
              </LifeEventsCarouselViewport>
            </LifeEventsCarouselContainer>
          </Box>

          <Box>
            <Box sx={{ mb: 2 }}>
              <LifeEventsCommonReasonsTitle>
                Remove a Dependent
              </LifeEventsCommonReasonsTitle>
              <LifeEventsMainSubtitle sx={{ textAlign: "left", margin: 0 }}>
                Select a reason to remove a dependent from your benefits coverage
              </LifeEventsMainSubtitle>
            </Box>
            <LifeEventsCarouselContainer>
              <LifeEventsCarouselNavButton
                type="button"
                side="left"
                disabled={!deletionCarouselState.canScrollPrev}
                onClick={() => scrollCarousel(deletionTrackRef, 'left')}
              >
                <ChevronLeft />
              </LifeEventsCarouselNavButton>
              <LifeEventsCarouselNavButton
                type="button"
                side="right"
                disabled={!deletionCarouselState.canScrollNext}
                onClick={() => scrollCarousel(deletionTrackRef, 'right')}
              >
                <ChevronRight />
              </LifeEventsCarouselNavButton>
              <LifeEventsCarouselViewport ref={deletionTrackRef}>
                <LifeEventsCarouselTrack>
                  {DELETION_LIFE_EVENTS.map((event) => {
                    const isEligible = !isEnrollmentBlocked && isLifeEventEligible('deletion', event);
                    const isDisabled = isEnrollmentBlocked || !isLifeEventEligible('deletion', event);
                    const CardComponent = isDisabled
                      ? DisabledLifeEventsFlowCard
                      : LifeEventsFlowCard;

                    return (
                      <Box
                        key={event.id}
                        sx={{
                          flex: "0 0 290px",
                          minWidth: 290,
                        }}
                      >
                        <CardComponent
                          flowType="deletion"
                          onClick={() => {
                            if (isDisabled) return;
                            handleLifeEventSelection("deletion", event.id);
                          }}
                          sx={{ width: "100%", maxWidth: "none" }}
                          title={
                            isEnrollmentBlocked
                              ? "Complete your enrollment to access Life Events"
                              : !isEligible
                              ? `${LIFE_EVENTS_DEPENDENT_REMOVAL_COPY.noEligibleDependentsMessage} ${event.requiredRelationships.join(', ')}`
                              : undefined
                          }
                        >
                          {isEnrollmentBlocked && <NotEligibleBadge>Enrollment Required</NotEligibleBadge>}
                          {!isEnrollmentBlocked && !isEligible && <NotEligibleBadge>Not Eligible</NotEligibleBadge>}
                          <LifeEventsFlowCardContent>
                            <LifeEventsCardBody>
                              <LifeEventsFlowTitle>{event.title}</LifeEventsFlowTitle>
                              <LifeEventsFlowDescription>
                                {event.description}
                              </LifeEventsFlowDescription>
                            </LifeEventsCardBody>

                            <LifeEventsCardFooter>
                              <LifeEventsCardIllustration>
                                <img src={EVENT_ICONS[event.id]} alt={event.title} />
                              </LifeEventsCardIllustration>

                              <LifeEventsCardActionButton
                                type="button"
                                onClick={(eventClick) => {
                                  eventClick.stopPropagation();
                                  if (isDisabled) return;
                                  handleLifeEventSelection("deletion", event.id);
                                }}
                                aria-label={`Start ${event.title}`}
                                disabled={isDisabled}
                              >
                                <img src={navigationArrow} alt="navigationArrow" />
                              </LifeEventsCardActionButton>
                            </LifeEventsCardFooter>
                          </LifeEventsFlowCardContent>
                        </CardComponent>
                      </Box>
                    );
                  })}
                </LifeEventsCarouselTrack>
              </LifeEventsCarouselViewport>
            </LifeEventsCarouselContainer>
          </Box>
        </Box>
      </LifeEventsMainContainer>
    </>
  );
};

export default LifeEventsMain;
