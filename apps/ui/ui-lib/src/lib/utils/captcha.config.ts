/**
 * CAPTCHA Configuration
 * 
 * Using Cloudflare Turnstile as the CAPTCHA provider.
 * Site key is loaded from environment variable for security.
 */

import { environment } from "../environment";


export const CAPTCHA_CONFIG = {
    provider: environment.captchaProvider,
    siteKey: environment.captchaSiteKey,
    mode: "checkbox" as const,
    theme: "light" as const,
};
export const ACTIVE_CAPTCHA = CAPTCHA_CONFIG;
