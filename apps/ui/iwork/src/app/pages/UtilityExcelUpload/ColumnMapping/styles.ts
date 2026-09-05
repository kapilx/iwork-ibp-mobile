import { styled } from "@mui/material/styles";
import { Box, Button, Typography } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import LockIcon from "@mui/icons-material/Lock";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import ClearIcon from "@mui/icons-material/Clear";
import IconButton from "@mui/material/IconButton";

interface CustomTheme {
  spacing: (value: number) => string;
  palette: {
    primary: {
      main: string;
    };
    background: {
      paper: string;
      default: string;
      uploadFile: string;
    };
    neutral: {
      lightMedium: string;
      dark: string;
    };
    button: {
      secondary: string;
    };
    text: {
      primary: string;
      secondary: string;
      paletteGrey: string;
    };
    chips: {
      senary: string;
    };
  };
  shape: {
    borderRadii: {
      small: string;
      medium: string;
    };
    borderSizes: {
      thin: string;
    };
  };
  shadows: string[];
  typography: {
    fontSizes: {
      sm: string;
      md: string;
      lg: string;
    };
    fontWeights: {
      medium: number;
      bold: number;
    };
  };
}

interface ColumnItemProps {
  $isDragging?: boolean;
  $isDragOver?: boolean;
  $isMapped?: boolean;
}

interface TableHeaderProps {
  $isMapped?: boolean;
  $isRequired?: boolean;
  $isDragOver?: boolean;
  $hasError?: boolean;
}

export const MappingContainer: any = styled(Box)(({ theme }) => {
  return {
    backgroundColor: theme.palette.grey[50],
    padding: 0,
    marginTop: 0,
    marginBottom: 0,
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  };
});

export const MappingHeader: any = styled(Box)(({ theme }) => {
  const customTheme = theme as unknown as CustomTheme;
  return {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: customTheme.spacing(2),
    paddingBottom: 0,
    borderBottom: "none",
  };
});

export const MappingSplitView: any = styled(Box)(({ theme }) => {
  return {
    display: "grid",
    gridTemplateColumns: `${theme.spacing(72)} 1fr`,
    gap: theme.spacing(6),
    flex: 1,
    overflow: "hidden",
    backgroundColor: theme.palette.grey[50],
  };
});

export const SourcePanel: any = styled(Box)(({ theme }) => {
  return {
    backgroundColor: theme.palette.common.white,
    borderRadius: "0",
    border: `1px solid ${theme.palette.grey[200]}`,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    height: "100%",
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
  };
});

export const TargetPanel: any = styled(Box)(({ theme }) => {
  return {
    backgroundColor: theme.palette.common.white,
    borderRadius: theme.spacing(3),
    border: `1px solid ${theme.palette.grey[200]}`,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    height: "90%",
    boxShadow: "0 8px 24px rgba(17, 17, 26, 0.06)",
    margin: `${theme.spacing(6)} ${theme.spacing(3)} ${theme.spacing(0)} 0`,
  };
});

export const PanelHeader: any = styled(Box)(({ theme }) => {
  return {
    padding: `${theme.spacing(4)} ${theme.spacing(5)}`,
    borderBottom: `1px solid ${theme.palette.grey[200]}`,
    backgroundColor: theme.palette.grey[50],
  };
});

export const PanelHeaderTop: any = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  width: "100%",
}));

export const PanelContent: any = styled(Box)(({ theme }) => {
  return {
    padding: `${theme.spacing(3)} 0`,
    overflow: "auto",
    flex: 1,
    backgroundColor: theme.palette.common.white,
    maxHeight: "100%",
  };
});

export const ColumnItem: any = styled(Box)<ColumnItemProps>(
  ({ theme, $isDragging, $isDragOver, $isMapped }) => {
    return {
      padding: `${theme.spacing(3)} ${theme.spacing(4)}`, // Increased height
      backgroundColor: theme.palette.common.white,
      border: $isMapped ? `1px solid ${theme.palette.grey[200]}` : `1px solid ${theme.palette.grey[200]}`,
      borderRadius: theme.spacing(2),
      cursor: $isDragging ? "grabbing" : $isMapped ? "not-allowed" : "grab",
      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      marginBottom: theme.spacing(2),
      marginLeft: theme.spacing(4),
      marginRight: theme.spacing(4),
      display: "flex",
      gap: theme.spacing(2),
      alignItems: "flex-start",
      opacity: $isMapped ? 0.4 : $isDragging ? 0.8 : 1,
      boxShadow: $isMapped ? "none" : $isDragging ? "0 8px 16px rgba(0, 0, 0, 0.15)" : "0 1px 2px rgba(0, 0, 0, 0.06)",
      transform: $isDragging ? "scale(1.05)" : "translateY(0)",
      "&:hover": {
        backgroundColor: $isMapped ? theme.palette.common.white : theme.palette.common.white,
        borderColor: $isMapped ? theme.palette.grey[200] : (theme.palette.background as any).yellow,
        boxShadow: $isMapped ? "none" : "0 4px 12px rgba(0, 0, 0, 0.08)",
        transform: $isMapped ? "translateY(0)" : "translateY(-2px)",
      },
    };
  }
);

export const ColumnLabel: any = styled(Box)(({ theme }) => {
  return {
    flex: 1,
    minWidth: 0,
  };
});



export const DragHandle: any = styled(Box)(({ theme }) => {
  return {
    display: "flex",
    alignItems: "center",
    cursor: "grab",
    color: theme.palette.grey[300],
    transition: "color 0.2s ease",
    flexShrink: 0,
    marginTop: theme.spacing(0.5),
    "&:active": {
      cursor: "grabbing",
    },
    "&:hover": {
      color: (theme.palette.background as any).yellow,
    },
  };
});

export const ClearMappingButton: any = styled(Button)(({ theme }) => {
  const customTheme = theme as unknown as CustomTheme;
  return {
    textTransform: "none",
    borderColor: customTheme.palette.button.secondary,
    color: customTheme.palette.button.secondary,
  };
});

export const TableHeaderRow: any = styled(Box)(({ theme }) => {
  const customTheme = theme as unknown as CustomTheme;
  return {
    display: "grid",
    gridTemplateColumns: `repeat(auto-fill, minmax(${theme.spacing(45)}, 1fr))`,
    gap: customTheme.spacing(2),
  };
});

export const TableHeader: any = styled(Box)<TableHeaderProps>(
  ({ theme, $isMapped, $isDragOver, $hasError }) => {
    return {
      padding: `${theme.spacing(3.5)} ${theme.spacing(4)}`,
      border: `1px solid ${$isDragOver ? (theme.palette.background as any).yellow : theme.palette.grey[200]}`,
      backgroundColor: $isDragOver ? (theme.palette.background as any).lightYellow : $isMapped ? theme.palette.background.default : theme.palette.grey[50],
      borderLeft: "none",
      borderRight: `1px solid ${theme.palette.grey[200]}80`,
      minWidth: theme.spacing(37.5),
      width: "auto",
      minHeight: theme.spacing(20),
      transition: "background-color 0.2s ease, border-color 0.2s ease",
      display: "table-cell",
      verticalAlign: "top",
      overflow: "hidden",
      position: "sticky",
      top: 0,
      zIndex: 10,
      borderRadius: "0",
      "&:hover": {
        backgroundColor: $hasError ? (theme.palette as any).gradients.red.end : $isMapped ? theme.palette.background.default : theme.palette.grey[50],
      },
      "&:last-child": {
        borderRight: "none",
      },
    };
  }
);

export const ErrorHeaderIcon: any = styled(WarningAmberIcon)(({ theme }) => ({
  color: theme.palette.error.main,
  fontSize: "1.2rem",
  marginRight: theme.spacing(1),
}));

export const ErrorHeaderContainer: any = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  color: theme.palette.error.main,
  fontSize: theme.typography.body2.fontSize,
  fontWeight: theme.typography.fontWeightBold,
  marginTop: theme.spacing(1),
}));

export const MappedInfo: any = styled(Box)(({ theme }) => {
  return {
    marginTop: theme.spacing(2),
    display: "inline-flex",
    alignItems: "center",
    gap: theme.spacing(1.5),
    padding: `${theme.spacing(1)} ${theme.spacing(3)}`,
    backgroundColor: (theme.palette.background as any).lightYellow,
    borderRadius: theme.spacing(4),
    border: "none",
    maxWidth: "100%",
  };
});

export const TableHeaderContent: any = styled(Box)(({ theme }) => {
  return {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    minHeight: "100%",
  };
});

export const ConfigureLink: any = styled("span")(({ theme }) => {
  const customTheme = theme as unknown as CustomTheme;
  return {
    color: customTheme.palette.button.secondary,
    cursor: "pointer",
    fontSize: customTheme.typography.fontSizes.sm,
    fontWeight: customTheme.typography.fontWeights.medium,
    textDecoration: "underline",
    display: "block",
    marginTop: customTheme.spacing(0.5),
    "&:hover": {
      color: customTheme.palette.primary.main,
    },
  };
});

// Table specific styled components
export const MappingTable: any = styled("table")(() => ({
  width: "max-content",
  minWidth: "100%",
  borderCollapse: "collapse",
}));

export const HeaderActionsContainer: any = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  marginBottom: theme.spacing(2),
  minHeight: theme.spacing(4.5),
}));

export const IconButtonGroup: any = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(0.5),
  marginTop: theme.spacing(-0.5),
}));

export const UnmappedHeaderContent: any = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  flex: 1,
  gap: theme.spacing(2),
}));

export const EmptyStateContainer: any = styled("td")(({ theme }) => ({
  border: "none",
  backgroundColor: theme.palette.common.white,
}));

export const EmptyStateContent: any = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: theme.spacing(12),
  textAlign: "center",
  position: "sticky",
  left: 0,
  right: 0,
}));

export const EmptyStateIconBox: any = styled(Box)(({ theme }) => ({
  width: theme.spacing(15),
  height: theme.spacing(15),
  backgroundColor: theme.palette.grey[100],
  borderRadius: theme.spacing(3),
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: theme.spacing(5),
  border: `1px solid ${theme.palette.grey[200]}`,
}));

export const TableRow: any = styled("tr")(({ theme }) => ({
  transition: "background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
  borderBottom: `1px solid ${theme.palette.grey[100]}`,
  "&:hover": {
    backgroundColor: theme.palette.background.default,
  },
  "&:nth-of-type(even)": {
    backgroundColor: theme.palette.grey[50],
  },
  "&:nth-of-type(even):hover": {
    backgroundColor: theme.palette.background.default,
  },
}));

interface TableCellProps {
  $hasError?: boolean;
  $isInvalid?: boolean;
}

export const TableCell: any = styled("td")<TableCellProps>(({ theme, $hasError, $isInvalid }) => ({
  padding: `${theme.spacing(4)} ${theme.spacing(4)}`,
  fontSize: theme.typography.caption.fontSize,
  color: theme.palette.grey[700],
  borderRight: `1px solid ${theme.palette.grey[200]}80`,
  verticalAlign: "top",
    backgroundColor: ($hasError || $isInvalid) ? `${(theme.palette as any).gradients.red.end} !important` : "inherit",
  "&:last-child": {
    borderRight: "none",
  },
}));

export const RequiredIndicator: any = styled("span")(({ theme }) => ({
  color: theme.palette.error.main,
  marginLeft: theme.spacing(1),
}));

export const MappedSourceText: any = styled(Box)(({ theme }) => ({
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  maxWidth: theme.spacing(30),
}));

export const HiddenPlaceholder: any = styled("div")(({ theme }) => ({
  visibility: "hidden",
  height: 0,
  width: 0,
  overflow: "hidden",
}));

export const FooterContainer: any = styled(Box)(({ theme }) => ({
  borderTop: `1px solid ${theme.palette.grey[200]}`,
  backgroundColor: theme.palette.common.white,
  padding: `0px ${theme.spacing(6)}`,
  paddingTop: theme.spacing(4),
  marginTop: "0",
  boxShadow: "0 -2px 8px rgba(0, 0, 0, 0.04)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
}));

export const FooterLeftSection: any = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(4),
}));

export const FooterDot: any = styled(Box)(({ theme }) => ({
  width: theme.spacing(1),
  height: theme.spacing(1),
  backgroundColor: theme.palette.grey[300],
  borderRadius: "50%",
}));

export const FooterButtonGroup: any = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(3),
  alignItems: "center",
}));

// Configuration Table Styled Components
export const ConfigTableContainer: any = styled(Box)(({ theme }) => ({
  padding: "0",
  backgroundColor: theme.palette.grey[50],
  minHeight: `calc(100vh - ${theme.spacing(70)})`,
}));

export const ConfigSuccessBanner: any = styled(Box)(({ theme }) => ({
  background: `linear-gradient(90deg, ${(theme.palette as any).gradients.teal.end} 0%, ${(theme.palette.background as any).greenVariant} 100%)`,
  padding: `${theme.spacing(4)} ${theme.spacing(8)}`,
  marginBottom: "0",
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(3),
  borderBottom: `1px solid ${(theme.palette.background as any).greenVariant}`,
}));

export const BannerIconCircle: any = styled(Box)(({ theme }) => ({
  width: theme.spacing(4),
  height: theme.spacing(4),
  borderRadius: "50%",
  backgroundColor: (theme.palette.background as any).completedProgressColor,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
}));

export const BannerTitle: any = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.body2.fontSize,
  fontWeight: 600,
  color: theme.palette.grey[900],
  lineHeight: theme.spacing(5),
}));

export const BannerSubText: any = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.caption.fontSize,
  color: theme.palette.grey[600],
  lineHeight: theme.spacing(4),
  marginTop: theme.spacing(0.5),
}));

export const BannerCheckIcon: any = styled(CheckIcon)(({ theme }) => ({
  color: (theme.palette.background as any).greenVariant,
  fontSize: theme.spacing(2.5),
}));

export const ConfigBannerContent: any = styled(Box)({
  flex: 1,
});

export const ConfigActions: any = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
}));

export const ConfigTableWrapper: any = styled(Box)(({ theme }) => ({
  paddingTop: theme.spacing(5),
  backgroundColor: theme.palette.common.white,
  margin: "0",
  border: "none",
  borderRadius: "0",
  boxShadow: "none",
  overflow: "hidden",
}));

export const ConfigTable: any = styled("table")(({ theme }) => ({
  width: "100%",
  borderCollapse: "collapse",
  border: `1px solid ${theme.palette.grey[200]}`,
  borderRadius: theme.spacing(2),
  maxHeight: `calc(100vh - ${theme.spacing(105)})`,
  overflow: "auto",
  display: "block",
}));

export const ConfigTableHead: any = styled("thead")({
  position: "sticky",
  top: 0,
  zIndex: 10,
});

interface ConfigTableHeaderCellProps {
  $isLast?: boolean;
}


export const ConfigTableHeaderCell: any = styled("th")<ConfigTableHeaderCellProps>(
  ({ $isLast, theme }) => ({
    padding: `${theme.spacing(3)} ${theme.spacing(4)}`,
    textAlign: "left",
    fontSize: theme.spacing(2.75),
    fontWeight: 700,
    backgroundColor: theme.palette.background.default,
    borderBottom: `1px solid ${theme.palette.grey[200]}`,
    borderRight: $isLast ? "none" : `1px solid ${theme.palette.grey[50]}`,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    whiteSpace: "nowrap",
    width: "1%",
  })
);

export const ConfigHeaderContent: any = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

export const ConfigHeaderTitle: any = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  maxWidth: theme.spacing(30),
  "& > :first-of-type": {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    flex: 1,
    minWidth: 0,
  }
}));

export const ConfigRequiredMark: any = styled("span")(({ theme }) => ({
  color: theme.palette.error.main,
  fontSize: theme.spacing(3.5),
  flexShrink: 0,
}));

export const BadgeCheckIcon: any = styled(CheckIcon)(({ theme }) => ({
  fontSize: theme.spacing(3),

}));

export const ConfigMappedBadge: any = styled(Box)(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: theme.spacing(1),
  fontSize: theme.spacing(2.5),
  fontWeight: 600,
  padding: `${theme.spacing(0.5)} ${theme.spacing(2)}`,
  backgroundColor: (theme.palette.background as any).lightYellow,
    borderRadius: theme.spacing(4),
  border: `1px solid ${(theme.palette as any).kpiColors.yellow}`,
  width: "fit-content",
  textTransform: "uppercase",
  maxWidth: theme.spacing(27.5),
  "& > span": {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    flex: 1,
    minWidth: 0,
  }
}));

interface ConfigTableDataCellProps {
  $isLast?: boolean;
  $isInvalid?: boolean;
}

export const ConfigTableDataCell: any = styled("td")<ConfigTableDataCellProps>(
  ({ $isLast, theme, $isInvalid }) => ({
    padding: `${theme.spacing(3)} ${theme.spacing(4)}`,
    fontSize: theme.typography.body2.fontSize,
    color: theme.palette.grey[700],
    borderBottom: `1px solid ${theme.palette.grey[100]}`,
    borderRight: $isLast ? "none" : `1px solid ${theme.palette.grey[50]}`,
    whiteSpace: "nowrap",
    width: "1%",
    backgroundColor: $isInvalid ? `${(theme.palette as any).gradients.red.end} !important` : "inherit",
  })
);

export const ConfigTableRow: any = styled("tr")(({ theme }) => ({
  transition: "background-color 0.15s ease",
  "&:hover": {
    backgroundColor: theme.palette.background.default,
  },
}));

export const ColumnHeaderRow: any = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(2),
  marginBottom: theme.spacing(1.5)
}));

export const BoldText: any = styled("span")(({ theme }) => ({
  fontWeight: 600,
  color: theme.palette.grey[900]
}));

export const ColumnLabelText: any = styled(Typography)<{ $isMapped?: boolean }>(({ theme, $isMapped }) => {
  return {
    fontSize: theme.typography.body2.fontSize,
    fontWeight: 600,
    color: $isMapped ? theme.palette.grey[400] : theme.palette.grey[900],
    lineHeight: 1.5,
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    flex: 1
  };
});

export const MappedIconWrapper: any = styled(Box)(({ theme }) => ({
  flexShrink: 0,
  display: "flex",
  alignItems: "center"
}));

export const ExampleText: any = styled(Typography)(({ theme }) => {
  return {
    fontSize: theme.spacing(3),
    color: theme.palette.grey[800],
    display: "block",
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap'
  };
});

export const FooterOutlinedButton: any = styled(Button)(({ theme }) => ({
  textTransform: "none",
  borderColor: theme.palette.grey[200],
  color: theme.palette.grey[700],
  fontSize: theme.typography.body2.fontSize,
  fontWeight: 500,
  padding: `${theme.spacing(1.5)} ${theme.spacing(4)}`,
  "&:hover": {
    borderColor: theme.palette.grey[300],
    backgroundColor: theme.palette.grey[50],
  },
}));

export const FooterContainedButton: any = styled(Button)(({ theme }) => ({
  textTransform: "none",
  backgroundColor: theme.palette.grey[900],
  color: theme.palette.common.white,
  fontSize: theme.typography.body2.fontSize,
  fontWeight: 500,
  padding: `${theme.spacing(1.5)} ${theme.spacing(5)}`,
  "&:hover": {
    backgroundColor: theme.palette.grey[800],
  },
  "&:disabled": {
    backgroundColor: theme.palette.grey[300],
    color: theme.palette.grey[500],
  },
}));

export const SaveConfigButton: any = styled(FooterContainedButton)(({ theme }) => ({
  marginLeft: theme.spacing(2),
}));

export const ExportErrorsButton: any = styled(FooterOutlinedButton)(({ theme }) => ({
  borderColor: theme.palette.error.main,
  color: theme.palette.error.main,
  '&:hover': {
    borderColor: theme.palette.error.dark,
    backgroundColor: (theme.palette as any).kpiColors?.redLight || theme.palette.error.light,
    color: theme.palette.error.dark
  }
}));

export const FooterCancelButton: any = styled(FooterOutlinedButton)(({ theme }) => ({
  marginRight: theme.spacing(2),
}));

export const ManageTemplatesIconButton: any = styled(IconButton)(({ theme }) => ({
    marginRight: theme.spacing(1),
}));

export const EllipsisText: any = styled(Typography)(({ theme }) => ({
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: 'block'
}));

export const HeaderLabelText: any = styled(Typography)(({ theme }) => {
  return {
    fontWeight: 700,
    fontSize: theme.spacing(3),
    color: theme.palette.grey[900],
    lineHeight: 1.4,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: theme.spacing(30),
    display: 'block'
  };
});

export const TablePanelContent: any = styled(PanelContent)({
  padding: 0,
  overflow: "auto"
});

export const PanelHeaderSubText: any = styled(Typography)(({ theme }) => {
  const customTheme = theme as unknown as CustomTheme;
  return {
    fontSize: theme.spacing(3),
    color: theme.palette.grey[800],
    lineHeight: "1.5",
    marginTop: customTheme.spacing(0.5),
  };
});

export const StyledDragIndicatorIcon: any = styled(DragIndicatorIcon)(({ theme }) => ({
  fontSize: theme.spacing(4),
  fontWeight: "bold",
}));

export const StyledLockIcon: any = styled(LockIcon)(({ theme }) => ({
  fontSize: theme.spacing(3.5),
  color: theme.palette.grey[400],
  flexShrink: 0,
}));

export const StyledWarningAmberIcon: any = styled(WarningAmberIcon)(({ theme }) => ({
  color: theme.palette.grey[900],
  fontSize: '1rem',
  marginLeft: theme.spacing(0.5),
  verticalAlign: 'middle',
}));

export const ConfigIconButton: any = styled(IconButton)(({ theme }) => ({
  padding: theme.spacing(0.5),
}));

export const StyledSettingsIcon: any = styled(SettingsOutlinedIcon)(({ theme }) => ({
  fontSize: theme.spacing(3.5),
}));

export const StyledClearIcon: any = styled(ClearIcon)(({ theme }) => ({
  fontSize: theme.spacing(3.5),
  color: theme.palette.grey[600],
  transition: "color 0.2s ease",
  "&:hover": {
    color: theme.palette.error.main,
  },
}));

// Template Preview Table Components
export const PreviewTableContainer: any = styled(Box)(({ theme }) => ({
  maxHeight: "60vh",
  overflow: "auto",
  border: `1px solid ${theme.palette.grey[200]}`,
  borderRadius: theme.spacing(1),
  backgroundColor: theme.palette.common.white,
}));

export const PreviewTable: any = styled("table")({
  width: "100%",
  borderCollapse: "collapse",
});

export const PreviewTableHead: any = styled("thead")({
  position: "sticky",
  top: 0,
  zIndex: 2,
});

export const PreviewTableHeadCell: any = styled("th")(({ theme }) => ({
  padding: `${theme.spacing(2.5)} ${theme.spacing(4)}`,
  textAlign: "left",
  fontSize: theme.typography.body2.fontSize,
  fontWeight: "bold",
  backgroundColor: theme.palette.grey[50],
  borderBottom: `1px solid ${theme.palette.grey[200]}`,
  color: theme.palette.grey[900],
}));

export const PreviewTableBodyCell: any = styled("td")(({ theme }) => ({
  padding: `${theme.spacing(2.5)} ${theme.spacing(4)}`,
  fontSize: theme.typography.body2.fontSize,
  borderBottom: `1px solid ${theme.palette.grey[100]}`,
  color: theme.palette.grey[700],
  wordBreak: "break-word",
}));

export const PreviewTableRow: any = styled("tr")(({ theme }) => ({
  transition: "background-color 0.15s ease",
  "&:last-child td": {
    borderBottom: "none",
  },
  "&:hover": {
    backgroundColor: theme.palette.grey[50],
  },
}));

export const PreviewEmptyCell: any = styled(PreviewTableBodyCell)(({ theme }) => ({
  padding: theme.spacing(6),
  textAlign: "center",
  color: theme.palette.grey[500],
}));

export const SaveButtonWrapper: any = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'flex-end',
  marginTop: theme.spacing(3),
  marginBottom: theme.spacing(4),
}));

export const StyledCheckIcon: any = styled(CheckIcon)(({ theme }) => ({
  fontSize: theme.spacing(2.5),
  color: theme.palette.grey[700],
  fontWeight: "bold",
}));

export const MappedSourceTypography: any = styled(Typography)(({ theme }) => ({
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: theme.spacing(30),
  display: 'block',
  fontSize: theme.spacing(2.5),
  fontWeight: "700",
  color: theme.palette.grey[700],
  letterSpacing: "0.05em",
}));

export const UnmappedHeaderLabel: any = styled("span")(({ theme }) => ({
  display: 'block',
  fontSize: theme.spacing(3),
  fontWeight: "700",
  color: theme.palette.grey[700],
  letterSpacing: "0.05em",
}));

export const UnmappedHeaderStatus: any = styled(Typography)<{ $isDraggingOver?: boolean }>(({ $isDraggingOver, theme }) => ({
  variant: "caption",
  fontSize: theme.spacing(2.5),
  color: theme.palette.grey[800], // Changed to use theme.palette
  textAlign: "center" as const,
  fontStyle: "italic",
  fontWeight: "400",
}));

export const EmptyStateTitle: any = styled(Typography)(({ theme }) => ({
  variant: "h6",
  fontSize: theme.spacing(4.5),
  fontWeight: "600",
  color: theme.palette.grey[900],
  marginBottom: theme.spacing(2),
}));

export const EmptyStateSubtitle: any = styled(Typography)(({ theme }) => ({
  variant: "body2",
  fontSize: theme.spacing(3.5),
  color: theme.palette.grey[800],
  marginTop: theme.spacing(1),
}));

export const FooterRequiredText: any = styled(Typography)(({ theme }) => ({
  variant: "body2",
  fontSize: theme.typography.body2.fontSize,
  color: theme.palette.grey[800],
  margin: 0,
}));

export const FooterRemainingText: any = styled(Typography)(({ theme }) => ({
  variant: "body2",
  fontSize: theme.typography.caption.fontSize,
  color: theme.palette.grey[800],
  margin: 0,
}));

export const FooterWarningText: any = styled(Typography)(({ theme }) => ({
  variant: "body2",
  fontSize: theme.typography.caption.fontSize,
  color: (theme.palette as any).kpiColors?.red || theme.palette.warning.main,
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  margin: 0,
}));

export const PanelHeaderTitle: any = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  fontSize: theme.typography.body2.fontSize,
  color: theme.palette.grey[900],
  lineHeight: 1.5,
}));

export const ConfirmDialogContent: any = styled(Box)(({ theme }) => ({
  minWidth: theme.spacing(112.5),
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(2),
}));

export const EmptyStateIcon: any = styled('svg')(({ theme }) => ({
  stroke: theme.palette.grey[400],
}));


export const ErrorLabelText: any = styled(Typography)(({ theme }) => ({
  fontWeight: 'bold',
}));
