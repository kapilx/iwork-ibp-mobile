import React from 'react';
import {
    ClipboardCheck,
    Eye,
    Smartphone,
    Headphones,
    HeartPulse,
    ShieldPlus,
} from 'lucide-react';
import { LANDING_PORTAL_FEATURES } from '../../../constants';
import {
    SectionContainer,
    ContentWrapper,
    HeaderSection,
    Title,
    Subtitle,
    FeaturesGrid,
    FeatureCard,
    IconContainer,
    FeatureTitle,
    FeatureDescription,
} from './styles';

const featureIcons = [ClipboardCheck, Eye, HeartPulse, ShieldPlus, Smartphone, Headphones];
const featureColors = [
    { bgColor: 'rgba(31, 121, 212, 0.1)', iconColor: '#1F79D4' },
    { bgColor: 'rgba(38, 166, 154, 0.1)', iconColor: '#26A69A' },
    { bgColor: 'rgba(76, 175, 80, 0.1)', iconColor: '#4CAF50' },
    { bgColor: 'rgba(255, 107, 53, 0.1)', iconColor: '#FF6B35' },
    { bgColor: 'rgba(156, 39, 176, 0.1)', iconColor: '#9C27B0' },
    { bgColor: 'rgba(255, 193, 7, 0.1)',  iconColor: '#FFC107' },
];

export const PortalFeaturesSection: React.FC = () => {
    return (
        <SectionContainer>
            <ContentWrapper>
                <HeaderSection
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <Title>
                        {LANDING_PORTAL_FEATURES.TITLE}
                    </Title>
                    <Subtitle>
                        {LANDING_PORTAL_FEATURES.SUBTITLE.map((segment, i) =>
                            segment.bold
                                ? <strong key={i}>{segment.text}</strong>
                                : segment.text
                        )}
                    </Subtitle>
                </HeaderSection>

                <FeaturesGrid>
                    {LANDING_PORTAL_FEATURES.FEATURES.map((feature, index) => {
                        const Icon = featureIcons[index];
                        const colors = featureColors[index];
                        return (
                            <FeatureCard
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                            >
                                <IconContainer bgcolor={colors.bgColor} iconcolor={colors.iconColor}>
                                    <Icon size={24} />
                                </IconContainer>
                                <FeatureTitle>{feature.title}</FeatureTitle>
                                <FeatureDescription>{feature.description}</FeatureDescription>
                            </FeatureCard>
                        );
                    })}
                </FeaturesGrid>
            </ContentWrapper>
        </SectionContainer>
    );
};
