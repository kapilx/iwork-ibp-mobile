import { Button, theme } from "@ui/ui-lib";
import { styled, Typography, Box, TextField, Switch, Modal } from "@mui/material";
import { colors } from "@ui/ui-lib/styles/IBPTheme/colors";

export const HospitalNetworkContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  marginTop: theme.spacing(12.5),
  position: "relative",
}));

export const HospitalHeading = styled(Typography)(({ theme }) => ({
  fontSize: "25px",
  fontWeight: theme.typography.fontWeights.semiBold,
  marginBottom: theme.spacing(4),
}));

export const HospitalCount = styled("span")(({ theme }) => ({
  marginLeft: theme.spacing(1),
  color: theme.palette.neutral.lightMedium,
}));

export const HospitalContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
}));

export const HospitalTopContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: theme.spacing(4),
}));

export const HospitalHeaderBar = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: theme.spacing(6, 6.7, 3.25, 13),
  borderBottom: `1px solid ${theme.palette.neutral.light}`,
  "@media (min-width: 769px) and (max-width: 1024px)": {
    padding: theme.spacing(4, 4, 3, 4),
  },
  "@media (max-width: 768px)": {
    padding: theme.spacing(3, 2),
    flexWrap: "wrap",
    gap: theme.spacing(2),
  },
}));

export const HospitalHeaderLeft = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  cursor: "pointer",
}));

export const HospitalHeaderTitle = styled(Typography)(({ theme }) => ({
  fontSize: '20px',
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.primary,
  "@media (max-width: 768px)": {
    fontSize: theme.typography.fontSize.md,
  },
}));

export const HospitalHeaderSubTitle = styled(Typography)(({ theme }) => ({
  fontSize: '16px',
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.primary,
  "@media (max-width: 768px)": {
    fontSize: '12px',
  },
}));

export const HospitalHeaderTextContainer = styled(Box)(({theme})=>({
  display: "flex", 
  flexDirection:"column",
  gap: theme.spacing(0.5)
}))

export const HospitalHeaderRight = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  "@media (min-width: 769px) and (max-width: 1024px)": {
    width: "100%",
    flexWrap: "wrap",
    justifyContent: "center",
    rowGap: theme.spacing(1.5),
  },
  "@media (max-width: 768px)": {
    width: "100%",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: theme.spacing(1),
    rowGap: theme.spacing(1.5),
  },
}));

export const HospitalHeaderDivider = styled("span")(({ theme }) => ({
  width: "1px",
  height: "20px",
  margin: theme.spacing(0, 3),
  backgroundColor: theme.palette.neutral.light,
  "@media (max-width: 768px)": {
    margin: theme.spacing(0, 1),
  },
}));

export const HospitalHeaderViewText = styled(Typography)<{
  $isActive?: boolean;
}>(({ theme, $isActive }) => ({
  fontSize: theme.typography.fontSize.sm,
  fontWeight: theme.typography.fontWeights.regular,
  color: $isActive ? colors.landing.primary : theme.palette.text.primary,
}));

export const HospitalHeaderFilterButton = styled("button")<{
  $isActive?: boolean;
}>(({ theme, $isActive }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  background: "transparent",
  border: "none",
  padding: 0,
  cursor: "pointer",
  color: $isActive ? "#1F79D4" : theme.palette.text.primary,
  font: "inherit",
  "& img": {
    filter: $isActive
      ? "brightness(0) saturate(100%) invert(33%) sepia(71%) saturate(548%) hue-rotate(175deg) brightness(96%) contrast(92%)"
      : "none",
  },
}));

export const ViewToggleSwitch = styled(Switch)(({ theme }) => ({
  width: 42,
  height: 24,
  padding: 0,
  "& .MuiSwitch-switchBase": {
    padding: 2,
    color: "transparent",
    "&.Mui-checked": {
      transform: "translateX(18px)",
      color: "transparent",
    },
  },
  "& .MuiSwitch-thumb": {
    width: 20,
    height: 20,
    background: "linear-gradient(100.91deg, #1F79D4 21.94%, #3EA0F1 71.2%)",
    boxShadow:
      "0px 1px 2px -1px rgba(0,0,0,0.12), 0px 1px 3px 0px rgba(0,0,0,0.14)",
  },
  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
    backgroundColor: "#FFFFFF",
  },
  "& .MuiSwitch-track": {
    borderRadius: "20px",
    border: "1px solid transparent", // required
    background:
      "linear-gradient(#FFFFFF, #FFFFFF) padding-box, linear-gradient(100.91deg, #1F79D4 21.94%, #3EA0F1 71.2%) border-box",
    opacity: 1,
  },
}));

export const HospitalButtonContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(1),
  backgroundColor: "white",
  border: `1px solid ${theme.palette.neutral.light}`,
  borderRadius: theme.spacing(5),
  padding: theme.spacing(0.5),
}));

export const HospitalButton = styled(Button)<{ variant: string }>(
  ({ theme, variant }) => ({
    padding: theme.spacing(1, 1),
    borderRadius: theme.spacing(6.5),
    backgroundColor:
      variant === "contained"
        ? `${theme.palette.text.Deeporange}`
        : "transparent",
    color:
      variant === "contained"
        ? `${theme.palette.background.paper}`
        : `${theme.palette.primary.main}`,
    textTransform: "none",
    fontWeight: theme.typography.fontWeights.semiBold,
    border: "none",
    "&:hover": {
      boxShadow: "none",
    },
    "&.MuiButton-root:hover": {
      background:
        variant === "contained"
          ? `${theme.palette.text.Deeporange}`
          : "transparent",
    },
  }),
);

export const HospitalExportButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(1, 1),
  borderRadius: 10,
  backgroundColor: theme.palette.text.Deeporange,
  color: theme.palette.background.paper,
  fontWeight: theme.typography.fontWeights.semiBold,
  border: "none",
  "&:hover": {
    boxShadow: "none",
  },
  "&.MuiButton-root:hover": {
    backgroundColor: theme.palette.text.Deeporange,
  },
}));

export const DownloadIcon = styled("img")(({ theme }) => ({
  height: 16,
  width: 16,
  marginRight: theme.spacing(2),
}));

export const FiltersContainer = styled(Box)(({ theme }) => ({
  background: theme.palette.background.DarkBlue,
  boxShadow: theme.shadows[10],
  borderRadius: "0px",
  padding: 0,
  minHeight: "204px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: theme.spacing(5),
  position: "relative",
  overflow: "hidden",
  "@media (min-width: 769px) and (max-width: 1024px)": {
    minHeight: "unset",
    padding: theme.spacing(0, 3),
  },
  "@media (max-width: 768px)": {
    minHeight: "unset",
    padding: theme.spacing(4, 2),
    alignItems: "stretch",
  },
}));
export const FilterOutlinedIcon = styled("img")(({ theme }) => ({

}));
export const KeyboardArrowDown = styled("img")(({ theme }) => ({

}));
export const FiltersBackgroundImage = styled("img")(() => ({
  position: "absolute",
  right: 0,
  bottom: 0,
  height: "85%",
  width: "auto",
  pointerEvents: "none",
  top: "58px",
  zIndex: 0,
}));

export const FiltersContainerSearch = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
  width: "100%",
  maxWidth: "900px",
  padding: theme.spacing(6, 0),
  position: "relative",
  zIndex: 1,
  "@media (min-width: 769px) and (max-width: 1024px)": {
    padding: theme.spacing(4, 0),
    maxWidth: "100%",
  },
  "@media (max-width: 768px)": {
    padding: 0,
    maxWidth: "100%",
  },
}));

export const FiltersContainerForm = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(5),
  // width: "80%",
  alignItems: "flex-end",
  "& .MuiGrid-root": {
    columnGap: "30px !important",
    alignItems: "flex-end",
  },
  // Make each form control a positioning context
  "& .MuiFormControl-root": {
    position: "relative",
  },
  // Position error messages absolutely - expands downward only
  "& .MuiFormHelperText-root": {
    position: "absolute",
    top: "100%", // Position right below the input field
  },
}));
export const FilterContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  maxWidth: "304px",
  background:"white",
  padding: theme.spacing(10, 6, 7.5, 6),
  position:"absolute",
  zIndex: 999,
  borderRadius: theme.spacing(3),
  top:"5%",
  right: "3%",
  boxShadow: "0px 10px 24px 0px #0000001A",
  "& [data-testid=\"segmented-control-option-true\"]": {
    backgroundColor: colors.landing.primary,
    color: colors.landing.white,
    borderRight: `1px solid ${colors.landing.primary}`,
    fontWeight: 600,
  },
  "& [data-testid=\"segmented-control-option-true\"]:hover": {
    backgroundColor: colors.landing.primaryDark,
  },
  "@media (min-width: 769px) and (max-width: 1024px)": {
    maxWidth: "280px",
    right: "2%",
    padding: theme.spacing(8, 5, 6, 5),
  },
  "@media (max-width: 768px)": {
    maxWidth: "calc(100% - 32px)",
    width: "calc(100% - 32px)",
    left: "16px",
    right: "16px",
    top: "5%",
    padding: theme.spacing(8, 4, 6, 4),
  },
}));
export const FilterCloseIcon = styled("img")(({ theme }) => ({
  position: "absolute",
  top: theme.spacing(3),
  cursor: "pointer",
  right: theme.spacing(5),
}));
export const FilterContainerSubHeading = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSize.md,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(1.25),
}));

export const FiltersContainerHeading = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSize.sm,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(0.5),
}));
export const ButtonContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  marginTop: theme.spacing(7.5),

}));

// New styled TextField to override MUI defaults
export const StyledSearchField = styled(TextField)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.spacing(3),
  width: "100%",
  boxShadow: "0 6px 12px rgba(0, 0, 0, 0.16)",
  padding: theme.spacing(3.75),
  border: "1px solid var(--Colour-stroke, #00000033)",

  "& .MuiOutlinedInput-root": {
    borderRadius: 0,
    padding: 0,
    fontWeight: theme.typography.fontWeights.regular,
    fontSize: theme.typography.fontSizes.md,
    "& fieldset": {
      border: "none",
    },

    "&:hover fieldset": {
      border: "none",
    },

    // "&.Mui-focused": {
    //   backgroundColor: theme.palette.text.GrayShade,

    //   "& fieldset": {
    //     border: "none",
    //   },
    // },
  },

  "& .MuiOutlinedInput-input": {
    padding: 0,
    fontSize: "14px",
    color: theme.palette.text.primary,
    "&::placeholder": {
      fontSize: "16px",
      opacity: 1,
    },
  },
  "& .MuiInputAdornment-root": {
    marginRight: "8px",

    "& .MuiSvgIcon-root": {
      // color: "#9CA3AF",
      fontSize: "20px",
    },
  },
  "& .MuiInputAdornment-positionEnd": {
    marginRight: theme.spacing(2),
  },

}));

export const SearchClearButton = styled("button")(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 20,
  height: 20,
  border: "none",
  background: "transparent",
  padding: 0,
  marginRight: theme.spacing(1),
  cursor: "pointer",
  "&:hover": {
    opacity: 0.8,
  },
}));

export const SearchClearIcon = styled("img")(({ theme }) => ({
  width: 20,
  height: 20,
}));

export const SearchAdornmentSeparator = styled("span")(({ theme }) => ({
  width: "1px",
  height: "20px",
  backgroundColor: theme.palette.neutral.light,
  margin: '0 12px 0 8px',
}));

export const SearchAdornmentIcon = styled("img")(() => ({
  width: 20,
  height: 20,
}));

export const CardsContainer = styled(Box)(({ theme }) => ({
  minHeight: "400px",
  "@media (min-width: 769px) and (max-width: 1024px)": {
    minHeight: "unset",
  },
  "@media (max-width: 768px)": {
    minHeight: "unset",
  },
}));

export const MapViewContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2.5),
  padding: theme.spacing(0,2.5, 6.7, 0),
  height: "720px",
  [theme.breakpoints.down("md")]: {
    flexDirection: "column",
    height: "auto",
  },
}));

export const MapResultsPanel = styled(Box)(({ theme }) => ({
  width: "360px",
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.neutral.light}`,
  borderRadius: theme.spacing(1),
  boxShadow: "0px 8px 24px rgba(15, 23, 42, 0.08)",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  [theme.breakpoints.down("md")]: {
    display: "none",
  },
}));

export const MapResultsHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5, 2),
  borderBottom: `1px solid ${theme.palette.neutral.light}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(1.5),
  backgroundColor: theme.palette.background.paper,
}));

export const MapResultsHeaderTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSize.sm,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.primary,
}));

export const MapResultsHeaderActions = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  fontSize: theme.typography.fontSize.xs,
  color: theme.palette.neutral.medium,
}));

export const MapResultsBody = styled(Box)(({ theme }) => ({
  overflowY: "auto",
}));

export const MapResultItem = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  border: `1px solid ${theme.palette.neutral.light}`,
  backgroundColor: theme.palette.background.paper,
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
  transition: "background-color 0.15s ease, border-color 0.15s ease",
  // "& + &": {
  //   marginTop: theme.spacing(1.25),
  // },
  "&:hover": {
    backgroundColor: theme.palette.background.paper,
    borderColor: theme.palette.background.DarkBlue,
  },
}));

export const MapResultSubtitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSize.xs,
  color: theme.palette.neutral.medium,
  marginBottom: theme.spacing(0.5),
}));

export const MapResultName = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSize.sm,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.primary,
}));

export const MapResultMeta = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSize.xs,
  color: theme.palette.neutral.medium,
  marginTop: theme.spacing(0.5),
}));

export const MapResultFooterRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  marginTop: theme.spacing(0.5),
}));

export const MapResultTag = styled("span")(({ theme }) => ({
  display: "inline-block",
  backgroundColor: theme.palette.background.loginBg,
  color: theme.palette.text.primary,
  fontSize: "11px",
  padding: theme.spacing(0.25, 0.75),
  borderRadius: theme.spacing(2),
  marginBottom: theme.spacing(0.5),
}));

export const MapResultActions = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(1),
  marginTop: theme.spacing(1),
}));

export const MapActionButton = styled("a")(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  borderRadius: theme.spacing(2.5),
  padding: theme.spacing(1.5, 2.5),
  fontSize: theme.typography.fontSize.xs,
  fontWeight: theme.typography.fontWeights.medium,
  border: `1px solid ${theme.palette.background.DarkBlue}`,
  color: theme.palette.background.DarkBlue,
  backgroundColor: theme.palette.background.paper,
  "&:hover": {
    backgroundColor: theme.palette.background.DarkBlue,
    color: theme.palette.background.paper,  
  },
}));

export const MapContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  minHeight: "600px",
  borderRadius: theme.spacing(1),
  border: `1px solid ${theme.palette.neutral.light}`,
  overflow: "hidden",
  position: "relative",
  [theme.breakpoints.down("md")]: {
    flex: "0 0 auto",
    width: "100%",
    height: "600px",
  },
}));

// export const ButtonText = styled("span")(({ theme }) => ({
export const ButtonText = styled("span")<{
  disabled?: boolean;
}>(({ theme, disabled }) => ({
  marginLeft: theme.spacing(1),
  fontWeight: theme.typography.fontWeights.medium,
  fontSize: theme.typography.fontSizes.md,
  color: theme.palette.text.azurBlue,
  opacity: disabled ? 0.5 : 1,
  cursor: disabled ? 'none' : 'pointer',
  pointerEvents: disabled ? 'none' : 'auto',
}));
export const StyledModal = styled(Modal)(({ theme }) => ({

}));
export const ClearAllButtonText = styled("span")(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.medium,
  fontSize: theme.typography.fontSizes.md,
  color: theme.palette.text.azurBlue,
}));
export const SearchButton = styled(Button)(({ theme }) => ({
  backgroundColor: "none",
  "&:hover": {
    backgroundColor: theme.palette.text.Deeporange,
  },
}));

export const ClearAllButton = styled(Button)(({ theme }) => ({
  borderColor: theme.palette.text.Deeporange,
  color: theme.palette.text.Deeporange,
  "&:hover": {
    color: theme.palette.text.primary,
    backgroundColor: theme.palette.background.loginBg,
  },
}));

export const ErrorContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(5),
  textAlign: "center",
  color: theme.palette.text.red,
}));
export const HospitalContent = styled(Box)(({ theme }) => ({
  padding: "20px",
  textAlign: "center",
}));

export const BackToPageContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  width: "fit-content",
  alignItems: "center",
  gap: theme.spacing(2.5),
  cursor: "pointer",
  marginBottom: theme.spacing(3),
  transition: "all 0.2s ease",
}));

export const BackToPageImage = styled("img")(({ theme }) => ({
  width: "28px",
  height: "28px",
}));

export const BackToPageText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSize.sm,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.primary,
  "&:hover": {
    color: theme.palette.text.Deeporange,
  },
}));
