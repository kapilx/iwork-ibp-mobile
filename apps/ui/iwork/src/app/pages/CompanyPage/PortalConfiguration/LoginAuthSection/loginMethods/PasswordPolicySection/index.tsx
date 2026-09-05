import { Box, TextField } from "@mui/material";
import { Lock as LockIcon } from "@mui/icons-material";
import {
  LoginConfigurationContainer,
  SectionHeader,
  SectionIcon,
  ConfigSectionTitle,
  ConfigSectionSubtitle,
  TextFieldLabel,
  RequirementsGrid,
  Label,
  CommonToggle,
} from "../../styles";
import {
  SECTION_TITLES,
  SECTION_DESCRIPTIONS,
  FIELD_LABELS,
  TOGGLE_LABELS,
  HELPER_TEXT,
} from "../../constants";
import { theme, isCopyPasteAllowedForOrg } from "@ui/ui-lib";

interface PasswordRequirements {
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  special: boolean;
}

interface PasswordPolicySectionProps {
  minPasswordLength: string;
  onMinPasswordLengthChange: (value: string) => void;
  passwordRequirements: PasswordRequirements;
  onPasswordRequirementsChange: (requirements: PasswordRequirements) => void;
}

export const PasswordPolicySection: React.FC<PasswordPolicySectionProps> = ({
  minPasswordLength,
  onMinPasswordLengthChange,
  passwordRequirements,
  onPasswordRequirementsChange,
}) => {
  return (
    <LoginConfigurationContainer>
      <SectionHeader>
        <SectionIcon as={LockIcon} />
        <Box>
          <ConfigSectionTitle>
            {SECTION_TITLES.PASSWORD_POLICY}
          </ConfigSectionTitle>
          <ConfigSectionSubtitle>
            {SECTION_DESCRIPTIONS.PASSWORD_REQUIREMENTS}
          </ConfigSectionSubtitle>
        </Box>
      </SectionHeader>

      <Box mb={2}>
        <TextFieldLabel>{FIELD_LABELS.MIN_PASSWORD_LENGTH}</TextFieldLabel>
        <TextField
          fullWidth
          size="small"
          value={minPasswordLength}
          onChange={(e) => onMinPasswordLengthChange(e.target.value)}
           onPaste={(e) => {
            if (!isCopyPasteAllowedForOrg()) {
              e.preventDefault();
            }
          }}
          helperText={HELPER_TEXT.PASSWORD_LENGTH_RANGE}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: theme.spacing(2.5),
            },
          }}
        />
      </Box>

      <Box mb={2}>
        <TextFieldLabel>{FIELD_LABELS.MUST_INCLUDE}</TextFieldLabel>
        <RequirementsGrid>
          <Label
            control={
              <CommonToggle
                checked={passwordRequirements.uppercase}
                onChange={(e) =>
                  onPasswordRequirementsChange({
                    ...passwordRequirements,
                    uppercase: e.target.checked,
                  })
                }
              />
            }
            label={TOGGLE_LABELS.UPPERCASE}
          />
          <Label
            control={
              <CommonToggle
                checked={passwordRequirements.lowercase}
                onChange={(e) =>
                  onPasswordRequirementsChange({
                    ...passwordRequirements,
                    lowercase: e.target.checked,
                  })
                }
              />
            }
            label={TOGGLE_LABELS.LOWERCASE}
          />
          <Label
            control={
              <CommonToggle
                checked={passwordRequirements.numbers}
                onChange={(e) =>
                  onPasswordRequirementsChange({
                    ...passwordRequirements,
                    numbers: e.target.checked,
                  })
                }
              />
            }
            label={TOGGLE_LABELS.NUMBERS}
          />
          <Label
            control={
              <CommonToggle
                checked={passwordRequirements.special}
                onChange={(e) =>
                  onPasswordRequirementsChange({
                    ...passwordRequirements,
                    special: e.target.checked,
                  })
                }
              />
            }
            label={TOGGLE_LABELS.SPECIAL_CHARS}
          />
        </RequirementsGrid>
      </Box>
    </LoginConfigurationContainer>
  );
};
