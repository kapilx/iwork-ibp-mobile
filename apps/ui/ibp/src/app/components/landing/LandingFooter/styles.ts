import { styled, Box, Typography, Link } from '@mui/material';

export const FooterContainer = styled('footer')(() => ({
    position: 'relative',
}));

export const GradientStrip = styled(Box)(() => ({
    height: '4px',
    width: '100%',
    background: 'linear-gradient(to right, #FF6B35, #1F79D4, #26A69A)',
}));

export const MainFooter = styled(Box)(() => ({
    backgroundColor: '#0F2557',
    color: 'white',
}));

export const ContentWrapper = styled(Box)(() => ({
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '32px 16px',
}));

export const TopRow = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '24px',
    paddingBottom: '24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    [theme.breakpoints.up('md')]: {
        flexDirection: 'row',
    },
}));

export const LogoBrand = styled(Box)(() => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
}));

export const Logo = styled(Box)(() => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
}));

export const LogoBox = styled(Box)(() => ({
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    background: 'linear-gradient(to bottom right, #FF6B35, rgba(255, 107, 53, 0.8))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 6px rgba(255, 107, 53, 0.25)',
}));

export const LogoText = styled(Typography)(() => ({
    fontSize: '0.875rem',
    fontWeight: 700,
    color: 'white',
}));

export const BrandInfo = styled(Box)(() => ({
    display: 'flex',
    flexDirection: 'column',
}));

export const BrandName = styled(Typography)(() => ({
    fontSize: '1rem',
    fontWeight: 600,
    color: 'white',
}));

export const BrandSubtitle = styled(Typography)(() => ({
    fontSize: '0.75rem',
    color: 'rgba(255, 255, 255, 0.5)',
}));

export const QuickLinks = styled(Box)(() => ({
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '24px 24px',
    '@media (max-width: 600px)': {
        gap: '8px 24px',
    },
}));

export const QuickLink = styled(Link)(() => ({
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.875rem',
    color: 'rgba(255, 255, 255, 0.7)',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'color 0.2s',
    '&:hover': {
        color: '#FF6B35',
    },
}));

export const LinkIcon = styled(Box)(() => ({
    width: '14px',
    height: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '& svg': {
        width: '14px',
        height: '14px',
    },
}));

export const ExternalIcon = styled(Box)(() => ({
    width: '12px',
    height: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    transition: 'opacity 0.2s',
    '& svg': {
        width: '12px',
        height: '12px',
    },
    'a:hover &': {
        opacity: 1,
    },
}));

export const BottomRow = styled(Box)(() => ({
    paddingTop: '24px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
}));

export const RegulatoryInfo = styled(Box)(() => ({
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px 12px',
    fontSize: '0.75rem',
    color: 'rgba(255, 255, 255, 0.5)',
    '@media (max-width: 600px)': {
        gap: '4px 12px',
    },
}));

export const RegulatoryItem = styled(Typography)(() => ({
    fontSize: '0.75rem',
    color: 'rgba(255, 255, 255, 0.5)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
}));

export const StatusDot = styled(Box)(() => ({
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#26A69A',
}));

export const Separator = styled(Typography)(() => ({
    fontSize: '0.75rem',
    color: 'rgba(255, 255, 255, 0.3)',
    '&.hidden-mobile': {
        '@media (max-width: 600px)': {
            display: 'none',
        },
    },
}));

export const CopyrightText = styled(Typography)(() => ({
    fontSize: '0.75rem',
    color: 'rgba(255, 255, 255, 0.4)',
}));
