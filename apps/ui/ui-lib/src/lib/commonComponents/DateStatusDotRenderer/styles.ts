import { alpha, styled } from "@mui/material";

const PAST_COLOR = "#FF0000";
const ACTIVE_COLOR = "#34C759";

export const DateStatusDotContainer = styled("div")(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
}));

export const StatusDot = styled("span")<{ $past?: boolean }>(({ $past }) => {
  const dotColor = $past ? PAST_COLOR : ACTIVE_COLOR;
  return {
    width: 9,
    height: 9,
    borderRadius: "50%",
    flexShrink: 0,
    backgroundColor: dotColor,
    boxShadow: `0 0 0 4px ${alpha(dotColor, 0.2)}`,
  };
});
