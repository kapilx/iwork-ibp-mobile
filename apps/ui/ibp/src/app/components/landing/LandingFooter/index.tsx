import React from 'react';
import { Link } from 'react-router-dom';
import { LANDING_FOOTER } from '../../../constants';
import headerLogo from "../../../../assets/svgs/header-logo.svg";

import {
    FooterContainer,
    GradientStrip,
    MainFooter,
    ContentWrapper,
    TopRow,
    LogoBrand,
    Logo,
    LogoBox,
    LogoText,
    BrandInfo,
    BrandName,
    BrandSubtitle,
    QuickLinks,
    QuickLink,
    LinkIcon,
    ExternalIcon,
    BottomRow,
    RegulatoryInfo,
    RegulatoryItem,
    StatusDot,
    Separator,
    CopyrightText,
} from './styles';
import {
    Description as FileTextIcon,
    Shield as ShieldIcon,
    Error as AlertCircleIcon,
    OpenInNew as ExternalLinkIcon,
} from '@mui/icons-material';
import { HeaderRightSectionLogo } from '../LandingHeader/styles';

const linkIcons = [FileTextIcon, ShieldIcon, AlertCircleIcon];

export const LandingFooter: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <FooterContainer id="footer">
            {/* Gradient Accent Strip */}
            <GradientStrip />

            {/* Main Footer Content */}
            <MainFooter>
                <ContentWrapper>
                    {/* Top Row: Logo & Links */}
                    <TopRow>
                        {/* Logo & Copyright */}
                        <LogoBrand>
                            <Logo>
                            <HeaderRightSectionLogo src={headerLogo} alt="footer logo" />        
                                <BrandInfo>
                                    <BrandName>{LANDING_FOOTER.BRAND_NAME}</BrandName>
                                    <BrandSubtitle>{LANDING_FOOTER.BRAND_SUBTITLE}</BrandSubtitle>
                                </BrandInfo>
                            </Logo>
                        </LogoBrand>

                        {/* Quick Links */}
                        <QuickLinks>
                            {LANDING_FOOTER.QUICK_LINKS.map((link, index) => {
                                const Icon = linkIcons[index];
                                return (
                                    <QuickLink key={link.label} component={Link} to="#">
                                        <LinkIcon as={Icon} />
                                        <span>{link.label}</span>
                                        <ExternalIcon as={ExternalLinkIcon} />
                                    </QuickLink>
                                );
                            })}
                        </QuickLinks>
                    </TopRow>

                    {/* Bottom Row: Regulatory Info */}
                    <BottomRow>
                        <RegulatoryInfo>
                            {LANDING_FOOTER.REGULATORY_INFO.map((item, index) => (
                                <React.Fragment key={index}>
                                    <RegulatoryItem>
                                        {item.hasDot && <StatusDot />}
                                        {item.text}
                                    </RegulatoryItem>
                                    {index < LANDING_FOOTER.REGULATORY_INFO.length - 1 && (
                                        <Separator className="hidden-mobile" />
                                    )}
                                </React.Fragment>
                            ))}
                        </RegulatoryInfo>
                        <CopyrightText>
                            Copyright © {currentYear} {LANDING_FOOTER.COPYRIGHT}
                        </CopyrightText>
                    </BottomRow>
                </ContentWrapper>
            </MainFooter>
        </FooterContainer>
    );
};
