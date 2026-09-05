import React, { useRef, useState } from 'react';
import { Box, TextField } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Button, endPoints, setToastMessage, useApiMutation } from '@ui/ui-lib';
import { GrapesJsSplitEditor, GrapesJsSplitEditorHandle } from '../shared/GrapesJsSplitEditor';
import { TEMPLATE_MANAGEMENT_BASE_PATH } from '../../../routes/template-management.route';
import { EditorPanel } from './styles';

// sessionStorage key used to carry an in-progress default-template edit
// across the full-page navigation to NewCustomisation.tsx's company/domain
// picker and back — a plain page nav would otherwise lose unsaved GrapesJS
// content the moment the user leaves this page.
export const PENDING_DRAFT_STORAGE_KEY = 'template-customisation-pending-draft';

interface DefaultTemplateEditorProps {
  defaultTemplateId: number;
  subject: string;
  body: string;
  canEdit: boolean;
  /** True for iwork/internal-CRM event types (isCompanyLevelCustomizable —
   * no domain concept), false for IBP employee-facing ones
   * (isCompanyCustomizable — domain-scoped). Picks which picker page
   * "Customise for a Company/Domain" (or "...for a Company") sends the
   * draft to. */
  companyLevel?: boolean;
  /** Refetch the default template (subject/body/approvalStatus all change
   * on save) so the rest of the screen — header, action buttons — reflects
   * the new state immediately. */
  onSaved?: () => void;
  /** Switches the parent back to view-only mode (canEdit=false) — this
   * component discards its own draft state on the way out, so re-entering
   * edit mode later starts fresh from the real subject/body again, not a
   * stale abandoned edit. */
  onCancel?: () => void;
}

/**
 * Editing surface for the shared DEFAULT template itself — same GrapesJS +
 * Live Preview experience as the per-company/domain override editor
 * (TemplateOverrideEditor), reusing the same shared GrapesJsSplitEditor, but
 * saving is a genuine choice made at Save time rather than a fixed target:
 * - "Save as Default" updates the shared row directly (PUT /templates/:id) —
 *   the same endpoint/effect the old generic Template Editor page used, just
 *   without navigating away to it or its validate-for-event-type call.
 * - "Save for a Company/Domain" hands the in-progress draft to
 *   NewCustomisation.tsx's picker (stashed in sessionStorage since a full
 *   page nav would otherwise lose it), which on return opens
 *   TemplateOverrideEditor pre-seeded with this exact draft instead of the
 *   config's currently-effective content.
 */
export const DefaultTemplateEditor: React.FC<DefaultTemplateEditorProps> = ({
  defaultTemplateId,
  subject,
  body,
  canEdit,
  companyLevel,
  onSaved,
  onCancel,
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [draftSubject, setDraftSubject] = useState(subject);
  const [isSubjectDirty, setIsSubjectDirty] = useState(false);
  const [isBodyDirty, setIsBodyDirty] = useState(false);
  const isDirty = isSubjectDirty || isBodyDirty;
  const editorRef = useRef<GrapesJsSplitEditorHandle>(null);
  // Bumped on Cancel to force a full GrapesJsSplitEditor remount — canEdit
  // toggling false->true alone doesn't reset its internal Live Preview
  // state (that only re-syncs when its `html` prop itself changes), so
  // without this, re-entering edit mode after cancelling could briefly
  // show the abandoned draft's preview instead of the real content.
  const [editSessionKey, setEditSessionKey] = useState(0);

  const displayedSubject = isSubjectDirty ? draftSubject : subject;
  const getCurrentBodyHtml = (): string => {
    if (isBodyDirty && editorRef.current) return editorRef.current.getHtml();
    return body;
  };

  const { mutateAsync: saveDefault, isPending: isSaving } = useApiMutation({
    config: {
      onSuccess: () => {
        dispatch(setToastMessage('Default template updated.'));
        setIsSubjectDirty(false);
        setIsBodyDirty(false);
        onSaved?.();
      },
      onError: (error: any) => {
        dispatch(setToastMessage(error?.message || 'Failed to update default template.'));
      },
    },
  });

  const userDetails = JSON.parse(sessionStorage.getItem('user') || '{}');

  const handleSaveAsDefault = async () => {
    const bodyToSave = getCurrentBodyHtml();
    if (!displayedSubject.trim() || !bodyToSave.trim()) {
      dispatch(setToastMessage('Subject and body are both required.'));
      return;
    }
    await saveDefault({
      endpoint: endPoints.templateById(defaultTemplateId),
      method: 'PUT',
      data: { subject: displayedSubject, body: bodyToSave, updatedBy: userDetails.userId },
    });
  };

  const handleCancel = () => {
    setDraftSubject(subject);
    setIsSubjectDirty(false);
    setIsBodyDirty(false);
    setEditSessionKey((k) => k + 1);
    onCancel?.();
  };

  const handleSaveForCompanyDomain = () => {
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
      companyLevel
        ? `/${TEMPLATE_MANAGEMENT_BASE_PATH}/customise/${defaultTemplateId}/new-company`
        : `/${TEMPLATE_MANAGEMENT_BASE_PATH}/customise/${defaultTemplateId}/new`
    );
  };

  return (
    <EditorPanel>
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

      <GrapesJsSplitEditor
        key={`gjs-default-${defaultTemplateId}-${editSessionKey}`}
        ref={editorRef}
        html={body}
        canEdit={canEdit}
        onDirty={() => setIsBodyDirty(true)}
        height={520}
      />

      <Box display="flex" gap={1.5} justifyContent="flex-end">
        {canEdit && (
          <Button
            variantType="secondary"
            sizeType="small"
            startIcon={<CloseIcon fontSize="small" />}
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
        )}
        {/* Always available, view-only or editing — carries over whatever's
            CURRENTLY shown here (the real default when just viewing, or the
            in-progress draft when editing) as the starting point for a new
            company/domain's customization, rather than always resetting to
            the plain default regardless of what the admin was just looking
            at. */}
        <Button
          variantType="secondary"
          sizeType="small"
          startIcon={<AddIcon fontSize="small" />}
          onClick={handleSaveForCompanyDomain}
          disabled={isSaving}
        >
          {companyLevel ? 'Customise for a Company' : 'Customise for a Company/Domain'}
        </Button>
        {canEdit && (
          <Button
            variantType="primary"
            sizeType="small"
            startIcon={<SaveIcon fontSize="small" />}
            onClick={handleSaveAsDefault}
            disabled={isSaving}
          >
            {isSaving ? 'Saving…' : 'Save as Default'}
          </Button>
        )}
      </Box>
    </EditorPanel>
  );
};
