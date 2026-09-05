import { styled as muiStyled, styled } from "@mui/material/styles";
import Button from "../../Button";
import { Box, Typography } from "@mui/material";

export const SectionTitle = muiStyled(Typography)(({ theme }) => ({
  display: "block",
  marginBottom: theme.spacing(6),
  marginTop: theme.spacing(5),
}));

export const SectionBox = muiStyled("div")(({ theme }) => ({
  marginBottom: theme.spacing(4),
}));

export const AttachmentsBox = muiStyled("div")(({ theme }) => ({
  marginBottom: theme.spacing(6),
  background: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[10],
  padding: theme.spacing(6),
  border: `1px solid ${theme.palette.divider}`,
}));

export const MainFormBox = muiStyled("div")(({ theme }) => ({
  height: "calc(100vh - 125px)",
  margin: "0 auto",
  background: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  overflow: "auto",

  // Firefox
  scrollbarWidth: "thin",
  scrollbarColor: `${theme.palette.grey[400]} ${theme.palette.background.paper}`,

  // WebKit (Chrome, Safari, Edge)
  "&::-webkit-scrollbar": {
    width: "8px",
  },
  "&::-webkit-scrollbar-track": {
    background: theme.palette.background.paper,
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: theme.palette.grey[400], // Light grey for visibility
  },
}));

export const MeetingNotesButtonPanel = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(4), // Equivalent to gap: 2 (assuming theme spacing(2) = 8px)
  padding: theme.spacing(4), // Equivalent to p: 2
  justifyContent: "flex-end",
  marginBottom: theme.spacing(11),
}));

export const TasksFormContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  paddingRight: theme.spacing(1.5),
}));

export const MeetingFeedbackLabel = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.lightGrey,
}));

export const MeetingFeedbackValue = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.primary,
}));

export const FeedbackOuterBox = styled(Box)(({ theme }) => ({
  rowGap: theme.spacing(3.75),
  display: "flex",
  flexDirection: "column",
}));

export const FeedbackInnerBox = styled(Box)(({ theme }) => ({
  gap: theme.spacing(1.25),
  display: "flex",
  flexDirection: "column",
}));
