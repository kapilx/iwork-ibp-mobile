import { styled } from "@mui/material/styles";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

export const SalesFunnelContainer = styled("div")(({ theme }) => ({
  width: "100%",
}));

export const FiltersRow = styled("div")(({ theme }) => ({
  marginBottom: theme.spacing(3),
  // display: "grid",
  gridTemplateColumns: "repeat(1, 1fr)",
  gap: theme.spacing(2),
  [theme.breakpoints.up("md")]: {
    gridTemplateColumns: "repeat(3, 1fr)",
  },
  display: "none",
}));

export const FunnelStage = styled("div")(({ theme }) => ({
  textAlign: "center",
  marginBottom: theme.spacing(3),
  "& .stage-name": {
    fontSize: "14px", // 0.875rem -> 14px
    fontWeight: 500,
    marginBottom: theme.spacing(1),
  },
  "& .stage-count": {
    fontSize: "18px", // 1.125rem -> 18px
    fontWeight: "bold",
  },
  "& .stage-percentage": {
    fontSize: "12px", // 0.75rem -> 12px
    color: theme.palette.grey[600],
  },
}));

export const StageFunnelContainer = styled("div")(({ theme }) => ({
  // display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: theme.spacing(2),
  marginBottom: theme.spacing(4),
  display: "none",
}));

export const ConversationCardsContainer = styled("div")(({ theme }) => ({
  // display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: theme.spacing(2),
  marginBottom: theme.spacing(4),
  display: "none",
}));

export const SunnelKPIContainer = styled("div")(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(7),
  marginTop: theme.spacing(7),
}));

export const FunnelContainer = styled("div")(({ theme }) => ({
  height: "100%", // 16rem -> 256px
  width: "100%",
  marginTop: theme.spacing(0),
}));

export const ConversionCard = styled("div")(({ theme }) => ({
  padding: theme.spacing(1.5),
  backgroundColor: theme.palette.grey[100],
  borderRadius: theme.shape.borderRadius,
  textAlign: "center",
  transition: "box-shadow 0.2s",
  "&:hover": {
    boxShadow: theme.shadows[2],
  },
  "& .conversion-label": {
    fontSize: "12px", // 0.75rem -> 12px
    color: theme.palette.grey[600],
  },
  "& .conversion-value": {
    fontSize: "18px", // 1.125rem -> 18px
    fontWeight: "bold",
  },
  "& .conversion-status": {
    fontSize: "12px", // 0.75rem -> 12px
    "&.on-target": {
      color: theme.palette.success.main,
    },
    "&.below-target": {
      color: theme.palette.warning.main,
    },
  },
}));

export const RechartsContainer = styled("div")(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "minmax(480px, 58%) minmax(0, 1fr)",
  gap: theme.spacing(5),
  alignItems: "start",
  width: "100%",
  minHeight: "420px",
  height: "auto",
  position: "relative",
  [theme.breakpoints.down("lg")]: {
    gridTemplateColumns: "1fr",
    minHeight: "unset",
  },
}));

export const StageColorContainer = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  minWidth: 0,
}));

export const StageColor = styled("div")(({ theme, color }) => ({
  width: 8,
  height: 8,
  borderRadius: "50%",
  backgroundColor: color,
}));

export const StageEstimatedTextContainer = styled("div")<{
  clickable?: boolean;
  heading?: boolean;
}>(({ theme, clickable, heading }) => ({
  fontSize: "12px",
  fontWeight: theme.typography.fontWeights.bold,
  color: heading ? theme.palette.text.primary : theme.palette.text.linkBlue,
  textAlign: "right",
  whiteSpace: "nowrap",
  minWidth: 0,
  cursor: clickable ? "pointer" : "default",
  "&:hover": clickable ? { textDecoration: "underline" } : undefined,
}));

export const StagePremiumTextContainer = styled("div")<{
  clickable?: boolean;
  heading?: boolean;
}>(({ theme, clickable, heading }) => ({
  fontSize: "12px",
  fontWeight: theme.typography.fontWeights.bold,
  color: heading ? theme.palette.text.primary : theme.palette.text.linkBlue,
  textAlign: "right",
  whiteSpace: "nowrap",
  minWidth: 0,
  cursor: clickable ? "pointer" : "default",
  "&:hover": clickable ? { textDecoration: "underline" } : undefined,
}));


export const StageConversionTextContainer = styled("div")(({ theme }) => ({
  fontSize: "12px",
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.primary,
  textAlign: "right",
  whiteSpace: "nowrap",
  minWidth: 0,
  textWrap: "wrap",
}));

export const StageTextContainer = styled("div")(({ theme }) => ({
  fontSize: "12px",
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.primary,
  minWidth: 0,
  overflowWrap: "break-word",
}));

export const StageTextMainContainer = styled("div")(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr) minmax(0, 0.95fr)",
  gap: theme.spacing(1.5),
  alignItems: "center",
  justifyContent: "stretch",
  width: "100%",
  minWidth: 0,
}));

export const StageContainer = styled("div", {
  shouldForwardProp: (prop) => prop !== "rowHeight",
})<{ rowHeight?: number }>(({ theme, rowHeight }) => ({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 2.2fr)",
  alignItems: "center",
  gap: theme.spacing(2),
  width: "100%",
  padding: '1.7vh 0',

  "&:first-child": {
    padding: theme.spacing(2.5, 0),
  },

  "&:not(:first-child)": {
    borderTop: `1px solid ${theme.palette.neutral.tableBorder}`,
  },
  [theme.breakpoints.down("md")]: {
    gridTemplateColumns: "1fr",
    gap: theme.spacing(1),
  },
  ...(rowHeight
    ? {
        [theme.breakpoints.up("lg")]: {
          "&, &:first-child": {
            height: rowHeight,
            padding: 0,
          },
        },
      }
    : {}),
}));

export const FunnelRightContainer = styled("div")(() => ({
  width: "100%",
  marginTop: 0,
  paddingTop: 0,
}));
export const InfoIconWrapper = styled("div")(({ theme }) => ({
  position: "absolute",
  left: theme.spacing(2),
  bottom: theme.spacing(2),
  // zIndex: 2,
  display: "flex",
  alignItems: "center",
}));

export const StyledInfoIcon = styled(InfoOutlinedIcon)(({ theme }) => ({
  color: theme.palette.button.secondary,
  fontSize:"32px",
}));
