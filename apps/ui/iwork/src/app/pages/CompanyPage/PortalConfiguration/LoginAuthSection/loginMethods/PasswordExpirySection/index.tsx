import { Box } from '@mui/material';
import { Schedule as ScheduleIcon } from '@mui/icons-material';
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
import { SECTION_TITLES, SECTION_DESCRIPTIONS, FIELD_LABELS, OPTION_LABELS } from '../../constants';

interface PasswordExpirySectionProps {
    passwordExpiryDuration: string;
    onPasswordExpiryDurationChange: (value: string) => void;
}

export const PasswordExpirySection: React.FC<PasswordExpirySectionProps> = ({
    passwordExpiryDuration,
    onPasswordExpiryDurationChange,
}) => {
    return (
        <LoginConfigurationContainer>
            <SectionHeader>
                <SectionIcon as={ScheduleIcon} />
                <Box>
                    <ConfigSectionTitle>{SECTION_TITLES.PASSWORD_EXPIRY}</ConfigSectionTitle>
                    <ConfigSectionSubtitle>
                        {SECTION_DESCRIPTIONS.PASSWORD_EXPIRY}
                    </ConfigSectionSubtitle>
                </Box>
            </SectionHeader>

            <Box mb={2}>
                <TextFieldLabel>{FIELD_LABELS.DURATION}</TextFieldLabel>
                <OptionsContainer>
                    <OptionButton
                        selected={passwordExpiryDuration === '30'}
                        onClick={() => onPasswordExpiryDurationChange('30')}
                    >
                        {OPTION_LABELS.DAYS_30}
                    </OptionButton>
                    <OptionButton
                        selected={passwordExpiryDuration === '60'}
                        onClick={() => onPasswordExpiryDurationChange('60')}
                    >
                        {OPTION_LABELS.DAYS_60}
                    </OptionButton>
                    <OptionButton
                        selected={passwordExpiryDuration === '90'}
                        onClick={() => onPasswordExpiryDurationChange('90')}
                    >
                        {OPTION_LABELS.DAYS_90}
                    </OptionButton>
                    <OptionButton
                        selected={passwordExpiryDuration === '120'}
                        onClick={() => onPasswordExpiryDurationChange('120')}
                    >
                        {OPTION_LABELS.DAYS_120}
                    </OptionButton>
                    <OptionButton
                        selected={passwordExpiryDuration === 'never'}
                        onClick={() => onPasswordExpiryDurationChange('never')}
                    >
                        {OPTION_LABELS.NEVER}
                    </OptionButton>
                </OptionsContainer>
            </Box>
        </LoginConfigurationContainer>
    );
};
