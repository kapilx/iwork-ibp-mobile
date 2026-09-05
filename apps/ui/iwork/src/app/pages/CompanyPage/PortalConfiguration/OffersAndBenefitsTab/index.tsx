import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  CircularProgress,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import {
  Add as AddIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  DeleteOutline as DeleteIcon,
  Edit as EditIcon,
  Upload as UploadIcon,
} from "@mui/icons-material";
import { Button, apiRequest, endPoints } from "@ui/ui-lib";
import { useFileUpload, UploadedFile } from "@ui/ui-lib/hooks/useFileUpload";
import { Toggle } from "../Toggle";
import {
  TabContainer,
  HeaderRow,
  SectionHeading,
  SectionSubheading,
  ItemCard,
  ItemThumb,
  ItemInfo,
  ItemTitle,
  ItemUrl,
  ItemActions,
  EmptyState,
  UploadBox,
  FormFieldGroup,
  FormPanel,
  FormPanelHeading,
  FormPanelActions,
  RowTone,
} from "./styles";

// lookup_data row: DOCUMENT_TYPE / OFFER_BENEFIT_IMAGE (id 30227)
const OFFER_BENEFIT_DOCUMENT_TYPE = "30227";
const TITLE_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 500;
const ROW_TONES: RowTone[] = ["blue", "green", "pink"];

/**
 * Offers & Benefits items live entirely in the parent's (PortalConfiguration)
 * in-memory state and are persisted only as part of the main portal PUT
 * (companyPortalConfig save) — there is no dedicated instant-save API call
 * from this tab. `localKey` is a stable client-side identity for items that
 * haven't been saved yet (and therefore have no `id`).
 */
export interface OfferBenefitItem {
  id?: number;
  localKey: string;
  title: string;
  description: string;
  redirectionUrl: string;
  imageFileId: number | null;
  isEnabled: boolean;
  displayOrder: number;
}

interface OffersAndBenefitsTabProps {
  companyId?: string | number | null;
  isEditMode?: boolean;
  items: OfferBenefitItem[];
  onItemsChange: (items: OfferBenefitItem[]) => void;
  sectionEnabled: boolean;
  onSectionEnabledChange: (enabled: boolean) => void;
}

const makeLocalKey = () => `local-${Math.random().toString(36).slice(2)}`;

const ItemThumbnail: React.FC<{ imageFileId: number; alt: string }> = ({ imageFileId, alt }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    let objectUrl: string | null = null;

    const load = async () => {
      try {
        const response = await apiRequest(endPoints.fileUploadDownloadById(imageFileId), {
          method: "GET",
          responseType: "blob",
        });
        if (isCancelled) return;
        objectUrl = URL.createObjectURL(response.data as Blob);
        setPreviewUrl(objectUrl);
      } catch {
        if (!isCancelled) setPreviewUrl(null);
      }
    };

    void load();

    return () => {
      isCancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [imageFileId]);

  if (!previewUrl) {
    return (
      <Typography variant="caption" sx={{ color: "grey.600" }}>
        …
      </Typography>
    );
  }

  return <Box component="img" src={previewUrl} alt={alt} />;
};

const stripProtocol = (value: string): string =>
  value.replace(/^https?:\/\//i, "");

const withHttpsProtocol = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

const isValidHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(withHttpsProtocol(value));
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

interface OfferBenefitFormSectionProps {
  item: OfferBenefitItem | null;
  companyId: number;
  onClose: () => void;
  onSave: (item: OfferBenefitItem) => void;
}

const OfferBenefitFormSection = React.forwardRef<HTMLDivElement, OfferBenefitFormSectionProps>(({
  item,
  companyId,
  onClose,
  onSave,
}, ref) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const localKeyRef = useRef(item?.localKey ?? makeLocalKey());
  const [title, setTitle] = useState(item?.title ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [redirectionUrl, setRedirectionUrl] = useState(
    item?.redirectionUrl ? stripProtocol(item.redirectionUrl) : ""
  );
  const [imageFile, setImageFile] = useState<UploadedFile | null>(
    item?.imageFileId
      ? ({ id: item.imageFileId, fileName: "", fileBuffer: "" } as UploadedFile)
      : null
  );
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  const {
    handleFileChange: uploadFileChange,
    loading: isUploading,
  } = useFileUpload(undefined, endPoints.fileUpload, false);

  useEffect(() => {
    let isCancelled = false;
    let objectUrl: string | null = null;

    const loadPreview = async () => {
      if (!imageFile?.id) {
        setImagePreviewUrl(null);
        return;
      }
      try {
        const response = await apiRequest(
          endPoints.fileUploadDownloadById(imageFile.id),
          { method: "GET", responseType: "blob" }
        );
        if (isCancelled) return;
        objectUrl = URL.createObjectURL(response.data as Blob);
        setImagePreviewUrl(objectUrl);
      } catch {
        if (!isCancelled) setImagePreviewUrl(null);
      }
    };

    loadPreview();

    return () => {
      isCancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [imageFile]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    uploadFileChange(
      event,
      `${companyId}-offer-benefit`,
      companyId,
      OFFER_BENEFIT_DOCUMENT_TYPE,
      (uploaded) => setImageFile(uploaded)
    );
  };

  const titleError = showErrors && !title.trim();
  const descriptionError = showErrors && !description.trim();
  const urlError = showErrors && !isValidHttpUrl(redirectionUrl.trim());

  const handleSave = () => {
    setShowErrors(true);
    if (!title.trim() || !description.trim() || !isValidHttpUrl(redirectionUrl.trim())) {
      return;
    }

    onSave({
      id: item?.id,
      localKey: localKeyRef.current,
      title: title.trim(),
      description: description.trim(),
      redirectionUrl: withHttpsProtocol(redirectionUrl),
      imageFileId: imageFile?.id ?? null,
      isEnabled: item?.isEnabled ?? true,
      displayOrder: item?.displayOrder ?? 0,
    });
  };

  return (
    <FormPanel ref={ref}>
      <FormPanelHeading>{item ? "Edit Offer/Benefit" : "Add Offer/Benefit"}</FormPanelHeading>
      <FormFieldGroup>
        <Box>
          <Typography variant="body2" fontWeight={500} mb={1}>
            Image
          </Typography>
          <UploadBox onClick={() => fileInputRef.current?.click()}>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
              onChange={handleImageChange}
            />
            {isUploading ? (
              <Box display="flex" alignItems="center" justifyContent="center" minHeight={120} gap={1}>
                <CircularProgress size={20} />
                <Typography variant="body2">Uploading...</Typography>
              </Box>
            ) : imagePreviewUrl ? (
              <Box
                component="img"
                src={imagePreviewUrl}
                alt="Offer/benefit preview"
                sx={{ maxWidth: "100%", maxHeight: 160, objectFit: "contain", display: "block", margin: "0 auto" }}
              />
            ) : (
              <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight={120}>
                <UploadIcon sx={{ fontSize: 36, color: "grey.400", mb: 1 }} />
                <Typography variant="body2" fontWeight={500}>
                  Click to upload image
                </Typography>
              </Box>
            )}
          </UploadBox>
        </Box>

        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" fontWeight={500}>
              Title
            </Typography>
            <Typography variant="caption">
              {title.length}/{TITLE_MAX_LENGTH}
            </Typography>
          </Box>
          <TextField
            fullWidth
            size="small"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            inputProps={{ maxLength: TITLE_MAX_LENGTH }}
            error={titleError}
          />
          {titleError && (
            <Typography variant="caption" color="error">
              Title is required.
            </Typography>
          )}
        </Box>

        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" fontWeight={500}>
              Description
            </Typography>
            <Typography variant="caption">
              {description.length}/{DESCRIPTION_MAX_LENGTH}
            </Typography>
          </Box>
          <TextField
            fullWidth
            multiline
            rows={3}
            size="small"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            inputProps={{ maxLength: DESCRIPTION_MAX_LENGTH }}
            error={descriptionError}
          />
          {descriptionError && (
            <Typography variant="caption" color="error">
              Description is required.
            </Typography>
          )}
        </Box>

        <Box>
          <Typography variant="body2" fontWeight={500} mb={1}>
            Redirection URL
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="example.com"
            value={redirectionUrl}
            onChange={(e) => setRedirectionUrl(e.target.value)}
            error={urlError}
          />
          {urlError ? (
            <Typography variant="caption" color="error">
              Enter a valid website (e.g. example.com).
            </Typography>
          ) : (
            <Typography variant="caption" sx={{ color: "grey.600" }}>
              Enter just the website, e.g. example.com — https:// is added automatically.
            </Typography>
          )}
        </Box>
      </FormFieldGroup>

      <FormPanelActions>
        <Button variantType="secondary" sizeType="small" onClick={onClose}>
          Cancel
        </Button>
        <Button variantType="primary" sizeType="small" onClick={handleSave}>
          {item ? "Save" : "Add"}
        </Button>
      </FormPanelActions>
    </FormPanel>
  );
});

OfferBenefitFormSection.displayName = "OfferBenefitFormSection";

export const OffersAndBenefitsTab: React.FC<OffersAndBenefitsTabProps> = ({
  companyId,
  isEditMode,
  items,
  onItemsChange,
  sectionEnabled,
  onSectionEnabledChange,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OfferBenefitItem | null>(null);
  const formSectionRef = useRef<HTMLDivElement | null>(null);

  const numericCompanyId = Number(companyId);
  // Locked whenever the section is toggled off, or the tab itself is read-only
  const controlsDisabled = isEditMode === false || !sectionEnabled;

  useEffect(() => {
    if (isFormOpen) {
      formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [isFormOpen, editingItem]);

  const handleToggleSectionEnabled = () => {
    const nextEnabled = !sectionEnabled;
    onSectionEnabledChange(nextEnabled);
    if (!nextEnabled) {
      // Disabling the section closes any open add/edit form — it shouldn't
      // be possible to keep editing once the whole section is turned off.
      setIsFormOpen(false);
      setEditingItem(null);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item: OfferBenefitItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleFormSaved = (saved: OfferBenefitItem) => {
    const existingIndex = items.findIndex((it) => it.localKey === saved.localKey);
    let next: OfferBenefitItem[];
    if (existingIndex === -1) {
      next = [...items, { ...saved, displayOrder: items.length + 1 }];
    } else {
      next = items.map((it, index) =>
        index === existingIndex ? { ...saved, displayOrder: it.displayOrder } : it
      );
    }
    onItemsChange(next);
    setIsFormOpen(false);
    setEditingItem(null);
  };

  const handleDelete = (item: OfferBenefitItem) => {
    const next = items
      .filter((it) => it.localKey !== item.localKey)
      .map((it, index) => ({ ...it, displayOrder: index + 1 }));
    onItemsChange(next);
  };

  const handleToggleEnabled = (item: OfferBenefitItem) => {
    const next = items.map((it) =>
      it.localKey === item.localKey ? { ...it, isEnabled: !it.isEnabled } : it
    );
    onItemsChange(next);
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const reordered = [...items];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    onItemsChange(reordered.map((entry, position) => ({ ...entry, displayOrder: position + 1 })));
  };

  return (
    <TabContainer>
      <HeaderRow>
        <Box>
          <SectionHeading>Offers & Benefits</SectionHeading>
          <SectionSubheading>
            Manage image, title, description, and redirection URL for each offer or benefit shown to employees.
          </SectionSubheading>
        </Box>
        <Box display="flex" alignItems="center" gap={3}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="body2" fontWeight={500}>
              {sectionEnabled ? "Enabled" : "Disabled"}
            </Typography>
            <Toggle
              checked={sectionEnabled}
              onChange={handleToggleSectionEnabled}
              disabled={isEditMode === false}
            />
          </Box>
          {isEditMode !== false && items.length > 0 && sectionEnabled && !isFormOpen && (
            <Button variantType="primary" sizeType="small" startIcon={<AddIcon />} onClick={handleAdd}>
              Add Offer/Benefit
            </Button>
          )}
        </Box>
      </HeaderRow>

      {items.length ? (
        <Box display="flex" flexDirection="column" gap={1.5}>
          {items.map((item, index) => {
            const tone = ROW_TONES[index % ROW_TONES.length];
            return (
            <ItemCard key={item.localKey} tone={tone}>
              <ItemThumb tone={tone}>
                {item.imageFileId ? (
                  <ItemThumbnail imageFileId={item.imageFileId} alt={item.title} />
                ) : (
                  <Typography variant="caption" sx={{ color: "grey.600" }}>
                    No image
                  </Typography>
                )}
              </ItemThumb>
              <ItemInfo>
                <ItemTitle>{item.title}</ItemTitle>
                <ItemUrl>{item.redirectionUrl}</ItemUrl>
              </ItemInfo>
              <ItemActions>
                <Toggle
                  checked={item.isEnabled}
                  onChange={() => handleToggleEnabled(item)}
                  disabled={controlsDisabled}
                />
                <IconButton
                  size="small"
                  onClick={() => handleMove(index, -1)}
                  disabled={controlsDisabled || index === 0}
                >
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleMove(index, 1)}
                  disabled={controlsDisabled || index === items.length - 1}
                >
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => handleEdit(item)} disabled={controlsDisabled}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => handleDelete(item)} disabled={controlsDisabled}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </ItemActions>
            </ItemCard>
            );
          })}
        </Box>
      ) : null}

      {items.length > 0 && isEditMode !== false && sectionEnabled && !isFormOpen && (
        <Box display="flex" justifyContent="center">
          <Button variantType="primary" sizeType="small" startIcon={<AddIcon />} onClick={handleAdd}>
            Add Offer/Benefit
          </Button>
        </Box>
      )}

      {items.length === 0 && (
        <EmptyState>
          <Typography variant="body2">No offers or benefits added yet.</Typography>
          {isEditMode !== false && sectionEnabled && !isFormOpen && (
            <Box mt={2}>
              <Button variantType="primary" sizeType="small" startIcon={<AddIcon />} onClick={handleAdd}>
                Add Offer/Benefit
              </Button>
            </Box>
          )}
        </EmptyState>
      )}

      {isFormOpen && sectionEnabled && Number.isFinite(numericCompanyId) && (
        <OfferBenefitFormSection
          key={editingItem?.localKey ?? "new"}
          ref={formSectionRef}
          item={editingItem}
          companyId={numericCompanyId}
          onClose={() => {
            setIsFormOpen(false);
            setEditingItem(null);
          }}
          onSave={handleFormSaved}
        />
      )}
    </TabContainer>
  );
};

export default OffersAndBenefitsTab;
