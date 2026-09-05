import { Box, styled, Typography } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import DoneIcon from '../../../../assets/svgs/done.svg';

export const ConfigContainer = styled(Box)(({ theme }) => ({
    padding: theme.spacing(6),
  
}));

export const HeaderSection = styled(Box)(({ theme }) => ({
    marginBottom: theme.spacing(4),
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
}));

export const PolicyCard = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'configured',
})<{ configured?: boolean }>(({ theme, configured }) => ({
    border: configured
        ? `1px solid ${theme.palette.primary.light}`
        : `1px solid ${theme.palette.divider}`,
    borderRadius: theme.spacing(2.5),
    backgroundColor: theme.palette.common.white,
    overflow: 'hidden',
    marginBottom: theme.spacing(6),
    boxShadow: configured ? theme.shadows[2] : theme.shadows[1],
    transition: 'all 0.3s',
    '&:hover': {
        boxShadow: theme.shadows[3],
    },
}));

export const PolicyHeader = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'configured',
})<{ configured?: boolean }>(({ theme, configured }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(2,6),
    borderBottom: `1px solid ${configured ? theme.palette.primary.light : theme.palette.divider}`,
    backgroundColor: configured ? `${theme.palette.primary.light}10` : theme.palette.grey[50],
}));

export const PolicyContent = styled(Box)(({ theme }) => ({
    padding: theme.spacing(6,4),
}));

export const TogglesGrid = styled(Box)(({ theme }) => ({
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: theme.spacing(2),
}));

export const ToggleCard = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: theme.spacing(2),
    backgroundColor: theme.palette.grey[50],
    borderRadius: theme.spacing(1),
    transition: 'background-color 0.2s',
    '&:hover': {
        backgroundColor: theme.palette.grey[100],
    },
}));
export const ToggleContentWrapper = styled(Box)(({ theme }) => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing(2,0)
}));
export const BulkConfigCard = styled(Box)(({ theme }) => ({
    border: `2px dashed ${theme.palette.primary.main}`,
    borderRadius: theme.spacing(1),
    padding: theme.spacing(3),
    marginBottom: theme.spacing(4),
    backgroundColor: `${theme.palette.primary.light}05`,
}));

export const OverlayContainer = styled(Box)(({ theme }) => ({
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1300,
}));

export const OverlayContent = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.common.white,
    borderRadius: theme.spacing(2),
    padding: theme.spacing(4),
    maxWidth: 500,
    width: '90%',
    boxShadow: theme.shadows[24],
}));

export const PolicySelectionHeader = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(3),
}));

export const PolicySelectionDescription = styled(Typography)(({ theme }) => ({
    marginBottom: theme.spacing(3),
}));

export const PolicySelectionList = styled(Box)(({ theme }) => ({
    marginBottom: theme.spacing(3),
}));

export const PolicySelectionItem = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'selected',
})<{ selected: boolean }>(({ theme, selected }) => ({
    padding: theme.spacing(2),
    marginBottom: theme.spacing(1),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.spacing(1),
    cursor: 'pointer',
    backgroundColor: selected ? theme.palette.primary.light : 'transparent',
    transition: 'background-color 0.2s, border-color 0.2s',
}));

export const PolicySelectionCloseIcon = styled(CloseIcon)(({ theme }) => ({
    cursor: 'pointer',
    color: theme.palette.text.primary,
}));

export const SuccessCircle = styled('img')(({ theme }) => ({
    width: 20,
    height: 20,
    marginTop: theme.spacing(1.25),
}));

// Ensure SVG is bundled when used directly
export const successCircleSrc = DoneIcon;
