import { Box } from '@mui/material';
import {
    LoginConfigurationContainer,
    SectionHeader,
    SectionIcon,
    ConfigSectionTitle,
    ConfigSectionSubtitle,
    Label,
    CommonToggle,
    LabelWithDescription,
    LabelTitle,
    LabelDescriptionText,
    PasswordConfigurationContainer,
} from '../../styles';
import { Lock as LockIcon } from '@mui/icons-material';
import { SECTION_TITLES, SECTION_DESCRIPTIONS, TOGGLE_LABELS, HELPER_TEXT } from '../../constants';

interface ChangePasswordPolicySectionProps {
    requireOldPassword: boolean;
    onRequireOldPasswordChange: (value: boolean) => void;
    changePasswordOnFirstLogin?: boolean;
    onChangePasswordOnFirstLoginChange?: (value: boolean) => void;
    showChangePasswordOnFirstLogin?: boolean;
}

export const ChangePasswordPolicySection: React.FC<ChangePasswordPolicySectionProps> = ({
    requireOldPassword,
    onRequireOldPasswordChange,
    changePasswordOnFirstLogin = false,
    onChangePasswordOnFirstLoginChange,
    showChangePasswordOnFirstLogin = true,
}) => {
    return (
        <LoginConfigurationContainer>
            <SectionHeader>
                <SectionIcon as={LockIcon} />
                <Box>
                    <ConfigSectionTitle>{SECTION_TITLES.CHANGE_PASSWORD_POLICY}</ConfigSectionTitle>
                    <ConfigSectionSubtitle>
                        {SECTION_DESCRIPTIONS.CHANGE_PASSWORD_POLICY}
                    </ConfigSectionSubtitle>
                </Box>
            </SectionHeader>

            <PasswordConfigurationContainer>
                <Label
                    control={
                        <CommonToggle
                            checked={requireOldPassword}
                            onChange={(e) => onRequireOldPasswordChange(e.target.checked)}
                        />
                    }
                    label={
                        <LabelWithDescription>
                            <LabelTitle>
                                {TOGGLE_LABELS.REQUIRE_OLD_PASSWORD}
                            </LabelTitle>
                            <LabelDescriptionText>
                                {HELPER_TEXT.USERS_ENTER_CURRENT_PASSWORD}
                            </LabelDescriptionText>
                        </LabelWithDescription>
                    }
                />
            </PasswordConfigurationContainer>

            {showChangePasswordOnFirstLogin && onChangePasswordOnFirstLoginChange && (
                <PasswordConfigurationContainer>
                    <Label
                        control={
                            <CommonToggle
                                checked={changePasswordOnFirstLogin}
                                onChange={(e) =>
                                    onChangePasswordOnFirstLoginChange(e.target.checked)
                                }
                            />
                        }
                        label={
                            <LabelWithDescription>
                                <LabelTitle>
                                    {TOGGLE_LABELS.CHANGE_PASSWORD_FIRST_LOGIN}
                                </LabelTitle>
                                <LabelDescriptionText>
                                    {HELPER_TEXT.REQUIRE_CHANGE_FIRST_LOGIN}
                                </LabelDescriptionText>
                            </LabelWithDescription>
                        }
                    />
                </PasswordConfigurationContainer>
            )}
        </LoginConfigurationContainer>
    );
};
