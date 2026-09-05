import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { LandingHeader } from './LandingHeader';
import { HeroSection } from './HeroSection';
import { BenefitsOverviewSection } from './BenefitsOverviewSection';
import { PortalFeaturesSection } from './PortalFeaturesSection';
import { EnrollmentStepsSection } from './EnrollmentStepsSection';
import { ActionBannersSection } from './ActionBannersSection';
import { WellnessServicesSection } from './WellnessServicesSection';
import { PersonalInsuranceSection } from './PersonalInsuranceSection';
import { BrokerSection } from './BrokerSection';
import Footer from '../Footer';
import SupportPage from '../../pages/SupportPage';
import { usePrefetchCompanyTemplate } from '../../hooks/usePrefetchCompanyTemplate';

export const Landing: React.FC = () => {
  const [showSupportPage, setShowSupportPage] = useState(false);
  const prefetchCompanyTemplate = usePrefetchCompanyTemplate();

  useEffect(() => {
    prefetchCompanyTemplate();
  }, [prefetchCompanyTemplate]);

  return (
    <Box sx={{ minHeight: '100vh'}}>
      <LandingHeader
        onSupportOpen={() => setShowSupportPage(true)}
        onLogoClick={showSupportPage ? () => setShowSupportPage(false) : undefined}
        hideSupportButton={showSupportPage}
      />
      {showSupportPage ? (
        <SupportPage />
      ) : (
        <>
          <HeroSection onSupportOpen={() => setShowSupportPage(true)} />
          <PortalFeaturesSection />
          <BenefitsOverviewSection />
          <WellnessServicesSection />
          <PersonalInsuranceSection />
          <BrokerSection onSupportOpen={() => setShowSupportPage(true)} />
          <EnrollmentStepsSection />
          <ActionBannersSection onSupportOpen={() => setShowSupportPage(true)} />
        </>
      )}
       <Footer />
    </Box>
  );
};

export default Landing;
