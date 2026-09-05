import { styled, Box, Typography, Button } from '@mui/material';
import { motion } from 'framer-motion';

export const SectionContainer = styled(Box)(({ theme }) => ({
    padding: theme.spacing(16, 0),
    background: 'linear-gradient(135deg, #fff5f2 0%, #f8f9ff 50%, #f0f4ff 100%)',
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
    color: '#db5e0a',
    backgroundColor: 'rgba(192, 85, 58, 0.1)',
    borderRadius: theme.spacing(5),
    padding: theme.spacing(0.75, 2),
    marginBottom: theme.spacing(3),
    border: '1px solid rgba(192, 85, 58, 0.2)',
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

export const ProductsGrid = styled(Box)(({ theme }) => ({
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: theme.spacing(5),
    marginBottom: theme.spacing(6),
    [theme.breakpoints.up('sm')]: {
        gridTemplateColumns: 'repeat(2, 1fr)',
    },
    [theme.breakpoints.up('lg')]: {
        gridTemplateColumns: 'repeat(4, 1fr)',
    },
}));

export const ProductCard = styled(motion.div)(({ theme }) => ({
    padding: theme.spacing(4),
    backgroundColor: 'white',
    border: '1px solid rgba(0, 0, 0, 0.07)',
    borderRadius: theme.spacing(2),
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
    display: 'flex',
    flexDirection: 'column',
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

export const ProductTitle = styled(Typography)(({ theme }) => ({
    fontSize: '1rem',
    fontWeight: 700,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(1.5),
}));

export const ProductDescription = styled(Typography)(({ theme }) => ({
    fontSize: '0.875rem',
    color: '#626284',
    lineHeight: 1.6,
    flexGrow: 1,
    marginBottom: theme.spacing(3),
}));

export const QuoteLink = styled(Box)(() => ({
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#db5e0a',
    cursor: 'pointer',
    width: 'fit-content',
    '&:hover': {
        textDecoration: 'underline',
    },
}));

export const TrustStrip = styled(motion.div)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    border: '1px solid rgba(0, 0, 0, 0.07)',
    borderRadius: theme.spacing(2),
    padding: theme.spacing(6, 4),
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
    flexWrap: 'wrap',
    gap: theme.spacing(3),
}));

export const TrustBadges = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(4),
    flexWrap: 'wrap',
}));

export const TrustBadge = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    fontSize: '0.9375rem',
    color: theme.palette.text.primary,
    fontWeight: 500,
}));

export const AdvisorButton = styled(Button)(({ theme }) => ({
    backgroundColor: '#db5e0a',
    color: 'white',
    fontWeight: 600,
    fontSize: '0.9375rem',
    padding: theme.spacing(1.5, 4),
    borderRadius: theme.spacing(1.5),
    textTransform: 'none',
    whiteSpace: 'nowrap',
    '&:hover': {
        backgroundColor: '#a0462f',
    },
}));
