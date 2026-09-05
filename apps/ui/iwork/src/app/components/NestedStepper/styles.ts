import { styled } from "@mui/material/styles";
import { Box, Typography, Button } from "@mui/material";
import { StateEnum } from "./RenderComponent";
import { colors } from "@ui/ui-lib";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

export const Layout = styled(Box)(({ theme }) => ({
  display: "flex",
  width: "100%",
}));

export const LeftPanel = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRight: `1px solid ${theme.palette.action.disabledBackground}`,
}));

export const Container = styled(Box)(({ theme }) => ({
  width: "100%",
  overflowY: "auto",
}));

export const Header = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: "bold",
  color: theme.palette.primary.main,
  padding: theme.spacing(5, 0, 0, 5),
}));

export const StepWrapper = styled(Box)(
  ({
    componentKey,
    theme,
    active,
  }: {
    componentKey?: string;
    theme?: any;
    active?: boolean;
  }) => {
    switch (componentKey) {
      case "accordianComponent":
        return {
          overflow: "hidden",
          border: `1px solid ${theme.palette.neutral.light}`,
          // borderRadius: theme.spacing(2),
          // marginBottom: theme.spacing(2),
          // backgroundColor: theme.palette.background.paper,
          cursor: "pointer",
          ...(active && {
            backgroundColor: theme.palette.background.lightBlueActive,
            // No right border for accordion parent steps
          }),
        };
      default:
        return {
          overflow: "hidden",
          cursor: "pointer",
          ...(active && {
            backgroundColor: theme.palette.background.lightBlueActive,
            borderRight: `3px solid ${theme.palette.button.secondary}`,
          }),
        };
    }
  }
);

export const StepHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.tableHeader,
  cursor: "pointer",
  transition: "background-color 0.2s",
  "&:hover": {
    backgroundColor: theme.palette.background.tableHeaderHover,
  },
  overflow: "hidden",
}));

export const StepTitle = styled(Typography)(
  ({ state, theme }: { state: StateEnum; theme?: any }) => ({
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.medium,
    color:
      state === StateEnum.COMPLETED
        ? colors.text.grey
        : state === StateEnum.ACTIVE
        ? theme.palette.button.secondary
        : theme.palette.primary.main,
  })
);

export const IconsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
}));

export const Tick = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.priorityLow,
  fontSize: theme.typography.fontSizes.xll,
}));

export const ExpandIcon = styled(Typography)(({ theme }) => ({
  color: theme.palette.neutral.lightMedium,
  fontSize: theme.typography.fontSizes.xll,
}));

export const RotatableArrow = styled("img")<{ isOpen: boolean }>(
  ({ isOpen, theme }) => ({
    transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
    transition: "transform 0.2s ease-in-out",
  })
);

export const StepContent = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderTop: "1px solid #f0f0f0",
  cursor: "pointer",
}));

export const CheckboxWrapper = styled(Box)(
  ({ active, theme }: { active: boolean; theme?: any }) => ({
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(3),
    "&:last-child": {
      marginBottom: 0,
    },
    backgroundColor: active
      ? theme.palette.background.lightBlueActive
      : "transparent",
    padding: theme.spacing(2.5),
    ...(active && {
      borderRight: `3px solid ${theme.palette.button.secondary}`,
    }),
  })
);

export const CheckboxLabel = styled(Typography)<{
  state: StateEnum;
  theme?: any;
}>(({ state, theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  cursor: "pointer",
  flex: 1,
  color: theme.palette.primary.main,
  "&:hover": {
    color: theme.palette.neutral.dark,
  },
  ...(state === StateEnum.ACTIVE && {
    color: theme.palette.button.secondary,
  }),
}));

export const StyledCheckbox = styled("input")(({ disabled, theme }) => ({
  width: theme.spacing(4),
  height: theme.spacing(4),
  cursor: "pointer",
  opacity: 1,
}));

export const DefaultVariantHeaderContainer = styled(Box)(
  ({
    state,
    active,
    theme,
  }: {
    state: StateEnum;
    active?: boolean;
    theme?: any;
  }) => ({
    display: "flex",
    alignItems: "center",
    padding: theme.spacing(4),
    gap: theme.spacing(2),
    ...(active && {
      backgroundColor: theme.palette.background.lightBlueActive,
      borderRight: `3px solid ${theme.palette.button.secondary}`,
    }),
  })
);

export const Dot = styled("span")(
  ({ color, theme }: { color: string; theme?: any }) => ({
    width: theme.spacing(2),
    height: theme.spacing(2),
    borderRadius: "50%",
    backgroundColor: color,
  })
);

export const EmptyCircle = styled("span")(({ theme }) => ({
  display: "inline-block",
  width: 20,
  height: 20,
  borderRadius: "50%",
  border: `2px solid ${theme.palette.text.disabled}`,
  boxSizing: "border-box",
}));

export const SuccessCircle = styled("img")(({ theme }) => ({
  width: 20,
  height: 20,
}));

export const TimeIcon = styled(AccessTimeIcon)(({ theme }) => ({
  color: colors.button.secondary,
}));
