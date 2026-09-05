import { useEffect, useRef, useState, forwardRef } from 'react';
import { Box, IconButton, TextField, Typography, CircularProgress } from '@mui/material';
import {
    Upload as UploadIcon,
    Visibility as VisibilityIcon,
    Refresh as RefreshIcon,
    DeleteOutline as DeleteIcon,
} from '@mui/icons-material';
import {
    LoginWrapper,
    SectionTitle,
    UploadBox,
} from './styles';
import { useFileUpload, UploadedFile } from '@ui/ui-lib/hooks/useFileUpload';
import { endPoints } from '@ui/ui-lib/constants/endPoints';
import { apiRequest } from '@ui/ui-lib/utils/apiRequest';
import { useDispatch } from 'react-redux';
import { setToastMessage } from '@ui/ui-lib/redux/slice';
import { isCopyPasteAllowedForOrg } from '@ui/ui-lib/environment';

interface BrandingSectionProps {
    companyId?: string;
    companyType?: string;
    existingLogo?: UploadedFile | null;
    onLogoChange?: (file: UploadedFile | null) => void;
    heading?: string;
    bodyText?: string;
    onHeadingChange?: (value: string) => void;
    onBodyTextChange?: (value: string) => void;
    disableWelcomeMessage?: boolean;
}

const LOGO_DOCUMENT_TYPE = 'company_logo';

export const BrandingSection = forwardRef<HTMLDivElement, BrandingSectionProps>(
    (
        {
            companyId,
            companyType = companyId + '-company-logo',
            existingLogo,
            onLogoChange,
            heading: headingProp,
            bodyText: bodyTextProp,
            onHeadingChange,
            onBodyTextChange,
            disableWelcomeMessage = false,
        },
        ref
    ) => {
        const dispatch = useDispatch();
        const [heading, setHeading] = useState(
            headingProp ?? 'Welcome to Insurance and Wellness Hub'
        );
        const [bodyText, setBodyText] = useState(
            bodyTextProp ??
                'Complete healthcare coverage for you and your family'
        );
        const [logoFile, setLogoFile] = useState<UploadedFile | null>(existingLogo || null);
        const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
        const [isFetchingPreview, setIsFetchingPreview] = useState(false);

        const {
            uploadedFile,
            handleFileChange: uploadFileChange,
            loading: isUploading,
        } = useFileUpload(existingLogo || undefined, endPoints.fileUpload, true);

        const fileInputRef = useRef<HTMLInputElement | null>(null);

        useEffect(() => {
            if (uploadedFile) {
                setLogoFile(uploadedFile);
                onLogoChange?.(uploadedFile);
            }
        }, [uploadedFile, onLogoChange]);

        useEffect(() => {
            setLogoFile(existingLogo || null);
        }, [existingLogo]);

        useEffect(() => {
            let isCancelled = false;
            let objectUrl: string | null = null;

            const buildPreview = async () => {
                if (!logoFile?.id) {
                    setLogoPreviewUrl(logoFile?.fileBuffer ? `data:${logoFile.mimeType || 'image/png'};base64,${logoFile.fileBuffer}` : null);
                    return;
                }

                setIsFetchingPreview(true);
                try {
                    const response = await apiRequest(
                        endPoints.fileUploadDownloadById(logoFile.id),
                        {
                            method: 'GET',
                            responseType: 'blob',
                        }
                    );

                    if (isCancelled) return;

                    const blob = response.data as Blob;
                    objectUrl = URL.createObjectURL(blob);
                    setLogoPreviewUrl(objectUrl);
                } catch (error) {
                    if (!isCancelled) {
                        setLogoPreviewUrl(null);
                        dispatch(setToastMessage('Unable to load logo preview.'));
                    }
                } finally {
                    if (!isCancelled) {
                        setIsFetchingPreview(false);
                    }
                }
            };

            buildPreview();

            return () => {
                isCancelled = true;
                if (objectUrl) {
                    URL.revokeObjectURL(objectUrl);
                }
            };
        }, [logoFile, dispatch]);

        useEffect(() => {
            if (headingProp !== undefined) {
                setHeading(headingProp);
            }
        }, [headingProp]);

        useEffect(() => {
            if (bodyTextProp !== undefined) {
                setBodyText(bodyTextProp);
            }
        }, [bodyTextProp]);

        const handleUploadClick = () => {
            if (!companyId) {
                dispatch(setToastMessage('Company ID is required to upload a logo.'));
                return;
            }
            fileInputRef.current?.click();
        };

        const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (!companyId) {
                dispatch(setToastMessage('Company ID is required to upload a logo.'));
                return;
            }

            uploadFileChange(
                e,
                companyType,
                companyId,
                LOGO_DOCUMENT_TYPE,
                (file) => {
                    setLogoFile(file);
                    onLogoChange?.(file);
                }
            );
        };

        const handleDeleteLogo = async (event?: React.MouseEvent) => {
            event?.stopPropagation();

            if (!logoFile?.id) {
                setLogoFile(null);
                onLogoChange?.(null);
                return;
            }

            try {
                await apiRequest(`${endPoints.fileUploadDelete}/${logoFile.id}`, {
                    method: 'DELETE',
                });
                dispatch(setToastMessage('Logo deleted successfully.'));
                setLogoFile(null);
                onLogoChange?.(null);
            } catch (error) {
                dispatch(setToastMessage('Failed to delete logo. Please try again.'));
            }
        };

        const openDataInNewTab = (dataUrl: string) => {
            const newWindow = window.open();
            if (newWindow) {
                newWindow.document.write(`<img src="${dataUrl}" alt="Company logo" />`);
                newWindow.document.close();
            } else {
                dispatch(setToastMessage('Unable to open the logo. Please allow pop-ups.'));
            }
        };

        const handleViewLogo = async (event?: React.MouseEvent) => {
            event?.stopPropagation();

            if (logoPreviewUrl) {
                openDataInNewTab(logoPreviewUrl);
                return;
            }

            if (!logoFile?.id) {
                dispatch(setToastMessage('No logo available to view.'));
                return;
            }

            try {
                const response = await apiRequest(endPoints.fileUploadDownloadById(logoFile.id), {
                    method: 'GET',
                    responseType: 'blob',
                });

                const blob = response.data as Blob;
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
                URL.revokeObjectURL(url);
            } catch (error) {
                dispatch(setToastMessage('Failed to load logo. Please try again.'));
            }
        };

        return (
            <Box ref={ref}>

                {/* Company Logo and Login Welcome Message Grid */}
                <Box display="grid" gridTemplateColumns="1fr 1fr" gap={3} mb={3}>
                    {/* Company Logo Section */}
                    <Box>
                        <Typography variant="body2" fontWeight={500} mb={1}>
                            Company Logo
                        </Typography>
                        <UploadBox onClick={logoFile ? undefined : handleUploadClick}>
                            <input
                                ref={fileInputRef}
                                type="file"
                                hidden
                                accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                            onChange={handleLogoChange}
                        />
                        {isUploading || isFetchingPreview ? (
                            <Box
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                minHeight="200px"
                                gap={1}
                            >
                                <CircularProgress size={24} />
                                <Typography variant="body2">
                                    {isUploading ? 'Uploading logo...' : 'Loading preview...'}
                                </Typography>
                            </Box>
                        ) : logoFile ? (
                                <Box display="flex" flexDirection="column" gap={2}>
                                    <Box
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                        minHeight="200px"
                                        sx={{
                                            backgroundColor: 'grey.50',
                                            borderRadius: 1,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        {logoPreviewUrl ? (
                                            <Box
                                                component="img"
                                                src={logoPreviewUrl}
                                                alt="Company logo preview"
                                                sx={{ maxWidth: '100%', maxHeight: 180, objectFit: 'contain' }}
                                            />
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                Logo uploaded
                                            </Typography>
                                        )}
                                    </Box>
                                    <Box display="flex" gap={1}>
                                        <IconButton size="small" onClick={handleViewLogo}>
                                            <VisibilityIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                handleUploadClick();
                                            }}
                                        >
                                            <RefreshIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" onClick={handleDeleteLogo}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </Box>
                            ) : (
                                <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="200px">
                                    <UploadIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                                    <Typography variant="body2" fontWeight={500} mb={0.5}>
                                        Click to upload logo
                                    </Typography>
                                    <Typography variant="caption">
                                        Recommended: 200x200px, PNG or SVG
                                    </Typography>
                                </Box>
                            )}
                        </UploadBox>
                    </Box>

                    {/* Login Welcome Message Section */}
                    <Box>
                        <Typography variant="body2" fontWeight={500} mt={1.5}>
                            Login Welcome Message
                        </Typography>
                        <LoginWrapper>
                            <Box>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                    <Typography variant="body2" fontWeight={500}>
                                        Heading
                                    </Typography>
                                    <Typography variant="caption">
                                        Max 50 characters
                                    </Typography>
                                </Box>
                                <TextField
                                    fullWidth
                                    size="small"
                                    value={heading}
                                    onChange={(e) => {
                                        setHeading(e.target.value);
                                        onHeadingChange?.(e.target.value);
                                    }}
                                    placeholder="Welcome to Insurance and Wellness Hub"
                                    inputProps={{ maxLength: 50 }}
                                    disabled={disableWelcomeMessage}
                                    onPaste={(e) => {
                                        if (!isCopyPasteAllowedForOrg()) {
                                            e.preventDefault();
                                        }
                                    }}
                                />
                            </Box>
                            <Box>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                    <Typography variant="body2" fontWeight={500}>
                                        Body Text
                                    </Typography>
                                    <Typography variant="caption">
                                        Max 150 characters
                                    </Typography>
                                </Box>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    size="small"
                                    value={bodyText}
                                    onChange={(e) => {
                                        setBodyText(e.target.value);
                                        onBodyTextChange?.(e.target.value);
                                    }}
                                    placeholder="Complete healthcare coverage for you and your family"
                                    inputProps={{ maxLength: 150 }}
                                    disabled={disableWelcomeMessage}
                                    onPaste={(e) => {
                                        if (!isCopyPasteAllowedForOrg()) {
                                            e.preventDefault();
                                        }
                                    }}
                                />
                            </Box>
                        </LoginWrapper>
                    </Box>
                </Box>
            </Box>
        );
    }
);

BrandingSection.displayName = 'BrandingSection';
