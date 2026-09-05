import React from 'react';
import { Stethoscope, Video, Brain, Dumbbell } from 'lucide-react';
import { ArrowForward } from '@mui/icons-material';
import { LANDING_WELLNESS_SERVICES } from '../../../constants';
import {
    SectionContainer,
    ContentWrapper,
    HeaderSection,
    Badge,
    Title,
    Subtitle,
    ServicesGrid,
    ServiceCard,
    IconContainer,
    ServiceTitle,
    ServiceDescription,
    CTAWrapper,
    CTAButton,
} from './styles';

const serviceIcons = [Stethoscope, Video, Brain, Dumbbell];
const serviceGradients = [
    'linear-gradient(135deg, #2d5a3d 0%, #4caf50 100%)',
    'linear-gradient(135deg, #26a69a 0%, #00bcd4 100%)',
    'linear-gradient(135deg, #3f51b5 0%, #5c6bc0 100%)',
    'linear-gradient(135deg, #e65100 0%, #ff9800 100%)',
];

export const WellnessServicesSection: React.FC = () => {
    return (
        <SectionContainer>
            <ContentWrapper>
                <HeaderSection
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <Badge>{LANDING_WELLNESS_SERVICES.BADGE}</Badge>
                    <Title>{LANDING_WELLNESS_SERVICES.TITLE}</Title>
                    <Subtitle>{LANDING_WELLNESS_SERVICES.SUBTITLE}</Subtitle>
                </HeaderSection>

                <ServicesGrid>
                    {LANDING_WELLNESS_SERVICES.SERVICES.map((service, index) => {
                        const Icon = serviceIcons[index];
                        return (
                            <ServiceCard
                                key={service.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                            >
                                <IconContainer gradient={serviceGradients[index]}>
                                    <Icon size={24} />
                                </IconContainer>
                                <ServiceTitle>{service.title}</ServiceTitle>
                                <ServiceDescription>{service.description}</ServiceDescription>
                            </ServiceCard>
                        );
                    })}
                </ServicesGrid>

                <CTAWrapper>
                    <CTAButton endIcon={<ArrowForward />}>
                        {LANDING_WELLNESS_SERVICES.CTA}
                    </CTAButton>
                </CTAWrapper>
            </ContentWrapper>
        </SectionContainer>
    );
};
