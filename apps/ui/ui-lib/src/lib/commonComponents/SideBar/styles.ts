import { ExpandLess, ExpandMore } from "@mui/icons-material";
import {
  Drawer,
  ListItemText,
  ListItem,
  ListItemIcon,
  Divider,
  Box,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { IS_SELECTED } from "../../constants";
import { theme } from "@ui/ui-lib/styles/Theme";

export const drawerWidth = 270;
export const collapsedWidth = 74;

export const StyledDrawer = styled(Drawer, {
  shouldForwardProp: (prop) => prop !== "open",
})<{ open: boolean }>(({ theme, open }) => ({
  width: open ? drawerWidth : collapsedWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  height: "calc(100vh - 48px)",
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  "& .MuiDrawer-paper": {
    width: open ? drawerWidth : collapsedWidth,
    height: "calc(100vh - 48px)",
    top: "48px",
    background: theme.palette.background.default,
    color: theme.palette.text.secondary,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    padding: open ? theme.spacing(6, 5) : theme.spacing(6, 4),
    paddingBottom: theme.spacing(13),
    border: `${theme.shape.borderWidth}`,
    "& .MuiListItemText-primary": {
      cursor: "pointer",
    },
    paddingTop: theme.spacing(3),
    overflowY: "auto",
    scrollbarWidth: "none",
    zIndex: 1,
    "-ms-overflow-style": "none",
    "&::-webkit-scrollbar": {
      display: "none",
    },
  },
  "& .MuiList-root.MuiList-padding": {
    paddingTop: theme.spacing(3),
  },
}));

export const SidebarListItem = styled(ListItem)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  cursor: "pointer",
  transition: "background-color 0.3s", // Smooth background transition
  padding: theme.spacing(2),
  gap: theme.spacing(1),
  "& .MuiListItemText-primary": {
    fontSize: theme.typography.fontSizes.sm,
  },
  "&:hover": {
    borderRadius: theme.shape.borderRadii.small,
    background: theme.palette.secondary.hover,
  },
  "&.active": {
    borderRadius: theme.shape.borderRadius,
    background: theme.palette.action.selected, // Active item background color
    backgroundColor: theme.palette.background.yellow, // Hover effect for selected items
  },

  "&.disabled": {
    borderRadius: theme.shape.borderRadius,
    background: theme.palette.action.selected, // Active item background color
    backgroundColor: theme.palette.background.disabledGrey, // Hover effect for selected items
  },
}));

export const SidebarListItemText = styled(ListItemText, {
  shouldForwardProp: (prop) => prop !== "isSelected",
})<{ isSelected: boolean }>(({ theme, isSelected }) => ({
  paddingLeft: theme.spacing(0.5),
  color: theme.palette.text.brown,
  "& .MuiListItemText-primary": {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: isSelected
      ? theme.typography.fontWeights.semiBold // Apply semiBold when selected
      : theme.typography.fontWeights.regular, // Default font weight
  },
  "&.disabled-text ": {
    color: `${theme.palette.neutral.lightMedium} `,
    fontWeight: theme.typography.fontWeights.bold,
  },
}));

export const ChildListItem = styled(ListItem)(({ theme }) => ({
  paddingLeft: theme.spacing(6),
  paddingTop: theme.spacing(1),
  paddingBottom: theme.spacing(1),
  fontSize: theme.typography.fontSizes.sm,
  "&:hover .MuiListItemText-root": {
    color: theme.palette.primary.main,
  },
}));

export const StyledExpandLess = styled(ExpandLess)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

export const StyledExpandMore = styled(ExpandMore)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

export const StyledListItemText = styled(ListItemText)(({ theme }) => ({
  transition: "color 0.3s",
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.brown,
  "&:hover": {
    color: theme.palette.text.brown,
  },
}));

export const StyledListItemIcon = styled(ListItemIcon)(({ theme }) => ({
  color: theme.palette.text.primary,

  minWidth: "unset",
  "& img": {
    aspectRatio: "unset",
    width: "100%",
    height: "100%",
  },
  "& img:hover": {
    cursor: "pointer",
    filter: "brightness(1.2)", // Brighten icons on hover
  },
}));

export const IconLabelWrapper = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
}));

// Styled Components for Child Items
export const ChildItemWrapper = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(2, 4),
  cursor: "pointer",
  gap: theme.spacing(2),
  "&:hover": {
    borderRadius: theme.shape.borderRadius,
    background: theme.palette.secondary.hover,
  },
  "&.disabled-text": {
    color: `${theme.palette.neutral.lightMedium} `,
  },
}));

export const ChildListItemIcon = styled(StyledListItemIcon)`
  width: 16px;
  height: 16px;
  transition: filter 0.3s;
`;

export const ChildListItemText = styled(SidebarListItemText, {
  shouldForwardProp: (prop) => prop !== IS_SELECTED,
})<{ isSelected: boolean }>(({ theme, isSelected }) => ({
  fontSize: theme.typography.fontSizes.xs,
  color: isSelected ? theme.palette.chips.senary : theme.palette.text.brown,
  transition: "color 0.3s",
  fontWeight: isSelected
    ? theme.typography.fontWeights.semiBold
    : theme.typography.fontWeights.regular,
}));

export const ToggleWrapper = styled("div")<{ isExpanded: boolean }>(
  ({ theme, isExpanded }) => ({
    display: "flex",
    justifyContent: isExpanded ? "flex-end" : "center",
    padding: theme.spacing(2),
    cursor: "pointer",
    position: "fixed",
    left: isExpanded ? "250px" : "55px",
    bottom: "calc((100% - 40px) / 2)",
    transition: theme.transitions.create(["left"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  })
);

export const SidebarContainer = styled("div")(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(1),
  flexDirection: "column",
  overflow: "auto",
  "&::-webkit-scrollbar": {
    display: "none",
  },
}));

export const DividerWrapper = styled(Divider)(({ theme }) => ({
  backgroundColor: theme.palette.neutral.divider,
  borderBottomWidth: 0.5,
}));

export const SidebarItemWrapper = styled("div")({
  display: "flex",
  flexDirection: "column",
});

export const ChildItemsContainer = styled("div")({
  display: "flex",
  flexDirection: "column",
  marginLeft: theme.spacing(8),
});

export const SidebarIconImage = styled("img")<{ isActive?: boolean }>(
  ({ isActive }) => ({
    objectFit: "contain",
    filter: isActive ? "brightness(1)" : "brightness(0.8)",
    transition: "filter 0.3s",
    width: "24px",
    height: "24px",

    "&:hover": {
      filter: "brightness(1.2)",
      cursor: "pointer",
    },
  })
);

export const ToggleIconImage = styled("img")<{ isExpanded: boolean }>`
  transform: ${({ isExpanded }) =>
    isExpanded ? "rotate(0deg)" : "rotate(180deg)"};
  transition: transform 0.3s;
`;

export const ExpandCollapseIcon = styled("img")<{ isOpen: boolean }>`
  margin-left: auto;
  cursor: pointer;
  transition: transform 0.3s;
  transform: ${({ isOpen }) => (isOpen ? "rotate(90deg)" : "rotate(0deg)")};
`;

export const ChildIconImage = styled("img")<{ isSelected: boolean }>`
  filter: ${({ isSelected }) =>
    isSelected ? "brightness(1)" : "brightness(0.8)"};
  transition: filter 0.3s;
`;

export const VersionTypography = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isExpanded",
})<{ isExpanded: boolean }>(({ theme, isExpanded }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  fontFamily: theme.typography.fontFamily,
  color: theme.palette.text.black,
  position: "absolute",
  bottom: theme.spacing(2),
  left: 0,
  textAlign: "center",
  width: "100%",
  visibility: isExpanded ? "visible" : "hidden",
  paddingRight: theme.spacing(5),
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(1.5),
}));

export const ChatBotContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isExpanded",
})<{ isExpanded: boolean }>(({ theme, isExpanded }) => ({
  position: "absolute",
  bottom: isExpanded ? theme.spacing(7.5) : theme.spacing(2),
  left: 0,
  width: "100%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
}));

export const ChatBotLink = styled("div")(({ theme }) => ({
  cursor: "pointer",
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.brown,
  lineHeight: 1.4,
  textDecoration: "none",
  userSelect: "none",
  transition: "color 0.2s ease, text-decoration 0.2s ease",
  "&:hover": {
    color: theme.palette.secondary.selected,
    textDecoration: "underline",
  },
}));
