import { BottomNavigation, BottomNavigationAction } from "@mui/material";
import { styled } from "@mui/material/styles";

// Bottom tab bar — mobile/tablet primary navigation (< 768px). Hidden on
// desktop, where the Header's top nav is the primary navigation surface.
export const BottomNavContainer = styled(BottomNavigation)(({ theme }) => ({
  display: "none",
  position: "fixed",
  left: 0,
  right: 0,
  bottom: 0,
  height: 60,
  // iOS home-indicator safe area — keeps tab labels clear of the gesture bar.
  paddingBottom: "env(safe-area-inset-bottom, 0px)",
  backgroundColor: theme.palette.background.paper,
  borderTop: "1px solid #E5E7EB",
  boxShadow: "0px -2px 8px rgba(0, 0, 0, 0.08)",
  zIndex: 110,
  [theme.breakpoints.down(768)]: {
    display: "flex",
  },
}));

export const BottomNavAction = styled(BottomNavigationAction)(({ theme }) => ({
  minWidth: 0,
  padding: theme.spacing(0.75, 0.5),
  color: theme.palette.text.lightGrey,
  "& .MuiBottomNavigationAction-label": {
    fontSize: "11px",
    fontWeight: theme.typography.fontWeights.medium,
    "&.Mui-selected": {
      fontSize: "11px",
    },
  },
  "& .MuiSvgIcon-root": {
    fontSize: "22px",
  },
  "&.Mui-selected": {
    color: theme.palette.button.primaryBlue,
  },
}));

// Height reserved by consumers so fixed BottomNav never covers page content
// (including Footer, when it's shown) at the bottom of the scroll area.
export const BOTTOM_NAV_HEIGHT_PX = 60;
