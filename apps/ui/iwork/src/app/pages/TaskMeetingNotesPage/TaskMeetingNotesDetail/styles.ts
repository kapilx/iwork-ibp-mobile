import { Box, Typography, styled } from "@mui/material";
export const TaskMeetingNotesContainer = styled(Box)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  position: "relative",
  right: 0,
  width: 360,
  marginLeft: theme.spacing(2),
}));

export const TaskMeetingNotesDetailsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  lineHeight: "20px",
  color: theme.palette.neutral.dark,
  marginBottom: 0,
  borderRadius: 8,
  padding: theme.spacing(2),
  paddingLeft: theme.spacing(4),
  width: "100%",
  gap: theme.spacing(1),
  background: "none",
  "&:hover": {
    cursor: "pointer",
    backgroundColor: theme.palette.action.hover,
  },
}));

// Header row for activity card (chips + actions)
export const ActivityHeaderRow = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
}));

// Actions (edit/delete/complete) for activity card
export const ActivityActions = styled("div")(({ theme }) => ({
  marginLeft: "auto",
  display: "flex",
  gap: theme.spacing(1),
  alignItems: "center",
}));

export const SubjectText = styled(Typography)<{ color?: string }>(
  ({ theme, color }) => ({
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: theme.typography.fontWeights.semiBold,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    textOverflow: "ellipsis",
    wordBreak: "break-word",
    overflowWrap: "break-word",
    color: color || theme.palette.text.primary,
  })
);

export const SubjectTextNudge = styled(Typography)<{ color?: string }>(
  ({ theme, color }) => ({
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.semiBold,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    textOverflow: "ellipsis",
    wordBreak: "break-word",
    overflowWrap: "break-word",
    color: color || theme.palette.text.primary,
  })
);

export const DescriptionText = styled(Typography)<{ color?: string }>(
  ({ theme, color }) => ({
    fontWeight: theme.typography.fontWeights.regular,
    fontSize: theme.typography.fontSizes.xs,
    marginBottom: theme.spacing(0.5),
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    textOverflow: "ellipsis",
    wordBreak: "break-word",
    overflowWrap: "break-word",
    color: color || theme.palette.text.secondary,
  })
);

// export const StatusText = styled(Typography)(({ theme }) => ({
//   fontWeight: theme.typography.fontWeights.regular,
//   fontSize: theme.typography.fontSizes.xs,

// }));

export const DateRow = styled(Typography)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
}));

export const DateText = styled(Typography)<{ color?: string }>(
  ({ theme, color }) => ({
    color: color || theme.palette.neutral.lightMedium,
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: theme.typography.fontWeights.regular,
  })
);

export const FilterButton = styled("button")<{
  selected?: boolean;
}>(({ theme, selected }) => ({
  background: selected ? "#e0e7ff" : "transparent",
  border: "none",
  borderRadius: "50%",
  padding: 0,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 28, // reduced size
  height: 28, // reduced size
  boxShadow: selected ? "0 0 0 1px #4E61EC" : undefined, // reduced border thickness
  transition: "background 0.2s, box-shadow 0.2s",
  outline: "none",
  "&:hover": {
    background: selected ? "#e0e7ff" : theme.palette.action.hover,
  },
}));

export const FilterRow = styled("div")(({ theme }) => ({
  position: "sticky",
  top: 0,
  zIndex: 2,
  background: theme.palette.background.paper,
  display: "flex",
  gap: theme.spacing(1.25),
  marginBottom: theme.spacing(2),
  alignItems: "center",
  justifyContent: "space-between",
  padding: theme.spacing(1, 0.5),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

export const FilterButtonGroup = styled("div")(({ theme }) => ({
  display: "flex",
  paddingLeft: theme.spacing(1),
  gap: theme.spacing(4),
}));

export const StyledHr = styled("hr")(({ theme }) => ({
  border: "none",
  borderTop: `1px solid ${theme.palette.divider}`,
  margin: theme.spacing(1.5, 0),
}));

export const ActivitiesContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isEmpty",
})<{
  isEmpty?: boolean;
}>(({ theme, isEmpty }) => ({
  minHeight: theme.spacing(15),
  display: "flex",
  flexDirection: "column",
  flex: 1,
  justifyContent: isEmpty ? "center" : "flex-start",
  alignItems: isEmpty ? "center" : "stretch",
  width: "100%",
  background: theme.palette.background.paper,
}));

export const EmptyStateText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  textAlign: "center",
  minHeight: 120,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
}));

export const ActivityIcon = styled("img", {
  shouldForwardProp: (prop) => prop !== "disabled",
})<{ disabled?: boolean }>(({ theme, disabled }) => ({
  filter: `drop-shadow(0 0 2px ${theme.palette.chips.primary})`,
  cursor: disabled ? "not-allowed" : "pointer",
  width: 20,
  height: 20,
  opacity: disabled ? 0.5 : 1,
  pointerEvents: disabled ? "none" : "auto",
}));

export const ActivityEditIcon = styled(ActivityIcon, {
  shouldForwardProp: (prop) => prop !== "disabled",
})<{ disabled?: boolean }>(({ theme, disabled }) => ({
  // marginLeft: theme.spacing(1),
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.5 : 1,
  pointerEvents: disabled ? "none" : "auto",
}));

export const ConditionalEditIcon = styled(ActivityEditIcon)<{
  hidden?: boolean;
}>`
  display: ${({ hidden }) => (hidden ? "none" : "block")};
`;

export const DeleteActivityIcon = styled(ActivityIcon, {
  shouldForwardProp: (prop) => prop !== "disabled",
})<{ disabled?: boolean }>(({ theme, disabled }) => ({
  filter: `drop-shadow(0 0 2px ${theme.palette.chips.primary})`,
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.5 : 1,
  pointerEvents: disabled ? "none" : "auto",
}));

export const NudgeBoldSpan = styled('span')(({ theme }) => ({
  fontWeight: 1000,
  color: '#020202ff',
}));
