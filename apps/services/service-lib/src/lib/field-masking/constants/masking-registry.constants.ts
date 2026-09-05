import { MaskingConfig, MaskingPattern } from './masking-patterns.constants';

/** Static reveal target — always resolves to the same table/field/id. */
export type RevealAsTarget = {
  table: string;
  field: string;
  /**
   * Response field whose value should be used as the `id` in reveal metadata.
   * Defaults to the registry entry's `_primaryKey` field when omitted.
   */
  idField?: string;
};

/**
 * Conditional reveal target — pick table/field/id at runtime based on the
 * value of a sibling field (e.g. `relationshipGroup`).
 */
export type RevealAsConditional = {
  conditionField: string;
  conditionMap: Record<string, RevealAsTarget>;
  /** Fallback when conditionField value isn't in conditionMap. */
  fallback?: RevealAsTarget;
};

export type RevealAsConfig = RevealAsTarget | RevealAsConditional;

export type TableMaskingConfig = {
  _primaryKey: string;
  /**
   * Optional guard: the object must have this field present for the registry
   * entry to apply.  Use when _primaryKey is a generic name like 'id' that
   * could appear on unrelated objects in the same response tree.
   */
  _discriminator?: { field: string };
  fields: Record<string, MaskingConfig & {
    /**
     * Override the table/field/id sent in reveal metadata.
     * Supports static (RevealAsTarget) or conditional (RevealAsConditional)
     * resolution at runtime.
     */
    revealAs?: RevealAsConfig;
  }>;
};

export const MASKING_REGISTRY: Record<string, TableMaskingConfig> = {
  users: {
    _primaryKey: 'userId',
    fields: {
      emailId: { pattern: MaskingPattern.EMAIL_STANDARD },
      mobile:  { pattern: MaskingPattern.LAST_N_VISIBLE, visibleCount: 4 },
    },
  },
  employee: {
    _primaryKey: 'employeeId',
    fields: {
      emailId:     { pattern: MaskingPattern.EMAIL_STANDARD },
      mobile:      { pattern: MaskingPattern.LAST_N_VISIBLE, visibleCount: 4 },
      dateOfBirth: { pattern: MaskingPattern.DIGITS_MASK },
    },
  },
  /**
   * Policy member list (GET /policy/:policyId).
   *
   * Self rows  (relationshipGroup === 'self'):
   *   iirmEmpId === PolicyEnrollmentEmployee.id
   *   → phone, email, dateOfBirth from policy_enrollment_employee using iirmEmpId
   *
   * Dependent rows (relationshipGroup === 'dependent'):
   *   iirmEmpId === PolicyEnrollmentDependent.id
   *   employeeId === PolicyEnrollmentEmployee.id
   *   → dateOfBirth from policy_enrollment_dependent using iirmEmpId
   *   → phone, email from policy_enrollment_employee using employeeId
   */
  policy_member: {
    _primaryKey: 'iirmEmpId',
    fields: {
      mobileNumber: {
        pattern: MaskingPattern.LAST_N_VISIBLE,
        visibleCount: 4,
        revealAs: {
          conditionField: 'relationshipGroup',
          conditionMap: {
            self:      { table: 'policy_enrollment_employee', field: 'phoneNumber' },
            dependent: { table: 'policy_enrollment_employee', field: 'phoneNumber', idField: 'employeeId' },
          },
          fallback: { table: 'policy_enrollment_employee', field: 'phoneNumber' },
        },
      },
      email: {
        pattern: MaskingPattern.EMAIL_STANDARD,
        revealAs: {
          conditionField: 'relationshipGroup',
          conditionMap: {
            self:      { table: 'policy_enrollment_employee', field: 'email' },
            dependent: { table: 'policy_enrollment_employee', field: 'email', idField: 'employeeId' },
          },
          fallback: { table: 'policy_enrollment_employee', field: 'email' },
        },
      },
      dateOfBirth: {
        pattern: MaskingPattern.DIGITS_MASK,
        revealAs: {
          conditionField: 'relationshipGroup',
          conditionMap: {
            self:      { table: 'policy_enrollment_employee', field: 'dateOfBirth' },
            dependent: { table: 'policy_enrollment_dependent', field: 'dateOfBirth' },
          },
          fallback: { table: 'policy_enrollment_employee', field: 'dateOfBirth' },
        },
      },
    },
  },
  /**
   * Reveal-only entry for PolicyEnrollmentEmployee.
   * Never matches response objects (discriminator field `companyEmployeeId`
   * is an internal entity field, not exposed in any API response).
   * Exists solely so RevealService can validate and look up fields.
   */
  policy_enrollment_employee: {
    _primaryKey: 'id',
    _discriminator: { field: 'companyEmployeeId' },
    fields: {
      phoneNumber:  { pattern: MaskingPattern.LAST_N_VISIBLE, visibleCount: 4 },
      email:        { pattern: MaskingPattern.EMAIL_STANDARD },
      dateOfBirth:  { pattern: MaskingPattern.DIGITS_MASK },
    },
  },
  /**
   * Reveal-only entry for PolicyEnrollmentDependent.
   * Never matches response objects (discriminator field `dependentTpaId`
   * is not exposed in any API response).
   * Exists solely so RevealService can look up dateOfBirth for dependent rows.
   */
  policy_enrollment_dependent: {
    _primaryKey: 'id',
    _discriminator: { field: 'dependentTpaId' },
    fields: {
      dateOfBirth: { pattern: MaskingPattern.DIGITS_MASK },
    },
  },
  contact_communication: {
    _primaryKey: 'id',
    // Guard: only apply to objects that actually have a communicationType field,
    // so generic { id, ... } objects elsewhere are not accidentally masked.
    _discriminator: { field: 'communicationType' },
    fields: {
      communicationDetails: {
        pattern: MaskingPattern.CONDITIONAL,
        typeField: 'communicationType',
        typeMap: {
          email: { pattern: MaskingPattern.EMAIL_STANDARD },
          phone: { pattern: MaskingPattern.LAST_N_VISIBLE, visibleCount: 4 },
        },
      },
    },
  },
};
