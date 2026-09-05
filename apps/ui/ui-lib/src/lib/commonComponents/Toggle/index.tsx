import React from "react";
import { ToggleContainer, ToggleIconButton } from "./styles";

export interface ToggleButtonProps {
  value: "list" | "calendar";
  onChange: (value: "list" | "calendar") => void;
  listView: string; // SVG path for list inactive
  listViewActive: string; // SVG path for list active
  calendarView: string; // SVG path for calendar inactive
  calendarViewActive: string; // SVG path for calendar active
  ariaLabelList?: string;
  ariaLabelCalendar?: string;
  width?: number | string; // Optional width prop for custom width support
}

const ToggleButton: React.FC<ToggleButtonProps> = ({
  value,
  onChange,
  listView,
  listViewActive,
  calendarView,
  calendarViewActive,
  ariaLabelList = "List View",
  ariaLabelCalendar = "Calendar View",
  width,
}) => {
  // Choose the correct SVG for each state
  const ListIcon = value === "list" ? listViewActive : listView;
  const CalendarIcon = value === "calendar" ? calendarViewActive : calendarView;

  return (
    <ToggleContainer toggleWidth={width} data-testid="toggle-container">
      <ToggleIconButton
        active={value === "calendar"}
        position="left"
        onClick={() => onChange("calendar")}
        aria-label={ariaLabelCalendar}
      >
        <img
          src={CalendarIcon}
          alt="Calendar View"
          style={{ width: 24, height: 24 }}
        />
      </ToggleIconButton>
      <ToggleIconButton
        active={value === "list"}
        position="right"
        onClick={() => onChange("list")}
        aria-label={ariaLabelList}
      >
        <img
          src={ListIcon}
          alt="List View"
          style={{ width: 24, height: 24 }}
        />
      </ToggleIconButton>
    </ToggleContainer>
  );
};

export default ToggleButton;
