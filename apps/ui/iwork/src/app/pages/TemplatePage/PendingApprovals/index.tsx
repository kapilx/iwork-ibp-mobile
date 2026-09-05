import {
    Button,
    Chip,
    Alert,
    AlertTitle,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
} from '@mui/material';
import { FeatureKey, selectHasPermission, endPoints, useApiMutation, useApiQuery } from '@ui/ui-lib';
import {
    ThumbUp as ApproveIcon,
    ThumbDown as RejectIcon,
    Visibility as PreviewIcon,
    Refresh,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { TemplateLayout } from '../TemplateLayout';
import TemplateTopNav from '../TemplateTopNav';
import { findChannelType, CHANNEL_TYPES } from '../TemplateEditor/constants';
import {
    DashboardContainer,
    EmptyStateContainer,
    EmptyStateTitle,
    EmptyStateDescription,
    LoadingBox,
    HeaderActionsContainer,
} from '../TemplateDashboard/styles';
import { useNavigate } from 'react-router-dom';
import { WorkflowActionEnum, ApprovalStatusEnum } from '../TemplateDashboard/types';
import { ApiBaseResponse, ApiTemplateListResponse } from '../apiTypes';
import { TEMPLATE_MANAGEMENT_BASE_PATH } from '../../../routes/template-management.route';
import { useState } from 'react';
import { 
    ApprovalActions, 
    FooterLine, 
    StyledAlert, 
    DialogContentContainer, 
    StyledCommentTextField,
    PendingApprovalTemplateCard,
    PendingApprovalCardContent,
    PendingApprovalCardHeader,
    PendingApprovalCardTitle,
    PendingApprovalCardChips,
    PendingApprovalCardFooter,
    PendingApprovalsGrid,
    PendingApprovalGridItem,
} from './styles';

const formatCardDate = (value: unknown): string => {
    if (!value) return "--";
    const d = new Date(value as string | number | Date);
    return isNaN(d.getTime())
        ? "--"
        : new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
};

const PendingApprovals: React.FC = () => {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

    // Comment dialog state
    const [commentDialogOpen, setCommentDialogOpen] = useState(false);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
    const [workflowAction, setWorkflowAction] = useState<WorkflowActionEnum | null>(null);
    const [comment, setComment] = useState('');

    const hasApprovePermission = useSelector((state: any) =>
        selectHasPermission(FeatureKey.APPROVE_TEMPLATE_MANAGEMENT)(state)
    );
    const hasRejectPermission = useSelector((state: any) =>
        selectHasPermission(FeatureKey.REJECT_TEMPLATE_MANAGEMENT)(state)
    );

    const canAccessPendingApprovals = hasApprovePermission || hasRejectPermission;

    const userDetails = JSON.parse(sessionStorage.getItem('user') || '{}');
    const { userId, firstName, lastName } = userDetails;
    const performedByName = `${firstName} ${lastName}`.trim();

    // Fetch only pending templates
    const {
        data: templatesResponse,
        isLoading: loading,
        refetch
    } = useApiQuery({
        url: `${endPoints.templates}?approvalStatus=${ApprovalStatusEnum.PENDING_APPROVAL}`,
        queryKey: ['pending-notification-templates'],
    });

    const { mutateAsync: workflowMutation } = useApiMutation({});

    // Transform API response to include channel type from channelTypeId.
    // IBP email event types (Welcome, 2FA, password reset, support ticket,
    // etc.) don't go through this approval workflow yet — the backend
    // already rejects a Submit for these, so none should land in this queue
    // going forward, but exclude them defensively too in case older rows
    // exist from before that guard was added.
    const rawTemplates = (templatesResponse as ApiBaseResponse<ApiTemplateListResponse>)?.data?.templates || [];
    const templates = rawTemplates
        .filter((t: any) => !t.isCompanyCustomizable)
        .map(t => ({
            ...t,
            type: (CHANNEL_TYPES.find(c => c.id === t.channelTypeId)?.key || findChannelType(t.channelType)?.key || 'email')
        }));

    if (!canAccessPendingApprovals) {
        return (
            <TemplateLayout title="Pending Approvals">
                <TemplateTopNav />
                <Alert severity="error">
                    You do not have permission to access this page. Either APPROVE or REJECT permission is required.
                </Alert>
            </TemplateLayout>
        );
    }

    const openCommentDialog = (id: string, action: WorkflowActionEnum) => {
        // Check permission before opening dialog
        if (action === WorkflowActionEnum.APPROVE && !hasApprovePermission) {
            setError('You do not have permission to approve templates');
            return;
        }
        if (action === WorkflowActionEnum.REJECT && !hasRejectPermission) {
            setError('You do not have permission to reject templates');
            return;
        }

        setSelectedTemplateId(id);
        setWorkflowAction(action);
        setComment('');
        setCommentDialogOpen(true);
    };

    const handleAction = async () => {
        if (!selectedTemplateId || !workflowAction) return;

        setActionLoadingId(selectedTemplateId);
        setCommentDialogOpen(false);
        try {
            await workflowMutation({
                endpoint: endPoints.templateWorkflow(selectedTemplateId),
                method: 'POST',
                data: {
                    action: workflowAction,
                    performedBy: userId,
                    performedByName: performedByName,
                    comment: comment || `Action ${workflowAction} performed via Pending Approvals page`
                }
            });
            refetch();
        } catch (err) {
            console.error('Failed to perform action', err);
            setError(`Failed to ${workflowAction} template`);
        } finally {
            setActionLoadingId(null);
            setSelectedTemplateId(null);
            setWorkflowAction(null);
        }
    };

    const handlePreview = (id: string) => {
        navigate(`/${TEMPLATE_MANAGEMENT_BASE_PATH}/preview/${id}?redirect=true`);
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'email': return 'primary';
            case 'sms': return 'secondary';
            case 'in-app': return 'info';
            case 'whats-app': return 'success';
            default: return 'default';
        }
    };

    const isRejectDisabled = workflowAction === WorkflowActionEnum.REJECT && !comment.trim();

    const handleRefresh = () => {
        refetch();
    };

    const headerActions = (
        <HeaderActionsContainer>
            <IconButton size="small" onClick={handleRefresh}>
                <Refresh />
            </IconButton>
        </HeaderActionsContainer>
    );

    return (
        <TemplateLayout title="Pending Approvals" headerActions={headerActions}>
            <TemplateTopNav />
            <DashboardContainer>
                {error && (
                    <StyledAlert severity="error" onClose={() => setError('')}>
                        <AlertTitle>Error</AlertTitle>
                        {error}
                    </StyledAlert>
                )}

                {loading ? (
                    <LoadingBox>
                        <CircularProgress color="primary" />
                    </LoadingBox>
                ) : templates.length === 0 ? (
                    <EmptyStateContainer>
                        <EmptyStateTitle variant="h6">No pending approvals</EmptyStateTitle>
                        <EmptyStateDescription variant="body2">
                            There are no templates waiting for your approval right now.
                        </EmptyStateDescription>
                    </EmptyStateContainer>
                ) : (
                    <PendingApprovalsGrid>
                        {templates.map((template: any) => (
                            <PendingApprovalGridItem key={template.id}>
                                <PendingApprovalTemplateCard>
                                    <PendingApprovalCardContent onClick={() => handlePreview(template.id.toString())}>
                                        <PendingApprovalCardHeader>
                                            <PendingApprovalCardTitle variant="h6">
                                                Subject: {template.subject || template.name || `Template ${template.id}`}
                                            </PendingApprovalCardTitle>
                                        </PendingApprovalCardHeader>
                                        <PendingApprovalCardChips>
                                            <Chip
                                                label={(template.type || 'EMAIL').toUpperCase()}
                                                size="small"
                                                color={getTypeColor(template.type)}
                                            />
                                            <Chip
                                                label="PENDING APPROVAL"
                                                size="small"
                                                color="warning"
                                            />
                                        </PendingApprovalCardChips>

                                        <PendingApprovalCardFooter variant="caption">
                                            <div>Created By: {template.createdByName || `User ${template.createdBy}`} on {formatCardDate(template.createdAt)}</div>
                                            <FooterLine>Last Updated By: {template.updatedByName || `User ${template.updatedBy}`} on {formatCardDate(template.updatedAt)}</FooterLine>
                                        </PendingApprovalCardFooter>

                                        <ApprovalActions onClick={(e) => e.stopPropagation()}>
                                            <Button
                                                size="small"
                                                startIcon={<PreviewIcon />}
                                                onClick={() => handlePreview(template.id.toString())}
                                            >
                                                Preview
                                            </Button>
                                            <Button
                                                size="small"
                                                color="success"
                                                variant="contained"
                                                startIcon={<ApproveIcon />}
                                                onClick={() => openCommentDialog(template.id.toString(), WorkflowActionEnum.APPROVE)}
                                                disabled={actionLoadingId === template.id.toString() || !hasApprovePermission}
                                            >
                                                Approve
                                            </Button>
                                            <Button
                                                size="small"
                                                color="error"
                                                variant="contained"
                                                startIcon={<RejectIcon />}
                                                onClick={() => openCommentDialog(template.id.toString(), WorkflowActionEnum.REJECT)}
                                                disabled={actionLoadingId === template.id.toString() || !hasRejectPermission}
                                            >
                                                Reject
                                            </Button>
                                        </ApprovalActions>
                                    </PendingApprovalCardContent>
                                </PendingApprovalTemplateCard>
                            </PendingApprovalGridItem>
                        ))}
                    </PendingApprovalsGrid>
                )}
            </DashboardContainer>

            {/* Comment Dialog */}
            <Dialog
                open={commentDialogOpen}
                onClose={() => setCommentDialogOpen(false)}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>
                    {workflowAction === WorkflowActionEnum.APPROVE ? 'Approve Template' : 'Reject Template'}
                </DialogTitle>
                <DialogContent>
                    <DialogContentContainer>
                        <StyledCommentTextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Comments"
                            placeholder={workflowAction === WorkflowActionEnum.REJECT ? "Please provide a reason for rejection (required)" : "Add any comments (optional)"}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </DialogContentContainer>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCommentDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleAction}
                        variant="contained"
                        color={workflowAction === WorkflowActionEnum.APPROVE ? "success" : "error"}
                        disabled={isRejectDisabled}
                    >
                        {workflowAction === WorkflowActionEnum.APPROVE ? 'Confirm Approve' : 'Confirm Reject'}
                    </Button>
                </DialogActions>
            </Dialog>
        </TemplateLayout>
    );
};

export default PendingApprovals;
