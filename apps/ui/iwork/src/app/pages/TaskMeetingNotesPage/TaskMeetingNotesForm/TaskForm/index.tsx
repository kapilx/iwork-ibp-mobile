import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  TaskDetailsFormFields,
  TaskLinkFields,
  TaskExtraFields,
} from "./formConfig";
import { StyledButton1, StyledFormBox } from "./styles";
import {
  LINK_TO_OPPORTUNITY,
  PRIORITY_TYPE,
  DELETE,
  CANCEL,
  UPDATE,
  CREATE,
  CANCEL_BUTTON,
  DynamicForm,
  useApiMutation,
  CommonAccordion,
  endPoints,
  setToastMessage,
  TaskMeetingNotesErrorMessages,
  CustomModal,
  theme,
  getSessionStorageData,
  useLookupIdByKey,
  CLOSE_TASK,
  NestedDynamicForm,
  NestedGroupedDataCollectionHandle,
  FormFieldConfig,
  PRIORITY_STATUS,
  BUTTON_TYPE,
} from "@ui/ui-lib";
import { FieldValues, UseFormReturn } from "react-hook-form";
import dayjs from "dayjs";
import { Typography } from "@mui/material";
import {
  MeetingNotesButtonPanel,
  TasksFormContainer,
  SectionTitle,
} from "../MeetingForm/styles";
import { useDispatch } from "react-redux";
import { ALERT_MESSAGES } from "../../../../constants";
import { LookUpValues as iWorkLookUpValues } from "../../../../constants/lookupValues.js";
import { closeTaskModalConfig } from "./formConfig";

interface TaskFormProps {
  onCreated?: () => void;
  onCancel?: () => void;
  editMode?: boolean;
  initialData?: Record<string, any>;
  refetchTask?: () => void;
  isFromOptyActivityPage?: boolean;
}

const mapInitialDataToForm = (
  initialData: Record<string, any>
): Record<string, any> => {
  const assigneeId =
    initialData.assignee?.userId ??
    initialData.userId ??
    initialData.ownerId ??
    initialData.owner?.userId ??
    null;

  const normalizedAssigneeId =
    assigneeId !== null && assigneeId !== undefined && assigneeId !== ""
      ? String(assigneeId)
      : undefined;

  return {
    taskSubject: initialData.taskName ?? "",
    //commented 13/11/2025
    // subTaskTypeLid:
    //   initialData.subTaskType?.id ??
    //   initialData.subTaskTypeLid ??
    //   initialData.taskType?.id,
    companyId: initialData.company?.id ?? initialData.companyId,
    dueDate: initialData.dueDate ?? "",
    priority: initialData.priority?.id ?? initialData.priorityLid,
    taskStatusLid: initialData.taskStatus?.id ?? initialData.taskStatusLid,
    description: initialData.description ?? "",
    activityId: initialData.activity?.id ?? initialData.activityId,
    opportunityId:
      initialData.opportunity?.opportunityId ?? initialData.opportunityId,
    ...(normalizedAssigneeId && {
      assigneeId: normalizedAssigneeId,
    }),
  };
};

const TaskForm: React.FC<TaskFormProps> = ({
  onCreated,
  onCancel,
  editMode = false,
  initialData,
  refetchTask,
  isFromOptyActivityPage = false,
}) => {
  const dispatch = useDispatch();
  const userData = getSessionStorageData("user");
  const currentUserId = userData?.userId;
  const personalTaskTypeId = useLookupIdByKey(
    iWorkLookUpValues.TASK_TYPE_PERSONAL
  );
  const nonPersonalTaskTypeId = useLookupIdByKey(
    iWorkLookUpValues.TASK_TYPE_NON_PERSONAL
  );
  const staticTaskTypeLid = useLookupIdByKey(
    iWorkLookUpValues.TASK_TYPE_SUB_TASK
  );
  const taskStatusLidvalue = useLookupIdByKey(
    iWorkLookUpValues.TASK_STATUS_NOT_STARTED
  );

  // Separate formMethods for each DynamicForm
  const [taskDetailsFormMethods, setTaskDetailsFormMethods] =
    useState<UseFormReturn<FieldValues>>();
  const [taskExtraFormMethods, setTaskExtraFormMethods] =
    useState<UseFormReturn<FieldValues>>();
  const [taskLinkFormMethods, setTaskLinkFormMethods] =
    useState<UseFormReturn<FieldValues>>();

  //commented 13/11/2025
  // const [isPersonalTask, setIsPersonalTask] = useState(false);

  // const taskDetailsFormConfig = useMemo(
  //   () =>
  //     TaskDetailsFormFields.map((field) =>
  //       field.key === "assigneeId"
  //         ? {
  //             ...field,
  //             disabled: isPersonalTask,
  //             componentProps: {
  //               ...field.componentProps,
  //               disabled: isPersonalTask,
  //             },
  //           }
  //         : field
  //     ),
  //   [isPersonalTask]
  // );

  // Prepare default values for each form section
  const defaultValues = useMemo(() => {
    if (initialData) {
      const mappedData = mapInitialDataToForm(initialData);
      // In create mode (not edit mode), ensure assigneeId is set to current user if not provided
      if (!editMode && !mappedData.assigneeId && currentUserId) {
        mappedData.assigneeId = String(currentUserId);
      }
      return mappedData;
    }

    return {
      assigneeId: currentUserId ? String(currentUserId) : "",
    };
  }, [editMode, initialData, currentUserId]);

  const normalizedTaskStatus = useMemo(() => {
    if (!initialData) {
      return undefined;
    }

    const taskStatusValue = (
      initialData.taskStatus?.lookUpValue || initialData.taskStatus
    )
      ?.toString()
      .toLowerCase();

    return taskStatusValue;
  }, [initialData]);

  const isClosedTask = editMode && normalizedTaskStatus === "closed";

  useEffect(() => {
    if (editMode && initialData) {
      const defaultValues = mapInitialDataToForm(initialData);
      taskDetailsFormMethods?.reset(defaultValues);
      taskExtraFormMethods?.reset(defaultValues);
      taskLinkFormMethods?.reset(defaultValues);
    }
  }, [editMode, initialData]);

  // Ensure Status (taskStatusLid) gets set after lookup ids resolve (create mode)
  useEffect(() => {
    if (editMode) return;
    if (!taskExtraFormMethods) return;
    if (!taskStatusLidvalue) return;
    const current = taskExtraFormMethods.getValues("taskStatusLid");
    if (!current) {
      taskExtraFormMethods.setValue("taskStatusLid", taskStatusLidvalue, {
        shouldDirty: false,
        shouldTouch: false,
      });
    }
  }, [editMode, taskStatusLidvalue, taskExtraFormMethods]);

  //commented 13/11/2025
  // useEffect(() => {
  //   if (
  //     editMode ||
  //     !personalTaskTypeId ||
  //     !taskDetailsFormMethods ||
  //     taskDetailsFormMethods.getValues("subTaskTypeLid")
  //   ) {
  //     return;
  //   }

  //   taskDetailsFormMethods.setValue("subTaskTypeLid", personalTaskTypeId, {
  //     shouldDirty: false,
  //   });
  // }, [editMode, personalTaskTypeId, taskDetailsFormMethods]);

  // // Watch taskTypeLid changes
  // useEffect(() => {
  //   if (!taskDetailsFormMethods) return;

  //   const evaluateTaskType = (subTaskTypeValue: unknown) => {
  //     const extractLookupKey = (value: unknown): string | undefined => {
  //       if (!value) return undefined;
  //       if (typeof value === "string") return value;
  //       if (typeof value === "object") {
  //         const candidate = value as {
  //           lookupKey?: string;
  //           lookUpKey?: string;
  //           value?: unknown;
  //         };
  //         return (
  //           candidate.lookupKey ||
  //           candidate.lookUpKey ||
  //           extractLookupKey(candidate.value)
  //         );
  //       }
  //       return undefined;
  //     };

  //     const extractId = (
  //       value: unknown
  //     ): string | number | null | undefined => {
  //       if (value === null || value === undefined) return value;
  //       if (typeof value === "object") {
  //         const candidate = value as { id?: unknown; value?: unknown };
  //         return (candidate.id ??
  //           (typeof candidate.value === "object"
  //             ? extractId(candidate.value)
  //             : candidate.value)) as string | number | null | undefined;
  //       }
  //       return value as string | number | null | undefined;
  //     };

  //     const lookupKey = extractLookupKey(subTaskTypeValue);
  //     const id = extractId(subTaskTypeValue);
  //     const isPersonal =
  //       lookupKey === iWorkLookUpValues.TASK_TYPE_PERSONAL ||
  //       (id !== null &&
  //         id !== undefined &&
  //         personalTaskTypeId !== undefined &&
  //         personalTaskTypeId !== null &&
  //         String(id) === String(personalTaskTypeId));

  //     setIsPersonalTask(Boolean(isPersonal));

  //     if (isPersonal && currentUserId) {
  //       taskDetailsFormMethods.setValue("assigneeId", String(currentUserId), {
  //         shouldDirty: false,
  //         shouldTouch: false,
  //       });
  //     }
  //   };

  //   evaluateTaskType(taskDetailsFormMethods.getValues("subTaskTypeLid"));

  //   const subscription = taskDetailsFormMethods.watch((value, { name }) => {
  //     if (!name || name === "subTaskTypeLid") {
  //       evaluateTaskType(value.subTaskTypeLid);
  //     }
  //   });

  //   return () => subscription.unsubscribe();
  // }, [
  //   taskDetailsFormMethods,
  //   personalTaskTypeId,
  //   currentUserId,
  //   initialData,
  //   editMode,
  // ]);

  // Build TaskDetails form config, disabling dueDate in edit mode
  const taskDetailsFormConfig = useMemo(() => {
    if (!editMode) return TaskDetailsFormFields;
    return TaskDetailsFormFields.map((field) =>
      field.key === "dueDate"
        ? {
            ...field,
            disabled: true,
            componentProps: { ...field.componentProps, disabled: true },
          }
        : field
    );
  }, [editMode]);

  const { mutate, status } = useApiMutation({
    config: {
      onSuccess: () => {
        dispatch(
          setToastMessage(
            editMode
              ? TaskMeetingNotesErrorMessages.TASK_UPDATED_SUCCESS
              : TaskMeetingNotesErrorMessages.TASK_CREATED_SUCCESS
          )
        );
        taskDetailsFormMethods?.reset();
        taskExtraFormMethods?.reset();
        taskLinkFormMethods?.reset();
        if (onCreated) onCreated();
        if (onCancel) onCancel();
        refetchTask?.();
      },
      // ***based on the api data uncommnet if needed
      // onError: (error: unknown) => {
      //   const message =
      //     typeof error === "object" && error && "message" in error
      //       ? (error as { message?: string }).message
      //       : undefined;
      //   console.log("Error:", message);
      //   dispatch(
      //     setToastMessage(
      //       message || TaskMeetingNotesErrorMessages.TASK_FETCH_ERROR
      //     )
      //   );
      // },
      onError: (error) => {
        const errorMessage = Array.isArray(error?.message)
          ? error.message[0]
          : error?.message ?? ALERT_MESSAGES.GENERIC_ERROR;
        dispatch(setToastMessage(errorMessage));
      },
    },
  });

  const handleSubmit = async () => {
    // Validate all forms
    const [isValidDetails, isValidExtra, isValidLink] = await Promise.all([
      taskDetailsFormMethods?.trigger(),
      taskExtraFormMethods?.trigger(),
      taskLinkFormMethods?.trigger(),
    ]);

    // Get values from all forms
    if (!isValidDetails) {
      dispatch(
        setToastMessage(TaskMeetingNotesErrorMessages.TASK_REQUIRED_FIELDS)
      );
      return;
    }

    const detailsData = taskDetailsFormMethods?.getValues() || {};
    const extraData = taskExtraFormMethods?.getValues() || {};
    const linkData = taskLinkFormMethods?.getValues() || {};

    const rawAssigneeId = detailsData.assigneeId;
    const parsedAssigneeId =
      rawAssigneeId !== undefined &&
      rawAssigneeId !== null &&
      rawAssigneeId !== ""
        ? typeof rawAssigneeId === "string"
          ? Number(rawAssigneeId) || rawAssigneeId
          : rawAssigneeId
        : undefined;

    // Determine subTaskTypeLid
    let subTaskTypeLid;

    if (editMode) {
      // In edit mode, preserve the original subTaskTypeLid
      subTaskTypeLid =
        initialData?.subTaskType?.id ?? initialData?.subTaskTypeLid;
    } else {
      // In create mode, determine based on assigneeId vs currentUserId
      const isPersonalTask =
        parsedAssigneeId !== undefined &&
        currentUserId !== undefined &&
        String(parsedAssigneeId) === String(currentUserId);

      // subTaskTypeLid = isPersonalTask
      //   ? personalTaskTypeId
      //   : nonPersonalTaskTypeId;

      subTaskTypeLid = nonPersonalTaskTypeId;
    }

    // Build payload with only the required fields
    const payload: Record<string, any> = {
      taskName: detailsData.taskSubject?.trim(),
      companyId: linkData.companyId || null,
      ...(linkData.companyId ? { companyId: linkData.companyId } : {}),
      dueDate: detailsData.dueDate
        ? dayjs(detailsData.dueDate).format("YYYY-MM-DD")
        : undefined,
      ...(extraData?.taskStatusLid !== undefined &&
      extraData?.taskStatusLid !== null &&
      extraData?.taskStatusLid !== ""
        ? { taskStatusLid: extraData.taskStatusLid }
        : {}),
      ...(extraData?.priority !== undefined &&
      extraData?.priority !== null &&
      extraData?.priority !== ""
        ? { priorityLid: extraData.priority }
        : {}),
      description: detailsData.description?.trim(),
      ...(linkData.activityId ? { activityId: linkData.activityId } : {}),
      ...(linkData.opportunityId
        ? { opportunityId: linkData.opportunityId }
        : {}),
      ...(staticTaskTypeLid ? { taskTypeLid: staticTaskTypeLid } : {}),
      ...(subTaskTypeLid ? { subTaskTypeLid: subTaskTypeLid } : {}),
      ...(parsedAssigneeId !== undefined
        ? { assigneeId: parsedAssigneeId }
        : {}),
    };

    // Remove undefined fields (for optional fields)
    Object.keys(payload).forEach(
      (key) => payload[key] === undefined && delete payload[key]
    );

    const endpoint = editMode
      ? `${endPoints.createTasks}/${initialData?.id}`
      : endPoints.createTasks;
    const method = editMode ? "PUT" : "POST";
    mutate({ endpoint, method, data: payload });
  };

  const [accordionExpanded, setAccordionExpanded] = React.useState(false);
  const [extraAccordionExpanded, setExtraAccordionExpanded] =
    React.useState(false);

  const [priorityOptions, setPriorityOptions] = useState<
    { label: string; value: number }[]
  >([]);
  const [defaultPriority, setDefaultPriority] = useState<number | undefined>(
    undefined
  );

  // Use mutate to fetch PRIORITY options
  const { mutate: fetchPriorityOptions } = useApiMutation({
    config: {
      onSuccess: (response: any) => {
        // Adapt this to your actual response structure
        const options = (response.data || []).map((item: any) => ({
          label: item.lookUpValue,
          value: item.id,
        }));
        setPriorityOptions(options);

        // Dynamically find "Medium"
        const medium = options.find(
          (opt) => opt.label.toLowerCase() === "medium"
        );
        if (medium) setDefaultPriority(medium.value);
      },
      onError: (error: unknown) => {
        // Handle error as needed
      },
    },
  });

  useEffect(() => {
    // Trigger the fetch on mount
    fetchPriorityOptions({
      endpoint: endPoints.lookUpByName("PRIORITY", "DESC"),
      method: "GET",
    });
  }, []);

  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openCompleteModal, setOpenCompleteModal] = useState(false);
  const closeTaskFormRef = useRef<NestedGroupedDataCollectionHandle | null>(
    null
  );

  const { mutate: deleteTask, status: deleteStatus } = useApiMutation({
    config: {
      onSuccess: () => {
        dispatch(
          setToastMessage(TaskMeetingNotesErrorMessages.TASK_DELETE_SUCCESS)
        );
        taskDetailsFormMethods?.reset();
        taskExtraFormMethods?.reset();
        taskLinkFormMethods?.reset();
        if (onCreated) onCreated();
        if (onCancel) onCancel();
        refetchTask?.();
        setOpenDeleteModal(false);
      },
      onError: (error: any) => {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          TaskMeetingNotesErrorMessages.TASK_DELETE_ERROR ||
          "Failed to delete task";
        dispatch(setToastMessage(message));
        setOpenDeleteModal(false);
      },
    },
  });

  const { mutate: completeTask, status: completeStatus } = useApiMutation({
    config: {
      onSuccess: (response: any) => {
        const message =
          response?.message ||
          response?.data?.message ||
          TaskMeetingNotesErrorMessages.TASK_CLOSED_SUCCESS;
        dispatch(setToastMessage(message));
        setOpenCompleteModal(false);
        closeTaskFormRef.current?.resetForms?.({
          [closeTaskModalConfig.key]: { comments: "" },
        });
        taskDetailsFormMethods?.reset();
        taskExtraFormMethods?.reset();
        taskLinkFormMethods?.reset();
        if (onCreated) onCreated();
        if (onCancel) onCancel();
        refetchTask?.();
      },
      onError: (error: any) => {
        // Display backend error message if available
        const message =
          error?.response?.data?.message ||
          error?.message ||
          TaskMeetingNotesErrorMessages.TASK_COMPLETE_ERROR;
        dispatch(setToastMessage(message));
      },
    },
  });

  const handleDelete = () => {
    if (!initialData?.id) return;
    deleteTask({
      endpoint: `${endPoints.createTasks}/${initialData.id}`,
      method: "DELETE",
      data: {},
    });
  };

  const handleCloseTask = async () => {
    if (!initialData?.id) {
      dispatch(setToastMessage(TaskMeetingNotesErrorMessages.TASK_ID_REQUIRED));
      return;
    }

    const taskId = Number(initialData.id);
    if (Number.isNaN(taskId)) {
      dispatch(setToastMessage(TaskMeetingNotesErrorMessages.TASK_ID_REQUIRED));
      return;
    }

    const submitRes = await closeTaskFormRef.current?.submitAll?.();
    if (submitRes && !submitRes.isAllValid) {
      return;
    }

    const groupKey = closeTaskModalConfig.key;
    const commentsValue =
      submitRes?.result?.[groupKey]?.comments ??
      submitRes?.result?.comments ??
      "";
    const normalizedComments =
      typeof commentsValue === "string" ? commentsValue.trim() : "";

    completeTask({
      endpoint: endPoints.completeTasks(taskId),
      method: "PUT",
      data: {
        comments: normalizedComments,
      },
    });
  };

  const handleCloseModal = () => {
    setOpenCompleteModal(false);
    closeTaskFormRef.current?.resetForms?.({
      [closeTaskModalConfig.key]: { comments: "" },
    });
  };

  return (
    <StyledFormBox>
      <Typography variant="h5">Task Details</Typography>
      <TasksFormContainer>
        <DynamicForm
          formConfig={taskDetailsFormConfig}
          formMethods={setTaskDetailsFormMethods}
          defaultValues={defaultValues}
          disableAllFields={editMode && isClosedTask}
        />
      </TasksFormContainer>
      {/* <Typography variant="h5">{PRIORITY_STATUS}</Typography> */}
      <TasksFormContainer sx={{ marginTop: 5 }}>
        <DynamicForm
          formConfig={TaskExtraFields}
          formMethods={setTaskExtraFormMethods}
          defaultValues={{
            ...defaultValues,
            // Ensure prefill when lookup id resolves
            taskStatusLid:
              defaultValues?.taskStatusLid ?? taskStatusLidvalue ?? "",
          }}
          options={{ priority: priorityOptions }}
          shouldReset={!editMode && Boolean(taskStatusLidvalue)}
          disableAllFields={editMode && isClosedTask}
        />
      </TasksFormContainer>

      <Typography variant="h5">{LINK_TO_OPPORTUNITY}</Typography>
      <TasksFormContainer>
        <DynamicForm
          formConfig={TaskLinkFields(isFromOptyActivityPage)}
          formMethods={setTaskLinkFormMethods}
          defaultValues={defaultValues}
          disableAllFields={editMode && isClosedTask}
        />
      </TasksFormContainer>
      {/* Buttons */}
      <MeetingNotesButtonPanel>
        {editMode ? (
          <StyledButton1
            variantType="danger"
            onClick={() => {
              if (isClosedTask || deleteStatus === "pending") {
                return;
              }
              setOpenDeleteModal(true);
            }}
            data-testid="delete-button"
            loadingPosition="start"
            className="button"
            disabled={isClosedTask || deleteStatus === "pending"}
          >
            {DELETE}
          </StyledButton1>
        ) : (
          <StyledButton1
            variantType="secondary"
            onClick={() => {
              if (status === "pending") {
                return;
              }
              onCancel?.();
            }}
            className="button"
            data-testid="cancel-button"
            disabled={status === "pending"}
          >
            {CANCEL_BUTTON}
          </StyledButton1>
        )}
        {/* {editMode && (
          <StyledButton1
            variantType="secondary"
            onClick={() => {
              if (isClosedTask || completeStatus === "pending") {
                return;
              }
              setOpenCompleteModal(true);
            }}
            className="button"
            data-testid="close-task-button"
            disabled={isClosedTask || completeStatus === "pending"}
          >
            {CLOSE_TASK}
          </StyledButton1>
        )} */}
        <StyledButton1
          variantType="primary"
          onClick={() => {
            if (editMode && isClosedTask) {
              return;
            }
            handleSubmit();
          }}
          data-testid="create-button"
          loading={status === "pending"}
          loadingPosition="center"
          className="button"
          disabled={status === "pending" || (editMode && isClosedTask)}
        >
          {editMode ? BUTTON_TYPE.SUBMIT : CREATE}
        </StyledButton1>
      </MeetingNotesButtonPanel>
      {/* Delete Confirmation Modal */}
      <CustomModal
        open={openDeleteModal}
        handleClose={() => setOpenDeleteModal(false)}
        heading="Delete Task"
        disablePortal={true}
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
            disabled: isClosedTask || deleteStatus === "pending",
          },
        ]}
      >
        {TaskMeetingNotesErrorMessages.TASK_DELETE_CONFIRMATION}
      </CustomModal>
      <CustomModal
        open={openCompleteModal}
        handleClose={handleCloseModal}
        heading={CLOSE_TASK}
        modalBoxStyles={{ width: "34%" }}
        buttons={[
          {
            label: CANCEL,
            onClick: handleCloseModal,
            variant: "secondary",
          },
          {
            label: CLOSE_TASK,
            onClick: handleCloseTask,
            variant: "primary",
            disabled: completeStatus === "pending",
          },
        ]}
      >
        <NestedDynamicForm
          config={[
            {
              key: closeTaskModalConfig.key,
              config: closeTaskModalConfig.config,
              defaultValues: { comments: "" },
            },
          ]}
          ref={closeTaskFormRef}
        />
      </CustomModal>
    </StyledFormBox>
  );
};

export default TaskForm;
