import React from 'react';
import {
  Heart,
  Shield,
  Umbrella,
  PlusCircle,
  Activity,
} from 'lucide-react';
import { LANDING_BENEFITS_OVERVIEW } from '../../../constants';
import {
  SectionContainer,
  ContentWrapper,
  HeaderSection,
  Title,
  Subtitle,
  BenefitsGrid,
  BenefitCard,
  IconContainer,
  BenefitHeader,
  BenefitName,
  BenefitCode,
  BenefitDescription,
  BackgroundImageAccent,
  BackgroundImageWrapper,
  BackgroundImage,
  BackgroundGradientOverlay,
} from './styles';
import healthcareProfessionalImage from '../../../assets/jpg/healthcare-professional.jpg';

const benefitIcons = [Heart, Shield, Umbrella, PlusCircle, Activity];
const benefitGradients = [
  'linear-gradient(135deg, #E91E63 0%, #EC407A 100%)',
  'linear-gradient(135deg, #1F79D4 0%, #2196F3 100%)',
  'linear-gradient(135deg, #1F79D4 0%, #3F51B5 100%)',
  'linear-gradient(135deg, #26A69A 0%, #00BCD4 100%)',
  'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
];

export const BenefitsOverviewSection: React.FC = () => {
  return (
    <SectionContainer>
      {/* Background Image Accent */}
      <BackgroundImageAccent>
        <BackgroundImageWrapper>
          <BackgroundImage
            src={healthcareProfessionalImage}
            alt={LANDING_BENEFITS_OVERVIEW.IMAGE_ALT}
            loading="lazy"
          />
          <BackgroundGradientOverlay />
        </BackgroundImageWrapper>
      </BackgroundImageAccent>

      <ContentWrapper>
        <HeaderSection
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Title>{LANDING_BENEFITS_OVERVIEW.TITLE}</Title>
          <Subtitle>
            {LANDING_BENEFITS_OVERVIEW.SUBTITLE}
          </Subtitle>
        </HeaderSection>

        <BenefitsGrid>
          {LANDING_BENEFITS_OVERVIEW.BENEFITS.map((benefit, index) => {
            const Icon = benefitIcons[index];
            const gradient = benefitGradients[index];
            return (
              <BenefitCard
                key={benefit.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
              >
                <IconContainer gradient={gradient}>
                  <Icon size={24} />
                </IconContainer>
                <BenefitHeader>
                  <BenefitName>{benefit.name}</BenefitName>
                  <BenefitCode>{benefit.code}</BenefitCode>
                </BenefitHeader>
                <BenefitDescription>{benefit.description}</BenefitDescription>
              </BenefitCard>
            );
          })}
        </BenefitsGrid>

      </ContentWrapper>
    </SectionContainer>
  );
};
