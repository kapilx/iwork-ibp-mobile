import {
  Box,
  CircularProgress,
  FormControl,
  Select,
  styled,
} from "@mui/material";

export const Wrapper = styled(Box)(({ theme }) => ({
  width: "100%",
  fontFamily: theme.typography.fontFamily,
}));

export const GridContainer = styled("div")(({ theme }) => ({
  width: "100%",
  "& .ag-header": {
    borderRadius: `${theme.shape.borderRadii.semiRounded} ${theme.shape.borderRadii.semiRounded} 0 0`,
  },
  "& .ag-theme-alpine": {
    fontFamily: theme.typography.fontFamily, // Override ag-grid fontFamily
  },
  "& .ag-header-cell-text": {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.regular,
    color: theme.palette.neutral.dark,
  },
  "& .ag-cell": {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.regular,
    color: theme.palette.text.primary,
    padding: `${theme.spacing(2.5, 3)}`,
    paddingRight: `${theme.spacing(5.7)} `,
    paddingLeft: `${theme.spacing(4.6)} `,
  },
  "& .right-aligned-cell": {
    textAlign: "right",
  },
  "& .right-aligned-clickable-cell": {
    textAlign: "right",
    cursor: "pointer",
    color: theme.palette.text.linkBlue,
    textDecoration: "underline",
  },
  "& .ag-header-cell.right-aligned-header": {
    justifyContent: "flex-end",
  },
  "& .ag-header-cell.right-aligned-header .ag-header-cell-label": {
    justifyContent: "flex-end",
    display: "flex",
    width: "100%",
  },
  "& .ag-cell:focus, .ag-cell:focus-within": {
    border: "1px solid transparent !important",
  },
}));

export const Loader = styled(Box)(({ theme }) => ({
  position: "fixed",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: theme.zIndex.modal + 1,
  background: "rgba(255, 255, 255, 0.5)",
}));

export const PaginationContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  marginTop: theme.spacing(2.5),
  gap: theme.spacing(2),
  [theme.breakpoints.down("md")]: {
    flexWrap: "wrap",
    justifyContent: "center",
    gap: theme.spacing(1.5),
  },
  [theme.breakpoints.down("sm")]: {
    flexDirection: "column",
    alignItems: "center",
    gap: theme.spacing(2),
  },
}));

export const StyledSelect = styled(Select)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  border: "none",
  boxShadow: "none",
  ".MuiOutlinedInput-notchedOutline": {
    border: "none",
  },
  padding: "0px",
  "& .MuiSelect-icon": {
    right: 0,
  },
  "& .MuiInputBase-input": {
    padding: 0,
    paddingLeft: theme.spacing(1),
    paddingRight: `${theme.spacing(6)} !important`,
  },
}));

interface StyledAgGridWrapperProps {
  height?: number;
}

export const StyledAgGridWrapper = styled(Box)<StyledAgGridWrapperProps>(
  ({ theme, height }) => ({
    ...(height !== undefined && {
      height: `${height}px`,
    }),
    "&.ag-theme-alpine": {
      border: "none !important",
    },
    ".ag-root-wrapper": {
      border: "none !important",
    },
    ".ag-header": {
      borderBottom: "none !important",
      backgroundColor: theme.palette.background.tableHeader,
    },
    ".ag-body-viewport": {
      border: "none !important",
    },
    // Loading overlay scrim. ag-grid also sets a dark scrim under
    // `@media (prefers-color-scheme: dark)` even for the light alpine theme, so
    // pin it here — the app is light-only and the loader must not change with
    // the OS theme.
    ".ag-overlay-loading-wrapper": {
      backgroundColor: "rgba(255, 255, 255, 0.66) !important",
    },

    ".ag-header-cell img[alt='sort']": {
      display: "none",
      opacity: 0,
      transition: "opacity 0.2s ease, visibility 0.2s ease",
    },

    ".ag-header-cell:hover img[alt='sort']": {
      display: "block",
      opacity: 1,
    },

    ".ag-row.ag-row-pinned": {
      borderBottom: `2px solid ${theme.palette.neutral.tableBorder}`,
    },

    // Optional: preserve space to prevent layout shift
    ".ag-header-cell": {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    },
  })
);

export const ServerSideGridStyledFormControl = styled(FormControl)(
  ({ theme }) => ({
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    [theme.breakpoints.down("sm")]: {
      flexWrap: "wrap",
      justifyContent: "center",
      gap: theme.spacing(1),
    },
  })
);

export const StyledBox = styled(Box)(({ theme }) => ({
  fontWeight: 300,
  fontSize: theme.typography.fontSizes.sm,
  [theme.breakpoints.down("sm")]: {
    fontSize: theme.typography.fontSizes.xs,
  },
}));
