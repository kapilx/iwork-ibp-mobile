import React from 'react';
import { IconButton, MenuItem, Select, TextField } from '@mui/material';
import { DeleteOutline as DeleteIcon } from '@mui/icons-material';
import { WellnessCard, WellnessCardLink } from './types';
import { TILE_COLOR_TEMPLATES } from './tileColorPalette';
import { TileCardPreview } from './TileCardPreview';
import {
    CardRow,
    CardRowFormCol,
    CardRowHeader,
    ColorSwatchButton,
    ColorSwatchRow,
    LinkFieldsRow,
} from './styles';

interface TileEditorRowProps {
    card: WellnessCard;
    intensity: 'soft' | 'vivid';
    disabled?: boolean;
    onChange: (id: string, patch: Partial<WellnessCard>) => void;
    onDelete?: (id: string) => void;
}

/** Form + preview for one Section A / Section C colour-template tile. */
export const TileEditorRow: React.FC<TileEditorRowProps> = ({
    card,
    intensity,
    disabled,
    onChange,
    onDelete,
}) => {
    const updateLink = (patch: Partial<WellnessCardLink>) => {
        onChange(card.id, { link: { ...card.link, ...patch } });
    };

    return (
        <CardRow>
            <CardRowFormCol>
                <CardRowHeader>
                    <ColorSwatchRow>
                        {TILE_COLOR_TEMPLATES.map((template) => (
                            <ColorSwatchButton
                                key={template.key}
                                type="button"
                                swatchcolor={template.swatchColor}
                                selected={card.colorTemplate === template.key}
                                disabled={disabled}
                                aria-label={template.label}
                                onClick={() =>
                                    onChange(card.id, {
                                        colorTemplate: template.key,
                                        colorCode: template.swatchColor,
                                        gradient:
                                            intensity === 'vivid'
                                                ? template.vivid.background
                                                : template.soft.background,
                                        textColor:
                                            intensity === 'vivid'
                                                ? template.vivid.textColor
                                                : template.soft.headingColor,
                                    })
                                }
                            />
                        ))}
                    </ColorSwatchRow>
                    {onDelete && (
                        <IconButton size="small" disabled={disabled} onClick={() => onDelete(card.id)} aria-label="Delete tile">
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    )}
                </CardRowHeader>

                <TextField
                    label="Heading"
                    placeholder="e.g. Health assessments"
                    value={card.heading}
                    disabled={disabled}
                    inputProps={{ maxLength: 60 }}
                    onChange={(e) => onChange(card.id, { heading: e.target.value })}
                    fullWidth
                    size="small"
                />

                <TextField
                    label="Subheading"
                    placeholder="e.g. Explore assessments"
                    value={card.subheading ?? ''}
                    disabled={disabled}
                    inputProps={{ maxLength: 100 }}
                    onChange={(e) => onChange(card.id, { subheading: e.target.value })}
                    fullWidth
                    size="small"
                />

                <LinkFieldsRow>
                    <Select
                        size="small"
                        value={card.link?.type ?? 'DIRECT_URL'}
                        disabled={disabled}
                        onChange={(e) => updateLink({ type: e.target.value as WellnessCardLink['type'] })}
                        sx={{ minWidth: 180 }}
                    >
                        <MenuItem value="DIRECT_URL">Direct URL</MenuItem>
                        <MenuItem value="SSO_REDIRECT">SSO vendor redirect</MenuItem>
                    </Select>
                    {card.link?.type === 'SSO_REDIRECT' ? (
                        <TextField
                            label="SSO vendor key"
                            placeholder="e.g. alyve-wellness"
                            value={card.link?.ssoAppKey ?? ''}
                            disabled={disabled}
                            size="small"
                            fullWidth
                            onChange={(e) => updateLink({ ssoAppKey: e.target.value })}
                        />
                    ) : (
                        <TextField
                            label="Navigation URL"
                            placeholder="https://..."
                            value={card.link?.url ?? ''}
                            disabled={disabled}
                            size="small"
                            fullWidth
                            onChange={(e) => updateLink({ url: e.target.value })}
                        />
                    )}
                </LinkFieldsRow>
            </CardRowFormCol>

            <TileCardPreview
                heading={card.heading}
                subheading={card.subheading}
                colorTemplate={card.colorTemplate}
                intensity={intensity}
            />
        </CardRow>
    );
};

export default TileEditorRow;
