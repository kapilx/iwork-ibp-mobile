import { useState, useMemo, useCallback, useEffect } from "react";
import { useParams } from "react-router-dom";
import { endPoints, useApiQuery, useApiMutation, CommonAGGrid, Button, useLookupIdByKey } from "@ui/ui-lib";
import { CircularProgress } from "@mui/material";
import dayjs from "dayjs";
import TaskMeetingNotesForm, {
  TaskMeetingNotesTabs,
  TaskMeetingNotesTabKey,
} from "../../TaskMeetingNotesPage/TaskMeetingNotesForm";
import { getTasksColumnDefs, getMeetingsColumnDefs, getNotesColumnDefs } from "../Constants/config";
import { 
  CREATE_TASK, 
  NO_TASKS_AVAILABLE, 
  TASKS,
  CREATE_MEETING,
  NO_MEETINGS_AVAILABLE,
  MEETINGS,
  CREATE_NOTE,
  NO_NOTES_AVAILABLE,
  NOTES,
  FINAL_NEGOTIATION_MEET,
  KDM_MEETING,
  HAND_OVER_MEET,
  CANCELLED_STATUS,CANCELLED,COMPLETED,SCHEDULED
} from "../../../constants";
import { LookUpValues } from "../../../constants/lookupValues";
import {
  CommonTableContainer,
  TasksTableTypography,
  LoaderContainer,
  MandateLabelContainer,
  TasksContainer,
} from "../CommonActivities/styles";
import { StyledCard } from "@ui/ui-lib/commonComponents/NestedDynamicForm/styles";
import { StyledNoDataContainer } from "../../Dashboard/OverviewCard/styles";

interface UseActivityTasksProps {
  activity: any;
  dynamicValues: any;
  isFormDisabled: boolean;
  canEditActivity: boolean;
}

export const useActivityTasks = ({
  activity,
  dynamicValues,
  isFormDisabled,
  canEditActivity,
}: UseActivityTasksProps) => {
  const { id: opportunityId } = useParams<{ id: string }>();
  const [showTaskFormDrawer, setShowTaskFormDrawer] = useState(false);
  const [showMeetingFormDrawer, setShowMeetingFormDrawer] = useState(false);
  const [formTab, setFormTab] = useState<TaskMeetingNotesTabKey>(
    TaskMeetingNotesTabs.TASK
  );
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [showNoteFormDrawer, setShowNoteFormDrawer] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);

  // Get meeting type lookup IDs
  const kdmMeetingTypeId = useLookupIdByKey(LookUpValues.MEETING_TYPE_KDM);
  const finalNegotiationTypeId = useLookupIdByKey(LookUpValues.MEETING_TYPE_FINAL_NEGOTIATION);
  const handoverMeetingTypeId = useLookupIdByKey(LookUpValues.MEETING_TYPE_HANDOVER);
  const completedStatusId = useLookupIdByKey(LookUpValues.MEETING_STATUS_COMPLETED);

  // Check if this activity should show meetings section
  const shouldShowMeetings = useMemo(() => {
    const activityTitle = activity?.title?.toLowerCase() || "";
    const meetingActivities = [KDM_MEETING, FINAL_NEGOTIATION_MEET, HAND_OVER_MEET];
    return meetingActivities.some(meetingActivity => 
      activityTitle.includes(meetingActivity)
    );
  }, [activity?.title]);

  // Determine meeting type based on activity title
  const getMeetingTypeForActivity = useCallback(() => {
    const activityTitle = activity?.title?.toLowerCase() || "";
    if (activityTitle.includes(KDM_MEETING)) {
      return kdmMeetingTypeId;
    } else if (activityTitle.includes(FINAL_NEGOTIATION_MEET)) {
      return finalNegotiationTypeId;
    } else if (activityTitle.includes(HAND_OVER_MEET)) {
      return handoverMeetingTypeId;
    }
    return null;
  }, [activity?.title, kdmMeetingTypeId, finalNegotiationTypeId, handoverMeetingTypeId]);

  // Fetch task details using the opportunity activity ID
  const {
    data: tasksList,
    isFetching: isTaskDetailsLoading,
    refetch,
  } = useApiQuery({
    queryKey: ["activityTasks", activity?.opportunityActivityId],
    url: endPoints.getTaskDetailsByOptyActivityId(
      activity?.opportunityActivityId
    ),
    enabled: !!activity?.opportunityActivityId,
  });

  // Fetch meeting details using the opportunity activity ID
  const {
    data: meetingsList,
    isFetching: isMeetingDetailsLoading,
    refetch: refetchMeetings,
  } = useApiQuery({
    queryKey: ["activityMeetings", activity?.opportunityActivityId],
    url: endPoints.getMeetingDetailsByOptyActivityId(
      activity?.opportunityActivityId
    ),
    enabled: !!activity?.opportunityActivityId && shouldShowMeetings,
  });

  // Fetch notes using the opportunity activity ID
  const {
    data: notesList,
    isFetching: isNotesLoading,
    refetch: refetchNotes,
  } = useApiQuery({
    queryKey: ["activityNotes", activity?.opportunityActivityId],
    url: endPoints.getNotesByOptyActivityId(
      activity?.opportunityActivityId
    ),
    enabled: !!activity?.opportunityActivityId,
  });

  // Mutation for updating meeting status
  const { mutate: updateMeetingStatus } = useApiMutation({
    config: {
      onSuccess: () => {
        // Refetch meetings to show updated status
        refetchMeetings();
      },
      onError: (error) => {
        console.error('Failed to auto-update meeting status:', error);
      },
    },
  });

  // Auto-update expired meetings to completed status
  useEffect(() => {
    if (!completedStatusId) {
      return;
    }

    const meetings = Array.isArray(meetingsList?.data) 
      ? meetingsList.data 
      : [];

    if (meetings.length === 0) {
      return;
    }

    const now = dayjs();
    
    for (const meeting of meetings) {
      const meetingStatus = meeting.meetingStatus?.lookUpValue?.toLowerCase();
      
      // Skip if already completed or cancelled
      if (meetingStatus === COMPLETED || meetingStatus === CANCELLED) {
        continue;
      }

      // Check if meeting has required fields
      if (!meeting.meetingDate || !meeting.endTime || !meeting.id) {
        continue;
      }

      // Check if meeting time has expired
      const meetingEndDateTime = dayjs(`${meeting.meetingDate} ${meeting.endTime}`);
      if (now.isAfter(meetingEndDateTime)) {
        // Construct payload with all meeting data to avoid data loss
        const payload: any = {
          meetingTypeLid: meeting.meetingType?.id,
          meetingDate: meeting.meetingDate,
          startTime: meeting.startTime,
          endTime: meeting.endTime,
          meetingStatusLid: completedStatusId,
          meetingSubject: meeting.meetingSubject,
          meetingAgenda: meeting.meetingAgenda || "",
          companyId: meeting.company?.id || null,
          opportunityId: meeting.opportunity?.id || null,
          activityId: meeting.activity?.id || null,
        };

        // Add location if present
        if (meeting.locationType?.id) {
          payload.locationTypeLid = meeting.locationType.id;
        }

        // Add employee participants if present
        if (meeting.employeeParticipants?.employees?.length > 0) {
          payload.employeeParticipants = {
            employees: meeting.employeeParticipants.employees,
          };
        }

        // Add TPA participants if present
        if (meeting.tpaParticipants?.tpaId) {
          payload.tpaParticipants = {
            tpaId: meeting.tpaParticipants.tpaId,
            tpaContactPerson: meeting.tpaParticipants.tpaContactPerson || [],
          };
        }

        // Add insurer participants if present
        if (meeting.insurerParticipants?.insurerId) {
          payload.insurerParticipants = {
            insurerId: meeting.insurerParticipants.insurerId,
            insurerContactPerson: meeting.insurerParticipants.insurerContactPerson || [],
          };
        }

        // Add company participants if present
        if (meeting.companyParticipants?.companyId) {
          payload.companyParticipants = {
            companyId: meeting.companyParticipants.companyId,
            companyContactPerson: meeting.companyParticipants.companyContactPerson || [],
          };
        }

        // Add documents if present
        if (Array.isArray(meeting.meetingDocs) && meeting.meetingDocs.length > 0) {
          payload.documents = meeting.meetingDocs.map((doc: any) => ({
            documentId: doc.documentId,
          }));
        } else {
          payload.documents = [];
        }

        updateMeetingStatus({
          endpoint: `${endPoints.createMeetings}/${meeting.id}`,
          method: "PUT",
          data: payload,
        });
      }
    }
  }, [meetingsList?.data, completedStatusId, updateMeetingStatus, refetchMeetings]);

  const handleCreateTask = useCallback(() => {
    setFormTab(TaskMeetingNotesTabs.TASK);
    setShowTaskFormDrawer(true);
  }, []);

  const handleCreateMeeting = useCallback(() => {
    setFormTab(TaskMeetingNotesTabs.MEETING);
    setShowMeetingFormDrawer(true);
  }, []);

  const handleCreateNote = useCallback(() => {
    setSelectedNote(null);
    setFormTab(TaskMeetingNotesTabs.NOTES);
    setShowNoteFormDrawer(true);
  }, []);

  const handleEditNote = useCallback((noteData: any) => {
    setSelectedNote(noteData);
    setFormTab(TaskMeetingNotesTabs.NOTES);
    setShowNoteFormDrawer(true);
  }, []);

  const getEditNoteData = useCallback(() => {
    return {
      companyId: dynamicValues.companyId,
      opportunityId: Number(opportunityId),
      activityId: activity?.opportunityActivityId || null,
    };
  }, [activity, dynamicValues, opportunityId]);

  const getEditTaskData = useCallback(() => {
    const getUserData = () => {
      try {
        const parsedUser = sessionStorage.getItem("user")
          ? JSON.parse(sessionStorage.getItem("user"))
          : null;

        if (parsedUser) {
          return {
            userId: parsedUser?.userId || null,
            firstName: parsedUser?.firstName || null,
            lastName: parsedUser?.lastName || null,
          };
        }
      } catch (error) {
        console.error("Error parsing user data from sessionStorage:", error);
      }
      return {
        userId: null,
        firstName: null,
        lastName: null,
      };
    };

    const currentUser = getUserData();

    return {
      companyId: dynamicValues.companyId,
      opportunityId: Number(opportunityId),
      activityId: activity?.opportunityActivityId || null,
      assigneeId: currentUser.userId,
      taskName: activity?.title || "",
      assignee: {
        userId: currentUser.userId,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
      },
    };
  }, [activity, dynamicValues, opportunityId]);

  const getEditMeetingData = useCallback(() => {
    const getUserData = () => {
      try {
        const parsedUser = sessionStorage.getItem("user")
          ? JSON.parse(sessionStorage.getItem("user"))
          : null;
        
        if (parsedUser) {
          return {
            userId: parsedUser?.userId || null,
            firstName: parsedUser?.firstName || null,
            lastName: parsedUser?.lastName || null,
          };
        }
      } catch (error) {
        console.error("Error parsing user data from sessionStorage:", error);
      }
      return {
        userId: null,
        firstName: null,
        lastName: null,
      };
    };

    const currentUser = getUserData();

    return {
      companyId: dynamicValues.companyId,
      opportunityId: Number(opportunityId),
      activityId: activity?.opportunityActivityId || null,
      organizerId: currentUser.userId,
      meetingSubject: activity?.title || "",
      meetingTypeLid: getMeetingTypeForActivity(),
      organizer: {
        userId: currentUser.userId,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
      },
    };
  }, [activity, dynamicValues, opportunityId, getMeetingTypeForActivity]);

  const handleEditTask = useCallback((taskData: any) => {
    setSelectedTask(taskData);
    setFormTab(TaskMeetingNotesTabs.TASK);
    setShowTaskFormDrawer(true);
  }, []);

  const handleEditMeeting = useCallback((meetingData: any) => {
    setSelectedMeeting(meetingData);
    setFormTab(TaskMeetingNotesTabs.MEETING);
    setShowMeetingFormDrawer(true);
  }, []);

  // Get current user ID from sessionStorage
  const currentUserId = useMemo(() => {
    try {
      const userData = sessionStorage.getItem("user");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        return parsedUser?.userId || null;
      }
    } catch (error) {
      console.error("Error parsing user data from sessionStorage:", error);
    }
    return null;
  }, []);

  const tasksColumnDefs = useMemo(
    () => getTasksColumnDefs(handleEditTask, isFormDisabled, currentUserId),
    [handleEditTask, isFormDisabled, currentUserId]
  );

  const meetingsColumnDefs = useMemo(
    () => getMeetingsColumnDefs(handleEditMeeting, isFormDisabled, currentUserId),
    [handleEditMeeting, isFormDisabled, currentUserId]
  );

  const notesColumnDefs = useMemo(
    () => getNotesColumnDefs(handleEditNote, isFormDisabled),
    [handleEditNote, isFormDisabled]
  );

  // Check if all meetings are completed or cancelled
  // This works in conjunction with isAllTasksCompleted - BOTH must be satisfied
  // Button is enabled only when: all tasks completed AND all meetings completed/cancelled (or no meetings)
  // Button is disabled if any meeting has 'Scheduled' status
  const canCompleteActivity = useMemo(() => {
    if (!shouldShowMeetings) {
      return true; // No meetings required, can complete
    }

    const meetings = meetingsList?.data;
    if (!Array.isArray(meetings) || meetings.length === 0) {
      return true; // No meetings exist, can complete activity
    }

    // All meetings must be either completed or cancelled
    // Scheduled meetings block completion
    return meetings.every((meeting: any) => {
      const meetingStatus = meeting.meetingStatus?.lookUpValue?.toLowerCase();
      
      // Allow completion if meeting is completed or cancelled
      if (meetingStatus === COMPLETED || meetingStatus === CANCELLED_STATUS.toLowerCase()) {
        return true;
      }
      
      // Block completion if meeting is scheduled
      if (meetingStatus === SCHEDULED) {
        return false;
      }
      
      // For other statuses, allow completion
      return true;
    });
  }, [shouldShowMeetings, meetingsList?.data]);

  const TasksTable = useCallback(
    () => (
      <TasksContainer>
        <StyledCard>
          <CommonTableContainer>
            <MandateLabelContainer>
              <TasksTableTypography>{TASKS}</TasksTableTypography>
              <Button
                key="createTask"
                variantType="primary"
                onClick={handleCreateTask}
                disabled={isFormDisabled}
              >
                {CREATE_TASK}
              </Button>
            </MandateLabelContainer>
            {isTaskDetailsLoading ? (
              <LoaderContainer>
                <CircularProgress color="secondary" />
              </LoaderContainer>
            ) : tasksList?.data?.count ? (
              <CommonAGGrid
                rowData={tasksList?.data?.data || []}
                columnDefs={tasksColumnDefs}
                pagination={true}
                paginationPageSize={10}
                paginationPageSizeSelector={[5, 10, 20]}
                height={(tasksList?.data?.data || []).length < 3 ? 200 : 400}
                rowHeight={52}
                emptyDataMessage={NO_TASKS_AVAILABLE}
              />
            ) : (
              <StyledNoDataContainer height={100}>
                {NO_TASKS_AVAILABLE}
              </StyledNoDataContainer>
            )}
          </CommonTableContainer>
        </StyledCard>
      </TasksContainer>
    ),
    [
      isTaskDetailsLoading,
      tasksList,
      tasksColumnDefs,
      isFormDisabled,
      canEditActivity,
      handleCreateTask,
    ]
  );

  const MeetingsTable = useCallback(
    () => (
      <TasksContainer>
        <StyledCard>
          <CommonTableContainer>
            <MandateLabelContainer>
              <TasksTableTypography>{MEETINGS}</TasksTableTypography>
              <Button
                key="createMeeting"
                variantType="primary"
                onClick={handleCreateMeeting}
                disabled={isFormDisabled}
              >
                {CREATE_MEETING}
              </Button>
            </MandateLabelContainer>
            {isMeetingDetailsLoading ? (
              <LoaderContainer>
                <CircularProgress color="secondary" />
              </LoaderContainer>
            ) : Array.isArray(meetingsList?.data) && meetingsList?.data.length ? (
              <CommonAGGrid
                rowData={meetingsList?.data || []}
                columnDefs={meetingsColumnDefs}
                pagination={true}
                paginationPageSize={10}
                paginationPageSizeSelector={[5, 10, 20]}
                height={(meetingsList?.data || []).length < 3 ? 200 : 400}
                rowHeight={52}
                emptyDataMessage={NO_MEETINGS_AVAILABLE}
              />
            ) : (
              <StyledNoDataContainer height={100}>
                {NO_MEETINGS_AVAILABLE}
              </StyledNoDataContainer>
            )}
          </CommonTableContainer>
        </StyledCard>
      </TasksContainer>
    ),
    [
      isMeetingDetailsLoading,
      meetingsList,
      meetingsColumnDefs,
      isFormDisabled,
      canEditActivity,
      handleCreateMeeting,
    ]
  );

  const TaskFormDrawer = useCallback(
    () =>
      showTaskFormDrawer ? (
        <TaskMeetingNotesForm
          openFromMainPage={true}
          onTaskCreated={() => {
            refetch();
            setShowTaskFormDrawer(false);
          }}
          open={showTaskFormDrawer}
          onClose={() => {
            setSelectedTask(null);
            setShowTaskFormDrawer(false);
          }}
          formTab={formTab}
          setFormTab={setFormTab}
          createTaskInitialData={getEditTaskData()}
          editTask={selectedTask}
          isFromOptyActivityPage={true}
        />
      ) : null,
    [showTaskFormDrawer, formTab, selectedTask, getEditTaskData, refetch]
  );

  const MeetingFormDrawer = useCallback(
    () =>
      showMeetingFormDrawer ? (
        <TaskMeetingNotesForm
          openFromMainPage={true}
          onMeetingCreated={() => {
            refetchMeetings();
            setShowMeetingFormDrawer(false);
          }}
          open={showMeetingFormDrawer}
          onClose={() => {
            setSelectedMeeting(null);
            setShowMeetingFormDrawer(false);
          }}
          formTab={formTab}
          setFormTab={setFormTab}
          createTaskInitialData={getEditMeetingData()}
          editMeeting={selectedMeeting}
          isFromOptyActivityPage={true}
        />
      ) : null,
    [showMeetingFormDrawer, formTab, selectedMeeting, getEditMeetingData, refetchMeetings]
  );

  const NotesTable = useCallback(
    () => (
      <TasksContainer>
        <StyledCard>
          <CommonTableContainer>
            <MandateLabelContainer>
              <TasksTableTypography>{NOTES}</TasksTableTypography>
              <Button
                key="createNote"
                variantType="primary"
                onClick={handleCreateNote}
                disabled={isFormDisabled}
              >
                {CREATE_NOTE}
              </Button>
            </MandateLabelContainer>
            {isNotesLoading ? (
              <LoaderContainer>
                <CircularProgress color="secondary" />
              </LoaderContainer>
            ) : Array.isArray(notesList?.data) && notesList?.data.length ? (
              <CommonAGGrid
                rowData={notesList?.data || []}
                columnDefs={notesColumnDefs}
                pagination={true}
                paginationPageSize={10}
                paginationPageSizeSelector={[5, 10, 20]}
                height={(notesList?.data || []).length < 3 ? 200 : 400}
                rowHeight={52}
                emptyDataMessage={NO_NOTES_AVAILABLE}
              />
            ) : (
              <StyledNoDataContainer height={100}>
                {NO_NOTES_AVAILABLE}
              </StyledNoDataContainer>
            )}
          </CommonTableContainer>
        </StyledCard>
      </TasksContainer>
    ),
    [
      isNotesLoading,
      notesList,
      notesColumnDefs,
      isFormDisabled,
      handleCreateNote,
    ]
  );

  const NoteFormDrawer = useCallback(
    () =>
      showNoteFormDrawer ? (
        <TaskMeetingNotesForm
          openFromMainPage={true}
          onNotesCreated={() => {
            refetchNotes();
            setShowNoteFormDrawer(false);
          }}
          open={showNoteFormDrawer}
          onClose={() => {
            setSelectedNote(null);
            setShowNoteFormDrawer(false);
          }}
          formTab={formTab}
          setFormTab={setFormTab}
          createTaskInitialData={getEditNoteData()}
          editNote={selectedNote}
          isFromOptyActivityPage={true}
        />
      ) : null,
    [showNoteFormDrawer, formTab, selectedNote, getEditNoteData, refetchNotes]
  );

  return {
    tasksList,
    isTaskDetailsLoading,
    refetch,
    handleCreateTask,
    TasksTable,
    TaskFormDrawer,
    isAllTasksCompleted: tasksList?.data?.isAllTasksCompleted,
    // Meetings related
    shouldShowMeetings,
    meetingsList,
    isMeetingDetailsLoading,
    refetchMeetings,
    handleCreateMeeting,
    MeetingsTable,
    MeetingFormDrawer,
    isAllMeetingsCompleted: meetingsList?.data?.isAllMeetingsCompleted,
    canCompleteActivity,
    // Notes related
    notesList,
    isNotesLoading,
    refetchNotes,
    handleCreateNote,
    NotesTable,
    NoteFormDrawer,
  };
};
