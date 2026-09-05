import { Box, Stack } from "@mui/material";
import { DateCalendar, PickersDay, PickersDayProps } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import {
  CalendarStyles,
  StyledActivityDot,
  DotContainer,
  PickersDayActiveStyles,
  PickersDayStyles,
} from "./styles";
import { theme } from "@ui/ui-lib/styles/Theme";
import { useMemo } from "react";
import { formatDate } from "@ui/ui-lib/utils/DateFormat";
import { DATE_FORMATS } from "../../constants";

// ----------------------
// Types & Interfaces
// ----------------------

// Each activity row contains a label and a date
export interface ActivityRow {
  label: string;
  date: Dayjs | null;
}

// Props expected by the Calendar component
export interface ActivityCalendarProps {
  rows: ActivityRow[];
  selectedDate: Dayjs;
  onChange: (date: Dayjs | null) => void;
  labelColorMap?: Record<string, string>;
}

// Internal map of activities by date
interface ActivityMap {
  [dateKey: string]: { label: string }[];
}

// Map that holds color values for labels
interface LabelColorMap {
  [label: string]: string;
}

// ----------------------
// Utility Function
// ----------------------

/**
 * Returns a consistent color for each unique label.
 * Cycles through chipColors defined in the theme.
 */
export const getChipColorFromLabel = (label: string, index: number): string => {
  const chipColors = Object.values(theme.palette.chips || {});
  return chipColors.length > 0
    ? chipColors[index % chipColors.length]
    : theme.palette.primary.main;
};

// ----------------------
// Calendar Component
// ----------------------

export default function Calendar({
  rows = [],
  selectedDate = dayjs(),
  onChange = () => {},
  labelColorMap = {}, // 👈 Receive shared map
}: ActivityCalendarProps) {
  const { activityMap } = useMemo(() => {
    const aMap: ActivityMap = {};

    rows.forEach((row) => {
      if (row?.date) {
        const dateKey = formatDate(row.date, DATE_FORMATS.DATE_MONTH_YEAR);
        const label = row.label || "";

        if (!aMap[dateKey]) {
          aMap[dateKey] = [];
        }
        aMap[dateKey].push({ label });
      }
    });

    return { activityMap: aMap };
  }, [rows]);

  const renderDay = (
    day: Dayjs,
    _selectedDates: Array<Dayjs | null>,
    pickersDayProps: PickersDayProps<Dayjs>
  ) => {
    const dateKey = formatDate(day, DATE_FORMATS.DATE_MONTH_YEAR);
    const activities = activityMap[dateKey];

    return (
      <DotContainer>
        {activities ? (
          <PickersDayActiveStyles {...pickersDayProps} disableMargin />
        ) : (
          <PickersDayStyles {...pickersDayProps} disableMargin />
        )}
        {activities && (
          <Stack direction="row" spacing={0.3} justifyContent="center">
            {activities.map((a, i) => (
              <StyledActivityDot key={i} bgcolor={labelColorMap[a.label]} />
            ))}
          </Stack>
        )}
      </DotContainer>
    );
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        <CalendarStyles
          showDaysOutsideCurrentMonth
          value={selectedDate}
          onChange={onChange}
          slots={{ day: (props) => renderDay(props.day, [], props) }}
        />
      </Box>
    </LocalizationProvider>
  );
}
