import { useState, useEffect } from "react";
import axios from "axios";
import { environment, endPoints } from "@ui/ui-lib";

export interface AuthMethod {
  methodCode: string;
  methodName: string;
  isEnabled: boolean;
  displayOrder: number;
  configuration?: Record<string, any>;
  authenticationMethodKey?: string | null;
}

export const useAuthConfig = () => {
  const [authMethods, setAuthMethods] = useState<AuthMethod[]>([]);
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuthConfig = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if multi-auth feature is enabled (defaults to false if not set in env)
        if (!environment.featureFlag.FF_MULTI_AUTH) {
          setAuthMethods([
            {
              methodCode: "EMAIL_PASSWORD",
              methodName: "Email ",
              isEnabled: true,
              displayOrder: 1,
            },
          ]);
          setCompanyId(null);
          setLoading(false);
          return;
        }

        // Get companyId from subdomain configuration
        const subdomain = window.location.hostname.split(".")[0];
        const subdomainConfigResponse = await axios.get(
          endPoints.companyAuthConfigBySubdomain(subdomain)
        );
        const payload = subdomainConfigResponse?.data?.data ?? {};
        const companyConfigData = payload?.companyConfig ?? {};
        const methods = payload?.authMethods ?? [];
        const targetCompanyId = companyConfigData?.companyId ?? null;
        setCompanyId(targetCompanyId);

        // Persist session timeout minutes (first method) for inactivity logout
        const sessionTimeoutMinutes = (() => {
          const withTimeout = methods.find(
            (m: AuthMethod) =>
              m?.configuration?.passwordConfig?.sessionSettings
                ?.sessionTimeoutMinutes ||
              m?.configuration?.sessionSettings?.sessionTimeoutMinutes
          );
          return (
            withTimeout?.configuration?.passwordConfig?.sessionSettings
              ?.sessionTimeoutMinutes ??
            withTimeout?.configuration?.sessionSettings?.sessionTimeoutMinutes
          );
        })();
        if (sessionTimeoutMinutes && !Number.isNaN(sessionTimeoutMinutes)) {
          sessionStorage.setItem(
            "sessionTimeoutMinutes",
            sessionTimeoutMinutes.toString()
          );
        } else {
          sessionStorage.removeItem("sessionTimeoutMinutes");
        }

        if (!methods.length) {
          setAuthMethods([
            {
              methodCode: "USERNAME_PASSWORD",
              methodName: "Username + Password",
              isEnabled: true,
              displayOrder: 1,
            },
          ]);
          setLoading(false);
          return;
        }

        setAuthMethods(
          methods
            .slice()
            .sort(
              (a: AuthMethod, b: AuthMethod) => a.displayOrder - b.displayOrder
            )
        );
      } catch (err: any) {
        setError(err.message || "Failed to fetch authentication configuration");

        setAuthMethods([
          {
            methodCode: "EMAIL_PASSWORD",
            methodName: "Email ",
            isEnabled: true,
            displayOrder: 1,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchAuthConfig();
  }, []);

  const isMethodEnabled = (methodCode: string): boolean => {
    return authMethods.some(
      (method) => method.methodCode === methodCode && method.isEnabled
    );
  };

  return {
    companyId,
    authMethods,
    loading,
    error,
    isMethodEnabled,
  };
};
