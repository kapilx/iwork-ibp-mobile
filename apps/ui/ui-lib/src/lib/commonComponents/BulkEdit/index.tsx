import { ButtonContainer, Container, MainContainer } from "./styles";
import { useEffect, useMemo, useRef, useState } from "react";
import Button from "../Button";
import NestedDynamicForm, {
  NestedGroupedDataCollectionHandle,
} from "../NestedDynamicForm";
import { bulkEditConfig } from "./config";
import { CANCEL, endPoints, HTTP_METHODS, SUBMIT } from "@ui/ui-lib/constants";
import { useApiMutation } from "@ui/ui-lib/hooks";
import { setToastMessage } from "@ui/ui-lib/redux";
import { useDispatch } from "react-redux";
import CustomModal from "../Modal";
import { formatNumberByLocalization } from "@ui/ui-lib/utils";
import { formatDate } from "@ui/ui-lib/utils";

interface BulkEditSelectionState {
  selectedAll: boolean;
  includedIds: Array<string | number>;
  excludedIds: Array<string | number>;
  selectedCount?: number;
}

interface Props {
  onClose?: () => void;
  onSuccess?: () => void;
  defaultValues?: any;
  selectionState?: BulkEditSelectionState;
  entityKey?: string;
  refetch?: () => Promise<unknown> | void;
  totalRows: number;
  pageSize: number;
}

const BulkEdit: React.FC<Props> = ({
  onClose,
  onSuccess,
  defaultValues,
  selectionState,
  entityKey,
  refetch,
  totalRows,
  pageSize,
}) => {
  const formRef = useRef<NestedGroupedDataCollectionHandle>(null);
  const dispatch = useDispatch();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [formValues, setFormValues] = useState<any>(null);

  const selectionPayload = useMemo(() => {
    const selectedAll = selectionState?.selectedAll ?? false;
    const recordIds = selectionState?.includedIds ?? [];
    const excludedIds = selectionState?.excludedIds ?? [];

    if (selectedAll) {
      const filteredDefaultValues = Object.fromEntries(
        Object.entries(defaultValues || {}).filter(
          ([, value]) => value !== "" && value !== null
        )
      );

      return {
        selectedAll: totalRows <= pageSize ? false : true,
        recordIds: [],
        excludedIds,
        selectedFilterValues: filteredDefaultValues,
        ...(totalRows <= pageSize && { recordIds }),
      };
    }

    return {
      selectedAll: false,
      recordIds,
      excludedIds: [],
      selectedFilterValues: {},
    };
  }, [selectionState, totalRows, pageSize]);

  const { mutate, isPending } = useApiMutation({
    config: {
      onSuccess: async (response: {
        statusCode?: number;
        message?: string;
      }) => {
        if (response?.statusCode === 200) {
          await refetch?.();
          onSuccess?.();
          setShowConfirmModal(false);
          dispatch(setToastMessage(response?.message || "Saved successfully"));
        } else {
          dispatch(setToastMessage(response?.message || "Saved successfully"));
        }
        onClose?.();
      },
      onError: async (error: { message?: string | string[] }) => {
        const errorMessage =
          Array.isArray(error?.message) && error.message.length > 0
            ? error.message[0]
            : error?.message ?? "Something went wrong. Try again.";
        dispatch(setToastMessage(errorMessage));
      },
    },
  });

  const handleSubmit = async () => {
    const allValues = await formRef.current?.submitAll?.();
    const { owners, additionalInfo } = allValues?.result || {};

    mutate({
      endpoint: endPoints.bulkEdit,
      method: HTTP_METHODS.POST,
      data: {
        entityType: entityKey,
        ...selectionPayload,
        fieldUpdates: {
          ...Object.fromEntries(
            Object.entries(owners || {}).map(([key, obj]) => [
              key,
              obj?.value ?? obj,
            ])
          ),
          ...Object.fromEntries(
            Object.entries(additionalInfo || {}).map(([key, obj]) => [
              key,
              obj?.value ?? obj,
            ])
          ),
        },
      },
    });
  };

  const handleSubmitClick = async () => {
    const allValues = await formRef.current?.submitAll?.();
    if (!allValues?.isAllValid) {
      dispatch(setToastMessage("Please fill all the required values."));
      return;
    }

    const hasAnyFieldFilled = Object.values(allValues?.result || {}).some(
      (group) =>
        group &&
        Object.values(group).some(
          (value) => value !== "" && value !== null && value !== undefined
        )
    );

    if (!hasAnyFieldFilled) {
      dispatch(setToastMessage("Please fill at least one field."));
      return;
    }

    setShowConfirmModal(true);
    const selectedValues = formRef.current?.getValues?.() || {};
    setFormValues({
      ...selectedValues?.owners,
      ...selectedValues?.additionalInfo,
    });
  };

  const selectedCount =
    selectionState?.selectedCount ??
    (selectionState?.selectedAll
      ? "all"
      : selectionState?.includedIds?.length ?? 0);

  const formValuesMap = {
    ownerId:
      entityKey === "SALES_OPPORTUNITY" || entityKey === "POLICY"
        ? "BD Owner"
        : "Lead CRM",
    isgId: "ISG Owner",
    amId: "Account manager",
    policyStatusLid: "Policy status",
    expiryDate: "Expiry date",
    statusLid: entityKey === "COMPANY" ? "Company status" : "Status",
    priorityLid: "Priority",
    leadCrm: "Lead CRM",
    accountManager: "Account manager",
  };

  useEffect(() => {
    console.log("owners", formValues);
  }, [formValues]);
  return (
    <>
      <Container>
        <MainContainer>
          <NestedDynamicForm
            config={bulkEditConfig(entityKey, defaultValues)}
            ref={formRef}
            disableAllFormFields={false}
          />
        </MainContainer>
        <ButtonContainer>
          <Button
            variantType="secondary"
            data-testid="insurer-acknowledgement-go-back-button"
            loadingPosition="start"
            className="button"
            sizeType="small"
            disabled={isPending}
            onClick={onClose}
          >
            {CANCEL}
          </Button>
          <Button
            onClick={handleSubmitClick}
            variantType="primary"
            data-testid="insurer-acknowledgement-create-button"
            loadingPosition="center"
            className="button"
            sizeType="small"
            // loading={isPending}
          >
            {SUBMIT}
          </Button>
        </ButtonContainer>
      </Container>

      <CustomModal
        open={showConfirmModal}
        handleClose={() => !isPending && setShowConfirmModal(false)}
        heading="Confirm Update"
        buttons={[
          {
            label: CANCEL,
            onClick: () => setShowConfirmModal(false),
            variant: "secondary" as const,
            disabled: isPending,
          },
          {
            label: "OK",
            onClick: handleSubmit,
            variant: "primary",
            disabled: isPending,
            loading: isPending,
          },
        ]}
      >
        <div>
          Are you sure you want to update{" "}
          {formatNumberByLocalization(selectedCount)} record
          {typeof selectedCount === "number" && selectedCount !== 1 ? "s" : ""}?
          {formValues && (
            <div style={{ marginTop: "16px" }}>
              <strong>Fields to be updated are:</strong>
              <ul>
                {Object.entries(formValues)
                  .filter(([_, value]) => {
                    if (value === null || value === "" || value === undefined)
                      return false;
                    if (
                      typeof value === "object" &&
                      Object.keys(value).length === 0
                    )
                      return false;
                    return true;
                  })
                  .map(([key, value]) => (
                    <li key={key}>
                      {formValuesMap[key as keyof typeof formValuesMap]}:{" "}
                      {key === "expiryDate" && value
                        ? formatDate(value, "DD/MM/YYYY")
                        : typeof value === "object" && value !== null
                        ? String(
                            value?.label ?? value?.value ?? "Value Selected"
                          )
                        : String(value)}
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      </CustomModal>
    </>
  );
};

export default BulkEdit;
