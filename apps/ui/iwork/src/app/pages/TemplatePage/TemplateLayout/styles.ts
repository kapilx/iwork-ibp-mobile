import { Typography, Box } from '@mui/material';
import { styled } from '@mui/material/styles';

export const TemplatePageContainer: any = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: `calc(100vh - ${theme.spacing(14)})`, // Adjusted to account for Top App Bar + Padding
  overflow: 'hidden',
  padding: theme.spacing(3),
}));

export const TemplateHeader: any = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(3),
  borderBottom: `${theme.spacing(0.125)} solid ${theme.palette.divider}`,
  paddingBottom: theme.spacing(2),
  flexShrink: 0, // Prevent header from shrinking
}));

export const TemplateTitle: any = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.h4.fontSize,
  fontWeight: 800,
  color: theme.palette.text.primary,
}));

export const HeaderActionsBox: any = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(2),
}));

export const TemplateContentBox: any = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.spacing(1),
  padding: theme.spacing(3),
  flex: 1, // Fill remaining space
  overflowY: 'auto', // Scroll content only
  boxShadow: theme.shadows[1],
}));

export const LoadingContainer: any = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: theme.spacing(37.5), // ~300px
}));

export const SkeletonRow: any = styled(Box)(({ theme }) => ({
  height: theme.spacing(7),
  backgroundColor: theme.palette.grey[100],
  marginBottom: theme.spacing(1),
  borderRadius: theme.spacing(1),
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 2),
}));

export const SkeletonContent: any = styled(Box)(({ theme }) => ({
  width: '100%',
  display: 'flex',
  gap: theme.spacing(2),
}));

export const SkeletonItem: any = styled(Box)(({ theme }) => ({
  height: theme.spacing(2.5),
  backgroundColor: theme.palette.grey[300],
  borderRadius: theme.spacing(1),
}));

export const SkeletonList: any = styled(Box)(() => ({}));

export const FormSkeletonContainer: any = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

export const FormSkeletonLabel: any = styled(Box)(({ theme }) => ({
  width: '25%',
  height: theme.spacing(2.5),
  backgroundColor: theme.palette.grey[300],
  borderRadius: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

export const FormSkeletonInput: any = styled(Box)(({ theme }) => ({
  width: '100%',
  height: theme.spacing(5),
  backgroundColor: theme.palette.grey[100],
  borderRadius: theme.spacing(1),
}));

export const CardSkeletonContainer: any = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  border: `${theme.spacing(0.125)} solid ${theme.palette.grey[300]}`,
  borderRadius: theme.spacing(1),
}));

export const CardSkeletonTitle: any = styled(Box)(({ theme }) => ({
  width: '60%',
  height: theme.spacing(3),
  backgroundColor: theme.palette.grey[300],
  borderRadius: theme.spacing(1),
  marginBottom: theme.spacing(2),
}));

export const ErrorContainer: any = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  width: '100%',
}));

export const CardSkeletonLine: any = styled(Box)(({ theme }) => ({
  height: theme.spacing(2),
  backgroundColor: theme.palette.grey[200],
  borderRadius: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));