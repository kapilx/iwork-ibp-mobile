import { Box, Typography } from '@mui/material';
import { AccessTime as AccessTimeIcon } from '@mui/icons-material';
import {
    LoginConfigurationContainer,
    SectionHeader,
    SectionIcon,
    ConfigSectionTitle,
    ConfigSectionSubtitle,
    TextFieldLabel,
    OptionsContainer,
    OptionButton,
} from '../../styles';
import { FIELD_LABELS, OPTION_LABELS } from '../../constants';

interface SessionTimeoutSectionProps {
    authType?: 'email' | 'mobile' | 'default';
    sessionTimeout: string;
    onSessionTimeoutChange: (value: string) => void;
}

export const SessionTimeoutSection: React.FC<SessionTimeoutSectionProps> = ({
    authType = 'default',
    sessionTimeout,
    onSessionTimeoutChange,
}) => {
    const sectionTitle = authType === 'email' || authType === 'mobile'
        ? 'Session Settings'
        : 'Session Timeout';
    
    const subtitle = authType === 'email'
        ? 'Auto-logout after inactivity'
        : authType === 'mobile'
        ? 'Configure session timeout behavior'
        : 'Configure automatic session timeout';

    const showHelperText = authType === 'mobile';

    return (
        <LoginConfigurationContainer>
            <SectionHeader>
                <SectionIcon as={AccessTimeIcon} />
                <Box>
                    <ConfigSectionTitle>{sectionTitle}</ConfigSectionTitle>
                    <ConfigSectionSubtitle>
                        {subtitle}
                    </ConfigSectionSubtitle>
                </Box>
            </SectionHeader>

            <Box mb={2}>
                <TextFieldLabel>{FIELD_LABELS.SESSION_TIMEOUT}</TextFieldLabel>
                <OptionsContainer>
                    <OptionButton
                        selected={sessionTimeout === '15'}
                        onClick={() => onSessionTimeoutChange('15')}
                    >
                        15 min
                    </OptionButton>
                    <OptionButton
                        selected={sessionTimeout === '30'}
                        onClick={() => onSessionTimeoutChange('30')}
                    >
                        30 min
                    </OptionButton>
                    <OptionButton
                        selected={sessionTimeout === '60'}
                        onClick={() => onSessionTimeoutChange('60')}
                    >
                        60 min
                    </OptionButton>
                </OptionsContainer>
                {showHelperText && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        Auto-logout after period of inactivity
                    </Typography>
                )}
            </Box>
        </LoginConfigurationContainer>
    );
};
