import React, { useState, useEffect, useCallback } from "react";
import {
  OverdueTaskContainer,
  OverdueCheckboxWrapper,
  OverdueInfo,
  OverdueHeader,
  OverduePriority,
  NormalTaskContainer,
  NormalHeader,
  NormalInfo,
  NormalTaskMeta,
  NormalCheckboxWrapper,
  CompanyActivityRow,
  EllipsisTaskName,
  EllipsisTaskDescription,
  StyledDate,
  CustomTypographyForTaskName,
  TaskPriority,
  DotIconContainer,
  MeetingIconContainer,
} from "./styles";
import { IconButton } from "@mui/material";
import RedirectIcon from "../../../assets/svgs/redirect-icon.svg";
import DotIcon from "../../../assets/svgs/dot-icon.svg";
import { ChipRenderer, colors } from "@ui/ui-lib";
import TaskPriorityHighIcon from "../../../assets/svgs/task-priority-high-icon.svg";
import TaskPriorityMediumIcon from "../../../assets/svgs/task-priority-medium-icon.svg";
import TaskPriorityLowIcon from "../../../assets/svgs/task-priority-low-icon.svg";
import MarkAsCompleteBefore from "../../../assets/svgs/mark-as-complete-tick-before.svg";
import MarkAsCompleteAfter from "../../../assets/svgs/mark-as-complete-tick-after.svg";
import { Task } from "../type";
import { useNavigate } from "react-router-dom";
import { TEMPLATE_MANAGEMENT_BASE_PATH } from "../../../routes/template-management.route";

// Task origin constants
const TASK_ORIGIN_COMPANY_CONFIGURATION_APPROVAL = "company_configuration_approval";
const TASK_ORIGIN_TEMPLATE_APPROVAL = "template_approval";
const TASK_ORIGIN_POLICY = "policy";

const chipStyleMap = {
  high: {
    color: colors.chips.septenary,
    dotColor: colors.chips.septenary,
  },
  medium: {
    color: colors.chips.quinary,
    dotColor: colors.chips.quinary,
  },
  low: {
    color: colors.chips.primary,
    dotColor: colors.chips.primary,
  },
};

interface TaskCardProps {
  activity: Task;
  variant?: "overdue" | "normal";
  onEdit?: (activity: Task) => void;
  onClick?: (activity: Task) => void;
  onDelete?: (activity: Task) => void;
  onComplete?: (activity: Task, completed: boolean) => void;
  onNavigate?: (activity: Task) => void;
  fromCalendar?: boolean;
}

interface CompleteToggleButtonProps {
  isChecked: boolean;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
}

const CompleteToggleButton: React.FC<CompleteToggleButtonProps> = ({
  isChecked,
  onClick,
  disabled,
}) => (
  <IconButton
    size="small"
    disabled={disabled}
    onPointerDown={(e) => {
      e.stopPropagation();
      e.preventDefault();
    }}
    onMouseDown={(e) => {
      e.stopPropagation();
      e.preventDefault();
    }}
    onClick={(e) => {
      e.stopPropagation();
      if (
        e.nativeEvent &&
        typeof e.nativeEvent.stopImmediatePropagation === "function"
      ) {
        e.nativeEvent.stopImmediatePropagation();
      }
      onClick(e);
    }}
    aria-label={isChecked ? "Mark as incomplete" : "Mark as complete"}
  >
    <img
      src={isChecked ? MarkAsCompleteAfter : MarkAsCompleteBefore}
      alt={isChecked ? "Completed" : "Mark as complete"}
      draggable={false}
      style={{ width: 18, height: 18 }}
      title={isChecked ? "Completed" : "Mark as complete"}
    />
  </IconButton>
);

const TaskCard: React.FC<TaskCardProps> = ({
  activity,
  variant = "normal",
  onClick,
  onComplete,
  onNavigate,
  fromCalendar,
}) => {
  const navigate = useNavigate();
  const [isChecked, setIsChecked] = useState(
    activity.taskStatus?.lookUpValue === "completed" ||
      activity.taskStatus?.lookUpValue === "closed"
  );

  useEffect(() => {
    setIsChecked(
      activity.taskStatus?.lookUpValue === "completed" ||
        activity.taskStatus?.lookUpValue === "closed"
    );
  }, [activity.taskStatus?.lookUpValue]);

  const dateObj = new Date(activity.dueDate);
  const month = dateObj.toLocaleString("en-US", { month: "short" });
  const date = dateObj.getDate();

  const priority =
    typeof activity.priority === "string"
      ? activity.priority
      : activity.priority?.lookUpValue;

  const taskStatusValue = activity.taskStatus?.lookUpValue?.toLowerCase();
  const isClosedStatus = taskStatusValue === "closed";
  const priorityValue = priority?.toLowerCase() ?? "unknown";

  const priorityIconMap: Record<string, string> = {
    imp: TaskPriorityHighIcon,
    vimp: TaskPriorityHighIcon,
    high: TaskPriorityHighIcon,
    medium: TaskPriorityMediumIcon,
    low: TaskPriorityLowIcon,
    all: TaskPriorityLowIcon,
    default: TaskPriorityHighIcon,
  };

  const priorityIcon =
    priorityIconMap[priorityValue] || priorityIconMap.default;

  const PriorityChip = (
    <ChipRenderer
      value={priorityValue}
      variant="withDot"
      styleMap={chipStyleMap}
      size="small"
      ChipStyles={{ width: "auto", minWidth: 0 }}
    />
  );

  const taskType =
    typeof activity.taskType === "string"
      ? activity.taskType
      : activity.taskType?.lookUpValue || "";

  const taskTypeLower = taskType.toLowerCase();
  const taskOrigin = activity.taskOrigin?.toLowerCase();

  const navigationTitle = (() => {
    if (taskOrigin === TASK_ORIGIN_COMPANY_CONFIGURATION_APPROVAL) {
      return "Review Company Configuration";
    }
    if (taskOrigin === TASK_ORIGIN_POLICY) {
      return "Navigate to Policy";
    }
    if (taskOrigin === TASK_ORIGIN_TEMPLATE_APPROVAL) {
      return "Navigate to Template";
    }
    return "Navigate to Opportunity";
  })();

  const handleNavigate = useCallback(() => {
    if (taskOrigin === TASK_ORIGIN_COMPANY_CONFIGURATION_APPROVAL && activity.company?.id) {
      navigate(`/companies/${activity.company.id}/configure-portal`);
      return;
    }
    if (taskOrigin === TASK_ORIGIN_TEMPLATE_APPROVAL && activity.templateId) {
      navigate(`/${TEMPLATE_MANAGEMENT_BASE_PATH}/preview/${activity.templateId}?redirect=true`);
      return;
    }
    onNavigate && onNavigate(activity);
  }, [activity, navigate, onNavigate, taskOrigin]);

  if (variant === "overdue") {
    return (
      <OverdueTaskContainer
        completed={isChecked}
        onClick={() => onClick && onClick(activity)}
      >
        <OverdueCheckboxWrapper>
          {taskTypeLower === "task" ? (
            <CompleteToggleButton
              isChecked={isChecked}
              disabled={isClosedStatus}
              onClick={() => {
                setIsChecked((prev) => !prev);
                onComplete && onComplete(activity, !isChecked);
              }}
            />
          ) : ["activity", "assignment", "approval"].includes(taskTypeLower) ? (
            isChecked ? (
              <IconButton size="small" disabled>
                <img
                  src={MarkAsCompleteAfter}
                  alt="completed"
                  draggable={false}
                />
              </IconButton>
            ) : (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNavigate();
                }}
                title={navigationTitle}
              >
                <img src={RedirectIcon} alt="navigate" draggable={false} />
              </IconButton>
            )
          ) : (
            <CompleteToggleButton
              isChecked={isChecked}
              onClick={() => {
                setIsChecked((prev) => !prev);
                onComplete && onComplete(activity, !isChecked);
              }}
            />
          )}
        </OverdueCheckboxWrapper>
        <OverdueInfo>
          <OverdueHeader>
            <EllipsisTaskName title={activity.taskName}>
              {activity.taskName}
            </EllipsisTaskName>
            <OverduePriority priority={priority}>
              {PriorityChip}
            </OverduePriority>
          </OverdueHeader>
          {(activity.company || activity.activity) && (
            <CompanyActivityRow>
              {activity.company && (
                <NormalTaskMeta as="span">
                  {activity.company.displayName || activity.company.name}
                </NormalTaskMeta>
              )}
              <img src={DotIcon} alt="" draggable={false} />
              {activity.activity && (
                <NormalTaskMeta as="span">
                  {activity.activity.activityName || activity.activity.name}
                </NormalTaskMeta>
              )}
            </CompanyActivityRow>
          )}
          {activity.description && (
            <EllipsisTaskDescription title={activity.description}>
              {activity.description}
            </EllipsisTaskDescription>
          )}
        </OverdueInfo>
      </OverdueTaskContainer>
    );
  }

  return (
    <NormalTaskContainer
      completed={isChecked}
      onClick={() => onClick && onClick(activity)}
    >
      <NormalCheckboxWrapper>
        {taskTypeLower === "task" ? (
          <CompleteToggleButton
            isChecked={isChecked}
            disabled={isClosedStatus}
            onClick={() => {
              setIsChecked((prev) => !prev);
              onComplete && onComplete(activity, !isChecked);
            }}
          />
        ) : ["activity", "assignment", "approval"].includes(taskTypeLower) ? (
          isChecked ? (
            <IconButton size="small" disabled>
              <img
                src={MarkAsCompleteAfter}
                alt="completed"
                draggable={false}
              />
            </IconButton>
          ) : (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNavigate();
                }}
                title={navigationTitle}
              >
                <img src={RedirectIcon} alt="navigate" draggable={false} />
              </IconButton>
          )
        ) : (
          <CompleteToggleButton
            isChecked={isChecked}
            onClick={() => {
              setIsChecked((prev) => !prev);
              onComplete && onComplete(activity, !isChecked);
            }}
          />
        )}
      </NormalCheckboxWrapper>
      <NormalInfo>
        <MeetingIconContainer>
          {!fromCalendar && (
            <img
              src={priorityIcon}
              alt={`${priorityValue} priority`}
              draggable={false}
            />
          )}
        </MeetingIconContainer>
        <div>
          <NormalHeader>
            {fromCalendar && (
              <img
                src={priorityIcon}
                alt={`${priorityValue} priority`}
                draggable={false}
              />
            )}
            <TaskPriority priority={priorityValue}>
              {activity.priority?.lookUpValue}
            </TaskPriority>
            {!fromCalendar && (
              <StyledDate priority={priorityValue}>
                {date.toString().padStart(2, "0")} {month}
              </StyledDate>
            )}
          </NormalHeader>
          <CustomTypographyForTaskName>
            {activity.taskName}
          </CustomTypographyForTaskName>
          {(activity.company || activity.activity) && (
            <CompanyActivityRow>
              {activity.company && (
                <NormalTaskMeta as="span">
                  {activity.company.displayName || activity.company.name}
                </NormalTaskMeta>
              )}
              {activity.company && activity.activity && (
                <DotIconContainer>
                  <img src={DotIcon} alt="" draggable={false} />
                </DotIconContainer>
              )}
              {activity.activity && (
                <NormalTaskMeta as="span">
                  {activity.activity.activityName}
                </NormalTaskMeta>
              )}
            </CompanyActivityRow>
          )}
          {activity.description && (
            <EllipsisTaskDescription title={activity.description}>
              {activity.description}
            </EllipsisTaskDescription>
          )}
        </div>
      </NormalInfo>
    </NormalTaskContainer>
  );
};

export default TaskCard;
