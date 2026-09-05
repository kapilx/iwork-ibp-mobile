import React, { useEffect, useRef, useState } from "react";
// import DynamicForm from "../../../common/FormComponent";
import { NotesFormFields , NotesLinkFields } from "./formConfig";
import { NotesFormContainer } from "./styles";
import { UseFormReturn, FieldValues } from "react-hook-form";
import { MeetingNotesButtonPanel } from "../MeetingForm/styles";
import { useDispatch } from "react-redux"; // Add this import
import { StyledButton1, StyledFormBox } from "../TaskForm/styles";
import {
  useApiMutation,
  endPoints,
  setToastMessage,
  TaskMeetingNotesErrorMessages,
  CustomModal,
  DynamicForm,
  CANCEL, 
  CREATE, 
  DELETE, 
  UPDATE,
  LINK_TO_OPPORTUNITY
} from "@ui/ui-lib";
import { Typography } from "@mui/material";
import { NOTES_DETAILS } from "../../../../constants";

interface NotesFormProps {
  onCreated?: () => void;
  onCancel?: () => void;
  editMode?: boolean;
  initialData?: Record<string, unknown>;
  onNotesCreated?: (note: any) => void; // Add this line
  isFromOptyActivityPage?: boolean;
}

// Map backend data to form fields
const mapInitialDataToForm = (initialData: Record<string, any>) => ({
  title: initialData.title ?? initialData.noteTitle ?? "",
  content: initialData.description ?? "",
  companyId: initialData.companyId ?? initialData.company?.id ?? null,
  activityId: initialData.activityId ?? initialData.activity?.id ?? null,
  opportunityId: initialData.opportunityId ?? initialData.opportunity?.id ?? initialData.opportunity?.opportunityId ?? null,
});

const NotesForm: React.FC<NotesFormProps> = ({
  onCreated,
  onCancel,
  editMode = false,
  initialData,
  onNotesCreated,
  isFromOptyActivityPage = false,
}) => {
  const formMethodsRef = useRef<UseFormReturn<FieldValues> | null>(null);
  const dispatch = useDispatch();

  // Add state for delete modal
  const [openDeleteModal, setOpenDeleteModal] = React.useState(false);

  // Set default values for edit or create - prefill if initialData is provided
  const defaultValues = initialData ? mapInitialDataToForm(initialData) : {};

  const [notesLinkFormMethods, setNotesLinkFormMethods] =
      useState<UseFormReturn<FieldValues>>();

  // Reset main form when initialData changes
  useEffect(() => {
    if (initialData && formMethodsRef.current) {
      const mappedData = mapInitialDataToForm(initialData);
      formMethodsRef.current.reset(mappedData);
    }
  }, [initialData]);

  // Reset link form when it becomes available or initialData changes
  useEffect(() => {
    if (initialData && notesLinkFormMethods) {
      const mappedData = mapInitialDataToForm(initialData);
      notesLinkFormMethods.reset(mappedData);
    }
  }, [initialData, notesLinkFormMethods]);

  const { mutate, status } = useApiMutation({
    config: {
      onSuccess: (data) => {
        const updatedNote = mapInitialDataToForm(data);
        dispatch(
          setToastMessage(
            editMode
              ? TaskMeetingNotesErrorMessages.NOTES_UPDATED_SUCCESS
              : TaskMeetingNotesErrorMessages.NOTES_CREATED_SUCCESS
          )
        );
        formMethodsRef.current?.reset();
        if (onCreated) onCreated();
        if (onCancel) onCancel();
        onNotesCreated && onNotesCreated(updatedNote);
      },
      onError: (error: unknown) => {
        const message =
          typeof error === "object" && error && "message" in error
            ? (error as { message?: string }).message
            : undefined;
        dispatch(
          setToastMessage(
            message || TaskMeetingNotesErrorMessages.NOTES_FETCH_ERROR
          )
        );
      },
    },
  });

  // Delete logic

  const { mutate: deleteNote, status: deleteStatus } = useApiMutation({
    config: {
      onSuccess: () => {
        dispatch(
          setToastMessage(TaskMeetingNotesErrorMessages.NOTES_DELETE_SUCCESS)
        );
        formMethodsRef.current?.reset();
        if (onCreated) onCreated();
        if (onCancel) onCancel();
        setOpenDeleteModal(false);
      },
      onError: (error: any) => {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          TaskMeetingNotesErrorMessages.NOTES_DELETE_ERROR;
        dispatch(setToastMessage(message));
        setOpenDeleteModal(false);
      },
    },
  });

  const handleDelete = () => {
    if (!initialData?.id) return;
    deleteNote({
      endpoint: `${endPoints.createNotes}/${initialData.id}`,
      method: "DELETE",
      data: {}, // or undefined if your API doesn't require a body
    });
  };

  const handleFormMethods = (methods: UseFormReturn<FieldValues>) => {
    formMethodsRef.current = methods;
    // Reset with initial data if available
    if (initialData) {
      methods.reset(mapInitialDataToForm(initialData));
    }
  };

  const handleNotesLinkFormMethods = (methods: UseFormReturn<FieldValues>) => {
    setNotesLinkFormMethods(methods);
    // Reset with initial data if available
    if (initialData) {
      methods.reset(mapInitialDataToForm(initialData));
    }
  };

  const handleSubmit = async () => {
    if (!formMethodsRef.current) return;
    const formData = formMethodsRef.current.getValues();
    const linkFormData = notesLinkFormMethods?.getValues() || {};
    if (!formData.title && !formData.description) {
      formMethodsRef.current.trigger();
      dispatch(
        setToastMessage(TaskMeetingNotesErrorMessages.NOTES_REQUIRED_FIELDS)
      );
      return;
    }
    // Map form fields to expected API payload for notes
    const payload = {
      title: formData.title,
      description: formData.content,
      companyId: linkFormData.companyId,
      activityId: linkFormData.activityId,
      opportunityId: linkFormData.opportunityId,
    };
    const endpoint =
      editMode && initialData?.id
        ? `${endPoints.createNotes}/${initialData.id}`
        : endPoints.createNotes;
    const method = editMode ? "PUT" : "POST";
    mutate({ endpoint, method, data: payload });
  };

  return (
    <StyledFormBox>
      <Typography variant="h5">{NOTES_DETAILS}</Typography>
      <NotesFormContainer>
      <DynamicForm
        formConfig={NotesFormFields}
        formMethods={handleFormMethods}
        defaultValues={defaultValues}
      />
      </NotesFormContainer>
      <Typography variant="h5">{LINK_TO_OPPORTUNITY}</Typography>
      <NotesFormContainer>
      <DynamicForm
        formConfig={NotesLinkFields(isFromOptyActivityPage)}
        formMethods={handleNotesLinkFormMethods}
        defaultValues={defaultValues}
      />
      </NotesFormContainer>
      <MeetingNotesButtonPanel>
        {editMode ? (
          <StyledButton1
            variantType="danger"
            onClick={() => setOpenDeleteModal(true)}
            data-testid="delete-button"
            loadingPosition="start"
            className="button"
          >
            {DELETE}
          </StyledButton1>
        ) : (
          <StyledButton1
            variantType="secondary"
            onClick={onCancel}
            data-testid="cancel-button"
            loadingPosition="start"
            className="button"
          >
            {CANCEL}
          </StyledButton1>
        )}
        <StyledButton1
          variantType="primary"
          onClick={handleSubmit}
          loading={status === "pending"}
          data-testid="create-button"
          loadingPosition="center"
          className="button"
          disabled={status === "pending"}
        >
          {editMode ? UPDATE : CREATE}
        </StyledButton1>
      </MeetingNotesButtonPanel>
      {/* Delete Confirmation Modal */}
      <CustomModal
        open={openDeleteModal}
        handleClose={() => setOpenDeleteModal(false)}
        heading="Delete Note"
        buttons={[
          {
            label: CANCEL,
            onClick: () => setOpenDeleteModal(false),
            variant: "secondary",
          },
          {
            label: DELETE,
            onClick: handleDelete,
            variant: "primary",
          },
        ]}
      >
        {TaskMeetingNotesErrorMessages.NOTES_DELETE_CONFIRMATION}
      </CustomModal>
    </StyledFormBox>
  );
};

export default NotesForm;
