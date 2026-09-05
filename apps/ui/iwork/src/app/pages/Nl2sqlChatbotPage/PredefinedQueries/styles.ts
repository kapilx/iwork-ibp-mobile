import { Box, Typography, Chip, IconButton, styled } from "@mui/material";
import { Star } from "@mui/icons-material";

export const QueriesContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(1),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  overflow: "visible",
  position: "relative",
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(3),
})) as typeof Box;

export const QueriesTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.body2.fontSize,
  fontWeight: theme.typography.fontWeights.semiBold || 600,
  color: theme.palette.warning.main,
})) as typeof Typography;

export const TitleContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1.5),
})) as typeof Box;

export const NavigationContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
})) as typeof Box;

export const QueriesWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "nowrap",
  gap: theme.spacing(2),
   marginTop: theme.spacing(1),
  padding: theme.spacing(1),
  maxHeight: "60px",
  overflowX: "auto",
  overflowY: "hidden",
  scrollBehavior: "smooth",
  flex: 1,
  "&::-webkit-scrollbar": {
    display: "none",
  },
  "&": {
    scrollbarWidth: "none",
    msOverflowStyle: "none",
  },
})) as typeof Box;

export const QueryChip = styled(Chip)(({ theme }) => ({
  backgroundColor: "#F5F3EE",
  color: "#111111",
  border: `1px solid #EAEAEA`,
  borderRadius: "16px",
  fontSize: "13px",
  fontWeight: 500,
  height: "32px",
  padding: "6px 12px",

  cursor: "pointer",
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  position: "relative",
  zIndex: 1,
  "&:hover": {
    backgroundColor: "#6439051A",
    borderColor: "#FFCA60",
    color: "#111111",
    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
    zIndex: 10,
    "& .MuiChip-label": {
      overflow: "visible",
      textOverflow: "unset",
      whiteSpace: "nowrap",
      maxWidth: "none",
      minWidth: "160px",
      width: "auto",
      lineHeight: 1.2,
    },
  },

  "&:focus": {
    outline: `2px solid #FFCA60`,
    outlineOffset: "1px",
    backgroundColor: "#6439051A",
    borderColor: "#FFCA60",
    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
  },
  "&:focus-visible": {
    outline: `2px solid #FFCA60`,
    outlineOffset: "2px",
  },
  "& .MuiChip-label": {
    padding: "0 2px",
    whiteSpace: "nowrap",
    fontSize: "13px",
    fontWeight: 500,
  },
})) as typeof Chip;

export const NavigationButton = styled(IconButton)(({ theme }) => ({
  width: 32,
  height: 32,
  backgroundColor: "#F5F3EE",
  border: "1px solid #EAEAEA",
  borderRadius: "50%",
  color: "#666666",
  transition: "all 0.2s ease-in-out",
  "&:hover": {
    backgroundColor: "#6439051A",
    borderColor: "#FFCA60",
    color: "#111111",
    transform: "scale(1.05)",
  },
  "&:disabled": {
    backgroundColor: "#F9FAFB",
    borderColor: "#E5E7EB",
    color: "#9CA3AF",
    cursor: "not-allowed",
    opacity: 0.5,
  },
  "& .MuiSvgIcon-root": {
    fontSize: 18,
  },
})) as typeof IconButton;

export const StarIcon: typeof Star = styled(Star)(({ theme }) => ({
  fontSize: theme.typography.body2.fontSize,
  color: theme.palette.warning.light,
  flexShrink: 0,
}));