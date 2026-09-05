import { styled, Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';

export const SectionContainer = styled(Box)(({ theme }) => ({
    padding: '64px 0',
    backgroundColor: 'rgba(243, 245, 246, 0.4)',
    position: 'relative',
    [theme.breakpoints.up('lg')]: {
        padding: '96px 0',
    },
}));

export const ContentWrapper = styled(Box)(() => ({
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 16px',
}));

export const HeaderSection = styled(motion.div)(() => ({
    textAlign: 'center',
    maxWidth: '672px',
    margin: '0 auto 48px',
}));

export const Title = styled(Typography)(({ theme }) => ({
    fontSize: '1.875rem',
    fontWeight: 700,
    color: theme.palette.text.primary,
    marginBottom: '16px',
    [theme.breakpoints.up('lg')]: {
        fontSize: '2.25rem',
    },
}));

export const Subtitle = styled(Typography)(() => ({
    fontSize: '1.125rem',
    color: '#626284',
}));

// ─── Desktop horizontal timeline (≥ 1280px) ───────────────────────────────────

export const TimelineContainer = styled(motion.div)(() => ({
    display: 'none',
    position: 'relative',
    maxWidth: '1152px',
    margin: '0 auto',
    '@media (min-width: 1280px)': {
        display: 'block',
    },
}));

export const TimelineBar = styled(Box)(() => ({
    position: 'absolute',
    top: '28px',
    left: '8%',
    right: '8%',
    height: '2px',
    background: 'linear-gradient(to right, #1F79D4, #26A69A, #4CAF50)',
}));

export const StepsRow = styled(Box)(() => ({
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: '16px',
}));

export const StepItem = styled(Box)(() => ({
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
}));

export const StepCircle = styled(Box)(() => ({
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: '#FFFFFF',
    border: '4px solid #1F79D4',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 10,
    marginBottom: '16px',
}));

export const StepNumber = styled(Box)(() => ({
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#FF6B35',
    color: '#FFFFFF',
    fontSize: '0.75rem',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
}));

export const StepContent = styled(Box)(() => ({
    display: 'flex',
    flexDirection: 'column',
}));

export const StepTitle = styled(Typography)(() => ({
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#000000',
    marginBottom: '4px',
}));

export const StepDescription = styled(Typography)(() => ({
    fontSize: '0.75rem',
    color: '#626284',
}));

// ─── Vertical stepper (< 1280px) — MUI Stepper style ─────────────────────────

export const MobileStepsContainer = styled(Box)(() => ({
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '560px',
    margin: '0 auto',
    '@media (min-width: 1280px)': {
        display: 'none',
    },
}));

export const MobileStepCard = styled(Box)(() => ({
    display: 'flex',
    alignItems: 'stretch',
    gap: '16px',
}));

// Left column: circle icon + connector line
export const MobileIconContainer = styled(Box)(() => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flexShrink: 0,
    width: '56px',
}));

// The circular icon bubble — matches horizontal StepCircle style exactly
export const MobileStepCircle = styled(Box)(() => ({
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: '#FFFFFF',
    border: '4px solid #1F79D4',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#1F79D4',
    flexShrink: 0,
    position: 'relative',
    zIndex: 1,
}));

// Number badge on top-right of circle
export const MobileStepNumber = styled(Box)(() => ({
    position: 'absolute',
    top: '-5px',
    right: '-5px',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: '#FF6B35',
    color: '#FFFFFF',
    fontSize: '0.6875rem',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
}));

// Vertical connector line between steps — mirrors the horizontal timeline gradient
export const MobileStepConnector = styled(Box)(() => ({
    width: '2px',
    flex: 1,
    minHeight: '24px',
    background: 'linear-gradient(to bottom, #1F79D4, #26A69A, #4CAF50)',
    borderRadius: '1px',
    margin: '4px 0',
}));

// Right column: step label + description
export const MobileStepContent = styled(Box)(() => ({
    flex: 1,
    paddingTop: '10px',
    paddingBottom: '28px',
}));

export const MobileStepTitle = styled(Typography)(() => ({
    fontSize: '1rem',
    fontWeight: 600,
    color: '#09090B',
    marginBottom: '4px',
}));

export const MobileStepDescription = styled(Typography)(() => ({
    fontSize: '0.875rem',
    color: '#626284',
    lineHeight: 1.5,
}));
