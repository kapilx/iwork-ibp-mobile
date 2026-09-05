import { styled } from "@mui/material";
export * from "./Theme";
export { default as ibpTheme } from "../styles/IBPTheme";
export { default as darkIbpTheme } from "../styles/IBPTheme/darkTheme";

export const LoaderOverlay = styled("div")(({ theme }) => ({
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  // background: "rgba(255, 255, 255, 0.7)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 2,
}));
