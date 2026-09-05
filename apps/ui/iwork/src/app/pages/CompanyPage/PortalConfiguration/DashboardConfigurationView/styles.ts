import { Box, Typography, Chip, styled } from '@mui/material';

export const ViewContainer = styled(Box)(({ theme }) => ({
    paddingTop: theme.spacing(5),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(5),
}));

export const ConfigCard = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.common.white,
    border: `1px solid ${theme.palette.grey[200]}`,
    borderRadius: theme.spacing(1.5),
    padding: theme.spacing(4),
}));

export const CardHeader = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(3),
}));

export const IconBox = styled(Box)(({ theme }) => ({
    width: 48,
    height: 48,
    borderRadius: theme.spacing(1.5),
    backgroundColor: '#EFF6FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
}));

export const CardTitle = styled(Typography)(({ theme }) => ({
    fontSize: '18px',
    fontWeight: 600,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(0.5),
}));

export const CardSubtitle = styled(Typography)(({ theme }) => ({
    fontSize: '14px',
    color: theme.palette.grey[600],
}));

export const ModuleSection = styled(Box)(({ theme }) => ({
    marginBottom: theme.spacing(3),
    '&:last-child': {
        marginBottom: 0,
    },
}));

export const SectionLabel = styled(Typography)(({ theme }) => ({
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    color: theme.palette.grey[600],
    letterSpacing: '0.5px',
    marginBottom: theme.spacing(2),
}));

export const ModulesGrid = styled(Box)(({ theme }) => ({
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: theme.spacing(2),
}));

export const ModuleCard = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'enabled' && prop !== 'locked',
})<{ enabled?: boolean; locked?: boolean }>(({ theme, enabled, locked }) => ({
    padding: theme.spacing(3),
    border: locked
        ? '2px solid #E0B4F5'
        : enabled
        ? '2px solid #8DD0A0'
        : `1px solid ${theme.palette.grey[200]}`,
    borderRadius: theme.spacing(1.5),
    backgroundColor: locked
        ? 'rgba(244, 221, 255, 0.2)'
        : enabled
        ? 'rgba(171, 223, 183, 0.1)'
        : theme.palette.grey[50],
    opacity: enabled || locked ? 1 : 0.6,
}));

export const ModuleHeader = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    marginBottom: theme.spacing(2),
}));

export const ModuleIconBox = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'locked',
})<{ locked?: boolean }>(({ theme, locked }) => ({
    width: 40,
    height: 40,
    borderRadius: theme.spacing(1),
    backgroundColor: locked ? '#F4DDFF' : '#EFF6FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
}));

export const ModuleTitle = styled(Typography)(({ theme }) => ({
    fontSize: '14px',
    fontWeight: 600,
    color: theme.palette.text.primary,
}));

export const ModuleDesc = styled(Typography)(({ theme }) => ({
    fontSize: '13px',
    color: theme.palette.grey[600],
    marginBottom: theme.spacing(2),
}));

export const StatusChip = styled(Chip, {
    shouldForwardProp: (prop) => prop !== 'locked',
})<{ locked?: boolean }>(({ theme, locked }) => ({
    height: 24,
    fontSize: '12px',
    fontWeight: 500,
    backgroundColor: locked ? '#F4DDFF' : '#D1FAE5',
    color: locked ? '#9333EA' : '#059669',
    border: 'none',
    '& .MuiChip-icon': {
        color: locked ? '#9333EA' : '#059669',
        fontSize: 16,
    },
}));

export const SubOptionsList = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
}));

export const SubOption = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'enabled',
})<{ enabled?: boolean }>(({ theme, enabled }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    fontSize: '13px',
    color: enabled ? theme.palette.text.primary : theme.palette.grey[400],
}));

export const SubOptionIcon = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'enabled',
})<{ enabled?: boolean }>(({ theme, enabled }) => ({
    width: 18,
    height: 18,
    borderRadius: '50%',
    backgroundColor: enabled ? '#D1FAE5' : theme.palette.grey[200],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
}));

export const DisclaimerBox = styled(Typography)(({ theme }) => ({
    backgroundColor: theme.palette.grey[50],
    borderRadius: theme.spacing(1),
    padding: theme.spacing(2),
    border: `1px solid ${theme.palette.grey[200]}`,
}));
