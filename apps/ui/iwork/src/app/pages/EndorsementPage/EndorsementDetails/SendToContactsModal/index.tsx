import React, { useState,useEffect, useMemo } from "react";
import { Modal, CircularProgress, TextField, Box, Tooltip } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import EmailIcon from "@mui/icons-material/Email";
import CheckIcon from "@mui/icons-material/Check";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import SendIcon from "@mui/icons-material/Send";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import InfoIcon from "@mui/icons-material/Info";
import {
  Button,
  DynamicForm,
  endPoints,
  setToastMessage,
  useApiQuery,
  useApiMutation,
  CANCEL,
  useLookupIdByKey,
  environment,
  REGEX_PATTERNS,
  ValidationErrors,
} from "@ui/ui-lib";
import { useDispatch } from "react-redux";
import { LookUpValues } from "../../../../constants/lookupValues";
import { Contact, ContactEmail, ContactFormFields, ComposeEmailFields, EmailFieldConfig } from "./config";
import { ChipRenderer } from "@ui/ui-lib";
import {
  ModalContainer,
  ModalHeader,
  ModalHeaderLeft,
  ModalHeaderContent,
  SendIconContainer,
  ModalTitle,
  ModalSubtitle,
  CloseButton,
  ModalBody,
  ContactCard,
  ContactHeader,
  ContactInfo,
  ContactName,
  ContactMeta,
  ContactActions,
  ActionIcon,
  EmailChipsContainer,
  EmailChip,
  EmailChipIcon,
  WarningBanner,
  WarningText,
  AddEmailButton,
  AddEmailContainer,
  EmailInputWrapper,
  EmailInput,
  AddNewContactButton,
  EditContactPanel,
  EditContactHeader,
  AddContactPanel,
  AddContactHeader,
  FormActions,
  ModalFooter,
  FooterInfo,
  SelectionIndicator,
  CheckCircle,
  SelectionText,
  SelectionSubtext,
  FooterActions,
  StyledCheckbox,
  LoaderContainer,
  EmailFieldLabel,
  EmailFieldRow,
  EmailFieldWrapper,
  DeleteEmailButtonStyled,
  AddAnotherEmailButtonStyled,
  SaveEditButton,
  SaveContactButton,
  AddEmailInlineButton,
  SendButton,
  SelectionTextColored,
  ComposeEmailContainer,
  EmailFieldContainer,
  EmailFieldLabelTypography,
  EmailChipsWrapper,
  EmailFieldHelperText,
  CCTextField,
  emailChipStyleConfig,
} from "./styles";
import { ADD_CC_SUBTITLE, CLIENT_TAG, CONTACTS_CONTAINER, EMAIL_COUNT_VALIDATION, EMAIL_REPETITION_VALIDATION, EMAIL_VALIDATION, INFO_TOOLTIP, INSURER_TAG, NEXT, PREVIOUS } from "../../../../constants";

interface SendToContactsModalProps {
  open: boolean;
  onClose: () => void;
  policyId: number;
  contactType: string;
  documentIds?: number[]; // New prop to receive document IDs
  onSendSuccess: () => void;
}

const SendToContactsModal: React.FC<SendToContactsModalProps> = ({
  open,
  onClose,
  policyId,
  contactType,
  documentIds,
  onSendSuccess,
}) => {
  const dispatch = useDispatch();
  
  // Lookup IDs
  const companyContactRecordTypeId = useLookupIdByKey(LookUpValues.COMPANY_CONTACT);
  const insurerContactRecordTypeId = useLookupIdByKey(LookUpValues.INSURER_CONTACT);
  const businessContactTypeId = useLookupIdByKey(LookUpValues.CONTACT_TYPE_BUSINESS);
  const statusActiveId = useLookupIdByKey(LookUpValues.CONTACT_STATUS_ACTIVE);
  
  // Step tracking state
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [ccEmailInput, setCcEmailInput] = useState<string>("");
  const [fromEmail] = useState<string>(environment.fromEmail);
  
  const [selectedContacts, setSelectedContacts] = useState<Set<number>>(
    new Set(),
  );
  const [selectedEmails, setSelectedEmails] = useState<
    Map<number, Set<number>>
  >(new Map());
  const [editingContactId, setEditingContactId] = useState<number | null>(null);
  const [addingNewContact, setAddingNewContact] = useState(false);
  const [addingEmailToContact, setAddingEmailToContact] = useState<
    number | null
  >(null);
  const [newEmailInput, setNewEmailInput] = useState("");
  const [editFormMethods, setEditFormMethods] = useState<any>(null);
  const [newContactFormMethods, setNewContactFormMethods] = useState<any>(null);
  const [isNewFormValid, setIsNewFormValid] = useState(false);

  // Form states for editing
  const [editForm, setEditForm] = useState<Partial<Contact>>({});
  const [newContactForm, setNewContactForm] = useState<Partial<Contact>>({
    emails: [{ email: "" }],
  });

  // Fetch contacts
  const contactDetails = contactType === "insurer" ? "insurers" : "company";
  const {
    data: contactsData,
    isLoading: contactsLoading,
    refetch: refetchContacts,
  } = useApiQuery({
    url: endPoints.getContactByPolicyId(policyId, contactDetails),
    queryKey: ["policy-contacts", policyId, contactType],
    enabled: open && !!policyId,
  });

  // Fetch policy details for location and branch
  const {
    data: policyDetailsData,
    isLoading: policyDetailsLoading,
  } = useApiQuery({
    url: endPoints.getBasicDetailsByPolicyId(policyId),
    queryKey: ["policy-details", policyId],
    enabled: open && !!policyId,
  });

  // Extract companyId and opportunityId from policy details
  const policyResponseData = policyDetailsData?.data?.data || policyDetailsData?.data || policyDetailsData;
  const extractedCompanyId = policyResponseData?.companyId;
  const opportunityId = policyResponseData?.opportunityId;

  // Fetch company details when opportunityId is null (fallback mechanism)
  const {
    data: companyDetailsData,
    isLoading: companyDetailsLoading,
  } = useApiQuery({
    url: endPoints.companyDetailsById(extractedCompanyId),
    queryKey: ["company-details", extractedCompanyId],
    enabled: open && !!extractedCompanyId && opportunityId === null,
  });

  // Extract location options, branch options, companyId, and companyLocationId based on contactType
  const { locationOptions, branchOptions, locationValue, branchValue, companyId, companyLocationId } = useMemo(() => {
    if (!policyDetailsData) {
      return { 
        locationOptions: [], 
        branchOptions: [], 
        locationValue: "", 
        branchValue: "", 
        companyId: undefined, 
        companyLocationId: undefined 
      };
    }

    const responseData = policyDetailsData?.data?.data || policyDetailsData?.data || policyDetailsData;

    // Fallback: If opportunityId is null, use company details
    if (responseData?.opportunityId === null && companyDetailsData) {
      const companyData = companyDetailsData?.data?.data || companyDetailsData?.data || companyDetailsData;
      const companyAddresses = companyData?.companyAddresses || [];

      // Extract unique cities for location dropdown
      const cityMap = new Map();
      companyAddresses.forEach((address: any) => {
        if (address?.cityId?.id && !cityMap.has(address.cityId.id)) {
          cityMap.set(address.cityId.id, {
            label: address.cityId.name,
            value: address.cityId.id,
          });
        }
      });
      const locationOpts = Array.from(cityMap.values());

      // Extract all addresses for branch dropdown
      const branchOpts = companyAddresses
        .filter((address: any) => address?.address1)
        .map((address: any) => ({
          label: address.address1,
          value: address.id,
        }));

      // Use first address for default values
      const firstAddress = companyAddresses[0];
      const location = firstAddress?.cityId?.name || "";
      const branch = firstAddress?.address1 || "";
      const compId = companyData?.id || responseData?.companyId;
      const locId = firstAddress?.id;

      return {
        locationOptions: locationOpts,
        branchOptions: branchOpts,
        locationValue: location,
        branchValue: branch,
        companyId: compId,
        companyLocationId: locId,
      };
    }

    if (contactType === "insurer") {
      // For insurer: get from all insurerDetails
      const insurers = responseData.insurerDetails || [];
      
      // Extract all unique cities for location dropdown
      const locationOpts = insurers
        .map((ins: any) => ins?.addressDetails?.city?.displayName)
        .filter((city: string) => city)
        .map((city: string) => ({ label: city, value: city }));
      
      // Extract all address1 and address2 for branch dropdown
      const branchOpts: any[] = [];
      insurers.forEach((ins: any) => {
        const addr1 = ins?.addressDetails?.address1;
        const addr2 = ins?.addressDetails?.address2;
        if (addr1) branchOpts.push({ label: addr1, value: addr1 });
        if (addr2) branchOpts.push({ label: addr2, value: addr2 });
      });
      
      // Use first insurer for default values
      const firstInsurer = insurers[0];
      const addressDetails = firstInsurer?.addressDetails;
      const location = addressDetails?.city?.displayName || "";
      const branch = addressDetails?.address1 || "";
      const insurerId = firstInsurer?.insurerDetails?.id;
      const insurerLocationId = addressDetails?.id;
      
      
      return { 
        locationOptions: locationOpts,
        branchOptions: branchOpts,
        locationValue: location, 
        branchValue: branch,
        companyId: insurerId,
        companyLocationId: insurerLocationId
      };
    } else {
      // For client: get from all riskLocations
      const riskLocations = responseData.riskLocations || [];
      
      // Extract all address1 and address2 for location dropdown
      const locationOpts: any[] = [];
      riskLocations.forEach((loc: any) => {
        const addr1 = loc?.address?.address1;
        const addr2 = loc?.address?.address2;
        if (addr1) locationOpts.push({ label: addr1, value: addr1 });
        if (addr2) locationOpts.push({ label: addr2, value: addr2 });
      });
      
      // Extract all unique cities for branch dropdown
      const branchOpts = riskLocations
        .map((loc: any) => loc?.address?.city?.name)
        .filter((city: string) => city)
        .map((city: string) => ({ label: city, value: city }));
      
      // Use first risk location for default values
      const firstRiskLocation = riskLocations[0];
      const address = firstRiskLocation?.address;
      const location = address?.address1 || "";
      const branch = address?.city?.name || "";
      const clientCompanyId = responseData.companyId;
      const clientLocationId = address?.id;
      
      return { 
        locationOptions: locationOpts,
        branchOptions: branchOpts,
        locationValue: location, 
        branchValue: branch,
        companyId: clientCompanyId,
        companyLocationId: clientLocationId
      };
    }
  }, [policyDetailsData, contactType, companyDetailsData]);

  const contacts: Contact[] = useMemo(() => {
    // Handle different API response structures
    if (!contactsData) return [];

    // Extract the nested data
    const responseData =
      contactsData?.data?.data || contactsData?.data || contactsData;

    if (!Array.isArray(responseData)) return [];

    const flattenedContacts: Contact[] = [];

    responseData.forEach((item: any) => {
      // Check if this is an insurer object with nested contacts array
      if (item.contacts && Array.isArray(item.contacts)) {
        // Insurer format: each item has insurerId and contacts array
        item.contacts.forEach((contact: any) => {
          const emails: ContactEmail[] =
            contact.communicationDetails
              ?.filter((comm: any) => comm.communicationType === "email")
              .map((comm: any) => ({
                id: comm.id, // Use the actual communication detail ID from API
                email: comm.communicationDetails || "",
              })) || [];

          flattenedContacts.push({
            id: contact.contactId,
            displayName: contact.displayName,
            firstName: contact.firstName,
            lastName: contact.lastName,
            department: contact.department,
            designation: contact.designation,
            emails: emails,
            // Preserve API fields
            companyId: contact.companyId,
            companyLocationId: contact.companyLocationId,
            companyBranchId: contact.companyBranchId,
            contactTypeLid: contact.contactTypeLid,
            contactRecordTypeLid: contact.contactRecordTypeLid,
            statusLid: contact.statusLid,
          });
        });
      } else if (item.contactId) {
        // Client/Company format: direct array of contacts (no nesting)
        const emails: ContactEmail[] =
          item.communicationDetails
            ?.filter((comm: any) => comm.communicationType === "email")
            .map((comm: any) => ({
              id: comm.id, // Use the actual communication detail ID from API
              email: comm.communicationDetails || "",
            })) || [];

        flattenedContacts.push({
          id: item.contactId,
          displayName: item.displayName,
          firstName: item.firstName,
          lastName: item.lastName,
          department: item.department,
          designation: item.designation,
          emails: emails,
          // Preserve API fields
          companyId: item.companyId,
          companyLocationId: item.companyLocationId,
          companyBranchId: item.companyBranchId,
          contactTypeLid: item.contactTypeLid,
          contactRecordTypeLid: item.contactRecordTypeLid,
          statusLid: item.statusLid,
        });
      }
    });

    return flattenedContacts;
  }, [contactsData]);

  // Mutations
  const { mutate: createContact, isPending: isCreating } = useApiMutation({});
  const { mutate: updateContact, isPending: isUpdating } = useApiMutation({});
  const { mutate: sendNotification, isPending: isSending } = useApiMutation({});

  // Handle contact checkbox toggle
  const handleContactToggle = (contactId: number) => {
    const newSelected = new Set(selectedContacts);
    const contact = contacts.find((c) => c.id === contactId);

    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
      // Remove all emails for this contact
      const newSelectedEmails = new Map(selectedEmails);
      newSelectedEmails.delete(contactId);
      setSelectedEmails(newSelectedEmails);
    } else {
      newSelected.add(contactId);
      // Auto-select all emails for this contact
      if (contact && contact.emails.length > 0) {
        const newSelectedEmails = new Map(selectedEmails);
        const emailIds = new Set(
          contact.emails.map((e) => e.id).filter((id): id is number => !!id),
        );
        newSelectedEmails.set(contactId, emailIds);
        setSelectedEmails(newSelectedEmails);
      }
    }
    setSelectedContacts(newSelected);
  };

  // Handle individual email chip click
  const handleEmailChipToggle = (contactId: number, emailId: number) => {
    const newSelectedEmails = new Map(selectedEmails);
    const contactEmails = newSelectedEmails.get(contactId) || new Set();

    if (contactEmails.has(emailId)) {
      contactEmails.delete(emailId);
      if (contactEmails.size === 0) {
        newSelectedEmails.delete(contactId);
        // Also uncheck the contact
        const newSelected = new Set(selectedContacts);
        newSelected.delete(contactId);
        setSelectedContacts(newSelected);
      } else {
        newSelectedEmails.set(contactId, contactEmails);
      }
    } else {
      contactEmails.add(emailId);
      newSelectedEmails.set(contactId, contactEmails);
      // Also check the contact
      setSelectedContacts(new Set(selectedContacts).add(contactId));
    }

    setSelectedEmails(newSelectedEmails);
  };

  // Start editing contact
  const handleEditContact = (contact: Contact) => {
    setEditForm({ ...contact });
    setEditingContactId(contact.id);
    setAddingNewContact(false);
  };

  // Reset selections when modal opens or contactType changes
  useEffect(() => {
    if (open) {
      setCurrentStep(1);
      setSelectedContacts(new Set());
      setSelectedEmails(new Map());
      setCcEmails([]);
      setCcEmailInput("");
    }
  }, [open, contactType]);

  // Validate selections when contacts data changes (remove orphaned email IDs)
  useEffect(() => {
    if (!contacts || contacts.length === 0) return;

    const validEmailIds = new Set<number>();
    const validContactIds = new Set<number>();
    
    contacts.forEach(contact => {
      validContactIds.add(contact.id);
      contact.emails.forEach(email => {
        if (email.id) validEmailIds.add(email.id);
      });
    });

    // Clean up selectedContacts
    const newSelectedContacts = new Set<number>();
    selectedContacts.forEach(contactId => {
      if (validContactIds.has(contactId)) {
        newSelectedContacts.add(contactId);
      }
    });

    // Clean up selectedEmails
    const newSelectedEmails = new Map<number, Set<number>>();
    selectedEmails.forEach((emailSet, contactId) => {
      if (validContactIds.has(contactId)) {
        const validEmails = new Set<number>();
        emailSet.forEach(emailId => {
          if (validEmailIds.has(emailId)) {
            validEmails.add(emailId);
          }
        });
        if (validEmails.size > 0) {
          newSelectedEmails.set(contactId, validEmails);
        }
      }
    });

    // Update state only if something changed
    if (newSelectedContacts.size !== selectedContacts.size) {
      setSelectedContacts(newSelectedContacts);
    }
    if (newSelectedEmails.size !== selectedEmails.size ||
        Array.from(newSelectedEmails.entries()).some(([contactId, emails]) => 
          emails.size !== selectedEmails.get(contactId)?.size
        )) {
      setSelectedEmails(newSelectedEmails);
    }
  }, [contacts]);

  // Validate new contact form
  useEffect(() => {
    const validateNewForm = async () => {
      if (!newContactFormMethods) {
        setIsNewFormValid(false);
        return;
      }
      
      const formValues = newContactFormMethods.getValues();
      const hasAtLeastOneEmail = newContactForm.emails?.some(e => e.email?.trim());
      
      const allFieldsFilled = 
        formValues.firstName?.trim() &&
        formValues.lastName?.trim() &&
        formValues.displayName?.trim() &&
        formValues.department?.trim() &&
        formValues.designation?.trim() &&
        formValues.location &&
        formValues.branch &&
        hasAtLeastOneEmail;
      
      setIsNewFormValid(!!allFieldsFilled);
    };
    
    validateNewForm();
  }, [newContactFormMethods, newContactForm]);

  // Helper function to build contact object for API
  const buildContactObject = (params: {
    contactId?: number;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    department?: string;
    designation?: string;
    communicationDetails: any[];
    companyBranchId?: number;
    statusLid?: number;
  }) => {
    const {
      contactId,
      firstName,
      lastName,
      displayName,
      department,
      designation,
      communicationDetails,
      companyBranchId,
      statusLid,
    } = params;

    return {
      ...(contactId && { contactId }),
      firstName: firstName || "",
      lastName: lastName || "",
      displayName: displayName || "",
      department: department || "",
      designation: designation || "",
      communicationDetails,
      companyId: companyId,
      companyLocationId: companyLocationId, 
      contactTypeLid: businessContactTypeId,
      contactRecordTypeLid: contactDetails === "company" ? companyContactRecordTypeId : insurerContactRecordTypeId,
      ...(companyBranchId && { companyBranchId }),
      ...(contactDetails === "company" && { statusLid: statusLid || statusActiveId }),
    };
  };

  // Save edited contact
  const handleSaveEdit = async () => {
    if (!editFormMethods) return;

    const isValid = await editFormMethods.trigger();
    if (!isValid) {
      dispatch(setToastMessage("Please fill all required fields"));
      return;
    }

    // Get emails from state
    const emailsArray = (editForm.emails || [])
      .map((e) => e.email)
      .filter((email) => email && email.trim());

    if (emailsArray.length === 0) {
      dispatch(setToastMessage(EMAIL_VALIDATION));
      return;
    }

    // Validate email format
    const invalidEmails = emailsArray.filter(
      (email) => !REGEX_PATTERNS.EMAIL.test(email)
    );
    if (invalidEmails.length > 0) {
      dispatch(setToastMessage(ValidationErrors.EMAIL));
      return;
    }

    const formData = editFormMethods.getValues();

    const communicationDetails = emailsArray.map((email: string, index: number) => ({
      communicationType: "email",
      communicationDetails: email,
      isPrimary: index === 0,
    }));

    // Get original contact data to preserve required fields
    const originalContact = contacts.find(c => c.id === editForm.id);
    
    // Build contact object using helper function
    const contact = buildContactObject({
      contactId: editForm.id,
      firstName: formData.firstName,
      lastName: formData.lastName,
      displayName: formData.displayName,
      department: formData.department,
      designation: formData.designation,
      communicationDetails,
      companyBranchId: originalContact?.companyBranchId,
      statusLid: originalContact?.statusLid,
    });

    const requestData = {
      contactDetails,
      contacts: [contact],
    };

    updateContact(
      {
        endpoint: endPoints.saveContactsForPolicy(policyId, contactDetails),
        method: "POST",
        data: requestData,
      },
      {
        onSuccess: () => {
          dispatch(setToastMessage("Contact updated successfully"));
          
          // Clear selection state for this contact after edit
          // Since email IDs change after edit, user should re-select if needed
          if (editForm.id) {
            const newSelectedEmailsMap = new Map(selectedEmails);
            newSelectedEmailsMap.delete(editForm.id);
            setSelectedEmails(newSelectedEmailsMap);
            
            // Also uncheck the contact
            const newSelectedContacts = new Set(selectedContacts);
            newSelectedContacts.delete(editForm.id);
            setSelectedContacts(newSelectedContacts);
          }
          
          setEditingContactId(null);
          setEditForm({});
          setEditFormMethods(null);
          refetchContacts();
        },
        onError: (error: any) => {
          const msg = Array.isArray(error?.message)
            ? error.message[0]
            : error?.message || "Failed to update contact";
          dispatch(setToastMessage(msg));
        },
      },
    );
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingContactId(null);
    setEditForm({});
    setEditFormMethods(null);
  };

  // Add new contact
  const handleAddNewContact = async () => {
    if (!newContactFormMethods) return;

    const isValid = await newContactFormMethods.trigger();
    if (!isValid) {
      dispatch(setToastMessage("Please fill all required fields"));
      return;
    }

    // Get emails from state
    const emailsArray = (newContactForm.emails || [])
      .map((e) => e.email)
      .filter((email) => email && email.trim());

    if (emailsArray.length === 0) {
      dispatch(setToastMessage(EMAIL_VALIDATION));
      return;
    }

    // Validate email format
    const invalidEmails = emailsArray.filter(
      (email) => !REGEX_PATTERNS.EMAIL.test(email)
    );
    if (invalidEmails.length > 0) {
      dispatch(setToastMessage(ValidationErrors.EMAIL));
      return;
    }

    const formData = newContactFormMethods.getValues();

    const communicationDetails = emailsArray.map((email: string, index: number) => ({
      communicationType: "email",
      communicationDetails: email,
      isPrimary: index === 0,
    }));

    // Build contact object using helper function
    const contact = buildContactObject({
      firstName: formData.firstName,
      lastName: formData.lastName,
      displayName: formData.displayName,
      department: formData.department,
      designation: formData.designation,
      communicationDetails,
    });

    const requestData = {
      contactDetails,
      contacts: [contact],
    };

    createContact(
      {
        endpoint: endPoints.saveContactsForPolicy(policyId, contactDetails),
        method: "POST",
        data: requestData,
      },
      {
        onSuccess: () => {
          dispatch(setToastMessage("Contact created successfully"));
          setAddingNewContact(false);
          setNewContactForm({ emails: [{ email: "" }] });
          setNewContactFormMethods(null);
          refetchContacts();
        },
        onError: (error: any) => {
          const msg = Array.isArray(error?.message)
            ? error.message[0]
            : error?.message || "Failed to create contact";
          dispatch(setToastMessage(msg));
        },
      },
    );
  };

  // Add email inline
  const handleAddEmailInline = (contactId: number) => {
    if (!newEmailInput || !newEmailInput.trim()) {
      dispatch(setToastMessage("Please enter a valid email address"));
      return;
    }

    // Validate email format
    if (!REGEX_PATTERNS.EMAIL.test(newEmailInput.trim())) {
      dispatch(setToastMessage(ValidationErrors.EMAIL));
      return;
    }

    const contact = contacts.find((c) => c.id === contactId);
    if (!contact) return;

    // Transform to API format
    const communicationDetails = [
      ...contact.emails.map((email, index) => ({
        communicationType: "email",
        communicationDetails: email.email,
        isPrimary: index === 0,
      })),
      {
        communicationType: "email",
        communicationDetails: newEmailInput.trim(),
        isPrimary: false,
      },
    ];

    // Build contact object using helper function
    const contactData = buildContactObject({
      contactId: contact.id,
      firstName: contact.firstName,
      lastName: contact.lastName,
      displayName: contact.displayName,
      department: contact.department,
      designation: contact.designation,
      communicationDetails,
      companyBranchId: contact.companyBranchId,
      statusLid: contact.statusLid,
    });

    const requestData = {
      contactDetails,
      contacts: [contactData],
    };

    updateContact(
      {
        endpoint: endPoints.saveContactsForPolicy(policyId, contactDetails),
        method: "POST",
        data: requestData,
      },
      {
        onSuccess: () => {
          dispatch(setToastMessage("Email added successfully"));
          
          // Clear selections for this contact since emails changed
          if (addingEmailToContact !== null) {
            setSelectedContacts((prev) => {
              const next = new Set(prev);
              next.delete(addingEmailToContact);
              return next;
            });
            setSelectedEmails((prev) => {
              const next = new Map(prev);
              next.delete(addingEmailToContact);
              return next;
            });
          }
          
          setAddingEmailToContact(null);
          setNewEmailInput("");
          refetchContacts();
        },
        onError: (error: any) => {
          const msg = Array.isArray(error?.message)
            ? error.message[0]
            : error?.message || "Failed to add email";
          dispatch(setToastMessage(msg));
        },
      },
    );
  };

  // Send notification
  const handleSend = () => {
    const selectedEmailIds: number[] = [];

    // Iterate through selected emails and collect communication detail IDs
    selectedEmails.forEach((emailSet, contactId) => {
      emailSet.forEach((emailId) => {
        selectedEmailIds.push(emailId);
      });
    });

    // Check if there are emails in TO field or CC field
    if (selectedEmailIds.length === 0 && ccEmails.length === 0) {
      dispatch(setToastMessage(EMAIL_COUNT_VALIDATION));
      return;
    }

    sendNotification(
      {
        endpoint: endPoints.endorsementNotificationEmails(policyId),
        method: "POST",
        data: {
          url: window.location.href, // Current page URL for redirect
          emailIds: selectedEmailIds, // Array of communication detail IDs
          contactType: contactType,
          attachmentFileIds: documentIds || [],
          isClientConfirmation: contactType === CLIENT_TAG,
          ccEmails: ccEmails.length > 0 ? ccEmails : undefined,
        },
      },
      {
        onSuccess: () => {
          dispatch(
            setToastMessage(
              `Email sent successfully to ${
                contactType === INSURER_TAG ? INSURER_TAG : CLIENT_TAG
              }`,
            ),
          );
          onSendSuccess();
          onClose();
        },
        onError: (error: any) => {
          const msg = Array.isArray(error?.message)
            ? error.message[0]
            : error?.message || "Failed to send notification";
          dispatch(setToastMessage(msg));
        },
      },
    );
  };

  // Calculate selected emails count
  const totalSelectedEmails = useMemo(() => {
    let count = 0;
    selectedEmails.forEach((emailSet) => {
      count += emailSet.size;
    });
    return count;
  }, [selectedEmails]);

  // Get selected email addresses as comma-separated string
  const getSelectedEmailAddresses = useMemo(() => {
    const emailAddresses: string[] = [];
    selectedEmails.forEach((emailSet, contactId) => {
      const contact = contacts.find((c) => c.id === contactId);
      if (contact) {
        emailSet.forEach((emailId) => {
          const email = contact.emails.find((e) => e.id === emailId);
          if (email) {
            emailAddresses.push(email.email);
          }
        });
      }
    });
    return emailAddresses;
  }, [selectedEmails, contacts]);

  // Handle Next button (Step 1 -> Step 2)
  const handleNext = () => {
    // Allow proceeding to Step 2 even without selected emails
    setCurrentStep(2);
  };

  // Handle Previous button (Step 2 -> Step 1)
  const handlePrevious = () => {
    setCurrentStep(1);
  };

  // Reusable email fields renderer
  const renderEmailFields = (
    emails: ContactEmail[] | undefined,
    onEmailChange: (emails: ContactEmail[]) => void,
    addButtonLabel: string = "Add Another Email"
  ) => {
    return (
      <EmailFieldWrapper>
        <EmailFieldLabel>Email Addresses *</EmailFieldLabel>
        {emails?.map((email, index) => (
          <EmailFieldRow key={index}>
            <TextField
              {...EmailFieldConfig.componentProps}
              variant="outlined"
              value={email.email}
              onChange={(e) => {
                const newEmails = [...(emails || [])];
                newEmails[index] = { ...newEmails[index], email: e.target.value };
                onEmailChange(newEmails);
              }}
            />
            {(emails?.length || 0) > 1 && (
              <DeleteEmailButtonStyled
                onClick={() => {
                  const newEmails = emails?.filter((_, i) => i !== index) || [];
                  onEmailChange(newEmails);
                }}
              >
                <DeleteIcon />
              </DeleteEmailButtonStyled>
            )}
          </EmailFieldRow>
        ))}
        <AddAnotherEmailButtonStyled
          onClick={() => {
            const newEmails = [...(emails || []), { email: '' }];
            onEmailChange(newEmails);
          }}
          startIcon={<AddIcon />}
        >
          {addButtonLabel}
        </AddAnotherEmailButtonStyled>
      </EmailFieldWrapper>
    );
  };

  // Create form config with dynamic location and branch options
  const formConfigWithOptions = useMemo(() => {
    return ContactFormFields.map(field => {
      if (field.key === 'location') {
        return { ...field, options: locationOptions };
      }
      if (field.key === 'branch') {
        return { ...field, options: branchOptions };
      }
      return field;
    });
  }, [locationOptions, branchOptions]);

  const totalSelectedContacts = selectedContacts.size;

  // Email validation helper
  const isValidEmail = (email: string): boolean => {
    return REGEX_PATTERNS.EMAIL.test(email.trim());
  };

  // Handle adding CC email on Enter
  const handleCCEmailKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && ccEmailInput.trim()) {
      e.preventDefault();
      const email = ccEmailInput.trim();
      if (!isValidEmail(email)) {
        dispatch(setToastMessage(ValidationErrors.EMAIL));
        return;
      }
      if (ccEmails.includes(email)) {
        dispatch(setToastMessage(EMAIL_REPETITION_VALIDATION));
        return;
      }
      setCcEmails([...ccEmails, email]);
      setCcEmailInput("");
    }
  };

  // Handle removing CC email
  const handleRemoveCCEmail = (emailToRemove: string) => {
    setCcEmails(ccEmails.filter((email) => email !== emailToRemove));
  };

  // Render Step 2: Compose Email
  const renderComposeEmailStep = () => {
    return (
      <ComposeEmailContainer>
        {/* From Field */}
        <EmailFieldContainer>
          <EmailFieldLabelTypography>
            {ComposeEmailFields.FROM.label}
          </EmailFieldLabelTypography>
          <EmailChipsWrapper>
            <ChipRenderer
              value={fromEmail}
              variant="normal"
              size="small"
              ChipStyles={{
                backgroundColor: emailChipStyleConfig.backgroundColor,
                color: emailChipStyleConfig.color,
                border: `1px solid ${emailChipStyleConfig.borderColor}`,
              }}
            />
          </EmailChipsWrapper>
        </EmailFieldContainer>

        {/* To Field */}
        <EmailFieldContainer>
          <EmailFieldLabelTypography>
            {ComposeEmailFields.TO.label}
          </EmailFieldLabelTypography>
          <EmailChipsWrapper>
            {getSelectedEmailAddresses.map((email, index) => (
              <ChipRenderer
                key={`email-chip-${index}`}
                value={email}
                variant="normal"
                size="small"
                ChipStyles={{
                  backgroundColor: emailChipStyleConfig.backgroundColor,
                  color: emailChipStyleConfig.color,
                  border: `1px solid ${emailChipStyleConfig.borderColor}`,
                }}
              />
            ))}
          </EmailChipsWrapper>
          <EmailFieldHelperText>
            {totalSelectedEmails} {ComposeEmailFields.TO.helperText}
          </EmailFieldHelperText>
        </EmailFieldContainer>

        {/* CC Field */}
        <EmailFieldContainer>
          <EmailFieldLabelTypography>
            {ComposeEmailFields.CC.label}
          </EmailFieldLabelTypography>
          <EmailChipsWrapper>
            {ccEmails.map((email, index) => (
              <ChipRenderer
                key={`cc-chip-${index}`}
                value={email}
                variant="normal"
                size="small"
                onDelete={() => handleRemoveCCEmail(email)}
                ChipStyles={{
                  backgroundColor: emailChipStyleConfig.backgroundColor,
                  color: emailChipStyleConfig.color,
                  border: `1px solid ${emailChipStyleConfig.borderColor}`,
                }}
              />
            ))}
          </EmailChipsWrapper>
          <CCTextField
            placeholder={ComposeEmailFields.CC.placeholder}
            value={ccEmailInput}
            onChange={(e) => setCcEmailInput(e.target.value)}
            onKeyDown={handleCCEmailKeyDown}
            variant="outlined"
            fullWidth
            size="small"
          />
          <EmailFieldHelperText>
            {ComposeEmailFields.CC.helperText}
          </EmailFieldHelperText>
        </EmailFieldContainer>
      </ComposeEmailContainer>
    );
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContainer>
        <ModalHeader>
          <ModalHeaderLeft>
            <SendIconContainer>
              <SendIcon />
            </SendIconContainer>
            <ModalHeaderContent>
              <ModalTitle>
                Send to {contactType === "insurer" ? "Insurer" : "Client"}
                {currentStep === 2 && " - Compose Email"}
              </ModalTitle>
              <ModalSubtitle>
                {currentStep === 1
                  ? CONTACTS_CONTAINER.SUBTITLE
                  : ADD_CC_SUBTITLE}
              </ModalSubtitle>
            </ModalHeaderContent>
          </ModalHeaderLeft>
          <CloseButton onClick={onClose}>
            <CloseIcon />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          {currentStep === 2 ? (
            // Step 2: Compose Email
            renderComposeEmailStep()
          ) : (
            // Step 1: Contact Selection
            <>
          {contactsLoading || (opportunityId === null && companyDetailsLoading) ? (
            <LoaderContainer>
              <CircularProgress />
            </LoaderContainer>
          ) : (
            <>
              {/* Render contacts */}
              {contacts.map((contact) => {
                const isEditing = editingContactId === contact.id;
                const isChecked = selectedContacts.has(contact.id);

                if (isEditing) {
                  // Prepare default values with emails as array of strings for multiselect
                  const defaultValues = {
                    ...editForm,
                    emails: editForm.emails?.map((e) => e.email) || [],
                    location: locationValue,
                    branch: branchValue,
                  };

                  return (
                    <EditContactPanel key={contact.id}>
                      <EditContactHeader>
                        <EditIcon />
                        {CONTACTS_CONTAINER.EDIT}
                      </EditContactHeader>
                      <DynamicForm
                        formConfig={formConfigWithOptions}
                        defaultValues={defaultValues}
                        formMethods={setEditFormMethods}
                        sx={{ padding: 0 }}
                        key={`edit-contact-${contact.id}-${locationValue}-${branchValue}`}
                      />
                      
                      {/* Email Fields */}
                      {renderEmailFields(
                        editForm.emails,
                        (newEmails) => setEditForm({ ...editForm, emails: newEmails }),
                        CONTACTS_CONTAINER.ADD_EMAIL
                      )}
                      
                      <FormActions>
                        <Button
                          variantType="secondary"
                          label={CANCEL}
                          onClick={handleCancelEdit}
                          sizeType="small"
                        />
                        <SaveEditButton
                          variant="contained"
                          startIcon={<CheckIcon />}
                          onClick={handleSaveEdit}
                          disabled={isUpdating}
                        >
                          {isUpdating ? "Saving..." : "Save Changes"}
                        </SaveEditButton>
                      </FormActions>
                    </EditContactPanel>
                  );
                }

                return (
                  <ContactCard key={contact.id} isChecked={isChecked}>
                    <ContactHeader>
                      <ContactInfo>
                        <StyledCheckbox
                          checked={isChecked}
                          onChange={() => handleContactToggle(contact.id)}
                          disabled={!contact.emails || contact.emails.length === 0}
                        />
                        <div>
                          <ContactName>
                            {contact.displayName ||
                              `${contact.firstName} ${
                                contact.lastName || ""
                              }`.trim()}
                          </ContactName>
                          {(contact.department || contact.designation) && (
                            <ContactMeta>
                              {[contact.department, contact.designation]
                                .filter(Boolean)
                                .join(" • ")}
                            </ContactMeta>
                          )}
                        </div>
                      </ContactInfo>
                      <ContactActions>
                        <Tooltip 
                          title={INFO_TOOLTIP}
                          arrow
                          placement="top"
                          PopperProps={{
                            disablePortal: true,
                          }}
                        >
                          <ActionIcon>
                            <InfoIcon />
                          </ActionIcon>
                        </Tooltip>
                        <ActionIcon onClick={() => handleEditContact(contact)}>
                          <EditIcon />
                        </ActionIcon>
                        <ActionIcon
                          onClick={() => setAddingEmailToContact(contact.id)}
                        >
                          <AddIcon />
                        </ActionIcon>
                      </ContactActions>
                    </ContactHeader>

                    {contact.emails && contact.emails.length > 0 ? (
                      <EmailChipsContainer>
                        {contact.emails.map((email) => {
                          const isSelected = Boolean(
                            email.id &&
                              selectedEmails.get(contact.id)?.has(email.id),
                          );
                          return (
                            <EmailChip
                              key={email.id || email.email}
                              isSelected={isSelected}
                              onClick={() =>
                                email.id &&
                                handleEmailChipToggle(contact.id, email.id)
                              }
                            >
                              <EmailChipIcon>
                                <EmailIcon fontSize="small" />
                              </EmailChipIcon>
                              {email.email}
                            </EmailChip>
                          );
                        })}
                      </EmailChipsContainer>
                    ) : addingEmailToContact !== contact.id ? (
                      <WarningBanner>
                        <WarningAmberIcon />
                        <WarningText>{CONTACTS_CONTAINER.NO_EMAIL}</WarningText>
                        <AddEmailButton
                          onClick={() => setAddingEmailToContact(contact.id)}
                        >
                          {/* <AddIcon fontSize="small" /> Add */}
                        </AddEmailButton>
                      </WarningBanner>
                    ) : null}
                    
                    {addingEmailToContact === contact.id && (
                      <AddEmailContainer>
                        <EmailInputWrapper>
                          <EmailIcon color="action" />
                          <EmailInput
                            placeholder="Enter new email address"
                            value={newEmailInput}
                            onChange={(e) =>
                              setNewEmailInput(e.target.value)
                            }
                            variant="standard"
                          />
                        </EmailInputWrapper>
                        <AddEmailInlineButton
                          variant="contained"
                          startIcon={<CheckIcon />}
                          onClick={() => handleAddEmailInline(contact.id)}
                          disabled={isUpdating}
                        >
                          {CONTACTS_CONTAINER.ADD}
                        </AddEmailInlineButton>
                        <Button
                          variantType="link"
                          label={CANCEL}
                          onClick={() => {
                            setAddingEmailToContact(null);
                            setNewEmailInput("");
                          }}
                          sizeType="small"
                        />
                      </AddEmailContainer>
                    )}
                  </ContactCard>
                );
              })}

              {/* Add New Contact */}
              {addingNewContact ? (
                <AddContactPanel>
                  <AddContactHeader>
                    <AddIcon />
                    {CONTACTS_CONTAINER.ADD_CONTACT}
                  </AddContactHeader>
                  <DynamicForm
                    formConfig={formConfigWithOptions}
                    defaultValues={{
                      location: locationValue,
                      branch: branchValue,
                      displayName: "", // Reset display name to allow auto-fill
                    }}
                    formMethods={setNewContactFormMethods}
                    sx={{ padding: 0 }}
                    key={`new-contact-${locationValue}-${branchValue}`}
                  />
                  
                  {/* Email Fields */}
                  {renderEmailFields(
                    newContactForm.emails,
                    (newEmails) => setNewContactForm({ ...newContactForm, emails: newEmails })
                  )}
                  
                  <FormActions>
                    <Button
                      variantType="secondary"
                      label={CANCEL}
                      onClick={() => {
                        setAddingNewContact(false);
                        setNewContactForm({ emails: [{ email: "" }] });
                        setNewContactFormMethods(null);
                      }}
                      sizeType="small"
                    />
                    <SaveContactButton
                      variant="contained"
                      startIcon={<CheckIcon />}
                      onClick={handleAddNewContact}
                      disabled={isCreating || !isNewFormValid}
                    >
                      {isCreating ? "Saving..." : "Save Contact"}
                    </SaveContactButton>
                  </FormActions>
                </AddContactPanel>
              ) : (
                <AddNewContactButton onClick={() => setAddingNewContact(true)}>
                  <AddIcon />
                  {CONTACTS_CONTAINER.ADD_CONTACT}
                </AddNewContactButton>
              )}
            </>
          )}
            </>
          )}
        </ModalBody>

        <ModalFooter>
          {currentStep === 1 ? (
            <FooterInfo>
              {totalSelectedEmails > 0 ? (
                <SelectionIndicator>
                  <CheckCircle>
                    <CheckIcon />
                  </CheckCircle>
                  <div>
                    <SelectionText>
                      {totalSelectedEmails} emails selected
                    </SelectionText>
                    <SelectionSubtext>
                      from {totalSelectedContacts} contact
                      {totalSelectedContacts !== 1 ? "s" : ""}
                    </SelectionSubtext>
                  </div>
                </SelectionIndicator>
              ) : (
                <SelectionTextColored>
                  {CONTACTS_CONTAINER.PROCEED_TEXT}
                </SelectionTextColored>
              )}
            </FooterInfo>
          ) : (
            <Box /> // Empty box to maintain space-between layout
          )}
          <FooterActions>
            {currentStep === 2 && (
              <Button
                variantType="secondary"
                label={PREVIOUS}
                onClick={handlePrevious}
                sizeType="small"
                startIcon={<ArrowBackIcon />}
              />
            )}
            {currentStep === 1 && (
              <Button
                variantType="secondary"
                label={CANCEL}
                onClick={onClose}
                sizeType="small"
              />
            )}
            <SendButton
              variant="contained"
              startIcon={<SendIcon />}
              onClick={currentStep === 1 ? handleNext : handleSend}
              disabled={
                currentStep === 1
                  ? false // Step 1: Always enabled
                  : (totalSelectedEmails === 0 && ccEmails.length === 0) || isSending // Step 2: Disabled if no TO and no CC emails, or if sending
              }
            >
              {currentStep === 1
                ? NEXT
                : isSending
                ? "Sending..."
                : `Send to ${contactType === "insurer" ? "Insurer" : "Client"}`}
            </SendButton>
          </FooterActions>
        </ModalFooter>
      </ModalContainer>
    </Modal>
  );
};

export default SendToContactsModal;
