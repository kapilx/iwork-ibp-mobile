import { Accordion, AccordionDetails, AccordionSummary, Box, styled } from '@mui/material';

export const DashboardContainer = styled(Box)(({ theme }) => ({
    paddingTop: theme.spacing(5),
}));

export const StyledAccordion = styled(Accordion)(({ theme }) => ({
    border: `1px solid ${theme.palette.grey[200]}`,
    borderRadius: theme.spacing(1.5),
    marginBottom: theme.spacing(2),
    boxShadow: 'none',
    '&:before': {
        display: 'none',
    },
    '&:last-child': {
        marginBottom: 0,
    },
}));

export const StyledAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
    padding: theme.spacing(2, 3),
    minHeight: 72,
    '& .MuiAccordionSummary-content': {
        margin: theme.spacing(2, 0),
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(2),
    },
    '& .MuiAccordionSummary-expandIconWrapper': {
        color: theme.palette.grey[600],
    },
}));

export const StyledAccordionDetails = styled(AccordionDetails)(({ theme }) => ({
    padding: theme.spacing(0),
    borderTop: `1px solid ${theme.palette.grey[100]}`,
}));

export const AccordionIconBox = styled(Box)(({ theme }) => ({
    width: 48,
    height: 48,
    borderRadius: theme.spacing(1.5),
    backgroundColor: '#EFF6FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
}));

export const AccordionNumber = styled(Box)(({ theme }) => ({
    width: 32,
    height: 32,
    borderRadius: '50%',
    backgroundColor: theme.palette.grey[100],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: 600,
    color: theme.palette.grey[700],
    flexShrink: 0,
}));

export const AccordionTitle = styled(Box)(({ theme }) => ({
    fontSize: '16px',
    fontWeight: 600,
    color: theme.palette.text.primary,
}));

export const AccordionSubtitle = styled(Box)(({ theme }) => ({
    fontSize: '14px',
    color: theme.palette.grey[600],
    marginTop: theme.spacing(0.5),
}));
