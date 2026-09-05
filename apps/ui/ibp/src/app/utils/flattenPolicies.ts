export enum PolicyStatus {
  NOTIFY = "notify",
  CAN_ENROLL = "canEnroll",
  EDIT_ENROLL = "editEnroll",
  LOCKED = "locked",
  NOT_STARTED = "notStarted",
  EXPIRED_NOT_ENROLLED = "expiredNotEnrolled",
}

type Policy = {
  policyId: number;
  policyName: string;
  policyNumber: string | null;
  policyTypeKey: string;
  startDate: string;
  enrollmentStartDate: string;
  enrollmentEndDate: string;
  dueDate: string;
  sumInsured: string;
  balance: string;
  dependentsCount: number;
  isEditable: boolean;
  employeeEnrollmentStatusKey?: string | null;
  policyStage: "employeePolicies" | "enrolledPolicies";
};

type InputPayload = {
  employeePolicies: Policy[];
  enrolledPolicies: Policy[];
};

type PolicyWithStatus = Policy & {
  status: PolicyStatus;
};

const toStartOfLocalDay = (value: string): number | null => {
  if (!value) return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const localDate = new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate(),
  );

  return localDate.getTime();
};

const getTodayLocalStart = (): number => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
};

const EMPLOYEE_ENROLLMENT_STATUS_IN_PROGRESS =
  "EMPLOYEE_ENROLLMENT_STATUS_IN_PROGRESS";
const EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED =
  "EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED";

const getEmployeePolicyStatus = (policy: Policy): PolicyStatus => {
  if (
    policy.employeeEnrollmentStatusKey ===
    EMPLOYEE_ENROLLMENT_STATUS_IN_PROGRESS 
  ) {
    return PolicyStatus.CAN_ENROLL;
  }

  const today = getTodayLocalStart();
  const startDate = toStartOfLocalDay(policy.enrollmentStartDate);
  const endDate = toStartOfLocalDay(policy.enrollmentEndDate);

  if (startDate !== null && today < startDate) {
    return PolicyStatus.NOTIFY;
  }

  if (
    policy.employeeEnrollmentStatusKey ===
    EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED
  ) {
    // Window already closed and the employee never enrolled — distinct from
    // NOT_STARTED (open window, actionable) so the UI doesn't offer a "Start
    // Your Enrolment" CTA for a drive that's already over.
    if (endDate !== null && today > endDate) {
      return PolicyStatus.EXPIRED_NOT_ENROLLED;
    }
    return PolicyStatus.NOT_STARTED;
  }

  if (endDate !== null && today > endDate) {
    return PolicyStatus.LOCKED;
  }

  return PolicyStatus.NOT_STARTED;

}
const toDateKey = (value: string): string => {
  if (!value) return "";
  if (value.includes("T")) {
    return value.split("T")[0] || "";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getTodayDateKey = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const isFutureDate = (date: string): boolean => {
  const dateKey = toDateKey(date);
  if (!dateKey) return false;
  return dateKey > getTodayDateKey();
};

// An employee policy is "expired" when it was never enrolled and its dueDate
// has already passed — such policies belong to the Expired section only and
// must not appear in the enrollment flow.
const isExpiredEmployeePolicy = (
  policy: any,
  enrolledPolicyIds: Set<any>,
): boolean => {
  if (enrolledPolicyIds.has(policy?.policyId)) return false;
  const due = toStartOfLocalDay(policy?.dueDate);
  if (due === null) return false;
  return getTodayLocalStart() > due;
};

export function flattenPoliciesWithStatus(
  data: InputPayload
): PolicyWithStatus[] {
  const { employeePolicies = [], enrolledPolicies = [] } = data;

  const enrolledPolicyIds = new Set(
    enrolledPolicies.map((policy) => policy?.policyId),
  );

  const employee = employeePolicies
    ?.filter((policy) => !isExpiredEmployeePolicy(policy, enrolledPolicyIds))
    .map((policy) => ({
    ...policy,
    status: getEmployeePolicyStatus(policy),
    policyStage: "employeePolicies" as const, //backend keys
  }));

  const enrolled = enrolledPolicies?.map((policy) => ({
    ...policy,
    status: policy.isEditable ? PolicyStatus.EDIT_ENROLL : PolicyStatus.LOCKED,
    policyStage: "enrolledPolicies" as const,
  }));

  return [...employee, ...enrolled];
}

export const getEnrollmentButtonLabel = (
  flattenedPolicies: PolicyWithStatus[]
) => {
  const hasCanEnrollPolicies = flattenedPolicies.some(
    (policy) => policy.status === PolicyStatus.CAN_ENROLL
  );
  const hasNotStartedPolicies = flattenedPolicies.some(
    (policy) => policy.status === PolicyStatus.NOT_STARTED
  );

  const hasEditEnrollPolicies = flattenedPolicies.some(
    (policy) => policy.status === PolicyStatus.EDIT_ENROLL
  );

  const hasUpcomingPolicies = flattenedPolicies.some(
    (policy) => policy.status === PolicyStatus.NOTIFY
  );

  const hasViewablePolicies = flattenedPolicies.some(
    (policy) =>
      policy.status === PolicyStatus.EDIT_ENROLL ||
      policy.status === PolicyStatus.LOCKED
  );

  // No policies available for new enrollment, some editable
  if (!hasCanEnrollPolicies && hasEditEnrollPolicies) {
    return "Edit Enrolment";
  }

  // Enrollment started but not confirmed (has both can enroll and edit enroll)
  if (hasCanEnrollPolicies && hasEditEnrollPolicies) {
    return "Continue Enrolment";
  }

  if (!hasCanEnrollPolicies && !hasEditEnrollPolicies && hasUpcomingPolicies) {
    return "Enrollment Opens Soon";
  }

  if (!hasCanEnrollPolicies && !hasEditEnrollPolicies && hasViewablePolicies) {
    return "View Enrolment";
  }

  if (!hasCanEnrollPolicies && !hasEditEnrollPolicies && hasNotStartedPolicies) {
    return "Enroll Now";
  }

  // No enrollment started or saved (default case)
  return "Enroll Now";
};

export const getUnifiedEnrollmentViewState = (
  flattenedPolicies: PolicyWithStatus[]
) => {
  const hasActionablePolicies = flattenedPolicies.some(
    (policy) =>
      policy.status === PolicyStatus.CAN_ENROLL ||
      policy.status === PolicyStatus.EDIT_ENROLL ||
      policy.status === PolicyStatus.NOT_STARTED
  );

  const hasViewablePolicies = flattenedPolicies.some(
    (policy) =>
      policy.status === PolicyStatus.EDIT_ENROLL ||
      policy.status === PolicyStatus.LOCKED
  );

  return {
    openSummary: !hasActionablePolicies && hasViewablePolicies,
    isViewOnly: !hasActionablePolicies && hasViewablePolicies,
    hasActionablePolicies,
    hasViewablePolicies,
  };
};
