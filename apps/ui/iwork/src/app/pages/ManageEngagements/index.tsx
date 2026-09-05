import React, { useState, useEffect } from "react";
import Typography from "@mui/material/Typography";
import {
  Button,
  Checkbox,
  CREATE,
  CustomTabs,
  FeatureKey,
  MeetingFeedbackDrawer,
  TaskMeetingNotesErrorMessages,
  ToggleButton,
  endPoints,
  selectHasPermission,
  setToastMessage,
  useApiMutation,
  useApiQuery,
  DETAILS_LABELS,
  getBreadcrumbsFromState,
  createBreadcrumbEntry,
  DETAILS_KEYS,
  buildBreadcrumbState,
} from "@ui/ui-lib";
import { ColumnsSkeleton } from "../../components/DashboardSkeletons";
import TaskMeetingNotesForm, {
  TaskMeetingNotesTabs,
  TaskMeetingNotesTabKey,
} from "../TaskMeetingNotesPage/TaskMeetingNotesForm";
import {
  HeaderContainer,
  HeadingAndButtonWrapper,
  TabsWrapper,
  ButtonAndToggleWrapper,
} from "./styles";
import listView from "../../assets/svgs/list-view.svg";
import listViewActive from "../../assets/svgs/list-view-active.svg";
import calendarView from "../../assets/svgs/calendar-view-inactive.svg";
import calendarViewActive from "../../assets/svgs/calendar-view-active.svg";
import ListingView from "./ListingView";
import CalendarView from "./CalendarView";
import { Task, Meeting, Note } from "./type";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { set } from "date-fns";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";

// Define tab keys to avoid magic numbers
export const EngagementTabs = {
  ALL: "all",
  MEETING: "meeting",
  APPROVAL: "approval",
  ASSIGNMENT: "assignment",
  TASK: "task",
  SALES: "sales",
  NOTES: "notes",
} as const;

export type EngagementTabKey =
  (typeof EngagementTabs)[keyof typeof EngagementTabs];

const POLICY_DETAILS_ACTIVE_TABS = new Set<string>([
  "policyDashboard",
  "policyDetails",
  "CardGrid",
  "covers",
  "cdDetails",
  "assetInsured",
  "instalments",
  "policyDefinition",
]);

const POLICY_TAB_KEY_ALIASES: Record<string, string> = {
  policydashboard: "policyDashboard",
  dashboard: "policyDashboard",
  policydetails: "policyDetails",
  basicdetails: "policyDetails",
  basicdetail: "policyDetails",
  policydetail: "policyDetails",
  contacts: "CardGrid",
  contact: "CardGrid",
  cardgrid: "CardGrid",
  card: "CardGrid",
  cover: "covers",
  covers: "covers",
  cddetail: "cdDetails",
  cddetails: "cdDetails",
  assetinsured: "assetInsured",
  insuredasset: "assetInsured",
  instalments: "instalments",
  installments: "instalments",
  installment: "instalments",
  policydefinition: "policyDefinition",
  definition: "policyDefinition",
};

interface ManageEngagementsProps {
  hideHeader?: boolean; // Optional prop to control header visibility
  headerCustomStyles?: React.CSSProperties;
  viewBy?: "self" | "self_team" | "self_org";
}

const ManageEngagements: React.FC<ManageEngagementsProps> = ({
  hideHeader = false,
  headerCustomStyles,
  viewBy = "self",
}) => {
  const location = useLocation();
  const [toggle, setToggle] = useState<"list" | "calendar">("list");
  // Set initial tab from location.state if present
  const NOTES_TAB_KEY = EngagementTabs.NOTES;
  const getInitialTab = (): EngagementTabKey => {
    if (location.state && location.state.tab) {
      const tab = location.state.tab as EngagementTabKey;
      if (Object.values(EngagementTabs).includes(tab)) {
        return tab;
      }
    }
    return EngagementTabs.ALL;
  };

  const taskTypeMap: Record<EngagementTabKey, string | null> = {
    [EngagementTabs.ALL]: null, // All → fetch all (no filter)
    [EngagementTabs.MEETING]: null, // Meetings → handled separately
    [EngagementTabs.APPROVAL]: "Approval", // Approvals
    [EngagementTabs.ASSIGNMENT]: "Assignment", // Assignments
    [EngagementTabs.TASK]: "Task", // Tasks
    [EngagementTabs.SALES]: "Activity", // Sales activities
    [EngagementTabs.NOTES]: null, // Notes → handled separately
  };

  const [activeTab, setActiveTab] = useState<EngagementTabKey>(getInitialTab());
  const [showCompleted, setShowCompleted] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  //use state for approval folllow-up sales activity
  const [approval, setApproval] = useState<any[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [followUp, setFollowUp] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [assignment, setAssignment] = useState<any[]>([]); // <-- Add state for Assignment
  const [showFormDrawer, setShowFormDrawer] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editMeeting, setEditMeeting] = useState<Meeting | null>(null);
  const [showFeedbackDrawer, setShowFeedbackDrawer] = useState(false);
  const [feedbackMeeting, setFeedbackMeeting] = useState<Meeting | null>(null);
  const [formTab, setFormTab] = useState<TaskMeetingNotesTabKey>(
    TaskMeetingNotesTabs.TASK
  ); // Controls Task/Meeting/Notes drawer tab
  const [calendarDate, setCalendarDate] = useState(new Date()); //to pass to calendar week view

  const [editNotes, setEditNotes] = useState<Note | null>(null); // For notes editing
  // Reset active tab to 'All' when toggle changes
  React.useEffect(() => {
    setActiveTab(EngagementTabs.ALL);
  }, [toggle]);

  const canISGAssign = useSelector((state: any) =>
    selectHasPermission(FeatureKey.ASSIGN_ISG_ACTIVITY)(state)
  );
  const canBDAssign = useSelector((state: any) =>
    selectHasPermission(FeatureKey.ASSIGN_BD_ACTIVITY)(state)
  );
  const canGiveApprovalForBD = useSelector((state: any) =>
    selectHasPermission(FeatureKey.APPROVE_BD_OPPORTUNITY)(state)
  );
  const canGiveApprovalForISG = useSelector((state: any) =>
    selectHasPermission(FeatureKey.APPROVE_ISG_OPPORTUNITY)(state)
  );

  useEffect(() => {
    setCalendarDate(new Date()); // Reset calendar date when active tab changes
  }, [toggle, activeTab]);

  // If state is passed for tab, set the active tab accordingly (on mount or state change)
  useEffect(() => {
    if (location.state && location.state.tab) {
      const tab = location.state.tab as EngagementTabKey;
      if (Object.values(EngagementTabs).includes(tab)) {
        setActiveTab(tab);
      }
    }
  }, [location.state]);

  const navigate = useNavigate();

  const handleTaskClick = (task: Task) => {
    if (
      task?.taskName === "ISG Planning Task" &&
      task?.opportunity?.opportunityId
    ) {
      navigate(`/opportunities/${task.opportunity.opportunityId}`);
      return;
    }

    setEditTask(task);
    setFormTab(TaskMeetingNotesTabs.TASK);
    //to avoid for the approvals, assignments, sales activities
    const open: boolean =
      task?.taskIsEditable === "yes" || task?.taskType?.lookUpValue === "Task";
    setShowFormDrawer(open);
  };

  const handleEditMeeting = (meeting: Meeting) => {
    setEditMeeting(meeting);
    setFormTab(TaskMeetingNotesTabs.MEETING); // Meeting tab
    setShowFormDrawer(true);
  };

  const handleFeedback = (meeting: Meeting) => {
    setFeedbackMeeting(meeting);
    setShowFeedbackDrawer(true);
  };
  const dispatch = useDispatch();
  const { mutate: completeTaskMutate } = useApiMutation({
    config: {
      onSuccess: (data, variables) => {
        const message =
          (data as { message?: string })?.message ||
          TaskMeetingNotesErrorMessages.TASK_UPDATED_SUCCESS;

        dispatch(setToastMessage(message));
        const { task, completed } = variables;
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? {
                  ...t,
                  taskStatus: {
                    ...t.taskStatus,
                    lookUpValue: completed ? "completed" : "active",
                  },
                }
              : t
          )
        );
      },
      onError: (error: unknown) => {
        const message =
          typeof error === "object" && error && "message" in error
            ? (error as { message?: string }).message
            : undefined;
        dispatch(
          setToastMessage(
            message || TaskMeetingNotesErrorMessages.TASK_SAVE_ERROR
          )
        );
      },
    },
  });

  const handleCompleteTask = (task: Task, completed: boolean) => {
    // Optionally validate required fields
    completeTaskMutate(
      {
        endpoint: `${endPoints.createTasks}/${task.id}/complete`,
        method: "PUT",
        // If your backend expects a body, add it here:
        // data: { completed },
        task, // Pass task and completed for use in onSuccess
        completed, // (not sent to backend, just for local update)
      },
      {
        onSuccess: () => {
          // Optionally refetch tasks or update local state
          refetchTasks();
          // refetchMeetings();
        },
        onError: (error: unknown) => {
          const message =
            typeof error === "object" && error && "message" in error
              ? (error as { message?: string }).message
              : undefined;
          dispatch(
            setToastMessage(
              message || TaskMeetingNotesErrorMessages.TASK_COMPLETE_ERROR
            )
          );
        },
      }
    );
  };

  const existingBreadcrumbs = getBreadcrumbsFromState(location.state);
  const engagementBreadCrumb =
    existingBreadcrumbs.length > 0
      ? existingBreadcrumbs
      : [
          createBreadcrumbEntry({
            label: DETAILS_LABELS.DASHBOARD,
            path: `/dashboard`,
            key: DETAILS_KEYS.DASHBOARD,
          }),
        ];

  const handleNavigateTask = (task: Task) => {
    const origin = task.taskOrigin?.toLowerCase();
    if (origin === "policy_section_approval") {
      const policyId =
        task.policy?.policyId ??
        task.policy?.id ??
        task.policyId ??
        task.opportunity?.policyId;
      const activeTabKey = task.taskLabel;

      if (policyId !== undefined && policyId !== null) {
        const navigationState = activeTabKey
          ? { state: { activeTab: activeTabKey } }
          : undefined;
        const destinationConfig = {
          label: DETAILS_LABELS.POLICY,
          path: `/policies/${policyId}`,
          key: DETAILS_KEYS.POLICY,
        };
        const destinationState = buildBreadcrumbState({
          breadcrumbs: engagementBreadCrumb,
          crumb: destinationConfig,
          state: {
            ...navigationState,
          },
        });
        navigate(destinationConfig.path, {
          state: destinationState,
        });
        return;
      }
    }
    if (origin === "policy_configuration_approval") {
      const policyId =
        task.policy?.policyId ??
        task.policy?.id ??
        task.policyId ??
        task.opportunity?.policyId;
      const activeTabKey = task.taskLabel;

      if (policyId !== undefined && policyId !== null) {
        const navigationState = activeTabKey
          ? { state: { activeTab: activeTabKey } }
          : undefined;
        const destinationConfig = {
          label: DETAILS_LABELS.POLICY,
          path: `/policies/configure/${policyId}`,
          key: DETAILS_KEYS.POLICY,
        };
        const destinationState = buildBreadcrumbState({
          breadcrumbs: engagementBreadCrumb,
          crumb: destinationConfig,
          state: {
            ...navigationState,
          },
        });
        navigate(destinationConfig.path, {
          state: destinationState,
        });
        return;
      }
    }

    if (task.opportunity?.opportunityId && task.activity?.id) {
      const destinationConfig = {
        label: DETAILS_LABELS.SALES_OPPORTUNITY,
        path: `/opportunities/${task.opportunity.opportunityId}?${task.activity.id}`,
        key: DETAILS_KEYS.SALES_OPPORTUNITY,
      };
      const destinationState = buildBreadcrumbState({
        breadcrumbs: engagementBreadCrumb,
        crumb: destinationConfig,
      });
      navigate(destinationConfig.path, {
        state: destinationState,
      });

      // navigate(
      //   `/opportunities/${task.opportunity.opportunityId}?${task.activity.id}`
      // );
    }
    if (task.opportunity?.opportunityId && !task.activity?.id) {
      navigate(`/opportunities/${task.opportunity.opportunityId}`);
    }
  };

  const { mutate: deleteTaskMutate } = useApiMutation({
    config: {
      onSuccess: (_data, variables) => {
        setTasks((prev) => prev.filter((t) => t.id !== variables.task.id));
        dispatch(setToastMessage("Task deleted successfully."));
      },
      onError: (error: unknown) => {
        const message =
          typeof error === "object" && error && "message" in error
            ? (error as { message?: string }).message
            : undefined;
        dispatch(
          setToastMessage(
            message || TaskMeetingNotesErrorMessages.TASK_DELETE_ERROR
          )
        );
      },
    },
  });

  const handleDeleteTask = (task: Task) => {
    deleteTaskMutate({
      endpoint: `${endPoints.createTasks}/${task.id}`,
      method: "DELETE",
      task, // pass task for use in onSuccess
    });
  };
  const { mutate: updateTaskDueDateMutate } = useApiMutation({
    config: {
      onSuccess: (_data, variables) => {
        // Optionally update local state or refetch tasks here
        dispatch(
          setToastMessage(TaskMeetingNotesErrorMessages.DATE_UPDATE_SUCCESS)
        );
      },
      onError: (error: unknown) => {
        const message =
          typeof error === "object" && error && "message" in error
            ? (error as { message?: string }).message
            : undefined;
        dispatch(
          setToastMessage(
            message || TaskMeetingNotesErrorMessages.DATE_UPDATE_ERROR
          )
        );
      },
    },
  });

  const extractNumericId = (itemId: string | number): number => {
    if (typeof itemId === "string") {
      const match = itemId.match(/\d+$/);
      if (match) {
        return Number(match[0]);
      }
    }
    return Number(itemId);
  };

  const extractName = (itemId: string | number): "task" | "meeting" => {
    if (typeof itemId === "string") {
      const [name] = itemId.split("-");
      return name.toLowerCase() as "task" | "meeting";
    }
    return "meeting";
  };

  const refetchAll = () => {
    refetchTasks();
    refetchMeetings();
  };
  type ItemType =
    | "task"
    | "meeting"
    | "approval"
    | "sales"
    | "assignment"
    | "all";

  const updateItemDueDate = (
    type: ItemType,
    id: string | number,
    date: Date
  ) => {
    const numericId = extractNumericId(id);
    const iso = dayjs(date).format("YYYY-MM-DD");

    // Find the item and update local state
    let item,
      setState,
      endpoint,
      payload: Record<string, any> = {};
    if (type === "all") {
      //seprate the name from the id
      type = extractName(id);
    }
    let prevTasks = [...tasks];
    let prevMeetings = [...meetings];
    switch (type) {
      case "task":
        item = tasks.find((t) => Number(t.id) === numericId);
        setTasks((prev) =>
          prev.map((t) =>
            Number(t.id) === numericId ? { ...t, dueDate: iso } : t
          )
        );
        endpoint = `${endPoints.createTasks}/${numericId}`;
        payload = { dueDate: iso };
        updateTaskDueDateMutate(
          {
            endpoint,
            method: "PUT",
            data: payload,
          },
          {
            onSuccess: () => {
              dispatch(
                setToastMessage(
                  TaskMeetingNotesErrorMessages.TASK_DATE_UPDATE_SUCCESS
                )
              );
              refetchTasks();
            },
            onError: (error) => {
              const message =
                typeof error === "object" && error && "message" in error
                  ? (error as { message?: string }).message
                  : undefined;
              setTasks(prevTasks); // Rollback
              dispatch(
                setToastMessage(
                  message ||
                    TaskMeetingNotesErrorMessages.TASK_DATE_UPDATE_ERROR
                )
              );
            },
          }
        );
        break;
      case "meeting":
        item = meetings.find((m) => Number(m.id) === numericId);
        setMeetings((prev) =>
          prev.map((m) =>
            Number(m.id) === numericId ? { ...m, meetingDate: iso } : m
          )
        );
        endpoint = `${endPoints.createMeetings}/${numericId}`;
        payload = {
          meetingDate: iso,
          startTime: item?.startTime,
          endTime: item?.endTime,
        };
        updateTaskDueDateMutate(
          {
            endpoint,
            method: "PUT",
            data: payload,
          },
          {
            onSuccess: () => {
              dispatch(
                setToastMessage(
                  TaskMeetingNotesErrorMessages.MEETING_DATE_UPDATE_SUCCESS
                )
              );
              refetchMeetings();
            },
            onError: (error) => {
              const message =
                typeof error === "object" && error && "message" in error
                  ? (error as { message?: string }).message
                  : undefined;
              setMeetings(prevMeetings); // Rollback
              dispatch(
                setToastMessage(
                  message ||
                    TaskMeetingNotesErrorMessages.MEETING_DATE_UPDATE_ERROR
                )
              );
            },
          }
        );
        break;
      default:
        return;
    }

    // Remove undefined fields
    Object.keys(payload).forEach(
      (key) => payload[key] === undefined && delete payload[key]
    );
  };

  // Handler for editing notes
  const handleNotesEdit = (note: Note) => {
    setEditNotes(note);
    setFormTab(TaskMeetingNotesTabs.NOTES);
    setShowFormDrawer(true);
  };

  const handleNotesCreated = (updatedNote: Note) => {
    setShowFormDrawer(false);
    setEditNotes(null);
    setNotes((prevNotes) => {
      // If editing, replace the note; if creating, add it
      const exists = prevNotes.some((n) => n.id === updatedNote.id);
      if (exists) {
        return prevNotes.map((n) =>
          n.id === updatedNote.id ? updatedNote : n
        );
      }
      return [updatedNote, ...prevNotes];
    });
  };
  // const isCalendar = toggle === "calendar";
  // const effectiveShowCompleted = isCalendar ? true : showCompleted;
  //fetch before passing it as props to ListingView and CalendarView

  const getTaskApiUrl = (tabKey: EngagementTabKey, showCompleted: boolean) => {
    let baseUrl = endPoints.getTasks;
    const taskType = taskTypeMap[tabKey];

    const queryParts = [];

    if (taskType) {
      queryParts.push(`search=taskType:${encodeURIComponent(taskType)}`);
    }

    if (showCompleted) {
      queryParts.push(`showCompleted=${showCompleted}`);
    }

    queryParts.push(`viewBy=${viewBy}`);

    if (queryParts.length > 0) {
      baseUrl += `&${queryParts.join("&")}`;
    }

    return baseUrl;
  };

  const {
    data: tasksData,
    refetch: refetchTasks,
    isLoading: isTasksLoading,
  } = useApiQuery({
    url: getTaskApiUrl(activeTab, showCompleted),
    queryKey: ["tasks", { activeTab, showCompleted: showCompleted, viewBy }],
    enabled: ![EngagementTabs.MEETING, EngagementTabs.NOTES].includes(
      activeTab
    ), // skip if in Meetings or Notes tab
  });

  const {
    data: meetingsData,
    refetch: refetchMeetings,
    isLoading: isMeetingsLoading,
  } = useApiQuery({
    url: `${endPoints.getMeetings}&viewBy=${viewBy}`,
    queryKey: ["meetings", viewBy],
  });

  const {
    data: notesData,
    refetch: refetchNotes,
    isLoading: isNotesLoading,
  } = useApiQuery({
    url: `${endPoints.getNotes}&viewBy=${viewBy}`,
    queryKey: ["notes", viewBy],
  });

  useEffect(() => {
    if (tasksData && tasksData.data && Array.isArray(tasksData.data.data)) {
      const newData = tasksData.data.data;

      switch (activeTab) {
        case EngagementTabs.APPROVAL:
          setApproval(newData);
          break;
        case EngagementTabs.ASSIGNMENT:
          setAssignment(newData);
          break;
        case EngagementTabs.TASK:
          setTasks(newData);
          break;
        case EngagementTabs.SALES:
          setSales(newData);
          break;
        case EngagementTabs.ALL:
          // All tab → split the whole data
          setTasks(
            newData.filter((task: any) => task.taskType?.lookUpValue === "Task")
          );
          setApproval(
            newData.filter(
              (task: any) => task.taskType?.lookUpValue === "Approval"
            )
          );
          setAssignment(
            newData.filter(
              (task: any) => task.taskType?.lookUpValue === "Assignment"
            )
          );
          setSales(
            newData.filter(
              (task: any) => task.taskType?.lookUpValue === "Activity"
            )
          );
          break;
        default:
          break;
      }

    }
  }, [tasksData, activeTab]);

  useEffect(() => {
    if (
      meetingsData &&
      meetingsData.data &&
      Array.isArray(meetingsData.data.data)
    ) {
      setMeetings(meetingsData.data.data);
    }
  }, [meetingsData]);

  useEffect(() => {
    if (notesData && notesData.data && Array.isArray(notesData.data.data)) {
      setNotes(notesData.data.data);
    }
  }, [notesData]);

  const isComponentLoading = isTasksLoading || isMeetingsLoading || isNotesLoading;

  // Tab content — each tab renders immediately; ListingView shows per-column
  // spinners via isLoading prop while its data is still being fetched.
  // CalendarView renders immediately with whatever data is available.
  const tabList = [
    {
      tabKey: EngagementTabs.ALL,
      label: "All",
      content: toggle === "list" ? (
        <ListingView
          tasks={tasks}
          meetings={meetings}
          approval={approval}
          assignment={assignment}
          followUp={followUp}
          sales={sales}
          notes={notes}
          type="all"
          showCompleted={showCompleted}
          onEditTask={handleTaskClick}
          onEditMeeting={handleEditMeeting}
          onEditNotes={handleNotesEdit}
          onDeleteTask={handleDeleteTask}
          onMoveTask={(id, date) => updateItemDueDate("all", id, date)}
          onCompleteTask={handleCompleteTask}
          onNavigateTask={handleNavigateTask}
          onFeedbackMeeting={handleFeedback}
        />
      ) : (
        <CalendarView
          tasks={tasks}
          meetings={meetings}
          approval={approval}
          assignment={assignment}
          sales={sales}
          notes={notes}
          type="all"
          onEditTask={handleTaskClick}
          onEditMeeting={handleEditMeeting}
          onDeleteTask={handleDeleteTask}
          onFeedbackMeeting={handleFeedback}
          onCompleteTask={handleCompleteTask}
          showCompleted={showCompleted}
          onDataChanged={refetchAll}
          fetchMeetings={refetchMeetings}
          fetchTasks={refetchTasks}
          currentDate={calendarDate}
          onChangeDate={setCalendarDate}
        />
      ),
    },
    {
      tabKey: EngagementTabs.MEETING,
      label: "Meetings",
      content: toggle === "list" ? (
        <ListingView
          data-testid="listing-view-meetings"
          meetings={meetings}
          type="meeting"
          showCompleted={showCompleted}
          onEditMeeting={handleEditMeeting}
          onFeedbackMeeting={handleFeedback}
          onMoveTask={(id, date) => updateItemDueDate("meeting", id, date)}
        />
      ) : (
        <CalendarView
          meetings={meetings}
          type="meeting"
          onEditTask={handleTaskClick}
          onEditMeeting={handleEditMeeting}
          onDeleteTask={handleDeleteTask}
          onFeedbackMeeting={handleFeedback}
          onDataChanged={refetchAll}
          fetchMeetings={refetchMeetings}
          showCompleted={showCompleted}
          currentDate={calendarDate}
          onChangeDate={setCalendarDate}
        />
      ),
    },
    ...(canGiveApprovalForBD || canGiveApprovalForISG
      ? [
          {
            tabKey: EngagementTabs.APPROVAL,
            label: "Approvals",
            content: toggle === "list" ? (
              <ListingView
                approval={approval}
                type="approval"
                showCompleted={showCompleted}
                onNavigateTask={handleNavigateTask}
                onMoveTask={(id, date) =>
                  updateItemDueDate("approval", id, date)
                }
              />
            ) : (
              <CalendarView
                approval={approval}
                type="approval"
                onDataChanged={refetchAll}
                showCompleted={showCompleted}
                currentDate={calendarDate}
                onChangeDate={setCalendarDate}
              />
            ),
          },
        ]
      : []),
    ...(canISGAssign || canBDAssign
      ? [
          {
            tabKey: EngagementTabs.ASSIGNMENT,
            label: "Assignments",
            content: toggle === "list" ? (
              <ListingView
                assignment={assignment}
                type="assignment"
                showCompleted={showCompleted}
                onEditTask={handleTaskClick}
                onDeleteTask={handleDeleteTask}
                onMoveTask={(id, date) =>
                  updateItemDueDate("assignment", id, date)
                }
                onCompleteTask={handleCompleteTask}
                onNavigateTask={handleNavigateTask}
              />
            ) : (
              <CalendarView
                assignment={assignment}
                type="assignment"
                onDataChanged={refetchAll}
                onNavigateTask={handleNavigateTask}
                onCompleteTask={handleCompleteTask}
                showCompleted={showCompleted}
                currentDate={calendarDate}
                onChangeDate={setCalendarDate}
              />
            ),
          },
        ]
      : []),
    {
      tabKey: EngagementTabs.TASK,
      label: "Tasks",
      content: toggle === "list" ? (
        <ListingView
          tasks={tasks}
          type="task"
          showCompleted={showCompleted}
          onEditTask={handleTaskClick}
          onDeleteTask={handleDeleteTask}
          onMoveTask={(id, date) => updateItemDueDate("task", id, date)}
          onCompleteTask={handleCompleteTask}
          onNavigateTask={handleNavigateTask}
        />
      ) : (
        <CalendarView
          tasks={tasks}
          type="task"
          onEditTask={handleTaskClick}
          onDataChanged={refetchAll}
          onCompleteTask={handleCompleteTask}
          showCompleted={showCompleted}
          fetchTasks={refetchTasks}
          currentDate={calendarDate}
          onChangeDate={setCalendarDate}
        />
      ),
    },
    {
      tabKey: EngagementTabs.SALES,
      label: "Sales activities",
      content: toggle === "list" ? (
        <ListingView
          sales={sales}
          type="sales"
          showCompleted={showCompleted}
          onMoveTask={(id, date) => updateItemDueDate("sales", id, date)}
        />
      ) : (
        <CalendarView
          sales={sales}
          type="sales"
          onDataChanged={refetchAll}
          showCompleted={showCompleted}
          currentDate={calendarDate}
          onChangeDate={setCalendarDate}
        />
      ),
    },
    ...(toggle === "list" // Only show Notes tab in List view
      ? [
          {
            tabKey: EngagementTabs.NOTES,
            label: "Notes",
            content: (
              <ListingView
                notes={notes}
                type="notes"
                onEditNotes={handleNotesEdit}
              />
            ),
          },
        ]
      : []),
  ];

  // Handle tab change using tab keys
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab as EngagementTabKey);
  };
  return (
    <HeaderContainer customStyles={headerCustomStyles}>
      <>
        {!hideHeader && (
          <HeadingAndButtonWrapper>
            <Typography variant="h1">Manage Engagements</Typography>
            <ButtonAndToggleWrapper>
              {activeTab !== NOTES_TAB_KEY && ( // Hide the "Show Completed" checkbox when the Notes
                <Checkbox
                  label="Show Completed"
                  isChecked={showCompleted}
                  onChange={(_, c) => setShowCompleted(c)}
                />
              )}

              <Button
                variantType="primary"
                sizeType="small"
                onClick={() => {
                  setShowFormDrawer(true);
                  setFormTab(TaskMeetingNotesTabs.TASK); // Set to Task tab
                }}
              >
                {CREATE}
              </Button>
              <ToggleButton
                value={toggle}
                onChange={(val) => {
                  setToggle(val);
                }}
                listView={listView}
                listViewActive={listViewActive}
                calendarView={calendarView}
                calendarViewActive={calendarViewActive}
              />
            </ButtonAndToggleWrapper>
          </HeadingAndButtonWrapper>
        )}
        <TabsWrapper>
          {isComponentLoading ? (
            <ColumnsSkeleton />
          ) : (
            <CustomTabs
              noBackgroundColor={true}
              tabs={tabList}
              activeTabKey={activeTab}
              onTabChange={handleTabChange}
            />
          )}
        </TabsWrapper>
        {showFormDrawer && (
          <TaskMeetingNotesForm
            openFromMainPage={true}
            onTaskCreated={() => {
              setShowFormDrawer(false);
              setEditTask(null);
              setEditMeeting(null);
              setEditNotes(null);
              refetchTasks();
            }}
            onMeetingCreated={() => {
              setShowFormDrawer(false);
              setEditMeeting(null);
              refetchMeetings();
            }}
            onNotesCreated={() => {
              setShowFormDrawer(false);
              setEditNotes(null);
              refetchNotes();
            }}
            open={showFormDrawer}
            onClose={() => {
              setShowFormDrawer(false);
              setEditTask(null);
              setEditMeeting(null);
              setEditNotes(null);
            }}
            editTask={editTask}
            editMeeting={editMeeting}
            editNote={editNotes} // <-- pass editNotes here
            formTab={formTab}
            setFormTab={setFormTab}
          />
        )}
        {showFeedbackDrawer && (
          <MeetingFeedbackDrawer
            open={showFeedbackDrawer}
            onClose={() => setShowFeedbackDrawer(false)}
            meeting={feedbackMeeting}
            onSuccess={refetchMeetings}
          />
        )}
      </>
    </HeaderContainer>
  );
};

export default ManageEngagements;
