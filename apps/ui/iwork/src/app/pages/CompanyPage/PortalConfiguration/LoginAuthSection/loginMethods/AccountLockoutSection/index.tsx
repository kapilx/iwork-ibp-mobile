import { Box, TextField } from "@mui/material";
import { Block as BlockIcon } from "@mui/icons-material";
import {
  LoginConfigurationContainer,
  SectionHeader,
  SectionIcon,
  ConfigSectionTitle,
  ConfigSectionSubtitle,
  TextFieldLabel,
} from "../../styles";
import {
  SECTION_TITLES,
  SECTION_DESCRIPTIONS,
  FIELD_LABELS,
  HELPER_TEXT,
} from "../../constants";
import { theme, isCopyPasteAllowedForOrg } from "@ui/ui-lib";

interface AccountLockoutSectionProps {
  maxLoginAttempts: string;
  onMaxLoginAttemptsChange: (value: string) => void;
}

export const AccountLockoutSection: React.FC<AccountLockoutSectionProps> = ({
  maxLoginAttempts,
  onMaxLoginAttemptsChange,
}) => {
  return (
    <LoginConfigurationContainer>
      <SectionHeader>
        <SectionIcon as={BlockIcon} />
        <Box>
          <ConfigSectionTitle>
            {SECTION_TITLES.ACCOUNT_LOCKOUT}
          </ConfigSectionTitle>
          <ConfigSectionSubtitle>
            {SECTION_DESCRIPTIONS.ACCOUNT_LOCKOUT}
          </ConfigSectionSubtitle>
        </Box>
      </SectionHeader>

      <Box mb={2}>
        <TextFieldLabel>{FIELD_LABELS.MAX_LOGIN_ATTEMPTS}</TextFieldLabel>
        <TextField
          fullWidth
          size="small"
          value={maxLoginAttempts}
          onChange={(e) => onMaxLoginAttemptsChange(e.target.value)}
          onPaste={(e) => {
            if (!isCopyPasteAllowedForOrg()) {
              e.preventDefault();
            }
          }}
          helperText={HELPER_TEXT.MAX_ATTEMPTS}
          FormHelperTextProps={{
            sx: {
              color: theme.palette.text.primary,
              marginLeft: theme.spacing(0),
            },
          }}
              sx={{
        '& .MuiOutlinedInput-root': {
            borderRadius: '10px',
        },
    }}
        />
      </Box>
    </LoginConfigurationContainer>
  );
};
