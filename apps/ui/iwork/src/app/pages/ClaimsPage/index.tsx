import React, { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useNestedStepper } from "../../components/NestedStepper/useNestedStepper";
import {
  CommonBreadcrumb,
  setToastMessage,
  apiRequest,
  HTTP_METHODS,
  endPoints,
  SummaryCard,
  cardSections,
  useApiQuery,
} from "@ui/ui-lib";
import {
  BreadCrumbWrapper,
  EndorsementProcessContainer,
  LoaderContainer,
  NestedStepperWrapper,
} from "./styles";
import { CircularProgress } from "@mui/material";
import { CLAIMS_STEP_KEYS, ENDORSEMENT_TOASTS } from "../../constants";
import EndorsementProcessWrapper from "../../components/EndorsementProcessWrapper";
import NestedStepper from "../../components/NestedStepper";
// import ClaimsUploadBatchTable from "./ClaimsUploadBatchTable";
import ClaimsDataUpload from "./ClaimsDataUpload";
import { claimsUploadBreadcrumbConfig, claimUploadConfig } from "./config";
import { PolicyDetailsContainer } from "../CompanyPage/PolicyDetails/styles";
import { priorityStyleMap } from "../CompanyPage/CompanyListing/tableConfig";
import { policyDetailsViewMoreItems } from "../CompanyPage/PolicyDetails/detailsConfig";

import { environment } from "@ui/ui-lib/environment";
import { useHasPermission, FeatureKey } from "@ui/ui-lib";
const UploadClaims: React.FC = () => {
  // Download is allowed only if feature flag is ON AND user has EXPORT_CLAIMS permission
  const hasExportPermission = useHasPermission(FeatureKey.EXPORT_CLAIMS);
  const isExportEnabled = !!environment.featureFlag.FF_IWORK_DOCUMENT_DOWNLOAD && hasExportPermission;
  const { policyId } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const endorsementId = queryParams.get("endorsementId");
  const initialEndorsementId = endorsementId ? Number(endorsementId) : null;

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // DynamicForm methods from child
  const [uploadFormMethods, setUploadFormMethods] = useState<any>(null);

  const [loading] = useState(false);

  // Enable Next only when file control produced a documentId
  const [hasUploadedFile, setHasUploadedFile] = useState(false);

  // claims-upload POST state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadedFileId, setUploadedFileId] = useState<number | null>(null);
  const { from } = location.state ?? {};

  const {
    steps,
    selectedKey,
    openSteps,
    handleStepHeaderClick,
    handleItemClick,
    handleNext,
    selectedStep,
    markComplete,
    activeStepIndex,
    setActiveStepIndex,
    setSelectedKey,
  } = useNestedStepper({
    stepsConfig: claimUploadConfig,
    autoSelectFirstStep: !initialEndorsementId,
  });

  function getDocumentIdFromForm(values?: any): number | null {
    if (!values) return null;

    const fromFileUpload = values?.fileUpload?.id;

    const upload = values?.uploadClaimsFile;
    const fromUploadClaims =
      upload?.data?.id ?? upload?.data?.[0]?.id ?? upload?.id ?? null;

    const raw = fromFileUpload ?? fromUploadClaims ?? null;
    const num = Number(raw);
    return Number.isFinite(num) && num > 0 ? num : null;
  }

  useEffect(() => {
    if (!uploadFormMethods?.watch) return;

    const initialValues = uploadFormMethods.getValues?.();
    const initialId = getDocumentIdFromForm(initialValues);
    setHasUploadedFile(!!initialId);

    const subscription = uploadFormMethods.watch((allValues: any) => {
      const id = getDocumentIdFromForm(allValues);
      setHasUploadedFile(!!id);
    });

    return () => subscription?.unsubscribe?.();
  }, [uploadFormMethods]);

  const handleUploadSuccess = useCallback(
    (fileId?: number) => {
      setUploadComplete(true);
      setHasUploadedFile(true);
      if (fileId) setUploadedFileId(Number(fileId));
      dispatch(setToastMessage(ENDORSEMENT_TOASTS.FILE_UPLOADED_SUCCESSFULLY));
    },
    [dispatch]
  );

  const { data: policyDetailsData, isLoading } = useApiQuery({
    url: policyId ? endPoints.getBasicDetailsByPolicyId(Number(policyId)) : "",
    queryKey: [],
    enabled: !!policyId,
  });

  // initialize first step selection
  useEffect(() => {
    if (!selectedKey && claimUploadConfig.length > 0) {
      const first = claimUploadConfig[0];
      setSelectedKey(first.key);
      setActiveStepIndex(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Block navigation to other steps until POST completed
  const onItemClick = (key: string) => {
    const tryToOpenOtherThanUpload =
      key !== CLAIMS_STEP_KEYS.UPLOAD_CLAIMS && !uploadComplete;
    if (tryToOpenOtherThanUpload) {
      dispatch(setToastMessage(ENDORSEMENT_TOASTS.PLEASE_UPLOAD_FILE_FIRST));
      return;
    }
    handleItemClick?.(key);
  };

  const onStepHeaderClick = (key: string) => {
    const tryToOpenOtherThanUpload =
      key !== CLAIMS_STEP_KEYS.UPLOAD_CLAIMS && !uploadComplete;
    if (tryToOpenOtherThanUpload) {
      dispatch(setToastMessage(ENDORSEMENT_TOASTS.PLEASE_UPLOAD_FILE_FIRST));
      return;
    }
    handleStepHeaderClick?.(key);
  };

  const currentStepNumber =
    (steps?.findIndex((s) => s.key === selectedKey) ?? -1) + 1 || 1;

  const renderStepComponent = () => {
    const step = selectedStep ?? steps?.[activeStepIndex];
    if (!step) return null;

    const { config, key } = step;

    if (key === CLAIMS_STEP_KEYS.UPLOAD_CLAIMS) {
      return (
        <ClaimsDataUpload
          config={typeof config === 'function'
            ? config(Number(policyId), "claims", 596, isExportEnabled)
            : config}
          setUploadFormMethods={setUploadFormMethods}
          uploadFormMethods={uploadFormMethods}
          policyId={Number(policyId)}
          setEndorsementId={() => undefined}
          disableAllFields={false}
          endorsementId={initialEndorsementId}
          onUploadSuccess={handleUploadSuccess}
          isExportEnabled={isExportEnabled}
        />
      );
    }

    return null;
  };

  // Parent-owned POST to claims-upload
  const performClaimsUpload = useCallback(async () => {
    const formValues = uploadFormMethods?.getValues?.();
    const documentId = getDocumentIdFromForm(formValues);

    if (!documentId) {
      dispatch(setToastMessage("Please upload a file before continuing."));
      return { ok: false as const };
    }

    const claimsUploadDate = uploadFormMethods?.getValues?.("claimsUploadDate");
    const totalClaims = uploadFormMethods?.getValues?.("totalClaims");

    const claimsUploadDateIso =
      claimsUploadDate instanceof Date
        ? claimsUploadDate.toISOString()
        : typeof claimsUploadDate === "string" && claimsUploadDate
        ? new Date(claimsUploadDate).toISOString()
        : null;

    const payload: Record<string, any> = {
      fileId: Number(documentId),
      policyId: Number(policyId),
      claimsUploadDate: claimsUploadDateIso,
      totalClaims: Number(totalClaims ?? 0),
    };

    try {
      const resp = await apiRequest(endPoints.claimsUpload, {
        method: HTTP_METHODS.POST,
        data: payload,
      });

      const returnedFileId =
        resp?.data?.fileId ||
        resp?.data?.id ||
        resp?.data ||
        Number(documentId);

      handleUploadSuccess(Number(returnedFileId));
      return { ok: true as const, fileId: Number(returnedFileId) };
    } catch (err: any) {
      console.error("claims-upload POST failed:", err);
      const msg =
        Array.isArray(err?.message) && err.message.length
          ? err.message[0]
          : err?.message || "Failed to upload claims. Please try again.";
      dispatch(setToastMessage(msg));
      return { ok: false as const };
    }
  }, [dispatch, handleUploadSuccess, policyId, uploadFormMethods]);

  const stepperSubmit = async () => {
    try {
      const currentStepKey = selectedKey ?? steps?.[activeStepIndex]?.key;
      const onUploadStep = currentStepKey === CLAIMS_STEP_KEYS.UPLOAD_CLAIMS;

      // 1) Validate DynamicForm (no API yet)
      const isValid = await uploadFormMethods?.trigger?.();
      if (isValid === false) {
        dispatch(
          setToastMessage("Please fix validation errors before continuing.")
        );
        return;
      }

      // 2) If we're on the upload step → do the POST now (parent)
      if (onUploadStep) {
        setIsUploading(true);
        const result = await performClaimsUpload();
        setIsUploading(false);

        if (!result?.ok) return; // stop if POST failed
      }

      // 3) Success → advance
      const nextIndex = activeStepIndex + 1;
      if (steps[nextIndex]) setSelectedKey(steps[nextIndex].key);
      markComplete(selectedKey!);
      handleNext();
    } catch (err) {
      console.error("stepperSubmit error:", err);
      setIsUploading(false);
      dispatch(setToastMessage("Failed to advance step"));
    }
  };

  const handleBack = () => {
    navigate(`/policies/${policyId}`);
  };

  // Next is disabled while POSTing OR (on step 1) until file has a documentId
  const nextDisabled =
    isUploading ||
    ((selectedKey ?? steps?.[activeStepIndex]?.key) ===
      CLAIMS_STEP_KEYS.UPLOAD_CLAIMS &&
      !hasUploadedFile);

  return (
    <PolicyDetailsContainer>
      <BreadCrumbWrapper>
        <CommonBreadcrumb
          crumbs={claimsUploadBreadcrumbConfig({
            policyId: Number(policyId),
            from,
          })}
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

      <EndorsementProcessContainer>
        {loading ? (
          <LoaderContainer>
            <CircularProgress color="secondary" />
          </LoaderContainer>
        ) : (
          <EndorsementProcessWrapper
            title={
              selectedKey
                ? claimUploadConfig.find((c) => c.key === selectedKey)?.title
                : claimUploadConfig[0]?.title
            }
            stepNumber={currentStepNumber || 1}
            totalSteps={steps?.length || claimUploadConfig.length}
            status="current"
            backButtonProps={{ style: { visibility: "hidden" } }}
            sendButtonProps={{ shouldHide: true }}
            nextButtonProps={{style: { visibility: "hidden" }}}
          >
            {renderStepComponent()}
          </EndorsementProcessWrapper>
        )}

        <NestedStepperWrapper>
          <NestedStepper
            steps={steps}
            openSteps={openSteps}
            selectedKey={selectedKey}
            handleStepHeaderClick={onStepHeaderClick}
            handleItemClick={onItemClick}
            title="Claims Upload Process"
            activeStepIndex={activeStepIndex}
            setActiveStepIndex={setActiveStepIndex}
            currentStep={currentStepNumber}
            currentStepDataFromApi={undefined}
          />
        </NestedStepperWrapper>
      </EndorsementProcessContainer>
    </PolicyDetailsContainer>
  );
};

export default UploadClaims;
