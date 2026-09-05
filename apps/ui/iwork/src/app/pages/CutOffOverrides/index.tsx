import React, { useEffect, useMemo, useState } from "react";
import {
  ALERT_MESSAGES,
  Button,
  CustomModal,
  endPoints,
  FeatureKey,
  FormFieldConfig,
  HTTP_METHODS,
  MultiSelect,
  selectHasPermission,
  SelectField,
  setToastMessage,
  SUCCESS_MESSAGE,
  Table,
  TextAreaField,
  TreeSelect,
  useApiMutation,
  useApiQuery,
} from "@ui/ui-lib";
import dayjs from "dayjs";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { CUT_OFF_UI, TABLE_CONTROLLER_ENTITY_KEY } from "../../constants";
import {
  blockedSlipsField,
  durationField,
  flowField,
  getColumns,
  isOverrideRevocable,
  OverrideRow,
  reasonField,
  teamMemberField,
} from "./config";
import { ModalActions, ModalBody, PageContainer } from "./styles";

interface BlockedSlip {
  opportunityActivityId: number;
  opportunityId: number;
  plannedAt: string;
  cutOffAt: string;
}

// targetUserId holds the TreeSelect's { value, label } object (smart-search
// mode) so the field shows the member's name, not their id.
const defaultRaiseValues = () => ({
  targetUserId: null as { value: string; label: string } | null,
  flowType: CUT_OFF_UI.FLOW_TYPES[0],
  blockedSlips: [] as string[],
  durationDays: 1,
  reason: "",
});

const OPPORTUNITY_FLOW = CUT_OFF_UI.FLOW_TYPES[0];

const OverrideActionsRenderer: React.FC<{
  params: { data: OverrideRow };
  onRevoke: (row: OverrideRow) => void;
}> = ({ params, onRevoke }) =>
  isOverrideRevocable(params.data) ? (
    <Button
      variantType="secondary"
      size="small"
      onClick={() => onRevoke(params.data)}
    >
      Revoke
    </Button>
  ) : null;

const CutOffOverrides: React.FC = () => {
  const dispatch = useDispatch();
  const [isRaiseOpen, setIsRaiseOpen] = useState(false);
  const [columnOrder, setColumnOrder] = useState<any[]>([]);
  const {
    control,
    watch,
    setValue,
    trigger,
    getValues,
    reset,
  } = useForm({
    defaultValues: defaultRaiseValues(),
  });

  // Reset to a clean, pre-filled form each time the modal opens.
  useEffect(() => {
    if (isRaiseOpen) reset(defaultRaiseValues());
  }, [isRaiseOpen, reset]);

  const selectedUser = watch("targetUserId");
  const selectedFlow = watch("flowType");
  const isOpportunityFlow = selectedFlow === OPPORTUNITY_FLOW;
  const targetUserIdNum = selectedUser?.value ? Number(selectedUser.value) : 0;

  // Opportunity flow: load the selected member's blocked placement slips so the
  // manager picks the actual stuck opties (with dates) instead of guessing a month.
  const { data: blockedResponse } = useApiQuery({
    url: `${endPoints.cutOffBlockedActivities}?userId=${targetUserIdNum}`,
    queryKey: ["cut-off-blocked-activities", targetUserIdNum],
    enabled: isRaiseOpen && isOpportunityFlow && targetUserIdNum > 0,
  });
  const blockedSlips: BlockedSlip[] = useMemo(
    () => blockedResponse?.data ?? [],
    [blockedResponse]
  );

  // Build the multiselect options for the blocked-slip picker.
  const slipOptions = useMemo(
    () =>
      blockedSlips.map((slip) => {
        const planned = slip.plannedAt ? dayjs(slip.plannedAt) : null;
        const plannedLabel =
          planned && planned.isValid() ? planned.format("DD/MM/YYYY") : "--";
        return {
          value: String(slip.opportunityActivityId),
          label: `OPP-${slip.opportunityId} (${plannedLabel})`,
        };
      }),
    [blockedSlips]
  );
  // Audit only: opportunity id per selected slip, sent as entityId on raise.
  const slipOpportunityById = useMemo(
    () =>
      Object.fromEntries(
        blockedSlips.map((slip) => [
          String(slip.opportunityActivityId),
          slip.opportunityId,
        ])
      ),
    [blockedSlips]
  );
  const optyPickerField = useMemo<FormFieldConfig>(
    () => ({ ...blockedSlipsField, options: slipOptions }),
    [slipOptions]
  );

  const canRevoke = useSelector((state: any) =>
    selectHasPermission(FeatureKey.REVOKE_CUT_OFF_OVERRIDE)(state)
  );

  const {
    data: overridesResponse,
    refetch,
    isLoading,
  } = useApiQuery({
    url: endPoints.cutOffOverride,
    queryKey: ["cut-off-overrides"],
  });
  const overrides: OverrideRow[] = overridesResponse?.data ?? [];

  const mutation = useApiMutation({
    config: {
      onSuccess: async (response: any) => {
        dispatch(setToastMessage(response?.message || SUCCESS_MESSAGE));
        setIsRaiseOpen(false);
        reset(defaultRaiseValues());
        refetch();
      },
      onError: async (error: any) => {
        const errorMessage = Array.isArray(error?.message)
          ? error.message[0]
          : error?.message ?? ALERT_MESSAGES.GENERIC_ERROR;
        dispatch(setToastMessage(errorMessage));
      },
    },
  });

  const handleRaise = () => {
    const values = getValues();
    const targetUserId = values.targetUserId
      ? Number(values.targetUserId.value)
      : NaN;
    if (!targetUserId || !values.reason?.trim()) {
      dispatch(setToastMessage(CUT_OFF_UI.RAISE_VALIDATION_MESSAGE));
      return;
    }
    // Opportunity flow is opty-scoped: send every picked slip's opportunity id;
    // the backend raises one override per opty. At least one is required.
    const entityIds = (values.blockedSlips ?? [])
      .map((slipId) => slipOpportunityById[slipId])
      .filter((id): id is number => id != null);
    const isOpportunity = values.flowType === OPPORTUNITY_FLOW;
    if (isOpportunity && !entityIds.length) {
      dispatch(setToastMessage(CUT_OFF_UI.RAISE_VALIDATION_MESSAGE));
      return;
    }
    mutation.mutate({
      endpoint: endPoints.cutOffOverride,
      method: HTTP_METHODS.POST,
      data: {
        targetUserId,
        flowType: values.flowType,
        reason: values.reason.trim(),
        durationDays: Number(values.durationDays) || 1,
        ...(isOpportunity ? { entityIds } : {}),
      },
    });
  };

  const handleRevoke = (row: OverrideRow) => {
    mutation.mutate({
      endpoint: endPoints.cutOffOverrideById(row.id),
      method: HTTP_METHODS.DELETE,
    });
  };

  const columns = useMemo(() => getColumns(canRevoke), [canRevoke]);

  return (
    <PageContainer>
      <Table
        title={CUT_OFF_UI.OVERRIDES_TITLE}
        columns={columns}
        rowData={overrides}
        totalRows={overrides.length}
        currentPage={1}
        loading={isLoading}
        setCurrentPage={() => undefined}
        pageSize={overrides.length || 10}
        pageSizeOptions={[10, 25, 50]}
        setPageSize={() => undefined}
        onCellClicked={() => undefined}
        setSort={() => undefined}
        hidePagination
        height={520}
        emptyDataMessage={CUT_OFF_UI.OVERRIDES_EMPTY}
        primaryActionLabel={CUT_OFF_UI.RAISE_ACTION_LABEL}
        onPrimaryActionClick={() => setIsRaiseOpen(true)}
        primaryActionPermission={FeatureKey.RAISE_CUT_OFF_OVERRIDE}
        entityKey={TABLE_CONTROLLER_ENTITY_KEY.cutOffOverridesEntity}
        columnOrder={columnOrder}
        setColumnOrder={setColumnOrder}
        refetch={refetch}
        components={{
          OverrideActionsRenderer: (params: any) => (
            <OverrideActionsRenderer params={params} onRevoke={handleRevoke} />
          ),
        }}
      />
      <CustomModal
        open={isRaiseOpen}
        handleClose={() => setIsRaiseOpen(false)}
        heading={CUT_OFF_UI.RAISE_MODAL_HEADING}
      >
        <ModalBody>
          <TreeSelect
            field={teamMemberField}
            control={control}
            watch={watch}
            setValue={setValue}
            trigger={trigger}
            enableSmartSearch
          />
          <SelectField
            field={flowField}
            control={control}
            watch={watch}
            setValue={setValue}
            trigger={trigger}
          />
          {isOpportunityFlow && targetUserIdNum > 0 && (
            <MultiSelect
              field={optyPickerField}
              control={control}
              watch={watch}
              setValue={setValue}
              trigger={trigger}
            />
          )}
          <SelectField
            field={durationField}
            control={control}
            watch={watch}
            setValue={setValue}
            trigger={trigger}
          />
          <TextAreaField
            field={reasonField}
            control={control}
            watch={watch}
            setValue={setValue}
            trigger={trigger}
          />
          <ModalActions>
            <Button variantType="secondary" onClick={() => setIsRaiseOpen(false)}>
              Cancel
            </Button>
            <Button
              variantType="primary"
              onClick={handleRaise}
              disabled={mutation.isPending}
            >
              Raise
            </Button>
          </ModalActions>
        </ModalBody>
      </CustomModal>
    </PageContainer>
  );
};

export default CutOffOverrides;
