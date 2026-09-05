import { Box, Typography, styled } from '@mui/material';
import { CheckCircle as CheckIcon, Security as ShieldIcon } from '@mui/icons-material';
import DoneIcon from '../../../../assets/svgs/done.svg';

export const ViewContainer = styled(Box)(({ theme }) => ({
    paddingTop: theme.spacing(5),
}));

export const HeaderSection = styled(Box)(({ theme }) => ({
    marginBottom: theme.spacing(3),
}));

export const PolicyCard = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'configured',
})<{ configured?: boolean }>(({ theme, configured }) => ({
    border: configured
        ? `1px solid #eeeeee`
        : `1px solid #eeeeee`,
    borderRadius: theme.spacing(2.5),
    backgroundColor: theme.palette.common.white,
    marginBottom: theme.spacing(4),
    overflow: 'hidden',
}));

export const PolicyHeader = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'configured',
})<{ configured?: boolean }>(({ theme, configured }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(2),
    borderBottom: `1px solid ${
        configured ? "#eeeeee" : "#eeeeee"
    }`,
    backgroundColor: configured ? `${theme.palette.primary.light}10` : theme.palette.grey[50],
}));

export const PolicyContent = styled(Box)(({ theme }) => ({
    padding: theme.spacing(3),
}));

export const ConfigBadge = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'configured',
})<{ configured?: boolean }>(({ theme, configured }) => ({
    padding: theme.spacing(0.5, 2),
    borderRadius: 20,
    backgroundColor: configured ? theme.palette.primary.light : theme.palette.grey[200],
    color: configured ? theme.palette.primary.main : 'inherit',
    fontSize: '12px',
    fontWeight: 500,
}));

export const InfoLabel = styled(Typography)(({ theme }) => ({
    fontSize: '11px',
    fontWeight: 500,
    textTransform: 'uppercase',
    marginBottom: theme.spacing(0.5),
}));

export const SettingRow = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
}));

export const PolicyIcon = styled(ShieldIcon, {
    shouldForwardProp: (prop) => prop !== 'configured',
})<{ configured?: boolean }>(({ theme, configured }) => ({
    fontSize: 20,
    color: configured ? theme.palette.primary.main : theme.palette.grey[400],
}));
export const ModuleActiveIconBox = styled(Box)(({ theme }) => ({
    width: 40,
    height: 40,
    borderRadius: theme.spacing(1),
    backgroundColor:  '#EFF6FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
}));
export const SettingIcon = styled(CheckIcon, {
    shouldForwardProp: (prop) => prop !== 'active',
})<{ active: boolean }>(({ theme, active }) => ({
    fontSize: 16,
    color: active ? theme.palette.success.main : theme.palette.grey[300],
}));
export const successCircleSrc = DoneIcon

export const ActiveCircle = styled("img")(({ theme }) => ({
  width: 20,
  marginTop:theme.spacing(1.5),
  height: 20,
}));