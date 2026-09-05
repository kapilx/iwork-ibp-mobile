import React, { useEffect, useState } from 'react';
import {
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import HistoryIcon from '@mui/icons-material/History';
import PreviewIcon from '@mui/icons-material/Preview';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import RateReviewIcon from '@mui/icons-material/RateReview';
import UndoIcon from '@mui/icons-material/Undo';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button, endPoints, setToastMessage, useApiMutation, useApiQuery } from '@ui/ui-lib';
import { useDispatch } from 'react-redux';
import { TEMPLATE_MANAGEMENT_BASE_PATH } from '../../../routes/template-management.route';
import { ApprovalStatusEnum, TemplateStatusEnum, WorkflowActionEnum } from '../TemplateDashboard/types';
import { CHANNEL_TYPES, findChannelType } from '../TemplateEditor/constants';
import { DefaultTemplateEditor } from './DefaultTemplateEditor';
import {
  CompanyDomainChip,
  EmptyStateBox,
  HeaderRow,
  OverrideListPanel,
  OverrideListRow,
  SectionHeading,
  SectionSubheading,
  SelectorRow,
  StatusBadge,
  TabContainer,
} from './styles';
import { TemplateCompanyOverrideSummary, TemplateOverrideSummary } from './types';

/**
 * "Customise" drill-down — reached by clicking a template's row directly in
 * Template Management (no kebab menu at all now, see PRD §5 / TRD §4). This
 * screen is the hub for everything that used to live in that kebab (Edit
 * the default / History / Preview / Remove Trigger / Delete / approval-
 * workflow actions) plus the shared default's own view/edit surface, and a
 * list of every company/domain that already has its own customization —
 * clicking one, or completing NewCustomisation.tsx's company+domain picker
 * for a brand-new one, navigates to CustomiseCompanyEditor.tsx: a focused,
 * standalone screen with just that one company/domain's editor + Save, not
 * folded back in here alongside the rest of this page's chrome.
 */
const TemplateCustomisation: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { defaultTemplateId: defaultTemplateIdParam } = useParams<{ defaultTemplateId: string }>();
  const defaultTemplateId = defaultTemplateIdParam ? parseInt(defaultTemplateIdParam, 10) : undefined;

  const [editingDefault, setEditingDefault] = useState(false);
  const [removeTriggerDialogOpen, setRemoveTriggerDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  // The admin's own dashboard list (TemplateDashboard) fetches under a
  // separate queryKey and was never being invalidated after a save/status
  // change here — it kept showing stale content after an edit that had
  // already landed in the DB, which read as "my edit didn't take effect."
  const invalidateDashboardList = () =>
    queryClient.invalidateQueries({ queryKey: ['notification-templates'] });

  const {
    data: templateResponse,
    isFetching: isLoadingTemplate,
    refetch: refetchTemplate,
  } = useApiQuery({
    url: defaultTemplateId ? endPoints.templateById(defaultTemplateId) : '',
    queryKey: ['template-detail', defaultTemplateId],
    enabled: Boolean(defaultTemplateId),
  });
  const template = (templateResponse as any)?.data;

  // Override rows deliberately stay visible in Template Management's flat
  // list — each is its own company's customization, not a hidden
  // implementation detail (see PRD/TRD) — so clicking one lands here just
  // like clicking the real default would. This screen's actions/hub UI only
  // make sense for a genuine default row, though, so when the id in the URL
  // turns out to be an override (either kind — configId for a domain-scoped
  // one, companyOverrideId for a company-wide one), redirect straight to
  // that override's own edit screen (its actual content — "Your Login OTP -
  // Ravi Kiran", not the shared default's subject) rather than showing the
  // default here as if that's what was clicked. canonicalDefaultTemplateId
  // is only populated server-side when this row's own configId OR companyId
  // is non-null (i.e. exactly when a redirect is needed) —
  // CustomiseCompanyEditor's route is keyed by the true default's id even
  // though it displays this override's content, so both ids are needed to
  // build the right URL.
  useEffect(() => {
    if (
      (template?.configId != null || template?.companyOverrideId != null) &&
      template?.canonicalDefaultTemplateId &&
      template.canonicalDefaultTemplateId !== defaultTemplateId
    ) {
      const query =
        template.configId != null
          ? new URLSearchParams({
              configId: String(template.configId),
              ...(template.companyId != null ? { companyId: String(template.companyId) } : {}),
              companyName: template.companyName || 'Unknown company',
              ...(template.overrideSubDomain ? { subDomain: template.overrideSubDomain } : {}),
            })
          : new URLSearchParams({
              companyId: String(template.companyOverrideId),
              companyName: template.companyOverrideCompanyName || 'Unknown company',
            });
      navigate(
        `/${TEMPLATE_MANAGEMENT_BASE_PATH}/customise/${template.canonicalDefaultTemplateId}/edit?${query.toString()}`,
        { replace: true }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template?.configId, template?.companyOverrideId, template?.canonicalDefaultTemplateId, defaultTemplateId]);

  const isCompanyLevel = Boolean(template?.isCompanyLevelCustomizable);

  const {
    data: overridesResponse,
    isFetching: isLoadingOverrides,
  } = useApiQuery({
    url: defaultTemplateId && !isCompanyLevel ? endPoints.templateOverridesSummary(defaultTemplateId) : '',
    queryKey: ['template-overrides-summary', defaultTemplateId],
    enabled: Boolean(defaultTemplateId) && !isCompanyLevel,
  });
  const overrides: TemplateOverrideSummary[] = (overridesResponse as any)?.data ?? [];

  const {
    data: companyOverridesResponse,
    isFetching: isLoadingCompanyOverrides,
  } = useApiQuery({
    url: defaultTemplateId && isCompanyLevel ? endPoints.templateCompanyOverridesSummary(defaultTemplateId) : '',
    queryKey: ['template-company-overrides-summary', defaultTemplateId],
    enabled: Boolean(defaultTemplateId) && isCompanyLevel,
  });
  const companyOverrides: TemplateCompanyOverrideSummary[] = (companyOverridesResponse as any)?.data ?? [];

  const { mutateAsync: workflowMutation, isPending: isWorkflowActionPending } = useApiMutation({
    config: {
      onError: (error: any) => {
        dispatch(setToastMessage(error?.message || 'Failed to update template.'));
      },
    },
  });

  const handleBack = () => navigate(`/${TEMPLATE_MANAGEMENT_BASE_PATH}`);

  // Every row here — existing customization or a brand-new one via the
  // picker — lands on the same focused, standalone editor screen; nothing
  // renders inline on this page itself anymore.
  const navigateToCompanyEditor = (params: {
    configId: number;
    companyId?: number | null;
    companyName?: string | null;
    subDomain?: string | null;
  }) => {
    const query = new URLSearchParams({
      configId: String(params.configId),
      ...(params.companyId != null ? { companyId: String(params.companyId) } : {}),
      companyName: params.companyName || 'Unknown company',
      ...(params.subDomain ? { subDomain: params.subDomain } : {}),
    });
    navigate(`/${TEMPLATE_MANAGEMENT_BASE_PATH}/customise/${defaultTemplateId}/edit?${query.toString()}`);
  };

  const handleSelectExisting = (override: TemplateOverrideSummary) => {
    navigateToCompanyEditor({
      configId: override.configId,
      companyId: override.companyId,
      companyName: override.companyName,
      subDomain: override.subDomain,
    });
  };

  const handleSelectExistingCompany = (override: TemplateCompanyOverrideSummary) => {
    const query = new URLSearchParams({
      companyId: String(override.companyId),
      companyName: override.companyName || 'Unknown company',
    });
    navigate(`/${TEMPLATE_MANAGEMENT_BASE_PATH}/customise/${defaultTemplateId}/edit?${query.toString()}`);
  };

  // --- Actions that used to live in the row's kebab menu ---

  // Opens the same GrapesJS + Live Preview editor inline, right here, for
  // the shared default's own content — no more navigating out to the old
  // generic Template Editor page (and its validate-for-event-type call).
  // See DefaultTemplateEditor for the "save as default vs. customise for a
  // company/domain" choice this leads to.
  const handleEditDefault = () => setEditingDefault(true);
  const handlePreviewDefault = () => navigate(`/${TEMPLATE_MANAGEMENT_BASE_PATH}/preview/${defaultTemplateId}`);
  const handleHistoryDefault = () => navigate(`/${TEMPLATE_MANAGEMENT_BASE_PATH}/history?id=${defaultTemplateId}`);

  const handleWorkflowAction = async (action: WorkflowActionEnum) => {
    if (!defaultTemplateId) return;
    const userDetails = JSON.parse(sessionStorage.getItem('user') || '{}');
    try {
      await workflowMutation({
        endpoint: endPoints.templateWorkflow(defaultTemplateId),
        method: 'POST',
        data: {
          action,
          performedBy: userDetails.userId,
          performedByName: `${userDetails.firstName ?? ''} ${userDetails.lastName ?? ''}`.trim(),
          comment: `Action ${action} performed via Customise screen`,
        },
      });
      dispatch(setToastMessage(`${action.replace(/_/g, ' ')} successful.`));
      refetchTemplate();
      invalidateDashboardList();
    } catch {
      // onError above already surfaces a toast.
    }
  };

  const handleRemoveTriggerConfirm = async () => {
    if (!defaultTemplateId) return;
    setRemoveTriggerDialogOpen(false);
    try {
      await workflowMutation({
        endpoint: endPoints.templateById(defaultTemplateId),
        method: 'PUT',
        data: { eventTypeId: null },
      });
      dispatch(setToastMessage('Trigger removed.'));
      refetchTemplate();
      invalidateDashboardList();
    } catch {
      // onError above already surfaces a toast.
    }
  };

  // Toggles activeStatusLid on the shared default — the one column the send
  // path always enforces, so this is what actually stops/resumes the email
  // for every company that hasn't customized this template, not a cosmetic
  // label (see notification.repository.ts::findTemplateMapping).
  const handleToggleStatusConfirm = async () => {
    if (!defaultTemplateId) return;
    const nextActive = !isTemplateActive;
    setStatusDialogOpen(false);
    try {
      await workflowMutation({
        endpoint: endPoints.templateStatus(defaultTemplateId),
        method: 'PUT',
        data: { active: nextActive },
      });
      dispatch(setToastMessage(nextActive ? 'Template enabled.' : 'Template disabled.'));
      refetchTemplate();
      invalidateDashboardList();
    } catch {
      // onError above already surfaces a toast.
    }
  };

  if (!defaultTemplateId) {
    return (
      <TabContainer>
        <EmptyStateBox>
          <Typography sx={{ fontSize: 14 }}>No template selected.</Typography>
        </EmptyStateBox>
      </TabContainer>
    );
  }

  const backHeader = (
    <HeaderRow>
      <Box display="flex" alignItems="center" gap={1.5}>
        <IconButton size="small" onClick={handleBack} aria-label="Back to Template Management">
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <SectionHeading>
          {isLoadingTemplate ? 'Loading…' : template?.subject || `Template #${defaultTemplateId}`}
        </SectionHeading>
      </Box>
    </HeaderRow>
  );

  // Same loading treatment while an override-row redirect (see the effect
  // above) is in flight — otherwise this override's own subject/body would
  // flash on screen for a frame as if it were the shared default before
  // the navigate() away actually lands.
  const isRedirectingToCanonicalDefault =
    template?.configId != null &&
    Boolean(template?.canonicalDefaultTemplateId) &&
    template.canonicalDefaultTemplateId !== defaultTemplateId;

  if (isLoadingTemplate || isRedirectingToCanonicalDefault) {
    return (
      <TabContainer>
        {backHeader}
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress size={28} />
        </Box>
      </TabContainer>
    );
  }

  // Backend values are lowercased defensively, same as TemplateDashboard's
  // own mapping does — the raw API casing has drifted before.
  const approvalStatus = String(template?.approvalStatus || '').toLowerCase();
  const templateStatus = String(template?.status || '').toLowerCase();
  const isDraft = approvalStatus === ApprovalStatusEnum.DRAFT;
  const isPendingApproval = approvalStatus === ApprovalStatusEnum.PENDING_APPROVAL;
  const isApproved = approvalStatus === ApprovalStatusEnum.APPROVED;
  const isRejected = approvalStatus === ApprovalStatusEnum.REJECTED;
  const isTemplateActive = templateStatus === TemplateStatusEnum.ACTIVE;
  const currentUserId = JSON.parse(sessionStorage.getItem('user') || '{}').userId;
  const isCreator = Boolean(currentUserId && template?.createdBy && Number(template.createdBy) === currentUserId);
  const hasTrigger = template?.eventTypeId != null;
  // IBP email event types (Welcome, 2FA, password reset, support ticket,
  // etc.) don't go through this approval workflow yet — it'll be picked up
  // in a later phase. Backend also rejects a workflow call for these as
  // defense in depth (see processWorkflowAction).
  const skipsApprovalWorkflow = Boolean(template?.isCompanyCustomizable);

  const actionsRow = (
    <SelectorRow>
      {isRejected && !skipsApprovalWorkflow && (
        <Button
          variantType="secondary"
          sizeType="small"
          startIcon={<EditIcon fontSize="small" />}
          onClick={() => handleWorkflowAction(WorkflowActionEnum.REVISE)}
          disabled={isWorkflowActionPending}
        >
          Revise
        </Button>
      )}
      {(isDraft || isApproved) && (
        <Button
          variantType="secondary"
          sizeType="small"
          startIcon={<EditIcon fontSize="small" />}
          onClick={handleEditDefault}
        >
          Edit default
        </Button>
      )}
      {isDraft && !skipsApprovalWorkflow && (
        <Button
          variantType="secondary"
          sizeType="small"
          startIcon={<RateReviewIcon fontSize="small" />}
          onClick={() => handleWorkflowAction(WorkflowActionEnum.SUBMIT)}
          disabled={isWorkflowActionPending}
        >
          Submit for Approval
        </Button>
      )}
      {isPendingApproval && isCreator && !skipsApprovalWorkflow && (
        <Button
          variantType="secondary"
          sizeType="small"
          startIcon={<UndoIcon fontSize="small" />}
          onClick={() => handleWorkflowAction(WorkflowActionEnum.WITHDRAW)}
          disabled={isWorkflowActionPending}
        >
          Withdraw
        </Button>
      )}
      <Button
        variantType="secondary"
        sizeType="small"
        startIcon={<HistoryIcon fontSize="small" />}
        onClick={handleHistoryDefault}
      >
        History
      </Button>
      <Button
        variantType="secondary"
        sizeType="small"
        startIcon={<PreviewIcon fontSize="small" />}
        onClick={handlePreviewDefault}
      >
        Preview
      </Button>
      {hasTrigger && !skipsApprovalWorkflow && (
        <Button
          variantType="secondary"
          sizeType="small"
          startIcon={<DeleteIcon fontSize="small" />}
          onClick={() => setRemoveTriggerDialogOpen(true)}
          disabled={isWorkflowActionPending}
        >
          Remove Trigger
        </Button>
      )}
      <Button
        variantType="secondary"
        sizeType="small"
        startIcon={isTemplateActive ? <BlockIcon fontSize="small" /> : <CheckCircleOutlineIcon fontSize="small" />}
        onClick={() => setStatusDialogOpen(true)}
        disabled={isWorkflowActionPending}
        sx={isTemplateActive ? { color: 'error.main', borderColor: 'error.main' } : undefined}
      >
        {isTemplateActive ? 'Disable' : 'Enable'}
      </Button>
    </SelectorRow>
  );

  const channelTypeLabel =
    CHANNEL_TYPES.find((c) => c.id === template?.channelTypeId)?.label ||
    findChannelType(template?.channelTypeId)?.label;

  // Every row in Template Management is clickable into this page, and every
  // template shows the same Customise section — no allow-list gate. "No
  // company has customized this yet" is itself the correct, honest state
  // for a template nobody's customized, same as any other.
  return (
    <TabContainer>
      <HeaderRow>
        <Box display="flex" alignItems="center" gap={1.5}>
          <IconButton size="small" onClick={handleBack} aria-label="Back to Template Management">
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Box>
            <Box display="flex" alignItems="center" gap={1}>
              <SectionHeading>{template?.subject || `Template #${defaultTemplateId}`}</SectionHeading>
              {channelTypeLabel && <Chip label={channelTypeLabel.toUpperCase()} size="small" />}
              {!isTemplateActive && <StatusBadge tone="disabled" label="Disabled" />}
            </Box>
            <SectionSubheading>
              {isCompanyLevel
                ? "Pick a company below to edit its own copy of this template, or customise it for " +
                  "a company that doesn't have one yet. The shared default and every other company " +
                  'are unaffected.'
                : 'Pick a company/domain below to edit its own copy of this template, or customise ' +
                  "it for a different company/domain that doesn't have one yet. The shared default " +
                  'and every other company/domain are unaffected.'}
            </SectionSubheading>
          </Box>
        </Box>
      </HeaderRow>

      {actionsRow}

      {/* Always visible, not just after clicking "Edit default" — landing
          on this page should immediately show the shared default's content
          + Live Preview, view-only, exactly as it currently is. "Edit
          default" switches this same view into edit mode rather than
          revealing it for the first time. Its own "Customise for a
          Company/Domain" (or "...for a Company") button (always available,
          view-only or editing) carries over whatever's shown here — real
          default or in-progress draft — as the starting point for a new
          company/domain, which is why there's no separate "customise for a
          different company" button down in the overrides list below
          anymore; this is the one place that decision starts from. */}
      <Box>
        <SectionHeading sx={{ fontSize: '14px' }}>
          {editingDefault ? 'Editing the shared default' : 'Shared default (view only)'}
        </SectionHeading>
        <DefaultTemplateEditor
          key={`default-${defaultTemplateId}`}
          defaultTemplateId={defaultTemplateId}
          subject={template?.subject ?? ''}
          body={template?.body ?? ''}
          canEdit={editingDefault}
          companyLevel={isCompanyLevel}
          onCancel={() => setEditingDefault(false)}
          onSaved={() => {
            refetchTemplate();
            invalidateDashboardList();
          }}
        />
      </Box>

      {isCompanyLevel ? (
        <Box>
          <SectionHeading sx={{ fontSize: '14px' }}>
            Customised for {isLoadingCompanyOverrides ? '…' : companyOverrides.length} compan{companyOverrides.length === 1 ? 'y' : 'ies'}
          </SectionHeading>

          {isLoadingCompanyOverrides ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress size={24} />
            </Box>
          ) : companyOverrides.length === 0 ? (
            <EmptyStateBox>
              <Typography sx={{ fontSize: 14 }}>No company has customized this yet.</Typography>
              <Typography sx={{ fontSize: 12.5 }}>
                Use "Customise for a Company" above to create one.
              </Typography>
            </EmptyStateBox>
          ) : (
            <OverrideListPanel>
              {companyOverrides.map((override) => (
                <OverrideListRow
                  key={override.companyId}
                  onClick={() => handleSelectExistingCompany(override)}
                >
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>
                      {override.companyName || `Company #${override.companyId}`}
                    </Typography>
                    {!override.isActive && <StatusBadge tone="disabled" label="Disabled" />}
                  </Box>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                    Updated {new Date(override.updatedAt).toLocaleDateString()}
                  </Typography>
                </OverrideListRow>
              ))}
            </OverrideListPanel>
          )}
        </Box>
      ) : (
        <Box>
          <SectionHeading sx={{ fontSize: '14px' }}>
            Customised for {isLoadingOverrides ? '…' : overrides.length} compan{overrides.length === 1 ? 'y' : 'ies'}/domain{overrides.length === 1 ? '' : 's'}
          </SectionHeading>

          {isLoadingOverrides ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress size={24} />
            </Box>
          ) : overrides.length === 0 ? (
            <EmptyStateBox>
              <Typography sx={{ fontSize: 14 }}>No company has customized this yet.</Typography>
              <Typography sx={{ fontSize: 12.5 }}>
                Use "Customise for a Company/Domain" above to create one.
              </Typography>
            </EmptyStateBox>
          ) : (
            <OverrideListPanel>
              {overrides.map((override) => (
                <OverrideListRow
                  key={override.configId}
                  onClick={() => handleSelectExisting(override)}
                >
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>
                      {override.companyName || `Company #${override.companyId ?? '—'}`}
                    </Typography>
                    {override.subDomain && <CompanyDomainChip label={override.subDomain} size="small" />}
                    {!override.isActive && <StatusBadge tone="disabled" label="Disabled" />}
                  </Box>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                    Updated {new Date(override.updatedAt).toLocaleDateString()}
                  </Typography>
                </OverrideListRow>
              ))}
            </OverrideListPanel>
          )}
        </Box>
      )}

      <Dialog open={removeTriggerDialogOpen} onClose={() => setRemoveTriggerDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Remove trigger assignment?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
            Are you sure you want to remove the trigger assignment from this template?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variantType="secondary" sizeType="small" onClick={() => setRemoveTriggerDialogOpen(false)}>
            Cancel
          </Button>
          <Button variantType="primary" sizeType="small" onClick={handleRemoveTriggerConfirm}>
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{isTemplateActive ? 'Disable this template?' : 'Enable this template?'}</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14 }}>
            {isTemplateActive
              ? 'This is the shared default — every company/domain that hasn\'t customized ' +
                `"${template?.subject || 'this template'}" will stop receiving this email until ` +
                'it\'s re-enabled. Companies with their own customization are unaffected. Are you sure?'
              : `Every company/domain without their own customization of "${template?.subject || 'this template'}" ` +
                'will start receiving it again. Are you sure?'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variantType="secondary" sizeType="small" onClick={() => setStatusDialogOpen(false)}>
            Cancel
          </Button>
          <Button variantType="primary" sizeType="small" onClick={handleToggleStatusConfirm}>
            {isTemplateActive ? 'Disable' : 'Enable'}
          </Button>
        </DialogActions>
      </Dialog>
    </TabContainer>
  );
};

export default TemplateCustomisation;
