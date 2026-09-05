import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { environment, endPoints } from '@ui/ui-lib';
import { getSubdomainFromUrl } from '../utils/companyConfig';

export interface PasswordRule {
    id?: number;
    name: string;
    isRequired?: boolean;
    minChars?: number;
    maxChars?: number;
    regex?: string;
    disallowedChars?: string;
    errorMessage?: string;
    [key: string]: any;
}

export interface OfferBenefitConfigItem {
    id: number;
    title: string;
    description: string;
    redirectionUrl: string;
    imageFileId: number | null;
    isEnabled: boolean;
    displayOrder: number;
}

export interface CompanyConfig {
    companyId: number | null;
    passwordRules: PasswordRule[] | null;
    logoUrl: string | null;
    country: string | null;
    portalDashboardConfig: Record<string, any> | null;
    portalWellnessConfig: Record<string, any> | null;
    companyPolicyConfig: Record<string, any> | null;
    logoFileId: number | null;
    portalBrandingConfig?: {
        companyLogoFileId?: number | null;
        loginWelcomeMessage?: {
            heading?: string | null;
            bodyText?: string | null;
        } | null;
    } | null;
    /** Domain-specific (subdomain-resolved) Offers & Benefits items, with company-level fallback. */
    offersAndBenefits: OfferBenefitConfigItem[];
    /** Domain-specific (subdomain-resolved) master on/off switch, with company-level fallback. */
    offersAndBenefitsEnabled: boolean;
}

export const useCompanyConfig = () => {
    const [config, setConfig] = useState<CompanyConfig>({
        companyId: null,
        passwordRules: null,
        logoUrl: null,
        country: null,
        portalDashboardConfig: null,
        portalWellnessConfig: null,
        companyPolicyConfig: null,
        logoFileId: null,
        portalBrandingConfig: null,
        offersAndBenefits: [],
        offersAndBenefitsEnabled: true,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const hasFetchedRef = useRef(false);

    useEffect(() => {
        const fetchCompanyConfig = async () => {
            if (hasFetchedRef.current) {
                return;
            }
            hasFetchedRef.current = true;
            try {
                setLoading(true);
                setError(null);

                const subdomain = getSubdomainFromUrl();
                if (!subdomain) {
                    throw new Error('No tenant subdomain resolved from the current URL');
                }
                const response = await axios.get(
                    endPoints.companyAuthConfigBySubdomain(subdomain)
                );
                const payload = response?.data?.data ?? {};
                const companyConfigData =
                    payload?.companyConfig ??
                    response?.data?.companyConfig ??
                    {};
                const targetCompanyId =
                    companyConfigData?.companyId ??
                    payload?.companyId ??
                    response?.data?.companyId ??
                    null;

                const logoFromConfig = companyConfigData.logoUrl ?? null;
                const countryFromConfig = companyConfigData.country ?? null;
                const portalDashboardConfigFromConfig =
                    companyConfigData.portalDashboardConfig ?? null;
                const portalWellnessConfigFromConfig =
                    companyConfigData.portalWellnessConfig ?? null;
                const companyPolicyConfigFromConfig =
                    companyConfigData.companyPolicyConfig ?? null;
                const logoFileIdFromConfig = companyConfigData.logoFileId ?? null;
                const portalBrandingConfigFromConfig = companyConfigData.portalBrandingConfig ?? null;
                const offersAndBenefitsFromConfig = Array.isArray(companyConfigData.offersAndBenefits)
                    ? companyConfigData.offersAndBenefits
                    : [];
                const offersAndBenefitsEnabledFromConfig =
                    companyConfigData.offersAndBenefitsEnabled ?? true;

                const passwordRulesEnabled = environment.featureFlag.FF_PASSWORD_RULES;
                const passwordRulesFromConfig = passwordRulesEnabled
                    ? companyConfigData.passwordRules ?? null
                    : null;

                setConfig({
                    companyId: targetCompanyId,
                    passwordRules: passwordRulesFromConfig,
                    logoUrl: logoFromConfig,
                    country: countryFromConfig,
                    portalDashboardConfig: portalDashboardConfigFromConfig,
                    portalWellnessConfig: portalWellnessConfigFromConfig,
                    companyPolicyConfig: companyPolicyConfigFromConfig,
                    logoFileId: logoFileIdFromConfig,
                    portalBrandingConfig: portalBrandingConfigFromConfig,
                    offersAndBenefits: offersAndBenefitsFromConfig,
                    offersAndBenefitsEnabled: offersAndBenefitsEnabledFromConfig,
                });
            } catch (err: any) {
                setError(err.message || 'Failed to fetch company configuration');
                setConfig({
                    companyId: null,
                    passwordRules: null,
                    logoUrl: null,
                    country: null,
                    portalDashboardConfig: null,
                    portalWellnessConfig: null,
                    companyPolicyConfig: null,
                    logoFileId: null,
                    portalBrandingConfig: null,
                    offersAndBenefits: [],
                    offersAndBenefitsEnabled: true,
                });
            } finally {
                setLoading(false);
            }
        };

        fetchCompanyConfig();
    }, []);

    return {
        companyId: config.companyId,
        passwordRules: config.passwordRules,
        logoUrl: config.logoUrl,
        country: config.country,
        portalDashboardConfig: config.portalDashboardConfig,
        portalWellnessConfig: config.portalWellnessConfig,
        companyPolicyConfig: config.companyPolicyConfig,
        logoFileId: config.logoFileId,
        portalBrandingConfig: config.portalBrandingConfig,
        offersAndBenefits: config.offersAndBenefits,
        offersAndBenefitsEnabled: config.offersAndBenefitsEnabled,
        loading,
        error,
    };
};
