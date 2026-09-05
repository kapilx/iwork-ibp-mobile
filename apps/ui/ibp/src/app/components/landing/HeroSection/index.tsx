import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { ArrowForward } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  Lock,
  Shield,
} from 'lucide-react';
import { LANDING_HERO } from '../../../constants';
import {
  HeroContainer,
  BackgroundPattern,
  BackgroundBlob1,
  BackgroundBlob2,
  ContentContainer,
  GridContainer,
  ContentSection,
  Heading,
  HighlightText,
  SubText,
  ButtonGroup,
  PrimaryButton,
  SecondaryButton,
  TrustBadgeContainer,
  TrustBadge,
  TrustBadgeText,
  ImageSection,
  ImageContainer,
  HeroImage,
  ImageOverlay,
  FloatingBadge,
  FloatingBadgeContent,
  FloatingIconContainer,
  StatsBadge,
  StatsNumber,
  StatsLabel,
} from './styles';
import HeroBannerImage from '../../../assets/jpg/hero-family.jpg';

import { useCompanyConfig } from '../../../hooks/useCompanyConfig';
import { SupportHelpContactDialog } from '../../../common/SupportHelpContactDialog';

const trustBadgeIcons = [Zap, Lock, Shield];


interface HeroSectionProps {
  onSupportOpen?: () => void;
}

export const  HeroSection: React.FC<HeroSectionProps> = ({ onSupportOpen }) => {
  const navigate = useNavigate();
  const [isSupportContactOpen, setIsSupportContactOpen] = useState(false);
  const { companyId } = useCompanyConfig();

  const handleOpenLoginModal = () => {
    navigate('/login');
  };

  const handleOpenSupportLogin = () => {
    const resolvedCompanyId = Number(companyId);
    if (resolvedCompanyId === -1 || !Number.isFinite(resolvedCompanyId) || resolvedCompanyId <= 0) {
      setIsSupportContactOpen(true);
      return;
    }
    onSupportOpen?.();
  };
  
  return (
    <HeroContainer>
      <BackgroundPattern>
        <BackgroundBlob1 />
        <BackgroundBlob2 />
      </BackgroundPattern>

      <ContentContainer>
        <GridContainer>
          <ContentSection
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Heading
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {LANDING_HERO.TITLE}{' '}
              <HighlightText>{LANDING_HERO.TITLE_HIGHLIGHT}</HighlightText>
            </Heading>

            <SubText
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {LANDING_HERO.SUBTITLE}
            </SubText>

            <ButtonGroup
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <PrimaryButton onClick={handleOpenLoginModal} endIcon={<ArrowForward />}>
                {LANDING_HERO.PRIMARY_BUTTON}
              </PrimaryButton>
              <SecondaryButton variant="outlined" onClick={handleOpenSupportLogin}>
                {LANDING_HERO.SECONDARY_BUTTON}
              </SecondaryButton>
            </ButtonGroup>

            <TrustBadgeContainer
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {LANDING_HERO.TRUST_BADGES.map((badge, index) => {
                const Icon = trustBadgeIcons[index];
                return (
                  <TrustBadge key={badge.label}>
                    <Icon size={16} />
                    <TrustBadgeText>{badge.label}</TrustBadgeText>
                  </TrustBadge>
                );
              })}
            </TrustBadgeContainer>
          </ContentSection>

          <ImageSection
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <ImageContainer>
              <HeroImage
                src={HeroBannerImage}
                alt={LANDING_HERO.IMAGE_ALT}
                loading="eager"
              />
              <ImageOverlay />
            </ImageContainer>

            <FloatingBadge
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            >
              <FloatingBadgeContent>
                <FloatingIconContainer>
                  <Shield size={16} />
                </FloatingIconContainer>
                <Box>
                  <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                    {LANDING_HERO.FLOATING_BADGE.TITLE}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: '#626284' }}>
                    {LANDING_HERO.FLOATING_BADGE.SUBTITLE}
                  </Typography>
                </Box>
              </FloatingBadgeContent>
            </FloatingBadge>

            <StatsBadge
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut', delay: 0.5 }}
            >
              <StatsNumber>{LANDING_HERO.STATS_BADGE.NUMBER}</StatsNumber>
              <StatsLabel>{LANDING_HERO.STATS_BADGE.LABEL}</StatsLabel>
            </StatsBadge>
          </ImageSection>
        </GridContainer>
      </ContentContainer>
      <SupportHelpContactDialog
        open={isSupportContactOpen}
        onClose={() => setIsSupportContactOpen(false)}
      />
    </HeroContainer>
  );
};
