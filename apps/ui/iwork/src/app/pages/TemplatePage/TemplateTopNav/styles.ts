import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { NavLink } from 'react-router-dom';

export const NavContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 3),
  borderBottom: `${theme.spacing(0.125)} solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  marginBottom: theme.spacing(3),
  height: theme.spacing(10),
}));

export const NavItem = styled(NavLink)(({ theme }) => ({
  textDecoration: 'none',
  padding: theme.spacing(0, 3),
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  position: 'relative',
  fontSize: theme.typography.body1.fontSize,
  fontWeight: 500,
  color: theme.palette.primary.main,
  cursor: 'pointer',
  '&.active': {
    color: theme.palette.primary.main,
    fontWeight: 600,
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: theme.spacing(0.25),
      backgroundColor: theme.palette.primary.main,
    },
  },
}));

export const NavBrand = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  marginRight: theme.spacing(4),
  color: theme.palette.text.primary,
  fontSize: theme.typography.h6.fontSize,
}));
