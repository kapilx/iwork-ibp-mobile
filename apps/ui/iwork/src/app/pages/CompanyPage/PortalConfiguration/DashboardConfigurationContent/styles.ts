import { Box, Typography, styled } from '@mui/material';

export const SectionDescription = styled(Typography)(({ theme }) => ({
    fontSize: '14px',
    color: theme.palette.grey[600],
    marginBottom: theme.spacing(3),
}));

export const SectionLabel = styled(Typography)(({ theme }) => ({
    fontSize: '14px',
    fontWeight: 600,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(2),
}));

export const WellnessGrid = styled(Box)(({ theme }) => ({
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(4),
}));

export const WellnessCard = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'enabled' && prop !== 'locked' && prop !== 'physical',
})<{ enabled?: boolean; locked?: boolean; physical?: boolean }>(({ theme, enabled, locked, physical }) => ({
    position: 'relative',
    borderRadius: theme.spacing(1.5),
    border: locked
        ? '2px solid #E0B4F5'
        : physical
        ? '2px solid rgb(157, 200, 245)'
        : '2px solid #8DD0A0',
    background: locked
        ? 'linear-gradient(135deg, rgba(244, 221, 255, 0.4) 0%, rgba(255, 255, 255, 0.9) 100%)'
        : physical
        ? 'linear-gradient(135deg, rgba(184, 218, 255, 0.4) 0%, rgba(255, 255, 255, 0.9) 100%)'
        : 'linear-gradient(135deg, rgba(171, 223, 183, 0.4) 0%, rgba(255, 255, 255, 0.9) 100%)',
    boxShadow: locked
        ? '0 4px 12px rgba(224, 180, 245, 0.25)'
        : physical
        ? '0 4px 12px rgba(157, 200, 245, 0.25)'
        : '0 4px 12px rgba(141, 208, 160, 0.25)',
    overflow: 'hidden',
    opacity: locked ? 1 : enabled ? 1 : 0.6,
}));

export const CardHeader = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: theme.spacing(3),
}));

export const CardContent = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing(2),
    flex: 1,
}));

export const IconContainer = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'locked',
})<{ locked?: boolean }>(({ theme, locked }) => ({
    width: 48,
    height: 48,
    borderRadius: theme.spacing(1.5),
    backgroundColor: locked ? '#F4DDFF' : '#EFF6FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
}));

export const CardTitle = styled(Typography)(({ theme }) => ({
    fontSize: '16px',
    fontWeight: 600,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(0.5),
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
}));

export const CardDesc = styled(Typography)(({ theme }) => ({
    fontSize: '14px',
    color: theme.palette.grey[600],
}));

export const LockBadge = styled(Box)(({ theme }) => ({
    width: 32,
    height: 32,
    borderRadius: theme.spacing(1),
    backgroundColor: '#F4DDFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
}));

export const SubOptionsContainer = styled(Box)(({ theme }) => ({
    padding: theme.spacing(0, 3, 3, 3),
}));

export const SubOptionsBox = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'locked',
})<{ locked?: boolean }>(({ theme, locked }) => ({
    backgroundColor: locked ? 'rgba(244, 221, 255, 0.3)' : 'rgba(239, 246, 255, 0.5)',
    borderRadius: theme.spacing(1),
    padding: theme.spacing(2),
}));

export const SubOptionHeader = styled(Typography)(({ theme }) => ({
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: theme.palette.grey[600],
    marginBottom: theme.spacing(1.5),
    paddingLeft: theme.spacing(0.5),
}));

export const SubOptionItem = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'disabled',
})<{ disabled?: boolean }>(({ theme, disabled }) => ({
    padding: theme.spacing(1.5),
    border: `1px solid ${theme.palette.grey[200]}`,
    borderRadius: theme.spacing(1),
    backgroundColor: theme.palette.common.white,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(1),
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? 'not-allowed' : 'default',
    '&:last-child': {
        marginBottom: 0,
    },
}));

export const SubOptionLabel = styled(Typography)(({ theme }) => ({
    fontSize: '14px',
    color: theme.palette.text.primary,
}));

export const EnrollmentSection = styled(Box)(({ theme }) => ({
    marginBottom: theme.spacing(4),
}));

export const EnrollmentBox = styled(Box)(({ theme }) => ({
    border: `1px solid ${theme.palette.grey[200]}`,
    borderRadius: theme.spacing(1.5),
    padding: theme.spacing(3),
    backgroundColor: theme.palette.common.white,
}));

export const EnrollmentHeader = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    marginBottom: theme.spacing(3),
}));

export const EnrollmentTitle = styled(Typography)(({ theme }) => ({
    fontSize: '16px',
    fontWeight: 600,
    color: theme.palette.text.primary,
}));

export const EnrollmentSubtitle = styled(Typography)(({ theme }) => ({
    fontSize: '14px',
    color: theme.palette.grey[600],
}));

export const ConfigGrid = styled(Box)(({ theme }) => ({
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: theme.spacing(3),
}));

export const ConfigItem = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
}));

export const ConfigLabel = styled(Typography)(({ theme }) => ({
    fontSize: '14px',
    fontWeight: 500,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(0.5),
}));

export const ConfigSubtext = styled(Typography)(({ theme }) => ({
    fontSize: '13px',
    color: theme.palette.grey[600],
    marginBottom: theme.spacing(1.5),
}));

export const DisclaimerBox = styled(Box)(({ theme }) => ({
    border: `1px solid ${theme.palette.grey[200]}`,
    borderRadius: theme.spacing(1),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.grey[50],
    marginTop: theme.spacing(3),
}));

export const DisclaimerLabel = styled(Typography)(({ theme }) => ({
    fontSize: '14px',
    fontWeight: 500,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(1.5),
}));

export const RetailSection = styled(Box)(({ theme }) => ({
    marginBottom: theme.spacing(4),
}));

export const RetailBox = styled(Box)(({ theme }) => ({
    border: `1px solid ${theme.palette.grey[200]}`,
    borderRadius: theme.spacing(1.5),
    padding: theme.spacing(6),
    backgroundColor: theme.palette.common.white,
}));

export const RetailHeader = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(3),
}));

export const RetailTitleBox = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
}));

export const ProductsLabel = styled(Typography)(({ theme }) => ({
    fontSize: '14px',
    fontWeight: 500,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(2),
}));

export const ProductsGrid = styled(Box)(({ theme }) => ({
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: theme.spacing(2),
}));

export const ProductItem = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(2),
    border: `1px solid ${theme.palette.grey[200]}`,
    borderRadius: theme.spacing(1),
    backgroundColor: theme.palette.common.white,
}));

export const ProductLabel = styled(Typography)(({ theme }) => ({
    fontSize: '14px',
    color: theme.palette.text.primary,
}));

export const ContentContainer = styled(Box)(({ theme }) => ({
    // padding: theme.spacing(4),
}));

export const SectionBox = styled(Box)(({ theme }) => ({
    marginBottom: theme.spacing(4),
}));

export const IconWithText = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(2),
}));

export const SectionTitleText = styled(Typography)(({ theme }) => ({
    fontSize: '14px',
    fontWeight: 500,
    color: theme.palette.text.primary,
}));
