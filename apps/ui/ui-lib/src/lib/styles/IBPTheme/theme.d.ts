import "@mui/material/styles";

declare module "@mui/material/styles" {
  interface PaletteColor {
    selected?: string;
  }

  interface PaletteColorOptions {
    selected?: string;
  }
  interface Typography {
    fontFamily: string;
    fontSizes: {
      xxs: string;
      xxxs: string;
      xs: string;
      xss: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      xll: string;
      xxl: string;
      xxll: string;
      xxxl: string;
    };
    fontWeights: {
      light: number;
      regular: number;
      medium: number;
      semiBold: number;
      bold: number;
    };
  }

  interface TypographyOptions {
    fontSizes?: {
      xxs: string;
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      xxl: string;
      xxxl: string;
    };
    fontWeights?: {
      light: number;
      regular: number;
      medium: number;
      bold: number;
    };
  }

  interface Theme {
    typography: Typography;
  }

  interface ThemeOptions {
    typography?: TypographyOptions;
  }

  interface Spacing {
    gaps: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      xxl: string;
    };
    paddings: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      xxl: string;
    };
    margins: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      xxl: string;
    };
  }

  type Shadows = string[];
  type ZIndex = {
    [key: string]: number;
  };

  interface Theme {
    typography: Typography;
  }

  interface ThemeOptions {
    typography?: TypographyOptions;
  }

  interface TypeBackground {
    default: string;
    paper: string;
    hover: string;
    light: string;
    tableHeader: string;
    tableHeaderHover: string;
    lightBlue: string;
    lightBlueActive: string;
    tabsSelected: string;
    stepConnectorContainerBg: string;
    messageBoxContainerBg: string;
    progressWrapperBg: string;
    incompleteIconBg: string;
    deepOrange: string;
    externalCircle: string;
    internalCircle: string;
    yellow: string;
    completedProgressColor: string;
    purple: string;
    uploadFile: string;
    divider: string;
    covers: string;
    calendarDay: string;
    SeashellPeach: string;
    BrightOrange: string;
    LightDark: string;
    calendarDay: string;
    DarkOrange: string;
    LightOrange: string;
    footer: string;
  }

  interface Palette {
    secondary: PaletteColor & {
      selected: string;
      border: string;
      hover: string;
    };
    text: {
      primary: string;
      secondary: string;
      error: string;
      labelColor: string;
      StrokeGrey: string;
      grey: string;
      purple: string;
      yellow: string;
      teal: string;
      orange: string;
      brown: string;
      Deeporange: string;
      LightDark: string;
      ternary: string;
    };
    neutral: {
      dark: string;
      mediumDark: string;
      medium: string;
      lightMedium: string;
      light: string;
      veryLight: string;
      divider: string;
      tableBorder: string;
      incompleteIcon: string;
      green: string;
      accordionBorder: string;
      placeholderColor: string;
    };
    border: {
      secondary: string;
      ternary: string;
      primary: string;
      main: string;
    };
    button: {
      primary: string;
      secondary: string;
      hover: string;
      disabled: string;
      secondaryHover: string;
      primaryBlue: string;
      primaryBlueHover: string;
    };
    chips: {
      primary: string;
      secondary: string;
      ternary: string;
      quaternary: string;
      quinary: string;
      senary: string;
      septenary: string;
      octonary: string;
    };
    kpiColors: {
      purple: string;
      yellow: string;
      teal: string;
      orange: string;
    };
    gradients: {
      purple: GradientColors;
      yellow: GradientColors;
      teal: GradientColors;
      orange: GradientColors;
      blue: GradientColors;
      red: GradientColors;
      primaryButton: GradientColors;
      primaryButtonHover: GradientColors;
      lightOrange: GradientColors;
    };
    employeeBanner: string;
    enrollmentBannerBlue: string;
    enrollmentBannerGreen: string;
    primaryButton: string;
  }

  interface PaletteOptions {
    secondary?: PaletteColorOptions & {
      selected?: string;
      border?: string;
      hover?: string;
    };
    text?: TypeText & {
      error?: string;
      labelColor?: string;
      StrokeGrey?: string;
      grey?: string;
      purple?: string;
      yellow?: string;
      teal?: string;
      orange?: string;
      brown?: string;
      Deeporange?: string;
      LightDark?: string;
    };
    neutral?: {
      dark?: string;
      mediumDark?: string;
      medium?: string;
      lightMedium?: string;
      light?: string;
      veryLight?: string;
      divider?: string;
    };
    button?: {
      primary?: string;
      secondary?: string;
      hover?: string;
      disabled?: string;
      secondaryHover?: string;
      primaryBlue?: string;
      primaryBlueHover?: string;
    };
    chips?: {
      primary?: string;
      secondary?: string;
      ternary?: string;
      quaternary?: string;
      quinary?: string;
      senary?: string;
      septenary?: string;
      octonary?: string;
    };
    gradients?: {
      purple?: GradientColors;
      yellow?: GradientColors;
      teal?: GradientColors;
      orange?: GradientColors;
      blue?: GradientColors;
      red?: GradientColors;
      lightOrange?: GradientColors;
    };
    employeeBanner?: string;
    enrollmentBannerBlue?: string;
    enrollmentBannerGreen?: string;
    primaryButton?: string;
  }

  interface GradientColors {
    start: string;
    end: string;
    text: string;
  }
  interface TypeText {
    primary: string;
    secondary: string;
    error: string;
    labelColor: string;
    StrokeGrey: string;
    Deeporange: string;
    LightDark: string;
    grey: string;
    purple: string;
    yellow: string;
    teal: string;
    orange: string;
    brown: string;
    lightOrange: string;
    lightGrey: string;
    lightBlue: string;
    neutralwhite: string;
    mediumGrey: string;
    ternary: string;
  }
  interface Palette {
    gradients: {
      purple: {
        start: string;
        end: string;
        text: string;
      };
      yellow: {
        start: string;
        end: string;
        text: string;
      };
      teal: {
        start: string;
        end: string;
        text: string;
      };
      orange: {
        start: string;
        end: string;
        text: string;
        medium: string;
      };
      blue: {
        start: string;
        end: string;
        text: string;
      };
      red: {
        start: string;
        end: string;
        text: string;
      };
      primaryButton: {
        start: string;
        end: string;
      };
      primaryButtonHover: {
        start: string;
        end: string;
      };
    };
  }

  interface PaletteOptions {
    gradients?: {
      purple?: {
        start: string;
        end: string;
        text: string;
      };
      yellow?: {
        start: string;
        end: string;
        text: string;
      };
      teal?: {
        start: string;
        end: string;
        text: string;
      };
      orange?: {
        start: string;
        end: string;
        text: string;
      };
      blue?: {
        start: string;
        end: string;
        text: string;
      };
      red?: {
        start: string;
        end: string;
        text: string;
      };
    };
  }
}
