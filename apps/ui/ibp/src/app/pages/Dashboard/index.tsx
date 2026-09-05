import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Button,
  CustomModal,
  DocumentPreview,
  endPoints,
  formatDate,
  theme,
  useApiQuery,
} from "@ui/ui-lib";
import { environment } from "@ui/ui-lib/environment";
import { useApiMutation } from "@ui/ui-lib/hooks/useMutation";
import DashboardBenefitsSection from "../../components/DashboardBenifitsSection";
import EnrollmentBannerCard from "../../common/EnrollmentBannerCard";
import FAQ from "../../components/FAQ";
import {
  ButtonContainer,
  ButtonWrapper,
  DashboardContainer,
  DashboardTopSpacer,
} from "../DashboardPage/styles";
import DashboardEmployeeDetails from "../../components/DashboardEmployeeDetails";
import { useNavigate } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import employeeIllustration from "../../assets/pngs/enrollment-deadline-illustration.png";
import continueIllustration from "../../../assets/svgs/continue-banner-image.svg";
import completedEnrolment from "../../assets/pngs/completed-illustration.png";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../redux/store";
import { fetchCompanyTemplate } from "../../redux/companyTemplateSlice";
import { fetchPolicyTemplate } from "../../redux/policyTemplateSlice";
import CommonLoader from "../../common/CommonLoader";
import MarkDownRenderer from "../../common/MarkDownRenderer";
import { useDashboardContent } from "../../hooks/useDashboardContent";
import { DATE_FORMATS } from "../../constants";
import TermsAndConditionsPopup from "../../components/Dashboard/TermsAndConditionsPopup";
import PolicyPortingBanner from "../../components/Dashboard/PolicyPortingBanner";
import WellnessHub from "../../components/Dashboard/WellnessHub";
import {
  flattenPoliciesWithStatus,
  getUnifiedEnrollmentViewState,
  PolicyStatus,
} from "../../utils/flattenPolicies";
import PreviewIcon from "../../../assets/svgs/preview-icon.svg";

type DashboardProps = {
  userName?: string;
  employeeDetails?: {
    employeeName?: string;
    companyEmployeeId?: string | number;
    dateOfBirth?: string;
    email?: string;
    phone?: string;
  } | null;
};

type EmployeeDetailsResponse = {
  data?: {
    employeeName?: string;
    employeeId?: string | number;
    dateOfBirth?: string;
    email?: string;
    phoneNumber?: string;
    policyEnrollmentStatuses?: Array<{
      policyId: string | number;
      employeeEnrollmentStatusKey:
        | "EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED"
        | "EMPLOYEE_ENROLLMENT_STATUS_IN_PROGRESS"
        | "EMPLOYEE_ENROLLMENT_STATUS_ENROLLED";
      policyName?: string;
    }>;
  };
};

type PoliciesResponse = {
  data?: {
    employeePolicies?: Array<Record<string, unknown>>;
    enrolledPolicies?: Array<Record<string, unknown>>;
  };
};

type DashboardEnrollmentStatus =
  | "EMPLOYEE_ENROLLMENT_STATUS_NOTIFY"
  | "EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED"
  | "EMPLOYEE_ENROLLMENT_STATUS_IN_PROGRESS"
  | "EMPLOYEE_ENROLLMENT_STATUS_ENROLLED";

type DashboardPrimaryAction = "START" | "EDIT" | "VIEW" | "DISABLED";

const getPolicyYearLabel = (
  policies: Array<{
    startDate?: string;
    enrollmentStartDate?: string;
  }>
): string => {
  const latestPolicyStartDate = policies
    .map((policy) => policy.startDate || policy.enrollmentStartDate || "")
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => b.getTime() - a.getTime())[0];

  if (!latestPolicyStartDate) {
    return "current policy year";
  }

  const startYear = latestPolicyStartDate.getFullYear();
  const endYearShort = String((startYear + 1) % 100).padStart(2, "0");

  return `${startYear}-${endYearShort}`;
};

const DASHBOARD_ENROLLMENT_STEPS = [
  { step: 1, name: "login" },
  { step: 2, name: "reviewBenefits" },
  { step: 3, name: "addDependents" },
  { step: 4, name: "selectTopUps" },
  { step: 5, name: "submitEnrollment" },
  { step: 6, name: "receiveConfirmation" },
];

const Dashboard: React.FC<DashboardProps> = ({ userName }) => {
  const userDetails = JSON.parse(sessionStorage.getItem("user") || "{}");
  const employeeId = userDetails?.id;
  const companyId = userDetails?.companyId; // Use companyId instead of employeeCompanyId

  const dispatch = useDispatch<AppDispatch>();
  const companyTemplate = useSelector(
    (state: RootState) => state.companyTemplate.data
  );

  useEffect(() => {
    if (companyId) {
      dispatch(fetchCompanyTemplate(companyId));
    }
  }, [dispatch, companyId]);

  const navigate = useNavigate();
  const dashboardContent = useMemo(
    () => companyTemplate?.config ?? companyTemplate ?? null,
    [companyTemplate]
  );
  const dashboardFaqs = useMemo(() => {
    const sourceFaqs = companyTemplate?.config?.faqs ?? dashboardContent?.faqs;
    if (!Array.isArray(sourceFaqs)) return [];

    return sourceFaqs
      .map((faq: any, index: number) => {
        const faqId = faq?.id ?? faq?.attributes?.id ?? index + 1;
        const question =
          faq?.question ??
          faq?.attributes?.question ??
          faq?.title ??
          faq?.attributes?.title;
        const answer =
          faq?.answer ??
          faq?.attributes?.answer ??
          faq?.description ??
          faq?.attributes?.description;
        const sequenceRaw =
          faq?.sequencenumber ??
          faq?.sequenceNumber ??
          faq?.attributes?.sequencenumber ??
          faq?.attributes?.sequenceNumber;
        const sequence = Number(sequenceRaw);

        return {
          id: faqId,
          question: typeof question === "string" ? question : "",
          answer: typeof answer === "string" ? answer : "",
          sequence: Number.isFinite(sequence)
            ? sequence
            : Number.MAX_SAFE_INTEGER,
          index,
        };
      })
      .filter((faq) => faq.question && faq.answer)
      .sort((a, b) => {
        if (a.sequence !== b.sequence) {
          return a.sequence - b.sequence;
        }
        return a.index - b.index;
      })
      .map(({ id, question, answer }) => ({ id, question, answer }));
  }, [companyTemplate, dashboardContent]);

  const dashboardContainerRef = useRef<HTMLDivElement>(null);
  const expandFirstAccordionRef = useRef<(() => void) | null>(null);
  // const employeeDetailsSpacerHeight = isEmployeeDetailsCollapsed
  //   ? "100px"
  //   : "340px";

  // const handleEmployeeDetailsToggle = useCallback(() => {
  //   setIsEmployeeDetailsCollapsed((previous) => !previous);
  // }, []);

  // Mutation hook to update enrollment progress
  const { mutate: updateEnrollmentProgress } = useApiMutation({
    config: {
      onSuccess: () => {
        refetchEnrollmentProgress();
      },
      onError: (error: any) => {
        console.error("Enrollment progress update failed:", error);
      },
    },
  });

  // useEffect(() => {
  //   const COLLAPSE_SCROLL_Y = 120;
  //   const EXPAND_SCROLL_Y = 10;

  //   const handleScroll = () => {
  //     const currentScrollY = window.scrollY;

  //     // Collapse only after crossing threshold
  //     if (currentScrollY > COLLAPSE_SCROLL_Y && !isEmployeeDetailsCollapsed) {
  //       setIsEmployeeDetailsCollapsed(true);
  //     }

  //     // Expand only when user comes back near top
  //     if (currentScrollY < EXPAND_SCROLL_Y && isEmployeeDetailsCollapsed) {
  //       setIsEmployeeDetailsCollapsed(false);
  //     }
  //   };

  //   window.addEventListener("scroll", handleScroll, { passive: true });

  //   return () => window.removeEventListener("scroll", handleScroll);
  // }, [isEmployeeDetailsCollapsed]);

  // Scroll detection to collapse header
  // useEffect(() => {
  //   const handleScroll = () => {
  //     const currentScrollY = window.scrollY;

  //     // Scroll down: collapse (show minimal view)
  //     if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
  //       setIsEmployeeDetailsCollapsed(true);
  //     }

  //     lastScrollY.current = currentScrollY;
  //   };

  //   window.addEventListener("scroll", handleScroll, { passive: true });

  //   return () => {
  //     window.removeEventListener("scroll", handleScroll);
  //   };
  // }, []);

  // Fetch employee details for the dashboard banner.
  const { data: employeeDetailsResponse, isLoading: isEmployeeDetailsLoading } =
    useApiQuery({
      queryKey: ["employeeDetails", employeeId],
      url: employeeId ? endPoints.employeeDetails : "",
      enabled: Boolean(employeeId),
    });

  // Fetch employee policies to check enrollment status
  const { data: policiesResponse, isLoading: isPoliciesLoading } = useApiQuery({
    queryKey: ["employeePolicies", employeeId],
    url: employeeId ? endPoints.employeePolicies(employeeId) : "",
    enabled: Boolean(employeeId),
  });

  // Fetch enrollment progress to track current step
  const {
    data: enrollmentProgressResponse,
    refetch: refetchEnrollmentProgress,
  } = useApiQuery({
    queryKey: ["enrollmentProgress", employeeId],
    url: employeeId ? endPoints.enrollmentProgress(employeeId) : "",
    enabled: Boolean(employeeId),
    refetchOnWindowFocus: true,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const employeeDetails = useMemo(() => {
    const payload = employeeDetailsResponse as
      | EmployeeDetailsResponse
      | undefined;
    return payload?.data ?? (payload as any)?.data?.data ?? null;
  }, [employeeDetailsResponse]);

  const flattenedPolicies = useMemo(() => {
    const payload = policiesResponse as PoliciesResponse | undefined;
    return flattenPoliciesWithStatus(
      payload?.data ?? { employeePolicies: [], enrolledPolicies: [] }
    );
  }, [policiesResponse]);

  // When true, the enrollment CTA routes to the pre-enrollment Manage Dependents
  // screen instead of the unified enrollment flow. Driven by the policy API's
  // `addOnlyDependents` flag — true only when EVERY policy has it set. A mixed
  // set (some true, some false) or no policies at all keeps the normal flow.
  const addOnlyDependents = useMemo(() => {
    const payload = policiesResponse as PoliciesResponse | undefined;
    const data =
      payload?.data ?? { employeePolicies: [], enrolledPolicies: [] };
    const allPolicies = [
      ...(data.employeePolicies ?? []),
      ...(data.enrolledPolicies ?? []),
    ];
    return (
      allPolicies.length > 0 &&
      allPolicies.every(
        (policy) =>
          (policy as { addOnlyDependents?: boolean })?.addOnlyDependents ===
          true,
      )
    );
  }, [policiesResponse]);

  const policyYearLabel = useMemo(
    () => getPolicyYearLabel(flattenedPolicies),
    [flattenedPolicies]
  );

  const enrollmentYearLabel = useMemo(() => {
    const startDate = dashboardContent?.enrollmentYearRange?.startDate;
    const endDate = dashboardContent?.enrollmentYearRange?.endDate;
    if (!startDate) return null;
    const parsedStart = new Date(startDate);
    if (Number.isNaN(parsedStart.getTime())) return null;
    const startYear = parsedStart.getFullYear();
    if (endDate) {
      const parsedEnd = new Date(endDate);
      if (!Number.isNaN(parsedEnd.getTime())) {
        return `${startYear}-${parsedEnd.getFullYear()}`;
      }
    }
    const endYearShort = String((startYear + 1) % 100).padStart(2, "0");
    return `${startYear}-${endYearShort}`;
  }, [dashboardContent?.enrollmentYearRange?.startDate, dashboardContent?.enrollmentYearRange?.endDate]);
  const policyStatusMeta = useMemo(() => {
    const totalPoliciesCount = flattenedPolicies.length;
    console.log("flattenedPoliciesflattenedPoliciesflattenedPolicies", flattenedPolicies)
    const notifyPolicies = flattenedPolicies.filter(
      (policy) => policy.status === PolicyStatus.NOTIFY
    );
    const canEnrollPolicies = flattenedPolicies.filter(
      (policy) => policy.status === PolicyStatus.CAN_ENROLL
    );
    const notStartedPolicies = flattenedPolicies.filter(
      (policy) => policy.status === PolicyStatus.NOT_STARTED
    );
    const editEnrollPolicies = flattenedPolicies.filter(
      (policy) => policy.status === PolicyStatus.EDIT_ENROLL
    );
    const lockedPolicies = flattenedPolicies.filter(
      (policy) => policy.status === PolicyStatus.LOCKED
    );
    const expiredNotEnrolledPolicies = flattenedPolicies.filter(
      (policy) => policy.status === PolicyStatus.EXPIRED_NOT_ENROLLED
    );

    const hasNotifyPolicies = notifyPolicies.length > 0;
    const hasCanEnrollPolicies = canEnrollPolicies.length > 0;
    const hasNotStartedPolicies = notStartedPolicies.length > 0;
    const hasEditEnrollPolicies = editEnrollPolicies.length > 0;
    const hasLockedPolicies = lockedPolicies.length > 0;
    const hasExpiredNotEnrolledPolicies = expiredNotEnrolledPolicies.length > 0;
    const hasActionablePolicies =
      hasCanEnrollPolicies || hasEditEnrollPolicies || hasNotStartedPolicies;
    const hasViewablePolicies = hasEditEnrollPolicies || hasLockedPolicies;

    // Policies eligible for enrollment: can enroll + edit enroll (window open) + not started
    const enrollmentEligibleCount = canEnrollPolicies.length + editEnrollPolicies.length + notStartedPolicies.length;

    const isAllNotify =
      totalPoliciesCount > 0 &&
      hasNotifyPolicies &&
      !hasCanEnrollPolicies &&
      !hasEditEnrollPolicies &&
      !hasLockedPolicies;

    return {
      totalPoliciesCount,
      enrollmentEligibleCount,
      notifyPolicies,
      canEnrollPolicies,
      notStartedPolicies,
      editEnrollPolicies,
      lockedPolicies,
      expiredNotEnrolledPolicies,
      hasNotifyPolicies,
      hasCanEnrollPolicies,
      hasNotStartedPolicies,
      hasEditEnrollPolicies,
      hasLockedPolicies,
      hasExpiredNotEnrolledPolicies,
      hasActionablePolicies,
      hasViewablePolicies,
      isAllNotify,
    };
  }, [flattenedPolicies]);

  const hasActionablePolicies = policyStatusMeta.hasActionablePolicies;
  const hasViewablePolicies = policyStatusMeta.hasViewablePolicies;

  const dateMeta = useMemo(() => {
    const toLocalStartDate = (value: unknown): Date | null => {
      const parsed = new Date(String(value ?? ""));
      if (Number.isNaN(parsed.getTime())) return null;
      const normalized = new Date(parsed);
      normalized.setHours(0, 0, 0, 0);
      return normalized;
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allPolicies = flattenedPolicies;
    const openWindowPolicies = allPolicies.filter(
      (policy) =>
        policy.status === PolicyStatus.CAN_ENROLL ||
        policy.status === PolicyStatus.EDIT_ENROLL
    );

    const notifyStartDates = allPolicies
      .filter((policy) => policy.status === PolicyStatus.NOTIFY)
      .map((policy: any) => toLocalStartDate(policy?.enrollmentStartDate))
      .filter((date): date is Date => Boolean(date));

    const openDates = openWindowPolicies
      .map((policy: any) => toLocalStartDate(policy?.enrollmentEndDate))
      .filter((date): date is Date => Boolean(date));

    const allEndDates = allPolicies
      .map((policy: any) => toLocalStartDate(policy?.enrollmentEndDate))
      .filter((date): date is Date => Boolean(date));

    const firstEnrollmentOpenDate =
      notifyStartDates.length > 0
        ? new Date(Math.min(...notifyStartDates.map((date) => date.getTime())))
        : null;

    const candidateCloseDates = openDates.length > 0 ? openDates : allEndDates;
    const upcomingCloseDates = candidateCloseDates.filter(
      (date) => date.getTime() >= today.getTime()
    );
    const chosenEnrollmentCloseDate =
      candidateCloseDates.length > 0
        ? upcomingCloseDates.length > 0
          ? new Date(
              Math.min(...upcomingCloseDates.map((date) => date.getTime()))
            )
          : new Date(
              Math.max(...candidateCloseDates.map((date) => date.getTime()))
            )
        : null;

    const daysUntilOpen = firstEnrollmentOpenDate
      ? Math.max(
          0,
          Math.ceil(
            (firstEnrollmentOpenDate.getTime() - today.getTime()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : 0;

    const daysUntilClose = chosenEnrollmentCloseDate
      ? Math.max(
          0,
          Math.ceil(
            (chosenEnrollmentCloseDate.getTime() - today.getTime()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : 0;

    return {
      firstEnrollmentOpenDate,
      chosenEnrollmentCloseDate,
      formattedOpenDate: firstEnrollmentOpenDate
        ? formatDate(firstEnrollmentOpenDate, DATE_FORMATS.DAY_SHORT_MONTH_YEAR)
        : "",
      formattedCloseDate: chosenEnrollmentCloseDate
        ? formatDate(
            chosenEnrollmentCloseDate,
            DATE_FORMATS.DAY_SHORT_MONTH_YEAR
          )
        : "",
      daysUntilOpen,
      daysUntilClose,
      totalPoliciesCount: policyStatusMeta.totalPoliciesCount,
      eligiblePoliciesCount: openWindowPolicies.length,
    };
  }, [flattenedPolicies, policyStatusMeta.totalPoliciesCount]);

  const dashboardEnrollmentView = useMemo(() => {
    const employeeName = employeeDetails?.employeeName ?? "";
    const policiesCount = policyStatusMeta.enrollmentEligibleCount;
    const policiesText = policiesCount
      ? `Enrol in ${policiesCount} ${
          policiesCount === 1 ? "policy" : "policies"
        } now!`
      : "Enrol in policies now!";
    const openUntilText = dateMeta.formattedCloseDate
      ? `Open until ${dateMeta.formattedCloseDate}`
      : "Open until 28 Feb'26";
    const dueDateText = dateMeta.formattedCloseDate
      ? `till ${dateMeta.formattedCloseDate}`
      : "till feb 14th";
    const enrollmentOpensText = dateMeta.formattedOpenDate
      ? `Your enrolment is not started yet. First enrolment opens from ${dateMeta.formattedOpenDate}`
      : "Your enrolment is not started yet. First enrolment opens soon";

    // Priority:
    // 1) at least one CAN_ENROLL -> Continue
    // 2) else at least one EDIT_ENROLL -> Edit
    // 3) else at least one NOT_STARTED -> Start
    // 4) else at least one LOCKED -> View
    // 5) else all NOTIFY -> Disabled
    // 6) else only EXPIRED_NOT_ENROLLED -> closed, contact HR
    // 7) fallback -> Start

    if (policyStatusMeta.hasCanEnrollPolicies) {
      return {
        status:
          "EMPLOYEE_ENROLLMENT_STATUS_IN_PROGRESS" as DashboardEnrollmentStatus,
        action: "START" as DashboardPrimaryAction,
        greetingText: `Hey, ${employeeName} you’re nearly there. Ready to finish your enrolment?`,
        buttonText: "Continue Enrolment",
        enrolmentImg: continueIllustration,
        infoLines: [
          `Enrolment window is still open you can make changes ${dueDateText}`,
        ],
        daysLeft: dateMeta.daysUntilClose,
      };
    }

    if (policyStatusMeta.hasEditEnrollPolicies) {
      return {
        status:
          "EMPLOYEE_ENROLLMENT_STATUS_ENROLLED" as DashboardEnrollmentStatus,
        action: "EDIT" as DashboardPrimaryAction,
        greetingText: `Congratulations ${employeeName}! You have completed the enrolment`,
        buttonText: "Edit Enrolment",
        enrolmentImg: completedEnrolment,
        infoLines: [
          `Enrolment window is still open you can make changes ${dueDateText}`,
        ],
        daysLeft: dateMeta.daysUntilClose,
      };
    }

    if (policyStatusMeta.hasNotStartedPolicies) {
      const progressSteps = (enrollmentProgressResponse as any)?.data?.steps as
        | Array<{ step: number; completed: boolean }>
        | undefined;
      const hasProgressBeyondLogin = progressSteps?.some(
        (s) => s.step >= 4 && s.completed,
      );

      if (hasProgressBeyondLogin) {
        return {
          status:
            "EMPLOYEE_ENROLLMENT_STATUS_IN_PROGRESS" as DashboardEnrollmentStatus,
          action: "START" as DashboardPrimaryAction,
          greetingText: `Hey, ${employeeName} you're nearly there. Ready to finish your enrolment?`,
          buttonText: "Continue Enrolment",
          enrolmentImg: continueIllustration,
          infoLines: [
            `Enrolment window is still open you can make changes ${dueDateText}`,
          ],
          daysLeft: dateMeta.daysUntilClose,
        };
      }

      return {
        status:
          "EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED" as DashboardEnrollmentStatus,
        action: "START" as DashboardPrimaryAction,
        greetingText: `Hello, ${employeeName}`,
        buttonText: "Start Your Enrolment",
        enrolmentImg: employeeIllustration,
        infoLines: [openUntilText, policiesText],
        daysLeft: dateMeta.daysUntilClose,
      };
    }


    if (policyStatusMeta.hasLockedPolicies) {
      return {
        status:
          "EMPLOYEE_ENROLLMENT_STATUS_ENROLLED" as DashboardEnrollmentStatus,
        action: "VIEW" as DashboardPrimaryAction,
        greetingText: `Congratulations ${employeeName}! You have completed the enrolment`,
        buttonText: "View Enrolment",
        enrolmentImg: completedEnrolment,
        infoLines: ["Your enrolled benefits are ready to view."],
        daysLeft: dateMeta.daysUntilClose,
      };
    }

    if (policyStatusMeta.isAllNotify) {
      return {
        status:
          "EMPLOYEE_ENROLLMENT_STATUS_NOTIFY" as DashboardEnrollmentStatus,
        action: "DISABLED" as DashboardPrimaryAction,
        greetingText: `Hello, ${employeeName}`,
        buttonText: "Enrollment Opens Soon",
        enrolmentImg: employeeIllustration,
        infoLines: [enrollmentOpensText],
        daysLeft: dateMeta.daysUntilOpen,
      };
    }

    // Nothing actionable/viewable at all — the only thing going on is a
    // policy (or policies) whose window closed before the employee ever
    // enrolled. No CTA makes sense here.
    if (policyStatusMeta.hasExpiredNotEnrolledPolicies) {
      return {
        status:
          "EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED" as DashboardEnrollmentStatus,
        action: "DISABLED" as DashboardPrimaryAction,
        greetingText: `Hello, ${employeeName}`,
        buttonText: "Enrolment Closed",
        enrolmentImg: employeeIllustration,
        infoLines: ["Enrolment window has completed."],
        daysLeft: 0,
      };
    }

    return {
      status:
        "EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED" as DashboardEnrollmentStatus,
      action: "START" as DashboardPrimaryAction,
      greetingText: `Hello, ${employeeName}`,
      buttonText: "Start Your Enrolment",
      enrolmentImg: employeeIllustration,
      infoLines: [openUntilText, policiesText],
      daysLeft: dateMeta.daysUntilClose,
    };
  }, [dateMeta, employeeDetails?.employeeName, policyStatusMeta, enrollmentProgressResponse]);

  const overallEnrollmentStatus = dashboardEnrollmentView.status;
  const daysLeft = dashboardEnrollmentView.daysLeft;

  const hasCompletedEnrollmentPolicy = useMemo(
    () =>
      flattenedPolicies.some(
        (policy: any) =>
          policy.policyStage === "enrolledPolicies" ||
          policy.status === PolicyStatus.EDIT_ENROLL ||
          policy.status === PolicyStatus.LOCKED,
      ),
    [flattenedPolicies],
  );

  const unifiedEnrollmentViewState = useMemo(
    () => getUnifiedEnrollmentViewState(flattenedPolicies),
    [flattenedPolicies],
  );

  // Handler for when user clicks to start/continue enrollment
  const handleStartEnrollment = useCallback(() => {
    // When only dependent management is enabled (policy not yet configured for
    // enrollment), route to the Manage Dependents screen instead.
    if (addOnlyDependents) {
      navigate("/manage-dependents");
      return;
    }

    if (dashboardEnrollmentView.action === "DISABLED") {
      return;
    }

    if (dashboardEnrollmentView.action === "VIEW") {
       navigate("/unified-enrollment", {
          state: {
            ...unifiedEnrollmentViewState,
            source: "dashboard",
          },
        });
      return;
    }

    const enrollmentBatchKey = sessionStorage.getItem(
      `enrollment_batch_key_${employeeId}`
    );

    if (enrollmentBatchKey) {
      updateEnrollmentProgress({
        endpoint: endPoints.updateEnrollmentProgress(employeeId),
        method: "PUT",
        data: {
          enrollmentBatchKey,
          stepName: "reviewBenefits",
          completed: true,
        },
      });
    }

    navigate("/unified-enrollment", {
      state: {
        ...unifiedEnrollmentViewState,
        source: "dashboard",
      },
    });
  }, [
    addOnlyDependents,
    dashboardEnrollmentView.action,
    employeeId,
    navigate,
    unifiedEnrollmentViewState,
    updateEnrollmentProgress,
  ]);
  // Extract current step index and enrollment steps from enrollment progress
  const { currentStepIndex, enrollmentSteps } = useMemo(() => {
    const payload = enrollmentProgressResponse as
      | {
          data?: {
            currentStep?: number;
            enrollmentBatchKey?: string;
            steps?: Array<{
              step: number;
              name: string;
              completed: boolean;
              current: boolean;
            }>;
            sessions?: Array<{
              steps?: {
                login?: { completed: boolean };
                reviewBenefits?: { completed: boolean };
                addDependents?: { completed: boolean };
                selectTopUps?: { completed: boolean };
                submitEnrollment?: { completed: boolean };
                receiveConfirmation?: { completed: boolean };
              };
            }>;
          };
        }
      | undefined;

    // Store enrollmentBatchKey if available
    if (payload?.data?.enrollmentBatchKey && employeeId) {
      sessionStorage.setItem(
        `enrollment_batch_key_${employeeId}`,
        payload.data.enrollmentBatchKey
      );
    }

    // Extract steps array and currentStep
    const steps = payload?.data?.steps || [];
    const currentStep =
      payload?.data?.currentStep !== undefined ? payload.data.currentStep : 0;

    return {
      currentStepIndex: currentStep,
      enrollmentSteps: steps,
    };
  }, [enrollmentProgressResponse, employeeId]);

  const normalizedEnrollmentSteps = useMemo(() => {
    const stepByNumber = new Map<number, any>();
    const stepByName = new Map<string, any>();

    (enrollmentSteps || []).forEach((step: any) => {
      const stepNumber = Number(step?.step);
      const stepName = String(step?.name ?? "").trim();

      if (Number.isFinite(stepNumber) && !stepByNumber.has(stepNumber)) {
        stepByNumber.set(stepNumber, step);
      }

      if (stepName && !stepByName.has(stepName)) {
        stepByName.set(stepName, step);
      }
    });

    return DASHBOARD_ENROLLMENT_STEPS.map((baseStep) => {
      const resolvedStep =
        stepByNumber.get(baseStep.step) ?? stepByName.get(baseStep.name);

      return {
        step: baseStep.step,
        name: baseStep.name,
        completed: Boolean(resolvedStep?.completed),
        current: Boolean(resolvedStep?.current),
      };
    });
  }, [enrollmentSteps]);

  // Mutation hook to initialize enrollment progress
  const { mutate: initializeEnrollment } = useApiMutation({
    config: {
      onSuccess: (data: any) => {
        // Mark as initialized to prevent duplicate calls
        const initializeKey = `enrollment_initialized_${employeeId}`;
        sessionStorage.setItem(initializeKey, "true");

        // Store enrollmentBatchKey for later use
        if (data?.data?.enrollmentBatchKey) {
          sessionStorage.setItem(
            `enrollment_batch_key_${employeeId}`,
            data.data.enrollmentBatchKey
          );
        }

        // Refetch enrollment progress to update UI immediately
        refetchEnrollmentProgress();
      },
      onError: (error: any) => {
        console.error("Enrollment initialization failed:", error);
      },
    },
  });

  // Initialize enrollment progress if login step is not completed
  useEffect(() => {
    if (!employeeId || !employeeDetailsResponse) {
      return;
    }

    const progressPayload = enrollmentProgressResponse as
      | {
          data?: {
            steps?: Array<{ name: string; completed: boolean }>;
            policyIds?: number[];
          };
        }
      | undefined;

    if (!hasActionablePolicies) {
      return;
    }

    // Check if login step is already completed
    const loginStep = progressPayload?.data?.steps?.find(
      (step) => step.name === "login"
    );
    const isLoginCompleted = loginStep?.completed === true;

    // If login is already completed, no need to initialize
    if (isLoginCompleted) {
      return;
    }

    // Get policy IDs from employee details
    const employeeData = employeeDetailsResponse as EmployeeDetailsResponse;
    const policyIds =
      employeeData?.data?.policyEnrollmentStatuses
        ?.map((status) => Number(status.policyId))
        .filter((id) => !isNaN(id)) || [];

    if (policyIds.length === 0) {
      return;
    }

    // Check if already initialized (prevent duplicate calls)
    const initializeKey = `enrollment_initialized_${employeeId}`;
    if (sessionStorage.getItem(initializeKey)) {
      return;
    }

    initializeEnrollment({
      endpoint: endPoints.initializeEnrollmentProgress,
      method: "POST",
      data: { employeeId, policyIds },
    });
  }, [
    employeeId,
    employeeDetailsResponse,
    enrollmentProgressResponse,
    hasActionablePolicies,
    initializeEnrollment,
  ]);

  const effectiveGreetingData = dashboardEnrollmentView;

  const dashboardStepperSteps = useMemo(() => {
    if (hasActionablePolicies) {
      return normalizedEnrollmentSteps;
    }

    if (hasViewablePolicies) {
      return [
        { step: 1, name: "login", completed: true, current: false },
        { step: 2, name: "reviewBenefits", completed: true, current: false },
        { step: 3, name: "addDependents", completed: true, current: false },
        { step: 4, name: "selectTopUps", completed: true, current: false },
        { step: 5, name: "submitEnrollment", completed: true, current: false },
        {
          step: 6,
          name: "receiveConfirmation",
          completed: true,
          current: false,
        },
      ];
    }

    return [];
  }, [hasActionablePolicies, hasViewablePolicies, normalizedEnrollmentSteps]);

  const dashboardCurrentStepIndex = useMemo(() => {
    if (hasActionablePolicies) {
      return currentStepIndex;
    }

    if (hasViewablePolicies) {
      return 6;
    }

    return 0;
  }, [currentStepIndex, hasActionablePolicies, hasViewablePolicies]);

  if (isEmployeeDetailsLoading || isPoliciesLoading) {
    return <CommonLoader fullScreen />;
  }
  return (
    <>
      <DashboardEmployeeDetails
        name={employeeDetails?.employeeName || userName}
        employeeCode={employeeDetails?.companyEmployeeId?.toString()}
        dateOfBirth={employeeDetails?.dateOfBirth}
        email={employeeDetails?.email}
        phone={employeeDetails?.phone}
        enrolmentImg={effectiveGreetingData?.enrolmentImg}
        greetingPrefix={effectiveGreetingData?.greetingText}
        alternativePhoneNumber={employeeDetails?.alternatePhoneNumber}
        alternativeEmail={employeeDetails?.alternateEmail}
        overAllEnrollmentStatus={overallEnrollmentStatus}
        currentStepIndex={dashboardCurrentStepIndex}
        enrollmentSteps={dashboardStepperSteps}
        hasCompletedEnrollmentPolicy={hasCompletedEnrollmentPolicy}
        addOnlyDependents={addOnlyDependents}
        noteText={
          dashboardContent?.employeeDetailsSection?.noteText ||
          "If these details are incorrect please contact your HR to make corrections."
        }
        actionButtonText={effectiveGreetingData?.buttonText}
        actionButtonDisabled={dashboardEnrollmentView.action === "DISABLED"}
        infoLines={effectiveGreetingData?.infoLines}
        daysLeft={daysLeft}
        onStartEnrollment={handleStartEnrollment}
        isLoading={isEmployeeDetailsLoading || isPoliciesLoading}
      />
      <DashboardContainer ref={dashboardContainerRef}>
        {!addOnlyDependents && (
        <DashboardBenefitsSection
          addOnlyDependents={addOnlyDependents}
          title={
            dashboardContent?.benefitsSections?.compulsoryBenefits?.heading
          }
          subtitle={
            dashboardContent?.benefitsSections?.compulsoryBenefits?.subheading
          }
          features={
            dashboardContent?.benefitsSections?.compulsoryBenefits?.features
          }
          buttonText={
            // dashboardContent?.benefitsSections?.compulsoryBenefits?.buttonText
            "View Policy Details"
          }
          overAllEnrollmentStatus={overallEnrollmentStatus}
          onOpenPolicyFeatures={(policy) => {
            if (!policy?.policyId) return;
            navigate(`/policy-features/${policy.policyId}`, {
              state: {
                policyInfo: policy,
                showContinueEnrollment: true,
              },
            });
          }}
          onAccordionControlReady={(expandFn) => {
            expandFirstAccordionRef.current = expandFn;
          }}
        />
        )}
        <EnrollmentBannerCard
          header={
            dashboardContent?.enrollmentBanners?.banner1?.header ||
            (dashboardEnrollmentView.action === "VIEW"
              ? `The enrolment window for ${enrollmentYearLabel ?? policyYearLabel} is now closed`
              : `Enrolment window for ${enrollmentYearLabel ?? policyYearLabel} is open`)
          }
          subheader={
            dashboardContent?.enrollmentBanners?.banner1?.subheader ||
            (dashboardEnrollmentView.action === "VIEW"
              ? "You can view your enrolled benefits anytime in the portal."
              : dashboardEnrollmentView.action === "EDIT"
              ? "You can now review and update your benefits during the enrolment period"
              : "You can now review and choose your benefits during the enrolment period")
          }
          buttonText={effectiveGreetingData?.buttonText}
          background={
            dashboardContent?.enrollmentBanners?.banner1?.background ||
            "linear-gradient(90deg, #11727F 0%, #2C7F98 100%)"
          }
          border={"#8131FF"}
          onButtonClick={handleStartEnrollment}
        />
          <WellnessHub userName={employeeDetails?.employeeName || userName} />
         {!addOnlyDependents && (
            <FAQ
              title="Frequently Asked Questions"
              subtitle="Quick answers to common benefit questions."
              showViewMore={true}
              limit={5}
              faqsData={dashboardFaqs}
            />
          )}
        <PolicyPortingBanner />
        {!addOnlyDependents && (
          <EnrollmentBannerCard
            header={
              dashboardContent?.enrollmentBanners?.banner2?.header ||
              "Need help understanding your benefits?"
            }
            subheader={
              dashboardContent?.enrollmentBanners?.banner2?.subheader ||
              "Explore your coverage details and optional add-ons in one place"
            }
            buttonText={"View Policy Details"}
            background={
              dashboardContent?.enrollmentBanners?.banner2?.background ||
              "linear-gradient(90deg, #194E90 0%, #2D5B99 100%)"
            }
            border={"#63E2C8"}
            onButtonClick={() => navigate("/policy-features")}
          />
        )}
        {/* Show terms and conditions popup on fresh login */}
        {environment.featureFlag.FF_IBP_CONSENT_MANAGEMENT && <TermsAndConditionsPopup />}
      </DashboardContainer>
    </>
  );
};

export default Dashboard;
