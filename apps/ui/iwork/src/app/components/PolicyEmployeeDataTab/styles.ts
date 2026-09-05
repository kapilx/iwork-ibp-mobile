import { Box, Stack } from "@mui/material";
import { styled } from "@mui/material/styles";

export const StyledUploadIconImg = styled("img")({
  width: 20,
  height: 20,
  display: "inline-block",
});

export const ContainerForTable = styled(Box)({
  ".clickable-cell": {
    cursor: "pointer",
  },
});

export const EllipsisSpan = styled("span")(({ theme }) => ({
  maxWidth: "-webkit-fill-available",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  display: "inline-block",
  verticalAlign: "middle",
}));

export const StyledLoaderContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: 300,
}));

export const StyledOuterStack = styled(Stack)(({ theme }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: theme.spacing(2),
})) as typeof Stack;

export const StyledInnerStack = styled(Stack)(({ theme }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: theme.spacing(1),
})) as typeof Stack;

export const HiddenFileInput = styled("input")({
  display: "none",
});

export const StyledDownloadContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
}));

export const StyledBox = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "end",
}));
