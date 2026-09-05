import {
  Button,
  DynamicForm,
  endPoints,
  setToastMessage,
  useApiMutation,
  useApiQuery,
  HTTP_METHODS,
} from "@ui/ui-lib";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { ALERT_MESSAGES } from "../../constants";
import { opportunityLostConfig } from "./config";
import { ButtonContainer, FormContainerStyles } from "./styles";
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import React from "react";

interface OpportunityLostProps {
  setIsOpportunityLost: React.Dispatch<React.SetStateAction<boolean>>;
}

const OpportunityLost: React.FC<OpportunityLostProps> = ({
  setIsOpportunityLost,
}) => {
  const dispatch = useDispatch();
  const { id: opportunityId } = useParams();
  const [isFormDisabled, setIsFormDisabled] = useState(false);

  //step_0 fields
  const [basicFormMethods, setBasicFormMethods] =
    React.useState<ReturnType<typeof useForm>>();

  const mutation = useApiMutation({
    config: {
      onSuccess: (response) => {
        dispatch(setToastMessage(response?.message));
        setIsOpportunityLost(true);
        setIsFormDisabled(true);
      },
      onError: (error) => {
        const errorMessage = Array.isArray(error?.message)
          ? error.message[0]
          : error?.message ?? ALERT_MESSAGES.GENERIC_ERROR;
        dispatch(setToastMessage(errorMessage));
      },
    },
  });

  const { data: opportunityActivityStatus } = useApiQuery({
    queryKey: ["OpportunityActivityStatus"],
    url: endPoints.lookUpByName("OPPORTUNITY_ACTIVITY_STATUS"),
  });

  const opportunityStatusSubmitted = opportunityActivityStatus?.data?.find(
    (optyStatus: any) =>
      optyStatus.lookUpKey === "OPPORTUNITY_ACTIVITY_STATUS_CLOSED"
  );

  const opportunityStatusSaved = opportunityActivityStatus?.data?.find(
    (optyStatus: any) =>
      optyStatus.lookUpKey === "OPPORTUNITY_ACTIVITY_STATUS_WORK_IN_PROGRESS"
  );

  const handleRequest = async (statusLid: number) => {
    // const values = await formRef.current?.submitAll?.();
    const isVallid = await basicFormMethods?.trigger();

    if (isVallid) {
      const values = basicFormMethods?.getValues();
      const payload = {
        opportunityId: Number(opportunityId),
        opportunityLost: {
          ...values,
        },
        statusLid,
      };
      mutation.mutate({
        endpoint: endPoints.opportunityLost,
        method: HTTP_METHODS.POST,
        data: payload,
      });
    }
  };

  const { data: opportunityLostResponse } = useApiQuery({
    queryKey: ["oppurtunityLostById", opportunityId],
    url: endPoints.oppurtunityLostById(Number(opportunityId)),
    enabled: !!opportunityId,
  });

  useEffect(() => {
    if (opportunityLostResponse) {
      basicFormMethods?.reset(
        opportunityLostResponse?.data?.dataActivity?.opportunityLost
      );
    }
  }, [opportunityLostResponse]);

  const opportunityLostStatus = opportunityActivityStatus?.data?.find(
    (optyStatus: any) =>
      optyStatus.id === opportunityLostResponse?.data?.statusLid
  );
  const disableAllFormFields =
    opportunityLostStatus?.lookUpKey === "OPPORTUNITY_ACTIVITY_STATUS_CLOSED" ||
    isFormDisabled;

  return (
    <FormContainerStyles>
      <DynamicForm
        key={"opportunityLostKey"}
        formConfig={opportunityLostConfig}
        defaultValues={{}}
        formMethods={setBasicFormMethods}
        disableAllFields={disableAllFormFields}
      />
      <ButtonContainer>
        <Button
          type="button"
          disabled={disableAllFormFields}
          onClick={() => handleRequest(opportunityStatusSubmitted?.id)}
        >
          Submit
        </Button>
      </ButtonContainer>
    </FormContainerStyles>
  );
};

export default OpportunityLost;
