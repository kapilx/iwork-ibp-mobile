import { Accordion, AccordionDetails, AccordionSummary, Box, styled } from '@mui/material';

export const ContentContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(4),
}));

export const SectionBlock = styled(Box)(({ theme }) => ({
    border: `1px solid ${theme.palette.grey[200]}`,
    borderRadius: theme.spacing(1.5),
    padding: theme.spacing(3),
}));

export const SectionHeading = styled(Box)(({ theme }) => ({
    fontSize: '16px',
    fontWeight: 600,
    color: theme.palette.text.primary,
}));

export const SectionSubheading = styled(Box)(({ theme }) => ({
    fontSize: '13px',
    color: theme.palette.grey[600],
    marginTop: theme.spacing(0.5),
    marginBottom: theme.spacing(2.5),
}));

export const CardRow = styled(Box)(({ theme }) => ({
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    gap: theme.spacing(3),
    alignItems: 'start',
    padding: theme.spacing(2.5),
    borderRadius: theme.spacing(1.5),
    border: `1px solid ${theme.palette.grey[100]}`,
    backgroundColor: theme.palette.grey[50],
    marginBottom: theme.spacing(2),
    '&:last-child': { marginBottom: 0 },
}));

export const CardRowFormCol = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
}));

export const CardRowHeader = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(1),
}));

export const CardRowSlotLabel = styled(Box)(({ theme }) => ({
    fontSize: '12px',
    fontWeight: 600,
    color: theme.palette.grey[500],
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
}));

export const TagsRow = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    alignItems: 'center',
}));

export const LinkFieldsRow = styled(Box)(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(2),
    alignItems: 'flex-start',
}));

export const AddCardRow = styled(Box)(({ theme }) => ({
    marginTop: theme.spacing(1),
}));

export const PreviewCard = styled(Box)(({ theme }) => ({
    border: `1px solid ${theme.palette.grey[200]}`,
    borderRadius: theme.spacing(1.5),
    backgroundColor: theme.palette.common.white,
    overflow: 'hidden',
    boxShadow: '0 1px 2px rgba(16, 24, 40, 0.05)',
}));

export const PreviewThumbnail = styled('img')({
    width: '100%',
    height: 140,
    objectFit: 'cover',
    display: 'block',
});

export const PreviewBody = styled(Box)(({ theme }) => ({
    padding: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
}));

export const PreviewHeading = styled(Box)(({ theme }) => ({
    fontSize: '15px',
    fontWeight: 600,
    color: theme.palette.text.primary,
}));

export const PreviewSubheading = styled(Box)(({ theme }) => ({
    fontSize: '13px',
    color: theme.palette.grey[600],
    lineHeight: 1.4,
}));

export const PreviewCtaRow = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: theme.spacing(0.5),
}));

export const DragHandle = styled(Box)(({ theme }) => ({
    cursor: 'grab',
    color: theme.palette.grey[400],
    display: 'flex',
    alignItems: 'center',
}));

export const StripLabel = styled(Box)(({ theme }) => ({
    fontSize: '12px',
    fontWeight: 600,
    color: theme.palette.grey[500],
    marginTop: theme.spacing(2.5),
    marginBottom: theme.spacing(1),
}));

export const StripContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(2),
    overflowX: 'auto',
    paddingBottom: theme.spacing(1),
}));

export const StripItem = styled(Box)({
    position: 'relative',
    cursor: 'pointer',
    flexShrink: 0,
});

export const StripEditIcon = styled(Box)(({ theme }) => ({
    position: 'absolute',
    top: theme.spacing(0.75),
    right: theme.spacing(0.75),
    width: 24,
    height: 24,
    borderRadius: '50%',
    backgroundColor: theme.palette.common.white,
    border: `1px solid ${theme.palette.grey[200]}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.palette.grey[600],
    boxShadow: '0 1px 2px rgba(16, 24, 40, 0.1)',
}));

export const ColorSwatchRow = styled(Box)(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(1.25),
    alignItems: 'center',
}));

export const ColorSwatchButton = styled('button')<{ selected?: boolean; swatchcolor: string }>(
    ({ theme, selected, swatchcolor }) => ({
        width: 28,
        height: 28,
        borderRadius: '50%',
        border: selected ? `2px solid ${theme.palette.grey[900]}` : `1px solid ${theme.palette.grey[200]}`,
        backgroundColor: swatchcolor,
        cursor: 'pointer',
        padding: 0,
        outline: 'none',
        boxShadow: selected ? '0 0 0 2px #fff inset' : 'none',
    })
);

export const TileBox = styled(Box)(({ theme }) => ({
    borderRadius: theme.spacing(1.5),
    padding: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    overflow: 'hidden',
}));

export const TileTopRow = styled(Box)({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
});

export const TileIconBadge = styled(Box)(({ theme }) => ({
    width: 32,
    height: 32,
    borderRadius: theme.spacing(1),
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
}));

export const TileSmallLabel = styled(Box)({
    fontSize: '13px',
    fontWeight: 600,
    marginTop: 12,
});

export const TileBigHeadline = styled(Box)({
    fontSize: '18px',
    fontWeight: 700,
    marginTop: 6,
    lineHeight: 1.3,
});

export const TileHeadlineVivid = styled(Box)({
    fontSize: '17px',
    fontWeight: 700,
    marginTop: 'auto',
});

export const TileSubLabelVivid = styled(Box)({
    fontSize: '13px',
    fontWeight: 500,
    marginTop: 6,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
});

export const TileAccordion = styled(Accordion)(({ theme }) => ({
    border: `1px solid ${theme.palette.grey[200]}`,
    borderRadius: `${theme.spacing(1.5)} !important`,
    marginBottom: theme.spacing(2),
    boxShadow: 'none',
    '&:before': { display: 'none' },
    '&:last-of-type': { marginBottom: 0 },
}));

export const TileAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
    padding: theme.spacing(0, 2),
    minHeight: 56,
    '& .MuiAccordionSummary-content': {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1.5),
    },
}));

export const TileAccordionDetails = styled(AccordionDetails)(({ theme }) => ({
    padding: theme.spacing(0, 2, 2.5),
    borderTop: `1px solid ${theme.palette.grey[100]}`,
}));

export const TileSummaryDot = styled('span')<{ swatchcolor: string }>(({ swatchcolor }) => ({
    width: 14,
    height: 14,
    borderRadius: '50%',
    backgroundColor: swatchcolor,
    flexShrink: 0,
}));

export const TileSummaryText = styled(Box)(({ theme }) => ({
    fontSize: '14px',
    fontWeight: 500,
    color: theme.palette.text.primary,
    flex: 1,
}));
