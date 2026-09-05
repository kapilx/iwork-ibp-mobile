import { Box, IconButton, styled } from '@mui/material';
import {
    DragIndicator as DragIcon,
    KeyboardArrowDown as CaretDownIcon,
    KeyboardArrowRight as CaretRightIcon,
    Visibility as VisibilityIcon,
} from '@mui/icons-material';

type Position = {
    x: number;
    y: number;
};

export const ControlsContainer = styled(Box, {
    shouldForwardProp: (prop) =>
        !['collapsed', 'isDragging', 'hasCustomPosition', 'position', 'expanded'].includes(
            prop as string
        ),
})<{
    collapsed?: boolean;
    isDragging?: boolean;
    hasCustomPosition?: boolean;
    position?: Position;
    expanded?: boolean;
}>(({ theme, collapsed, isDragging, hasCustomPosition, position, expanded }) => ({
    position: 'fixed',
    backgroundColor: theme.palette.common.white,
    borderRadius: theme.spacing(1.5),
    boxShadow: theme.shadows[6],
    border: `1px solid ${theme.palette.grey[200]}`,
    zIndex: 1300,
    userSelect: 'none',
    width: collapsed ? 'auto' : 280,
    maxWidth: 280,
    maxHeight: collapsed ? 60 : 350,
    overflow: collapsed ? 'hidden' : 'visible',
    cursor: collapsed ? (isDragging ? 'grabbing' : 'grab') : 'default',
    right: theme.spacing(3),
    bottom: theme.spacing(3),
    ...(expanded && { transform: 'translateY(-100%)', top: 'auto' }),
    ...(collapsed &&
        hasCustomPosition &&
        position && {
            left: `${position.x}px`,
            top: `${position.y}px`,
            right: 'auto',
            bottom: 'auto',
        }),
}));

export const CollapsedHeader = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    padding: theme.spacing(1.5, 2),
    borderRadius: theme.spacing(1.5),
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    height: 48,
    minHeight: 48,
    maxHeight: 48,
}));

export const ExpandedContainer = styled(Box)(({ theme }) => ({
    padding: theme.spacing(2),
}));

export const ControlsHeader = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(2),
    paddingBottom: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
}));

export const HeaderLeft = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
}));

export const HeaderText = styled('span')(({ theme }) => ({
    fontSize: '12px',
    color: theme.palette.text.primary,
}));

export const StatusButton = styled('button', {
    shouldForwardProp: (prop) => prop !== 'active' && prop !== 'statusColor',
})<{
    active?: boolean;
    statusColor?: string;
}>(({ theme, active, statusColor }) => ({
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    padding: theme.spacing(1.5, 2),
    borderRadius: theme.spacing(1),
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.2s',
    backgroundColor: active ? statusColor : theme.palette.grey[100],
    color: active ? theme.palette.common.white : theme.palette.text.primary,
    '&:hover': {
        backgroundColor: active ? statusColor : theme.palette.grey[200],
    },
}));

export const StatusesContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
}));

export const StatusBadge = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'badgecolor',
})<{ badgecolor?: string }>(({ theme, badgecolor }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(0.5, 1.5),
    borderRadius: theme.spacing(1),
    backgroundColor: badgecolor || theme.palette.grey[500],
    color: theme.palette.common.white,
}));

export const StatusBadgeWrapper = styled(Box)(({ theme }) => ({
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
}));

export const StatusLabel = styled('span')(({ theme }) => ({
    fontWeight: 600,
    color: theme.palette.common.white,
    fontSize: '12px',
}));

export const DragHandleIcon = styled(DragIcon)(({ theme }) => ({
    fontSize: 16,
    color: theme.palette.grey[400],
}));

export const SmallVisibilityIcon = styled(VisibilityIcon)(({ theme }) => ({
    fontSize: 16,
    color: theme.palette.grey[600],
}));

export const DemoIcon = styled(VisibilityIcon)(({ theme }) => ({
    fontSize: 16,
    color: theme.palette.text.primary,
}));

export const CollapseButton = styled(IconButton)(({ theme }) => ({
    padding: theme.spacing(0.5),
}));

export const CollapseIcon = styled(CaretDownIcon)(({ theme }) => ({
    fontSize: 14,
}));

export const ExpandIcon = styled(CaretRightIcon)(({ theme }) => ({
    fontSize: 16,
}));
