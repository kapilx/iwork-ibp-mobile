import {
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Button,
  Typography,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  basicFormFields,
  companyProfileFields,
  generateIndustryIntelligenceHTML,
  generatePotentialOpportunitiesHTML,
  generateSalesPitchDataHTML,
  getCompanyDetailsBreadcrumbs,
  gstDetailsFields,
  initialCompanyDetails,
  initialCompanyProfile,
  initialGstDetails,
  initialRegulatoryDetails,
  initialSalesStrategy,
  initialServiceStrategy,
  regulatoryFields,
  salesStrategyFields,
  serviceStrategyFields,
  steps,
} from "./formConfig";

import dayjs from "dayjs";
import { useDispatch } from "react-redux";
import getPercentageData from ".";
import { LookUpValues } from "../../../constants/lookupValues";
import {
  ADD_COMPANY_FORM_KEYS,
  ADD_COMPANY_FORM_TITLES,
  ALERT_MESSAGES,
  RICH_TEXT_LIMIT_ERROR,
} from "../../../constants";

import {
  CommonBreadcrumb,
  FormSection,
  FormActionsContainer,
  ProgressWizard,
  MultipleSections,
  type IMultipleSectionsHandle,
  useLookupIdByKey,
  useLocalization,
  BUTTON_LABELS,
  BUTTON_TYPE,
  BUTTON_VARIANTS,
  DATE_FORMATS,
  httpMethods,
  VALIDATION_ERROR_MESSAGE,
  endPoints,
  useApiQuery,
  useApiMutation,
  useStepper,
  buildAddressLine1,
  addressFields,
  defaultAddress,
  clearDependencies,
  setDependencies,
  setToastMessage,
  normalizePayload,
  AccordionTitles,
  localizeFields,
  Loader,
  DynamicForm,
  INVALID_DATA_MESSAGE,
  apiRequest,
  UploadedFile,
  useFileUpload,
  environment,
} from "@ui/ui-lib";
import {
  Upload as UploadIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
  DeleteOutline as DeleteIcon,
} from "@mui/icons-material";

import {
  StyledCrumbContainer,
  StyledNextButton,
  StyledPageContainer,
  StyledPrevButton,
} from "./styles";
import {
  StyledLogoActionsBox,
  StyledLogoLoadingBox,
  StyledLogoPreviewBox,
  StyledLogoPreviewContainer,
  StyledLogoUploadBox,
  StyledLogoUploadEmptyBox,
  StyledLogoUploadIcon,
} from "../../InsurerPage/InsurerForm/styles";
import {
  AutoImageCropper,
  CropArea,
  getCroppedImg,
} from "../../InsurerPage/InsurerForm/AutoImageCropper";

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

const hasValidationErrors = (errors: any): boolean =>
  Object.values(errors || {}).some((error: any) => {
    if (!error) return false;
    if (error?.message && !error.message.includes("required")) return true;
    if (typeof error === "object") return hasValidationErrors(error);
    return false;
  });

const COMPANY_LOGO_TYPE = "company-logo";

const AddCompany: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
  const disableAllFields = location.state?.disableAllFields || false;
  const pageTopRef = useRef<HTMLDivElement>(null);
  const groupCompanyIdNo = useLookupIdByKey(LookUpValues.GROUP_COMPANY_NO);
  const groupCompanyIdYes = useLookupIdByKey(LookUpValues.GROUP_COMPANY_YES);
  const companyStatusActive = useLookupIdByKey(
    LookUpValues.COMPANY_STATUS_ACTIVE
  );
  const policyLocationAddressTypeId = useLookupIdByKey(
    LookUpValues.ADDRESS_TYPE_POLICY_LOCATION
  );
  const { localizationData } = useLocalization();

  //step_0 fields
  const [basicFormMethods, setBasicFormMethods] =
    React.useState<ReturnType<typeof useForm>>();
  const [addressesValues, setAddressesValues] = useState<any[]>([
    defaultAddress(userData),
  ]); //multiple address fields
  // Logo-related state management
  const [logoFile, setLogoFile] = useState<UploadedFile | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [isFetchingPreview, setIsFetchingPreview] = useState(false);
  // Image cropper state management
  const [showCropper, setShowCropper] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string>("");
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [regulatoryFormMethods, setRegulatoryFormMethods] =
    React.useState<ReturnType<typeof useForm>>();
  const {
    uploadedFile,
    handleFileUpload,
    loading: isUploadingLogo,
    fileUploadResponse,
  } = useFileUpload(logoFile ?? undefined, endPoints.fileUpload, true);

  useEffect(() => {
    if (regulatoryFormMethods) {
      regulatoryFormMethods.reset(initialRegulatoryDetails(userData));
    }
  }, [regulatoryFormMethods]);
  const [gstArray, setGstArray] = useState<any[]>([initialGstDetails]); //multiple gst fields

  //step_2 fields
  const [profileFormMethods, setProfileFormMethods] =
    React.useState<ReturnType<typeof useForm>>();

  //step_3 fields
  const [salesFormMethods, setSalesFormMethods] =
    React.useState<ReturnType<typeof useForm>>();
  const [serviceFormMethods, setServiceFormMethods] =
    React.useState<ReturnType<typeof useForm>>();

  //refs for multiple sections
  const addressesRef = useRef<IMultipleSectionsHandle>(null);
  const gstRef = useRef<IMultipleSectionsHandle>(null);

  const [companyResponse, setCompanyResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [percentage, setPercentage] = useState({
    filledValues: 0,
    totalFields: 0,
  });
  const [saveAndExit, setSaveAndExit] = useState(false);
  const [industryFieldsDisabled, setIndustryFieldsDisabled] = useState(false);

  const companyRouteState =
    useLocation()?.state?.[AccordionTitles.COMPANY_SELECTION];

  useEffect(() => {
    return () => {
      dispatch(clearDependencies());
    };
  }, []);

  const isAIGenBussinessCardInforAvailable = Boolean(
    companyRouteState?.businessCardInfo
  );

  useEffect(() => {
    if (
      (isAIGenBussinessCardInforAvailable && companyRouteState?.companyName) ||
      companyRouteState?.companyName
    ) {
      fetchCompanyDetails();
    }
  }, [companyRouteState?.companyName]);

  const [aiGenCompanyDetails, setAiGenCompanyDetails] = useState<any>(null);

  const {
    mutate: fetchCompanyDetailsMutation,
    isLoading: isFetchingCompanyDetails,
  } = useApiMutation({
    config: {
      onSuccess: (response) => {
        setLoading(false);
        setAiGenCompanyDetails(response?.data);
      },
      onError: (error) => {
        setLoading(false);
        console.error("Fetch error:", error);
      },
    },
  });

  // Function to fetch company details based on the company name
  const fetchCompanyDetails = () => {
    setLoading(true);
    fetchCompanyDetailsMutation({
      endpoint: `${endPoints.companySearch}`,
      method: httpMethods.POST,
      data: { query: companyRouteState.companyName },
    });
  };

  const { mutate: industryIntelligenceMutation } = useApiMutation({
    config: {
      onSuccess: (response) => {
        setLoading(false);
        const data = response?.data || {};

        if (salesFormMethods) {
          salesFormMethods.reset({
            ...salesFormMethods.getValues(),
            potentialOpportunity: generatePotentialOpportunitiesHTML(
              data?.potentialOpportunities
            ),
            industryIntelligence: generateIndustryIntelligenceHTML(
              data?.industryIntelligence || {}
            ),
            // salesPitch: generateSalesPitchDataHTML(data?.salesPitch || {}),
          });
        }
        setIndustryFieldsDisabled(true);
      },
      onError: (error) => {
        setLoading(false);
        console.error("Industry intelligence error:", error);
      },
    },
  });

  const handleIndustryIntelligence = () => {
    const companyNameVal = basicFormMethods?.getValues("companyName");
    setLoading(true);
    industryIntelligenceMutation({
      endpoint: endPoints.industryIntelligence,
      method: httpMethods.POST,
      data: {
        query: companyNameVal,
        industrySegment: "industry segment",
      },
    });
  };

  const salesStrategyFormConfig = React.useMemo(
    () =>
      salesStrategyFields.map((field) =>
        industryFieldsDisabled &&
        ["potentialOpportunity", "industryIntelligence"].includes(field.name)
          ? {
              ...field,
              componentProps: {
                ...field.componentProps,
                disabled: true,
              },
            }
          : field
      ),
    [industryFieldsDisabled]
  );

  useEffect(() => {
    if (aiGenCompanyDetails) {
      updateFormFieldsFromAiData();
    }
  }, [aiGenCompanyDetails, basicFormMethods]);

  const updateFormFieldsFromAiData = () => {
    if (basicFormMethods) {
      basicFormMethods.reset({
        ...initialCompanyDetails(
          userData,
          groupCompanyIdNo,
          companyStatusActive
        ),
        companyName: companyRouteState?.companyName,
        displayName:
          aiGenCompanyDetails?.companyBasicInfo?.displayName ??
          companyRouteState?.businessCardInfo?.companyName,
        noOfEmployees: aiGenCompanyDetails?.companyBasicInfo?.noOfEmployees,
        website:
          companyRouteState?.businessCardInfo?.website ??
          aiGenCompanyDetails?.companyBasicInfo?.website,
        country: userData?.country?.id,
        industrySegmentLid:
          aiGenCompanyDetails?.companyBasicInfo?.industrySegment?.value,
        companyTypeLid:
          aiGenCompanyDetails?.companyBasicInfo?.companyType?.value,
      });
      if (
        aiGenCompanyDetails?.companyLocations &&
        Array.isArray(aiGenCompanyDetails.companyLocations)
      ) {
        const mappedAddresses = aiGenCompanyDetails.companyLocations
          .filter((location: any) => location && typeof location === "object")
          .map((location: any, index: number) => ({
            addressTypeLid:
              location?.addressType?.value || location?.addressTypeLid || null,
            address1:
              location?.address1?.trim() || location?.street?.trim() || "",
            address2:
              location?.address2?.trim() ||
              location?.addressLine2?.trim() ||
              "",
            area: location?.area?.trim() || location?.locality?.trim() || "",
            countryId:
              location?.country?.id ||
              location?.countryId ||
              userData?.country?.id,
            pinCode:
              location?.pinCode?.trim() || location?.postalCode?.trim() || "",
            phoneNumber:
              location?.phoneNumber?.trim() || location?.phone?.trim() || "",
            email: location?.email?.trim() || "",
            supportNumber:
              location?.supportNumber?.trim() ||
              location?.alternatePhone?.trim() ||
              "",
            stateId: location?.state?.id || location?.stateId || null,
            cityId: location?.city?.id || location?.cityId || null,
            alternatePhoneNumber: location?.alternatePhoneNumber?.trim() || "",
          }));

        // Validation: Ensure at least one valid address
        const validAddresses = mappedAddresses.filter(
          (addr) => addr.address1 || addr.area || addr.pinCode
        );

        if (validAddresses.length > 0) {
          setAddressesValues(validAddresses);
        } else {
          console.warn("No valid company locations found in AI data");
          setAddressesValues([defaultAddress(userData)]);
        }
      } else {
        // Keep existing address or set default
        if (!addressesValues.length) {
          setAddressesValues([defaultAddress(userData)]);
        }
      }
    }
  };

  useEffect(() => {
    if (companyRouteState?.businessCardInfo) {
      const addresses = companyRouteState?.businessCardInfo?.address || [];
      if (addresses.length > 0) {
        const address = addresses[0];
        const formattedAddress = {
          address1: buildAddressLine1(address),
          area: address?.area,
          pinCode: address?.postalCode,
          countryId: userData?.country?.id,
        };
        setAddressesValues([formattedAddress]);
      }
    }
  }, [companyRouteState?.businessCardInfo]);

  const dispatch = useDispatch();

  useEffect(() => {
    if (uploadedFile) {
      setLogoFile(uploadedFile);
    }
  }, [uploadedFile]);

  useEffect(() => {
    if (fileUploadResponse?.data) {
      dispatch(setToastMessage("Logo uploaded and cropped successfully!"));
    }
  }, [fileUploadResponse, dispatch]);

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
      } catch (logoError) {
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

  const handleUploadClick = () => {
    if (disableAllFields) return;
    fileInputRef.current?.click();
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disableAllFields) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setOriginalFile(file);

    const imageUrl = URL.createObjectURL(file);
    setSelectedImageSrc(imageUrl);
    setShowCropper(true);

    e.target.value = "";
  };

  const handleCropSave = async () => {
    if (!originalFile || !selectedImageSrc || !croppedAreaPixels) return;

    try {
      setShowCropper(false);

      const croppedFile = await getCroppedImg(
        selectedImageSrc,
        croppedAreaPixels,
        `cropped-${originalFile.name}`
      );

      const companyIdForUpload =
        companyIdForApi !== undefined ? String(companyIdForApi) : "";
      const companyTypeForUpload =
        companyIdForApi !== undefined
          ? `${companyIdForUpload}-company-logo`
          : COMPANY_LOGO_TYPE;

      handleFileUpload(
        croppedFile,
        companyTypeForUpload,
        companyIdForUpload,
        ""
      );
    } catch (logoError) {
      console.error("Logo crop failed:", logoError);
      dispatch(setToastMessage("Failed to process logo. Please try again."));
    } finally {
      if (selectedImageSrc) {
        URL.revokeObjectURL(selectedImageSrc);
      }
      setSelectedImageSrc("");
      setOriginalFile(null);
      setCroppedAreaPixels(null);
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);

    if (selectedImageSrc) {
      URL.revokeObjectURL(selectedImageSrc);
      setSelectedImageSrc("");
    }

    setOriginalFile(null);
    setCroppedAreaPixels(null);
  };

  const handleDeleteLogo = async (event?: React.MouseEvent) => {
    event?.stopPropagation();

    if (!logoFile?.id) {
      setLogoFile(null);
      return;
    }

    try {
      await apiRequest(`${endPoints.fileUploadDelete}/${logoFile.id}`, {
        method: "DELETE",
      });
      dispatch(setToastMessage("Logo deleted successfully."));
      setLogoFile(null);
    } catch (logoError) {
      dispatch(setToastMessage("Failed to delete logo. Please try again."));
    }
  };

  const handleViewLogo = async (event?: React.MouseEvent) => {
    event?.stopPropagation();

    if (logoPreviewUrl) {
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(
          `<img src="${logoPreviewUrl}" alt="Company logo" />`
        );
        newWindow.document.close();
      } else {
        dispatch(setToastMessage("Unable to open the logo. Please allow pop-ups."));
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
    } catch (logoError) {
      dispatch(setToastMessage("Failed to load logo. Please try again."));
    }
  };

  const { id: companyId } = useParams();
  const companyIdForApi = companyId ?? companyResponse?.id; //extracting id from url
  const isEditMode = companyIdForApi !== undefined;
  const endPoint = isEditMode
    ? endPoints.companyById(companyIdForApi)
    : endPoints.allCompanies; //endpoint for post and put

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

  useEffect(() => {
    const openAtStep = location.state?.openAtStep;
    if (isEditMode && typeof openAtStep === 'number') {
      setActiveStep(openAtStep);
    }
  }, []);

  const handleCancel = () => {
    if (location.state) {
      navigate("/create", {
        state: {
          ...location.state,
          [AccordionTitles.COMPANY_SELECTION]: {
            ...companyRouteState,
            label: companyRouteState?.companyName,
          },
          searchedString: companyRouteState?.companyName,
        },
      });
    } else {
      navigate(`/companies/${companyId}`);
    }
  };

  const {
    data: compnyDataResponse,
    isLoading: isCompanyLoading,
    error: companyFetchError,
  } = useApiQuery({
    queryKey: ["companyId", companyId],
    url: endPoints.companyById(Number(companyIdForApi)),
    enabled: !!companyId,
  });

  useEffect(() => {
    if (compnyDataResponse?.data) {
      setCompanyResponse(compnyDataResponse?.data);
      updateAllStepsStatusToComplete();
      dispatch(
        setDependencies({
          fieldName: "companyId",
          value: compnyDataResponse?.data?.id,
        })
      );
      getPercentageData(compnyDataResponse?.data, setPercentage);
    }
  }, [compnyDataResponse]);

  //post or put data
  const { mutate, isLoading } = useApiMutation({
    config: {
      onSuccess: (response) => {
        setLoading(false);

        if (activeStep < steps.length - 1) {
          updateStepStatus(activeStep); //to show stepper status
          setActiveStep((prev) => prev + 1);
          setCompanyResponse(response?.data);
          if (saveAndExit) {
            if (Boolean(location?.state?.company?.opportunityId)) {
              navigate(
                `/opportunities/${location?.state?.company?.opportunityId}`,
                {
                  state: {
                    company: location.state.company,
                  },
                }
              );
            } else if (location?.state?.returnTo) {
              navigate(location.state.returnTo);
            } else {
              navigate(`/companies/${response?.data?.id}`);
            }
          }
        } else {
          if (Boolean(isAIGenBussinessCardInforAvailable)) {
            const state: any = {
              ...location.state,
            };
            state[AccordionTitles.COMPANY_SELECTION] = {
              ...companyRouteState,
              id: response?.data?.id,
              label: companyRouteState?.companyName,
            };

            navigate("/contact/new", { state });
          } else if (Boolean(companyRouteState)) {
            navigate(`/create2`, {
              state: {
                ...location.state,
                [AccordionTitles.COMPANY_SELECTION]: {
                  companyName: companyRouteState?.companyName,
                  id: response?.data?.id,
                  label: response?.data?.companyName,
                },
                isCreated: true,
                pathname: AccordionTitles.CONTACT_SELECTION,
              },
            });
          } else if (Boolean(location?.state?.company?.opportunityId)) {
            navigate(
              `/opportunities/${location?.state?.company?.opportunityId}`,
              {
                state: {
                  company: location.state.company,
                },
              }
            );
          } else if (location?.state?.returnTo) {
            navigate(location.state.returnTo);
          } else {
            setTimeout(() => navigate(`/companies/${companyIdForApi}`), 1000);
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
        // Backend rejects pre-mutation, so the in-memory companyResponse is
        // still authoritative — re-populate the form from it synchronously
        // to revert any optimistic UI changes (e.g. a removed row).
        if (companyId && companyResponse) {
          handleUpdateStepZeroFields();
        }
      },
    },
  });
  const shouldRedirect =
    isEditMode &&
    // compnyDataResponse?.status !== undefined &&
    (compnyDataResponse?.status === 403 ||
      compnyDataResponse?.data?.editable === false);

  useEffect(() => {
    if (shouldRedirect && Boolean(location?.state?.company)) {
      navigate(`/companies/${companyId}`, {
        replace: true,
        state: {
          company: location.state.company,
        },
      });
    } else if (shouldRedirect) {
      navigate("/unauthorized", { replace: true });
    }
  }, [shouldRedirect, navigate]);

  useEffect(() => {
    if (!companyResponse) return;

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
    companyResponse,
    //step_0
    basicFormMethods,
    //step_1
    regulatoryFormMethods,
    //step_2
    profileFormMethods,
    //step_3
    salesFormMethods,
    serviceFormMethods,
  ]);

  // step_0
  const handleUpdateStepZeroFields = async () => {
    if (basicFormMethods) {
      basicFormMethods.reset({
        companyName: companyResponse?.companyName,
        displayName: companyResponse?.displayName,
        companyTypeLid: companyResponse?.companyType?.id,
        industrySegmentLid: companyResponse?.industrySegment?.id,
        groupCompanyLid: companyResponse?.groupCompany?.id,
        parentCompanyLid: companyResponse?.groupCompanyMap?.groupCompanyId,
        noOfEmployees: companyResponse?.noOfEmployees,
        website: companyResponse?.website,
        priorityLid: companyResponse?.priority?.id,
        source: companyResponse?.source,
        leadCrm: companyResponse?.leadCrmInfo?.id,
        accountManager: companyResponse?.accountManagerInfo?.id,
        associateCrmId: companyResponse?.associateCrmInfo?.id,
        countryId: companyResponse?.country?.id,
        sentimentLid: companyResponse?.sentiment?.id,
        sourceTypeLid: companyResponse?.sourceType?.id,
        status: companyResponse?.status?.id,
      });
    }

    const addresses = companyResponse?.companyAddresses || [];
    const formattedArray =
      addresses?.map((item: any) => {
        const { address } = item;
        return {
          id: item.address.id,
          addressTypeLid: parseInt(address.addressTypeLid, 10),
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
          locationCode: address?.locationCode ?? "",
        };
      }) || [];

    setAddressesValues(formattedArray);

    const logoId = companyResponse?.companyLogoFileId;
    if (logoId) {
      setLogoFile({
        id: logoId,
        fileName: "logo",
        mimeType: "image/png",
        fileSize: 0,
        fileBuffer: "",
      });
    } else {
      setLogoFile(null);
    }
  };
  // step_1
  const handleUpdateStepOneFields = () => {
    if (regulatoryFormMethods) {
      regulatoryFormMethods.reset({
        dateOfIncorporation: companyResponse?.dateOfIncorporation,
        currencyId: userData?.currency?.id,
        panCardNumber: companyResponse?.panCardNumber,
        registrationNo: companyResponse?.registrationNo,
        annualPremium: companyResponse?.annualPremium,
        tanNumber: companyResponse?.tanNumber,
        serviceTax: companyResponse?.serviceTax,
      });
    }

    const stateGsts = companyResponse?.stateGstDetails || [];

    if (stateGsts.length > 0) {
      const formattedGstDetails = stateGsts.map((gst: any) => ({
        id: gst?.id,
        stateId: gst?.state?.id,
        gstNumber: gst?.gstNumber,
        gstCategoryLid: gst?.gstCategory?.id,
      }));
      setGstArray(formattedGstDetails);
    }
  };

  // step_2
  const handleUpdateStepTwoFields = () => {
    if (profileFormMethods) {
      profileFormMethods.reset({
        companyHistory: companyResponse?.details?.companyHistory,
        majorProducts: companyResponse?.details?.majorProducts,
        keyCustomers: companyResponse?.details?.keyCustomers,
        businessProcesses: companyResponse?.details?.businessProcesses,
        remarks: companyResponse?.remarks,
      });
    }
  };

  // step_3
  const handleUpdateStepThreeFields = () => {
    if (salesFormMethods) {
      salesFormMethods.reset({
        accountStrategy: companyResponse?.details?.accountStrategy,
        salesPitch: companyResponse?.details?.salesPitch, //-
        competitor: companyResponse?.details?.competitor,
        weakness: companyResponse?.details?.weakness,
        actionPlan: companyResponse?.details?.actionPlan,
        potentialOpportunity: companyResponse?.details?.potentialOpportunity,
        industryIntelligence: companyResponse?.details?.industryIntelligence,
        targetingReason: companyResponse?.details?.targetingReason,
      });
    }

    if (serviceFormMethods) {
      serviceFormMethods.reset({
        servicePlan: companyResponse?.details?.servicePlan,
        acquisitionHistory: companyResponse?.details?.acquisitionHistory,
        bizProfile: companyResponse?.details?.bizProfile,
        servicePerformance: companyResponse?.details?.servicePerformance,
      });
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderCompanyBasicDetails();
      case 1:
        return renderRegulatoryDetails();
      case 2:
        return renderProfileDetails();
      case 3:
        return renderStrategyDetails();
      default:
        return null;
    }
  };

  const getBasicFormConfig = () => {
    if (companyRouteState?.createChildCompany) {
      return basicFormFields(userData, groupCompanyIdNo).map((field) => {
        if (
          field.name === "groupCompanyLid" ||
          field.name === "parentCompanyLid"
        ) {
          //if we are creating child company then we need to disable these fields
          return {
            ...field,
            disabled: true,
          };
        }
        return field;
      });
    }

    if (isEditModeFromUrl) {
      return basicFormFields(
        userData,
        groupCompanyIdNo,
        isCompanyStatusDisabled.current
      );
    }
    return basicFormFields(userData, groupCompanyIdNo);
  };

  const getDefaultValues = () => {
    // This value must always be a numeric user id or empty — selectFieldByApi
    // forwards it as `entityIds` to /master/user, so a name or placeholder
    // label here becomes a 500. Edit mode stays empty until
    // handleUpdateStepZeroFields resets the form with the real leadCrmInfo
    // once the company fetch resolves; create mode seeds the logged-in user.
    const leadCrmDefault = isEditMode ? "" : userData?.userId ?? "";

    if (companyRouteState?.createChildCompany) {
      return {
        ...initialCompanyDetails(
          userData,
          groupCompanyIdNo,
          companyStatusActive
        ),
        leadCrm: leadCrmDefault,
        displayName: companyRouteState?.companyName ?? "",
        companyName: companyRouteState?.companyName ?? "",
        groupCompanyLid: groupCompanyIdYes,
        parentCompanyLid: companyRouteState.id
          ? Number(companyRouteState.id)
          : "",
      };
    }

    return {
      ...initialCompanyDetails(userData, groupCompanyIdNo, companyStatusActive),
      leadCrm: leadCrmDefault,
      displayName: companyRouteState?.companyName ?? "",
      companyName: companyRouteState?.companyName ?? "",
    };
  };

  //render step_0
  const renderCompanyBasicDetails = () => (
    <Box>
      <FormSection title={ADD_COMPANY_FORM_TITLES.BASIC_DETAILS}>
        <DynamicForm
          key={ADD_COMPANY_FORM_KEYS.BASIC_DETAILS}
          formConfig={getBasicFormConfig()}
          defaultValues={getDefaultValues()}
          formMethods={setBasicFormMethods}
          isEditMode={isEditMode}
          disableAllFields={disableAllFields}
          // shouldReset={!isEditMode} // Reset form on initial load
        />
      </FormSection>
      <FormSection title="Logo" showHeader={true}>
        <Box>
          <Typography variant="body2" fontWeight={500} mb={1}>
            Company Logo
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
            {isUploadingLogo || isFetchingPreview ? (
              <StyledLogoLoadingBox>
                <CircularProgress size={24} />
                <Typography variant="body2">
                  {isUploadingLogo ? "Uploading logo..." : "Loading preview..."}
                </Typography>
              </StyledLogoLoadingBox>
            ) : logoFile ? (
              <StyledLogoPreviewContainer>
                <StyledLogoPreviewBox>
                  {logoPreviewUrl ? (
                    <img
                      style={{
                        width: "160px",
                        height: "90px",
                        objectFit: "cover",
                        borderRadius: "4px",
                        border: "1px solid #e0e0e0",
                      }}
                      src={logoPreviewUrl}
                      alt="Company logo preview"
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
      <FormSection showHeader={false}>
        <MultipleSections
          key={ADD_COMPANY_FORM_KEYS.ADDRESS_DETAILS}
          initialValues={addressesValues}
          defaultValues={defaultAddress(userData)}
          title={(index) =>
            `${ADD_COMPANY_FORM_TITLES.ADDRESS_DETAILS} ${index}`
          }
          ref={addressesRef}
          formConfig={addressFields(userData, true, policyLocationAddressTypeId)}
          disableAllFields={disableAllFields}
        />
      </FormSection>
    </Box>
  );

  //render step_1
  const renderRegulatoryDetails = () => (
    <Box>
      <FormSection title={ADD_COMPANY_FORM_TITLES.REGULATORY_DETAILS}>
        <DynamicForm
          key={ADD_COMPANY_FORM_KEYS.REGULATORY_DETAILS}
          formConfig={
            localizationData
              ? localizeFields(regulatoryFields, localizationData)
              : []
          }
          defaultValues={initialRegulatoryDetails(
            userData,
            aiGenCompanyDetails
          )}
          formMethods={setRegulatoryFormMethods}
          isEditMode={isEditMode}
          disableAllFields={disableAllFields}
        />
      </FormSection>
      {Boolean(localizeFields(gstDetailsFields(), localizationData).length) && (
        <FormSection showHeader={false}>
          <MultipleSections
            key={ADD_COMPANY_FORM_KEYS.GST_DETAILS}
            initialValues={gstArray}
            defaultValues={initialGstDetails}
            title={(index) => `${ADD_COMPANY_FORM_TITLES.GST_DETAILS} ${index}`}
            ref={gstRef}
            formConfig={(index) => gstDetailsFields(index, userData)}
            disableAllFields={disableAllFields}
          />
        </FormSection>
      )}
    </Box>
  );

  //render step_2
  const renderProfileDetails = () => (
    <FormSection title={ADD_COMPANY_FORM_TITLES.PROFILE}>
      <DynamicForm
        key={ADD_COMPANY_FORM_KEYS.PROFILE_DETAILS}
        formConfig={companyProfileFields}
        defaultValues={initialCompanyProfile}
        formMethods={setProfileFormMethods}
        isEditMode={isEditMode}
        disableAllFields={disableAllFields}
      />
    </FormSection>
  );

  //render step_3
  const renderStrategyDetails = () => (
    <Box>
      <FormSection title={ADD_COMPANY_FORM_TITLES.SALES_STRATEGY}>
        <DynamicForm
          key={ADD_COMPANY_FORM_KEYS.SALES_STRATEGY}
          formConfig={salesStrategyFormConfig}
          defaultValues={initialSalesStrategy}
          formMethods={setSalesFormMethods}
          isEditMode={isEditMode}
          disableAllFields={disableAllFields}
          onActionMap={{
            fetchIndustryIntelligence: handleIndustryIntelligence,
          }}
        />
      </FormSection>
      <FormSection title={ADD_COMPANY_FORM_TITLES.SERVICE_STRATEGY}>
        <DynamicForm
          key={ADD_COMPANY_FORM_KEYS.SERVICE_STRATEGY}
          formConfig={serviceStrategyFields}
          defaultValues={initialServiceStrategy}
          formMethods={setServiceFormMethods}
          isEditMode={isEditMode}
          disableAllFields={disableAllFields}
        />
      </FormSection>
    </Box>
  );

  const stepperSubmit = async () => {
    if (activeStep === 0) {
      handleStepZeroSubmit();
    } else if (activeStep === 1) {
      handleStepOneSubmit();
    } else if (activeStep === 2) {
      handleStepTwo();
    } else if (activeStep === 3) {
      handleStepThreeSubmit();
    }
  };

  //step_0 submit
  const handleStepZeroSubmit = async () => {
    const [isValidAddressForm, isValidBasicDetailsForm] = await Promise.all([
      addressesRef.current?.trigger(),
      basicFormMethods?.trigger(),
    ]);

    const isValid = isValidAddressForm && isValidBasicDetailsForm; //checking whether all the forms are valid or not

    if (isValid) {
      setLoading(true);

      //if all fields are valid then only we are calling the api
      const [addressFormValues, basicDetails] = await Promise.all([
        addressesRef.current?.getValues(),
        basicFormMethods?.getValues(),
      ]);

      let groupCompanyMap = {};
      if (basicDetails?.parentCompanyLid) {
        groupCompanyMap = {
          groupCompanyId: basicDetails.parentCompanyLid,
        };
      }
      let createCompanyData = {};

      if (!isEditMode) {
        //only in create mode we need to send these details
        createCompanyData = {
          companyName: companyRouteState?.companyName,

          // companyName: basicDetails?.companyName,
          // displayName: basicDetails?.displayName,
          // industrySegmentLid: basicDetails?.industrySegmentLid,
          // priorityLid: basicDetails?.priorityLid,
        };
      }

      let companyDetailsFetchedByAi = {};

      if (
        // isAIGenBussinessCardInforAvailable &&
        aiGenCompanyDetails &&
        !isEditMode
      ) {
        createCompanyData = {
          companyName: companyRouteState?.companyName,
          dateOfIncorporation:
            aiGenCompanyDetails?.companyBasicInfo?.dateOfIncorporation,
        };
        companyDetailsFetchedByAi = {
          companyDetails: {
            companyHistory: aiGenCompanyDetails?.companyBasicInfo?.breifHistory,
            majorProducts:
              typeof aiGenCompanyDetails?.servicesAndProducts?.products ===
              "string"
                ? aiGenCompanyDetails.servicesAndProducts.products
                : "",
            keyCustomers:
              aiGenCompanyDetails?.servicesAndProducts?.keyCustomers,
            industryIntelligence: generateIndustryIntelligenceHTML(
              aiGenCompanyDetails?.industryIntelligence
            ),
            potentialOpportunity: generatePotentialOpportunitiesHTML(
              aiGenCompanyDetails?.potentialOpportunities
            ),
            salesPitch: generateSalesPitchDataHTML(
              aiGenCompanyDetails?.salesPitch
            ),
          },
        };
      }
      const leadCrmId = isEditMode ? companyResponse?.leadCrmInfo?.id : userData?.userId;
      const payload = {
        company: {
          ...createCompanyData,

          companyTypeLid: basicDetails?.companyTypeLid,
          currencyId: basicDetails?.currencyId,
          groupCompanyLid: basicDetails?.groupCompanyLid,
          priorityLid: basicDetails?.priorityLid,
          industrySegmentLid: basicDetails?.industrySegmentLid,
          displayName: basicDetails?.displayName,
          noOfEmployees: Number(basicDetails?.noOfEmployees),
          website: basicDetails?.website,
          sourceTypeLid: basicDetails?.sourceTypeLid,
          source: basicDetails?.source,
          leadCrm: basicDetails?.leadCrm,
          associateCrmId: basicDetails?.associateCrmId,
          accountManager: basicDetails?.accountManager,
          countryId: basicDetails?.countryId,
          sentimentLid: basicDetails?.sentimentLid,
          statusLid: basicDetails?.status,
          companyLogoFileId: logoFile?.id ?? null,
          groupCompanyMap,

          companyDocMaps: [],
          addresses: addressFormValues ?? [],
          ...companyDetailsFetchedByAi, //if we are creating company with ai generated data then we need to send these details
        },
      };

      //removing empty values from the payload
      const formatedPayload = await normalizePayload(payload);
      mutate({
        endpoint: endPoint,
        method: !isEditMode ? httpMethods.POST : httpMethods.PUT, //Todo
        data: formatedPayload,
      });
    } else {
      // Collect all errors from both forms
      const basicFormErrors = basicFormMethods?.formState?.errors || {};
      const addressFormErrors = addressesRef.current?.getErrors?.() || [];

      // Check if any form has non-required validation errors
      const hasBasicFormNonRequiredErrors =
        hasValidationErrors(basicFormErrors);

      // Check each address form error for non-required validation errors
      const hasAddressFormNonRequiredErrors = Array.isArray(addressFormErrors)
        ? addressFormErrors.some((errors) => hasValidationErrors(errors))
        : false;

      if (hasBasicFormNonRequiredErrors || hasAddressFormNonRequiredErrors) {
        dispatch(setToastMessage(INVALID_DATA_MESSAGE));
      } else {
        showValidationErrorToast(dispatch);
      }
     }
  };

  //step_1 submit
  const handleStepOneSubmit = async () => {
    const shouldValidateGst = Boolean(gstRef.current);

    if (!regulatoryFormMethods) {
      showValidationErrorToast(dispatch);
      return;
    }

    const triggerPromises = [
      regulatoryFormMethods.trigger(undefined, { shouldFocus: true }),
      shouldValidateGst && gstRef.current
        ? gstRef.current.trigger()
        : Promise.resolve(true),
    ];

    const [isValidRegulatoryForm, isValidGstForm] = await Promise.all(
      triggerPromises
    );
    const isValid = isValidRegulatoryForm && isValidGstForm;

    if (!isValid) {
      showValidationErrorToast(dispatch);
      return;
    }

    setLoading(true);

    const [regulatoryFormValues, gstFieldValues] = await Promise.all([
      regulatoryFormMethods.getValues(),
      shouldValidateGst && gstRef.current
        ? gstRef.current?.getValues()
        : Promise.resolve([]),
    ]);

    const rawDate = regulatoryFormValues?.dateOfIncorporation;
    const normalizedDate = rawDate
      ? dayjs(rawDate).isValid()
        ? dayjs(rawDate).format("YYYY-MM-DD")
        : null
      : null;

    const payload = {
      company: {
        dateOfIncorporation: normalizedDate,
        currencyId: regulatoryFormValues?.currencyId,
        panCardNumber: regulatoryFormValues?.panCardNumber,
        registrationNo: regulatoryFormValues?.registrationNo,
        annualPremium: Number(regulatoryFormValues?.annualPremium),
        tanNumber: regulatoryFormValues?.tanNumber,
        serviceTax: regulatoryFormValues?.serviceTax,
        gstDetails: (gstFieldValues ?? []).filter(
          (gst: any) => gst?.stateId || gst?.gstNumber || gst?.gstCategoryLid
        ),
        companyDocMaps: [],
      },
    };

    makePutCall(payload);
  };

  //step_2 submit
  const handleStepTwo = async () => {
    const isValidProfileForm = await profileFormMethods?.trigger();
    const isValid = isValidProfileForm;
    if (isValid) {
      setLoading(true);

      const profileFormValues = await profileFormMethods?.getValues();

      const payload = {
        company: {
          remarks: profileFormValues?.remarks,
          companyDetails: {
            businessProcesses: profileFormValues?.businessProcesses,
            companyHistory: profileFormValues?.companyHistory,
            keyCustomers: profileFormValues?.keyCustomers,
            majorProducts: profileFormValues?.majorProducts,
          },
        },
      };

      makePutCall(payload);
    } else {
      const hasRichTextError = hasRichTextLimitError(
        profileFormMethods?.formState?.errors
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
    const [isValidSalesForm, isValidServiceForm] = await Promise.all([
      salesFormMethods?.trigger(),
      serviceFormMethods?.trigger(),
    ]);

    const isValid = isValidSalesForm && isValidServiceForm;

    if (isValid) {
      setLoading(true);

      const [salesFormValues, serviceFormValues] = await Promise.all([
        salesFormMethods?.getValues(),
        serviceFormMethods?.getValues(),
      ]);

      const payload = {
        company: {
          companyDetails: {
            accountStrategy: salesFormValues?.accountStrategy,
            actionPlan: salesFormValues?.actionPlan,
            competitor: salesFormValues?.competitor,
            industryIntelligence: salesFormValues?.industryIntelligence,
            potentialOpportunity: salesFormValues?.potentialOpportunity,
            salesPitch: salesFormValues?.salesPitch,
            weakness: salesFormValues?.weakness,
            targetingReason: salesFormValues?.targetingReason,
            servicePlan: serviceFormValues?.servicePlan,
            acquisitionHistory: serviceFormValues?.acquisitionHistory,
            bizProfile: serviceFormValues?.bizProfile,
            servicePerformance: serviceFormValues?.servicePerformance,
          },
        },
      };

      makePutCall(payload);
    } else {
      const hasRichTextError = [salesFormMethods, serviceFormMethods].some(
        (method) => hasRichTextLimitError(method?.formState?.errors)
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

  const handleStepChange = async (newStep: number) => {
    setActiveStep(newStep);
  };

  useEffect(() => {
    if (!loading && companyResponse) {
      pageTopRef.current?.scrollIntoView({ behavior: "auto" });
    }
    // You can also add other dependencies if needed (like activeStep)
  }, [companyResponse, loading]);

  const companyName = companyRouteState?.companyName; // For "Add"
  const editCompanyName = companyResponse?.companyName; // For "Edit"

  const isEditModeFromUrl = location.pathname.includes("edit");

  const displayCompanyName = isEditModeFromUrl
    ? `Edit ${editCompanyName} details`
    : `Add ${companyName} details`;

  //extracting opportunity Data for a company
  const isCompanyStatusDisabled = useRef<boolean>(false); //to check whether company status should be disabled or not
  const fullUrl = endPoints.opportunityByCompanyId(Number(companyIdForApi));
  const { data: companyOpportunitiesData } = useApiQuery({
    url: fullUrl,
    queryKey: ["companyOpportunitiesData", companyIdForApi],
    enabled: isEditModeFromUrl,
  });

  useEffect(() => {
    if (
      companyOpportunitiesData &&
      companyOpportunitiesData.data?.data?.length > 0
    ) {
      isCompanyStatusDisabled.current = true;
    }
  }, [companyOpportunitiesData]);

  return (
    <StyledPageContainer ref={pageTopRef}>
      <StyledCrumbContainer>
        <CommonBreadcrumb
          crumbs={getCompanyDetailsBreadcrumbs(displayCompanyName)}
        />
      </StyledCrumbContainer>

      {loading && (
        <Loader data-testid="loader">
          <CircularProgress />
        </Loader>
      )}

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

      <Dialog open={showCropper} onClose={handleCropCancel} maxWidth="md" fullWidth>
        <DialogTitle>Preview Your Logo</DialogTitle>
        <DialogContent>
          <AutoImageCropper
            imageSrc={selectedImageSrc}
            divWidth={400}
            divHeight={225}
            onCropChange={setCroppedAreaPixels}
          />
          <Box sx={{ display: "flex", gap: 1, justifyContent: "center", mt: 2 }}>
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
        {activeStep > 0 && (
          <StyledPrevButton
            onClick={handleBack}
            variantType={BUTTON_VARIANTS.SECONDARY}
            label={BUTTON_LABELS.PREVIOUS}
          />
        )}

        <StyledNextButton
          variantType={BUTTON_VARIANTS.SECONDARY}
          onClick={handleCancel}
          label={"Cancel"}
        />

        <StyledNextButton
          type={BUTTON_TYPE.BUTTON}
          variantType={BUTTON_VARIANTS.PRIMARY}
          onClick={stepperSubmit}
          role="submit"
          data-testid="submit-button"
          loading={!saveAndExit && loading}
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
              setSaveAndExit(true);
              stepperSubmit();
            }}
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
export default AddCompany;
