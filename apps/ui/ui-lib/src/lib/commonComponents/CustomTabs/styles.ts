import { Box, BoxProps, styled, Tab, Tabs } from "@mui/material";
import { TabsProps } from ".";

interface MainContainerProps extends BoxProps {
  noBackgroundColor?: boolean;
}

export const CustomTabsMainContainer = styled(Box)<MainContainerProps>(
  ({ theme, noBackgroundColor }) => ({
    width: "100%",
    paddingTop: theme.spacing(5),

    backgroundColor: noBackgroundColor
      ? "transparent"
      : theme.palette.background.paper,
  })
);

export const StyledTab = styled(Tab)<{
  isActive: boolean;
  styles: TabsProps["styles"];
}>(({ theme, isActive, styles }) => ({
  textTransform: "none",
  color: isActive
    ? `${styles?.activeTabColor || theme.palette.button.secondary} !important`
    : `${styles?.tabColor || theme.palette.text.primary} !important`,
  marginRight: styles?.tabSpacing || theme.spacing(6),
  display: "flex",
  alignItems: "center",
  borderBottom: isActive
    ? `${theme.shape.borderSizes.thick} solid ${
        styles?.activeTabColor || theme.palette.button.secondary
      }`
    : `${theme.shape.borderSizes.thick} solid transparent`,
  transition: "border-bottom 0.3s",
  "&:hover": {
    borderBottom: `${theme.shape.borderSizes.medium} solid ${
      styles?.activeTabColor || theme.palette.button.secondary
    }`, // Underline on hover
    backgroundColor: "transparent", // Optional: remove hover bg if any
  },
  padding: theme.spacing(2.5), // Padding for the tab
  minHeight: "unset", // R
  // emove default min height
  minWidth: "unset",
  "&.Mui-disabled": {
    color: `${theme.palette.button.disabled} !important`,
    borderBottom: `${theme.shape.borderSizes.thick} solid transparent`,
  },
}));

export const StyledTabLabel = styled("span")<{
  isActive: boolean;
}>(({ theme, isActive }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
}));

export const StyledTabs = styled(Tabs)<{ styles: TabsProps["styles"] }>(
  ({ theme, styles }) => ({
    borderBottom: `${theme.shape.borderSizes.thin} solid ${
      styles?.underlineColor || theme.palette.neutral.dark
    }`,
    justifyContent: "flex-start !important",
    minHeight: "unset !important",
    "& .MuiTabs-indicator": {
      backgroundColor: styles?.activeTabColor || theme.palette.button.secondary,
    },
  })
);

export const IconStyling = styled("span", {
  shouldForwardProp: (prop) => prop !== "visible", // prevent 'visible' from being passed to DOM
})<{ visible: boolean }>(({ theme }) => ({
  width: 8,
  height: 8,
  borderRadius: "50%",
  backgroundColor: theme.palette.button.secondary,
  marginLeft: theme.spacing(2),
}));

export const TabsLabel = styled("span")<{
  isActive: boolean;
}>(({ theme, isActive }) => ({
  fontWeight: isActive
    ? theme.typography.fontWeights.medium
    : theme.typography.fontWeights.regular,
}));

export const CustomTabsNoDataBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  textAlign: "center",
  color: theme.palette.text.primary,
  width: "100%",
  height: "calc(100vh - 370px)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  "& img": {
    maxWidth: "565px",
  },
}));

export const CustomTabsNoDataText = styled("div")(({ theme }) => ({
  color: theme.palette.primary.main,
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: theme.typography.fontWeights.semiBold,
  marginTop: theme.spacing(5),
}));
