import {
  Box,
  styled,
  Typography,
  FormControl,
  Select,
  LinearProgress,
  RadioGroup,
  FormControlLabel,
  Button,
  IconButton,
  CircularProgress,
  ListItemIcon,
  MenuItem,
  Menu,
  ListItem,
  Tabs,
  Tab,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

type CustomTheme = {
  typography: {
    fontSizes: Record<string, string>;
    fontWeights: Record<string, number>;
    fontFamily: string;
  };
  shape: {
    borderRadii: Record<string, string>;
    borderSizes: Record<string, string>;
  };
  palette: {
    chips: Record<string, string>;
    button: Record<string, string>;
    neutral: Record<string, string>;
    text: {
      primary: string;
      secondary: string;
      paletteGrey: string;
      error: string;
    };
    background: {
      paper: string;
      uploadFile: string;
    };
  };
  spacing: (value: number) => string;
  shadows: string[];
};

export const UtilityExcelUploadContainer: any = styled(Box)<{ hasMappingOrConfig?: boolean }>(({ theme, hasMappingOrConfig }) => {
  const customTheme = theme as unknown as CustomTheme;
  return {
    width: "100%",
    height: "calc(100vh - 300px)",
    padding: hasMappingOrConfig ? 0 : customTheme.spacing(2),
    display: "flex",
    flexDirection: "column",
    gap: hasMappingOrConfig ? 0 : customTheme.spacing(4),
  };
});

export const UtilityExcelUploadHeader: any = styled(Typography)(({ theme }) => {
  const customTheme = theme as unknown as CustomTheme;
  return {
    fontSize: customTheme.typography.fontSizes.xll,
    fontWeight: customTheme.typography.fontWeights.bold,
    fontFamily: customTheme.typography.fontFamily,
  };
});

export const UtilityExcelUploadDescription: any = styled(Typography)(({ theme }) => {
  const customTheme = theme as unknown as CustomTheme;
  return {
    color: customTheme.palette.text.primary, // Changed from secondary to ensure visibility against white bg
  };
});

export const SelectContainer: any = styled(Box)(({ theme }) => {
  const customTheme = theme as unknown as CustomTheme;
  return {
    marginTop: customTheme.spacing(4),
    maxWidth: theme.spacing(100),
    display: "block",
  };
});

export const StyledFormControl: any = styled(FormControl)(({ theme }) => {
  const customTheme = theme as unknown as CustomTheme;
  return {
    ".MuiOutlinedInput-root": {
      borderRadius: customTheme.shape.borderRadii.medium,
    },
    "& .MuiSelect-select": {
      padding: customTheme.spacing(3),
    },
  };
});

export const StyledSelect: any = styled(Select)(({ theme }) => {
  const customTheme = theme as unknown as CustomTheme;
  return {
    borderRadius: customTheme.shape.borderRadii.medium,
    marginTop: customTheme.spacing(2),
    border: `${customTheme.shape.borderSizes.thin} solid ${customTheme.palette.neutral.lightMedium}`,
    height: customTheme.spacing(12),
    "& fieldset": {
      borderColor: "transparent !important",
      borderRadius: customTheme.shape.borderRadii.medium,
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      boxShadow: customTheme.shadows[4],
    },
    "&.Mui-focused": {
      border: `${customTheme.shape.borderSizes.thin} solid ${customTheme.palette.button.secondary} !important`,
      boxShadow: customTheme.shadows[4],
    },
    "&.Mui-error": {
      border: `${customTheme.shape.borderSizes.thin} solid ${customTheme.palette.text.error}`,
    },
  };
});

export const SelectLabel: any = styled(Typography)(({ theme }) => {
  const customTheme = theme as unknown as CustomTheme;
  return {
    fontWeight: customTheme.typography.fontWeights.medium,
    fontSize: customTheme.typography.fontSizes.sm,
    color: customTheme.palette.text.primary,
  };
});

export const UploadContainer: any = styled(Box)<{ centered?: boolean }>(({ theme, centered }) => {
  return {
    width: "100%",
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "space-between",
    alignItems: centered ? 'center' : 'initial',
  };
});

export const UploadBox: any = styled(Box)<{ isDragging?: boolean; uploadStatus?: string }>(({ theme, isDragging, uploadStatus }) => {
  const customTheme = theme as unknown as CustomTheme;
  return {
    position: 'relative',
    textAlign: "center" as const,
    borderRadius: theme.spacing(2),
    width: "100%",
    minHeight: uploadStatus === 'idle' ? "35vh" : "auto",
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "center",
    marginTop: customTheme.spacing(6),
    transition: 'all 0.2s ease-in-out',
    cursor: (uploadStatus === 'idle' || uploadStatus === 'success') ? 'pointer' : 'default',
    pointerEvents: (uploadStatus === 'idle' || uploadStatus === 'success') ? 'auto' : 'none',
    border: '2px dashed',
    borderColor: isDragging ? (theme.palette as any).button.secondary : theme.palette.grey[300],
    backgroundColor: isDragging ? (theme.palette.background as any).lightBlueActive : theme.palette.grey[50],
    '&:hover': {
      borderColor: uploadStatus === 'idle' ? theme.palette.grey[400] : (isDragging ? (theme.palette as any).button.secondary : theme.palette.grey[300]),
    }
  };
});



export const HeaderWrapper: any = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
}));

export const StyledUploadContainer: any = styled(UploadContainer)(({ theme }) => ({
  paddingTop: theme.spacing(16),
  paddingBottom: theme.spacing(16),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
}));

export const UploadText: any = styled(Box)(({ theme }) => {
  const customTheme = theme as unknown as CustomTheme;
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: customTheme.spacing(2),
    cursor: "pointer",
    fontSize: theme.typography.body1.fontSize,
    flex: 1,
  };
});

export const UploadLink: any = styled("span")(({ theme }) => {
  const customTheme = theme as unknown as CustomTheme;
  return {
    color: customTheme.palette.button.secondary,
    fontWeight: 500,
    cursor: "pointer",
  };
});

export const PointsNote: any = styled(Box)(({ theme }) => {
  const customTheme = theme as unknown as CustomTheme;
  return {
    textAlign: "left" as const,
    alignSelf: "flex-start",
    fontSize: theme.typography.body2.fontSize,
    marginTop: customTheme.spacing(6),
  };
});

export const NoteHeading: any = styled(Typography)(({ theme }) => {
  const customTheme = theme as unknown as CustomTheme;
  return {
    fontWeight: 600,
    color: customTheme.palette.text.paletteGrey,
  };
});

export const StyledList: any = styled("ul")(({ theme }) => {
  const customTheme = theme as unknown as CustomTheme;
  return {
    margin: customTheme.spacing(2) + " 0",
    paddingLeft: customTheme.spacing(6),
    "& li": {
      marginBottom: customTheme.spacing(2),
    },
  };
});



export const StyledProgressBox: any = styled(Box)(({ theme }) => {
  return {
    width: "100%",
    textAlign: "center" as const,
  };
});

export const StyledLinearProgress: any = styled(LinearProgress)(({ theme }) => {
  const customTheme = theme as unknown as CustomTheme;
  return {
    height: customTheme.spacing(4),
    borderRadius: customTheme.spacing(2),
    backgroundColor: customTheme.palette.neutral.lightMedium,
    "& .MuiLinearProgress-bar": {
      backgroundColor: customTheme.palette.chips.senary,
    },
  };
});

export const StyledTypography: any = styled(Typography)(({ theme }) => {
  const customTheme = theme as unknown as CustomTheme;
  return {
    marginTop: customTheme.spacing(4),
    fontSize: customTheme.typography.fontSizes.md,
    color: customTheme.palette.text.primary,
  };
});

export const DirectionContainer: any = styled(Box)(({ theme }) => {
  const customTheme = theme as unknown as CustomTheme;
  return {
    display: "flex",
    flexDirection: "column" as const,
    gap: customTheme.spacing(2),
    marginTop: customTheme.spacing(8),
  };
});

export const DirectionLabel: any = styled(Typography)(({ theme }) => {
  const customTheme = theme as unknown as CustomTheme;
  return {
    fontWeight: customTheme.typography.fontWeights.medium,
    fontSize: customTheme.typography.fontSizes.sm,
    color: customTheme.palette.text.primary,
  };
});

export const StyledRadioGroup: any = styled(RadioGroup)(({ theme }) => {
  const customTheme = theme as unknown as CustomTheme;
  return {
    display: "flex",
    flexDirection: "row" as const,
    gap: customTheme.spacing(8),
    marginTop: customTheme.spacing(2),
  };
});

export const StyledFormControlLabel: any = styled(FormControlLabel)(({ theme }) => {
  const customTheme = theme as unknown as CustomTheme;
  return {
    margin: 0,
    "& .MuiFormControlLabel-label": {
      fontSize: customTheme.typography.fontSizes.md,
      color: customTheme.palette.text.primary,
      marginLeft: customTheme.spacing(2),
    },
    "& .MuiRadio-root": {
      color: customTheme.palette.neutral.lightMedium,
      "&.Mui-checked": {
        color: customTheme.palette.button.secondary,
      },
    },
  };
});



export const DropZoneContent: any = styled(Box)(({ theme }) => {
  return {
    width: '100%',
  };
});

export const UploadIconWrapper: any = styled(Box)<{ success?: boolean }>(({ theme, success }) => {
  const customTheme = theme as unknown as CustomTheme;
  return {
    width: theme.spacing(15),
    height: theme.spacing(15),
    backgroundColor: success ? (theme.palette.background as any).greenVariant : (theme.palette.background as any).lightBlueActive,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: customTheme.spacing(4),
  };
});

export const UploadButton: any = styled(Button)(({ theme }) => {
  const customTheme = theme as unknown as CustomTheme;
  return {
    padding: `${customTheme.spacing(3)} ${customTheme.spacing(8)}`,
    fontWeight: 600,
    fontSize: 15,
    borderRadius: customTheme.shape.borderRadii.medium,
    boxShadow: 'none',
    backgroundColor: customTheme.palette.button.secondary,
    '&:hover': {
      backgroundColor: customTheme.palette.button.secondaryHover,
    },
  };
});

export const InfoPanel: any = styled(Box)(({ theme }) => {
  const customTheme = theme as unknown as CustomTheme;
  return {
    flex: 1,
    padding: customTheme.spacing(6),
    backgroundColor: (theme.palette.background as any).tableHeader,
    borderRadius: customTheme.shape.borderRadii.medium,
    border: `1px solid ${(theme.palette.background as any).light}`,
    minHeight: theme.spacing(80),
    display: 'flex',
    flexDirection: 'column',
    gap: customTheme.spacing(4),
  };
});

export const InfoItem: any = styled(Box)(({ theme }) => {
  const customTheme = theme as unknown as CustomTheme;
  return {
    display: 'flex',
    alignItems: 'flex-start',
    gap: customTheme.spacing(2),
  };
});

export const InfoIconBox: any = styled(Box)(({ theme }) => {
  const customTheme = theme as unknown as CustomTheme;
  return {
    marginTop: customTheme.spacing(1),
    color: (theme.palette as any).button.secondary,
  };
});

export const ConfigActionIconButton: any = styled(IconButton)(({ theme }) => {
  return {
    backgroundColor: theme.palette.common.white,
    border: `1px solid ${theme.palette.grey[300]}`,
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    borderRadius: theme.spacing(2.5),
    padding: theme.spacing(2.5),
    color: theme.palette.grey[900],
    '&:hover': {
      backgroundColor: theme.palette.grey[50],
      borderColor: theme.palette.grey[300],
    },
    '&:hover.delete-btn': {
      backgroundColor: (theme.palette as any).gradients.red.end,
      borderColor: (theme.palette.text as any).error,
      color: (theme.palette.text as any).error,
    },
    marginLeft: theme.spacing(2),
  };
});

export const ReplaceTemplateButton: any = styled(Button)<{ hasError?: boolean }>(({ theme, hasError }) => {
  return {
    textTransform: "none",
    border: `1px solid ${hasError ? theme.palette.error.main : theme.palette.grey[300]}`,
    color: hasError ? theme.palette.error.main : theme.palette.grey[900],
    backgroundColor: theme.palette.common.white,
    fontWeight: 600,
    fontSize: theme.typography.body2.fontSize,
    lineHeight: theme.spacing(3),
    letterSpacing: "-0.01em",
    borderRadius: theme.spacing(2.5),
    padding: `${theme.spacing(2)} ${theme.spacing(4)}`,
    gap: theme.spacing(2),
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    "&:hover": {
        borderColor: hasError ? theme.palette.error.dark : theme.palette.grey[300],
        backgroundColor: hasError ? (theme.palette.error.light + '20') : theme.palette.grey[50],
    },
  };
});

export const UploadCard: any = styled(Box)(({ theme }) => {
  return {
    borderRadius: theme.spacing(3),
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
    border: `1px solid ${theme.palette.grey[200]}`,
    padding: theme.spacing(8),
    width: '100%',
    maxWidth: '700px',
    margin: '0 auto',
  };
});

export const ValidationStatusBox: any = styled(Box)(({ theme }) => {
  return {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${theme.spacing(12)} 0`,
  };
});

export const SuccessStatusBox: any = styled(Box)(({ theme }) => {
  return {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${theme.spacing(12)} 0`,
  };
});

export const MetadataContainer: any = styled(Box)(({ theme }) => {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(6),
    marginTop: theme.spacing(4),
    color: theme.palette.grey[600],
    fontSize: theme.typography.caption.fontSize,
  };
});

export const SuccessActionsBox: any = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(3),
  marginTop: theme.spacing(6),
}));

export const MetadataItem: any = styled(Box)(({ theme }) => {
  return {
    display: 'flex',
    alignItems: 'center',
    color: theme.palette.grey[900],
    gap: theme.spacing(1.5),
    '& span': {
      fontWeight: 600,
      color: theme.palette.grey[900],
    },
  };
});

export const DotSeparator: any = styled(Box)(({ theme }) => {
  return {
    width: theme.spacing(1),
    height: theme.spacing(1),
    backgroundColor: theme.palette.grey[300],
    borderRadius: '50%',
  };
});

export const ProgressBarWrapper: any = styled(Box)(({ theme }) => {
  return {
    width: '100%',
    height: theme.spacing(1.5),
    backgroundColor: theme.palette.grey[200],
    borderRadius: '9999px',
    overflow: 'hidden',
    marginTop: theme.spacing(3),
  };
});

export const ProgressBarFill: any = styled(Box)<{ progress: number }>(({ theme, progress }) => {
  const customTheme = theme as unknown as CustomTheme;
  return {
    height: '100%',
    backgroundColor: (customTheme.palette as any).button.secondary,
    width: `${progress}%`,
    transition: 'width 0.3s ease-out',
  };
});

export const ContinueButton: any = styled(Button)(({ theme }) => {
  const customTheme = theme as unknown as CustomTheme;
  return {
    marginTop: theme.spacing(6),
    padding: `${theme.spacing(2.5)} ${theme.spacing(6)}`,
    borderRadius: theme.spacing(1.5),
    fontSize: theme.typography.body2.fontSize,
    fontWeight: 500,
    textTransform: 'none',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    '&.Mui-disabled': {
      backgroundColor: theme.palette.grey[200],
      color: theme.palette.grey[400],
    },
    '&:not(.Mui-disabled)': {
      backgroundColor: (customTheme.palette as any).button.secondary,
      color: theme.palette.common.white,
      '&:hover': {
        backgroundColor: (customTheme.palette as any).button.secondaryHover,
      },
    },
  };
});

export const CancelButton: any = styled(Button)(({ theme }) => {
  return {
    marginTop: theme.spacing(6),
    padding: `${theme.spacing(2.5)} ${theme.spacing(6)}`,
    borderRadius: theme.spacing(1.5),
    fontSize: theme.typography.body2.fontSize,
    fontWeight: 500,
    textTransform: 'none',
    border: `1px solid ${theme.palette.grey[300]}`,
    backgroundColor: theme.palette.common.white,
    color: theme.palette.text.primary,
    '&:hover': {
      backgroundColor: theme.palette.grey[50],
      borderColor: theme.palette.grey[400],
    },
  };
});
export const StyledIconImg: any = styled('img')<{ size?: number }>(({ theme, size = 20 }) => ({
  width: size,
  height: size,
  display: 'block',
  color: (theme.palette as any).button.secondary, 
  filter: 'brightness(0) saturate(100%) contrast(180%)'
}));

export const CenteredFlexBox: any = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  gap: theme.spacing(4),
}));

export const CenteredColumnFlexBox: any = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
}));

export const UploadActionBox: any = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  paddingTop: theme.spacing(12),
  paddingBottom: theme.spacing(12),
}));

export const FileInfoBox: any = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  marginBottom: theme.spacing(4),
}));

export const StyledCircularProgress: any = styled(CircularProgress)(({ theme }) => ({
  color: (theme.palette as any).button.secondary,
}));

export const StyledMenuItem: any = styled(MenuItem)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(2),
}));

export const StyledListItemIcon: any = styled(ListItemIcon)(({ theme }) => ({
  minWidth: `${theme.spacing(8)} !important`,
}));

export const SuccessCheckCircleIcon: any = styled(CheckCircleIcon)(({ theme }) => ({
  fontSize: theme.spacing(8),
}));
export const StyledMenu: any = styled(Menu)(({ theme }) => ({
  '& .MuiPaper-root': {
    marginTop: theme.spacing(2),
    minWidth: theme.spacing(50),
    borderRadius: theme.spacing(3),
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    border: `1px solid ${theme.palette.grey[200]}`,
    padding: theme.spacing(1),
  },
}));

export const getListItemPrimaryTextProps = (theme: any) => ({
  fontSize: theme.typography.body2.fontSize,
  fontWeight: 500,
  color: theme.palette.text.primary
});

export const UploadLabel: any = styled("label")(({ theme }) => ({
  cursor: "pointer",
  width: "100%",
  display: "block",
}));

export const UploadTitle: any = styled(Typography)(({ theme }) => {
  const customTheme = theme as unknown as CustomTheme;
  return {
    fontWeight: customTheme.typography.fontWeights.bold,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(8),
  };
});

export const UploadBoxNote: any = styled(Typography)(({ theme }) => {
  const customTheme = theme as unknown as CustomTheme;
  return {
    fontWeight: customTheme.typography.fontWeights.bold,
    color: customTheme.palette.text.primary,
    marginBottom: theme.spacing(1),
  };
});

export const ValidatingText: any = styled(Typography)(({ theme }) => {
  const customTheme = theme as unknown as CustomTheme;
  return {
    fontWeight: customTheme.typography.fontWeights.medium,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(3),
  };
});

export const SavedFileName: any = styled(Typography)(({ theme }) => {
  return {
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(4),
  };
});

export const SuccessTitle: any = styled(Typography)(({ theme }) => {
  const customTheme = theme as unknown as CustomTheme;
  return {
    fontWeight: customTheme.typography.fontWeights.bold,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(2),
  };
});

export const SuccessFileName: any = styled(Typography)(({ theme }) => {
  const customTheme = theme as unknown as CustomTheme;
  return {
  fontWeight: customTheme.typography.fontWeights.medium,
  color: theme.palette.text.primary,
  };
});

export const DialogContentBox: any = styled(Box)(({ theme }) => ({
  minWidth: theme.spacing(112.5), // 450px
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(2),
}));

// Template Management Dialog Styles

export const DialogTabPanel: any = styled(Box)(({ theme }) => {
  const customTheme = theme as unknown as CustomTheme;
  return {
    padding: `${customTheme.spacing(3)} 0`,
    maxHeight: customTheme.spacing(75), // Fixed height for scrolling
    overflowY: "auto", // Enable vertical scrolling
  };
});

export const VersionItem: any = styled(ListItem)(({ theme }) => {
  const customTheme = theme as unknown as CustomTheme;
  return {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: customTheme.shape.borderRadii.medium,
    marginBottom: customTheme.spacing(1),
    '&:hover': {
        backgroundColor: theme.palette.grey[50],
    },
  };
});

export const HiddenInput: any = styled('input')({
  display: 'none',
});

// Import Template Styles
export const ImportUploadBox: any = styled(Box)(({ theme }) => {
  const customTheme = theme as unknown as CustomTheme;
  return {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: customTheme.spacing(4),
  };
});

export const UploadIconStyle = {
    fontSize: 60,
    marginBottom: 16, // 2 * 8px spacing
};

export const VersionInfoBox: any = styled(Box)(({ theme }) => {
    const customTheme = theme as unknown as CustomTheme;
    return {
        display: "flex",
        alignItems: "center",
        gap: customTheme.spacing(1),
    };
});

export const VersionNote: any = styled(Typography)(({ theme }) => {
    const customTheme = theme as unknown as CustomTheme;
    return {
        marginTop: customTheme.spacing(0.5),
        color: customTheme.palette.text.primary,
    };
});

export const NoHistoryBox: any = styled(Box)(({ theme }) => ({
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: theme.spacing(50),
}));

export const StyledDialogTabs: any = styled(Tabs)(({ theme }) => {
    const customTheme = theme as unknown as CustomTheme;
    return {
        borderBottom: `1px solid ${theme.palette.divider}`,
        "& .MuiTabs-indicator": {
            backgroundColor: customTheme.palette.button.secondary,
        },
    };
});

export const StyledDialogTab: any = styled(Tab)(({ theme }) => {
    const customTheme = theme as unknown as CustomTheme;
    return {
        textTransform: 'none',
        fontWeight: customTheme.typography.fontWeights.medium,
        fontSize: customTheme.typography.fontSizes.sm,
        color: customTheme.palette.text.primary, // Force dark color for visibility
        opacity: 0.7, // Visual distinction for inactive
        "&.Mui-selected": {
            color: customTheme.palette.button.secondary,
            opacity: 1, // Full opacity for active
        },
        "& .MuiTab-iconWrapper": {
            marginBottom: 0,
            marginRight: theme.spacing(1),
        }
    };
});

export const DragDropUploadBox: any = styled(UploadBox)(({ theme }) => ({
  marginTop: 0,
  minHeight: theme.spacing(62.5),
}));

export const DialogUploadActionBox: any = styled(UploadActionBox)(({ theme }) => ({
  paddingTop: theme.spacing(8),
  paddingBottom: theme.spacing(8),
}));

export const FileTypeHintText: any = styled(Typography)(({ theme }) => {
  const customTheme = theme as unknown as CustomTheme;
  return {
    marginTop: theme.spacing(1),
    color: (customTheme.palette.text as any).paletteGrey || customTheme.palette.text.primary,
    fontSize: theme.typography.caption.fontSize,
    display: 'block',
    fontWeight: 500,
  };
});

export const VersionDateText: any = styled(Typography)(({ theme }) => {
  const customTheme = theme as unknown as CustomTheme;
  return {
    display: "block",
    color: customTheme.palette.text.paletteGrey, // Ensuring visibility
    fontSize: customTheme.typography.fontSizes.sm,
  };
});

export const TemplateIconButton: any = styled(IconButton)(({ theme }) => ({
    marginRight: theme.spacing(1),
}));

export const ManageTemplateButton: any = styled(Button)(({ theme }) => {
    return {
      textTransform: 'none',
      borderRadius: theme.spacing(2.5),
      fontWeight: 600,
      borderColor: theme.palette.grey[300],
      color: theme.palette.grey[900],
      '&:hover': {
          borderColor: theme.palette.grey[400],
          backgroundColor: theme.palette.grey[50],
      }
    };
  });
  
  export const SuccessDownloadIconButton: any = styled(IconButton)(({ theme }) => ({
    border: `1px solid ${theme.palette.grey[300]} `,
    backgroundColor: theme.palette.common.white,
    '&:hover': { backgroundColor: theme.palette.grey[50] }
  }));
  
  export const PreviewDirectionContainer: any = styled(Box)(({ theme }) => ({
      marginBottom: theme.spacing(2),
      display: 'flex',
      gap: theme.spacing(2),
  }));

  export const PreviewDirectionText: any = styled(Typography)(({ theme }) => ({
      fontSize: theme.typography.caption.fontSize,
      color: theme.palette.grey[800], // Ensuring it's visible on white background
      '& strong': {
          color: theme.palette.grey[600],
      }
  }));
