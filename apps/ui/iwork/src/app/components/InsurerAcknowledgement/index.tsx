import DynamicForm from "@ui/ui-lib/commonComponents/FormComponent";
import { ButtonContainer, Container, MainContainer } from "./styles";
import {
  InsurerAcknowledgementConfig,
  InsurerAcknowledgementDefaultValues,
} from "./formConfig";
import { FieldValues, UseFormReturn } from "react-hook-form";
import { useRef } from "react";
import Button from "@ui/ui-lib/commonComponents/Button";
import { CONFIRM, GO_BACK, UPLOAD_DATA } from "../../constants";
import { useDispatch } from "react-redux";
import { useApiMutation } from "@ui/ui-lib/hooks/useMutation";
import { useParams } from "react-router-dom";
import { setToastMessage, endPoints, HTTP_METHODS } from "@ui/ui-lib";

interface Props {
  onClose?: () => void;
  onPrevious?: () => void;
  insurerAcknowledgementData?: any;
  refreshDashboard?: () => void;
}

const InsurerAcknowledgement: React.FC<Props> = ({
  onClose,
  onPrevious,
  insurerAcknowledgementData,
  refreshDashboard,
}) => {
  const formMethodsRef = useRef<UseFormReturn<FieldValues> | null>(null);

  const { id: policyId } = useParams();
  // endPoints.insurerAcknowledgement

  const handleFormMethods = (methods: UseFormReturn<FieldValues>) => {
    formMethodsRef.current = methods;
  };

  // formMethodsRef.current?.reset({
  //   insurerEndorsementId: insurerAcknowledgementData?.endorsementId || "",
  //   acknowledgementReceivedDate:
  //     insurerAcknowledgementData?.endorsementSentDate || "",
  // });

  const dispatch = useDispatch();

  const mutate = useApiMutation({
    config: {
      onSuccess: async (response) => {
        dispatch(setToastMessage(response?.message || "Saved successfully"));
        refreshDashboard?.();
        onClose?.();
      },
      onError: async (error) => {
        const errorMessage = Array.isArray(error?.message)
          ? error.message[0]
          : error?.message ?? "Something went wrong. Try again.";
        dispatch(setToastMessage(errorMessage));
      },
    },
  });

  const handleSubmit = async () => {
    const values = formMethodsRef.current?.getValues();
    const allValues = await formMethodsRef.current?.trigger();
    if (!values) {
      dispatch(setToastMessage("Please fill out the form."));
      return;
    }
    if (!values?.fileUpload) {
      dispatch(setToastMessage("Please upload the file"));
    }
    if (allValues && values?.fileUpload) {
      const file = values?.fileUpload;

      const payload = {
        insurerEndorsementNumber: values.insurerEndorsementId,
        uploadedFileId: file?.id,
        insurerEndorsementDate: values.acknowledgementReceivedDate,
      };
      const policyIdNumber =
        insurerAcknowledgementData?.policyId ?? parseInt(policyId);
      mutate.mutate({
        endpoint: endPoints.insurerAcknowledgement(
          policyIdNumber,
          insurerAcknowledgementData?.endorsementId ?? ""
        ),

        method: HTTP_METHODS.PUT,
        data: payload,
      });
    }
  };

  return (
    <>
      <Container>
        <MainContainer>
          <DynamicForm
            formConfig={InsurerAcknowledgementConfig}
            formMethods={handleFormMethods}
            defaultValues={InsurerAcknowledgementDefaultValues}
          />
        </MainContainer>
        <ButtonContainer>
          {/* <Button
            variantType="primary"
            data-testid="insurer-acknowledgement-cancel-button"
            loadingPosition="start"
            className="button"
            sizeType="small"
            onClick={onPrevious}
          >
            {UPLOAD_DATA.GO_BACK}
          </Button> */}
          <Button
            variantType="secondary"
            data-testid="insurer-acknowledgement-go-back-button"
            loadingPosition="start"
            className="button"
            sizeType="small"
            onClick={onClose}
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
          >
            {CONFIRM}
          </Button>
        </ButtonContainer>
      </Container>
    </>
  );
};

export default InsurerAcknowledgement;
