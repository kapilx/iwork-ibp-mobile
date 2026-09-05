import { Box, Chip, Typography, styled } from '@mui/material';

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
  flexWrap: 'wrap',
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

export const SelectorRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  flexWrap: 'wrap',
}));

export const EditorPanel = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  padding: theme.spacing(3),
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 8,
  backgroundColor: theme.palette.background.paper,
}));

// SplitView/SourcePane/PaneLabel/PreviewFrame (the GrapesJS edit pane +
// live-preview split) moved to ../shared/grapesJsEditorStyles.ts — now also
// used by the general Template Editor's email-channel body editor, not just
// this override editor. Import from there instead of duplicating here.

export const StatusBadge = styled(Chip)<{ tone: 'default' | 'override' | 'disabled' }>(({ theme, tone }) => ({
  fontSize: '11px',
  fontWeight: 600,
  height: 22,
  ...(tone === 'override'
    ? { backgroundColor: '#EEF2FF', color: '#4F46E5' }
    : tone === 'disabled'
    ? { backgroundColor: theme.palette.error.light + '20', color: theme.palette.error.main }
    : { backgroundColor: theme.palette.grey[100], color: theme.palette.grey[700] }),
}));

export const EmptyStateBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(6),
  color: theme.palette.grey[600],
  textAlign: 'center',
}));

// --- New for the Template Management "Customise" drill-down ---

// One row in the "already customized for" list — a company/domain pair the
// admin can click straight into editing.
export const OverrideListRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(2),
  padding: theme.spacing(1.5, 2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  cursor: 'pointer',
  '&:last-of-type': { borderBottom: 'none' },
  '&:hover': { backgroundColor: theme.palette.grey[50] },
}));

export const OverrideListPanel = styled(Box)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 8,
  backgroundColor: theme.palette.background.paper,
  overflow: 'hidden',
}));

export const CompanyDomainChip = styled(Chip)(({ theme }) => ({
  fontSize: '11px',
  fontWeight: 600,
  height: 22,
  backgroundColor: theme.palette.grey[100],
  color: theme.palette.grey[700],
}));

export const PickerStep = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  padding: theme.spacing(1, 0),
}));
