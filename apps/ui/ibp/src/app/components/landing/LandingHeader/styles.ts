import { styled, Box, Typography, Button, Dialog, DialogContent } from '@mui/material';

export const HeaderContainer = styled(Box)(({ theme }) => ({
  position: 'sticky',
  top: 0,
  zIndex: 50,
  width: '100%',
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(8px)',
  borderBottom: `1px solid ${theme.palette.border}`,
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
}));
export const HeaderRightSectionLogo = styled("img")(() => ({
  height: "36px",
  width: "60px",
  objectFit: "contain",
}));

export const HeaderContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  height: '64px',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(0, 6.5),
}));

export const LogosSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(4),
}));

export const LogoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
}));

export const LogoButton = styled("button")(() => ({
  background: "transparent",
  border: "none",
  padding: 0,
  margin: 0,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
}));

export const LogoIcon = styled(Box)(({ theme }) => ({
  height: '36px',
  width: '36px',
  borderRadius: theme.spacing(1),
  background: 'linear-gradient(135deg, #FF6B35 0%, rgba(255, 107, 53, 0.8) 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  fontWeight: 700,
  fontSize: '0.875rem',
}));

export const LogoText = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  color: theme.palette.text.primary,
  [theme.breakpoints.down('sm')]: {
    display: 'none',
  },
}));

export const Divider = styled(Box)(({ theme }) => ({
  height: '24px',
  width: '1px',
  backgroundColor: theme.palette.border,
  [theme.breakpoints.down('sm')]: {
    display: 'none',
  },
}));

export const SecondaryLogoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    display: 'none',
  },
}));

export const SecondaryLogoIcon = styled(Box)(({ theme }) => ({
  height: '32px',
  width: '32px',
  borderRadius: theme.spacing(0.5),
  backgroundColor: 'rgba(31, 121, 212, 0.1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#1F79D4',
  fontWeight: 700,
  fontSize: '0.75rem',
}));

export const SecondaryLogoText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.tertiary,
}));

export const ActionsSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(3),
}));

export const SupportButton = styled(Button)(({ theme }) => ({
  color: theme.palette.text.tertiary,
  textTransform: 'none',
  gap: theme.spacing(1),
  padding: theme.spacing(1.75, 7.75),
  border: '1px solid #D9D9D9',
  borderRadius: theme.spacing(1),
  fontSize:"12.31px",
  fontWeight: 500,
  '&:hover': {
    color: theme.palette.text.primary,
    borderColor: theme.palette.text.primary,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
}));

export const LoginButton = styled(Button)(({ theme }) => ({
  background: '#F26100',
  color: 'white',
  textTransform: 'none',
  fontSize:"12.31px",
    fontWeight: 500,
  padding: theme.spacing(1.75, 7.75),
  '&:hover': {
    opacity: 0.8,
  },
}));

export {
  SupportHelpDialog,
  SupportHelpHeader,
  SupportHelpTitle,
  SupportHelpCloseButton,
  SupportHelpDivider,
  SupportHelpContent,
  SupportHelpText,
} from '../../../common/SupportHelpContactDialog/styles';
