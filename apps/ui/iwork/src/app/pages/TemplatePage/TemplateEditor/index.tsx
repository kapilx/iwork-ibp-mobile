import React, { useState, useEffect, useRef } from 'react';
import {
  Alert,
  Button,
  MenuItem,
  Tooltip,
  FormControl,
  Select,
  Autocomplete,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Visibility as PreviewIcon,
  Rule as ValidateIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { TEMPLATE_MANAGEMENT_BASE_PATH } from '../../../routes/template-management.route';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useApiQuery, useApiMutation, endPoints, CommonTextField, setToastMessage } from "@ui/ui-lib";
import { GrapesJsSplitEditor, GrapesJsSplitEditorHandle } from '../shared/GrapesJsSplitEditor';
import { TemplateLayout } from '../TemplateLayout';
import TemplatePreviewCommon from '../TemplatePreviewCommon';
import { ApiTemplate, ApiEventType, ApiBaseResponse, ApiEventVariablesResponse } from '../apiTypes';
import {
  EditorContainer,
  FormSection,
  EditorGrid,
  EditorPaper,
  ParameterChipContainer,
  ButtonContainer,
  EditorTitle,
  StyledParameterChip,
  FieldWrapper,
  InputLabelText,
  SectionWrapper,
  SubSectionTitle,
  EditorHeader,
  EditorTextArea,
  HelperText,
  StyledInfoIcon,
  EditorActionRow,
  PreviewSectionContainer,
  SubjectInputWrapper,
  SelectionRow,
  SelectionColumn,
  ErrorContainer,
  QuillWrapper,
  StyledPlainTextArea,
  StyledInputLabel,
  ConflictDialogPaper,
  ConflictDialogTitle,
  ConflictDialogText,
  ConflictHighlight,
  ConflictDialogActions,
} from "./styles";
import { TemplateEditorState, TemplateFormData } from "./types";
import {
  CHANNEL_TYPES,
  AVAILABLE_PARAMETERS,
  findChannelType,
} from "./constants";

const CommonTextFieldAny = CommonTextField as any;

const TemplateEditor: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);
  const userDetails = JSON.parse(sessionStorage.getItem('user') || '{}');
  const { userId, organisationId } = userDetails

  const [state, setState] = useState<TemplateEditorState>({
    loading: false,
    saving: false,
    previewOpen: true,
    isValidated: false,
    formData: {
      name: '',
      description: '',
      channelType: 'email',
      eventType: '',
      subject: '',
      content: '',
    },
  });

  const [lastFocusedField, setLastFocusedField] = useState<'content' | 'subject'>('content');
  const [testValues, setTestValues] = useState<Record<string, string>>({});
  const quillRef = useRef<ReactQuill>(null);
  // Email's body editor (GrapesJS + Live Preview, same experience as the
  // "Customise" override editor) — uncontrolled/imperative like
  // GrapesJsEmailEditor underneath, so state.formData.content is only ever
  // pulled from this ref at save time for the email channel, not kept in
  // sync on every keystroke.
  const grapesEditorRef = useRef<GrapesJsSplitEditorHandle>(null);

  // 1. Fetch Template Data if in Edit Mode
  const { data: apiTemplateData, isLoading: isTemplateLoading } = useApiQuery({
    url: isEditMode && id ? endPoints.templateById(id) : '',
    queryKey: ['template-detail', id],
    enabled: isEditMode && !!id,
  });

  // 2. Fetch Event Types
  const { data: eventTypesResponse } = useApiQuery({
    url: endPoints.templateEventTypes,
    queryKey: ['template-event-types'],
  });

  const apiEventTypes = (eventTypesResponse as ApiBaseResponse<ApiEventType[]>)?.data || [];

  // 3. Fetch Variables for the selected event
  const selectedEventObj = apiEventTypes.find((e: ApiEventType) => e.name === state.formData.eventType);

  const { data: variablesResponse } = useApiQuery({
    url: selectedEventObj?.id ? endPoints.templateVariablesByEventType(selectedEventObj.id) : '',
    queryKey: ['template-variables', selectedEventObj?.id],
    enabled: !!selectedEventObj?.id,
  });

  const apiVariables = (variablesResponse as ApiBaseResponse<ApiEventVariablesResponse>)?.data?.variables || [];

  const { mutateAsync: saveTemplateMutation } = useApiMutation({});

  // Sync Template Data - Load initial template data
  useEffect(() => {
    if (isEditMode && id && apiTemplateData && apiEventTypes.length > 0) {
      const t = (apiTemplateData as ApiBaseResponse<ApiTemplate>).data;
      const matchedChannel = findChannelType(t.channelType);
      
      // Extract subject with better fallback handling
      const templateSubject = t.subject ?? '';
      
      setState(prev => ({
        ...prev,
        isValidated: false,
        validationErrors: [],
        hasNoEventType: !t.eventTypeId, // Track if trigger was removed
        formData: {
          name: templateSubject || `Template ${t.id}`,
          description: '',
          channelType: CHANNEL_TYPES.find(c => c.id === t.channelTypeId)?.key || matchedChannel?.key || 'email',
          eventType: apiEventTypes.find(e => 
            e.id === t.eventTypeId || 
            e.name === t.eventTypeName
          )?.name || '',
          subject: templateSubject,
          content: t.body || '',
        }
      }));
    }
  }, [id, isEditMode, apiTemplateData, apiEventTypes]);

  // Sync Global Loading
  useEffect(() => {
    setState(prev => ({ ...prev, loading: isTemplateLoading }));
  }, [isTemplateLoading]);

  // Force ReactQuill to update content when template data loads (for
  // whatsapp — email no longer uses ReactQuill, see GrapesJsSplitEditor
  // below, which handles its own initial-content loading via a gated
  // mount instead of this kind of after-the-fact sync)
  useEffect(() => {
    if (
      isEditMode &&
      quillRef.current &&
      state.formData.content &&
      state.formData.channelType === 'whats-app'
    ) {
      const editor = quillRef.current.getEditor();
      if (editor) {
        const currentContent = editor.root.innerHTML;
        // Only update if the editor content differs from state
        if (currentContent !== state.formData.content) {
          editor.clipboard.dangerouslyPasteHTML(state.formData.content);
        }
      }
    }
  }, [isEditMode, state.formData.content, state.formData.channelType]);

  const handleBack = () => {
    navigate(`/${TEMPLATE_MANAGEMENT_BASE_PATH}`);
  };

  // Helper to check if content is truly empty (strip HTML and whitespace)
  const isContentEmpty = (content: string) => {
    if (!content) return true;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    return textContent.trim().length === 0;
  };

  const { mutateAsync: validateMutation } = useApiMutation({});

  const handleValidate = async () => {
    setState((prev) => ({ ...prev, loading: true, validationErrors: [] }));

    try {
      const contentEmpty = isContentEmpty(state.formData.content);
      const subjectEmpty = !state.formData.subject || state.formData.subject.trim().length === 0;
      
      if (!state.formData.eventType || contentEmpty || subjectEmpty) {
        setState((prev) => ({ ...prev, loading: false }));
        dispatch(setToastMessage('Event Type, Subject, and Content are required for validation.'));
        return;
      }

      const eventObj = apiEventTypes.find(e => e.name === state.formData.eventType);
      if (!eventObj) {
        setState((prev) => ({ ...prev, loading: false }));
        dispatch(setToastMessage('Invalid Event Type selected.'));
        return;
      }

      const payload = {
        templateContent: state.formData.content,
        templateSubject: state.formData.subject || '',
        eventTypeId: eventObj.id
      };

      const response: any = await validateMutation({
        endpoint: endPoints.validateTemplateVariables,
        method: 'POST',
        data: payload
      });

      const validationResult = response?.data;
      
      if (validationResult && validationResult.isValid) {
        dispatch(setToastMessage('Template validation completed successfully!'));
        setState((prev) => ({ 
          ...prev, 
          loading: false, 
          isValidated: true, 
          validationErrors: []
        }));
      } else {
        // Should not happen if 200 checks isValid, but just in case
        setState((prev) => ({
          ...prev,
          loading: false,
          isValidated: false,
          validationErrors: validationResult?.errors || []
        }));
      }

    } catch (err: any) {
      console.error('Validation error:', err);
      if (err && err.isValid === false) {
        const errors = err.errors || [];
        setState((prev) => ({
          ...prev,
          loading: false,
          isValidated: false,
          validationErrors: errors
        }));
      } else {
        setState((prev) => ({ ...prev, loading: false }));
        dispatch(setToastMessage(err?.message || err?.response?.data?.message || 'Validation request failed.'));
      }
    }
  };

  // Sanitize content to remove trailing empty paragraphs added by Quill
  const sanitizeQuillContent = (content: string): string => {
    if (!content) return content;
    // Remove trailing <p><br></p> or <p><br/></p> tags
    let sanitized = content.replace(/(<p><br\s*\/?><\/p>\s*)+$/gi, '');
    // Also remove multiple consecutive empty paragraphs in the middle
    sanitized = sanitized.replace(/(<p><br\s*\/?><\/p>\s*){2,}/gi, '<p><br></p>');
    return sanitized;
  };

  const handleSave = async () => {
    setState((prev) => ({ ...prev, saving: true }));

    try {
      // Email's body lives in GrapesJS (uncontrolled), not
      // state.formData.content — pull it fresh from the editor ref right
      // now rather than relying on state that's never kept in sync on
      // every keystroke for that channel.
      const currentContent = state.formData.channelType === 'email' && grapesEditorRef.current
        ? grapesEditorRef.current.getHtml()
        : state.formData.content;

      // Validation
      if (!state.formData.channelType || !state.formData.eventType || !state.formData.subject || !currentContent) {
        setState((prev) => ({ ...prev, saving: false }));
        dispatch(setToastMessage('Please fill in all required fields (Channel, Event, Subject, and Content).'));
        return;
      }

      // Find IDs for channel and event based on SELECTION
      const channelObj = CHANNEL_TYPES.find(c => c.key === state.formData.channelType);
      const eventObj = apiEventTypes.find(e => e.name === state.formData.eventType);

      // Sanitize content before saving (remove trailing empty paragraphs)
      const sanitizedContent = sanitizeQuillContent(currentContent);

      // 1. Construct the payload based on backend DTO
      const payload: any = {
        channelTypeId: channelObj?.id, // Use selected ID
        eventTypeId: eventObj?.id,     // Use selected ID
        subject: state.formData.subject,
        body: sanitizedContent,
        organizationId: organisationId,
      };

      // Add appropriate user field based on mode
      if (isEditMode) {
        payload.updatedBy = userId;
        // Don't force isActive: false on edits - preserve existing state
      } else {
        payload.createdBy = userId;
        payload.isActive = false; // New templates start inactive
      }

      // 2. Call API via Mutation
      await saveTemplateMutation({
        endpoint: isEditMode ? endPoints.templateById(id!) : endPoints.templates,
        method: isEditMode ? 'PUT' : 'POST',
        data: payload
      });

      const successMessage = isEditMode 
        ? `Template "${state.formData.subject}" updated successfully`
        : `Template "${state.formData.subject}" created successfully`;
      
      dispatch(setToastMessage(successMessage));
      setState((prev) => ({ ...prev, saving: false }));
      navigate(`/${TEMPLATE_MANAGEMENT_BASE_PATH}`);
    } catch (err) {
      if (err) {
        console.error(err);
      }
      setState((prev) => ({ ...prev, saving: false }));
      dispatch(setToastMessage('Failed to save template. Please try again.'));
    }
  };

  const handleInputChange = (field: keyof TemplateFormData, value: string) => {
    setState((prev) => {
      const newFormData = { ...prev.formData, [field]: value };

      // Strip HTML when switching from rich text channels (email/whatsapp) to plain text channels
      const richTextChannels = ['email', 'whats-app'];
      const isFromRichText = richTextChannels.includes(prev.formData.channelType);
      const isToPlainText = !richTextChannels.includes(value);
      
      if (field === 'channelType' && isFromRichText && isToPlainText) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = prev.formData.content;
        newFormData.content = tempDiv.textContent || tempDiv.innerText || '';
      }

      return {
        ...prev,
        isValidated: false, // Reset validation on change
        validationErrors: [],
        formData: newFormData,
      };
    });
  };

  const handleEventTypeChange = async (newValue: ApiEventType | null) => {
    if (!newValue) {
      handleInputChange("eventType", "");
      return;
    }

    try {
      const parsed = JSON.parse(sessionStorage.getItem("user") || "{}");
      const token =
        parsed?.accessToken?.accessToken || parsed?.accessToken || "";

      const response = await fetch(endPoints.checkEventConflict, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // templateId=0 means create mode — backend excludes no template
        body: JSON.stringify({
          templateId: isEditMode && id ? parseInt(id, 10) : 0,
          eventTypeId: newValue.id,
          channelTypeKey: state.formData.channelType,
        }),
      });

      const json = await response.json();
      const result = json?.data;

      if (result?.isMapped) {
        setState((prev) => ({
          ...prev,
          conflictDialog: {
            open: true,
            conflictingTemplateName:
              result.conflictingTemplate?.subject || "another template",
            channelType: result.conflictingTemplate?.channelType || "",
          },
        }));
        return;
      }
    } catch (err) {
      console.error("Event conflict check failed:", err);
    }

    handleInputChange("eventType", newValue.name);
  };

  const insertParameter = (paramKey: string) => {
    if (lastFocusedField === 'subject') {
      const textarea = document.getElementById('template-subject-input') as HTMLInputElement;
      if (!textarea) return;
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const placeholder = `{{${paramKey}}}`;
      const currentValue = state.formData.subject || '';
      const newValue = currentValue.substring(0, start) + placeholder + currentValue.substring(end);
      handleInputChange('subject', newValue);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
      }, 0);
    } else if (state.formData.channelType === 'email' || state.formData.channelType === 'whats-app') {
      // Logic for Rich Text Channels (Email, WhatsApp)
      const editor = quillRef.current?.getEditor();
      if (editor) {
        const range = editor.getSelection(true);
        editor.insertText(range.index, `{{${paramKey}}}`);
        editor.setSelection(range.index + paramKey.length + 4, 0);
      }
    } else {
      // Logic for Plain Text Channels (SMS, In-App)
      const textarea = document.getElementById('template-content-input') as HTMLInputElement;
      if (!textarea) return;
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const placeholder = `{{${paramKey}}}`;
      const currentValue = state.formData.content || '';
      const newValue = currentValue.substring(0, start) + placeholder + currentValue.substring(end);
      handleInputChange('content', newValue);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
      }, 0);
    }
  };

  const togglePreview = () => {
    setState(prev => ({ ...prev, previewOpen: !prev.previewOpen }));
  };

  const handleTestValueChange = (key: string, value: string) => {
    setTestValues(prev => ({ ...prev, [key]: value }));
  };

  const selectedEvent = apiEventTypes.find((e: ApiEventType) => e.name === state.formData.eventType);
  const eventParams = (selectedEvent as any)?.variables?.map((v: any) => v.key) || (selectedEvent as any)?.parameters || [];

  const relevantParams = [
    ...AVAILABLE_PARAMETERS.filter(p => eventParams.includes(p.key)),
    ...apiVariables.map(v => ({ key: v.key, description: v.description }))
  ].filter((p, index, self) => self.findIndex(t => t.key === p.key) === index); // Unique by key

  const getDetectedParameters = () => {
    const content = state.formData.content || '';
    const subject = state.formData.subject || '';
    const combined = content + subject;
    const matches = Array.from(combined.matchAll(/{{(.*?)}}/g)).map((m: any) => m[1]);
    return Array.from(new Set(matches));
  };

  const detectedParamKeys = getDetectedParameters();

  const displayParams = detectedParamKeys.map(key => {
    const existing = AVAILABLE_PARAMETERS.find(p => p.key === key);
    return {
      key,
      description: existing?.description || `Value for ${key}`
    };
  });

  const getRenderedContent = (text: string) => {
    if (!text) return '';
    let rendered = text;
    Object.entries(testValues).forEach(([key, value]) => {
      if (value) {
        // Simple string replacement for preview
        rendered = rendered.split(`{{${key}}}`).join(value);
      }
    });
    return rendered;
  };

  const headerActions = (
    <ButtonContainer>
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={handleBack}
      >
        Back
      </Button>

      {!state.isValidated ? (
        <Button
          variant="contained"
          startIcon={<ValidateIcon />}
          onClick={handleValidate}
          disabled={state.loading || isContentEmpty(state.formData.content) || !state.formData.subject?.trim() || !state.formData.eventType}
          color="warning"
        >
          {state.loading ? 'Validating...' : 'Validate Template'}
        </Button>
      ) : (
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={state.saving || !state.isValidated || isContentEmpty(state.formData.content) || !state.formData.subject?.trim()}
        >
          {state.saving ? 'Saving...' : 'Save Template'}
        </Button>
      )}
    </ButtonContainer>
  );

  return (
    <>
      <TemplateLayout
        title={isEditMode ? "Edit Template" : "Create Template"}
        headerActions={headerActions}
      >
        <EditorContainer>
          <FormSection elevation={0}>
            <Box>
              <SubSectionTitle variant="subtitle2">
                Selection Criteria
              </SubSectionTitle>
              {state.validationErrors && state.validationErrors.length > 0 && (
                <ErrorContainer spacing={1}>
                  {state.validationErrors.map((err: any, idx: number) => (
                    <Alert key={idx} severity="error" variant="outlined">
                      {err.message} {err.variable ? `(${err.variable})` : ""}
                    </Alert>
                  ))}
                </ErrorContainer>
              )}

              <SelectionRow>
                <SelectionColumn>
                  <FormControl fullWidth size="small">
                    <StyledInputLabel
                      id="channel-type-select-label"
                      shrink={true}
                    >
                      Channel Type
                    </StyledInputLabel>
                    <Select
                      labelId="channel-type-select-label"
                      label="Channel Type"
                      value={state.formData.channelType}
                      onChange={(e) =>
                        handleInputChange("channelType", e.target.value)
                      }
                      disabled={isEditMode}
                    >
                      {CHANNEL_TYPES.map((option) => (
                        <MenuItem key={option.key} value={option.key}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </SelectionColumn>
                <SelectionColumn>
                  <Autocomplete
                    options={apiEventTypes}
                    getOptionLabel={(option) =>
                      typeof option === "string" ? option : option.name
                    }
                    value={
                      apiEventTypes.find(
                        (e) => e.name === state.formData.eventType
                      ) || null
                    }
                    onChange={(_, newValue) => handleEventTypeChange(newValue)}
                    disabled={isEditMode && !state.hasNoEventType}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Event Type"
                        placeholder="Select an event type"
                        size="small"
                        fullWidth
                        InputLabelProps={{
                          ...params.InputLabelProps,
                          shrink: true,
                          sx: {
                            "&.MuiInputLabel-shrink": {
                              color: "primary.main",
                              fontWeight: 500,
                              backgroundColor: "white",
                              padding: "0 4px",
                            },
                          },
                        }}
                      />
                    )}
                  />
                </SelectionColumn>
              </SelectionRow>
            </Box>
          </FormSection>

        <SectionWrapper>
          <EditorTitle variant="h6">Template Content</EditorTitle>
          <HelperText>
            Use formatting tools to design your template. Click on dynamic parameters to insert them.
          </HelperText>

          {/* Available Parameters chips + the Test-Parameters preview panel
              only apply to the non-email channels now — email's own Live
              Preview (inside GrapesJsSplitEditor below) already shows real
              rendered content side by side with editing, so a separate
              "insert {{param}} at cursor" affordance and value-testing
              screen would just be redundant clutter for that channel. */}
          {state.formData.channelType !== 'email' && relevantParams.length > 0 && (
            <SectionWrapper>
              <SubSectionTitle variant="subtitle2">
                Available Parameters <Tooltip title="These keys will be replaced with actual values at runtime"><StyledInfoIcon /></Tooltip>
              </SubSectionTitle>
              <ParameterChipContainer>
                {relevantParams.map((param) => (
                  <Tooltip key={param.key} title={param.description}>
                    <StyledParameterChip onClick={() => insertParameter(param.key)}>
                      {`{{${param.key}}}`}
                    </StyledParameterChip>
                  </Tooltip>
                ))}
              </ParameterChipContainer>
            </SectionWrapper>
          )}

          <EditorGrid>
            <EditorPaper elevation={0}>
              <SubjectInputWrapper>
                <FieldWrapper>
                  <InputLabelText>Subject</InputLabelText>
                  <CommonTextFieldAny
                    key={`subject-${id || 'new'}`}
                    fullWidth
                    value={state.formData.subject}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('subject', e.target.value)}
                    onFocus={() => setLastFocusedField('subject')}
                    placeholder="Enter template subject (e.g. Welcome {{name}})"
                    inputProps={{ id: 'template-subject-input' }}
                  />
                </FieldWrapper>
              </SubjectInputWrapper>
              <EditorHeader>
                <InputLabelText>Content</InputLabelText>
              </EditorHeader>
              <EditorTextArea>
                {state.formData.channelType === 'email' ? (
                  // In edit mode, wait for all data to load AND be set to
                  // state before mounting — GrapesJsSplitEditor is
                  // uncontrolled/imperative (like ReactQuill's own `value`
                  // would be if it weren't controlled), so its initial
                  // `html` prop has to already be correct at mount time; in
                  // create mode there's nothing to wait for.
                  (!isEditMode || (!isTemplateLoading && apiTemplateData && apiEventTypes.length > 0)) && (
                    <GrapesJsSplitEditor
                      key={`gjs-${id || 'new'}`}
                      ref={grapesEditorRef}
                      html={state.formData.content}
                      canEdit
                      onDirty={() => {
                        // No live-sync into state.formData.content needed —
                        // handleSave pulls the current HTML straight from
                        // grapesEditorRef when it's actually needed.
                      }}
                      height={520}
                    />
                  )
                ) : state.formData.channelType === 'whats-app' ? (
                  <QuillWrapper>
                    {/* In edit mode, wait for all data to load AND be set to state. In create mode, render immediately. */}
                    {(!isEditMode || (!isTemplateLoading && apiTemplateData && apiEventTypes.length > 0)) && (
                      <ReactQuill
                        key={`quill-${id || 'new'}-${state.formData.channelType}`}
                        ref={quillRef}
                        theme="snow"
                        value={state.formData.content}
                        onChange={(content) => handleInputChange('content', content)}
                        onFocus={() => setLastFocusedField('content')}
                        placeholder="Design your template here. Use {{parameter}} for dynamic values"
                        modules={{
                          toolbar: [
                            [{ 'header': [1, 2, 3, false] }],
                            ['bold', 'italic', 'underline', 'strike'],
                            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                            ['link', 'clean']
                          ],
                        }}
                      />
                    )}
                  </QuillWrapper>
                ) : (
                  <StyledPlainTextArea>
                    <CommonTextFieldAny
                      fullWidth
                      multiline
                      minRows={12}
                      value={state.formData.content}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('content', e.target.value)}
                      onFocus={() => setLastFocusedField('content')}
                      placeholder="Enter your message here. Use {{parameter}} for dynamic values"
                      inputProps={{ id: 'template-content-input' }}
                    />
                  </StyledPlainTextArea>
                )}
              </EditorTextArea>
            </EditorPaper>

            {state.formData.channelType !== 'email' && (
              <>
                <EditorActionRow>
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<PreviewIcon />}
                    onClick={togglePreview}
                  >
                    {state.previewOpen ? 'Hide Preview' : 'Show Preview'}
                  </Button>
                </EditorActionRow>

                <PreviewSectionContainer visible={state.previewOpen}>
                  <TemplatePreviewCommon
                    subject={state.formData.subject}
                    content={state.formData.content}
                    testValues={testValues}
                    displayParams={displayParams}
                    onTestValueChange={handleTestValueChange}
                    getRenderedContent={getRenderedContent}
                    showHeader={true}
                    emptyContentMessage="Type something in the editor to see it here..."
                    channelType={state.formData.channelType}
                  />
                </PreviewSectionContainer>
              </>
            )}
            </EditorGrid>
          </SectionWrapper>
        </EditorContainer>
      </TemplateLayout>

      <Dialog
        open={!!state.conflictDialog?.open}
        onClose={() =>
          setState((prev) => ({
            ...prev,
            conflictDialog: {
              open: false,
              conflictingTemplateName: "",
              channelType: "",
            },
          }))
        }
        PaperProps={{ sx: ConflictDialogPaper }}
      >
        <DialogTitle>
          <ConflictDialogTitle>Event Already Mapped</ConflictDialogTitle>
        </DialogTitle>
        <DialogContent>
          <ConflictDialogText>
            This event is already mapped to{" "}
            <ConflictHighlight>
              {state.conflictDialog?.conflictingTemplateName}
            </ConflictHighlight>
            {state.conflictDialog?.channelType ? (
              <>
                {" "}
                through{" "}
                <ConflictHighlight>
                  {state.conflictDialog.channelType}
                </ConflictHighlight>
              </>
            ) : null}
            . Please unmap it there to map here.
          </ConflictDialogText>
        </DialogContent>
        <ConflictDialogActions>
          <Button
            onClick={() =>
              setState((prev) => ({
                ...prev,
                conflictDialog: {
                  open: false,
                  conflictingTemplateName: "",
                  channelType: "",
                },
              }))
            }
            variant="contained"
            size="small"
          >
            OK
          </Button>
        </ConflictDialogActions>
      </Dialog>
    </>
  );
};

export default TemplateEditor;