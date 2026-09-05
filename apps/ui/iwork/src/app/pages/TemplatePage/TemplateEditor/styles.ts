import { Box, Typography, Paper, Select, Divider, Stack, InputLabel } from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import InfoIcon from '@mui/icons-material/Info';

export const EditorContainer: any = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
  padding: theme.spacing(3),
}));

export const FormHeader: any = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

export const FieldWrapper: any = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}));

export const InputLabelText: any = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(1),
}));

export const HelperText: any = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.body2.fontSize,
  color: theme.palette.primary.light,
  marginBottom: theme.spacing(2),
  display: 'block',
}));

export const FormSection: any = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  border: `${theme.spacing(0.125)} solid ${theme.palette.grey[200]}`,
  backgroundColor: theme.palette.common.white,
}));

export const StyledSelect: any = styled(Select)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.warning.main, 0.05),
  borderRadius: theme.spacing(2),
  fontSize: theme.typography.body2.fontSize,
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

export const StyledInputLabel: any = styled(InputLabel)(({ theme }) => ({
  '&.MuiInputLabel-shrink': {
    color: theme.palette.primary.main,
    fontWeight: 500,
    backgroundColor: 'white',
    padding: `0 ${theme.spacing(0.5)}`,
  },
  '&.Mui-focused': {
    color: theme.palette.primary.main,
  },
}));

export const EditorGrid: any = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
  marginTop: theme.spacing(2),
}));

export const EditorActionRow: any = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'flex-start',
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

export const EditorPaper: any = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  minHeight: theme.spacing(56.25), // ~450px
  display: 'flex',
  flexDirection: 'column',
  border: `${theme.spacing(0.125)} solid ${theme.palette.divider}`,
}));

export const PreviewSectionContainer: any = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'visible'
})<{ visible: boolean }>(({ theme, visible }) => ({
  display: visible ? 'block' : 'none',
  marginTop: theme.spacing(3),
  animation: 'fadeIn 0.3s ease-in-out',
  '@keyframes fadeIn': {
    from: { opacity: 0, transform: 'translateY(10px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
}));

export const SectionWrapper: any = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

export const SubSectionTitle: any = styled(Typography)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(1),
  fontWeight: 600,
  fontSize: theme.typography.subtitle2.fontSize,
}));

export const StyledInfoIcon: any = styled(InfoIcon)(({ theme }) => ({
  fontSize: theme.spacing(4),
  marginLeft: theme.spacing(0.5),
  color: theme.palette.action.active,
}));

export const StyledDivider: any = styled(Divider)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

export const EditorHeader: any = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: theme.spacing(3),
  marginBottom: theme.spacing(1),
  padding: `0 ${theme.spacing(3)}`,
}));

export const PreviewHeader: any = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

export const ParameterChipContainer: any = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2),
  padding: theme.spacing(2),
  backgroundColor: alpha(theme.palette.warning.main, 0.05),
  borderRadius: theme.spacing(2),
  border: `${theme.spacing(0.125)} solid ${theme.palette.warning.light}`,
}));

export const StyledParameterChip: any = styled(Box)(({ theme }) => ({
  padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
  backgroundColor: alpha(theme.palette.warning.main, 0.1),
  border: `${theme.spacing(0.125)} solid ${theme.palette.warning.main}`,
  borderRadius: theme.spacing(4),
  fontSize: theme.spacing(3),
  fontWeight: 600,
  color: theme.palette.grey[800],
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: theme.palette.warning.main,
    color: theme.palette.common.white,
  },
}));

export const ButtonContainer: any = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(2),
}));

export const EditorTextArea: any = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: `0 ${theme.spacing(3)}`,
  '& .quill': {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  '& .ql-toolbar': {
    border: 'none',
    borderBottom: `${theme.spacing(0.125)} solid ${theme.palette.grey[200]}`,
    backgroundColor: theme.palette.grey[50], // Can be replaced with theme color token if exists
    borderRadius: `${theme.spacing(1)} ${theme.spacing(1)} 0 0`,
  },
  '& .ql-container': {
    border: 'none !important',
    flex: 1,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.body1.fontSize,
    color: theme.palette.text.primary,
  },
  '& .ql-editor': {
    minHeight: theme.spacing(37.5), // ~300px
    backgroundColor: theme.palette.common.white,
    color: theme.palette.grey[900], 
    '&::before': {
      fontStyle: 'normal',
      color: theme.palette.text.disabled,
    }
  }
}));

export const EditorTitle: any = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  fontWeight: 600,
  color: theme.palette.grey[900],
}));

export const EmptyPreviewText: any = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.disabled,
  fontStyle: 'italic',
}));

export const SubjectInputWrapper: any = styled(Box)(({ theme }) => ({
  padding: `${theme.spacing(3)} ${theme.spacing(3)} 0 ${theme.spacing(3)}`,
}));

export const PreviewSubjectBox: any = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  paddingBottom: theme.spacing(2),
  borderBottom: `${theme.spacing(0.125)} solid ${theme.palette.grey[200]}`, // Can use theme.palette.divider
  textAlign: 'left',
}));

export const PreviewEmptyBox: any = styled(Box)(() => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flex: 1,
}));

export const TestParamsBox: any = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(4),
  paddingTop: theme.spacing(3),
  borderTop: `${theme.spacing(0.125)} solid ${theme.palette.grey[200]}`, // theme.palette.divider
  textAlign: 'left',
}));

export const SelectionRow: any = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(3),
  flexDirection: 'row',
  marginTop: theme.spacing(2),
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
  },
}));

export const SelectionColumn: any = styled(Box)({
  flex: 1,
  width: '100%',
});

export const ErrorContainer = styled(Stack)(({ theme }) => ({
  marginBottom: theme.spacing(4),
}));

export const StyledAutocompleteWrapper: any = styled(Box)(() => ({
  width: '100%',
}));

export const QuillWrapper: any = styled(Box)(({ theme }) => ({
  height: theme.spacing(60),
  marginBottom: theme.spacing(8),
  '& .quill': {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
}));

export const StyledPlainTextArea: any = styled(Box)(({ theme }) => ({
  '& .MuiInputBase-root': {
    minHeight: theme.spacing(37.5), // ~300px
    alignItems: 'flex-start',
  },
}));

export const PreviewSubHeader: any = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  textAlign: 'left',
}));

export const PreviewSubTitle: any = styled(Typography)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  fontWeight: 600,
}));

export const PreviewLabel: any = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  color: theme.palette.primary.light,
}));

export const PreviewText: any = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  marginTop: theme.spacing(0.5),
  textAlign: 'left',
}));

export const TestParamsTitle: any = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  marginBottom: theme.spacing(2),
}));

export const TestGrid: any = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(2),
}));

export const ConflictDialogPaper: any = {
  borderRadius: 2,
  minWidth: 420,
  p: 1,
};

export const ConflictDialogTitle: any = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: "1.1rem",
  paddingBottom: 0,
  color: theme.palette.text.primary,
}));

export const ConflictDialogText: any = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  fontSize: "0.95rem",
  lineHeight: 1.6,
}));

export const ConflictHighlight: any = styled("span")(({ theme }) => ({
  fontWeight: 600,
  color: theme.palette.primary.main,
}));

export const ConflictDialogActions: any = styled(Box)(({ theme }) => ({
  padding: `0 ${theme.spacing(3)} ${theme.spacing(2)} ${theme.spacing(3)}`,
  display: "flex",
  justifyContent: "flex-end",
}));
