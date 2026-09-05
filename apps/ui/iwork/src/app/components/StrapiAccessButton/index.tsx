import React, { useState, useEffect } from 'react';
import { Button, Tooltip, CircularProgress, Alert, Snackbar } from '@mui/material';
import { Settings as SettingsIcon, OpenInNew as OpenInNewIcon } from '@mui/icons-material';
import { useLocalization } from '@ui/ui-lib';
import StrapiSsoService, { StrapiSsoOptions } from '../../services/strapiSsoService';
import AclPermissionService from '../../services/aclPermissionService';

interface StrapiAccessButtonProps {
    variant?: 'contained' | 'outlined' | 'text';
    size?: 'small' | 'medium' | 'large';
    buttonText?: string;
    tooltip?: string;
    icon?: React.ReactNode;
    options?: StrapiSsoOptions;
    requiredPermissions?: string[]; // Deprecated: Use ACL-based permissions instead
    className?: string;
    style?: React.CSSProperties;
    onSuccess?: () => void;
    onError?: (error: Error) => void;
}

const StrapiAccessButton: React.FC<StrapiAccessButtonProps> = ({
    variant = 'contained',
    size = 'medium',
    buttonText,
    tooltip,
    icon,
    options = { openInNewTab: true },
    requiredPermissions = ['CONTENT_MANAGEMENT', 'CMS_ACCESS'], // Deprecated
    className,
    style,
    onSuccess,
    onError,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasStrapiAccess, setHasStrapiAccess] = useState(false);
    const [isCheckingPermissions, setIsCheckingPermissions] = useState(true);
    const { localizationData } = useLocalization();

    // Check ACL permissions for Strapi access
    useEffect(() => {
        const checkPermissions = async () => {
            try {
                setIsCheckingPermissions(true);
                const permissions = await AclPermissionService.checkStrapiAccess();
                
                // Show button only if user has STRAPI_ADMIN_001 permission
                setHasStrapiAccess(permissions.hasStrapiAdmin);
                
                console.log('🔐 Strapi button visibility check:', {
                    hasStrapiAdmin: permissions.hasStrapiAdmin,
                    hasStrapiRead: permissions.hasStrapiRead,
                    buttonVisible: permissions.hasStrapiAdmin,
                });
            } catch (error) {
                console.error('❌ Failed to check Strapi permissions:', error);
                setHasStrapiAccess(false);
            } finally {
                setIsCheckingPermissions(false);
            }
        };

        checkPermissions();
    }, []);

    const defaultButtonText = buttonText || localizationData?.['OPEN_STRAPI'] || 'Open Strapi CMS';
    const defaultTooltip = tooltip || localizationData?.['OPEN_STRAPI_TOOLTIP'] || 'Open Strapi Content Management System';

    const handleOpenStrapi = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Check ACL permissions before opening
            const permissions = await AclPermissionService.checkStrapiAccess(false); // Force fresh check
            
            if (!permissions.hasStrapiAdmin) {
                throw new Error('You do not have permission to access Strapi CMS. STRAPI_ADMIN_001 permission required.');
            }

            await StrapiSsoService.openStrapiAdmin(options);
            
            onSuccess?.();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to open Strapi CMS';
            console.error('❌ Failed to open Strapi:', error);
            setError(errorMessage);
            onError?.(error instanceof Error ? error : new Error(errorMessage));
        } finally {
            setIsLoading(false);
        }
    };

    // Don't render button while checking permissions
    if (isCheckingPermissions) {
        return null;
    }

    // Hide button if user doesn't have STRAPI_ADMIN_001 permission
    if (!hasStrapiAccess) {
        console.log('🚫 Strapi button hidden: User does not have STRAPI_ADMIN_001 permission');
        return null;
    }

    const buttonContent = (
        <Button
            variant={variant}
            size={size}
            onClick={handleOpenStrapi}
            disabled={isLoading}
            className={className}
            style={style}
            startIcon={
                isLoading ? (
                    <CircularProgress size={16} color="inherit" />
                ) : (
                    icon || <SettingsIcon />
                )
            }
            endIcon={!isLoading && options.openInNewTab !== false ? <OpenInNewIcon /> : null}
        >
            {isLoading ? (localizationData?.['OPENING'] || 'Opening...') : defaultButtonText}
        </Button>
    );

    return (
        <>
            {tooltip ? (
                <Tooltip title={defaultTooltip} arrow>
                    {buttonContent}
                </Tooltip>
            ) : (
                buttonContent
            )}
            
            {/* Error notification */}
            <Snackbar 
                open={!!error} 
                autoHideDuration={6000} 
                onClose={() => setError(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert 
                    onClose={() => setError(null)} 
                    severity="error" 
                    sx={{ width: '100%' }}
                >
                    {error}
                </Alert>
            </Snackbar>
        </>
    );
};

export default StrapiAccessButton;
