import { capitalizeFirst } from '../../utils';
import React, {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { Box, Button, Checkbox, Typography } from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import CommonPolicyCard from "../../common/CommonPolicyCard";
import DashboardEnrollmentSummary from "../../components/DashboardEnrollmentSummary";
import { ACTIVE, CLICKED } from "../../constants";
import { formatAmountWithCurrency, useLocalization, getTaxLabel } from "@ui/ui-lib";
import {
  buildLifeEventAvailableChoicesForPolicies,
  getLifeEventDependentKey,
  relationMatchesEligibleRelation,
  LifeEventPolicyChoice,
} from "./policyChoices";
import compulsoryBenefitIcon from "../../assets/svgs/compulsory-benifits-icon.svg";
import optionalBenefitIcon from "../../assets/svgs/optional-benefits-icon.svg";
import flexBenefitIcon from "../../assets/svgs/flex-benifits.svg";
import {
  AdditionDetailsPrimaryButton,
  AdditionDetailsSecondaryButton,
  AdditionDetailsFooterActions,
  AdditionDetailsFooterRightGroup,
  ChoiceSelectionContainer,
  ChoicesPanel,
  PremiumCalculatorPanel,
  ChooseBenefitsSectionCard,
  ChooseBenefitsSectionHeader,
  ChooseBenefitsSectionHeaderLeft,
  ChooseBenefitsSectionHeadingBlock,
  ChooseBenefitsSectionIconTile,
  ChooseBenefitsSectionTitle,
  ChooseBenefitsSectionDescription,
  ChooseBenefitsSectionBody,
  ChooseBenefitsToggleButton,
  ChoiceSectionCard,
  ChoiceSectionHeader,
  ChoiceSectionHeaderContent,
  ChoiceSectionContent,
  ChoiceSectionIconWrapper,
  ChoiceSectionArrowWrapper,
  // ChoiceSectionIconLabel,
  ChoiceSectionTitleText,
  ChoiceSectionSubtitleText,
  AdditionDetailsPageContainerForChoiceSelection,
  AdditionDetailsFormCardForChoiceSelection,
  AdditionDetailsFormCardContent,
} from "./styles";
import { getPolicyIcon } from "../../components/MultiEnrollment/MultiEnrollmentSummary";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LifeEventsChoiceSelectionProps {
  selectedLifeEvent: string;
  dependentsData: any[];
  gmcPolicyData: any;
  lifeEventPolicySources?: any[];
  selectedChoiceIds: string[];
  onSelectedChoiceIdsChange: (choiceIds: string[]) => void;
  selectedDependentKeysByGroup: Record<string, string[]>;
  onSelectedDependentKeysByGroupChange: (
    selection: Record<string, string[]>
  ) => void;
  onPendingSelectionsChange?: (
    allPendingSelections: Record<string, string[]>,
    changedSelectionGroupKey: string
  ) => void;
  onBack: () => void;
  onExit?: () => void;
  onContinue: () => void;
  /** When true, enrolled choices are NOT auto-selected on mount. User must pick manually. */
  disableInitialChoiceAutoSelect?: boolean;
}

interface ChoiceAccordionGroup {
  selectionGroupKey: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  choices: LifeEventPolicyChoice[];
  lockedChoiceIds: string[];
  expanded: boolean;
  section: "compulsory" | "optional" | "flex";
  maxChildrenCount?: number | null;
}

const calcAge = (date: Date): number => {
  const today = new Date();
  return (
    today.getFullYear() -
    date.getFullYear() -
    (today.getMonth() < date.getMonth() ||
    (today.getMonth() === date.getMonth() && today.getDate() < date.getDate())
      ? 1
      : 0)
  );
};

const formatDateOfBirth = (value: unknown): string => {
  if (!value) {
    return "--";
  }

  const rawValue = String(value).trim();
  const isoMatch = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    const age = calcAge(date);
    return `${day}/${month}/${year} (Age:${age})`;
  }

  const date = new Date(rawValue);
  if (!Number.isNaN(date.getTime())) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const age = calcAge(date);
    return `${day}/${month}/${year} (Age:${age})`;
  }

  return rawValue;
};

// ─── Component ────────────────────────────────────────────────────────────────

const LifeEventsChoiceSelection: React.FC<LifeEventsChoiceSelectionProps> = ({
  selectedLifeEvent: _selectedLifeEvent,
  dependentsData,
  gmcPolicyData,
  lifeEventPolicySources = [],
  selectedChoiceIds,
  onSelectedChoiceIdsChange,
  selectedDependentKeysByGroup,
  onSelectedDependentKeysByGroupChange,
  onPendingSelectionsChange,
  onBack,
  onExit,
  onContinue,
  disableInitialChoiceAutoSelect = false,
}) => {
  const { localizationData } = useLocalization();
  const [groupStates, setGroupStates] = useState<Record<string, boolean>>({});
  const [sectionStates, setSectionStates] = useState<
    Record<"compulsory" | "optional" | "flex", boolean>
  >({
    compulsory: true,
    optional: true,
    flex: true,
  });
  const [pendingChoiceIdsByGroup, setPendingChoiceIdsByGroup] = useState<
    Record<string, string | null>
  >({});
  const [pendingDependentKeysByGroup, setPendingDependentKeysByGroup] =
    useState<Record<string, string[] | undefined>>({});
  const selectionSeedRef = useRef<string | null>(null);
  const previousAvailableChoicesRef = useRef<LifeEventPolicyChoice[]>([]);
  // Tracks default choice IDs we've already seeded once.
  // Used so that if the user explicitly unselects a default we don't re-seed it on
  // subsequent refreshes — only NEW defaults that appear after a refresh get seeded.
  const seededDefaultIdsRef = useRef<Set<string>>(new Set());
  // Tracks previous life event so we only clear pending dependent state when the
  // life event itself changes, not when choices refresh due to dependent selection.
  const prevLifeEventRef = useRef<string | null>(null);
  // Always-current ref so dependent auto-selection reads fresh state without stale closure.
  const selectedDependentKeysByGroupRef = useRef(selectedDependentKeysByGroup);
  selectedDependentKeysByGroupRef.current = selectedDependentKeysByGroup;

  const dedupedDependentsData = useMemo(() => {
    const seen = new Set<string>();
    return (dependentsData || []).filter((dependent: any) => {
      const key = getLifeEventDependentKey(dependent);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }, [dependentsData]);

  const selectedRelations = useMemo(
    () =>
      Array.from(
        new Set(
          dedupedDependentsData
            .map(
              (dependent: any) =>
                dependent?.relationship || dependent?.relation || ""
            )
            .filter(Boolean)
            .map((relation: string) => relation.toLowerCase().trim())
        )
      ),
    [dedupedDependentsData]
  );

  const isChildFlow = useMemo(
    () =>
      selectedRelations.some((relation) =>
        ["child", "children", "son", "daughter"].includes(relation)
      ),
    [selectedRelations]
  );

  const getPolicySourceForChoice = useCallback(
    (choice: LifeEventPolicyChoice) =>
      lifeEventPolicySources.find((policy: any) => {
        if (policy?.policyId != null && choice?.policyId != null) {
          return String(policy.policyId) === String(choice.policyId);
        }

        const policyTypeKey = String(policy?.policyTypeKey || "")
          .toLowerCase()
          .trim();
        const choiceTypeKey = String(choice?.policyTypeKey || "")
          .toLowerCase()
          .trim();
        if (policyTypeKey && choiceTypeKey && policyTypeKey === choiceTypeKey) {
          return true;
        }

        const policyName = String(policy?.policyName || "")
          .toLowerCase()
          .trim();
        const choiceName = String(choice?.policyName || "")
          .toLowerCase()
          .trim();
        return policyName && choiceName && policyName === choiceName;
      }) || null,
    [lifeEventPolicySources]
  );

  const getChildMaxCountForChoice = useCallback(
    (choice: LifeEventPolicyChoice) => {
      const policySource = getPolicySourceForChoice(choice);
      const enabledPolicyRelations =
        policySource?.configuration?.relationships?.enabledPolicyRelations ||
        [];

      const childrenRelation =
        enabledPolicyRelations.find(
          (relation: any) =>
            relation?.enabled &&
            typeof relation?.type === "string" &&
            relation.type.toLowerCase().trim() === "children"
        ) ||
        enabledPolicyRelations.find((relation: any) => {
          const options = Array.isArray(relation?.configuredOptions)
            ? relation.configuredOptions
            : [];
          return options.some((option: any) =>
            ["son", "daughter"].includes(
              String(option?.name || "")
                .toLowerCase()
                .trim()
            )
          );
        });

      const parsedMax = Number.parseInt(childrenRelation?.maxCount || "", 10);
      return Number.isNaN(parsedMax) ? null : parsedMax;
    },
    [getPolicySourceForChoice]
  );

  const availableChoices = useMemo(() => {
    const relationNames = dedupedDependentsData
      .map(
        (dependent: any) => dependent?.relationship || dependent?.relation || ""
      )
      .filter(Boolean);

    return buildLifeEventAvailableChoicesForPolicies(
      lifeEventPolicySources,
      relationNames,
      gmcPolicyData?.configuration?.constraints?.showEmployeeContribution
    );
  }, [dedupedDependentsData, lifeEventPolicySources]);

  const defaultSelectedChoiceIds = useMemo(() => {
    // Auto-select any choice flagged isDefault: true, regardless of isRelationshipGroup.
    return availableChoices
      .filter((c) => c.isDefault)
      .map((c) => c.id);
  }, [availableChoices]);

  useEffect(() => {
    const seedKey = `${
      _selectedLifeEvent || ""
    }:${defaultSelectedChoiceIds.join(",")}`;
    if (selectionSeedRef.current === seedKey) {
      return;
    }

    // Helper — compulsory defaults are always auto-seeded; optional defaults are
    // seeded once and then respect the user's manual unselect.
    const isCompulsoryDefault = (id: string) => {
      const choice = availableChoices.find((c) => c.id === id);
      return choice?.section === "compulsory";
    };

    // On re-mount (navigate back) with existing selections, preserve them
    if (selectionSeedRef.current === null && selectedChoiceIds.length > 0) {
      selectionSeedRef.current = seedKey;
      // Treat existing selections as already-seeded so we don't re-seed them again
      // (compulsory defaults will still re-seed because they bypass this ref check).
      selectedChoiceIds.forEach((id) => seededDefaultIdsRef.current.add(id));
      return;
    }

    selectionSeedRef.current = seedKey;

    // Drop stale ids that no longer correspond to a current choice
    const validIds = new Set(availableChoices.map((c) => c.id));
    const validExistingIds = selectedChoiceIds.filter((id) => validIds.has(id));

    // Prune seededDefaultIdsRef of stale entries that are no longer in availableChoices
    seededDefaultIdsRef.current.forEach((id) => {
      if (!validIds.has(id)) seededDefaultIdsRef.current.delete(id);
    });

    // When disableInitialChoiceAutoSelect is set, never auto-select any choices —
    // only preserve what the user explicitly picked. Just prune stale IDs.
    if (disableInitialChoiceAutoSelect) {
      const merged = Array.from(new Set(validExistingIds));
      onSelectedChoiceIdsChange(merged);
      const currentLifeEvent = _selectedLifeEvent || "";
      if (prevLifeEventRef.current !== currentLifeEvent) {
        setPendingDependentKeysByGroup({});
        prevLifeEventRef.current = currentLifeEvent;
      }
      return;
    }

    // Compulsory defaults — always re-seed AND replace any existing selection in the
    // same selection group. In isRelationshipGroup refreshes the choice IDs are stable
    // (componentId|sumInsuredId), so the old selection would otherwise remain alongside
    // the new default, putting two items in the same group.
    const compulsoryDefaultIds = defaultSelectedChoiceIds.filter((id) =>
      isCompulsoryDefault(id),
    );
    const groupsBeingReplaced = new Set<string>();
    compulsoryDefaultIds.forEach((id) => {
      const choice = availableChoices.find((c) => c.id === id);
      if (choice) groupsBeingReplaced.add(choice.selectionGroupKey);
    });

    // Drop existing selections in any group that has a new compulsory default
    const filteredExistingIds = validExistingIds.filter((id) => {
      const choice = availableChoices.find((c) => c.id === id);
      return !choice || !groupsBeingReplaced.has(choice.selectionGroupKey);
    });

    // Optional defaults — only seed once; respect user's manual unselect afterwards
    const optionalDefaultsToSeed = defaultSelectedChoiceIds.filter((id) => {
      if (isCompulsoryDefault(id)) return false;
      return !seededDefaultIdsRef.current.has(id);
    });
    optionalDefaultsToSeed.forEach((id) => seededDefaultIdsRef.current.add(id));

    const merged = Array.from(
      new Set([...filteredExistingIds, ...compulsoryDefaultIds, ...optionalDefaultsToSeed]),
    );
    onSelectedChoiceIdsChange(merged);
    // Only wipe pending dependent selections when the life event itself changes.
    // When choices refresh due to a dependent checkbox triggering a pricing API call,
    // preserve the pending state so the checkbox stays checked.
    const currentLifeEvent = _selectedLifeEvent || "";
    if (prevLifeEventRef.current !== currentLifeEvent) {
      setPendingDependentKeysByGroup({});
      prevLifeEventRef.current = currentLifeEvent;
    }
  }, [_selectedLifeEvent, defaultSelectedChoiceIds, availableChoices, onSelectedChoiceIdsChange, selectedChoiceIds]);

  // Auto-select eligible new dependents when a choice is first selected.
  // Fires whenever selectedChoiceIds changes; for each newly selected group that
  // has no dependent selection yet, auto-checks the eligible dependents.
  useEffect(() => {
    if (dedupedDependentsData.length === 0 || availableChoices.length === 0) return;
    if (selectedChoiceIds.length === 0) return;

    const currentDependentsByGroup = selectedDependentKeysByGroupRef.current;
    const newAutoSelection: Record<string, string[]> = {};

    const toLower = (arr: any): string[] | null =>
      Array.isArray(arr) ? arr.map((r: string) => String(r).toLowerCase().trim()).filter(Boolean) : null;

    selectedChoiceIds.forEach(choiceId => {
      const ch = availableChoices.find(c => c.id === choiceId);
      if (!ch) return;
      const groupKey = ch.selectionGroupKey;
      // Skip if user already has a selection for this group
      if ((currentDependentsByGroup[groupKey] || []).length > 0) return;
      // Skip if already being auto-selected in this batch
      if (newAutoSelection[groupKey]) return;

      const policySource = lifeEventPolicySources.find(
        (p: any) => String(p?.policyId) === String(ch.policyId)
      );
      const template = policySource?.configuration?.policyTemplate;
      if (!template) return;

      const componentId = Number(ch.policyComponentActionTypeId);
      let eligible: string[] | null = null;
      if (template.basePolicy?.mainPolicyId != null && Number(template.basePolicy.mainPolicyId) === componentId) {
        eligible = toLower(template.basePolicy.eligibleRelations);
      } else {
        const ba = (template.basePolicy?.addonIds || []).find((a: any) => Number(a?.optionId) === componentId);
        if (ba) { eligible = toLower(ba.eligibleRelations); }
        else if (template.parentalPolicy?.mainPolicyId != null && Number(template.parentalPolicy.mainPolicyId) === componentId) {
          eligible = toLower(template.parentalPolicy.eligibleRelations);
        } else {
          const pa = (template.parentalPolicy?.addonIds || []).find((a: any) => Number(a?.optionId) === componentId);
          if (pa) eligible = toLower(pa.eligibleRelations);
        }
      }
      const deps = eligible
        ? dedupedDependentsData.filter((d: any) => {
            const rel = String(d?.relationship || d?.relation || '').toLowerCase().trim();
            return rel && eligible!.some((er) => relationMatchesEligibleRelation(rel, er));
          })
        : dedupedDependentsData;
      if (deps.length > 0) {
        newAutoSelection[groupKey] = deps.map((d: any) => getLifeEventDependentKey(d));
      }
    });

    if (Object.keys(newAutoSelection).length > 0) {
      onSelectedDependentKeysByGroupChange({ ...currentDependentsByGroup, ...newAutoSelection });
    }
  }, [selectedChoiceIds, availableChoices, dedupedDependentsData]); // eslint-disable-line react-hooks/exhaustive-deps

  const groupedChoices = useMemo<ChoiceAccordionGroup[]>(() => {
    const groups = availableChoices.reduce<
      Record<string, LifeEventPolicyChoice[]>
    >((accumulator, choice) => {
      if (!accumulator[choice.selectionGroupKey]) {
        accumulator[choice.selectionGroupKey] = [];
      }
      accumulator[choice.selectionGroupKey].push(choice);
      return accumulator;
    }, {});

    // Combined sequence map: keyed by `${policyId}|${optionId}|${parentMainPolicyId}` → sequence
    const combinedSeqMap = new Map<string, number>();
    (lifeEventPolicySources || []).forEach((policy: any) => {
      if (!policy) return;
      const pid = String(policy.policyId ?? "");
      const tmpl = policy.configuration?.policyTemplate;
      const baseMainId = tmpl?.basePolicy?.mainPolicyId;
      const parentalMainId = tmpl?.parentalPolicy?.mainPolicyId;
      (tmpl?.basePolicy?.addonIds ?? []).forEach((addon: any) => {
        combinedSeqMap.set(`${pid}|${addon.optionId}|${baseMainId}`, addon.sequence);
      });
      (tmpl?.parentalPolicy?.addonIds ?? []).forEach((addon: any) => {
        combinedSeqMap.set(
          `${pid}|${addon.optionId}|${parentalMainId}`,
          addon.sequence,
        );
      });
    });

    const seenDisplayKeys = new Set<string>();
    const normalizeDisplayKeyPart = (value: unknown) =>
      String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-");

    const rawGroups = Object.entries(groups).flatMap(([selectionGroupKey, choices]) => {
      const primaryChoice = choices[0];
      const isRelationshipGroup = primaryChoice?.isRelationshipGroup === true;
      const committedChoices = choices.filter(
        (choice) => choice.isDefault && choice.section === "compulsory"
      );
      // Enrolled choices: any choice marked isDefault regardless of section type.
      // More reliable than committedChoices for determining what was selected during enrollment.
      const enrolledChoices = choices.filter((choice) => choice.isDefault);
      const hasDependentSelectionForGroup =
        (pendingDependentKeysByGroup[selectionGroupKey]?.length ?? 0) > 0 ||
        (selectedDependentKeysByGroup[selectionGroupKey]?.length ?? 0) > 0;
      // For isRelationshipGroup + dependent selected: show all refreshed choices (API returns new options).
      // For non-isRelationshipGroup (or before dependent selection): show only the enrolled choice.
      // Fallback to all choices only when no enrolled choice exists (edge case).
      const displayChoices =
        isRelationshipGroup && hasDependentSelectionForGroup
          ? choices
          : enrolledChoices.length > 0
          ? enrolledChoices
          : choices;
      const section: "compulsory" | "optional" | "flex" =
        primaryChoice?.isBenefitComponent === true
          ? "flex"
          : primaryChoice?.section === "optional"
          ? "optional"
          : "compulsory";
      const childMaxCount = isChildFlow
        ? getChildMaxCountForChoice(primaryChoice)
        : null;
      const displayKey = [
        normalizeDisplayKeyPart(section),
        normalizeDisplayKeyPart(displayChoices[0]?.policyTypeKey || ""),
        normalizeDisplayKeyPart(displayChoices[0]?.policyName || ""),
        normalizeDisplayKeyPart(
          displayChoices[0]?.policyComponentActionLabel || ""
        ),
      ]
        .filter(Boolean)
        .join("_");

      if (seenDisplayKeys.has(displayKey)) {
        return [];
      }
      seenDisplayKeys.add(displayKey);

      const lockedChoiceIds = enrolledChoices.map((choice) => choice.id);
      const avatarData = getPolicyIcon(
        primaryChoice.policyName ||
          primaryChoice.policyTypeKey ||
          primaryChoice.policyComponentActionType
      );

      return {
        selectionGroupKey,
        title: displayChoices[0]?.policyComponentActionLabel || "Policy",
        subtitle:
          enrolledChoices.length > 0
            ? "Already enrolled coverage"
            : section === "compulsory"
            ? "Automatically provided to all employees"
            : "Additional coverage you can choose to add",
        icon: (
          <ChoiceSectionIconWrapper>
            <Box
              sx={{
                width: 48,
                height: 48,
                p: "2px",
                borderRadius: "50%",
                background: avatarData.borderGradient,
                flexShrink: 0,
              }}
            >
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: avatarData.gradient,
                  boxShadow: "0px 8px 18px rgba(0, 0, 0, 0.08)",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: "#fff",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                  }}
                >
                  {avatarData.initials}
                </Typography>
              </Box>
            </Box>
          </ChoiceSectionIconWrapper>
        ),
        choices: displayChoices,
        lockedChoiceIds,
        expanded: groupStates[selectionGroupKey] ?? true,
        section,
        maxChildrenCount: childMaxCount,
      };
    });

    const sectionOrder = (s: string) =>
      s === "compulsory" ? 0 : s === "optional" ? 1 : 2;

    return (rawGroups as ChoiceAccordionGroup[]).sort((a, b) => {
      if (a.section !== b.section)
        return sectionOrder(a.section) - sectionOrder(b.section);
      if (a.section !== "optional") return 0;

      const aChoice = a.choices[0] as any;
      const bChoice = b.choices[0] as any;
      const aPid = String(aChoice?.policyId ?? "");
      const bPid = String(bChoice?.policyId ?? "");
      const aSeq =
        combinedSeqMap.get(
          `${aPid}|${aChoice?.policyComponentActionTypeId}|${aChoice?.parentpolicyComponentActionTypeId}`,
        ) ?? 999;
      const bSeq =
        combinedSeqMap.get(
          `${bPid}|${bChoice?.policyComponentActionTypeId}|${bChoice?.parentpolicyComponentActionTypeId}`,
        ) ?? 999;
      return aSeq - bSeq;
    });
  }, [
    availableChoices,
    getChildMaxCountForChoice,
    groupStates,
    isChildFlow,
    lifeEventPolicySources,
    pendingDependentKeysByGroup,
    selectedDependentKeysByGroup,
  ]);

  const selectedDependentKeys = useMemo(
    () =>
      Array.from(new Set(Object.values(selectedDependentKeysByGroup).flat())),
    [selectedDependentKeysByGroup]
  );

  const toggleGroup = useCallback((selectionGroupKey: string) => {
    setGroupStates((prev) => ({
      ...prev,
      [selectionGroupKey]: !prev[selectionGroupKey],
    }));
  }, []);

  // When availableChoices changes (e.g. after API refresh for relationship-group policies),
  // re-sync stale pending and committed choice IDs so the card doesn't show as deselected.
  // selectionGroupKey is stable across refreshes, so we use it to remap old choice IDs to
  // the equivalent choice in the refreshed list.
  useEffect(() => {
    const prevChoices = previousAvailableChoicesRef.current;
    previousAvailableChoicesRef.current = availableChoices;

    if (availableChoices.length === 0) return;

    // Remap stale pending IDs to the new choice in the same group
    setPendingChoiceIdsByGroup((prev) => {
      const next = { ...prev };
      let changed = false;
      Object.entries(next).forEach(([groupKey, pendingId]) => {
        if (!pendingId) return;
        const choiceExists = availableChoices.some(
          (c) => c.id === pendingId && c.selectionGroupKey === groupKey
        );
        if (!choiceExists) {
          const newChoice = availableChoices.find(
            (c) => c.selectionGroupKey === groupKey
          );
          next[groupKey] = newChoice?.id ?? null;
          changed = true;
        }
      });
      return changed ? next : prev;
    });

    // Remap stale committed IDs (from selectedChoiceIds) to the new choice in the same group.
    // We need prevChoices to know which group each stale ID belonged to.
    if (prevChoices.length > 0 && selectedChoiceIds.length > 0) {
      let didRemap = false;
      const remapped = selectedChoiceIds.map((id) => {
        if (availableChoices.some((c) => c.id === id)) return id;
        const oldChoice = prevChoices.find((c) => c.id === id);
        if (!oldChoice) return id;
        const newChoice = availableChoices.find(
          (c) => c.selectionGroupKey === oldChoice.selectionGroupKey
        );
        if (newChoice) {
          didRemap = true;
          return newChoice.id;
        }
        return id;
      });
      if (didRemap) {
        onSelectedChoiceIdsChange(remapped);
      }
    }
  }, [availableChoices]);

  const toggleDependentSelection = useCallback(
    (selectionGroupKey: string, dependentKey: string) => {
      const current =
        pendingDependentKeysByGroup[selectionGroupKey] ??
        selectedDependentKeysByGroup[selectionGroupKey] ??
        [];
      const next = current.includes(dependentKey)
        ? current.filter((key) => key !== dependentKey)
        : [...current, dependentKey];

      // Notify parent of pending selection change for isRelationshipGroup pricing
      if (onPendingSelectionsChange) {
        const updatedPending: Record<string, string[]> = {};
        Object.entries({
          ...pendingDependentKeysByGroup,
          [selectionGroupKey]: next,
        }).forEach(([k, v]) => {
          updatedPending[k] = v ?? [];
        });
        onPendingSelectionsChange(updatedPending, selectionGroupKey);
      }

      const groupChoice = availableChoices.find(
        (c) => c.selectionGroupKey === selectionGroupKey
      );

      // For non-relationship-group policies: auto-commit the choice immediately on
      // any dependent toggle. The choice should never deselect — it stays committed
      // regardless of whether dependents are checked or unchecked.
      if (!groupChoice?.isRelationshipGroup) {
        const choiceToCommit =
          availableChoices.find(
            (c) => c.selectionGroupKey === selectionGroupKey && c.isDefault
          ) ||
          availableChoices.find((c) => c.selectionGroupKey === selectionGroupKey);

        onSelectedDependentKeysByGroupChange({
          ...selectedDependentKeysByGroup,
          [selectionGroupKey]: next,
        });
        setPendingDependentKeysByGroup((prev) => ({
          ...prev,
          [selectionGroupKey]: next,
        }));

        if (choiceToCommit && !selectedChoiceIds.includes(choiceToCommit.id)) {
          const filtered = selectedChoiceIds.filter((id) => {
            const c = availableChoices.find((x) => x.id === id);
            return !c || c.selectionGroupKey !== selectionGroupKey;
          });
          onSelectedChoiceIdsChange([...filtered, choiceToCommit.id]);
        }
        return;
      }

      // Relationship-group path: use pending state, wait for explicit "Select" click
      const committedChoice = availableChoices.find(
        (choice) =>
          selectedChoiceIds.includes(choice.id) &&
          choice.selectionGroupKey === selectionGroupKey
      );
      const nextPendingChoice =
        pendingChoiceIdsByGroup[selectionGroupKey] ??
        committedChoice?.id ??
        availableChoices.find(
          (choice) =>
            choice.selectionGroupKey === selectionGroupKey && !choice.isDefault
        )?.id ??
        availableChoices.find(
          (choice) => choice.selectionGroupKey === selectionGroupKey
        )?.id ??
        null;

      if (committedChoice) {
        if (next.length === 0) {
          // Unchecked all dependents — clear pending overrides, the committed dependent
          // list, and the committed choice for this group so the enrolled default shows
          // as selected and the checkbox actually unchecks.
          setPendingDependentKeysByGroup((prev) => {
            const updated = { ...prev };
            delete updated[selectionGroupKey];
            return updated;
          });
          setPendingChoiceIdsByGroup((prev) => {
            const updated = { ...prev };
            delete updated[selectionGroupKey];
            return updated;
          });
          onSelectedDependentKeysByGroupChange({
            ...selectedDependentKeysByGroup,
            [selectionGroupKey]: [],
          });
          // Remove the committed choice from selectedChoiceIds so the enrolled default
          // renders as selected (via isDefault fallback) rather than unselected.
          onSelectedChoiceIdsChange(
            selectedChoiceIds.filter((id) => {
              const c = availableChoices.find((x) => x.id === id);
              return !c || c.selectionGroupKey !== selectionGroupKey;
            })
          );
          return;
        }

        setPendingDependentKeysByGroup((prev) => ({
          ...prev,
          [selectionGroupKey]: next,
        }));
        if (next.length > 0) {
          setPendingChoiceIdsByGroup((prev) => ({
            ...prev,
            [selectionGroupKey]: nextPendingChoice,
          }));
        }
        return;
      }

      if (next.length > 0) {
        setPendingChoiceIdsByGroup((prev) => ({
          ...prev,
          [selectionGroupKey]: nextPendingChoice,
        }));
      }
      setPendingDependentKeysByGroup((prev) => ({
        ...prev,
        [selectionGroupKey]: next,
      }));
    },
    [
      availableChoices,
      onPendingSelectionsChange,
      onSelectedChoiceIdsChange,
      onSelectedDependentKeysByGroupChange,
      pendingDependentKeysByGroup,
      pendingChoiceIdsByGroup,
      selectedChoiceIds,
      selectedDependentKeysByGroup,
    ]
  );

  const commitDependentSelectionForGroup = useCallback(
    (selectionGroupKey: string, nextDependentKeys: string[]) => {
      onSelectedDependentKeysByGroupChange({
        ...selectedDependentKeysByGroup,
        [selectionGroupKey]: nextDependentKeys,
      });
      setPendingDependentKeysByGroup((prev) => ({
        ...prev,
        [selectionGroupKey]: nextDependentKeys,
      }));
    },
    [onSelectedDependentKeysByGroupChange, selectedDependentKeysByGroup]
  );

  const commitChoiceSelectionForGroup = useCallback(
    (choice: LifeEventPolicyChoice, nextDependentKeys: string[]) => {
      const choiceId = choice.id;

      setPendingChoiceIdsByGroup((prev) => ({
        ...prev,
        [choice.selectionGroupKey]: null,
      }));
      setGroupStates((prev) => ({
        ...prev,
        [choice.selectionGroupKey]: false,
      }));

      const nextSelections = selectedChoiceIds.filter((id) => {
        const existingChoice = availableChoices.find((c) => c.id === id);
        return (
          !existingChoice ||
          existingChoice.selectionGroupKey !== choice.selectionGroupKey
        );
      });
      nextSelections.push(choiceId);
      onSelectedChoiceIdsChange(nextSelections);
      commitDependentSelectionForGroup(
        choice.selectionGroupKey,
        nextDependentKeys
      );
    },
    [
      availableChoices,
      commitDependentSelectionForGroup,
      onSelectedChoiceIdsChange,
      selectedChoiceIds,
    ]
  );

  const handleChoiceUnselect = useCallback(
    (choice: LifeEventPolicyChoice) => {
      if (choice.isDefault && choice.section !== "optional") {
        return;
      }

      setPendingChoiceIdsByGroup((prev) => ({
        ...prev,
        [choice.selectionGroupKey]: null,
      }));
      setGroupStates((prev) => ({
        ...prev,
        [choice.selectionGroupKey]: true,
      }));
      onSelectedChoiceIdsChange(
        selectedChoiceIds.filter((id) => id !== choice.id)
      );
      onSelectedDependentKeysByGroupChange({
        ...selectedDependentKeysByGroup,
        [choice.selectionGroupKey]: [],
      });
      setPendingDependentKeysByGroup((prev) => ({
        ...prev,
        [choice.selectionGroupKey]: [],
      }));
    },
    [
      selectedChoiceIds,
      onSelectedChoiceIdsChange,
      onSelectedDependentKeysByGroupChange,
      selectedDependentKeysByGroup,
    ]
  );

  const selectedChoiceByGroup = useMemo(() => {
    const next: Record<string, string> = {};
    selectedChoiceIds.forEach((choiceId) => {
      const choice = availableChoices.find((entry) => entry.id === choiceId);
      if (choice) {
        next[choice.selectionGroupKey] = choiceId;
      }
    });
    return next;
  }, [availableChoices, selectedChoiceIds]);

  const handleChoiceSelect = useCallback(
    (choice: LifeEventPolicyChoice) => {
      setPendingChoiceIdsByGroup((prev) => ({
        ...prev,
        [choice.selectionGroupKey]: choice.id,
      }));
    },
    [setPendingChoiceIdsByGroup]
  );

  const getPolicyAvatarLabel = useCallback((choice: LifeEventPolicyChoice) => {
    return getPolicyIcon(
      choice.policyName ||
        choice.policyTypeKey ||
        choice.policyComponentActionType
    );
  }, []);

  const enrollmentSummaryData = useMemo(() => {
    const effectiveChoiceIds = selectedChoiceIds.map((choiceId) => {
      const choice = availableChoices.find((c) => c.id === choiceId);
      if (!choice) return choiceId;
      const pendingId = pendingChoiceIdsByGroup[choice.selectionGroupKey];
      if (pendingId && pendingId !== choiceId) return pendingId;
      return choiceId;
    });
    const selectedChoices = availableChoices.filter((choice) =>
      effectiveChoiceIds.includes(choice.id)
    );
    const activeSelectedChoices = selectedChoices.filter(
      (choice) =>
        (selectedDependentKeysByGroup[choice.selectionGroupKey] || []).length >
        0
    );
    const allEmployeeChosenChoices = (lifeEventPolicySources || []).flatMap(
      (policy: any) => policy?.configuration?.employeeChosenChoices || []
    );
    const currentlyEnrolledComponentIds = new Set<number>(
      allEmployeeChosenChoices
        .map((choice: any) => Number(choice?.policyComponentActionTypeId))
        .filter((id: number) => Number.isFinite(id))
    );

    const getDependentDeltaAmount = (
      amount: number,
      premiumPerLife?: boolean,
      componentActionTypeId?: number,
      dependentCount = 1
    ) => {
      const baseAmount = Number(amount || 0);
      if (!Number.isFinite(baseAmount)) return 0;
      const componentId = Number(componentActionTypeId);
      const isCurrentlyEnrolled =
        Number.isFinite(componentId) &&
        currentlyEnrolledComponentIds.has(componentId);

      if (premiumPerLife) {
        return baseAmount * Math.max(1, dependentCount);
      }

      return isCurrentlyEnrolled ? 0 : baseAmount;
    };

    if (activeSelectedChoices.length === 0) {
      const constraints =
        (lifeEventPolicySources || [])[0]?.configuration?.constraints ??
        gmcPolicyData?.configuration?.constraints ??
        gmcPolicyData?.configuration?.configuration?.constraints ??
        gmcPolicyData?.constraints ??
        {};
      const gstApplicable = constraints.gstApplicable !== false;
      const showGstToEmployee = constraints.showGstToEmployee !== false;
      return {
        sections: [],
        summary: {
          user: { base: 0, gst: 0, total: 0 },
          company: { base: 0, gst: 0, total: 0 },
          totalCoverage: 0,
        },
        gstConfig: {
          applicable: gstApplicable,
          showToEmployee: showGstToEmployee,
          rate: 0.18,
        },
      };
    }

    const sections = activeSelectedChoices.map((choice, index) => {
      const selectedDependentCountForGroup = (
        selectedDependentKeysByGroup[choice.selectionGroupKey] || []
      ).length;
      const effectiveEmployeePay = getDependentDeltaAmount(
        Number(choice.employeePay) || 0,
        choice.premiumPerLife,
        choice.policyComponentActionTypeId,
        selectedDependentCountForGroup
      );
      const effectiveCompanyPay = choice.showCompanyContribution === true
        ? getDependentDeltaAmount(
            Number(choice.companyPay) || 0,
            choice.premiumPerLife,
            choice.policyComponentActionTypeId,
            selectedDependentCountForGroup
          )
        : 0;
      const effectiveTotalPremium = getDependentDeltaAmount(
        Number(choice.premium) || 0,
        choice.premiumPerLife,
        choice.policyComponentActionTypeId,
        selectedDependentCountForGroup
      );

      const premiumModeLabel = choice.premiumPerLife
        ? "Per Life"
        : "Per Family";
      const policyComponentLabel =
        choice.policyComponentActionLabel ||
        choice.policyComponentActionType ||
        "Coverage";

      return {
        id: choice.id,
        title: `${policyComponentLabel} (${premiumModeLabel})`,
        policyId: choice.policyComponentActionTypeId,
        policyTypeKey:
          choice.policyComponentActionType?.toLowerCase() || "unknown",
        policyType: choice.section === "compulsory" ? "base" : "addon",
        policyComponentActionType: choice.policyComponentActionType,
        policyComponentActionTypeId: choice.policyComponentActionTypeId,
        parentpolicyComponentActionTypeId:
          choice.parentpolicyComponentActionTypeId,
        policyComponentActionLabel: choice.policyComponentActionLabel,
        details: {
          enhancedCoverage: Number(choice.sumInsured) || 0,
          youPay: effectiveEmployeePay,
          companyPay: effectiveCompanyPay,
          totalPremium: effectiveTotalPremium,
        },
        defaultExpanded: index === 0,
        deduplicationKey: `${choice.policyComponentActionTypeId}-${choice.parentpolicyComponentActionTypeId}-${choice.sumInsured}`,
      };
    });

    const totalUserPay = activeSelectedChoices.reduce(
      (sum, choice) =>
        sum +
        getDependentDeltaAmount(
          Number(choice.employeePay) || 0,
          choice.premiumPerLife,
          choice.policyComponentActionTypeId,
          (selectedDependentKeysByGroup[choice.selectionGroupKey] || []).length
        ),
      0
    );
    const totalCompanyPay = activeSelectedChoices.reduce(
      (sum, choice) =>
        sum +
        (choice.showCompanyContribution === true
          ? getDependentDeltaAmount(
              Number(choice.companyPay) || 0,
              choice.premiumPerLife,
              choice.policyComponentActionTypeId,
              (selectedDependentKeysByGroup[choice.selectionGroupKey] || []).length
            )
          : 0),
      0
    );
    const totalCoverage = activeSelectedChoices.reduce(
      (sum, choice) => sum + (Number(choice.sumInsured) || 0),
      0
    );

    const constraints =
      (lifeEventPolicySources || [])[0]?.configuration?.constraints ??
      gmcPolicyData?.configuration?.constraints ??
      gmcPolicyData?.configuration?.configuration?.constraints ??
      gmcPolicyData?.constraints ??
      {};
    const gstApplicable = constraints.gstApplicable !== false;
    const showGstToEmployee = constraints.showGstToEmployee !== false;
    const gstRate = 0.18;
    const userGst = gstApplicable ? totalUserPay * gstRate : 0;
    const companyGst = gstApplicable ? totalCompanyPay * gstRate : 0;

    return {
      sections,
      summary: {
        user: {
          base: totalUserPay,
          gst: userGst,
          total: totalUserPay + userGst,
        },
        company: {
          base: totalCompanyPay,
          gst: companyGst,
          total: totalCompanyPay + companyGst,
        },
        totalCoverage,
      },
      gstConfig: {
        applicable: gstApplicable,
        showToEmployee: showGstToEmployee,
        rate: gstRate,
      },
    };
  }, [
    availableChoices,
    selectedChoiceIds,
    pendingChoiceIdsByGroup,
    selectedDependentKeysByGroup,
    gmcPolicyData,
    lifeEventPolicySources,
  ]);

  const renderChoiceCard = useCallback(
    (choice: LifeEventPolicyChoice) => {
     const isLocked = Boolean(
        choice.isDefault && !choice.isRelationshipGroup
      );
      const committedChoiceId =
        selectedChoiceByGroup[choice.selectionGroupKey] || null;
      const pendingChoiceId =
        pendingChoiceIdsByGroup[choice.selectionGroupKey] || null;
      const visibleChoiceId = pendingChoiceId || committedChoiceId;
      const isSelected =
        visibleChoiceId === choice.id || (!visibleChoiceId && choice.isDefault);
      const avatarLabel = getPolicyAvatarLabel(choice);

      return (
        <Box
          key={choice.id}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
          }}
        >
          <CommonPolicyCard
            sumInsured={Number(choice.sumInsured) || 0}
            premiumPerFamily={choice.premium}
            companyPays={choice.companyPay}
            myPay={choice.employeePay}
            state={isSelected ? CLICKED : ACTIVE}
            premiumPerLife={Boolean(choice?.premiumPerLife)}
            showCompanyContribution={(() => {
              const constraintsData =
                gmcPolicyData?.configuration?.constraints ??
                gmcPolicyData?.constraints ?? {};
              const constraintShowEmployeeContrib =
                constraintsData?.showEmployeeContribution === true;
              const components =
                gmcPolicyData?.configuration?.policyComponentsConfiguration?.components ?? [];
              const matchingComponent = components.find(
                (component: any) =>
                  String(component?.id) === String(choice?.policyComponentActionTypeId)
              );
              const componentShowCompanyContrib =
                matchingComponent?.showCompanyContribution === true;
              return constraintShowEmployeeContrib && componentShowCompanyContrib;
            })()}
            isGstApplicable={(() => {
              const constraintsData =
                gmcPolicyData?.configuration?.constraints ??
                gmcPolicyData?.constraints ?? {};
              return constraintsData?.gstApplicable !== false;
            })()}
            showGst={(() => {
              const constraintsData =
                gmcPolicyData?.configuration?.constraints ??
                gmcPolicyData?.constraints ?? {};
              return constraintsData?.showGstToEmployee !== false;
            })()}
            gstRate={0.18}
            isReadOnly={false}
            policyAvatarLabel={avatarLabel}
            onClick={() => {
              if (isLocked) {
                return;
              }

              handleChoiceSelect(choice);
            }}
            policyDisplayName={
              choice.policyComponentActionLabel ||
              choice.policyComponentActionType ||
              ""
            }
            localization={localizationData?.data}
          />
        </Box>
      );
    },
    [getPolicyAvatarLabel, pendingChoiceIdsByGroup, selectedChoiceByGroup]
  );

  const canContinue =
    selectedDependentKeys.length > 0 && selectedChoiceIds.length > 0;

  return (
    <AdditionDetailsPageContainerForChoiceSelection>
      <AdditionDetailsFormCardForChoiceSelection>
        <AdditionDetailsFormCardContent>
          <ChoiceSelectionContainer>
            <ChoicesPanel>
              {(["compulsory", "optional", "flex"] as const).map((sectionType) => {
                const sectionGroups = groupedChoices.filter(
                  (group) => group.section === sectionType
                );

                if (sectionGroups.length === 0) {
                  return null;
                }

                const sectionIcon =
                  sectionType === "compulsory"
                    ? compulsoryBenefitIcon
                    : sectionType === "flex"
                    ? flexBenefitIcon
                    : optionalBenefitIcon;

                const sectionLabel =
                  sectionType === "compulsory"
                    ? "Compulsory"
                    : sectionType === "flex"
                    ? "Flex Benefits"
                    : "Optional";

                const sectionDescription =
                  sectionType === "compulsory"
                    ? "Automatically provided to all employees"
                    : sectionType === "flex"
                    ? "Flexible benefits you can customise to your needs"
                    : "Choose and add optional benefits for extra protection";

                return (
                  <ChooseBenefitsSectionCard key={sectionType}>
                    <ChooseBenefitsSectionHeader>
                      <ChooseBenefitsSectionHeaderLeft>
                        <ChooseBenefitsSectionIconTile variant={sectionType === "flex" ? "optional" : sectionType}>
                          <img
                            src={sectionIcon}
                            alt={sectionLabel}
                          />
                        </ChooseBenefitsSectionIconTile>
                        <ChooseBenefitsSectionHeadingBlock>
                          <ChooseBenefitsSectionTitle>
                            {sectionLabel}
                          </ChooseBenefitsSectionTitle>
                          <ChooseBenefitsSectionDescription>
                            {sectionDescription}
                          </ChooseBenefitsSectionDescription>
                        </ChooseBenefitsSectionHeadingBlock>
                      </ChooseBenefitsSectionHeaderLeft>
                      <ChooseBenefitsToggleButton
                        type="button"
                        expanded={sectionStates[sectionType]}
                        onClick={() =>
                          setSectionStates((prev) => ({
                            ...prev,
                            [sectionType]: !prev[sectionType],
                          }))
                        }
                      >
                        <ExpandMore />
                      </ChooseBenefitsToggleButton>
                    </ChooseBenefitsSectionHeader>

                    <ChooseBenefitsSectionBody expanded={sectionStates[sectionType]}>
                      <Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '0 32px 32px' }}>
                        {sectionGroups.map((group) => {
                          const selectedKeysForGroup =
                            pendingDependentKeysByGroup[
                              group.selectionGroupKey
                            ] ??
                            selectedDependentKeysByGroup[
                              group.selectionGroupKey
                            ] ??
                            [];
                          const committedChoiceId =
                            selectedChoiceByGroup[group.selectionGroupKey] ||
                            null;
                          const pendingChoiceId =
                            pendingChoiceIdsByGroup[group.selectionGroupKey] ||
                            null;
                          const pendingChoice = group.choices.find(
                            (choice) => choice.id === pendingChoiceId
                          );
                          const committedChoice = group.choices.find(
                            (choice) => choice.id === committedChoiceId
                          );
                          const hasSelectedDependentsForGroup =
                            selectedKeysForGroup.length > 0;
                          const activeChoiceForGroup =
                            pendingChoice || committedChoice || group.choices[0] || null;
                          const canCommitSelectedPlan = Boolean(
                            activeChoiceForGroup &&
                              hasSelectedDependentsForGroup
                          );

                          // Compute eligible relations for this addon/base from the policy
                          // template so the Members list only shows dependents whose relation
                          // is allowed for this specific component (e.g. Critical Illness Cover
                          // accepts Father/Mother; OPD accepts Father-in-law/Mother-in-law).
                          const eligibleRelationsForGroup: string[] | null = (() => {
                            const ch = activeChoiceForGroup || group.choices[0];
                            if (!ch) return null;
                            const policySource = (lifeEventPolicySources || []).find(
                              (p: any) => String(p?.policyId) === String(ch.policyId)
                            );
                            const template = policySource?.configuration?.policyTemplate;
                            if (!template) return null;
                            const componentId = Number(ch.policyComponentActionTypeId);
                            if (!Number.isFinite(componentId)) return null;
                            const lower = (arr: any) =>
                              Array.isArray(arr)
                                ? arr.map((r: string) => String(r).toLowerCase().trim()).filter(Boolean)
                                : null;
                            // basePolicy main
                            if (template.basePolicy?.mainPolicyId != null &&
                                Number(template.basePolicy.mainPolicyId) === componentId) {
                              return lower(template.basePolicy.eligibleRelations);
                            }
                            // basePolicy addon
                            const baseAddon = (template.basePolicy?.addonIds || []).find(
                              (a: any) => Number(a?.optionId) === componentId
                            );
                            if (baseAddon) return lower(baseAddon.eligibleRelations);
                            // parentalPolicy main
                            if (template.parentalPolicy?.mainPolicyId != null &&
                                Number(template.parentalPolicy.mainPolicyId) === componentId) {
                              return lower(template.parentalPolicy.eligibleRelations);
                            }
                            // parentalPolicy addon
                            const parAddon = (template.parentalPolicy?.addonIds || []).find(
                              (a: any) => Number(a?.optionId) === componentId
                            );
                            if (parAddon) return lower(parAddon.eligibleRelations);
                            return null;
                          })();

                          const dependentsForGroup = eligibleRelationsForGroup
                            ? dedupedDependentsData.filter((d: any) => {
                                const rel = String(d?.relationship || d?.relation || "")
                                  .toLowerCase()
                                  .trim();
                                return (
                                  rel &&
                                  eligibleRelationsForGroup.some((er) =>
                                    relationMatchesEligibleRelation(rel, er)
                                  )
                                );
                              })
                            : dedupedDependentsData;

                          return (
                            <ChoiceSectionCard
                              key={group.selectionGroupKey}
                              selected={Boolean(committedChoice)}
                            >
                              <ChoiceSectionHeader
                                expanded={group.expanded}
                                onClick={() =>
                                  toggleGroup(group.selectionGroupKey)
                                }
                              >
                                <ChoiceSectionHeaderContent>
                                  {group.icon}
                                  <Box>
                                    <ChoiceSectionTitleText variant="h6">
                                      {group.title}
                                    </ChoiceSectionTitleText>
                                    <ChoiceSectionSubtitleText variant="body2">
                                      {group.subtitle}
                                    </ChoiceSectionSubtitleText>
                                    {isChildFlow &&
                                    Number.isFinite(
                                      Number(group.maxChildrenCount)
                                    ) ? (
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          display: "block",
                                          mt: 0.5,
                                          color: "#B45309",
                                          fontWeight: 600,
                                        }}
                                      >
                                        This policy allows up to{" "}
                                        {group.maxChildrenCount} children.
                                      </Typography>
                                    ) : null}
                                  </Box>
                                </ChoiceSectionHeaderContent>
                                {!group.expanded && committedChoice ? (
                                  <Box
                                    sx={{
                                      flexShrink: 0,
                                      borderRadius: '999px',
                                      background: '#F47721',
                                      color: '#fff',
                                      px: 2,
                                      py: 1,
                                      fontSize: 14,
                                      fontWeight: 500,
                                      lineHeight: 1,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 0.75,
                                    }}
                                  >
                                    <Box component="span" sx={{ fontSize: 14, lineHeight: 1 }}>✓</Box>
                                    Selected
                                  </Box>
                                ) : null}
                                <ChoiceSectionArrowWrapper expanded={group.expanded}>
                                  <ExpandMore />
                                </ChoiceSectionArrowWrapper>
                              </ChoiceSectionHeader>

                              <ChoiceSectionContent expanded={group.expanded}>
                                <Box>
                                <Box sx={{ padding: '18px 22px 22px' }}>
                                <Box
                                  sx={{
                                    mb: 3,
                                    overflow: "hidden",
                                    background: "#FFF",
                                    border: "1px solid #ECEFF4",
                                    borderRadius: "16px",
                                    pb: 1,
                                  }}
                                >
                                  <Box
                                    sx={{
                                      px: 2.5,
                                      py: 2,
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: 0.75,
                                    }}
                                  >
                                    <Typography
                                      variant="subtitle1"
                                      sx={{ fontWeight: 500 }}
                                    >
                                      Select Members to Include
                                    </Typography>
                                    <Typography variant="body2" fontWeight={700} sx={{ color: "#093F84" }}>
                                               Please Note: Adding dependents may change your SI options and contribution amount.
                                    </Typography>
                                  </Box>

                                  <Box sx={{ px: 2.5, py: 1 }}>
                                    <Box
                                      sx={{
                                        display: "grid",
                                        gridTemplateColumns:
                                          "48px 1.8fr 1.2fr 1fr 1.4fr",
                                        gap: 1,
                                        py: 1,
                                        px: 1,
                                        color: "#6B7280",
                                        fontSize: 14,
                                        borderBottom: "1px solid #ECEFF4",
                                      }}
                                    >
                                      <Box />
                                      <Box>Name</Box>
                                      <Box>Relation</Box>
                                      <Box>Gender</Box>
                                      <Box>Date Of Birth</Box>
                                    </Box>

                                    {dependentsForGroup.map(
                                      (dependent: any) => {
                                        const dependentKey =
                                          getLifeEventDependentKey(dependent);
                                        const isChecked =
                                          selectedKeysForGroup.includes(
                                            dependentKey
                                          );

                                        return (
                                          <Box
                                            key={`${group.selectionGroupKey}-${dependentKey}`}
                                            sx={{
                                              display: "grid",
                                              gridTemplateColumns:
                                                "48px 1.8fr 1.2fr 1fr 1.4fr",
                                              gap: 1,
                                              alignItems: "center",
                                              py: 1.5,
                                              px: 1,
                                              borderBottom: "1px solid #F3F4F6",
                                            }}
                                          >
                                            <Checkbox
                                              checked={isChecked}
                                              onChange={() =>
                                                toggleDependentSelection(
                                                  group.selectionGroupKey,
                                                  dependentKey
                                                )
                                              }
                                              sx={{
                                                color: "#1B4F95",
                                                "&.Mui-checked": {
                                                  color: "#1B4F95",
                                                },
                                              }}
                                            />
                                            <Box sx={{ fontWeight: 500 }}>
                                              {dependent?.name || "--"}
                                            </Box>
                                            <Box>
                                              {capitalizeFirst(dependent?.relationship ||
                                                dependent?.relation) ||
                                                "--"}
                                            </Box>
                                            <Box>
                                              {dependent?.gender || "--"}
                                            </Box>
                                            <Box>
                                              {formatDateOfBirth(
                                                dependent?.dateOfBirth ||
                                                  dependent?.dob
                                              )}
                                            </Box>
                                          </Box>
                                        );
                                      }
                                    )}
                                  </Box>
                                </Box>

                                  {group.choices.map((choice) =>
                                    renderChoiceCard(choice)
                                  )}
                                </Box>
                                </Box>
                              </ChoiceSectionContent>

                              {!group.expanded && committedChoice ? (
                                <Box
                                  sx={{
                                    paddingLeft: '22px',
                                    paddingRight: '22px',
                                    py: 2,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <Box sx={{ minWidth: 120 }}>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        color: "#6B7280",
                                        fontWeight: 400,
                                        mb: 0.5,
                                      }}
                                    >
                                      Sum Insured
                                    </Typography>
                                    <Typography
                                      variant="h6"
                                      sx={{
                                        color: "#2e2e2e",
                                        fontWeight: 400,
                                      }}
                                    >
                                      {formatAmountWithCurrency(
                                        Number(committedChoice.sumInsured || 0),
                                        localizationData?.data
                                      )}
                                    </Typography>
                                  </Box>
                                  {committedChoice.showCompanyContribution !== false && (
                                    <>
                                      <Box sx={{ minWidth: 120 }}>
                                        <Typography
                                          variant="body2"
                                          sx={{
                                            color: "#6B7280",
                                            fontWeight: 400,
                                            mb: 0.5,
                                          }}
                                        >
                                          Total Premium
                                        </Typography>
                                        <Typography
                                          variant="h6"
                                          sx={{
                                            color: "#2e2e2e",
                                            fontWeight: 400,
                                          }}
                                        >
                                          {formatAmountWithCurrency(
                                            Number(committedChoice.premium || 0),
                                            localizationData?.data
                                          )}
                                        </Typography>
                                      </Box>
                                      <Box sx={{ minWidth: 120 }}>
                                        <Typography
                                          variant="body2"
                                          sx={{
                                            color: "#6B7280",
                                            fontWeight: 400,
                                            mb: 0.5,
                                          }}
                                        >
                                          Company Contribution
                                        </Typography>
                                        <Typography
                                          variant="h6"
                                          sx={{
                                            color: "#2e2e2e",
                                            fontWeight: 400,
                                          }}
                                        >
                                          {formatAmountWithCurrency(
                                            Number(committedChoice.companyPay || 0),
                                            localizationData?.data
                                          )}
                                        </Typography>
                                      </Box>
                                    </>
                                  )}
                                  <Box sx={{ minWidth: 120 }}>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        color: "#6B7280",
                                        fontWeight: 400,
                                        mb: 0.5,
                                      }}
                                    >
                                      Your Contribution
                                    </Typography>
                                    <Typography
                                      variant="h6"
                                      sx={{
                                        color: "#2e2e2e",
                                        fontWeight: 400,
                                      }}
                                    >
                                      {formatAmountWithCurrency(
                                        Number(committedChoice.employeePay || 0),
                                        localizationData?.data
                                      )}
                                    </Typography>
                                  </Box>
                                </Box>
                              ) : null}

                              {group.expanded && (
                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    alignItems: "center",
                                    gap: 1.5,
                                    flexWrap: "wrap",
                                    mt: 2,
                                    px: 0.5,
                                    paddingBottom: '16px',
                                    paddingRight: '22px',
                                  }}
                                >
                                  {committedChoice ? (
                                    group.expanded ? (
                                      pendingChoiceId && pendingChoiceId !== committedChoiceId ? (
                                        // User clicked a different choice card — allow committing it
                                        <Button
                                          type="button"
                                          variant="contained"
                                          onClick={() => {
                                            if (!activeChoiceForGroup || !hasSelectedDependentsForGroup) return;
                                            const choiceToCommit = pendingChoice || committedChoice || group.choices[0];
                                            if (!choiceToCommit) return;
                                            commitChoiceSelectionForGroup(choiceToCommit, selectedKeysForGroup);
                                          }}
                                          disabled={!canCommitSelectedPlan}
                                          sx={{
                                            borderRadius: "4px",
                                            textTransform: "none",
                                            fontWeight: 500,
                                            minWidth: 128,
                                            backgroundColor: "#0B4F99",
                                            color: "#fff",
                                            "&:hover": { backgroundColor: "#0A437F" },
                                            "&.Mui-disabled": { backgroundColor: "#D1D5DB", color: "#9CA3AF" },
                                          }}
                                        >
                                          Select
                                        </Button>
                                      ) : group.section === "optional" || group.section === "flex" ? (
                                        <>
                                          <Button
                                            type="button"
                                            variant="outlined"
                                            onClick={() => { handleChoiceUnselect(committedChoice); }}
                                            sx={{
                                              borderRadius: "4px",
                                              textTransform: "none",
                                              fontWeight: 500,
                                              minWidth: 128,
                                            }}
                                          >
                                            Unselect
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="contained"
                                            disabled
                                            sx={{
                                              borderRadius: "20px",
                                              textTransform: "none",
                                              fontWeight: 500,
                                              minWidth: 128,
                                              backgroundColor: "#F47721",
                                              color: "#fff",
                                              "&.Mui-disabled": {
                                                backgroundColor: "#F47721",
                                                color: "#fff",
                                                opacity: 1,
                                              },
                                            }}
                                          >
                                            <Box component="span" sx={{ fontSize: 14, lineHeight: 1, mr: 0.5 }}>✓</Box>
                                            Selected
                                          </Button>
                                        </>
                                      ) : (
                                        <Button
                                          type="button"
                                          variant="contained"
                                          disabled
                                          sx={{
                                            borderRadius: "20px",
                                            textTransform: "none",
                                            fontWeight: 500,
                                            minWidth: 128,
                                            backgroundColor: "#F47721",
                                            color: "#fff",
                                            "&.Mui-disabled": {
                                              backgroundColor: "#F47721",
                                              color: "#fff",
                                              opacity: 1,
                                            },
                                          }}
                                        >
                                          <Box component="span" sx={{ fontSize: 14, lineHeight: 1, mr: 0.5 }}>✓</Box>
                                          Selected
                                        </Button>
                                      )
                                    ) : (
                                      <Button
                                        type="button"
                                        variant="contained"
                                        disabled
                                        sx={{
                                          borderRadius: "20px",
                                          textTransform: "none",
                                          fontWeight: 500,
                                          minWidth: 128,
                                          backgroundColor: "#F47721",
                                          color: "#fff",
                                          "&.Mui-disabled": {
                                            backgroundColor: "#F47721",
                                            color: "#fff",
                                            opacity: 1,
                                          },
                                        }}
                                      >
                                        Selected
                                      </Button>
                                    )
                                  ) : (
                                    <Button
                                      type="button"
                                      variant="contained"
                                      onClick={() => {
                                        if (!activeChoiceForGroup || !hasSelectedDependentsForGroup) return;
                                        const choiceToCommit = pendingChoice || committedChoice || group.choices[0];
                                        if (!choiceToCommit) return;
                                        commitChoiceSelectionForGroup(choiceToCommit, selectedKeysForGroup);
                                      }}
                                      disabled={!canCommitSelectedPlan}
                                      sx={{
                                        borderRadius: "4px",
                                        textTransform: "none",
                                        fontWeight: 500,
                                        minWidth: 128,
                                        backgroundColor: "#0B4F99",
                                        color: "#fff",
                                        "&:hover": { backgroundColor: "#0A437F" },
                                        "&.Mui-disabled": { backgroundColor: "#D1D5DB", color: "#9CA3AF" },
                                      }}
                                    >
                                      Select
                                    </Button>
                                  )}
                              </Box>
                              )}
                            </ChoiceSectionCard>
                          );
                        })}
                      </Box>
                      </Box>
                    </ChooseBenefitsSectionBody>
                  </ChooseBenefitsSectionCard>
                );
              })}
            </ChoicesPanel>
          </ChoiceSelectionContainer>
        </AdditionDetailsFormCardContent>
      </AdditionDetailsFormCardForChoiceSelection>

      <PremiumCalculatorPanel>
        <DashboardEnrollmentSummary
          enrollmentSummaryData={enrollmentSummaryData}
          labels={{
            employeeContribution: "Extra Employee Contribution",
            companyContribution: "Extra Company Contribution",
            collapsedEmployeeContribution: "Extra Employee Contribution",
            totalContribution: "Your Total Extra Contribution",
            totalContributionInclGst:
              `Your Total Extra Contribution (incl.${getTaxLabel(localizationData?.data)})`,
            totalContributionExclGst:
              `Your Total Extra Contribution (excl.${getTaxLabel(localizationData?.data)})`,
          }}
        />
      </PremiumCalculatorPanel>

      <AdditionDetailsFooterActions>
        <AdditionDetailsSecondaryButton
          type="button"
          variant="outlined"
          onClick={onBack}
        >
          Back to Components
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
            onClick={() => {
              if (selectedDependentKeys.length === 0) {
                return;
              }

              if (selectedChoiceIds.length === 0) {
                return;
              }

              onContinue();
            }}
            disabled={!canContinue}
          >
            Continue
          </AdditionDetailsPrimaryButton>
        </AdditionDetailsFooterRightGroup>
      </AdditionDetailsFooterActions>
    </AdditionDetailsPageContainerForChoiceSelection>
  );
};

export default LifeEventsChoiceSelection;
