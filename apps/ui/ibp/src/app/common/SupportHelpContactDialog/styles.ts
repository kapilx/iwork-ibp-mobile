import { styled, Box, Typography, Dialog, DialogContent } from '@mui/material';

export const SupportHelpDialog = styled(Dialog)(() => ({
    '& .MuiDialog-paper': {
        width: '100%',
        maxWidth: '470px',
        borderRadius: '22px',
        margin: '16px',
        boxShadow: '0 18px 40px rgba(0,0,0,0.25)',
        overflow: 'hidden',
    },
    '& .MuiBackdrop-root': {
        backgroundColor: 'rgba(8, 22, 46, 0.55)',
    },
}));

export const SupportHelpHeader = styled(Box)(() => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '25px',
}));

export const SupportHelpTitle = styled(Typography)(() => ({
    fontSize: '28px',
    fontWeight: 500,
    color: '#222222',
}));

export const SupportHelpCloseButton = styled('button')(() => ({
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    padding: 0,
    width: '38px',
    height: '38px',
    fontSize: '24px',
    lineHeight: '38px',
    color: '#262626',
}));

export const SupportHelpDivider = styled(Box)(() => ({
    height: '2px',
    width: '100%',
    backgroundColor: '#006FBE',
}));

export const SupportHelpContent = styled(DialogContent)(() => ({
    padding: '36px 28px 30px 28px !important',
}));

export const SupportHelpText = styled(Typography)(() => ({
    fontSize: '14px',
    lineHeight: 1.25,
    color: '#262626',
}));
