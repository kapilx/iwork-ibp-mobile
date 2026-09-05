import React from "react";
import {
  ActiveCircle,
  ConfigBadge,
  HeaderSection,
  InfoLabel,
  PolicyCard,
  PolicyContent,
  PolicyHeader,
  SettingRow,
  successCircleSrc,
  ViewContainer,
} from "./styles";
import { Box, Typography } from "@mui/material";
import { ChipRenderer, theme } from "@ui/ui-lib/index";
import { POLICY_CONFIGURATION_CONSTANTS } from "../PolicyConfiguration/constants";
import uncheckedCircleSrc from "../../../../assets/svgs/unchecked-image.svg";

interface PolicySettings {
  enrollmentStartDate: any | null;
  enrollmentEndDate: any | null;
  employerContribution: string;
  requireConfirmation: boolean;
  autoLockEnrollment: boolean;
  autoLockAfterConfirmation: boolean;
  isConfigured?: boolean;
}

interface PolicyConfigurationViewProps {
  policySettings: Map<string, PolicySettings>;
}
const configurationStatusStyleMap = {
  configured: {
    backgroundColor: "#E8F5E9",
    color: "#4CAF50",
  },
  "not configured": {
    backgroundColor: "#F5F5F5",
    color: "#747474",
  },
};
export const PolicyConfigurationView: React.FC<
  PolicyConfigurationViewProps
> = ({ policySettings }) => {
  const policies = [
    { id: "GMC", name: "Group Mediclaim", fullName: "Group Mediclaim" },
    { id: "GTL", name: "Group Term Life", fullName: "Group Term Life" },
    {
      id: "GPA",
      name: "Group Personal Accident",
      fullName: "Group Personal Accident",
    },
  ];

  return (
    <ViewContainer>
      <HeaderSection>
        <Typography variant="h6" gutterBottom>
          Policy Configuration
        </Typography>
        <Typography variant="body2">
          Configure enrollment settings and employer contributions for each
          insurance policy
        </Typography>
      </HeaderSection>

      {policies.map((policy) => {
        const settings = policySettings.get(policy.id) || {
          enrollmentStartDate: null,
          enrollmentEndDate: null,
          employerContribution: "",
          requireConfirmation: false,
          autoLockEnrollment: false,
          autoLockAfterConfirmation: false,
          isConfigured: false,
        };

        const successIconSrc = settings.autoLockAfterConfirmation
          ? successCircleSrc
          : uncheckedCircleSrc;

        const autoLockEnrollmentActive = settings.autoLockEnrollment
          ? successCircleSrc
          : uncheckedCircleSrc;

        const requireConfirmation = settings.requireConfirmation
          ? successCircleSrc
          : uncheckedCircleSrc;

        return (
          <PolicyCard key={policy.id} configured={settings.isConfigured}>
            <PolicyHeader configured={settings.isConfigured}>
              <Box display="flex" alignItems="center" gap={2} pl={1}>
                {/* <ModuleActiveIconBox>
                  <ShieldIcon sx={{ fontSize: 20, color: "#6366F1" }} />
                </ModuleActiveIconBox> */}
                <Box>
                  <Typography variant="body1" fontWeight={600}>
                    {policy.name}
                  </Typography>
                  <Typography variant="caption">{policy.fullName}</Typography>
                </Box>
              </Box>
              {/* <ConfigBadge configured={settings.isConfigured}>
                                {settings.isConfigured ? 'Configured' : 'Not Configured'}
                            </ConfigBadge> */}
              <ChipRenderer
                value={
                  settings.isConfigured
                    ? POLICY_CONFIGURATION_CONSTANTS.POLICY_STATUS.CONFIGURED
                    : POLICY_CONFIGURATION_CONSTANTS.POLICY_STATUS
                        .NOT_CONFIGURED
                }
                styleMap={configurationStatusStyleMap}
                variant="normal"
                bordercolor={
                  settings.isConfigured
                    ? theme.palette.chips.green
                    : theme.palette.text.lightGrey
                }
                size="small"
              />
            </PolicyHeader>

            {settings.isConfigured && (
              <PolicyContent>
                <Typography variant="body2" fontWeight={500} mb={2}>
                  Enrolment Settings
                </Typography>

                <Box>
                  {/* <InfoLabel mb={1}>Enrolment Settings</InfoLabel> */}
                  <SettingRow mb={1}>
                    <ActiveCircle
                      src={requireConfirmation}
                      alt={settings.requireConfirmation ? "Active" : "Inactive"}
                    />
                    <Typography variant="body2" mt={1}>
                      Require Confirmation Before Final Submission
                    </Typography>
                  </SettingRow>
                  <SettingRow mb={1}>
                    <ActiveCircle
                      src={autoLockEnrollmentActive}
                      alt={settings.autoLockEnrollment ? "Active" : "Inactive"}
                    />
                    <Typography variant="body2" mt={1}>
                      Auto-Lock Enrolment After Cut-Off Date
                    </Typography>
                  </SettingRow>
                  <SettingRow>
                    <ActiveCircle src={successIconSrc} alt={settings.autoLockAfterConfirmation ? "Active" : "Inactive"} />
                    <Typography variant="body2" mt={1}>
                      Automatically Lock Enrolment Immediately After An
                      Employee Confirms
                    </Typography>
                  </SettingRow>
                </Box>
              </PolicyContent>
            )}
          </PolicyCard>
        );
      })}
    </ViewContainer>
  );
};
