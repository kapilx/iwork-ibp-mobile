import { Box, styled, Typography } from "@mui/material";

const getBorderRadius = (theme: any) => {
  if (theme.shape?.borderRadii?.semiRounded) {
    return theme.shape.borderRadii.semiRounded;
  }
  return theme.shape?.borderRadius ?? 8;
};

export const PreviewContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== "customHeight",
})<{ customHeight?: string | number }>(({ theme, customHeight }) => ({
  width: "100%",
  display: "flex",
  flexDirection: "column",
  flex: 1,
  gap: theme.spacing(3),
  minHeight: 0,
  ...(customHeight ? { height: customHeight } : {}),
}));

export const PreviewContentArea = styled(Box)(() => ({
  flex: 1,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
}));

export const Toolbar = styled(Box)<{ justifyContent?: string }>(
  ({ theme, justifyContent = "space-between" }) => ({
    display: "flex",
    alignItems: "center",
    justifyContent,
    gap: theme.spacing(2),
    flexWrap: "wrap",
  })
);

export const FileMeta = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.75),
  minWidth: 0,
}));

export const PreviewSurface = styled(Box, {
  shouldForwardProp: (prop) => prop !== "surfaceMaxHeight",
})<{ surfaceMaxHeight?: string | number, stylesForOuterBorder?:any }>(({ theme, surfaceMaxHeight, stylesForOuterBorder }) => ({
  flex: 1,
  minHeight: 0,
  border: stylesForOuterBorder ? stylesForOuterBorder.border : `${theme.shape?.borderSizes?.thin ?? "1px"} solid ${
    theme.palette.neutral?.divider ?? theme.palette.divider
  }`,
  borderRadius: stylesForOuterBorder ? "0px" :  getBorderRadius(theme),
  backgroundColor: surfaceMaxHeight ? "transparent" : theme.palette.background.paper,
  maxHeight: surfaceMaxHeight ?? "72vh",
  overflow: "auto",
  padding: theme.spacing(2),
}));

export const CenteredState = styled(Box)(({ theme }) => ({
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "column",
  gap: theme.spacing(2),
  minHeight: "320px",
  textAlign: "center",
  width: "100%",
}));

export const ErrorText = styled(Typography)(({ theme }) => ({
  color: theme.palette.error.main,
}));

export const PdfCanvasContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== "surfaceMaxHeight",
})<{ surfaceMaxHeight?: string | number }>(({ theme, surfaceMaxHeight }) => ({
  width: "100%",
  display: "flex",
  justifyContent: "flex-start",
  backgroundColor:  surfaceMaxHeight ? "transparent" : theme.palette.background.paper,
  overflow: "visible",
}));

export const ZoomLayer = styled(Box)(() => ({
  display: "flex",
  width: "100%",
  transformOrigin: "left top",
  transition: "transform 120ms ease-out",
  willChange: "transform",
}));

export const PagesColumn = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(3),
  width: "100%",
}));

export const PdfPageFrame = styled(Box)(({ theme }) => ({
  width: "100%",
  borderRadius: getBorderRadius(theme),
  // backgroundColor: "#f3f4f6",
  boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
  overflow: "visible",
  display: "flex",
  flexDirection: "column",
  "& canvas": {
    display: "block",
    width: "100%",
    height: "auto",
    background: theme.palette.background.default,
    borderRadius: 4,
  },
}));

export const ZoomLayoutWrapper = styled(Box)<{ width: number | string }>(
  ({ width }) => ({
    width: typeof width === "number" ? `${width}px` : width,
    minWidth: typeof width === "number" ? `${width}px` : width,
    maxWidth: "100%",
    margin: "0 auto",
    position: "relative",
    display: "flex",
    justifyContent: "center",
  })
);
