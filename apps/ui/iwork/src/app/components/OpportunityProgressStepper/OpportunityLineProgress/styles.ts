import { Box, styled, Typography } from "@mui/material";

export const ProgressBarContainer = styled(Box)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  [theme.breakpoints.down("md")]: {
    gap: theme.spacing(1.5),
  },
  [theme.breakpoints.down("sm")]: {
    gap: theme.spacing(1),
    flexDirection: "column",
    alignItems: "flex-start",
  },
}));

export const DateField = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.xs,
  color: theme.palette.text.grey,
  whiteSpace: "nowrap",
  [theme.breakpoints.down("sm")]: {
    fontSize: theme.typography.fontSizes.xxs,
    alignSelf: "flex-start",
  },
}));

export const Progress = styled("div")(({ theme }) => ({
  width: "93%",
  display: "flex",
  alignItems: "center",
  [theme.breakpoints.down("sm")]: {
    width: "100%",
  },
}));

export const ProgressCompleted = styled('div')(({ theme, progress, completed }) => ({
    width: completed ? (progress + "%") : ((100 - progress) + "%"),
    backgroundColor: completed ? theme.palette.background.completedProgressColor : theme.palette.neutral.light,
    padding: (progress == 0 && completed) || (progress == 100 && !completed) ? theme.spacing(0): completed ? theme.spacing(0.45): theme.spacing(0.25),
}))

export const ProgressPercentage = styled('div')(({ theme }) => ({
  borderLeft: `${theme.shape.borderSizes.thick} solid ${theme.palette.background.completedProgressColor}`,
  padding: `${theme.spacing(0)} ${theme.spacing(2)}`,
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.xs,
  height: "20px",
  whiteSpace: "nowrap",
  display: "flex",
  alignItems: "center",
  [theme.breakpoints.down("sm")]: {
    fontSize: theme.typography.fontSizes.xxs,
    padding: `${theme.spacing(0)} ${theme.spacing(1)}`,
    height: "16px",
  },
}));
