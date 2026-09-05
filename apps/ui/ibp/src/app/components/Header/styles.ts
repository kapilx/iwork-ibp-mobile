import { Avatar, Box, List, ListItemButton, MenuItem, Paper, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Link } from "react-router-dom";

// Header main container
export const HeaderContainer = styled("header")(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: theme.spacing(3, 6),
  backgroundColor: theme.palette.background.paper,
  // borderBottom: `1px solid #E5E7EB`,
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  zIndex: 100,
  boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.05)",
  borderBottom: "2px solid #0B4FD0",
  boxSizing: "border-box",
  [theme.breakpoints.between("sm", "md")]: {
    padding: theme.spacing(3, 3),
  },
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2.25, 2),
  },
}));
export const PopoverContainer = styled("div")(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  columnGap: theme.spacing(3),
  rowGap: theme.spacing(5),
  padding: theme.spacing(6.25, 5),
  width: "100%",
  maxWidth: "424px",
  alignItems: "center",
  position: "relative",
}));
export const PopoverDescription = styled(Typography)(({theme}) => ({
  fontSize: theme.typography.fontSizes.xs,
  fontWeight: theme.typography.fontWeights.regular,
  width:"100px",
  textAlign:"center",
}));
export const PopoverImageContainer = styled("div")<{ variant?: string }>(
  ({ theme, variant }) => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: theme.spacing(1),
    cursor: "pointer",
    width: "120px",
    height: "80px",
    justifyContent: "center",
    "&:hover": {
      gap: "4px",
      borderRadius: "12px",
      boxShadow: "0px 5px 10px 0px #2626262E",
      ...(variant === "hospital" && {
        background: "#EFF9EF",
        border: "1px solid #7AD37D",
      }),
      ...(variant === "documents" && {
        background: "#EEF6FD",
        border: "1px solid #308EE4",
      }),
      ...(variant === "ecard" && {
        background: "#EFFBFC",
        border: "1px solid #38BDF8",
      }),
      ...(variant === "enrollment" && {
        background: "#EFFBFC",
        border: "1px solid #60D9E3",
      }),
      ...(variant === "policy" && {
        background: "#FAF4DF",
        border: "1px solid #E7C642",
      }),
      ...(variant === "contact" && {
        background: "#FEF3EC",
        border: "1px solid #FDA65D",
      }),
      ...(variant === "life-event" && {
        background: "#FAF4FF",
        border: "1px solid #A33DEC",
      }),
    },
  }),
);
// Left section for logo
export const HeaderLeftSection = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: theme.spacing(6),
  flex: 1,
  minWidth: 0,
}));

export const HeaderLeftSectionLogo = styled("img")(({ theme }) => ({
  height: "40px",
  width: "68px",
  objectFit: "contain",
  cursor: "pointer",
  [theme.breakpoints.between("sm", "md")]: {
    height: "32px",
    width: "54px",
  },
  [theme.breakpoints.down("sm")]: {
    height: "28px",
    width: "48px",
  },
}));

export const HeaderRightSectionLogo = styled("img")(({ theme }) => ({
  height: "36px",
  width: "60px",
  objectFit: "contain",
  [theme.breakpoints.between("sm", "md")]: {
    height: "28px",
    width: "48px",
  },
  [theme.breakpoints.down("sm")]: {
    display: "none",
  },
}));

// Navigation section
export const HeaderNavSection = styled("nav")(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(11.25),
  alignItems: "center",
  justifyContent: "flex-start",
  [theme.breakpoints.between("md", "xl")]: {
    gap: theme.spacing(6),
  },
  [theme.breakpoints.between("sm", "md")]: {
    gap: theme.spacing(3.75),
    overflowX: "auto",
    scrollbarWidth: "none",
    "&::-webkit-scrollbar": { display: "none" },
    flexShrink: 1,
    minWidth: 0,
  },
  "@media (max-width: 768px)": {
    display: "none",
  },
}));

// Navigation item container
export const HeaderNavItemContainer = styled("div")(({ theme }) => ({
  borderRadius: theme.spacing(1),
  transition: "background 0.2s",
}));

// Navigation item
export const HeaderNavItem = styled("span")<{ active?: boolean }>(
  ({ theme, active }) => ({
    cursor: "pointer",
    fontFamily: theme.typography.fontFamily,
    fontWeight: active ? theme.typography.fontWeights.semiBold : theme.typography.fontWeights.medium,
    fontSize: "18px",
    lineHeight: "100%",
    whiteSpace: "nowrap",
    color: active
      ? theme.palette.button.primaryBlue
      : theme.palette.text.tertiary,
    padding: theme.spacing(1, 0),
    transition: "color 0.2s, font-size 0.2s",
    "&:hover": {
      color: theme.palette.button.primaryBlue,
      fontSize: "20px",
    },
  }),
);

// External link nav item — rendered as a colored pill button (e.g. Wellness, Policy Porting)
export const HeaderExternalNavItem = styled("span")<{ variant?: "green" | "blue" }>(
  ({ theme, variant }) => ({
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: theme.spacing(1.125),
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeights.semiBold,
    fontSize: "16px",
    lineHeight: "100%",
    whiteSpace: "nowrap",
    color: "#FFFFFF",
    backgroundColor: variant === "blue" ? "#2D8CE6" : "#3DA935",
    padding: theme.spacing(1.5, 3),
    borderRadius: theme.spacing(3.75),
    transition: "background-color 0.2s, box-shadow 0.2s",
    "& .MuiSvgIcon-root": {
      fontSize: "27px",
    },
    "&:hover": {
      backgroundColor: variant === "blue" ? "#1E78D0" : "#34962E",
      boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.18)",
      color: "#FFFFFF",
    },
  }),
);

// Right-aligned group holding the external pill buttons (Wellness, Policy Porting)
export const HeaderExternalNavGroup = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  flexShrink: 0,
  "@media (max-width: 768px)": {
    display: "none",
  },
}));

// Right section for icons and avatar
export const HeaderRightSection = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(3),
  [theme.breakpoints.between("sm", "md")]: {
    gap: theme.spacing(1.5),
  },
  [theme.breakpoints.down("sm")]: {
    gap: theme.spacing(1),
  },
}));

// Icon label
export const HeaderIconLabel = styled("span")(() => ({
  display: "none",
}));

// Avatar wrapper
export const HeaderAvatar = styled("div")(() => ({
  maxWidth: "41px",
  maxHeight: "41px",
  borderRadius: "50%",
  overflow: "hidden",
  cursor: "pointer",
}));

export const StyledLink = styled(Link)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  textDecoration: "none",
}));

export const StyledActiveLink = styled(Link)(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    textDecoration: "none",
    padding: theme.spacing(1),
    borderRadius: theme.spacing(1),
    transition: "all 0.2s",
    "&:hover": {
      backgroundColor: theme.palette.background.lightBlue,
    },
  }),
);

export const NameText = styled("div")(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.medium,
  fontSize: theme.typography.fontSizes.sm,
  cursor: "pointer",
  color: theme.palette.text.tertiary,
  whiteSpace: "nowrap",
  // marginLeft: theme.spacing(2),
  // marginRight: theme.spacing(2),
  [theme.breakpoints.down("md")]: {
    display: "none",
  },
}));

export const AvatarContainer = styled(Avatar)(({ theme }) => ({
  width: 30,
  height: 30,
  backgroundColor: theme.palette.button.primaryBlue,
  // color: theme.palette.text.secondary,
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.semiBold,
  cursor: "pointer",
}));

export const HeaderActionMenuItem = styled(MenuItem)(({ theme }) => ({
  gap: theme.spacing(1.5),
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.sm,
  "&:hover": {
    backgroundColor: "#EAF3FC",
    color: "#2D8CE6",
  },
}));

export const HeaderProfileMenuItem = styled(MenuItem)(({ theme }) => ({
  gap: theme.spacing(1.5),
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.sm,
  backgroundColor: theme.palette.background.paper,
  "&:hover": {
    backgroundColor: "#EAF3FC",
    color: "#2D8CE6",
  },
  "&.Mui-focusVisible, &.Mui-selected, &.Mui-selected:hover": {
    backgroundColor: theme.palette.background.paper,
  },
}));

export const HeaderDangerMenuItem = styled(MenuItem)(({ theme }) => ({
  gap: theme.spacing(1.5),
  color: theme.palette.error.main,
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.sm,
  "&:hover": {
    backgroundColor: "#FDECEC",
    color: theme.palette.error.main,
  },
}));

export const HeaderDrawerPaper = styled(Paper)(() => ({
  width: 280,
  display: "flex",
  flexDirection: "column",
  height: "100%",
  overflow: "hidden",
}));

export const HeaderDrawerTopRow = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  paddingTop: theme.spacing(1),
  paddingLeft: theme.spacing(1),
  paddingRight: theme.spacing(1),
}));

export const HeaderDrawerList = styled(List)(() => ({
  paddingTop: 0,
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
}));

export const HeaderDrawerFooter = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  flexShrink: 0,
  marginTop: "auto",
}));

export const HeaderDrawerProfileButton = styled(ListItemButton)(({ theme }) => ({
  gap: theme.spacing(1.5),
  paddingTop: theme.spacing(1.5),
  paddingBottom: theme.spacing(1.5),
  borderTop: "1px solid #EBEBEB",
  [theme.breakpoints.between("sm", "md")]: {
    alignItems: "flex-start",
  },
}));

export const HeaderDrawerLogoutButton = styled(ListItemButton)(({ theme }) => ({
  gap: theme.spacing(1.5),
  paddingTop: theme.spacing(1.5),
  paddingBottom: theme.spacing(1.5),
  color: theme.palette.error.main,
  fontWeight: theme.typography.fontWeights.regular,
}));

export const HeaderDrawerAvatar = styled(Avatar)(({ theme }) => ({
  width: 32,
  height: 32,
  fontSize: 14,
  backgroundColor: theme.palette.button.primaryBlue,
  fontWeight: theme.typography.fontWeights.semiBold,
}));

export const HeaderDivider = styled("span")(({ theme }) => ({
  width: "0.5px",
  height: "16px",
  backgroundColor: theme.palette.text.mediumGrey,
  display: "inline-block",
}));

export const PowerText = styled("span")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xs,
  color: theme.palette.text.mediumGrey,
  fontWeight: theme.typography.fontWeights.regular,
  marginLeft: theme.spacing(1),
  marginRight: theme.spacing(1),
}));

export const HeaderNavRightSection = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(3),
  minWidth: 0,
  overflow: "hidden",
  [theme.breakpoints.between("sm", "md")]: {
    gap: theme.spacing(2),
  },
  "@media (max-width: 768px)": {
    display: "none",
  },
}));
export const ActionIcons = styled("img")(() => ({
  height: "44px",
  width: "44px",
}));

// Visible only on mobile. Hidden on tablet and desktop.
export const MobileMenuButton = styled("button")(({ theme }) => ({
  display: "none",
  alignItems: "center",
  justifyContent: "center",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  padding: theme.spacing(0.5),
  color: "inherit",
  "@media (max-width: 768px)": {
    display: "flex",
  },
}));

export const FloatingQuickLinksRail = styled("div")<{
  expanded?: boolean;
}>(({ theme, expanded }) => ({
  position: "fixed",
  right: 0,
  top: "52%",
  // Full-width rail that SLIDES in/out via transform (no width squish, no
  // content reflow) so the animation stays smooth. When open it slides over the
  // static handle; when closed it sits fully off-screen to the right.
  width: 240,
  maxHeight: "calc(100vh - 120px)",
  minHeight: 220,
  height: "auto",
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  transform: expanded ? "translate(0, -50%)" : "translate(100%, -50%)",
  transition:
    "transform 390ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 290ms ease",
  borderRadius: "18px 0 0 18px",
  background: "linear-gradient(180deg, #1F4EA8 0%, #1A84A3 100%)",
  boxShadow: expanded ? "0px 6px 24px rgba(0, 0, 0, 0.2)" : "none",
  zIndex: 120,
  overflow: "hidden",
  padding: theme.spacing(3, 3, 3, 3),
  // Tablet: 600–1024px
  [theme.breakpoints.between("sm", "md")]: {
    width: 220,
    minHeight: 180,
    padding: theme.spacing(2, 2, 2, 2),
  },
  // Mobile: < 600px
  [theme.breakpoints.down("sm")]: {
    width: 200,
    minHeight: 160,
    padding: theme.spacing(1.5, 1.5, 1.5, 1.5),
  },
}));

// Chevron tab on the rail's left edge — the affordance that signals the rail
// opens. Points ‹ collapsed, flips to › when expanded. `right` tracks the rail
// width at each breakpoint so the tab stays flush against the rail's left edge.
// The collapsed quick-links handle: the Union.svg silhouette (a vertical bar
// hugging the screen edge with a center bulge) filled with the blue gradient,
// chevron nudged left into the bulge. A single drop-shadow follows the SVG's
// alpha so the whole shape reads as one. Rendered only while collapsed — once
// the rail opens it is removed entirely (hover-only; rail closes on mouse-leave).
export const FloatingQuickLinksHandle = styled("button")(() => ({
  position: "fixed",
  right: 0,
  top: "52%",
  transform: "translateY(-50%)",
  width: 36,
  height: 130,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: 0,
  padding: 0,
  cursor: "pointer",
  color: "#FFFFFF",
  background: "transparent",
  // −40% opacity so the tab sits subtly against content; full on hover.
  opacity: 0.6,
  filter: "drop-shadow(-4px 4px 12px rgba(0, 0, 0, 0.22))",
  // Below the rail (z 120) so the rail slides over it cleanly when open.
  zIndex: 119,
  transition: "filter 200ms ease, opacity 200ms ease",
  // The Union.svg shape fills the box behind the chevron.
  "& .ql-handle-shape": {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
  },
  // Chevron sits centred in the bulge (the bulge is at the shape's vertical
  // centre; left:10 lands it on the protruding round part).
  "& .MuiSvgIcon-root": {
    position: "absolute",
    top: "50%",
    left: 10,
    transform: "translate(-50%, -50%)",
    fontSize: 18,
    zIndex: 1,
  },
  "&:hover": {
    opacity: 1,
    filter: "drop-shadow(-4px 6px 16px rgba(0, 0, 0, 0.3))",
  },
}));

// Region below the bulge holding the vertical label — centred horizontally on
// the bar (left:11 clears the bulge) and vertically within the lower section.
// Spans the full bar (left:11 clears the bulge) and centres the label both
// vertically and horizontally on the bar strip.
export const FloatingQuickLinksHandleLabelBox = styled("div")(() => ({
  position: "absolute",
  left: 11,
  right: 0,
  top: 0,
  bottom: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1,
  pointerEvents: "none",
}));

// Vertical "Quick Links" label, reading bottom→up (vertical-rl + 180° flip),
// centred on the bar by the label box. NOTE: 12px is an intentional, agreed
// exception to the global 15px-minimum font rule for this small vertical label.
export const FloatingQuickLinksHandleLabel = styled("span")(({ theme }) => ({
  writingMode: "vertical-rl",
  textOrientation: "mixed",
  transform: "rotate(180deg)",
  color: "#EAF2FF",
  fontFamily: theme.typography.fontFamily,
  fontSize: 12,
  fontWeight: theme.typography.fontWeights.regular,
  letterSpacing: "0.08em",
  wordSpacing: "4px",
  whiteSpace: "nowrap",
  textShadow: "0 1px 2px rgba(0, 0, 0, 0.18)",
}));

export const FloatingQuickLinksHeader = styled("button")<{ expanded?: boolean }>(
  ({ theme, expanded }) => ({
  width: "100%",
  height: expanded ? 56 : 0,
  boxSizing: "border-box",
  border: 0,
  background: "transparent",
  color: "#DDE9FF",
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
  textAlign: "center",
  cursor: "pointer",
  whiteSpace: "nowrap",
  overflow: "hidden",
  opacity: expanded ? 1 : 0,
  pointerEvents: expanded ? "auto" : "none",
  borderBottom: expanded ? "0.5px solid #7CA3CE" : "none",
  padding: expanded ? theme.spacing(1.5) : 0,
  transition: "height 280ms ease, opacity 200ms ease, padding 280ms ease",
}));

export const FloatingQuickLinksList = styled("div")<{ expanded?: boolean }>(
  ({ theme, expanded }) => ({
  display: "flex",
  flexDirection: "column",
  flex: 1,
  overflowY: "auto",
  overflowX: "hidden",
  minHeight: 0,
  gap: theme.spacing(1.75),
  paddingBottom: theme.spacing(0.5),
  paddingTop: theme.spacing(1),
  alignItems: expanded ? "stretch" : "center",
  opacity: expanded ? 1 : 0,
  pointerEvents: expanded ? "auto" : "none",
  transition: "opacity 200ms ease",
}));

export const FloatingQuickLinkItem = styled("button")<{
  expanded?: boolean;
  disabled?: boolean;
}>(({ theme, expanded, disabled }) => ({
  border: 0,
  width: expanded ? "100%" : 56,
  boxSizing: "border-box",
  background: "transparent",
  color: "#EAF2FF",
  borderRadius: 10,
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: expanded ? "flex-start" : "center",
  minHeight: expanded ? 64 : 56,
  gap: expanded ? theme.spacing(1.5) : theme.spacing(0.5),
  padding: expanded ? theme.spacing(1.1, 1.25) : theme.spacing(0.75),
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.6 : 1,
  transition:
    "background-color 220ms ease, opacity 220ms ease, min-height 280ms ease, padding 280ms ease, gap 280ms ease, width 280ms ease",
  marginTop: 0,
  "&:hover": {
    backgroundColor: disabled ? "transparent" : "rgba(255,255,255,0.12)",
  },
  "&:disabled": {
    cursor: "not-allowed",
  },
  "& .MuiSvgIcon-root": {
    fontSize: 23,
    color: "#F2F7FF",
  },
}));

export const FloatingQuickLinkLabel = styled("span")<{ expanded?: boolean }>(
  ({ theme, expanded }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.regular,
  whiteSpace: "nowrap",
    display: "inline-block",
    overflow: "hidden",
    maxWidth: expanded ? 170 : 0,
    marginLeft: expanded ? theme.spacing(0.25) : 0,
    opacity: expanded ? 1 : 0,
    transform: expanded ? "translateX(0)" : "translateX(-6px)",
    transition:
      "max-width 300ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease, transform 280ms ease, margin-left 280ms ease",
    height: 18,
    lineHeight: "18px",
    [theme.breakpoints.between("sm", "md")]: {
      maxWidth: expanded ? 150 : 0,
    },
    [theme.breakpoints.down("sm")]: {
      maxWidth: expanded ? 130 : 0,
      fontSize: theme.typography.fontSize.sm,
      height: 17,
      lineHeight: "17px",
    },
  }),
);
