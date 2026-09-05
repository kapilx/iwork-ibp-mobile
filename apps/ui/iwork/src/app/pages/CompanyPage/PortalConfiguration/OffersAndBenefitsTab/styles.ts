import { Box, Typography, styled } from '@mui/material';

export const TabContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(3),
    margin: theme.spacing(0, 3),
    paddingTop: theme.spacing(4),
}));

export const HeaderRow = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(2),
}));

export const SectionHeading = styled(Typography)(({ theme }) => ({
    fontSize: '16px',
    fontWeight: 600,
    color: theme.palette.text.primary,
}));

export const SectionSubheading = styled(Typography)(({ theme }) => ({
    fontSize: '13px',
    color: theme.palette.grey[600],
}));

// Requested palette: blue #DFE7FD, green #E2ECE9, pink #FDE2E4 — cycled
// per row, with a deeper shade of each hue used for border/accent/shadow.
export type RowTone = 'blue' | 'green' | 'pink';

const ROW_BG: Record<RowTone, string> = {
    blue: 'linear-gradient(90deg, #DFE7FD -25%, #FFFFFF 85%)',
    green: 'linear-gradient(90deg, #E2ECE9 -25%, #FFFFFF 85%)',
    pink: 'linear-gradient(90deg, #FDE2E4 -25%, #FFFFFF 85%)',
};
const ROW_BORDER: Record<RowTone, string> = {
    blue: '#C1D1FA',
    green: '#C3DAD1',
    pink: '#F7C4C9',
};
const ROW_ACCENT: Record<RowTone, string> = {
    blue: '#5D7FE8',
    green: '#5FA98A',
    pink: '#EA8A93',
};
const ROW_SHADOW: Record<RowTone, string> = {
    blue: '#A9C0F5',
    green: '#A9D3C0',
    pink: '#F4B4BA',
};
const THUMB_BG: Record<RowTone, string> = {
    blue: 'linear-gradient(135deg, #DFE7FD 0%, #A9C0F5 140%)',
    green: 'linear-gradient(135deg, #E2ECE9 0%, #A9D3C0 140%)',
    pink: 'linear-gradient(135deg, #FDE2E4 0%, #F4B4BA 140%)',
};

export const ItemCard = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'tone',
})<{ tone?: RowTone }>(({ theme, tone = 'blue' }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    padding: theme.spacing(1.5, 2),
    border: `1px solid ${ROW_BORDER[tone]}`,
    borderLeft: `3px solid ${ROW_ACCENT[tone]}`,
    borderRadius: 12,
    background: ROW_BG[tone],
    boxShadow: `0 6px 16px -10px ${ROW_SHADOW[tone]}`,
}));

export const ItemThumb = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'tone',
})<{ tone?: RowTone }>(({ theme, tone = 'blue' }) => ({
    width: 56,
    height: 56,
    flexShrink: 0,
    borderRadius: theme.spacing(1),
    background: THUMB_BG[tone],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    '& img': {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
}));

export const ItemInfo = styled(Box)(() => ({
    flex: 1,
    minWidth: 0,
}));

export const ItemTitle = styled(Typography)(() => ({
    fontSize: '14px',
    fontWeight: 600,
}));

export const ItemUrl = styled(Typography)(({ theme }) => ({
    fontSize: '12px',
    color: theme.palette.grey[600],
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
}));

export const ItemActions = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    flexShrink: 0,
}));

export const EmptyState = styled(Box)(({ theme }) => ({
    padding: theme.spacing(4),
    textAlign: 'center',
    color: theme.palette.grey[600],
    border: `1px dashed ${theme.palette.divider}`,
    borderRadius: theme.spacing(1),
}));

export const UploadBox = styled(Box)(({ theme }) => ({
    border: `2px dashed ${theme.palette.divider}`,
    borderRadius: theme.spacing(1),
    padding: theme.spacing(2),
    cursor: 'pointer',
    transition: 'border-color 0.2s',
    '&:hover': {
        borderColor: theme.palette.primary.main,
    },
}));

export const FormFieldGroup = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
}));

export const FormPanel = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    padding: theme.spacing(3),
    border: '1px solid #C1D1FA',
    borderTop: '3px solid #5D7FE8',
    borderRadius: 12,
    background: 'linear-gradient(180deg, #DFE7FD 0%, #FFFFFF 60%)',
    boxShadow: '0 6px 16px -10px #A9C0F5',
}));

export const FormPanelHeading = styled(Typography)(({ theme }) => ({
    fontSize: '15px',
    fontWeight: 600,
    color: theme.palette.text.primary,
}));

export const FormPanelActions = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'flex-end',
    gap: theme.spacing(1.5),
    marginTop: theme.spacing(1),
}));
