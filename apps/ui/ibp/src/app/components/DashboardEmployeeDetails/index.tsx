import React, { useState, useEffect } from "react";
import { CircularProgress } from "@mui/material";
import { apiRequest, endPoints, formatDate } from "@ui/ui-lib";
import { useDispatch } from "react-redux";
import { setToastMessage } from "../../redux/slice";
import {
  EmployeeActionButton,
  // EmployeeCollapsedButton,
  // EmployeeCollapsedContent,
  // EmployeeCollapsedTitle,
  EmployeeDetailsContainer,
  EmployeeDetailsContent,
  EmployeeDetailsLeft,
  EmployeeDetailsRight,
  EmployeeIllustration,
  EmployeeInfoCard,
  EmployeeInfoText,
  InProgressInfoText,
  EnrolledInfoText,
  EmployeeMetaIcon,
  EmployeeMetaItem,
  EmployeeMetaRow,
  EmployeeName,
  EmployeeNote,
  EnrollmentText,
  EnrollmentTextContainer,
  SlotWrapperSpan,
  EmployeeIllustrationWrapper,
  CounterBox,
  HorizontalDivider,
  CounterBoxSection,
  StepperContainer,
  StepWrapper,
  StepIconContainer,
  StepIcon,
  StepLabel,
  StepConnector,
  InProgressActionButton,
  EnrolledContent,
  EnrolledTextGroup,
  EnrolledIllustrationWrapper,
  EmployeeNoteDivider,
  EmployeeOptionalMetaRow,
  EmployeeOptionalNote,
  LoaderComponent,
  EnrolledActionButton,
  EnrolledWellnessButton,
} from "./styles";
import employeeIllustration from "../../assets/pngs/enrollment-deadline-illustration.png";
import phoneIcon from "../../assets/svgs/phone.svg";
import cakeIcon from "../../assets/svgs/cake.svg";
import identificationCardIcon from "../../assets/svgs/identification-card.svg";
import envelopeSimpleIcon from "../../assets/svgs/envelope-simple.svg";
import { useNavigate } from "react-router-dom";
import { useCompanyConfig } from "../../hooks/useCompanyConfig";
import AnimatedCounter from "../../common/AnimatedCounter";
import loginPortalCompleted from "../../assets/svgs/login-portal-completed.svg";
import loginPortalInProgress from "../../assets/svgs/login-portal-in-progress.svg";
import loginPortalNotStarted from "../../assets/svgs/login-portal-not-started.svg";
import reviewBenefitsCompleted from "../../assets/svgs/review-benefits-completed.svg";
import reviewBenefitsInProgress from "../../assets/svgs/review-benefits-in-progress.svg";
import reviewBenefitsNotStarted from "../../assets/svgs/review-benefits-not-started.svg";
import addDependentCompleted from "../../assets/svgs/add-dependent-completed.svg";
import addDependentInProgress from "../../assets/svgs/add-dependent-in-progress.svg";
import addDependentNotStarted from "../../assets/svgs/add-dependent-not-started.svg";
import addTopUpCompleted from "../../assets/svgs/add-top-up-completed.svg";
import addTopUpInProgress from "../../assets/svgs/add-top-up-in-progress.svg";
import addTopUpNotStarted from "../../assets/svgs/add-top-up-not-started.svg";
import submitEnrollmentCompleted from "../../assets/svgs/submit-enrollment-completed.svg";
import submitEnrollmentInProgress from "../../assets/svgs/submit-enrollment-in-progress.svg";
import submitEnrollmentNotStarted from "../../assets/svgs/submit-enrollment-not-started.svg";
import confirmationCompleted from "../../assets/svgs/confirmation-completed.svg";
import confirmationInProgress from "../../assets/svgs/confirmation-in-progress.svg";
import confirmationNotStarted from "../../assets/svgs/confirmation-not-started.svg";
import ArrowIcon from "../../assets/svgs/pagination-left.svg";

interface EmployeeDetailsProps {
  name?: string;
  employeeCode?: string;
  dateOfBirth?: string;
  email?: string;
  phone?: string;
  // isCollapsed?: boolean;
  // onToggle?: () => void;
  enrolmentImg?: string;
  greetingPrefix?: string;
  alternativePhoneNumber?: string;
  alternativeEmail?: string;
  noteText?: string;
  actionButtonText?: string;
  // collapsedTitle?: string;
  // collapsedButtonText?: string;
  infoLines?: string[];
  overAllEnrollmentStatus?: string;
  currentStepIndex?: number;
  daysLeft?: number;
  actionButtonDisabled?: boolean;
  enrollmentSteps?: Array<{
    step: number;
    name: string;
    completed: boolean;
    current: boolean;
  }>;
  hasCompletedEnrollmentPolicy?: boolean;
  addOnlyDependents?: boolean;
  onStartEnrollment?: () => void;
}

const DashboardEmployeeDetails: React.FC<EmployeeDetailsProps> = ({
  name: _name = "--",
  employeeCode = "--",
  dateOfBirth = "--",
  email = "--",
  phone = "--",
  // isCollapsed = false,
  // onToggle,
  enrolmentImg = employeeIllustration,
  overAllEnrollmentStatus = "EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED",
  greetingPrefix = "Hello",
  alternativePhoneNumber,
  alternativeEmail,
  noteText = "If these details are incorrect please contact your HR to make corrections.",
  actionButtonText = "Start Your Enrolment",
  // collapsedTitle = "14 days remaining",
  // collapsedButtonText = "Start Your Enrolment",
  infoLines = ["Open until 28 Feb 26 ", "Enrol in 3 policies now!  "],
  currentStepIndex = 0,
  daysLeft = 14,
  actionButtonDisabled = false,
  enrollmentSteps = [],
  hasCompletedEnrollmentPolicy = false,
  addOnlyDependents = false,
  onStartEnrollment,
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { portalDashboardConfig } = useCompanyConfig();
  const isWellnessBannerEnabled =
    portalDashboardConfig?.wellnessBanner?.enabled === true;
  const [isWellnessLoading, setIsWellnessLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Opens the Alyve wellness portal via magic-URL SSO, matching the header's
  // "Wellness" action.
  const openWellness = async () => {
    if (isWellnessLoading) return;
    const wellnessUser = JSON.parse(sessionStorage.getItem("user") || "{}");
    setIsWellnessLoading(true);
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(
        "<html><body style='font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f8fafc'><p style='color:#555;font-size:15px'>Redirecting to Wellness Portal…</p></body></html>",
      );
      win.document.close();
    }
    try {
      const res = await apiRequest(endPoints.alyveWellnessUrl, {
        method: "POST",
        data: {
          appKey: "alyve-wellness",
          dynamicFields: {
            mobile:
              wellnessUser?.phone ??
              wellnessUser?.mobile ??
              wellnessUser?.phoneNumber ??
              "",
            name: wellnessUser?.employeeName ?? wellnessUser?.fullName ?? "",
            gender: String(
              wellnessUser?.gender?.value ?? wellnessUser?.gender ?? "",
            ).toLowerCase(),
            dob: (wellnessUser?.dateOfBirth ?? wellnessUser?.dob ?? "")
              .toString()
              .slice(0, 10),
          },
        },
      });
      const redirectUrl =
        (res as any)?.data?.jsonData?.redirect_url ??
        (res as any)?.jsonData?.redirect_url;
      if (redirectUrl && win && !win.closed) {
        win.location.replace(redirectUrl);
        win.focus();
      } else {
        win?.close();
        const msg = (res as any)?.data?.message ?? (res as any)?.message;
        dispatch(
          setToastMessage({
            message:
              msg || "Unable to open Wellness portal. Please try again.",
            type: "error",
          }),
        );
      }
    } catch (err: any) {
      win?.close();
      const msg = err?.response?.data?.message ?? err?.message;
      dispatch(
        setToastMessage({
          message: msg || "Unable to open Wellness portal. Please try again.",
          type: "error",
        }),
      );
    } finally {
      setIsWellnessLoading(false);
    }
  };
  const [prevStatus, setPrevStatus] = useState(overAllEnrollmentStatus);
  const [liveAlternateEmail, setLiveAlternateEmail] = useState<string | undefined>(
    alternativeEmail,
  );
  const [liveAlternatePhone, setLiveAlternatePhone] = useState<string | undefined>(
    alternativePhoneNumber,
  );

  useEffect(() => {
    const readFromSession = () => {
      try {
        const user = JSON.parse(sessionStorage.getItem("user") || "{}");
        setLiveAlternateEmail(
          user?.alternateEmail ??
            user?.additionalDetails?.["Alternate Email"] ??
            user?.additionalDetails?.alternateEmail ??
            alternativeEmail,
        );
        setLiveAlternatePhone(
          user?.alternatePhoneNumber ??
            user?.additionalDetails?.["Alternate Phone"] ??
            user?.additionalDetails?.alternatePhone ??
            alternativePhoneNumber,
        );
      } catch {
        setLiveAlternateEmail(alternativeEmail);
        setLiveAlternatePhone(alternativePhoneNumber);
      }
    };

    readFromSession();
    window.addEventListener("ibp:user-updated", readFromSession);
    return () => {
      window.removeEventListener("ibp:user-updated", readFromSession);
    };
  }, [alternativeEmail, alternativePhoneNumber]);
  
  // Handle status change with loading delay
  useEffect(() => {
    if (prevStatus !== overAllEnrollmentStatus) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setPrevStatus(overAllEnrollmentStatus);
        setIsTransitioning(false);
      }, 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [overAllEnrollmentStatus, prevStatus]);
  
  // const toggleCollapsed = useCallback(() => {
  //   onToggle?.();
  // }, [onToggle]);

  const isInProgress =
    overAllEnrollmentStatus === "EMPLOYEE_ENROLLMENT_STATUS_IN_PROGRESS";
  const isEnrolled =
    overAllEnrollmentStatus === "EMPLOYEE_ENROLLMENT_STATUS_ENROLLED";
  const isStartEnrollmentButton =
    actionButtonText.trim().toLowerCase().replace(/\s+/g, " ") ===
      "start your enrollment" ||
    actionButtonText.trim().toLowerCase().replace(/\s+/g, " ") ===
      "start your enrolment";

  const stepIconSets = [
    {
      completed: loginPortalCompleted,
      inProgress: loginPortalInProgress,
      notStarted: loginPortalNotStarted,
    },
    {
      completed: reviewBenefitsCompleted,
      inProgress: reviewBenefitsInProgress,
      notStarted: reviewBenefitsNotStarted,
    },
    {
      completed: addDependentCompleted,
      inProgress: addDependentInProgress,
      notStarted: addDependentNotStarted,
    },
    {
      completed: addTopUpCompleted,
      inProgress: addTopUpInProgress,
      notStarted: addTopUpNotStarted,
    },
    {
      completed: submitEnrollmentCompleted,
      inProgress: submitEnrollmentInProgress,
      notStarted: submitEnrollmentNotStarted,
    },
    {
      completed: confirmationCompleted,
      inProgress: confirmationInProgress,
      notStarted: confirmationNotStarted,
    },
  ];

  const enrollmentStepLabels = [
    "1. Login Portal",
    "2. Review Benefits",
    "3. Add Dependents",
    "4. Select Optional Plans",
    "5. Submit Enrolment",
    "6. Receive Confirmation",
  ];

  const getDefaultStepState = (index: number) => {
    const stepNumber = index + 1;

    if (enrollmentSteps && enrollmentSteps.length > 0) {
      let highestActiveIndex = -1;
      enrollmentSteps.forEach((step, i) => {
        const resolvedIndex =
          Number.isFinite(Number(step?.step)) && Number(step?.step) > 0
            ? Number(step.step) - 1
            : i;
        if (step.completed || step.current) {
          highestActiveIndex = Math.max(highestActiveIndex, resolvedIndex);
        }
      });

      if (highestActiveIndex === -1) {
        return "notStarted";
      }

      if (index < highestActiveIndex) return "completed";

      const stepData =
        enrollmentSteps.find((step) => Number(step?.step) === stepNumber) ||
        enrollmentSteps[index];

      if (stepData) {

        if (index === 5 && stepData.current) {
          return "completed";
        }

        if (stepData.completed) return "completed";
        if (stepData.current) return "inProgress";
      }

      return "notStarted";
    }

    if (currentStepIndex <= 0) return "notStarted";
    if (index < currentStepIndex) return "completed";
    if (index === currentStepIndex) return "inProgress";
    return "notStarted";
  };

  const getRawStepState = (index: number) => {
    if (index === 0) return "completed";
    // if (index >= 4 && hasCompletedEnrollmentPolicy) return "completed";
    return getDefaultStepState(index);
  };

  const maxCompletedIndex = enrollmentStepLabels.reduce(
    (max, _, i) => (getRawStepState(i) === "completed" ? i : max),
    -1
  );

  const getStepState = (index: number) => {
    if (index < maxCompletedIndex) return "completed";
    return getRawStepState(index);
  };

  return (
    <EmployeeDetailsContainer
    // role="button"
    // tabIndex={0}
    // onClick={toggleCollapsed}
    // onKeyDown={(event) => {
    //   if (event.key === "Enter" || event.key === " ") {
    //     event.preventDefault();
    //     toggleCollapsed();
    //   }
    // }}
    // aria-expanded={!isCollapsed}
    >
      {/* {isCollapsed ? (
        <EmployeeCollapsedContent>
          <EmployeeCollapsedTitle>{collapsedTitle}</EmployeeCollapsedTitle>
          <EmployeeCollapsedButton
            onClick={() => navigate("/unified-enrollment")}
          >
            {collapsedButtonText}
            <EmployeeMetaIcon
              src={ArrowIcon}
              alt="icon"
            />
          </EmployeeCollapsedButton>
        </EmployeeCollapsedContent>
      ) : ( */}
        <EmployeeDetailsContent>
          <EmployeeDetailsLeft>
            <EmployeeName>{greetingPrefix}</EmployeeName>
            <EmployeeMetaRow>
              <EmployeeMetaItem>
                <EmployeeMetaIcon src={identificationCardIcon} alt="" />
                {employeeCode}
              </EmployeeMetaItem>
              <EmployeeNoteDivider>|</EmployeeNoteDivider>
              <EmployeeMetaItem>
                <EmployeeMetaIcon src={cakeIcon} alt="" />
                {formatDate(dateOfBirth, "MMM YYYY")}
              </EmployeeMetaItem>
              {email && (
                <>
                  <EmployeeNoteDivider>|</EmployeeNoteDivider>
                  <EmployeeMetaItem>
                    <EmployeeMetaIcon
                      isPipe={false}
                      src={envelopeSimpleIcon}
                      alt=""
                    />
                    {email}
                  </EmployeeMetaItem>
                </>
              )}
              {phone && (
                <>
                  <EmployeeNoteDivider>|</EmployeeNoteDivider>
                  <EmployeeMetaItem>
                    <EmployeeMetaIcon src={phoneIcon} alt="" />
                    {phone}
                  </EmployeeMetaItem>
                </>
              )}
            <EmployeeOptionalMetaRow>
                         {liveAlternateEmail && (
                <>
                  <EmployeeOptionalNote>Alternative Email: {liveAlternateEmail}</EmployeeOptionalNote>
                  <EmployeeNoteDivider>|</EmployeeNoteDivider>
                </>
              )}
              {liveAlternatePhone && (
                <EmployeeOptionalNote>Alternative Phone: {liveAlternatePhone}</EmployeeOptionalNote>
              )}
              </EmployeeOptionalMetaRow>
              </EmployeeMetaRow>
            <EmployeeNote>{noteText}</EmployeeNote>
            {!addOnlyDependents && (
            <StepperContainer>
              {enrollmentStepLabels.map((label, index) => {
                const stepState = getStepState(index);
                const isCompleted = stepState === "completed";
                const stepIcon =
                  stepState === "completed"
                    ? stepIconSets[index].completed
                    : stepState === "inProgress"
                    ? stepIconSets[index].inProgress
                    : stepIconSets[index].notStarted;
                return (
                  <StepWrapper key={index}>
                    {index < enrollmentStepLabels.length - 1 && <StepConnector />}
                    <StepIconContainer completed={isCompleted} customIcon>
                      <StepIcon src={stepIcon} alt="" />
                    </StepIconContainer>
                    <StepLabel>{label}</StepLabel>
                  </StepWrapper>
                );
              })}
            </StepperContainer>
            )}
          </EmployeeDetailsLeft>
          <EmployeeDetailsRight
            isEnrolled={isEnrolled}
            isInProgress={isInProgress}
          >
            <EmployeeInfoCard>
              {isTransitioning ? (
                <LoaderComponent>
                  <CircularProgress size={40} />
                </LoaderComponent>
              ) : isEnrolled ? (
                <EnrolledContent>
                  <EnrolledTextGroup>
                    <EnrolledInfoText>
                      {infoLines.map((line, index) => (
                        <React.Fragment key={`${line}-${index}`}>
                          {line}
                          {index < infoLines.length - 1 && <br />}
                        </React.Fragment>
                      ))}
                    </EnrolledInfoText>
                    <EnrolledActionButton
                      compactWidth={isStartEnrollmentButton}
                      disabled={actionButtonDisabled}
                      onClick={onStartEnrollment || (() => navigate("/unified-enrollment"))}
                    >
                      {actionButtonText}
                      <EmployeeMetaIcon src={ArrowIcon} alt="icon" />
                    </EnrolledActionButton>
                    {isWellnessBannerEnabled && (
                      <EnrolledWellnessButton
                        onClick={openWellness}
                        disabled={isWellnessLoading}
                      >
                        {isWellnessLoading ? "Loading..." : "Explore Wellness"}
                        <EmployeeMetaIcon src={ArrowIcon} alt="icon" />
                      </EnrolledWellnessButton>
                    )}
                  </EnrolledTextGroup>
                  <EnrolledIllustrationWrapper>
                    <EmployeeIllustration
                      src={enrolmentImg}
                      alt="Employee details illustration"
                      inProgress
                      isEnrolled={isEnrolled}
                    />
                  </EnrolledIllustrationWrapper>
                </EnrolledContent>
              ) : isInProgress ? (
                <>
                  <EmployeeIllustrationWrapper inProgress>
                    <InProgressInfoText>
                      {infoLines.map((line, index) => (
                        <React.Fragment key={`${line}-${index}`}>
                          {line}
                          {index < infoLines.length - 1 && <br />}
                        </React.Fragment>
                      ))}
                    </InProgressInfoText>
                    <EmployeeIllustration
                      src={enrolmentImg}
                      alt="Employee details illustration"
                      inProgress
                    />
                    <EnrollmentTextContainer
                      overAllEnrollmentStatus={overAllEnrollmentStatus}
                      inProgress
                    >
                      <EnrollmentText>
                        <AnimatedCounter value={daysLeft} speed={10} />
                      </EnrollmentText>
                      <SlotWrapperSpan>Days left</SlotWrapperSpan>
                    </EnrollmentTextContainer>
                  </EmployeeIllustrationWrapper>
                  <InProgressActionButton
                    compactWidth={isStartEnrollmentButton}
                    disabled={actionButtonDisabled}
                    onClick={onStartEnrollment || (() => navigate("/unified-enrollment"))}
                  >
                    {actionButtonText}
                    <EmployeeMetaIcon src={ArrowIcon} alt="icon" />
                  </InProgressActionButton>
                </>
              ) : (
                <>
                  <EmployeeIllustrationWrapper>
                    <EmployeeIllustration
                      src={enrolmentImg}
                      alt="Employee details illustration"
                    />
                    <CounterBoxSection>
                      <CounterBox>
                        <EmployeeInfoText>
                          {infoLines.map((line, index) => (
                            <React.Fragment key={`${line}-${index}`}>
                              {line}
                              {index < infoLines.length - 1 && <br />}
                            </React.Fragment>
                          ))}
                        </EmployeeInfoText>
                        <EnrollmentTextContainer
                          overAllEnrollmentStatus={overAllEnrollmentStatus}
                        >
                          <EnrollmentText>
                              <AnimatedCounter value={daysLeft} speed={10} />
                          </EnrollmentText>
                          <SlotWrapperSpan>Days left</SlotWrapperSpan>
                        </EnrollmentTextContainer>
                      </CounterBox>
                      <EmployeeActionButton
                        compactWidth={isStartEnrollmentButton}
                        disabled={actionButtonDisabled}
                        onClick={onStartEnrollment || (() => navigate("/unified-enrollment"))}
                      >
                      {actionButtonText}
                      <EmployeeMetaIcon src={ArrowIcon} alt="icon" />
                    </EmployeeActionButton>
                  </CounterBoxSection>
                </EmployeeIllustrationWrapper>
                <HorizontalDivider />
              </>
            )}
          </EmployeeInfoCard>
        </EmployeeDetailsRight>
      </EmployeeDetailsContent>
      {/* )} */}
    </EmployeeDetailsContainer>
  );
};

export default DashboardEmployeeDetails;
