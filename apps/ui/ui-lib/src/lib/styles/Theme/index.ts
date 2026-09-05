import { createTheme } from "@mui/material/styles";
import { colors } from "./colors";
import { textSizes } from "./typography";
import { border } from "./border";
import { zIndex } from "./zIndex";
import { breakpoints } from "./breakpoints";
import { gradients } from "./gradients";
import { injectFontFaces } from "./fonts";
import { components } from "./components";
import shadows from "./shadows";
import { spacing } from "./spacing";
import { transitions } from "./transitions";

export { colors };

declare module "@mui/system" {
  interface Shape {
    borderWidth: string;
    borderRadiuss: string;
    borderRadii: {
      small: string;
      medium: string;
      normal: string;
      semiRounded: string;
      large: string;
      circle: string;
    };
    borderSizes: {
      none: string;
      hairline: string;
      thin: string;
      medium: string;
      thick: string;
    };
  }
}
injectFontFaces();

export const theme = createTheme({
  palette: {
    ...colors,
    ...gradients,
  },
  typography: {
    ...textSizes,
  },
  spacing,
  shape: {
    borderRadiuss: border.radius.small, // Default border radius
    borderWidth: border.width.none,
    borderRadii: border.radius, // Add custom border radii
    borderSizes: border.width, // Add custom border sizes
  },
  shadows: {
    ...shadows,
  },
  zIndex,
  breakpoints,
  components,
  transitions,
});
