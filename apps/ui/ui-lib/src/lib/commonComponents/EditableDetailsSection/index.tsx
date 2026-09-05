import React, { useImperativeHandle, useRef } from "react";
import { Box } from "@mui/material";
import {
  ALERT_MESSAGES,
  Button,
  CANCEL,
  CommonDetailsSection,
  DynamicForm,
  endPoints,
  FormFieldConfig,
  NestedDynamicForm,
  NestedGroupedDataCollectionHandle,
  SAVE,
  SectionImageContainer,
  SectionImageIcon,
  setToastMessage,
  SUCCESS_MESSAGE,
  UPDATE,
  useApiMutation,
} from "@ui/ui-lib";
import { FieldValues } from "react-hook-form";
import {
  ActionsContainer,
  FormWrapper,
  EditableHeaderContainer,
  EditableHeaderContent,
  HeaderTitle,
  FormApprovalContainer,
  EditableEditButton,
} from "./styles";
import editButton from "../../assets/svgs/details-section-edit.svg";
import { useDispatch } from "react-redux";
import { useParams } from "react-router-dom";

type NestedRecord = {
  [key: string]: any;
};

type DetailField = {
  label?: string;
  key?: string;
  isMultiple?: boolean;
};

type Section = {
  sectionTitle?: string;
  sectionImage?: string;
  hideTitle?: boolean;
  fields: DetailField[] | ((data: NestedRecord) => DetailField[]);
};

type HeaderMetadata = {
  index: number;
  title?: string;
  image?: string;
};

interface EditableDetailsSectionProps {
  sections?: Section[];
  data?: NestedRecord;
  formConfig?: FormFieldConfig[];
  formKey?: string;
  formRef?: React.RefObject<NestedGroupedDataCollectionHandle | null>;
  onSubmit?: (values: Record<string, any>) => void;
  onCancel?: () => void;
  onEditStateChange?: (isEditing: boolean) => void;
  isEditButtonVisible?: boolean;
  onFormValuesChange?: (
    values: Record<string, any>,
    formHandle: NestedGroupedDataCollectionHandle | null
  ) => void;
}

const EditableDetailsSection: React.FC<EditableDetailsSectionProps> = ({
  sections,
  data,
  formConfig,
  formKey = "editableDetails",
  formRef,
  onSubmit,
  onCancel,
  onEditStateChange,
  isEditButtonVisible = false,
  onFormValuesChange,
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const { id: policyId } = useParams();
  const dispatch = useDispatch();
  const innerRef = useRef<NestedGroupedDataCollectionHandle | null>(null);

  useImperativeHandle(formRef, () => innerRef.current);

  const handleValuesChange = React.useCallback(
    (values: Record<string, any>) => {
      if (!onFormValuesChange) return;
      onFormValuesChange(values, innerRef.current);
    },
    [onFormValuesChange]
  );

  // Prepare form configuration
  const computedFormConfig = React.useMemo(
    () => formConfig ?? [],
    [formConfig]
  );

  const nestedFormConfig = React.useMemo(() => {
    if (!computedFormConfig.length) return [];
    return [
      {
        key: formKey,
        config: computedFormConfig,
        defaultValues: data ?? {},
      },
    ];
  }, [computedFormConfig, data, formKey]);

  // Extract header info (icon + title)
  const headerMetadata = React.useMemo<HeaderMetadata>(() => {
    if (!sections?.length) return { index: -1 };
    const index = sections.findIndex(
      (section) =>
        typeof section.sectionTitle === "string" ||
        typeof section.sectionImage === "string"
    );
    if (index === -1) return { index: -1 };

    const section = sections[index];
    return {
      index,
      title: section.sectionTitle,
      image: section.sectionImage,
    };
  }, [sections]);

  // Compute initial values
  const initialFormValues = React.useMemo(() => {
    if (!nestedFormConfig.length) return {};
    return nestedFormConfig.reduce<Record<string, any>>((acc, group) => {
      acc[group.key] = group.defaultValues ?? (group.isMultiple ? [] : {});
      return acc;
    }, {});
  }, [nestedFormConfig]);

  React.useEffect(() => {
    if (!innerRef?.current?.isMounted) return;
    if (isEditing) return;
    innerRef.current.resetForms(initialFormValues);
  }, [isEditing]);
  const policyDetailsRef = React.useRef(null);
  const mutation = useApiMutation({
    config: {
      onSuccess: async (response) => {
        setLoading(false);
        // Scroll to top of the form on successful update
        if (
          policyDetailsRef?.current &&
          typeof policyDetailsRef.current.scrollIntoView === "function"
        ) {
          policyDetailsRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }

        dispatch(setToastMessage(response?.message || SUCCESS_MESSAGE));
      },
      onError: async (error) => {
        setLoading(false);
        const errorMessage = Array.isArray(error?.message)
          ? error.message[0]
          : error?.message ?? ALERT_MESSAGES.GENERIC_ERROR;

        dispatch(setToastMessage(errorMessage));
      },
    },
  });

  // Handle Edit
  const handleEdit = React.useCallback(() => {
    setIsEditing(true);
    onEditStateChange?.(true);
  }, [onEditStateChange]);

  // Handle Cancel
  const handleCancel = React.useCallback(() => {
    innerRef?.current?.resetForms(initialFormValues);
    setIsEditing(false);
    onCancel?.();
    onEditStateChange?.(false);
    if (
      policyDetailsRef?.current &&
      typeof policyDetailsRef.current.scrollIntoView === "function"
    ) {
      policyDetailsRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [initialFormValues, onCancel, onEditStateChange]);

  // Handle Submit - improved error handling and flow
  const handleSubmitClick = React.useCallback(async () => {
    if (!innerRef?.current) {
      return;
    }

    const result = await innerRef.current.submitAll?.();

    if (!result?.isAllValid) {
      console.error(
        "Validation errors:",
        result?.errors || "Unknown validation error"
      );
      return;
    }

    const values =
      formKey === "premiumInstallments"
        ? { premiumInstallments: [result?.result["premiumInstallments"]] }
        : (() => {
            const submittedGroup = result?.result?.[formKey] ?? {};
            const allowedKeys = new Set(
              computedFormConfig
                .map((field) => field?.key)
                .filter((key): key is string => Boolean(key))
            );
            const sanitizedGroup = Object.entries(submittedGroup).reduce<
              Record<string, any>
            >((acc, [key, value]) => {
              if (allowedKeys.has(key)) {
                acc[key] = value;
              }
              return acc;
            }, {});

            return { [formKey]: sanitizedGroup };
          })();
    onSubmit?.(values);

    setLoading(true);
    try {
      // Using mutateAsync to properly handle the promise
      await mutation.mutateAsync({
        endpoint: endPoints.getBasicDetailsByPolicyId(policyId),
        method: "PUT",
        data: values,
      });
      // The useEffect will handle resetting the form
      setIsEditing(false);
      onEditStateChange?.(false);
    } catch (err) {
      setLoading(false);
      setIsEditing(false);
      console.error("Failed to update covers:", err);
      dispatch(setToastMessage(err || "Failed to update details."));
    }
  }, [policyId, mutation, dispatch, onEditStateChange, onSubmit]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      onEditStateChange?.(false);
    };
  }, [onEditStateChange]);

  return (
    <Box ref={policyDetailsRef}>
      {/* Header Section */}
      <EditableHeaderContainer>
        <EditableHeaderContent>
          {headerMetadata.image ? (
            <SectionImageContainer>
              <SectionImageIcon
                src={headerMetadata.image}
                alt={headerMetadata.title ?? "section icon"}
              />
              {headerMetadata.title && (
                <HeaderTitle>{headerMetadata.title}</HeaderTitle>
              )}
            </SectionImageContainer>
          ) : headerMetadata.title ? (
            <HeaderTitle>{headerMetadata.title}</HeaderTitle>
          ) : (
            <span />
          )}
        </EditableHeaderContent>

        {/* Edit Button */}
        <ActionsContainer>
          {isEditButtonVisible && !isEditing && (
            <EditableEditButton
              variantType="secondary"
              onClick={handleEdit}
              sizeType="small"
            >
              <img src={editButton} alt="Edit" /> Edit
            </EditableEditButton>
          )}
        </ActionsContainer>
      </EditableHeaderContainer>

      {/* Editable Form Section */}
      {isEditing ? (
        <FormWrapper>
          <NestedDynamicForm
            ref={innerRef}
            config={nestedFormConfig}
            disableAllFormFields={false}
            onValuesChange={handleValuesChange}
          />

          {/* Buttons */}
          <FormApprovalContainer>
            <Button
              variantType="secondary"
              onClick={handleCancel}
              type="button"
              sizeType="small"
            >
              {CANCEL}
            </Button>
            <Button
              variantType="primary"
              type="button"
              onClick={handleSubmitClick}
              sizeType="small"
              loading={loading}
            >
              {SAVE}
            </Button>
          </FormApprovalContainer>
        </FormWrapper>
      ) : (
        <CommonDetailsSection sections={sections} data={data ?? {}} />
      )}
    </Box>
  );
};

export default EditableDetailsSection;
