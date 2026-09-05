import React, { useEffect, useRef, useState } from 'react';
import { Chip, IconButton, MenuItem, Select, TextField } from '@mui/material';
import {
    Close as CloseIcon,
    DeleteOutline as DeleteIcon,
    DragIndicator as DragIndicatorIcon,
} from '@mui/icons-material';
import { endPoints } from '@ui/ui-lib';
import { useFileUpload } from '@ui/ui-lib/hooks/useFileUpload';
import { useDispatch } from 'react-redux';
import { setToastMessage } from '@ui/ui-lib/redux/slice';
import type { DraggableItemProvided } from '@ui/ui-lib/commonComponents/DraggableList';
import {
    WellnessCard,
    WellnessCardLink,
    WELLNESS_MEDIA_FORMATS,
    WellnessMediaFormat,
} from './types';
import { WellnessCardPreview } from './WellnessCardPreview';
import { useThumbnailPreviewUrl } from './useThumbnailPreviewUrl';
import {
    CardRow,
    CardRowFormCol,
    CardRowHeader,
    DragHandle,
    LinkFieldsRow,
    TagsRow,
} from './styles';

const WELLNESS_THUMBNAIL_COMPANY_TYPE = 'WELLNESS_CARD';

interface WellnessCardEditorRowProps {
    card: WellnessCard;
    companyId?: string | number;
    disabled?: boolean;
    onChange: (id: string, patch: Partial<WellnessCard>) => void;
    onDelete?: (id: string) => void;
    dragHandleProps?: DraggableItemProvided['dragHandleProps'];
    /** Wellness Library: show media format + duration instead of tags. */
    showMedia?: boolean;
    /** Preview CTA label (defaults to "View benefit"). */
    ctaLabel?: string;
}

/** Form + live preview for one Benefits/Programmes photo card (thumbnail, heading, subheading, tags, link). */
export const WellnessCardEditorRow: React.FC<WellnessCardEditorRowProps> = ({
    card,
    companyId,
    disabled,
    onChange,
    onDelete,
    dragHandleProps,
    showMedia = false,
    ctaLabel = 'View benefit',
}) => {
    const dispatch = useDispatch();
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [tagInput, setTagInput] = useState('');

    const { uploadedFile, handleFileChange, loading: isUploading } = useFileUpload(
        undefined,
        endPoints.fileUpload,
        true
    );

    useEffect(() => {
        if (uploadedFile) {
            onChange(card.id, { thumbnailFileId: uploadedFile.id } as Partial<WellnessCard>);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uploadedFile]);

    const thumbnailUrl = useThumbnailPreviewUrl(card.thumbnailFileId);

    const handleThumbnailPick = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!companyId) {
            dispatch(setToastMessage('Company ID is required to upload a thumbnail.'));
            return;
        }
        handleFileChange(event, WELLNESS_THUMBNAIL_COMPANY_TYPE, companyId, '');
    };

    const updateLink = (patch: Partial<WellnessCardLink>) => {
        onChange(card.id, { link: { ...card.link, ...patch } });
    };

    const addTag = () => {
        const value = tagInput.trim();
        if (!value) return;
        onChange(card.id, { tags: [...(card.tags ?? []), value] });
        setTagInput('');
    };

    const removeTag = (tag: string) => {
        onChange(card.id, { tags: (card.tags ?? []).filter((t) => t !== tag) });
    };

    return (
        <CardRow>
            <CardRowFormCol>
                <CardRowHeader>
                    {dragHandleProps && (
                        <DragHandle {...dragHandleProps}>
                            <DragIndicatorIcon fontSize="small" />
                        </DragHandle>
                    )}
                    {onDelete && (
                        <IconButton
                            size="small"
                            disabled={disabled}
                            onClick={() => onDelete(card.id)}
                            aria-label="Delete card"
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    )}
                </CardRowHeader>

                <div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        hidden
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        onChange={handleThumbnailPick}
                    />
                    <Chip
                        label={isUploading ? 'Uploading thumbnail...' : 'Upload thumbnail'}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={disabled || isUploading}
                        variant="outlined"
                    />
                </div>

                <TextField
                    label="Heading"
                    placeholder="e.g. Full body health profile"
                    value={card.heading}
                    disabled={disabled}
                    inputProps={{ maxLength: 60 }}
                    onChange={(e) => onChange(card.id, { heading: e.target.value })}
                    fullWidth
                    size="small"
                />

                <TextField
                    label="Subheading"
                    placeholder="e.g. Blood test at home covering key preventive health parameters."
                    value={card.subheading ?? ''}
                    disabled={disabled}
                    inputProps={{ maxLength: 150 }}
                    onChange={(e) => onChange(card.id, { subheading: e.target.value })}
                    fullWidth
                    multiline
                    minRows={2}
                    size="small"
                />

                {showMedia ? (
                    <LinkFieldsRow>
                        <Select
                            size="small"
                            value={card.format ?? 'VIDEO'}
                            disabled={disabled}
                            onChange={(e) =>
                                onChange(card.id, { format: e.target.value as WellnessMediaFormat })
                            }
                            sx={{ minWidth: 180 }}
                        >
                            {WELLNESS_MEDIA_FORMATS.map((f) => (
                                <MenuItem key={f.value} value={f.value}>
                                    {f.label}
                                </MenuItem>
                            ))}
                        </Select>
                        <TextField
                            label="Duration"
                            placeholder="e.g. 8 min, 5 min read"
                            value={card.durationLabel ?? ''}
                            disabled={disabled}
                            size="small"
                            fullWidth
                            inputProps={{ maxLength: 30 }}
                            onChange={(e) => onChange(card.id, { durationLabel: e.target.value })}
                        />
                    </LinkFieldsRow>
                ) : (
                    <div>
                        <TagsRow>
                            {(card.tags ?? []).map((tag) => (
                                <Chip
                                    key={tag}
                                    label={tag}
                                    size="small"
                                    onDelete={disabled ? undefined : () => removeTag(tag)}
                                    deleteIcon={<CloseIcon fontSize="small" />}
                                />
                            ))}
                        </TagsRow>
                        <TagsRow sx={{ mt: 1 }}>
                            <TextField
                                placeholder="Add a tag (e.g. 10 sessions)"
                                value={tagInput}
                                disabled={disabled}
                                size="small"
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addTag();
                                    }
                                }}
                            />
                            <Chip label="+ Add tag" onClick={addTag} disabled={disabled || !tagInput.trim()} />
                        </TagsRow>
                    </div>
                )}

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

            <WellnessCardPreview
                heading={card.heading}
                subheading={card.subheading}
                tags={showMedia ? undefined : card.tags}
                format={showMedia ? card.format : undefined}
                durationLabel={showMedia ? card.durationLabel : undefined}
                thumbnailUrl={thumbnailUrl}
                isThumbnailLoading={isUploading}
                ctaLabel={ctaLabel}
            />
        </CardRow>
    );
};

export default WellnessCardEditorRow;
