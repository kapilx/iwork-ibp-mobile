import React from 'react';
import { Box, Typography } from '@mui/material';
import {
    Favorite as HeartIcon,
    FitnessCenter as ActivityIcon,
    Security as ShieldIcon,
    Lock as LockIcon,
    Check as CheckIcon,
    Close as CloseIcon,
    Storefront as StoreIcon,
    Campaign as BannerIcon,
} from '@mui/icons-material';
import {
    ViewContainer,
    ConfigCard,
    CardHeader,
    IconBox,
    CardTitle,
    CardSubtitle,
    ModuleSection,
    SectionLabel,
    ModulesGrid,
    ModuleCard,
    ModuleHeader,
    ModuleIconBox,
    ModuleTitle,
    ModuleDesc,
    StatusChip,
    SubOptionsList,
    SubOption,
    SubOptionIcon,
    DisclaimerBox,
} from './styles';
import { ChipRenderer, theme } from '@ui/ui-lib';
import { DashboardConfigState } from '../DashboardConfigurationContent';

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

interface DashboardConfigurationViewProps {
    dashboardConfig: DashboardConfigState;
}

export const DashboardConfigurationView: React.FC<DashboardConfigurationViewProps> = ({
    dashboardConfig,
}) => {
    const insuranceSubOptions = dashboardConfig.insuranceWellness.options;
    const emotionalWellnessEnabled = dashboardConfig.emotionalWellness.enabled;
    const physicalWellnessEnabled = dashboardConfig.physicalWellness.enabled;
    const emotionalSubOptions = dashboardConfig.emotionalWellness.options;
    const physicalSubOptions = dashboardConfig.physicalWellness.options;
    const retailInsuranceEnabled = dashboardConfig.retailInsurance.enabled;
    const enabledRetailProducts = Object.entries(dashboardConfig.retailInsurance.products).filter(
        ([, enabled]) => enabled
    );
    const wellnessBannerEnabled = dashboardConfig.wellnessBanner?.enabled ?? false;
    const portingBannerEnabled = dashboardConfig.portingBanner?.enabled ?? false;

    return (
        <ViewContainer>
            {/* Wellness Module + Retail Insurance view — hidden per request; kept for reference. */}
            {false && (
              <>
            <ConfigCard>
                <CardHeader>
                    <IconBox>
                        <HeartIcon sx={{ fontSize: 24, color: '#3B82F6' }} />
                    </IconBox>
                    <Box>
                        <CardTitle>Wellness Module Configuration</CardTitle>
                        <CardSubtitle>
                            Control which wellness modules appear on the employee dashboard
                        </CardSubtitle>
                    </Box>
                </CardHeader>

                <ModuleSection>
                    <SectionLabel>Core Wellness Modules</SectionLabel>
                    <ModulesGrid>
                        {/* Insurance Wellness - Locked */}
                        <ModuleCard enabled locked>
                            <ModuleHeader>
                                <ModuleIconBox locked>
                                    <ShieldIcon sx={{ fontSize: 20, color: '#9333EA' }} />
                                </ModuleIconBox>
                                <ModuleTitle>Insurance Wellness</ModuleTitle>
                            </ModuleHeader>
                            <ModuleDesc>Company insurance policies and benefits management</ModuleDesc>
                            <StatusChip
                                locked
                                icon={<LockIcon />}
                                label="Always Enabled"
                                size="small"
                            />
                            <Box mt={2}>
                                <SubOptionsList>
                                    {Object.entries(insuranceSubOptions).map(([key, enabled]) => (
                                        <SubOption key={key} enabled={enabled}>
                                            <SubOptionIcon enabled={enabled}>
                                                {enabled ? (
                                                    <CheckIcon sx={{ fontSize: 12, color: '#059669' }} />
                                                ) : (
                                                    <CloseIcon sx={{ fontSize: 12, color: 'grey.400' }} />
                                                )}
                                            </SubOptionIcon>
                                            <span>
                                                {key === 'policyManagement' && 'Policy Management'}
                                                {key === 'claimsTracking' && 'Claims Tracking'}
                                                {key === 'coverageInsights' && 'Coverage Insights'}
                                                {key === 'tpaServices' && 'TPA Services'}
                                            </span>
                                        </SubOption>
                                    ))}
                                </SubOptionsList>
                            </Box>
                        </ModuleCard>

                        {/* Emotional Wellness */}
                        <ModuleCard enabled={emotionalWellnessEnabled}>
                            <ModuleHeader>
                                <ModuleIconBox>
                                    <HeartIcon sx={{ fontSize: 20, color: '#3B82F6' }} />
                                </ModuleIconBox>
                                <ModuleTitle>Emotional Wellness</ModuleTitle>
                            </ModuleHeader>
                            <ModuleDesc>Mental health support, counseling, and stress management</ModuleDesc>
                            {emotionalWellnessEnabled ? (
                                <>
                                    <StatusChip
                                        icon={<CheckIcon />}
                                        label="Enabled"
                                        size="small"
                                    />
                                    <Box mt={2}>
                                        <SubOptionsList>
                                            {Object.entries(emotionalSubOptions).map(([key, enabled]) => (
                                                <SubOption key={key} enabled={enabled}>
                                                    <SubOptionIcon enabled={enabled}>
                                                        {enabled ? (
                                                            <CheckIcon sx={{ fontSize: 12, color: '#059669' }} />
                                                        ) : (
                                                            <CloseIcon sx={{ fontSize: 12, color: 'grey.400' }} />
                                                        )}
                                                    </SubOptionIcon>
                                                    <span>
                                                        {key === 'mentalHealthSupport' && 'Mental Health Support'}
                                                        {key === 'counselingServices' && 'Counseling Services'}
                                                        {key === 'stressManagement' && 'Stress Management'}
                                                        {key === 'mindfulness' && 'Mindfulness'}
                                                    </span>
                                                </SubOption>
                                            ))}
                                        </SubOptionsList>
                                    </Box>
                                </>
                            ) : (
                                <StatusChip
                                    label="Disabled"
                                    size="small"
                                    sx={{
                                        backgroundColor: 'grey.200',
                                        color: 'grey.600',
                                    }}
                                />
                            )}
                        </ModuleCard>

                        {/* Physical Wellness */}
                        <ModuleCard enabled={physicalWellnessEnabled}>
                            <ModuleHeader>
                                <ModuleIconBox>
                                    <ActivityIcon sx={{ fontSize: 20, color: '#3B82F6' }} />
                                </ModuleIconBox>
                                <ModuleTitle>Physical Wellness</ModuleTitle>
                            </ModuleHeader>
                            <ModuleDesc>Fitness programs, health tracking, and activity challenges</ModuleDesc>
                            {physicalWellnessEnabled ? (
                                <>
                                    <StatusChip
                                        icon={<CheckIcon />}
                                        label="Enabled"
                                        size="small"
                                    />
                                    <Box mt={2}>
                                        <SubOptionsList>
                                            {Object.entries(physicalSubOptions).map(([key, enabled]) => (
                                                <SubOption key={key} enabled={enabled}>
                                                    <SubOptionIcon enabled={enabled}>
                                                        {enabled ? (
                                                            <CheckIcon sx={{ fontSize: 12, color: '#059669' }} />
                                                        ) : (
                                                            <CloseIcon sx={{ fontSize: 12, color: 'grey.400' }} />
                                                        )}
                                                    </SubOptionIcon>
                                                    <span>
                                                        {key === 'fitnessTracking' && 'Fitness Tracking'}
                                                        {key === 'workoutSessions' && 'Workout Sessions'}
                                                        {key === 'healthMetrics' && 'Health Metrics'}
                                                        {key === 'nutritionPlans' && 'Nutrition Plans'}
                                                    </span>
                                                </SubOption>
                                            ))}
                                        </SubOptionsList>
                                    </Box>
                                </>
                            ) : (
                                <StatusChip
                                    label="Disabled"
                                    size="small"
                                    sx={{
                                        backgroundColor: 'grey.200',
                                        color: 'grey.600',
                                    }}
                                />
                            )}
                        </ModuleCard>
                    </ModulesGrid>
                </ModuleSection>
            </ConfigCard>

            <ConfigCard>
                <CardHeader>
                    <IconBox>
                        <StoreIcon sx={{ fontSize: 24, color: '#3B82F6' }} />
                    </IconBox>
                    <Box>
                        <CardTitle>Retail Insurance</CardTitle>
                        <CardSubtitle>
                            {retailInsuranceEnabled
                                ? 'Retail insurance products are enabled'
                                : 'Retail insurance products are currently disabled'}
                        </CardSubtitle>
                    </Box>
                </CardHeader>

                <DisclaimerBox
                    variant="body2"
                    sx={{
                        backgroundColor: '#F8FAFC',
                        border: (theme) => `1px dashed ${theme.palette.grey[200]}`,
                    }}
                >
                    {retailInsuranceEnabled
                        ? enabledRetailProducts.length > 0
                            ? `Enabled products: ${enabledRetailProducts
                                  .map(([key]) => {
                                      if (key === 'electricTwoWheeler') return 'Electric Two Wheeler Insurance';
                                      if (key === 'electronicAllRisk') return 'Electronic All Risk';
                                      if (key === 'individualTravel') return 'Individual Travel Insurance';
                                      if (key === 'moneyInsurance') return 'Money Insurance';
                                      if (key === 'motorInsurance') return 'Motor Insurance';
                                      if (key === 'motorTwoWheeler') return 'Motor Two Wheeler Insurance';
                                      if (key === 'travelInsurance') return 'Travel Insurance';
                                      return null;
                                  })
                                  .filter(Boolean)
                                  .join(', ')}`
                            : 'Retail insurance products are enabled.'
                        : 'No retail insurance products enabled'}
                </DisclaimerBox>
            </ConfigCard>
              </>
            )}

            <ConfigCard>
                <CardHeader>
                    <IconBox>
                        <BannerIcon sx={{ fontSize: 24, color: '#3B82F6' }} />
                    </IconBox>
                    <Box>
                        <CardTitle>Explore Wellness Banner</CardTitle>
                        <CardSubtitle>
                            {wellnessBannerEnabled
                                ? 'The Explore Wellness banner is shown on the employee dashboard'
                                : 'The Explore Wellness banner is hidden on the employee dashboard'}
                        </CardSubtitle>
                    </Box>
                    <Box sx={{ ml: 'auto' }}>
                        <ChipRenderer
                            value={wellnessBannerEnabled ? 'Configured' : 'Not Configured'}
                            styleMap={configurationStatusStyleMap}
                            variant="normal"
                            bordercolor={
                                wellnessBannerEnabled
                                    ? theme.palette.chips.green
                                    : theme.palette.text.lightGrey
                            }
                            size="small"
                        />
                    </Box>
                </CardHeader>
            </ConfigCard>

            <ConfigCard>
                <CardHeader>
                    <IconBox>
                        <BannerIcon sx={{ fontSize: 24, color: '#3B82F6' }} />
                    </IconBox>
                    <Box>
                        <CardTitle>Policy Porting Banner</CardTitle>
                        <CardSubtitle>
                            {portingBannerEnabled
                                ? 'The Policy Porting banner is shown on the employee dashboard'
                                : 'The Policy Porting banner is hidden on the employee dashboard'}
                        </CardSubtitle>
                    </Box>
                    <Box sx={{ ml: 'auto' }}>
                        <ChipRenderer
                            value={portingBannerEnabled ? 'Configured' : 'Not Configured'}
                            styleMap={configurationStatusStyleMap}
                            variant="normal"
                            bordercolor={
                                portingBannerEnabled
                                    ? theme.palette.chips.green
                                    : theme.palette.text.lightGrey
                            }
                            size="small"
                        />
                    </Box>
                </CardHeader>
            </ConfigCard>
        </ViewContainer>
    );
};
