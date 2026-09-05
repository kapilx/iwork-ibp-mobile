import DynamicForm from "@ui/ui-lib/commonComponents/FormComponent";
import {
  BackButtonContainer,
  ButtonContainer,
  Container,
  MainCDBalanceContainer,
  MainContainer,
  PolicySpecificNotice,
  Title,
} from "./styles";
import {
  addCDBalanceBreadcrumbsData,
  addCDDetailsConfig,
  addCDDetailsDefaultValues,
} from "./formConfig";
import { FieldValues, UseFormReturn } from "react-hook-form";
import { useEffect, useMemo, useRef, useState } from "react";
import Button from "@ui/ui-lib/commonComponents/Button";
import { CONFIRM, UPLOAD_DATA } from "../../constants";
import { useDispatch } from "react-redux";
import { useApiMutation } from "@ui/ui-lib/hooks/useMutation";
import {
  setToastMessage,
  endPoints,
  HTTP_METHODS,
  LookUpValues,
  useLookupIdByKey,
  CommonBreadcrumb,
} from "@ui/ui-lib";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ADD_CD_BALANCE_LABEL,
  UPDATE_FOR_POLICY,
  UPDATE_CD_BALANCE_POLICY_SPECIFIC,
} from "../../constants";

interface Props {
  onClose?: () => void;
  cdId?: number;
  refreshDashboard?: () => void;
}

const AddCDDetails: React.FC<Props> = ({
  onClose,
  // cdId = 0,
  refreshDashboard,
}) => {
  const { id: policyId, cdId } = useParams();
  const location = useLocation();
  const { from, policyId: policyIdFromState } = location.state ?? {};
  const navigate = useNavigate();

  const formMethodsRef = useRef<UseFormReturn<FieldValues> | null>(null);
  const [loading, setLoading] = useState(false);
  const [requireChequeFields, setRequireChequeFields] = useState(false);

  if (!cdId || Number.isNaN(Number(cdId))) return null;
  
  // Determine if this is a policy-specific transaction
  // Only consider it policy-specific if coming from PolicyDashboard with valid policyId
  const isPolicySpecific = from === "PolicyDashboard" && (policyId || policyIdFromState);
  const targetPolicyId = policyId || policyIdFromState;
  const transactionTypeChequeId = useLookupIdByKey(
    LookUpValues.TRANSACTION_TYPE_CHEQUE
  );
  const transactionTypeBankId = useLookupIdByKey(
    LookUpValues.TRANSACTION_TYPE_RTGS
  );
  const creditId = useLookupIdByKey(LookUpValues.CREDIT_TRANSACTION);

  const dispatch = useDispatch();

  const mutate = useApiMutation({
    config: {
      onSuccess: async (response) => {
        const successMessage = isPolicySpecific 
          ? response?.message || "CD balance updated for this policy successfully"
          : response?.message || "CD balance updated for all linked policies successfully";
        dispatch(setToastMessage(successMessage));
        refreshDashboard?.();
        onClose?.();
        close();
        setLoading(false);
      },
      onError: async (error) => {
        const errorMessage = Array.isArray(error?.message)
          ? error.message[0]
          : error?.message ?? "Something went wrong. Try again.";
        dispatch(setToastMessage(errorMessage));
        setLoading(false);
      },
    },
  });

  const handleFormMethods = (methods: UseFormReturn<FieldValues>) => {
    formMethodsRef.current = methods;
  };

  // watch referenceType → toggle required rules for cheque fields & unregister when leaving Cheque
  useEffect(() => {
    const methods = formMethodsRef.current;
    if (!methods) return;

    const unsubscribe = methods.watch((value, { name }) => {
      if (name === "referenceType") {
        const isCheque = value?.referenceType === transactionTypeChequeId;

        setRequireChequeFields((prev) => (prev !== isCheque ? isCheque : prev));

        // Clear lingering errors
        methods.clearErrors(["chequeNumber", "chequeDate"]);

        // Drop old required rules when switching away from Cheque (keep values)
        if (!isCheque) {
          methods.unregister(["chequeNumber", "chequeDate"], {
            keepValue: true,
          });
        }
      }
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [transactionTypeChequeId]);

  // build the config based on runtime flag
  const formConfig = useMemo(
    () =>
      addCDDetailsConfig({
        requireChequeFields,
        rtgsReferenceTypeId: transactionTypeBankId ?? null,
      }),
    [requireChequeFields, transactionTypeBankId]
  );

  const handleSubmit = async () => {
    const methods = formMethodsRef.current;
    const values = methods?.getValues();

    const baseFields = [
      "transactionType",
      "transactionAmount",
      "transactionReferenceId",
      "referenceType",
      "bankName",
      "remarks",
      "chequeDate"
    ];
    const fieldsToValidate =
      // values?.referenceType === transactionTypeChequeId
      //   ? [...baseFields, "chequeNumber", "chequeDate"]
      //   : baseFields;
      baseFields;

    const valid = await methods?.trigger(fieldsToValidate);
    if (!values || !valid) {
      dispatch(setToastMessage("Please fill out the form."));
      return;
    }

    // Extra runtime guards
    if (
      values.referenceType === transactionTypeChequeId &&
      ( !values.chequeDate)
    ) {
      dispatch(
        setToastMessage(
          "Transaction date is required for transaction type Cheque."
        )
      );
      return;
    }

    if (
      values.referenceType === transactionTypeBankId &&
      (!values.bankName?.trim() || !values.ifscCode?.trim())
    ) {
      dispatch(
        setToastMessage(
          "Bank and IFSC code are required for transaction type RTGS."
        )
      );
      return;
    }

    setLoading(true);
    
    // Use policy-specific endpoint if coming from PolicyDashboard
    const apiEndpoint = isPolicySpecific && targetPolicyId
      ? endPoints.addCdDetailsByPolicy(Number(targetPolicyId), cdId)
      : endPoints.addCdDetails(cdId);
    
    mutate.mutate({
      endpoint: apiEndpoint,
      method: HTTP_METHODS.PUT,
      data: { 
        ...values, 
        ...(targetPolicyId && !Number.isNaN(Number(targetPolicyId)) ? { policyId: Number(targetPolicyId) } : {})
      },
    });
  };
  const close = () => {
    if (onClose) return onClose();
    if (from === "CDManagement") {
      // came from the CD Management list
      navigate("/cd-management");
    } else if (from === "PolicyDashboard" && policyId) {
      // came from the policy dashboard (you set this state in your navigate)
      navigate(`/policies/${policyId}`);
    } else {
      // safe fallback
      navigate(-1);
    }
  };

  return (
    <MainCDBalanceContainer>
      <CommonBreadcrumb crumbs={addCDBalanceBreadcrumbsData(from, policyId)} />
      <Container>
        <Title variant="h1">
          {ADD_CD_BALANCE_LABEL}
        </Title>
        <MainContainer>
          <DynamicForm
            formConfig={formConfig}
            formMethods={handleFormMethods}
            defaultValues={addCDDetailsDefaultValues(creditId)}
          />
        </MainContainer>
      </Container>
      <ButtonContainer>
        <Button
          variantType="secondary"
          data-testid="insurer-acknowledgement-go-back-button"
          loadingPosition="start"
          className="button"
          sizeType="small"
          onClick={close}
        >
          {UPLOAD_DATA.CANCEL}
        </Button>
        <Button
          onClick={handleSubmit}
          variantType="primary"
          data-testid="insurer-acknowledgement-create-button"
          loadingPosition="center"
          className="button"
          sizeType="small"
          loading={loading}
        >
          {isPolicySpecific ? UPDATE_FOR_POLICY : CONFIRM}
        </Button>
      </ButtonContainer>
    </MainCDBalanceContainer>
  );
};

export default AddCDDetails;
