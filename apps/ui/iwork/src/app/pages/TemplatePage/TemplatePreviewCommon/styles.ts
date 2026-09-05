import { styled, Box, Typography, alpha } from '@mui/material';

export const PreviewPaper: any = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  backgroundColor: theme.palette.common.white,
  border: `${theme.spacing(0.125)} solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(2),
  boxShadow: `0  ${theme.spacing(0.5)} ${theme.spacing(1)} ${alpha(theme.palette.primary.main, 0.1)}`,
  marginTop: theme.spacing(2),
  width: '100%',
  height: '100%',
}));

export const PreviewContentBox: any = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(3),
  padding: theme.spacing(4),
  backgroundColor: theme.palette.grey[50],
  borderRadius: theme.spacing(1),
  border: `${theme.spacing(0.125)} dashed ${theme.palette.grey[300]}`,
  minHeight: theme.spacing(43.75), // ~350px
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  overflowY: 'auto'
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

export const PreviewSubjectBox: any = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  paddingBottom: theme.spacing(2),
  borderBottom: `${theme.spacing(0.125)} solid ${theme.palette.grey[200]}`,
  textAlign: 'left',
}));

export const PreviewLabel: any = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.light,
  fontWeight: 700,
  textTransform: 'capitalize',
  fontSize: `${theme.spacing(3)} !important`
}));

export const PreviewText: any = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  marginTop: theme.spacing(0.5),
  textAlign: 'left',
}));

export const StyledMarkdownPreview: any = styled(Box)(({ theme }) => ({
  width: '100%',
  color: theme.palette.common.black + ' !important',
  '& h1, & h2, & h3, & h4, & h5, & h6, & p, & span, & div, & strong, & li, & a': {
    color: theme.palette.common.black + ' !important',
  },
  '& h1': {
    fontSize: theme.typography.h5.fontSize,
    marginBottom: theme.spacing(2),
    borderBottom: `${theme.spacing(0.125)} solid ${theme.palette.grey[200]}`,
    paddingBottom: theme.spacing(1),
    fontWeight: 700,
  },
  '& h2': {
    fontSize: theme.typography.h6.fontSize,
    marginBottom: theme.spacing(1.5),
    fontWeight: 600,
  },
  '& p': {
    fontSize: theme.typography.body1.fontSize,
    marginBottom: theme.spacing(1.5),
    lineHeight: 1,
  },
  '& code': {
    backgroundColor: theme.palette.grey[100],
    padding: `${theme.spacing(0.25)} ${theme.spacing(0.5)}`,
    borderRadius: theme.spacing(0.5),
    fontFamily: 'monospace',
    fontSize: theme.typography.body2.fontSize,
  },
  '& blockquote': {
    borderLeft: `${theme.spacing(0.5)} solid ${theme.palette.warning.main}`,
    paddingLeft: theme.spacing(2),
    marginLeft: 0,
    color: theme.palette.primary.light,
    backgroundColor: alpha(theme.palette.warning.main, 0.05),
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
  },
  '& ul, & ol': {
    paddingLeft: theme.spacing(3),
    marginBottom: theme.spacing(1.5),
  },
}));

export const PreviewEmptyBox: any = styled(Box)(() => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flex: 1,
}));

export const EmptyPreviewText: any = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.disabled,
  fontStyle: 'italic',
}));

export const TestParamsBox: any = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(4),
  paddingTop: theme.spacing(3),
  borderTop: `${theme.spacing(0.125)} solid ${theme.palette.grey[200]}`,
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

export const TestGridItem: any = styled(Box)(({ theme }) => ({
  flex: `1 1 calc(50% - ${theme.spacing(2)})`,
  minWidth: theme.spacing(25),
  [theme.breakpoints.down('sm')]: {
    flex: '1 1 100%',
  },
}));
