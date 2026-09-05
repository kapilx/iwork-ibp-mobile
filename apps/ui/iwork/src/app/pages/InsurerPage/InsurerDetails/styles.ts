import {
  Box,
  Button,
  Divider,
  Paper,
  Popover,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

// Outer container
export const InsurerDetailsContainer = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(5),

  ".highlighted-field": {
    display: "flex",
    flexDirection: "column !important",
  },
}));

export const ButtonContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: theme.spacing(5),
  "& .edit-button": {
    minWidth: "72px",
    gap: theme.spacing(1),
  },
  [theme.breakpoints.down("md")]: {
    flexWrap: "wrap",
    marginBottom: theme.spacing(3),
  },
  [theme.breakpoints.down("sm")]: {
    marginBottom: theme.spacing(2),
    gap: theme.spacing(2),
  },
}));

// Logo Preview Styles
export const LogoPreviewContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(4),
  padding: theme.spacing(3),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.spacing(1),
  border: `${theme.spacing(0.125)} solid`,
  borderColor: theme.palette.divider,
  boxShadow: theme.shadows[1],
}));
export const LogoTitle = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.lightGrey,
}));

export const LogoImage = styled("img")(({ theme }) => ({
  maxWidth: theme.spacing(50),
  maxHeight: theme.spacing(25),
  objectFit: "contain",
  cursor: "pointer",
  borderRadius: theme.spacing(1),
  border: `${theme.spacing(0.125)} solid`,
  borderColor: theme.palette.divider,
  padding: theme.spacing(1),
  backgroundColor: theme.palette.grey[50],
  transition: "all 0.2s ease-in-out",
  "&:hover": {
    boxShadow: theme.shadows[4],
    transform: "scale(1.02)",
  },
}));