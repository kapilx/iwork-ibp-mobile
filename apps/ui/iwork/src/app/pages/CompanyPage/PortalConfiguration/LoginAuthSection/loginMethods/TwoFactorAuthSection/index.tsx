import {
  Box,
  TextField,
  Radio,
  MenuItem,
  Select,
  Divider,
  Fade,
} from "@mui/material";
import {
  Security as SecurityIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import {
  LoginConfigurationContainer,
  SectionHeader,
  SectionIcon,
  ConfigSectionTitle,
  ConfigSectionSubtitle,
  TextFieldLabel,
  Label,
  CommonToggle,
  OptionsContainer,
  OptionButton,
  InfoAlert,
  AlertTextBlue,
  InfoIconBlueStyled,
  LabelWithDescription,
  LabelTitle,
  LabelDescriptionText,
  PasswordConfigurationContainer,
  DividerStyled,
  TextFieldDescription,
  AuthenticationContainer,
  AuthenticationFormControlLabel,
  SelectedTimeContainer,
} from "../../styles";
import {
  SECTION_TITLES,
  SECTION_DESCRIPTIONS,
  FIELD_LABELS,
  TOGGLE_LABELS,
  HELPER_TEXT,
  ALERT_MESSAGES,
} from "../../constants";
import { theme } from "@ui/ui-lib/styles";

interface TwoFactorAuthSectionProps {
  enable2FA: boolean;
  onEnable2FAChange: (value: boolean) => void;
  twoFactorDelivery: string;
  onTwoFactorDeliveryChange: (value: string) => void;
  showDeliveryOptions?: boolean;
  twoFactorOTPValidity: string;
  onTwoFactorOTPValidityChange: (value: string) => void;
  twoFactorOTPCooldown: string;
  onTwoFactorOTPCooldownChange: (value: string) => void;
  maxOtpAttempts?: string;
  onMaxOtpAttemptsChange?: (value: string) => void;
}

export const TwoFactorAuthSection: React.FC<TwoFactorAuthSectionProps> = ({
  enable2FA,
  onEnable2FAChange,
  twoFactorDelivery,
  onTwoFactorDeliveryChange,
  showDeliveryOptions = true,
  twoFactorOTPValidity,
  onTwoFactorOTPValidityChange,
  twoFactorOTPCooldown,
  onTwoFactorOTPCooldownChange,
  maxOtpAttempts,
  onMaxOtpAttemptsChange,
}) => {
  const selectedDelivery =
    twoFactorDelivery === "phone" || twoFactorDelivery === "sms"
      ? "phone"
      : "email";

  return (
    <LoginConfigurationContainer>
      <SectionHeader>
        <SectionIcon as={SecurityIcon} />
        <Box>
          <ConfigSectionTitle>
            {SECTION_TITLES.TWO_FACTOR_AUTH}
          </ConfigSectionTitle>
          <ConfigSectionSubtitle>
            {SECTION_DESCRIPTIONS.TWO_FACTOR_AUTH}
          </ConfigSectionSubtitle>
        </Box>
      </SectionHeader>

      <PasswordConfigurationContainer>
        <Label
          control={
            <CommonToggle
              checked={enable2FA}
              onChange={(e) => onEnable2FAChange(e.target.checked)}
            />
          }
          label={
            <LabelWithDescription>
              <LabelTitle>{TOGGLE_LABELS.ENABLE_2FA}</LabelTitle>
              <LabelDescriptionText>
                {HELPER_TEXT.REQUIRE_OTP_AFTER_PASSWORD}
              </LabelDescriptionText>
            </LabelWithDescription>
          }
        />
      </PasswordConfigurationContainer>

      

      <DividerStyled />
      {enable2FA && (
        <>
          {/* Blue info alert for OTP behavior */}
          <Box mb={2}>
            <InfoAlert>
              <InfoIconBlueStyled as={InfoIcon} />
              <AlertTextBlue>{ALERT_MESSAGES.OTP_BEHAVIOR}</AlertTextBlue>
            </InfoAlert>
          </Box>

          {showDeliveryOptions && (
            <Box mb={4}>
              <TextFieldLabel>{FIELD_LABELS.OTP_DELIVERY}</TextFieldLabel>
              <TextFieldDescription>
                {FIELD_LABELS.OTP_DELIVERY_DESCRIPTION}
              </TextFieldDescription>
              <AuthenticationContainer>
                <AuthenticationFormControlLabel
                  selected={selectedDelivery === "email"}
                  control={
                    <Radio
                      checked={selectedDelivery === "email"}
                      onChange={() => onTwoFactorDeliveryChange("email")}
                      value="email"
                      sx={{
                        color: "#6366F1",
                        transform: "scale(0.85)",
                        "& .MuiSvgIcon-root": {
                          fontSize: 22,
                        },
                        "&.Mui-checked": {
                          color: "#6366F1",
                        },
                      }}
                    />
                  }
                  label="Email"
                />
                <AuthenticationFormControlLabel
                  selected={selectedDelivery === "phone"}
                  control={
                    <Radio
                      checked={selectedDelivery === "phone"}
                      onChange={() => onTwoFactorDeliveryChange("phone")}
                      value="phone"
                      sx={{
                        color: "#6366F1",
                        transform: "scale(0.85)",
                        "& .MuiSvgIcon-root": {
                          fontSize: 22,
                        },
                        "&.Mui-checked": {
                          color: "#6366F1",
                        },
                      }}
                    />
                  }
                  label="Mobile Number"
                />
              </AuthenticationContainer>
            </Box>
          )}

          {/* OTP Validity Duration - Dropdown */}
          <Box mb={4}>
            <TextFieldLabel>{FIELD_LABELS.OTP_VALIDITY}</TextFieldLabel>
<Select
    fullWidth
    size="small"
    value={twoFactorOTPValidity}
    onChange={(e) => onTwoFactorOTPValidityChange(e.target.value)}
    displayEmpty
    sx={{
        borderRadius: '10px',
    }}
    MenuProps={{
        TransitionComponent: Fade,
        sx: { 
            zIndex: 9999,
        },
        PaperProps: {
            sx: {
                borderRadius: '10px',
            }
        }
    }}
>
              <MenuItem value="1">1 minute</MenuItem>
              <MenuItem value="2">2 minutes</MenuItem>
              <MenuItem value="3">3 minutes</MenuItem>
              <MenuItem value="4">4 minutes</MenuItem>
              <MenuItem value="5">5 minutes</MenuItem>
              <MenuItem value="6">6 minutes</MenuItem>
              <MenuItem value="7">7 minutes</MenuItem>
              <MenuItem value="8">8 minutes</MenuItem>
              <MenuItem value="9">9 minutes</MenuItem>
              <MenuItem value="10">10 minutes</MenuItem>
            </Select>
          </Box>

          {/* Resend OTP Cooldown - Radio buttons */}
          <Box mb={4}>
            <TextFieldLabel>{FIELD_LABELS.RESEND_COOLDOWN}</TextFieldLabel>
            <SelectedTimeContainer>
            <OptionsContainer>
              <OptionButton
                selected={twoFactorOTPCooldown === "30"}
                onClick={() => onTwoFactorOTPCooldownChange("30")}
              >
                30 sec
              </OptionButton>
              <OptionButton
                selected={twoFactorOTPCooldown === "60"}
                onClick={() => onTwoFactorOTPCooldownChange("60")}
              >
                60 sec
              </OptionButton>

            </OptionsContainer>
              <OptionsContainer>
    
              <OptionButton
                selected={twoFactorOTPCooldown === "90"}
                onClick={() => onTwoFactorOTPCooldownChange("90")}
              >
                90 sec
              </OptionButton>
              <OptionButton
                selected={twoFactorOTPCooldown === "120"}
                onClick={() => onTwoFactorOTPCooldownChange("120")}
              >
                120 sec
              </OptionButton>
            </OptionsContainer>
            </SelectedTimeContainer>
          </Box>

          {/* OTP Retry Limit - Radio buttons */}
          {maxOtpAttempts !== undefined && onMaxOtpAttemptsChange && (
            <Box mb={4}>
              <TextFieldLabel>{FIELD_LABELS.OTP_RETRY_LIMIT}</TextFieldLabel>
              <OptionsContainer>
                <OptionButton
                  selected={maxOtpAttempts === "3"}
                  onClick={() => onMaxOtpAttemptsChange("3")}
                >
                  3 attempts
                </OptionButton>
                <OptionButton
                  selected={maxOtpAttempts === "5"}
                  onClick={() => onMaxOtpAttemptsChange("5")}
                >
                  5 attempts
                </OptionButton>
              </OptionsContainer>
            </Box>
          )}
        </>
      )}
    </LoginConfigurationContainer>
  );
};
