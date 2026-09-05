import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormHelperText,
  MenuItem,
  Typography,
} from "@mui/material";
import TextField from "@mui/material/TextField";
import { UseFormSetValue, UseFormWatch } from "react-hook-form";
import { FieldComponentProps } from "../types";
import { ControlledField } from "../utils";

import { Option } from "@ui/ui-lib/hooks/useApiSelectField";
import {
  AutocompleteStyles,
  DynamicFormSelectStyles,
  StyledHelperText,
  StyledPaper,
  StyledTypography,
} from "./styles";
import { REGEX_PATTERNS } from "../../../constants/regex";
import { useEffect, useState } from "react";
import { useDebounce } from "@ui/ui-lib/hooks/useDebounce";
import { useApiQuery } from "@ui/ui-lib/hooks/useApiQuery";
interface SelectFieldComponentProps extends FieldComponentProps {
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
}

export const buildQueryString = (
  params: Record<string, any>,
  baseUrl?: string
): string => {
  const query = Object.entries(params)
    .filter(([_, v]) => v !== undefined && v !== null && v !== "")
    .map(
      ([k, v]) =>
        `${encodeURIComponent(k)}=${encodeURIComponent(
          typeof v === "string" ? v : JSON.stringify(v)
        )}`
    )
    .join("&");

  if (!query) return "";

  // Decide prefix based on baseUrl
  if (baseUrl && baseUrl.includes("?")) {
    return `&${query}`;
  }
  return `?${query}`;
};

const SelectFieldByApi = ({
  field,
  control,
  watch,
  setValue,
  isFormAnArray,
  trigger,
  enableSmartSearch = false,
  onActionMap,
}: SelectFieldComponentProps) => {
  const { options, apiDependencies } = field;

  const [optionsState, setOptions] = useState<Option[]>(options || []);

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500); // Use the useDebounce hook

  const searchOnlyMode = field.componentProps?.searchOnlyMode ?? false;
  // Opt-in free text: allows typing a new value (not just selecting an option).
  // The typed string becomes the field value. Used for "create + check existence".
  const freeSolo = Boolean(
    (field.componentProps as { freeSolo?: boolean })?.freeSolo
  );
  // Opt-in client-side filtering: use MUI's default option filtering instead of
  // relying on server-side `search`. For small, fully-loaded lists (e.g. lookups,
  // org options) whose endpoints don't honour a search param.
  const clientFilter = Boolean(
    (field.componentProps as { clientFilter?: boolean })?.clientFilter
  );

  let match = "";
  if (isFormAnArray) {
    match =
      field.name.match(REGEX_PATTERNS.MULTI_SECTION_PREFIX_REGEX)?.[0] || "";
  }

  let currentValue = watch(field.name);

   const dependentValue = apiDependencies?.dependentField
    ? watch(match + apiDependencies.dependentField)
    : undefined;

  const preventDuplicateSelections = Boolean(
    (field.componentProps as { preventDuplicateSelections?: boolean })
      ?.preventDuplicateSelections
  );

  const excludeSelectedValuesFrom = (
    field.componentProps as {
      excludeSelectedValuesFrom?:
        | Array<string | { field: string; valuePath?: string }>
        | undefined;
    }
  )?.excludeSelectedValuesFrom;

  const multiSectionMatch = preventDuplicateSelections
    ? field.name.match(/^([^.]+)\.(\d+)\.(.*)$/)
    : null;

  const watchedArrayValues =
    preventDuplicateSelections && multiSectionMatch?.[1]
      ? watch(multiSectionMatch[1])
      : undefined;

  const dependentScalar =
    dependentValue && typeof dependentValue === "object"
      ? (dependentValue as { value?: unknown })?.value
      : dependentValue;

  let endPointUrl: string | undefined;
  if (typeof apiDependencies?.endPoint === "function") {
    endPointUrl = dependentScalar
      ? apiDependencies.endPoint(dependentScalar)
      : undefined;
  } else {
    endPointUrl = apiDependencies?.endPoint;
  }

  currentValue =
    typeof currentValue === "object" ? currentValue?.value : currentValue;
  
  // In search-only mode, always fetch when searching; otherwise use normal logic
  const shouldFetch = freeSolo
    ? true // free-text: always allow fetching (query is keyed by the search term)
    : searchOnlyMode
    ? !!debouncedSearchTerm // Fetch only when user is typing
    : !optionsState?.some((opt) => opt.value === currentValue);

  // In search-only mode, don't include entityIds when user is actively searching.
  // In free-text mode the value is the typed string (not an id), so never send it.
  const shouldIncludeEntityIds = freeSolo
    ? false
    : searchOnlyMode
    ? (!debouncedSearchTerm && currentValue) // Only include when not searching
    : currentValue; // Normal mode: always include if exists

  const baseParams: Record<string, any> = {
    page: 1,
    limit: searchOnlyMode ? 1000 : 15, // Show all matched results in search-only mode
    search: debouncedSearchTerm || "",
    ...(shouldIncludeEntityIds ? { entityIds: currentValue } : {}),
    ...(apiDependencies?.customParams || {}),
  };
  const queryString = buildQueryString(baseParams, endPointUrl);
  const fullUrl =
    shouldFetch && endPointUrl ? `${endPointUrl}${queryString}` : null;
  const {
    data: apiResponse,
    isLoading: loading,
    error,
  } = useApiQuery({
    url: fullUrl, // Will be `null` if no fetch needed
    queryKey: [
      "companisList",
      endPointUrl,
      debouncedSearchTerm,
      currentValue,
      dependentValue,
      apiDependencies?.customParams,
    ],
    enabled: !!fullUrl, // ensures react-query doesn't call API with null
  });

  useEffect(() => {
    if (!apiResponse) return;

    let options: Option[] = [];

    if (apiDependencies?.utilityFunction) {
      if (apiDependencies.utilityDependent) {
        options = apiDependencies.utilityFunction(
          apiResponse,
          watch(apiDependencies.utilityDependent)
        );
      } else {
        options = apiDependencies.utilityFunction(apiResponse);
      }
    }

    setOptions(options);
  }, [apiResponse]);

  const getValueAtPath = (value: any, path?: string) => {
    if (!path) return value;
    const segments = path.split(".").filter(Boolean);
    let current = value;
    for (const segment of segments) {
      if (current === null || current === undefined) {
        return undefined;
      }
      if (segment === "__proto__" || segment === "constructor" || segment === "prototype") {
        return undefined;
      }
      current = current[segment];
    }
    return current;
  };

  const getExcludedValues = () => {
    if (!excludeSelectedValuesFrom?.length) return [];

    const excluded: Array<string> = [];

    excludeSelectedValuesFrom.forEach((config) => {
      const normalized =
        typeof config === "string"
          ? (() => {
              const segments = config.split(".").filter(Boolean);
              const [fieldKey, ...rest] = segments;
              return {
                field: fieldKey,
                valuePath: rest.length ? rest.join(".") : undefined,
              };
            })()
          : config;

      if (!normalized?.field) return;

      const watchedValue = watch(normalized.field);
      if (Array.isArray(watchedValue)) {
        watchedValue.forEach((entry) => {
          const value = getValueAtPath(entry, normalized.valuePath);
          if (value !== undefined && value !== null && value !== "") {
            excluded.push(String(value));
          }
        });
        return;
      }

      const value = getValueAtPath(watchedValue, normalized.valuePath);
      if (value !== undefined && value !== null && value !== "") {
        excluded.push(String(value));
      }
    });

    return excluded;
  };

  const excludedValueSet = new Set(getExcludedValues());

  let showField = true;

  if (apiDependencies?.dependentField) {
    showField = !!dependentValue;
  }

  if (apiDependencies?.showCondition) {
    //this case is written just for group companyId or else we dont need this field at all
    showField = apiDependencies?.showCondition(watch);
  }

  const isDisabled = !showField || field.componentProps?.disabled;

  const isDuplicateOption = (option: Option): boolean => {
    if (
      !preventDuplicateSelections ||
      !multiSectionMatch ||
      !Array.isArray(watchedArrayValues)
    ) {
      return false;
    }

    const [, , indexString, fieldPath] = multiSectionMatch;
    const currentIndex = Number(indexString);
    if (Number.isNaN(currentIndex)) {
      return false;
    }

    const optionValue = option?.value;
    if (optionValue === undefined || optionValue === null) {
      return false;
    }

    const optionValueString = String(optionValue);
    const pathSegments = (fieldPath || "")
      .split(".")
      .filter((segment) => segment.length > 0);

    return watchedArrayValues.some((entry: unknown, idx: number) => {
      if (idx === currentIndex || entry === null || entry === undefined) {
        return false;
      }

      let value: any = entry;
      for (const segment of pathSegments) {
        if (value === null || value === undefined) {
          return false;
        }
        if (segment === "__proto__" || segment === "constructor" || segment === "prototype") {
          return false;
        }
        value = value[segment];
      }

      if (value === undefined || value === null) {
        return false;
      }

    return String(value) === optionValueString;
  });
  };

  const filteredOptions =
    optionsState?.filter((option) => {
      if (preventDuplicateSelections && isDuplicateOption(option)) {
        return false;
      }
      if (excludedValueSet.size > 0) {
        const optionValue = option?.value;
        if (
          optionValue !== undefined &&
          optionValue !== null &&
          excludedValueSet.has(String(optionValue))
        ) {
          return false;
        }
      }
      return true;
    }) || [];

  return (
    <ControlledField
      field={field}
      control={control}
      render={(sharedProps) => {
        const { onChange, value, error, helperText } = sharedProps;

        return (
          <Box>
            <StyledTypography
              variant="body2"
              sx={{
                color: sharedProps.error ? "error.main" : "text.secondary", // Turn label red if there's an error
              }}
              id={`${field.name}-label`}
              error={Boolean(sharedProps.error)}
            >
              {field.rules?.required ||
              (field.requiredWhenVisible && showField)
                ? `${field.label} *`
                : field.label}
            </StyledTypography>
            <FormControl fullWidth error={Boolean(error)}>
              <AutocompleteStyles
                options={filteredOptions}
                freeSolo={freeSolo}
                disablePortal={field.componentProps?.disablePortal ?? false}
                filterOptions={clientFilter ? undefined : (x) => x} // server-search by default; opt-in client filtering
                forcePopupIcon={searchOnlyMode ? false : undefined} // Hide dropdown arrow in search-only mode
                openOnFocus={searchOnlyMode ? false : undefined} // Don't open on focus in search-only mode
                open={searchOnlyMode ? (searchTerm.length > 0 && filteredOptions.length > 0) : undefined} // Only show dropdown when searching in search-only mode
                getOptionLabel={(option) =>
                  typeof option === "string" ? option : option.label
                }
                isOptionEqualToValue={(option, value) => {
                  const compareValue = enableSmartSearch
                    ? (value as any)?.value
                    : value?.value ?? value;
                  return option.value === String(compareValue);
                }}
                value={
                  freeSolo
                    ? ((value as any) ?? null)
                    : optionsState?.find(
                        (option) =>
                          String(option.value) ===
                          String(
                            enableSmartSearch ? (value as any)?.value : value
                          )
                      ) ??
                      // The picked option may drop out of optionsState when a
                      // later fetch replaces the list (e.g. the debounced
                      // empty-search page after a selection). With smart
                      // search the form value carries its own {value, label},
                      // so keep displaying it instead of blanking the field.
                      (enableSmartSearch && (value as any)?.value != null
                        ? {
                            value: String((value as any).value),
                            label: String((value as any).label ?? ""),
                          }
                        : null)
                }
                onChange={(_, newValue) => {
                  let newValueToSet: any;
                  if (freeSolo && typeof newValue === "string") {
                    newValueToSet = newValue;
                  } else if (newValue && typeof newValue === "object") {
                    newValueToSet = enableSmartSearch
                      ? { value: newValue.value, label: newValue.label }
                      : newValue.value;
                  } else {
                    newValueToSet = null;
                  }
                  onChange(newValueToSet);
                  trigger && trigger(field.name);

                  // Clear search term in search-only mode to close dropdown
                  if (searchOnlyMode) {
                    setSearchTerm("");
                  }

                  if (apiDependencies?.clearFieldsOnChange?.length) {
                    apiDependencies.clearFieldsOnChange.forEach((fieldName) => {
                      setValue(match + fieldName, null);
                    });
                  }
                  if (apiDependencies?.syncLabelTo) {
                    setValue(
                      match + apiDependencies.syncLabelTo,
                      typeof newValue === "object"
                        ? newValue?.label ?? null
                        : newValue ?? null
                    );
                  }
                  if (
                    field?.invokeFunction &&
                    typeof field.invokeFunction === "string"
                  ) {
                    const action = onActionMap?.[field.invokeFunction];
                    if (typeof action === "function") {
                      // action(); // ← this actually invokes the function
                      action(newValue, watch());
                    } else {
                      console.warn(
                        `No valid invokeFunction handler found: ${field.invokeFunction}`
                      );
                    }
                  }
                }}
                onInputChange={(_, newInputValue, reason) => {
                  setSearchTerm(newInputValue);
                  // In free-text mode, mirror typed input into the field value so
                  // a brand-new value (not in the options) is still captured.
                  if (freeSolo && reason === "input") {
                    onChange(newInputValue);
                    trigger && trigger(field.name);
                  }
                }}
                disabled={isDisabled}
                PaperComponent={StyledPaper}
                noOptionsText={
                  loading ? "Loading..." : (
                    (field.componentProps as any)?.noOptionsAction ? (
                      <Box>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>No data found</Typography>
                        <Button
                          size="small"
                          variant="text"
                          sx={{ textTransform: "none", p: 0, fontWeight: 600 }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            (field.componentProps as any).noOptionsAction.onClick();
                          }}
                        >
                          {(field.componentProps as any).noOptionsAction.label}
                        </Button>
                      </Box>
                    ) : "No data found"
                  )
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder={field.placeholder || ""}
                    error={Boolean(error)}
                    helperText={error ? helperText : ""}
                    disabled={isDisabled}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loading ? (
                            <CircularProgress color="inherit" size={20} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                data-testid={`form-field-${field.type}-${field.name}`}
              />
            </FormControl>
          </Box>
        );
      }}
    />
  );
};

export default SelectFieldByApi;
