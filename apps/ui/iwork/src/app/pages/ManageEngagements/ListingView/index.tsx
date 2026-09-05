import React, { useState, useCallback, useRef } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import { Task, Meeting, Note, Approval } from "./../type";
import {
  ListingFlex,
  ListingColumn,
  ListingHeader,
  ListingActivity,
  NoTasksText,
  AnimatedListItem,
} from "./styles";
import TaskCard from "./TaskCard";
import MeetingCard from "./MeetingCard";
import NotesCard from "./NotesCard";
import { Button, useFlipAnimation } from "@ui/ui-lib";
import {
  ColumnsSkeleton,
  ListSkeleton,
} from "../../../components/DashboardSkeletons";

interface ListingViewProps {
  tasks?: Task[];
  meetings?: Meeting[];
  approval?: Approval[];
  assignment?: Task[];
  followUp?: Task[];
  sales?: Task[];
  notes?: Note[];
  type: string;
  showCompleted?: boolean;
  isLoading?: boolean;
  onEditTask?: (task: Task) => void;
  onEditMeeting?: (meeting: Meeting) => void;
  onDeleteTask?: (task: Task) => void;
  onMoveTask?: (id: string | number, newDate: Date) => void;
  onCompleteTask?: (task: Task, completed: boolean) => void;
  onNavigateTask?: (task: Task) => void;
  onFeedbackMeeting?: (meeting: Meeting) => void;
  onEditNotes?: (note: Note) => void;
}

const ListingView: React.FC<ListingViewProps> = ({
  tasks = [],
  meetings = [],
  approval = [],
  assignment = [],
  followUp = [],
  sales = [],
  notes = [],
  type,
  showCompleted = false,
  isLoading = false,
  onEditTask,
  onEditMeeting,
  onDeleteTask,
  onMoveTask,
  onCompleteTask,
  onNavigateTask,
  onFeedbackMeeting,
  onEditNotes,
}) => {
  const flipRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Local state for editing notes

  //
  // We keep a “limit” for how many completed items to show in each column.
  // That’s what `completedLimit` tracks.
  //
  const [completedLimit, setCompletedLimit] = useState({
    col1: 5,
    col2: 5,
    col3: 5,
  });

  //
  // This helper takes an array of items T (which may have a `taskStatus` field)
  // and splits them into three buckets: col1 (overdue/today), col2 (next 7 days), col3 (future).
  // It also splits each bucket into “active” vs. “completed.”
  //
  const categorizeByDate = <T extends { taskStatus?: string }>(
    items: T[],
    getDate: (item: T) => Date | null
  ) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

   // Change: nextSeven is today + 8 days (exclusive)
    const nextSeven = new Date(today);
    nextSeven.setDate(today.getDate() + 8);

    const col1 = { active: [] as T[], completed: [] as T[] };
    const col2 = { active: [] as T[], completed: [] as T[] };
    const col3 = { active: [] as T[], completed: [] as T[] };

    items.forEach((it) => {
      const d = getDate(it);
      if (!d) return; // if no valid date, skip

    // Zero out the time for comparison
    const dateOnly = new Date(d);
    dateOnly.setHours(0, 0, 0, 0);

    // Also zero out the time for tomorrow and nextSeven
    const tomorrowOnly = new Date(tomorrow);
    tomorrowOnly.setHours(0, 0, 0, 0);
    const nextSevenOnly = new Date(nextSeven);
    nextSevenOnly.setHours(0, 0, 0, 0);

  // Assign isCompleted to a variable for clarity
      const isCompleted =
        it?.taskStatus?.lookUpValue === "completed" || it?.taskStatus?.lookUpValue === "closed";
  let target;
  if (dateOnly < tomorrowOnly) target = col1;
  else if (dateOnly >= tomorrowOnly && dateOnly < nextSevenOnly) target = col2;
  else target = col3;

      if (isCompleted) target.completed.push(it);
      else target.active.push(it);
    });

    return { col1, col2, col3 };
  };

  //
  // This helper “flattens” a given column’s active/completed arrays into one array.
  // If showCompleted = false, we only return [...active].
  // If showCompleted = true, we return [...active, ...completed.slice(0, completedLimit[colKey])].
  //
 const buildData = <T extends { taskStatus?: any }>(
  active: T[],
  completed: T[],
  colKey: "col1" | "col2" | "col3"
) => {
  // Only show completed if showCompleted is true
  if (showCompleted) {
    return [...active, ...completed.slice(0, completedLimit[colKey])];
  }
  // Otherwise, only show active (completed disappear from UI)
  return [...active];
};

  //
  // We will push “columns” into this array. Each column has:
  //  - label: string
  //  - data: T[] (an array of items)
  //  - render: how to render each item
  //  - optionally completedCount & colKey if we want a “Load more” button
  //
  const columns: Array<{
    label: string;
    data: (Task | Meeting | Approval | Note)[];
    render: (item: Task | Meeting | Approval | Note) => JSX.Element;
    completedCount?: number;
    colKey?: "col1" | "col2" | "col3";
    emptyState?: string; // Optional empty state message
  }> = [];

  //
  // ─── 1) TASK tab ────────────────────────────────────────────────────────────
  // Only show tasks whose taskType !== 'Approval'
  //
  if (type === "task") {
    const taskItems = tasks.filter((t) => t.taskType.lookUpValue === "Task");
    const { col1, col2, col3 } = categorizeByDate(
      taskItems,
      (t) => {
        const ds = t.dueDate || t.taskDate;
        return ds ? new Date(ds) : null;
      }
    );

    // Overdue & Today column:
    columns.push({
      label: "Overdue & Today",
      emptyState: "No Tasks for Today, Hooray!",
      data: buildData(col1.active, col1.completed, "col1"),
      render: (item) => (
        <TaskCard
          activity={item as Task}
          onClick={onEditTask}
          onEdit={onEditTask}
          onDelete={onDeleteTask}
          onComplete={onCompleteTask}
          onNavigate={onNavigateTask}
        />
      ),
      completedCount: col1.completed.length,
      colKey: "col1",
    });

    // Next 7 Days column:
    columns.push({
      label: "Next 7 Days",
      data: buildData(col2.active, col2.completed, "col2"),
      render: (item) => (
        <TaskCard
          activity={item as Task}
          onClick={onEditTask}
          onEdit={onEditTask}
          onDelete={onDeleteTask}
          onComplete={onCompleteTask}
          onNavigate={onNavigateTask}
        />
      ),
      completedCount: col2.completed.length,
      colKey: "col2",
    });

    // Future column:
    columns.push({
      label: "Future",
      data: buildData(col3.active, col3.completed, "col3"),
      render: (item) => (
        <TaskCard
          activity={item as Task}
          onClick={onEditTask}
          onEdit={onEditTask}
          onDelete={onDeleteTask}
          onComplete={onCompleteTask}
          onNavigate={onNavigateTask}
        />
      ),
      completedCount: col3.completed.length,
      colKey: "col3",
    });
  }

  //
  // ─── 2) MEETING tab ─────────────────────────────────────────────────────────
  // We need to “flatten” each col’s active/completed before passing to data: []
  //
  else if (type === "meeting") {
    const meetingItems = meetings;
    const { col1, col2, col3 } = categorizeByDate(
      meetingItems,
      (m) => (m.meetingDate ? new Date(m.meetingDate) : null)
    );

    // Overdue & Today:
    columns.push({
      label: "Overdue & Today",
      emptyState: "No Meetings for Today, Hooray!",
      data: buildData(col1.active, col1.completed, "col1"),
      render: (item) => (
        <MeetingCard
          meeting={item as Meeting}
          onClick={onEditMeeting}
          onFeedback={onFeedbackMeeting}
        />
      ),
      completedCount: col1.completed.length,
      colKey: "col1",
    });

    // Next 7 Days:
    columns.push({
      label: "Next 7 Days",
      emptyState: "No Meetings for Next 7 Days",
      data: buildData(col2.active, col2.completed, "col2"),
      render: (item) => (
        <MeetingCard
          meeting={item as Meeting}
          onClick={onEditMeeting}
          onFeedback={onFeedbackMeeting}
        />
      ),
      completedCount: col2.completed.length,
      colKey: "col2",
    });

    // Future:
    columns.push({
      label: "Future",
      emptyState: "No Meetings for Future",
      data: buildData(col3.active, col3.completed, "col3"),
      render: (item) => (
        <MeetingCard
          meeting={item as Meeting}
          onClick={onEditMeeting}
          onFeedback={onFeedbackMeeting}
        />
      ),
      completedCount: col3.completed.length,
      colKey: "col3",
    });
  }

  //
  // ─── 3) APPROVAL tab ────────────────────────────────────────────────────────
  // Only show tasks whose taskType === 'Approval'
  //
  else if (type === "approval") {
    const approvalItems = approval.filter(
      (a) => a.taskType.lookUpValue === "Approval"
    ) as Task[];

    const { col1, col2, col3 } = categorizeByDate(
      approvalItems,
      (a) => {
        const ds = a.dueDate || a.taskDate;
        return ds ? new Date(ds) : null;
      }
    );

    columns.push({
      label: "Overdue & Today",
      emptyState: "No Approvals for today, Hooray!",
      data: buildData(col1.active, col1.completed, "col1"),
      render: (item) => (
        <TaskCard
          activity={item as Task}
          onComplete={onCompleteTask}
          onNavigate={onNavigateTask}
        />
      ),
      completedCount: col1.completed.length,
      colKey: "col1",
    });

    columns.push({
      label: "Next 7 Days",
      emptyState: "No Approvals for Next 7 Days",
      data: buildData(col2.active, col2.completed, "col2"),
      render: (item) => (
        <TaskCard
          activity={item as Task}
          onComplete={onCompleteTask}
          onNavigate={onNavigateTask}
        />
      ),
      completedCount: col2.completed.length,
      colKey: "col2",
    });

    columns.push({
      label: "Future",
      emptyState: "No Approvals for Future",
      data: buildData(col3.active, col3.completed, "col3"),
      render: (item) => (
        <TaskCard
          activity={item as Task}
          onComplete={onCompleteTask}
          onNavigate={onNavigateTask}
        />
      ),
      completedCount: col3.completed.length,
      colKey: "col3",
    });
  }

  //
  // ─── 4) NOTES tab ───────────────────────────────────────────────────────────
  //
  else if (type === "notes") {
    const noteItems = notes;
    if (noteItems.length) {
      columns.push({
        label: "Notes",
        data: noteItems,
        render: (item) => (
          <NotesCard
            note={item as Note}
            onEdit={onEditNotes}
            onClick={onEditNotes} // This triggers the parent's handler
          />
        ),
      });
    }
  }

  //
  // ─── 5) SALES / FOLLOWUP / ALL ───────────────────────────────────────────────
  //
 else if (type === "sales") {
  const arr: (Task | Meeting | Approval)[] = sales;

  const { col1, col2, col3 } = categorizeByDate(
    arr,
    (item) => {
      if ("meetingDate" in item) {
        return new Date((item as Meeting).meetingDate);
      }
      const t = item as Task;
      const ds = t.dueDate || t.taskDate;
      return ds ? new Date(ds) : null;
    }
  );

  // A small helper that picks the correct “renderer” row-by-row:
  const renderRow = (it: Task | Meeting | Approval) => {
    if ("meetingDate" in it) {
      return (
        <MeetingCard
          meeting={it as Meeting}
          onClick={onEditMeeting}
          onFeedback={onFeedbackMeeting}
        />
      );
    }
    if ((it as any).taskType === "Approval") {
      return (
        <TaskCard
          activity={it as Task}
          onComplete={onCompleteTask}
          onNavigate={onNavigateTask}
        />
      );
    }
    return (
      <TaskCard
        activity={it as Task}
        onComplete={onCompleteTask}
        onNavigate={onNavigateTask}
      />
    );
  };

  columns.push({
    label: "Overdue & Today",
    emptyState: "No Activities for Today, Hooray!",
    data: buildData(col1.active, col1.completed, "col1"),
    render: renderRow,
    completedCount: col1.completed.length,
    colKey: "col1",
  });

  columns.push({
    label: "Next 7 Days",
    emptyState: "No Activities for Next 7 Days",
    data: buildData(col2.active, col2.completed, "col2"),
    render: renderRow,
    completedCount: col2.completed.length,
    colKey: "col2",
  });

  columns.push({
    label: "Future",
    emptyState: "No Activities for Future",
    data: buildData(col3.active, col3.completed, "col3"),
    render: renderRow,
    completedCount: col3.completed.length,
    colKey: "col3",
  });
}
else if (type === "all") {
  const arr: (Task | Meeting | Approval)[] = [
    ...tasks,
    ...meetings,
    ...approval,
    ...sales,
    ...assignment,
  ];

  const { col1, col2, col3 } = categorizeByDate(
    arr,
    (item) => {
      if ("meetingDate" in item) {
        return new Date((item as Meeting).meetingDate);
      }
      const t = item as Task;
      const ds = t.dueDate || t.taskDate;
      return ds ? new Date(ds) : null;
    }
  );

  // A small helper that picks the correct “renderer” row-by-row:
  const renderRow = (it: Task | Meeting | Approval) => {
    if ("meetingDate" in it) {
      return (
        <MeetingCard
          meeting={it as Meeting}
          onClick={onEditMeeting}
          onFeedback={onFeedbackMeeting}
        />
      );
    }
    if ((it as any).taskType === "Approval") {
      return (
        <TaskCard
          activity={it as Task}
          onComplete={onCompleteTask}
          onNavigate={onNavigateTask}
        />
      );
    }
    return (
      <TaskCard
        onEdit={onEditTask}
        onClick={onEditTask}
        activity={it as Task}
        onComplete={onCompleteTask}
        onNavigate={onNavigateTask}
      />
    );
  };

  columns.push({
    label: "Overdue & Today",
    data: buildData(col1.active, col1.completed, "col1"),
    render: renderRow,
    completedCount: col1.completed.length,
    colKey: "col1",
  });

  columns.push({
    label: "Next 7 Days",
    data: buildData(col2.active, col2.completed, "col2"),
    render: renderRow,
    completedCount: col2.completed.length,
    colKey: "col2",
  });

  columns.push({
    label: "Future",
    data: buildData(col3.active, col3.completed, "col3"),
    render: renderRow,
    completedCount: col3.completed.length,
    colKey: "col3",
  });
}

  //
  // ─── 6) ASSIGNMENT tab ──────────────────────────────────────────────────────
  // Only show tasks whose taskType === 'Assignment'
  //
  if (type === "assignment") {
    const assignmentItems = assignment.filter(
      (a) => a.taskType.lookUpValue === "Assignment"
    ) as Task[];
    const { col1, col2, col3 } = categorizeByDate(
      assignmentItems,
      (a) => {
        const ds = a.dueDate || a.taskDate;
        return ds ? new Date(ds) : null;
      }
    );

    columns.push({
      label: "Overdue & Today",
      data: buildData(col1.active, col1.completed, "col1"),
      emptyState: "No Assignments for Today, Hooray!",
      render: (item) => (
        <TaskCard
          activity={item as Task}
          onComplete={onCompleteTask}
          onNavigate={onNavigateTask}
        />
      ),
      completedCount: col1.completed.length,
      colKey: "col1",
    });

    columns.push({
      label: "Next 7 Days",
      emptyState: "No Assignments for Next 7 Days",
      data: buildData(col2.active, col2.completed, "col2"),
      render: (item) => (
        <TaskCard
          activity={item as Task}
          onComplete={onCompleteTask}
          onNavigate={onNavigateTask}
        />
      ),
      completedCount: col2.completed.length,
      colKey: "col2",
    });

    columns.push({
      label: "Future",
      emptyState: "No Assignments for Future",
      data: buildData(col3.active, col3.completed, "col3"),
      render: (item) => (
        <TaskCard
          activity={item as Task}
          onComplete={onCompleteTask}
          onNavigate={onNavigateTask}
        />
      ),
      completedCount: col3.completed.length,
      colKey: "col3",
    });
  }

  //
  // If for whatever reason no columns were built, show a “No activities found” message.
  //
  if (!columns.length) {
    if (isLoading) {
      return <ColumnsSkeleton />;
    }
    return <NoTasksText>No Notes found</NoTasksText>;
  }

  //
  // ─── DRAG & DROP HANDLER ────────────────────────────────────────────────────
  //
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !onMoveTask) return;
    const dest = parseInt(result.destination.droppableId, 10);
    const src = parseInt(result.source.droppableId, 10);
    if (dest === src) return;

    const newDate = new Date();
    newDate.setHours(0, 0, 0, 0);
    if (dest === 1) newDate.setDate(newDate.getDate() + 1);
    else if (dest === 2) newDate.setDate(newDate.getDate() + 8);
    // dest === 0 => “today/overdue”

    onMoveTask(result.draggableId, newDate);
  };

  //
  // ─── RENDER ─────────────────────────────────────────────────────────────────
  //
  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <ListingFlex>
        {columns.map((col, colIdx) => (
          <ListingColumn key={col.label}>
            <ListingHeader>
              {col.label} ({col.data.length})
            </ListingHeader>
            <Droppable droppableId={String(colIdx)}>
              {(provided) => (
                <ListingActivity
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {col.data.length ? (
                    col.data.map((item, idx) => {
                      const type = (item as any).meetingDate
                        ? "meeting"
                        : (item as any).taskType?.lookUpValue || "task";
                      const itemId = `${type}-${String((item as any).id)}`;
                      return (
                        <DraggableItem
                          key={itemId}
                          item={item}
                          index={idx}
                          renderContent={col.render}
                        />
                      );
                    })
                  ) : isLoading ? (
                    <ListSkeleton items={3} height={64} />
                  ) : (
                    <NoTasksText>
                     {col.emptyState ?? "No Tasks for "+ col.label.toLowerCase()}
                    </NoTasksText>
                  )}
                  {provided.placeholder}

                  {/**
                   * If we’re showing completed items, and there are more
                   * than `completedLimit[colKey]` in that column, show a
                   * “Load more” button.
                   */}
                  {showCompleted &&
                    col.colKey &&
                    col.completedCount !== undefined &&
                    col.completedCount > completedLimit[col.colKey] && (
                      <div style={{ textAlign: "center", marginTop: 8 }}>
                        <Button
                          variantType="secondary"
                          sizeType="small"
                          onClick={() =>
                            setCompletedLimit((prev) => ({
                              ...prev,
                              [col.colKey!]:
                                prev[col.colKey!] + 5,
                            }))
                          }
                        >
                          Load more
                        </Button>
                      </div>
                    )}
                </ListingActivity>
              )}
            </Droppable>
          </ListingColumn>
        ))}
      </ListingFlex>

      {/* Render NotesForm in a drawer/modal */}
    </DragDropContext>
  );
};

// First, create a separate component for the draggable item
interface DraggableItemProps {
  item: Task | Meeting | Approval | Note;
  index: number;
  renderContent: (item: Task | Meeting | Approval | Note) => JSX.Element;
}

const DraggableItem = React.memo(({ item, index, renderContent }: DraggableItemProps) => {
  // Use a composite key to ensure uniqueness
  const type = (item as any).meetingDate
    ? "meeting"
    : (item as any).taskType?.lookUpValue || "task";
  const itemId = `${type}-${String((item as any).id)}`;
  const isCompleted =
    (item as Task).taskStatus?.lookUpValue === "completed" ||
    (item as Task).taskStatus?.lookUpValue === "closed";
  const ref = useFlipAnimation<HTMLDivElement>(itemId, isCompleted);

  return (
    <Draggable draggableId={itemId} index={index} key={itemId}>
      {(provided) => (
        <AnimatedListItem
          ref={(el) => {
            provided.innerRef(el);
            if (ref && typeof ref === "object") {
              (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
            }
          }}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            transformOrigin: "center top",
            backfaceVisibility: "hidden",
          }}
        >
          {renderContent(item)}
        </AnimatedListItem>
      )}
    </Draggable>
  );
});

export default ListingView;
