import { forwardRef } from 'react';
import { Box } from '@mui/material';
import {
    FavoriteBorder as HeartIcon,
    FitnessCenter as ActivityIcon,
    Security as ShieldIcon,
    Lock as LockIcon,
    Campaign as BannerIcon,
} from '@mui/icons-material';
import {
    SectionDescription,
    SectionLabel,
    WellnessGrid,
    WellnessCard,
    CardHeader,
    CardContent,
    IconContainer,
    CardTitle,
    CardDesc,
    LockBadge,
    SubOptionsContainer,
    SubOptionsBox,
    SubOptionHeader,
    SubOptionItem,
    SubOptionLabel,
    RetailSection,
    RetailBox,
    RetailHeader,
    RetailTitleBox as RetailTitle,
    ProductsLabel,
    ProductsGrid,
    ProductItem,
    ProductLabel,
    ContentContainer,
    SectionBox,
} from './styles';
import { CommonToggle } from '../LoginAuthSection/styles';

export interface DashboardConfigState {
    insuranceWellness: { enabled: boolean; options: Record<string, boolean> };
    emotionalWellness: { enabled: boolean; options: Record<string, boolean> };
    physicalWellness: { enabled: boolean; options: Record<string, boolean> };
    retailInsurance: { enabled: boolean; products: Record<string, boolean> };
    wellnessBanner: { enabled: boolean };
    portingBanner: { enabled: boolean };
}

interface DashboardConfigurationContentProps {
    config: DashboardConfigState;
    onChange: (config: DashboardConfigState) => void;
}

const DEFAULT_INSURANCE_OPTIONS = {
    policyManagement: true,
    claimsTracking: true,
    coverageInsights: true,
    tpaServices: true,
};

const DEFAULT_EMOTIONAL_OPTIONS = {
    mentalHealthSupport: true,
    counselingServices: true,
    stressManagement: true,
    mindfulness: false,
};

const DEFAULT_PHYSICAL_OPTIONS = {
    fitnessTracking: true,
    workoutSessions: true,
    healthMetrics: true,
    nutritionPlans: false,
};

const DEFAULT_RETAIL_PRODUCTS = {
    electricTwoWheeler: true,
    electronicAllRisk: true,
    individualTravel: false,
    moneyInsurance: true,
    motorInsurance: true,
    motorTwoWheeler: false,
    travelInsurance: true,
};

export const DashboardConfigurationContent = forwardRef<
    HTMLDivElement,
    DashboardConfigurationContentProps
>(({ config, onChange }, ref) => {
    const currentConfig: DashboardConfigState = {
        insuranceWellness: {
            enabled: config?.insuranceWellness?.enabled ?? true,
            options: {
                ...DEFAULT_INSURANCE_OPTIONS,
                ...(config?.insuranceWellness?.options ?? {}),
            },
        },
        emotionalWellness: {
            enabled: config?.emotionalWellness?.enabled ?? false,
            options: {
                ...DEFAULT_EMOTIONAL_OPTIONS,
                ...(config?.emotionalWellness?.options ?? {}),
            },
        },
        physicalWellness: {
            enabled: config?.physicalWellness?.enabled ?? false,
            options: {
                ...DEFAULT_PHYSICAL_OPTIONS,
                ...(config?.physicalWellness?.options ?? {}),
            },
        },
        retailInsurance: {
            enabled: config?.retailInsurance?.enabled ?? true,
            products: {
                ...DEFAULT_RETAIL_PRODUCTS,
                ...(config?.retailInsurance?.products ?? {}),
            },
        },
        wellnessBanner: {
            enabled: config?.wellnessBanner?.enabled ?? false,
        },
        portingBanner: {
            enabled: config?.portingBanner?.enabled ?? false,
        },
    };

    const updateConfig = (next: Partial<DashboardConfigState>) => {
        onChange({
            ...currentConfig,
            ...next,
        });
    };

    const toggleEmotionalModule = (enabled: boolean) => {
        updateConfig({
            emotionalWellness: {
                ...currentConfig.emotionalWellness,
                enabled,
            },
        });
    };

    const togglePhysicalModule = (enabled: boolean) => {
        updateConfig({
            physicalWellness: {
                ...currentConfig.physicalWellness,
                enabled,
            },
        });
    };

    const toggleEmotionalSubOption = (key: keyof typeof DEFAULT_EMOTIONAL_OPTIONS) => {
        if (!currentConfig.emotionalWellness.enabled) {
            return;
        }
        updateConfig({
            emotionalWellness: {
                ...currentConfig.emotionalWellness,
                options: {
                    ...currentConfig.emotionalWellness.options,
                    [key]: !currentConfig.emotionalWellness.options[key],
                },
            },
        });
    };

    const togglePhysicalSubOption = (key: keyof typeof DEFAULT_PHYSICAL_OPTIONS) => {
        if (!currentConfig.physicalWellness.enabled) {
            return;
        }
        updateConfig({
            physicalWellness: {
                ...currentConfig.physicalWellness,
                options: {
                    ...currentConfig.physicalWellness.options,
                    [key]: !currentConfig.physicalWellness.options[key],
                },
            },
        });
    };

    const toggleRetailModule = (enabled: boolean) => {
        updateConfig({
            retailInsurance: {
                ...currentConfig.retailInsurance,
                enabled,
            },
        });
    };

    const toggleWellnessBanner = (enabled: boolean) => {
        updateConfig({
            wellnessBanner: { enabled },
        });
    };

    const togglePortingBanner = (enabled: boolean) => {
        updateConfig({
            portingBanner: { enabled },
        });
    };

    const toggleRetailProduct = (key: keyof typeof DEFAULT_RETAIL_PRODUCTS) => {
        updateConfig({
            retailInsurance: {
                ...currentConfig.retailInsurance,
                products: {
                    ...currentConfig.retailInsurance.products,
                    [key]: !currentConfig.retailInsurance.products[key],
                },
            },
        });
    };

    return (
        <ContentContainer ref={ref}>
            {/* Wellness Module Configuration + Retail Insurance — hidden per request; kept for reference.
                These still drive which wellness cards/features and which retail products appear on the
                IBP employee dashboard, so the code is preserved (just not rendered/editable here). */}
            {false && (
              <>
            <SectionBox>
                <SectionDescription>
                    Control which wellness modules appear on the employee dashboard
                </SectionDescription>

                <SectionLabel>Enable Core Wellness Modules</SectionLabel>

                <WellnessGrid>
                    {/* Insurance Wellness - Always enabled, locked */}
                    <WellnessCard enabled locked>
                        <CardHeader>
                            <CardContent>
                                <IconContainer locked>
                                    <ShieldIcon sx={{ fontSize: 24, color: '#9333EA' }} />
                                </IconContainer>
                                <Box flex={1}>
                                    <CardTitle>
                                        Insurance Wellness
                                        <LockBadge>
                                            <LockIcon sx={{ fontSize: 14, color: '#9333EA' }} />
                                        </LockBadge>
                                    </CardTitle>
                                    <CardDesc>Company insurance policies and benefits management</CardDesc>
                                </Box>
                            </CardContent>
                        </CardHeader>

                        <SubOptionsContainer>
                            <SubOptionsBox locked>
                                <SubOptionHeader>Insurance Settings</SubOptionHeader>
                                {Object.entries(currentConfig.insuranceWellness.options).map(
                                    ([key, value]) => (
                                        <SubOptionItem key={key} disabled>
                                            <SubOptionLabel>
                                                {key === 'policyManagement' && 'Policy Management'}
                                                {key === 'claimsTracking' && 'Claims Tracking'}
                                                {key === 'coverageInsights' && 'Coverage Insights'}
                                                {key === 'tpaServices' && 'TPA Services'}
                                            </SubOptionLabel>
                                            <CommonToggle checked={value} disabled size="small" />
                                        </SubOptionItem>
                                    )
                                )}
                            </SubOptionsBox>
                        </SubOptionsContainer>
                    </WellnessCard>

                    {/* Emotional Wellness */}
                    <WellnessCard enabled={currentConfig.emotionalWellness.enabled}>
                        <CardHeader>
                            <CardContent>
                                <IconContainer>
                                    <HeartIcon sx={{ fontSize: 24, color: '#3B82F6' }} />
                                </IconContainer>
                                <Box flex={1}>
                                    <CardTitle>Emotional Wellness</CardTitle>
                                    <CardDesc>Mental health support, counseling, and stress management</CardDesc>
                                </Box>
                            </CardContent>
                            <CommonToggle
                                checked={currentConfig.emotionalWellness.enabled}
                                onChange={(e) => toggleEmotionalModule(e.target.checked)}
                            />
                        </CardHeader>

                        <SubOptionsContainer>
                            <SubOptionsBox>
                                <SubOptionHeader>Emotional Wellness Settings</SubOptionHeader>
                                {Object.entries(currentConfig.emotionalWellness.options).map(
                                    ([key, value]) => (
                                        <SubOptionItem
                                            key={key}
                                            disabled={!currentConfig.emotionalWellness.enabled}
                                        >
                                            <SubOptionLabel>
                                                {key === 'mentalHealthSupport' && 'Mental Health Support'}
                                                {key === 'counselingServices' && 'Counseling Services'}
                                                {key === 'stressManagement' && 'Stress Management'}
                                                {key === 'mindfulness' && 'Mindfulness'}
                                            </SubOptionLabel>
                                            <CommonToggle
                                                checked={value}
                                                onChange={() =>
                                                    toggleEmotionalSubOption(
                                                        key as keyof typeof DEFAULT_EMOTIONAL_OPTIONS
                                                    )
                                                }
                                                disabled={!currentConfig.emotionalWellness.enabled}
                                                size="small"
                                            />
                                        </SubOptionItem>
                                    )
                                )}
                            </SubOptionsBox>
                        </SubOptionsContainer>
                    </WellnessCard>

                    {/* Physical Wellness */}
                    <WellnessCard enabled={currentConfig.physicalWellness.enabled} physical>
                        <CardHeader>
                            <CardContent>
                                <IconContainer>
                                    <ActivityIcon sx={{ fontSize: 24, color: '#3B82F6' }} />
                                </IconContainer>
                                <Box flex={1}>
                                    <CardTitle>Physical Wellness</CardTitle>
                                    <CardDesc>Fitness programs, health tracking, and activity challenges</CardDesc>
                                </Box>
                            </CardContent>
                            <CommonToggle
                                checked={currentConfig.physicalWellness.enabled}
                                onChange={(e) => togglePhysicalModule(e.target.checked)}
                            />
                        </CardHeader>

                        <SubOptionsContainer>
                            <SubOptionsBox>
                                <SubOptionHeader>Physical Wellness Settings</SubOptionHeader>
                                {Object.entries(currentConfig.physicalWellness.options).map(
                                    ([key, value]) => (
                                        <SubOptionItem
                                            key={key}
                                            disabled={!currentConfig.physicalWellness.enabled}
                                        >
                                            <SubOptionLabel>
                                                {key === 'fitnessTracking' && 'Fitness Tracking'}
                                                {key === 'workoutSessions' && 'Workout Sessions'}
                                                {key === 'healthMetrics' && 'Health Metrics'}
                                                {key === 'nutritionPlans' && 'Nutrition Plans'}
                                            </SubOptionLabel>
                                            <CommonToggle
                                                checked={value}
                                                onChange={() =>
                                                    togglePhysicalSubOption(
                                                        key as keyof typeof DEFAULT_PHYSICAL_OPTIONS
                                                    )
                                                }
                                                disabled={!currentConfig.physicalWellness.enabled}
                                                size="small"
                                            />
                                        </SubOptionItem>
                                    )
                                )}
                            </SubOptionsBox>
                        </SubOptionsContainer>
                    </WellnessCard>
                </WellnessGrid>
            </SectionBox>

            {/* Retail Insurance */}
            <RetailSection>
                <RetailBox>
                    <RetailHeader>
                        <RetailTitle>
                            <ShieldIcon sx={{ fontSize: 24, color: '#3B82F6' }} />
                            <Box>
                                <CardTitle>Retail Insurance</CardTitle>
                                <CardDesc>Enable additional retail insurance products</CardDesc>
                            </Box>
                        </RetailTitle>
                        <CommonToggle
                            checked={currentConfig.retailInsurance.enabled}
                            onChange={(e) => toggleRetailModule(e.target.checked)}
                        />
                    </RetailHeader>

                    {currentConfig.retailInsurance.enabled && (
                        <>
                            <ProductsLabel>Available Insurance Products</ProductsLabel>
                            <ProductsGrid>
                                {Object.entries(currentConfig.retailInsurance.products).map(
                                    ([key, value]) => (
                                        <ProductItem key={key}>
                                            <ProductLabel>
                                                {key === 'electricTwoWheeler' && 'Electric Two Wheeler Insurance'}
                                                {key === 'electronicAllRisk' && 'Electronic All Risk'}
                                                {key === 'individualTravel' && 'Individual Travel Insurance'}
                                                {key === 'moneyInsurance' && 'Money Insurance'}
                                                {key === 'motorInsurance' && 'Motor Insurance'}
                                                {key === 'motorTwoWheeler' && 'Motor Two Wheeler Insurance'}
                                                {key === 'travelInsurance' && 'Travel Insurance'}
                                            </ProductLabel>
                                            <CommonToggle
                                                checked={value}
                                                onChange={() =>
                                                    toggleRetailProduct(
                                                        key as keyof typeof DEFAULT_RETAIL_PRODUCTS
                                                    )
                                                }
                                                size="small"
                                            />
                                        </ProductItem>
                                    )
                                )}
                            </ProductsGrid>
                        </>
                    )}
                </RetailBox>
            </RetailSection>
              </>
            )}

            {/* Explore Wellness Banner */}
            <RetailSection>
                <RetailBox>
                    <RetailHeader>
                        <RetailTitle>
                            <BannerIcon sx={{ fontSize: 24, color: '#3B82F6' }} />
                            <Box>
                                <CardTitle>Explore Wellness Banner</CardTitle>
                                <CardDesc>
                                    Show the Explore Wellness banner on the employee dashboard
                                </CardDesc>
                            </Box>
                        </RetailTitle>
                        <CommonToggle
                            checked={currentConfig.wellnessBanner.enabled}
                            onChange={(e) => toggleWellnessBanner(e.target.checked)}
                        />
                    </RetailHeader>
                </RetailBox>
            </RetailSection>

            {/* Policy Porting Banner */}
            <RetailSection>
                <RetailBox>
                    <RetailHeader>
                        <RetailTitle>
                            <BannerIcon sx={{ fontSize: 24, color: '#3B82F6' }} />
                            <Box>
                                <CardTitle>Policy Porting Banner</CardTitle>
                                <CardDesc>
                                    Show the Policy Porting banner on the employee dashboard
                                </CardDesc>
                            </Box>
                        </RetailTitle>
                        <CommonToggle
                            checked={currentConfig.portingBanner.enabled}
                            onChange={(e) => togglePortingBanner(e.target.checked)}
                        />
                    </RetailHeader>
                </RetailBox>
            </RetailSection>
        </ContentContainer>
    );
});

DashboardConfigurationContent.displayName = 'DashboardConfigurationContent';
