import React, { useRef, useState } from 'react';
import {
  Box,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import HistoryIcon from '@mui/icons-material/History';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SaveIcon from '@mui/icons-material/Save';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { Button, endPoints, setToastMessage, useApiMutation, useApiQuery } from '@ui/ui-lib';
import { TEMPLATE_MANAGEMENT_BASE_PATH } from '../../../routes/template-management.route';
import { ChangeLogTable } from '../shared/ChangeLogTable';
import { GrapesJsSplitEditor, GrapesJsSplitEditorHandle } from '../shared/GrapesJsSplitEditor';
import { PENDING_DRAFT_STORAGE_KEY } from './DefaultTemplateEditor';
import {
  EditorPanel,
  EmptyStateBox,
  SectionHeading,
  SelectorRow,
  StatusBadge,
} from './styles';
import { EffectiveTemplate, TemplateChangeLogEntry } from './types';

// Domain-scoped (IBP employee-facing templates — Welcome/OTP/etc., one
// company can have several domains) or company-wide (iwork/internal-CRM
// event types — Opportunity Creation/MIR reports/etc., no domain concept at
// all). Exactly one of these two scopes applies to any given template, per
// isCompanyCustomizable vs isCompanyLevelCustomizable on the default row —
// see template.service.ts::mapToResponseDto.
export type OverrideScope =
  | { type: 'config'; configId: number }
  | { type: 'company'; companyId: number };

const scopeNoun = (scope: OverrideScope) => (scope.type === 'config' ? 'company/domain' : 'company');

interface TemplateOverrideEditorProps {
  defaultTemplateId: number;
  scope: OverrideScope;
  canEdit: boolean;
  /** Just for the "Reset to default" confirmation copy — no behavioral effect. */
  eventTypeLabel?: string;
  /** A draft carried over from DefaultTemplateEditor's "Save for a
   * Company/Domain" action — the user was editing the shared default,
   * decided partway through to extend that in-progress edit to a specific
   * company/domain instead, picked one via NewCustomisation.tsx, and landed
   * back here. When present, this pre-fills (and marks dirty) instead of
   * this config's currently-effective content, so the edit isn't lost. */
  initialDraft?: { subject: string; body: string } | null;
  /** Parent (TemplateCustomisation/index.tsx) refetches its overrides list
   * on either — a save can turn a "not yet customized" domain into one that
   * belongs in that list, and a reset removes it from there. */
  onSaved?: () => void;
  onReset?: () => void;
  /** canEdit is a prop, not local state — the parent (CustomiseCompanyEditor)
   * owns whether this screen is currently in edit mode, same pattern
   * DefaultTemplateEditor's canEdit/onCancel already use. Land view-only by
   * default; onRequestEdit flips the parent's state to enable the Subject
   * field + body editor, onCancelEdit flips it back without saving. */
  onRequestEdit?: () => void;
  onCancelEdit?: () => void;
}

/**
 * Edit view for one specific (defaultTemplateId, scope) pair — subject +
 * visual body editor (GrapesJS) + live preview + Save/Reset/History. This is
 * the same editing experience originally built for the "Customise Email
 * Templates" tab on Portal Configuration, relocated here and generalized:
 * the caller already knows exactly which template and which company/domain
 * (picked via the drill-down in TemplateCustomisation/index.tsx), so there's
 * no template-picker dropdown here — just the edit surface itself.
 *
 * `scope` picks which of the two parallel backend override systems this
 * editor talks to — domain-scoped (configId) for IBP employee-facing
 * templates, or company-wide (companyId) for iwork/internal-CRM ones with no
 * domain concept. Every endpoint/payload branches on scope.type; nothing
 * else about the editing experience differs between the two.
 *
 * Body is edited visually (GrapesJS, newsletter preset) rather than as raw
 * HTML. Every {{handlebars}} token is protected (see
 * handlebarsHtmlProtection.ts) before GrapesJS ever parses the HTML, and
 * restored only inside GrapesJsEmailEditor's getHtml() — verified
 * end-to-end against the most complex real template in this codebase.
 */
export const TemplateOverrideEditor: React.FC<TemplateOverrideEditorProps> = ({
  defaultTemplateId,
  scope,
  canEdit,
  eventTypeLabel,
  initialDraft,
  onSaved,
  onReset,
  onRequestEdit,
  onCancelEdit,
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  // TemplateDashboard's own list fetches under a separate queryKey and was
  // never invalidated after a save/status-change here — it kept showing
  // stale content after an edit that had already landed in the DB.
  const invalidateDashboardList = () =>
    queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
  const [draftSubject, setDraftSubject] = useState(initialDraft?.subject ?? '');
  // Body has no equivalent "draft string" — GrapesJS owns its own content
  // imperatively (see GrapesJsEmailEditor). isBodyDirty just gates the Save
  // button/unsaved-changes prompt; the actual current HTML is only ever
  // pulled (via editorRef.getHtml()) at the moment it's needed, in
  // handleSave and for the debounced preview refresh below. Both start
  // already-dirty when a carried-over draft is present, so Save captures
  // it immediately rather than requiring the user to touch something first.
  const [isSubjectDirty, setIsSubjectDirty] = useState(Boolean(initialDraft));
  const [isBodyDirty, setIsBodyDirty] = useState(Boolean(initialDraft));
  const isDirty = isSubjectDirty || isBodyDirty;
  const clearDirty = () => {
    setIsSubjectDirty(false);
    setIsBodyDirty(false);
  };
  // Bumped on Cancel to force a full GrapesJsSplitEditor remount — same
  // reason DefaultTemplateEditor bumps its own editSessionKey: canEdit
  // toggling true->false alone doesn't reset the editor's internal Live
  // Preview state, only a `html` prop change (or full remount) does.
  const [editSessionKey, setEditSessionKey] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const editorRef = useRef<GrapesJsSplitEditorHandle>(null);

  const scopeId = scope.type === 'config' ? scope.configId : scope.companyId;

  const {
    data: effectiveResponse,
    isFetching: isLoadingTemplate,
    error: effectiveError,
    refetch: refetchEffective,
  } = useApiQuery({
    url:
      scope.type === 'config'
        ? endPoints.templatesEffective(scope.configId)
        : endPoints.templatesEffectiveForCompany(scope.companyId),
    queryKey: ['templates-effective', scope.type, scopeId],
    enabled: Boolean(scopeId),
  });

  // Reused as-is (TRD §3.1) rather than a new narrower endpoint — the
  // response is small (≤16 rows), pick out the one row this editor cares
  // about.
  const templates: EffectiveTemplate[] = (effectiveResponse as any)?.data ?? [];
  const template = templates.find((t) => t.defaultTemplateId === defaultTemplateId) ?? null;

  const displayedSubject = isSubjectDirty ? draftSubject : template?.subject ?? '';

  const getCurrentBodyHtml = (): string => {
    if (isBodyDirty && editorRef.current) {
      return editorRef.current.getHtml();
    }
    return template?.body ?? '';
  };

  // GrapesJsSplitEditor owns the live-preview state/debounce/iframe-remount
  // logic internally now (shared with TemplateEditor's email-channel body
  // editor) — this component just needs to know when the user has edited.
  const handleEditorDirty = () => {
    setIsBodyDirty(true);
  };

  const {
    data: historyResponse,
    isFetching: isHistoryLoading,
  } = useApiQuery({
    url: historyOpen
      ? scope.type === 'config'
        ? endPoints.templateChangeLog(defaultTemplateId, scope.configId)
        : endPoints.templateChangeLog(defaultTemplateId, undefined, scope.companyId)
      : '',
    queryKey: ['template-change-log', defaultTemplateId, scope.type, scopeId, historyOpen],
    enabled: Boolean(historyOpen),
  });

  const historyEntries: TemplateChangeLogEntry[] = (historyResponse as any)?.data ?? [];

  const { mutateAsync: saveOverride, isPending: isSaving } = useApiMutation({
    config: {
      onSuccess: () => {
        dispatch(setToastMessage(`Template customized for this ${scopeNoun(scope)}.`));
        clearDirty();
        refetchEffective();
        invalidateDashboardList();
        onSaved?.();
      },
      onError: (error: any) => {
        dispatch(setToastMessage(error?.message || 'Failed to save template customization.'));
      },
    },
  });

  const { mutateAsync: resetOverride, isPending: isResetting } = useApiMutation({
    config: {
      onSuccess: () => {
        dispatch(setToastMessage('Reverted to the default template.'));
        clearDirty();
        refetchEffective();
        invalidateDashboardList();
        onReset?.();
      },
      onError: (error: any) => {
        dispatch(setToastMessage(error?.message || 'Failed to reset template.'));
      },
    },
  });

  const { mutateAsync: setOverrideStatus, isPending: isTogglingStatus } = useApiMutation({
    config: {
      onSuccess: (_data, variables: any) => {
        dispatch(setToastMessage(variables?.data?.active ? 'Template enabled.' : 'Template disabled.'));
        refetchEffective();
        invalidateDashboardList();
      },
      onError: (error: any) => {
        dispatch(setToastMessage(error?.message || 'Failed to update template status.'));
      },
    },
  });

  const handleSave = async () => {
    if (!template) return;
    const bodyToSave = getCurrentBodyHtml();
    if (!displayedSubject.trim() || !bodyToSave.trim()) {
      dispatch(setToastMessage('Subject and body are both required.'));
      return;
    }
    await saveOverride({
      endpoint:
        scope.type === 'config'
          ? endPoints.templateOverride(defaultTemplateId)
          : endPoints.templateCompanyOverride(defaultTemplateId),
      method: 'PUT',
      data:
        scope.type === 'config'
          ? { configId: scope.configId, subject: displayedSubject, body: bodyToSave }
          : { companyId: scope.companyId, subject: displayedSubject, body: bodyToSave },
    });
  };

  const handleCancelEdit = () => {
    setDraftSubject(template?.subject ?? '');
    clearDirty();
    setEditSessionKey((k) => k + 1);
    onCancelEdit?.();
  };

  const handleConfirmReset = async () => {
    setResetDialogOpen(false);
    await resetOverride({
      endpoint:
        scope.type === 'config'
          ? endPoints.templateOverrideDelete(defaultTemplateId, scope.configId)
          : endPoints.templateCompanyOverrideDelete(defaultTemplateId, scope.companyId),
      method: 'DELETE',
    });
  };

  // Toggles activeStatusLid on THIS company/domain's (or company's) override
  // row — the one column the send path always enforces (see
  // notification.repository.ts::findTemplateMapping), so this is what
  // actually stops/resumes the email for this scope specifically, not a
  // cosmetic label.
  const handleConfirmToggleStatus = async () => {
    const nextActive = !template?.isActive;
    setStatusDialogOpen(false);
    await setOverrideStatus({
      endpoint: endPoints.templateStatus(defaultTemplateId),
      method: 'PUT',
      data:
        scope.type === 'config'
          ? { active: nextActive, configId: scope.configId }
          : { active: nextActive, companyId: scope.companyId },
    });
  };

  // Carries THIS company/domain's (or company's) own current content (its
  // real saved customization, or an in-progress edit draft) into the picker
  // as the starting point for a different one — same mechanism
  // DefaultTemplateEditor's own version of this button uses, just seeded
  // from this override instead of the shared default. Without this, the
  // only way to start a new customization was always from the plain
  // default, with no way to "clone" an existing one's wording.
  const handleCustomiseForAnother = () => {
    const bodyToSave = getCurrentBodyHtml();
    if (!displayedSubject.trim() || !bodyToSave.trim()) {
      dispatch(setToastMessage('Subject and body are both required.'));
      return;
    }
    sessionStorage.setItem(
      PENDING_DRAFT_STORAGE_KEY,
      JSON.stringify({ defaultTemplateId, subject: displayedSubject, body: bodyToSave })
    );
    navigate(
      scope.type === 'config'
        ? `/${TEMPLATE_MANAGEMENT_BASE_PATH}/customise/${defaultTemplateId}/new`
        : `/${TEMPLATE_MANAGEMENT_BASE_PATH}/customise/${defaultTemplateId}/new-company`
    );
  };

  if (isLoadingTemplate) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (!template) {
    // findEffectiveTemplates(ForCompany) always falls back to the shared
    // default when no override exists for this scope — it should never
    // legitimately return "no row at all" for an event type this screen
    // already knows is customizable. Reaching this branch in practice means
    // the request itself failed (bad scope id, backend error, etc.) and got
    // silently treated as "no data" upstream — surface the real reason
    // instead of a generic dead end.
    const message = (effectiveError as any)?.message || (effectiveError as any)?.error;
    return (
      <EmptyStateBox>
        <Typography sx={{ fontSize: 14 }}>
          Couldn't load this template for the selected {scopeNoun(scope)}.
        </Typography>
        {message ? (
          <Typography sx={{ fontSize: 12.5, color: 'error.main' }}>{String(message)}</Typography>
        ) : (
          <Typography sx={{ fontSize: 12.5 }}>
            {scope.type}: {scopeId}, defaultTemplateId: {defaultTemplateId}, rows returned:{' '}
            {templates.length} ({templates.map((t) => `${t.defaultTemplateId}:${t.eventTypeName}`).join(', ') || 'none'})
          </Typography>
        )}
      </EmptyStateBox>
    );
  }

  return (
    <EditorPanel>
      {/* History/Edit/Reset to Default/Disable have no equivalent in
          DefaultTemplateEditor (they live on the hub page's own action row
          for the default template, which has no counterpart here) — grouped
          in one row right under the header. Customise for another
          company/domain (or company) + Save stay at the bottom next to the
          edit surface, same position and order DefaultTemplateEditor uses
          for its own Customise/Save. */}
      <SelectorRow>
        <Button
          variantType="secondary"
          sizeType="small"
          startIcon={<HistoryIcon fontSize="small" />}
          onClick={() => setHistoryOpen((open) => !open)}
        >
          {historyOpen ? 'Hide History' : 'History'}
        </Button>
        {/* Lands view-only, same as the shared default's own screen — Edit
            is what actually enables the Subject field + body editor below,
            everything else in this row works regardless of edit mode. */}
        {!canEdit && (
          <Button
            variantType="secondary"
            sizeType="small"
            startIcon={<EditIcon fontSize="small" />}
            onClick={() => onRequestEdit?.()}
          >
            Edit
          </Button>
        )}
        {template.isOverride && (
          <Button
            variantType="secondary"
            sizeType="small"
            startIcon={<RestartAltIcon fontSize="small" />}
            onClick={() => setResetDialogOpen(true)}
            disabled={isSaving || isResetting}
          >
            Reset to Default
          </Button>
        )}
        {template.isOverride && (
          <Button
            variantType="secondary"
            sizeType="small"
            startIcon={template.isActive ? <BlockIcon fontSize="small" /> : <CheckCircleOutlineIcon fontSize="small" />}
            onClick={() => setStatusDialogOpen(true)}
            disabled={isSaving || isResetting || isTogglingStatus}
            sx={template.isActive ? { color: 'error.main', borderColor: 'error.main' } : undefined}
          >
            {template.isActive ? 'Disable' : 'Enable'}
          </Button>
        )}
        {/* Status tags pushed to the far right — actions read as one
            left-aligned group, tags as a distinct right-aligned group,
            rather than a tag sitting in front of the buttons. */}
        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
          <StatusBadge
            tone={template.isOverride ? 'override' : 'default'}
            label={template.isOverride ? `Customized for this ${scopeNoun(scope)}` : 'Default (not yet customized)'}
          />
          {!template.isActive && <StatusBadge tone="disabled" label="Disabled" />}
        </Box>
      </SelectorRow>

      {historyOpen && (
        <Box>
          <SectionHeading sx={{ fontSize: '14px' }}>Change History</SectionHeading>
          {isHistoryLoading ? (
            <Box display="flex" justifyContent="center" py={3}>
              <CircularProgress size={20} />
            </Box>
          ) : (
            <ChangeLogTable
              entries={historyEntries}
              emptyMessage={`No changes recorded yet for this ${scopeNoun(scope)}.`}
            />
          )}
        </Box>
      )}

      <TextField
        label="Subject"
        size="small"
        fullWidth
        value={displayedSubject}
        disabled={!canEdit}
        onChange={(e) => {
          setDraftSubject(e.target.value);
          setIsSubjectDirty(true);
        }}
        placeholder="Use {{parameter}} for dynamic values"
      />

      {/* Remounts (fresh GrapesJS instance, fresh protected HTML, fresh
          preview) whenever the template, scope, or override-vs-default
          state changes — the last part matters specifically for Reset to
          Default: isOverride flips true->false with the SAME
          defaultTemplateId, and the editor needs to reload the
          now-current (default) content rather than keep showing the
          just-discarded edit. */}
      <GrapesJsSplitEditor
        key={`gjs-${template.defaultTemplateId}-${scope.type}-${scopeId}-${template.isOverride}-${editSessionKey}`}
        ref={editorRef}
        html={initialDraft?.body ?? template.body}
        canEdit={canEdit}
        onDirty={handleEditorDirty}
        height={520}
      />

      {/* Unconditional row, same as DefaultTemplateEditor's own bottom bar —
          Customise for another company/domain (or company) stays visible
          view-only or editing, only Cancel/Save appear once Edit is
          clicked. */}
      <Box display="flex" gap={1.5} justifyContent="flex-end">
        {canEdit && (
          <Button
            variantType="secondary"
            sizeType="small"
            startIcon={<CloseIcon fontSize="small" />}
            onClick={handleCancelEdit}
            disabled={isSaving}
          >
            Cancel
          </Button>
        )}
        {/* Always available, view-only or editing — carries over THIS
            scope's own current content (real saved customization, or an
            in-progress draft) as the starting point for a different
            company/domain (or company). */}
        <Button
          variantType="secondary"
          sizeType="small"
          startIcon={<AddIcon fontSize="small" />}
          onClick={handleCustomiseForAnother}
          disabled={isSaving || isResetting}
        >
          {scope.type === 'config' ? 'Customise for a Company/Domain' : 'Customise for a Company'}
        </Button>
        {canEdit && (
          <Button
            variantType="primary"
            sizeType="small"
            startIcon={<SaveIcon fontSize="small" />}
            onClick={handleSave}
            disabled={isSaving || isResetting}
          >
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
        )}
      </Box>

      <Dialog open={resetDialogOpen} onClose={() => setResetDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Reset to default template?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14 }}>
            This removes this {scopeNoun(scope)}'s customization for "{eventTypeLabel || 'this template'}".
            It will go back to using the shared default template. This can't be undone, though the
            change is recorded in the history above.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variantType="secondary" sizeType="small" onClick={() => setResetDialogOpen(false)}>
            Cancel
          </Button>
          <Button variantType="primary" sizeType="small" onClick={handleConfirmReset} disabled={isResetting}>
            {isResetting ? 'Resetting…' : 'Reset to Default'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{template.isActive ? 'Disable this template?' : 'Enable this template?'}</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14 }}>
            {template.isActive
              ? `"${template.subject || 'This mail'}" is configured for ${eventTypeLabel || `this ${scopeNoun(scope)}`} — ` +
                "disabling it means they won't receive this email until it's re-enabled or reverted to " +
                'default. Are you sure?'
              : `${eventTypeLabel || `This ${scopeNoun(scope)}`} will start receiving "${template.subject || 'this mail'}" again. Are you sure?`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variantType="secondary" sizeType="small" onClick={() => setStatusDialogOpen(false)}>
            Cancel
          </Button>
          <Button variantType="primary" sizeType="small" onClick={handleConfirmToggleStatus} disabled={isTogglingStatus}>
            {template.isActive ? 'Disable' : 'Enable'}
          </Button>
        </DialogActions>
      </Dialog>
    </EditorPanel>
  );
};
