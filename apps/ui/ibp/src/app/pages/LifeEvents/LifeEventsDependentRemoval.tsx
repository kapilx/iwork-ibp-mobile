import React, { useState, useEffect } from 'react';
import { Box, Checkbox } from '@mui/material';
import { capitalizeFirst } from '../../utils';
import dayjs from 'dayjs';
import NoDataPage from '../../common/NoData';
import {
  DependentRemovalTableCard,
  DependentRemovalTableGrid,
  DependentRemovalTableColumn,
  DependentRemovalTableHeader,
  DependentRemovalTableValue,
  DependentRemovalTableSubValue,
  DependentRemovalCheckbox,
  AdditionDetailsFooterActions,
  AdditionDetailsFooterRightGroup,
  AdditionDetailsSecondaryButton,
  AdditionDetailsPrimaryButton,
} from './styles';
import {
  LIFE_EVENTS_DEPENDENT_REMOVAL_COPY,
  LIFE_EVENTS_STEP_ACTION_COPY,
} from './constants';

type DependentGroup = {
  key: string;
  ids: number[];
  entries: any[];
  representative: any;
  components: { id: number; label: string }[];
};

type MergedDependentSelection = {
  entries: any[];
  choices: any[];
  documentIds?: number[];
  [key: string]: any;
};

interface LifeEventsDependentRemovalProps {
  selectedLifeEvent: string;
  policyData: any;
  onDependentSelection: (selectedDependents: any[]) => void;
  lifeEventData?: any;
  selectedDependents?: number[];
  setSelectedDependents?: React.Dispatch<React.SetStateAction<number[]>>;
  onBack?: () => void;
  onContinue?: () => void;
  onExit?: () => void; // Add exit prop for Quit/Exit button
}

const noop = () => undefined;

const LifeEventsDependentRemoval: React.FC<LifeEventsDependentRemovalProps> = ({
  selectedLifeEvent: _selectedLifeEvent,
  policyData,
  onDependentSelection,
  lifeEventData,
  selectedDependents = [],
  setSelectedDependents = noop,
  onBack,
  onContinue,
  onExit,
}) => {
  
  const [eligibleDependents, setEligibleDependents] = useState<any[]>([]);

  // Get policy components configuration for displaying component names
  const policyComponents = policyData?.configuration?.policyComponentsConfiguration?.components || [];
  const employeeChosenChoices = policyData?.configuration?.employeeChosenChoices || [];

  // Helper function to get component label by ID
  const getComponentLabel = (componentId: number) => {
    const component = policyComponents.find((comp: any) => comp.id === componentId);
    return component ? component.label : `Component ${componentId}`;
  };

  const getComponentPolicyLabel = (componentId: number) => {
    const matchedChoice = employeeChosenChoices.find((choice: any) => {
      const choiceComponentId = Number(choice?.policyComponentActionTypeId);
      return Number.isFinite(choiceComponentId) && choiceComponentId === Number(componentId);
    });

    const componentLabel =
      matchedChoice?.policyComponentActionLabel ||
      matchedChoice?.policyComponentActionType ||
      getComponentLabel(componentId);

    return componentLabel;
  };

  const getDependentFingerprint = (dependent: any) =>
    [
      String(dependent?.name || '').trim().toLowerCase(),
      String(dependent?.relation || '').trim().toLowerCase(),
      String(dependent?.gender || '').trim().toLowerCase(),
    ].join('|');

  const buildChoiceKey = (choice: any) =>
    [
      String(choice?.policyComponentActionTypeId ?? 'none'),
      String(choice?.policyComponentActionType ?? 'none'),
      String(choice?.parentpolicyComponentActionTypeId ?? 'none'),
      String(choice?.policyComponentActionLabel ?? 'none'),
    ].join('|');

  const mergeDependentGroup = (group: DependentGroup): MergedDependentSelection => {
    const entries = group.entries || [];
    const representative = group.representative || entries[0] || {};
    const mergedChoices = Array.from(
      new Map(
        entries
          .flatMap((entry: any) =>
            (Array.isArray(entry?.choices) ? entry.choices : []).map((choice: any) => ({
              ...choice,
              sourcePolicyId: choice?.sourcePolicyId ?? entry?.sourcePolicyId ?? null,
              sourcePolicyName: choice?.sourcePolicyName ?? entry?.sourcePolicyName ?? null,
              sourcePolicyTypeKey:
                choice?.sourcePolicyTypeKey ?? entry?.sourcePolicyTypeKey ?? null,
              sourcePolicyScopeKey:
                choice?.sourcePolicyScopeKey ?? entry?.sourcePolicyScopeKey ?? null,
            })),
          )
          .filter(Boolean)
          .map((choice: any) => [buildChoiceKey(choice), choice]),
      ).values(),
    );
    const mergedDocumentIds = Array.from(
      new Set(
        entries.flatMap((entry: any) =>
          Array.isArray(entry?.documentIds)
            ? entry.documentIds.map((id: number | string) => Number(id)).filter(Number.isFinite)
            : [],
        ),
      ),
    );

    return {
      ...representative,
      id: group.ids?.[0] ?? representative?.id ?? null,
      entries,
      choices: mergedChoices,
      documentIds: mergedDocumentIds,
      representative,
    };
  };

  // Function to normalize relationship categories for better matching
  const normalizeRelationshipGroup = (relationship: string): string[] => {
    const normalized = relationship.toLowerCase().trim();

    if (normalized.includes('spouse') || normalized.includes('partner')) {
      return ['spouse', 'wife', 'husband', 'partner'];
    }

    if (['wife', 'husband'].includes(normalized)) {
      return ['spouse', 'wife', 'husband', 'partner'];
    }

    if (['parent', 'parents', 'father', 'mother'].includes(normalized)) {
      return ['parent', 'parents', 'father', 'mother'];
    }

    if (['child', 'children', 'son', 'daughter'].includes(normalized)) {
      return ['child', 'children', 'son', 'daughter'];
    }

    return [normalized];
  };

  // Function to check if relationships match across generic and specific categories
  const relationshipMatches = (dependentRelation: string, requiredRelation: string): boolean => {
    const dependentNormalized = normalizeRelationshipGroup(dependentRelation);
    const requiredNormalized = normalizeRelationshipGroup(requiredRelation);

    return dependentNormalized.some(dep => requiredNormalized.includes(dep));
  };

  // Filter dependents based on selected life event
  useEffect(() => {
    if (!policyData?.configuration?.dependents || !lifeEventData) {
      setEligibleDependents([]);
      return;
    }

    const allDependents = policyData.configuration.dependents;
    
    // Filter based on life event requirements
    const filtered = allDependents.filter((dependent: any) => {
      const dependentRelation = dependent.relation;

      // Check if this dependent's relationship matches the life event requirements
      return lifeEventData.requiredRelationships.some((requiredRelation: string) =>
        relationshipMatches(dependentRelation, requiredRelation)
      );
    });

    const grouped = new Map<string, DependentGroup>();

    filtered.forEach((dependent: any) => {
      const key = getDependentFingerprint(dependent);
      const componentIds = getDependentComponents(dependent);
      const existingGroup = grouped.get(key);

      if (!existingGroup) {
        grouped.set(key, {
          key,
          ids: Number.isFinite(Number(dependent?.id)) ? [Number(dependent.id)] : [],
          entries: [dependent],
          representative: dependent,
          components: componentIds,
        });
        return;
      }

      if (Number.isFinite(Number(dependent?.id))) {
        existingGroup.ids.push(Number(dependent.id));
      }
      existingGroup.entries.push(dependent);

      const knownComponentIds = new Set(existingGroup.components.map((component) => Number(component.id)));
      componentIds.forEach((component) => {
        const componentId = Number(component.id);
        if (!knownComponentIds.has(componentId)) {
          existingGroup.components.push(component);
          knownComponentIds.add(componentId);
        }
      });
    });

    setEligibleDependents(Array.from(grouped.values()));
  }, [policyData, lifeEventData]);

  useEffect(() => {
    if (eligibleDependents.length !== 1) return;

    const onlyDependent = eligibleDependents[0] as DependentGroup;
    const onlyDependentIds = (onlyDependent?.ids || []).filter((id) =>
      Number.isFinite(Number(id)),
    );
    if (!onlyDependentIds.length) return;
    if (onlyDependentIds.every((id) => selectedDependents.includes(id))) return;

    setSelectedDependents(onlyDependentIds);
    onDependentSelection([mergeDependentGroup(onlyDependent)]);
  }, [
    eligibleDependents,
    onDependentSelection,
    selectedDependents,
    setSelectedDependents,
  ]);

  // Handle dependent selection (multi-select) with better state management
  const handleDependentSelect = (dependentId: number) => {
    const selectedGroup = eligibleDependents.find((dependent: any) =>
      (dependent.ids || []).includes(dependentId),
    ) as DependentGroup | undefined;
    const groupIds = selectedGroup?.ids?.filter((id) => Number.isFinite(Number(id))) || [
      dependentId,
    ];

    setSelectedDependents(currentSelection => {
      const isGroupFullySelected = groupIds.every((id) => currentSelection.includes(id));
      const newSelection = isGroupFullySelected
        ? currentSelection.filter((id) => !groupIds.includes(id))
        : Array.from(new Set([...currentSelection, ...groupIds]));

      // Get the selected dependents for removal
      const filteredDependents =
        eligibleDependents
          .filter((dependent: any) =>
            (dependent.ids || []).some((id: number) => newSelection.includes(id)),
          )
          .map((dependent: DependentGroup) => mergeDependentGroup(dependent)) || [];

      // Send the filtered dependents array to parent
      onDependentSelection(filteredDependents);

      return newSelection;
    });
  };

  // Get the dependent's enrolled components
  const getDependentComponents = (dependent: any) => {
    const componentIds = new Set();
    
    // Add main component
    if (dependent.policyComponentActionTypeId) {
      componentIds.add(dependent.policyComponentActionTypeId);
    }
    
    // Add additional choices
    if (dependent.choices) {
      dependent.choices.forEach((choice: any) => {
        componentIds.add(choice.policyComponentActionTypeId);
      });
    }
    
    return Array.from(componentIds)
      .map((id: any) => ({
        id,
        label: getComponentPolicyLabel(Number(id)),
      }))
      .reduce<{ id: number; label: string }[]>((accumulator, component) => {
        if (!accumulator.some((existing) => existing.label === component.label)) {
          accumulator.push(component);
        }
        return accumulator;
      }, []);
  };

  const getDependentPolicyLabels = (dependent: any) => {
    const groupedPolicies = new Map<string, Set<string>>();

    const addComponentToGroup = (
      policyName: string,
      componentId: number | null,
      componentLabel: string | null,
    ) => {
      const label = componentLabel?.trim() || (componentId ? getComponentLabel(componentId) : null);
      if (!label || !policyName) return;
      const set = groupedPolicies.get(policyName) ?? new Set<string>();
      set.add(label);
      groupedPolicies.set(policyName, set);
    };

    (dependent?.entries || [dependent]).forEach((entry: any) => {
      const enrolledPolicies: any[] = Array.isArray(entry?.enrolledPolicies)
        ? entry.enrolledPolicies
        : [];

      if (enrolledPolicies.length > 0) {
        // Deduplicated entry — use per-policy enrolled data for correct per-policy choices
        enrolledPolicies.forEach((ep: any) => {
          const policyName = String(ep?.sourcePolicyName || 'Policy').trim();
          const mainId = Number(ep?.policyComponentActionTypeId);
          if (Number.isFinite(mainId) && mainId > 0) {
            addComponentToGroup(policyName, mainId, null);
          }
          (ep?.choices || []).forEach((choice: any) => {
            addComponentToGroup(
              policyName,
              Number(choice?.policyComponentActionTypeId) || null,
              choice?.policyComponentActionLabel || choice?.policyComponentActionType || null,
            );
          });
        });
        return;
      }

      // Original path — use entry choices directly
      const entryChoices = Array.isArray(entry?.choices) ? entry.choices : [];
      if (entryChoices.length === 0 && !entry?.policyComponentActionTypeId) return;

      const policyName = String(
        entry?.sourcePolicyName ||
          entry?.policyName ||
          entry?.sourcePolicyTypeKey ||
          entry?.policyTypeKey ||
          'Policy',
      ).trim();

      if (entry?.policyComponentActionTypeId) {
        addComponentToGroup(policyName, Number(entry.policyComponentActionTypeId), null);
      }
      entryChoices.forEach((choice: any) => {
        addComponentToGroup(
          policyName,
          Number(choice?.policyComponentActionTypeId) || null,
          choice?.policyComponentActionLabel || choice?.policyComponentActionType || null,
        );
      });
    });

    return Array.from(groupedPolicies.entries())
      .map(([, componentSet]) => Array.from(componentSet).join(', '))
      .filter(Boolean);
  };

  if (eligibleDependents.length === 0) {
    return (
      <NoDataPage
        compactView
        showFlyingBirds={false}
        showDivider={false}
        removeMaxWidth
        title={LIFE_EVENTS_DEPENDENT_REMOVAL_COPY.emptyStateTitle}
        subtitle={`${LIFE_EVENTS_DEPENDENT_REMOVAL_COPY.noEligibleDependentsMessage} ${lifeEventData?.title || 'this life event'}. ${LIFE_EVENTS_DEPENDENT_REMOVAL_COPY.requiredRelationshipsMessage} ${lifeEventData?.requiredRelationships?.join(', ') || '--'}.`}
      />
    );
  }
console.log('Eligible Dependents for Removal:', eligibleDependents);
  return (
    <Box>
      {/* Debug: Show current selection */}

      {/* List of eligible dependents with table-style cards */}
      {eligibleDependents.map((dependent: any) => {
        const isSelected = (dependent.ids || []).every((id: number) =>
          selectedDependents.includes(id),
        );
        const toggleId = dependent.ids?.[0] || dependent.representative?.id;

        return (
          <DependentRemovalTableCard
            key={dependent.key}
            selected={isSelected}
            onClick={() => {
              if (Number.isFinite(Number(toggleId))) {
                handleDependentSelect(Number(toggleId));
              }
            }}
          >
            {/* Checkbox */}
            <DependentRemovalCheckbox onClick={(event) => event.stopPropagation()}>
              <Checkbox
                checked={isSelected}
                onChange={() => {
                  if (Number.isFinite(Number(toggleId))) {
                    handleDependentSelect(Number(toggleId));
                  }
                }}
              />
            </DependentRemovalCheckbox>

            {/* Dependent Info - Table Style Layout */}
            <DependentRemovalTableGrid>
              {/* Dependent Name */}
              <DependentRemovalTableColumn>
                <DependentRemovalTableHeader variant="body2">
                  Dependent
                </DependentRemovalTableHeader>
                <DependentRemovalTableValue variant="h6">
                  {dependent.representative?.name}
                </DependentRemovalTableValue>
              </DependentRemovalTableColumn>

              {/* Relation */}
              <DependentRemovalTableColumn>
                <DependentRemovalTableHeader variant="body2">
                  Relation
                </DependentRemovalTableHeader>
                <DependentRemovalTableSubValue variant="body1">
                  {capitalizeFirst(dependent.representative?.relation)}
                </DependentRemovalTableSubValue>
              </DependentRemovalTableColumn>

              {/* Date of Birth */}
              <DependentRemovalTableColumn>
                <DependentRemovalTableHeader variant="body2">
                  Date of Birth
                </DependentRemovalTableHeader>
                <DependentRemovalTableSubValue variant="body1">
                  {dayjs(dependent.representative?.dateOfBirth).format('MMM DD, YYYY')}
                </DependentRemovalTableSubValue>
              </DependentRemovalTableColumn>

              {/* Policies */}
              <DependentRemovalTableColumn>
                <DependentRemovalTableHeader variant="body2">
                  Policies
                </DependentRemovalTableHeader>
                <DependentRemovalTableSubValue variant="body1">
                  {getDependentPolicyLabels(dependent).length > 0
                    ? getDependentPolicyLabels(dependent).join(', ')
                    : '--'}
                </DependentRemovalTableSubValue>
              </DependentRemovalTableColumn>
            </DependentRemovalTableGrid>
          </DependentRemovalTableCard>
        );
      })}

      {/* Footer Actions - Same as Addition Flow */}
      <AdditionDetailsFooterActions>
        <AdditionDetailsSecondaryButton
          type="button"
          variant="outlined"
          onClick={onBack}
          disabled={!onBack}
        >
          {LIFE_EVENTS_STEP_ACTION_COPY.back}
        </AdditionDetailsSecondaryButton>

        <AdditionDetailsFooterRightGroup>
          {onExit && (
            <AdditionDetailsSecondaryButton
              type="button"
              variant="outlined"
              onClick={onExit}
            >
              Quit / Exit
            </AdditionDetailsSecondaryButton>
          )}
          <AdditionDetailsPrimaryButton
            type="button"
            variant="contained"
            onClick={onContinue}
            disabled={selectedDependents.length === 0}
          >
            Continue
          </AdditionDetailsPrimaryButton>
        </AdditionDetailsFooterRightGroup>
      </AdditionDetailsFooterActions>
    </Box>
  );
};

export default LifeEventsDependentRemoval;
