import { styled, Box, Typography, Button } from '@mui/material';
import { motion } from 'framer-motion';

export const SectionContainer = styled(motion.section)(() => ({
    padding: '64px 0',
    backgroundColor: 'white',
    overflow: 'hidden',
    '@media (min-width: 1024px)': {
        padding: '96px 0',
    },
}));

export const ContentWrapper = styled(Box)(() => ({
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '0 16px',
}));

export const HeaderSection = styled(motion.div)(() => ({
    textAlign: 'center',
    maxWidth: '768px',
    margin: '0 auto 48px',
}));

export const BadgePill = styled(Box)(() => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: '9999px',
    marginBottom: '16px',
}));

export const LogoBox = styled(Box)(() => ({
    width: '24px',
    height: '24px',
    borderRadius: '4px',
    backgroundColor: '#FF6B35',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '& span': {
        color: 'white',
        fontWeight: 700,
        fontSize: '0.75rem',
    },
}));

export const BadgeText = styled(Typography)(() => ({
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#FF6B35',
}));

export const SectionTitle = styled(Typography)(({ theme }) => ({
    fontSize: '1.875rem',
    fontWeight: 700,
    color: '#09090B',
    marginBottom: '16px',
    [theme.breakpoints.up('lg')]: {
        fontSize: '2.25rem',
    },
}));

export const SectionDescription = styled(Typography)(() => ({
    fontSize: '1.125rem',
    color: '#626284',
}));

export const GridContainer = styled(Box)(() => ({
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '32px',
    marginBottom: '48px',
    '@media (min-width: 1024px) and (max-width: 1279px)': {
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '32px',
    },
    '@media (min-width: 1280px)': {
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '48px',
    },
}));

export const ImageColumn = styled(motion.div)(() => ({
    display: 'block',
    // Mobile: don't stretch edge-to-edge; keep a portrait width, centred
    '@media (max-width: 1023px)': {
        maxWidth: '380px',
        width: '100%',
        margin: '0 auto',
    },
    // Tablet 2-col: image is already half the grid — no extra constraint needed
}));

export const ImageWrapper = styled(Box)(() => ({
    position: 'relative',
    borderRadius: '16px',
    overflow: 'hidden',
    // Mobile < 1024px: natural height — full portrait, no cropping
    height: 'auto',
    // Tablet 1024–1279px: fixed height; top-anchored cover keeps the face visible
    '@media (min-width: 1024px) and (max-width: 1279px)': {
        height: '380px',
    },
    // Desktop ≥ 1280px: fill the tall grid column
    '@media (min-width: 1280px)': {
        height: '100%',
        minHeight: '400px',
    },
}));

export const StyledImage = styled('img')(() => ({
    // Mobile < 1024px: natural flow — full image, no cropping
    display: 'block',
    width: '100%',
    height: 'auto',
    position: 'static',
    // Tablet 1024–1279px: 150% height so portrait fills the fixed-height wrapper
    '@media (min-width: 1024px) and (max-width: 1279px)': {
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '150%',
        objectFit: 'cover',
        objectPosition: 'center',
    },
    // Desktop ≥ 1280px: fill the column exactly
    '@media (min-width: 1280px)': {
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: 'top center',
    },
}));

export const ImageGradient = styled(Box)(() => ({
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to top, rgba(15, 37, 87, 0.6), transparent, transparent)',
}));

export const ImageCaption = styled(Box)(() => ({
    position: 'absolute',
    bottom: '16px',
    left: '16px',
    right: '16px',
    color: 'white',
}));

export const CaptionTitle = styled(Typography)(() => ({
    fontSize: '0.875rem',
    fontWeight: 500,
}));

export const CaptionSubtitle = styled(Typography)(() => ({
    fontSize: '0.75rem',
    color: 'rgba(255, 255, 255, 0.7)',
}));

export const ContentColumn = styled(motion.div)(() => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
}));

export const ColumnTitle = styled(Typography)(() => ({
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#626284',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
}));

export const MetricsContainer = styled(Box)(() => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
}));

export const MetricItem = styled(Box)(() => ({
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
}));

export const MetricIconBox = styled(Box)(() => ({
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    backgroundColor: 'rgba(15, 37, 87, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: '#0F2557',
}));

export const MetricContent = styled(Box)(() => ({
    display: 'flex',
    flexDirection: 'column',
}));

export const MetricValue = styled(Typography)(() => ({
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#09090B',
}));

export const MetricLabel = styled(Typography)(() => ({
    fontSize: '0.875rem',
    color: '#626284',
}));

export const CapabilitiesContainer = styled(Box)(() => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
}));

export const CapabilityCard = styled(Box)(() => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    borderRadius: '12px',
    backgroundColor: 'rgba(243, 245, 246, 0.5)',
    transition: 'background-color 0.2s',
    color: '#26A69A',
    '&:hover': {
        backgroundColor: '#F3F5F6',
    },
    '& span': {
        fontSize: '0.875rem',
        fontWeight: 500,
        color: '#09090B',
        flexShrink: 0,
    },
}));

export const TrustContainer = styled(Box)(() => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
}));

export const TrustCard = styled(Box)(() => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    borderRadius: '12px',
    border: '1px solid rgba(76, 175, 80, 0.2)',
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
    color: '#4CAF50',
    '& span': {
        fontSize: '0.875rem',
        fontWeight: 500,
        color: '#09090B',
        flexShrink: 0,
    },
}));

export const FooterSection = styled(motion.div)(() => ({
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
}));

export const FooterText = styled(Typography)(() => ({
    color: '#626284',
    maxWidth: '672px',
    margin: '0 auto',
}));

export const CTAButton = styled(Button)(() => ({
    alignSelf: 'center',
    border: '1px solid #1F79D4',
    color: '#1F79D4',
    padding: '8px 16px',
    borderRadius: '6px',
    fontWeight: 500,
    textTransform: 'none',
    fontSize: '0.875rem',
    gap: '8px',
    '&:hover': {
        backgroundColor: 'rgba(31, 121, 212, 0.1)',
    },
    transition: 'background-color 0.2s',
}));


