import { styled, alpha } from "@mui/material/styles";
import { Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, Button, Select, IconButton, FormControl } from "@mui/material";

export const StyledDialog: any = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    maxWidth: theme.spacing(117.5), // 470px
    width: '100%',
    borderRadius: theme.spacing(4), 
    boxShadow: theme.shadows[4],
  },
}));

export const StyledDialogTitle: any = styled(DialogTitle)(({ theme }) => ({
  padding: `${theme.spacing(5)} ${theme.spacing(6)} ${theme.spacing(3)}`, // 20px 24px 12px
  borderBottom: `1px solid ${theme.palette.grey[100]}`,
}));

export const DialogHeaderContent: any = styled(Box)({
  display: 'flex',
  alignItems: 'start',
  justifyContent: 'space-between',
});

export const TitleText: any = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  fontSize: (theme.typography as any).fontSizes?.lg || theme.spacing(4.5), // 18px
  color: theme.palette.grey[900],
  lineHeight: 1.3,
}));

export const SubTitleText: any = styled(Typography)(({ theme }) => ({
  fontSize: (theme.typography as any).fontSizes?.xss || theme.spacing(3.25), // 13px
  color: theme.palette.grey[800],
  marginTop: theme.spacing(1),
}));

export const StyledDialogContent: any = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(6), // 24px
  backgroundColor: theme.palette.common.white,
  minHeight: theme.spacing(80), // 320px
  overflowY: 'auto',
}));

export const SectionTitle: any = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.caption.fontSize, // 12px usually
  fontWeight: 600,
  color: theme.palette.grey[700],
  textTransform: 'uppercase',
  marginBottom: theme.spacing(2),
  letterSpacing: '0.05em',
}));

export const InfoBox: any = styled(Box)(({ theme }) => ({
  padding: `${theme.spacing(3)} ${theme.spacing(4)}`, // 12px 16px
  fontSize: theme.typography.body2.fontSize,
  backgroundColor: theme.palette.grey[50],
  borderRadius: theme.spacing(2), // 8px
  border: `1px solid ${theme.palette.grey[200]}`,
  color: theme.palette.grey[900],
  fontWeight: 500,
  wordBreak: 'break-all',
}));

export const StyledSelect: any = styled(Select)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.warning.main, 0.05),
  borderRadius: theme.spacing(2), // 8px
  fontSize: theme.typography.body2.fontSize,
  height: theme.spacing(12), // 48px -- wait, select often needs more specific height. 12 * 4 = 48px. 
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.warning.light,
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.warning.main,
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.warning.dark,
  },
}));

export const PreviewContainer: any = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

export const PreviewFormatText: any = styled(Typography)(({ theme }) => ({
  fontSize: theme.spacing(2.75), // 11px
  color: theme.palette.grey[800],
  marginBottom: theme.spacing(2),
  fontWeight: 500,
}));

export const PreviewItem: any = styled(Box)(({ theme }) => ({
  padding: `${theme.spacing(2)} ${theme.spacing(3)}`,
  backgroundColor: theme.palette.grey[50],
  borderRadius: theme.spacing(1.5), // 6px
  fontSize: (theme.typography as any).fontSizes?.xss || theme.spacing(3.25), // 13px
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(3),
}));

export const PreviewSourceText: any = styled(Typography)(({ theme }) => ({
  fontFamily: 'monospace',
  color: theme.palette.grey[800],
  minWidth: theme.spacing(20), // 180px
}));

export const PreviewTargetText: any = styled(Typography)(({ theme }) => ({
  fontFamily: 'monospace',
  color: theme.palette.grey[900],
  fontWeight: 500,
}));

export const StyledArrowIcon: any = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'large'
})<{ large?: boolean }>(({ large, theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.grey[400],
  '& .MuiSvgIcon-root': {
    fontSize: large ? (theme.typography as any).fontSizes?.lg || theme.spacing(4.5) : theme.spacing(3.5), // 18px or 14px
  }
}));

export const MappingList: any = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
}));

export const MappingRow: any = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(4),
}));

export const MappingLabel: any = styled(Box)(({ theme }) => ({
  fontSize: theme.typography.body2.fontSize,
  color: theme.palette.grey[700],
  fontWeight: 500,
  width: theme.spacing(8),
}));

export const FlexFormControl: any = styled(FormControl)({
  flex: 1,
});

export const MappingPreviewContainer: any = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.grey[50],
  border: `1px solid ${theme.palette.grey[200]}`,
  borderRadius: theme.spacing(2), // 8px
  padding: `${theme.spacing(3)} ${theme.spacing(4)}`,
}));

export const MappingPreviewRow: any = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(4),
  fontSize: (theme.typography as any).fontSizes?.xss || theme.spacing(3.25), // 13px
  marginBottom: theme.spacing(1),
  '&:last-child': {
    marginBottom: 0,
  },
}));

export const MappingPreviewLabel: any = styled(Box)(({ theme }) => ({
  fontFamily: 'monospace',
  color: theme.palette.grey[800],
  minWidth: theme.spacing(8),
}));

export const MappingPreviewValue: any = styled(Box)(({ theme }) => ({
  fontFamily: 'monospace',
  color: theme.palette.grey[900],
  fontWeight: 500,
}));

export const CloseIconButton: any = styled(IconButton)(({ theme }) => ({
  color: theme.palette.grey[800],
  padding: theme.spacing(2),
  borderRadius: theme.spacing(2), // 8px
  '&:hover': {
    backgroundColor: theme.palette.grey[100],
  },
}));

export const SourceColumnSection: any = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(8),
  marginTop: theme.spacing(4),
}));

export const ConfigItem: any = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'size'
})<{ size?: 'small' | 'medium' | 'large' }>(({ theme, size }) => ({
  marginBottom: size === 'small' ? theme.spacing(4) : size === 'large' ? theme.spacing(8) : theme.spacing(6),
}));

export const PreviewSection: any = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
}));

export const HeaderTitleWrapper: any = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
});

export const StyledDialogActions: any = styled(DialogActions)(({ theme }) => ({
  padding: `${theme.spacing(4)} ${theme.spacing(6)}`,
  backgroundColor: theme.palette.grey[50],
  borderTop: `1px solid ${theme.palette.grey[200]}`,
  gap: theme.spacing(3),
}));

export const CancelButton: any = styled(Button)(({ theme }) => ({
  flex: 1,
  textTransform: 'none',
  borderColor: theme.palette.grey[300],
  color: theme.palette.grey[700],
  fontWeight: 500,
  fontSize: theme.spacing(3.75), // 15px
  padding: theme.spacing(2.5),
  borderRadius: theme.spacing(2), // 8px
  backgroundColor: theme.palette.common.white,
  '&:hover': {
    borderColor: theme.palette.grey[400],
    backgroundColor: theme.palette.grey[100],
  },
}));

export const ApplyButton: any = styled(Button)(({ theme }) => ({
  flex: 1,
  textTransform: 'none',
  backgroundColor: theme.palette.grey[900],
  color: theme.palette.common.white,
  fontWeight: 600,
  fontSize: theme.spacing(3.75), // 15px
  padding: theme.spacing(2.5),
  borderRadius: theme.spacing(2), // 8px
  '&:hover': {
    backgroundColor: theme.palette.grey[800],
  },
  '&:disabled': {
    backgroundColor: theme.palette.grey[200],
    color: theme.palette.grey[400],
  },
}));
