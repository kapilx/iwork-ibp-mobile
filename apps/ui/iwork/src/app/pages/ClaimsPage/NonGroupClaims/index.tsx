import {
  cardSections,
  CommonBreadcrumb,
  CustomModal,
  endPoints,
  HTTP_METHODS,
  Loader,
  NO_DATA_FOUND,
  setToastMessage,
  SummaryCard,
  useApiMutation,
  useApiQuery,
  VALIDATION_ERROR_MESSAGE_FOR_NON_GMC,
} from "@ui/ui-lib";
import type { NestedGroupedDataCollectionHandle } from "@ui/ui-lib";
import { useNestedStepper } from "../../../components/NestedStepper/useNestedStepper";
import {
  PolicyDetailsContainer,
  priorityStyleMap,
} from "../../CompanyPage/PolicyDetails/styles";
import {
  BreadCrumbWrapper,
  EndorsementProcessContainer,
  LoaderContainer,
  NestedStepperWrapper,
} from "../styles";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { policyDetailsViewMoreItems } from "../../CompanyPage/PolicyDetails/detailsConfig";
import { CircularProgress } from "@mui/material";
import EndorsementProcessWrapper from "../../../components/EndorsementProcessWrapper";
import NestedStepper from "../../../components/NestedStepper";
import {
  ClaimsNestedStepperConfig,
  tranformNonGroupClaimsStepperConfig,
} from "./config";
import { claimsUploadBreadcrumbConfig } from "../config";
import { useEffect, useMemo, useRef, useState } from "react";
import { ALERT_MESSAGES, NONGROUP_CLAIMS_STEP_KEYS } from "../../../constants";
import ClaimInformed from "./StepComponents/ClaimInformed";
import FonlSentToInsurer from "./StepComponents/FonlSendToInsurer";
import LossAdjusterAppointment from "./StepComponents/LossAdjusterAppointment";
import SurveyCompleted from "./StepComponents/SurveyCompleted";
import DocumentsCollected from "./StepComponents/DocumentsCollected/index.js";
import JointInspectionReport from "./StepComponents/JointInspectionReport";
import LetterOfRequirement from "./StepComponents/LetterOfRequirement";
import TrackDocumentSubmission from "./StepComponents/TrackDocumentSubmission";
import AssessmentReport from "./StepComponents/AssessmentReport";
import ValidationOfReport from "./StepComponents/ValidationOfReport";
import ClaimSettlement from "./StepComponents/ClaimSettlement";
import DischargeVoucherGeneration from "./StepComponents/DischargeVoucherGeneration";
import CustomerAgreement from "./StepComponents/CustomerAgreement";
import VoucherToInsurer from "./StepComponents/VoucherToInsurer";
import ClaimPayment from "./StepComponents/ClaimPayment";
import { useDispatch } from "react-redux";
import { StateEnum } from "../../../components/NestedStepper/RenderComponent";
import { ContactPosition } from "@ui/ui-lib/commonComponents/ContactCard/styles";

type DocumentUploadContext = {
  companyId?: number;
  policyId?: number;
  claimActivityId?: number;
  onUploadSuccess?: () => void;
};

const DOCUMENT_UPLOAD_REQUIRED_MESSAGE =
  "Please upload a file before continuing.";

const DOCUMENT_UPLOAD_INVALID_FIELD_KEYS = new Set([
  "documentsCollected.claimDocuments",
  "documentSubmissionTracker.claimDocuments",
]);

enum EndorsementStatus {
  PENDING = "Pending",
  CURRENT = "Current",
  COMPLETED = "Completed",
}

const enhanceDocumentUploads = (
  config: any,
  context: DocumentUploadContext
) => {
  if (!Array.isArray(config)) return config;

  const injectIntoField = (field: any): any => {
    if (!field) return field;

    const { companyId, policyId, claimActivityId, onUploadSuccess } =
      context || {};

    let nextField = field;

    if (
      field?.type === "documentupload" ||
      (field?.type === "customcomponent" &&
        field?.componentProps?.componentKey === "DocumentTableField")
    ) {
      const mergedComponentProps = {
        ...field?.componentProps,
        ...(companyId !== undefined ? { companyId } : {}),
        ...(policyId !== undefined ? { policyId } : {}),
        ...(claimActivityId !== undefined ? { claimActivityId } : {}),
        ...(onUploadSuccess ? { onUploadSuccess } : {}),
      };

      nextField = {
        ...field,
        ...(companyId !== undefined ? { companyId } : {}),
        ...(policyId !== undefined ? { policyId } : {}),
        ...(claimActivityId !== undefined ? { claimActivityId } : {}),
        componentProps: mergedComponentProps,
      };
    }

    return nextField;
  };

  return config.map((group) => {
    if (!group?.config) return group;

    return {
      ...group,
      config: group.config.map(injectIntoField),
    };
  });
};

const NonGroupClaims = () => {
  const { policyId, claimId: claimIdParam } = useParams<{
    policyId: string;
    claimId?: string;
  }>();

  const location = useLocation();
  const navigate = useNavigate();

  const { from, companyId } = location.state ?? {};
  const numericPolicyId =
    policyId && !Number.isNaN(Number(policyId)) ? Number(policyId) : undefined;
  const [stepperData, setStepperData] = useState(() =>
    ClaimsNestedStepperConfig(companyId, numericPolicyId)
  );
  const [activeStepData, setActiveStepData] = useState<any>(null);
  const [isPutCall, setIsPutCall] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const currentStepNumber = 1;

  const currentStep = currentStepNumber;

  const currentStepDataFromApi = null;

  const parsedClaimId =
    claimIdParam && !Number.isNaN(Number(claimIdParam))
      ? Number(claimIdParam)
      : undefined;

  const { data: stepperDataFromApi, isLoading: stepperLoading } = useApiQuery({
    url: endPoints.nonGroupClaimActivityStepper(claimIdParam ?? null),
    queryKey: ["nonGroupClaimActivityStepper", claimIdParam],
  });

  const { data: activityStatusKeys, isLoading: activityLoading } = useApiQuery({
    url: endPoints.lookUpByName("NON_GROUP_CLAIM_ACTIVITY_STATUS"),
    queryKey: ["NON_GROUP_CLAIM_ACTIVITY_STATUS"],
  });

  const { data: policyDetailsData, isLoading: policyDetailsLoading } =
    useApiQuery({
      url: endPoints.getBasicDetailsByPolicyId(numericPolicyId),
      queryKey: [],
      enabled: !!numericPolicyId,
    });

  const policyCompanyId =
    policyDetailsData?.data?.headerDetails?.companyId ??
    policyDetailsData?.data?.companyId ??
    undefined;

  const baseStepperConfig = useMemo(
    () => ClaimsNestedStepperConfig(companyId, numericPolicyId),
    [companyId, numericPolicyId]
  );

  const nonGMCStatusLookupKeys = activityStatusKeys?.data.reduce(
    (acc, item) => {
      acc[item.lookUpKey] = item.lookUpKey;
      return acc;
    },
    {} as Record<string, string>
  );

  const {
    steps,
    selectedKey,
    openSteps,
    handleStepHeaderClick,
    handleItemClick,
    selectedStep,
    markComplete,
    handleNext,
    handleBack,
    activeStepIndex,
    setActiveStepIndex,
  } = useNestedStepper({
    stepsConfig: stepperData,
    autoSelectFirstStep: !Boolean(claimIdParam), // auto select first step only if claimId is not present
  });

  const flattenedStepItems = useMemo(() => {
    if (!Array.isArray(steps) || !steps.length) return [];

    return steps.flatMap((step) => {
      if (Array.isArray(step.items) && step.items.length > 0) {
        return step.items.map((item) => ({
          stepKey: step.key,
          itemKey: item.key,
        }));
      }

      return [{ stepKey: step.key, itemKey: step.key }];
    });
  }, [steps]);

  const totalStepCount = flattenedStepItems.length || steps.length || 1;

  const selectedStepKey = selectedStep?.key;

  const selectedStepNumber = useMemo(() => {
    if (!flattenedStepItems.length) return 1;

    if (selectedKey) {
      const itemIndex = flattenedStepItems.findIndex(
        (entry) => entry.itemKey === selectedKey
      );
      if (itemIndex !== -1) {
        return itemIndex + 1;
      }
    }

    if (selectedStepKey) {
      const stepIndex = flattenedStepItems.findIndex(
        (entry) => entry.stepKey === selectedStepKey
      );
      if (stepIndex !== -1) {
        return stepIndex + 1;
      }
    }

    return 1;
  }, [flattenedStepItems, selectedKey, selectedStepKey]);

  useEffect(() => {
    if (stepperDataFromApi?.data && activityStatusKeys?.data) {
      const transformedObj = tranformNonGroupClaimsStepperConfig(
        baseStepperConfig,
        stepperDataFromApi?.data,
        activityStatusKeys?.data
      );

      let flag = false; //checking if any step is in progress

      transformedObj.forEach((stage, index) => {
        if (
          stage.stageStatusKey ===
          nonGMCStatusLookupKeys?.NON_GROUP_CLAIM_ACTIVITY_IN_PROGRESS
        ) {
          const activeItem = stage?.items?.find(
            (item) =>
              item.activityStatusKey ===
              nonGMCStatusLookupKeys?.NON_GROUP_CLAIM_ACTIVITY_IN_PROGRESS
          );
          if (activeItem) {
            handleItemClick(activeItem?.activityKey);
            flag = true;
          } else {
            flag = true;
            handleStepHeaderClick(stage?.key);
          }
        }
      });

      if (!flag) {
        //if no step is in progress, select the first step
        const stage = transformedObj?.[0];
        if (stage) {
          handleStepHeaderClick(stage?.key);
        }
      }

      setStepperData(transformedObj);
      return;
    }

    setStepperData(baseStepperConfig);
  }, [stepperDataFromApi, activityStatusKeys?.data, baseStepperConfig]);

  useEffect(() => {
    const selectedItem = selectedStep?.items?.find(
      (item) => item.key === selectedKey
    );
    setActiveStepData(selectedItem);
  }, [selectedStep, selectedKey]);

  const isInitialLoading = useMemo(
    () => stepperLoading || activityLoading || policyDetailsLoading,
    [activityLoading, policyDetailsLoading, stepperLoading]
  );

  const derivedStatus:
    | EndorsementStatus.PENDING
    | EndorsementStatus.CURRENT
    | EndorsementStatus.COMPLETED = (() => {
    if (activeStepData?.activityStatusKey === "NON_GROUP_CLAIM_ACTIVITY_SUBMIT")
      return EndorsementStatus.COMPLETED;
    if (
      activeStepData?.activityStatusKey ===
        "NON_GROUP_CLAIM_ACTIVITY_IN_PROGRESS" &&
      !(activeStepData?.activityStatusKey === "NON_GROUP_CLAIM_ACTIVITY_SUBMIT")
    )
      return EndorsementStatus.CURRENT;
    return EndorsementStatus.PENDING;
  })();
  const formRef = useRef<any>(null);

  const renderStepComponent = () => {
    if (!selectedStep) return null;

    const selectedItem = activeStepData;

    if (!selectedItem) return null;

    const { key, config } = selectedItem;

    const inProgressStatusKey =
      nonGMCStatusLookupKeys?.NON_GROUP_CLAIM_ACTIVITY_IN_PROGRESS;

    const handleDocumentUploadSuccess = () => {
      if (!inProgressStatusKey) {
        return;
      }

      void handleSubmit(inProgressStatusKey);
    };

    const documentContext: DocumentUploadContext = {
      policyId: numericPolicyId,
      companyId: policyCompanyId,
      claimActivityId: selectedItem?.claimActivityId,
      onUploadSuccess: handleDocumentUploadSuccess,
    };

    const enhancedConfig = enhanceDocumentUploads(config, documentContext);

    switch (key) {
      case NONGROUP_CLAIMS_STEP_KEYS.CLAIM_INFORMED:
        return (
          <ClaimInformed
            config={enhancedConfig}
            selectedStep={selectedStep}
            selectedItem={selectedItem}
            ref={formRef}
            setIsPutCall={setIsPutCall}
          />
        );
      case NONGROUP_CLAIMS_STEP_KEYS.FONL_SEND_TO_INSURER:
        return (
          <FonlSentToInsurer
            config={enhancedConfig}
            selectedStep={selectedStep}
            selectedItem={selectedItem}
            ref={formRef}
            setIsPutCall={setIsPutCall}
          />
        );
      case NONGROUP_CLAIMS_STEP_KEYS.LOSS_ADJUSTOR_APPOINTED:
        return (
          <LossAdjusterAppointment
            config={enhancedConfig}
            selectedStep={selectedStep}
            selectedItem={selectedItem}
            ref={formRef}
            setIsPutCall={setIsPutCall}
          />
        );
      case NONGROUP_CLAIMS_STEP_KEYS.SURVEY_COMPLETED:
        return (
          <SurveyCompleted
            config={enhancedConfig}
            selectedStep={selectedStep}
            selectedItem={selectedItem}
            ref={formRef}
            setIsPutCall={setIsPutCall}
          />
        );
      case NONGROUP_CLAIMS_STEP_KEYS.DOCUMENTS_COLLECTED:
        return (
          <DocumentsCollected
            config={enhancedConfig}
            selectedStep={selectedStep}
            selectedItem={selectedItem}
            ref={formRef}
            setIsPutCall={setIsPutCall}
          />
        );
      case NONGROUP_CLAIMS_STEP_KEYS.JOINT_INSPECTION_REPORT:
        return (
          <JointInspectionReport
            config={enhancedConfig}
            selectedStep={selectedStep}
            selectedItem={selectedItem}
            ref={formRef}
            setIsPutCall={setIsPutCall}
          />
        );
      case NONGROUP_CLAIMS_STEP_KEYS.LETTER_OF_REQUIREMENTS:
        return (
          <LetterOfRequirement
            config={enhancedConfig}
            selectedStep={selectedStep}
            selectedItem={selectedItem}
            ref={formRef}
            setIsPutCall={setIsPutCall}
          />
        );
      case NONGROUP_CLAIMS_STEP_KEYS.TRACK_DOCUMENT_SUBMISSION:
        return (
          <TrackDocumentSubmission
            config={enhancedConfig}
            selectedStep={selectedStep}
            selectedItem={selectedItem}
            ref={formRef}
            setIsPutCall={setIsPutCall}
          />
        );
      case NONGROUP_CLAIMS_STEP_KEYS.ASSESSMENT_REPORT:
        return (
          <AssessmentReport
            config={enhancedConfig}
            selectedStep={selectedStep}
            selectedItem={selectedItem}
            ref={formRef}
            setIsPutCall={setIsPutCall}
          />
        );
      case NONGROUP_CLAIMS_STEP_KEYS.VALIDATION_OF_REPORT:
        return (
          <ValidationOfReport
            config={enhancedConfig}
            selectedStep={selectedStep}
            selectedItem={selectedItem}
            ref={formRef}
            setIsPutCall={setIsPutCall}
          />
        );
      case NONGROUP_CLAIMS_STEP_KEYS.CLAIM_SETTLEMENT:
        return (
          <ClaimSettlement
            config={enhancedConfig}
            selectedStep={selectedStep}
            selectedItem={selectedItem}
            ref={formRef}
            setIsPutCall={setIsPutCall}
          />
        );
      case NONGROUP_CLAIMS_STEP_KEYS.DISCHARGE_VOUCHER_GENERATION:
        return (
          <DischargeVoucherGeneration
            config={enhancedConfig}
            selectedStep={selectedStep}
            selectedItem={selectedItem}
            ref={formRef}
            setIsPutCall={setIsPutCall}
          />
        );
      case NONGROUP_CLAIMS_STEP_KEYS.CUSTOMER_AGREEMENT:
        return (
          <CustomerAgreement
            config={enhancedConfig}
            selectedStep={selectedStep}
            selectedItem={selectedItem}
            ref={formRef}
            setIsPutCall={setIsPutCall}
          />
        );
      case NONGROUP_CLAIMS_STEP_KEYS.VOUCHER_TO_INSURER:
        return (
          <VoucherToInsurer
            config={enhancedConfig}
            selectedStep={selectedStep}
            selectedItem={selectedItem}
            ref={formRef}
            setIsPutCall={setIsPutCall}
          />
        );
      case NONGROUP_CLAIMS_STEP_KEYS.CLAIM_PAYMENT:
        return (
          <ClaimPayment
            config={enhancedConfig}
            selectedStep={selectedStep}
            selectedItem={selectedItem}
            ref={formRef}
            setIsPutCall={setIsPutCall}
          />
        );
      default:
        return <div>{NO_DATA_FOUND}</div>;
    }
  };

  const dispatch = useDispatch();

  const mutation = useApiMutation({
    config: {
      onSuccess: (response) => {
        const responseData = response?.data ?? response;
        const createdClaimId = responseData?.claimId;

        const successMessageSource = response?.message;
        const successMessage = Array.isArray(successMessageSource)
          ? successMessageSource[0]
          : successMessageSource;

        if (successMessage) {
          dispatch(setToastMessage(successMessage));
        }

        if (
          createdClaimId &&
          numericPolicyId &&
          (!parsedClaimId || createdClaimId !== parsedClaimId)
        ) {
          navigate(
            `/${numericPolicyId}/upload-non-group-claims/${createdClaimId}`,
            {
              state: location.state,
              replace: true,
            }
          );
        }
      },
      onError: (error) => {
        const errorMessage = Array.isArray(error?.message)
          ? error.message[0]
          : error?.message ?? ALERT_MESSAGES.GENERIC_ERROR;
        dispatch(setToastMessage(errorMessage));
      },
    },
  });

  const handleSubmit = async (statusKey: string) => {
    if (mutation.isPending || mutation.isLoading) {
      return;
    }

    let isValid: boolean;
    let nestedFormData: Awaited<
      ReturnType<NonNullable<NestedGroupedDataCollectionHandle["submitAll"]>>
    > | null = null;

    if (
      statusKey === nonGMCStatusLookupKeys?.NON_GROUP_CLAIM_ACTIVITY_IN_PROGRESS
    ) {
      isValid = true;
    } else {
      //else-case CLAIM_ACTIVITY_STATUS.SUBMIT then we neeed to validate the form
      nestedFormData = await formRef?.current?.submitAll?.();
      isValid = nestedFormData?.isAllValid || false;
    }

    if (!isValid) {
      const invalidFields = nestedFormData?.invalidFields ?? [];
      const requiresDocumentUpload = invalidFields.some((field) =>
        DOCUMENT_UPLOAD_INVALID_FIELD_KEYS.has(field)
      );

      dispatch(
        setToastMessage(
          requiresDocumentUpload
            ? DOCUMENT_UPLOAD_REQUIRED_MESSAGE
            : VALIDATION_ERROR_MESSAGE_FOR_NON_GMC
        )
      );
      return;
    }

    const data = formRef?.current?.getPayload?.().body ?? {};

    if (!numericPolicyId) {
      console.warn("Policy id is missing while submitting non-group claim");
      return false;
    }

    const payload = {
      claimActivityId: activeStepData?.claimActivityId,
      policyId: numericPolicyId,
      statusKey,
      data,
      ...(parsedClaimId ? { claimId: parsedClaimId } : {}),
    };

    mutation.mutate(
      {
        endpoint:
          Boolean(claimIdParam) && isPutCall
            ? endPoints.nonGroupClaimActivityMetaById(
                activeStepData?.claimActivityId
              )
            : endPoints.nonGroupClaimActivityMeta,
        method: isPutCall ? HTTP_METHODS.PUT : HTTP_METHODS.POST,
        data: payload,
      },
      {
        onSuccess(data, variables, onMutateResult, context) {
          if (
            statusKey ===
            nonGMCStatusLookupKeys?.NON_GROUP_CLAIM_ACTIVITY_SUBMIT
          ) {
            updateStepperData(statusKey);
            markComplete(selectedKey);
            handleNext();

            // Check if all steps are completed after update
            setTimeout(() => {
              setStepperData((currentStepperData) => {
                const allStagesCompleted = currentStepperData.every(
                  (stage) => stage.stepState === StateEnum.COMPLETED
                );

                if (allStagesCompleted) {
                  setShowSuccessModal(true);
                }

                return currentStepperData;
              });
            }, 100);
          } else {
            setIsPutCall(true); //once saved in draft mode, subsequent calls will be PUT
          }
        },
      }
    );
  };

  const updateStepperData = (statusKey: string) => {
    setStepperData((prev) => {
      const next = prev.map((stage) => {
        const stageCopy = { ...stage };
        if (stage.items) {
          stageCopy.items = stage.items.map((item) => ({ ...item }));
        }
        return stageCopy;
      });
      // Find the current stage & item
      let currentStageIndex = -1;
      let currentItemIndex = -1;

      next.forEach((stage, sIndex) => {
        stage.items?.forEach((item, iIndex) => {
          if (item.activityKey === selectedKey) {
            currentStageIndex = sIndex;
            currentItemIndex = iIndex;
          }
        });
      });

      if (currentStageIndex === -1 || currentItemIndex === -1) return next;

      const currentStage = next[currentStageIndex];
      const currentItem = currentStage.items[currentItemIndex];

      // 1. Update current item to COMPLETED
      currentItem.stepState = StateEnum.COMPLETED;
      currentItem.activityStatusKey = statusKey;

      // 2. Check if all activities in this stage are completed
      const allCompleted = currentStage.items.every(
        (it) => it.stepState === StateEnum.COMPLETED
      );

      if (allCompleted) {
        // Mark stage as COMPLETED
        currentStage.stepState = StateEnum.COMPLETED;
        currentStage.stageStatusKey = statusKey;

        // 3. Move to next stage — set its first activity as ACTIVE
        const nextStage = next[currentStageIndex + 1];
        if (nextStage) {
          nextStage.stepState = StateEnum.ACTIVE;
          nextStage.stageStatusKey =
            nonGMCStatusLookupKeys.NON_GROUP_CLAIM_ACTIVITY_IN_PROGRESS;

          const firstItem = nextStage.items?.[0];
          if (firstItem) {
            firstItem.stepState = StateEnum.ACTIVE;
            firstItem.activityStatusKey =
              nonGMCStatusLookupKeys.NON_GROUP_CLAIM_ACTIVITY_IN_PROGRESS;
          }
        }
      } else {
        // 4. Current stage not complete → make next activity ACTIVE
        const nextItem = currentStage.items[currentItemIndex + 1];
        if (nextItem) {
          nextItem.stepState = StateEnum.ACTIVE;
          nextItem.activityStatusKey =
            nonGMCStatusLookupKeys.NON_GROUP_CLAIM_ACTIVITY_IN_PROGRESS;
        }

        // Keep current stage ACTIVE
        currentStage.stepState = StateEnum.ACTIVE;
        currentStage.stageStatusKey =
          nonGMCStatusLookupKeys.NON_GROUP_CLAIM_ACTIVITY_IN_PROGRESS;
      }

      return next;
    });
  };

  const isPageLoading = isInitialLoading || mutation.isPending;
  //in first step, we need to enable buttons when step is even in draft mode
  //in other steps, we need to enable buttons only when step is active
  const isButtonsDisabled =
    selectedKey === "claim_informed"
      ? activeStepData?.stepState === StateEnum.COMPLETED
      : activeStepData?.stepState !== StateEnum.ACTIVE;

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    // Navigate back to policy details page
    if (numericPolicyId) {
      navigate(`/policies/${numericPolicyId}`);
    }
  };

  return (
    <PolicyDetailsContainer>
      <BreadCrumbWrapper>
        <CommonBreadcrumb
          crumbs={
            numericPolicyId
              ? claimsUploadBreadcrumbConfig({
                  policyId: numericPolicyId,
                  from,
                })
              : []
          }
        />
      </BreadCrumbWrapper>
      <SummaryCard
        data={{
          ...policyDetailsData?.data?.headerDetails,
          displayName:
            policyDetailsData?.data?.headerDetails?.displayName ||
            "No Title Available",
          policyId:
            policyDetailsData?.data?.basicDetails?.insurerPolicyNumber ?? null,
          company: {
            companyName:
              policyDetailsData?.data?.headerDetails?.companyName ||
              "Unknown Company",
            companyId: policyDetailsData?.data?.headerDetails?.companyId || 0,
          },
        }}
        nameLink={""}
        sections={cardSections}
        headerConfig={{
          titleKey: "displayName",
          chip: [
            {
              key: "status",
              styleMap: priorityStyleMap,
              variant: "withDot",
              labelPrefix: "Status - ",
            },
          ],
        }}
        viewMore={true}
        viewMoreItems={policyDetailsViewMoreItems}
      />
      {isPageLoading && (
        <Loader data-testid="loader">
          <CircularProgress />
        </Loader>
      )}
      <EndorsementProcessContainer>
        <EndorsementProcessWrapper
          title={activeStepData?.label || selectedStep?.title}
          stepNumber={selectedStepNumber}
          totalSteps={totalStepCount}
          status={derivedStatus}
          claimId={parsedClaimId}
          backButtonProps={
            selectedKey === "claim_informed"
              ? { style: { visibility: "hidden" } }
              : {
                  label: "Previous",
                  onClick: handleBack,
                }
          }
          sendButtonProps={{
            label: "Save",
            disabled:
              mutation.isPending || mutation.isLoading || isButtonsDisabled,
            onClick: () =>
              handleSubmit(
                nonGMCStatusLookupKeys?.NON_GROUP_CLAIM_ACTIVITY_IN_PROGRESS
              ),
          }}
          nextButtonProps={{
            label: "Next",
            disabled:
              mutation.isPending || mutation.isLoading || isButtonsDisabled,
            onClick: () =>
              handleSubmit(
                nonGMCStatusLookupKeys?.NON_GROUP_CLAIM_ACTIVITY_SUBMIT
              ),
          }}
        >
          {renderStepComponent()}
        </EndorsementProcessWrapper>

        <NestedStepperWrapper>
          <NestedStepper
            steps={steps}
            openSteps={openSteps}
            selectedKey={selectedKey}
            handleStepHeaderClick={handleStepHeaderClick}
            handleItemClick={handleItemClick}
            title={`Claim progress tracker`}
            activeStepIndex={activeStepIndex}
            setActiveStepIndex={setActiveStepIndex}
            currentStep={currentStep}
            currentStepDataFromApi={currentStepDataFromApi}
          />
        </NestedStepperWrapper>
      </EndorsementProcessContainer>

      {/* Success Modal */}
      <CustomModal
        open={showSuccessModal}
        handleClose={handleSuccessModalClose}
        heading="Claim Process Completed!"
        buttons={[
          {
            label: "OK",
            onClick: handleSuccessModalClose,
            variant: "primary",
          },
        ]}
      >
        <div>You have successfully completed the claim process.</div>
      </CustomModal>
    </PolicyDetailsContainer>
  );
};

export default NonGroupClaims;
