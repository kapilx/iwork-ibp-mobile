
// Dark variant of the IBP theme.
// Overrides only palette background, text, neutral and border tokens
// while preserving all custom typography/shape/spacing/component tokens.
import { createTheme } from "@mui/material/styles";
import { textSizes } from "./typography";
import { border } from "./border";
import { zIndex } from "./zIndex";
import { breakpoints } from "./breakpoints";
import { gradients } from "./gradients";
import { components } from "./components";
import shadows from "./shadows";
import { spacing } from "./spacing";
import { transitions } from "./transitions";
import { colors } from "./colors";

const darkIbpTheme = createTheme({
    palette: {
        mode: "dark",
        ...colors,
        ...gradients,
        background: {
            ...colors.background,
            default: "#0F1117",
            paper: "#1A1D27",
            tableHeader: "#1E2235",
            tabsSelected: "#1E2A3A",
        },
        neutral: {
            ...colors.neutral,
            mediumDark: "#F0F0F0",
            medium: "#CCCCCC",
            light: "#666666",
            tableBorder: "#2E3148",
            veryLight: "#1A1D27",
        },
        text: {
            ...colors.text,
            primary: "#F0F0F0",
            secondary: "#AAAAAA",
            grey: "#AAAAAA",
        },
    },
    typography: {
        ...textSizes,
    },
    spacing,
    shape: {
        borderRadiuss: border.radius.small,
        borderWidth: border.width.none,
        borderRadii: border.radius,
        borderSizes: border.width,
    },
    shadows: {
        ...shadows,
    },
    zIndex,
    breakpoints,
    components,
    transitions,
});

export default darkIbpTheme;
