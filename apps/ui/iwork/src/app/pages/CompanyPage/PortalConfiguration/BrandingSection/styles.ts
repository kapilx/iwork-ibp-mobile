import { Box, Typography, styled } from '@mui/material';

export const SectionTitle = styled(Typography)(({ theme }) => ({
    fontSize: '16px',
    fontWeight: 600,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(2),
}));

export const UploadBox = styled(Box)(({ theme }) => ({
    border: `2px dashed ${theme.palette.divider}`,
    borderRadius: theme.spacing(1),
    padding: theme.spacing(2),
    cursor: 'pointer',
    transition: 'border-color 0.2s',
    '&:hover': {
        borderColor: theme.palette.primary.main,
    },
}));
export const LoginWrapper = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    maxHeight:"216px",
    justifyContent:"flex-end",
    gap: theme.spacing(2),
}));
export const LogoPreview = styled(Box)(({ theme }) => ({
    width: 64,
    height: 64,
    backgroundColor: theme.palette.grey[100],
    borderRadius: theme.spacing(1),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
}));

export const ColorGrid = styled(Box)(({ theme }) => ({
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: theme.spacing(2),
}));

export const ColorInputContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
}));

export const ColorPicker = styled('input')(({ theme }) => ({
    width: 48,
    height: 40,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.spacing(0.5),
    cursor: 'pointer',
}));
