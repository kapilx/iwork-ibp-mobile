import React from 'react';
import {
    LogIn,
    Search,
    UserPlus,
    PlusSquare,
    Send,
    CheckCircle2,
} from 'lucide-react';
import { LANDING_ENROLLMENT_STEPS } from '../../../constants';
import {
    SectionContainer,
    ContentWrapper,
    HeaderSection,
    Title,
    Subtitle,
    TimelineContainer,
    TimelineBar,
    StepsRow,
    StepItem,
    StepCircle,
    StepNumber,
    StepContent,
    StepTitle,
    StepDescription,
    MobileStepsContainer,
    MobileStepCard,
    MobileIconContainer,
    MobileStepCircle,
    MobileStepNumber,
    MobileStepConnector,
    MobileStepContent,
    MobileStepTitle,
    MobileStepDescription,
} from './styles';

const stepIcons = [LogIn, Search, UserPlus, PlusSquare, Send, CheckCircle2];

export const EnrollmentStepsSection: React.FC = () => {
    return (
        <SectionContainer>
            <ContentWrapper>
                <HeaderSection
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <Title>{LANDING_ENROLLMENT_STEPS.TITLE}</Title>
                    <Subtitle>
                        {LANDING_ENROLLMENT_STEPS.SUBTITLE}
                    </Subtitle>
                </HeaderSection>

                {/* Desktop horizontal timeline (≥ 1280px) */}
                <TimelineContainer
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                >
                    <TimelineBar />
                    <StepsRow>
                        {LANDING_ENROLLMENT_STEPS.STEPS.map((step, index) => {
                            const Icon = stepIcons[index];
                            return (
                                <StepItem key={step.number}>
                                    <StepCircle>
                                        <Icon size={24} style={{ color: '#1F79D4' }} />
                                        <StepNumber>{step.number}</StepNumber>
                                    </StepCircle>
                                    <StepContent>
                                        <StepTitle>{step.title}</StepTitle>
                                        <StepDescription>{step.description}</StepDescription>
                                    </StepContent>
                                </StepItem>
                            );
                        })}
                    </StepsRow>
                </TimelineContainer>

                {/* Vertical MUI-style stepper (< 1280px) */}
                <MobileStepsContainer>
                    {LANDING_ENROLLMENT_STEPS.STEPS.map((step, index) => {
                        const Icon = stepIcons[index];
                        const isLast = index === LANDING_ENROLLMENT_STEPS.STEPS.length - 1;
                        return (
                            <MobileStepCard key={step.number}>
                                {/* Left: circle + connector */}
                                <MobileIconContainer>
                                    <MobileStepCircle>
                                        <Icon size={22} />
                                        <MobileStepNumber>{step.number}</MobileStepNumber>
                                    </MobileStepCircle>
                                    {!isLast && <MobileStepConnector />}
                                </MobileIconContainer>

                                {/* Right: label + description */}
                                <MobileStepContent>
                                    <MobileStepTitle>{step.title}</MobileStepTitle>
                                    <MobileStepDescription>{step.description}</MobileStepDescription>
                                </MobileStepContent>
                            </MobileStepCard>
                        );
                    })}
                </MobileStepsContainer>
            </ContentWrapper>
        </SectionContainer>
    );
};
