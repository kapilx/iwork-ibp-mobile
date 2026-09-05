import { Box, Typography, styled } from '@mui/material';

export const SectionTitle = styled(Typography)(({ theme }) => ({
    fontSize: '16px',
    fontWeight: 600,
    // color: theme.palette.text.primary,
    marginBottom: theme.spacing(2),
}));

export const RejectedContainer = styled(Box)(({ theme }) => ({
    position: 'relative',
    border: `2px solid ${theme.palette.error.main}`,
    borderRadius: theme.spacing(1),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.error.light + '10',
}));
export const LabelText = styled(Typography)(({ theme }) => ({
    fontSize: '12px',
    color: theme.palette.text.grey,
    marginBottom: theme.spacing(1),
}));
export const UrlPreview = styled(Box)(({ theme }) => ({
    fontSize: '14px',
    padding: theme.spacing(2.25, 3.5 ),
    backgroundColor: '#EFF6FF',
    borderRadius: theme.spacing(1),
    border: '1px solid #DBEAFE',
    color: theme.palette.text.primary,
    '& span': {
        color: '#3B82F6',
        fontWeight: 500,
    },
}));

export const UploadBox = styled(Box)(({ theme }) => ({
    border: `2px dashed ${theme.palette.divider}`,
    borderRadius: theme.spacing(1),
    padding: theme.spacing(3),
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'border-color 0.2s',
    '&:hover': {
        borderColor: theme.palette.primary.main,
    },
}));

export const InfoGrid = styled(Box)(({ theme }) => ({
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: theme.spacing(2),
}));

export const InfoItem = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
}));

export const InfoLabel = styled(Typography)(({ theme }) => ({
    fontSize: '12px',
}));

export const InfoValue = styled(Typography)(({ theme }) => ({
    fontSize: '13px',
    color: theme.palette.text.primary,
    marginTop: theme.spacing(0.5),
}));

export const CommentBox = styled(Box)(({ theme }) => ({
    marginTop: theme.spacing(2),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.error.light + '20',
    borderRadius: theme.spacing(1),
    border: `1px solid ${theme.palette.error.light}`,
}));

export const CommentHeader = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(1),
}));

export const CommentAuthor = styled(Typography)(({ theme }) => ({
    fontSize: '12px',
    fontWeight: 600,
    color: theme.palette.text.primary,
}));

export const CommentDate = styled(Typography)(({ theme }) => ({
    fontSize: '11px',
}));

export const CommentText = styled(Typography)(({ theme }) => ({
    fontSize: '13px',
    color: theme.palette.text.primary,
}));
