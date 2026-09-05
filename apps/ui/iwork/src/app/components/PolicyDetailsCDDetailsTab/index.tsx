import {
  endPoints,
  useTableController,
  Table,
  useLocalization,
  ChipRenderer,
  formatCurrencyByLocalization,
  apiRequest,
  BALANCE_UPDATE_SUCCESS_MESSAGE,
  BALANCE_UPDATE_ERROR_MESSAGE,
  NestedDynamicForm,
  Button,
  setToastMessage,
  SUCCESS_MESSAGE,
  useApiMutation,
  SAVE,
  CANCEL,
  formatDate,
} from "@ui/ui-lib";
import WatchLaterIcon from "@mui/icons-material/WatchLater";
import { ALERT_MESSAGES } from "../../constants/index";
import { cdDetailsColumns, cdDetailsFormConfig } from "./config";
import { useParams } from "react-router-dom";
import React, { useCallback, useRef, useState, useEffect } from "react";
import type { NestedGroupedDataCollectionHandle } from "@ui/ui-lib";
import type { ICellRendererParams } from "ag-grid-community";
import { Box, Tooltip, Typography } from "@mui/material";
import type { LocalizationConfig } from "@ui/ui-lib";
import {
  AccountEditContainer,
  BalanceContainer,
  BalanceValue,
  ButtonsContainer,
  CDAccountNumberContainer,
  Container,
  ContainerCDDetailsHeader,
  FormContainer,
  FormFieldContainer,
  RecentlyUpdatedContainer,
  StyledTypography,
  TableWrapper,
} from "./styles";
import { useDispatch } from "react-redux";

type BalanceAmountRendererParams = ICellRendererParams & {
  localization?: LocalizationConfig;
};

// Renderer for Balance with Edit Icon
const BalanceAmountRenderer: React.FC<BalanceAmountRendererParams> = (
  params
) => {
  const { value, localization, valueFormatted } = params;

  const formattedValue = React.useMemo(() => {
    if (valueFormatted) return valueFormatted;
    if (value === null || value === undefined || value === "") return "--";

    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return `${value}`;
    return formatCurrencyByLocalization(numericValue, localization);
  }, [localization, value, valueFormatted]);

  return (
    <BalanceContainer>
      <BalanceValue component="span">{formattedValue}</BalanceValue>
    </BalanceContainer>
  );
};

// Renderer for Transaction Details
export const TransationDetailsRenderer = ({ data }: any) => {
  const { bankName, ifscCode, chequeNumber, chequeDate } = data || {};
  const details: string[] = [];

  if (bankName) details.push(`Bank name: ${bankName}`);
  if (ifscCode) details.push(`IFSC code: ${ifscCode}`);
  if (chequeNumber) details.push(`Cheque No: ${chequeNumber}`);
  if (chequeDate) details.push(`Cheque date: ${formatDate(chequeDate)}`);

  const result = details.join(", ");
  return <>{result || "--"}</>;
};

interface PolicyDetailsCDDetailsTabProps {
  isEditButtonVisible: boolean;
  onEditStateChange?: (isEditing: boolean) => void;
}

// Main Component
const PolicyDetailsCDDetailsTab = ({
  isEditButtonVisible,
  onEditStateChange,
}: PolicyDetailsCDDetailsTabProps) => {
  const { id: policyId } = useParams();
  const { localizationData } = useLocalization();
  const columns = React.useMemo(
    () => cdDetailsColumns(localizationData?.data),
    [localizationData]
  );

  const formRef = useRef<NestedGroupedDataCollectionHandle>(null);
  const [selectedRowData, setSelectedRowData] = useState<any>(null);
  const [loadingOfFetc, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    return () => {
      onEditStateChange?.(false);
    };
  }, [onEditStateChange]);

  const dispatch = useDispatch();
  const mutation = useApiMutation({
    config: {
      onSuccess: async (response) => {
        setLoading(false);
        dispatch(setToastMessage(response?.message || SUCCESS_MESSAGE));
        setShowForm(false);
        onEditStateChange?.(false);
        refreshData();
      },
      onError: async (error) => {
        setLoading(false);
        const errorMessage = Array.isArray(error?.message)
          ? error.message[0]
          : error?.message ?? ALERT_MESSAGES.GENERIC_ERROR;
        dispatch(setToastMessage(errorMessage));
        console.error("Account number update failed:", error);
      },
    },
  });

  // Table Controller
  const {
    rowData,
    totalRows,
    currentPage,
    loading,
    setCurrentPage,
    pageSize,
    setPageSize,
    PAGE_SIZE_OPTIONS,
    setSort,
    refetch: refreshData,
  } = useTableController({
    endpoint: endPoints.getCdDetailsByPolicyId(Number(policyId)),
  });

  // Handle Edit click
  const handleEditClick = useCallback(() => {
    if (rowData && rowData.length > 0) {
      setSelectedRowData(rowData[0]); // All rows share same cdAccountNumber
      setShowForm(true);
      onEditStateChange?.(true);
    }
  }, [onEditStateChange, rowData]);

  // Populate form when Edit is clicked
  useEffect(() => {
    if (selectedRowData && formRef.current) {
      formRef.current.resetForms({
        accountBasicDetails: {
          accountNumber: selectedRowData.cdAccountNumber || "",
        },
      });
    }
  }, [selectedRowData]);

  // Submit form handler
  const handleSubmitForm = useCallback(async () => {
    try {
      setLoading(true);
      const formData = await formRef?.current?.submitAll?.();
      if (!formData || !formData.isAllValid) return;
      if (formData.isAllValid) {
        const values = formData.result;
        mutation.mutate({
          endpoint: endPoints.accountNumberById(
            Number(selectedRowData?.cautionDepositId)
          ),
          method: "PUT",
          data: {
            cdAccountNumber: values?.accountBasicDetails?.accountNumber,
          },
        });
      }
    } catch (error) {
      console.error("Form submission error:", error);
      setLoading(false);
    }
  }, [mutation, selectedRowData]);

  // Cancel editing
  const handleCancel = () => {
    setShowForm(false);
    setSelectedRowData(null);
    onEditStateChange?.(false);
  };

  return (
    <Container>
      {/* CD Account Number Header */}
      <ContainerCDDetailsHeader>
        <CDAccountNumberContainer>
          <StyledTypography>CD account number: </StyledTypography>
          {!showForm ? (
            <AccountEditContainer>
              <Typography component="span">
                {rowData?.[0]?.cdAccountNumber || "--"}
              </Typography>
              {isEditButtonVisible && (
                <Button
                  variantType="link"
                  sizeType="small"
                  type="button"
                  onClick={handleEditClick}
                >
                  Edit
                </Button>
              )}
              {rowData?.[0]?.recentlyUpdated && (
                <RecentlyUpdatedContainer>
                  <WatchLaterIcon
                    style={{ fontSize: 20, color: "red", marginRight: 4 }}
                  />
                  <Typography>Recently updated</Typography>
                </RecentlyUpdatedContainer>
              )}
            </AccountEditContainer>
          ) : (
            <FormContainer>
              <FormFieldContainer style={{ width: "100%" }}>
                <NestedDynamicForm
                  config={[cdDetailsFormConfig]}
                  ref={formRef}
                  disableAllFormFields={false}
                />
              </FormFieldContainer>
              <ButtonsContainer>
                <Button
                  variantType="primary"
                  sizeType="small"
                  type="button"
                  onClick={handleSubmitForm}
                  loading={loadingOfFetc}
                  disabled={loadingOfFetc}
                >
                  {SAVE}
                </Button>
                <Button
                  variantType="secondary"
                  sizeType="small"
                  type="button"
                  onClick={handleCancel}
                >
                  {CANCEL}
                </Button>
              </ButtonsContainer>
            </FormContainer>
          )}
        </CDAccountNumberContainer>
        <StyledTypography>
          Insurer Invoice Number: {rowData?.[0]?.cdAccountName || "--"}{" "}
        </StyledTypography>
      </ContainerCDDetailsHeader>

      {/* Editable Form */}

      {/* Transaction Table */}
      <TableWrapper>
        <StyledTypography>Transaction history</StyledTypography>
        <Table
          columns={columns}
          rowData={rowData}
          totalRows={totalRows}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          loading={loading}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          setPageSize={setPageSize}
          onCellClicked={() => {}}
          setSort={setSort}
          title=""
          components={{
            TransationDetailsRenderer,
            ChipRenderer,
            BalanceAmountRenderer,
          }}
        />
      </TableWrapper>
    </Container>
  );
};

export default PolicyDetailsCDDetailsTab;
