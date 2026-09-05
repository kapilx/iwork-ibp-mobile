import { Box } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  ALERT_MESSAGES,
  ENTITY_CONTACT_FORM_KEYS,
  ENTITY_CONTACT_FORM_TITLE,
  ENTITY_TYPE_TITLE,
  RICH_TEXT_LIMIT_ERROR,
} from "../../../constants";
import {
  addressFields,
  communicationDetailsFields,
  defaultAddress,
  defaultCommunicationDetailsFieldData,
  getContactDetailsBreadcrumbs,
  getContactFieldsByRecordTypeId,
  getDefaultContactFieldDataByRecordTypeId,
} from "./insurerFormConfig";

import { useDispatch, useSelector } from "react-redux";
import {
  DynamicForm,
  BUTTON_LABELS,
  BUTTON_TYPE,
  BUTTON_VARIANTS,
  httpMethods,
  CommonBreadcrumb,
  FormSection,
  FormActionsContainer,
  MultipleSections,
  IMultipleSectionsHandle,
  endPoints,
  useApiQuery,
  useApiMutation,
  setToastMessage,
  normalizePayload,
  useLocalization,
  useLookupIdByKey,
  localizeFields,
} from "@ui/ui-lib";
import { EntityType } from "../../../constants/enum";
import {
  StyledNextButton,
  StyledPageContainer,
} from "../../CompanyPage/AddCompany/styles";
import { StyledCrumbContainer, TitleContainer } from "./styles";
import { CommunicationDetail } from "../../ContactPage/AddContacts/types";
import { LookUpValues } from "../../../constants/lookupValues";
import { fromUnixTime } from "date-fns";

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

const InsurerAddContacts = () => {
  const [contactInfoFormMethods, setContactInfoFormMethods] =
    React.useState<ReturnType<typeof useForm>>();
  const addressResidenceId = useLookupIdByKey(
    LookUpValues.AGENT_ADDRESS_TYPE_RESIDENCE
  );

  const userData = JSON.parse(sessionStorage.getItem("user") || "{}");

  const countryId = userData?.country?.id;
  const [addressesValues, setAddressesValues] = useState<any[]>([
    defaultAddress(addressResidenceId, countryId),
  ]);
  const { id: contactId, entityType: rawEntityType } = useParams();
  const [communicationDetailsValues, setCommunicationDetailsValues] = useState<
    any[]
  >([defaultCommunicationDetailsFieldData]);
  const navigate = useNavigate();
  const location = useLocation();
  const returnToPath =
    (location.state as { returnTo?: string } | null)?.returnTo || null;
  const [loading, setLoading] = useState(false);

  const addressesRef = useRef<IMultipleSectionsHandle>(null);
  const communicationDetailsRef = useRef<IMultipleSectionsHandle>(null);

  const isEditMode = !!contactId;
  const [currentAddressValues, setCurrentAddressValues] = useState<any[]>([]);

  // Watch address values reactively - only updates when form actually changes
  useEffect(() => {
    if (!addressesRef.current) return;

    const subscription = addressesRef.current.watch((value) => {
      if (value?.retArray) {
        setCurrentAddressValues(value.retArray);
      }
    });

    return () => subscription?.unsubscribe?.();
  }, [addressesRef.current]);

  const { data: contactDataResponse, isLoading: isContactLoading } =
    useApiQuery({
      queryKey: ["insurerContactId", contactId],
      url: endPoints.contactById(Number(contactId)),
      enabled: !!contactId,
    });

  const dispatch = useDispatch();

  const { localizationData } = useLocalization();

  const entityType = rawEntityType?.toLowerCase() as EntityType;

  const contactDetailsBreadcrumbs = getContactDetailsBreadcrumbs(
    entityType,
    isEditMode
  );

  const getDefaultType = () => LookUpValues.INSURER_CONTACT;

  const contactRecordTypeLid = useLookupIdByKey(
    entityType === EntityType.INSURER
      ? LookUpValues.INSURER_CONTACT
      : entityType === EntityType.BROKER
      ? LookUpValues.BROKER_CONTACT
      : entityType === EntityType.TPA
      ? LookUpValues.TPA_CONTACT
      : getDefaultType()
  );

  const resolvedLookupIds = useSelector(
    (state: any) => state.user.resolvedLookupIds
  );
  const insurerContactFields = getContactFieldsByRecordTypeId(
    contactRecordTypeLid,
    resolvedLookupIds
  );

  const defaultContactFieldData = getDefaultContactFieldDataByRecordTypeId(
    contactRecordTypeLid,
    resolvedLookupIds
  );

  const title =
    entityType === EntityType.INSURER
      ? ENTITY_TYPE_TITLE.INSURER
      : entityType === EntityType.BROKER
      ? ENTITY_TYPE_TITLE.BROKER
      : ENTITY_TYPE_TITLE.TPA;

  useEffect(() => {
    if (contactDataResponse?.data) {
      const contactResponse = contactDataResponse?.data;
      const addresses = contactResponse?.address || [];

      // Populate form fields with existing data
      if (contactInfoFormMethods) {
        contactInfoFormMethods.reset({
          salutationLid: contactResponse?.salutation?.id,
          firstName: contactResponse?.firstName,
          middleName: contactResponse?.middleName,
          lastName: contactResponse?.lastName,
          displayName: contactResponse?.displayName,
          companyId: contactResponse?.company?.id,
          companyLocationId: contactResponse?.companyLocation?.id,
          companyBranchId: contactResponse?.companyBranchId,
          tagLid: contactResponse?.tag?.id,
          contactTypeLid: contactResponse?.contactType?.id,
          department: contactResponse?.department,
          designation: contactResponse?.designation,
          remarks: contactResponse?.remarks,
        });
      }

      setCommunicationDetailsValues(
        contactResponse?.communicationDetails || []
      );
      if (addresses.length > 0) {
        const formattedArray =
          addresses?.map((address: any) => {
            return {
              id: address?.id,
              addressTypeLid: parseInt(address?.addressTypeLid, 10),
              address1: address?.address1,
              address2: address?.address2,
              area: address?.area,
              countryId: address?.countryId.id,
              pinCode: address?.pinCode,
              phoneNumber: address?.phoneNumber,
              email: address?.email,
              supportNumber: address?.supportNumber,
              stateId: address?.stateId?.id,
              cityId: address?.cityId?.id,
              alternatePhoneNumber: address?.alternatePhoneNumber,
            };
          }) || [];

        setAddressesValues(formattedArray);
      }
    }
  }, [contactDataResponse, contactInfoFormMethods]);

  const { mutate } = useApiMutation({
    config: {
      onSuccess: (response) => {
        const saveContactApiResponse = response?.data;
        const pathId = contactId ? contactId : saveContactApiResponse?.id;
        if (returnToPath) {
          navigate(returnToPath, { replace: true });
          return;
        }
        navigate(`/${entityType}/contact/` + pathId);
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

  const endPoint = isEditMode
    ? endPoints.contactById(Number(contactId))
    : endPoints.allContacts;

  const handleSubmit = async () => {
    const [isValidContactInfo, isValidCommunicationDetails, isValidAddress] =
      await Promise.all([
        contactInfoFormMethods?.trigger(),
        communicationDetailsRef.current?.trigger(),
        addressesRef.current?.trigger(),
      ]);

    if (isValidContactInfo && isValidCommunicationDetails && isValidAddress) {
      setLoading(true);

      const [contactInfoValues, communicationDetails, addressValues] =
        await Promise.all([
          contactInfoFormMethods?.getValues(),
          communicationDetailsRef.current?.getValues(),
          addressesRef.current?.getValues(),
        ]);

      const isAddressComplete = (address: any): boolean => {
        const requiredKeys = [
          "address1",
          "stateId",
          "cityId",
          "pinCode",
          "phoneNumber",
        ];
        return requiredKeys.every((key) => !!address[key]);
      };
      const filteredAddresses = Array.isArray(addressValues)
        ? addressValues.filter(isAddressComplete)
        : [];

      let emailFound = false;
      let phoneFound = false;

      const updatedCommunicationDetails: CommunicationDetail[] | undefined =
        communicationDetails?.map((item: CommunicationDetail) => {
          const type = item.communicationType?.toLowerCase();

          if (type === "email" && !emailFound) {
            emailFound = true;
            return { ...item, isPrimary: true };
          }

          if (type === "phone" && !phoneFound) {
            phoneFound = true;
            return { ...item, isPrimary: true };
          }

          return { ...item, isPrimary: false };
        });
      const payload = {
        salutationLid: contactInfoValues?.salutationLid,
        firstName: contactInfoValues?.firstName,
        middleName: contactInfoValues?.middleName,
        lastName: contactInfoValues?.lastName,
        displayName: contactInfoValues?.displayName,
        companyId: contactInfoValues?.companyId,
        companyLocationId: contactInfoValues?.companyLocationId,
        companyBranchId: contactInfoValues?.companyBranchId,
        contactTypeLid: contactInfoValues?.contactTypeLid,
        department: contactInfoValues?.department,
        designation: contactInfoValues?.designation,
        remarks: contactInfoValues?.remarks,
        tagLid: contactInfoValues?.tagLid,
        communicationDetails: updatedCommunicationDetails,
        address: filteredAddresses.length > 0 ? filteredAddresses : undefined,
        contactRecordTypeLid: !isEditMode ? contactRecordTypeLid : undefined,
      };

      const formattedPayload = await normalizePayload(payload);

      mutate({
        endpoint: endPoint,
        method: isEditMode ? httpMethods.PUT : httpMethods.POST,
        data: formattedPayload,
      });
    } else {
      const hasRichTextError = hasRichTextLimitError(
        contactInfoFormMethods?.formState?.errors
      );
      if (hasRichTextError) {
        dispatch(setToastMessage(RICH_TEXT_LIMIT_ERROR));
      } else {
        showValidationErrorToast(dispatch);
      }
    }
  };

  const shouldRedirect =
    isEditMode &&
    // contactDataResponse?.status !== undefined &&
    (contactDataResponse?.status === 403 ||
      contactDataResponse?.data?.editable === false);

  useEffect(() => {
    if (shouldRedirect) {
      navigate("/unauthorized", { replace: true });
    }
  }, [shouldRedirect, navigate]);

  const renderFormContent = () => {
    return (
      <Box>
        <FormSection
          title={`${title} ${ENTITY_CONTACT_FORM_TITLE.ENTITY_CONTACT}`}
        >
          <DynamicForm
            key={`${title}-${ENTITY_CONTACT_FORM_KEYS.ENTITY_CONTACT_INFO}`}
            formConfig={insurerContactFields}
            defaultValues={defaultContactFieldData}
            formMethods={setContactInfoFormMethods} // Pass setFormMethods
          />
        </FormSection>
        <FormSection showHeader={false}>
          <MultipleSections
            key={`${title}-${ENTITY_CONTACT_FORM_KEYS.ENTITY_COMMUNICATION_DETAILS}`}
            formConfig={(index) => communicationDetailsFields(index)}
            defaultValues={defaultCommunicationDetailsFieldData}
            initialValues={communicationDetailsValues}
            title={(index) =>
              `${ENTITY_CONTACT_FORM_TITLE.ENTITY_COMMUNICATION_DETAILS} ${index}`
            }
            ref={communicationDetailsRef}
          />
        </FormSection>
        <FormSection showHeader={false}>
          <MultipleSections
            key={ENTITY_CONTACT_FORM_KEYS.ENTITY_ADDRESS_DETAILS}
            initialValues={addressesValues}
            defaultValues={defaultAddress(addressResidenceId, countryId)}
            title={(index) =>
              `${ENTITY_CONTACT_FORM_TITLE.ENTITY_ADDRESS_DETAILS} ${index}`
            }
            ref={addressesRef}
            formConfig={(index) =>
              addressFields(false, countryId, index, {
                retArray: currentAddressValues,
              })
            }
          />
        </FormSection>
      </Box>
    );
  };

  return (
    <StyledPageContainer>
      <TitleContainer variant="h1">
        {title} {ENTITY_CONTACT_FORM_TITLE.ENTITY_CONTACT}
      </TitleContainer>
      <StyledCrumbContainer>
        <CommonBreadcrumb crumbs={contactDetailsBreadcrumbs} />
      </StyledCrumbContainer>
      {/* //render fields based on */}
      {renderFormContent()}
      <FormActionsContainer>
        <StyledNextButton
          type={BUTTON_TYPE.BUTTON}
          variantType={BUTTON_VARIANTS.PRIMARY}
          onClick={handleSubmit}
          role="submit"
          data-testid="submit-button"
          loading={loading}
          disabled={loading}
          label={loading ? "" : BUTTON_LABELS.SUBMIT}
        />
      </FormActionsContainer>
    </StyledPageContainer>
  );
};

export default InsurerAddContacts;
