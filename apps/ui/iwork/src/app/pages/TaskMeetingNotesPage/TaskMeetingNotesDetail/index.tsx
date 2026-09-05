import { useEffect, useRef, useState, useMemo } from "react";
import All from "../../../assets/svgs/all-button-icon.svg";
import DeleteIcon from "../../../assets/svgs/delete-icon.svg";
import EditIcon from "../../../assets/svgs/edit-pencil-icon.svg";
import MarkAsCompleteTickAfter from "../../../assets/svgs/mark-as-complete-tick-after.svg";
import MarkAsCompleteTickBefore from "../../../assets/svgs/mark-as-complete-tick-before.svg";
import Meetings from "../../../assets/svgs/meeting-icon.svg";
import Notes from "../../../assets/svgs/notes-icon.svg";
import Sales from "../../../assets/svgs/sales-icon.svg";
import TaskIcon from "../../../assets/svgs/task-priority-low-icon.svg";
import TargetIcon from "@ui/ui-lib/assets/svgs/target-icon.svg";
import warningTriangleIcon from "@ui/ui-lib/assets/svgs/warning-triangle-icon.svg";
import documentAlertIcon from "@ui/ui-lib/assets/svgs/document-alert-icon.svg";
import phoneCallIcon from "@ui/ui-lib/assets/svgs/phone-call-icon.svg";
import chatIcon from "@ui/ui-lib/assets/svgs/chat-icon.svg";
import usersIcon from "@ui/ui-lib/assets/svgs/users-icon.svg";
import documentLinesIcon from "@ui/ui-lib/assets/svgs/document-lines-icon.svg";
import calendarDateIcon from "@ui/ui-lib/assets/svgs/calendar-date-icon.svg";
import clockIcon from "@ui/ui-lib/assets/svgs/clock-icon.svg";
import briefcaseIcon from "@ui/ui-lib/assets/svgs/briefcase-icon.svg";
import chartLineIcon from "@ui/ui-lib/assets/svgs/chart-line-icon.svg";
import trendingUpIcon from "@ui/ui-lib/assets/svgs/trending-up-icon.svg";
import flagIcon from "@ui/ui-lib/assets/svgs/flag-icon.svg";
import checkmarkCircleIcon from "@ui/ui-lib/assets/svgs/checkmark-circle-icon.svg";
import notificationBellIcon from "@ui/ui-lib/assets/svgs/notification-bell-icon.svg";
import TaskMeetingNotesForm, {
  TaskMeetingNotesTabKey,
  TaskMeetingNotesTabs,
} from "../TaskMeetingNotesForm";
import {
  ConditionalEditIcon,
  DeleteActivityIcon,
  FilterButton,
  SubjectTextNudge,
  NudgeBoldSpan,
} from "./styles";
import {
  Activity,
  ActivityType,
  chipStyleMap,
  IconButtonSvgProps,
  Meeting,
  Note,
  Task,
} from "./types.js";

import { CircularProgress } from "@mui/material";
import {
  axiosInstance,
  ChipRenderer,
  CustomModal,
  endPoints,
  LoaderOverlay,
  setToastMessage,
  theme,
  useApiMutation,
  useApiQuery,
  NudgeCard,
  selectRoleId,
  selectRoleName,
  SCOPE_ID,
} from "@ui/ui-lib";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import {
  ActivitiesContainer,
  ActivityActions,
  ActivityEditIcon,
  ActivityHeaderRow,
  ActivityIcon,
  DateRow,
  DateText,
  DescriptionText,
  EmptyStateText,
  FilterButtonGroup,
  FilterRow,
  StyledHr,
  SubjectText,
  TaskMeetingNotesContainer,
  TaskMeetingNotesDetailsContainer,
} from "./styles.js";
import { environment } from "@ui/ui-lib";

// Icon mapping for API response
const iconMap: Record<string, string> = {
  warningTriangleIcon,
  documentAlertIcon,
  phoneCallIcon,
  chatIcon,
  usersIcon,
  documentLinesIcon,
  calendarDateIcon,
  clockIcon,
  briefcaseIcon,
  chartLineIcon,
  trendingUpIcon,
  flagIcon,
  checkmarkCircleIcon,
  notificationBellIcon,
  targetIcon: TargetIcon,
};

// Helper to get scope ID based on route
const getScopeIdFromPath = (pathname: string): number | null => {
  if (pathname.includes("/dashboard")) return SCOPE_ID.DASHBOARD;
  if (pathname.includes("/companies")) return SCOPE_ID.COMPANY;
  if (pathname.includes("/contact")) return SCOPE_ID.CONTACT;
  if (pathname.includes("/opportunities") && !pathname.includes("/renewal"))
    return SCOPE_ID.SALES_OPPORTUNITY;
  if (pathname.includes("/renewal-opportunities"))
    return SCOPE_ID.RENEWAL_OPPORTUNITY;
  if (pathname.includes("/policies")) return SCOPE_ID.POLICY;
  if (pathname.includes("/engagements/meetings")) return SCOPE_ID.MEETING;
  if (pathname.includes("/engagements/tasks")) return SCOPE_ID.TASK;
  return null;
};

// Transform API response to match NudgeCard interface
const transformNudgeData = (apiData: any[]) => {
  return apiData.map((item) => {
    // Split insight at first period: first sentence = insight, rest = action
    const insightText = item.insight || "";
    const firstPeriodIndex = insightText.indexOf(".");
    const insight =
      firstPeriodIndex > -1
        ? insightText.substring(0, firstPeriodIndex + 1).trim()
        : insightText;
    const action =
      firstPeriodIndex > -1
        ? insightText.substring(firstPeriodIndex + 1).trim()
        : "";

    return {
      id: item.nudge_id,
      title: item.title,
      icon: iconMap[item.icon] || warningTriangleIcon,
      backgroundColor: item.backgroundColor,
      insight,
      action,
      prompt: item.prompt,
      aiPayload: item.ai_payload,
      templateType: item.template_type,
    };
  });
};

// Accept modalBoxRef as prop for outside click handling
export default function TaskMeetingNotesDetail({
  modalBoxRef,
}: {
  modalBoxRef?: React.RefObject<HTMLDivElement>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const opportunityMatch = location.pathname.match(/^\/opportunities\/(\d+)/);
  const opportunityId = opportunityMatch ? Number(opportunityMatch[1]) : null;

  const userData = sessionStorage.getItem("user");
  //for delete, use the auth token
  //getting token from the local
  const token = userData ? JSON.parse(userData).accessToken.accessToken : null;

  // Access role information from Redux
  const roleId = useSelector(selectRoleId);
  const roleName = useSelector(selectRoleName);

  // extract roles from userData
  const userRoles: string[] = userData ? JSON.parse(userData).roles : [];
  // flag to check if role name is AI Nudges
  const hasAINudgesRole = userRoles.some((role: any) => role.name === "AI Nudge Access");  
  // Get scope ID based on current route
  const scopeId = getScopeIdFromPath(location.pathname);

  // Read nudge feature flag from environment
  const isShowNudges = environment.featureFlag.FF_IWORK_NUDGE_CARD;
  // Only fetch nudges if enabled
  const { data: nudgesData, isLoading: isLoadingNudges } = useApiQuery({
    url: endPoints.nudgesData(scopeId!),
    queryKey: ["nudges", scopeId],
    enabled: (!!scopeId || isShowNudges) && hasAINudgesRole,
  });

  const IconButtonSvg: React.FC<IconButtonSvgProps> = ({
    src,
    alt,
    width = 28,
    height = 28,
  }) => <img src={src} alt={alt} style={{ width, height }} />;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  // Drawer state for editing task/meeting
  const [showFormDrawer, setShowFormDrawer] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editMeeting, setEditMeeting] = useState<Meeting | null>(null);
  const [formTab, setFormTab] = useState<TaskMeetingNotesTabKey>(
    TaskMeetingNotesTabs.TASK
  ); // Controls Task/Meeting/Notes drawer tab

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [openCompleteDialog, setOpenCompleteDialog] = useState(false);
  const [selectedCompleteTaskId, setSelectedCompleteTaskId] = useState<
    string | null
  >(null);
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [selectedNotesId, setSelectedNotesId] = useState<string | null>(null);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(
    null
  );
  const [onCardHover, setOnCardHover] = useState<string | number>("");
 const [resolvedNudges, setResolvedNudges] = useState<any[]>([]);

  const [activityFilter, setActivityFilter] = useState<
    "all" | "completed" | "nudge" | ActivityType
  >("all");

  const getTaskTypeForFilter = (filter: string) => {
    switch (filter) {
      case "task":
        return "Task";
      case "sales":
        return "Activity";
      default:
        return null;
    }
  };

  const taskTypeParam = getTaskTypeForFilter(activityFilter);

  const tasksUrl = (() => {
    const baseUrl = opportunityId
      ? `${endPoints.getTaskByOpportunityId(opportunityId, 1, 100, true)}&showCompleted=true`
      : `${endPoints.getTasks}&showCompleted=true`;
    
    if (taskTypeParam) {
      return `${baseUrl}&search=taskType:${taskTypeParam}`;
    }
    return baseUrl;
  })();

  const meetingsUrl = opportunityId
    ? endPoints.getMeetingByOpportunityId(opportunityId, 1, 100, true)
    : endPoints.getMeetings;

  const notesUrl = opportunityId
    ? endPoints.getNotesByOpportunityId(opportunityId)
    : endPoints.getNotes;

  const {
    data: tasksData,
    refetch: refetchTasks,
    isFetching: isFetchingTasks,
  } = useApiQuery({
    url: tasksUrl,
    queryKey: ["tasks", opportunityId, activityFilter],
    enabled:
      activityFilter === "all" ||
      activityFilter === "task" ||
      activityFilter === "sales",
  });

  const {
    data: meetingsData,
    refetch: refetchMeetings,
    isFetching: isFetchingMeetings,
  } = useApiQuery({
    url: meetingsUrl,
    queryKey: ["meetings", opportunityId],
    enabled: activityFilter === "all" || activityFilter === "meeting",
  });

  const { data: notesData, refetch: refetchNotes } = useApiQuery({
    url: notesUrl,
    queryKey: ["notes", opportunityId],
    enabled: activityFilter === "all" || activityFilter === "note",
  });

  const dispatch = useDispatch();
  
  // Extract companyId from tasks or meetings when on opportunity page
  const initialFormData = useMemo(() => {
    if (!opportunityId) return null;
    
    // Try to get companyId from tasks first
    const companyId = (tasks[0]?.company as any)?.id || (meetings[0]?.company as any)?.id || null;
    
    // Get current user ID for assignee prefill
    const currentUser = userData ? JSON.parse(userData) : null;
    const currentUserId = currentUser?.userId;
    
    if (companyId && opportunityId) {
      return {
        companyId,
        opportunityId,
        ...(currentUserId && { userId: currentUserId }), // Add userId for task assignee prefill
      };
    }
    return null;
  }, [opportunityId, tasks, meetings, userData]);

  useEffect(() => {
    if (tasksData && tasksData.data && Array.isArray(tasksData.data.data)) {
      // Map backend response to Task[]
      setTasks(
        tasksData.data.data.map((t: any) => ({
          ...t,
          // Ensure dueDate is present for sorting and rendering
          dueDate: t.dueDate || t.taskDate || "",
          // Fallbacks for compatibility if needed
          description: t.description || "",
          // Keep object structures intact for filtering
          priority: t.priority || { id: 0, lookUpValue: "" },
          taskType: t.taskType || { id: 0, lookUpValue: "" },
          taskStatus: t.taskStatus?.lookUpValue || "",
          taskStatusLid: t.taskStatus?.id,
          // Additional fields for internal use
          priorityLid: t.priority?.id,
          companyId: t.company?.id || null,
          opportunityId: t.opportunity?.opportunityId || null,
          activityId: t.activity?.id || null,
        }))
      );
    }
  }, [tasksData]);

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

  // Merge all items into a single flat list with type
  type FlatItem =
    | (Task & { itemType: "task" })
    | (Meeting & { itemType: "meeting" })
    | (Note & { itemType: "note" });

  const flatList: FlatItem[] = [
    ...tasks.map((t) => ({ ...t, itemType: "task" as const })),
    ...meetings.map((m) => ({ ...m, itemType: "meeting" as const })),
    ...notes.map((n) => ({ ...n, itemType: "note" as const })),
  ];

  // Sort by date (descending, most recent first)
  flatList.sort((a, b) => {
    const getDate = (item: FlatItem) => {
      if (item.itemType === "task") return item.dueDate;
      if (item.itemType === "meeting") return item.meetingDate;
      if (item.itemType === "note") return item.date;
      return "";
    };
    return new Date(getDate(b)).getTime() - new Date(getDate(a)).getTime();
  });

  const formatDate = (dateString: string): string => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) return "Invalid Date";
    const dayNum = date.getDate();
    const monthName = date.toLocaleString("en-US", { month: "long" });
    const yearNum = date.getFullYear();
    return `${dayNum} ${monthName}, ${yearNum}`;
  };

  const isTaskCompleted = (status?: string) =>
    ["completed", "closed"].includes((status || "").toLowerCase());

  const validateSelectedId = (
    id?: string | null,
    typeOfActivity?: string
  ): void => {
    if (!id?.trim()) {
      throw new Error(
        `${
          typeOfActivity === "notes" ? "Note" : "Task"
        } ID is required for deletion.`
      );
    }
  };

  // Delete Task handler using axios and token from sessionStorage
  const handleDeleteTask = async (typeOfActivity: string) => {
    try {
      if (typeOfActivity === "task") {
        validateSelectedId(selectedTaskId, "task");
      } else if (typeOfActivity === "notes") {
        validateSelectedId(selectedNotesId, "notes");
      } else if (typeOfActivity === "meeting") {
        validateSelectedId(selectedMeetingId, "meeting");
      }
      const userData = sessionStorage.getItem("user");
      const token = userData
        ? JSON.parse(userData).accessToken.accessToken
        : null;
      let idToDelete;
      let endpoint;
      if (typeOfActivity === "task") {
        idToDelete = selectedTaskId;
        endpoint = endPoints.createTasks;
      } else if (typeOfActivity === "notes") {
        idToDelete = selectedNotesId;
        endpoint = endPoints.createNotes;
      } else if (typeOfActivity === "meeting") {
        idToDelete = selectedMeetingId;
        endpoint = endPoints.createMeetings;
      }
      const response = await axiosInstance.delete(`${endpoint}/${idToDelete}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (response.status !== 200 && response.status !== 204)
        throw new Error("Failed to delete");
      // Refresh data using refetch
      if (typeOfActivity === "task") {
        await refetchTasks();
        setSelectedTaskId(null);
      } else if (typeOfActivity === "notes") {
        await refetchNotes();
        setSelectedNotesId(null);
      } else if (typeOfActivity === "meeting") {
        await refetchMeetings();
        setSelectedMeetingId(null);
      }
      setOpenDialog(false);
    } catch (error) {
      dispatch(
        setToastMessage({ message: error?.message || "Error deleting" })
      );
      setOpenDialog(false);
      setSelectedTaskId(null);
      setSelectedNotesId(null);
      setSelectedMeetingId(null);
    }
  };
  // ...existing code...

  // Mutation for marking task as complete
  const { mutate: markTaskAsComplete, isLoading: isCompleting } =
    useApiMutation({
      config: {
        onSuccess: async () => {
          await refetchTasks();
        },
        onError: (error: any) => {
          dispatch(
            setToastMessage({ message: error?.message || "Error deleting" })
          );
        },
      },
    });

  // Handler for marking as complete
  // ...existing code...
  const handleMarkAsComplete = (taskId) => {
    setOpenCompleteDialog(false);
    setSelectedCompleteTaskId(null);

    // Find the task to check current status

    // Toggle status
    markTaskAsComplete({
      endpoint: `${endPoints.createTasks}/${taskId}/complete`,
      method: "PUT",
      taskId,
    });
  };

  const handleTaskClick = (task: Task) => {
    setEditTask(task);
    setEditMeeting(null);
    setFormTab(TaskMeetingNotesTabs.TASK); // Task tab
    setShowFormDrawer(true);
  };

  // // Filter state: 'all', 'active', 'closed'
  // const [activityFilter, setActivityFilter] = useState<
  //   "all" | "completed" | ActivityType
  // >("all");

  const mapToActivities = (): Activity[] => {
    const mappedTasks: Activity[] = tasks.map((t) => ({
      id: t.id,
      activityType: "task",
      status: isTaskCompleted(t.taskStatus) ? "completed" : "active",
      date: t.dueDate,
      title: t.taskName,
      description: t.description,
      priority: t.priority,
      taskType: t.taskType, // <-- Add taskType for filtering
    }));
    const mappedMeetings: Activity[] = meetings.map((m) => ({
      id: m.id,
      activityType: "meeting",
      status: m.meetingSubject === "completed" ? "completed" : "active",
      date: m.meetingDate,
      title: m.meetingSubject,
      description: m.meetingAgenda || "",
      meetingType: m.meetingType,
    }));
    const mappedNotes: Activity[] = notes.map((n) => ({
      id: n.id,
      activityType: "note",
      status: "active",
      date: n.date,
      title: n.title,
      description: n.description,
    }));

    return [...mappedTasks, ...mappedMeetings, ...mappedNotes];
  };

  const activities = mapToActivities();

  // 3. Filter logic
  const filteredActivities = activities.filter((activity) => {
    if (activityFilter === "nudge") {
      return false; // Nudges are handled separately
    }
    if (activityFilter === "all") {
      return (
        activity.activityType === "task" ||
        activity.activityType === "meeting" ||
        activity.activityType === "note"
      );
    }
    if (activityFilter === "sales") {
      // Only tasks with taskType.lookUpValue === 'Activity'
      return (
        activity.activityType === "task" &&
        activity.taskType?.lookUpValue === "Activity"
      );
    }
    if (activityFilter === "task") {
      // Show all tasks with taskType "Task"
      return (
        activity.activityType === "task" &&
        activity.taskType?.lookUpValue === "Task"
      );
    }
    if (activityFilter === "meeting") {
      return activity.activityType === "meeting";
    }
    if (activityFilter === "note") {
      return activity.activityType === "note";
    }
    return false;
  });

  // 4. Grouping logic for 'all' filter
  const groupByDate = (activityList: Activity[]) => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const isSameDay = (d1: Date, d2: Date) =>
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();

    const todayList: Activity[] = [];
    const tomorrowList: Activity[] = [];
    const nextWeekList: Activity[] = [];
    const completedList: Activity[] = [];

    activityList.forEach((a) => {
      if (a.status === "completed") {
        completedList.push(a);
        return;
      }
      const actDate = new Date(a.date);
      if (isSameDay(actDate, today)) todayList.push(a);
      else if (isSameDay(actDate, tomorrow)) tomorrowList.push(a);
      else if (actDate > tomorrow && actDate <= nextWeek) nextWeekList.push(a);
    });
    return { todayList, tomorrowList, nextWeekList, completedList };
  };

  const { todayList, tomorrowList } = groupByDate(filteredActivities);

  // Get nudge data from API

  const baseNudges = useMemo(() => {
    if ((!isShowNudges && !hasAINudgesRole) || !nudgesData || !Array.isArray(nudgesData)) {
      return [];
    }
    const transformed = transformNudgeData(nudgesData);
    // Sync resolvedNudges whenever baseNudges changes
    setResolvedNudges(transformed);
    return transformed;
  }, [nudgesData, isShowNudges, hasAINudgesRole]);
  useEffect(() => {
    if ( (!isShowNudges && !hasAINudgesRole) || !baseNudges?.length) return;

    let isMounted = true; // To avoid state update on unmounted component
    if (isShowNudges || hasAINudgesRole){
    const resolveNudges = async () => {
      try {
        // Create an array of promises for all dynamic nudges
        const promises = baseNudges
          .filter((nudge) => nudge.templateType === "dynamic")
          .map((nudge) =>
            axiosInstance
              .post(endPoints.nudgeParameterData(), nudge.aiPayload, {
                headers: { "Content-Type": "application/json" },
              })
              .then((response) => {
                // Bold the values wrapped in ##
                const template = response?.data?.nudge_template || '';
                const parts = template.split(/(##.*?##)/g).map((part : any, idx : any) => {
                  const match = part.match(/^##(.*)##$/);
                  return match ? <NudgeBoldSpan key={idx}>{match[1]}</NudgeBoldSpan> : part;
                });
                return {
                  id: nudge.id,
                  insight: parts,
                };
              })
              .catch(() => ({
                id: nudge.id,
                insight: nudge.insight, // fallback to original
              }))
          );

        // As each promise resolves, update the UI
        promises.forEach((promise) => {
          promise.then((resolvedNudge) => {
            if (isMounted) {
              setResolvedNudges((prev) =>
                prev.map((nudge) =>
                  nudge.id === resolvedNudge.id
                    ? { ...nudge, insight: resolvedNudge.insight }
                    : nudge
                )
              );
            }
          });
        });
      } catch (error) {
        // handle error if needed
      }
    };

    resolveNudges();
  }
    return () => {
      isMounted = false;
    };
  }, [baseNudges]);


const shouldShowNudges = baseNudges.length > 0;
  const nudgeGridStyles = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(359px, 1fr))",
    gap: "15px",
    paddingBottom: "10px",
  };
 const nudgesToRender = resolvedNudges.length ? resolvedNudges : baseNudges;

  // Check if we're on task or meeting route (only show nudges, no filters)
  const isTaskOrMeetingRoute =
    location.pathname.includes("/engagements/tasks") ||
    location.pathname.includes("/engagements/meetings");

  // 5. SVG filter buttons (use imported SVGs, icon only)
  const filterOptions = [
    {
      key: "all",
      label: "All",
      svg: <IconButtonSvg src={All} alt="All" />,
    },
    ...(shouldShowNudges && hasAINudgesRole
      ? [
          {
            key: "nudge",
            label: "Nudges",
            svg: <IconButtonSvg src={TargetIcon} alt="Nudges" />,
          },
        ]
      : []),
    {
      key: "meeting",
      label: "Meetings",
      svg: <IconButtonSvg src={Meetings} alt="Meetings" />,
    },
    {
      key: "task",
      label: "Task",
      svg: <IconButtonSvg src={TaskIcon} alt="Task" />,
    },
    {
      key: "sales",
      label: "Sales",
      svg: <IconButtonSvg src={Sales} alt="Sales" />,
    },
    {
      key: "note",
      label: "Notes",
      svg: <IconButtonSvg src={Notes} alt="Notes" />,
    },
  ];

  const { mutate: fetchMeetingById } = useApiMutation({
    config: {
      onSuccess: (response: any) => {
        if (response?.data) {
          setEditMeeting(response.data);
          setEditTask(null);
          setFormTab(TaskMeetingNotesTabs.MEETING); // Meeting tab
          setShowFormDrawer(true);
        }
      },
      onError: () => {
        setEditMeeting(null);
        setEditTask(null);
        setShowFormDrawer(false);
      },
    },
  });
  // Helper to render each activity card
  function renderActivityCard(activity: Activity, idx: number) {
    const uniqueKey = `${activity.activityType}-${activity.id}-wrapper`;
    const card = (() => {
      if (activity.activityType === "task" || activity.taskType === "sales") {
        const isCompleted = activity.status === "completed";
        return (
          <TaskMeetingNotesDetailsContainer
            key={activity.id}
            onMouseEnter={() => {
              setOnCardHover(activity.id);
            }}
            onMouseLeave={() => setOnCardHover("")}
          >
            <ActivityHeaderRow>
              <ChipRenderer
                value="Task"
                styleMap={chipStyleMap}
                size="small"
                ChipLabelContainerStyles={{ minWidth: 0, gap: 0 }}
              />
              <ChipRenderer
                value={String(activity.priority?.lookUpValue ?? "unknown").toLowerCase()}
                variant="withDot"
                styleMap={chipStyleMap}
                size="small"
                ChipStyles={{ width: "auto", minWidth: 0 }}
              />
              {onCardHover === activity.id && (
                <ActivityActions>
                  {/* For plain tasks, show toggle icon */}
                  {activity.activityType === "task" &&
                    !["Activity"].includes(
                      String(
                        activity.taskType?.lookUpValue ||
                          activity.taskType ||
                          ""
                      )
                    ) && (
                      <>
                        <ActivityIcon
                          as="img"
                          src={
                            isCompleted
                              ? MarkAsCompleteTickAfter
                              : MarkAsCompleteTickBefore
                          }
                          alt={
                            isCompleted
                              ? "Mark as incomplete"
                              : "Mark as complete"
                          }
                          disabled={isCompleted}
                          onClick={(e) => {
                            if (isCompleted) return;
                            e.stopPropagation();
                            setSelectedCompleteTaskId(activity.id.toString());
                            setOpenCompleteDialog(true);
                          }}
                        />
                        <ActivityIcon
                          as="img"
                          src={DeleteIcon}
                          alt="Delete"
                          disabled={isCompleted}
                          onClick={(e) => {
                            if (isCompleted) return;
                            e.stopPropagation();
                            setSelectedTaskId(activity.id.toString());
                            setOpenDialog(true);
                          }}
                        />
                        <ConditionalEditIcon
                          as="img"
                          src={EditIcon}
                          alt="Edit"
                          hidden={(() => {
                            const task = tasks.find(
                              (t) => t.id === activity.id
                            );
                            return task && task.taskIsEditable === "no";
                          })()}
                          onClick={(e) => {
                            e.stopPropagation();
                            const task = tasks.find(
                              (t) => t.id === activity.id
                            );
                            if (task) {
                              handleTaskClick(task);
                            }
                          }}
                        />
                      </>
                    )}

                  {/* For Activity: show completed icon only if closed */}
                  {activity.activityType === "task" &&
                    ["Activity"].includes(
                      String(
                        activity.taskType?.lookUpValue ||
                          activity.taskType ||
                          ""
                      )
                    ) &&
                    activity.status === "completed" && (
                      <ActivityIcon
                        as="img"
                        src={MarkAsCompleteTickAfter}
                        alt="Completed"
                      />
                    )}
                </ActivityActions>
              )}
            </ActivityHeaderRow>
            <SubjectText color={theme.palette.text.primary}>
              {activity.title}
            </SubjectText>
            <DescriptionText color={theme.palette.text.grey}>
              {activity.description}
            </DescriptionText>
            <DateRow>
              {isCompleted ? (
                <DateText color={theme.palette.text.teal}>Completed</DateText>
              ) : (
                <DateText color={theme.palette.text.teal}>
                  due on {formatDate(activity.date)}
                  {(() => {
                    // Find the task in the tasks array to get assignee
                    const task = tasks.find((t) => t.id === activity.id);
                    if (task && task.assignee && task.assignee.firstName) {
                      return ` | ${task.assignee.firstName}`;
                    }
                    return null;
                  })()}
                </DateText>
              )}
            </DateRow>
          </TaskMeetingNotesDetailsContainer>
        );
      }
      if (activity.activityType === "meeting") {
        // Find the meeting object to check meetingStatus
        const meeting = meetings.find((m) => m.id === activity.id);
        const isMeetingCompleted = meeting?.meetingStatus?.lookUpValue === "Completed";
        const isMeetingCancelled = meeting?.meetingStatus?.lookUpValue === "Cancelled";
        const isEditDisabled = isMeetingCompleted || isMeetingCancelled;
        
        return (
          <TaskMeetingNotesDetailsContainer
            key={activity.id}
            onMouseEnter={() => {
              setOnCardHover(activity.id);
            }}
            onMouseLeave={() => setOnCardHover("")}
          >
            <ActivityHeaderRow>
              <ChipRenderer
                value="meeting"
                styleMap={chipStyleMap}
                size="small"
                maxWidth="63px"
              />
              {onCardHover === activity.id && (
                <ActivityActions>
                  {/* Show completed icon if meetingStatus.lookUpValue === "Completed" */}
                  {isMeetingCompleted && (
                    <ActivityIcon
                      as="img"
                      src={MarkAsCompleteTickAfter}
                      alt="Completed"
                    />
                  )}
                  <DeleteActivityIcon
                    as="img"
                    src={DeleteIcon}
                    alt="Delete"
                    disabled={isEditDisabled}
                    onClick={(e) => {
                      if (isEditDisabled) return;
                      e.stopPropagation();
                      setSelectedMeetingId(activity.id.toString());
                      setOpenDialog(true);
                    }}
                  />

                  <ActivityEditIcon
                    as="img"
                    src={EditIcon}
                    alt="Edit"
                    disabled={isEditDisabled}
                    onClick={(e) => {
                      if (isEditDisabled) return;
                      e.stopPropagation();
                      fetchMeetingById({
                        endpoint: endPoints.getMeetingById(Number(activity.id)),
                        method: "GET",
                      });
                    }}
                  />
                </ActivityActions>
              )}
            </ActivityHeaderRow>
            <SubjectText color={theme.palette.text.primary}>
              <strong>
                {formatDate(activity.date)} | {activity.title}
              </strong>
            </SubjectText>
            <DescriptionText color={theme.palette.text.grey}>
              {activity.description}
            </DescriptionText>
          </TaskMeetingNotesDetailsContainer>
        );
      }
      if (activity.activityType === "note") {
        return (
          <TaskMeetingNotesDetailsContainer
            key={activity.id}
            onMouseEnter={() => {
              setOnCardHover(activity.id);
            }}
            onMouseLeave={() => setOnCardHover("")}
          >
            <ActivityHeaderRow>
              <ChipRenderer
                value="note"
                styleMap={chipStyleMap}
                size="small"
                maxWidth="50px"
              />
              {onCardHover === activity.id && (
                <ActivityActions>
                  {/* Edit icon for note */}
                  <ActivityEditIcon
                    as="img"
                    src={EditIcon}
                    alt="Edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Find the full note object by id
                      const note = notes.find((n) => n.id === activity.id);
                      if (note) {
                        setEditMeeting(null);
                        setEditTask(null);
                        setFormTab(TaskMeetingNotesTabs.NOTES); // Notes tab
                        setShowFormDrawer(true);
                        // You may want to set an editNote state if your form supports it
                        setEditNote(note);
                      }
                    }}
                  />
                  <DeleteActivityIcon
                    as="img"
                    src={DeleteIcon}
                    alt="Delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNotesId(activity.id.toString());
                      setOpenDialog(true);
                    }}
                  />
                </ActivityActions>
              )}
            </ActivityHeaderRow>
            <SubjectText color={theme.palette.text.primary}>
              {activity.title}
            </SubjectText>
            <DescriptionText variant="body2" color={theme.palette.text.grey}>
              {activity.description}
            </DescriptionText>
          </TaskMeetingNotesDetailsContainer>
        );
      }
      return null;
    })();
    return (
      <div key={uniqueKey}>
        {card}
        <StyledHr />
      </div>
    );
  }

  const renderNudgeSection = ({
    headingStyle,
    hideWhenEmpty = false,
    showEmptyState = true,
  }: {
    headingStyle?: React.CSSProperties;
    hideWhenEmpty?: boolean;
    showEmptyState?: boolean;
  }) => {
    if (hideWhenEmpty && nudgesToRender.length === 0) {
      return null;
    }
    return (
      <>
        <ActivityHeaderRow style={headingStyle ?? { marginBottom: 8 }}>
          <SubjectTextNudge color={theme.palette.text.primary}>
            Nudges ({nudgesToRender.length})
          </SubjectTextNudge>
        </ActivityHeaderRow>
        <ActivitiesContainer
          isEmpty={resolvedNudges.length === 0}
          style={nudgeGridStyles}
        >
          {nudgesToRender.length > 0
            ? nudgesToRender.map((nudge) => (
                <NudgeCard
                  key={nudge.id}
                  title={nudge.title}
                  icon={nudge.icon}
                  backgroundColor={nudge.backgroundColor}
                  insight={nudge.insight}
                  action={nudge.action}
                  onClick={() => {
                    console.log("Nudge clicked:", nudge);
                  }}
                />
              ))
            : showEmptyState && (
                <EmptyStateText>No nudges available</EmptyStateText>
              )}
        </ActivitiesContainer>
      </>
    );
  };

  return (
    <TaskMeetingNotesContainer ref={containerRef}>
      {/* Edit Task/Meeting Drawer */}
      {showFormDrawer && (
        <TaskMeetingNotesForm
          openFromMainPage={false}
          onTaskCreated={() => {
            setShowFormDrawer(false);
            setEditTask(null);
            setEditMeeting(null);
            refetchTasks(); // <-- Refetch after create/update
          }}
          onMeetingCreated={() => {
            setShowFormDrawer(false);
            setEditMeeting(null);
            refetchMeetings(); // <-- Refetch after create/update
          }}
          onNotesCreated={() => {
            setShowFormDrawer(false);
            refetchNotes(); // <-- Refetch after create/update
          }}
          open={showFormDrawer}
          onClose={() => {
            setShowFormDrawer(false);
            setEditTask(null);
            setEditMeeting(null);
          }}
          editTask={editTask}
          editMeeting={editMeeting}
          editNote={editNote}
          formTab={formTab}
          setFormTab={setFormTab}
          isFromOptyActivityPage={!!opportunityId}
        />
      )}
      {/* Fixed filter and add button row at the top */}
      {!isTaskOrMeetingRoute && (
        <FilterRow>
          <FilterButtonGroup>
            {filterOptions.map((opt) => (
              <FilterButton
                key={opt.key}
                selected={activityFilter === opt.key}
                onClick={() =>
                  setActivityFilter(opt.key as typeof activityFilter)
                }
                aria-label={opt.label}
                title={opt.label}
              >
                {opt.svg}
              </FilterButton>
            ))}
          </FilterButtonGroup>
          {/* Only show the add form, not edit drawer here */}
          <TaskMeetingNotesForm
            onTaskCreated={refetchTasks}
            onMeetingCreated={refetchMeetings}
            onNotesCreated={refetchNotes}
            containerRef={containerRef}
            createTaskInitialData={initialFormData}
            isFromOptyActivityPage={!!opportunityId}
          />
        </FilterRow>
      )}
      {/* Render Nudge Cards when nudge filter is selected OR on task/meeting routes */}
      {isTaskOrMeetingRoute ? (
        <>
          {/* Nudges Heading with count for task/meeting routes */}
          {renderNudgeSection({ headingStyle: { margin: 8 } })}
        </>
      ) : activityFilter === "nudge" ? (
        <>
          {/* Nudges Heading with count */}
          {renderNudgeSection({})}
        </>
      ) : activityFilter === "all" ? (
        <>
          {/* Nudges Heading with count */}
          {renderNudgeSection({ hideWhenEmpty: true, showEmptyState: false })}
          {/* Then render existing activities with their sorting */}
          <ActivitiesContainer>
            {(() => {
              // Combine all activities not in today or tomorrow, and sort by dueDate ascending
              const excludedIds = new Set(
                [...todayList, ...tomorrowList].map((a) => a.id)
              );
              // Use filteredActivities for restList to respect the filter
              const restList = filteredActivities.filter(
                (a) => !excludedIds.has(a.id)
              );
              const allForDisplay = [
                ...todayList,
                ...tomorrowList,
                ...restList,
              ].sort(
                (a, b) =>
                  new Date(a.date).getTime() - new Date(b.date).getTime()
              );
              if (isFetchingMeetings || isFetchingTasks || isLoadingNudges) {
                return (
                  <LoaderOverlay>
                    <CircularProgress />
                  </LoaderOverlay>
                );
              }
              if (allForDisplay.length === 0) {
                return <EmptyStateText>No items available</EmptyStateText>;
              }
              return allForDisplay.map(renderActivityCard);
            })()}
          </ActivitiesContainer>
        </>
      ) : (
        <ActivitiesContainer isEmpty={filteredActivities.length === 0}>
          {filteredActivities.length > 0 ? (
            filteredActivities.map(renderActivityCard)
          ) : (
            <EmptyStateText>No items available</EmptyStateText>
          )}
        </ActivitiesContainer>
      )}

      {/* Delete Confirmation Modal */}
      <CustomModal
        open={openDialog}
        handleClose={() => setOpenDialog(false)}
        heading={
          selectedMeetingId
            ? "Delete Meeting"
            : selectedTaskId
            ? "Delete Task"
            : "Delete Note"
        }
        buttons={[
          {
            label: "Cancel",
            onClick: () => setOpenDialog(false),
            variant: "secondary",
          },
          {
            label: "Delete",
            onClick: () => {
              // Determine typeOfActivity based on which id is set
              if (selectedTaskId) {
                handleDeleteTask("task");
              } else if (selectedNotesId) {
                handleDeleteTask("notes");
              } else if (selectedMeetingId) {
                handleDeleteTask("meeting");
              }
            },
            variant: "primary",
          },
        ]}
        // Forward the ref to the modal's root element for outside click handling
        modalBoxRef={modalBoxRef}
      >
        {selectedMeetingId
          ? "Are you sure you want to delete this meeting?"
          : selectedTaskId
          ? "Are you sure you want to delete this task?"
          : "Are you sure you want to delete this note?"}
      </CustomModal>

      {/* Complete Confirmation Modal */}
      <CustomModal
        open={openCompleteDialog}
        handleClose={() => setOpenCompleteDialog(false)}
        heading={(() => {
          const task = tasks.find(
            (t) => Number(t.id) === Number(selectedCompleteTaskId)
          );
          return isTaskCompleted(task?.taskStatus)
            ? "Mark as Incomplete"
            : "Mark as Complete";
        })()}
        buttons={[
          {
            label: "Cancel",
            onClick: () => setOpenCompleteDialog(false),
            variant: "secondary",
          },
          {
            label: (() => {
              const task = tasks.find(
                (t) => Number(t.id) === Number(selectedCompleteTaskId)
              );
              return isTaskCompleted(task?.taskStatus)
                ? "Mark Incomplete"
                : "Complete";
            })(),
            onClick: () => {
              if (selectedCompleteTaskId) {
                handleMarkAsComplete(selectedCompleteTaskId);
              }
            },
            variant: "primary",
          },
        ]}
        modalBoxRef={modalBoxRef} // Forward the ref to the modal's root element for outside click handling
      >
        {(() => {
          const task = tasks.find(
            (t) => Number(t.id) === Number(selectedCompleteTaskId)
          );
          return isTaskCompleted(task?.taskStatus)
            ? "Are you sure you want to mark this task as incomplete?"
            : "Are you sure you want to mark this task as completed?";
        })()}
      </CustomModal>
    </TaskMeetingNotesContainer>
  );
}
