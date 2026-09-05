import {
  apiRequest,
  DynamicForm,
  endPoints,
  FormFieldConfig,
  HTTP_METHODS,
  setToastMessage,
  useApiQuery,
  useHasPermission,
  useLookupIdByKey,
  FeatureKey,
} from "@ui/ui-lib";
import { LookUpValues } from "../../../constants/lookupValues";
import { environment } from "@ui/ui-lib/environment";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { TitleTypography } from "../EndorsementDetails/styles";

import {
  DocTypeKey,
  endorsementDocTypeMap,
} from "../utils/endorsementDocTypeMap";
import { getEndorsementDataUploadConfig } from "./config";
import { EndorsementDataUploadConfig as NonGroupEndorsementDataUploadConfig } from "./nonGroupConfig";
import {
  BYPASS_ENROLLMENT_TEMP_NUM,
  DATA_UPLOAD,
  ENDORSEMENT_TOASTS,
  ENROLLMENT_TEMP_NUM,
  MEMBER_UPLOAD_TEMP_NUM,
  POLICY_EXTENSION_HIDDEN_FIELDS,
  POLICY_EXTENSION_NUM,
  TEMP_NUM,
} from "../../../constants";
import { CreationType } from "../EndorsementDetails/creationFlowConfigs";
import { PolicyExtensionForm } from "./PolicyExtensionForm";

export const EndorsementDataUploadPage: React.FC<{
  policyId: number;
  methods: any;
  setMethods: any;
  setEndorsementId: React.Dispatch<React.SetStateAction<number | null>>;
  disableAllFields?: boolean;
  endorsementId: number | null;
  onUploadSuccess?: () => void;
  formMethods?: any;
  creationLabel?: string;
  creationType?: CreationType;
  isGroupPolicyType?: boolean;
  savedEnrollmentDates?: {
    enrollmentStartDate?: string | null;
    enrollmentEndDate?: string | null;
  };
  onPolicyExtended?: () => void;
  currentPolicyTo?: string | null;
  existingDocType?: string;
  showMemberDataUpload?: boolean;
}> = ({
  policyId,
  methods,
  setMethods,
  setEndorsementId,
  disableAllFields,
  endorsementId,
  onUploadSuccess,
  formMethods,
  creationLabel,
  creationType,
  isGroupPolicyType = true,
  onPolicyExtended,
  currentPolicyTo,
  existingDocType,
  showMemberDataUpload = false,
}) => {
  const dispatch = useDispatch();
  const hasInceptionPermission = useHasPermission(FeatureKey.EXPORT_INCEPTION);
  const hasEndorsementPermission = useHasPermission(FeatureKey.EXPORT_ENDORSEMENTS);
  const hasRbacPermission = creationType === "inception" ? hasInceptionPermission : hasEndorsementPermission;
  const isDownloadAllowed = !environment.featureFlag.FF_IWORK_DOCUMENT_DOWNLOAD || hasRbacPermission;

  const navigate = useNavigate();
  const location = useLocation();

  const processedDocumentRef = useRef<string | number | null>(null);

  const [isUploadDisabled, setUploadDisabled] = useState(true);
  const [isDocTypeDisabled, setDocTypeDisabled] = useState(() => {
    const { osTicketNumber, endorsementType } = formMethods?.getValues?.() ?? {};
    return !osTicketNumber || !endorsementType;
  });
  const [currentEndorsementType, setCurrentEndorsementType] = useState<string | undefined>(
    () => formMethods?.getValues?.()?.endorsementType
  );
  // Restore POLICY_EXTENSION_NUM after a navigation remount triggered by extension submission
  const [selectedDocType, setSelectedDocType] = useState<number>(() =>
    !isGroupPolicyType && (location.state as any)?.isPolicyExtension
      ? POLICY_EXTENSION_NUM
      : TEMP_NUM
  );


  const getDefaultEnrollmentStartDate = () =>
    new Date().toISOString().split("T")[0];
  const getDefaultEnrollmentEndDate = () => {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 15);
    return endDate.toISOString().split("T")[0];
  };

  const docTypeMap = useMemo<Record<string | number, DocTypeKey>>(() => {
    if (isGroupPolicyType) {
      return {
        [TEMP_NUM]: "policy_employee_enrollment_data" as DocTypeKey,
        [ENROLLMENT_TEMP_NUM]: "policy_employee_data" as DocTypeKey,
        [BYPASS_ENROLLMENT_TEMP_NUM]: "policy_employee_bypass_enrollment" as DocTypeKey,
        [MEMBER_UPLOAD_TEMP_NUM]: "policy_endorsement_member_upload" as DocTypeKey,
      };
    }
    const map: Record<string | number, DocTypeKey> = {
      [TEMP_NUM]: "policy_asset_enrollment_data" as DocTypeKey,
    };
    if (creationType !== "inception") {
      map[POLICY_EXTENSION_NUM] = "policy_extension" as DocTypeKey;
    }
    return map;
  }, [isGroupPolicyType, creationType]);
  const docTypeStringToNum = useMemo(() => {
    const reverse: Record<string, number> = {};
    for (const [num, str] of Object.entries(docTypeMap)) {
      reverse[str] = Number(num);
    }
    return reverse;
  }, [docTypeMap]);

  const restoredForMethodsRef = useRef<any>(null);
  useEffect(() => {
    if (!existingDocType || !methods) return;
    if (restoredForMethodsRef.current === methods) return;
    const numericValue = docTypeStringToNum[existingDocType];
    if (numericValue !== undefined) {
      methods.setValue("documentType", numericValue);
      setSelectedDocType(numericValue);
      restoredForMethodsRef.current = methods;
    }
  }, [existingDocType, methods, docTypeStringToNum]);

  const isPolicyExtension =
    !isGroupPolicyType && selectedDocType === POLICY_EXTENSION_NUM;

  const toggleTypeYesId = useLookupIdByKey(LookUpValues.TOGGLE_TYPE_YES);
  const { data: policyDetailsData } = useApiQuery({
    url: policyId ? endPoints.getBasicDetailsByPolicyId(Number(policyId)) : "",
    queryKey: ["endorsementUploadPolicyDetails", policyId],
    enabled: !!policyId && isGroupPolicyType,
  });
  const isEnrolmentPremiumBased =
    policyDetailsData?.data?.basicDetails?.isEnrolmentPremiumBased?.id ===
    toggleTypeYesId;

  const groupEndorsementDataUploadConfig = useMemo(
    () =>
      getEndorsementDataUploadConfig(isEnrolmentPremiumBased, showMemberDataUpload),
    [isEnrolmentPremiumBased, showMemberDataUpload]
  );

  const baseFormConfig = isGroupPolicyType
    ? groupEndorsementDataUploadConfig
    : NonGroupEndorsementDataUploadConfig;

  // Premium-based policies hide TEMP_NUM; fall back to the bypass option so the
  // dropdown has a sensible default after policy data resolves.
  useEffect(() => {
    if (!isGroupPolicyType || !isEnrolmentPremiumBased) return;
    const current = Number(methods?.getValues?.("documentType"));
    if (current === TEMP_NUM) {
      methods?.setValue?.("documentType", BYPASS_ENROLLMENT_TEMP_NUM);
      setSelectedDocType(BYPASS_ENROLLMENT_TEMP_NUM);
    }
  }, [isEnrolmentPremiumBased, isGroupPolicyType, methods]);

  // Once the insurer acknowledgement is received, Member Upload is the only
  // data type left to submit — lock the dropdown to it regardless of whatever
  // was previously selected.
  useEffect(() => {
    if (!showMemberDataUpload || !methods) return;
    const current = Number(methods?.getValues?.("documentType"));
    if (current !== MEMBER_UPLOAD_TEMP_NUM) {
      methods?.setValue?.("documentType", MEMBER_UPLOAD_TEMP_NUM);
    }
    setSelectedDocType(MEMBER_UPLOAD_TEMP_NUM);
  }, [showMemberDataUpload, methods]);

  useEffect(() => {
    const updateDisabled = () => {
      const { noOfEmployees, noOfDependents, enrollmentStartDate, enrollmentEndDate } =
        methods?.getValues?.() ?? {};
      const {
        osTicketNumber,
        endorsementRequestReceivedDate,
        endorsementType,
      } = formMethods?.getValues?.() ?? {};

      const mandatoryFieldsMissing =
        !osTicketNumber || !endorsementRequestReceivedDate || !endorsementType;

      const employeeDataMissing =
        creationType === "inception"
          ? !noOfEmployees || noOfDependents === undefined
          : noOfEmployees === undefined ||
            noOfDependents === undefined ||
            (!noOfEmployees && !noOfDependents);

      const isPolicyExt =
        !isGroupPolicyType &&
        Number(methods?.getValues?.("documentType")) === POLICY_EXTENSION_NUM;

      const datesMissing = !isPolicyExt && (!enrollmentStartDate || !enrollmentEndDate);

      setUploadDisabled(
        mandatoryFieldsMissing ||
          datesMissing ||
          (!isPolicyExt && employeeDataMissing)
      );
      setDocTypeDisabled(!osTicketNumber || !endorsementType);
    };

    updateDisabled();

    const subs: any[] = [];
    if (methods?.watch) {
      subs.push(methods.watch((vals: any) => {
        if (vals?.documentType !== undefined) {
          setSelectedDocType(Number(vals.documentType));
        }
        updateDisabled();
      }));
    }
    if (formMethods?.watch)
      subs.push(formMethods.watch((vals: any) => {
        if (vals?.endorsementType !== undefined) {
          setCurrentEndorsementType(vals.endorsementType);
        }
        updateDisabled();
      }));

    return () => subs.forEach((sub) => sub.unsubscribe?.());
  }, [methods, formMethods, creationType]);

  const formConfig: FormFieldConfig[] = React.useMemo(
    () =>
      baseFormConfig
        .filter(
          (field) =>
            !(isPolicyExtension && POLICY_EXTENSION_HIDDEN_FIELDS.includes(field.key))
        )
        .map((field) =>
          field.key === "uploadEmployeeFile"
            ? {
                ...field,
                componentProps: {
                  ...field.componentProps,
                  companyType: "policy",
                  companyId: String(policyId),
                  disabled: isUploadDisabled,
                  showDownloadIcon: isDownloadAllowed,
                },
              }
            : field.key === "enrollmentStartDate" ||
                field.key === "enrollmentEndDate" ||
                field.key === "noOfEmployees" ||
                field.key === "noOfDependents"
              ? {
                  ...field,
                  componentProps: {
                    ...field.componentProps,
                    disabled: disableAllFields,
                  },
                }
              : field.key === "documentType"
                ? {
                    ...field,
                    options:
                      creationType === "inception"
                        ? field.options?.filter(
                            (opt: any) => opt.value !== POLICY_EXTENSION_NUM
                          )
                        : field.options,
                    componentProps: {
                      ...field.componentProps,
                      disabled: isDocTypeDisabled,
                    },
                  }
                : field
        ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [baseFormConfig, policyId, isUploadDisabled, isDownloadAllowed, disableAllFields, isPolicyExtension, creationType, isDocTypeDisabled]
  );

  const handleDownloadTemplate = React.useCallback(async () => {
    if (!isDownloadAllowed) return;

    const docTypeKey = methods?.getValues("documentType") as
      | DocTypeKey
      | undefined;
    const docType = docTypeMap[docTypeKey as any];

    if (!docType) {
      dispatch(setToastMessage(ENDORSEMENT_TOASTS.PLEASE_SELECT_A_DATA_TYPE));
      return;
    }

    try {
      const selectedEndorsementType = methods?.getValues("endorsementType") as
        | string
        | undefined;
      const tmpl = await apiRequest(
        endorsementDocTypeMap[docType].download(
          policyId,
          selectedEndorsementType
        ),
        {
          method: HTTP_METHODS.GET,
        }
      );
      const documentId = tmpl?.data?.documentId;
      const fallbackFileName = tmpl?.data?.fileName || "template.xlsx";
      const fileUrl = tmpl?.data?.url;

      if (fileUrl) {
        const a = document.createElement("a");
        a.href = fileUrl;
        a.download = fallbackFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        dispatch(
          setToastMessage(ENDORSEMENT_TOASTS.TEMPLATE_DOWNLOADED_SUCCESSFULLY)
        );
        return;
      }
      if (!documentId) {
        dispatch(
          setToastMessage(ENDORSEMENT_TOASTS.TEMPLATE_GENERATION_FAILED)
        );
        return;
      }
      const moduleKey =
        creationType === "inception" ? "inception" : "endorsement";
      const resp = await apiRequest(
        `${endPoints.fileUploadDownload}/${documentId}/download?moduleKey=${encodeURIComponent(
          moduleKey
        )}`,
        {
          method: HTTP_METHODS.GET,
          responseType: "blob",
        }
      );
      const blob = resp.data as Blob;
      const textCheck = await blob.slice().text();
      if (blob.type.includes("text/html") && textCheck.includes("<html")) {
        dispatch(
          setToastMessage(
            ENDORSEMENT_TOASTS.DOWNLOAD_FAILED_SERVER_RETURNED_ERROR
          )
        );
        return;
      }
      let filename = fallbackFileName;
      const cd =
        (resp as any).headers?.["content-disposition"] ||
        (resp as any).headers?.get?.("content-disposition");
      const m = cd && String(cd).match(/filename=\"?([^\";]+)\"?/);
      if (m?.[1]) filename = m[1];
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      dispatch(
        setToastMessage(ENDORSEMENT_TOASTS.TEMPLATE_DOWNLOADED_SUCCESSFULLY)
      );
    } catch (e) {
      dispatch(setToastMessage(ENDORSEMENT_TOASTS.DOWNLOAD_FAILED_TRY_AGAIN));
    }
  }, [dispatch, docTypeMap, methods, policyId, creationType, isDownloadAllowed]);

  useEffect(() => {
    if (!methods) return;
    const sub = methods.watch(async (vals: Record<string, any>, { name }: { name?: string }) => {
      if (name !== "uploadEmployeeFile") return;

      const [isUploadDataValid, isEndorsmentRequestValid] = await Promise.all([
        methods?.trigger(),
        formMethods?.trigger(),
      ]);

      if (!isUploadDataValid || !isEndorsmentRequestValid) {
        dispatch(
          setToastMessage(ENDORSEMENT_TOASTS.PLEASE_FILL_ALL_REQUIRED_FIELDS)
        );
        return;
      }

      const noOfDependents = methods?.getValues()?.noOfDependents;
      const noOfEmployees = methods?.getValues()?.noOfEmployees;
      const enrollmentStartDate = methods?.getValues()?.enrollmentStartDate;
      const enrollmentEndDate = methods?.getValues()?.enrollmentEndDate;
      const endorsmentRequestValues = await formMethods?.getValues();

      const docTypeKey = vals?.documentType as DocTypeKey | undefined;

      console.log({ docTypeKey });

      const docType = docTypeMap[docTypeKey as any];
      const uploadRes = vals?.uploadEmployeeFile;
      const documentId =
        uploadRes?.data?.id || uploadRes?.data?.[0]?.id || uploadRes?.id;

      console.log({ docType, documentId, noOfDependents, noOfEmployees });
      if (
        !docType ||
        !documentId ||
        processedDocumentRef.current === documentId
      )
        return;
      processedDocumentRef.current = documentId;
      try {
        const isPolicyExtensionUpload = docType === "policy_extension";

        const counts = isGroupPolicyType
          ? {
              employeeCount: noOfEmployees || 0,
              dependentCount: noOfDependents || 0,
            }
          : {
              assetCount: noOfEmployees || 0,
              subAssetCount: noOfDependents || 0,
            };

        const payload: Record<string, any> = isPolicyExtensionUpload
          ? {
              documentId,
              documentType: docType,
              ...endorsmentRequestValues,
            }
          : {
              documentId,
              documentType: docType,
              ...counts,
              enrollmentStartDate,
              enrollmentEndDate,
              ...endorsmentRequestValues,
              isInception: creationType === "inception" ? true : undefined,
            };

        if (endorsementId !== null && endorsementId !== undefined) {
          payload.endorsementId = endorsementId;
        }

        const resp = await apiRequest(
          endorsementDocTypeMap[docType].process(policyId),
          {
            method: HTTP_METHODS.POST,
            data: payload,
          }
        );
        const newEndorsementId =
          typeof resp?.data === "number"
            ? resp?.data
            : resp?.data?.endorsementId;

        if (newEndorsementId !== null && newEndorsementId !== undefined) {
          setEndorsementId(newEndorsementId);
        }
        dispatch(
          setToastMessage(ENDORSEMENT_TOASTS.FILE_UPLOADED_SUCCESSFULLY)
        );
        onUploadSuccess?.();
      } catch (err: any) {
        const msg = Array.isArray(err?.message)
          ? err.message[0]
          : err?.message || "Something went wrong while processing the file.";
        dispatch(setToastMessage(msg));
      }
    });
    return () => sub.unsubscribe?.();
  }, [
    dispatch,
    endorsementId,
    formMethods,
    methods,
    onUploadSuccess,
    policyId,
    setEndorsementId,
    creationType,
    docTypeMap,
    isGroupPolicyType,
  ]);

  // ── Policy extension success handler ──────────────────────────────────────
  const handleExtensionSuccess = (newEndorsementId: number) => {
    // Navigate first with isPolicyExtension state so the remounted component
    // (caused by the key change in CreateEndorsementRoute) restores the correct
    // selectedDocType and shows the document upload section.
    navigate(
      `/${policyId}/create-${creationType ?? "endorsement"}/${newEndorsementId}`,
      { replace: true, state: { ...((location.state as any) ?? {}), isPolicyExtension: true } }
    );
    setEndorsementId(newEndorsementId);
    onPolicyExtended?.();
  };

  const handleExtensionCancel = () => {
    // Reset documentType dropdown to TEMP_NUM so the file upload reappears
    methods?.setValue?.("documentType", TEMP_NUM);
    setSelectedDocType(TEMP_NUM);
  };

  // Pull endorsement request values for pre-filling the extension form
  const formMethodValues = formMethods?.getValues?.() ?? {};

  return (
    <>
      <TitleTypography>
        {isPolicyExtension ? "Policy Extension Details" : `${creationLabel} ${DATA_UPLOAD}`}
      </TitleTypography>

      {/* When Policy Extension is selected, show the form instead of file upload */}
      {isPolicyExtension ? (
        <PolicyExtensionForm
          policyId={policyId}
          iirnPolicyNumber={policyId}
          currentPolicyTo={currentPolicyTo}
          endorsementType={currentEndorsementType}
          osTicketNumber={formMethodValues.osTicketNumber}
          endorsementRequestReceivedDate={formMethodValues.endorsementRequestReceivedDate}
          endorsementId={endorsementId}
          isStep2Complete={disableAllFields}
          onSuccess={handleExtensionSuccess}
          onCancel={handleExtensionCancel}
          onDetailsLoaded={({ endorsementType }) => {
            if (endorsementType) {
              formMethods?.setValue?.("endorsementType", endorsementType);
            }
          }}
        />
      ) : (
        <DynamicForm
          formConfig={formConfig}
          defaultValues={{
            documentType: TEMP_NUM,
          }}
          formMethods={setMethods as any}
          onActionMap={{ downloadTemplate: handleDownloadTemplate }}
          sx={{ padding: 0 }}
          disableAllFields={disableAllFields}
        />
      )}
    </>
  );
};

export default EndorsementDataUploadPage;
