import { Box, Typography, styled } from '@mui/material';

// GrapesJS edit pane + live-preview split view — shared by the "Customise"
// override editor (TemplateCustomisation/TemplateOverrideEditor.tsx) and
// the general Template Editor's email-channel body editor
// (TemplateEditor/index.tsx). One copy, two consumers — see
// docs/IBP-Email-Notification-Company-Templates/ TRD for why this was
// extracted here instead of living inside TemplateCustomisation only.
export const SplitView = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: theme.spacing(2),
  width: '100%',
  [theme.breakpoints.down('md')]: {
    gridTemplateColumns: '1fr',
  },
}));

export const SourcePane = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  minWidth: 0,
  '& .gjs-editor': {
    borderRadius: 8,
    overflow: 'hidden',
    border: `1px solid ${theme.palette.divider}`,
    // Reclaim the space GrapesJS's own CSS reserves (via these two custom
    // properties) for the top toolbar / right style-manager sidebar, so the
    // canvas fills the whole pane once those panels are hidden below —
    // hiding the panel elements alone doesn't do this on its own, since
    // the canvas's width/height are computed from these vars, not from
    // sibling visibility.
    '--gjs-left-width': '0px',
    '--gjs-canvas-top': '0px',
  },
  // Top toolbar (undo/redo/preview/code-view/fullscreen) and the right
  // sidebar (style manager / trait manager / layer manager / block
  // manager, whichever is toggled open) — intentionally all hidden. The
  // only editing surface left is the canvas itself: double-click any text
  // to edit it in place, which is a core GrapesJS behaviour independent of
  // these panels.
  '& .gjs-pn-commands, & .gjs-pn-options, & .gjs-pn-views, & .gjs-pn-views-container, & .gjs-pn-devices-c':
    {
      display: 'none',
    },
}));

export const PaneLabel = styled(Typography)(({ theme }) => ({
  fontSize: '12px',
  fontWeight: 600,
  letterSpacing: '0.02em',
  textTransform: 'uppercase',
  color: theme.palette.grey[600],
}));

// Height is a prop, not hardcoded — it must match whatever height the
// GrapesJS edit pane on the other side of the split is rendered at (passed
// down as GrapesJsSplitEditor's own `height` prop), otherwise the two
// panes visibly end at different points even though they're meant to be
// the same editing surface side by side.
export const PreviewFrame = styled('iframe')<{ height?: number }>(({ theme, height = 420 }) => ({
  width: '100%',
  height,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 8,
  backgroundColor: '#fff',
}));
