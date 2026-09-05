export interface DependentDetails {
  id?: string | number;
  tempKey?: string;
  isManuallyAdded?: boolean;
  name: string;
  relationship: string;
  gender: string;
  dateOfBirth: string;
  relationshipType?: string;
  policyComponentActionTypeId?: number;
  parentpolicyComponentActionTypeId?: number;
  policyComponentActionType?: string | null;
  policyComponentActionLabel?: string | null;
  choices?: Array<{
    policyComponentActionTypeId?: number | string | null;
    policyComponentActionType?: string | null;
    parentpolicyComponentActionTypeId?: number | string | null;
    policyComponentActionLabel?: string | null;
  }>;
}

export interface RelationOption {
  name: string;
  maxAge?: string;
  minAge?: string;
  enabled: boolean;
  maxAgeError?: string;
}

export interface RelationType {
  type: string;
  enabled: boolean;
  maxCount: string;
  maxCountError?: string;
  configuredOptions: RelationOption[];
}

export interface RelationshipData {
  familyMaxPolicyLevel?: string;
  enabledPolicyRelations: RelationType[];
}

export interface ConstraintsConfig {
  crossParentsAllowed?: boolean;
  sameGenderParentsAllowed?: boolean;
  studyingSonAgeExtension?: number | string;
  unmarriedDaughterAgeExtension?: number | string;
  maleEmployeesCoverInLaws?: boolean;
  maleEmployeesCoverParents?: boolean;
  femaleEmployeesCoverInLaws?: boolean;
  femaleEmployeesCoverParents?: boolean;
  ageGapBetweenParentAndEmployee?: number | string;
  ageGapBetweenChildrenAndEmployee?: number | string;
  /** When true, one additional child (twin) may be added beyond maxCount provided their DOB matches the youngest existing child's DOB. */
  twinsSecondChildAllowed?: boolean;
  /** When true, up to two additional children (triplets) may be added beyond maxCount provided all three share the same DOB. */
  tripletsSecondChildAllowed?: boolean;
  /** When true, the first child slot is a twin pair (2 oldest share same DOB), allowing maxCount+1 total children. */
  allowFirstChildAsTwin?: boolean;
}

export interface RelationConstraints {
  isRelationshipGroup?: boolean;
  relationships?: RelationshipData;
  constraints?: ConstraintsConfig;
  dependents?: unknown[];
  employeeChosenChoices?: unknown[];
  policyComponentsConfiguration?: Record<string, unknown>;
}
