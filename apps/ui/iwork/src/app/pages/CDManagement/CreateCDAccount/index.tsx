import { useMemo, useRef, useState, useEffect } from "react";
import { FieldValues, useForm } from "react-hook-form";
import {
  Button,
  useApiMutation,
  setToastMessage,
  endPoints,
  HTTP_METHODS,
  DynamicForm,
  CD_ACCOUNT_DETAILS,
  CREATE_CD_ACCOUNT,
  CANCEL,
  CommonBreadcrumb,
  Table,
  apiRequest,
  SUBMIT,
  CustomModal,
  selectHasPermission,
  FeatureKey,
} from "@ui/ui-lib";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { environment } from "@ui/ui-lib";
import {
  createCDAccountBreadcrumbs,
  CreateCDBalanceConfigPart1,
  CreateCDBalanceConfigPart2,
  CreateCDBalanceDefaultValues,
  getPolicyColumns,
  getMergeCDColumns,
  PolicyData,
  MergeCDAccountData,
} from "./config";
import MergePreviewModal from "./MergePreview/mergePreview";
import {
  ButtonContainer,
  CDListingContainer,
  Container,
  MainContainer,
  Title,
  ModalContentContainer,
  ModalText,
  ModalInfoSection,
  ModalLabel,
  ModalValue,
  CellCenterWrapper,
  CellCheckbox,
  CellRadio,
  CellLink,
} from "../styles";
import {
  ACCOUNT_CREATION_OPTION,
  CD_ACCOUNT_NAME,
  CD_ACCOUNT_NUMBER,
  CD_ACCOUNTS_MERGE_ERROR,
  CD_ACCOUNTS_MERGE_SUCCESS,
  CD_CONFIRMATION_TEXT,
  CD_CONFIRMATION_TITLE,
  COMPANY_ID,
  CONFIRM,
  DISABLE_TOAST_MESSAGE,
  EMPTY_STATE_MESSAGE,
  EXISTING_ACCOUNT,
  FAILED_FETCH_POLICIES,
  GO_BACK,
  INSURER_ID,
  SELECTION_TOAST_MESSAGE,
  SUCCESS_TOAST_MESSAGE,
  TABLE_TITLE,
} from "../../../constants";

const CreateCDAccount: React.FC = () => {
  const isMergeCDAccountsEnabled =
    environment.featureFlag.FF_MERGE_CD_ACCOUNTS;

  const [formMethodsPart1, setFormMethodsPart1] =
    useState<ReturnType<typeof useForm<FieldValues>>>();
  const [formMethodsPart2, setFormMethodsPart2] =
    useState<ReturnType<typeof useForm<FieldValues>>>();
  const [loading, setLoading] = useState(false);
  const [policies, setPolicies] = useState<PolicyData[]>([]);
  const [policiesLoading, setPoliciesLoading] = useState(false);
  const [selectedPolicyIds, setSelectedPolicyIds] = useState<
    Array<string | number>
  >([]);
  const [cdAccountOptions, setCdAccountOptions] = useState<
    Array<{
      value: string;
      label: string;
      cdAccountName: string | null;
      cautionDepositId: number | null;
      cdSafeLimit: number | null;
    }>
  >([]);
  const [cdAccountActions, setCdAccountActions] = useState<
    Array<{ value: number; label: string }>
  >([]);
  const [isMergeCdAccount, setIsMergeCdAccount] = useState<boolean>(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [selectedInsurerId, setSelectedInsurerId] = useState<number | null>(null);
  const [policiesWithCD, setPoliciesWithCD] = useState<PolicyData[]>([]); // This will be populated in merge mode
  const [sourceAccountIds, setSourceAccountIds] = useState<number[]>([]);
  const [targetAccountId, setTargetAccountId] = useState<number | null>(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showMergePreview, setShowMergePreview] = useState(false);
  const tableSelectionApiRef = useRef<{ clearSelection: () => void } | null>(
    null,
  );
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const owner = JSON.parse(sessionStorage.getItem("user") || "{}");
  const  isMergeCdAccountPermission = useSelector((state: any) =>
    selectHasPermission(FeatureKey.MERGE_CD_ACCOUNTS)(state)
  );

  useEffect(() => {
    const fetchCDAccountActions = async () => {
      try {
        const endpoint = endPoints.lookUpByName("CD_ACCOUNT_ACTIONS");
        const response = await apiRequest(endpoint);
        const actions =
          response?.data?.map((item: { id: number; lookUpValue: string }) => ({
            value: item.id,
            label: item.lookUpValue,
          })) || [];
        setCdAccountActions(actions);
      } catch (error: any) {
        console.error("Error fetching CD account actions:", error);
        dispatch(
          setToastMessage(
            error?.message || "Failed to fetch CD account actions",
          ),
        );
      }
    };
    fetchCDAccountActions();
  }, []);

  // Handle action changes and fetch policies
  useEffect(() => {
    if (!formMethodsPart1) {
      return;
    }

    // Subscribe to company and insurer changes
    const subscription = formMethodsPart1.watch((value, { name, type }) => {
      if (name === "action_lid" && value?.action_lid) {
        const selectedAction = cdAccountActions.find(
          (action) => action.value === value.action_lid,
        );
        const isMergeMode =
          isMergeCDAccountsEnabled &&
          !!isMergeCdAccountPermission &&
          (selectedAction?.label?.includes("Merge CD Accounts") || false);

        // Only reset when switching to/from merge mode
        if (isMergeMode !== isMergeCdAccount) {
          formMethodsPart1.setValue(COMPANY_ID, "");
          formMethodsPart1.setValue(INSURER_ID, "");
          setPolicies([]);
          setSelectedPolicyIds([]);
          setCdAccountOptions([]);
          setPoliciesWithCD([]);
          setSourceAccountIds([]);
          setTargetAccountId(null);
          setSelectedCompanyId(null);
          setSelectedInsurerId(null);
          tableSelectionApiRef.current?.clearSelection?.();
        }

        setIsMergeCdAccount(isMergeMode);
      }

      if (name === COMPANY_ID || name === INSURER_ID) {
        const companyId = value.companyId;
        const insurerId = value.insurerId;

        const fetchPolicies = async () => {
          // Extract actual values from select objects
          const companyValue =
            typeof companyId === "object" && companyId?.value
              ? companyId.value
              : companyId;
          const insurerValue =
            typeof insurerId === "object" && insurerId?.value
              ? insurerId.value
              : insurerId;

          if (!companyValue || !insurerValue) {
            setPolicies([]);
            setSelectedPolicyIds([]);
            setCdAccountOptions([]);
            setPoliciesWithCD([]);
            setSourceAccountIds([]);
            setTargetAccountId(null);
            setSelectedCompanyId(null);
            setSelectedInsurerId(null);
            tableSelectionApiRef.current?.clearSelection?.();
            return;
          }

          setSelectedCompanyId(typeof companyValue === "number" ? companyValue : Number(companyValue));
          setSelectedInsurerId(typeof insurerValue === "number" ? insurerValue : Number(insurerValue));

          try {
            setPoliciesLoading(true);
            const endpoint = endPoints.getPolicyTypes(
              companyValue,
              insurerValue,
              isMergeCdAccount,
            );
            const response = await apiRequest(endpoint);
            const fetchedPolicies = response?.data?.policies || [];

            setPolicies(fetchedPolicies);
            if (isMergeCdAccount) {
              // In merge mode, pre-select policies that already have CD accounts
              const policiesWithCDId = fetchedPolicies.filter(
                (policy: PolicyData) => policy.cautionDepositId,
              );
              setPoliciesWithCD(policiesWithCDId);
              // Reset merge selections when data changes
              setSourceAccountIds([]);
              setTargetAccountId(null);
            }

            // Extract CD accounts from policies with hasCautionDeposit and group by cdAccountNumber
            const cdAccountsMap = new Map<
              string,
              {
                count: number;
                cdAccountName: string | null;
                cautionDepositId: number | null;
                cdSafeLimit: number | null;
              }
            >();

            fetchedPolicies
              .filter(
                (policy: PolicyData) =>
                  policy.hasCautionDeposit && policy.cdAccountNumber,
              )
              .forEach((policy: PolicyData) => {
                const accountNumber = policy.cdAccountNumber!;
                const existing = cdAccountsMap.get(accountNumber);

                if (existing) {
                  existing.count += 1;
                } else {
                  cdAccountsMap.set(accountNumber, {
                    count: 1,
                    cdAccountName: policy.cdAccountName || null,
                    cautionDepositId: policy.cautionDepositId || null,
                    cdSafeLimit: policy.cdSafeLimit ?? null,
                  });
                }
              });

            // Convert map to options array with count in label
            const cdAccounts = Array.from(cdAccountsMap.entries()).map(
              ([accountNumber, data]) => ({
                value: accountNumber,
                label:
                  data.count > 1
                    ? `${accountNumber} (${data.count} policies)`
                    : accountNumber,
                cdAccountName: data.cdAccountName,
                cautionDepositId: data.cautionDepositId,
                cdSafeLimit: data.cdSafeLimit,
              }),
            );

            setCdAccountOptions(cdAccounts);
          } catch (error: any) {
            console.error("Error fetching policies:", error);
            dispatch(setToastMessage(error?.message || FAILED_FETCH_POLICIES));
            setPolicies([]);
            setCdAccountOptions([]);
          } finally {
            setPoliciesLoading(false);
          }
        };

        fetchPolicies();
      }
    });

    return () => subscription.unsubscribe();
  }, [formMethodsPart1, dispatch, cdAccountActions, isMergeCdAccount]);

  // Auto-fill CD account name when CD account number is selected (existing account mode)
  // Clear fields when switching between account creation options
  useEffect(() => {
    if (!formMethodsPart2) {
      return;
    }

    const subscription = formMethodsPart2.watch((value, { name }) => {
      // Auto-fill name and set cautionDepositId when account number selected in existing account mode
      if (
        name === CD_ACCOUNT_NUMBER &&
        value.accountCreationOption === EXISTING_ACCOUNT
      ) {
        const selectedCdAccount = cdAccountOptions.find(
          (option) => option.value === value.cdAccountNumber,
        );

        if (selectedCdAccount) {
          formMethodsPart2.setValue(
            CD_ACCOUNT_NAME,
            selectedCdAccount.cdAccountName || "",
          );
          formMethodsPart2.setValue(
            "cautionDepositId",
            selectedCdAccount.cautionDepositId,
          );
          formMethodsPart2.setValue(
            "cdSafeLimit",
            selectedCdAccount.cdSafeLimit ?? null,
          );
        }
      }

      // Clear fields when switching account creation option
      if (name === ACCOUNT_CREATION_OPTION) {
        formMethodsPart2.setValue(CD_ACCOUNT_NUMBER, "");
        formMethodsPart2.setValue(CD_ACCOUNT_NAME, "");
        formMethodsPart2.setValue("cautionDepositId", null);
        formMethodsPart2.setValue("cdSafeLimit", null);
      }
    });

    return () => subscription.unsubscribe();
  }, [formMethodsPart2, cdAccountOptions]);

  // Group policies by CD account id for merge mode
  const cdAccountsForMerge = useMemo(() => {
    const accountsMap = new Map<number, MergeCDAccountData>();

    policiesWithCD.forEach((policy) => {
      const cdId = policy.cautionDepositId;
      if (!cdId) return;

      const existing = accountsMap.get(cdId);
      if (existing) {
        existing.policies.push(policy);
        if (policy.policyNumber) {
          existing.policyNumbers.push(policy.policyNumber);
        }
      } else {
        accountsMap.set(cdId, {
          cdAccountNumber: policy.cdAccountNumber || "",
          cdAccountName: policy.cdAccountName,
          cautionDepositId: cdId,
          policies: [policy],
          balance: policy.cdBalanceAmount || 0,
          policyNumbers: policy.policyNumber ? [policy.policyNumber] : [],
          transactionCount: policy.transactionCount || 0,
        });
      }
    });

    return Array.from(accountsMap.values());
  }, [policiesWithCD]);

  // Policy table columns with cellRenderer
  const policyColumns = useMemo(() => {
    const columns = getPolicyColumns();
    return columns;
  }, []);

  // Merge CD table columns
  const mergeCDColumns = useMemo(() => {
    const handleSourceChange = (cdId: number, checked: boolean) => {
      if (checked) {
        setSourceAccountIds([...sourceAccountIds, cdId]);
      } else {
        setSourceAccountIds(sourceAccountIds.filter((id) => id !== cdId));
      }
    };

    const handleTargetChange = (cdId: number) => {
      setTargetAccountId(cdId);
    };

    const baseColumns = getMergeCDColumns();

    // Add cell renderers to Source column (index 0)
    baseColumns[0].cellRenderer = (props: any) => {
      const cdId: number = props.data?.cautionDepositId;
      const isChecked = cdId != null && sourceAccountIds.includes(cdId);
      const isDisabled = targetAccountId === cdId;

      return (
        <CellCenterWrapper>
          <CellCheckbox
            type="checkbox"
            checked={isChecked}
            disabled={isDisabled}
            onChange={(e) =>
              cdId != null && handleSourceChange(cdId, e.target.checked)
            }
          />
        </CellCenterWrapper>
      );
    };

    // Add cell renderers to Target column (index 1)
    baseColumns[1].cellRenderer = (props: any) => {
      const cdId: number = props.data?.cautionDepositId;
      const isChecked = targetAccountId === cdId;
      const isDisabled = cdId != null && sourceAccountIds.includes(cdId);

      return (
        <CellCenterWrapper>
          <CellRadio
            type="radio"
            name="targetAccount"
            checked={isChecked}
            disabled={isDisabled}
            onChange={() => cdId != null && handleTargetChange(cdId)}
          />
        </CellCenterWrapper>
      );
    };

    // Add link renderer to CD Account Number column (index 2)
    baseColumns[2].cellRenderer = (props: any) => {
      const cdId: number = props.data?.cautionDepositId;
      const accountNumber: string = props.value;
      return (
        <CellLink onClick={() => cdId != null && navigate(`/cd-management/${cdId}`)}>
          {accountNumber}
        </CellLink>
      );
    };

    return baseColumns;
  }, [sourceAccountIds, targetAccountId]);

  // API mutation
  const mutate = useApiMutation({
    config: {
      onSuccess: async (response: any) => {
        setLoading(false);
        dispatch(setToastMessage(SUCCESS_TOAST_MESSAGE));
        navigate("/cd-management");
      },
      onError: async (error: any) => {
        setLoading(false);
        const msg = Array.isArray(error?.message)
          ? error.message[0]
          : error?.message ?? "Something went wrong. Try again.";
        dispatch(setToastMessage(msg));
      },
    },
  });

  // Validate → log raw values → send as-is
  const handleConfirmSubmit = async () => {
    if (!formMethodsPart1 || !formMethodsPart2) {
      return;
    }

    // Combine form data from both parts
    const formData1 = formMethodsPart1.getValues();
    const formData2 = formMethodsPart2.getValues();

    // Extract values from select field objects immediately
    const extractValue = (field: any) => {
      if (field && typeof field === "object" && field.value !== undefined) {
        return field.value;
      }
      return field;
    };

    // Extract all select field values
    const cleanedFormData1 = {
      action_lid: extractValue(formData1.action_lid),
      companyId: extractValue(formData1.companyId),
      insurerId: extractValue(formData1.insurerId),
    };

    // Only extract Part 2 specific fields, don't spread entire formData2
    const cleanedFormData2 = {
      cdAccountNumber: formData2.cdAccountNumber,
      cdAccountName: formData2.cdAccountName || null,
      cdSafeLimit: formData2.cdSafeLimit ?? null,
      accountCreationOption: formData2.accountCreationOption,
      cautionDepositId: formData2.cautionDepositId || null,
      balanceAmount: formData2.balanceAmount,
      referenceType: extractValue(formData2.referenceType),
      transactionReferenceId: formData2.transactionReferenceId,
      chequeDate: formData2.chequeDate,
    };

    const values: any = { ...cleanedFormData1, ...cleanedFormData2 };

    // Add selected policy IDs to values
    values.policyIds = selectedPolicyIds;

    // Pull out fields we may want to exclude
    const {
      accountCreationOption,
      balanceAmount,
      referenceType,
      transactionReferenceId,
      chequeDate,
      cautionDepositId,
      ...base
    } = values;

    // If it's "existingAccountOnly" or no balance amount, drop the opening-balance fields
    // Include cautionDepositId regardless (null for new accounts, has value for existing)
    const payload =
      accountCreationOption === EXISTING_ACCOUNT || !balanceAmount
        ? { ...base, cautionDepositId }
        : {
            ...base,
            cautionDepositId,
            balanceAmount,
            referenceType,
            transactionReferenceId,
            chequeDate,
          };

    setLoading(true);
    setShowConfirmationModal(false);
    mutate.mutate({
      endpoint: endPoints.createCDAccount,
      method: HTTP_METHODS.POST,
      data: payload,
    });
  };

  const handleSubmitClick = async () => {
    if (!formMethodsPart1 || !formMethodsPart2) {
      return;
    }

    // Validate policy selection
    if (selectedPolicyIds.length === 0) {
      dispatch(setToastMessage(SELECTION_TOAST_MESSAGE));
      return;
    }

    // Trigger form validation for both parts
    const isValid1 = await formMethodsPart1.trigger();
    const isValid2 = await formMethodsPart2.trigger();
    if (!isValid1 || !isValid2) {
      return;
    }

    // Open confirmation modal
    setShowConfirmationModal(true);
  };

  const handleCancelConfirmation = () => {
    setShowConfirmationModal(false);
  };

  const handleMergeCdAccounts = async () => {
    setPoliciesLoading(true);
    try {
      if (sourceAccountIds.length === 0 || !targetAccountId) {
        throw new Error(CD_ACCOUNTS_MERGE_ERROR);
      }
      await apiRequest(endPoints.cdAccountsMerge, {
        method: HTTP_METHODS.POST,
        data: {
          sourceCdIds: sourceAccountIds,
          targetCDId: targetAccountId,
        },
      });
      if (selectedCompanyId && selectedInsurerId) {
        const endpoint = endPoints.getPolicyTypes(selectedCompanyId, selectedInsurerId, isMergeCdAccount);
        const response = await apiRequest(endpoint);
        const fetchedPolicies = response?.data?.policies || [];
        setPoliciesWithCD(fetchedPolicies.filter((p: PolicyData) => p.cautionDepositId));
        setSourceAccountIds([]);
        setTargetAccountId(null);
      }
      dispatch(setToastMessage(CD_ACCOUNTS_MERGE_SUCCESS));
    } catch (error: unknown) {
      dispatch(
        setToastMessage((error as Error).message || CD_ACCOUNTS_MERGE_ERROR),
      );
    } finally {
      setPoliciesLoading(false);
    }
  };

  const getSelectedPolicyNumbers = () => {
    return selectedPolicyIds
      .map((id) => {
        const policy = policies.find((p) => p.policyId === id);
        return policy?.policyNumber;
      })
      .filter(Boolean)
      .join(", ");
  };

  const getCdAccountNumber = () => {
    if (!formMethodsPart2) return "";
    const formData = formMethodsPart2.getValues();
    return formData.cdAccountNumber || "";
  };

  const getCdSafeLimit = () => {
    if (!formMethodsPart2) return "";
    const formData = formMethodsPart2.getValues();
    return formData.cdSafeLimit ?? "";
  };

  const close = () => navigate("/cd-management");

  const cdBalanceConfigPart1 = useMemo(
    () => CreateCDBalanceConfigPart1(owner?.userId, isMergeCDAccountsEnabled && !!isMergeCdAccountPermission),
    [owner, isMergeCDAccountsEnabled, isMergeCdAccountPermission],
  );

  const cdBalanceConfigPart2 = useMemo(() => {
    const config = CreateCDBalanceConfigPart2(owner?.userId);

    // Inject CD account options into the select type cdAccountNumber field (for existing accounts)
    const cdAccountNumberSelectField: any = config.find(
      (field: any) =>
        field.key === CD_ACCOUNT_NUMBER && field.type === "select",
    );
    if (cdAccountNumberSelectField) {
      cdAccountNumberSelectField.options = cdAccountOptions;
    }

    return config;
  }, [owner, cdAccountOptions]);

  return (
    <CDListingContainer>
      <CommonBreadcrumb crumbs={createCDAccountBreadcrumbs} />

      <Container>
        <Title variant="h1">{CD_ACCOUNT_DETAILS}</Title>

        {/* Part 1: Actions, Company, Insurer */}
        <MainContainer>
          <DynamicForm
            formConfig={cdBalanceConfigPart1}
            defaultValues={CreateCDBalanceDefaultValues}
            formMethods={setFormMethodsPart1}
          />
        </MainContainer>

        {/* Policy Selection Table */}

        {isMergeCDAccountsEnabled && isMergeCdAccount ? (
          <div
            style={{
              marginTop: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <Table
              columns={mergeCDColumns}
              rowData={cdAccountsForMerge}
              totalRows={cdAccountsForMerge.length}
              currentPage={1}
              loading={policiesLoading}
              setCurrentPage={() => {}}
              pageSize={
                cdAccountsForMerge.length > 0 ? cdAccountsForMerge.length : 10
              }
              pageSizeOptions={[10, 20, 50, 100]}
              setPageSize={() => {}}
              title={`Select CD Accounts`}
              height={400}
              displaySettingsButton={false}
              enableSaveView={false}
              onCellClicked={() => {}}
              setSort={() => {}}
              emptyDataMessage="No CD accounts found for the selected company and insurer"
            />

            <div
              style={{
                marginTop: "20px",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <Button
                variantType="primary"
                sizeType="medium"
                disabled={sourceAccountIds.length === 0 || !targetAccountId}
                onClick={() => setShowMergePreview(true)}
              >
                Merge Accounts
              </Button>
            </div>
          </div>
        ) : (
          <MainContainer style={{ marginTop: "24px" }}>
            <Table
              columns={policyColumns}
              rowData={policies}
              totalRows={policies.length}
              currentPage={1}
              loading={policiesLoading}
              setCurrentPage={() => {}}
              pageSize={policies.length > 0 ? policies.length : 10}
              pageSizeOptions={[10, 20, 50, 100]}
              setPageSize={() => {}}
              title={TABLE_TITLE}
              height={300}
              enableRowSelection={true}
              rowSelectionIdKey="policyId"
              onRowSelectionChange={({ selectedRowIds }) => {
                // Filter out policies with CD accounts
                const validSelections = selectedRowIds.filter((id) => {
                  const policy = policies.find((p) => p.policyId === id);
                  const isValid = policy && !policy.hasCautionDeposit;
                  return isValid;
                });

                // Show message if user tried to select disabled rows
                if (validSelections.length !== selectedRowIds.length) {
                  dispatch(setToastMessage(DISABLE_TOAST_MESSAGE));
                }

                setSelectedPolicyIds(validSelections);

                // Clear the invalid selections from the grid
                if (validSelections.length !== selectedRowIds.length) {
                  setTimeout(() => {
                    if (tableSelectionApiRef.current) {
                      tableSelectionApiRef.current.clearSelection();
                      // Re-select only valid ones if needed
                      // Note: This would require exposing a setSelection method in the API
                    }
                  }, 0);
                }
              }}
              selectionApiRef={tableSelectionApiRef}
              displaySettingsButton={false}
              enableSaveView={false}
              onCellClicked={() => {}}
              setSort={() => {}}
              getRowClass={(params: any) => {
                if (params.data?.hasCautionDeposit) {
                  return "ag-row-disabled";
                }
                return "";
              }}
              emptyDataMessage={EMPTY_STATE_MESSAGE}
            />
          </MainContainer>
        )}

        {/* Part 2: CD Account Number and other fields */}
        {!isMergeCdAccount && (
          <MainContainer style={{ marginTop: "24px" }}>
            <DynamicForm
              formConfig={cdBalanceConfigPart2}
              defaultValues={CreateCDBalanceDefaultValues}
              formMethods={setFormMethodsPart2}
            />
          </MainContainer>
        )}
      </Container>
      {!isMergeCdAccount && (
        <ButtonContainer>
          <Button
            variantType="secondary"
            sizeType="small"
            className="button"
            onClick={close}
            disabled={loading}
          >
            {CANCEL}
          </Button>
          <Button
            variantType="primary"
            sizeType="small"
            className="button"
            loading={loading}
            loadingPosition="center"
            onClick={handleSubmitClick}
          >
            {SUBMIT}
          </Button>
        </ButtonContainer>
      )}

      <CustomModal
        open={showConfirmationModal}
        handleClose={handleCancelConfirmation}
        heading={CD_CONFIRMATION_TITLE}
        buttons={[
          {
            label: GO_BACK,
            onClick: handleCancelConfirmation,
            variant: "secondary",
          },
          {
            label: CONFIRM,
            onClick: handleConfirmSubmit,
            variant: "primary",
          },
        ]}
      >
        <ModalContentContainer>
          <ModalText>{CD_CONFIRMATION_TEXT}</ModalText>
          <ModalInfoSection>
            <ModalLabel>CD Account Number:</ModalLabel>
            <ModalValue>{getCdAccountNumber()}</ModalValue>
          </ModalInfoSection>
          <ModalInfoSection>
            <ModalLabel>CD Safe Limit %:</ModalLabel>
            <ModalValue>{getCdSafeLimit()}</ModalValue>
          </ModalInfoSection>
          <ModalInfoSection sx={{ marginBottom: 0 }}>
            <ModalLabel>Selected Policy Numbers:</ModalLabel>
            <ModalValue>{getSelectedPolicyNumbers()}</ModalValue>
          </ModalInfoSection>
        </ModalContentContainer>
      </CustomModal>

      <MergePreviewModal
        open={showMergePreview}
        onClose={() => setShowMergePreview(false)}
        onConfirm={async () => {
          setShowMergePreview(false);
          await handleMergeCdAccounts()
        }}
        sourceAccounts={cdAccountsForMerge.filter((a) =>
          sourceAccountIds.includes(a.cautionDepositId!),
        )}
        targetAccount={
          cdAccountsForMerge.find(
            (a) => a.cautionDepositId === targetAccountId,
          ) ?? null
        }
      />
    </CDListingContainer>
  );
};

export default CreateCDAccount;
