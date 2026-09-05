import {
  CommonDialogBox,
  CustomModal,
  endPoints,
  GENERIC_ERROR,
  NestedDynamicForm,
  POLICY_DETAILS_TABS,
  setToastMessage,
  SUCCESS_MESSAGE,
  useApiMutation,
  COMMENTS_REQUIRED_MESSAGE,
  UNDER_REVIEW_TEXT,
  APPROVED_MESSAGE_BY_SECTION,
  UNDER_REVIEW_MESSAGE_BY_SECTION,
} from "@ui/ui-lib";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { approvalModalConfig } from "./formConfig";
import {
  SECTION_STATUS,
  SectionStatus,
  THIS_ACTIVITY_WAS_APPROVED_BY,
} from "../../../constants";
import underReview from "../../../assets/svgs/underReview.svg";
import { UnderReviewStyles } from "./styles";

export interface StatusMap {
  approve: SectionStatus;
  reject: SectionStatus;
  submit: SectionStatus;
}

export interface PolicyActionPanelProps {
  statusKey?: any;
  setStatusKey?: React.Dispatch<React.SetStateAction<any>>;
  section: string;
  isAnySectionEditing?: boolean;
  statusMap?: Partial<StatusMap>;
  labels?: {
    text?: string;
    approvalText?: string;
    approve?: string;
    reject?: string;
    submitForApproval?: string;
    approvePolicyDetailsHeading?: string;
    rejectPolicyDetailsHeading?: string;
    approveCoversHeading?: string;
    rejectCoversHeading?: string;
    approveCdDetailsHeading?: string;
    rejectCdDetailsHeading?: string;
    cancel?: string;
    save?: string;
    approved?: string;
  };
  modalHeadingStyles?: React.CSSProperties;
  policyId: number;
  canApprove?: boolean;
  onSectionsUpdate?: (sections: Record<string, any>) => void;
  approvedBy?: string;
  needToApproveBy?: string;
}

const DEFAULT_LABELS: Required<PolicyActionPanelProps["labels"]> = {
  text: POLICY_DETAILS_TABS.TEXT,
  approvalText: POLICY_DETAILS_TABS.APPROVE_TEXT,
  approve: POLICY_DETAILS_TABS.APPROVE,
  reject: POLICY_DETAILS_TABS.REJECT,
  submitForApproval: POLICY_DETAILS_TABS.SUBMIT_FOR_APPROVAL,
  approvePolicyDetailsHeading: POLICY_DETAILS_TABS.APPROVE_POLICY_DETAILS,
  rejectPolicyDetailsHeading: POLICY_DETAILS_TABS.REJECT_POLICY_DETAILS,
  approveCoversHeading: POLICY_DETAILS_TABS.APPROVE_COVERS,
  rejectCoversHeading: POLICY_DETAILS_TABS.REJECT_COVERS,
  approveCdDetailsHeading: POLICY_DETAILS_TABS.APPROVE_CD_DETAILS,
  rejectCdDetailsHeading: POLICY_DETAILS_TABS.REJECT_CD_DETAILS,
  cancel: POLICY_DETAILS_TABS.CANCEL,
  save: POLICY_DETAILS_TABS.SAVE,
  approved: POLICY_DETAILS_TABS.APPROVED,
};

const DEFAULT_STATUS_MAP: StatusMap = {
  approve: SECTION_STATUS.APPROVED,
  reject: SECTION_STATUS.REJECTED,
  submit: SECTION_STATUS.SUBMITTED,
};

export default function PolicyActionPanel(props: PolicyActionPanelProps) {
  const {
    section,
    isAnySectionEditing = false,
    statusMap: statusMapInput,
    labels: labelsInput,
    modalHeadingStyles,
    policyId: id,
    statusKey,
    setStatusKey,
    canApprove,
    onSectionsUpdate,
    approvedBy,
    needToApproveBy,
  } = props;

  const labels = { ...DEFAULT_LABELS, ...(labelsInput || {}) };
  const statusMap = {
    ...DEFAULT_STATUS_MAP,
    ...(statusMapInput || {}),
  } as StatusMap;
  const dispatch = useDispatch();
  const [openActionModal, setOpenActionModal] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [modalType, setModalType] = React.useState<"approve" | "reject">(
    "approve"
  );
  const approvalFormRef = useRef<any>(null);

  const closeModal = () => setOpenActionModal(false);

  const handleModalApproval = React.useCallback(() => {
    setModalType("approve");
    setOpenActionModal(true);
  }, []);

  const handleModalReject = React.useCallback(() => {
    setModalType("reject");
    setOpenActionModal(true);
  }, []);

  const [sectionStatusKey, setSectionStatusKey] = useState<string | null>(null);

  useEffect(() => {
    if (section === "POLICY_CD")
      setSectionStatusKey(statusKey?.cdDetails ?? "");
    else if (section === "POLICY_DETAILS")
      setSectionStatusKey(statusKey?.basicDetailsStatus ?? "");
    else if (section === "POLICY_COVERS")
      setSectionStatusKey(statusKey?.coversDetailsStatus ?? "");
    else setSectionStatusKey(null);
  }, [section, statusKey]);

  const approvalMutation = useApiMutation({
    config: {
      onSuccess: async (response) => {
        setActionLoading(false);
        setOpenActionModal(false);
        dispatch(setToastMessage(response?.message || SUCCESS_MESSAGE));
        const sections = response?.data?.sections;
        if (sections) {
          if (setStatusKey) {
            setStatusKey({
              cdDetails: sections?.POLICY_CD?.statusKey || "",
              coversDetailsStatus: sections?.POLICY_COVERS?.statusKey || "",
              basicDetailsStatus: sections?.POLICY_DETAILS?.statusKey || "",
            });
          }
          onSectionsUpdate?.(sections);
        }
      },
      onError: async (error) => {
        setActionLoading(false);
        const msg = Array.isArray(error?.message)
          ? error?.message[0]
          : error?.message ?? GENERIC_ERROR;
        dispatch(setToastMessage(msg));
        console.error("Approval action failed:", error);
      },
    },
  });
  const extractComments = (submitRes: any) => {
    const r = submitRes?.result ?? {};
    // common shapes:
    if (typeof r.comments === "string") return r.comments;
    if (r.formValues?.comments) return r.formValues.comments;
    const k = approvalModalConfig?.key;
    if (k && r[k]?.comments) return r[k].comments;
    return "";
  };
  const handleApprovalSave = async () => {
    if (actionLoading) return;
    const submitRes = await approvalFormRef.current?.submitAll?.();
    // const formValues = submitRes?.result.comments ?? {};
    const comments = extractComments(submitRes);
    const payload = { section, status: statusMap.approve, comments };
    setActionLoading(true);
    try {
      setOpenActionModal(false);
      approvalMutation.mutate({
        endpoint: endPoints.policySectionApproval(Number(id)),
        method: "PUT",
        data: payload,
      });
    } catch (err) {
      setActionLoading(false);
      dispatch(setToastMessage(err || GENERIC_ERROR));
      console.error("Approval request failed:", err);
    }
  };

  const handleRejectSave = async () => {
    if (actionLoading) return;
    const submitRes = await approvalFormRef.current?.submitAll?.();
    const comments = extractComments(submitRes);
    const payload = { section, status: statusMap.reject, comments };
    if (!submitRes?.isAllValid) {
      return;
    }

    setActionLoading(true);
    try {
      approvalMutation.mutate({
        endpoint: endPoints.policySectionApproval(Number(id)),
        method: "PUT",
        data: payload,
      });
      setOpenActionModal(false);
    } catch (err) {
      setActionLoading(false);
      console.error("Rejection request failed:", err);
      dispatch(setToastMessage(err || GENERIC_ERROR));
    }
  };
  const handleSubmitForApproval = async () => {
    if (actionLoading) return;
    const payload = { section };

    setActionLoading(true);
    try {
      approvalMutation.mutate({
        endpoint: endPoints.policySectionSubmission(Number(id)),
        method: "POST",
        data: payload,
      });
      setOpenActionModal(false);
    } catch (err) {
      setActionLoading(false);
      console.error("Rejection request failed:", err);
      dispatch(setToastMessage(err || GENERIC_ERROR));
    }
  };

  const approvedMessagePrefix =
    APPROVED_MESSAGE_BY_SECTION[section] ?? THIS_ACTIVITY_WAS_APPROVED_BY;
  const approvedMessage = approvedBy
    ? `${approvedMessagePrefix} ${approvedBy}`
    : approvedMessagePrefix;

  const underReviewMessagePrefix =
    UNDER_REVIEW_MESSAGE_BY_SECTION[section] ?? UNDER_REVIEW_TEXT;
  const underReviewMessage = needToApproveBy
    ? `${underReviewMessagePrefix} ${needToApproveBy}`
    : underReviewMessagePrefix;

  return (
    <>
      {sectionStatusKey === SECTION_STATUS.SUBMITTED && canApprove && (
        <CommonDialogBox
          text={labels.approvalText}
          buttons={[
            {
              label: labels.reject,
              variantType: "secondary",
              sizeType: "small",
              onClick: handleModalReject,
              disabled: isAnySectionEditing,
            },
            {
              label: labels.approve,
              variantType: "primary",
              sizeType: "small",
              onClick: handleModalApproval,
              disabled: isAnySectionEditing,
            },
          ]}
        />
      )}
      {sectionStatusKey === SECTION_STATUS.SUBMITTED && !canApprove && (
        <CommonDialogBox
          text={
            <UnderReviewStyles>
              <img src={underReview} alt="underReview" />
              <span>{underReviewMessage}</span>
            </UnderReviewStyles>
          }
          buttons={[]}
        />
      )}

      {(sectionStatusKey == "" ||
        sectionStatusKey === SECTION_STATUS.REJECTED) && (
        <CommonDialogBox
          text={labels.text}
          buttons={[
            {
              label: labels.submitForApproval,
              onClick: handleSubmitForApproval,
              variant: "primary",
              disabled: isAnySectionEditing,
            },
          ]}
        />
      )}

      {sectionStatusKey === SECTION_STATUS.APPROVED && (
        <CommonDialogBox
          text={approvedMessage}
          buttons={[
            {
              label: labels.approved,
              variantType: "primary",
              sizeType: "small",
              disabled: true,
              onClick: handleModalApproval,
            },
          ]}
        />
      )}

      <CustomModal
        open={openActionModal}
        handleClose={closeModal}
        heading={
          section === "POLICY_DETAILS"
            ? modalType === "approve"
              ? labels.approvePolicyDetailsHeading
              : labels.rejectPolicyDetailsHeading
            : section === "POLICY_COVERS"
            ? modalType === "approve"
              ? labels.approveCoversHeading
              : labels.rejectCoversHeading
            : section === "POLICY_CD"
            ? modalType === "approve"
              ? labels.approveCdDetailsHeading
              : labels.rejectCdDetailsHeading
            : modalType === "approve"
            ? labels.approvePolicyDetailsHeading
            : labels.rejectPolicyDetailsHeading
        }
        buttons={[
          {
            label: labels.cancel,
            onClick: closeModal,
            variant: "secondary",
          },
          {
            label: labels.save,
            onClick:
              modalType === "approve" ? handleApprovalSave : handleRejectSave,
            variant: "primary",
          },
        ]}
        headingStyles={modalHeadingStyles ?? { color: "#2E2E2E" }}
      >
        <NestedDynamicForm
          config={[
            {
              key: approvalModalConfig.key,
              config: approvalModalConfig.config.map((field) =>
                modalType === "reject"
                  ? {
                      ...field,
                      rules: {
                        required: {
                          value: true,
                          message: COMMENTS_REQUIRED_MESSAGE,
                        },
                      },
                    }
                  : field
              ),
              defaultValues: { comments: "" },
            },
          ]}
          ref={approvalFormRef}
        />
      </CustomModal>
    </>
  );
}
