import {
  MeetingFeedbackDrawer,
  TaskMeetingNotesErrorMessages,
  endPoints,
  setToastMessage,
  useApiMutation,
} from "@ui/ui-lib";
import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import {
  format,
  startOfWeek,
  addDays,
  subWeeks,
  addWeeks,
  subMonths,
  addMonths,
} from "date-fns";
import {
  NextWeekButton,
  CustomDateWithNumberPaper,
  LastWeekButton,
  DaySlotContent,
  CalendarWeekViewContainer,
  CustomDateWithNumberWrapper,
  CustomTypographyForDateNumber,
  CustomTypographyForDate,
  WeeklyCalendarMainContainer,
  StyledCalendarContainer,
  YearHeadingContainer,
  YearHeadingIconContainer,
  StyleYearContainer,
  WeeklyCalendarTodayPointer,
  StyledLeftIcon,
  StyledRightIcon,
} from "./styles";
import leftArrowIcon from "../../assets/svgs/left-arrow-icon.svg";
import rightArrowIcon from "../../assets/svgs/right-arrow-icon.svg";
import weeklyCalenderTodayPointer from "../../assets/svgs/weekly-calendar-today-pointer-icon.svg";
import TaskCard from "../../pages/ManageEngagements/ListingView/TaskCard";
import { useNavigate } from "react-router-dom";
import MeetingCard from "../../pages/ManageEngagements/ListingView/MeetingCard";
import { useDispatch } from "react-redux";
import { Task, Meeting } from "../../pages/ManageEngagements/type";

interface CalendarWeekViewProps {
  tasks?: Task[];
  meetings?: Meeting[];
  approval?: Task[];
  assignment?: Task[];
  sales?: Task[];
  notes?: any[];
  type: string;
  onEditTask?: (task: Task) => void;
  onEditMeeting?: (meeting: Meeting) => void;
  onEditNotes?: (note: any) => void;
  onDeleteTask?: (task: Task) => void;
  onMoveTask?: (id: string | number, newDate: Date) => void;
  onMoveMeeting?: (id: string | number, newDate: Date) => void;
  onCompleteTask?: (task: Task, completed: boolean) => void;
  onNavigateTask?: (task: Task) => void;
  onFeedbackMeeting?: (meeting: Meeting) => void;
  onDataChanged?: () => void;
  fetchTasks?: () => void;
  fetchMeetings?: () => void;
  currentDate?: Date;
  onChangeDate?: (date: Date) => void;
}

const getWeekDates = (referenceDate: Date): Date[] => {
  const start = startOfWeek(referenceDate, { weekStartsOn: 0 });
  return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
};

const CalendarWeekView: React.FC<CalendarWeekViewProps> = ({
  tasks = [],
  meetings = [],
  approval = [],
  assignment = [],
  sales = [],
  notes = [],
  type,
  onEditTask,
  onEditMeeting,
  onEditNotes,
  onDeleteTask,
  onMoveTask,
  onMoveMeeting,
  onCompleteTask,
  onNavigateTask,
  onFeedbackMeeting,
  onDataChanged,
  fetchTasks,
  fetchMeetings,
  currentDate,
  onChangeDate,
}) => {
  // fetchTasks
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showFormDrawer, setShowFormDrawer] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editMeeting, setEditMeeting] = useState<Meeting | null>(null);
  const [formTab, setFormTab] = useState(0);
  const [feedbackMeeting, setFeedbackMeeting] = useState<Meeting | null>(null);
  const [showFeedbackDrawer, setShowFeedbackDrawer] = useState(false);
  const weekDates = getWeekDates(currentDate ?? new Date());
  const todayStr = format(new Date(), "yyyy-MM-dd");

  // ✅ Memoize merged arrays
  const displayTasks = useMemo(() => {
    if (type === "all") {
      return [...tasks, ...approval, ...assignment, ...sales];
    } else if (type === "task") {
      return tasks;
    } else if (type === "approval") {
      return approval;
    } else if (type === "assignment") {
      return assignment;
    } else if (type === "sales") {
      return sales;
    } else {
      return tasks;
    }
  }, [type, tasks, approval, assignment, sales]);

  const displayMeetings = useMemo(() => {
    if (type === "meeting") {
      return meetings;
    } else {
      return meetings;
    }
  }, [type, meetings]);

  const [optimisticTasks, setOptimisticTasks] = useState<Task[]>(displayTasks);
  const [optimisticMeetings, setOptimisticMeetings] =
    useState<Meeting[]>(displayMeetings);

  const prevTypeRef = useRef<string>(type);

  useEffect(() => {
    setOptimisticTasks(displayTasks);
    setOptimisticMeetings(displayMeetings);
  }, [type, displayTasks, displayMeetings]);
  const allTasks: Task[] = optimisticTasks;
  const allMeetings: Meeting[] = optimisticMeetings;

  const dataByDate: Record<string, { tasks: Task[]; meetings: Meeting[] }> =
    weekDates.reduce(
      (
        acc: Record<string, { tasks: Task[]; meetings: Meeting[] }>,
        date: Date,
      ) => {
        const dateStr = format(date, "yyyy-MM-dd");
        acc[dateStr] = {
          tasks: allTasks.filter(
            (task) => (task.taskDate || task.dueDate) === dateStr,
          ),
          meetings: allMeetings.filter(
            (meeting) => meeting.meetingDate === dateStr,
          ),
        };
        return acc;
      },
      {} as Record<string, { tasks: Task[]; meetings: Meeting[] }>,
    );

  const handlePrevWeek = () => {
    onChangeDate && onChangeDate(subWeeks(currentDate ?? new Date(), 1));
  };

  const handleNextWeek = () => {
    onChangeDate && onChangeDate(addWeeks(currentDate ?? new Date(), 1));
  };

  const { mutate: updateTaskDateMutate } = useApiMutation({
    config: {
      onError: () => {
        dispatch(
          setToastMessage(TaskMeetingNotesErrorMessages.TASK_SAVE_ERROR),
        );
      },
    },
  });

  const { mutate: updateMeetingDateMutate } = useApiMutation({
    config: {
      onError: () => {
        dispatch(
          setToastMessage(TaskMeetingNotesErrorMessages.MEETING_SAVE_ERROR),
        );
      },
    },
  });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const destDateStr = result.destination.droppableId;
    const [itemType, itemId] = result.draggableId.split("-");
    const iso = destDateStr;
    const newDate = new Date(destDateStr);

    if (itemType === "task") {
      const originalTask = allTasks.find(
        (t) => String(t.id) === String(itemId),
      );
      if (!originalTask) return;

      const prevTasks = [...optimisticTasks];

      setOptimisticTasks((prev) =>
        prev.map((t) =>
          String(t.id) === String(itemId)
            ? { ...t, dueDate: iso, taskDate: iso }
            : t,
        ),
      );

      const payload = {
        dueDate: iso,
      };

      updateTaskDateMutate(
        {
          endpoint: `${endPoints.createTasks}/${itemId}`,
          method: "PUT",
          data: payload,
        },
        {
          onSuccess: () => {
            fetchTasks && fetchTasks();
            dispatch(
              setToastMessage(
                TaskMeetingNotesErrorMessages.TASK_UPDATED_SUCCESS,
              ),
            );
          },
          onError: () => {
            setOptimisticTasks(prevTasks);
            dispatch(
              setToastMessage(TaskMeetingNotesErrorMessages.TASK_SAVE_ERROR),
            );
          },
        },
      );

      if (onMoveTask) onMoveTask(itemId, newDate);
    } else if (itemType === "meeting") {
      const originalMeeting = optimisticMeetings.find(
        (m) => Number(m.id) === Number(itemId),
      );
      if (!originalMeeting) return;

      const prevMeetings = [...optimisticMeetings];

      setOptimisticMeetings((prev) =>
        prev.map((m) =>
          String(m.id) === String(itemId) ? { ...m, meetingDate: iso } : m,
        ),
      );

      const payload = {
        meetingDate: iso,
        startTime: originalMeeting?.startTime,
        endTime: originalMeeting?.endTime,
      };

      updateMeetingDateMutate(
        {
          endpoint: `${endPoints.createMeetings}/${itemId}`,
          method: "PUT",
          data: payload,
        },
        {
          onSuccess: () => {
            fetchMeetings && fetchMeetings();
            dispatch(
              setToastMessage(
                TaskMeetingNotesErrorMessages.MEETING_UPDATED_SUCCESS,
              ),
            );
          },
          onError: () => {
            setOptimisticMeetings(prevMeetings);
            dispatch(
              setToastMessage(TaskMeetingNotesErrorMessages.MEETING_SAVE_ERROR),
            );
          },
        },
      );

      if (onMoveMeeting) onMoveMeeting(itemId, newDate);
    }
  };

  const handleNavigateTask = (task: Task) => {
    if (task.opportunity?.opportunityId && task.activity?.id) {
      navigate(
        `/opportunities/${task.opportunity.opportunityId}?${task.activity.id}`,
      );
    }
  };

  return (
    <StyledCalendarContainer data-testid="calendar-week-view">
      <YearHeadingContainer>
        <YearHeadingIconContainer
          onClick={() =>
            onChangeDate &&
            onChangeDate(subMonths(currentDate ?? new Date(), 1))
          }
        >
          <img src={leftArrowIcon} alt="Previous Month" />
        </YearHeadingIconContainer>
        <StyleYearContainer>
          {format(currentDate, "MMMM yyyy")}
        </StyleYearContainer>
        <YearHeadingIconContainer
          onClick={() =>
            onChangeDate &&
            onChangeDate(addMonths(currentDate ?? new Date(), 1))
          }
        >
          <StyledRightIcon src={leftArrowIcon} alt="Next Month" />
        </YearHeadingIconContainer>
      </YearHeadingContainer>
      <DragDropContext onDragEnd={handleDragEnd}>
        <WeeklyCalendarMainContainer>
          {weekDates.map((date, index) => {
            const dateStr = format(date, "yyyy-MM-dd");
            const isFirst = index === 0;
            const isLast = index === 6;
            const isToday = dateStr === todayStr;

            return (
              <Droppable droppableId={dateStr} key={dateStr}>
                {(provided) => (
                  <CalendarWeekViewContainer
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {isFirst && (
                      <LastWeekButton onClick={handlePrevWeek}>
                        <StyledLeftIcon
                          data-testid="last-week-button"
                          src={leftArrowIcon}
                          alt="Meeting Icon"
                        />
                      </LastWeekButton>
                    )}
                    {isLast && (
                      <NextWeekButton
                        onClick={handleNextWeek}
                        data-testid="next-week-button"
                      >
                        <StyledRightIcon
                          src={leftArrowIcon}
                          alt="Meeting Icon"
                        />
                      </NextWeekButton>
                    )}
                    <CustomDateWithNumberPaper isToday={isToday}>
                      <CustomDateWithNumberWrapper>
                        <CustomTypographyForDate isToday={isToday}>
                          {format(date, "EEE")}
                        </CustomTypographyForDate>
                        <CustomTypographyForDateNumber isToday={isToday}>
                          {format(date, "dd")}
                        </CustomTypographyForDateNumber>
                      </CustomDateWithNumberWrapper>
                      {isToday && (
                        <WeeklyCalendarTodayPointer>
                          <img
                            src={weeklyCalenderTodayPointer}
                            alt="Today Pointer"
                          />
                        </WeeklyCalendarTodayPointer>
                      )}
                    </CustomDateWithNumberPaper>
                    <DaySlotContent>
                      {(dataByDate[dateStr]?.meetings || []).map(
                        (meeting, idx) => (
                          <Draggable
                            key={`meeting-${meeting.id}`}
                            draggableId={`meeting-${meeting.id}`}
                            index={idx}
                          >
                            {(dragProvided) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                              >
                                <MeetingCard
                                  meeting={meeting}
                                  onClick={(meetingData) => {
                                    onEditMeeting && onEditMeeting(meetingData);
                                  }}
                                  onFeedback={() =>
                                    onFeedbackMeeting &&
                                    onFeedbackMeeting(meeting)
                                  }
                                  fromCalendar={true}
                                />
                              </div>
                            )}
                          </Draggable>
                        ),
                      )}
                      {(dataByDate[dateStr]?.tasks || []).map((task, idx) => (
                        <Draggable
                          key={`task-${task.id}`}
                          draggableId={`task-${task.id}`}
                          index={
                            idx + (dataByDate[dateStr]?.meetings?.length || 0)
                          }
                        >
                          {(dragProvided) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                            >
                              <TaskCard
                                activity={task}
                                fromCalendar={true}
                                onClick={() => {
                                  onEditTask && onEditTask(task);
                                }}
                                onDelete={() =>
                                  onDeleteTask && onDeleteTask(task)
                                }
                                onComplete={(t, completed) =>
                                  onCompleteTask && onCompleteTask(t, completed)
                                }
                                onNavigate={handleNavigateTask}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </DaySlotContent>
                  </CalendarWeekViewContainer>
                )}
              </Droppable>
            );
          })}
        </WeeklyCalendarMainContainer>
      </DragDropContext>
      {showFeedbackDrawer && feedbackMeeting && (
        <MeetingFeedbackDrawer
          open={showFeedbackDrawer}
          onClose={() => {
            setShowFeedbackDrawer(false);
            setFeedbackMeeting(null);
          }}
          meeting={feedbackMeeting}
        />
      )}
    </StyledCalendarContainer>
  );
};

export default CalendarWeekView;
