import React, { useState } from 'react';
import { Add as AddIcon, Edit as EditIcon } from '@mui/icons-material';
import { Button } from '@ui/ui-lib';
import { WellnessCard, createEmptyWellnessCard } from './types';
import { WellnessCardEditorRow } from './WellnessCardEditorRow';
import { WellnessCardPreview } from './WellnessCardPreview';
import { useThumbnailPreviewUrl } from './useThumbnailPreviewUrl';
import {
    AddCardRow,
    SectionBlock,
    SectionHeading,
    SectionSubheading,
    StripContainer,
    StripEditIcon,
    StripItem,
    StripLabel,
} from './styles';

interface SectionCardListProps {
    title: string;
    description: string;
    cards: WellnessCard[];
    companyId?: string | number;
    disabled?: boolean;
    addButtonLabel: string;
    onChange: (cards: WellnessCard[]) => void;
    /** Wellness Library: show media format + duration instead of tags. */
    showMedia?: boolean;
    /** Preview CTA label (defaults to "View benefit"). */
    ctaLabel?: string;
}

const StripCard: React.FC<{ card: WellnessCard; onEdit: () => void }> = ({ card, onEdit }) => {
    const thumbnailUrl = useThumbnailPreviewUrl(card.thumbnailFileId);
    return (
        <StripItem onClick={onEdit}>
            <WellnessCardPreview
                heading={card.heading}
                subheading={card.subheading}
                thumbnailUrl={thumbnailUrl}
                compact
            />
            <StripEditIcon>
                <EditIcon fontSize="small" />
            </StripEditIcon>
        </StripItem>
    );
};

/**
 * Variable, admin-managed photo-card list used by "Benefits from our
 * Organisation" and "Explore More Programmes". One card is edited at a time
 * (form + live preview, side by side); every other card in the section
 * collapses into a compact strip below with an edit icon to bring it back
 * up. "+ Add card" appends a new blank card and makes it active. Every
 * section always holds at least 1 card (guaranteed by
 * buildDefaultWellnessConfig/mapWellnessConfigFromApi) and deleting down to
 * the last card is blocked, so the form is never empty.
 */
export const SectionCardList: React.FC<SectionCardListProps> = ({
    title,
    description,
    cards,
    companyId,
    disabled,
    addButtonLabel,
    onChange,
    showMedia = false,
    ctaLabel,
}) => {
    const sortedCards = [...cards].sort((a, b) => a.order - b.order);
    const [activeIndex, setActiveIndex] = useState(0);

    const activeCard = sortedCards[Math.min(activeIndex, sortedCards.length - 1)];

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
            <SectionHeading>{title}</SectionHeading>
            <SectionSubheading>{description}</SectionSubheading>

            {activeCard && (
                <WellnessCardEditorRow
                    card={activeCard}
                    companyId={companyId}
                    disabled={disabled}
                    onChange={updateCard}
                    onDelete={!disabled && sortedCards.length > 1 ? deleteCard : undefined}
                    showMedia={showMedia}
                    ctaLabel={ctaLabel}
                />
            )}

            {!disabled && (
                <AddCardRow>
                    <Button variantType="secondary" sizeType="small" startIcon={<AddIcon />} onClick={addCard}>
                        {addButtonLabel}
                    </Button>
                </AddCardRow>
            )}

            {sortedCards.length > 1 && (
                <>
                    <StripLabel>Added cards — click to edit</StripLabel>
                    <StripContainer>
                        {sortedCards.map((card, index) =>
                            index === activeIndex ? null : (
                                <StripCard key={card.id} card={card} onEdit={() => setActiveIndex(index)} />
                            )
                        )}
                    </StripContainer>
                </>
            )}
        </SectionBlock>
    );
};

export default SectionCardList;
