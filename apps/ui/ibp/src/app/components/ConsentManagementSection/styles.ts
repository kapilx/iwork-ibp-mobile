import { styled } from "@mui/material/styles";
import { Box, Button, Chip, Typography } from "@mui/material";

export const ConsentContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(5),
  boxShadow: "0px 5px 10px 0px #2626261A",
  borderRadius: theme.spacing(3),
  backgroundColor: theme.palette.common.white,
  padding: theme.spacing(8, 6),
  [theme.breakpoints.down("md")]: {
    padding: theme.spacing(4),
    borderRadius: theme.spacing(2),
  },
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(3, 2),
    borderRadius: theme.spacing(2),
  },
}));

export const ConsentHeader = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.LightDark,
  marginBottom: theme.spacing(6),
  borderBottom: `3px solid ${theme.palette.border.pistachio}`,
  paddingBottom: theme.spacing(2),
  [theme.breakpoints.down("sm")]: {
    fontSize: theme.typography.fontSizes.sm,
    marginBottom: theme.spacing(4),
  },
}));

export const ConsentSubtitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.fadeGrey,
  marginTop: theme.spacing(-4),
  marginBottom: theme.spacing(6),
  [theme.breakpoints.down("sm")]: {
    fontSize: theme.typography.fontSizes.xs,
    marginBottom: theme.spacing(4),
  },
}));

export const ConsentStatusLabel = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xs,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.fadeGrey,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  marginBottom: theme.spacing(3),
}));

export const ConsentCard = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(4),
  alignItems: "flex-start",
  border: `1px solid ${theme.palette.border?.lightGray || "#E0E0E0"}`,
  borderRadius: theme.spacing(2),
  padding: theme.spacing(4),
  [theme.breakpoints.down("md")]: {
    flexDirection: "column",
    gap: theme.spacing(3),
  },
}));

export const StatusZone = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: theme.spacing(2),
  minWidth: "180px",
  backgroundColor: theme.palette.background.azurBlue || "#F0F7FF",
  borderRadius: theme.spacing(2),
  padding: theme.spacing(4, 3),
  [theme.breakpoints.down("md")]: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-start",
    padding: theme.spacing(2, 3),
  },
}));

export const ShieldIconWrapper = styled(Box)(({ theme }) => ({
  width: "56px",
  height: "56px",
  borderRadius: "50%",
  backgroundColor: "#E8F5E9",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  "& svg": {
    width: "32px",
    height: "32px",
    color: "#43A047",
  },
  [theme.breakpoints.down("sm")]: {
    width: "44px",
    height: "44px",
    "& svg": { width: "24px", height: "24px" },
  },
}));

export const StatusBadge = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: "#43A047",
}));

export const StatusText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xs,
  color: theme.palette.text.fadeGrey,
  textAlign: "center",
  marginTop: theme.spacing(1),
  [theme.breakpoints.down("md")]: {
    textAlign: "left",
  },
}));

export const InfoZone = styled(Box)(({ theme }) => ({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
  justifyContent: "center",
  padding: theme.spacing(2, 0),
}));

export const InfoRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
}));

export const InfoIconWrapper = styled(Box)(({ theme }) => ({
  width: "32px",
  height: "32px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  color: theme.palette.text.fadeGrey,
  "& svg": { width: "18px", height: "18px" },
}));

export const InfoLabel = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.fadeGrey,
  minWidth: "140px",
  [theme.breakpoints.down("sm")]: {
    fontSize: theme.typography.fontSizes.xs,
    minWidth: "110px",
  },
}));

export const InfoValue = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.LightDark,
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  [theme.breakpoints.down("sm")]: {
    fontSize: theme.typography.fontSizes.xs,
  },
}));

export const LatestChip = styled(Chip)(({ theme }) => ({
  height: "20px",
  fontSize: "11px",
  fontWeight: theme.typography.fontWeights.semiBold,
  backgroundColor: "#E3F2FD",
  color: "#1565C0",
  "& .MuiChip-label": { padding: "0 8px" },
}));

export const ActionsZone = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  minWidth: "180px",
  [theme.breakpoints.down("md")]: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
  },
}));

export const ActionsLabel = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xs,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.fadeGrey,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  marginBottom: theme.spacing(1),
}));

export const ActionButton = styled(Button)(({ theme }) => ({
  justifyContent: "flex-start",
  gap: theme.spacing(1.5),
  textTransform: "none",
  borderRadius: theme.spacing(1.5),
  padding: theme.spacing(1.5, 2),
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
  "& svg": { width: "18px", height: "18px" },
}));

export const WithdrawButton = styled(ActionButton)(({ theme }) => ({
  color: theme.palette.error.main,
  borderColor: theme.palette.error.main,
  "&:hover": {
    backgroundColor: "#FFF5F5",
    borderColor: theme.palette.error.main,
  },
}));

export const LoadingWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "120px",
}));

export const WithdrawnStatusBadge = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.error.main,
}));

export const WithdrawnShieldWrapper = styled(Box)(({ theme }) => ({
  width: "56px",
  height: "56px",
  borderRadius: "50%",
  backgroundColor: "#FFEBEE",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  "& svg": {
    width: "32px",
    height: "32px",
    color: theme.palette.error.main,
  },
  [theme.breakpoints.down("sm")]: {
    width: "44px",
    height: "44px",
    "& svg": { width: "24px", height: "24px" },
  },
}));
