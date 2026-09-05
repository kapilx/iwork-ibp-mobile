import { Box, Stack, styled } from "@mui/material";
import { DateCalendar, PickersDay } from "@mui/x-date-pickers";

export const CalendarStyles = styled(DateCalendar)(({ theme }) => ({
  "&.MuiDateCalendar-root": {
    overflow: "hidden",
    width: "320px",
    maxHeight: "336px",
    display: "flex",
    flexDirection: "column",
    margin: theme.spacing(0, 4, 0, 0),
    border: `${theme.shape.borderSizes.thin} solid ${theme.palette.neutral.light}`,
    height: "283px",
    borderRadius: theme.shape.borderRadii.medium,
  },

  "& .MuiPickersDay-root": {
    width: "22px",
    height: "22px",
    fontSize: theme.typography.fontSizes.xxxs,
    fontWeight: theme.typography.fontWeights.regular,
    display: "flex",
    gap: theme.spacing(7),
    borderRadius: theme.shape.borderRadii.circle,
    "&:hover": {
      borderRadius: theme.shape.borderRadii.circle,
      backgroundColor: theme.palette.action.hover,
    },
  },

  "& .MuiPickersDay-root.MuiPickersDay-today": {
    border: `${theme.shape.borderSizes.thin} solid ${theme.palette.secondary.selected}`,
    borderRadius: theme.shape.borderRadii.medium,
    color: theme.palette.secondary.selected,
  },
  "& .MuiPickersDay-root.Mui-selected": {
    color: theme.palette.primary.contrastText,
    backgroundColor: `${theme.palette.secondary.selected} !important`,
    fontSize: theme.typography.fontSizes.xxxs,
    fontWeight: theme.typography.fontWeights.regular,
    borderRadius: `${theme.shape.borderRadii.medium} !important`,

    "&:hover": {
      backgroundColor: theme.palette.secondary.selected,
    },
  },
  "&:focus": {
    backgroundColor: theme.palette.primary.light,
  },
  "& .MuiDayCalendar-weekContainer": {
    display: "flex",
    flexDirection: "row",
    gap: theme.spacing(6),
  },
  "& .MuiDayCalendar-monthContainer": {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(0.5),
    minHeight: "155px",
    padding: theme.spacing(0, 4),
  },
  "& .MuiDayCalendar-weekDayLabel": {
    color: theme.palette.button.disabled,
    fontSize: theme.typography.fontSizes.xxxs,
    fontWeight: theme.typography.fontWeights.regular,
  },
  "& .MuiPickersCalendarHeader-root": {
    padding: theme.spacing(1.68, 3),
    borderBottom: `${theme.shape.borderSizes.thick} solid ${theme.palette.secondary.selected}`,
    position: "relative",
  },
  "& .MuiPickersCalendarHeader-labelContainer": {
    position: "absolute",
    top: "5%",
    left: "35%",
    color: theme.palette.text.primary,

    "& .MuiButtonBase-root.MuiIconButton-root": {
      color: theme.palette.text.primary,
    },
  },
  "& .MuiPickersArrowSwitcher-root": {
    gap: theme.spacing(27.4),

    "& .MuiButtonBase-root": {
      color: theme.palette.secondary.selected,
    },
  },
  "& .MuiPickersDay-dayOutsideMonth": {
    color: theme.palette.button.disabled,
  },
  "& .MuiDayCalendar-header": {
    display: "flex",
    justifyContent: "space-between",
    gap: theme.spacing(0),
  },
}));

export const StyledActivityDotContainer = styled(Stack)({
  display: "flex",
  justifyContent: "center",
  gap: 0.5,
  zIndex: 1,
});

export const StyledActivityDot = styled(Box)<{ bgcolor: string }>(
  ({ bgcolor, theme }) => ({
    width: 6,
    height: 6,
    borderRadius: theme.shape.borderRadii.circle,
    backgroundColor: bgcolor,
  })
);
export const DotContainer = styled(Box)({
  display: "flex",
  alignItems: "center",
  flexDirection: "column",
});
export const PickersDayActiveStyles = styled(PickersDay)(({ theme }) => ({
  backgroundColor: theme.palette.background.calendarDay,
  borderRadius: `${theme.shape.borderRadii.medium} !important`,
  "&:hover": {
    backgroundColor: `${theme.palette.background.calendarDay} !important`,
  },
}));

export const PickersDayStyles = styled(PickersDay)(({ theme }) => ({
  borderRadius: `${theme.shape.borderRadii.medium} !important`,
}));
