import { useState, useRef, useCallback } from "react";
import { type CaptchaRef } from "captcha-react";

/**
 * Custom hook for managing CAPTCHA state and operations
 * 
 * @returns Object containing CAPTCHA state and handler functions
 */
export const useCaptcha = () => {
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
    const [captchaKey, setCaptchaKey] = useState(0);
    const captchaRef = useRef<CaptchaRef>(null);

    /**
     * Handle CAPTCHA verification
     */
    const handleCaptchaVerify = useCallback((token: string) => {
        setCaptchaToken(token);
        setIsCaptchaVerified(true);
    }, []);

    /**
     * Reset CAPTCHA state (e.g., after failed login)
     */
    const resetCaptcha = useCallback(() => {
        setIsCaptchaVerified(false);
        setCaptchaToken(null);
        setCaptchaKey((prev) => prev + 1);
    }, []);

    /**
     * Check if CAPTCHA is verified and token is available
     */
    const isCaptchaValid = useCallback(() => {
        return isCaptchaVerified && !!captchaToken;
    }, [isCaptchaVerified, captchaToken]);

    return {
        captchaToken,
        isCaptchaVerified,
        captchaKey,
        captchaRef,
        handleCaptchaVerify,
        resetCaptcha,
        isCaptchaValid,
    };
};
