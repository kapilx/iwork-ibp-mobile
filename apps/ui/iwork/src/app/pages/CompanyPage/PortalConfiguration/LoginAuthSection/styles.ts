import { Box, Typography, Button, Divider, styled, FormControlLabel, Switch } from '@mui/material';
import { CommonSwitch } from '@ui/ui-lib/index';

export const SectionDescription = styled(Typography)(({ theme }) => ({
    fontSize: '14px',
    color: theme.palette.grey[600],
    marginBottom: theme.spacing(3),
}));

export const MethodsGrid = styled(Box)(({ theme }) => ({
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: theme.spacing(2),
}));
export const Label = styled(FormControlLabel)(({ theme }) => ({
    marginLeft: 0,
    gap: theme.spacing(2),
    '& .MuiFormControlLabel-label': {
        color: theme.palette.text.primary,
    },
}));
export const CommonToggle = styled(Switch)(({ theme }) => ({
width: 25,
  height:  13,
  padding: 0,
  '& .MuiSwitch-switchBase': {
    padding: 0,
    margin: 1,
    transitionDuration: '300ms',
    '&.Mui-checked': {
      transform: 'translateX(12px)',
      color: theme.palette.background.paper,
      '& + .MuiSwitch-track': {
        background: theme.palette.background.ToggleTrack,
        border: `0.5px solid ${theme.palette.background.ToggleTrack}`,
        opacity: 1,
      },
    },
'&:not(.Mui-checked)': {
  '& .MuiSwitch-thumb': {
    filter: 'grayscale(1)',
    backgroundColor: theme.palette.background.GrayThumb, 
  },
  '& + .MuiSwitch-track': {
    filter: 'grayscale(1)',
    backgroundColor: theme.palette.background.GrayTrack, 
  },
},

    '&.Mui-disabled .MuiSwitch-thumb': {
      color: theme.palette.grey[100],
    },
  },
  '& .MuiSwitch-thumb': {
    width: 11,
    height: 11,
    boxSizing: 'border-box',
    backgroundColor: theme.palette.background.ToggleThumb,
  },
  '& .MuiSwitch-track': {
    borderRadius: theme.spacing(22),
    background: theme.palette.background.ToggleTrack,
    border: `0.5px solid ${theme.palette.background.ToggleTrack}`,
    opacity: 1,
    transition: theme.transitions.create(['background-color'], {
      duration: 500,
    }),
  },
  // Override opacity for disabled+unchecked state
  '& .Mui-disabled + .MuiSwitch-track': {
    opacity: 1, // Force opacity to 1 even when disabled
  },
}));
export const LoginConfigurationContainer = styled(Box)(({ theme }) => ({
    borderRadius: theme.spacing(2.5),
    padding: theme.spacing(3),
    marginBottom: theme.spacing(6),
    border: `1px solid ${theme.palette.grey[200]}`,
}));
export const PasswordConfigurationContainer = styled(Box)(({ theme }) => ({
    borderRadius: theme.spacing(2.5),
    padding: theme.spacing(3),
    marginBottom: theme.spacing(2),
    border: `1px solid ${theme.palette.grey[200]}`,
}));
export const MethodCard = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'selected',
})<{ selected?: boolean }>(({ theme, selected }) => ({
    borderRadius: theme.spacing(2),
    border: selected ? '2px solid #6366F1' : `1.5px solid ${theme.palette.grey[200]}`,
    backgroundColor: selected ? '#EEF2FF' : theme.palette.common.white,
    cursor: 'pointer',
    transition: 'all 0.2s',
    position: 'relative',
    boxShadow: selected
        ? '0 2px 12px rgba(99,102,241,0.13)'
        : '0 1px 3px rgba(0,0,0,0.05)',
    '&:hover': {
        borderColor: '#6366F1',
        boxShadow: '0 2px 12px rgba(99,102,241,0.13)',
    },
}));

export const MethodIconBox = styled(Box)(({ theme }) => ({
    width: 40,
    height: 40,
    borderRadius: theme.spacing(1),
    backgroundColor: theme.palette.common.white,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing(1.5),
}));

export const MethodTitle = styled(Typography)(({ theme }) => ({
    fontSize: '14px',
    fontWeight: 600,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(0.5),
}));

export const MethodDescription = styled(Typography)(({ theme }) => ({
    fontSize: '12px',
    color: theme.palette.grey[600],
}));

export const RadioIndicator = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'selected',
})<{ selected?: boolean }>(({ theme, selected }) => ({
    position: 'absolute',
    top: theme.spacing(2),
    right: theme.spacing(2),
    width: 20,
    height: 20,
    borderRadius: '50%',
    border: selected ? '6px solid #6366F1' : `2px solid ${theme.palette.grey[300]}`,
    backgroundColor: theme.palette.common.white,
}));

export const CheckboxIndicator = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'selected',
})<{ selected?: boolean }>(({ theme, selected }) => ({
    width: 18,
    height: 18,
    borderRadius: '4px',
    border: selected ? '2px solid #6366F1' : `2px solid ${theme.palette.grey[300]}`,
    backgroundColor: selected ? '#6366F1' : theme.palette.common.white,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.15s',
    '&::after': {
        content: selected ? '"✓"' : '""',
        color: theme.palette.common.white,
        fontSize: '11px',
        fontWeight: 'bold',
        lineHeight: 1,
    },
}));

export const ConfigSection = styled(Box)(({ theme }) => ({
    padding: theme.spacing(3),
    backgroundColor: '#EFF6FF',
    borderRadius: theme.spacing(1.5),
    marginTop: theme.spacing(3),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
}));

export const DrawerHeader = styled(Box)(({ theme }) => ({
    padding: theme.spacing(3),
    borderBottom: `1px solid ${theme.palette.grey[200]}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
}));

export const DrawerTitle = styled(Typography)(({ theme }) => ({
    fontSize: '18px',
    fontWeight: 600,
    color: theme.palette.text.primary,
}));

export const DrawerSubtitle = styled(Typography)(({ theme }) => ({
    fontSize: '13px',
    color: theme.palette.grey[600],
}));

export const DrawerContent = styled(Box)(({ theme }) => ({
    padding: theme.spacing(3),
}));

export const ConfigSectionTitle = styled(Typography)(({ theme }) => ({
    fontSize: '14px',
    fontWeight: 600,
    color: theme.palette.text.primary,
}));

export const ConfigSectionSubtitle = styled(Typography)(({ theme }) => ({
    fontSize: '13px',
    color: theme.palette.grey[600],
    marginBottom: theme.spacing(2),
}));

export const InfoAlert = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing(1.5),
    padding: theme.spacing(2),
  backgroundColor: '#EFF6FF', 
  border: '1px solid #BFDBFE',
    borderRadius: theme.spacing(2.5),
    marginBottom: theme.spacing(4),
}));
export const SelectedTimeContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
}));
export const OptionButton = styled(Button, {
    shouldForwardProp: (prop) => prop !== 'selected',
})<{ selected?: boolean }>(({ theme, selected }) => ({
    flex: 1,
    padding: theme.spacing(2 , 2.5),
    borderRadius: theme.spacing(2.5),
    border: selected ? '2px solid #6366F1' : `2px solid ${theme.palette.grey[300]}`,
    backgroundColor: selected ? '#EEF2FF' : theme.palette.common.white,
    color: theme.palette.text.primary,
    textTransform: 'none',
    fontWeight: 500,
    '&:hover': {
        backgroundColor: selected ? '#EEF2FF' : theme.palette.grey[50],
        borderColor: '#6366F1',
    },
}));

export const OptionsButtonGroup = styled(Box)(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(1.5),
    marginBottom: theme.spacing(3),
}));

export const FieldLabel = styled(Typography)(({ theme }) => ({
    fontSize: '13px',
    fontWeight: 500,
    marginBottom: theme.spacing(1),
    color: theme.palette.text.primary,
}));

export const DividerStyled = styled(Divider)(({ theme }) => ({
    marginTop: theme.spacing(4),
    marginBottom: theme.spacing(4),
}));

// Info alert with icon for warning messages
export const InfoIconStyled = styled(Box)(({ theme }) => ({
    fontSize: 20,
    color: '#D97706',
}));

// Info alert with blue icon for informational messages
export const InfoIconBlueStyled = styled(Box)(({ theme }) => ({
    fontSize: 20,
    color: '#3B82F6',
}));

// Alert text styling for warning messages
export const AlertText = styled(Typography)(({ theme }) => ({
    fontSize: '13px',
    color: '#92400E',
}));

// Alert text styling for informational messages
export const AlertTextBlue = styled(Typography)(({ theme }) => ({
    fontSize: '12px',
    color: '#1E3A8A',
}));

// Section header with icon layout
export const SectionHeader = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(2),
}));

// Icon styling for section headers
export const SectionIcon = styled(Box)(({ theme }) => ({
    fontSize: 20,
    color: '#6366F1',
    marginTop: theme.spacing(1),
}));

// Large section icon for drawer headers
export const SectionIconLarge = styled(Box)(({ theme }) => ({
    fontSize: 24,
    color: '#6366F1',
}));

// Text field label styling
export const TextFieldLabel = styled(Typography)(({ theme }) => ({
    fontSize: '14px',
    fontWeight: 500,
    marginBottom: theme.spacing(1),
    color: theme.palette.text.primary,
}));
export const TextFieldDescription = styled(Typography)(({ theme }) => ({
    fontSize: '12px',
    color: theme.palette.grey[600],
    marginBottom: theme.spacing(2),
}));
export const AuthenticationContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));
export const AuthenticationFormControlLabel = styled(FormControlLabel, {
    shouldForwardProp: (prop) => prop !== 'selected',
})<{ selected?: boolean }>(({ theme, selected }) => ({
             border: selected ? "2px solid #6366F1" : `2px solid ${theme.palette.grey[300]}`,
                  backgroundColor: selected ? "#EEF2FF" : "transparent",
                  borderRadius: "10px",
                  padding: "4px",
                  margin: 0,
}));

// Grid layout for password requirements toggles
export const RequirementsGrid = styled(Box)(({ theme }) => ({
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: theme.spacing(2),
}));

// Flex container for buttons with consistent spacing
export const ButtonGroup = styled(Box)(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(2),
}));

// Alias for ButtonGroup for backward compatibility
export const OptionsContainer = ButtonGroup;

// Helper text styling
export const HelperText = styled(Typography)(({ theme }) => ({
    fontSize: '12px',
    color: theme.palette.grey[600],
}));

// Helper text with top margin
export const HelperTextWithMargin = styled(Typography)(({ theme }) => ({
    fontSize: '12px',
    color: theme.palette.grey[600],
    marginTop: theme.spacing(1.5),
}));

// Helper text with bottom margin
export const HelperTextBottom = styled(Typography)(({ theme }) => ({
    fontSize: '12px',
    color: theme.palette.grey[600],
    marginBottom: theme.spacing(2),
}));

// Label with description layout
export const LabelWithDescription = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
}));

// Label title text
export const LabelTitle = styled(Typography)(({ theme }) => ({
    fontSize: '14px',
    fontWeight: 500,
}));

// Label description text
export const LabelDescriptionText = styled(Typography)(({ theme }) => ({
    fontSize: '12px',
    color: theme.palette.grey[600],
}));

// Drawer footer with action buttons
export const DrawerFooter = styled(Box)(({ theme }) => ({
    position: 'sticky',
    bottom: 0,
    padding: theme.spacing(3),
    backgroundColor: theme.palette.common.white,
    borderTop: `1px solid ${theme.palette.grey[200]}`,
    display: 'flex',
    gap: theme.spacing(2),
    justifyContent: 'flex-end',
}));

// Primary action button styling
export const PrimaryButton = styled(Button)(({ theme }) => ({
    backgroundColor: '#6366F1',
    '&:hover': {
        backgroundColor: '#4F46E5',
    },
}));

// Drawer content wrapper with fixed width
export const DrawerWrapper = styled(Box)(({ theme }) => ({
    width: 500,
}));

// Configuration title text in main section
export const ConfigurationTitle = styled(Typography)(({ theme }) => ({
    fontSize: '14px',
    fontWeight: 600,
    color: theme.palette.text.primary,
}));

// Configuration description text in main section
export const ConfigurationDescription = styled(Typography)(({ theme }) => ({
    fontSize: '13px',
    color: theme.palette.grey[600],
}));

// Content wrapper inside config section
export const ConfigContent = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
}));

// Flex container for section header with icon
export const FlexContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
}));
