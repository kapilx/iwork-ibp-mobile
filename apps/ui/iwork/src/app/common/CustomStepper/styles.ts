import { styled } from "@mui/material";

export const StepContainer = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "left",
  gap: theme.spacing(1),
  height: theme.spacing(6),
}));

export const StepCircle = styled("div")<{
  isCompleted: boolean;
  isActive: boolean;
  isUpcoming: boolean;
}>(({ theme, isCompleted, isActive, isUpcoming }) => ({
  width: theme.spacing(4),
  height: theme.spacing(4),
  borderRadius: "50%",
  backgroundColor: isCompleted
    ? theme.palette.success.main
    : isActive
    ? "transparent"
    : "transparent",
  border: isActive || isUpcoming ? `3px solid` : "none",
  borderColor: isActive
    ? theme.palette.warning.main
    : isUpcoming
    ? theme.palette.grey[400]
    : "transparent",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: isActive ? "pointer" : "default",
  "& .inner-circle": {
    width: theme.spacing(1.5),
    height: theme.spacing(1.5),
    borderRadius: "50%",
    backgroundColor: theme.palette.warning.main,
  },
  "& svg": {
    color: theme.palette.common.white,
    fontSize: theme.spacing(2.5),
    width: theme.spacing(2.5),
    height: theme.spacing(2.5),
  },
}));

export const StepLabel = styled("span")<{
  isActive: boolean;
  isCompleted: boolean;
}>(({ theme, isActive, isCompleted }) => ({
  color: isActive
    ? theme.palette.warning.main
    : isCompleted
    ? theme.palette.success.main
    : theme.palette.grey[400],
  fontWeight: isActive
    ? theme.typography.fontWeightBold
    : theme.typography.fontWeightRegular,
  fontSize: theme.typography.fontSize,
}));

export const StepConnectorLine = styled("div")<{
  isCompleted: boolean;
}>(({ theme, isCompleted }) => ({
  height: theme.spacing(0.25),
  width: theme.spacing(10),
  backgroundColor: isCompleted
    ? theme.palette.success.main
    : theme.palette.grey[400],
}));
