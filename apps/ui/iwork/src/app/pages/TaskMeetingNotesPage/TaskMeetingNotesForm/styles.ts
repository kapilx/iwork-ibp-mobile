//import mui styled
import { styled as muiStyled, styled } from "@mui/material/styles";
import { Button, Drawer } from "@ui/ui-lib";

export const TabButton: React.ComponentType<{
  isActive: boolean;
  children?: React.ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}> = muiStyled("button")<{
  isActive: boolean;
}>(({ theme, isActive }) => {
  return {
    background: "none",
    border: "none",
    color: theme.palette.text.primary,
    fontSize: theme.typography?.fontSizes?.sm || "14px",
    padding: `${theme.spacing(2.5)} ${theme.spacing(2.5)}`,
    cursor: "pointer",
    textAlign: "center",
    borderBottom: isActive
      ? `${theme.shape.borderSizes.thin} solid ${theme.col}}`
      : `${theme.shape.borderSizes.thin} solid ${theme.palette.neutral.light}`,

    "&:hover": {
      boxShadow: "none !important",
    },
  };
});

export const TabButtonContainer: React.ComponentType<{
  children?: React.ReactNode;
  className?: string;
}> = muiStyled("div")(({ theme }) => ({
  position: "relative",
  display: "flex",
  gap: theme.spacing(1.5), // 12px gap using theme.spacing
  width: "100%", // 400px container
  justifyContent: "flex-start", // align buttons to the left
  alignItems: "center",
  marginBottom: theme.spacing(5),
  // Add a bar behind the buttons with a different color (e.g., theme.palette.neutral.light)
  "::before": {
    content: '""',
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: theme.shape.borderSizes.thin, // 1px
    background: theme.palette.neutral.light, // use a neutral color instead of blue
    zIndex: 0,
    // borderRadius: themeBorder.radius.medium, // 8px radius for the bar
    borderRadius: theme.shape.borderRadii.medium,
  },
  // Ensure children (buttons) are above the bar
  "> *": {
    position: "relative",
    zIndex: 1,
  },
}));

export const FormContainer: React.ComponentType<{
  children?: React.ReactNode;
  className?: string;
}> = muiStyled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  padding: theme.spacing(2),
  boxSizing: "border-box",
}));

export const styledDrawer: typeof Drawer = muiStyled(Drawer)(({ theme }) => ({
  zIndex: 999,
  right: 0,
  top: "50px !important",
  "& .MuiDrawer-paper": {
    boxSizing: "border-box",
    width: "920px !important",
    paddingLeft: theme.spacing(5),
    paddingRight: theme.spacing(5),
    top: "50px !important",
    height: "100vh !important",
    overflowY: "hidden !important",
  },
  "& .MuiBackdrop-root": {
    top: "50px !important",
  },
}));

export const TaskMeetingsDrawerTitle: React.ComponentType<{
  children?: React.ReactNode;
  className?: string;
}> = muiStyled("div")(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights.bold,
  fontSize: theme.typography.fontSizes.xll,
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(2),
}));

export const TabButtonText: React.ComponentType<{
  children?: React.ReactNode;
  className?: string;
  isActive?: boolean;
}> = muiStyled("span")<{ isActive?: boolean }>(({ theme, isActive }) => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: isActive
    ? theme.typography.fontWeights.medium
    : theme.typography.fontWeights.regular, // 500 if active, 400 if not
  fontSize: theme.typography.fontSizes.sm, // 14px
  color: isActive ? theme.palette.button.secondary : theme.palette.text.primary,
  letterSpacing: 0.2,
  transition: theme.transitions.create("color, font-weight"),
}));

export const TabActiveDot: React.ComponentType<{ className?: string }> =
  muiStyled("span")(() => ({
    display: "inline-block",
    width: 8,
    height: 8,
    backgroundColor: theme.palette.button.secondary, // #0A73E9
    borderRadius: 8,
    marginRight: 8,
    verticalAlign: "middle",
  }));
export const AddButton: React.ComponentType<{
  children?: React.ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}> = styled(Button)(({ theme }) => ({
  width: "auto", // Remove fixed width for capsule
  minWidth: "45px", // Minimum width for compactness
  height: "40px", // Consistent height
  padding: `0 ${theme.spacing(4)}`,
  borderRadius: "999px", // Capsule shape
  color: theme.palette.text.primary, // Use theme for text color
  background: theme.palette.background.paper, // Use theme for background color
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  marginBottom: theme.spacing(1),
  border: `1px solid ${theme.palette.neutral.medium}`,
  "&:hover": {
    background: theme.palette.background.paper,
    color: theme.palette.text.primary,
  },
  img: {
    width: "20px",
    height: "20px",
    marginRight: theme.spacing(1),
  },
}));
