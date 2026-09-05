import { styled, Chip } from "@mui/material";

export const StyledChip = styled(Chip)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  height: theme.spacing(8),
  padding: theme.spacing(0, 2),
  borderRadius: theme.spacing(4),
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  "&.MuiChip-clickable": {
    cursor: "pointer",
  },
  "& .MuiChip-icon": {
    marginLeft: theme.spacing(-0.5),
    marginRight: theme.spacing(0.5),
  },
  "& .MuiChip-deleteIcon": {
    marginLeft: theme.spacing(0.5),
    marginRight: theme.spacing(-0.5),
  },
}));
