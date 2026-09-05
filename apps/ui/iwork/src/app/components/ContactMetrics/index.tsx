import React, { useState, useMemo, useEffect, useRef } from "react";
import {
    CustomModal,
    DynamicForm,
    useApiQuery,
    endPoints,
    Button,
    useApiMutation,
    HTTP_METHODS,
    setToastMessage,
    buildBreadcrumbState,
    getBreadcrumbsFromState,
    createBreadcrumbEntry,
} from "@ui/ui-lib";
import {
    GO_BACK,
    CONFIRM,
} from "../../constants";
import {
    ModalHeadingContainer,
    ModalMainHeading,
    ButtonContainer,
    StyledCancelButton,
    StyledUploadButton,
    StyledStack,
    ContactRow,
    ContactDetailsContainer,
    SectionContainer,
    SectionTitle,
    SectionHeaderContainer,
    SubsectionHeader,
    SubsectionHeaderWithMarginTop,
    SubsectionTitleText,
    EditIconButton,
    DropdownContainer,
    ContactInfoWrapper,
    ContactLabel,
    ContactValue,
    SectionDivider,
} from "./styles";
import {
    MODAL_TITLES,
    SECTION_TITLES,
    SUBSECTION_TITLES,
    BUTTON_LABELS,
    DEFAULT_DISPLAY_VALUE,
    MODAL_WIDTH,
    MODAL_MAX_WIDTH,
    MODAL_PADDING,
} from "./constants";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import EditIcon from "../../assets/svgs/edit-pencil-icon.svg";

interface ContactMetricsProps {
    open: boolean;
    handleClose: () => void;
    policyId: number;
    onView: () => void;
    hasUploadedData?: boolean;
    mode?: 'create' | 'edit' | 'view';
    existingData?: Record<string, string> | null;
    onSubmit?: (data: Record<string, string>) => void;
    onSuccess?: () => void;
}

interface ContactOption {
    value: number;
    label: string;
}

interface ContactDetails {
    contactId: number;
    displayName: string;
    firstName: string;
    lastName: string;
    designation?: string;
    department?: string;
    phone: string;
    email: string;
}

const ContactMetrics: React.FC<ContactMetricsProps> = ({
  open,
  handleClose,
  policyId,
  onView,
  hasUploadedData,
  mode = 'create',
  existingData = null,
  onSubmit,
  onSuccess,
}) => {
  // Store all form instances separately
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formMethodsRef = useRef<{ [key: string]: any }>({});
  const [formData, setFormData] = useState<Record<string, string | number>>({
    tpaPrimaryContact: '',
    tpaSecondaryContact: '',
    insurerPrimaryContact: '',
    insurerSecondaryContact: ''
  });
  const [tpaOptions, setTpaOptions] = useState<ContactOption[]>([]);
  const [insurerOptions, setInsurerOptions] = useState<ContactOption[]>([]);
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const portalReturnPath = `${location.pathname}${location.search ?? ""}`;
  const existingBreadcrumbs = getBreadcrumbsFromState(location.state);
  const contactBreadcrumbs =
    existingBreadcrumbs.length > 0
      ? existingBreadcrumbs
      : [
          createBreadcrumbEntry({
            label: "Policy details",
            path: portalReturnPath,
            key: "policy-details",
          }),
        ];

  // Fetch submitted contacts when in edit or view mode
  const {
    data: submittedContactsData,
  } = useApiQuery({
    url: endPoints.getSubmittedContacts(policyId),
    queryKey: ["submittedContacts", policyId],
    enabled: open && (mode === 'edit' || mode === 'view') && !!policyId,
  });

  // Mutation for updating contact matrix
  const mutation = useApiMutation({
    config: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onSuccess: (response: any) => {
        dispatch(setToastMessage(response?.message || "Contact matrix updated successfully"));
        handleClose();
        setFormData({
          tpaPrimaryContact: '',
          tpaSecondaryContact: '',
          insurerPrimaryContact: '',
          insurerSecondaryContact: ''
        });
        // Reset all form instances
        Object.values(formMethodsRef.current).forEach(methods => {
          if (methods) methods.reset();
        });
        // Refetch overview data to update the button text
        if (onSuccess) {
          onSuccess();
        }
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onError: (error: any) => {
        const errorMessage = Array.isArray(error?.message)
          ? error.message[0]
          : error?.message ?? "Failed to update contact matrix";
        dispatch(setToastMessage(errorMessage));
      },
    },
  });

  const handleCreateTpa = () => {
    const destinationConfig = {
      label: "Add contact details",
      path: "/tpa/contact/new",
      key: "tpa-contact-create",
    };
    const destinationState = buildBreadcrumbState({
      breadcrumbs: contactBreadcrumbs,
      crumb: destinationConfig,
      state: { returnTo: portalReturnPath },
    });
    navigate(destinationConfig.path, { state: destinationState });
  };

  const handleCreateInsurer = () => {
    const destinationConfig = {
      label: "Add contact details",
      path: "/insurer/contact/new",
      key: "insurer-contact-create",
    };
    const destinationState = buildBreadcrumbState({
      breadcrumbs: contactBreadcrumbs,
      crumb: destinationConfig,
      state: { returnTo: portalReturnPath },
    });
    navigate(destinationConfig.path, { state: destinationState });
  };

  const handleEditTpaContact = (contactId: number | undefined) => {
    if (contactId) {
      const destinationConfig = {
        label: "Edit contact details",
        path: `/tpa/contact/${contactId}/edit`,
        key: `tpa-contact-${contactId}-edit`,
      };
      const destinationState = buildBreadcrumbState({
        breadcrumbs: contactBreadcrumbs,
        crumb: destinationConfig,
        state: { returnTo: portalReturnPath },
      });
      navigate(destinationConfig.path, {
        state: destinationState,
      });
    }
  };

  const handleEditInsurerContact = (contactId: number | undefined) => {
    if (contactId) {
      const destinationConfig = {
        label: "Edit contact details",
        path: `/insurer/contact/${contactId}/edit`,
        key: `insurer-contact-${contactId}-edit`,
      };
      const destinationState = buildBreadcrumbState({
        breadcrumbs: contactBreadcrumbs,
        crumb: destinationConfig,
        state: { returnTo: portalReturnPath },
      });
      navigate(destinationConfig.path, {
        state: destinationState,
      });
    }
  };

  // Validate if selected contacts have phone and email
  const validateContactDetails = () => {
    const missingDetails: string[] = [];
    
    // Check TPA Primary
    if (formData.tpaPrimaryContact) {
      const contact = getContactDetails(formData.tpaPrimaryContact, tpaContactsData?.data?.contacts || []);
      if (!contact?.phone) {
        missingDetails.push('TPA Primary Contact');
      }
    }
    
    // Check TPA Secondary
    if (formData.tpaSecondaryContact) {
      const contact = getContactDetails(formData.tpaSecondaryContact, tpaContactsData?.data?.contacts || []);
      if (!contact?.phone) {
        missingDetails.push('TPA Secondary Contact');
      }
    }
    
    // Check Insurer Primary
    if (formData.insurerPrimaryContact) {
      const contact = getContactDetails(formData.insurerPrimaryContact, insurerContactsData?.data?.contacts || []);
      if (!contact?.phone) {
        missingDetails.push('Insurer Primary Contact');
      }
    }
    
    // Check Insurer Secondary
    if (formData.insurerSecondaryContact) {
      const contact = getContactDetails(formData.insurerSecondaryContact, insurerContactsData?.data?.contacts || []);
      if (!contact?.phone) {
        missingDetails.push('Insurer Secondary Contact');
      }
    }
    
    return missingDetails;
  };

  // Fetch policy party IDs to get TPA and Insurer IDs
  const {
    data: policyPartyData,
  } = useApiQuery({
    url: endPoints.policyPartyIds(policyId),
    queryKey: ["policyPartyIds", policyId],
    enabled: open && !!policyId,
  });

  // Extract IDs from policy party data
  const tpaPrimaryId = useMemo(() => 
    policyPartyData?.data?.tpa?.tpaId,
    [policyPartyData]
  );

  const insurerPrimaryId = useMemo(() => 
    policyPartyData?.data?.insurer?.insurerId,
    [policyPartyData]
  );

  // Extract display names from policy party data
  const tpaDisplayName = useMemo(() => 
    policyPartyData?.data?.tpa?.displayName,
    [policyPartyData]
  );

  const insurerDisplayName = useMemo(() => 
    policyPartyData?.data?.insurer?.displayName,
    [policyPartyData]
  );

  // Check if TPA/Insurer IDs exist
  const hasTpaIds = useMemo(() => {
    const tpa = policyPartyData?.data?.tpa;
    return tpa && tpa.tpaId;
  }, [policyPartyData]);

  const hasInsurerIds = useMemo(() => {
    const insurer = policyPartyData?.data?.insurer;
    return insurer && insurer.insurerId;
  }, [policyPartyData]);

  // Fetch TPA contacts (used for both primary and secondary dropdowns)
  const {
    data: tpaContactsData,
  } = useApiQuery({
    url: tpaPrimaryId ? endPoints.tpaContactsForPortal(tpaPrimaryId) : '',
    queryKey: ["tpaContactsForPortal", tpaPrimaryId],
    enabled: open && !!tpaPrimaryId,
  });

  // Fetch Insurer contacts (used for both primary and secondary dropdowns)
  const {
    data: insurerContactsData,
  } = useApiQuery({
    url: insurerPrimaryId ? endPoints.insurerContactsForPortal(insurerPrimaryId) : '',
    queryKey: ["insurerContactsForPortal", insurerPrimaryId],
    enabled: open && !!insurerPrimaryId,
  });

  // Helper function to convert API contacts to dropdown options
  const convertContactsToOptions = (data: { data?: { contacts?: ContactDetails[] } }): ContactOption[] => {
    const contactsArray = data?.data?.contacts || [];
    if (!Array.isArray(contactsArray)) return [];
    return contactsArray.map((contact: ContactDetails) => ({
      value: contact.contactId,
      label: contact.displayName,
    }));
  };

  // Update contact options when API data changes
  useEffect(() => {
    if (tpaContactsData) setTpaOptions(convertContactsToOptions(tpaContactsData));
    if (insurerContactsData) setInsurerOptions(convertContactsToOptions(insurerContactsData));
  }, [tpaContactsData, insurerContactsData]);

  // Helper to filter out already selected contact from options
  const getFilteredOptions = (allOptions: ContactOption[], excludeValue?: string | number) => {
    if (!excludeValue) return allOptions;
    return allOptions.filter(option => option.value !== Number(excludeValue));
  };

  // Helper to create form field config
  const createFieldConfig = React.useCallback((key: string, options: ContactOption[], isRequired = false, isDisabled = false) => ({
    key,
    name: key,
    label: "Select Contact",
    type: "select" as const,
    gridColumn: 12,
    componentProps: {
      fullWidth: true,
      placeholder: "Select Contacts",
      disabled: mode === 'view' || isDisabled,
      disablePortal: true,
      readOnly: mode === 'view',
    },
    options,
    ...(isRequired && !isDisabled && { rules: { required: "This field is required" } }),
  }), [mode]);

  // Memoize form config based on mode and fetched options
  const formConfig = useMemo(
    () => [
      createFieldConfig("tpaPrimaryContact", getFilteredOptions(tpaOptions, formData.tpaSecondaryContact), hasTpaIds, !hasTpaIds),
      createFieldConfig("tpaSecondaryContact", getFilteredOptions(tpaOptions, formData.tpaPrimaryContact), hasTpaIds, !hasTpaIds),
      createFieldConfig("insurerPrimaryContact", getFilteredOptions(insurerOptions, formData.insurerSecondaryContact), hasInsurerIds, !hasInsurerIds),
      createFieldConfig("insurerSecondaryContact", getFilteredOptions(insurerOptions, formData.insurerPrimaryContact), hasInsurerIds, !hasInsurerIds),
    ],
    [createFieldConfig, tpaOptions, insurerOptions, formData.tpaPrimaryContact, formData.tpaSecondaryContact, formData.insurerPrimaryContact, formData.insurerSecondaryContact, hasTpaIds, hasInsurerIds]
  );

  // Watch for form changes
  React.useEffect(() => {
    const subscriptions: (() => void)[] = [];
    
    Object.entries(formMethodsRef.current).forEach(([fieldName, methods]) => {
      if (methods?.watch) {
        const subscription = methods.watch((value: Record<string, string>) => {
          setFormData(prev => ({ ...prev, ...value }));
        });
        subscriptions.push(() => subscription.unsubscribe());
      }
    });
    
    return () => subscriptions.forEach(unsub => unsub());
  }, [formMethodsRef.current.tpaPrimaryContact, formMethodsRef.current.tpaSecondaryContact, 
      formMethodsRef.current.insurerPrimaryContact, formMethodsRef.current.insurerSecondaryContact]);

  // Reset or populate form data when modal state changes
  React.useEffect(() => {
    const emptyValues = {
      tpaPrimaryContact: '',
      tpaSecondaryContact: '',
      insurerPrimaryContact: '',
      insurerSecondaryContact: ''
    };

    if (!open) {
      setFormData(emptyValues);
      Object.values(formMethodsRef.current).forEach(methods => methods?.reset());
    } else if (submittedContactsData?.data && (mode === 'edit' || mode === 'view')) {
      // Populate form with submitted contacts from API
      const populatedData = {
        tpaPrimaryContact: submittedContactsData.data.tpa?.primary?.contactId || '',
        tpaSecondaryContact: submittedContactsData.data.tpa?.secondary?.contactId || '',
        insurerPrimaryContact: submittedContactsData.data.insurer?.primary?.contactId || '',
        insurerSecondaryContact: submittedContactsData.data.insurer?.secondary?.contactId || ''
      };
      setFormData(populatedData);
      // Reset each form individually with its specific value
      setTimeout(() => {
        if (formMethodsRef.current.tpaPrimaryContact) {
          formMethodsRef.current.tpaPrimaryContact.reset({
            tpaPrimaryContact: populatedData.tpaPrimaryContact,
          });
        }
        if (formMethodsRef.current.tpaSecondaryContact) {
          formMethodsRef.current.tpaSecondaryContact.reset({
            tpaSecondaryContact: populatedData.tpaSecondaryContact,
          });
        }
        if (formMethodsRef.current.insurerPrimaryContact) {
          formMethodsRef.current.insurerPrimaryContact.reset({
            insurerPrimaryContact: populatedData.insurerPrimaryContact,
          });
        }
        if (formMethodsRef.current.insurerSecondaryContact) {
          formMethodsRef.current.insurerSecondaryContact.reset({
            insurerSecondaryContact: populatedData.insurerSecondaryContact,
          });
        }
      }, 0.1);
    }
  }, [open, submittedContactsData, mode]);

  // Helper to build contact payload section
  const buildContactPayload = (
    primaryContactId: string | number | undefined,
    secondaryContactId: string | number | undefined,
    entityId: number | undefined,
    entityKey: 'tpaId' | 'insurerId'
  ): Record<string, { contactId: number; tpaId?: number; insurerId?: number }> | null => {
    const payload: Record<string, { contactId: number; tpaId?: number; insurerId?: number }> = {};
    
    if (primaryContactId && entityId) {
      payload.primary = {
        contactId: Number(primaryContactId),
        [entityKey]: entityId,
      };
    }
    
    if (secondaryContactId && entityId) {
      payload.secondary = {
        contactId: Number(secondaryContactId),
        [entityKey]: entityId,
      };
    }
    
    return Object.keys(payload).length > 0 ? payload : null;
  };

  const handleConfirmClick = async () => {
    // Validate only enabled required fields
    let isValid = true;
    const validationPromises: Promise<boolean>[] = [];
    
    // Only validate TPA contacts if TPA IDs exist
    if (hasTpaIds) {
      ['tpaPrimaryContact', 'tpaSecondaryContact'].forEach(fieldName => {
        const methods = formMethodsRef.current[fieldName];
        if (methods?.trigger) {
          validationPromises.push(methods.trigger());
        }
      });
    }
    
    // Only validate Insurer contacts if Insurer IDs exist
    if (hasInsurerIds) {
      ['insurerPrimaryContact', 'insurerSecondaryContact'].forEach(fieldName => {
        const methods = formMethodsRef.current[fieldName];
        if (methods?.trigger) {
          validationPromises.push(methods.trigger());
        }
      });
    }
    
    const validationResults = await Promise.all(validationPromises);
    isValid = validationResults.every(result => result === true);
    
    if (!isValid) {
      dispatch(setToastMessage("Please fill all required fields"));
      return;
    }
    
    const allValues: Record<string, string | number> = {};
    Object.entries(formMethodsRef.current).forEach(([, methods]) => {
      if (methods?.getValues) {
        Object.assign(allValues, methods.getValues());
      }
    });
    
    // Validate contact details
    const missingDetails = validateContactDetails();
    if (missingDetails.length > 0) {
      const message = `The selected contact(s) are missing phone number. Please add the phone number by clicking the edit button for: ${missingDetails.join(', ')}`;
      dispatch(setToastMessage(message));
      return;
    }
    
    try {
      const payload: Record<string, unknown> = {};
      
      const tpaPayload = buildContactPayload(
        allValues.tpaPrimaryContact,
        allValues.tpaSecondaryContact,
        tpaPrimaryId,
        'tpaId'
      );
      if (tpaPayload) payload.tpa = tpaPayload;
      
      const insurerPayload = buildContactPayload(
        allValues.insurerPrimaryContact,
        allValues.insurerSecondaryContact,
        insurerPrimaryId,
        'insurerId'
      );
      if (insurerPayload) payload.insurer = insurerPayload;

      mutation.mutate({
        endpoint: endPoints.updateContactMatrix(policyId),
        method: HTTP_METHODS.PUT,
        data: payload,
      });
    } catch (error) {
      console.error("Error updating contact matrix:", error);
    }
  };

    // Get contact details - use submitted data in edit/view mode, otherwise use from dropdown options
    const getContactDetails = (contactId: string | number, contactList: ContactDetails[]) => {
        if (!contactId || !contactList) return null;
        return contactList.find(contact => contact.contactId === Number(contactId));
    };

    // Helper to get contact info from submitted data or dropdown
    const getContactInfoForDisplay = (fieldName: string) => {
      // In view mode only, show submitted data
      if (mode === 'view' && submittedContactsData?.data) {
        // Map field names to submitted data paths
        if (fieldName === 'tpaPrimaryContact') {
          return submittedContactsData.data.tpa?.primary;
        } else if (fieldName === 'tpaSecondaryContact') {
          return submittedContactsData.data.tpa?.secondary;
        } else if (fieldName === 'insurerPrimaryContact') {
          return submittedContactsData.data.insurer?.primary;
        } else if (fieldName === 'insurerSecondaryContact') {
          return submittedContactsData.data.insurer?.secondary;
        }
      }
      // In create and edit mode, always fetch from dropdown options based on current selection
      if (fieldName === 'tpaPrimaryContact') {
        return getContactDetails(formData?.tpaPrimaryContact, tpaContactsData?.data?.contacts || []);
      } else if (fieldName === 'tpaSecondaryContact') {
        return getContactDetails(formData?.tpaSecondaryContact, tpaContactsData?.data?.contacts || []);
      } else if (fieldName === 'insurerPrimaryContact') {
        return getContactDetails(formData?.insurerPrimaryContact, insurerContactsData?.data?.contacts || []);
      } else if (fieldName === 'insurerSecondaryContact') {
        return getContactDetails(formData?.insurerSecondaryContact, insurerContactsData?.data?.contacts || []);
      }
      return null;
    };

    const renderContactInfo = (contactDetails?: ContactDetails | null) => (
        <ContactDetailsContainer>
            <ContactInfoWrapper>
                <ContactLabel>Phone:</ContactLabel>
                <ContactValue>{contactDetails?.phone || DEFAULT_DISPLAY_VALUE}</ContactValue>
            </ContactInfoWrapper>
            <ContactInfoWrapper>
                <ContactLabel>Email:</ContactLabel>
                <ContactValue>{contactDetails?.email || DEFAULT_DISPLAY_VALUE}</ContactValue>
            </ContactInfoWrapper>
        </ContactDetailsContainer>
    );

    const headingChildren = () => (
        <ModalHeadingContainer>
            <ModalMainHeading>
                {mode === 'create' ? MODAL_TITLES.CREATE : 
                 mode === 'edit' ? MODAL_TITLES.EDIT : 
                 MODAL_TITLES.VIEW}
            </ModalMainHeading>
        </ModalHeadingContainer>
    );

    return (
        <CustomModal
            open={open}
            handleClose={handleClose}
            heading={headingChildren()}
            modalBoxStyles={{ width: MODAL_WIDTH, padding: MODAL_PADDING, maxWidth: MODAL_MAX_WIDTH }}
        >
            <StyledStack spacing={3}>
                {/* Insurer Section */}
                <SectionContainer>
                    <SectionHeaderContainer>
                        <SectionTitle variant="h6">
                            {SECTION_TITLES.INSURER}{insurerDisplayName ? ` - ${insurerDisplayName}` : ''}
                        </SectionTitle>
                        {mode !== 'view' && hasInsurerIds && (
                            <Button 
                                label="Create" 
                                variantType="primary" 
                                sizeType="small"
                                onClick={handleCreateInsurer}
                            />
                        )}
                    </SectionHeaderContainer>
                    
                    {/* Insurer Primary */}
                    <SubsectionHeader>
                        <SubsectionTitleText>{SUBSECTION_TITLES.PRIMARY}</SubsectionTitleText>
                    </SubsectionHeader>
                    <ContactRow>
                        <DropdownContainer>
                            <DynamicForm
                                key={`insurerPrimaryContact-${formData.insurerPrimaryContact}-${open}`}
                                formConfig={formConfig.filter(f => f.key === 'insurerPrimaryContact')}
                                formMethods={(methods) => {
                                    formMethodsRef.current.insurerPrimaryContact = methods;
                                    // Force re-render to trigger state update
                                    setFormData(prev => ({ ...prev }));
                                }}
                                variant="iwork"
                                defaultValues={{ insurerPrimaryContact: formData.insurerPrimaryContact }}
                            />
                        </DropdownContainer>
                        {renderContactInfo(
                            getContactInfoForDisplay('insurerPrimaryContact')
                        )}
                        {formData.insurerPrimaryContact && mode !== 'view' && (
                            <EditIconButton onClick={() => handleEditInsurerContact(Number(formData.insurerPrimaryContact))}>
                                <img src={EditIcon} alt="Edit" style={{ width: '16px', height: '16px' }} />
                            </EditIconButton>
                        )}
                    </ContactRow>
                    
                    {/* Insurer Secondary */}
                    <SubsectionHeaderWithMarginTop>
                        <SubsectionTitleText>{SUBSECTION_TITLES.SECONDARY}</SubsectionTitleText>
                    </SubsectionHeaderWithMarginTop>
                    <ContactRow>
                        <DropdownContainer>
                            <DynamicForm
                                key={`insurerSecondaryContact-${formData.insurerSecondaryContact}-${open}`}
                                formConfig={formConfig.filter(f => f.key === 'insurerSecondaryContact')}
                                formMethods={(methods) => {
                                    formMethodsRef.current.insurerSecondaryContact = methods;
                                    // Force re-render to trigger state update
                                    setFormData(prev => ({ ...prev }));
                                }}
                                variant="iwork"
                                defaultValues={{ insurerSecondaryContact: formData.insurerSecondaryContact }}
                            />
                        </DropdownContainer>
                        {renderContactInfo(
                            getContactInfoForDisplay('insurerSecondaryContact')
                        )}
                        {formData.insurerSecondaryContact && mode !== 'view' && (
                            <EditIconButton onClick={() => handleEditInsurerContact(Number(formData.insurerSecondaryContact))}>
                                <img src={EditIcon} alt="Edit" style={{ width: '16px', height: '16px' }} />
                            </EditIconButton>
                        )}
                    </ContactRow>
                </SectionContainer>
                <SectionDivider />

                {/* TPA Section */}
                <SectionContainer>
                    <SectionHeaderContainer>
                        <SectionTitle variant="h6">
                            {SECTION_TITLES.TPA}{tpaDisplayName ? ` - ${tpaDisplayName}` : ''}
                        </SectionTitle>
                        {mode !== 'view' && hasTpaIds && (
                            <Button 
                                label="Create" 
                                variantType="primary" 
                                sizeType="small"
                                onClick={handleCreateTpa}
                            />
                        )}
                    </SectionHeaderContainer>
                    
                    {/* TPA Primary */}
                    <SubsectionHeader>
                        <SubsectionTitleText>{SUBSECTION_TITLES.PRIMARY}</SubsectionTitleText>
                    </SubsectionHeader>
                    <ContactRow>
                        <DropdownContainer>
                            <DynamicForm
                                  key={`tpaPrimaryContact-${formData.tpaPrimaryContact}-${open}`}
                                formConfig={formConfig.filter(f => f.key === 'tpaPrimaryContact')}
                                formMethods={(methods) => {
                                    formMethodsRef.current.tpaPrimaryContact = methods;
                                    // Force re-render to trigger state update
                                    setFormData(prev => ({ ...prev }));
                                }}
                                variant="iwork"
                                defaultValues={{ tpaPrimaryContact: formData.tpaPrimaryContact }}
                            />
                        </DropdownContainer>
                        {renderContactInfo(
                            getContactInfoForDisplay('tpaPrimaryContact')
                        )}
                        {formData.tpaPrimaryContact && mode !== 'view' && (
                            <EditIconButton onClick={() => handleEditTpaContact(Number(formData.tpaPrimaryContact))}>
                                <img src={EditIcon} alt="Edit" style={{ width: '16px', height: '16px' }} />
                            </EditIconButton>
                        )}
                    </ContactRow>
                    
                    {/* TPA Secondary */}
                    <SubsectionHeaderWithMarginTop>
                        <SubsectionTitleText>{SUBSECTION_TITLES.SECONDARY}</SubsectionTitleText>
                    </SubsectionHeaderWithMarginTop>
                    <ContactRow>
                        <DropdownContainer>
                            <DynamicForm
                                
                                formConfig={formConfig.filter(f => f.key === 'tpaSecondaryContact')}
                                formMethods={(methods) => {
                                    formMethodsRef.current.tpaSecondaryContact = methods;
                                    // Force re-render to trigger state update
                                    setFormData(prev => ({ ...prev }));
                                }}
                                variant="iwork"
                                defaultValues={{ tpaSecondaryContact: formData.tpaSecondaryContact }}
                            />
                        </DropdownContainer>
                        {renderContactInfo(
                            getContactInfoForDisplay('tpaSecondaryContact')
                        )}
                        {formData.tpaSecondaryContact && mode !== 'view' && (
                            <EditIconButton onClick={() => handleEditTpaContact(Number(formData.tpaSecondaryContact))}>
                                <img src={EditIcon} alt="Edit" style={{ width: '16px', height: '16px' }} />
                            </EditIconButton>
                        )}
                    </ContactRow>
                </SectionContainer>
            </StyledStack>
            {mode !== 'view' && (
                <ButtonContainer>
                    <StyledCancelButton onClick={handleClose}>{GO_BACK}</StyledCancelButton>
                    <StyledUploadButton
                        // disabled={!isFormValid()}
                        onClick={handleConfirmClick}
                    >
                        {mode === 'edit' ? BUTTON_LABELS.UPDATE : CONFIRM}
                    </StyledUploadButton>
                </ButtonContainer>
            )}
            {mode === 'view' && (
                <ButtonContainer>
                    <StyledCancelButton onClick={handleClose}>{BUTTON_LABELS.CLOSE}</StyledCancelButton>
                </ButtonContainer>
            )}
        </CustomModal>
    );
};

export default ContactMetrics;
