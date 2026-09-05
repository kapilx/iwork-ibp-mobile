import React, { useMemo, useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import {
  VpnKey as KeyIcon,
  Email as EmailIcon,
  PhoneAndroid as MobileIcon,
  Badge as IdIcon,
  CardGiftcard as OffersIcon,
} from "@mui/icons-material";
import { endPoints, apiRequest } from "@ui/ui-lib";
import {
  ViewContainer,
  ConfigCard,
  CardHeader,
  IconBox,
  CardContent,
  CardTitle,
  CardSubtitle,
  InfoLabel,
  MethodCard,
  MethodIconBox,
  InfoBox,
  AuthMethodGrid,
  SecurityConfigGrid,
} from "./styles";
import { AuthenticationConfigState } from "../LoginAuthSection";

interface CompanyConfigurationViewProps {
  authConfig: AuthenticationConfigState;
  portalStatus?: "Draft" | "Pending" | "Rejected" | "Active";
  brandingHeading?: string;
  brandingBodyText?: string;
  brandingLogo?: { id?: number | null } | null;
  domainScopeSlot?: React.ReactNode;
  offersAndBenefits?: { isEnabled: boolean }[];
}

export const CompanyConfigurationView: React.FC<
  CompanyConfigurationViewProps
> = ({
  authConfig,
  portalStatus: _portalStatus,
  brandingHeading,
  brandingBodyText,
  brandingLogo,
  domainScopeSlot,
  offersAndBenefits,
}) => {
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const offersBenefitsSummary = offersAndBenefits
    ? {
        total: offersAndBenefits.length,
        enabled: offersAndBenefits.filter((item) => item?.isEnabled).length,
      }
    : null;

  useEffect(() => {
    const loadLogoPreview = async () => {
      if (brandingLogo?.id) {
        try {
          const response = await apiRequest(
            `${endPoints.fileUploadDownload}/${brandingLogo.id}/download`,
            {
              method: "GET",
              responseType: "blob",
            }
          );
          const blob = response.data as Blob;

          // Check if it's an image
          if (blob.type.startsWith("image/")) {
            const url = URL.createObjectURL(blob);
            setLogoPreviewUrl(url);
          }
        } catch (error) {
          console.error("Failed to load logo preview:", error);
        }
      } else {
        // Clear preview if no logo
        if (logoPreviewUrl) {
          URL.revokeObjectURL(logoPreviewUrl);
          setLogoPreviewUrl(null);
        }
      }
    };

    loadLogoPreview();

    // Cleanup function to revoke object URL
    return () => {
      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
    };
  }, [brandingLogo]);

  const getMethodDetails = (method: string) => {
    switch (method) {
      case "email-password":
        return {
          icon: <EmailIcon sx={{ fontSize: 20, color: "#6366F1" }} />,
          label: "Email + Password",
          subtitle: "Email & password login",
        };
      case "email-otp":
        return {
          icon: <EmailIcon sx={{ fontSize: 20, color: "#6366F1" }} />,
          label: "Email + OTP",
          subtitle: "Email with OTP verification",
        };
      case "mobile-otp":
        return {
          icon: <MobileIcon sx={{ fontSize: 20, color: "#6366F1" }} />,
          label: "Mobile + OTP",
          subtitle: "SMS verification",
        };
      case "employee-id":
        return {
          icon: <IdIcon sx={{ fontSize: 20, color: "#6366F1" }} />,
          label: "Employee ID + Year of Birth",
          subtitle: "ID and year of birth",
        };
      case "oauth":
        return {
          icon: <KeyIcon sx={{ fontSize: 20, color: "#6366F1" }} />,
          label: "Single Sign-On",
          subtitle: "External identity provider",
        };
      case "phone-password":
        return {
          icon: <MobileIcon sx={{ fontSize: 20, color: "#6366F1" }} />,
          label: "Phone Number + Password",
          subtitle: "Phone & password login",
        };
      default:
        return {
          icon: <EmailIcon sx={{ fontSize: 20, color: "#6366F1" }} />,
          label: "Email + Password",
          subtitle: "Email & password login",
        };
    }
  };

  const methodDetails = useMemo(() => {
    return getMethodDetails(authConfig.method);
  }, [authConfig.method]);
  
  // Get details for all selected methods
  const allMethodDetails = useMemo(() => {
    const methods = authConfig.methods || [authConfig.method];
    return methods.map(method => getMethodDetails(method));
  }, [authConfig.method, authConfig.methods]);

  const passwordRequirements = authConfig.passwordRequirements ?? {
    uppercase: true,
    lowercase: true,
    numbers: true,
    special: true,
  };

  const renderSecurityConfiguration = () => {
    if (
      authConfig.method === "email-password" ||
      authConfig.method === "phone-password"
    ) {
      return (
        <SecurityConfigGrid>
          <InfoBox>
            <Typography variant="caption" display="block" mb={0.5}>
              Password Requirements
            </Typography>
            <Typography variant="body2" fontWeight={500} mb={1}>
              {authConfig.minPasswordLength || "8"} characters minimum
            </Typography>
            <Typography variant="caption" display="block">
              • Uppercase (A-Z):{" "}
              {passwordRequirements.uppercase ? "Required" : "Optional"}
            </Typography>
            <Typography variant="caption" display="block">
              • Lowercase (a-z):{" "}
              {passwordRequirements.lowercase ? "Required" : "Optional"}
            </Typography>
            <Typography variant="caption" display="block">
              • Number (0-9):{" "}
              {passwordRequirements.numbers ? "Required" : "Optional"}
            </Typography>
            <Typography variant="caption" display="block">
              • Special (!@#$%):{" "}
              {passwordRequirements.special ? "Required" : "Optional"}
            </Typography>
          </InfoBox>
          <InfoBox>
            <Typography variant="caption" display="block" mb={0.5}>
              Password Policy
            </Typography>
            <Typography variant="body2" mb={0.5}>
              <Typography component="span">Expiry:</Typography>{" "}
              <Typography component="span" fontWeight={500}>
                {authConfig.passwordExpiry === "never"
                  ? "Never"
                  : `${authConfig.passwordExpiry || "90"} days`}
              </Typography>
            </Typography>
            <Typography variant="body2">
              {/* <Typography component="span">Change on first login:</Typography>{" "} */}
              {/* <Typography component="span" fontWeight={500}>
                {authConfig.changePasswordOnFirstLogin ? "Yes" : "No"}
              </Typography> */}
            </Typography>
          </InfoBox>
          <InfoBox>
            <Typography variant="caption" display="block" mb={0.5}>
              Account Security
            </Typography>
            <Typography variant="body2" fontWeight={500} mb={0.5}>
              Max {authConfig.allowedLoginAttempts || "5"} failed attempts
            </Typography>
            {/* {authConfig.lockoutDuration && (
              <Typography variant="body2" fontWeight={500}>
                Lockout {authConfig.lockoutDuration} hrs
              </Typography>
            )} */}
          </InfoBox>
          <InfoBox>
            <Typography variant="caption" display="block" mb={0.5}>
              Session & MFA
            </Typography>
            <Typography variant="body2" fontWeight={500} mb={0.5}>
              Session timeout: {authConfig.sessionTimeout || "30"} minutes
            </Typography>
            {authConfig.method === "phone-password" && (
              <Typography variant="body2" fontWeight={500}>
                2FA: {authConfig.enable2FA ? "Enabled" : "Disabled"}
              </Typography>
            )}
          </InfoBox>
        </SecurityConfigGrid>
      );
    }

    if (
      authConfig.method === "email-otp" ||
      authConfig.method === "mobile-otp"
    ) {
      const deliveryLabel =
        authConfig.method === "mobile-otp" ? "SMS" : "Email";
      return (
        <SecurityConfigGrid>
          <InfoBox>
            <Typography variant="caption" display="block" mb={0.5}>
              OTP Settings
            </Typography>
            {/* <Typography variant="body2" fontWeight={500}>
              Length: {authConfig.otpLength || "6"} digits
            </Typography> */}
            <Typography variant="body2" fontWeight={500}>
              Validity: {authConfig.otpValidity || "5"} mins
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              Resend cooldown: {authConfig.resendOtpCooldown || "60"} secs
            </Typography>
            {/* <Typography variant="body2" fontWeight={500}>
              Max attempts: {authConfig.maxOtpAttempts || "3"}
            </Typography> */}
          </InfoBox>
          <InfoBox>
            <Typography variant="caption" display="block" mb={0.5}>
              Delivery
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {deliveryLabel}
            </Typography>
          </InfoBox>
          <InfoBox>
            <Typography variant="caption" display="block" mb={0.5}>
              Session
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              Session timeout: {authConfig.sessionTimeout || "30"} minutes
            </Typography>
          </InfoBox>
        </SecurityConfigGrid>
      );
    }

    if (authConfig.method === "employee-id") {
      return (
        <SecurityConfigGrid>
          <InfoBox>
            <Typography variant="caption" display="block" mb={0.5}>
              Employee ID Validation
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              Validation:{" "}
              {authConfig.enableIdValidation ? "Enabled" : "Disabled"}
            </Typography>
            {authConfig.enableIdValidation && (
              <Typography variant="body2" fontWeight={500}>
                Format: {authConfig.employeeIdFormat || "EMP-XXXXX"}
              </Typography>
            )}
          </InfoBox>
          {/* <InfoBox>
            <Typography variant="caption" display="block" mb={0.5}>
              Security
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              Max failed attempts: {authConfig.maxFailedAttempts || "5"}
            </Typography>
          </InfoBox> */}
          <InfoBox>
            <Typography variant="caption" display="block" mb={0.5}>
              Session
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              Session timeout: {authConfig.sessionTimeout || "30"} minutes
            </Typography>
          </InfoBox>
        </SecurityConfigGrid>
      );
    }

    if (authConfig.method === "oauth") {
      return (
        <SecurityConfigGrid>
          <InfoBox>
            <Typography variant="caption" display="block" mb={0.5}>
              Session
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              Session timeout: {authConfig.sessionTimeout || "30"} minutes
            </Typography>
          </InfoBox>
        </SecurityConfigGrid>
      );
    }

    return null;
  };

  return (
    <ViewContainer>
      {/* Portal & Scope — injected from DomainScopeTab (URL + company + policies) */}
      {domainScopeSlot}

      {/* Login & Authentication */}
      <ConfigCard id="login-auth">
        <CardHeader>
          <IconBox>
            <KeyIcon sx={{ fontSize: 24, color: "#3B82F6" }} />
          </IconBox>
          <CardContent>
            <CardTitle>Login & Authentication</CardTitle>
            <CardSubtitle>Employee authentication configuration</CardSubtitle>

            <AuthMethodGrid>
              {/* Selected Methods */}
              <Box>
                <InfoLabel>
                  Authentication Method{allMethodDetails.length > 1 ? 's' : ''}
                  {allMethodDetails.length > 1 && (
                    <Typography component="span" variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                      ({allMethodDetails.length} selected)
                    </Typography>
                  )}
                </InfoLabel>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {allMethodDetails.map((details, index) => (
                    <MethodCard key={index} selected={true}>
                      <MethodIconBox>{details.icon}</MethodIconBox>
                      <Box flex={1}>
                        <Typography variant="body2" fontWeight={600}>
                          {details.label}
                        </Typography>
                        <Typography variant="caption">
                          {details.subtitle}
                        </Typography>
                      </Box>
                    </MethodCard>
                  ))}
                </Box>
              </Box>

              {/* Security Configuration */}
              <Box>
                <InfoLabel>Security Configuration</InfoLabel>
                {renderSecurityConfiguration()}
              </Box>
            </AuthMethodGrid>
          </CardContent>
        </CardHeader>
      </ConfigCard>

      {/* Offers & Benefits */}
      <ConfigCard id="offers-benefits">
        <CardHeader>
          <IconBox>
            <OffersIcon sx={{ fontSize: 24, color: "#F59E0B" }} />
          </IconBox>
          <CardContent>
            <CardTitle>Offers & Benefits</CardTitle>
            <CardSubtitle>
              {offersBenefitsSummary
                ? offersBenefitsSummary.total > 0
                  ? `${offersBenefitsSummary.enabled} of ${offersBenefitsSummary.total} item(s) active`
                  : "No offers or benefits configured yet"
                : "Loading…"}
            </CardSubtitle>
          </CardContent>
        </CardHeader>
      </ConfigCard>

    </ViewContainer>
  );
};
