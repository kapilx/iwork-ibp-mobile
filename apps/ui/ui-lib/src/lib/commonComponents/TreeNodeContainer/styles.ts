import { Box, Typography, styled, Theme } from "@mui/material";
import Button from "../Button";

export const StyledTreeNodeContainer = styled(Box)(({ theme }) => ({
  position: "relative",
  marginBottom: theme.spacing(1.5),
  color: theme.palette.text.primary,
  marginLeft: theme.spacing(5),
  "&::before": {
    content: '""',
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "1px",
    backgroundColor: theme.palette.divider,
  },
}));

export const StyledTreeLine = styled("span")(({ theme }) => ({
  position: "absolute",
  top: "0.85em",
  left: 0,
  width: theme.spacing(2),
  height: "1px",
  backgroundColor: theme.palette.divider,
}));

export const StyledTreeNodeLabel = styled(Typography)<{ isChild?: boolean }>(
  ({ theme, isChild }) => ({
    color: theme.palette.text.primary, // Blue color for child nodes
    fontSize: theme.typography.fontSizes.sm,
    marginBottom: theme.spacing(0.5),
    padding: `${theme.spacing(0.5)} ${theme.spacing(1)}`,
    lineHeight: "16px",
    maxWidth: "450px",
    borderRadius: theme.shape.borderRadius,
    "&.selected": {
      background: "#1252E914",
      width: "100%",
      borderRadius: theme.shape.borderRadius,
    },
  })
);

export const StyledTreeNodeWrapper = styled(Box)<{ depth: number }>(
  ({ theme, depth }) => ({
    paddingLeft: depth > 0 ? theme.spacing(2) : 0,
    position: "relative",
  })
);

export const ImageContainer = styled("div")(({ theme }: { theme: Theme }) => ({
  marginLeft: theme.spacing(4),
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: theme.spacing(2),
}));

export const StyledTreeContainer = styled(Box)(({ theme }) => ({
  justifyContent: "space-between",
  display: "flex",
  alignItems: "center",
  cursor: "pointer",
  padding: theme.spacing(1),
  minHeight: theme.spacing(9),
  "&:hover": {
    backgroundColor: theme.palette.background.lightBlueActive,
    ".select-button": {
      display: "inline-flex",
    },
  },
}));

export const SelectButton = styled(Button)(({ theme }) => ({
  display: "none",
  height: 28,
  minWidth: 0,
  padding: `${theme.spacing(0.5)} ${theme.spacing(2)}`,
  whiteSpace: "nowrap",
  backgroundColor: theme.palette.background.paper,
}));

export const DisablesTextStyles = styled("span")(({ theme }) => ({
  color: theme.palette.button.disabled,
  marginLeft: theme.spacing(2),
}))
