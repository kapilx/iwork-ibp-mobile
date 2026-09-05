import { styled } from '@mui/material/styles';
import { Box, Button, Typography } from '@mui/material';
import { motion } from 'framer-motion';

export const HeroContainer = styled('section')(({ theme }) => ({
    position: 'relative',
    overflow: 'hidden',
    background: 'linear-gradient(135deg, #0F2557 0%, #1F79D4 50%, #26A69A 100%)',
    minHeight: '600px',
    [theme.breakpoints.down('md')]: {
        minHeight: 'auto',
    },
}));

export const BackgroundPattern = styled(Box)(() => ({
    position: 'absolute',
    inset: 0,
    opacity: 0.1,
}));

export const BackgroundBlob1 = styled(Box)(({ theme }) => ({
    position: 'absolute',
    top: '80px',
    left: '40px',
    width: '288px',
    height: '288px',
    background: '#FFFFFF',
    borderRadius: '50%',
    filter: 'blur(96px)',
    [theme.breakpoints.down('md')]: {
        width: '200px',
        height: '200px',
        top: '40px',
        left: '20px',
    },
}));

export const BackgroundBlob2 = styled(Box)(({ theme }) => ({
    position: 'absolute',
    bottom: '40px',
    right: '80px',
    width: '384px',
    height: '384px',
    background: '#FF6B35',
    borderRadius: '50%',
    filter: 'blur(96px)',
    [theme.breakpoints.down('md')]: {
        width: '250px',
        height: '250px',
        bottom: '20px',
        right: '40px',
    },
}));

export const ContentContainer = styled(Box)(({ theme }) => ({
    position: 'relative',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: theme.spacing(10),
}));

export const GridContainer = styled(Box)(({ theme }) => ({
    display: 'grid',
    gap: theme.spacing(4),
    alignItems: 'center',
    [theme.breakpoints.up('md')]: {
        gridTemplateColumns: '1fr 1fr',
        gap: theme.spacing(6),
    },
    [theme.breakpoints.up('lg')]: {
        gridTemplateColumns: '1fr 1fr',
        gap: theme.spacing(12),
    },
    [theme.breakpoints.down('md')]: {
        gridTemplateColumns: '1fr',
    },
}));

export const ContentSection = styled(motion.div)(({ theme }) => ({
    color: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(3),
}));

export const Heading = styled(motion.h1)(({ theme }) => ({
    fontSize: '2.5rem',
    fontWeight: 700,
    lineHeight: 1.2,
    margin: 0,
    [theme.breakpoints.up('lg')]: {
        fontSize: '3rem',
    },
    [theme.breakpoints.up('xl')]: {
        fontSize: '3.75rem',
    },
    // 360–768px
    '@media (max-width: 768px)': {
        fontSize: '2rem',
    },
    '@media (max-width: 480px)': {
        fontSize: '1.75rem',
    },
    '@media (max-width: 390px)': {
        fontSize: '1.5rem',
    },
}));





export const HighlightText = styled('span')(() => ({
    color: '#FF6B35',
}));

export const SubText = styled(motion.p)(({ theme }) => ({
    fontSize: '1.125rem',
    color: 'rgba(255, 255, 255, 0.8)',
    maxWidth: '640px',
    lineHeight: 1.6,
    margin: 0,
    [theme.breakpoints.up('lg')]: {
        fontSize: '1.25rem',
    },
    '@media (max-width: 768px)': {
        fontSize: '0.938rem',
    },
    '@media (max-width: 480px)': {
        fontSize: '0.875rem',
    },
}));

export const ButtonGroup = styled(motion.div)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: theme.spacing(2),
    '@media (max-width: 480px)': {
        flexWrap: 'wrap',
    },
}));

export const PrimaryButton = styled(Button)(() => ({
    padding: '12px 28px',
    fontSize: '1rem',
    fontWeight: 500,
    backgroundColor: '#FF6B35',
    color: '#FFFFFF',
    borderRadius: '8px',
    textTransform: 'none',
    whiteSpace: 'nowrap',
    boxShadow: '0 20px 25px -5px rgba(255, 107, 53, 0.3), 0 8px 10px -6px rgba(255, 107, 53, 0.3)',
    gap: '8px',
    transition: 'all 0.3s ease',
    '&:hover': {
        backgroundColor: 'rgba(255, 107, 53, 0.9)',
    },
    '@media (max-width: 768px)': {
        fontSize: '0.875rem',
        padding: '10px 20px',
    },
}));

export const SecondaryButton = styled(Button)(() => ({
    padding: '12px 18px',
    fontSize: '1rem',
    fontWeight: 500,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#FFFFFF',
    border: '2px solid #FFFFFF',
    borderRadius: '8px',
    textTransform: 'none',
    transition: 'all 0.3s ease',
    '&:hover': {
        backgroundColor: '#FFFFFF',
        color: '#0F2557',
    },
    '@media (max-width: 768px)': {
        fontSize: '0.875rem',
        padding: '10px 14px',
    },
}));

export const TrustBadgeContainer = styled(motion.div)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(3),
    paddingTop: theme.spacing(2),
}));

export const TrustBadge = styled(Box)(() => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'rgba(255, 255, 255, 0.7)',
    '& svg': {
        width: '16px',
        height: '16px',
    },
}));

export const TrustBadgeText = styled('span')(() => ({
    fontSize: '0.875rem',
    fontWeight: 500,
}));

export const ImageSection = styled(motion.div)(({ theme }) => ({
    position: 'relative',
    display: 'block',
    [theme.breakpoints.down('md')]: {
        marginTop: theme.spacing(2),
    },
}));

export const ImageWrapper = styled(Box)(() => ({
    position: 'relative',
}));

export const ImageContainer = styled(Box)(() => ({
    position: 'relative',
    borderRadius: '24px',
    overflow: 'hidden',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
}));

export const HeroImage = styled('img')(({ theme }) => ({
    width: '100%',
    height: 'auto',
    aspectRatio: '16 / 10',
    objectFit: 'cover',
    display: 'block',
    [theme.breakpoints.between('md', 'lg')]: {
        aspectRatio: '16 / 9',
    },
    [theme.breakpoints.down('md')]: {
        aspectRatio: '16 / 8',
    },
    [theme.breakpoints.down('sm')]: {
        aspectRatio: '16 / 7',
    },
}));

export const ImageOverlay = styled(Box)(() => ({
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to top, rgba(15, 37, 87, 0.4) 0%, transparent 50%, transparent 100%)',
}));

export const FloatingBadge = styled(motion.div)(({ theme }) => ({
    position: 'absolute',
    bottom: '-16px',
    left: '-16px',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    [theme.breakpoints.between('md', 'lg')]: {
        bottom: '8px',
        left: '8px',
        padding: '10px 12px',
        borderRadius: '10px',
    },
    [theme.breakpoints.down('md')]: {
        bottom: '8px',
        left: '8px',
        padding: '8px 10px',
        borderRadius: '8px',
    },
    '@media (max-width: 480px)': {
        bottom: '6px',
        left: '6px',
        padding: '6px 8px',
        borderRadius: '6px',
    },
}));

export const FloatingBadgeContent = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    [theme.breakpoints.down('md')]: {
        gap: '8px',
    },
    '@media (max-width: 480px)': {
        gap: '6px',
    },
}));

export const FloatingIconContainer = styled(Box)(({ theme }) => ({
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    '& svg': {
        width: '20px',
        height: '20px',
        color: '#4CAF50',
    },
    [theme.breakpoints.down('md')]: {
        width: '30px',
        height: '30px',
        '& svg': {
            width: '15px',
            height: '15px',
        },
    },
    '@media (max-width: 480px)': {
        width: '24px',
        height: '24px',
        '& svg': {
            width: '12px',
            height: '12px',
        },
    },
}));

export const FloatingBadgeTextContainer = styled(Box)(() => ({
    display: 'flex',
    flexDirection: 'column',
}));

export const FloatingBadgeTitle = styled('div')(() => ({
    fontSize: '0.875rem',
    fontWeight: 600,
}));

export const FloatingBadgeSubtitle = styled('div')(() => ({
    fontSize: '0.75rem',
    color: '#666',
}));

export const StatsBadge = styled(motion.div)(({ theme }) => ({
    position: 'absolute',
    top: '-16px',
    right: '-16px',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    [theme.breakpoints.between('md', 'lg')]: {
        top: '8px',
        right: '8px',
        padding: '10px 12px',
        borderRadius: '10px',
    },
    [theme.breakpoints.down('md')]: {
        top: '8px',
        right: '8px',
        padding: '8px 10px',
        borderRadius: '8px',
    },
    '@media (max-width: 480px)': {
        top: '6px',
        right: '6px',
        padding: '6px 8px',
        borderRadius: '6px',
    },
}));

export const StatsBadgeContent = styled(Box)(() => ({
    textAlign: 'center',
}));

export const StatsNumber = styled('div')(({ theme }) => ({
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#1F79D4',
    [theme.breakpoints.down('md')]: {
        fontSize: '1.125rem',
    },
    '@media (max-width: 480px)': {
        fontSize: '0.875rem',
    },
}));

export const StatsLabel = styled('div')(({ theme }) => ({
    fontSize: '0.75rem',
    color: '#666',
    [theme.breakpoints.down('md')]: {
        fontSize: '0.625rem',
    },
    '@media (max-width: 480px)': {
        fontSize: '0.563rem',
    },
}));
