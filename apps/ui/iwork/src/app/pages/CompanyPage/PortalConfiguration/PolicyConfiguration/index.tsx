import React, { useMemo, useState } from 'react';
import { Box, Typography, Button as MuiButton, Checkbox, TextField } from '@mui/material';
import { ContentCopy as CopyIcon } from '@mui/icons-material';
import { Dayjs } from 'dayjs';
import { ChipRenderer, theme, isCopyPasteAllowedForOrg } from '@ui/ui-lib';
import { Toggle } from '../Toggle';
import {
    POLICY_CONFIGURATION_CONSTANTS,
    POLICIES_LIST,
    DEFAULT_EMPLOYER_CONTRIBUTION,
} from './constants';
import { SuccessCircle, successCircleSrc } from './styles';
import {
    BulkConfigCard,
    ConfigContainer,
    HeaderSection,
    OverlayContainer,
    OverlayContent,
    PolicyCard,
    PolicyContent,
    PolicyHeader,
    PolicySelectionCloseIcon,
    PolicySelectionDescription,
    PolicySelectionHeader,
    PolicySelectionItem,
    PolicySelectionList,
    ToggleCard,
    TogglesGrid,
} from './styles';

interface PolicySettings {
    enrollmentStartDate: Dayjs | null;
    enrollmentEndDate: Dayjs | null;
    employerContribution: string;
    requireConfirmation: boolean;
    autoLockEnrollment: boolean;
    autoLockAfterConfirmation: boolean;
    isConfigured?: boolean;
    disclaimerText?: string;
}

interface PolicyInfo {
    id: string;
    name: string;
    fullName: string;
}

interface PolicyConfigurationProps {
    isEditMode: boolean;
    policySettings?: Map<string, PolicySettings>;
    onPolicySettingsChange?: (settings: Map<string, PolicySettings>) => void;
}

// Configuration status style map for ChipRenderer
const configurationStatusStyleMap = {
    configured: {
        backgroundColor: '#E8F5E9',
        color: '#4CAF50',
    },
    'not configured': {
        backgroundColor: '#F5F5F5',
        color: '#747474',
    },
};

export const PolicyConfiguration: React.FC<PolicyConfigurationProps> = ({
    isEditMode,
    policySettings: policySettingsProp,
    onPolicySettingsChange,
}) => {
    const policies: PolicyInfo[] = POLICIES_LIST;

    const [showBulkConfig, setShowBulkConfig] = useState(false);
    const [showPolicySelection, setShowPolicySelection] = useState(false);

    const defaultPolicySettings = new Map<string, PolicySettings>([
        [
            'GMC',
            {
                enrollmentStartDate: null,
                enrollmentEndDate: null,
                employerContribution: '',
                requireConfirmation: false,
                autoLockEnrollment: true,
                autoLockAfterConfirmation: false,
                isConfigured: false,
                disclaimerText: '',
            },
        ],
        [
            'GTL',
            {
                enrollmentStartDate: null,
                enrollmentEndDate: null,
                employerContribution: '',
                requireConfirmation: false,
                autoLockEnrollment: true,
                autoLockAfterConfirmation: false,
                isConfigured: false,
                disclaimerText: '',
            },
        ],
        [
            'GPA',
            {
                enrollmentStartDate: null,
                enrollmentEndDate: null,
                employerContribution: '',
                requireConfirmation: false,
                autoLockEnrollment: true,
                autoLockAfterConfirmation: false,
                isConfigured: false,
                disclaimerText: '',
            },
        ],
    ]);

    const [internalPolicySettings, setInternalPolicySettings] = useState<Map<string, PolicySettings>>(
        () => new Map(defaultPolicySettings)
    );

    const policySettings = useMemo(
        () => policySettingsProp ?? internalPolicySettings,
        [policySettingsProp, internalPolicySettings]
    );

    const applyPolicySettings = (nextSettings: Map<string, PolicySettings>) => {
        if (onPolicySettingsChange) {
            onPolicySettingsChange(nextSettings);
        } else {
            setInternalPolicySettings(nextSettings);
        }
    };

    const [bulkConfigSettings, setBulkConfigSettings] = useState<PolicySettings>({
        enrollmentStartDate: null,
        enrollmentEndDate: null,
        employerContribution: DEFAULT_EMPLOYER_CONTRIBUTION,
        requireConfirmation: true,
        autoLockEnrollment: true,
        autoLockAfterConfirmation: false,
    });

    const [selectedPoliciesForBulk, setSelectedPoliciesForBulk] = useState<Set<string>>(
        new Set(['GMC', 'GTL', 'GPA'])
    );

    // Helper function to check if policy settings are in default state
    const isPolicyInDefaultState = (settings: PolicySettings): boolean => {
        return (
            settings.enrollmentStartDate === null &&
            settings.enrollmentEndDate === null &&
            settings.employerContribution === '' &&
            settings.requireConfirmation === false &&
            settings.autoLockEnrollment === false &&
            settings.autoLockAfterConfirmation === false &&
            (settings.disclaimerText ?? '') === ''
        );
    };

    const updatePolicySettings = (policyId: string, updates: Partial<PolicySettings>) => {
        if (!isEditMode) return;

        const newSettings = new Map(policySettings);
        const current = newSettings.get(policyId);
        if (current) {
            // Apply updates to current settings
            const updatedSettings = {
                ...current,
                ...updates,
                ...(updates.requireConfirmation === false
                    ? { autoLockAfterConfirmation: false, disclaimerText: '' }
                    : {}),
                disclaimerText:
                    updates.disclaimerText !== undefined
                        ? updates.disclaimerText
                        : current.disclaimerText ?? '',
            };

            // Check if settings are in default state after the update
            const isInDefaultState = isPolicyInDefaultState(updatedSettings);

            // Set isConfigured to false if all settings are back to default, true otherwise
            newSettings.set(policyId, {
                ...updatedSettings,
                isConfigured: !isInDefaultState,
            });
            applyPolicySettings(newSettings);
        }
    };

    const handleApplyBulkConfig = () => {
        setShowPolicySelection(true);
    };

    const applyBulkConfigToSelected = () => {
        const newSettings = new Map(policySettings);
        selectedPoliciesForBulk.forEach((policyId) => {
            newSettings.set(policyId, {
                ...bulkConfigSettings,
                isConfigured: true,
            });
        });
        setPolicySettings(newSettings);
        setShowPolicySelection(false);
        setShowBulkConfig(false);
    };

    const togglePolicySelection = (policyId: string) => {
        const newSelection = new Set(selectedPoliciesForBulk);
        if (newSelection.has(policyId)) {
            newSelection.delete(policyId);
        } else {
            newSelection.add(policyId);
        }
        setSelectedPoliciesForBulk(newSelection);
    };

    return (
        <ConfigContainer>
            <HeaderSection>
                <Box>
                    <Typography variant="h6" gutterBottom>
                        {POLICY_CONFIGURATION_CONSTANTS.HEADER.TITLE}
                    </Typography>
                    <Typography variant="body2" >
                        {POLICY_CONFIGURATION_CONSTANTS.HEADER.DESCRIPTION}
                    </Typography>
                </Box>
                {/* Enable the below button when bulk configuration is required */}
                {/* {isEditMode && (
                    <MuiButton
                        variant={showBulkConfig ? 'contained' : 'outlined'}
                        startIcon={<CopyIcon />}
                        onClick={() => setShowBulkConfig(!showBulkConfig)}
                    >
                        {showBulkConfig ? POLICY_CONFIGURATION_CONSTANTS.BUTTONS.EXIT_BULK_CONFIGURATION : POLICY_CONFIGURATION_CONSTANTS.BUTTONS.BULK_CONFIGURATION}
                    </MuiButton>
                )} */}
            </HeaderSection>

            {showBulkConfig ? (
                <BulkConfigCard>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                        {POLICY_CONFIGURATION_CONSTANTS.BULK_CONFIG.TITLE}
                    </Typography>
                    <Typography variant="body2"  mb={3}>
                        {POLICY_CONFIGURATION_CONSTANTS.BULK_CONFIG.DESCRIPTION}
                    </Typography>

                    <TogglesGrid>
                        <ToggleCard>
                            <Box flex={1} pr={2}>
                                <Typography variant="body2" fontWeight={500}>
                                    {POLICY_CONFIGURATION_CONSTANTS.TOGGLES.REQUIRE_CONFIRMATION.TITLE}
                                </Typography>
                                <Typography variant="caption" >
                                    {POLICY_CONFIGURATION_CONSTANTS.TOGGLES.REQUIRE_CONFIRMATION.DESCRIPTION}
                                </Typography>
                            </Box>
                            <Toggle
                                checked={bulkConfigSettings.requireConfirmation}
                                onChange={(checked) =>
                                    setBulkConfigSettings((prev) => ({
                                        ...prev,
                                        requireConfirmation: checked,
                                    }))
                                }
                            />
                        </ToggleCard>

                        <ToggleCard>
                            <Box flex={1} pr={2}>
                                <Typography variant="body2" fontWeight={500}>
                                    {POLICY_CONFIGURATION_CONSTANTS.TOGGLES.AUTO_LOCK_ENROLLMENT.TITLE}
                                </Typography>
                                <Typography variant="caption" >
                                    {POLICY_CONFIGURATION_CONSTANTS.TOGGLES.AUTO_LOCK_ENROLLMENT.DESCRIPTION}
                                </Typography>
                            </Box>
                            <Toggle
                                checked={bulkConfigSettings.autoLockEnrollment}
                                onChange={(checked) =>
                                    setBulkConfigSettings((prev) => ({
                                        ...prev,
                                        autoLockEnrollment: checked,
                                    }))
                                }
                            />
                        </ToggleCard>
                    </TogglesGrid>

                    <Box mt={3}>
                        <MuiButton variant="contained" fullWidth onClick={handleApplyBulkConfig}>
                            {POLICY_CONFIGURATION_CONSTANTS.BUTTONS.APPLY_TO_SELECTED_POLICIES}
                        </MuiButton>
                    </Box>
                </BulkConfigCard>
            ) : (
                policies.map((policy) => {
                    const settings = policySettings.get(policy.id);
                    if (!settings) return null;

                    return (
                        <PolicyCard key={policy.id} configured={settings.isConfigured}>
                            <PolicyHeader configured={settings.isConfigured}>
                                <Box display="flex" alignItems="flex-start" gap={2}>
                                    {settings.isConfigured && (
                                        <Box>
                                        <SuccessCircle src={successCircleSrc} alt="Success" />

                                        </Box>
                                    )}
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight={600}>
                                            {policy.fullName}
                                        </Typography>
                                        <Typography variant="caption" >
                                            {policy.name}
                                        </Typography>
                                    </Box>
                                </Box>
                                <ChipRenderer
                                    value={settings.isConfigured ? POLICY_CONFIGURATION_CONSTANTS.POLICY_STATUS.CONFIGURED : POLICY_CONFIGURATION_CONSTANTS.POLICY_STATUS.NOT_CONFIGURED}
                                    styleMap={configurationStatusStyleMap}
                                    variant="normal"
                                    bordercolor={settings.isConfigured ? theme.palette.chips.green : theme.palette.text.lightGrey}
                                    size="small"
                                />
                            </PolicyHeader>

                            <PolicyContent>
                                <Typography variant="body2"  mb={2} ml={2}>
                                    Enrolment Settings
                                </Typography>

                                <TogglesGrid>
                                    <ToggleCard>
                                        <Box flex={1} pr={2}>
                                            <Typography variant="body2" fontWeight={500}>
                                                {POLICY_CONFIGURATION_CONSTANTS.TOGGLES.REQUIRE_CONFIRMATION.FULL_TITLE}
                                            </Typography>
                                            <Typography variant="caption" >
                                                {POLICY_CONFIGURATION_CONSTANTS.TOGGLES.REQUIRE_CONFIRMATION.FULL_DESCRIPTION}
                                            </Typography>
                                        </Box>
                                        <Toggle
                                            checked={settings.requireConfirmation}
                                            onChange={(checked) =>
                                                updatePolicySettings(policy.id, {
                                                    requireConfirmation: checked,
                                                    ...(checked ? {} : { disclaimerText: '' }),
                                                })
                                            }
                                            disabled={!isEditMode}
                                        />
                                    </ToggleCard>

                                    <ToggleCard>
                                        <Box flex={1} pr={2}>
                                            <Typography variant="body2" fontWeight={500}>
                                                {POLICY_CONFIGURATION_CONSTANTS.TOGGLES.AUTO_LOCK_ENROLLMENT.FULL_TITLE}
                                            </Typography>
                                            <Typography variant="caption" >
                                                {POLICY_CONFIGURATION_CONSTANTS.TOGGLES.AUTO_LOCK_ENROLLMENT.FULL_DESCRIPTION}
                                            </Typography>
                                        </Box>
                                        <Toggle
                                            checked={settings.autoLockEnrollment}
                                            onChange={(checked) =>
                                                updatePolicySettings(policy.id, {
                                                    autoLockEnrollment: checked,
                                                })
                                            }
                                            disabled={!isEditMode}
                                        />
                                    </ToggleCard>

                                    <ToggleCard>
                                        <Box flex={1} pr={2}>
                                            <Typography variant="body2" fontWeight={500}>
                                                Automatically Lock Enrolment Immediately After An Employee Confirms
                                            </Typography>
                                            <Typography variant="caption" >
                                                Lock enrolment as soon as an employee submits their confirmation
                                            </Typography>
                                        </Box>
                                        <Toggle
                                            checked={settings.autoLockAfterConfirmation}
                                            onChange={(checked) =>
                                                updatePolicySettings(policy.id, {
                                                    autoLockAfterConfirmation: checked,
                                                })
                                            }
                                            disabled={!isEditMode}
                                        />
                                    </ToggleCard>
                                </TogglesGrid>

                                {settings.requireConfirmation && (
                                    <Box mt={3} ml={2}>
                                        <Typography variant="body2" fontWeight={500} mb={1}>
                                            Disclaimer Text
                                        </Typography>
                                        <TextField
                                            fullWidth
                                            multiline
                                            minRows={3}
                                            maxRows={6}
                                            placeholder="Enter disclaimer text for this policy..."
                                            value={settings.disclaimerText ?? ''}
                                            onChange={(e) =>
                                                updatePolicySettings(policy.id, {
                                                    disclaimerText: e.target.value,
                                                })
                                            }
                                            onPaste={(e) => {
                                                if (!isCopyPasteAllowedForOrg()) {
                                                  e.preventDefault();
                                                }
                                            }}
                                            disabled={!isEditMode}
                                        />
                                    </Box>
                                )}
                            </PolicyContent>
                        </PolicyCard>
                    );
                })
            )}

            {/* Policy Selection Overlay */}
            {showPolicySelection && (
                <OverlayContainer onClick={() => setShowPolicySelection(false)}>
                    <OverlayContent onClick={(e) => e.stopPropagation()}>
                        <PolicySelectionHeader>
                            <Typography variant="h6">
                                {POLICY_CONFIGURATION_CONSTANTS.POLICY_SELECTION.TITLE}
                            </Typography>
                            <PolicySelectionCloseIcon onClick={() => setShowPolicySelection(false)} />
                        </PolicySelectionHeader>

                        <PolicySelectionDescription variant="body2">
                            {POLICY_CONFIGURATION_CONSTANTS.POLICY_SELECTION.DESCRIPTION}
                        </PolicySelectionDescription>

                        <PolicySelectionList>
                            {policies.map((policy) => {
                                const isSelected = selectedPoliciesForBulk.has(policy.id);
                                return (
                                    <PolicySelectionItem
                                        key={policy.id}
                                        selected={isSelected}
                                        onClick={() => togglePolicySelection(policy.id)}
                                    >
                                        <Box display="flex" alignItems="center" gap={2}>
                                            <Checkbox checked={isSelected} />
                                            <Box>
                                                <Typography variant="body2" fontWeight={500}>
                                                    {policy.fullName}
                                                </Typography>
                                                <Typography variant="caption">
                                                    {policy.name}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </PolicySelectionItem>
                                );
                            })}
                        </PolicySelectionList>

                        <Box display="flex" gap={2}>
                            <MuiButton
                                variant="outlined"
                                fullWidth
                                onClick={() => setShowPolicySelection(false)}
                            >
                                {POLICY_CONFIGURATION_CONSTANTS.BUTTONS.CANCEL}
                            </MuiButton>
                            <MuiButton
                                variant="contained"
                                fullWidth
                                onClick={applyBulkConfigToSelected}
                                disabled={selectedPoliciesForBulk.size === 0}
                            >
                                {POLICY_CONFIGURATION_CONSTANTS.BUTTONS.APPLY_CONFIGURATION}
                            </MuiButton>
                        </Box>
                    </OverlayContent>
                </OverlayContainer>
            )}
        </ConfigContainer>
    );
};
