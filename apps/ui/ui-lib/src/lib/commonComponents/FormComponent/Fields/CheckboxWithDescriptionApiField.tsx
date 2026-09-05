import React, { useEffect, useMemo, useState } from "react";
import { FormHelperText } from "@mui/material";
import Checkbox from "../../CheckBox";
import { FieldComponentProps } from "../types";
import { ControlledField } from "../utils";
import { useWatch, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { REGEX_PATTERNS } from "../../../constants/regex";
import { apiRequest } from "@ui/ui-lib/utils/apiRequest";
import {
  NoDataToShowText,
  StyledCheckboxDescription,
  StyledCheckboxDescriptionClear,
  StyledCheckboxDescriptionError,
  StyledCheckboxDescriptionFormControl,
  StyledCheckboxDescriptionLabel,
  StyledCheckboxDescriptionOption,
  StyledCheckboxDescriptionOptions,
} from "./styles";
import { NO_DATA_TO_SHOW } from "@ui/ui-lib/constants";

type Endpoint =
  | string
  | ((...deps: any[]) => string | undefined) // multiple positional args
  | ((dep?: any) => string | undefined); // single arg (object or value)

interface CheckboxWithDescriptionApiFieldProps extends FieldComponentProps {
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  isFormAnArray?: boolean;
  /** Optional override: if provided, this takes precedence over field.apiDependencies.endPoint */
  endpoint?: Endpoint;
  /** Keys in each option item */
  descriptionKey?: string; // default "description" but we'll fallback to "label"
  valueKey?: string; // default "id" but we'll fallback to "value"
  /** Optional trigger from RHF to re-validate on change */
  trigger?: (name?: string) => Promise<boolean>;
}

const CheckboxWithDescriptionApiField: React.FC<
  CheckboxWithDescriptionApiFieldProps
> = ({
  field,
  control,
  watch,
  setValue,
  isFormAnArray,
  endpoint,
  descriptionKey = "description",
  valueKey = "id",
  trigger,
}) => {
  const { apiDependencies } = field;

  const disableOptionWhenTrueKey =
    typeof field.componentProps?.disableOptionWhenTrueKey === "string"
      ? field.componentProps.disableOptionWhenTrueKey
      : undefined;

  // prefix for array sections (e.g., "sections[0].")
  const match = isFormAnArray
    ? field.name.match(REGEX_PATTERNS.MULTI_SECTION_PREFIX_REGEX)?.[0] || ""
    : "";

  // ---- Dep fields (support multiple property names for backward compat) ----
  const rawDependent =
    (apiDependencies as any)?.dependentFields ??
    (apiDependencies as any)?.dependentField ??
    (apiDependencies as any)?.multiDependentField;

  // Resolve dependent field names with section prefix (if any)
  const dependentFields: string[] = useMemo(() => {
    if (!rawDependent) return [];
    const arr = Array.isArray(rawDependent) ? rawDependent : [rawDependent];
    return arr.map((f: string) => match + f);
  }, [rawDependent, match]);

  // Watch dependency values (one or many); keep "" when none (noop)
  const depValue = useWatch({
    control,
    name:
      dependentFields.length === 0
        ? ""
        : dependentFields.length === 1
        ? dependentFields[0]
        : (dependentFields as any),
  });

  // Normalize values (support {value,label} objects from selects)
  const normalize = (v: any) =>
    v && typeof v === "object" && "value" in v ? (v as any).value : v;

  const depValuesArrayRaw =
    dependentFields.length === 0
      ? []
      : Array.isArray(depValue)
      ? depValue
      : [depValue];

  const depValuesArray = depValuesArrayRaw.map(normalize);

  const haveAllDeps =
    dependentFields.length === 0
      ? true
      : depValuesArray.every((v) => v !== null && v !== undefined && v !== "");

  const showByDep = haveAllDeps;
  const showByCond = apiDependencies?.showCondition
    ? apiDependencies.showCondition(watch)
    : true;
  const showField = showByDep && showByCond;

  // figure URL: explicit prop > apiDependencies.endPoint (string or fn)
  const url = useMemo(() => {
    // if static options exist, skip fetching
    if (Array.isArray(field.options) && field.options.length > 0)
      return undefined;

    // If there are required deps and we don't have them yet, don't fetch
    if (!haveAllDeps) return undefined;

    const endPointFromApi = apiDependencies?.endPoint as Endpoint | undefined;
    const ep: Endpoint | undefined = endpoint ?? endPointFromApi;
    if (!ep) return undefined;

    if (typeof ep === "function") {
      // Try to satisfy functions expecting positional args first
      if (
        depValuesArray.length > 1 &&
        (ep as Function).length >= depValuesArray.length
      ) {
        return (ep as any)(...depValuesArray);
      }
      // Single dep or generic function
      if (depValuesArray.length === 1 && (ep as Function).length <= 1) {
        return (ep as any)(depValuesArray[0]);
      }
      // Fallback: pass a dep map object in declared order
      const names = Array.isArray(rawDependent)
        ? (rawDependent as string[])
        : rawDependent
        ? [rawDependent as string]
        : [];
      const depMap = names.reduce((acc, name, idx) => {
        acc[name] = depValuesArray[idx];
        return acc;
      }, {} as Record<string, any>);
      return (ep as any)(depMap);
    }

    // Static string endpoint
    return ep;
  }, [
    endpoint,
    apiDependencies?.endPoint,
    field.options,
    haveAllDeps,
    rawDependent,
    depValuesArray,
  ]);

  const [options, setOptions] = useState<any[]>(
    Array.isArray(field.options) ? field.options : []
  );
  const [loading, setLoading] = useState(!Array.isArray(field.options));
  const [loadError, setLoadError] = useState<string | null>(null);

  // fetch options with abort + utilityFunction
  useEffect(() => {
    if (Array.isArray(field.options) && field.options.length > 0) {
      setOptions(field.options);
      setLoading(false);
      setLoadError(null);
      return;
    }
    if (!url) {
      setOptions([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const data = await apiRequest(url);
        const util = apiDependencies?.utilityFunction;
        const transformed = util ? util(data) : data;
        if (!cancelled)
          setOptions(Array.isArray(transformed) ? transformed : []);
      } catch (e: any) {
        if (!cancelled) {
          setLoadError(e?.message || "Failed to load");
          setOptions([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url, apiDependencies?.utilityFunction, field.options]);

  // clear linked fields when this field changes
  const clearLinked = () => {
    if (apiDependencies?.clearFieldsOnChange?.length) {
      apiDependencies.clearFieldsOnChange.forEach((fname) =>
        setValue(match + fname, null)
      );
    }
  };

  // propagate disabled if hidden by dependency/condition
  const mergedComponentProps = {
    ...field.componentProps,
    disabled: !showField || field.componentProps?.disabled,
  };

  return (
    <ControlledField
      field={{ ...field, componentProps: mergedComponentProps }}
      control={control}
      render={(sharedProps) => {
        const {
          value: rawValue,
          helperText,
          error,
          disabled,
          onChange,
          onBlur,
          // ...checkboxProps
        } = sharedProps;

        const value: any[] = Array.isArray(rawValue) ? rawValue : [];

        const toggle = (id: any) => {
          const exists = value.includes(id);
          const next = exists ? value.filter((v) => v !== id) : [...value, id];
          onChange(next);
          trigger && trigger(field.name);
          clearLinked();
        };

        const handleClearAll = () => {
          onChange([]);
          trigger && trigger(field.name);
          clearLinked();
        };

        return (
          <StyledCheckboxDescriptionFormControl
            error={!!error}
            disabled={!!disabled}
            component="fieldset"
          >
            {/* Optional label, consistent with your MultiSelect */}
            {field.label && (
              <StyledCheckboxDescription>
                <StyledCheckboxDescriptionError
                  id={`${field.name}-label`}
                  error={error}
                >
                  {field.rules?.required ? `${field.label} *` : field.label}
                </StyledCheckboxDescriptionError>
                {value.length > 0 && (
                  <StyledCheckboxDescriptionClear
                    type="button"
                    onClick={handleClearAll}
                  >
                    Clear
                  </StyledCheckboxDescriptionClear>
                )}
              </StyledCheckboxDescription>
            )}

            {loading && <div>Loading...</div>}
            {loadError && <FormHelperText error>{loadError}</FormHelperText>}
            {!loading && !loadError && options.length === 0 && (
              <NoDataToShowText>{NO_DATA_TO_SHOW}</NoDataToShowText>
            )}

            {!loading && !loadError && options.length > 0 && (
              <StyledCheckboxDescriptionOptions>
                {options.map((item: any, index: number) => {
                  const id = item?.[valueKey] ?? item?.id ?? item?.value;
                  const desc =
                    item?.[descriptionKey] ?? item?.description ?? item?.label;
                  const checked = value.includes(id);

                  const normalizedOptionId =
                    id === null || typeof id === "undefined"
                      ? undefined
                      : String(id);

                  const disabledByItem = Boolean(
                    item?.disabled ?? item?.isDisabled
                  );
                  const disabledByKey = disableOptionWhenTrueKey
                    ? (item as any)?.[disableOptionWhenTrueKey] === true
                    : false;

                  const optionDisabled =
                    !!disabled || disabledByItem || disabledByKey;

                  const handleCheckboxChange = (
                    event: React.ChangeEvent<HTMLInputElement>,
                    _nextChecked: boolean
                  ) => {
                    if (optionDisabled) {
                      event.preventDefault();
                      return;
                    }
                    toggle(id);
                  };

                  return (
                    <StyledCheckboxDescriptionOption
                      key={normalizedOptionId ?? index}
                      disabled={optionDisabled}
                      aria-disabled={optionDisabled}
                    >
                      <Checkbox
                        isChecked={checked}
                        onChange={handleCheckboxChange}
                        onBlur={onBlur}
                        disabled={optionDisabled}
                      />
                      <StyledCheckboxDescriptionLabel>
                        {desc}
                      </StyledCheckboxDescriptionLabel>
                    </StyledCheckboxDescriptionOption>
                  );
                })}
              </StyledCheckboxDescriptionOptions>
            )}
            {error && (
              <FormHelperText data-testid="form-helper-text">
                {helperText}
              </FormHelperText>
            )}
          </StyledCheckboxDescriptionFormControl>
        );
      }}
    />
  );
};

export default CheckboxWithDescriptionApiField;
