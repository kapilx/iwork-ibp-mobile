import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowRight,
    Headphones,
    BookOpen,
} from 'lucide-react';
import { LANDING_ACTION_BANNERS } from '../../../constants';
import { SignInDialog } from '../../../common/SignInDialog';
import { useCompanyConfig } from '../../../hooks/useCompanyConfig';
import { SupportHelpContactDialog } from '../../../common/SupportHelpContactDialog';
import {
    SectionContainer,
    ContentWrapper,
    BannersGrid,
    BannerCard,
    BannerPattern,
    BannerContent,
    BannerTextSection,
    BannerTitle,
    BannerSubtitle,
    BannerButton,
} from './styles';

const bannerIcons = [ArrowRight, Headphones, BookOpen];
const bannerGradients = [
    'linear-gradient(to right, #1F79D4, #1F79D4, #0F2557)',
    'linear-gradient(to right, #26A69A, #26A69A, #0E7490)',
    'linear-gradient(to right, #0F2557, #4338CA, #0F2557)',
];

interface ActionBannersSectionProps {
    onSupportOpen?: () => void;
}

export const ActionBannersSection: React.FC<ActionBannersSectionProps> = ({ onSupportOpen }) => {
    const navigate = useNavigate();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [redirectPath, setRedirectPath] = useState('/dashboard');
    const [isSupportContactOpen, setIsSupportContactOpen] = useState(false);
    const { companyId } = useCompanyConfig();

    const handleAction = (action: string) => {
        if (action === 'support') {
            const resolvedCompanyId = Number(companyId);
            if (resolvedCompanyId === -1 || !Number.isFinite(resolvedCompanyId) || resolvedCompanyId <= 0) {
                setIsSupportContactOpen(true);
                return;
            }
            onSupportOpen?.();
        } else if (action === 'learn') {
            setRedirectPath('/dashboard');
            setIsLoginModalOpen(true);
        } else if (action === '/dashboard') {
            setRedirectPath('/dashboard');
            setIsLoginModalOpen(true);
        } else if (action.startsWith('/')) {
            navigate(action);
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleCloseLoginModal = () => {
        setIsLoginModalOpen(false);
    };

    const handleLoginSuccess = () => {
        setIsLoginModalOpen(false);
        const user = JSON.parse(sessionStorage.getItem("user") || "{}");
        if ((!user.isEmployee && user.isHR) || user.roleKey === "PORTAL_CRM") {
            navigate("/hr-portal");
        } else {
            navigate(redirectPath);
        }
    };

    return (
        <SectionContainer>
            <ContentWrapper>
                <BannersGrid>
                    {LANDING_ACTION_BANNERS.BANNERS.map((banner, index) => {
                        const Icon = bannerIcons[index];
                        const gradient = bannerGradients[index];
                        return (
                            <BannerCard
                                key={banner.id}
                                gradient={gradient}
                                onClick={() => handleAction(banner.action)}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                            >
                                <BannerPattern />
                                <BannerContent>
                                    <BannerTextSection>
                                        <BannerTitle>{banner.title}</BannerTitle>
                                        <BannerSubtitle>{banner.subtitle}</BannerSubtitle>
                                    </BannerTextSection>
                                <BannerButton
                                    endIcon={<Icon size={16} />}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleAction(banner.action);
                                    }}
                                >
                                        {banner.cta}
                                    </BannerButton>
                                </BannerContent>
                            </BannerCard>
                        );
                    })}
                </BannersGrid>
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
    );
};
