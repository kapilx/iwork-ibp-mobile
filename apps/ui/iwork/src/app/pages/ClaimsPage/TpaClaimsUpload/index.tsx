import React, { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useNestedStepper } from "../../../components/NestedStepper/useNestedStepper";
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
} from "../styles";
import { CircularProgress } from "@mui/material";
import { CLAIMS_STEP_KEYS, ENDORSEMENT_TOASTS } from "../../../constants";
import EndorsementProcessWrapper from "../../../components/EndorsementProcessWrapper";
import NestedStepper from "../../../components/NestedStepper";
// import ClaimsUploadBatchTable from "../ClaimsUploadBatchTable";
import ClaimsDataUpload from "../ClaimsDataUpload";
import { claimUploadConfig } from "./config";
import { PolicyDetailsContainer } from "../../CompanyPage/PolicyDetails/styles";
import { priorityStyleMap } from "../../CompanyPage/CompanyListing/tableConfig";

const TpaClaimsUpload: React.FC = () => {
  const { tpaId } = useParams();
  const dispatch = useDispatch();

  // DynamicForm methods from child
  const [uploadFormMethods, setUploadFormMethods] = useState<any>(null);
  const [loading] = useState(false);

  // Enable Next only when file control produced a documentId
  const [hasUploadedFile, setHasUploadedFile] = useState(false);

  // claims-upload POST state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadedFileId, setUploadedFileId] = useState<number | null>(null);

  const {
    steps,
    selectedKey,
    openSteps,
    handleStepHeaderClick,
    handleItemClick,
    selectedStep,
    markComplete,
    activeStepIndex,
    setActiveStepIndex,
    setSelectedKey,
  } = useNestedStepper({
    stepsConfig: claimUploadConfig,
    autoSelectFirstStep: true,
  });

  // Fetch TPA details to show in summary card
  const { data: tpaDetailsData, isLoading: tpaLoading } = useApiQuery({
    url: tpaId ? endPoints.tpaByID(Number(tpaId)) : "",
    queryKey: ["tpaDetails", tpaId],
    enabled: !!tpaId,
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
    [dispatch],
  );

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
          config={config}
          setUploadFormMethods={setUploadFormMethods}
          uploadFormMethods={uploadFormMethods}
          tpaId={Number(tpaId)}
          setEndorsementId={() => undefined}
          disableAllFields={false}
          endorsementId={null}
          onUploadSuccess={handleUploadSuccess}
          isTpaUpload={true}
        />
      );
    }

    return null;
  };

  const tpaClaimsBreadcrumbs = [
    {
      label: "Manage Claims",
      path: "/manage-claims",
    },
    {
      label: "Claims Upload",
    },
  ];

  return (
    <PolicyDetailsContainer>
      <BreadCrumbWrapper>
        <CommonBreadcrumb crumbs={tpaClaimsBreadcrumbs} />
      </BreadCrumbWrapper>

      {tpaLoading ? (
        <LoaderContainer>
          <CircularProgress color="secondary" />
        </LoaderContainer>
      ) : (
        <SummaryCard
          data={{
            displayName:
              tpaDetailsData?.data?.tpaName ||
              tpaDetailsData?.data?.displayName ||
              "TPA Name",
            tpaId: tpaDetailsData?.data?.id || Number(tpaId),
            status: tpaDetailsData?.data?.status?.lookUpValue || "Active",
          }}
          nameLink={""}
          sections={cardSections || []}
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
          viewMore={false}
        />
      )}

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

export default TpaClaimsUpload;
