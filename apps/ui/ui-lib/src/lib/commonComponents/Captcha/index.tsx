import React from "react";
import { Captcha } from "@divami-labs/react-captcha";
import { type CaptchaRef } from "@divami-labs/react-captcha";
import { ACTIVE_CAPTCHA } from "../../utils/captcha.config";

interface CaptchaComponentProps {
    /**
     * Callback function when CAPTCHA is verified
     */
    onVerify: (token: string) => void;
    
    /**
     * Reference to the CAPTCHA component
     */
    captchaRef?: React.RefObject<CaptchaRef>;
    
    /**
     * Key to force re-render of CAPTCHA component
     */
    captchaKey?: number;
    
    /**
     * Override the default CAPTCHA configuration
     */
    config?: typeof ACTIVE_CAPTCHA;
}

/**
 * Reusable CAPTCHA Wrapper Component
 * 
 * This component provides Cloudflare Turnstile CAPTCHA implementation.
 * 
 * @example
 * ```tsx
 * const { captchaRef, captchaKey, handleCaptchaVerify } = useCaptcha();
 * 
 * <CaptchaComponent
 *   onVerify={handleCaptchaVerify}
 *   captchaRef={captchaRef}
 *   captchaKey={captchaKey}
 * />
 * ```
 */
export const CaptchaComponent: React.FC<CaptchaComponentProps> = ({
    onVerify,
    captchaRef,
    captchaKey = 0,
    config = ACTIVE_CAPTCHA,
}) => {
    return (
        <Captcha
            key={captchaKey}
            ref={captchaRef}
            provider={config.provider}
            siteKey={config.siteKey}
            onVerify={onVerify}
            mode={config.mode}
            theme={config.theme}
        />
    );
};
