import { Box, FormControlLabel, styled, Typography } from '@mui/material';

export const TabContainer = styled(Box)(({ theme }) => ({
    padding: theme.spacing(6),
}));

export const HeaderSection = styled(Box)(({ theme }) => ({
    marginBottom: theme.spacing(4),
}));

export const HeaderTitle = styled(Typography)(({ theme }) => ({
    ...theme.typography.h6,
    marginBottom: theme.spacing(1),
}));

export const HeaderDescription = styled(Typography)(({ theme }) => ({
    ...theme.typography.body2,
    color: theme.palette.text.primary,
}));

export const StyledFormControlLabel = styled(FormControlLabel)(({ theme }) => ({
    flex: 1,
    margin: 0,
    gap: theme.spacing(2),
    '& .MuiFormControlLabel-label': {
        marginLeft: 0,
    },
}));

export const LocationRow = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(3, 4),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.spacing(2),
    marginBottom: theme.spacing(2),
    backgroundColor: theme.palette.common.white,
    transition: 'all 0.2s',
    '&:hover': {
        boxShadow: theme.shadows[1],
        borderColor: theme.palette.primary.light,
    },
}));

export const LocationLabel = styled(Box)(({ theme }) => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
}));

export const AddressLine = styled(Typography)(() => ({
    fontSize: '14px',
    fontWeight: 500,
    color: '#000000',
}));

export const AddressDetail = styled(Typography)(() => ({
    fontSize: '12px',
    color: '#333333',
}));

export const ActionsBox = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
}));

export const EditActionIcon = styled('img')({
    width: 16,
    height: 16,
    display: 'block',
});

export const FooterActions = styled(Box)(({ theme }) => ({
    marginTop: theme.spacing(6),
    display: 'flex',
    justifyContent: 'flex-start',
}));

export const EmptyStateText = styled(Typography)(({ theme }) => ({
    ...theme.typography.body2,
    color: theme.palette.text.primary,
    padding: theme.spacing(4, 0),
    textAlign: 'center',
}));
