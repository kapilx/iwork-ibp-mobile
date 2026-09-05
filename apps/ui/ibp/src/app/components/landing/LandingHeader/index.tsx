import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCompanyConfig } from '../../../hooks/useCompanyConfig';
import SupportPage from '../../../pages/SupportPage';
import { SupportHelpContactDialog } from '../../../common/SupportHelpContactDialog';
import {
  HeaderContainer,
  HeaderContent,
  LogosSection,
  LogoContainer,
  ActionsSection,
  SupportButton,
  LoginButton,
  HeaderRightSectionLogo,
  LogoButton,
} from './styles';
import { endPoints } from '@ui/ui-lib';

interface LandingHeaderProps {
  onSupportOpen?: () => void;
  onLogoClick?: () => void;
  hideSupportButton?: boolean;
}

export const LandingHeader: React.FC<LandingHeaderProps> = ({ onSupportOpen, onLogoClick, hideSupportButton }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isSupportContactOpen, setIsSupportContactOpen] = useState(false);
  const [isSupportPageOpen, setIsSupportPageOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const { companyId, logoUrl, logoFileId, portalBrandingConfig } = useCompanyConfig();
  const resolvedLogoFileId = logoFileId ?? portalBrandingConfig?.companyLogoFileId ?? null;
  const resolvedLogoSrc = logoUrl || (resolvedLogoFileId ? endPoints.ibpPublicFileUploadDownloadById(resolvedLogoFileId) : null);

  // Auto-navigate to login when step=reset is in URL
  useEffect(() => {
    const stepFromUrl = searchParams.get('step');
    if (stepFromUrl === 'reset') {
      navigate('/login');
    }
  }, [searchParams, navigate]);

  const clearResetQueryParams = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("step");
    nextParams.delete("token");
    nextParams.delete("method");
    setSearchParams(nextParams, { replace: true });
  };

  const handleOpenLoginModal = () => {
    if (searchParams.get("step") === "reset") {
      clearResetQueryParams();
    }
    navigate('/login');
  };

  const handleOpenSupportLogin = () => {
    const resolvedCompanyId = Number(companyId);
    if (resolvedCompanyId === -1 || !Number.isFinite(resolvedCompanyId) || resolvedCompanyId <= 0) {
      setIsSupportContactOpen(true);
      return;
    }
    if (onSupportOpen) {
      onSupportOpen();
    } else {
      setIsSupportPageOpen(true);
    }
  };

  const handleLogoClick = () => {
    if (onLogoClick) {
      onLogoClick();
    } else {
      navigate('/landing');
    }
  };

  return (
    <HeaderContainer>
      <HeaderContent>
        <LogosSection>
          {resolvedLogoSrc && !logoError && (
            <LogoContainer>
              <LogoButton type="button" onClick={handleLogoClick}>
                <HeaderRightSectionLogo src={resolvedLogoSrc} alt="" onError={() => setLogoError(true)} />
              </LogoButton>
            </LogoContainer>
          )}
          {/* <Divider /> */}
        </LogosSection>

        <ActionsSection>
          {!hideSupportButton && (
            <SupportButton onClick={handleOpenSupportLogin}>
              Support
            </SupportButton>
          )}
          <LoginButton onClick={handleOpenLoginModal}>Get Started</LoginButton>
        </ActionsSection>
      </HeaderContent>

      {isSupportPageOpen && <SupportPage />}

      <SupportHelpContactDialog
        open={isSupportContactOpen}
        onClose={() => setIsSupportContactOpen(false)}
      />
    </HeaderContainer>
  );
};
