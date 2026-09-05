import { styled, Box, Typography, backdropClasses } from "@mui/material";
import type { BoxProps } from "@mui/material";
import styledComponent, { css } from "styled-components";

export const OverdueTaskContainer = styled(Box)<
  BoxProps & { completed?: boolean }
>(({ theme, completed }) => ({
  position: "relative",
  display: "flex",
  gap: theme.spacing(2),
  alignItems: "flex-start",
  padding: theme.spacing(1.5),
  ...(completed && {
    opacity:1,
  }),
}));

export const OverdueCheckboxWrapper = styled(Box)<BoxProps>(({ theme }) => ({
  position: "absolute",
  top: theme.spacing(1.5),
  right: theme.spacing(1.5),
  display: "flex",
  alignItems: "center",
}));

export const OverdueCheckbox = styled("input")(({ theme }) => ({
  width: 16,
  height: 16,
  accentColor: theme.palette.primary.main,
}));

export const OverdueInfo = styled(Box)<BoxProps>(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.5),
  width: "100%",
}));

export const OverdueHeader = styled(Box)<BoxProps>(({ theme }) => ({
  display: "flex",
  alignItems: "center",
}));

export const OverdueTaskName = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.primary,
  fontSize: theme.typography.fontSizes.sm,
}));

export const EllipsisTaskName = styled(OverdueTaskName)(({ theme }) => ({
  overflow: "hidden",
  fontWeight: theme.typography.fontWeights.medium,
  fontSize: theme.typography.fontSizes.md,
  textOverflow: "ellipsis",
})) as typeof OverdueTaskName;

export const OverduePriority = styled("span")<{ priority?: string }>(
  ({ theme, priority }) => ({
    background: theme.palette.background.paper,
    color:
      priority === "High" || priority === "Default"
        ? theme.palette.error.main
        : priority === "Medium"
        ? theme.palette.warning.main
        : priority === "Low" || priority === "All"
        ? theme.palette.text.lightGrey
        : theme.palette.warning.main,
    borderRadius: theme.shape.borderRadius,
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: 600,
  })
);

export const OverdueDate = styled("div")(({ theme }) => ({
  color: theme.palette.text.primary,
  fontSize: theme.typography.fontSizes.sm,
  marginTop: theme.spacing(0.5),
}));

export const NormalTaskContainer = styled(Box)<
  BoxProps & { completed?: boolean }
>(({ theme, completed }) => ({
  position: "relative",
  display: "flex",
  width: "100%",
  alignItems: "flex-start",
  cursor: "pointer",
  padding: theme.spacing(1.5),
    "&:hover": {
    backgroundColor: "#0A73E90D",
  },
  ...(completed && {
    opacity: 1,
  }),
}));

export const NormalCheckboxWrapper = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: theme.spacing(1.5),
  right: theme.spacing(1.5),
  display: "flex",
  alignItems: "center",
}));

export const CheckboxImage = styled("img")({
  width: 20,
  height: 20,
  cursor: "pointer",
  userSelect: "none",
});

export const NormalCheckbox = styled("input")(({ theme }) => ({
  width: 16,
  height: 16,
  accentColor: theme.palette.primary.main,
}));

export const NormalInfo = styled(Box)<BoxProps>(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(0.5),
  width: "100%",
  overflow: "hidden",
}));

export const TaskPriority = styled(Typography)<
  BoxProps & { priority?: string }
>(({ theme, priority }) => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights.sm,
  fontSize: theme.typography.fontSizes.xs,
  color:
    priority === "high"
      ? theme.palette.text.error
      : priority === "medium"
      ? theme.palette.warning.main
      : priority === "low"
      ? theme.palette.text.lightGrey
      :(priority === "imp"|| priority === "vimp") ?
      theme.palette.error.main : theme.palette.text.primary,
}));

export const NormalHeader = styled(Box)<BoxProps>(({ theme }) => ({
  display: "flex",
  alignItems: "center",
}));

export const NormalTaskName = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.primary,
  fontSize: theme.typography.fontSizes.sm,
}));

export const EllipsisNormalTaskName = styled 
(NormalTaskName)<{fromCalendar: boolean}>(({ theme,fromCalendar }) => ({
  fontWeight: theme.typography.fontWeights.medium,
  overflow: "hidden",
  maxWidth: fromCalendar ? "108px" :"-webkit-fill-available",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  display: "inline-block",
  color: theme.palette.text.meetingColor,
})) as typeof NormalTaskName;

export const NormalTaskDescription = styled("div")<object>(({ theme }) => ({
  color: theme.palette.text.primary,
  fontSize: theme.typography.fontSizes.sm,
  margin: `${theme.spacing(0.25)} 0`,
}));

export const EllipsisTaskDescription = styled(NormalTaskDescription)(
  ({ theme }) => ({
    maxWidth: "320px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    display: "inline-block",
    
  })
) as typeof NormalTaskDescription;

export const EllipsisCalendarDescription = styled(NormalTaskDescription)(
  ({ theme }) => ({
    maxWidth: "150px", // width for calendar description (change as needed)
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    display: "inline-block",
  })
) as typeof NormalTaskDescription;

export const NormalTaskMeta = styled("span")<object>(({ theme }) => ({
  color: theme.palette.text.primary,
  fontSize: theme.typography.fontSizes.xs,
  marginRight : theme.spacing(1),
  maxWidth: "-webkit-fill-available",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
}));

export const DotIconContainer = styled("span")<object>(({ theme }) => ({
  display: "inline-flex",
  color: theme.palette.text.primary,
  fontSize: theme.typography.fontSizes.xs,
  marginLeft: theme.spacing(0.5),
  marginRight : theme.spacing(1),
}));

export const ListingFlex = styled(Box)<object>(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  gap: theme.spacing(4),
  width: "100%",
  marginTop: theme.spacing(3),
  backgroundColor: "#FAFAFA", 
  marginRight: theme.spacing(8),

  "::-webkit-scrollbar": {
    display: "none",
  },
}));

export const ListingOverDueSection = styled(Box)<object>(({ theme }) => ({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(3),
  overflowY: "scroll",
  width: "100%",
  backgroundColor: theme.palette.background.paper,
  "::-webkit-scrollbar": {
    display: "none",
  },
}));
export const ListingWithFilterSection = styled(Box)<object>(({ theme }) => ({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(3),
  gap: theme.spacing(4),
  backgroundColor: theme.palette.background.paper,
  overflowY: "auto",
}));
export const ListingColumn = styled(Box)<object>(({ theme }) => ({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  gap: theme.spacing(2),
  // minHeight: "72vh",
  width:"33%",
  maxWidth: "430px",
  maxHeight: "calc(100vh - 28vh)", // Adjust height as needed
  overflowY: "auto",
   // Hide scrollbar for all browsers
  scrollbarWidth: "none", // Firefox
  msOverflowStyle: "none", // IE and Edge
  "::-webkit-scrollbar": {
    display: "none", // Chrome, Safari, Opera
  },
}));

export const ListingHeader = styled("h4")<object>(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.medium,
  fontSize: theme.typography.fontSizes.md,
  margin: 0,
  marginBottom: theme.spacing(2),
  color: theme.palette.text.primary,
}));

export const ListingList = styled("ul")<object>(({ theme }) => ({
  listStyle: "none",
  padding: 0,
  margin: 0,
  height: "100%",
  width: "100%",
 
}));

export const ListingListItem = styled("li")<object>(({ theme }) => ({
  marginBottom: theme.spacing(2),
  color: theme.palette.text.primary,
}));

export const NoTasksText = styled("div")<object>(({ theme }) => ({
  color: theme.palette.text.primary,
  fontSize: theme.typography.fontSizes.sm,
  marginTop: theme.spacing(2),
}));

export const CompanyActivityRow = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
}));

export const FilterChipsRow = styledComponent.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
`;


export const FilterChip = styled("span")<{ selected?: boolean }>(
  ({ selected, theme }) => ({
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1.2),
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(2),
    borderRadius: "16px",
    border: `1px solid  ${theme.palette.primary.main}`,

    fontWeight: selected ? 600 : 400,
    cursor: "pointer",
    transition: "all 0.15s",
  })
);

export const NormalChip = styled("span")<{ priority?: string }>(
  ({ theme, priority }) => ({
    color:
      priority === "High"
        ? theme.palette.error.main
        : priority === "Medium"
        ? theme.palette.warning.main
        : priority === "Low"
        ? theme.palette.text.lightGrey
        : theme.palette.text.primary,
    padding: "2px 10px",
    fontSize: theme.typography.fontSizes.sm,
    marginLeft: theme.spacing(1.5),
    fontWeight: 600,
  })
);

// code for ListingView styles starts here
export const ListingActivity = styled(Box)<object>(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(4),
  width: "100%",
  backgroundColor: theme.palette.text.secondary,
    flex: 1,
  '&[data-rbd-droppable-context-id]': {
    height: '-webkit-fill-available',
  },
}));

export const NormalActivityContainer = styled(Box)<BoxProps>(({ theme }) => ({
  display: "flex",
  width: "100%",
  alignItems: "flex-start",
  padding: theme.spacing(1.5),
  position: "relative",
  backgroundColor: theme.palette.background.paper,
   "&:hover": {
    backgroundColor: "#0A73E90D",
  },

}));
export const StyledDate = styled("span")<object>(({ theme, priority, meetingType }) => {
  // Meeting color logic
  let color = theme.palette.text.primary;
  if (meetingType) {
    switch (meetingType.toLowerCase()) {
      case "internal meeting":
        color =theme.palette.text.meetingColor;
        break;
      case "kickoff":
        color = theme.palette.success.main;
        break;
      case "closure":
        color = theme.palette.error.main;
        break;
      // Add more meeting types as needed
      default:
        color=theme.palette.text.meetingColor;
    }
  } else if (priority) {
    // Task color logic (existing)
    color =
      priority === "high"
        ? theme.palette.error.main
        : priority === "medium"
        ? theme.palette.warning.main
        : priority === "low"
        ? theme.palette.text.lightGrey
        : (priority === "imp" || priority === "vimp")
        ? theme.palette.error.main
        : theme.palette.text.primary;
  }
  return {
    color,
    fontSize: theme.typography.fontSizes.sm,
    marginLeft: theme.spacing(1.5),
    textTransform: "capitalize",
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeights.sm,
  };
});

export const AnimatedListItem = styled("div")<object>(({ theme }) => ({
  marginBottom: theme.spacing(1),
  transition: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)",
  transformStyle: "preserve-3d",
  perspective: 1000,
  "&.completed": {
    transform: "perspective(1000px) rotateX(-180deg)",
  },
}));

export const CustomTypographyForTaskName = styled(Box)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.semiBold,
  maxWidth: "320px",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  overflow: "hidden",
}));

// styles for MeetingCard starts here

export const NormalInfoForMeeting = styled(Box)<BoxProps>(({ theme }) => ({
  display: "flex",
  width: "100%",
  gap: theme.spacing(2),
 
}));

export const MeetingIconContainer = styled(Box)<BoxProps>(({ theme }) => ({
   marginTop: theme.spacing(0.5),
}));

export const NotesIconContainer = styled(Box)<BoxProps>(({ theme }) => ({
   marginTop: theme.spacing(0.5),
}));

export const NormalHeaderForMeetingCard = styled(Box)<BoxProps>(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  flexDirection: "column",
}));

export const CustomTypographyForMeetingPurpose = styled(Box)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.semiBold,
}));


export const NormalHeaderForMeeting = styled(Box)<BoxProps>(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  width: "100%",
  gap: theme.spacing(1.5),
}));
export const ContentBoxForDetails = styled(Box)<BoxProps>(({ theme }) => ({
  maxWidth: "100%",
}));

export const NormalInfoNotes = styled(Box)<BoxProps>(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  width: "100%",
}));

export const NotesIconWrapper = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 24,
  height: 24,
  margin: theme.spacing(0.5),
}));

export const NotesDescription = styled("div")(({ theme }) => ({
  marginTop: theme.spacing(0.5),
  color: theme.palette.text.primary,
  fontSize: theme.typography.fontSizes.sm,
  whiteSpace: "pre-line",
  marginLeft: 28,
}));

export const NotesIconImg = styled("img")({
  width:'100%',
  cursor: "pointer",
  userSelect: "none",
});