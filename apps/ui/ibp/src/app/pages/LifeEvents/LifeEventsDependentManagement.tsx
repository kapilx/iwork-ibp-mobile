import { capitalizeFirst } from '../../utils';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import DynamicForm from '@ui/ui-lib/commonComponents/FormComponent';
import { apiRequest, endPoints } from '@ui/ui-lib';
import dayjs from 'dayjs';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CloseIcon from '@mui/icons-material/Close';
import DescriptionIcon from '@mui/icons-material/Description';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import { Box, CircularProgress, Divider, IconButton, Typography } from '@mui/material';
import { useDispatch } from 'react-redux';
import {
  AdditionDetailsDocumentCard,
  AdditionDetailsDependentDeleteButton,
  AdditionDetailsDependentEditButton,
  AdditionDetailsDependentSaveButton,
  AdditionDetailsDependentField,
  AdditionDetailsDependentFieldLabel,
  AdditionDetailsDependentFieldValue,
  AdditionDetailsDependentFieldValueDisabled,
  AdditionDetailsDependentRow,
  AdditionDetailsDependentRows,
  AdditionDetailsDependentRowActions,
  AdditionDetailsDocumentsGrid,
  AdditionDetailsFooterActions,
  AdditionDetailsFormCard,
  AdditionDetailsFormCardContent,
  AdditionDetailsFormTitle,
  AdditionDetailsPageContainer,
  AdditionDetailsPrimaryButton,
  AdditionDetailsSectionHeader,
  AdditionDetailsSectionIcon,
  AdditionDetailsSectionSubtitle,
  AdditionDetailsSectionTitle,
  AdditionDetailsSecondaryButton,
  AdditionDetailsDocumentTitle,
  AdditionDetailsUploadDropzone,
  AdditionDetailsUploadSubtitle,
  AdditionDetailsUploadTitle,
  AdditionDetailsUploadedDocContainer,
  AdditionDetailsUploadedDocContent,
  AdditionDetailsUploadedDocIcon,
  AdditionDetailsUploadedDocInfo,
  AdditionDetailsUploadedDocName,
  AdditionDetailsUploadedDocSize,
  AdditionDetailsUploadedDocRemoveButton,
  AdditionDetailsUploadLoader,
} from './styles';

import {
  getAgeConstraintsForRelationship as getAgeConstraintsForRelationshipUtil,
  canSelectRelationship as canSelectRelationshipUtil,
  getRelationTypeForRelationship as getRelationTypeForRelationshipUtil,
} from '../../components/Enrollment/EnrollmentFlow/utils/relationshipFilters';
import { LIFE_EVENTS, LIFE_EVENTS_DEPENDENT_MANAGEMENT_COPY } from './constants';
import { setToastMessage } from '../../redux/slice';
import {
  calculateAgeFromDate,
  parseDateString,
  validateDateOfBirth,
} from '../../components/Enrollment/EnrollmentFlow/utils/dateValidations';
import dependentInfoIcon from '../../../assets/svgs/dependent-info-icon.svg';
import dependentdocIcon from '../../../assets/svgs/dependent-doc-icon.svg';

// ─── Local helpers ────────────────────────────────────────────────────────────

const generateTempKey = (): string =>
  `temp_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

const toNumber = (value: number | string | undefined): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return 0;
};

// ── Multiple-birth (twin / triplet) child constraints (mirrors FamilyMembersManagement) ──
//   • allowFirstChildAsTwin    → eldest child may have 1 twin sibling   (eldest DOB group up to 2)
//   • twinsSecondChildAllowed   → youngest child may have 1 twin sibling  (youngest DOB group up to 2)
//   • tripletsSecondChildAllowed → youngest child may have 2 triplet siblings (youngest DOB group up to 3)
interface ChildMultipleBirthConfig {
  allowFirstChildAsTwin: boolean;
  twinsSecondChildAllowed: boolean;
  tripletsSecondChildAllowed: boolean;
}

const getChildMultipleBirthConfig = (
  constraints?:
    | {
        allowFirstChildAsTwin?: boolean;
        twinsSecondChildAllowed?: boolean;
        tripletsSecondChildAllowed?: boolean;
      }
    | null,
): ChildMultipleBirthConfig => ({
  allowFirstChildAsTwin: constraints?.allowFirstChildAsTwin === true,
  twinsSecondChildAllowed: constraints?.twinsSecondChildAllowed === true,
  tripletsSecondChildAllowed: constraints?.tripletsSecondChildAllowed === true,
});

const getYoungestGroupCap = (cfg: ChildMultipleBirthConfig): number =>
  cfg.tripletsSecondChildAllowed ? 3 : cfg.twinsSecondChildAllowed ? 2 : 1;
const getEldestGroupCap = (cfg: ChildMultipleBirthConfig): number =>
  cfg.allowFirstChildAsTwin ? 2 : 1;
const getChildExtraSlots = (cfg: ChildMultipleBirthConfig): number =>
  getEldestGroupCap(cfg) - 1 + (getYoungestGroupCap(cfg) - 1);
const isAnyMultipleBirthAllowed = (cfg: ChildMultipleBirthConfig): boolean =>
  cfg.allowFirstChildAsTwin || cfg.twinsSecondChildAllowed || cfg.tripletsSecondChildAllowed;

// Builds a map of birth-event key → multiple-birth tag. Plain "Twin"/"Triplet" for a
// lone group of a type; numbered ("Twin 1", "Twin 2") when 2+ groups of that type exist.
const buildMultipleBirthLabels = (
  items: { key: string; order: number }[],
): Map<string, string> => {
  const counts = new Map<string, number>();
  const orderByKey = new Map<string, number>();
  items.forEach(({ key, order }) => {
    if (!key) return;
    counts.set(key, (counts.get(key) || 0) + 1);
    const existing = orderByKey.get(key);
    orderByKey.set(key, existing === undefined ? order : Math.min(existing, order));
  });
  const groupsByType = new Map<string, { key: string; order: number }[]>();
  counts.forEach((count, key) => {
    let type: string | null = null;
    if (count >= 3) type = 'Triplet';
    else if (count === 2) type = 'Twin';
    if (!type) return;
    const bucket = groupsByType.get(type) || [];
    bucket.push({ key, order: orderByKey.get(key) ?? 0 });
    groupsByType.set(type, bucket);
  });
  const result = new Map<string, string>();
  groupsByType.forEach((groups, type) => {
    const sorted = [...groups].sort((a, b) => a.order - b.order);
    const needsNumber = sorted.length > 1;
    sorted.forEach((group, index) => {
      result.set(group.key, needsNumber ? `${type} ${index + 1}` : type);
    });
  });
  return result;
};

// Validates a complete set of child DOB timestamps against base maxCount + the flags.
const isChildDobSetValid = (
  dobTimes: number[],
  maxCount: number,
  cfg: ChildMultipleBirthConfig,
): boolean => {
  if (!Number.isFinite(maxCount)) return true;
  const times = dobTimes.filter((t) => Number.isFinite(t));
  if (times.length <= maxCount) return true;

  const counts = new Map<number, number>();
  times.forEach((t) => counts.set(t, (counts.get(t) || 0) + 1));
  if (counts.size > maxCount) return false;

  const distinct = Array.from(counts.keys()).sort((a, b) => a - b);
  const eldestDob = distinct[0];
  const youngestDob = distinct[distinct.length - 1];
  const eldestCap = getEldestGroupCap(cfg);
  const youngestCap = getYoungestGroupCap(cfg);

  for (const [dob, count] of counts) {
    let cap = 1;
    if (dob === youngestDob) cap = Math.max(cap, youngestCap);
    if (dob === eldestDob) cap = Math.max(cap, eldestCap);
    if (count > cap) return false;
  }
  return true;
};

const normalizeDependentRelationship = (dependent: DependentData): DependentData => ({
  ...dependent,
  tempKey: dependent.tempKey || dependent.id?.toString() || generateTempKey(),
  relationship:
    dependent.relationship || dependent.relation || dependent.relationshipType || '',
});

const areDependentsEqual = (
  left: DependentData[] = [],
  right: DependentData[] = [],
): boolean => JSON.stringify(left) === JSON.stringify(right);

const formatDate = (dateString: string) => {
  if (!dateString) return '--';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const normalizeRelationshipName = (relationshipName?: string) =>
  String(relationshipName || '').toLowerCase().trim();

const getPreferredSpouseRelationship = (normalizedEmployeeGender?: string) => {
  if (normalizedEmployeeGender === 'male') return 'wife';
  if (normalizedEmployeeGender === 'female') return 'husband';
  return 'spouse';
};

const getRelationshipAliases = (relationshipName: string, normalizedEmployeeGender?: string): string[] => {
  const normalized = normalizeRelationshipName(relationshipName);
  if (!normalized) return [];

  if (
    normalized === 'partner' ||
    normalized === 'spouse' ||
    normalized === 'spouse/partner' ||
    normalized === 'wife' ||
    normalized === 'husband'
  ) {
    return Array.from(
      new Set([
        'partner',
        'spouse',
        'spouse/partner',
        'wife',
        'husband',
        getPreferredSpouseRelationship(normalizedEmployeeGender),
      ]),
    );
  }

  if (
    normalized === 'parent' ||
    normalized === 'parents' ||
    normalized === 'father' ||
    normalized === 'mother'
  ) {
    return ['parent', 'parents', 'father', 'mother'];
  }

  if (
    normalized === 'child' ||
    normalized === 'children' ||
    normalized === 'son' ||
    normalized === 'daughter'
  ) {
    return ['child', 'children', 'son', 'daughter'];
  }

  return [normalized];
};

const expandRelationshipSelections = (
  relationshipName: string,
  normalizedEmployeeGender?: string,
): string[] => {
  const normalized = normalizeRelationshipName(relationshipName);

  if (
    normalized === 'partner' ||
    normalized === 'spouse' ||
    normalized === 'spouse/partner'
  ) {
    return [getPreferredSpouseRelationship(normalizedEmployeeGender)];
  }

  if (normalized === 'parent' || normalized === 'parents') {
    return ['father', 'mother'];
  }

  if (normalized === 'child' || normalized === 'children') {
    return ['son', 'daughter'];
  }

  return normalized ? [normalized] : [];
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface PolicyChoice {
  policyComponentActionTypeId: number;
  policyComponentActionType: string;
  parentpolicyComponentActionTypeId?: number | null;
  policyComponentActionLabel: string;
}

interface DependentData {
  id?: string;
  tempKey?: string;
  name: string;
  relationship?: string;
  relation?: string;
  relationshipType?: string;
  gender: string;
  dateOfBirth: string;
  isNewlyAdded?: boolean;
  choices?: PolicyChoice[];
  eligibleComponents?: {
    basePolicy: boolean;
    basePolicyAddons: number[];
    parentalPolicy: boolean;
    parentalPolicyAddons: number[];
  };
  documentIds?: number[];
}

interface UploadedDocument {
  id: number | string;
  fileName?: string;
  fileSize?: number;
  documentType?: string;
}

type DependentFormData = {
  name: string;
  relationship: string;
  gender: string;
  dateOfBirth: string;
};

interface StoredEmployeeDetails {
  employeeName?: string;
  fullName?: string;
  dateOfBirth?: string;
  gender?: string | { key?: string; value?: string; label?: string };
}

interface LifeEventsDependentManagementProps {
  selectedLifeEvent: string;
  gmcRelationships: any;
  existingDependents?: DependentData[];
  draftDependents?: DependentData[];
  onDependentsChange: (dependents: DependentData[]) => void;
  uploadedDocuments: UploadedDocument[];
  onUploadedDocumentsChange: (documents: UploadedDocument[]) => void;
  genderOptions?: Array<{ value: string; label: string }>;
  employeeGender?: string;
  onBack?: () => void;
  onExit?: () => void;
  onContinue?: () => void;
  gmcPolicyData: any;
}

// ─── Component ────────────────────────────────────────────────────────────────

const LifeEventsDependentManagement: React.FC<LifeEventsDependentManagementProps> = ({
  selectedLifeEvent,
  gmcRelationships,
  existingDependents,
  draftDependents,
  onDependentsChange,
  uploadedDocuments,
  onUploadedDocumentsChange,
  employeeGender = 'male',
  genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
  ],
  onBack,
  onExit,
  onContinue,
  gmcPolicyData
}) => {
  const normalizeGender = (raw: string): string => {
    const g = (typeof raw === 'string' ? raw : '').toLowerCase().trim();
    if (g === 'gender_type_male' || g === 'm' || g === 'male') return 'male';
    if (g === 'gender_type_female' || g === 'f' || g === 'female') return 'female';
    return 'male';
  };
  const normalizedEmployeeGender = normalizeGender(employeeGender);

  const dispatch = useDispatch();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingDocumentTypes, setUploadingDocumentTypes] = useState<Set<string>>(new Set());
  const normalizedExistingDependents = useMemo(
    () => (existingDependents || []).map(normalizeDependentRelationship),
    [existingDependents],
  );

  const normalizedDraftDependents = useMemo(
    () => (draftDependents || []).map(normalizeDependentRelationship),
    [draftDependents],
  );

  // ── State ──────────────────────────────────────────────────────────────────
  const [editingDependent, setEditingDependent] = useState<DependentData | null>(null);
  const [dependents, setDependents] = useState<DependentData[]>(normalizedDraftDependents);
  const [dobVisibility, setDobVisibility] = useState<Record<string, boolean>>({});
  const [hasAttemptedContinue, setHasAttemptedContinue] = useState<boolean>(false);
  const [selectedRelationship, setSelectedRelationship] = useState<string>('');
  const [selectedGender, setSelectedGender] = useState<string>('');
  const [employeeDetails, setEmployeeDetails] = useState<StoredEmployeeDetails | null>(null);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(normalizedDraftDependents.length === 0);
  const canAddMultipleDependents = useMemo(
    () => ['child_birth', 'adoption'].includes(selectedLifeEvent),
    [selectedLifeEvent],
  );

  const formRef = useRef<any>(null);
  const watchSubscriptionRef = useRef<any>(null);
  const lastEmittedDependentsRef = useRef<DependentData[]>(normalizedDraftDependents);

  // ── Load employee details from sessionStorage (same pattern as FamilyMembersManagement) ──
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const storedUser = window.sessionStorage.getItem('user');
      if (!storedUser) return;
      setEmployeeDetails(JSON.parse(storedUser) as StoredEmployeeDetails);
    } catch {
      setEmployeeDetails(null);
    }
  }, []);

  // ── Employee DOB / age (at component level, NOT inside getDependentFormConfig) ──
  const employeeDateOfBirth = useMemo(
    () => parseDateString(employeeDetails?.dateOfBirth),
    [employeeDetails?.dateOfBirth],
  );

  const employeeAge = useMemo(
    () => (employeeDateOfBirth ? calculateAgeFromDate(employeeDateOfBirth) : null),
    [employeeDateOfBirth],
  );

  // ── Constraint helpers (mirrors FamilyMembersManagement) ──────────────────
  const parentAgeGapRequirement = useMemo(
    () => toNumber(gmcPolicyData?.configuration?.constraints?.ageGapBetweenParentAndEmployee),
    [gmcPolicyData],
  );

  const childAgeGapRequirement = useMemo(
    () => toNumber(gmcPolicyData?.configuration?.constraints?.ageGapBetweenChildrenAndEmployee),
    [gmcPolicyData],
  );

  const childMultipleBirthConfig = useMemo(
    () => getChildMultipleBirthConfig(gmcPolicyData?.configuration?.constraints),
    [gmcPolicyData],
  );
  const allowFirstChildAsTwin = childMultipleBirthConfig.allowFirstChildAsTwin;
  const twinsSecondChildAllowed = childMultipleBirthConfig.twinsSecondChildAllowed;
  const tripletsSecondChildAllowed = childMultipleBirthConfig.tripletsSecondChildAllowed;
  const anyMultipleBirthAllowed = isAnyMultipleBirthAllowed(childMultipleBirthConfig);
  const childExtraSlots = getChildExtraSlots(childMultipleBirthConfig);

  const getFormValuesFromDependent = useCallback(
    (dependent?: DependentData | null): DependentFormData => ({
      name: dependent?.name || '',
      relationship:
        expandRelationshipSelections(
          dependent?.relationship || dependent?.relation || '',
          normalizedEmployeeGender,
        )[0] ||
        dependent?.relationship ||
        dependent?.relation ||
        '',
      gender: dependent?.gender || '',
      dateOfBirth: dependent?.dateOfBirth || '',
    }),
    [normalizedEmployeeGender],
  );

  // ── Form default values ───────────────────────────────────────────────────
  const getFormDefaultValues = useMemo(() => {
    if (editingDependent) return getFormValuesFromDependent(editingDependent);
    if (canAddMultipleDependents) return getFormValuesFromDependent(null);
    if (dependents.length > 0) return getFormValuesFromDependent(dependents[0]);
    return getFormValuesFromDependent(null);
  }, [canAddMultipleDependents, dependents, editingDependent, getFormValuesFromDependent]);

  // ── Relationship helpers ──────────────────────────────────────────────────

  /** Mirror of FamilyMembersManagement — uses util directly */
  const getRelationTypeForRelationship = useCallback(
    (relationshipName: string) => {
      const relationType = getRelationTypeForRelationshipUtil(
        gmcRelationships?.configuration?.relationships,
        relationshipName,
      );
      if (relationType) return relationType;

      const enabledPolicyRelations =
        gmcRelationships?.configuration?.relationships?.enabledPolicyRelations || [];
      const requestedAliases = getRelationshipAliases(relationshipName, normalizedEmployeeGender);

      const matchedRelation = enabledPolicyRelations.find((relation: any) => {
        const relationAliases = getRelationshipAliases(relation?.type || '', normalizedEmployeeGender);
        if (relationAliases.some((alias) => requestedAliases.includes(alias))) {
          return true;
        }

        const configuredOptions = Array.isArray(relation?.configuredOptions)
          ? relation.configuredOptions
          : [];

        return configuredOptions.some((option: any) =>
          getRelationshipAliases(option?.name || '', normalizedEmployeeGender).some((alias) =>
            requestedAliases.includes(alias),
          ),
        );
      });

      return matchedRelation?.type || null;
    },
    [normalizedEmployeeGender, gmcRelationships],
  );

  /** Mirror of FamilyMembersManagement — uses util directly */
  const getAgeConstraintsForRelationship = useCallback(
    (relationshipName: string) => {
      const constraints = getAgeConstraintsForRelationshipUtil(
      gmcRelationships?.configuration?.relationships,
      relationshipName,
      toNumber(
        gmcPolicyData?.configuration?.constraints?.studyingSonAgeExtension
      ),
      toNumber(
        gmcPolicyData?.configuration?.constraints?.unmarriedDaughterAgeExtension
      )
      );
      return constraints;
    },
    [gmcRelationships, gmcPolicyData]
  );

  const getGenderByRelationship = useCallback(
    (relationship: string): string => {
      const normalizedRelationship = relationship.toLowerCase().trim();

      if (
        normalizedRelationship === 'spouse' ||
        normalizedRelationship === 'spouse/partner' ||
        normalizedRelationship === 'partner'
      ) {
        if (normalizedEmployeeGender === 'male') return 'female';
        if (normalizedEmployeeGender === 'female') return 'male';
        return '';
      }

      const genderMap: Record<string, string> = {
        father: 'male',
        mother: 'female',
        son: 'male',
        daughter: 'female',
        husband: 'male',
        wife: 'female',
        brother: 'male',
        sister: 'female',
        grandfather: 'male',
        grandmother: 'female',
        grandson: 'male',
        granddaughter: 'female',
        'father-in-law': 'male',
        'mother-in-law': 'female',
        'son-in-law': 'male',
        'daughter-in-law': 'female',
        'brother-in-law': 'male',
        'sister-in-law': 'female',
        spouse: normalizedEmployeeGender === 'male' ? 'female' : 'male',
        'same-sex_partner': normalizedEmployeeGender === 'male' ? 'male' : 'female',
        'same-sex_spouse': normalizedEmployeeGender === 'male' ? 'male' : 'female',
      };

      return genderMap[normalizedRelationship] || '';
    },
    [normalizedEmployeeGender],
  );

  const resolveRelationshipConfig = useCallback(
    (relationshipName: string) => {
      const normalizedRelationshipName = relationshipName?.toLowerCase().trim();
      const requestedAliases = getRelationshipAliases(relationshipName, normalizedEmployeeGender);
      const enabledPolicyRelations =
        gmcRelationships?.configuration?.relationships?.enabledPolicyRelations || [];

      for (const relation of enabledPolicyRelations) {
        if (!relation?.enabled) continue;

        if (relation.type?.toLowerCase().trim() === normalizedRelationshipName) {
          return {
            relationType: relation.type,
            canonicalName: relation.type,
            relation,
            configOption: null,
          };
        }

        if (
          getRelationshipAliases(relation.type, normalizedEmployeeGender).some((alias) =>
            requestedAliases.includes(alias),
          )
        ) {
          return {
            relationType: relation.type,
            canonicalName: normalizedRelationshipName || relation.type,
            relation,
            configOption: null,
          };
        }

        const matchingOption = relation.configuredOptions?.find((option: any) => {
          if (!option?.name || option.enabled === false) return false;
          return (
            option.name.toLowerCase().trim() === normalizedRelationshipName ||
            getRelationshipAliases(option.name, normalizedEmployeeGender).some((alias) =>
              requestedAliases.includes(alias),
            )
          );
        });

        if (matchingOption) {
          return {
            relationType: relation.type,
            canonicalName: normalizedRelationshipName || matchingOption.name,
            relation,
            configOption: matchingOption,
          };
        }
      }

      return null;
    },
    [normalizedEmployeeGender, gmcRelationships],
  );

  const getRelationshipDisplayName = useCallback(
    (relationName: string): string => {
      const normalizedName = relationName.toLowerCase();
      if (
        normalizedName === 'spouse' ||
        normalizedName === 'partner' ||
        normalizedName === 'spouse/partner'
      ) {
        return normalizedEmployeeGender === 'male' ? 'Wife' : 'Husband';
      }
      return relationName.charAt(0).toUpperCase() + relationName.slice(1);
    },
    [normalizedEmployeeGender],
  );

  // ── Extract all eligible relations from policyTemplate ───────────────────
  const getAllEligibleRelationsFromPolicyTemplate = useCallback(() => {
    const rawPolicyTemplate = gmcRelationships?.configuration?.policyTemplate;
    const policyTemplate =
      rawPolicyTemplate?.policyTemplate || rawPolicyTemplate || null;

    if (!policyTemplate || typeof policyTemplate !== 'object') {
      return [];
    }

    const allRelations = new Set<string>();

    Object.values(policyTemplate).forEach((policy: any) => {
      policy?.eligibleRelations?.forEach((relation: string) => allRelations.add(relation));
      policy?.addonIds?.forEach((addon: any) => {
        addon?.eligibleRelations?.forEach((relation: string) => allRelations.add(relation));
      });
    });

    return Array.from(allRelations);
  }, [gmcRelationships]);

  // ── canSelectRelationship callback ───────────────────────────────────────
  const createCanSelectRelationshipCallback = useCallback(
    (relationshipName: string) => {
      if (!gmcRelationships?.configuration?.constraints) return { allowed: true };

      return canSelectRelationshipUtil({
        relationshipName,
        policyData: gmcRelationships.configuration.relationships,
        dependents: [...normalizedExistingDependents, ...dependents].map((dep) => ({
          ...dep,
          relationship: dep.relationship || dep.relation || '',
          relationshipType: dep.relationship || dep.relation || '',
        })),
        constraints: gmcRelationships.configuration.constraints,
        normalizedEmployeeGender,
      });
    },
    [gmcRelationships, normalizedExistingDependents, dependents, normalizedEmployeeGender],
  );

  // ── Available relationship options (same logic as before, fixed dep.relation → dep.relationship) ──
  const getAvailableRelationshipOptions = useCallback(() => {
    if (!gmcRelationships?.configuration?.relationships) return [];

    const allEligibleRelations = getAllEligibleRelationsFromPolicyTemplate();
    const uniqueRelations = Array.from(new Set(allEligibleRelations));
    const filteredDraftDependents = dependents.filter((dep) =>
      editingDependent ? dep.tempKey !== editingDependent.tempKey : true,
    );
    const availabilityDependents = [
      ...normalizedExistingDependents,
      ...filteredDraftDependents,
    ];

    const existingRelationshipNames = new Set(
      availabilityDependents
        .map((dep) => {
          const relationName = dep.relationship || dep.relation;
          return typeof relationName === 'string' ? relationName.toLowerCase().trim() : '';
        })
        .filter(Boolean),
    );

    const singleSelectParentRelationships = new Set([
      'father',
      'mother',
      'father-in-law',
      'mother-in-law',
    ]);

    const availableOptionsMap = new Map<string, { name: string; displayName: string; enabled: boolean }>();

    // Define spouse-related relationships that should be filtered based on employee gender
    const spouseRelationships = new Set(['spouse', 'wife', 'husband', 'partner']);

    uniqueRelations.forEach((relationName) => {
      expandRelationshipSelections(relationName, normalizedEmployeeGender).forEach((expandedRelationName) => {
        const resolvedRelationship = resolveRelationshipConfig(expandedRelationName);

        if (!resolvedRelationship) return;

        const { relationType, canonicalName, relation } = resolvedRelationship;
        const normalizedCanonicalName = canonicalName.toLowerCase().trim();

        if (normalizedCanonicalName === 'self') return;

        // Filter spouse-related relationships based on employee gender
        if (spouseRelationships.has(normalizedCanonicalName)) {
          if (normalizedEmployeeGender === 'male' && normalizedCanonicalName !== 'wife') {
            return;
          }
          if (normalizedEmployeeGender === 'female' && normalizedCanonicalName !== 'husband') {
            return;
          }
          if (normalizedEmployeeGender !== 'male' && normalizedEmployeeGender !== 'female') {
            return;
          }
        }

        const usedCountWithExisting = availabilityDependents.filter((dep) => {
          const depRelationType = getRelationTypeForRelationship(
            dep.relationship || dep.relation || '',
          );
          return depRelationType === relationType;
        }).length;

        const parsedMax = relation.maxCount ? parseInt(relation.maxCount, 10) : NaN;
        const maxCount = Number.isNaN(parsedMax) ? Number.POSITIVE_INFINITY : parsedMax;

        if (usedCountWithExisting >= maxCount) {
          // Children may exceed maxCount via the multiple-birth (twin/triplet) slots;
          // the DOB validator enforces the extra child shares an eligible birth event.
          const childMultipleBirthSlotOpen =
            relationType.toLowerCase() === 'children' &&
            anyMultipleBirthAllowed &&
            usedCountWithExisting < maxCount + childExtraSlots;
          if (!childMultipleBirthSlotOpen) return;
        }

        if (
          singleSelectParentRelationships.has(normalizedCanonicalName) &&
          existingRelationshipNames.has(normalizedCanonicalName)
        ) {
          return;
        }

        if (relationType.toLowerCase() === 'parents') {
          const selectionCheck = createCanSelectRelationshipCallback(canonicalName);
          if (!selectionCheck.allowed) return;
        }

        if (!availableOptionsMap.has(normalizedCanonicalName)) {
          availableOptionsMap.set(normalizedCanonicalName, {
            name: canonicalName,
            displayName: getRelationshipDisplayName(canonicalName),
            enabled: true,
          });
        }
      });
    });

    const availableOptions = Array.from(availableOptionsMap.values());

    return availableOptions;
  }, [
    dependents,
    editingDependent,
    normalizedEmployeeGender,
    createCanSelectRelationshipCallback,
    getAllEligibleRelationsFromPolicyTemplate,
    getRelationshipDisplayName,
    getRelationTypeForRelationship,
    normalizedExistingDependents,
    resolveRelationshipConfig,
    anyMultipleBirthAllowed,
    childExtraSlots,
  ]);

  const availableRelationshipOptions = getAvailableRelationshipOptions();
  const maxChildrenCount = useMemo(() => {
    const enabledPolicyRelations =
      gmcRelationships?.configuration?.relationships?.enabledPolicyRelations || [];
    const childrenRelationByType = enabledPolicyRelations.find(
      (relation: any) =>
        relation?.enabled &&
        typeof relation?.type === 'string' &&
        relation.type.toLowerCase() === 'children',
    );

    const childrenRelationByOptions = enabledPolicyRelations.find((relation: any) => {
      const options = Array.isArray(relation?.configuredOptions)
        ? relation.configuredOptions
        : [];
      return options.some((option: any) =>
        ['son', 'daughter'].includes(String(option?.name || '').toLowerCase()),
      );
    });

    const childrenRelation = childrenRelationByType || childrenRelationByOptions;
    const parsed = Number.parseInt(childrenRelation?.maxCount || '', 10);
    return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
  }, [gmcRelationships]);

  const currentChildrenCount = useMemo(
    () => {
      const mergedDependents = [...normalizedExistingDependents, ...dependents];
      const uniqueDependents = mergedDependents.filter(
        (dep, index, arr) =>
          index ===
          arr.findIndex(
            (candidate) =>
              (dep.tempKey && candidate.tempKey && dep.tempKey === candidate.tempKey) ||
              (dep.id && candidate.id && dep.id === candidate.id) ||
              (
                dep.name?.toLowerCase?.().trim() === candidate.name?.toLowerCase?.().trim() &&
                dep.dateOfBirth === candidate.dateOfBirth &&
                String(dep.relationship || dep.relation || '').toLowerCase().trim() ===
                  String(candidate.relationship || candidate.relation || '').toLowerCase().trim()
              ),
          ),
      );

      return uniqueDependents.filter((dep) => {
        const relationshipName = String(dep.relationship || dep.relation || '').toLowerCase();
        if (relationshipName === 'son' || relationshipName === 'daughter') return true;
        const relationType = getRelationTypeForRelationship(
          dep.relationship || dep.relation || '',
        );
        return relationType?.toLowerCase?.() === 'children';
      }).length;
    },
    [dependents, getRelationTypeForRelationship, normalizedExistingDependents],
  );

  // Children (existing + draft) excluding the dep currently being edited — for twin validation.
  const childrenForTwinCheck = useMemo(() => {
    const allDeps = [...normalizedExistingDependents, ...dependents];
    const base = editingDependent
      ? allDeps.filter((dep) => dep.tempKey !== editingDependent.tempKey)
      : allDeps;
    return base.filter((dep) => {
      const rel = dep.relationship || dep.relation || dep.relationshipType || '';
      return getRelationTypeForRelationship(rel)?.toLowerCase() === 'children';
    });
  }, [normalizedExistingDependents, dependents, editingDependent, getRelationTypeForRelationship]);

  const existingChildDobTimes = useMemo(
    () =>
      childrenForTwinCheck
        .map((d) => parseDateString(d.dateOfBirth)?.getTime())
        .filter((t): t is number => t !== undefined),
    [childrenForTwinCheck],
  );

  const formatDobTime = useCallback((time: number) => {
    const d = new Date(time);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }, []);

  // Birth events an extra (beyond-maxCount) child may join — only groups that
  // still have spare capacity, each labelled by its position so the message is accurate.
  const allowedMultipleBirthDobs = useMemo(() => {
    const entries: { label: string; dob: string }[] = [];
    if (!anyMultipleBirthAllowed || existingChildDobTimes.length === 0) return entries;
    const sorted = [...existingChildDobTimes].sort((a, b) => a - b);
    const eldestTime = sorted[0];
    const youngestTime = sorted[sorted.length - 1];
    const eldestCount = sorted.filter((t) => t === eldestTime).length;
    const youngestCount = sorted.filter((t) => t === youngestTime).length;
    const eldestCap = getEldestGroupCap(childMultipleBirthConfig);
    const youngestCap = getYoungestGroupCap(childMultipleBirthConfig);

    // All existing children share a single birth event — its cap is the larger applicable one.
    if (eldestTime === youngestTime) {
      const cap = Math.max(
        allowFirstChildAsTwin ? eldestCap : 1,
        twinsSecondChildAllowed || tripletsSecondChildAllowed ? youngestCap : 1,
      );
      if (eldestCount < cap) {
        entries.push({ label: 'the existing child', dob: formatDobTime(eldestTime) });
      }
      return entries;
    }

    if (allowFirstChildAsTwin && eldestCount < eldestCap) {
      entries.push({ label: 'the elder child', dob: formatDobTime(eldestTime) });
    }
    if (
      (twinsSecondChildAllowed || tripletsSecondChildAllowed) &&
      youngestCount < youngestCap
    ) {
      entries.push({ label: 'the younger child', dob: formatDobTime(youngestTime) });
    }
    return entries;
  }, [
    anyMultipleBirthAllowed,
    existingChildDobTimes,
    childMultipleBirthConfig,
    allowFirstChildAsTwin,
    twinsSecondChildAllowed,
    tripletsSecondChildAllowed,
    formatDobTime,
  ]);

  const isInMultipleBirthSlot = useMemo(
    () =>
      anyMultipleBirthAllowed &&
      maxChildrenCount !== Number.POSITIVE_INFINITY &&
      childrenForTwinCheck.length >= maxChildrenCount,
    [anyMultipleBirthAllowed, maxChildrenCount, childrenForTwinCheck],
  );

  // True once children have reached the absolute cap (base maxCount + multiple-birth slots).
  const isChildLimitReached = useMemo(
    () =>
      currentChildrenCount >=
      maxChildrenCount + (anyMultipleBirthAllowed ? childExtraSlots : 0),
    [currentChildrenCount, maxChildrenCount, anyMultipleBirthAllowed, childExtraSlots],
  );

  // Maps each child DOB timestamp shared by multiple children to its label —
  // "Twin" when 2 share it, "Triplet" when 3+ do — driving the list tag.
  const multipleBirthLabelByDob = useMemo(() => {
    const allDeps = [...normalizedExistingDependents, ...dependents];
    const items = allDeps
      .filter((dep) => {
        const rel = dep.relationship || dep.relation || dep.relationshipType || '';
        return getRelationTypeForRelationship(rel)?.toLowerCase() === 'children';
      })
      .map((dep) => {
        const t = parseDateString(dep.dateOfBirth)?.getTime();
        return t === undefined ? null : { key: String(t), order: t };
      })
      .filter((item): item is { key: string; order: number } => item !== null);
    return buildMultipleBirthLabels(items);
  }, [dependents, normalizedExistingDependents, getRelationTypeForRelationship]);

  const isAddAnotherDisabled =
    !canAddMultipleDependents || isChildLimitReached;

  useEffect(() => {
    if (
      canAddMultipleDependents &&
      !editingDependent &&
      isChildLimitReached
    ) {
      setIsAddingNew(false);
    }
  }, [canAddMultipleDependents, editingDependent, isChildLimitReached]);


  // Show form logic: show when adding new dependent or editing existing one
  // For single-dependent events (!canAddMultipleDependents), always show the form
  // so navigating back from choose-components still renders the pre-filled form
  const showForm = !canAddMultipleDependents || dependents.length === 0 || isAddingNew || editingDependent !== null;

  // ── Sync props → local state ──────────────────────────────────────────────
  useEffect(() => {
    setDependents((prev) => {
      if (areDependentsEqual(prev, normalizedDraftDependents)) {
        return prev;
      }
      // If we're getting new dependents from props and there are none, show form
      if (normalizedDraftDependents.length === 0) {
        setIsAddingNew(true);
      }
      return normalizedDraftDependents;
    });
  }, [normalizedDraftDependents]);

  // Ref to track previous dependents for meaningful change detection
  const previousDependentsRef = useRef<DependentData[]>([]);

  // Helper to check if dependents have meaningful changes (ignoring documentIds)
  const haveMeaningfulChanges = useCallback((prev: DependentData[], current: DependentData[]) => {
    if (prev.length !== current.length) return true;

    return prev.some((prevDep, index) => {
      const currentDep = current[index];
      if (!currentDep) return true;

      // Compare all fields except documentIds
      return (
        prevDep.tempKey !== currentDep.tempKey ||
        prevDep.name !== currentDep.name ||
        prevDep.relationship !== currentDep.relationship ||
        prevDep.relation !== currentDep.relation ||
        prevDep.relationshipType !== currentDep.relationshipType ||
        prevDep.gender !== currentDep.gender ||
        prevDep.dateOfBirth !== currentDep.dateOfBirth ||
        prevDep.isNewlyAdded !== currentDep.isNewlyAdded
      );
    });
  }, []);

  useEffect(() => {
    // Only reset form if there are meaningful changes to dependents (not just document IDs)
    const hasMeaningfulChanges = haveMeaningfulChanges(previousDependentsRef.current, dependents);

    if (!hasMeaningfulChanges) {
      previousDependentsRef.current = dependents;
      return; // Don't reset form if only document IDs changed
    }

    const defaultDependent = editingDependent
      ? editingDependent
      : canAddMultipleDependents
      ? null
      : normalizedDraftDependents[0] || dependents[0] || null;
    const defaultValues = getFormValuesFromDependent(defaultDependent);
    setSelectedRelationship(defaultValues.relationship || '');
    setSelectedGender(defaultValues.gender || '');
    if (formRef.current?.reset) {
      formRef.current.reset(defaultValues);
    }

    previousDependentsRef.current = dependents;
  }, [
    canAddMultipleDependents,
    editingDependent,
    getFormValuesFromDependent,
    dependents,
    normalizedDraftDependents,
    haveMeaningfulChanges,
  ]);

  const attachDocumentIdsToDependents = useCallback(
    (dependentList: DependentData[]) => {
      const documentIds = uploadedDocuments
        .map((document) => Number(document.id))
        .filter((id) => Number.isFinite(id));

      return dependentList.map((dependent) => ({
        ...dependent,
        documentIds,
      }));
    },
    [uploadedDocuments],
  );

  useEffect(() => {
    const dependentsWithDocumentIds = attachDocumentIdsToDependents(dependents);
    if (areDependentsEqual(lastEmittedDependentsRef.current, dependentsWithDocumentIds)) {
      return;
    }

    lastEmittedDependentsRef.current = dependentsWithDocumentIds;
    onDependentsChange(dependentsWithDocumentIds);
  }, [attachDocumentIdsToDependents, dependents, onDependentsChange]);

  // ── Cleanup watch subscription on unmount ─────────────────────────────────
  useEffect(() => {
    return () => {
      watchSubscriptionRef.current?.();
    };
  }, []);

  // ── Validate existing DOB when relationship changes (same as FamilyMembersManagement) ──
  useEffect(() => {
    if (selectedRelationship && formRef.current) {
      const currentDate = formRef.current.getValues('dateOfBirth');
      if (currentDate) {
        const { minAge, maxAge } = getAgeConstraintsForRelationship(selectedRelationship);
        if (minAge || maxAge) {
          const birthDate = new Date(currentDate);
          const today = new Date();
          const age =
            today.getFullYear() -
            birthDate.getFullYear() -
            (today.getMonth() < birthDate.getMonth() ||
            (today.getMonth() === birthDate.getMonth() &&
              today.getDate() < birthDate.getDate())
              ? 1
              : 0);

          if ((minAge && age < minAge) || (maxAge && age > maxAge)) {
            formRef.current.setValue('dateOfBirth', '');
          }
        }
      }
    }
  }, [selectedRelationship, getAgeConstraintsForRelationship]);

  // ── Auto-populate gender when relationship changes (same as FamilyMembersManagement) ──
  useEffect(() => {
    if (selectedRelationship && formRef.current) {
      requestAnimationFrame(() => {
        if (formRef.current) {
          const autoGender = getGenderByRelationship(selectedRelationship);
          if (autoGender) {
            formRef.current.setValue('gender', autoGender);
            formRef.current.trigger('gender');
          }
        }
      });
    }
  }, [selectedRelationship, getGenderByRelationship]);

  const handleDocumentSelection = useCallback(
    async (nextFiles: FileList | null, documentType: string) => {
      if (!nextFiles) return;

      const files = Array.from(nextFiles);
      if (!files.length) return;

      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      const token = user?.accessToken?.accessToken;
      const companyId = user?.companyId;

      const MAX_FILE_SIZE = 10 * 1024 * 1024;
      const validFiles = files.filter((file) => {
        const fileName = file.name.toLowerCase();
        const isSupported =
          file.type === 'application/pdf' ||
          file.type === 'image/jpeg' ||
          file.type === 'image/png' ||
          fileName.endsWith('.pdf') ||
          fileName.endsWith('.jpg') ||
          fileName.endsWith('.jpeg') ||
          fileName.endsWith('.png');
        return isSupported && file.size <= MAX_FILE_SIZE;
      });

      if (!validFiles.length) {
        dispatch(
          setToastMessage('Please upload PDF, JPG, or PNG files up to 10MB only.'),
        );
        return;
      }

      // Set loading state for this specific document type
      setUploadingDocumentTypes(prev => new Set(prev).add(documentType));

      try {
        const uploadedResponses = await Promise.all(
          validFiles.map(async (file) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('companyType', 'company');
            formData.append('companyId', String(companyId || ''));
            formData.append('documentTypeLid', String(-1));

            const response = await apiRequest(endPoints.ibpFileUpload, {
              method: 'POST',
              data: formData,
              headers: {
                'Content-Type': 'multipart/form-data',
                Accept: 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
            });

            const uploadedFile =
              (response as any)?.data?.data ||
              (response as any)?.data ||
              response;

            return {
              id: uploadedFile?.id,
              fileName: uploadedFile?.fileName || file.name,
              fileSize: file.size,
              documentType,
            } as UploadedDocument;
          }),
        );

        // Remove existing documents for this document type and add new ones
        const filteredDocuments = uploadedDocuments.filter(doc => doc.documentType !== documentType);
        const nextDocuments = [
          ...filteredDocuments,
          ...uploadedResponses.filter((document) => Boolean(document?.id)),
        ];

        onUploadedDocumentsChange(nextDocuments);
        dispatch(setToastMessage('Document uploaded successfully.'));
      } catch (error: any) {
        dispatch(
          setToastMessage(
            error?.response?.data?.message ||
              error?.message ||
              'Document upload failed. Please try again.',
          ),
        );
      } finally {
        setUploadingDocumentTypes(prev => {
          const newSet = new Set(prev);
          newSet.delete(documentType);
          return newSet;
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [
      attachDocumentIdsToDependents,
      dependents,
      dispatch,
      onDependentsChange,
      onUploadedDocumentsChange,
      uploadedDocuments,
    ],
  );

  const handleRemoveDocument = useCallback(
    (documentId: string | number) => {
      const nextDocuments = uploadedDocuments.filter(doc => doc.id !== documentId);
      onUploadedDocumentsChange(nextDocuments);
      dispatch(setToastMessage('Document removed successfully.'));
    },
    [uploadedDocuments, onUploadedDocumentsChange, dispatch],
  );

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes < 1024) return `${bytes}b`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}kb`;
    return `${Math.round(bytes / (1024 * 1024))}mb`;
  }, []);

  // ── Form handlers ─────────────────────────────────────────────────────────
  const handleCancelForm = useCallback(() => {
    const clearedDependents = dependents.map((dependent) => ({
      ...dependent,
      documentIds: [],
    }));

    setEditingDependent(null);
    setIsAddingNew(false); // Hide form when canceling
    setDependents(clearedDependents);
    lastEmittedDependentsRef.current = clearedDependents;
    onDependentsChange(clearedDependents);
    onUploadedDocumentsChange([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    const defaultValues = canAddMultipleDependents
      ? getFormValuesFromDependent(null)
      : getFormValuesFromDependent(clearedDependents[0] || null);
    setSelectedRelationship(defaultValues.relationship || '');
    if (formRef.current?.reset) {
      formRef.current.reset(defaultValues);
    }
  }, [
    canAddMultipleDependents,
    dependents,
    getFormValuesFromDependent,
    onDependentsChange,
    onUploadedDocumentsChange,
  ]);

  const handleDeleteDependent = useCallback(
    (tempKey?: string) => {
      if (!tempKey) return;
      const nextDependents = dependents.filter((dep) => dep.tempKey !== tempKey);
      const nextDependentsWithDocumentIds = attachDocumentIdsToDependents(nextDependents);
      setDependents(nextDependentsWithDocumentIds);
      lastEmittedDependentsRef.current = nextDependentsWithDocumentIds;
      onDependentsChange(nextDependentsWithDocumentIds);

      if (editingDependent?.tempKey === tempKey) {
        setEditingDependent(null);
        if (formRef.current?.reset) {
          formRef.current.reset(getFormValuesFromDependent(null));
        }
      }
    },
    [
      attachDocumentIdsToDependents,
      dependents,
      editingDependent,
      getFormValuesFromDependent,
      onDependentsChange,
    ],
  );

  const handleEditDependent = useCallback(
    (tempKey?: string) => {
      if (!tempKey) return;
      const targetDependent = dependents.find((dep) => dep.tempKey === tempKey);
      if (!targetDependent) return;
      setEditingDependent(targetDependent);
      setIsAddingNew(false);
      const values = getFormValuesFromDependent(targetDependent);
      setSelectedRelationship(values.relationship || '');
      setSelectedGender(values.gender || '');
      if (formRef.current?.reset) {
        formRef.current.reset(values);
      }
    },
    [dependents, getFormValuesFromDependent],
  );

  const missingRequiredDocuments = useMemo(() => {
    const baseDocs =
      (LIFE_EVENTS.find((event) => event.id === selectedLifeEvent)?.requiredDocuments || []);

    if (canAddMultipleDependents) {
      const missing: string[] = [];

      // Check each already-added dependent's specific doc
      dependents.forEach((dep) => {
        baseDocs.forEach((docName) => {
          const docKey = `${docName}::${dep.tempKey}`;
          if (!uploadedDocuments.some((doc) => doc.documentType === docKey)) {
            missing.push(docKey);
          }
        });
      });

      // When the add-form is open for a NEW dependent (not editing), also check the ::pending slot
      if ((isAddingNew || dependents.length === 0) && !editingDependent) {
        baseDocs.forEach((docName) => {
          const pendingKey = `${docName}::pending`;
          if (!uploadedDocuments.some((doc) => doc.documentType === pendingKey)) {
            missing.push(pendingKey);
          }
        });
      }

      return missing;
    }

    return baseDocs.filter(
      (documentName) =>
        !uploadedDocuments.some((document) => document.documentType === documentName),
    );
  }, [selectedLifeEvent, uploadedDocuments, canAddMultipleDependents, dependents, isAddingNew, editingDependent]);

  const handlePersistDependent = useCallback(
    async (shouldNavigate: boolean) => {
      if (shouldNavigate) {
        setHasAttemptedContinue(true);
      }

      if (!formRef.current) {
        console.error('Form ref is not available');
        return;
      }

      const currentValues = formRef.current.getValues();
      const hasAnyValue = Object.values(currentValues || {}).some(
        (value) => typeof value === 'string' ? value.trim().length > 0 : Boolean(value),
      );

      const requiresDocuments =
        (LIFE_EVENTS.find((event) => event.id === selectedLifeEvent)?.requiredDocuments || [])
          .length > 0;

      if (!hasAnyValue && dependents.length > 0) {
        if (shouldNavigate && requiresDocuments && missingRequiredDocuments.length > 0) {
          return;
        }
        if (shouldNavigate && onContinue) {
          setHasAttemptedContinue(false);
          onContinue();
          if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }
        return;
      }

      const isValid = await formRef.current.trigger();
      if (!isValid) {
        console.error('Form validation failed');
        return;
      }

      // Block both "Add" (multi-dep) and "Continue" (single/multi) if required docs are missing
      if (requiresDocuments && missingRequiredDocuments.length > 0) {
        setHasAttemptedContinue(true);
        return;
      }

      const formValues = formRef.current.getValues();
      const isEditing = Boolean(editingDependent);

      if (!isEditing && canAddMultipleDependents && isChildLimitReached) {
        dispatch(setToastMessage('You have already added the maximum number of children.'));
        return;
      }

      const newTempKey = isEditing ? (editingDependent?.tempKey ?? generateTempKey()) : generateTempKey();

      // Reassign any pending-form docs to the actual dependent tempKey
      if (!isEditing && canAddMultipleDependents) {
        const reassigned = uploadedDocuments.map((doc) =>
          doc.documentType?.endsWith('::pending')
            ? { ...doc, documentType: doc.documentType.replace(/::pending/g, `::${newTempKey}`) }
            : doc,
        );
        if (reassigned.some((d, i) => d.documentType !== uploadedDocuments[i].documentType)) {
          onUploadedDocumentsChange(reassigned);
        }
      }

      const nextDependents = isEditing
        ? dependents.map((dep) =>
            dep.tempKey === editingDependent?.tempKey
              ? { ...dep, ...formValues }
              : dep,
          )
        : [...dependents, { tempKey: newTempKey, ...formValues, isNewlyAdded: true }];

      const nextDependentsWithDocumentIds = attachDocumentIdsToDependents(nextDependents);
      setDependents(nextDependentsWithDocumentIds);
      lastEmittedDependentsRef.current = nextDependentsWithDocumentIds;
      onDependentsChange(nextDependentsWithDocumentIds);
      setEditingDependent(null);

      // Only hide the form for multi-dependent add flows when we stay on the same step.
      // For single-dependent flows like spouse, keeping the form visible avoids the
      // intermediate flash before step navigation completes.
      if (!isEditing && canAddMultipleDependents && !shouldNavigate) {
        setIsAddingNew(false);
      }

      if (canAddMultipleDependents && !shouldNavigate) {
        setSelectedRelationship('');
        if (formRef.current?.reset) {
          formRef.current.reset(getFormValuesFromDependent(null));
        }
        return;
      }

      if (formRef.current?.reset) {
        formRef.current.reset(
          getFormValuesFromDependent(nextDependentsWithDocumentIds[0] || null),
        );
      }

      if (shouldNavigate && onContinue) {
        setHasAttemptedContinue(false);
        setTimeout(() => {
          onContinue();
        }, 0);
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    },
    [
      attachDocumentIdsToDependents,
      canAddMultipleDependents,
      dependents,
      dispatch,
      editingDependent,
      getFormValuesFromDependent,
      onContinue,
      onDependentsChange,
      selectedLifeEvent,
      uploadedDocuments.length,
      missingRequiredDocuments.length,
      isChildLimitReached,
    ],
  );

  const handleAddDependentClick = useCallback(async () => {
    await handlePersistDependent(true);
  }, [handlePersistDependent]);

  const handleSaveEditedDependent = useCallback(async () => {
    await handlePersistDependent(false);
    if (canAddMultipleDependents) {
      setIsAddingNew(false);
    }
  }, [canAddMultipleDependents, handlePersistDependent]);

  // ── Form config ───────────────────────────────────────────────────────────
  /**
   * getDependentFormConfig is a regular function (not useCallback) because it
   * reads `availableRelationshipOptions` which already has its own memoisation.
   * All hooks (useMemo, useState, etc.) are called at component level above —
   * never inside this function — which fixes the Rules-of-Hooks violations.
   */
  const getDependentFormConfig = () => {
    const allowedRelationshipsRaw =
      LIFE_EVENTS.find((e) => e.id === selectedLifeEvent)?.requiredRelationships || [];

    const allowedRelationships = (allowedRelationshipsRaw as string[])
      .filter((r) => typeof r === 'string')
      .flatMap((r) => expandRelationshipSelections(r, normalizedEmployeeGender))
      .map((r) => r.toLowerCase());

    const relationshipOptionsData = availableRelationshipOptions.filter((rel) => {
      if (!rel || typeof rel.name !== 'string') return false;
      return allowedRelationships.includes(rel.name.toLowerCase());
    });

    let relationshipOptions = relationshipOptionsData.map((rel) => ({
      value: rel.name,
      label: rel.displayName || rel.name,
    }));

    // Child flow: keep both Son and Daughter selectable until children max count is reached.
    if (canAddMultipleDependents) {
      relationshipOptions = Array.from(new Set(allowedRelationships)).map((relationName) => ({
        value: relationName,
        label: getRelationshipDisplayName(relationName),
      }));
    }

    const selectedDependentRelationships = expandRelationshipSelections(
      dependents[0]?.relationship ||
        dependents[0]?.relation ||
        normalizedDraftDependents[0]?.relationship ||
        normalizedDraftDependents[0]?.relation ||
        '',
      normalizedEmployeeGender,
    );

    const spouseRelNames = new Set(['spouse', 'wife', 'husband', 'partner', 'spouse/partner']);

    selectedDependentRelationships
      .slice()
      .reverse()
      .forEach((selectedDependentRelationship) => {
        const normalizedSDR = selectedDependentRelationship.toLowerCase().trim();

        // Never re-add a spouse option that is incompatible with the employee's gender
        if (spouseRelNames.has(normalizedSDR)) {
          if (normalizedEmployeeGender === 'male' && normalizedSDR !== 'wife') return;
          if (normalizedEmployeeGender === 'female' && normalizedSDR !== 'husband') return;
        }

        if (
          selectedDependentRelationship &&
          !relationshipOptions.some(
            (option) =>
              option.value.toLowerCase() === normalizedSDR,
          )
        ) {
          relationshipOptions.unshift({
            value: selectedDependentRelationship,
            label: getRelationshipDisplayName(selectedDependentRelationship),
          });
        }
      });

    // Filter relationship options based on the dependent's selected gender.
    // Skipped once the relationship itself implies the gender: that gender is
    // derived from the relationship, so filtering by it would hide every
    // opposite-gender relationship (Son -> male -> Daughter disappears) while
    // the gender field is locked, leaving no way back.
    if (selectedGender && !getGenderByRelationship(selectedRelationship)) {
      relationshipOptions = relationshipOptions.filter((option) => {
        const impliedGender = getGenderByRelationship(option.value.toLowerCase().trim());
        if (!impliedGender) return true; // gender-neutral relationships (e.g. child/parent generic) always shown
        return impliedGender === selectedGender;
      });
    }

    return [
      {
        key: 'name',
        name: 'name',
        label: LIFE_EVENTS_DEPENDENT_MANAGEMENT_COPY.nameLabel,
        type: 'text' as const,
        placeholder: LIFE_EVENTS_DEPENDENT_MANAGEMENT_COPY.namePlaceholder,
        rules: {
          required: LIFE_EVENTS_DEPENDENT_MANAGEMENT_COPY.nameRequired,
          maxLength: {
            value: 100,
            message: LIFE_EVENTS_DEPENDENT_MANAGEMENT_COPY.nameMaxLength,
          },
          validate: (value: string) => {
            if (!value) return true;
            if (!/^(?=.{2,100}$)(?!.*\s{2,})[\p{L}][\p{L}\p{M}'\- ]*[\p{L}\p{M}]$/u.test(value)) {
              return "Please enter a valid name using alphabets, spaces, hyphens (-), or apostrophes (')";
            }
            return true;
          },
        },
        gridColumn: 6,
        componentProps: {
          fullWidth: true,
          inputProps: {
            onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
              const allowedKeys = [
                'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight',
                'Tab', 'Home', 'End', 'Enter',
              ];
              if (!allowedKeys.includes(e.key) && !/^[\p{L}\p{M}'\- ]$/u.test(e.key)) {
                e.preventDefault();
              }
            },
          },
        },
      },
      {
        key: 'relationship',
        name: 'relationship',
        label: LIFE_EVENTS_DEPENDENT_MANAGEMENT_COPY.relationshipLabel,
        type: 'select' as const,
        placeholder: LIFE_EVENTS_DEPENDENT_MANAGEMENT_COPY.relationshipPlaceholder,
        options: relationshipOptions,
        rules: { required: LIFE_EVENTS_DEPENDENT_MANAGEMENT_COPY.relationshipRequired },
        gridColumn: 6,
        componentProps: { fullWidth: true },
      },
      {
        key: 'gender',
        name: 'gender',
        label: LIFE_EVENTS_DEPENDENT_MANAGEMENT_COPY.genderLabel,
        type: 'select' as const,
        placeholder: LIFE_EVENTS_DEPENDENT_MANAGEMENT_COPY.genderPlaceholder,
        options: genderOptions,
        rules: { required: LIFE_EVENTS_DEPENDENT_MANAGEMENT_COPY.genderRequired },
        gridColumn: 6,
        // Relations that imply a gender (son, father, mother-in-law...) prefill
        // it and lock the field; ambiguous ones stay user-editable.
        componentProps: {
          fullWidth: true,
          disabled: Boolean(getGenderByRelationship(selectedRelationship)),
        },
      },
      {
        key: 'dateOfBirth',
        name: 'dateOfBirth',
        label: LIFE_EVENTS_DEPENDENT_MANAGEMENT_COPY.dobLabel,
        type: 'date' as const,
        placeholder: LIFE_EVENTS_DEPENDENT_MANAGEMENT_COPY.dobPlaceholder,
        rules: {
          required: LIFE_EVENTS_DEPENDENT_MANAGEMENT_COPY.dobRequired,
        validate: {
            ageRange: (
              value: string,
              formValues: any,
            ) => {
              return validateDateOfBirth({
                value,
                relationship: (formValues?.relationship as string) || selectedRelationship,
                getAgeConstraintsForRelationship,
                getRelationTypeForRelationship,
                parentAgeGapRequirement,
                childAgeGapRequirement,
                employeeDateOfBirth,
                employeeAge,
              });
            },
            twinsDob: (value: string, formValues: any) => {
              if (!isInMultipleBirthSlot) return true;
              const rel = formValues?.relationship || selectedRelationship;
              if (getRelationTypeForRelationship(rel)?.toLowerCase() !== 'children') return true;
              const parsed = parseDateString(value);
              if (!parsed) return true;
              // The full child set (existing + this one) must satisfy the base maxCount
              // plus the multiple-birth group caps (eldest twin / youngest twin or triplet).
              const allDobTimes = [...existingChildDobTimes, parsed.getTime()];
              if (isChildDobSetValid(allDobTimes, maxChildrenCount, childMultipleBirthConfig)) {
                return true;
              }
              if (allowedMultipleBirthDobs.length > 0) {
                return `To add this child to an existing birth, its date of birth must match ${allowedMultipleBirthDobs
                  .map((e) => `${e.label} (${e.dob})`)
                  .join(' or ')}.`;
              }
              return `Maximum number of children reached.`;
            },
          },
        },
        gridColumn: 6,
        componentProps: {
          fullWidth: true,
          format: 'DD/MM/YYYY',
          maxDate: dayjs(),
          value: null,
          helperText: (() => {
            const relType = selectedRelationship
              ? getRelationTypeForRelationship(selectedRelationship)
              : null;
            if (
              isInMultipleBirthSlot &&
              relType?.toLowerCase() === 'children' &&
              allowedMultipleBirthDobs.length > 0
            ) {
              return `Multiple birth: date of birth must match ${allowedMultipleBirthDobs.map((e) => e.dob).join(' or ')}`;
            }
            return '';
          })(),
          slotProps: {
            popper: {
              placement: 'auto',
              strategy: 'absolute',
              modifiers: [
                { name: 'flip', enabled: true },
                {
                  name: 'preventOverflow',
                  enabled: true,
                  options: { altAxis: true, altBoundary: true, tether: false },
                },
              ],
            },
          },
          onChange: (newValue: any) => {
            if (newValue && dayjs.isDayjs(newValue)) {
              const formattedDate = newValue.format('DD/MM/YYYY');
              formRef.current?.setValue('dateOfBirth', formattedDate);
            }
          },
        },
      },
    ];
  };

  const selectedLifeEventConfig = useMemo(
    () => LIFE_EVENTS.find((event) => event.id === selectedLifeEvent),
    [selectedLifeEvent],
  );

  const requiredDocuments = useMemo(
    () => selectedLifeEventConfig?.requiredDocuments || [],
    [selectedLifeEventConfig],
  );

  // ── Doc upload card helper ────────────────────────────────────────────────
  const renderDocUploadCard = (docKey: string, label: string) => {
    const isUploading = uploadingDocumentTypes.has(docKey);
    const uploadedDoc = uploadedDocuments.find((doc) => doc.documentType === docKey);
    return (
      <AdditionDetailsDocumentCard key={docKey}>
        <AdditionDetailsDocumentTitle>
          {label}
          <span style={{ marginLeft: 4 }}>*</span>
        </AdditionDetailsDocumentTitle>
        {uploadedDoc ? (
          <AdditionDetailsUploadedDocContainer>
            <>
              <AdditionDetailsUploadedDocContent>
                <AdditionDetailsUploadedDocIcon>
                  <DescriptionIcon color="primary" />
                </AdditionDetailsUploadedDocIcon>
                <AdditionDetailsUploadedDocInfo>
                  <AdditionDetailsUploadedDocName>{uploadedDoc.fileName}</AdditionDetailsUploadedDocName>
                  {uploadedDoc.fileSize && (
                    <AdditionDetailsUploadedDocSize>{formatFileSize(uploadedDoc.fileSize)}</AdditionDetailsUploadedDocSize>
                  )}
                </AdditionDetailsUploadedDocInfo>
              </AdditionDetailsUploadedDocContent>
              <AdditionDetailsUploadedDocRemoveButton onClick={() => handleRemoveDocument(uploadedDoc.id)} size="small">
                <CloseIcon fontSize="small" color="primary" />
              </AdditionDetailsUploadedDocRemoveButton>
            </>
          </AdditionDetailsUploadedDocContainer>
        ) : (
          <>
            <AdditionDetailsUploadDropzone
              role="button"
              tabIndex={0}
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.pdf,.jpg,.jpeg,.png';
                input.onchange = (e) => {
                  const target = e.target as HTMLInputElement;
                  if (target.files) handleDocumentSelection(target.files, docKey);
                };
                input.click();
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.pdf,.jpg,.jpeg,.png';
                  input.onchange = (e) => {
                    const target = e.target as HTMLInputElement;
                    if (target.files) handleDocumentSelection(target.files, docKey);
                  };
                  input.click();
                }
              }}
              onDragOver={(event) => { event.preventDefault(); }}
              onDrop={(event) => {
                event.preventDefault();
                handleDocumentSelection(event.dataTransfer.files, docKey);
              }}
            >
              <div>
                <AdditionDetailsUploadTitle>{LIFE_EVENTS_DEPENDENT_MANAGEMENT_COPY.uploadTitle}</AdditionDetailsUploadTitle>
                <AdditionDetailsUploadSubtitle>{LIFE_EVENTS_DEPENDENT_MANAGEMENT_COPY.uploadSubtitle}</AdditionDetailsUploadSubtitle>
                {isUploading && (
                  <AdditionDetailsUploadLoader><CircularProgress size={18} /></AdditionDetailsUploadLoader>
                )}
              </div>
            </AdditionDetailsUploadDropzone>
            {hasAttemptedContinue && missingRequiredDocuments.includes(docKey) && (
              <Typography sx={{ mt: 1, fontSize: '12px', lineHeight: 1.4, color: '#D32F2F' }}>
                This document is required.
              </Typography>
            )}
          </>
        )}
      </AdditionDetailsDocumentCard>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <AdditionDetailsPageContainer>
      <AdditionDetailsFormCard>
        <AdditionDetailsFormCardContent>
          <AdditionDetailsSectionHeader>
            <AdditionDetailsSectionIcon>
              <img src={dependentInfoIcon} alt="Dependent Info" />
            </AdditionDetailsSectionIcon>
            <div>
              <AdditionDetailsSectionTitle>
                {LIFE_EVENTS_DEPENDENT_MANAGEMENT_COPY.formTitle}
              </AdditionDetailsSectionTitle>
              <AdditionDetailsSectionSubtitle>
                Provide details of your dependent to proceed with adding them as a dependent.
              </AdditionDetailsSectionSubtitle>
            </div>
            {canAddMultipleDependents && (
              <AdditionDetailsPrimaryButton
                type="button"
                variant="contained"
                onClick={() => setIsAddingNew(true)}
                disabled={isAddAnotherDisabled}
                sx={{ marginLeft: 'auto', minWidth: 110, height: 40 }}
              >
                Add +
              </AdditionDetailsPrimaryButton>
            )}
          </AdditionDetailsSectionHeader>

        {/* ── Added dependent rows: info row + doc upload row stacked ── */}
        {canAddMultipleDependents && dependents.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', mt: 2 }}>
            {dependents.map((dependent, index) => (
              <Box key={dependent.tempKey} sx={{ display: 'flex', flexDirection: 'column' }}>
                {index > 0 && <Divider sx={{ my: 2 }} />}
                {/* Row 1: all 4 dep details on a single line */}
                <AdditionDetailsDependentRow>
                  <AdditionDetailsDependentField>
                    <AdditionDetailsDependentFieldLabel>
                      {LIFE_EVENTS_DEPENDENT_MANAGEMENT_COPY.tableNameHeader}
                    </AdditionDetailsDependentFieldLabel>
                    <AdditionDetailsDependentFieldValue>{dependent.name}</AdditionDetailsDependentFieldValue>
                  </AdditionDetailsDependentField>
                  <AdditionDetailsDependentField>
                    <AdditionDetailsDependentFieldLabel>
                      {LIFE_EVENTS_DEPENDENT_MANAGEMENT_COPY.tableRelationshipHeader}
                    </AdditionDetailsDependentFieldLabel>
                    <AdditionDetailsDependentFieldValue>{capitalizeFirst(dependent.relationship)}</AdditionDetailsDependentFieldValue>
                  </AdditionDetailsDependentField>
                  <AdditionDetailsDependentField>
                    <AdditionDetailsDependentFieldLabel>
                      {LIFE_EVENTS_DEPENDENT_MANAGEMENT_COPY.tableGenderHeader}
                    </AdditionDetailsDependentFieldLabel>
                    {getGenderByRelationship(dependent.relationship || '') ? (
                      <AdditionDetailsDependentFieldValueDisabled>
                        {dependent.gender}
                      </AdditionDetailsDependentFieldValueDisabled>
                    ) : (
                      <AdditionDetailsDependentFieldValue>{dependent.gender}</AdditionDetailsDependentFieldValue>
                    )}
                  </AdditionDetailsDependentField>
                  <AdditionDetailsDependentField>
                    <AdditionDetailsDependentFieldLabel>
                      {LIFE_EVENTS_DEPENDENT_MANAGEMENT_COPY.tableDobHeader}
                    </AdditionDetailsDependentFieldLabel>
                    <AdditionDetailsDependentFieldValue>
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                        <span>
                          {dobVisibility[dependent.tempKey ?? ''] ? formatDate(dependent.dateOfBirth) : '**********'}
                        </span>
                        <IconButton
                          size="small"
                          onClick={() => setDobVisibility((prev) => ({ ...prev, [dependent.tempKey ?? '']: !prev[dependent.tempKey ?? ''] }))}
                          aria-label={dobVisibility[dependent.tempKey ?? ''] ? 'Hide date of birth' : 'Show date of birth'}
                        >
                          {dobVisibility[dependent.tempKey ?? ''] ? (
                            <VisibilityOffOutlinedIcon fontSize="small" />
                          ) : (
                            <VisibilityOutlinedIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Box>
                    </AdditionDetailsDependentFieldValue>
                  </AdditionDetailsDependentField>
                </AdditionDetailsDependentRow>

                {/* Row 2: doc upload (~60%) + Edit/Delete buttons aligned to bottom */}
                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, mt: 2 }}>
                  {requiredDocuments.length > 0 && (
                    <Box sx={{ flex: '0 0 60%', maxWidth: '60%' }}>
                      <AdditionDetailsDocumentsGrid>
                        {requiredDocuments.map((documentName) =>
                          renderDocUploadCard(`${documentName}::${dependent.tempKey}`, documentName)
                        )}
                      </AdditionDetailsDocumentsGrid>
                    </Box>
                  )}
                  <AdditionDetailsDependentRowActions sx={{ flex: 1, justifyContent: 'flex-end' }}>
                    <AdditionDetailsDependentEditButton
                      type="button"
                      startIcon={<EditOutlinedIcon fontSize="small" />}
                      onClick={() => handleEditDependent(dependent.tempKey)}
                    >
                      Edit
                    </AdditionDetailsDependentEditButton>
                    <AdditionDetailsDependentDeleteButton
                      type="button"
                      startIcon={<DeleteOutlineRoundedIcon fontSize="small" />}
                      onClick={() => handleDeleteDependent(dependent.tempKey)}
                    >
                      Delete
                    </AdditionDetailsDependentDeleteButton>
                  </AdditionDetailsDependentRowActions>
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {/* ── Form panel — flat, separated from added rows by a horizontal divider ── */}
        {showForm && (
          <Box>
            {canAddMultipleDependents && dependents.length > 0 && (
              <AdditionDetailsDependentRows>
                {dependents.map((dependent) => {
                  const depDobTime = parseDateString(dependent.dateOfBirth)?.getTime();
                  const multipleBirthLabel =
                    getRelationTypeForRelationship(
                      dependent.relationship || dependent.relation || dependent.relationshipType || '',
                    )?.toLowerCase() === 'children' &&
                    depDobTime !== undefined
                      ? multipleBirthLabelByDob.get(String(depDobTime))
                      : undefined;

                  return (
                  <AdditionDetailsDependentRow key={dependent.tempKey}>
                    <AdditionDetailsDependentField>
                      <AdditionDetailsDependentFieldLabel>
                        {LIFE_EVENTS_DEPENDENT_MANAGEMENT_COPY.tableNameHeader}
                      </AdditionDetailsDependentFieldLabel>
                      <AdditionDetailsDependentFieldValue style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        {dependent.name}
                        {multipleBirthLabel && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', background: '#EEF2FF', color: '#4338CA', fontSize: '11px', fontWeight: 600, padding: '1px 7px', borderRadius: '10px', border: '1px solid #C7D2FE', whiteSpace: 'nowrap' }}>
                            {multipleBirthLabel}
                          </span>
                        )}
                      </AdditionDetailsDependentFieldValue>
                    </AdditionDetailsDependentField>
                    <AdditionDetailsDependentField>
                      <AdditionDetailsDependentFieldLabel>
                        {LIFE_EVENTS_DEPENDENT_MANAGEMENT_COPY.tableRelationshipHeader}
                      </AdditionDetailsDependentFieldLabel>
                      <AdditionDetailsDependentFieldValue>
                        {capitalizeFirst(dependent.relationship)}
                      </AdditionDetailsDependentFieldValue>
                    </AdditionDetailsDependentField>
                    <AdditionDetailsDependentField>
                      <AdditionDetailsDependentFieldLabel>
                        {LIFE_EVENTS_DEPENDENT_MANAGEMENT_COPY.tableGenderHeader}
                      </AdditionDetailsDependentFieldLabel>
                      {getGenderByRelationship(dependent.relationship || '') ? (
                        <AdditionDetailsDependentFieldValueDisabled>
                          {dependent.gender}
                        </AdditionDetailsDependentFieldValueDisabled>
                      ) : (
                        <AdditionDetailsDependentFieldValue>
                          {dependent.gender}
                        </AdditionDetailsDependentFieldValue>
                      )}
                    </AdditionDetailsDependentField>
                    <AdditionDetailsDependentField>
                      <AdditionDetailsDependentFieldLabel>
                        {LIFE_EVENTS_DEPENDENT_MANAGEMENT_COPY.tableDobHeader}
                      </AdditionDetailsDependentFieldLabel>
                      <AdditionDetailsDependentFieldValue>
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                          <span>
                            {dobVisibility[dependent.tempKey ?? ''] ? formatDate(dependent.dateOfBirth) : '**********'}
                          </span>
                          <IconButton
                            size="small"
                            onClick={() => setDobVisibility((prev) => ({ ...prev, [dependent.tempKey ?? '']: !prev[dependent.tempKey ?? ''] }))}
                            aria-label={dobVisibility[dependent.tempKey ?? ''] ? 'Hide date of birth' : 'Show date of birth'}
                          >
                            {dobVisibility[dependent.tempKey ?? ''] ? (
                              <VisibilityOffOutlinedIcon fontSize="small" />
                            ) : (
                              <VisibilityOutlinedIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Box>
                      </AdditionDetailsDependentFieldValue>
                    </AdditionDetailsDependentField>
                    <AdditionDetailsDependentRowActions>
                      <AdditionDetailsDependentEditButton
                        type="button"
                        onClick={() => handleEditDependent(dependent.tempKey)}
                        aria-label="Edit dependent"
                      >
                        <EditOutlinedIcon />
                      </AdditionDetailsDependentEditButton>
                      <AdditionDetailsDependentDeleteButton
                        type="button"
                        onClick={() => handleDeleteDependent(dependent.tempKey)}
                        aria-label="Delete dependent"
                      >
                        <DeleteOutlineRoundedIcon />
                      </AdditionDetailsDependentDeleteButton>
                    </AdditionDetailsDependentRowActions>
                  </AdditionDetailsDependentRow>
                  );
                })}
              </AdditionDetailsDependentRows>
            )}
            {/* Heading row — full width */}
            <AdditionDetailsFormTitle sx={{ mb: 2 }}>
              {editingDependent
                ? LIFE_EVENTS_DEPENDENT_MANAGEMENT_COPY.editFormTitle
                : LIFE_EVENTS_DEPENDENT_MANAGEMENT_COPY.formTitle}
            </AdditionDetailsFormTitle>

            {/* Form fields (left) | pipe | doc upload (right) */}
            <Box sx={{ display: 'flex', gap: 3, flexDirection: 'column', '@media (max-width: 900px)': { flexDirection: 'column' } }}>
              {/* Left: form fields only */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{
                  '& .MuiGrid-container': {
                    display: 'grid !important',
                    gridTemplateColumns: 'repeat(2, 1fr) !important',
                    columnGap: '16px !important',
                    rowGap: '16px !important',
                    margin: '0 !important',
                  },
                  '& .MuiGrid-item': {
                    padding: '0 !important',
                    maxWidth: '100% !important',
                    width: '100% !important',
                  },
                }}>
                  <DynamicForm
                    formConfig={getDependentFormConfig()}
                    defaultValues={getFormDefaultValues}
                    shouldReset={true}
                    formMethods={(methods) => {
                      formRef.current = methods;
                      if (methods?.watch) {
                        watchSubscriptionRef.current?.();
                        const subscription = methods.watch((value, { name }) => {
                          if (name === 'relationship' && value.relationship) {
                            setSelectedRelationship(value.relationship);
                            methods.setValue('dateOfBirth', '');
                          }
                          if (name === 'gender') {
                            const newGender = value.gender || '';
                            setSelectedGender(newGender);
                            // Clear relationship if it's incompatible with the newly selected gender
                            const currentRelationship = (value.relationship || '').toLowerCase().trim();
                            if (currentRelationship && newGender) {
                              const impliedGender = getGenderByRelationship(currentRelationship);
                              if (impliedGender && impliedGender !== newGender) {
                                methods.setValue('relationship', '');
                                setSelectedRelationship('');
                              }
                            }
                          }
                        });
                        watchSubscriptionRef.current = subscription.unsubscribe;
                      }
                    }}
                  />
                </Box>
              </Box>

              {/* Pipe separator between form fields and doc upload */}
              {requiredDocuments.length > 0 && (
                <Divider orientation="vertical" flexItem />
              )}

              {/* Right: doc upload — single events use plain key, multi-dep uses ::pending (reassigned on Add) */}
              {requiredDocuments.length > 0 && (
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <AdditionDetailsDocumentsGrid>
                    {requiredDocuments.map((documentName) => {
                      const docKey = canAddMultipleDependents
                        ? editingDependent
                          ? `${documentName}::${editingDependent.tempKey}`
                          : `${documentName}::pending`
                        : documentName;
                      return renderDocUploadCard(docKey, documentName);
                    })}
                  </AdditionDetailsDocumentsGrid>
                </Box>
              )}
            </Box>

            {/* Action buttons — full-width bottom row, below both columns */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
              {editingDependent && (
                <AdditionDetailsDependentSaveButton type="button" onClick={handleSaveEditedDependent} aria-label="Save edited dependent">
                  <CheckRoundedIcon />
                </AdditionDetailsDependentSaveButton>
              )}
              {canAddMultipleDependents && !editingDependent && currentChildrenCount < maxChildrenCount && (
                <>
                  <AdditionDetailsSecondaryButton type="button" variant="outlined" onClick={handleCancelForm} sx={{ minWidth: 120 }}>
                    Cancel
                  </AdditionDetailsSecondaryButton>
                  <AdditionDetailsPrimaryButton type="button" variant="contained" onClick={() => handlePersistDependent(false)} sx={{ minWidth: 120 }}>
                    Add
                  </AdditionDetailsPrimaryButton>
                </>
              )}
            </Box>
          </Box>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          multiple
          style={{ display: 'none' }}
          onChange={(event) => { if (event.target) event.target.value = ''; }}
        />

</AdditionDetailsFormCardContent>
      </AdditionDetailsFormCard>

      <AdditionDetailsFooterActions>
        {showForm ? (
          <>
            <AdditionDetailsSecondaryButton
              type="button"
              variant="outlined"
              onClick={handleCancelForm}
            >
              {LIFE_EVENTS_DEPENDENT_MANAGEMENT_COPY.cancelButton}
            </AdditionDetailsSecondaryButton>
            <AdditionDetailsSecondaryButton
              type="button"
              variant="outlined"
              onClick={onBack}
            >
              {LIFE_EVENTS_DEPENDENT_MANAGEMENT_COPY.backButton}
            </AdditionDetailsSecondaryButton>
            <AdditionDetailsPrimaryButton
              type="button"
              variant="contained"
              onClick={handleAddDependentClick}
              disabled={Array.from(uploadingDocumentTypes).length > 0 || (canAddMultipleDependents && dependents.length === 0)}
            >
              Continue
            </AdditionDetailsPrimaryButton>
          </>
        ) : (
          <>
            <AdditionDetailsSecondaryButton
              type="button"
              variant="outlined"
              onClick={onExit}
            >
              Exit
            </AdditionDetailsSecondaryButton>
            <AdditionDetailsPrimaryButton
              type="button"
              variant="contained"
              onClick={onContinue}
              disabled={draftDependents?.length === 0}
            >
              {LIFE_EVENTS_DEPENDENT_MANAGEMENT_COPY.continueButton}
            </AdditionDetailsPrimaryButton>
          </>
        )}
      </AdditionDetailsFooterActions>

    </AdditionDetailsPageContainer>
  );
};

export default LifeEventsDependentManagement;
