import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Table,
  useTableController,
  SmartSearch,
  CardBackground,
  endPoints,
  SEARCH_EMPLOYEE_INSURED_NAME,
  apiRequest,
  setToastMessage,
  FeatureKey,
  useLocalization,
  useHasPermission,
} from "@ui/ui-lib";
import { environment } from "@ui/ui-lib/environment";
import type { LocalizationConfig } from "@ui/ui-lib/utils";
import { useForm } from "react-hook-form";
import { useFormWatcher } from "@ui/ui-lib/hooks";
import { insuredDetailsSmartSearchConfig } from "../../pages/CompanyPage/PolicyDetails/formConfig";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { DOWNLOAD_DETAILS, EMPLOYEE_INSURED_DETAILS, TABLE_CONTROLLER_ENTITY_KEY, EMPLOYEE_DOWNLOAD_MESSAGE,DOWNLOAD_FAILED_TRY_AGAIN, EMPLOYEE_DOWNLOAD_MESSAGE_SUCCESS,TOAST_DURATION } from "../../constants";

interface InsuredDetailsTableProps {
  isGroupPolicyType: boolean;
  policyId: number;
  columns: (navigate?: any, policyId?: number, localization?: LocalizationConfig) => any[];
  policyFrom?: string | Date | null;
  policyTo?: string | Date | null;
}

const defaultValues = {
  employeeId: "",
  relationshipGroup: "",
  claimsStatus: "",
  effectiveFrom: "",
  effectiveTo: "",
  iirmPolicyId: "",
  insurerEndorsementNumber: "",
  insurerEndorsementDate: "",
  tpaId: "",
  endorsementId: "",
  insuredStatus: "",
};

const InsuredDetailsTable: React.FC<InsuredDetailsTableProps> = ({
  isGroupPolicyType,
  policyId,
  columns,
  policyFrom,
  policyTo,
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const hasRbacPermission = useHasPermission(FeatureKey.DOWNLOAD_EMPLOYEE_DETAILS);
  const isDownloadAllowed = !environment.featureFlag.FF_IWORK_DOCUMENT_DOWNLOAD || hasRbacPermission;
  const [skipQuery, setSkipQuery] = useState(true);
  const { localizationData } = useLocalization();

  const systemSmartSearchDefaultValues = useSelector(
    (state: any) =>
      state.user.systemDefaultConfig?.smartSearchValues?.[
        TABLE_CONTROLLER_ENTITY_KEY.employeeInsuredEntity
      ]
  );
  const userSmartSearchDefaultValues = useSelector(
    (state: any) =>
      state.user.userDefaultConfig?.smartSearchValues?.[
        TABLE_CONTROLLER_ENTITY_KEY.employeeInsuredEntity
      ]
  );

  const defaultSmartSearchValues =
    userSmartSearchDefaultValues || systemSmartSearchDefaultValues || {};
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
    setSearchTerm,
    setSmartSearch,
    setColumnOrder,
    columnOrder,
  } = useTableController({
    endpoint: endPoints.getInstallmentDetailsByPolicyId(Number(policyId)),
    customPathParam: `section=employeeInsured`,
    searchFieldName: "insuredName",
    enabled: !skipQuery,
    entityKey: TABLE_CONTROLLER_ENTITY_KEY.employeeInsuredEntity,
  });

  const [formMethods, setFormMethods] = useState<ReturnType<typeof useForm>>();

  const { selectedValues, handleReset } = useFormWatcher({
    formMethods,
    setSearchTerm,
    searchFieldName: "insuredName",
    searchDefaultValues: systemSmartSearchDefaultValues,
    entityKey: TABLE_CONTROLLER_ENTITY_KEY.employeeInsuredEntity,
    columnOrder,
    dispatch,
  });

  const handleRun = useCallback(() => {
    if (formMethods) {
      setSmartSearch(formMethods.getValues());
    }
  }, [formMethods, setSmartSearch]);

  useEffect(() => {
    if (formMethods && skipQuery) {
      const nextDefaults =
        Object.keys(defaultSmartSearchValues).length > 0
          ? defaultSmartSearchValues
          : defaultValues;
      formMethods.reset(nextDefaults);
      setSmartSearch(nextDefaults);
      setSkipQuery(false);
    }
  }, [formMethods, skipQuery, defaultSmartSearchValues, setSmartSearch]);

  const validateFilterValue = (value: any): boolean => {
    if (
      value === null ||
      value === undefined ||
      value === "" ||
      value === "All"
    ) {
      return false;
    }
    return true;
  };

  const handleDownloadReport = useCallback(async () => {
    try {
      dispatch(
        setToastMessage({
          message: EMPLOYEE_DOWNLOAD_MESSAGE,
          duration: TOAST_DURATION,
        })
      );

      const search = Object.entries(selectedValues || {})
        .map(([key, rawValue]) => {
          try {
            const value = Array.isArray(rawValue)
              // multiselect may hold {value,label} options — send the ids
              ? rawValue.map((v: any) => (v?.value ?? v)).join(",")
              : typeof rawValue === "object" && rawValue !== null
              ? (rawValue as any).value
              : rawValue;

            if (!validateFilterValue(value)) {
              return null;
            }

            return `${key}:[${value}]`;
          } catch (error) {
            console.error("Error processing search parameter %s:", key, error);
            return null;
          }
        })
        .filter(Boolean)
        .join(",");

      const downloadUrl = `${endPoints.employeeInsuredExcel(policyId)}${
        search ? `?search=${search}` : ""
      }`;

      const response = await apiRequest(downloadUrl, { method: "GET" });

      if (response.status !== 200 || !response?.data) {
        dispatch(setToastMessage(DOWNLOAD_FAILED_TRY_AGAIN));
        return;
      }

      const url = response.data;
      const link = document.createElement("a");
      link.href = url;
      link.download = `employee_insured_${policyId}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      dispatch(setToastMessage(EMPLOYEE_DOWNLOAD_MESSAGE_SUCCESS));
    } catch (error) {
      console.error("Download error:", error);
      dispatch(setToastMessage(DOWNLOAD_FAILED_TRY_AGAIN));
    }
  }, [dispatch, policyId, selectedValues]);

  const emptyMessage = isGroupPolicyType
    ? "No employee insured data available"
    : "No asset insured data available";

  // Memoize columns to prevent recreation on every render
  const tableColumns = useMemo(
    () => columns(navigate, policyId, localizationData?.data),
    [columns, navigate, policyId, localizationData]
  );

  return (
    <>
      <CardBackground>
        <SmartSearch
          searchFormConfig={insuredDetailsSmartSearchConfig(
            policyFrom,
            policyTo,
            formMethods?.watch
          )}
          searchDefaultValues={defaultValues}
          searchFormMethods={setFormMethods}
          selectedValues={selectedValues}
          onReset={handleReset}
          formMethods={formMethods}
          searchFieldName="insuredName"
          placeholder={SEARCH_EMPLOYEE_INSURED_NAME}
          enableSmartSearch={true}
          onRunFilters={handleRun}
        />
      </CardBackground>
      <Table
        columns={tableColumns}
        rowData={rowData}
        totalRows={totalRows}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        loading={loading}
        pageSize={pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        setPageSize={setPageSize}
        setSort={setSort}
        emptyDataMessage={emptyMessage}
        title={EMPLOYEE_INSURED_DETAILS}
        primaryActionLabel={isDownloadAllowed ? DOWNLOAD_DETAILS : undefined}
        onPrimaryActionClick={isDownloadAllowed ? handleDownloadReport : undefined}
        primaryActionPermission={FeatureKey.DOWNLOAD_EMPLOYEE_DETAILS}
        setColumnOrder={setColumnOrder}
        columnOrder={columnOrder}
        entityKey={TABLE_CONTROLLER_ENTITY_KEY.employeeInsuredEntity}
        selectedFilterValues={selectedValues}
      />
    </>
  );
};

export default InsuredDetailsTable;
