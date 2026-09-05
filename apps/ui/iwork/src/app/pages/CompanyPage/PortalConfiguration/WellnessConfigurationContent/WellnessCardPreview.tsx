import React from 'react';
import { Chip, Skeleton } from '@mui/material';
import { ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
import { Button } from '@ui/ui-lib';
import {
    PreviewBody,
    PreviewCard,
    PreviewCtaRow,
    PreviewHeading,
    PreviewSubheading,
    PreviewThumbnail,
} from './styles';
import { WELLNESS_MEDIA_FORMATS, WellnessMediaFormat } from './types';

const mediaFormatLabel = (format?: WellnessMediaFormat): string =>
    WELLNESS_MEDIA_FORMATS.find((f) => f.value === format)?.label ?? '';

export interface WellnessCardPreviewProps {
    heading?: string;
    subheading?: string;
    tags?: string[];
    thumbnailUrl?: string | null;
    isThumbnailLoading?: boolean;
    ctaLabel?: string;
    /** Wellness Library: media format + duration badge (replaces tags). */
    format?: WellnessMediaFormat;
    durationLabel?: string;
    /** Smaller fixed-size rendering used in the already-added cards strip. */
    compact?: boolean;
}

const CARD_WIDTH = 280;
const CARD_HEIGHT = 320;
const COMPACT_WIDTH = 168;
const COMPACT_HEIGHT = 210;

/**
 * Live card preview shown next to the form. Every field falls back to an MUI
 * Skeleton placeholder until it has a value, so the card reads as "empty" by
 * default and fills in field-by-field as the admin types — this is the same
 * component IBP will render from saved config, so preview and production stay
 * pixel-identical (see Architecture §9 / TRD §5 — promote to ui-lib when IBP
 * wiring lands). Width/height are fixed (via `compact` for the strip) so every
 * card is the same size regardless of content length, matching production.
 */
export const WellnessCardPreview: React.FC<WellnessCardPreviewProps> = ({
    heading,
    subheading,
    tags = [],
    thumbnailUrl,
    isThumbnailLoading,
    ctaLabel = 'View benefit',
    format,
    durationLabel,
    compact = false,
}) => {
    const width = compact ? COMPACT_WIDTH : CARD_WIDTH;
    const height = compact ? COMPACT_HEIGHT : CARD_HEIGHT;
    const thumbnailHeight = compact ? 84 : 140;

    return (
        <PreviewCard sx={{ width, height, flexShrink: 0 }}>
            {isThumbnailLoading || !thumbnailUrl ? (
                <Skeleton
                    variant="rectangular"
                    height={thumbnailHeight}
                    animation={isThumbnailLoading ? 'wave' : false}
                />
            ) : (
                <PreviewThumbnail src={thumbnailUrl} alt={heading || 'Card thumbnail'} sx={{ height: thumbnailHeight }} />
            )}
            <PreviewBody sx={{ padding: compact ? 1 : 2, gap: compact ? 0.5 : 1, overflow: 'hidden' }}>
                {heading ? (
                    <PreviewHeading
                        sx={{
                            fontSize: compact ? '12px' : '15px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {heading}
                    </PreviewHeading>
                ) : (
                    <Skeleton variant="text" width="70%" height={compact ? 18 : 26} />
                )}
                {subheading ? (
                    <PreviewSubheading
                        sx={{
                            fontSize: compact ? '11px' : '13px',
                            display: '-webkit-box',
                            WebkitBoxOrient: 'vertical',
                            WebkitLineClamp: compact ? 2 : 3,
                            overflow: 'hidden',
                        }}
                    >
                        {subheading}
                    </PreviewSubheading>
                ) : (
                    <Skeleton variant="text" width="90%" height={compact ? 14 : 18} />
                )}
                {!compact &&
                    (format ? (
                        <PreviewCtaRow sx={{ justifyContent: 'flex-start', gap: 1 }}>
                            <Chip
                                size="small"
                                label={`${mediaFormatLabel(format)}${durationLabel ? ` · ${durationLabel}` : ''}`}
                                sx={{ backgroundColor: 'grey.200', color: 'text.secondary' }}
                            />
                        </PreviewCtaRow>
                    ) : tags.length > 0 ? (
                        <PreviewCtaRow sx={{ justifyContent: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                            {tags.map((tag) => (
                                <Chip
                                    key={tag}
                                    label={tag}
                                    size="small"
                                    sx={{ backgroundColor: 'grey.200', color: 'text.secondary' }}
                                />
                            ))}
                        </PreviewCtaRow>
                    ) : (
                        <Skeleton variant="rectangular" width={72} height={22} sx={{ borderRadius: '12px' }} />
                    ))}
                {!compact && (
                    <PreviewCtaRow sx={{ marginTop: 'auto' }}>
                        <Button variantType="secondary" sizeType="small" endIcon={<ArrowForwardIcon fontSize="small" />}>
                            {ctaLabel}
                        </Button>
                    </PreviewCtaRow>
                )}
            </PreviewBody>
        </PreviewCard>
    );
};

export default WellnessCardPreview;
