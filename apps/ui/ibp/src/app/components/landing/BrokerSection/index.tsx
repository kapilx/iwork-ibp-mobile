import React, { useState } from 'react';
import {
    Award,
    Building2,
    Users,
    HeartHandshake,
    Hospital,
    FileText,
    Headphones,
    ShieldCheck,
    Lock,
    Clock,
    ArrowRight,
} from 'lucide-react';
import { LANDING_BROKER_SECTION } from '../../../constants';
import { SignInDialog } from '../../../common/SignInDialog';
import supportTeamImage from '../../../assets/pngs/support-banner-image.png';
import { useCompanyConfig } from '../../../hooks/useCompanyConfig';
import { SupportHelpContactDialog } from '../../../common/SupportHelpContactDialog';
import {
    SectionContainer,
    ContentWrapper,
    HeaderSection,
    BadgePill,
    LogoBox,
    BadgeText,
    SectionTitle,
    SectionDescription,
    GridContainer,
    ImageColumn,
    ImageWrapper,
    StyledImage,
    ImageGradient,
    ImageCaption,
    CaptionTitle,
    CaptionSubtitle,
    ContentColumn,
    ColumnTitle,
    MetricsContainer,
    MetricItem,
    MetricIconBox,
    MetricContent,
    MetricValue,
    MetricLabel,
    CapabilitiesContainer,
    CapabilityCard,
    TrustContainer,
    TrustCard,
    FooterSection,
    FooterText,
    CTAButton,
} from './styles';

const metricIcons = [Award, Building2, Users];
const supportIcons = [HeartHandshake, Hospital, FileText, Headphones];
const trustIcons = [ShieldCheck, Lock, Clock];

interface BrokerSectionProps {
    onSupportOpen?: () => void;
}

export const BrokerSection: React.FC<BrokerSectionProps> = ({ onSupportOpen }) => {
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isSupportContactOpen, setIsSupportContactOpen] = useState(false);
    const { companyId } = useCompanyConfig();

    const handleOpenSupportLogin = () => {
        setIsLoginModalOpen(false);
        const resolvedCompanyId = Number(companyId);
        if (resolvedCompanyId === -1 || !Number.isFinite(resolvedCompanyId) || resolvedCompanyId <= 0) {
            setIsSupportContactOpen(true);
            return;
        }
        onSupportOpen?.();
    };

    const handleCloseLoginModal = () => {
        setIsLoginModalOpen(false);
    };

    const handleLoginSuccess = () => {
        setIsLoginModalOpen(false);
        onSupportOpen?.();
    };
    return (
        <SectionContainer
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
        >
            <ContentWrapper>
                {/* Section Header */}
                <HeaderSection
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <BadgePill>
                        <LogoBox>
                            <span>II</span>
                        </LogoBox>
                        <BadgeText>{LANDING_BROKER_SECTION.BADGE_TEXT}</BadgeText>
                    </BadgePill>
                    <SectionTitle>
                        {LANDING_BROKER_SECTION.TITLE}
                    </SectionTitle>
                    <SectionDescription>
                        {LANDING_BROKER_SECTION.DESCRIPTION}
                    </SectionDescription>
                </HeaderSection>

                {/* Content with Image */}
                <GridContainer>
                    {/* Image Column */}
                    <ImageColumn
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <ImageWrapper>
                            <StyledImage
                                src={supportTeamImage}
                                alt={LANDING_BROKER_SECTION.IMAGE_ALT}
                                loading="lazy"
                            />
                            <ImageGradient />
                            <ImageCaption>
                                <CaptionTitle>{LANDING_BROKER_SECTION.IMAGE_CAPTION.TITLE}</CaptionTitle>
                                <CaptionSubtitle>{LANDING_BROKER_SECTION.IMAGE_CAPTION.SUBTITLE}</CaptionSubtitle>
                            </ImageCaption>
                        </ImageWrapper>
                    </ImageColumn>

                    {/* Experience Metrics */}
                    <ContentColumn
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <ColumnTitle>{LANDING_BROKER_SECTION.METRICS_TITLE}</ColumnTitle>
                        <MetricsContainer>
                            {LANDING_BROKER_SECTION.METRICS.map((metric, index) => {
                                const Icon = metricIcons[index];
                                return (
                                    <MetricItem key={metric.label}>
                                        <MetricIconBox>
                                            <Icon size={24} />
                                        </MetricIconBox>
                                        <MetricContent>
                                            <MetricValue>{metric.value}</MetricValue>
                                            <MetricLabel>{metric.label}</MetricLabel>
                                        </MetricContent>
                                    </MetricItem>
                                );
                            })}
                        </MetricsContainer>
                    </ContentColumn>

                    {/* Support Capabilities */}
                    <ContentColumn
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                    >
                        <ColumnTitle>{LANDING_BROKER_SECTION.SUPPORT_TITLE}</ColumnTitle>
                        <CapabilitiesContainer>
                            {LANDING_BROKER_SECTION.SUPPORT_CAPABILITIES.map((item, index) => {
                                const Icon = supportIcons[index];
                                return (
                                    <CapabilityCard key={item.label}>
                                        <Icon size={20} />
                                        <span>{item.label}</span>
                                    </CapabilityCard>
                                );
                            })}
                        </CapabilitiesContainer>
                    </ContentColumn>

                    {/* Trust Elements */}
                    <ContentColumn
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                    >
                        <ColumnTitle>{LANDING_BROKER_SECTION.TRUST_TITLE}</ColumnTitle>
                        <TrustContainer>
                            {LANDING_BROKER_SECTION.TRUST_ELEMENTS.map((item, index) => {
                                const Icon = trustIcons[index];
                                return (
                                    <TrustCard key={item.label}>
                                        <Icon size={20} />
                                        <span>{item.label}</span>
                                    </TrustCard>
                                );
                            })}
                        </TrustContainer>
                    </ContentColumn>
                </GridContainer>

                {/* Trust Statement + CTA */}
                <FooterSection
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <FooterText>
                        {LANDING_BROKER_SECTION.FOOTER_TEXT}
                    </FooterText>
                    <CTAButton endIcon={<ArrowRight size={16} />} onClick={handleOpenSupportLogin}>
                        {LANDING_BROKER_SECTION.CTA_BUTTON}
                    </CTAButton>
                </FooterSection>
            </ContentWrapper>
            <SignInDialog 
                open={isLoginModalOpen} 
                onClose={handleCloseLoginModal}
                onSuccess={handleLoginSuccess}
            />
            <SupportHelpContactDialog
                open={isSupportContactOpen}
                onClose={() => setIsSupportContactOpen(false)}
            />
        </SectionContainer>
        )}
