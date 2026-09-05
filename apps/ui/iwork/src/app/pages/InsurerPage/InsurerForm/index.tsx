import React, { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import {
  BUTTON_TYPE,
  BUTTON_VARIANTS,
  CANCEL,
  CommonBreadcrumb,
  DynamicForm,
  ERROR_MESSAGE,
  FormActionsContainer,
  FormSection,
  IMultipleSectionsHandle,
  MultipleSections,
  SUBMIT,
  SUCCESS_MESSAGE,
  UPDATE,
  VALIDATION_ERROR_MESSAGE,
  addressFields,
  defaultAddress,
  insurerAddressFields,
  insurerDefaultAddress,
  hqAddressFields,
  defaultHqAddress,
  httpMethods,
  mapGetDataToFormData,
  normalizePayload,
  setLoading,
  setToastMessage,
  useApi,
  useApiMutation,
  useFileUpload,
  UploadedFile,
  endPoints,
  apiRequest,
  useLookupIdByKey,
} from "@ui/ui-lib";
import { Box, IconButton, Typography, CircularProgress, Dialog, DialogContent, DialogTitle, Button } from "@mui/material";
import {
  Upload as UploadIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
  DeleteOutline as DeleteIcon,
} from "@mui/icons-material";
import {
  ALERT_MESSAGES,
  BROKER_DETAILS,
  ENTITY_CONTACT_FORM_TITLE,
  INSURER_DETAILS,
  RICH_TEXT_LIMIT_ERROR,
  TPA_DETAILS,
} from "../../../constants";
import { LookUpValues } from "../../../constants/lookupValues";
import { EntityType } from "../../../constants/enum";
import { IAddress } from "../../../pages/ContactPage/AddContacts/types";
import {
  brokerBreadcrumbs,
  ENTITY_CONFIG_MAP,
  getDefaultValues,
  getFormFields,
  insurerBreadcrumbs,
  tpaBreadcrumbs,
} from "./formConfig";
import { useDispatch } from "react-redux";
import {
  StyledCrumbContainer,
  StyledInsurerFormContainer,
  StyledNextButton,
  StyledPageContainer,
  StyledLogoUploadBox,
  StyledLogoLoadingBox,
  StyledLogoPreviewContainer,
  StyledLogoPreviewBox,
  StyledLogoActionsBox,
  StyledLogoUploadEmptyBox,
  StyledLogoUploadIcon,
} from "./styles";
import { AutoImageCropper, CropArea, getCroppedImg } from "./AutoImageCropper";

interface InsurerFormData {
  name: string;
  code: string;
  contactPerson: string;
  contactEmail: string;
  isLifeLid: number;
  tpaLogoFileId?: string;
  insurerLogoFileId?: string;
}

const getEntityConfig = (type?: string) => {
  const config = ENTITY_CONFIG_MAP[type ?? "insurer"];
  if (!config) {
    return ENTITY_CONFIG_MAP["insurer"];
  }
  return config;
};

const hasRichTextLimitError = (errors: any): boolean =>
  Object.values(errors || {}).some((error: any) => {
    if (!error) return false;
    if (error?.message === RICH_TEXT_LIMIT_ERROR) return true;
    if (typeof error === "object") return hasRichTextLimitError(error);
    return false;
  });

const LOGO_DOCUMENT_TYPE = "entity_logo";

const getLogoFieldName = (entityType: string) => {
  return entityType === EntityType.TPA ? "tpaLogoFileId" : "insurerLogoFileId";
};

const branchDisplayNameCalcFields = [
  {
    watchFields: ["branchCode", "branchName", "cityLabel"],
    externalWatchFields: ["insurerName"],
    setField: "branchDisplayName",
    calculate: (values: Record<string, any>, context?: any) => {
      const insurerName = context?.watchExternal?.("insurerName") || "";
      const parts = [
        insurerName,
        values.branchCode,
        values.branchName,
        values.cityLabel,
      ].filter((v) => v && String(v).trim());
      return parts.join(" ");
    },
  },
];

const InsurerForm: React.FC = () => {
  const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
  const { doFetch: saveInsurer, data: saveData, error } = useApi();
  const [loading, setLoading] = useState(false);
  const { doFetch: getInsurer, data: insurerDataResponse } = useApi();
  const [formMethods, setFormMethods] =
    React.useState<ReturnType<typeof useForm<InsurerFormData>>>();
  const [hqFormMethods, setHqFormMethods] =
    React.useState<ReturnType<typeof useForm<any>>>();
  const companyTagCompanyId = useLookupIdByKey(LookUpValues.COMPANY_TAG_COMPANY);
  const hqBranchTypeLid = useLookupIdByKey(LookUpValues.INSURER_BRANCH_TYPE_HQ);

  const [hqValues, setHqValues] = useState<any>(() => defaultHqAddress(userData, hqBranchTypeLid));
  const [watchedInsurerName, setWatchedInsurerName] = useState("");

  const { id: insurerId, entityType } = useParams();
  const [isEditMode, setIsEditMode] = useState(false);
  const navigate = useNavigate();
  const effectiveEntityType = entityType ?? "insurer";
  const contactRecordTypeLid = useLookupIdByKey(
    effectiveEntityType === EntityType.INSURER
      ? LookUpValues.INSURER_CONTACT
      : effectiveEntityType === EntityType.TPA
      ? LookUpValues.TPA_CONTACT
      : LookUpValues.BROKER_CONTACT
  );
  const pendingContactDataRef = useRef<any[]>([]);
  const config = getEntityConfig(effectiveEntityType);
  const formFields = getFormFields(effectiveEntityType, userData, isEditMode);
  const defaultInsurer = getDefaultValues(effectiveEntityType, userData, companyTagCompanyId);
  const addressesRef = useRef<IMultipleSectionsHandle>(null);
  const activeAddressFields = effectiveEntityType === EntityType.INSURER
    ? insurerAddressFields
    : addressFields;
  const activeDefaultAddress = effectiveEntityType === EntityType.INSURER
    ? insurerDefaultAddress
    : defaultAddress;

  const [addressesValues, setAddressesValues] = useState<any[]>([
    activeDefaultAddress(userData),
  ]);
  // Logo-related state management
  const [logoFile, setLogoFile] = useState<UploadedFile | null>(null); // Current uploaded logo file data
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null); // URL for logo preview display
  const [isFetchingPreview, setIsFetchingPreview] = useState(false); // Loading state for preview generation
  const [isUploading, setIsUploading] = useState(false); // Loading state for file upload
  
  // Image cropper state management
  const [showCropper, setShowCropper] = useState(false); // Controls cropper dialog visibility
  const [selectedImageSrc, setSelectedImageSrc] = useState<string>(""); // Temporary image URL for cropper
  const [originalFile, setOriginalFile] = useState<File | null>(null); // Original selected file before cropping
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null); // Crop area coordinates
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const formateAddressData = (data: any[]) => {
    return data.map(({ addressType, contactDetails, gstDetails, ...address }) => ({
      ...address,
      addressTypeLid: addressType?.id,
      countryId: address.countryId?.id,
      stateId: address.stateId?.id,
      cityId: address.cityId?.id,
      firstName: contactDetails?.firstName ?? address.firstName ?? "",
      lastName: contactDetails?.lastName ?? address.lastName ?? "",
      displayName: contactDetails?.displayName ?? address.displayName ?? "",
      contactId: contactDetails?.id ?? undefined,
      panCardNo: address.panCardNo ?? "",
      registrationNo: address.registrationNo ?? "",
      tanNumber: address.tanNumber ?? "",
      gstStateId: gstDetails?.gstStateId ?? "",
      gstCategoryLid: gstDetails?.gstCategoryLid ?? "",
      gstNumber: gstDetails?.gstNumber ?? "",
    }));
  };

  useEffect(() => {
    if (insurerId) {
      setIsEditMode(true);
      getInsurer(config.endpoint.getById(Number(insurerId)));
    }
  }, [insurerId]);

  useEffect(() => {
    if (!insurerDataResponse?.data || !formMethods) return;
    const formFieldNames = formFields.map((field) => field.name);
    const {
      [config.addressKey]: entityAddresses,
      logo,
      ...insurer
    } = insurerDataResponse.data;
    const logoFieldName = getLogoFieldName(effectiveEntityType);
    const logoIdFromEntity = insurer[logoFieldName];

    const mappedData = mapGetDataToFormData(insurer, formFieldNames);
    const isHqAddress = (addr: any) =>
      addr?.branchType?.id === hqBranchTypeLid ||
      (addr?.branchTypeLid && addr.branchTypeLid?.id === hqBranchTypeLid) ||
      addr?.branchTypeLid === hqBranchTypeLid ||
      addr?.branchType?.lookUpKey === "INSURER_BRANCH_TYPE_HQ";

    const rawAddresses = entityAddresses || [];
    const hqAddr = rawAddresses.find(isHqAddress);
    const nonHqRaw = rawAddresses.filter((a: any) => !isHqAddress(a));

    const actualAddresses =
      effectiveEntityType === EntityType.TPA
        ? (nonHqRaw).map((addr: any) => ({
            id: addr?.id,
            addressType: addr?.addressType,
            address1: addr?.address1,
            countryId: addr?.countryId,
            stateId: addr?.stateId,
            cityId: addr?.cityId,
            address2: addr?.address2,
            area: addr?.area,
            pinCode: addr?.pinCode,
            phoneNumber: addr?.phoneNumber,
            alternatePhoneNumber: addr?.alternatePhoneNumber,
            email: addr?.email,
            supportNumber: addr?.supportNumber,
            contactDetails: addr?.contactDetails,
          }))
        : nonHqRaw;
    const addressData = formateAddressData(actualAddresses);

    // Populate HQ form
    if (effectiveEntityType === EntityType.INSURER && hqAddr) {
      const [hqFormatted] = formateAddressData([hqAddr]);
      const hqData = { ...hqFormatted, branchTypeLid: hqFormatted.branchTypeLid ?? hqBranchTypeLid };
      setHqValues(hqData);
      hqFormMethods?.reset(hqData);
    }

    // Set logo if exists - try both logo object and logo ID from entity
    const logoToUse = logo || (logoIdFromEntity ? { id: logoIdFromEntity } : null);
    if (logoToUse && logoToUse.id) {
      setLogoFile({
        id: logoToUse.id,
        fileName: logoToUse.fileName || logoToUse.originalName || "logo",
        mimeType: logoToUse.mimeType || logoToUse.contentType || "image/png",
        fileSize: logoToUse.fileSize || logoToUse.size || 0,
        fileBuffer: logoToUse.fileBuffer || "",
      });
    }

    formMethods.reset({
      ...mappedData,
      isLifeLid: insurer?.[config.isLifeKey]?.id,
      [logoFieldName]: logoToUse?.id,
    });

    setAddressesValues(addressData);
  }, [insurerDataResponse, formMethods, hqFormMethods, effectiveEntityType]);

  useEffect(() => {
    if (!formMethods) return;
    const subscription = formMethods.watch((values) => {
      setWatchedInsurerName((values as any).insurerName || "");
    });
    return () => subscription.unsubscribe();
  }, [formMethods]);

  const branchWatchExternal = useCallback(
    (name: string) => (name === "insurerName" ? watchedInsurerName : undefined),
    [watchedInsurerName]
  );

  const onInvalid = () => {
    setToastMessage(VALIDATION_ERROR_MESSAGE);
  };

  const dispatch = useDispatch();

  // Logo preview effect
  useEffect(() => {
    let isCancelled = false;
    let objectUrl: string | null = null;

    const buildPreview = async () => {
      if (!logoFile?.id) {
        setLogoPreviewUrl(
          logoFile?.fileBuffer
            ? `data:${logoFile.mimeType || "image/png"};base64,${
                logoFile.fileBuffer
              }`
            : null
        );
        return;
      }

      setIsFetchingPreview(true);
      try {
        const response = await apiRequest(
          endPoints.fileUploadDownloadById(logoFile.id),
          {
            method: "GET",
            responseType: "blob",
          }
        );

        if (isCancelled) return;

        const blob = response.data as Blob;
        objectUrl = URL.createObjectURL(blob);
        setLogoPreviewUrl(objectUrl);
      } catch (error) {
        if (!isCancelled) {
          setLogoPreviewUrl(null);
          dispatch(setToastMessage("Unable to load logo preview."));
        }
      } finally {
        if (!isCancelled) {
          setIsFetchingPreview(false);
        }
      }
    };

    buildPreview();

    return () => {
      isCancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [logoFile, dispatch]);

  // Logo handlers
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * Handle logo file selection from file input
   * Opens the image cropper dialog instead of directly uploading
   * Creates temporary object URL for cropper preview
   */
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setOriginalFile(file); // Store original file for later processing

    // Create a temporary URL for the selected image to display in cropper
    const imageUrl = URL.createObjectURL(file);
    setSelectedImageSrc(imageUrl);
    setShowCropper(true); // Open cropper dialog

    // Clear the file input to allow selecting the same file again if needed
    e.target.value = "";
  };

  const handleCropSave = async () => {
    if (!originalFile || !selectedImageSrc || !croppedAreaPixels) return;

    try {
      setIsUploading(true);
      setShowCropper(false); // Close cropper dialog

      // Use canvas to create a cropped version of the image
      const croppedFile = await getCroppedImg(
        selectedImageSrc,
        croppedAreaPixels,
        `cropped-${originalFile.name}`
      );

      // Prepare upload payload with minimal required fields
      const entityTypeForUpload = effectiveEntityType + "-logo";
      const entityIdForUpload = insurerId ? Number(insurerId) : 0;

      const formData = new FormData();
      formData.append("file", croppedFile);
      formData.append("companyType", entityTypeForUpload);
      formData.append("companyId", String(entityIdForUpload));
      formData.append("documentTypeLid", "");

      const response = await apiRequest(endPoints.fileUpload, {
        method: "POST",
        data: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response?.data) {
        // Update component state with uploaded file data
        setLogoFile(response.data);
        
        // Update form field with the uploaded file ID
        if (formMethods) {
          const logoFieldName = getLogoFieldName(effectiveEntityType);
          formMethods.setValue(
            logoFieldName as keyof InsurerFormData,
            response.data.id || ""
          );
        }
        
        dispatch(setToastMessage("Logo uploaded and cropped successfully!"));
      }
    } catch (error) {
      console.error("Logo upload failed:", error);
      dispatch(setToastMessage("Failed to upload logo. Please try again."));
    } finally {
      setIsUploading(false);
      
      // Clean up temporary resources to prevent memory leaks
      if (selectedImageSrc) {
        URL.revokeObjectURL(selectedImageSrc);
      }
      setSelectedImageSrc("");
      setOriginalFile(null);
      setCroppedAreaPixels(null);
    }
  };

  /**
   * Handle canceling the crop operation
   * Closes the cropper dialog and cleans up temporary resources
   */
  const handleCropCancel = () => {
    setShowCropper(false);
    
    // Clean up temporary object URL to prevent memory leaks
    if (selectedImageSrc) {
      URL.revokeObjectURL(selectedImageSrc);
      setSelectedImageSrc("");
    }
    
    // Reset all cropper-related state
    setOriginalFile(null);
    setCroppedAreaPixels(null);
  };

  const handleDeleteLogo = async (event?: React.MouseEvent) => {
    event?.stopPropagation();

    if (!logoFile?.id) {
      setLogoFile(null);
      if (formMethods) {
        const logoFieldName = getLogoFieldName(effectiveEntityType);
        formMethods.setValue(logoFieldName as keyof InsurerFormData, "");
      }
      return;
    }

    try {
      await apiRequest(`${endPoints.fileUploadDelete}/${logoFile.id}`, {
        method: "DELETE",
      });
      dispatch(setToastMessage("Logo deleted successfully."));
      setLogoFile(null);
      if (formMethods) {
        const logoFieldName = getLogoFieldName(effectiveEntityType);
        formMethods.setValue(logoFieldName as keyof InsurerFormData, "");
      }
    } catch (error) {
      dispatch(setToastMessage("Failed to delete logo. Please try again."));
    }
  };

  const handleViewLogo = async (event?: React.MouseEvent) => {
    event?.stopPropagation();

    if (logoPreviewUrl) {
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(
          `<img src="${logoPreviewUrl}" alt="Entity logo" />`
        );
        newWindow.document.close();
      } else {
        dispatch(
          setToastMessage("Unable to open the logo. Please allow pop-ups.")
        );
      }
      return;
    }

    if (!logoFile?.id) {
      dispatch(setToastMessage("No logo available to view."));
      return;
    }

    try {
      const response = await apiRequest(
        endPoints.fileUploadDownloadById(logoFile.id),
        {
          method: "GET",
          responseType: "blob",
        }
      );

      const blob = response.data as Blob;
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      URL.revokeObjectURL(url);
    } catch (error) {
      dispatch(setToastMessage("Failed to load logo. Please try again."));
    }
  };

  const { mutate, isLoading } = useApiMutation({
    config: {
      onSuccess: async (response) => {
        const entityId =
          effectiveEntityType === EntityType.TPA
            ? response?.data?.id
            : insurerId ?? response?.data?.id;

        const savedEntityId = response?.data?.id ?? (insurerId ? Number(insurerId) : undefined);
        const savedAddresses: any[] = response?.data?.[config.addressKey] ?? [];

        if (savedEntityId && pendingContactDataRef.current.length > 0 && contactRecordTypeLid) {
          for (const addr of pendingContactDataRef.current) {
            try {
              const displayName = addr.displayName || `${addr.firstName} ${addr.lastName}`.trim();

              if (addr.contactId) {
                // Edit mode: update the existing contact
                const updatePayload = await normalizePayload({
                  firstName: addr.firstName,
                  lastName: addr.lastName,
                  displayName,
                });
                await apiRequest(endPoints.contactById(addr.contactId), {
                  method: "PUT",
                  data: updatePayload,
                });
              } else {
                // No existing contact — create one linked to the address
                // In edit mode the address already exists (addr.id is set from GET prefill);
                // in create mode we find it by matching against the POST response addresses.
                let addressId: number | undefined = addr.id;
                if (!addressId) {
                  const matchedAddress = savedAddresses.find(
                    (sa: any) => sa?.address1 === addr.address1 && sa?.cityId?.id === addr.cityId
                  );
                  addressId = matchedAddress?.id;
                }
                if (!addressId) continue;

                const contactPayload = await normalizePayload({
                  firstName: addr.firstName,
                  lastName: addr.lastName,
                  displayName,
                  companyLocationId: addr.cityId,
                  companyId: savedEntityId,
                  contactRecordTypeLid,
                  communicationDetails: [],
                  existingAddressIds: [addressId],
                });
                await apiRequest(endPoints.allContacts, {
                  method: "POST",
                  data: contactPayload,
                });
              }
            } catch (contactError) {
              dispatch(setToastMessage(
                (contactError as any)?.message || ERROR_MESSAGE
              ));
              return;
            }
          }
          pendingContactDataRef.current = [];
        }

        setToastMessage(response?.message ?? SUCCESS_MESSAGE);

        setTimeout(() => {
          navigate(`/${effectiveEntityType}/${entityId}`);
        }, 1000);
      },
      onError: (error) => {
        setLoading(false);
        const rawMessage = Array.isArray(error?.message)
          ? error.message[0]
          : error?.message ?? ALERT_MESSAGES.GENERIC_ERROR;
        const errorMessage = rawMessage.includes("gst_number")
          ? "GST number already exists"
          : rawMessage;
        dispatch(setToastMessage(errorMessage));
      },
    },
  });

  const handleFormSubmit = async () => {
    setLoading(true);
    if (!formMethods) return;

    const isAddressValid = await addressesRef.current?.trigger?.();
    const isFormValid = await formMethods.trigger();
    const isHqValid =
      effectiveEntityType === EntityType.INSURER && hqFormMethods
        ? await hqFormMethods.trigger()
        : true;

    if (!isAddressValid || !isFormValid || !isHqValid) {
      setLoading(false);
      const hasRichTextError = [formMethods, addressesRef.current as any].some(
        (method) => hasRichTextLimitError(method?.formState?.errors)
      );
      if (hasRichTextError) {
        dispatch(setToastMessage(RICH_TEXT_LIMIT_ERROR));
      } else {
        dispatch(setToastMessage(VALIDATION_ERROR_MESSAGE));
      }
      return;
    }

    const [formData, addressDataRef] = await Promise.all([
      formMethods.getValues(),
      addressesRef.current?.getValues(),
    ]);

    const hqData =
      effectiveEntityType === EntityType.INSURER && hqFormMethods
        ? hqFormMethods.getValues()
        : null;

    const branchAddresses = Array.isArray(addressDataRef) ? addressDataRef : [];
    const allAddressesWithContact = [
      ...branchAddresses,
      ...(hqData ? [hqData] : []),
    ];

    // Store contact-eligible addresses BEFORE stripping contact fields
    pendingContactDataRef.current = allAddressesWithContact.filter(
      (addr: any) => addr?.firstName?.trim() && addr?.lastName?.trim()
    );

    // Strip contact-only fields so the backend address DTO doesn't reject them
    const stripContactFields = ({ firstName, lastName, displayName, contactId, ...addr }: any) => addr;
    const addresses = [
      ...branchAddresses.map(stripContactFields),
      ...(hqData ? [stripContactFields(hqData)] : []),
    ];

    const payload = {
      address: addresses,
      ...formData,
    };

    const endPoint = isEditMode
      ? config.endpoint.getById(Number(insurerId))
      : config.endpoint.all;

    const formatedPayload = await normalizePayload(payload);
    mutate({
      endpoint: endPoint,
      method: !isEditMode ? httpMethods.POST : httpMethods.PUT,
      data: formatedPayload,
    });
  };

  useEffect(() => {
    if (saveData?.status === 201 || saveData?.status === 200) {
      setToastMessage(saveData?.message ?? SUCCESS_MESSAGE);
      const pathId =
        effectiveEntityType === EntityType.TPA
          ? saveData?.data?.id
          : insurerId ?? saveData?.data?.id;

      setTimeout(() => {
        navigate(`/${effectiveEntityType}/${pathId}`);
      }, 1000);
    }
  }, [saveData, effectiveEntityType, insurerId, navigate]);

  useEffect(() => {
    if (error) {
      setToastMessage(
        (error as { message?: string })?.message ?? ERROR_MESSAGE
      );
    }
  }, [error]);

  const shouldRedirect =
    isEditMode &&
    // contactDataResponse?.status !== undefined &&
    (insurerDataResponse?.status === 403 ||
      insurerDataResponse?.data?.editable === false);

  useEffect(() => {
    if (shouldRedirect) {
      navigate("/unauthorized", { replace: true });
    }
  }, [shouldRedirect, navigate]);

  return (
    <StyledPageContainer>
      <StyledCrumbContainer>
        <CommonBreadcrumb
          crumbs={
            entityType === EntityType.TPA
              ? tpaBreadcrumbs(isEditMode)
              : entityType === EntityType.INSURER
              ? insurerBreadcrumbs(isEditMode)
              : brokerBreadcrumbs(isEditMode)
          }
        />
      </StyledCrumbContainer>

      <StyledInsurerFormContainer>
        <FormSection
          title={
            entityType === EntityType.TPA
              ? TPA_DETAILS
              : entityType === EntityType.INSURER
              ? INSURER_DETAILS
              : BROKER_DETAILS
          }
        >
          <DynamicForm
            key={`${entityType}-form`}
            formConfig={formFields}
            defaultValues={defaultInsurer}
            formMethods={setFormMethods}
          />
        </FormSection>

        {/* Logo Section - Only for Insurer and TPA */}
        {(effectiveEntityType === EntityType.INSURER ||
          effectiveEntityType === EntityType.TPA) && (
          <FormSection title="Logo" showHeader={true}>
            <Box>
              <Typography variant="body2" fontWeight={500} mb={1}>
                {effectiveEntityType === EntityType.TPA ? "TPA" : "Insurer"}{" "}
                Logo
              </Typography>
              <StyledLogoUploadBox
                hasLogo={!!logoFile}
                onClick={logoFile ? undefined : handleUploadClick}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleLogoChange}
                />
                {isUploading || isFetchingPreview ? (
                  <StyledLogoLoadingBox>
                    <CircularProgress size={24} />
                    <Typography variant="body2">
                      {isUploading ? "Uploading logo..." : "Loading preview..."}
                    </Typography>
                  </StyledLogoLoadingBox>
                ) : logoFile ? (
                  <StyledLogoPreviewContainer>
                    <StyledLogoPreviewBox>
                      {logoPreviewUrl ? (
                        <img
                          style={{
                            width: '160px',
                            height: '90px',
                            objectFit: 'cover',
                            borderRadius: '4px',
                            border: '1px solid #e0e0e0'
                          }}
                          src={logoPreviewUrl}
                          alt="Entity logo preview"
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Logo uploaded
                        </Typography>
                      )}
                    </StyledLogoPreviewBox>
                    <StyledLogoActionsBox>
                      <IconButton size="small" onClick={handleViewLogo}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleUploadClick();
                        }}
                      >
                        <RefreshIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={handleDeleteLogo}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </StyledLogoActionsBox>
                  </StyledLogoPreviewContainer>
                ) : (
                  <StyledLogoUploadEmptyBox>
                    <StyledLogoUploadIcon as={UploadIcon} />
                    <Typography variant="body2" fontWeight={500} mb={0.5}>
                      Click to upload logo
                    </Typography>
                    <Typography variant="caption">
                      Recommended: 400x225px (16:9), PNG or JPEG
                    </Typography>
                  </StyledLogoUploadEmptyBox>
                )}
              </StyledLogoUploadBox>
            </Box>
          </FormSection>
        )}

        {effectiveEntityType === EntityType.INSURER && (
          <FormSection title="Head Quarters details">
            <DynamicForm
              key="insurer-hq-form"
              formConfig={hqAddressFields(userData)}
              defaultValues={hqValues}
              formMethods={setHqFormMethods}
            />
          </FormSection>
        )}

        <FormSection showHeader={false}>
          <MultipleSections
            key={`${entityType}-addressFields`}
            initialValues={addressesValues}
            defaultValues={activeDefaultAddress(userData)}
            title={(index) =>
              effectiveEntityType === EntityType.INSURER
                ? `Branch details ${index}`
                : `${ENTITY_CONTACT_FORM_TITLE.ENTITY_ADDRESS_DETAILS} ${index}`
            }
            ref={addressesRef}
            formConfig={(index: number) => activeAddressFields(userData, true, index)}
            {...(effectiveEntityType === EntityType.INSURER && {
              dynamicCalculatedFields: branchDisplayNameCalcFields,
              watchExternal: branchWatchExternal,
            })}
          />
        </FormSection>

      </StyledInsurerFormContainer>

      {/* Image Cropper Dialog */}
      <Dialog 
        open={showCropper} 
        onClose={handleCropCancel}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Preview Your Logo
        </DialogTitle>
        <DialogContent>
          <AutoImageCropper
            imageSrc={selectedImageSrc}
            divWidth={400}
            divHeight={225}
            onCropChange={setCroppedAreaPixels}
          />
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 2 }}>
            <Button variant="outlined" onClick={handleCropCancel}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleCropSave}>
              Upload Logo
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      <FormActionsContainer>
        <StyledNextButton
          type={BUTTON_TYPE.BUTTON}
          variantType={BUTTON_VARIANTS.SECONDARY}
          onClick={() => navigate(`/${entityType}`)}
          label={CANCEL}
        />
        <StyledNextButton
          type={BUTTON_TYPE.BUTTON}
          variantType={BUTTON_VARIANTS.PRIMARY}
          onClick={handleFormSubmit}
          role="submit"
          disabled={!formMethods}
          data-testid="submit-button"
          loading={loading}
        >
          {isEditMode ? UPDATE : SUBMIT}
        </StyledNextButton>
      </FormActionsContainer>
    </StyledPageContainer>
  );
};

export default InsurerForm;