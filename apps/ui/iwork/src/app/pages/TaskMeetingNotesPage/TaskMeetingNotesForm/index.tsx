import React, { useState } from "react";
import TaskForm from "./TaskForm";
import {
  styledDrawer as StyledDrawer,
  TaskMeetingsDrawerTitle,
} from "./styles";
import MeetingForm from "./MeetingForm";
import NotesForm from "./NotesForm";
import { AddButton } from "./styles";
import createIcon from "../../../assets/svgs/add-card.svg";
import createIconInHeader from "../../../assets/svgs/add-icon.svg";
import { CustomTabs } from "@ui/ui-lib";

const BUTTON_TEXT = "Add";

// Tab keys for Task/Meeting/Notes drawer
export const TaskMeetingNotesTabs = {
  TASK: "task",
  MEETING: "meeting",
  NOTES: "notes",
} as const;

export type TaskMeetingNotesTabKey =
  (typeof TaskMeetingNotesTabs)[keyof typeof TaskMeetingNotesTabs];

interface TaskAndMeetingFormProps {
  onTaskCreated?: () => void;
  onMeetingCreated?: () => void;
  onNotesCreated?: () => void;
  openFromMainPage?: boolean; // Optional prop to indicate if the form is opened from the main page
  open?: boolean;
  onClose?: () => void;
  editTask?: Record<string, unknown> | null;
  editMeeting?: Record<string, unknown> | null;
  editNote?: Record<string, unknown> | null;
  formTab?: TaskMeetingNotesTabKey;
  setFormTab?: (tab: TaskMeetingNotesTabKey) => void;
  containerRef?: React.RefObject<HTMLDivElement>;
  refetchTasks?: () => void;
  refetchMeetings?: () => void;
  refetchNotes?: () => void;
  openFromHeader?: boolean;
  createTaskInitialData?: Record<string, unknown> | null; // For pre-filling create task form without edit mode
  isFromOptyActivityPage?: boolean; // Indicates if the form is opened from an activity page
}

const TaskMeetingNotesForm: React.FC<TaskAndMeetingFormProps> = ({
  onTaskCreated,
  openFromMainPage,
  onMeetingCreated,
  onNotesCreated,
  open,
  createTaskInitialData,
  onClose,
  editTask,
  editMeeting,
  editNote,
  formTab,
  setFormTab,
  containerRef,
  refetchTasks,
  refetchMeetings,
  refetchNotes,
  openFromHeader = false,
  isFromOptyActivityPage = false,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TaskMeetingNotesTabKey>(
    TaskMeetingNotesTabs.TASK
  );
  const editingTask = !!editTask;
  const editingMeeting = !!editMeeting;
  const editingNote = !!editNote;

  const tabKey = formTab ?? activeTab;
  const setTab = setFormTab || setActiveTab;

  React.useEffect(() => {
    if (editTask && setFormTab) setFormTab(TaskMeetingNotesTabs.TASK);
  }, [editTask, setFormTab]);

  React.useEffect(() => {
    if (editMeeting && setFormTab) setFormTab(TaskMeetingNotesTabs.MEETING);
  }, [editMeeting, setFormTab]);

  React.useEffect(() => {
    if (editNote && setFormTab) setFormTab(TaskMeetingNotesTabs.NOTES);
  }, [editNote, setFormTab]);

  const isOpen = typeof open === "boolean" ? open : isDrawerOpen;

  const handleOpenDrawer = () => {
    if (onClose) return;
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    if (onClose) onClose();
    else setIsDrawerOpen(false);
  };

  const tabList = [
    {
      tabKey: TaskMeetingNotesTabs.TASK,
      label: "Task",
      content: (
        <TaskForm
          onCreated={onTaskCreated}
          onCancel={handleCloseDrawer}
          editMode={!!editTask}
          initialData={editTask || createTaskInitialData || undefined}
          refetchTask={refetchTasks}
          isFromOptyActivityPage={isFromOptyActivityPage}
        />
      ),
      disabled: editingMeeting || editingNote,
    },
    {
      tabKey: TaskMeetingNotesTabs.MEETING,
      label: "Meeting",
      content: (
        <MeetingForm
          onCreated={onMeetingCreated}
          onCancel={handleCloseDrawer}
          editMode={!!editMeeting}
          initialData={editMeeting || createTaskInitialData || undefined}
          refetchMeeting={refetchMeetings}
          isFromOptyActivityPage={isFromOptyActivityPage}
        />
      ),
      disabled: editingTask || editingNote,
    },
    {
      tabKey: TaskMeetingNotesTabs.NOTES,
      label: "Notes",
      content: (
        <NotesForm
          onCreated={onNotesCreated}
          onCancel={handleCloseDrawer}
          editMode={!!editNote}
          initialData={editNote || createTaskInitialData || undefined}
          onNotesCreated={onNotesCreated}
          isFromOptyActivityPage={isFromOptyActivityPage}
        />
      ),
      disabled: editingTask || editingMeeting,
    },
  ];

  // Determine the drawer title based on edit mode and tab
  const getDrawerTitle = () => {
    if (editingTask) return "Edit Task";
    if (editingMeeting) return "Edit Meeting";
    if (editingNote) return "Edit Note";
    switch (tabKey) {
      case TaskMeetingNotesTabs.MEETING:
        return "Create Meeting";
      case TaskMeetingNotesTabs.NOTES:
        return "Create Note";
      case TaskMeetingNotesTabs.TASK:
      default:
        return "Create Task";
    }
  };

  return (
    <>
      {open === undefined &&
        (openFromHeader ? (
          <img
            src={createIconInHeader}
            alt="create forms button"
            onClick={handleOpenDrawer}
            style={{ cursor: "pointer" }}
          />
        ) : (
          <AddButton onClick={handleOpenDrawer}>
            <img src={createIcon} alt="create forms button" />
            {BUTTON_TEXT}
          </AddButton>
        ))}

      <StyledDrawer
        open={isOpen}
        onClose={handleCloseDrawer}
        anchor="right"
        title={
          <TaskMeetingsDrawerTitle>{getDrawerTitle()}</TaskMeetingsDrawerTitle>
        }
        container={containerRef?.current || undefined}
        ModalProps={{
          container: containerRef?.current || undefined,
          disablePortal: true,
          disableEnforceFocus: true,
          disableScrollLock: true,
        }}
      >
        <CustomTabs
          tabs={tabList}
          activeTabKey={tabKey}
          onTabChange={(key) => setTab(key as TaskMeetingNotesTabKey)}
        />
      </StyledDrawer>
    </>
  );
};

export default TaskMeetingNotesForm;
