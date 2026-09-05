import React from 'react';
import { Skeleton, alpha } from '@mui/material';
import {
    AssignmentOutlined as ClipboardIcon,
    ChevronRight as ChevronRightIcon,
    NorthEast as ArrowIcon,
} from '@mui/icons-material';
import { getTileColorTemplate } from './tileColorPalette';
import {
    TileBigHeadline,
    TileBox,
    TileHeadlineVivid,
    TileIconBadge,
    TileSmallLabel,
    TileSubLabelVivid,
    TileTopRow,
} from './styles';

export interface TileCardPreviewProps {
    heading?: string;
    subheading?: string;
    colorTemplate?: string;
    /** "soft" = Section A pastel stat tiles, "vivid" = Section C bold gradient tiles. */
    intensity: 'soft' | 'vivid';
    compact?: boolean;
}

const SIZE = { width: 260, height: 150 };
const COMPACT_SIZE = { width: 168, height: 110 };

/**
 * Fixed-size colour-template tile — the shared preview for Section A
 * (Health Assessment) and Section C (Explore by Need), matching the
 * production reference exactly: a colour swatch the admin picks drives the
 * background, with "soft" (pastel, dark text, icon badge) or "vivid" (bold
 * gradient, white text) typography depending on the section.
 */
export const TileCardPreview: React.FC<TileCardPreviewProps> = ({
    heading,
    subheading,
    colorTemplate,
    intensity,
    compact = false,
}) => {
    const { width, height } = compact ? COMPACT_SIZE : SIZE;
    const template = getTileColorTemplate(colorTemplate);
    const isEmpty = !heading && !subheading;

    if (isEmpty) {
        return <Skeleton variant="rounded" width={width} height={height} />;
    }

    if (intensity === 'soft') {
        const { background, borderColor, headingColor } = template.soft;
        return (
            <TileBox sx={{ width, height, background, border: `1px solid ${borderColor}` }}>
                <TileTopRow>
                    <TileIconBadge sx={{ backgroundColor: alpha(headingColor, 0.12) }}>
                        <ClipboardIcon sx={{ color: headingColor, fontSize: 20 }} />
                    </TileIconBadge>
                    <ArrowIcon fontSize="small" sx={{ color: headingColor, opacity: 0.6 }} />
                </TileTopRow>
                {heading && <TileSmallLabel sx={{ color: headingColor }}>{heading}</TileSmallLabel>}
                {subheading && <TileBigHeadline sx={{ color: headingColor }}>{subheading}</TileBigHeadline>}
            </TileBox>
        );
    }

    const { background, textColor } = template.vivid;
    return (
        <TileBox sx={{ width, height, background }}>
            {heading && <TileHeadlineVivid sx={{ color: textColor }}>{heading}</TileHeadlineVivid>}
            {subheading && (
                <TileSubLabelVivid sx={{ color: textColor }}>
                    {subheading}
                    <ChevronRightIcon fontSize="inherit" />
                </TileSubLabelVivid>
            )}
        </TileBox>
    );
};

export default TileCardPreview;
