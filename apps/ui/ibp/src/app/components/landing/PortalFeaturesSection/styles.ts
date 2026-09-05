import { styled, Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';

export const SectionContainer = styled(Box)(({ theme }) => ({
    padding: theme.spacing(24, 0),
    backgroundColor: 'white',
    position: 'relative',

}));

export const ContentWrapper = styled(Box)(({ theme }) => ({
    maxWidth: '1200px',
    margin: '0 auto',
    padding: theme.spacing(0, 8),
    [theme.breakpoints.down('md')]: {
        padding: theme.spacing(0, 4),
    },
    [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(0, 2),
    },
}));

export const HeaderSection = styled(motion.div)(({ theme }) => ({
    textAlign: 'center',
    width: '100%',
    maxWidth: '768px',
    margin: '0 auto',
    marginBottom: theme.spacing(12),
}));

export const Title = styled(Typography)(({ theme }) => ({
    fontSize: '1.875rem',
    fontWeight: 700,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(4),
    [theme.breakpoints.up('lg')]: {
        fontSize: '2.25rem',
    },
}));

export const Subtitle = styled(Typography)(({ theme }) => ({
    fontSize: '1.125rem',
    color: '#626284',
    lineHeight: 1.6,
    textAlign: 'center',
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
    '& strong': {
        fontWeight: 600,
        color: theme.palette.text.primary,
    },
}));

export const FeaturesGrid = styled(Box)(({ theme }) => ({
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: theme.spacing(3),
    marginBottom: theme.spacing(8),
    [theme.breakpoints.up('sm')]: {
        gridTemplateColumns: 'repeat(2, 1fr)',
    },
    [theme.breakpoints.up('lg')]: {
        gridTemplateColumns: 'repeat(3, 1fr)',
    },
}));

export const FeatureCard = styled(motion.div)(({ theme }) => ({
    padding: theme.spacing(3),
    border: `1px solid rgba(0, 0, 0, 0.08)`,
    borderRadius: theme.spacing(2),
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    transition: 'all 0.3s',
    '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
        borderColor: theme.palette.border,
    },
}));

export const IconContainer = styled(Box)<{ bgcolor: string; iconcolor: string }>(({ bgcolor, iconcolor, theme }) => ({
    width: '48px',
    height: '48px',
    borderRadius: theme.spacing(1.5),
    backgroundColor: bgcolor,
    color: iconcolor,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing(2),
}));

export const FeatureTitle = styled(Typography)(({ theme }) => ({
    fontSize: '1rem',
    fontWeight: 600,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(1),
}));

export const FeatureDescription = styled(Typography)(({ theme }) => ({
    fontSize: '0.875rem',
    color: '#626284',
    lineHeight: 1.5,
}));
