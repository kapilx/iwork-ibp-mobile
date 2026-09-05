export interface DependentDetails {
  id?: string | number;
  tempKey?: string;
  name: string;
  relationship: string;
  gender: string;
  dateOfBirth: string;
  relationshipType?: string;
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
}

export interface RelationConstraints {
  isRelationshipGroup?: boolean;
  relationships?: RelationshipData;
  constraints?: ConstraintsConfig;
  dependents?: unknown[];
  employeeChosenChoices?: unknown[];
  policyComponentsConfiguration?: Record<string, unknown>;
}
