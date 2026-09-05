import { Box, styled, Alert, TextField, Card, CardContent, Typography } from "@mui/material";

export const PendingApprovalTemplateCard = styled(Card)(({ theme }) => ({
    minHeight: theme.spacing(32),
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.2s ease-in-out',
    cursor: 'pointer',
    '&:hover': {
        boxShadow: theme.shadows[6],
        transform: `translateY(${theme.spacing(-0.5)})`,
    },
}));

export const PendingApprovalCardContent = styled(CardContent)(({ theme }) => ({
    flexGrow: 1,
    gap: theme.spacing(1),
    display: 'flex',
    flexDirection: 'column',
    padding: `${theme.spacing(2)} !important`,
}));

export const PendingApprovalCardHeader = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing(2),
}));

export const PendingApprovalCardTitle = styled(Typography)(() => ({
    fontWeight: 600,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
}));

export const PendingApprovalCardChips = styled(Box)(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(2),
}));

export const PendingApprovalCardFooter = styled(Typography)(({ theme }) => ({
    color: theme.palette.primary.light,
    fontSize: theme.typography.caption.fontSize,
    marginTop: 'auto',
}));

export const PendingApprovalsGrid = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(3),
    width: '100%',
}));

export const PendingApprovalGridItem = styled(Box)(({ theme }) => ({
    flex: `0 0 calc(33.333% - ${theme.spacing(2)})`,
    width: `calc(33.333% - ${theme.spacing(2)})`,
    maxWidth: `calc(33.333% - ${theme.spacing(2)})`,
    [theme.breakpoints.down('md')]: {
        flex: `0 0 calc(50% - ${theme.spacing(1.5)})`,
        width: `calc(50% - ${theme.spacing(1.5)})`,
        maxWidth: `calc(50% - ${theme.spacing(1.5)})`,
    },
    [theme.breakpoints.down('sm')]: {
        flex: '0 0 100%',
        width: '100%',
        maxWidth: '100%',
    },
}));

export const ApprovalActions = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'flex-end',
    gap: theme.spacing(1),
    marginTop: theme.spacing(2),
    padding: theme.spacing(1, 0),
    borderTop: `${theme.spacing(0.125)} solid ${theme.palette.divider}`,
}));

export const FooterLine = styled('div')(({ theme }) => ({
    marginTop: theme.spacing(0.5),
}));

export const StyledAlert = styled(Alert)(({ theme }) => ({
    marginBottom: theme.spacing(2),
}));

export const DialogContentContainer = styled(Box)(({ theme }) => ({
    marginTop: theme.spacing(1),
}));

export const StyledCommentTextField = styled(TextField)(({ theme }) => ({
    '& .MuiInputLabel-root': {
        color: theme.palette.primary.light,
    },
    '& .MuiInputLabel-root.Mui-focused': {
        color: theme.palette.primary.main,
    },
    '& .MuiInputLabel-root.Mui-error': {
        color: theme.palette.error.main,
    },
    '& .MuiInputBase-input::placeholder': {
        color: theme.palette.primary.light,
        opacity: 1,
    },
}));