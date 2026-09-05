import { styled, Box, Typography, Button } from '@mui/material';
import { motion } from 'framer-motion';

export const SectionContainer = styled(Box)(({ theme }) => ({
     padding: '48px 0',
    backgroundColor: 'white',
    position: 'relative',


}));

export const ContentWrapper = styled(Box)(() => ({
    padding: '0 32px',
}));

export const BannersGrid = styled(Box)(() => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
}));

export const BannerCard = styled(motion.div)<{ gradient: string }>(
    ({ gradient }) => ({
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '16px',
        background: gradient,
        padding: '24px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
            transform: 'scale(1.01)',
        },
        '@media (min-width: 1024px)': {
            padding: '32px',
        },
    })
);

export const BannerPattern = styled(Box)(() => ({
    position: 'absolute',
    inset: 0,
    opacity: 0.1,
    '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        right: 0,
        width: '256px',
        height: '256px',
        backgroundColor: '#FFFFFF',
        borderRadius: '50%',
        filter: 'blur(96px)',
        transform: 'translate(50%, -50%)',
    },
}));

export const BannerContent = styled(Box)(({ theme }) => ({
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '16px',
    [theme.breakpoints.up('lg')]: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
}));

export const BannerTextSection = styled(Box)(() => ({
    color: '#FFFFFF',
}));

export const BannerTitle = styled(Typography)(({ theme }) => ({
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#FFFFFF',
    marginBottom: '4px',
    '@media (max-width: 768px)': {
        fontSize: '1rem',
    },
}));

export const BannerSubtitle = styled(Typography)(({ theme }) => ({
    fontSize: '0.875rem',
    color: 'rgba(255, 255, 255, 0.8)',

}));

export const BannerButton = styled(Button)(() => ({
    backgroundColor: '#FFFFFF',
    color: '#000000',
    padding: '12px 24px',
    borderRadius: '8px',
    fontWeight: 600,
    textTransform: 'none',
    fontSize: '1rem',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    gap: '8px',
    flexShrink: 0,
    alignSelf: 'flex-start',
    '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
    },
    transition: 'all 0.2s',
    '@media (max-width: 768px)': {
        fontSize: '0.875rem',
        padding: '10px 18px',
    },
}));
