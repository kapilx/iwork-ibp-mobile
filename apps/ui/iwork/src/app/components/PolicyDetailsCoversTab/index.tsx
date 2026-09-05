import {
  Button,
  CANCEL,
  NestedDynamicForm,
  NestedGroupedDataCollectionHandle,
  SAVE,
  SUCCESS_MESSAGE,
  apiRequest,
  endPoints,
  setToastMessage,
  useApiMutation,
} from "@ui/ui-lib";
import {
  StyledFormBox,
  PolicyDetailsCoverTabSectionTitle,
  ButtonStyles,
  HeaderSection,
  EditButtonButtonStyles,
  HeaderContainer,
  LabelText,
  ValueText,
  FormContainer,
  CoverSectionBlock,
  CoverSectionTitle,
} from "./styles";
import { ALERT_MESSAGES, COVER_DETAILS, EDIT } from "../../constants";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import editButton from "../../assets/svgs/details-section-edit.svg";

interface PolicyDetailsCoversTabProps {
  isEditButtonVisible: boolean;
  onEditStateChange?: (isEditing: boolean) => void;
}

const PolicyDetailsCoversTab = ({
  isEditButtonVisible,
  onEditStateChange,
}: PolicyDetailsCoversTabProps) => {
  const formRef = useRef<NestedGroupedDataCollectionHandle>(null);
  const sectionFormRefs = useRef<(NestedGroupedDataCollectionHandle | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null); // Add container ref
  const { id: policyId } = useParams();
  const coversConfig = {
    key: "policyDetailsCovers",
    title: "",
    config: [],
  };

  const [isEditable, setIsEditable] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: activityMetaData, isLoading: isActivityMetaLoading } = useQuery(
    {
      queryKey: ["activityMetaData", policyId],
      queryFn: async () => {
        const [coverConfigData, coversPrefillData] = await Promise.all([
          apiRequest(endPoints.getCoversMetaByPolicyId(Number(policyId))),
          apiRequest(endPoints.getCoversDataByPolicyId(Number(policyId))),
        ]);

        const sectionRenderPlanBlocks =
          coverConfigData?.data?.result?.sectionRenderPlan?.blocks || [];
        const formConfig = coverConfigData?.data?.result?.formConfig || [];
        const defaultValues = coversPrefillData?.data?.covers || {};

        if (sectionRenderPlanBlocks.length > 0) {
          const sectionConfigs = sectionRenderPlanBlocks
            .filter((block: any) => Array.isArray(block?.fields) && block.fields.length > 0)
            .map((block: any, index: number) => ({
              key:
                block?.type === "section" && block?.sectionId != null
                  ? `section_${block.sectionId}`
                  : `section_unmapped_${index}`,
              isUnmappedBlock: block?.type !== "section",
              title:
                block?.type === "section"
                  ? block.sectionName || block.sectionKey || "Section"
                  : "",
              config: (block.fields || []).map((field: any) => ({
                ...field,
                gridColumn: 10,
              })),
              enableSmartSearch: false,
            }));

          return {
            activityMeta: {
              sections: sectionConfigs,
              defaultValues: defaultValues,
              isSectioned: true,
            },
          };
        }

        if (formConfig.length > 0) {
          const updatedFormConfig = formConfig.map((field: any) => ({
            ...field,
            gridColumn: 10,
          }));

          return {
            activityMeta: {
              ...coversConfig,
              config: updatedFormConfig,
              defaultValues: defaultValues,
              isSectioned: false,
              enableSmartSearch: false,
            },
          };
        }

        return {
          activityMeta: {
            ...coversConfig,
            config: [],
            defaultValues: defaultValues,
            isSectioned: false,
            enableSmartSearch: false,
          },
        };
      },
    }
  );

  const dispatch = useDispatch();
  const updateEditableState = (editing: boolean) => {
    setIsEditable(editing);
    onEditStateChange?.(editing);
  };

  useEffect(() => {
    return () => {
      onEditStateChange?.(false);
    };
  }, [onEditStateChange]);

  const mutation = useApiMutation({
    config: {
      onSuccess: async (response: any) => {
        setLoading(false);
        updateEditableState(false); // lock after save
        dispatch(setToastMessage(response?.message || SUCCESS_MESSAGE));
        
        // Get values and reset forms
        if (activityMetaData?.activityMeta?.isSectioned) {
          // Aggregate values from all section forms
          const aggregatedValues: any = {};
          sectionFormRefs.current.forEach((ref) => {
            if (ref) {
              const sectionValues = ref.getValues?.();
              Object.assign(aggregatedValues, sectionValues);
            }
          });
          setTimeout(() => {
            containerRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }, 100);
          sectionFormRefs.current.forEach((ref) => {
            if (ref) {
              ref.resetForms?.(aggregatedValues);
            }
          });
        } else {
          const values = formRef.current?.getValues?.();
          setTimeout(() => {
            containerRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }, 100);
          formRef.current?.resetForms({ ...values });
        }
      },
      onError: async (error) => {
        setLoading(false); // ensure loader clears
        const errorMessage = Array.isArray(error?.message)
          ? error.message[0]
          : error?.message ?? ALERT_MESSAGES.GENERIC_ERROR;
        dispatch(setToastMessage(errorMessage));
        console.error("Cover update failed:", error);
      },
    },
  });

  const handleSubmitCovers = () => {
    if (!isEditable || loading) return; // ignore if not in edit mode
    
    let coverValues: any = {};
    
    // Get values based on sectioned or non-sectioned format
    if (activityMetaData?.activityMeta?.isSectioned) {
      // Aggregate values from all section forms
      sectionFormRefs.current.forEach((ref) => {
        if (ref) {
          const sectionValues = ref.getValues?.();
          if (sectionValues) {
            Object.keys(sectionValues).forEach((key) => {
              if (key.startsWith('section_')) {
                // Merge section values into the main values object
                Object.assign(coverValues, sectionValues[key]);
              }
            });
          }
        }
      });
    } else {
      // Original behavior for non-sectioned
      const values = formRef.current?.getValues?.();
      coverValues = values?.policyDetailsCovers || {};
    }
    
    if (!coverValues || Object.keys(coverValues).length === 0) {
      dispatch(setToastMessage("Cover details are required."));
      return;
    }

    const covers = { covers: coverValues };

    setLoading(true);
    try {
      mutation.mutate({
        endpoint: endPoints.coverUpdateByPolicyId(Number(policyId)),
        method: "PUT",
        data: covers,
      });
    } catch (err) {
      setLoading(false);
      console.error("Failed to update covers:", err);
      dispatch(setToastMessage("Failed to update covers."));
    }
  };
  const handleCancelCovers = () => {
    updateEditableState(false);
    setTimeout(() => {
      containerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  if (isActivityMetaLoading) {
    return <div>Loading...</div>;
  }

  return (
    <StyledFormBox ref={containerRef}>
      {/* Top bar: title on the left, Edit/Cancel on the right */}
      <HeaderSection>
        <PolicyDetailsCoverTabSectionTitle>
          {COVER_DETAILS}
        </PolicyDetailsCoverTabSectionTitle>

        {isEditButtonVisible && !isEditable && (
          <EditButtonButtonStyles
            variantType="secondary"
            type="button"
            onClick={() => updateEditableState(true)}
            disabled={loading}
            data-testid="policy-details-covers-edit-button"
          >
            <img src={editButton} alt="Edit" /> {EDIT}
          </EditButtonButtonStyles>
        )}
      </HeaderSection>
      <FormContainer>
        <HeaderContainer>
          <LabelText>Covers</LabelText>
          <ValueText>Details</ValueText>
        </HeaderContainer>
        
        {activityMetaData?.activityMeta?.isSectioned ? (
          // Render sectioned format
          activityMetaData?.activityMeta?.sections?.map((section: any, index: number) => (
            <CoverSectionBlock
              key={section.key}
              isUnmapped={Boolean(section?.isUnmappedBlock)}
            >
              {section.title && (
                <CoverSectionTitle >
                  {section.title}
                </CoverSectionTitle>
              )}
              <NestedDynamicForm
                key={`${section.key}_${JSON.stringify(activityMetaData?.activityMeta?.defaultValues)}`}
                showValue={!isEditable}
                renderAsTable={true}
                config={[
                  {
                    key: section.key,
                    title: "",
                    config: section.config,
                    defaultValues: activityMetaData?.activityMeta?.defaultValues || {},
                    enableSmartSearch: false,
                  },
                ]}
                ref={(el) => {
                  sectionFormRefs.current[index] = el;
                }}
                disableAllFormFields={!isEditable}
              />
            </CoverSectionBlock>
          ))
        ) : (
          // Render legacy non-sectioned format
          <NestedDynamicForm
            key={
              JSON.stringify(activityMetaData?.activityMeta?.defaultValues) ||
              policyId
            }
            showValue={!isEditable}
            renderAsTable={true}
            config={[
              (() => {
                const meta = activityMetaData?.activityMeta;
                if (meta && !meta.isSectioned && 'config' in meta) {
                  return meta;
                }
                return {
                  config: [],
                  defaultValues: {},
                  key: "policyDetailsCovers",
                  title: "",
                  enableSmartSearch: false,
                };
              })(),
            ]}
            ref={formRef}
            disableAllFormFields={!isEditable}
          />
        )}
      </FormContainer>
      <ButtonStyles>
        <Button
          variantType="secondary"
          type="button" // avoid native form submit
          sizeType="small"
          onClick={handleCancelCovers}
          disabled={!isEditable || loading}
          aria-busy={loading}
          data-testid="policy-details-covers-submit-button"
        >
          {CANCEL}
        </Button>
        <Button
          variantType="primary"
          sizeType="small"
          type="button" // avoid native form submit
          onClick={handleSubmitCovers}
          loading={loading}
          disabled={!isEditable || loading}
          aria-busy={loading}
          data-testid="policy-details-covers-submit-button"
        >
          {SAVE}
        </Button>
      </ButtonStyles>
    </StyledFormBox>
  );
};
export default PolicyDetailsCoversTab;
