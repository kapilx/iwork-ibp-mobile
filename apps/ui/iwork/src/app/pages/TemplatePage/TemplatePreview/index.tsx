import { useState, useEffect } from "react";
import {
  Button,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  History as HistoryIcon,
  RateReview as SubmitIcon,
  Undo as WithdrawIcon,
  Edit as ReviseIcon,
  Edit as EditIcon,
  ThumbUp as ApproveIcon,
  ThumbDown as RejectIcon,
} from "@mui/icons-material";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
// eslint-disable-next-line @nx/enforce-module-boundaries
import {
  useApiQuery,
  useApiMutation,
  endPoints,
  FeatureKey,
  selectHasPermission,
} from "@ui/ui-lib";
import { TemplateLayout } from "../TemplateLayout";
import { TEMPLATE_MANAGEMENT_BASE_PATH } from "../../../routes/template-management.route";
import TemplatePreviewCommon from "../TemplatePreviewCommon";
import { AVAILABLE_PARAMETERS } from "../TemplateEditor/constants";
import { ApiTemplate, ApiBaseResponse } from "../apiTypes";
import {
  WorkflowActionEnum,
  ApprovalStatusEnum,
} from "../TemplateDashboard/types";
import { PreviewContainer, ButtonContainer } from "./styles";
import {
  StyledCommentTextField,
  DialogContentContainer,
} from "../PendingApprovals/styles";

const TemplatePreview: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const userDetails = JSON.parse(sessionStorage.getItem("user") || "{}");
  const currentUserId = userDetails.userId;

  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [testValues, setTestValues] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState(false);

  // Approve/Reject dialog state
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [workflowAction, setWorkflowAction] = useState<WorkflowActionEnum | null>(null);
  const [comment, setComment] = useState("");

  // Check if user came from notification or task (redirect=true parameter)
  const redirect = searchParams.get("redirect");
  const isFromNotificationOrTask = redirect === "true";

  // Permission checks
  const hasApprovePermission = useSelector((state: any) =>
    selectHasPermission(FeatureKey.APPROVE_TEMPLATE_MANAGEMENT)(state)
  );
  const hasRejectPermission = useSelector((state: any) =>
    selectHasPermission(FeatureKey.REJECT_TEMPLATE_MANAGEMENT)(state)
  );

  const {
    data: apiTemplateData,
    isLoading: isApiLoading,
    refetch,
  } = useApiQuery({
    url: id ? endPoints.templateById(id) : "",
    queryKey: ["template-detail", id],
    enabled: !!id,
  });

  const { mutateAsync: workflowMutation } = useApiMutation({});

  useEffect(() => {
    if (id) {
      if (apiTemplateData) {
        const t = (apiTemplateData as ApiBaseResponse<ApiTemplate>).data;
        setTemplate({
          id: t.id.toString(),
          name: t.subject || `Template ${t.id}`,
          approvalStatus: (t.approvalStatus?.toLowerCase() ||
            "draft") as ApprovalStatusEnum,
          createdBy: t.createdBy,
          isCompanyCustomizable: (t as any).isCompanyCustomizable,
          formData: {
            content: t.body,
            subject: t.subject || "",
            name: t.subject || "",
            description: "",
            channelType: t.channelType,
            eventType: t.status,
          },
        });
        setLoading(false);
      } else {
        if (!isApiLoading) {
          setError("Template not found");
          setLoading(false);
        }
      }
    }
  }, [id, apiTemplateData, isApiLoading]);

  const handleBack = () => {
    navigate(`/${TEMPLATE_MANAGEMENT_BASE_PATH}`);
  };

  const handleHistory = () => {
    navigate(`/${TEMPLATE_MANAGEMENT_BASE_PATH}/history?id=${id}`);
  };

  const handleEdit = () => {
    navigate(`/${TEMPLATE_MANAGEMENT_BASE_PATH}/edit/${id}`);
  };

  const handleStatusChange = async (action: WorkflowActionEnum) => {
    const userDetails = JSON.parse(sessionStorage.getItem("user") || "{}");
    const { userId, firstName, lastName } = userDetails;
    const performedByName = `${firstName} ${lastName}`.trim();
    setActionLoading(true);
    try {
      await workflowMutation({
        endpoint: endPoints.templateWorkflow(id!),
        method: "POST",
        data: {
          action: action,
          performedBy: userId,
          performedByName: performedByName,
          comment: `Action ${action} performed via preview`,
        },
      });
      await refetch();
    } catch (err) {
      console.error("Failed to update status", err);
      setError("Failed to update status via workflow");
    } finally {
      setActionLoading(false);
    }
  };

  const openCommentDialog = (action: WorkflowActionEnum) => {
    // Check permission before opening dialog
    if (action === WorkflowActionEnum.APPROVE && !hasApprovePermission) {
      setError("You do not have permission to approve templates");
      return;
    }
    if (action === WorkflowActionEnum.REJECT && !hasRejectPermission) {
      setError("You do not have permission to reject templates");
      return;
    }

    setWorkflowAction(action);
    setComment("");
    setCommentDialogOpen(true);
  };

  const handleApprovalAction = async () => {
    if (!id || !workflowAction) return;

    const userDetails = JSON.parse(sessionStorage.getItem("user") || "{}");
    const { userId, firstName, lastName } = userDetails;
    const performedByName = `${firstName} ${lastName}`.trim();

    setActionLoading(true);
    setCommentDialogOpen(false);
    try {
      await workflowMutation({
        endpoint: endPoints.templateWorkflow(id),
        method: "POST",
        data: {
          action: workflowAction,
          performedBy: userId,
          performedByName: performedByName,
          comment:
            comment ||
            `Action ${workflowAction} performed via Template Preview`,
        },
      });
      await refetch();
      setError("");
      // Optionally navigate back to pending approvals after successful action
      setTimeout(() => {
        navigate(`/${TEMPLATE_MANAGEMENT_BASE_PATH}/pending-approvals`);
      }, 1000);
    } catch (err) {
      console.error("Failed to perform action", err);
      setError(`Failed to ${workflowAction} template`);
    } finally {
      setActionLoading(false);
      setWorkflowAction(null);
    }
  };

  const handleTestValueChange = (key: string, value: string) => {
    setTestValues((prev) => ({ ...prev, [key]: value }));
  };

  const getDetectedParameters = () => {
    if (!template?.formData) return [];
    const content = template.formData.content || "";
    const subject = template.formData.subject || "";
    const combined = content + subject;
    const matches = Array.from(combined.matchAll(/{{(.*?)}}/g)).map(
      (m: any) => m[1]
    );
    return Array.from(new Set(matches));
  };

  const detectedParamKeys = template ? getDetectedParameters() : [];

  const displayParams = detectedParamKeys.map((key) => {
    const existing = AVAILABLE_PARAMETERS.find((p) => p.key === key);
    return {
      key,
      description: existing?.description || `Value for ${key}`,
    };
  });

  const getRenderedText = (text: string) => {
    if (!text) return "";
    let rendered = text;
    Object.entries(testValues).forEach(([key, value]) => {
      if (value) {
        rendered = rendered.split(`{{${key}}}`).join(value);
      }
    });
    return rendered;
  };

  // IBP email event types don't go through this approval workflow yet (it's
  // being picked up in a later phase) — backend also rejects a workflow
  // call for these as defense in depth (see processWorkflowAction).
  const skipsApprovalWorkflow = Boolean(template?.isCompanyCustomizable);
  const isDraft = template?.approvalStatus === ApprovalStatusEnum.DRAFT;
  const isPending =
    template?.approvalStatus === ApprovalStatusEnum.PENDING_APPROVAL;
  const isRejected = template?.approvalStatus === ApprovalStatusEnum.REJECTED;
  const isApproved = template?.approvalStatus === ApprovalStatusEnum.APPROVED;
  const isCreator =
    currentUserId &&
    template?.createdBy &&
    Number(template.createdBy) === currentUserId;

  const headerActions = (
    <ButtonContainer>
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={handleBack}
      >
        Back to Dashboard
      </Button>

      <IconButton onClick={handleHistory} color="info" title="View History">
        <HistoryIcon />
      </IconButton>

      {(isDraft || isApproved) && (
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={handleEdit}
          color="primary"
        >
          Edit
        </Button>
      )}

      {isDraft && !skipsApprovalWorkflow && (
        <Button
          variant="contained"
          startIcon={
            actionLoading ? <CircularProgress size={20} /> : <SubmitIcon />
          }
          onClick={() => handleStatusChange(WorkflowActionEnum.SUBMIT)}
          disabled={actionLoading}
          color="primary"
        >
          Submit for Approval
        </Button>
      )}

      {isPending && isCreator && !skipsApprovalWorkflow && (
        <Button
          variant="outlined"
          startIcon={
            actionLoading ? <CircularProgress size={20} /> : <WithdrawIcon />
          }
          onClick={() => handleStatusChange(WorkflowActionEnum.WITHDRAW)}
          disabled={actionLoading}
          color="warning"
        >
          Withdraw
        </Button>
      )}

      {isRejected && !skipsApprovalWorkflow && (
        <Button
          variant="contained"
          startIcon={
            actionLoading ? <CircularProgress size={20} /> : <ReviseIcon />
          }
          onClick={() => handleStatusChange(WorkflowActionEnum.REVISE)}
          disabled={actionLoading}
          color="secondary"
        >
          Revise
        </Button>
      )}

      {/* Approve/Reject buttons - only shown when navigating from notification or task */}
      {isPending && !skipsApprovalWorkflow && isFromNotificationOrTask && (hasApprovePermission || hasRejectPermission) && (
        <>
          {hasApprovePermission && (
            <Button
              variant="contained"
              color="success"
              startIcon={
                actionLoading ? <CircularProgress size={20} /> : <ApproveIcon />
              }
              onClick={() => openCommentDialog(WorkflowActionEnum.APPROVE)}
              disabled={actionLoading}
            >
              Approve
            </Button>
          )}
          {hasRejectPermission && (
            <Button
              variant="contained"
              color="error"
              startIcon={
                actionLoading ? <CircularProgress size={20} /> : <RejectIcon />
              }
              onClick={() => openCommentDialog(WorkflowActionEnum.REJECT)}
              disabled={actionLoading}
            >
              Reject
            </Button>
          )}
        </>
      )}
    </ButtonContainer>
  );

  return (
    <TemplateLayout
      title="Template Preview"
      headerActions={headerActions}
      loading={loading}
      error={error}
    >
      <PreviewContainer>
        {template && (
          <TemplatePreviewCommon
            subject={template.formData?.subject}
            content={template.formData?.content}
            testValues={testValues}
            displayParams={displayParams}
            onTestValueChange={handleTestValueChange}
            getRenderedContent={getRenderedText}
            showHeader={false}
            emptyContentMessage="No content available for this template."
            channelType={template.formData?.channelType}
          />
        )}
      </PreviewContainer>

      {/* Comment Dialog for Approve/Reject */}
      <Dialog
        open={commentDialogOpen}
        onClose={() => setCommentDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {workflowAction === WorkflowActionEnum.APPROVE
            ? "Approve Template"
            : "Reject Template"}
        </DialogTitle>
        <DialogContent>
          <DialogContentContainer>
            <StyledCommentTextField
              fullWidth
              multiline
              rows={3}
              label="Comments"
              placeholder={
                workflowAction === WorkflowActionEnum.REJECT
                  ? "Please provide a reason for rejection (required)"
                  : "Add any comments (optional)"
              }
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </DialogContentContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommentDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleApprovalAction}
            variant="contained"
            color={
              workflowAction === WorkflowActionEnum.APPROVE ? "success" : "error"
            }
            disabled={
              workflowAction === WorkflowActionEnum.REJECT && !comment.trim()
            }
          >
            {workflowAction === WorkflowActionEnum.APPROVE
              ? "Confirm Approve"
              : "Confirm Reject"}
          </Button>
        </DialogActions>
      </Dialog>
    </TemplateLayout>
  );
};

export default TemplatePreview;
