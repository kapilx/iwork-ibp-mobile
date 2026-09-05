import { styled } from "@mui/material/styles";
import { Drawer } from "@mui/material";

const SMOOTH_TRANSITION_MS = 700;

// Right drawer styling
export const RightStyledDrawer = styled(Drawer)<{
  open: boolean;
  hovered: boolean;
}>(({ theme, open, hovered }) => ({
  width: open ? 376 : hovered ? 100 : 5,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  height: "calc(100vh - 48px)",
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.easeInOut,
    duration: SMOOTH_TRANSITION_MS,
  }),
  "& .MuiDrawer-paper": {
    zIndex: 998,
    width: open ? 376 : hovered ? 100 : 5,
    height: "calc(100vh - 48px)",
    top: "48px",
    background: theme.palette.background.paper,
    color: theme.palette.text.secondary,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.easeInOut,
      duration: SMOOTH_TRANSITION_MS,
    }),
    border: `${theme.shape.borderWidth}`,
    overflowY: "auto",
    scrollbarWidth: "none",
    "-ms-overflow-style": "none",
    "&::-webkit-scrollbar": {
      display: "none",
    },
  },
}));

// Toggle button for Right Drawer
export const RightToggleWrapper = styled("div")<{
  isExpanded: boolean;
  isHovered: boolean;
}>(({ theme, isExpanded, isHovered }) => ({
  display: "flex",
  justifyContent: isExpanded ? "flex-start" : "center",
  padding: theme.spacing(2),
  cursor: "pointer",
  position: "fixed",
  right: `${isExpanded ? 370 : isHovered ? 95 : 0}px`,
  top: "calc((100% - 90px) / 2)",
  transition: theme.transitions.create(["right"], {
    easing: theme.transitions.easing.easeInOut,
    duration: SMOOTH_TRANSITION_MS,
  }),
  zIndex: 1,
}));

export const RightDrawerContent = styled("div")<{
  isOpen: boolean;
  isHovered: boolean;
}>(({ isOpen, isHovered, theme }) => ({
  flex: 1,
  opacity: isOpen || isHovered ? 1 : 0,
  pointerEvents: isOpen || isHovered ? "auto" : "none",
  transition: theme.transitions.create(["opacity"], {
    easing: theme.transitions.easing.easeInOut,
    duration: SMOOTH_TRANSITION_MS,
  }),
}));

export const RightNavIconImg = styled("img")<{ isOpen: boolean }>(
  ({ isOpen, theme }) => ({
    transition: "transform 0.2s",
    transform: "none",
  })
);

// RightNav main container for hover/transition effects
export const RightNavContainer = styled("div")<{ isHovered: boolean }>(
  ({ isHovered }) => ({
    display: "flex",
    flexDirection: "column",
    height: "100%",
    transition: `width ${SMOOTH_TRANSITION_MS}ms ease-in-out`,
  })
);
