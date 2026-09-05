import React, { useState } from 'react';
import {
    Autocomplete,
    Box,
    IconButton,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from '@mui/material';
import { Add as AddIcon, DeleteOutline as DeleteIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { Button } from '@ui/ui-lib';
import {
    ExternalApiConfigOption,
    WellnessCard,
    WellnessCardDataSource,
    createEmptyWellnessCard,
} from './types';
import { TileEditorRow } from './TileEditorRow';
import { getTileColorTemplate } from './tileColorPalette';
import {
    AddCardRow,
    SectionBlock,
    SectionHeading,
    SectionSubheading,
    TileAccordion,
    TileAccordionDetails,
    TileAccordionSummary,
    TileSummaryDot,
    TileSummaryText,
} from './styles';

interface SectionTileListProps {
    title: string;
    description: string;
    cards: WellnessCard[];
    intensity: 'soft' | 'vivid';
    disabled?: boolean;
    addButtonLabel: string;
    /** Section-level data source. When `onDataSourceChange` is provided, a
     *  Static/Dynamic toggle is shown for the whole section. */
    dataSource?: WellnessCardDataSource;
    onDataSourceChange?: (dataSource: WellnessCardDataSource) => void;
    /** True while the dynamic prefill (magic-url) call is in flight. */
    dynamicLoading?: boolean;
    /** External API Configs offered in the section's dynamic picker. */
    apiConfigs?: ExternalApiConfigOption[];
    /** The picked External API Config id (DYNAMIC only). */
    apiRefId?: number | null;
    onApiRefChange?: (apiRefId: number) => void;
    onChange: (cards: WellnessCard[]) => void;
}

/**
 * Colour-template tile list for Section A (Health Assessment) and Section C
 * (Explore by Need). Only one tile's form is expanded at a time (accordion,
 * always exactly one open) — every other tile collapses to a summary row
 * (colour dot + heading). Admins can still add/remove/reorder beyond the
 * starter set.
 *
 * When `onDataSourceChange` is supplied, the section header carries a
 * Static/Dynamic toggle. DYNAMIC only records the choice — the cards below are
 * the same editors and will be prefilled from the (not-yet-known) external API
 * once that path is wired.
 */
export const SectionTileList: React.FC<SectionTileListProps> = ({
    title,
    description,
    cards,
    intensity,
    disabled,
    addButtonLabel,
    dataSource,
    onDataSourceChange,
    dynamicLoading,
    apiConfigs,
    apiRefId,
    onApiRefChange,
    onChange,
}) => {
    const sortedCards = [...cards].sort((a, b) => a.order - b.order);
    const [activeIndex, setActiveIndex] = useState(0);
    const activeIdx = Math.min(activeIndex, sortedCards.length - 1);
    const isDynamic = dataSource === 'DYNAMIC';

    const updateCard = (id: string, patch: Partial<WellnessCard>) => {
        onChange(sortedCards.map((card) => (card.id === id ? { ...card, ...patch } : card)));
    };

    const deleteCard = (id: string) => {
        const next = sortedCards
            .filter((card) => card.id !== id)
            .map((card, index) => ({ ...card, order: index }));
        onChange(next);
        setActiveIndex((current) => Math.min(current, Math.max(next.length - 1, 0)));
    };

    const addCard = () => {
        const next = [...sortedCards, createEmptyWellnessCard(sortedCards.length)];
        onChange(next);
        setActiveIndex(next.length - 1);
    };

    return (
        <SectionBlock>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
                <Box>
                    <SectionHeading>{title}</SectionHeading>
                    <SectionSubheading>{description}</SectionSubheading>
                </Box>
                {onDataSourceChange && (
                    <ToggleButtonGroup
                        exclusive
                        size="small"
                        value={dataSource ?? 'STATIC'}
                        disabled={disabled}
                        onChange={(_, next) => next && onDataSourceChange(next as WellnessCardDataSource)}
                        sx={{ flexShrink: 0 }}
                    >
                        <ToggleButton value="STATIC">Static</ToggleButton>
                        <ToggleButton value="DYNAMIC">Dynamic</ToggleButton>
                    </ToggleButtonGroup>
                )}
            </Box>

            {isDynamic && (
                <Box sx={{ mt: 1, mb: 0.5, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    {onApiRefChange && (
                        <Autocomplete
                            size="small"
                            options={apiConfigs ?? []}
                            getOptionLabel={(option) => option.label}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            value={(apiConfigs ?? []).find((c) => c.id === apiRefId) ?? null}
                            disabled={disabled || dynamicLoading}
                            onChange={(_, option) => option && onApiRefChange(option.id)}
                            sx={{ maxWidth: 420 }}
                            ListboxProps={{ style: { maxHeight: 240 } }}
                            noOptionsText="No External API configs found"
                            renderInput={(params) => (
                                <TextField {...params} placeholder="Search an External API…" />
                            )}
                        />
                    )}
                    <Typography sx={{ fontSize: 12, color: '#6B7280' }}>
                        {dynamicLoading
                            ? 'Fetching cards from the external API…'
                            : 'Dynamic: pick an External API to prefill these cards. Until it returns data, the fields below act as fallback/placeholder content.'}
                    </Typography>
                </Box>
            )}

            {sortedCards.map((card, index) => (
                <TileAccordion
                    key={card.id}
                    expanded={index === activeIdx}
                    onChange={(_, isExpanded) => setActiveIndex(isExpanded ? index : -1)}
                >
                    <TileAccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <TileSummaryDot swatchcolor={getTileColorTemplate(card.colorTemplate).swatchColor} />
                        <TileSummaryText>{card.heading || `Tile ${index + 1}`}</TileSummaryText>
                        {!disabled && sortedCards.length > 1 && (
                            <IconButton
                                size="small"
                                aria-label="Delete tile"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    deleteCard(card.id);
                                }}
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        )}
                    </TileAccordionSummary>
                    <TileAccordionDetails>
                        <TileEditorRow card={card} intensity={intensity} disabled={disabled} onChange={updateCard} />
                    </TileAccordionDetails>
                </TileAccordion>
            ))}

            {!disabled && (
                <AddCardRow>
                    <Button variantType="secondary" sizeType="small" startIcon={<AddIcon />} onClick={addCard}>
                        {addButtonLabel}
                    </Button>
                </AddCardRow>
            )}
        </SectionBlock>
    );
};

export default SectionTileList;
