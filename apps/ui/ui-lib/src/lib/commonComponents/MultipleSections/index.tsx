import { Box } from "@mui/material";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import addIcon from "../../assets/svgs/add-card.svg";
import removeIcon from "../../assets/svgs/remove-card.svg";
import CustomModal from "@ui/ui-lib/commonComponents/Modal";

import DynamicFormMultipleCases from "@ui/ui-lib/commonComponents/FormComponent/DynamicFormMultipleCases";
import { FormFieldConfig } from "@ui/ui-lib/commonComponents/FormComponent/types";
import {
  ActionButton,
  FormSectionHeader,
  SectionDivider,
} from "@ui/ui-lib/commonComponents/FormSectionCard/styles";
import {
  MultipleSectionsSectionTitle,
  MultiSectionStyledBox,
  StyledButtonContainer,
  MultipleSectionStyledContainer,
  MultiSectionStyledDivider,
} from "./styles";
import { REMOVE_SECTION_CONFIRMATION_MESSAGE } from "../../constants";

type FormConfigFactory =
  | FormFieldConfig[]
  | ((index: number) => FormFieldConfig[]);

interface DynamicCalculatedFieldContext {
  index: number;
  sectionValues: Record<string, any>;
  formValues: Record<string, any>;
  watchExternal?: (path: string) => any;
}

interface DynamicCalculatedFieldConfig {
  watchFields: string[]; // e.g. ['claimAmount', 'premium']
  setField: string; // e.g. 'claimPercentage'
  calculate: (
    values: Record<string, any>,
    context?: DynamicCalculatedFieldContext
  ) => any;
  externalWatchFields?: string[];
}

interface SectionExternalValidatorContext {
  watchExternal?: (path: string) => any;
  setRowError: (rowIndex: number, field: string, message: string) => void;
  clearRowError: (rowIndex: number, field: string) => void;
  getRowValues: (rowIndex: number) => Record<string, any>;
  hasRowError: (rowIndex: number, field: string) => boolean;
}

type SectionExternalValidator =
  | ((
      values: Record<string, any>,
      context: SectionExternalValidatorContext
    ) => void)
  | {
      validate: (
        values: Record<string, any>,
        context: SectionExternalValidatorContext
      ) => void;
      watchFields?: string[];
    };

interface IMultipleSectionsProps {
  initialValues: any[];
  title?: (index: number) => string | React.ReactNode;
  defaultValues: any;
  formConfig: FormConfigFactory;
  key: string;
  disableAllFields?: boolean;
  isDivider?: boolean;
  dynamicCalculatedFields?: DynamicCalculatedFieldConfig[]; // <-- new
  maxCount?: number; // Optional prop to limit the number of sections
  canAdd?: boolean;
  watchExternal?: (path: string) => any;
  onValuesChange?: (values: any[]) => void;
  hideRemoveFirst?: boolean;
  externalValidators?: SectionExternalValidator[];
  enforceSingleRowWhenAddDisabled?: boolean;
  runExternalValidatorsOnChange?: boolean;
}

const MultipleSections = forwardRef<
  IMultipleSectionsHandle,
  IMultipleSectionsProps
>(
  (
    {
      initialValues,
      title,
      defaultValues,
      formConfig,
      key,
      isDivider = true,
      disableAllFields = false,
      dynamicCalculatedFields, // <-- add this line
      maxCount, // Optional prop to limit the number of sections
      canAdd = true,
      watchExternal,
      onValuesChange,
      hideRemoveFirst = false,
      externalValidators,
      enforceSingleRowWhenAddDisabled = false,
      runExternalValidatorsOnChange = true,
    },
    ref
  ) => {
    const methods = useForm<any>({
      defaultValues: { retArray: initialValues },
      mode: "onBlur",
    });

    const {
      control,
      handleSubmit,
      reset,
      trigger: formTrigger,
      getValues,
      watch,
      setValue,
      setError,
      clearErrors,
      formState,
    } = methods;

    const formErrorsRef = useRef(formState.errors);
    const isRunningDynamicCalculationsRef = useRef(false);
    useEffect(() => {
      formErrorsRef.current = formState.errors;
    }, [formState.errors]);

    const hasNestedErrors = (node: any): boolean => {
      if (!node) return false;
      if (Array.isArray(node)) {
        return node.some((entry) => hasNestedErrors(entry));
      }
      if (typeof node === "object") {
        if (node.type) {
          return true;
        }
        return Object.values(node).some((value) => hasNestedErrors(value));
      }
      return false;
    };

    const { fields, append, remove } = useFieldArray({
      control,
      name: "retArray",
    });
    const [showModal, setShowModal] = useState(false);
    const [modalIndexToRemove, setModalIndexToRemove] = useState<number | null>(
      null
    );
    const [, forceUpdate] = useState({});

    const isAddDisabled = maxCount !== undefined && fields.length >= maxCount;

    useEffect(() => {
      if (initialValues && initialValues.length > 0) {
        reset({ retArray: initialValues });
      }
    }, [initialValues, reset]);

    useEffect(() => {
      if (!enforceSingleRowWhenAddDisabled || canAdd) return;

      const currentValues = getValues("retArray") ?? [];
      if (!Array.isArray(currentValues) || currentValues.length <= 1) return;

      reset({ retArray: [currentValues[0]] });
    }, [enforceSingleRowWhenAddDisabled, canAdd, getValues, reset]);

    const syncRowValues = (
      rowValues: Record<string, any>,
      basePath: string
    ) => {
      if (!rowValues || typeof rowValues !== "object") return;
      Object.entries(rowValues).forEach(([fieldKey, fieldValue]) => {
        const path = `${basePath}.${fieldKey}`;
        if (
          fieldValue !== null &&
          typeof fieldValue === "object" &&
          !Array.isArray(fieldValue)
        ) {
          syncRowValues(fieldValue as Record<string, any>, path);
        } else {
          setValue(path, fieldValue, {
            shouldValidate: false,
            shouldDirty: false,
          });
        }
      });
    };

    // Watch form values and trigger re-render when they change (for dynamic form configs)
    useEffect(() => {
      const subscription = watch(() => {
        forceUpdate({});
        if (typeof onValuesChange === "function") {
          const values = getValues("retArray") ?? [];
          onValuesChange(values);
        }
      });
      return () => subscription.unsubscribe();
    }, [watch, getValues, onValuesChange]);

    useImperativeHandle(ref, () => ({
      submit: () =>
        new Promise((resolve, reject) => {
          if (!runExternalValidatorsOnChange) {
            runExternalValidators(getValues() || {});
          }
          handleSubmit(
            (data) => resolve(data.retArray),
            (errors) => reject(errors)
          )();
        }),
      trigger: async (name?: string) => {
        const isValid = await formTrigger(name);
        runExternalValidators(getValues() || {});
        const hasErrors = hasNestedErrors(formErrorsRef.current);
        return isValid && !hasErrors;
      },
      getErrors: () => formState.errors?.retArray || {},
      getValues: () => getValues("retArray"),
      reset: (newValues: any[]) => reset({ retArray: newValues }),
      setValues: (newValues: any[]) => {
        if (!Array.isArray(newValues)) return;
        const currentValues = getValues("retArray") ?? [];

        if (newValues.length > currentValues.length) {
          Array.from({
            length: newValues.length - currentValues.length,
          }).forEach(() => append(defaultValues));
        } else if (newValues.length < currentValues.length) {
          for (
            let i = currentValues.length - 1;
            i >= newValues.length;
            i -= 1
          ) {
            remove(i);
          }
        }

        newValues.forEach((rowValues, index) => {
          syncRowValues(rowValues, `retArray.${index}`);
        });
      },
      watch: (name?: string) => watch(name),
    }));

    function generateTestId(
      type: string,
      index: number,
      title?: (index: number) => string | React.ReactNode
    ) {
      const section =
        typeof title === "function" && typeof title(index + 1) === "string"
          ? (title(index + 1) as string).replace(/\s+/g, "-").toLowerCase()
          : "section";
      return `${type}-${section}`;
    }

    const resolveFormConfig = (index: number): FormFieldConfig[] => {
      return typeof formConfig === "function" ? formConfig(index) : formConfig;
    };

    const runDynamicCalculations = useCallback(
      (values: Record<string, any>) => {
        if (!dynamicCalculatedFields || dynamicCalculatedFields.length === 0)
          return;
        if (isRunningDynamicCalculationsRef.current) {
          return;
        }
        isRunningDynamicCalculationsRef.current = true;
        try {
          const retArray: any[] = values?.retArray ?? [];
          for (let idx = 0; idx < retArray.length; idx += 1) {
            const sectionValues = retArray[idx] ?? {};
            dynamicCalculatedFields.forEach((config) => {
              const watchedValues: Record<string, any> = {};
              config.watchFields.forEach((f) => {
                watchedValues[f] = sectionValues?.[f];
              });
              const result = config.calculate?.(watchedValues, {
                index: idx,
                sectionValues,
                formValues: values ?? {},
                watchExternal,
              });
              if (result === undefined) {
                return;
              }
              if (typeof result === "number" && !Number.isFinite(result)) {
                return;
              }
              const currentValue = sectionValues?.[config.setField];
              if (!Object.is(currentValue, result) && retArray[idx]) {
                setValue(`retArray.${idx}.${config.setField}`, result, {
                  shouldValidate: true,
                  shouldDirty: false,
                });
              }
            });
          }
        } finally {
          isRunningDynamicCalculationsRef.current = false;
        }
      },
      [dynamicCalculatedFields, setValue, watchExternal]
    );

    useEffect(() => {
      if (!dynamicCalculatedFields || dynamicCalculatedFields.length === 0)
        return;

      const subscription = watch((values) => {
        runDynamicCalculations(values || {});
      });
      return () => subscription.unsubscribe();
    }, [watch, runDynamicCalculations, dynamicCalculatedFields]);

    const dynamicExternalDepsToken = useMemo(() => {
      if (
        !dynamicCalculatedFields ||
        dynamicCalculatedFields.length === 0 ||
        typeof watchExternal !== "function"
      ) {
        return "";
      }

      return dynamicCalculatedFields
        .map((config) =>
          (config.externalWatchFields || [])
            .map((field) => JSON.stringify(watchExternal(field) ?? null))
            .join("|")
        )
        .filter(Boolean)
        .join("||");
    }, [dynamicCalculatedFields, watchExternal]);

    useEffect(() => {
      if (
        !dynamicCalculatedFields ||
        dynamicCalculatedFields.length === 0 ||
        !dynamicExternalDepsToken
      ) {
        return;
      }
      runDynamicCalculations(getValues() || {});
    }, [
      dynamicCalculatedFields,
      dynamicExternalDepsToken,
      runDynamicCalculations,
      getValues,
    ]);

    const normalizedExternalValidators = useMemo(() => {
      if (!externalValidators || externalValidators.length === 0) return [];
      return externalValidators.map((validator) =>
        typeof validator === "function"
          ? { validate: validator, watchFields: [] as string[] }
          : validator
      );
    }, [externalValidators]);

    const runExternalValidators = useCallback(
      (values: Record<string, any>) => {
        if (normalizedExternalValidators.length === 0) return;
        const retArray: any[] = values?.retArray ?? [];
        normalizedExternalValidators.forEach(({ validate }) => {
          validate(values || {}, {
            watchExternal,
            setRowError: (rowIndex, field, message) => {
              if (retArray[rowIndex]) {
                setError(`retArray.${rowIndex}.${field}`, {
                  type: "manual",
                  message,
                });
              }
            },
            clearRowError: (rowIndex, field) => {
              if (retArray[rowIndex]) {
                setTimeout(() => {
                  clearErrors(`retArray.${rowIndex}.${field}`);
                }, 0);
              }
            },
            getRowValues: (rowIndex) => retArray[rowIndex] || {},
            hasRowError: (rowIndex, field) => {
              const rowErrors =
                (formErrorsRef.current as any)?.retArray?.[rowIndex] || {};
              return Boolean(rowErrors?.[field]);
            },
          });
        });
      },
      [normalizedExternalValidators, watchExternal, setError, clearErrors]
    );

    useEffect(() => {
      if (
        normalizedExternalValidators.length === 0 ||
        !runExternalValidatorsOnChange
      )
        return;

      const subscription = watch((values) => {
        runExternalValidators(values || {});
      });

      return () => subscription.unsubscribe();
    }, [
      watch,
      normalizedExternalValidators,
      runExternalValidators,
      runExternalValidatorsOnChange,
    ]);

    const externalDepsToken = useMemo(() => {
      if (
        !normalizedExternalValidators.length ||
        typeof watchExternal !== "function"
      ) {
        return "";
      }

      return normalizedExternalValidators
        .map(({ watchFields }) =>
          (watchFields || [])
            .map((field) => JSON.stringify(watchExternal(field)))
            .join("|")
        )
        .join("||");
    }, [normalizedExternalValidators, watchExternal]);

    useEffect(() => {
      if (
        normalizedExternalValidators.length === 0 ||
        !externalDepsToken ||
        !runExternalValidatorsOnChange
      )
        return;
      runExternalValidators(getValues());
    }, [
      externalDepsToken,
      normalizedExternalValidators,
      runExternalValidators,
      getValues,
      runExternalValidatorsOnChange,
    ]);
    return (
      <FormProvider {...methods} key={key}>
        <MultipleSectionStyledContainer onSubmit={handleSubmit(() => {})}>
          {fields.map((field, index) => {
            const baseConfig = resolveFormConfig(index);
            const perRowConfig: FormFieldConfig[] = baseConfig.map((f) => {
              const hasFn =
                f?.componentProps &&
                typeof (f.componentProps as any).disabledByIndex === "function";

              const computedDisabled = hasFn
                ? !!(f.componentProps as any).disabledByIndex(index)
                : (f?.componentProps as any)?.disabled;

              return {
                ...f,
                componentProps: {
                  ...((f.componentProps as any) || {}),
                  // global section disable wins; else row-specific disabled value
                  disabled: disableAllFields ? true : !!computedDisabled,
                },
              } as FormFieldConfig;
            });

            return (
              <Box key={field.id} mb={4}>
                <FormSectionHeader>
                  <MultipleSectionsSectionTitle>
                    {title?.(index + 1) || "Untitled Section"}
                  </MultipleSectionsSectionTitle>
                  {isDivider && <SectionDivider />}
                </FormSectionHeader>

                <DynamicFormMultipleCases
                  key={`${key}-${index}`}
                  formConfig={perRowConfig}
                  isEditMode={false}
                  prefix={`retArray.${index}`}
                  disableAllFields={disableAllFields}
                  externalWatch={watchExternal}
                />

                <StyledButtonContainer>
                  {index === fields.length - 1 &&
                    !disableAllFields &&
                    canAdd && (
                      <ActionButton
                        data-testid={generateTestId("add-button", index, title)}
                        onClick={() => append(defaultValues)}
                      >
                        <img
                          src={addIcon}
                          alt="Add"
                          data-testid={generateTestId("add", index, title)}
                        />
                      </ActionButton>
                    )}

                  {fields.length > 1 &&
                    !disableAllFields &&
                    (!hideRemoveFirst || index !== 0) && (
                      <ActionButton
                        data-testid={generateTestId(
                          "remove-button",
                          index,
                          title
                        )}
                        onClick={() => {
                          const values = getValues(`retArray.${index}`);
                          const isFilled = Object.values(values).some(
                            (val) =>
                              val !== undefined &&
                              val !== null &&
                              val !== "" &&
                              !(Array.isArray(val) && val.length === 0)
                          );

                          if (isFilled) {
                            setModalIndexToRemove(index);
                            setShowModal(true);
                          } else {
                            remove(index);
                            clearErrors(`retArray.${index}`);
                          }
                        }}
                      >
                        <img
                          src={removeIcon}
                          alt="Remove"
                          data-testid={generateTestId("remove", index, title)}
                        />
                      </ActionButton>
                    )}
                </StyledButtonContainer>
                {showModal && modalIndexToRemove === index && (
                  <CustomModal
                    open={showModal}
                    handleClose={() => {
                      setShowModal(false);
                      setModalIndexToRemove(null);
                    }}
                    heading="Remove Section"
                    buttons={[
                      {
                        label: "Remove",
                        onClick: () => {
                          if (modalIndexToRemove !== null) {
                            remove(modalIndexToRemove);
                            clearErrors(`retArray.${modalIndexToRemove}`);
                          }
                          setShowModal(false);
                          setModalIndexToRemove(null);
                        },
                        variant: "secondary",
                      },
                    ]}
                  >
                    {REMOVE_SECTION_CONFIRMATION_MESSAGE}
                  </CustomModal>
                )}

                {isDivider && index < fields.length - 1 && (
                  <MultiSectionStyledBox>
                    <MultiSectionStyledDivider />
                  </MultiSectionStyledBox>
                )}
              </Box>
            );
          })}
        </MultipleSectionStyledContainer>
      </FormProvider>
    );
  }
);

export interface IMultipleSectionsHandle {
  submit: () => Promise<any>;
  trigger: (name?: string) => Promise<boolean>;
  getErrors: () => any;
  getValues: () => any[];
  reset: (data: any[]) => void;
  setValues: (data: any[]) => void;
  watch: (name?: string) => any;
}

export default MultipleSections;
