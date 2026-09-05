import { forwardRef, useState, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    IconButton,
    Tooltip,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import {
    RejectedContainer,
    UrlPreview,
    CommentBox,
    CommentHeader,
    CommentAuthor,
    CommentDate,
    CommentText,
    LabelText,
} from './styles';
import { environment } from '@ui/ui-lib';

const getCompanyLabel = (company: Company) =>
    company.displayName || company.companyName || '';

export const SLUG_MAX_LENGTH = 36;
// Valid slug: 1–36 chars, lowercase alphanumerics and hyphens, hyphen only
// allowed between characters (no leading/trailing hyphen, never hyphens only).
// "info-sys" ✓  |  "-infosys-" ✗  |  "---" ✗
export const isValidSlug = (value: string) =>
    value.length <= SLUG_MAX_LENGTH &&
    /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(value);

interface URLDomainSectionProps {
    isRejected?: boolean;
    fullUrl?: string | null;
    slug?: string;
    onSlugChange?: (slug: string) => void;
    isEditMode?: boolean;
    isDomainLocked?: boolean;
    submitted?: boolean;
}

function buildFullUrl(slug: string): string {
    if (!slug.trim()) return '';
    try {
        const base = new URL(environment.ibpAppUrl);
        return `${base.protocol}//${slug.trim()}.${base.host}${base.pathname}`;
    } catch {
        return '';
    }
}

function splitUrl(url: string) {
    const sep = '//';
    const sepIdx = url.indexOf(sep);
    if (sepIdx < 0) return { before: '', slugPart: url, after: '' };
    const afterProto = url.substring(sepIdx + 2);
    const dotIdx = afterProto.indexOf('.');
    return {
        before: url.substring(0, sepIdx + 2),
        slugPart: dotIdx >= 0 ? afterProto.substring(0, dotIdx) : afterProto,
        after: dotIdx >= 0 ? afterProto.substring(dotIdx) : '',
    };
}

export const URLDomainSection = forwardRef<HTMLDivElement, URLDomainSectionProps>(
    (
        {
            isRejected,
            fullUrl,
            slug = '',
            onSlugChange,
            isEditMode = false,
            isDomainLocked = false,
            submitted = false,
        },
        ref
    ) => {
        const [copied, setCopied] = useState(false);

        const Container = isRejected ? RejectedContainer : Box;

        const slugErrorMessage = (() => {
            if (slug.length === 0)
                return submitted ? 'Custom Domain Prefix is required.' : '';
            if (slug.length < 3) return 'Minimum 3 characters required.';
            if (slug.length > SLUG_MAX_LENGTH) return 'Maximum 36 characters allowed.';
            if (!isValidSlug(slug))
                return 'Hyphens are allowed only between characters (not at the start or end).';
            return '';
        })();
        const slugError = Boolean(slugErrorMessage);

        // If domain is already saved, always show the real DB URL — don't rebuild from slug + env host
        const previewUrl = isDomainLocked && fullUrl ? fullUrl : (slug.trim() ? buildFullUrl(slug) : (fullUrl ?? ''));
        const urlParts = previewUrl ? splitUrl(previewUrl) : null;

        const handleCopy = () => {
            if (!previewUrl) return;
            navigator.clipboard.writeText(previewUrl).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        };

        return (
            <Container ref={ref}>
                <Box display="flex" flexDirection="column" gap={3}>
                    <Box>
                        <Typography variant="body2" fontWeight={500} mb={2}>
                            Portal URL
                        </Typography>
                        <Box display="flex" flexDirection="column" gap={2}>
                            {/* Custom Domain Prefix input */}
                            <Box>
                                <LabelText>
                                    Custom Domain Prefix
                                    {isDomainLocked && (
                                        <Typography
                                            component="span"
                                            variant="caption"
                                            sx={{ ml: 1, color: 'text.secondary' }}
                                        >
                                            (cannot be changed)
                                        </Typography>
                                    )}
                                </LabelText>
                                {isEditMode && !isDomainLocked ? (
                                    <TextField
                                        fullWidth
                                        value={slug}
                                        onChange={(e) =>
                                            onSlugChange?.(
                                                e.target.value
                                                    .toLowerCase()
                                                    .replace(/[^a-z0-9-]/g, '')
                                            )
                                        }
                                        size="small"
                                        placeholder="e.g. techcorp"
                                        error={slugError}
                                        helperText={
                                            slugError
                                                ? slugErrorMessage
                                                : 'Lowercase letters, numbers and hyphens only'
                                        }
                                        FormHelperTextProps={{ sx: { marginLeft: 0, color: slugError ? 'error.main' : 'text.secondary' } }}
                                    />
                                ) : (
                                    <UrlPreview>{slug || '-'}</UrlPreview>
                                )}
                            </Box>

                            {/* Your portal URL — preview box with inline copy button */}
                            <Box>
                                <LabelText>Your portal URL</LabelText>
                                <UrlPreview sx={{ display: 'flex', alignItems: 'center', wordBreak: 'break-all', gap: 1 }}>
                                    <Box sx={{ flex: 1 }}>
                                        {urlParts ? (
                                            <>
                                                {urlParts.before}
                                                <span>{urlParts.slugPart}</span>
                                                {urlParts.after}
                                            </>
                                        ) : (
                                            <Typography component="span" sx={{ color: 'text.disabled', fontSize: 'inherit' }}>
                                                Enter a prefix to preview your URL
                                            </Typography>
                                        )}
                                    </Box>
                                    {previewUrl && (
                                        <Tooltip title={copied ? 'Copied!' : 'Copy URL'}>
                                            <IconButton size="small" onClick={handleCopy} sx={{ flexShrink: 0, ml: 'auto' }}>
                                                {copied ? (
                                                    <CheckIcon fontSize="small" sx={{ color: 'success.main' }} />
                                                ) : (
                                                    <ContentCopyIcon fontSize="small" />
                                                )}
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                </UrlPreview>
                            </Box>
                        </Box>
                    </Box>

                </Box>

                {isRejected && (
                    <CommentBox>
                        <CommentHeader>
                            <CommentAuthor>System Admin</CommentAuthor>
                            <CommentDate>Dec 8, 2025 09:15 AM</CommentDate>
                        </CommentHeader>
                        <CommentText>
                            The URL slug 'payline-india' is already in use by another company. Please choose
                            a unique identifier such as 'payline-india-accounting' or 'payline-acc-services'.
                        </CommentText>
                    </CommentBox>
                )}
            </Container>
        );
    }
);

URLDomainSection.displayName = 'URLDomainSection';
