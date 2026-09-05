import { Box, Typography, styled } from '@mui/material';

export const ViewContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(5),
}));
export const SectionText = styled(Typography)(({ theme }) => ({
    fontSize: '16px',
    fontWeight: 400,
    lineHeight: '24px',
    color: theme.palette.text.primary,
}));
export const ConfigCard = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.common.white,
    border: `1px solid ${theme.palette.grey[200]}`,
    borderRadius: theme.spacing(1.5),
    padding: theme.spacing(6),
}));

export const CardHeader = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing(3),
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

export const CardContent = styled(Box)({
    flex: 1,
});

export const CardTitle = styled(Typography)(({ theme }) => ({
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: theme.spacing(0.5),
    color: theme.palette.text.primary,
}));

export const CardSubtitle = styled(Typography)(({ theme }) => ({
    fontSize: '14px',
    color: theme.palette.grey[600],
    marginBottom: theme.spacing(4),
}));

export const InfoGrid = styled(Box)(({ theme }) => ({
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: theme.spacing(3),
}));

export const InfoLabel = styled(Typography)(({ theme }) => ({
    fontSize: '12px',
    marginBottom: theme.spacing(1),
    fontWeight: 500,
    color: theme.palette.grey[600],
}));

export const InfoValue = styled(Typography)(({ theme }) => ({
    fontSize: '14px',
    color: theme.palette.text.primary,
}));

export const MethodCard = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'selected',
})<{ selected?: boolean }>(({ theme, selected }) => ({
    padding: theme.spacing(2.5),
    borderRadius: theme.spacing(1.5),
    border: selected ? '2px solid #6366F1' : `1px solid ${theme.palette.grey[200]}`,
    backgroundColor: selected ? '#EEF2FF' : theme.palette.common.white,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
}));

export const MethodIconBox = styled(Box)(({ theme }) => ({
    width: 40,
    height: 40,
    borderRadius: theme.spacing(1),
    backgroundColor: theme.palette.common.white,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
}));

export const InfoBox = styled(Box)(({ theme }) => ({
    padding: theme.spacing(2.5),
    backgroundColor: "#f7f7f7",
    borderRadius: theme.spacing(1),
}));

export const GridBox = styled(Box)(({ theme }) => ({
    display: 'grid',
    gap: theme.spacing(4),
}));

export const FlexBox = styled(Box)(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(2),
}));

export const ColumnBox = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
}));

export const LogoPlaceholder = styled(Box)(({ theme }) => ({
    width: 56,
    height: 56,
    borderRadius: theme.spacing(1.5),
    backgroundColor: theme.palette.common.white,
    border: '2px dashed',
    borderColor: theme.palette.grey[300],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
}));

export const WelcomeMessageBox = styled(Box)(({ theme }) => ({
    marginBottom: theme.spacing(2),
}));

export const WelcomeTextDisplay = styled(Typography)(({ theme }) => ({
    padding: theme.spacing(1.5),
    backgroundColor: theme.palette.common.white,
    borderRadius: theme.spacing(1),
    border: `1px solid ${theme.palette.grey[200]}`,
}));

export const AuthMethodGrid = styled(Box)(({ theme }) => ({
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    gap: theme.spacing(4),
}));

export const SecurityConfigGrid = styled(Box)(({ theme }) => ({
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: theme.spacing(2),
}));

export const BrandingGrid = styled(Box)(({ theme }) => ({
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: theme.spacing(4),
}));

export const HighlightedText = styled(Typography)(({ theme }) => ({
    color: '#6366F1',
}));
export const DomainUrlLink = styled(Typography)(({ theme }) => ({
    color: "#6366F1",
    cursor: "pointer",
}));
