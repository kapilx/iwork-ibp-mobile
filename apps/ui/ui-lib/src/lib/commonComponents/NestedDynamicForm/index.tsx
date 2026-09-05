import React, {
  useRef,
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
} from "react";
import { Box, Divider, Typography } from "@mui/material";
import { UseFormReturn } from "react-hook-form";
// import DynamicForm from "../../common/FormComponent/index";
import DynamicForm from "../FormComponent";
import MultipleSections, { IMultipleSectionsHandle } from "../MultipleSections";
import {
  NestedDynamicButtonsContainer,
  FormHeadingContainerText,
  FormHeadingImageAndTextContainer,
  FormHeadingImageContainer,
  FormHeadingSaperator,
  StyledCard,
  StyledFormButtonsContainer,
  StyledFormHeading,
} from "./styles";
import Button from "../Button/index";
import { NestedFormFieldConfig } from "../FormComponent/types";

export interface NestedGroupedDataCollectionHandle {
  resetForms: (data: Record<string, any>) => void;
  setValues?: (data: Record<string, any>) => void;
  getValues?: () => Record<string, any>;
  submitAll?: () => Promise<{
    isAllValid: boolean;
    result: Record<string, any>;
    invalidFields: string[];
  }>;
  isMounted: boolean;
  validateSection?: (sectionKey: string[]) => Promise<boolean>;
  clearErrors?: (sectionKeys: string[], unregisterAllFields?: boolean) => void;
  unregister?: (sectionKeys: string[]) => void;
}

type AnyObject = Record<string, any>;

const NestedDynamicForm = forwardRef<
  NestedGroupedDataCollectionHandle,
  {
    config: NestedFormFieldConfig[];
    onActionMap?: Record<string, () => void>;
    onSubmit?: () => void;
    onValuesChange?: (values: Record<string, any>) => void;
    disableAllFormFields?: boolean;
    dynamicValues?: Record<string, any>;
    showValue?: boolean; // New prop to control value display
    renderAsTable?: boolean; // New prop to control table rendering
  }
>(
  (
    {
      config,
      onActionMap,
      onValuesChange,
      dynamicValues,
      disableAllFormFields = false,
      showValue = false,
      renderAsTable = false,
    },
    ref
  ) => {
    const formMethodsMap = useRef<Record<string, UseFormReturn<any>>>({});
    const multipleSectionRefMap = useRef<
      Record<string, React.RefObject<IMultipleSectionsHandle>>
    >({});
    const multipleSectionValuesRef = useRef<Record<string, any[]>>({});

    // 🧠 Internal state for multiple sections
    const [multipleSectionState, setMultipleSectionState] = useState<
      Record<string, any[]>
    >(() =>
      Object.fromEntries(
        config
          .filter((group) => group?.isMultiple)
          .map((group) => [group?.key, group?.defaultValues ?? []])
      )
    );

    const [, forceUpdate] = useState(0);
    const hasUpdatedOnce = useRef(false);

    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
      // Give time for refs to be attached
      const timer = setTimeout(() => setIsMounted(true), 0);
      return () => clearTimeout(timer);
    }, []);

    const handleFormMethods = (key: string, methods: UseFormReturn<any>) => {
      formMethodsMap.current[key] = methods;

      // Add subscription to trigger re-render when watched values change
      methods.watch(() => {
        forceUpdate((prev) => prev + 1);
        if (onValuesChange) {
          onValuesChange(getAllFormValues());
        }
      });

      if (!hasUpdatedOnce.current) {
        hasUpdatedOnce.current = true;
        forceUpdate((prev) => prev + 1);
      }
    };

    useImperativeHandle(ref, () => ({
      resetForms: (data) => {
        config.forEach((group) => {
          const values = data[group.key];
          if (group.isMultiple) {
            const ref = multipleSectionRefMap.current[group.key];
            if (ref?.current && Array.isArray(values)) {
              ref.current.reset(values);
              setMultipleSectionState((prev) => ({
                ...prev,
                [group.key]: values,
              }));
            }
          } else {
            const methods = formMethodsMap.current[group.key];
            const values = data[group.key] || {};
            methods?.reset?.(values, { keepFieldsRef: true });
          }
        });
      },
      setValues: (data) => {
        Object.entries(data).forEach(([groupKey, groupValues]) => {
          if (groupValues == null) return;

          const groupConfig = config.find((group) => group.key === groupKey);
          if (groupConfig?.isMultiple) {
            const sectionRef = multipleSectionRefMap.current[groupKey];
            if (sectionRef?.current && Array.isArray(groupValues)) {
              sectionRef.current.setValues(groupValues as any[]);
            }
            return;
          }

          const methods = formMethodsMap.current[groupKey];
          if (!methods) return;

          const setNestedValues = (obj: Record<string, any>, prefix = "") => {
            Object.entries(obj).forEach(([key, value]) => {
              const path = prefix ? `${prefix}.${key}` : key;
              if (
                value !== null &&
                typeof value === "object" &&
                !Array.isArray(value)
              ) {
                setNestedValues(value as Record<string, any>, path);
              } else {
                methods.setValue(path as any, value);
              }
            });
          };

          setNestedValues(groupValues as Record<string, any>);
        });
      },
      getValues: getAllFormValues,
      submitAll: handleSubmitAll,
      isMounted,
      validateSection: async (sectionKeys: string[]) => {
        let allValid = true;
        for (const sectionKey of sectionKeys) {
          const methods = formMethodsMap.current[sectionKey];
          if (methods) {
            const isValid = await methods.trigger();
            if (!isValid) {
              allValid = false;
            }
          }
        }
        return allValid;
      },
      clearErrors: (
        sectionKeys: string[],
        unregisterAllFields: boolean = false
      ) => {
        const secKeys = unregisterAllFields
          ? config.map((group) => group.key)
          : sectionKeys;

        secKeys?.forEach((sectionKey) => {
          const methods = formMethodsMap.current[sectionKey];
          methods?.clearErrors();
        });
      },

      unregister: (sectionKeys: string[]) => {
        sectionKeys.forEach((sectionKey) => {
          const methods = formMethodsMap.current[sectionKey];
          if (methods) {
            const fieldNames = Object.keys(methods.getValues());
            methods.unregister(fieldNames as any, { keepValue: false });
          }
        });
      },
    }));

    const getAllFormValues = () => {
      const values: Record<string, any> = {};

      config.forEach((group) => {
        if (group.isMultiple) {
          const ref = multipleSectionRefMap.current[group.key];
          if (ref?.current) {
            values[group.key] = ref.current.getValues();
          } else if (multipleSectionValuesRef.current[group.key]) {
            values[group.key] = multipleSectionValuesRef.current[group.key];
          } else {
            values[group.key] = multipleSectionState[group.key] ?? [];
          }
        } else {
          const methods = formMethodsMap.current[group.key];
          if (methods) {
            values[group.key] = methods.getValues();
          }
        }
      });

      return values;
    };

    const globalWatch = (path: string) => {
      const allValues = getAllFormValues();
      const resolvePath = (obj: any, pathStr: string): any => {
        return pathStr.split(".").reduce((acc: any, key: string) => {
          if (acc == null) return undefined;
          if (Array.isArray(acc)) {
            const index = Number(key);
            return Number.isNaN(index) ? acc[key] : acc[index];
          }
          return acc[key as keyof typeof acc];
        }, obj);
      };

      const direct = resolvePath(allValues, path);
      if (direct !== undefined) {
        return direct;
      }

      for (const value of Object.values(allValues)) {
        const result = resolvePath(value, path);
        if (result !== undefined) {
          return result;
        }
      }
      return undefined;
    };

    const handleSubmitAll = async (): Promise<{
      isAllValid: boolean;
      result: Record<string, any>;
      invalidFields: string[];
    }> => {
      const result: Record<string, any> = {};
      let isAllValid = true;
      const invalidFields: string[] = [];

      for (const group of config) {
        const groupKey = group.key;

        // Evaluate showSection condition for this group
        let showSection = true;
        if (typeof group.showSection === "string") {
          try {
            showSection = evaluateCondition(
              group.showSection,
              getAllFormValues(),
              dynamicValues
            );
          } catch (err) {
            console.warn(
              "Failed to evaluate showSection during submission:",
              err
            );
            showSection = true; // fallback
          }
        }

        // Skip validation/collection if section is hidden
        if (!showSection) {
          result[groupKey] = group.isMultiple ? [] : {};
          continue;
        }

        if (group.isMultiple) {
          const sectionRef = multipleSectionRefMap.current[groupKey];

          if (!sectionRef?.current) {
            result[groupKey] = [];
            continue;
          }

          const isValid = await sectionRef.current.trigger();

          if (!isValid) {
            isAllValid = false;
          }

          const values = sectionRef.current.getValues();
          result[groupKey] = filterEmptyObjectsFromList(values);
        } else {
          const methods = formMethodsMap.current[groupKey];

          if (!methods) {
            continue;
          }

          const isValid = await methods.trigger();
          const values = methods.getValues();

          if (!isValid) {
            isAllValid = false;
            const fieldErrors = Object.keys(methods.formState.errors || {});
            invalidFields.push(
              ...fieldErrors.map((field) => `${groupKey}.${field}`)
            );
          }

          result[groupKey] = values;
        }
      }

      return { isAllValid, result, invalidFields };
    };
    return (
      <Box display="flex" flexDirection="column" gap={6}>
        {config?.map((group) => {
          let isDisabled = disableAllFormFields
            ? true
            : group.disableAllFields ?? false;

          if (typeof group.disableAllFields === "string") {
            const allFormValues = getAllFormValues();

            isDisabled = evaluateCondition(
              group.disableAllFields,
              allFormValues,
              dynamicValues
            );
          }

          if (group.isMultiple) {
            const ref =
              multipleSectionRefMap.current[group.key] ??
              React.createRef<IMultipleSectionsHandle>();
            multipleSectionRefMap.current[group.key] = ref;

            let showSection = true;

            if (typeof group.showSection === "string") {
              try {
                showSection = evaluateCondition(
                  group.showSection,
                  getAllFormValues(),
                  dynamicValues
                );
              } catch (err) {
                console.warn("Failed to evaluate showSection:", err);
                showSection = true; // Fallback to showing section if evaluation fails
              }
            }

            const canAdd =
              typeof group.showAddButton === "function"
                ? group.showAddButton(globalWatch, getAllFormValues())
                : group.showAddButton !== false;

            return (
              <StyledCard
                style={{ display: showSection ? "flex" : "none" }}
                key={group.key}
              >
                <MultipleSections
                  ref={ref}
                  initialValues={multipleSectionState[group.key] ?? []}
                  defaultValues={group.defaultValues ?? {}} // can pass per field template if needed
                  title={(i) => (canAdd ? `${group.title} ${i}` : group.title)}
                  formConfig={group.config}
                  isDivider={false}
                  disableAllFields={isDisabled}
                  canAdd={canAdd}
                  watchExternal={globalWatch}
                  onValuesChange={(values) => {
                    multipleSectionValuesRef.current[group.key] = values;
                    forceUpdate((prev) => prev + 1);
                  }}
                  hideRemoveFirst={(group as any).hideRemoveFirst}
                  dynamicCalculatedFields={
                    (group as any).dynamicCalculatedFields ?? []
                  }
                  externalValidators={(group as any).externalValidators ?? []}
                  runExternalValidatorsOnChange={
                    (group as any).runExternalValidatorsOnChange ?? true
                  }
                  enforceSingleRowWhenAddDisabled={
                    (group as any).enforceSingleRowWhenAddDisabled ?? false
                  }
                />
              </StyledCard>
            );
          }

          if (group.isButtons) {
            return (
              <StyledFormButtonsContainer key={group.key}>
                <Divider />
                <NestedDynamicButtonsContainer>
                  {group.config?.map((action, i) => (
                    <Button key={i} {...action.componentProps}>
                      {action.label}
                    </Button>
                  ))}
                </NestedDynamicButtonsContainer>
              </StyledFormButtonsContainer>
            );
          }

          return (
            <Box key={group.key} sx={group.containerStyles || {}}>
              <StyledFormHeading>
                {group?.title && <Box>{group.title}</Box>}
                <FormHeadingImageAndTextContainer>
                  {group?.renderActions?.map((action: any, index: number) => (
                    <React.Fragment key={index}>
                      {action.variant === "button" ? (
                        <Button
                          {...action.componentProps}
                          onClick={() => {
                            if (
                              typeof action.onClick === "string" &&
                              onActionMap?.[action.onClick]
                            ) {
                              onActionMap[action.onClick]();
                            } else if (typeof action.onClick === "function") {
                              action.onClick(action.key);
                            }
                          }}
                        >
                          {action.text}
                        </Button>
                      ) : (
                        <FormHeadingImageContainer
                          onClick={() => {
                            if (
                              typeof action.onClick === "string" &&
                              onActionMap?.[action.onClick]
                            ) {
                              onActionMap[action.onClick]();
                            } else if (typeof action.onClick === "function") {
                              action.onClick(action.key);
                            }
                          }}
                        >
                          {action.variant === "imageAndText" ? (
                            <>
                              {action.image && (
                                <img src={action.image} alt={action.text} />
                              )}
                              {action.text && (
                                <FormHeadingContainerText>
                                  {action.text}
                                </FormHeadingContainerText>
                              )}
                            </>
                          ) : (
                            action.text && (
                              <Typography>{action.text}</Typography>
                            )
                          )}
                        </FormHeadingImageContainer>
                      )}
                      {index < group.renderActions.length - 1 &&
                        action.variant !== "button" && (
                          <FormHeadingSaperator>|</FormHeadingSaperator>
                        )}
                    </React.Fragment>
                  ))}
                </FormHeadingImageAndTextContainer>
              </StyledFormHeading>
              <DynamicForm
                defaultValues={group.defaultValues ?? {}}
                formMethods={(methods) => handleFormMethods(group.key, methods)}
                formConfig={group.config}
                isEditMode={true}
                disableAllFields={isDisabled}
                onActionMap={onActionMap}
                showValue={showValue}
                renderAsTable={renderAsTable}
                enableSmartSearch={group.enableSmartSearch}
              />
            </Box>
          );
        })}
      </Box>
    );
  }
);

export default NestedDynamicForm;

export const evaluateCondition = (
  expression: string,
  values: Record<string, any>,
  dynamicValues: Record<string, any> = {}
): boolean => {
  try {
    const mergedValues = { ...dynamicValues, ...values }; // dynamicValues take precedence

    // Provide safe fallback to avoid undefined access
    const safeValues = new Proxy(mergedValues, {
      get(target, prop) {
        const value = target[prop as keyof typeof target];
        if (value === undefined) return {};
        return value;
      },
    });

    const fn = new Function(
      "values",
      `with (values) { return ${expression}; }`
    );

    return fn(safeValues);
  } catch (error) {
    console.warn("Condition evaluation failed:", expression, error);
    return true; // fallback to disabling if expression fails
  }
};

const filterEmptyObjectsFromList = (
  list: Record<string, any>[]
): Record<string, any>[] => {
  return list.filter((obj) =>
    Object.values(obj).some(
      (value) => value !== null && value !== undefined && value !== ""
    )
  );
};

export const normalizeApiDataForResetting = (data: AnyObject) => {
  const reduced = Object.keys(data).reduce((acc, key) => {
    const value = data[key];

    if (value && typeof value === "object" && Array.isArray(value.data)) {
      acc[key] = value.data.length > 0 ? value.data : [{}];
      return acc;
    }

    if (Array.isArray(value)) {
      acc[key] = value.length > 0 ? value : [{}];
    } else {
      acc[key] = value;
    }

    return acc;
  }, {});

  return reduced;
};
