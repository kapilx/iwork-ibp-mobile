import { useCallback, useEffect, useMemo, useState } from "react";
import { Chip, Typography } from "@mui/material";
import {
  Button,
  CardBackground,
  DynamicForm,
  HTTP_METHODS,
  apiRequest,
  endPoints,
  setToastMessage,
  useApiMutation,
  useApiQuery,
} from "@ui/ui-lib";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import MappedCoversPanel from "./MappedCoversPanel";
import { MappedCover, SelectOption } from "../types";
import { mapCoverSelectionConfig } from "../coverFormConfig";
import { COVER_MASTER } from "../../../../constants";
import {
  ButtonRow,
  MappedHeader,
  SectionContainer,
  SectionDivider,
  SectionSubtitle,
  SectionTitle,
  TwoColumnLayout,
} from "../styles";

interface MapCoverStepProps {
  coversReloadKey?: number;
}

/**
 * Step 2 - Map a policy type (+ organisation) to covers, writing mstr_cover_template.
 * Selection fields are config-driven (DynamicForm); the Add button, mapped-covers
 * panel and Submit handle the interactive list. Carry-over fields are copied
 * server-side from mstr_cover.
 */
const MapCoverStep = ({ coversReloadKey }: MapCoverStepProps) => {
  const dispatch = useDispatch();
  const methods = useForm({ defaultValues: {}, mode: "onChange" });

  const organizationId = methods.watch("organizationId");
  const policyTypeId = methods.watch("policyTypeId");

  const [mapped, setMapped] = useState<MappedCover[]>([]);
  const [loadingMappings, setLoadingMappings] = useState(false);

  // Yes/No options sourced from the TOGGLE_TYPE lookup (mandatory is a varchar
  // storing the lookup value, so we use lookUpValue for both value and label).
  const { data: toggleData } = useApiQuery({
    url: endPoints.lookUpByName(COVER_MASTER.LOOKUPS.TOGGLE_TYPE),
    queryKey: ["lookup", COVER_MASTER.LOOKUPS.TOGGLE_TYPE],
  });
  const mandatoryOptions: SelectOption[] = useMemo(
    () =>
      (toggleData?.data || []).map((o: { lookUpValue: string }) => ({
        value: o.lookUpValue,
        label: o.lookUpValue,
      })),
    [toggleData]
  );

  // Load existing mappings for the chosen policy type + org.
  const loadMappings = useCallback(async () => {
    if (!policyTypeId || !organizationId) {
      setMapped([]);
      return;
    }
    setLoadingMappings(true);
    try {
      const res = await apiRequest(
        endPoints.coverTemplates(Number(policyTypeId), Number(organizationId)),
        { method: HTTP_METHODS.GET }
      );
      const rows: MappedCover[] = (res?.data?.data || []).map((r: any) => ({
        id: r.id,
        refCoverId: r.refCoverId,
        coverName: r.coverName,
        mandatory: r.mandatory || "Yes",
        visibleUntilActivityKey: r.visibleUntilActivityKey ?? null,
      }));
      setMapped(rows);
    } catch {
      // apiRequest -> handleApiError already surfaces the server message.
    } finally {
      setLoadingMappings(false);
    }
  }, [policyTypeId, organizationId]);

  useEffect(() => {
    loadMappings();
  }, [loadMappings]);

  const syncMutation = useApiMutation({
    config: {
      onSuccess: () => {
        dispatch(setToastMessage(COVER_MASTER.MESSAGES.MAPPINGS_SAVED));
        loadMappings();
      },
    },
  });

  const handleAdd = async () => {
    // Trigger RHF validation so the required-field errors surface on click.
    const isValid = await methods.trigger([
      "organizationId",
      "policyTypeId",
    ]);
    if (!isValid) return;
    const coverId = methods.getValues("coverId");
    const coverName = methods.getValues("coverName");
    if (!coverId) return;
    if (mapped.some((m) => m.refCoverId === Number(coverId))) {
      dispatch(setToastMessage(COVER_MASTER.MESSAGES.ALREADY_ADDED));
      return;
    }
    setMapped((prev) => [
      ...prev,
      {
        refCoverId: Number(coverId),
        coverName: coverName || `${COVER_MASTER.LABELS.COVER} ${coverId}`,
        mandatory: "Yes",
        visibleUntilActivityKey: null,
      },
    ]);
    methods.setValue("coverId", null);
    methods.setValue("coverName", "");
  };

  const handleRowChange = (refCoverId: number, patch: Partial<MappedCover>) => {
    setMapped((prev) =>
      prev.map((m) => (m.refCoverId === refCoverId ? { ...m, ...patch } : m))
    );
  };

  const handleRemove = (refCoverId: number) => {
    setMapped((prev) => prev.filter((m) => m.refCoverId !== refCoverId));
  };

  const handleReorder = (next: MappedCover[]) => {
    setMapped(next);
  };

  const canSubmit =
    !!organizationId &&
    !!policyTypeId &&
    mapped.length > 0 &&
    !syncMutation.isPending;

  const handleSubmit = () => {
    if (!canSubmit) return;
    syncMutation.mutate({
      endpoint: endPoints.coverTemplatesSync,
      method: HTTP_METHODS.POST,
      data: {
        policyTypeId: Number(policyTypeId),
        organizationId: Number(organizationId),
        // Display sequence is derived from the drag-and-drop order.
        covers: mapped.map((m, index) => ({
          refCoverId: m.refCoverId,
          mandatory: m.mandatory,
          displaySequence: index + 1,
          visibleUntilActivityKey: m.visibleUntilActivityKey ?? null,
        })),
      },
    });
  };

  return (
    <TwoColumnLayout>
      {/* Left: config-driven selection fields + Add */}
      <CardBackground>
        <SectionContainer>
          <SectionTitle variant="h6">
            {COVER_MASTER.TITLES.SELECT_ADD}
          </SectionTitle>
          <SectionSubtitle variant="body2">
            {COVER_MASTER.TITLES.SELECT_ADD_SUBTITLE}
          </SectionSubtitle>
          <SectionDivider />

          <DynamicForm
            key={coversReloadKey}
            formConfig={mapCoverSelectionConfig}
            externalMethods={methods}
          />
          <ButtonRow>
            <Button
              label={COVER_MASTER.BUTTONS.ADD}
              variantType="primary"
              onClick={handleAdd}
            />
          </ButtonRow>
        </SectionContainer>
      </CardBackground>

      {/* Right: mapped covers */}
      <CardBackground>
        <SectionContainer>
          <MappedHeader>
            <SectionTitle variant="h6">
              {COVER_MASTER.LABELS.MAPPED_COVERS}
            </SectionTitle>
            <Chip label={COVER_MASTER.COUNT_CHIP(mapped.length)} size="small" />
          </MappedHeader>
          <SectionSubtitle variant="body2">
            {COVER_MASTER.TITLES.MAPPED_SUBTITLE}
          </SectionSubtitle>
          <SectionDivider />

          {loadingMappings ? (
            <Typography variant="body2" color="text.secondary">
              {COVER_MASTER.MESSAGES.LOADING_MAPPED}
            </Typography>
          ) : (
            <MappedCoversPanel
              covers={mapped}
              mandatoryOptions={mandatoryOptions}
              onChange={handleRowChange}
              onRemove={handleRemove}
              onReorder={handleReorder}
            />
          )}

          <ButtonRow>
            <Button
              label={
                syncMutation.isPending
                  ? COVER_MASTER.BUTTONS.SAVING
                  : COVER_MASTER.BUTTONS.SUBMIT
              }
              variantType={canSubmit ? "primary" : "secondary"}
              disabled={!canSubmit}
              onClick={handleSubmit}
            />
          </ButtonRow>
        </SectionContainer>
      </CardBackground>
    </TwoColumnLayout>
  );
};

export default MapCoverStep;
