import { Box } from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import getPercentageData from ".";
import {
  ADD_OPPORTUNITY_FORM_KEYS,
  ADD_OPPORTUNITY_FORM_TITLES,
  ALERT_MESSAGES,
  FAILED_TO_CREATE_OPPORTUNITY,
  RICH_TEXT_LIMIT,
  RICH_TEXT_LIMIT_ERROR,
} from "../../../constants";
import {
  addSoFormConfig,
  claimExperiencesFormConfig,
  contactPersonFormConfig,
  defaultClaimExperiencesValues,
  defaultContactPersonFormConfig,
  defaultOpportunityDetailsValues,
  defaultPreviousPlacementValues,
  defaultSoFormValues,
  opportunitiesDetailsBreadcrumbs,
  getOpportunitiesSteps,
  opportunityDetailsFormConfig,
  previousInsurerTpaBrokersConfig,
  previousPlacementFormConfig,
} from "./formConfig";
import {
  StyledCrumbContainer,
  StyledNextButton,
  StyledPageContainer,
  StyledPrevButton,
  StyledNestedDynamicFormContainer,
} from "./styles";
import { LookUpValues } from "../../../constants/lookupValues";
import {
  endPoints,
  CommonBreadcrumb,
  DynamicForm,
  FormSection,
  FormActionsContainer,
  ProgressWizard,
  MultipleSections,
  IMultipleSectionsHandle,
  BUTTON_LABELS,
  BUTTON_TYPE,
  BUTTON_VARIANTS,
  httpMethods,
  useApiQuery,
  useApiMutation,
  useStepper,
  setToastMessage,
  normalizePayload,
  AccordionTitles,
  useLookupIdByKey,
  LookUpValues as uiLibLookUpValues,
  parseNumberInput,
  NestedDynamicForm,
  NestedGroupedDataCollectionHandle,
  normalizeApiDataForResetting,
  VALIDATION_ERROR_MESSAGE,
  getTextFromHtml,
} from "@ui/ui-lib";

const showValidationErrorToast = (dispatch: any) => {
  dispatch(setToastMessage(VALIDATION_ERROR_MESSAGE));
};

const hasRichTextLimitError = (errors: any): boolean =>
  Object.values(errors || {}).some((error: any) => {
    if (!error) return false;
    if (error?.message === RICH_TEXT_LIMIT_ERROR) return true;
    if (typeof error === "object") return hasRichTextLimitError(error);
    return false;
  });

const OpportunityForm = () => {
  //step_0 fields

  const [addSOMethods, setAddSOMethods] =
    useState<ReturnType<typeof useForm>>();
  const [opportunityDetailsMethods, setopportunityDetailsMethods] =
    useState<ReturnType<typeof useForm>>();

  const [previousPlacementMethods, setPreviousPlacementMethods] =
    useState<ReturnType<typeof useForm>>();
  const [contactsValues, setContactsValues] = useState<any[]>([
    defaultContactPersonFormConfig,
  ]); //multiple Contacts fields
  //step_0 fields

  const [claimExperincesValues, setClaimExperincesValues] = useState<any[]>([
    defaultClaimExperiencesValues,
  ]); //multiple clain experinces fields

  const [opportunityResponse, setOpportunityResponse] = useState<any>(null);
  const [percentage, setPercentage] = useState({
    filledValues: 0,
    totalFields: 0,
  });
  const [saveAndExit, setSaveAndExit] = useState(false);

  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const dispatch = useDispatch();
  const pageTopRef = useRef<HTMLDivElement>(null);

  const { id: opportunityId } = useParams();
  const opportunityIdForApi =
    opportunityId ?? opportunityResponse?.opportunityId; //extracting id from url
  const isEditMode = opportunityIdForApi !== undefined;

  const endPoint = isEditMode
    ? endPoints.oppurtunityById(Number(opportunityIdForApi))
    : endPoints.allOpurtunities; //endpoint for post and put

  //refs for multiple sections
  const claimExperincesRef = useRef<IMultipleSectionsHandle>(null);
  const contactPersonRef = useRef<IMultipleSectionsHandle>(null);
  const previousInsurerTpaBrokersRef =
    useRef<NestedGroupedDataCollectionHandle>(null);

  const { state: overallRouteState } = useLocation();
  const location = useLocation();
  const companyRouteState = location.state?.[AccordionTitles.COMPANY_SELECTION]; //companydetails to prefill the form

  const contactRouteState = location.state?.[AccordionTitles.CONTACT_SELECTION]; //contactdetails to prefill the form

  const disableOpportunityForm =
    opportunityResponse?.isOpportunityEditable === false;
  const {
    data: opportunityDataResponse,
    isLoading: isCompanyLoading,
    error: opportunityFetchError,
  } = useApiQuery({
    queryKey: ["opportunityId", opportunityId],
    url: endPoints.oppurtunityById(Number(opportunityIdForApi)),
    enabled: !!opportunityId,
  });

  // UseMemo for dynamic steps based on opportunity type
  const stepperSteps = useMemo(
    () =>
      getOpportunitiesSteps(
        opportunityResponse?.opportunityType?.lookUpValue ?? "SO"
      ),
    [opportunityResponse?.opportunityType?.lookUpValue]
  );

  const {
    activeStep,
    steps,
    handleNext,
    handleBack,
    setActiveStep,
    completedSteps,
    updateStepStatus,
    updateAllStepsStatusToComplete,
  } = useStepper(stepperSteps);

  const handleCancel = () => {
    const companyIdfromCompanyFlow = location.state?.companyId;
    if (companyIdfromCompanyFlow) {
      navigate(`/companies/${companyIdfromCompanyFlow}`);
    } else if (location.state) {
      navigate("/create2", { state: location.state });
    } else {
      navigate(`/opportunities/${opportunityId}`);
    }
  };

  useEffect(() => {
    if (opportunityDataResponse?.data) {
      setOpportunityResponse(opportunityDataResponse?.data);
      updateAllStepsStatusToComplete();
      getPercentageData(opportunityDataResponse?.data, setPercentage);
    }
  }, [opportunityDataResponse]);

  const shouldRedirect =
    isEditMode &&
    // opportunityFetchError?.status !== undefined &&
    (opportunityDataResponse?.status === 403 ||
      opportunityDataResponse?.data?.editable === false);
  useEffect(() => {
    if (shouldRedirect) {
      navigate("/unauthorized", { replace: true });
    }
  }, [shouldRedirect, navigate]);
  useEffect(() => {
    if (activeStep === 0) {
      handleUpdateStepZeroFields();
    } else if (activeStep === 1) {
      handleUpdateStepOneFields();
    } else if (activeStep === 2) {
      handleUpdateStepTwoFields();
    }
  }, [
    activeStep,
    opportunityResponse,
    addSOMethods,
    opportunityDetailsMethods,
    previousPlacementMethods,
  ]);

  useEffect(() => {
    if (!loading && opportunityResponse) {
      pageTopRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [loading, opportunityResponse, activeStep]);

  const handleUpdateStepZeroFields = () => {
    if (addSOMethods && opportunityResponse) {
      addSOMethods.reset({
        companyId: opportunityResponse?.company?.id,
        policyTypeLid: opportunityResponse?.policyType?.id,
        opportunityTypeLid: opportunityResponse?.opportunityType?.id,
        riskLocations: opportunityResponse?.riskLocations?.map(
          (loc: any) => loc?.addressId
        ),
      });
    }
    if (opportunityDetailsMethods && opportunityResponse) {
      opportunityDetailsMethods.reset({
        estimatedBrokerage: opportunityResponse?.estimatedBrokerage,
        policyStatusLid: opportunityResponse?.policyStatus?.id,
        serviceLevelLid: opportunityResponse?.serviceLevel?.id,
        expiryDate: opportunityResponse?.expiryDate,
        sumInsured: opportunityResponse?.sumInsured,
        premiumPaid: opportunityResponse?.premiumPaid,
        estimatedFee: opportunityResponse?.estimatedFee,
        isPolicyMinedLid: opportunityResponse?.isPolicyMined?.id,
        opportunitySourceTypeLid: opportunityResponse?.opportunitySource?.id,
        source: opportunityResponse?.source,
        salesPitch: opportunityResponse?.salesPitch,
        estimatedBrokeragePercentage:
          opportunityResponse?.estimatedBrokeragePercentage,
      });
    }

    if (opportunityResponse?.previousMediatorDetails) {
      const formateddResponse = {
        previousInsurer:
          opportunityResponse?.previousMediatorDetails?.previousInsurer?.map(
            (item: any) => ({
              id: item.id,
              companyId: item.company?.id,
              branchId: item.branch?.id,
              locationId: item.location?.id,
            })
          ) || [],
        previousTPA:
          opportunityResponse?.previousMediatorDetails?.previousTPA?.map(
            (item: any) => ({
              id: item.id,
              companyId: item.company?.id,
              branchId: item.branch?.id,
              locationId: item.location?.id,
            })
          ) || [],
        previousBroker:
          opportunityResponse?.previousMediatorDetails?.previousBroker?.map(
            (item: any) => ({
              id: item.id,
              companyId: item.company?.id,
              branchId: item.branch?.id,
              locationId: item.location?.id,
            })
          ) || [],
      };

      const normalizeApiData = normalizeApiDataForResetting(formateddResponse);
      previousInsurerTpaBrokersRef?.current?.resetForms(normalizeApiData);
    }
    // setContactsValues(opportunityResponse?.contacts || []); todo
  };
  const handleUpdateStepOneFields = () => {
    const claimExperiencesValues = opportunityResponse?.claimExperiences || [];

    if (claimExperiencesValues?.length > 0) {
      const formattedData = claimExperiencesValues.map((item: any) => {
        return {
          id: item?.id,
          opportunityId: item?.opportunityId,
          policyFrom: item.policyFrom,
          policyTo: item.policyTo,
          natureOfLoss: item.natureOfLoss,
          premium: item.premium,
          claimAmount: item.claimAmount,
          claimPercentage: item.claimPercentage,
          remarks: item.remarks,
        };
      });
      setClaimExperincesValues(formattedData);
    }
  };
  const handleUpdateStepTwoFields = () => {
    if (previousPlacementMethods) {
      const data = opportunityResponse?.previousPlacementDetails || [];

      if (data?.length > 0) {
        const filteredData = data[0];
        previousPlacementMethods.reset({
          id: filteredData?.id,
          opportunityId: opportunityIdForApi,
          challengesAndMitigation: filteredData?.challengesAndMitigation,
          existingCompetition: filteredData?.existingCompetition,
          remarks: filteredData?.remarks,
        });
      }
    }
  };

  const renderContentBasedOnStep = () => {
    switch (activeStep) {
      case 0:
        return renderStepOneContent();
      case 1:
        return renderStepTwoContent();
      case 2:
        return renderStepThreeContent();
      default:
        return null;
    }
  };
  const [watchCompanyId, setWatchCompanyId] = useState<number | null>(null);

  useEffect(() => {
    if (addSOMethods) {
      // Watch for changes in the "companyId" field
      const subscription = addSOMethods.watch((value, { name }) => {
        if (name === "companyId") {
          setWatchCompanyId(value.companyId || null); // Update the state with the new companyId
        }
      });

      // Cleanup the subscription when the component unmounts or addSOMethods changes
      return () => subscription.unsubscribe();
    }
  }, [addSOMethods]);

  const memoizedFormFields = useMemo(() => {
    if (watchCompanyId) {
      return contactPersonFormConfig.map((field) => {
        if (field.key === "contactId") {
          const updatedField = {
            ...field,
            apiDependencies: {
              ...field.apiDependencies,
              endPoint: endPoints.companyContacts(Number(watchCompanyId)),
            },
          };
          return updatedField;
        }
        return field;
      });
    } else {
      return contactPersonFormConfig;
    }
  }, [watchCompanyId, isEditMode]); // Re-run when companyId or isEditMode changes

  const soOpportunityId = useLookupIdByKey(LookUpValues.OPPORTUNITY_TYPE_FRESH);
  const policyStatusId = useLookupIdByKey(
    uiLibLookUpValues.POLICY_STATUS_RENEWAL
  );
  const serviceLevelId = useLookupIdByKey(
    LookUpValues.SERVICE_LEVEL_FULL_SERVICE
  );
  const policyMinedNoId = useLookupIdByKey(LookUpValues.IS_POLICY_MINED_NO);

  const getSoFormConfig = () => {
    if (companyRouteState?.id) {
      return addSoFormConfig.map((field) => {
        if (field.key === "companyId") {
          return {
            ...field,
            disabled: true,
          };
        }
        if (field.key === "opportunityTypeLid") {
          return {
            ...field,
            // disabled: true,
          };
        }
        return field;
      });
    }

    return addSoFormConfig;
  };

  const getOpportunityDetailsFormConfig = () => {
    const isRO = opportunityResponse?.opportunityType?.lookUpValue === "RO";
    return opportunityDetailsFormConfig.map((field) => {
      if (field.key === "opportunitySourceTypeLid" && isRO) {
        return {
          ...field,
          rules: {
            required: false,
          },
        };
      }
      if (field.key === "expiryDate" && !isRO) {
        return {
          ...field,
          label: "Opportunity/Existing policy expiry",
        };
      }
      return field;
    });
  };

  const renderStepOneContent = () => (
    <Box>
      <FormSection
        title={
          opportunityId &&
          opportunityResponse?.opportunityType?.lookUpValue === "RO"
            ? ADD_OPPORTUNITY_FORM_TITLES.ADD_RO
            : ADD_OPPORTUNITY_FORM_TITLES.ADD_SO
        }
      >
        <DynamicForm
          key={ADD_OPPORTUNITY_FORM_KEYS.ADD_SO}
          formConfig={getSoFormConfig()}
          defaultValues={{
            ...defaultSoFormValues,
            companyId: companyRouteState?.id
              ? Number(companyRouteState?.id)
              : overallRouteState?.companyId
              ? Number(overallRouteState?.companyId)
              : "",
            opportunityTypeLid: soOpportunityId,
          }}
          disableAllFields={disableOpportunityForm}
          formMethods={setAddSOMethods}
          isEditMode={isEditMode}
          shouldReset={!isEditMode} // Reset the form when not in edit mode
        />
      </FormSection>

      {/* Todo--  */}
      {/* <FormSection showHeader={false}>
        <MultipleSections
          key={"renderOpportunityDetails-Contact"}
          initialValues={contactsValues}
          defaultValues={defaultContactPersonFormConfig}
          title={(index) => `Contact ${index}`}
          ref={contactPersonRef}
          formConfig={memoizedFormFields}
        />
      </FormSection> */}

      <FormSection
        title={
          opportunityId &&
          opportunityResponse?.opportunityType?.lookUpValue === "RO"
            ? ADD_OPPORTUNITY_FORM_TITLES.RO_DETAILS
            : ADD_OPPORTUNITY_FORM_TITLES.OPPORTUNITY_DETAILS
        }
      >
        <DynamicForm
          key={ADD_OPPORTUNITY_FORM_KEYS.OPPORTUNITY_DETAILS}
          formConfig={getOpportunityDetailsFormConfig()}
          formMethods={setopportunityDetailsMethods}
          isEditMode={isEditMode}
          defaultValues={{
            ...defaultOpportunityDetailsValues,
            policyStatusLid: policyStatusId,
            serviceLevelLid: serviceLevelId,
            isPolicyMinedLid: policyMinedNoId,
          }}
          disableAllFields={disableOpportunityForm}
        />
      </FormSection>
      <StyledNestedDynamicFormContainer>
        <NestedDynamicForm
          config={previousInsurerTpaBrokersConfig}
          ref={previousInsurerTpaBrokersRef}
          disableAllFormFields={disableOpportunityForm}
        />
      </StyledNestedDynamicFormContainer>
    </Box>
  );

  const renderStepTwoContent = () => (
    <Box>
      <FormSection showHeader={false}>
        <MultipleSections
          key={ADD_OPPORTUNITY_FORM_KEYS.CLAIM_EXPERIENCES}
          initialValues={claimExperincesValues}
          defaultValues={defaultClaimExperiencesValues}
          title={(index) =>
            `${ADD_OPPORTUNITY_FORM_TITLES.CLAIM_EXPERIENCES} ${index}`
          }
          ref={claimExperincesRef}
          formConfig={claimExperiencesFormConfig}
          dynamicCalculatedFields={[
            {
              watchFields: ["claimAmount", "premium"],
              setField: "claimPercentage",
              calculate: ({ claimAmount, premium }) => {
                // 1) If both are truly undefined, likely a removed row → NO-OP
                const bothUndefined =
                  claimAmount === undefined && premium === undefined;
                if (bothUndefined) return undefined;

                // 2) Parse numbers for real rows
                const claim = parseNumberInput(claimAmount);
                const prem = parseNumberInput(premium);

                // 3) If inputs are present but invalid or prem is 0 → clear existing row
                const invalid =
                  !Number.isFinite(claim) ||
                  !Number.isFinite(prem) ||
                  prem === 0;
                if (invalid) return "";

                // 4) Normal compute for existing row
                return ((Number(claim) / Number(prem)) * 100).toFixed(2);
              },
            },
          ]}
          disableAllFields={disableOpportunityForm}
        />
      </FormSection>
    </Box>
  );

  const renderStepThreeContent = () => (
    <FormSection title={ADD_OPPORTUNITY_FORM_TITLES.PREVIOUS_PLACEMENT}>
      <DynamicForm
        key={ADD_OPPORTUNITY_FORM_KEYS.PREVIOUS_PLACEMENT}
        formConfig={previousPlacementFormConfig}
        defaultValues={defaultPreviousPlacementValues}
        formMethods={setPreviousPlacementMethods}
        isEditMode={isEditMode}
        disableAllFields={disableOpportunityForm}
      />
    </FormSection>
  );

  const selectedContacts = contactRouteState?.values?.length
    ? contactRouteState.values
    : location.state?.[AccordionTitles.CONTACT_SELECTION]?.values || [];

  const handleStepZeroSubmit = async () => {
    const previousInsurerTpaBrokers =
      await previousInsurerTpaBrokersRef?.current?.submitAll?.();

    const [isValidAddSo, isValidOpportunityDetails] = await Promise.all([
      addSOMethods?.trigger(),
      // contactPersonRef.current?.trigger(),
      opportunityDetailsMethods?.trigger(),
    ]);

    const isValid =
      isValidAddSo &&
      isValidOpportunityDetails &&
      previousInsurerTpaBrokers?.isAllValid;

    if (isValid) {
      setLoading(true);

      const [addSoValues, contactPersonValues, opportunityDetailsValues] =
        await Promise.all([
          addSOMethods?.getValues(),
          contactPersonRef.current?.getValues(),
          opportunityDetailsMethods?.getValues(),
        ]);

      const payload = {
        companyId: addSoValues?.companyId,
        policyTypeLid: addSoValues?.policyTypeLid,
        opportunityTypeLid: addSoValues?.opportunityTypeLid,
        riskLocations: addSoValues?.riskLocations?.map((item: any) => ({
          addressId: item,
        })),
        estimatedBrokerage: parseNumberInput(
          opportunityDetailsValues?.estimatedBrokerage
        ),
        policyStatusLid: opportunityDetailsValues?.policyStatusLid,
        serviceLevelLid: opportunityDetailsValues?.serviceLevelLid,
        expiryDate: opportunityDetailsValues?.expiryDate,
        sumInsured: parseNumberInput(opportunityDetailsValues?.sumInsured),
        premiumPaid: parseNumberInput(opportunityDetailsValues?.premiumPaid),
        estimatedFee: parseNumberInput(opportunityDetailsValues?.estimatedFee),
        isPolicyMinedLid: opportunityDetailsValues?.isPolicyMinedLid,
        opportunitySourceTypeLid:
          opportunityDetailsValues?.opportunitySourceTypeLid,
        source: opportunityDetailsValues?.source,
        salesPitch: opportunityDetailsValues?.salesPitch,
        estimatedBrokeragePercentage:
          opportunityDetailsValues?.estimatedBrokeragePercentage,

        contacts: selectedContacts.map((item: any) => ({
          contactId: item?.id ?? item,
        })),
        ...previousInsurerTpaBrokers.result,
      };

      const formatedPayload = await normalizePayload(payload);

      mutate({
        endpoint: endPoint,
        method: !isEditMode ? httpMethods.POST : httpMethods.PUT, //Todo
        data: formatedPayload,
      });
    } else {
      const hasRichTextError = [addSOMethods, opportunityDetailsMethods].some(
        (method) => hasRichTextLimitError(method?.formState?.errors)
      );
      if (hasRichTextError) {
        dispatch(setToastMessage(RICH_TEXT_LIMIT_ERROR));
      } else {
        showValidationErrorToast(dispatch);
      }
    }
  };

  const handleStepOneSubmit = async () => {
    const isValidClaimExperiences = await claimExperincesRef.current?.trigger();
    if (isValidClaimExperiences) {
      setLoading(true);

      const claimExperiencesValues =
        await claimExperincesRef.current?.getValues();

      const formatedPayload = await normalizePayload(claimExperiencesValues);

      const payload = {
        claimExperiences: formatedPayload?.map((item) => ({
          opportunityId: opportunityIdForApi,
          id: item?.id,
          policyFrom: item?.policyFrom,
          policyTo: item?.policyTo,
          natureOfLoss: item?.natureOfLoss,
          claimAmount: item?.claimAmount ? Number(item?.claimAmount) : null,
          premium: item?.premium ? Number(item?.premium) : null,
          claimPercentage: item?.claimPercentage
            ? Number(item?.claimPercentage)
            : null,
          remarks: item?.remarks,
        })),
      };
      makePutCall(payload);
    } else {
      const values = claimExperincesRef.current?.getValues() || [];
      const hasRichTextError = values.some((item: any) => {
        const plainText = getTextFromHtml(item?.remarks || "");
        return plainText.length > RICH_TEXT_LIMIT;
      });
      if (hasRichTextError) {
        dispatch(setToastMessage(RICH_TEXT_LIMIT_ERROR));
      } else {
        showValidationErrorToast(dispatch);
      }
    }
  };
  const handleStepTwo = async () => {
    const isValidPreviousPlacement = await previousPlacementMethods?.trigger();
    const isValid = isValidPreviousPlacement;
    if (isValid) {
      setLoading(true);

      const previousPlacementValues =
        await previousPlacementMethods?.getValues();

      const formattedPayload = await normalizePayload([
        previousPlacementValues,
      ]);

      const payload = {
        previousPlacementDetails: formattedPayload.map((item) => {
          return {
            id: item?.id,
            opportunityId: opportunityIdForApi,
            challengesAndMitigation: item?.challengesAndMitigation,
            existingCompetition: item?.existingCompetition,
            remarks: item?.remarks,
          };
        }),
      };

      makePutCall(payload);
    } else {
      const values = previousPlacementMethods?.getValues() || {};
      const hasRichTextError = Object.values(values).some((value) => {
        const plainText = getTextFromHtml(value || "");
        return plainText.length > RICH_TEXT_LIMIT;
      });
      if (hasRichTextError) {
        dispatch(setToastMessage(RICH_TEXT_LIMIT_ERROR));
      } else {
        showValidationErrorToast(dispatch);
      }
    }
  };

  //common function for post and put
  const makePutCall = async (payload: any) => {
    mutate({
      endpoint: endPoint,
      method: httpMethods.PUT,
      data: payload,
    });
  };

  const { mutate } = useApiMutation({
    config: {
      onSuccess: (response) => {
        setLoading(false);
        if (activeStep < stepperSteps.length - 1) {
          if (Boolean(response?.data?.opportunityId)) {
            updateStepStatus(activeStep); //to show stepper status
            setActiveStep((prev) => prev + 1);
            setOpportunityResponse(response?.data);
            if (saveAndExit) {
              if (Boolean(location.state?.opportunities)) {
                navigate(`/opportunities/${opportunityIdForApi}`, {
                  state: {
                    opportunities: location.state.opportunities,
                  },
                });
              } else {
                navigate(`/opportunities/${response?.data?.opportunityId}`);
              }
            }
          } else {
            dispatch(setToastMessage(FAILED_TO_CREATE_OPPORTUNITY));
          }
        } else if (Boolean(location.state)) {
          navigate(`/opportunities/${opportunityIdForApi}`, {
            state: {
              opportunities: location.state.opportunities,
            },
          });
        } else {
          setTimeout(
            () => navigate(`/opportunities/${opportunityIdForApi}`),
            1000
          );
        }
        getPercentageData(response?.data, setPercentage);
      },
      onError: (error) => {
        setLoading(false);
        const errorMessage = Array.isArray(error?.message)
          ? error.message[0]
          : error?.message ?? ALERT_MESSAGES.GENERIC_ERROR;
        dispatch(setToastMessage(errorMessage));
      },
    },
  });

  const stepperSubmit = async () => {
    if (activeStep === 0) {
      handleStepZeroSubmit();
    } else if (activeStep === 1) {
      handleStepOneSubmit();
    } else if (activeStep === 2) {
      handleStepTwo();
    }
  };

  const handleStepChange = async (newStep: number) => {
    setActiveStep(newStep);
  };

  const isEditModeFromUrl = location.pathname.includes("edit");

  return (
    <StyledPageContainer ref={pageTopRef}>
      <StyledCrumbContainer>
        <CommonBreadcrumb
          crumbs={opportunitiesDetailsBreadcrumbs(
            isEditModeFromUrl,
            opportunityResponse?.opportunityType?.lookUpValue || "SO"
          )}
        />
      </StyledCrumbContainer>
      <ProgressWizard
        steps={stepperSteps}
        activeStep={activeStep}
        completedSteps={completedSteps}
        onStepChange={handleStepChange}
        totalFields={percentage.totalFields}
        fieldsFilled={percentage.filledValues}
      />

      {renderContentBasedOnStep()}

      <FormActionsContainer>
        <StyledPrevButton
          variantType={BUTTON_VARIANTS.SECONDARY}
          onClick={handleCancel}
          label={BUTTON_LABELS.CANCEL}
          disabled={disableOpportunityForm}
        />
        {activeStep > 0 && (
          <StyledPrevButton
            onClick={handleBack}
            variantType={BUTTON_VARIANTS.SECONDARY}
            label={BUTTON_LABELS.PREVIOUS}
            // disabled={disableOpportunityForm}
          />
        )}

        <StyledNextButton
          type={BUTTON_TYPE.BUTTON}
          variantType={BUTTON_VARIANTS.PRIMARY}
          onClick={disableOpportunityForm ? handleNext : stepperSubmit}
          role="submit"
          data-testid="submit-button"
          loading={!saveAndExit && loading}
          // disabled={disableOpportunityForm}
          label={
            !saveAndExit && loading
              ? ""
              : activeStep === stepperSteps.length - 1
              ? BUTTON_LABELS.SUBMIT
              : BUTTON_LABELS.NEXT
          }
        />
        {!(activeStep === stepperSteps.length - 1) && (
          <StyledNextButton
            type={BUTTON_TYPE.BUTTON}
            variantType={BUTTON_VARIANTS.PRIMARY}
            onClick={() => {
              setSaveAndExit(true);
              stepperSubmit();
            }}
            disabled={disableOpportunityForm}
            role="submit"
            data-testid="submit-button"
            loading={saveAndExit && loading}
            label={saveAndExit && loading ? "" : BUTTON_LABELS.SAVE_AND_EXIT}
          />
        )}
      </FormActionsContainer>
    </StyledPageContainer>
  );
};
export default OpportunityForm;
