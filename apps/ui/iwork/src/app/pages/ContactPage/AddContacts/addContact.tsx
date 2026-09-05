import { Box } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ADD_CONTACTS_FORM_KEYS,
  ADD_CONTACTS_FORM_TITLES,
  ALERT_MESSAGES,
  RICH_TEXT_LIMIT_ERROR,
} from "../../../constants";
import {
  BUTTON_LABELS,
  BUTTON_TYPE,
  BUTTON_VARIANTS,
  httpMethods,
  endPoints,
  DynamicForm,
  CommonBreadcrumb,
  FormSection,
  FormActionsContainer,
  ProgressWizard,
  MultipleSections,
  IMultipleSectionsHandle,
  useApiMutation,
  useApiQuery,
  useStepper,
  setToastMessage,
  normalizePayload,
  AccordionTitles,
  useLookupIdByKey,
  LookUpValues as uiLibLookUpValues,
  VALIDATION_ERROR_MESSAGE,
} from "@ui/ui-lib";
import {
  childresnDetailsFields,
  communicationDetailsFields,
  contactInformationFields,
  defaultChildrenDetailsFieldData,
  defaultCommunicationDetailsFieldData,
  defaultContactInformationFieldData,
  defaultPersonalDetailsFieldData,
  defaultProfessionalExperienceFormFieldData,
  defaultQualificationFormFieldData,
  getContactDetailsBreadcrumbs,
  personalDetailsFields,
  professionalExperienceFormFields,
  qualificationFormFields,
  steps,
} from "./formConfig";

import { useDispatch } from "react-redux";
import getPercentageData from ".";
import {
  StyledCrumbContainer,
  StyledNextButton,
  StyledPageContainer,
  StyledPrevButton,
} from "../../CompanyPage/AddCompany/styles";
import { CommunicationDetail } from "./types";
import {
  addressFields,
  defaultAddress,
} from "../../InsurerContactPage/InsurerAddContacts/insurerFormConfig";
import { LookUpValues } from "../../../constants/lookupValues";

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

const AddContacts = () => {
  const [contactInfoFormMethods, setContactInfoFormMethods] =
    React.useState<ReturnType<typeof useForm>>();
  const [PersonalDeatilsFormMethods, setPersonalDeatilsFormMethods] =
    React.useState<ReturnType<typeof useForm>>();
  const [maritalStatusValue, setMaritalStatusValue] = useState<number | null>(
    null
  );
  const [communicationDetailsValues, setCommunicationDetailsValues] = useState<
    any[]
  >([defaultCommunicationDetailsFieldData]); //multiple address fields
  const addressResidenceId = useLookupIdByKey(
    LookUpValues.AGENT_ADDRESS_TYPE_RESIDENCE
  );
  const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
  const countryId = userData?.country?.id;

  const [addressesValues, setAddressesValues] = useState<any[]>([
    defaultAddress(addressResidenceId, countryId),
  ]); //multiple address fields
  const [saveAndExit, setSaveAndExit] = useState(false);

  const [qualificationValues, setQualificationValues] = useState<any[]>([
    defaultQualificationFormFieldData,
  ]); //multiple address fields
  const [childrenDetailsValues, setChildrenDetailsValues] = useState<any[]>([
    defaultChildrenDetailsFieldData,
  ]); //multiple address fields
  const [professionalExperienceValues, setProfessionalExperienceValues] =
    useState<any[]>([defaultProfessionalExperienceFormFieldData]); //multiple address fields
  const [loading, setLoading] = useState(false);
  const addressesRef = useRef<IMultipleSectionsHandle>(null);
  const professionalExperienceRef = useRef<IMultipleSectionsHandle>(null);
  const qualificationRef = useRef<IMultipleSectionsHandle>(null);
  const communicationDetailsRef = useRef<IMultipleSectionsHandle>(null);
  const childDetailsRef = useRef<IMultipleSectionsHandle>(null);
  const pageTopRef = useRef<HTMLDivElement>(null);

  const [contactResponse, setContactResponse] = useState<any>(null);
  const [percentage, setPercentage] = useState({
    filledValues: 0,
    totalFields: 0,
  });

  const { state } = useLocation();
  const { id: contactId } = useParams();
  const contactIdForApi = contactId ?? contactResponse?.id; //extracting id from url
  const isEditMode = contactIdForApi !== undefined;

  const endPoint = isEditMode
    ? endPoints.contactById(contactIdForApi)
    : endPoints.allContacts; //endpoint for post and put

  const { state: overallRouteState } = useLocation();

  const routeState = useLocation().state?.[AccordionTitles.COMPANY_SELECTION]; //companydetails to prefill the form
  const companyContactId = useLookupIdByKey(LookUpValues.COMPANY_CONTACT);
  const navigate = useNavigate();

  const maritalStatusSingleId = useLookupIdByKey(
    uiLibLookUpValues.MARTIAL_STATUS_SINGLE
  );
  const bussinessCardInfo = routeState?.businessCardInfo;
  const parts = (bussinessCardInfo?.name || "")
    .trim()
    .split(" ")
    .filter(Boolean);

  useEffect(() => {
    if (bussinessCardInfo) {
      const updatedCommunicationDetails = [
        ...(bussinessCardInfo?.workPhoneNumber?.[0]
          ? [
              {
                communicationType: "phone",
                communicationDetails:
                  bussinessCardInfo?.workPhoneNumber[0]?.replace(/[-\s]/g, ""),
              },
            ]
          : []),
        ...(bussinessCardInfo?.workEmail
          ? [
              {
                communicationType: "email",
                communicationDetails: bussinessCardInfo.workEmail,
              },
            ]
          : []),
        ...(bussinessCardInfo?.personalPhoneNumber?.[0]
          ? [
              {
                communicationType: "phone",
                communicationDetails:
                  bussinessCardInfo?.personalPhoneNumber[0]?.replace(
                    /[-\s]/g,
                    ""
                  ),
              },
            ]
          : []),
      ];

      setCommunicationDetailsValues(updatedCommunicationDetails);
    }
  }, [bussinessCardInfo]);

  useEffect(() => {
    if (PersonalDeatilsFormMethods) {
      const subscription = PersonalDeatilsFormMethods.watch(
        (value, { name }) => {
          if (name === "maritalStatus") {
            setMaritalStatusValue(value.maritalStatus);
          }
        }
      );
      return () => subscription.unsubscribe();
    }
  }, [PersonalDeatilsFormMethods]);

  const modifiedPersonalDetailsFields = React.useMemo(() => {
    const MARITAL_STATUS_SINGLE_ID = maritalStatusSingleId;
    const isSingle = maritalStatusValue === MARITAL_STATUS_SINGLE_ID;

    return personalDetailsFields.map((field) => {
      if (
        [
          "dateOfWedding",
          "spouseName",
          "spouseDateOfBirth",
          "spouseWorkingStatus",
          "workingCompany",
        ].includes(field.key)
      ) {
        return {
          ...field,
          componentProps: {
            ...field.componentProps,
            disabled: isSingle,
          },
        };
      }
      return field;
    });
  }, [maritalStatusValue]);

  const {
    activeStep,
    steps: stepperSteps,
    handleNext,
    handleBack,
    setActiveStep,
    completedSteps,
    updateStepStatus,
    updateAllStepsStatusToComplete,
  } = useStepper(steps);

  const handleCancel = () => {
    const companyIdfromCompanyFlow = location.state?.companyId;
    if (companyIdfromCompanyFlow) {
      navigate(`/companies/${companyIdfromCompanyFlow}`);
    } else if (overallRouteState) {
      const updatedState: any = {
        ...overallRouteState,
        newContactIds: contactIdForApi
          ? [...(overallRouteState?.newContactIds || []), contactIdForApi]
          : [...(overallRouteState?.newContactIds || [])],
      };

      if (updatedState?.[AccordionTitles.COMPANY_SELECTION]?.businessCardInfo) {
        const { businessCardInfo, ...rest } =
          updatedState[AccordionTitles.COMPANY_SELECTION];
        updatedState[AccordionTitles.COMPANY_SELECTION] = rest;
      }
      navigate("/create2", {
        state: updatedState,
      });
    } else {
      navigate(`/contact/${contactId}`);
    }
  };

  const dispatch = useDispatch();

  useEffect(() => {
    if (!loading && contactResponse) {
      pageTopRef.current?.scrollIntoView({ behavior: "auto" }); // or "smooth" if you want animation
    }
  }, [contactResponse, loading, activeStep]);

  const {
    data: contactDataResponse,
    isLoading: isCompanyLoading,
    error: companyFetchError,
  } = useApiQuery({
    queryKey: ["contactId", contactId],
    url: endPoints.contactById(Number(contactIdForApi)),
    enabled: !!contactId,
  });

  useEffect(() => {
    if (contactDataResponse?.data) {
      setContactResponse(contactDataResponse?.data);
      updateAllStepsStatusToComplete();

      getPercentageData(contactDataResponse?.data, setPercentage);
    }
  }, [contactDataResponse]);

  const shouldRedirect =
    isEditMode &&
    // companyFetchError?.status !== undefined &&
    (companyFetchError?.status === 403 ||
      contactDataResponse?.data?.editable === false);

  useEffect(() => {
    if (shouldRedirect) {
      navigate("/unauthorized", { replace: true });
    }
  }, [shouldRedirect, navigate]);

  useEffect(() => {
    if (!contactResponse) return;

    if (activeStep === 0) {
      handleUpdateStepZeroFields();
    } else if (activeStep === 1) {
      handleUpdateStepOneFields();
    } else if (activeStep === 2) {
      handleUpdateStepTwoFields();
    } else if (activeStep === 3) {
      handleUpdateStepThreeFields();
    }
  }, [
    activeStep,
    contactResponse,
    //step_0
    contactInfoFormMethods,
    PersonalDeatilsFormMethods,
  ]);

  // step_0
  const handleUpdateStepZeroFields = async () => {
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
        relationshipTypeLid: contactResponse?.relationshipTypeLid,
        tagLid: contactResponse?.tag?.id,
        contactTypeLid: contactResponse?.contactType?.id,
        department: contactResponse?.department,
        designation: contactResponse?.designation,
        reportingToId: contactResponse?.reportingTo?.id,
        linkedInUrl: contactResponse?.linkedInUrl,
        remarks: contactResponse?.remarks,
        status: contactResponse?.status?.id,
      });
    }

    if (contactResponse?.communicationDetails?.length > 0) {
      setCommunicationDetailsValues(contactResponse?.communicationDetails);
    }
  };
  const handleUpdateStepOneFields = () => {
    const addresses = contactResponse?.address || [];

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
  };

  const handleUpdateStepTwoFields = () => {
    if (PersonalDeatilsFormMethods) {
      PersonalDeatilsFormMethods.reset({
        gender: contactResponse?.contactDetails?.gender,
        dateOfBirth: contactResponse?.contactDetails?.dateOfBirth,
        favouriteFood: contactResponse?.contactDetails?.favouriteFood,
        favouriteRestaurant:
          contactResponse?.contactDetails?.favouriteRestaurant,
        personalHistory: contactResponse?.contactDetails?.personalHistory,
        majorAchievements: contactResponse?.contactDetails?.majorAchievements,
        maritalStatus: contactResponse?.contactDetails?.maritalStatus,
        dateOfWedding: contactResponse?.contactDetails?.dateOfWedding,
        spouseName: contactResponse?.contactDetails?.spouseName,
        spouseDateOfBirth: contactResponse?.contactDetails?.spouseDateOfBirth,
        spouseWorkingStatus:
          contactResponse?.contactDetails?.spouseWorkingStatus,
        workingCompany: contactResponse?.contactDetails?.workingCompany,
        id: contactResponse?.contactDetails?.id,
      });
    }

    const childDetails = contactResponse?.contactDetails?.childDetails || [];
    if (childDetails.length > 0) {
      const formattedArray = childDetails?.map((item: any) => {
        return {
          id: item?.id,
          childGender: item?.childGender,
          childName: item?.childName,
          childDob: item?.childDob,
        };
      });
      setChildrenDetailsValues(formattedArray);
    }
  };

  const handleUpdateStepThreeFields = () => {
    const qualifications = contactResponse?.qualificationExperiences || [];

    if (qualifications.length > 0) {
      const formattedArray =
        qualifications?.map((item: any) => {
          return {
            id: item?.id,
            nameOfQualification: item?.nameOfQualification,
            yearOfQualification: item?.yearOfQualification,
            details: item?.details,
            universityName: item?.universityName,
          };
        }) || [];

      setQualificationValues(formattedArray);
    }

    const professionalExperiences =
      contactResponse?.professionalExperiences || [];

    if (professionalExperiences.length > 0) {
      const formattedArray = professionalExperiences?.map((item: any) => {
        return {
          id: item?.id,
          company: item?.company,
          department: item?.department,
          designation: item?.designation,
          details: item?.details,
          fromDate: item?.fromDate,
          toDate: item?.toDate,
        };
      });
      setProfessionalExperienceValues(formattedArray);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderContactInformation();
      case 1:
        return renderAddressDetails();
      case 2:
        return renderPersonalDetails();
      case 3:
        return ProfessionalExperienceDetails();
      default:
        return null;
    }
  };

  //if we are company from create company flow, then we need to disable companyId field bcz it is automatically filled
  const getContactFormFields = () => {
    if (routeState) {
      return contactInformationFields.map((field) => {
        if (field.name === "companyId") {
          return {
            ...field,
            disabled: true,
          };
        }
        return field;
      });
    } else {
      return contactInformationFields;
    }
  };

  const contactTypeBusinessId = useLookupIdByKey(
    uiLibLookUpValues.CONTACT_TYPE_BUSINESS
  );

  const getContactDefaultValues = () => {
    const companyId = routeState?.id ?? state?.companyId ?? "";

    return {
      ...defaultContactInformationFieldData,
      companyId: companyId ? Number(companyId) : "",
      firstName: parts[0] || "",
      lastName: parts.length > 1 ? parts.slice(1).join(" ") : "",
      designation: bussinessCardInfo?.jobTitle,
      linkedInUrl: bussinessCardInfo?.socialMediaHandles?.LinkedIn,
      contactTypeLid: contactTypeBusinessId,
    };
  };

  const renderContactInformation = () => (
    <Box>
      <FormSection title={ADD_CONTACTS_FORM_TITLES.CONTACT_INFORMATION}>
        <DynamicForm
          key={ADD_CONTACTS_FORM_KEYS.CONTACT_INFORMATION}
          formConfig={getContactFormFields()}
          defaultValues={getContactDefaultValues()}
          formMethods={setContactInfoFormMethods} // Pass setFormMethods
          shouldReset={!isEditMode} // Reset the form if not in edit mode
        />
      </FormSection>
      <FormSection showHeader={false}>
        <MultipleSections
          key={ADD_CONTACTS_FORM_KEYS.COMMUNICATION_DETAILS}
          formConfig={(index) => communicationDetailsFields(index)}
          defaultValues={defaultCommunicationDetailsFieldData}
          initialValues={communicationDetailsValues}
          title={(index) =>
            `${ADD_CONTACTS_FORM_TITLES.COMMUNICATION_DETAILS} ${index}`
          }
          ref={communicationDetailsRef}
        />
      </FormSection>
    </Box>
  );

  const renderAddressDetails = () => (
    <Box>
      <FormSection showHeader={false}>
        <MultipleSections
          key={ADD_CONTACTS_FORM_KEYS.ADDRESS_DETAILS}
          initialValues={addressesValues}
          defaultValues={defaultAddress(addressResidenceId, countryId)}
          title={(index) =>
            `${ADD_CONTACTS_FORM_TITLES.ADDRESS_DETAILS} ${index}`
          }
          ref={addressesRef}
          formConfig={addressFields(false, countryId)}
        />
      </FormSection>
    </Box>
  );

  const renderPersonalDetails = () => (
    <Box>
      <FormSection title={ADD_CONTACTS_FORM_TITLES.PERSONAL_DETAILS}>
        <DynamicForm
          key={ADD_CONTACTS_FORM_KEYS.PERSONAL_DETAILS}
          formConfig={modifiedPersonalDetailsFields}
          defaultValues={defaultPersonalDetailsFieldData}
          formMethods={setPersonalDeatilsFormMethods}
        />
      </FormSection>
      <FormSection
        title={ADD_CONTACTS_FORM_TITLES.CHILDREN_DETAILS}
        showHeader={false}
      >
        <MultipleSections
          key={ADD_CONTACTS_FORM_KEYS.CHILDREN_DETAILS}
          initialValues={childrenDetailsValues}
          defaultValues={defaultChildrenDetailsFieldData}
          title={(index) =>
            `${ADD_CONTACTS_FORM_TITLES.CHILDREN_DETAILS} ${index}`
          }
          ref={childDetailsRef}
          formConfig={childresnDetailsFields}
        />
      </FormSection>
    </Box>
  );

  const ProfessionalExperienceDetails = () => (
    <Box>
      <FormSection
        title={ADD_CONTACTS_FORM_TITLES.PROFESSIONAL_EXPERIENCE}
        showHeader={false}
      >
        <MultipleSections
          key={ADD_CONTACTS_FORM_KEYS.PROFESSIONAL_EXPERIENCE}
          formConfig={(index: number) => {
            const watch = professionalExperienceRef.current?.watch;
            return professionalExperienceFormFields(watch, index);
          }}
          defaultValues={defaultProfessionalExperienceFormFieldData}
          title={(index) =>
            `${ADD_CONTACTS_FORM_TITLES.PROFESSIONAL_EXPERIENCE} ${index}`
          }
          ref={professionalExperienceRef}
          initialValues={professionalExperienceValues}
        />
      </FormSection>
      <FormSection
        title={ADD_CONTACTS_FORM_TITLES.QUALIFICATION}
        showHeader={false}
      >
        <MultipleSections
          key={ADD_CONTACTS_FORM_KEYS.QUALIFICATION}
          formConfig={qualificationFormFields}
          defaultValues={defaultQualificationFormFieldData}
          initialValues={qualificationValues}
          title={(index) =>
            `${ADD_CONTACTS_FORM_TITLES.QUALIFICATION} ${index}`
          }
          ref={qualificationRef}
        />
      </FormSection>
    </Box>
  );

  //step_0 submit
  const handleStepZeroSubmit = async (isSaveAndExit: boolean) => {
    const [isValidContactInfo, isValidCommunicationDetails] = await Promise.all(
      [
        contactInfoFormMethods?.trigger(),
        communicationDetailsRef.current?.trigger(),
      ]
    );

    const isValid = isValidContactInfo && isValidCommunicationDetails;

    if (isValid) {
      setLoading(true);

      const [contactInfoValues, communicationDetails] = await Promise.all([
        contactInfoFormMethods?.getValues(),
        communicationDetailsRef.current?.getValues(),
      ]);
      let emailFound = false;
      let phoneFound = false;

      const updatedCommunicationDetails: CommunicationDetail[] =
        Array.isArray(communicationDetails) &&
        communicationDetails?.length > 0 &&
        (communicationDetails[0]?.communicationType === "email" ||
          communicationDetails[0]?.communicationType === "phone")
          ? communicationDetails.map((item: CommunicationDetail) => {
              const type = item?.communicationType?.toLowerCase();

              if (type === "email" && !emailFound) {
                emailFound = true;
                return { ...item, isPrimary: true };
              }

              if (type === "phone" && !phoneFound) {
                phoneFound = true;
                return { ...item, isPrimary: true };
              }

              return { ...item, isPrimary: false };
            })
          : [];
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
        reportingToId: contactInfoValues?.reportingToId,
        relationshipTypeLid: contactInfoValues?.relationshipTypeLid,
        remarks: contactInfoValues?.remarks,
        tagLid: contactInfoValues?.tagLid,
        linkedInUrl: contactInfoValues?.linkedInUrl,
        communicationDetails: updatedCommunicationDetails,
        contactRecordTypeLid: !isEditMode ? companyContactId : undefined,
        statusLid: contactInfoValues?.status,
      };

      const formatedPayload = await normalizePayload(payload);

      mutate({
        endpoint: endPoint,
        method: !isEditMode ? httpMethods.POST : httpMethods.PUT,
        data: formatedPayload,
      });
      setSaveAndExit(isSaveAndExit);
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

  //step_1 submit
  const handleStepOneSubmit = async (isSaveAndExit: boolean) => {
    const isValidAddressForm = await addressesRef.current?.trigger();

    if (isValidAddressForm) {
      setLoading(true);

      const addressValues = await addressesRef.current?.getValues();

      const filteredAddresses = Array.isArray(addressValues)
        ? addressValues.filter(isAddressComplete)
        : [];

      const payload = {
        address: filteredAddresses,
      };
      makePutCall(payload);
    } else {
      showValidationErrorToast(dispatch);
    }
    setSaveAndExit(isSaveAndExit);
  };

  //step_2 submit
  const handleStepTwoSubmit = async (isSaveAndExit: boolean) => {
    const [isValidChildrenDetailsForm, isValidPersonalDetails] =
      await Promise.all([
        childDetailsRef.current?.trigger(),
        PersonalDeatilsFormMethods?.trigger(),
      ]);

    const isValid = isValidChildrenDetailsForm && isValidPersonalDetails; //checking whether all the forms are valid or not
    if (isValid) {
      setLoading(true);

      const [childrenDetails, personalDetails] = await Promise.all([
        childDetailsRef.current?.getValues(),
        PersonalDeatilsFormMethods?.getValues(),
      ]);

      const payload = {
        contactDetails: {
          gender: personalDetails?.gender,
          dateOfBirth: personalDetails?.dateOfBirth,
          favouriteFood: personalDetails?.favouriteFood,
          favouriteRestaurant: personalDetails?.favouriteRestaurant,
          personalHistory: personalDetails?.personalHistory,
          majorAchievements: personalDetails?.majorAchievements,
          maritalStatus: personalDetails?.maritalStatus,
          dateOfWedding: personalDetails?.dateOfWedding,
          spouseName: personalDetails?.spouseName,
          spouseDateOfBirth: personalDetails?.spouseDateOfBirth,
          spouseWorkingStatus: personalDetails?.spouseWorkingStatus,
          workingCompany: personalDetails?.workingCompany,
          id: contactDataResponse?.data?.contactDetails?.id,
          childDetails: childrenDetails ?? [],
        },
      };

      makePutCall(payload);
      setSaveAndExit(isSaveAndExit);
    } else {
      const hasRichTextError = hasRichTextLimitError(
        PersonalDeatilsFormMethods?.formState?.errors
      );
      if (hasRichTextError) {
        dispatch(setToastMessage(RICH_TEXT_LIMIT_ERROR));
      } else {
        showValidationErrorToast(dispatch);
      }
    }
  };

  //step_3 submit
  const handleStepThreeSubmit = async () => {
    const [isValidQualification, isValidProfessionalExperience] =
      await Promise.all([
        qualificationRef.current?.trigger(),
        professionalExperienceRef.current?.trigger(),
      ]);

    const isValid = isValidQualification && isValidProfessionalExperience;

    if (isValid) {
      setLoading(true);

      const [qualification, professionalExperience] = await Promise.all([
        qualificationRef.current?.getValues(),
        professionalExperienceRef.current?.getValues(),
      ]);

      const payload = {
        qualificationExperiences:
          qualification?.map((item) => ({
            ...item,
            yearOfQualification: item?.yearOfQualification
              ? Number(item.yearOfQualification)
              : null,
          })) ?? [],
        professionalExperiences: professionalExperience ?? [],
      };

      makePutCall(payload);
    } else {
      const hasRichTextError = hasRichTextLimitError(
        PersonalDeatilsFormMethods?.formState?.errors
      );
      if (hasRichTextError) {
        dispatch(setToastMessage(RICH_TEXT_LIMIT_ERROR));
      } else {
        showValidationErrorToast(dispatch);
      }
    }
  };

  //common function for post and put
  const makePutCall = async (payload: any) => {
    const formatedPayload = await normalizePayload(payload);

    mutate({
      endpoint: endPoint,
      method: httpMethods.PUT,
      data: formatedPayload,
    });
  };
  const { mutate, isLoading } = useApiMutation({
    config: {
      onSuccess: (response) => {
        setLoading(false);

        if (activeStep < steps.length - 1) {
          updateStepStatus(activeStep); //to show stepper status
          setActiveStep((prev) => prev + 1);
          setContactResponse(response?.data);
          if (saveAndExit) {
            navigate(`/contact/${response?.data?.id}`);
          }
        } else {
          if (Boolean(routeState)) {
            const updatedState: any = {
              ...overallRouteState,
              newContactIds: [
                ...(overallRouteState?.newContactIds || []),
                response?.data?.id,
              ],
              pathname: AccordionTitles.CONTACT_SELECTION,
            };

            if (
              updatedState?.[AccordionTitles.COMPANY_SELECTION]
                ?.businessCardInfo
            ) {
              const { businessCardInfo, ...rest } =
                updatedState[AccordionTitles.COMPANY_SELECTION];
              updatedState[AccordionTitles.COMPANY_SELECTION] = rest;
            }

            navigate(`/create2`, { state: updatedState });
          } else if (
            location.state?.companyId &&
            location.state?.activeTabKey
          ) {
            navigate(`/companies/${location.state.companyId}`, {
              state: {
                activeTabKey: location.state.activeTabKey,
              },
            });
          } else {
            setTimeout(() => navigate(`/contact/${contactIdForApi}`), 1000);
          }
        }
        // dispatch(setToastMessage(response?.message || SUCCESS_MESSAGE));
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

  const stepperSubmit = async (isSaveAndExit = false) => {
    if (activeStep === 0) {
      handleStepZeroSubmit(isSaveAndExit);
    } else if (activeStep === 1) {
      handleStepOneSubmit(isSaveAndExit);
    } else if (activeStep === 2) {
      handleStepTwoSubmit(isSaveAndExit);
    } else if (activeStep === 3) {
      handleStepThreeSubmit();
    }
  };

  const handleStepChange = async (newStep: number) => {
    setActiveStep(newStep);
  };

  const location = useLocation();

  const isEditModeFromUrl = location.pathname.includes("edit");

  const displayContactName = contactInfoFormMethods?.getValues()?.displayName; // in breadcrumb we are using this displayCompanyName

  return (
    <StyledPageContainer ref={pageTopRef}>
      <StyledCrumbContainer>
        <CommonBreadcrumb
          crumbs={getContactDetailsBreadcrumbs(
            isEditModeFromUrl,
            displayContactName
          )}
        />
      </StyledCrumbContainer>
      <ProgressWizard
        steps={stepperSteps}
        activeStep={activeStep}
        completedSteps={completedSteps} // Pass completed steps if needed
        onStepChange={handleStepChange}
        totalFields={percentage.totalFields} // Dynamically calculated
        fieldsFilled={percentage.filledValues} // Replace with actual filled fields
      />

      {/* //render fields based on */}
      {renderStepContent()}

      <FormActionsContainer>
        <StyledPrevButton
          variantType={BUTTON_VARIANTS.SECONDARY}
          onClick={handleCancel}
          label={BUTTON_LABELS.CANCEL}
        />
        {activeStep > 0 && (
          <StyledPrevButton
            onClick={handleBack}
            variantType={BUTTON_VARIANTS.SECONDARY}
            label={BUTTON_LABELS.PREVIOUS}
          />
        )}

        <StyledNextButton
          type={BUTTON_TYPE.BUTTON}
          variantType={BUTTON_VARIANTS.PRIMARY}
          onClick={() => stepperSubmit(false)}
          role="submit"
          data-testid="submit-button"
          loading={!saveAndExit && loading}
          // disabled={loading}
          label={
            !saveAndExit && loading
              ? ""
              : activeStep === steps.length - 1
              ? BUTTON_LABELS.SUBMIT
              : BUTTON_LABELS.NEXT
          }
        />
        {!(activeStep === steps.length - 1) && (
          <StyledNextButton
            type={BUTTON_TYPE.BUTTON}
            variantType={BUTTON_VARIANTS.PRIMARY}
            onClick={() => {
              // setSaveAndExit(true);
              stepperSubmit(true);
            }}
            role="submit"
            data-testid="submit-button"
            loading={saveAndExit && loading}
            // disabled={loading}
            label={saveAndExit && loading ? "" : BUTTON_LABELS.SAVE_AND_EXIT}
          />
        )}
      </FormActionsContainer>
    </StyledPageContainer>
  );
};

export default AddContacts;
