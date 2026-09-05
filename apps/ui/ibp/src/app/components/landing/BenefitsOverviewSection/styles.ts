import { styled, Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';

export const SectionContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(16, 0),
  background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.03), rgba(0, 0, 0, 0.06))',
  position: 'relative',
  overflow: 'hidden',
}));

export const BackgroundImageAccent = styled(Box)(({ theme }) => ({
  position: 'absolute',
  right: 0,
  top: '50%',
  transform: 'translateY(-50%)',
  width: '33.333%',
  height: '100%',
  opacity: 0.2,
}));

export const BackgroundImageWrapper = styled(Box)(() => ({
  position: 'relative',
  height: '100%',
}));

export const BackgroundImage = styled('img')(() => ({
  position: 'absolute',
  right: 0,
  top: '50%',
  transform: 'translateY(-50%)',
  width: '100%',
  height: '80%',
  objectFit: 'cover',
  borderRadius: '24px 0 0 24px',
  opacity: 1,
}));

export const BackgroundGradientOverlay = styled(Box)(() => ({
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(to right, rgba(0, 0, 0, 0.06) 0%, rgba(0, 0, 0, 0.04) 50%, transparent 100%)',
}));

export const ContentWrapper = styled(Box)(({ theme }) => ({
  padding: theme.spacing(0, 8),
  position: 'relative',
}));

export const HeaderSection = styled(motion.div)(({ theme }) => ({
  textAlign: 'center',
  maxWidth: '768px',
  margin: '0 auto',
  marginBottom: theme.spacing(12),
}));

export const Title = styled(Typography)(({ theme }) => ({
  fontSize: '2rem',
  fontWeight: 700,
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(4),
  [theme.breakpoints.up('lg')]: {
    fontSize: '2.5rem',
  },
}));

export const Subtitle = styled(Typography)(({ theme }) => ({
  fontSize: '1.125rem',
  color: theme.palette.text.tertiary,
}));

export const BenefitsGrid = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(4),
  marginBottom: theme.spacing(8),
  // 360–768px: wrap into a 2-column grid
  '@media (max-width: 768px)': {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: theme.spacing(2),
  },
  '@media (max-width: 480px)': {
    gridTemplateColumns: '1fr',
  },
}));

export const BenefitCard = styled(motion.div)(({ theme }) => ({
  backgroundColor: 'white',
  borderRadius: theme.spacing(2),
  padding: theme.spacing(5),
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  border: `1px solid ${theme.palette.border}`,
  transition: 'all 0.2s',
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
  },
  '@media (max-width: 768px)': {
    padding: theme.spacing(3),
  },
}));

export const IconContainer = styled(Box)<{ gradient: string }>(({ gradient, theme }) => ({
  width: '48px',
  height: '48px',
  borderRadius: theme.spacing(4),
  background: gradient,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: theme.spacing(4),
  color: 'white',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'scale(1.1)',
  },
  '@media (max-width: 768px)': {
    width: '36px',
    height: '36px',
    marginBottom: theme.spacing(2),
    '& svg': {
      width: '18px',
      height: '18px',
    },
  },
}));

export const BenefitHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

export const BenefitName = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  color: theme.palette.text.primary,
  fontSize: '0.875rem',
  [theme.breakpoints.up('lg')]: {
    fontSize: '1rem',
  },
  '@media (max-width: 768px)': {
    fontSize: '0.75rem',
  },
}));

export const BenefitCode = styled(Box)(({ theme }) => ({
  fontSize: '0.75rem',
  padding: theme.spacing(0.5, 1.5),
  backgroundColor: 'rgba(0, 0, 0, 0.05)',
  borderRadius: theme.spacing(0.5),
  fontFamily: 'monospace',
  color: theme.palette.text.tertiary,
  '@media (max-width: 768px)': {
    fontSize: '0.625rem',
    padding: theme.spacing(0.25, 1),
  },
}));

export const BenefitDescription = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  color: theme.palette.text.tertiary,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  [theme.breakpoints.up('lg')]: {
    fontSize: '0.875rem',
  },
  '@media (max-width: 768px)': {
    fontSize: '0.625rem',
    lineHeight: 1.4,
  },
}));

export const ValueStatement = styled(motion.div)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(3),
  textAlign: 'center',
}));

export const ValueText = styled(Typography)(({ theme }) => ({
  fontSize: '0.875rem',
  color: theme.palette.text.tertiary,
  '& strong': {
    fontWeight: 700,
    color: theme.palette.text.primary,
  },
  [theme.breakpoints.up('lg')]: {
    fontSize: '1rem',
  },
}));
