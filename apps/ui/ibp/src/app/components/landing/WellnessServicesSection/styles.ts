import { styled, Box, Typography, Button } from '@mui/material';
import { motion } from 'framer-motion';

export const SectionContainer = styled(Box)(({ theme }) => ({
    padding: theme.spacing(16, 0),
    background: 'linear-gradient(to bottom, #f8faf8, #eef4f0)',
    position: 'relative',
}));

export const ContentWrapper = styled(Box)(({ theme }) => ({
    maxWidth: '1200px',
    margin: '0 auto',
    padding: theme.spacing(0, 3),
}));

export const HeaderSection = styled(motion.div)(({ theme }) => ({
    textAlign: 'center',
    maxWidth: '768px',
    margin: '0 auto',
    marginBottom: theme.spacing(10),
}));

export const Badge = styled(Box)(({ theme }) => ({
    display: 'inline-block',
    fontSize: '0.75rem',
    fontWeight: 600,
    letterSpacing: '0.08em',
    color: '#2a7e38',
    backgroundColor: 'rgba(61, 107, 79, 0.1)',
    borderRadius: theme.spacing(5),
    padding: theme.spacing(0.75, 2),
    marginBottom: theme.spacing(3),
    border: '1px solid rgba(61, 107, 79, 0.2)',
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

export const Subtitle = styled(Typography)(() => ({
    fontSize: '1.125rem',
    color: '#626284',
    lineHeight: 1.7,
}));

export const ServicesGrid = styled(Box)(({ theme }) => ({
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: theme.spacing(5),
    marginBottom: theme.spacing(8),
    [theme.breakpoints.up('sm')]: {
        gridTemplateColumns: 'repeat(2, 1fr)',
    },
    [theme.breakpoints.up('lg')]: {
        gridTemplateColumns: 'repeat(4, 1fr)',
    },
}));

export const ServiceCard = styled(motion.div)(({ theme }) => ({
    padding: theme.spacing(4),
    backgroundColor: 'white',
    border: '1px solid rgba(0, 0, 0, 0.07)',
    borderRadius: theme.spacing(2),
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
    transition: 'all 0.3s',
    '&:hover': {
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
        transform: 'translateY(-4px)',
    },
}));

export const IconContainer = styled(Box)<{ gradient: string }>(({ gradient, theme }) => ({
    width: '56px',
    height: '56px',
    borderRadius: theme.spacing(2),
    background: gradient,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing(3),
    color: 'white',
}));

export const ServiceTitle = styled(Typography)(({ theme }) => ({
    fontSize: '1rem',
    fontWeight: 700,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(1.5),
}));

export const ServiceDescription = styled(Typography)(() => ({
    fontSize: '0.875rem',
    color: '#626284',
    lineHeight: 1.6,
}));

export const CTAWrapper = styled(Box)(() => ({
    display: 'flex',
    justifyContent: 'center',
}));

export const CTAButton = styled(Button)(({ theme }) => ({
    backgroundColor: '#2a7e38',
    color: 'white',
    fontWeight: 600,
    fontSize: '0.9375rem',
    padding: theme.spacing(1.5, 4),
    borderRadius: theme.spacing(1.5),
    textTransform: 'none',
    '&:hover': {
        backgroundColor: '#224530',
    },
}));
