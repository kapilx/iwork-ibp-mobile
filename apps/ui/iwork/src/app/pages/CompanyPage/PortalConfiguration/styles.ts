import { Box, styled, Accordion, AccordionSummary, AccordionDetails, Typography } from '@mui/material';
import { Language as GlobalIcon, VpnKey as KeyIcon, Palette as PaletteIcon, Email as EmailIcon } from '@mui/icons-material';

export const ConfigurationContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    minHeight: '100vh',
    padding: theme.spacing(5),
}));

export const MainContent = styled(Box)(({ theme }) => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
}));

export const BreadcrumbSection = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.common.white,
    marginBottom: theme.spacing(5),
}));

export const HeaderSection = styled(Box)(({ theme }) => ({
    background: 'linear-gradient(to right, #E9D5FF, #DDD6FE, #F3E8FF)',
        borderRadius: theme.spacing(2),

}));

export const HeaderContent = styled(Box)(({ theme }) => ({
    padding: theme.spacing(5),
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
}));

export const HeaderLeft = styled(Box)(({ theme }) => ({
    flex: 1,
}));

export const CompanyName = styled('h1')(({ theme }) => ({
    fontSize: '28px',
    fontWeight: 700,
    color: theme.palette.text.purple,
    margin: 0,
}));
export const ConfigureHeader = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(3),
}));
export const StatusContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(2),
}));

export const CompanyInfo = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(4),
    fontSize: '14px',
}));

export const HeaderActions = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
}));

export const TabsContainer = styled(Box)(({ theme }) => ({
    padding: theme.spacing(0, 4),
    borderBottom: `1px solid ${theme.palette.divider}`,
}));

export const TabsList = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(6),
}));

export const TabButton = styled('button')<{ active?: boolean }>(({ theme, active }) => ({
    padding: theme.spacing(2, 0),
    fontSize: '14px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    color: active ? theme.palette.primary.main : theme.palette.text.primary,
    borderBottom: active ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
    transition: 'all 0.2s',
    position: 'relative',
    fontWeight: active ? 600 : 400,

    '&:hover': {
        color: theme.palette.text.primary,
    },

    '&::before': active ? {
        content: '""',
        position: 'absolute',
        left: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: theme.palette.primary.main,
        marginRight: theme.spacing(1),
    } : {},
}));

export const SuccessCircle = styled("img")(({ theme }) => ({
  width: 20,
  marginTop:theme.spacing(1.5),
  height: 20,
}));
export const ContentArea = styled(Box)(({ theme }) => ({
    padding: theme.spacing(0),
}));

export const ConfigurationCard = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.common.white,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.spacing(1),
    overflow: 'hidden',
    marginBottom: theme.spacing(3),
    boxShadow: theme.shadows[1],
}));

export const AccordionHeader = styled('button')(({ theme }) => ({
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(2, 3),
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s',

    '&:hover': {
        backgroundColor: theme.palette.action.hover,
    },
}));

export const AccordionLeft = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
}));

export const AccordionIcon = styled(Box)(({ theme }) => ({
    width: '32px',
    height: '32px',
    borderRadius: theme.spacing(1),
    backgroundColor: theme.palette.primary.light,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.palette.primary.main,
}));

export const AccordionTitle = styled('h3')(({ theme }) => ({
    fontSize: '16px',
    fontWeight: 600,
    color: theme.palette.text.primary,
    margin: 0,
}));

export const AccordionContent = styled(Box)(({ theme }) => ({
    borderTop: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(3),
}));

export const FormFieldContainer = styled(Box)(({ theme }) => ({
    marginBottom: theme.spacing(3),
}));

export const FieldLabel = styled('label')(({ theme }) => ({
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(1),
}));

export const FieldHint = styled('p')(({ theme }) => ({
    fontSize: '12px',
    margin: theme.spacing(1, 0, 0, 0),
}));

export const RequiredMark = styled('span')(({ theme }) => ({
    color: theme.palette.error.main,
    marginLeft: theme.spacing(0.5),
}));

// New styled components for Portal Configuration
export const StyledAccordion = styled(Accordion)(({ theme }) => ({
    backgroundColor: theme.palette.common.white,
    border: `1px solid ${theme.palette.grey[200]}`,
    borderRadius: `${theme.spacing(1.5)} !important`,
    marginBottom: theme.spacing(6.5),
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    '&:before': {
        display: 'none',
    },
    '&.Mui-expanded': {
        margin: `0 0 ${theme.spacing(6.5)} 0`,
    },
}));

export const StyledAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
    padding: theme.spacing(2, 6),
    minHeight: 72,
    '&.Mui-expanded': {
        minHeight: 72,
    },
    '& .MuiAccordionSummary-content': {
        margin: 0,
        alignItems: 'center',
        gap: theme.spacing(3),
    },
    '& .MuiAccordionSummary-expandIconWrapper': {
        color: theme.palette.grey[600],
    },
}));

export const AccordionIconBox = styled(Box)(({ theme }) => ({
    width: 48,
    height: 48,
    borderRadius: theme.spacing(1.5),
    backgroundColor: '#EFF6FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
}));

export const AccordionTitleBox = styled(Box)({
    flex: 1,
});

export const AccordionNumber = styled(Typography)(({ theme }) => ({
    fontSize: '16px',
    fontWeight: 600,
    color: theme.palette.grey[700],
    marginRight: theme.spacing(1),
}));

export const AccordionTitleText = styled(Typography)(({ theme }) => ({
    fontSize: '16px',
    fontWeight: 600,
    color: theme.palette.text.primary,
}));

export const AccordionSubtitle = styled(Typography)(({ theme }) => ({
    fontSize: '14px',
    color: theme.palette.grey[600],
    marginTop: theme.spacing(0.5),
}));

export const StyledAccordionDetails = styled(AccordionDetails)(({ theme }) => ({
    padding: theme.spacing(6),
    borderTop: `1px solid ${theme.palette.grey[100]}`,
}));

export const PortalSetupSection = styled(Box)(({ theme }) => ({
    marginBottom: 0,
}));

export const SettingsSectionCard = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.common.white,
    border: `1px solid ${theme.palette.grey[200]}`,
    borderRadius: theme.spacing(1.5),
    marginBottom: 0,
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    overflow: "hidden",
}));

export const SettingsSectionHeader = styled(Box)(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(3),
    padding: theme.spacing(3, 6),
    paddingTop: theme.spacing(6),
    borderBottom: `1px solid ${theme.palette.grey[100]}`,
    minHeight: 72,
}));

export const SettingsSectionIconBox = styled(Box)(({ theme }) => ({
    width: 48,
    height: 48,
    borderRadius: theme.spacing(1.5),
    backgroundColor: '#EFF6FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
}));

export const SettingsSectionNumber = styled(Typography)(({ theme }) => ({
    fontSize: '16px',
    fontWeight: 600,
    color: theme.palette.grey[700],
    marginRight: theme.spacing(1),
}));

export const SettingsSectionText = styled(Box)({
    flex: 1,
});

export const SettingsSectionTitle = styled(Typography)(({ theme }) => ({
    fontSize: '16px',
    fontWeight: 600,
    color: theme.palette.text.primary,
}));

export const SettingsSectionDescription = styled(Typography)(({ theme }) => ({
    fontSize: '14px',
    color: theme.palette.grey[600],
    marginTop: theme.spacing(0.5),
}));

export const SettingsSectionBody = styled(Box)(({ theme }) => ({
    padding: theme.spacing(3, 6),
    paddingBottom: theme.spacing(6),
}));

export const SettingsControlsRow = styled(Box)(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(3),
    flexWrap: "wrap",
    minHeight: 56,
}));

export const SectionTitle = styled(Typography)(({ theme }) => ({
    fontSize: '18px',
    fontWeight: 600,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(0.5),
}));

export const PortalContainer = styled(Box)(({ theme }) => ({
    paddingTop: theme.spacing(5),
}));

export const SectionSubtitle = styled(Typography)(({ theme }) => ({
    fontSize: '14px',
    color: theme.palette.grey[600],
    marginBottom: theme.spacing(2),
}));

// Styled icon components
export const StyledGlobalIcon = styled(GlobalIcon)({
    fontSize: 24,
    color: '#3B82F6',
});

export const StyledKeyIcon = styled(KeyIcon)({
    fontSize: 24,
    color: '#3B82F6',
});

export const StyledPaletteIcon = styled(PaletteIcon)({
    fontSize: 24,
    color: '#3B82F6',
});

export const StyledEmailIcon = styled(EmailIcon)({
    fontSize: 24,
    color: '#3B82F6',
});

// Edit button styled component
export const EditButtonStyled = styled(Box)({
    backgroundColor: '#6366F1',
    '&:hover': {
        backgroundColor: '#4F46E5',
    },
});
