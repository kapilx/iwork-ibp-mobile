import { styled, Box, IconButton } from "@mui/material";

export const ToggleContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== "toggleWidth",
})<{
  toggleWidth?: number | string;
}>(({ theme, toggleWidth }) => ({
  display: "flex",
  alignItems: "center",
  // Remove gap to make buttons appear as a single toggle
  gap: 0,
  width: toggleWidth ? toggleWidth : undefined,
}));

export const ToggleIconButton = styled(IconButton)<{ active: boolean; position?: 'left' | 'right' }>(({ theme, active, position }) => ({
  background: active ? theme.palette.common.black : theme.palette.common.white,
  border: `1px solid ${theme.palette.divider}`,
  // Make the toggle look like a pill by rounding only the outer edges
  borderRadius:
    position === 'left'
      ? `${theme.shape.borderRadius * 2}px 0 0 ${theme.shape.borderRadius * 2}px`
      : position === 'right'
      ? `0 ${theme.shape.borderRadius * 2}px ${theme.shape.borderRadius * 2}px 0`
      : theme.shape.borderRadius,
  padding: 6,
  marginLeft: position === 'right' ? '-1px' : 0, // Overlap borders
  marginRight: position === 'left' ? '-1px' : 0, // Overlap borders
  transition: "background 0.2s",
  '&:hover': {
    background: active ? theme.palette.grey[900] : theme.palette.grey[200],
  },
  boxShadow: 'none',
}));
