import React, { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Box, Checkbox, FormControlLabel } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import DynamicForm from "../FormComponent";
import FormSection from "../FormSectionCard";
import useHasPermission from "../../rbac/useHasPermission";
import { FeatureKey } from "../../rbac/permissionMap";
import { FormActionsContainer } from "../SectionDetails/styles";
import { setToastMessage } from "@ui/ui-lib/redux/slice";
import { normalizePayload } from "@ui/ui-lib/utils/dataMappingUtils";
import {
  BUTTON_LABELS,
  BUTTON_TYPE,
  BUTTON_VARIANTS,
  VALIDATION_ERROR_MESSAGE,
  httpMethods,
} from "../../constants";
import { endPoints } from "@ui/ui-lib/constants/endPoints";
import { useApiMutation } from "@ui/ui-lib/hooks/useMutation";
import { useApiQuery } from "@ui/ui-lib/hooks/useApiQuery";
import {
  SmartAssistFormContainer,
  ResponseText,
  AdditionalOptionsContainer,
  FooterContainer,
  SmartAssistLoader,
  StyledNextButton,
  StyledPageContainer,
} from "./styles";
import {
  companyFormFields,
  initialCompanyDetails,
  contactInformationFields,
  defaultContactInformationFieldData,
  opportunityFormConfig,
  defaultopportunityFormValues,
  meetingsFormConfig,
  initialMeetingDetails,
} from "./formConfig";
import MultipleSections, { IMultipleSectionsHandle } from "../MultipleSections";
import { useLookupIdByKey } from "../../hooks/useLookupIdByKey";

import CustomModal from "../Modal";
import Button from "../Button";
import modalBgImage from "../../assets/svgs/modal-bg.svg";
import { AccordionTitles, buildAddressLine1 } from "../../utils";
import { LookUpValues } from "../../constants/lookupValues";
import { ButtonsContainer } from "../MeetingFeedbackDrawer/styles";

type CompanyMatchResult = {
  isNameMatched: boolean;
  details: {
    id?: string;
    label?: string;
  };
};

const findCompanyMatch = (data: any[], name: string): CompanyMatchResult => {
  const target = name.toLowerCase();
  const search = (nodes: any[]): CompanyMatchResult => {
    for (const node of nodes) {
      const nodeLabel = (node.companyName || node.label || "")
        .toString()
        .toLowerCase();
      if (nodeLabel === target) {
        return {
          isNameMatched: true,
          details: { id: node.id, label: node.companyName || node.label },
        };
      }
      if (Array.isArray(node.childCompanies || node.children)) {
        const children = node.childCompanies || node.children;
        const result = search(children);
        if (result.isNameMatched) return result;
      }
    }
    return { isNameMatched: false, details: {} };
  };
  return search(data);
};

const showValidationErrorToast = (dispatch: any) => {
  dispatch(setToastMessage(VALIDATION_ERROR_MESSAGE));
};

const SmartAssistForm: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  const companyId = location.state?.[AccordionTitles.COMPANY_SELECTION]?.id;
  const bussinessCardData =
    location.state?.[AccordionTitles.COMPANY_SELECTION]?.businessCardInfo;

  const { data: companyDetailsData, isLoading: isCompanyDetailsLoading } =
    useApiQuery({
      url: companyId ? endPoints.companyById(Number(companyId)) : undefined,
      queryKey: ["companyById", companyId],
      enabled: !!companyId,
    });

  const companyAddresses = companyDetailsData?.data?.companyAddresses || [];

  const [companyFormMethods, setCompanyFormMethods] =
    useState<ReturnType<typeof useForm>>();
  const [opportunityFormMethods, setOpportunityFormMethods] =
    useState<ReturnType<typeof useForm>>();
  const [meetingFormMethods, setMeetingFormMethods] =
    useState<ReturnType<typeof useForm>>();
  const contactSectionsRef = useRef<IMultipleSectionsHandle>(null);

  const isEditMode = false;
  const [data, setData] = useState<any>({});
  const contactTypeBusinessId = useLookupIdByKey(
    LookUpValues.CONTACT_TYPE_BUSINESS
  );

  const policyStatusId = useLookupIdByKey(LookUpValues.POLICY_STATUS_RENEWAL);

  const [isOpportunityChecked, setIsOpportunityChecked] = useState(false);
  // Opportunity details require OPTY write permission; hide the affordance
  // (checkbox + section) for users who cannot create opportunities.
  const canCreateOpportunity = useHasPermission(FeatureKey.CREATE_OPPORTUNITY);
  const [isMeetingChecked, setIsMeetingChecked] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const parts = (bussinessCardData?.name || "")
    .trim()
    .split(" ")
    .filter(Boolean);

  const [contactSectionsValues, setContactSectionsValues] = useState<any[]>([
    {
      ...defaultContactInformationFieldData,
      contactTypeLid: contactTypeBusinessId,
      firstName: parts[0] || "",
      lastName: parts.length > 1 ? parts.slice(1).join(" ") : "",
      phoneNumber:
        bussinessCardData?.personalPhoneNumber[0]?.replace(/[-\s]/g, "") ??
        bussinessCardData?.workPhoneNumber[0]?.replace(/[-\s]/g, "") ??
        "",
      email:
        bussinessCardData?.workEmail ?? bussinessCardData?.personalEmail ?? "",
    },
  ]);

  const [companyName, setCompanyName] = useState<string>("");
  const [searchCompanyName, setSearchCompanyName] = useState<string>("");
  const [blurTrigger, setBlurTrigger] = useState<number>(0);

  const searchUrl =
    searchCompanyName.length >= 3
      ? `${endPoints.companyHierarchy}?page=1&limit=1000&search=${encodeURIComponent(
          searchCompanyName
        )}`
      : "";

  const { data: searchData } = useApiQuery({
    url: searchUrl,
    queryKey: ["company-duplicate-check", searchCompanyName, blurTrigger],
    enabled: !!searchUrl,
  });

  const companyRouteState =
    useLocation()?.state?.[AccordionTitles.COMPANY_SELECTION];

  useEffect(() => {
    if (!companyFormMethods) return;
    if (!searchCompanyName || !searchData) return;

    const treeData = searchData?.data?.data || [];
    const result = findCompanyMatch(treeData, searchCompanyName);

    if (
      result.isNameMatched &&
      searchCompanyName.toLowerCase() === result.details.label?.toLowerCase()
    ) {
      companyFormMethods.setError("companyName", {
        type: "manual",
        message: "Company name already exists",
      });
    } else {
      companyFormMethods.clearErrors("companyName");
    }
  }, [searchData, searchCompanyName, companyFormMethods]);

  useEffect(() => {
    if (!companyFormMethods) return;

    companyFormMethods.register("companyName", {
      onBlur: (e) => {
        const val = (e.target.value || "").trim();
        setCompanyName(val);
        setSearchCompanyName(val);
        setBlurTrigger((prev) => prev + 1);
        companyFormMethods.setValue("companyName", val, {
          shouldValidate: true,
          shouldDirty: true,
        });
      },
    });
  }, [companyFormMethods]);
  useEffect(() => {
    if (!companyFormMethods || !companyDetailsData?.data) return;

    const details = companyDetailsData.data;
    const address = details.companyAddresses?.[0]?.address || {};

    const prefillMap: Record<string, any> = {
      companyName: details.companyName || "",
      cityId: address.cityId?.id ?? "",
    };

    companyFormMethods.reset(prefillMap);
  }, [companyDetailsData, companyFormMethods]);

  const { mutate } = useApiMutation({
    config: {
      onSuccess: (data: any) => {
        const { data: companyOpportunity } = data;
        const opportunityId = companyOpportunity?.opportunityId || null;
        const companyId = companyOpportunity?.companyId || null;
        const message = data?.message;
        setData({ companyId, opportunityId, message });
        setModalOpen(true);
        setLoading(false);
      },
      onError: (error) => {
        setLoading(false);
        const errorMessage = Array.isArray(error?.message)
          ? error.message[0]
          : error?.message ?? "Something went wrong!";
        dispatch(setToastMessage(errorMessage));
      },
    },
  });

  const handleCancel = () => {
    const isQuickContactCreation =location.state?.[AccordionTitles.COMPANY_SELECTION]?.isQuickContactCreation;
    if (isQuickContactCreation) {
      navigate("/create2", {
        state: {
          ...location.state,
          [AccordionTitles.COMPANY_SELECTION]: {
            id: companyRouteState?.id,
            label: companyRouteState?.label || companyRouteState?.companyName,
            companyName:
              companyRouteState?.companyName || companyRouteState?.label,
          },
          searchedString:
            companyRouteState?.companyName || companyRouteState?.label,
        },
      });
    } else if (location.state) {
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

  const handleSubmit = async () => {
    if (
      !companyFormMethods ||
      !contactSectionsRef.current ||
      (isOpportunityChecked && !opportunityFormMethods) ||
      (isMeetingChecked && !meetingFormMethods)
    )
      return;

    const companyNameVal = (
      companyFormMethods.getValues("companyName") || ""
    ).trim();

    if (companyNameVal.length >= 3 && searchData) {
      const treeData = searchData?.data?.data || [];
      const result = findCompanyMatch(treeData, companyNameVal);

      if (
        result.isNameMatched &&
        companyNameVal.toLowerCase() === result.details.label?.toLowerCase()
      ) {
        companyFormMethods.setError("companyName", {
          type: "manual",
          message: "Company name already exists",
        });
        showValidationErrorToast(dispatch);
        return;
      }
    }

    const validations = [
      companyFormMethods.trigger(),
      contactSectionsRef.current.trigger(),
    ];

    if (isOpportunityChecked) {
      validations.push(opportunityFormMethods!.trigger());
    }
    if (isMeetingChecked) {
      validations.push(meetingFormMethods!.trigger());
    }

    const validationResults = await Promise.all(validations);

    if (validationResults.some((result) => !result)) {
      showValidationErrorToast(dispatch);
      return;
    }
    setLoading(true);

    const dataFetches: any[] = [
      companyFormMethods.getValues(),
      contactSectionsRef.current.getValues(),
    ];

    if (isOpportunityChecked) {
      dataFetches.push(opportunityFormMethods!.getValues());
    }

    let meetingDetails = {};
    if (isMeetingChecked) {
      dataFetches.push(meetingFormMethods?.getValues());
      meetingDetails = meetingFormMethods?.getValues() || {};
    }

    const [
      companyValues,
      contactSectionsValues,
      opportunityValues,
      meetingValues,
    ] = await Promise.all(dataFetches);

    const contacts =
      Array.isArray(contactSectionsValues) && contactSectionsValues.length > 0
        ? contactSectionsValues
            .filter(
              (contact) =>
                contact.firstName?.trim() ||
                contact.lastName?.trim() ||
                contact.email?.trim() ||
                contact.phoneNumber?.trim()
            )
            .map((contact) => ({
              firstName: contact.firstName || "",
              lastName: contact.lastName || "",
              contactTypeLid: contact.contactTypeLid || contactTypeBusinessId,
              phoneNumber: contact.phoneNumber || "",
              email: contact.email || "",
            }))
        : [];

    const aiAddresses = bussinessCardData?.address || [];

    let formattedAddress = {};
    //when companyId exists, we are not updating company details
    if (!Boolean(companyId) && aiAddresses.length > 0) {
      const address = aiAddresses[0];
      formattedAddress = {
        address1: buildAddressLine1(address),
        area: address?.area,
        pinCode: address?.postalCode,
      };
    }

    const payload = {
      company: {
        ...companyValues,
        companyId: companyId,
        ...formattedAddress,
      },
      contacts,
      opportunity: isOpportunityChecked ? { ...opportunityValues } : null,
      meeting: isMeetingChecked
        ? {
            meetingDate: meetingDetails?.meetingDate || null,
            startTime: meetingDetails?.startTime || null,
            endTime: meetingDetails?.endTime || null,
            meetingAgenda: meetingDetails?.meetingAgenda || null,
          }
        : null,
    };

    const formattedPayload = await normalizePayload(payload);

    mutate({
      endpoint: endPoints.createCompanyOpportunity,
      method: httpMethods.POST,
      data: formattedPayload,
    });
  };

  const handleClose = () => {
    setModalOpen(false);
    navigate("/dashboard");
  };

  return (
    <>
      <StyledPageContainer>
        {loading && <SmartAssistLoader data-testid="loader" />}
        <Box>
          <FormSection title="Company details" hideCardBackground>
            <DynamicForm
              key="smart-assist-company-form"
              formConfig={companyFormFields(
                true,
                Boolean(companyId),
                companyAddresses
              )}
              defaultValues={initialCompanyDetails(
                location.state?.[AccordionTitles.COMPANY_SELECTION]
              )}
              formMethods={setCompanyFormMethods}
              isEditMode={isEditMode}
              inputProps={{
                companyName: {
                  value: companyName,
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                    setCompanyName(e.target.value);
                  },
                },
              }}
            />
          </FormSection>
          <FormSection hideCardBackground showDivider={false}>
            <MultipleSections
              key="smart-assist-contact-multiple"
              formConfig={contactInformationFields(true)}
              defaultValues={{
                ...defaultContactInformationFieldData,

                contactTypeLid: contactTypeBusinessId,
              }}
              initialValues={contactSectionsValues}
              title={(index) => `Contact Details ${index}`}
              ref={contactSectionsRef}
              disableAllFields={false}
            />
          </FormSection>
          <AdditionalOptionsContainer>
            {canCreateOpportunity && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isOpportunityChecked}
                    onChange={(e) => setIsOpportunityChecked(e.target.checked)}
                    sx={{
                      color: "black",
                      "&.Mui-checked": {
                        color: "black",
                      },
                    }}
                  />
                }
                label="Add Opportunity Details"
              />
            )}

            <FormControlLabel
              control={
                <Checkbox
                  checked={isMeetingChecked}
                  onChange={(e) => setIsMeetingChecked(e.target.checked)}
                  sx={{
                    color: "black",
                    "&.Mui-checked": {
                      color: "black",
                    },
                  }}
                />
              }
              label="Add Meeting Details"
            />
          </AdditionalOptionsContainer>

          {canCreateOpportunity && isOpportunityChecked && (
            <FormSection title="Opportunity details" hideCardBackground>
              <DynamicForm
                key="smart-assist-opportunity-form"
                formConfig={opportunityFormConfig}
                defaultValues={{
                  ...defaultopportunityFormValues,
                  policyStatusLid: policyStatusId,
                }}
                formMethods={setOpportunityFormMethods}
                isEditMode={isEditMode}
              />
            </FormSection>
          )}

          {isMeetingChecked && (
            <FormSection title="Meeting details" hideCardBackground>
              <DynamicForm
                key="smart-assist-meeting-form"
                formConfig={meetingsFormConfig}
                defaultValues={initialMeetingDetails()}
                formMethods={setMeetingFormMethods}
                isEditMode={isEditMode}
              />
            </FormSection>
          )}
        </Box>
        <FormActionsContainer>
          <StyledNextButton
            variantType={BUTTON_VARIANTS.SECONDARY}
            onClick={handleCancel}
            label={"Cancel"}
          />
          <StyledNextButton
            type={BUTTON_TYPE.BUTTON}
            variantType={BUTTON_VARIANTS.PRIMARY}
            onClick={handleSubmit}
            role="submit"
            data-testid="submit-button"
            loading={loading}
            label={loading ? "" : BUTTON_LABELS.SUBMIT}
          />
        </FormActionsContainer>
      </StyledPageContainer>
      <CustomModal
        open={modalOpen}
        heading="Submitted successfully"
        handleClose={handleClose}
        children={
          <SmartAssistFormContainer>
            <Box>
              <img src={modalBgImage} alt="modal-bg" />
              <ResponseText data-testid="response-text">
                {data.message || "View Company and Opportunity Details"}
              </ResponseText>
            </Box>
            <FooterContainer>
              <ButtonsContainer>
                {data.companyId && (
                  <Button
                    label="View company"
                    onClick={() => navigate(`/companies/${data.companyId}`)}
                    variantType="secondary"
                  />
                )}

                {data.opportunityId && (
                  <Button
                    label="View opportunity"
                    onClick={() =>
                      navigate(`/opportunities/${data.opportunityId}`)
                    }
                    variantType="primary"
                  />
                )}
                <Button
                  label="Exit"
                  onClick={handleClose}
                  variantType={data.opportunityId ? "secondary" : "primary"}
                />
              </ButtonsContainer>
            </FooterContainer>
          </SmartAssistFormContainer>
        }
      />
    </>
  );
};

export default SmartAssistForm;
