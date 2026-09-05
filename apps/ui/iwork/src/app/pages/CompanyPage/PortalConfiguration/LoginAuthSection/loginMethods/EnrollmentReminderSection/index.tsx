import { Box } from '@mui/material';
import { NotificationsActive as NotificationsActiveIcon } from '@mui/icons-material';
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

// Sentinel meaning "send a reminder every day within the scheduler window"
// (not a day-count, like a cron '*'). Kept in the same number[] as the day options.
const EVERYDAY = -1;
const REMINDER_DAY_OPTIONS = [1, 2, 3, 5, 7, EVERYDAY] as const;

interface EnrollmentReminderSectionProps {
    reminderDays: number[];
    onReminderDaysChange: (days: number[]) => void;
}

export const EnrollmentReminderSection: React.FC<EnrollmentReminderSectionProps> = ({
    reminderDays,
    onReminderDaysChange,
}) => {
    const toggleReminderDay = (day: number) => {
        if (reminderDays.includes(day)) {
            onReminderDaysChange(reminderDays.filter((value) => value !== day));
            return;
        }
        onReminderDaysChange([...reminderDays, day].sort((a, b) => a - b));
    };

    return (
        <LoginConfigurationContainer>
            <SectionHeader>
                <SectionIcon as={NotificationsActiveIcon} />
                <Box>
                    <ConfigSectionTitle>Enrollment Reminder Email</ConfigSectionTitle>
                    <ConfigSectionSubtitle>
                        Select how many days before enrollment end date reminder emails should be sent
                    </ConfigSectionSubtitle>
                </Box>
            </SectionHeader>

            <Box mb={2}>
                <TextFieldLabel>Reminder Days</TextFieldLabel>
                <OptionsContainer>
                    {REMINDER_DAY_OPTIONS.map((day) => (
                        <OptionButton
                            key={day}
                            selected={reminderDays.includes(day)}
                            onClick={() => toggleReminderDay(day)}
                        >
                            {day === EVERYDAY ? 'Everyday' : `${day} day${day > 1 ? 's' : ''}`}
                        </OptionButton>
                    ))}
                </OptionsContainer>
            </Box>
        </LoginConfigurationContainer>
    );
};
