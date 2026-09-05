import React, { useState, useEffect, useRef } from "react";
import { Box } from "@mui/material";
import {
  Visibility as VisibilityIcon,
  Description as DescriptionIcon,
  Schedule as ClockIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import { PortalStatus } from "../types";
import {
  CollapseButton,
  CollapseIcon,
  CollapsedHeader,
  ControlsContainer,
  ControlsHeader,
  DemoIcon,
  DragHandleIcon,
  ExpandedContainer,
  ExpandIcon,
  HeaderLeft,
  HeaderText,
  SmallVisibilityIcon,
  StatusBadge,
  StatusBadgeWrapper,
  StatusButton,
  StatusLabel,
  StatusesContainer,
} from "./styles";

interface DemoControlsProps {
  currentStatus: PortalStatus;
  onStatusChange: (status: PortalStatus) => void;
}

export const DemoControls: React.FC<DemoControlsProps> = ({
  currentStatus,
  onStatusChange,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [position, setPosition] = useState({
    x: typeof window !== "undefined" ? window.innerWidth - 250 : 0,
    y: typeof window !== "undefined" ? window.innerHeight - 350 : 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [hasBeenDragged, setHasBeenDragged] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<HTMLDivElement>(null);

  const statuses = [
    {
      status: "Draft" as PortalStatus,
      icon: DescriptionIcon,
      color: "#757575",
      label: "Draft",
    },
    {
      status: "Pending" as PortalStatus,
      icon: ClockIcon,
      color: "#F59E0B",
      label: "Pending",
    },
    {
      status: "Rejected" as PortalStatus,
      icon: WarningIcon,
      color: "#EF4444",
      label: "Rejected",
    },
    {
      status: "Active" as PortalStatus,
      icon: CheckCircleIcon,
      color: "#4F46E5",
      label: "Active",
    },
  ];

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isCollapsed) return;

    if ((e.target as HTMLElement).closest("button")) {
      return;
    }

    e.preventDefault();
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      const cardWidth = 280;
      const cardHeight = 60;
      const maxX = window.innerWidth - cardWidth;
      const maxY = window.innerHeight - cardHeight;

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setHasBeenDragged(true);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  if (isCollapsed) {
    const currentStatusData = statuses.find((s) => s.status === currentStatus);
    const StatusIcon = currentStatusData?.icon || VisibilityIcon;

    return (
      <ControlsContainer
        ref={dragRef}
        collapsed
        isDragging={isDragging}
        hasCustomPosition={hasBeenDragged}
        position={position}
        onMouseDown={handleMouseDown}
      >
        <CollapsedHeader>
          <DragHandleIcon />
          <Box display="flex" alignItems="center" gap={1}>
            <SmallVisibilityIcon />
            <HeaderText>Demo</HeaderText>
          </Box>
          <StatusBadgeWrapper>
            <StatusBadge badgecolor={currentStatusData?.color}>
              <StatusIcon fontSize="inherit" />
              <StatusLabel>{currentStatusData?.label}</StatusLabel>
            </StatusBadge>
          </StatusBadgeWrapper>
          <CollapseButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(false);
            }}
            title="Expand Demo Controls"
          >
            <ExpandIcon />
          </CollapseButton>
        </CollapsedHeader>
      </ControlsContainer>
    );
  }

  return (
    <ControlsContainer expanded>
      <ExpandedContainer>
        <ControlsHeader>
          <HeaderLeft>
            <DemoIcon />
            <HeaderText>Demo Controls</HeaderText>
          </HeaderLeft>
          <CollapseButton
            size="small"
            onClick={() => setIsCollapsed(true)}
            title="Collapse Demo Controls"
          >
            <CollapseIcon />
          </CollapseButton>
        </ControlsHeader>

        <StatusesContainer>
          {statuses.map((status) => {
            const Icon = status.icon;
            const isActive = currentStatus === status.status;

            return (
              <StatusButton
                key={status.status}
                active={isActive}
                statusColor={status.color}
                onClick={() => onStatusChange(status.status)}
              >
                <Icon fontSize="small" />
                <span>{status.label}</span>
              </StatusButton>
            );
          })}
        </StatusesContainer>
      </ExpandedContainer>
    </ControlsContainer>
  );
};

DemoControls.displayName = "DemoControls";
