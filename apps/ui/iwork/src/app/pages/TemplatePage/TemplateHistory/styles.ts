import { Box, TableContainer, TableCell, Chip, Typography, Table } from '@mui/material';
import { styled } from '@mui/material/styles';
import { ApprovalStatusEnum } from '../TemplateDashboard/types';

export const StyledContainer = styled(Box)(({ theme }) => ({
    padding: theme.spacing(3),
}));

export const HeaderSection = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(3),
}));

export const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
    marginTop: theme.spacing(2),
    boxShadow: 'none',
    border: `${theme.spacing(0.125)} solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    overflow: 'hidden',
}));

export const StyledTableCellHead = styled(TableCell)(({ theme }) => ({
    backgroundColor: theme.palette.grey[50],
    fontWeight: 600,
    color: theme.palette.primary.light,
}));

export const StatusChip = styled(Chip)<{ status: string }>(({ theme, status }) => {
    let color = theme.palette.grey[500];
    let bgColor = theme.palette.grey[50];

    switch (status) {
        case ApprovalStatusEnum.APPROVED:
            color = theme.palette.success.main;
            bgColor = theme.palette.success.light + '20';
            break;
        case ApprovalStatusEnum.REJECTED:
            color = theme.palette.error.main;
            bgColor = theme.palette.error.light + '20';
            break;
        case ApprovalStatusEnum.PENDING_APPROVAL:
            color = theme.palette.warning.main;
            bgColor = theme.palette.warning.light + '20';
            break;
        case ApprovalStatusEnum.DRAFT:
            color = theme.palette.info.main;
            bgColor = theme.palette.info.light + '20';
            break;
    }

    return {
        color,
        backgroundColor: bgColor,
        fontWeight: 500,
        textTransform: 'capitalize',
    };
});

export const ActionText = styled(Typography)(({ theme }) => ({
    fontWeight: 500,
    textTransform: 'uppercase',
    fontSize: theme.typography.caption.fontSize,
}));

export const StyledTable = styled(Table)(({ theme }) => ({
    minWidth: theme.spacing(81.25), // ~650px
}));

export const CommentsTableCell = styled(TableCell)(({ theme }) => ({
    maxWidth: theme.spacing(62.5), // ~500px
}));

export const CommentText = styled(Typography)(({ theme }) => ({
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
}));

export const HeaderActionsBox = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
}));

export const LoadingBox = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'center',
    paddingTop: theme.spacing(8),
    paddingBottom: theme.spacing(8),
}));

export const StatusChangeBox = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
}));