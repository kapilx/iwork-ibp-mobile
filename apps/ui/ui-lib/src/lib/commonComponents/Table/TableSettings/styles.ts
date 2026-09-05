import { Box, styled } from "@mui/material";

export const DraggableContainer = styled(Box)(({ theme }) => ({
  width: 400,
  height: "calc(100vh - 57px)",
}));

export const DraggableItem = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
}));

export const DraggableItemContent = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
}));

export const DraggableItemLabel = styled(Box)(({ theme }) => ({
  marginLeft: theme.spacing(1),
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.primary,
}));

export const DraggableItemHandle = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  cursor: "grab",
  marginRight: theme.spacing(1),
}));

export const ActionButtonsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  gap: theme.spacing(1),
  padding: theme.spacing(5),
}));

export const StyledDroppableContainer = styled("div")(({ theme }) => ({
  height: "calc(100vh - 137px)",
  overflowY: "auto",
  padding: theme.spacing(3),
  gap: theme.spacing(2.5),
  display: "flex",
  flexDirection: "column",
}));
