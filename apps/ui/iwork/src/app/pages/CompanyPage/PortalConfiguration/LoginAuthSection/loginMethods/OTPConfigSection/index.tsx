import { Box, Select, MenuItem, Typography, Fade } from "@mui/material";
import { Sms as SmsIcon } from "@mui/icons-material";
import {
  LoginConfigurationContainer,
  SectionHeader,
  SectionIcon,
  ConfigSectionTitle,
  ConfigSectionSubtitle,
  TextFieldLabel,
  OptionsContainer,
  OptionButton,
  SelectedTimeContainer,
} from "../../styles";
import {
  SECTION_TITLES,
  FIELD_LABELS,
  OPTION_LABELS,
  HELPER_TEXT,
} from "../../constants";

interface OTPConfigSectionProps {
  authType?: "email" | "mobile";
  otpValidity: string;
  onOTPValidityChange: (value: string) => void;
  otpCooldown: string;
  onOTPCooldownChange: (value: string) => void;
  maxOtpAttempts?: string;
  onMaxOtpAttemptsChange?: (value: string) => void;
}

export const OTPConfigSection: React.FC<OTPConfigSectionProps> = ({
  authType = "email",
  otpValidity,
  onOTPValidityChange,
  otpCooldown,
  onOTPCooldownChange,
  maxOtpAttempts,
  onMaxOtpAttemptsChange,
}) => {
  const subtitle =
    authType === "email"
      ? "Configure OTP settings for email"
      : "Configure OTP settings for mobile authentication";

  const retryLimitLabel =
    authType === "email"
      ? "Maximum OTP Attempts"
      : "OTP Retry Limit (Incorrect Attempts)";

  return (
    <LoginConfigurationContainer>
      <SectionHeader>
        <SectionIcon as={SmsIcon} />
        <Box>
          <ConfigSectionTitle>
            {SECTION_TITLES.OTP_CONFIGURATION}
          </ConfigSectionTitle>
          <ConfigSectionSubtitle>{subtitle}</ConfigSectionSubtitle>
        </Box>
      </SectionHeader>

      {/* OTP Validity Duration - Dropdown */}
      <Box mb={4}>
        <TextFieldLabel>{FIELD_LABELS.OTP_VALIDITY_DURATION}</TextFieldLabel>
        <Select
          fullWidth
          size="small"
          value={otpValidity}
          onChange={(e) => onOTPValidityChange(e.target.value)}
          displayEmpty
          MenuProps={{
            TransitionComponent: Fade,
            sx: { zIndex: 9999 },
          }}
     sx={{
        borderRadius: '10px',
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
        {authType === "mobile" && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 0.5 }}
          >
            {HELPER_TEXT.OTP_WINDOW}
          </Typography>
        )}
      </Box>

      {/* Resend OTP Cooldown - Radio buttons */}
      <Box mb={4}>
        <TextFieldLabel>{FIELD_LABELS.RESEND_COOLDOWN}</TextFieldLabel>
        <SelectedTimeContainer>
        <OptionsContainer>
          <OptionButton
            selected={otpCooldown === "30"}
            onClick={() => onOTPCooldownChange("30")}
          >
            30 sec
          </OptionButton>
          <OptionButton
            selected={otpCooldown === "60"}
            onClick={() => onOTPCooldownChange("60")}
          >
            60 sec
          </OptionButton>

        </OptionsContainer>
          <OptionsContainer>

          <OptionButton
            selected={otpCooldown === "90"}
            onClick={() => onOTPCooldownChange("90")}
          >
            90 sec
          </OptionButton>
          <OptionButton
            selected={otpCooldown === "120"}
            onClick={() => onOTPCooldownChange("120")}
          >
            120 sec
          </OptionButton>
        </OptionsContainer>
        </SelectedTimeContainer>
      </Box>

      {/* Maximum OTP Attempts / OTP Retry Limit - Radio buttons */}
      {maxOtpAttempts !== undefined && onMaxOtpAttemptsChange && (
        <Box mb={4}>
          <TextFieldLabel>{retryLimitLabel}</TextFieldLabel>
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
    </LoginConfigurationContainer>
  );
};
