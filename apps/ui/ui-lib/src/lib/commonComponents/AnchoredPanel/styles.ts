import { styled } from "@mui/material/styles";
import { Paper } from "@mui/material";

// Surface only — MUI Popper owns position/placement. Elevation 8 matches the
// Popover this replaces, so it looks identical.
export const PanelSurface = styled(Paper)`
  border-radius: 8px;
`;