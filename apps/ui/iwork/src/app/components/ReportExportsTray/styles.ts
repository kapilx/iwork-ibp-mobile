import { styled, Box, IconButton, Typography } from "@mui/material";
import {
  DOWNLOAD_BTN_BG,
  DOWNLOAD_BTN_HOVER_BG,
  DOWNLOAD_BTN_SIZE,
  DOWNLOAD_ICON_SIZE,
  EMPTY_STATE_FONT_SIZE,
  TEXT_COLORS,
} from "./constants";

export const ContentWrapper = styled(Box)({
  display: "flex",
  flexDirection: "column",
  height: "100%",
});

export const ListWrapper = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: "auto",
  padding: theme.spacing(1.5),
}));

export const EmptyState = styled("div")(({ theme }) => ({
  color: TEXT_COLORS.meta,
  textAlign: "center",
  marginTop: theme.spacing(4),
  fontSize: EMPTY_STATE_FONT_SIZE,
}));

// One report row. `accent` is the status colour (left border + icon); the
// status itself is carried by the ChipRenderer pill, so the card stays white.
export const ReportCard = styled(Box, {
  shouldForwardProp: (prop) => prop !== "accent",
})<{ accent: string }>(({ theme, accent }) => ({
  display: "flex",
  gap: theme.spacing(1.25),
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  borderRadius: theme.spacing(1.5),
  border: `1px solid ${theme.palette.divider}`,
  borderLeft: `4px solid ${accent}`,
  backgroundColor: theme.palette.background.paper,
}));

export const CardBody = styled(Box)({
  flex: 1,
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: 4,
});

// Report title + inline "Latest" chip.
export const TitleRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  minWidth: 0,
}));

// Right-hand column: Latest chip and download button, grouped and vertically
// centred so they sit together neatly instead of drifting to the corners.
export const RightColumn = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  justifyContent: "center",
  gap: theme.spacing(1.5),
  marginLeft: "auto",
}));

// Circular, softly tinted download action.
export const DownloadButton = styled(IconButton)({
  width: DOWNLOAD_BTN_SIZE,
  height: DOWNLOAD_BTN_SIZE,
  backgroundColor: DOWNLOAD_BTN_BG,
  borderRadius: "50%",
  transition: "background-color 0.2s ease",
  "&:hover": {
    backgroundColor: DOWNLOAD_BTN_HOVER_BG,
  },
});

export const DownloadIconImg = styled("img")({
  width: DOWNLOAD_ICON_SIZE,
  height: DOWNLOAD_ICON_SIZE,
  display: "block",
});

export const ReportTitle = styled(Typography)({
  fontWeight: 600,
});

export const SummaryText = styled(Typography)({
  display: "block",
  fontWeight: 600,
  color: TEXT_COLORS.summary,
});

export const MetaText = styled(Typography)({
  display: "block",
  color: TEXT_COLORS.meta,
});
