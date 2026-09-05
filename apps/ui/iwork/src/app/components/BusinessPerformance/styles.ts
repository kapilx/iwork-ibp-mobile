import { CardBackground } from "@ui/ui-lib";
import { Box, Grid, styled, Switch } from "@mui/material";

export const SubSectionHeader = styled("div")(({ theme, border }) => ({
  fontSize: "18px",
  fontWeight: 700,
  // padding: "10px 10px 0px 10px",
  // marginTop: "20px",
  color: "#555555",
  // borderTop: border ? "1px solid #E0E0E0" : "0px",
  display: "flex",
  alignItems: "flex-start",
  flexDirection: "column",
}));

export const MyFollowUpLabel = styled("p")(({ theme }) => ({
  fontSize: "18px",
  fontWeight: 700,
  color: "#555555",
  margin: 0,
}));

interface StyledGridContainerProps {
  isNoData?: boolean;
}

export const HeaderActionsRow = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  borderBottom: "1px solid #ccc",
}));

export const StyledGridContainer = styled(Grid, {
  shouldForwardProp: (prop) => prop !== "isNoData",
})<StyledGridContainerProps>(({ theme, isNoData }) => ({
  marginTop: theme.spacing(4),
  alignItems: "center",
  flexWrap: "wrap",
  maxWidth: "1112px",
  margin: "0 auto",
  marginBottom: isNoData ? theme.spacing(2) : theme.spacing(10), // Change based on isNoData
  rowGap: theme.spacing(2.5),
  // justifyContent: "space-between",
}));

export const BusinessPerformanceStyles = {
  "& .MuiGrid-root": {
    gap: "8px",
  },
};

export const NoDataContent = styled(Box)(({ theme }) => ({
  textAlign: "center",
  padding: theme.spacing(5),
  color: theme.palette.text.primary,
  fontSize: "16px",
}));

export const LeftSideSectionContainer = styled("div")(
  ({ theme, gap = false }) => ({
    display: "flex",
    flexDirection: "column",
    gap: gap ? "0px" : theme.spacing(5),
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadii.large,
    boxShadow: theme.shadows[12],
    border: `${theme.shape.borderSizes.thin} solid ${theme.palette.neutral.tableBorder}`,
    padding: theme.spacing(4, 4),
    marginBottom: theme.spacing(5),
  })
);

export const LeftSideSectionContainerOfMyFollowUp = styled("div")(
  ({ theme }) => ({
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing(5),
    borderTop: `1px solid ${theme.palette.text.neutralwhite}`,
    marginTop: theme.spacing(5),
    marginRight: theme.spacing(1),
  })
);

export const StyledSwitchLabel = styled("span")<{ active?: boolean }>(
  ({ theme, active }) => ({
    fontWeight: active
      ? theme.typography.fontWeights.semiBold
      : theme.typography.fontWeights.regular,
    fontSize: active ? theme.spacing(4.5) : theme.typography.fontSizes.sm,
  })
);

export const StyledSwitchBlockDashboard = styled(Switch)(({ theme }) => ({
  "& .MuiSwitch-switchBase": {
    color: theme.palette.chips.senary,
  },
  "& .MuiSwitch-track": {
    backgroundColor: theme.palette.chips.senary,
  },
  "& .MuiSwitch-switchBase.Mui-checked": {
    color: theme.palette.chips.senary,
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
  },
  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
    backgroundColor: theme.palette.chips.senary,
  },
}));

export const StyledSectionSubHeading = styled("div")(({ theme }) => ({
  fontSize: "14px",
  fontWeight: "400",
  color: theme.palette.text.lightGrey,
}));

export const StyledButtonContainer = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  width: "100%",
  justifyContent: "space-between",
  // borderTop: `1px solid ${theme.palette.text.neutralwhite}`,
  // paddingTop: theme.spacing(2),
  // marginTop: theme.spacing(5),
}));

export const StyledOverviewBlock = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  columnGap: "20px",
  borderTop: `1px solid ${theme.palette.text.neutralwhite}`,
  marginTop: theme.spacing(5),
  paddingTop: theme.spacing(5),
}));

export const StickyFilterBar = styled("div")(({ theme }) => ({
  position: "sticky",
  top: 0,
  zIndex: 200,
  height: 0,
  overflow: "visible",
  display: "flex",
  justifyContent: "flex-end",
  pointerEvents: "none",
}));


export const StickySmartSearchWrapper = styled("div", {
  shouldForwardProp: (prop) => prop !== "availableHeight",
})<{ availableHeight?: number }>(({ theme, availableHeight }) => ({
  position: "sticky",
  top: 0,
  zIndex: 199,
  backgroundColor: theme.palette.background.paper,
  boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
  maxHeight: availableHeight
    ? `${availableHeight}px`
    : `calc(100vh - ${theme.spacing(6)})`,
  overflowY: "auto",
  // Keep a stray wheel event from bleeding into the (locked) page behind us.
  overscrollBehavior: "contain",
}));

export const FloatingFilterButton = styled("button")(({ theme }) => ({
  position: "relative",
  top: theme.spacing(2),
  right: theme.spacing(4),
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "36px",
  height: "36px",
  borderRadius: theme.shape.borderRadius,
  border: "none",
  cursor: "pointer",
  pointerEvents: "auto",
  backgroundColor: theme.palette.neutral.dark,
  boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.25)",
  animation: "floatFilterIn 0.25s ease forwards",
  "@keyframes floatFilterIn": {
    from: { opacity: 0, transform: "translateY(-8px)" },
    to: { opacity: 1, transform: "translateY(0)" },
  },
  "&:hover": {
    opacity: 0.85,
  },
}));

export const DashboardPageWrapper = styled("div")(({ theme }) => ({
  position: "relative",
}));
