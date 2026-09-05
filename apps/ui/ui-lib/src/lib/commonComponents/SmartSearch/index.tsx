import { Typography } from "@mui/material";
import React, { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import FilterIcon from "../../assets/svgs/filter-icon";
import SearchIcon from "../../assets/svgs/search-icon";
import { SEARCH, SMART_SEARCH } from "../../constants";
import Button from "../Button";
import CommonAccordion, { AccordionVariant } from "../CommonAccordion";
import { CustomDivider } from "../CommonAccordion/styles";
import DynamicForm from "../FormComponent";
import {
  AccordionStyles,
  SmartSearchButtonsContainer,
  SmartSearchFormStyles,
  KeyValueContainer,
  SearchTitleContainer,
  SelectedValuesContainer,
  SmartSearchContainer,
  SmartSearchStyledButton,
  SmartSearchStyledTextField,
  TextFieldWrapper,
  TextHeaderBlock,
  SMART_SEARCH_CHIP_VALUE_CLASS,
  SelectedFilterChip,
  selectedFilterChipProps,
} from "./style";
import { SmartSearchProps } from "./types";
import { theme } from "@ui/ui-lib/styles/Theme";
import { formatDate } from "@ui/ui-lib/utils";

// 🔧 Utility to parse "3 Months" / "2 Years" etc.
export const addPeriodToDate = (startDate: Date, periodLabel: string): Date => {
  const result = new Date(startDate);
  const lower = periodLabel.toLowerCase();
  const regex = /(\d+)\s*(month|year|day)/i;
  const match = lower.match(regex);

  if (!match) return result;

  const number = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case "month":
      result.setMonth(result.getMonth() + number);
      break;
    case "year":
      result.setFullYear(result.getFullYear() + number);
      break;
    case "day":
      result.setDate(result.getDate() + number);
      break;
    default:
      break;
  }
  result.setDate(result.getDate() - 1);

  return result;
};

// Display every applied filter, wrapping onto as many lines as needed
const SelectedValuesDisplay: React.FC<{
  selectedValues: string;
}> = ({ selectedValues }) => {
  if (!selectedValues) return null;

  const pairs = selectedValues.split("|").map((pair) => pair.trim());

  return (
    <KeyValueContainer data-testid="selected-filters">
      {pairs.map((pair, index) => {
        const [key, value] = pair.split(": ");
        return (
          <SelectedFilterChip
            key={index}
            value={value}
            labelPrefix={`${key}:`}
            labelClass={SMART_SEARCH_CHIP_VALUE_CLASS}
            {...selectedFilterChipProps}
          />
        );
      })}
    </KeyValueContainer>
  );
};

const SmartSearch: React.FC<SmartSearchProps> = ({
  searchFormConfig,
  searchFormMethods,
  searchDefaultValues = {},
  selectedValues = {},
  onReset,
  formMethods,
  searchFieldName,
  placeholder,
  enableSmartSearch,
  disableSearch = false,
  onRunFilters,
  enableManualSearch = false,
  hideSearch = false,
  runThePeriodFilterByDefault = true,
  disableAllFields = false,
  title,
  expandFilters,
  onExpandFiltersChange,
  sharedFormMethods,
  collapseOnRun = true,
  onSaveView,
  saveViewLoading = false,
}) => {
  const methods = useForm();
  // If a shared form is provided, use it for all form operations so
  // both SmartSearch instances stay in sync via the same form store.
  const activeForm = sharedFormMethods ?? methods;
  const [accordionExpanded, setAccordionExpanded] = useState(false);
  const [name, setName] = useState("");
  const prevNameRef = useRef("");

  useEffect(() => {
    if (expandFilters !== undefined) {
      setAccordionExpanded(expandFilters);
    }
  }, [expandFilters]);

  useEffect(() => {
    if (searchFormMethods) {
      searchFormMethods(activeForm);
    }
  }, [searchFormMethods, activeForm]);

  useEffect(() => {
    // Auto-sync the search field to the form ONLY when manual search is disabled.
    // In manual mode we want the user to explicitly trigger the update via the search icon.
    if (enableManualSearch) return; // skip debounce in manual mode

    const timeout = setTimeout(() => {
      if (name.length >= 3 || name.length === 0) {
        if (formMethods) {
          formMethods.setValue(searchFieldName, name);
        }
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [name, formMethods, searchFieldName, enableManualSearch]);

  // Sync form value → local name state when the form is reset externally
  // (e.g. saved filter preferences restored on page load)
  useEffect(() => {
    if (!formMethods) return;
    const subscription = formMethods.watch((values, { name: changedField }) => {
      if (!changedField || changedField === searchFieldName) {
        const fieldValue = (values[searchFieldName] as string) || "";
        setName((prev) => (prev === fieldValue ? prev : fieldValue));
      }
    });
    return () => subscription.unsubscribe();
  }, [formMethods, searchFieldName]);

  useEffect(() => {
    if (!runThePeriodFilterByDefault) return;
    if (!formMethods) return;

    const subscription = formMethods.watch((values, { name }) => {
      const { period, financialYear, month } = values;

      // 1. Period changed → compute from/to
      if (name === "period" && period?.label) {
        const baseFrom = new Date();
        const computedTo = addPeriodToDate(baseFrom, period.label);
        formMethods.setValue("from", baseFrom.toISOString().split("T")[0]);
        formMethods.setValue("to", computedTo.toISOString().split("T")[0]);
      }

      // 2. Financial year changed → recompute based on month if exists, else full FY
      else if (name === "financialYear" && financialYear?.label) {
        setTimeout(() => {
          const startYear = parseInt(financialYear.value);
          const endYear = startYear + 1;

          if (month?.month !== undefined && month?.month !== null) {
            // Month exists → recompute for that month + FY
            const selectedMonth = month.month;
            if (selectedMonth === 0) {
              const fyStart = new Date(`${startYear}-04-01`);
              const fyEnd = new Date(`${endYear}-03-31`);
              formMethods.setValue("from", fyStart.toISOString().split("T")[0]);
              formMethods.setValue("to", fyEnd.toISOString().split("T")[0]);
            } else {
              const adjustedYear =
                selectedMonth >= 1 && selectedMonth <= 3
                  ? startYear + 1
                  : startYear;
              const paddedMonth = selectedMonth.toString().padStart(2, "0");
              const startDate = new Date(`${adjustedYear}-${paddedMonth}-01`);
              const endDate = new Date(adjustedYear, selectedMonth, 0 + 1);
              formMethods.setValue(
                "from",
                startDate.toISOString().split("T")[0]
              );
              formMethods.setValue("to", endDate.toISOString().split("T")[0]);
            }
          } else {
            // No month selected → full financial year
            const fyStart = new Date(`${startYear}-04-01`);
            const fyEnd = new Date(`${endYear}-03-31`);
            formMethods.setValue("from", fyStart.toISOString().split("T")[0]);
            formMethods.setValue("to", fyEnd.toISOString().split("T")[0]);
          }
        }, 0);
      }

      // 3. Month changed → recompute using current FY (or set FY if empty)
      else if (name === "month" && month) {
        let year: number;

        if (financialYear?.value) {
          year = parseInt(financialYear.value);
        } else {
          // Default to current financial year if not set
          const today = new Date();
          const currentYear = today.getFullYear();
          const fyStartYear =
            today.getMonth() >= 3 ? currentYear : currentYear - 1;
          const fyEndYear = fyStartYear + 1;

          formMethods.setValue("financialYear", {
            value: fyStartYear.toString(),
            label: `${fyStartYear}-${fyEndYear}`,
          });

          year = fyStartYear;
        }

        if (month.month === 0) {
          const fyStart = new Date(`${year}-04-01`);
          const fyEnd = new Date(`${year + 1}-03-31`);
          formMethods.setValue("from", fyStart.toISOString().split("T")[0]);
          formMethods.setValue("to", fyEnd.toISOString().split("T")[0]);
        } else {
          const adjustedYear =
            month.month >= 1 && month.month <= 3 ? year + 1 : year;
          const paddedMonth = month.month.toString().padStart(2, "0");
          const startDate = new Date(`${adjustedYear}-${paddedMonth}-01`);
          const endDate = new Date(adjustedYear, month.month, 0 + 1);
          formMethods.setValue("from", startDate.toISOString().split("T")[0]);
          formMethods.setValue("to", endDate.toISOString().split("T")[0]);
        }
      }

      // 4. Month cleared → reset to full FY (if financialYear is selected)
      else if (name === "month" && !month && financialYear?.value) {
        const startYear = parseInt(financialYear.value);
        const endYear = startYear + 1;
        const fyStart = new Date(`${startYear}-04-01`);
        const fyEnd = new Date(`${endYear}-03-31`);
        formMethods.setValue("from", fyStart.toISOString().split("T")[0]);
        formMethods.setValue("to", fyEnd.toISOString().split("T")[0]);
      }
    });

    return () => subscription.unsubscribe();
  }, [formMethods, runThePeriodFilterByDefault]);

  // When user clears the search (from some value to empty) in filter+search mode, auto-run filters to reset results
  useEffect(() => {
    if (!enableManualSearch && prevNameRef.current && name === "") {
      if (formMethods) formMethods.setValue(searchFieldName, "");
      if (onRunFilters) onRunFilters();
    }
    prevNameRef.current = name;
  }, [name, enableManualSearch, onRunFilters, formMethods, searchFieldName]);

  useEffect(() => {
    // When a shared form is provided, BusinessPerformance already handles the
    // initial reset — skip it here to avoid wiping values that were entered in
    // the primary SmartSearch instance before the sticky panel mounts.
    if (!sharedFormMethods) {
      activeForm.reset(searchDefaultValues);
    }
    if (searchFormMethods) {
      searchFormMethods(activeForm);
    }
  }, [searchFormMethods, activeForm, searchDefaultValues, sharedFormMethods]);

  // Build a string like "Field1: val1 | Field2: val2"
  const formattedValues = searchFormConfig
    .map(({ key, label, type }) => {
      const value = selectedValues[key];
      if (value === undefined || value === null || value === "") return null;

      let displayValue: any = type === "date" ? formatDate(value) : value; //if it is data type, format it

      if (typeof value === "object" && value !== null && "label" in value) {
        displayValue = (value as any).label;
      } else if (Array.isArray(value)) {
        if (value.length === 0) return null;
        // Multiselect entries are raw values, or {value,label} when the field
        // opted into storeSelectedOption — show the label when we have one.
        displayValue = value
          .map((v: any) =>
            v && typeof v === "object" && "label" in v ? v.label : v
          )
          .join(", ");
      }

      return `${label || key}: ${displayValue}`;
    })
    .filter(Boolean)
    .join(" | ");

  const hasSelectedFilters = formattedValues.length > 0;

  const handleReset = () => {
    prevNameRef.current = "";
    activeForm.reset({});
    if (onReset) {
      onReset();
    }
    setName("");
  };

  const handleSearch = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setName(event.target.value);
    if (event.target.value.length === 0 && formMethods) {
      formMethods.setValue(searchFieldName, "");
    }
  };

  const handleSearchKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    event.stopPropagation();
    if (enableManualSearch) {
      handleManualSearch();
    } else if (onRunFilters) {
      onRunFilters();
    }
  };

  const handleToggleAccordion = () => {
    setAccordionExpanded((prev) => {
      const next = !prev;
      onExpandFiltersChange?.(next);
      return next;
    });
  };

  const handleManualSearch = () => {
    // Explicitly push the current input value into the form and then run filters (if provided)
    if (formMethods) formMethods.setValue(searchFieldName, name);
    if (onRunFilters) onRunFilters();
  };

  const handleRunFilters = () => {
    // Execute the filter run function and optionally collapse if specified
    if (onRunFilters) onRunFilters();
    if (collapseOnRun) {
      setAccordionExpanded(false);
      onExpandFiltersChange?.(false);
    }
  };
  return (
    <SmartSearchContainer data-testid="smart-search">
      <SearchTitleContainer>
        <TextHeaderBlock>
          {title !== null && (
            <Typography variant="h4">{title ?? SMART_SEARCH}</Typography>
          )}
          {hasSelectedFilters && !accordionExpanded && (
            <SelectedValuesDisplay selectedValues={formattedValues} />
          )}
        </TextHeaderBlock>

        <TextFieldWrapper>
          {!hideSearch && (
            <>
              <SmartSearchStyledTextField
                fullWidth
                placeholder={placeholder || SEARCH}
                variant="standard"
                value={name}
                onChange={handleSearch}
                onKeyDown={handleSearchKeyDown}
                data-testid={
                  "search-by-" +
                  searchFieldName.replace(" ", "-").toLocaleLowerCase()
                }
                disabled={disableSearch}
              />
              <SmartSearchStyledButton
                variantType="icon"
                sizeType="small"
                onClick={enableManualSearch ? handleManualSearch : onRunFilters}
                hasValue={!!name}
                disabled={disableSearch}
                label={
                  <SearchIcon
                    color={
                      name
                        ? theme.palette.neutral.veryLight
                        : theme.palette.primary.main
                    }
                  />
                }
                className="search-icon"
              />
            </>
          )}

          {searchFormConfig.length > 0 && (
            <SmartSearchStyledButton
              variantType="icon"
              sizeType="small"
              onClick={handleToggleAccordion}
              hasFilters={hasSelectedFilters}
              label={
                <FilterIcon
                  color={
                    hasSelectedFilters
                      ? theme.palette.neutral.veryLight
                      : theme.palette.primary.main
                  }
                />
              }
              className="filter-icon"
            />
          )}
        </TextFieldWrapper>
      </SearchTitleContainer>

      {/* Only render accordion when expanded */}
      {accordionExpanded && searchFormConfig.length > 0 && (
        <CommonAccordion
          details={
            <>
              <DynamicForm
                disableAllFields={disableAllFields}
                formConfig={searchFormConfig}
                defaultValues={
                  Object.keys(selectedValues).length
                    ? selectedValues
                    : searchDefaultValues
                }
                formMethods={(dynamicFormMethods) => {
                  if (searchFormMethods) {
                    searchFormMethods(dynamicFormMethods);
                  }
                }}
                externalMethods={sharedFormMethods}
                sx={SmartSearchFormStyles}
                enableSmartSearch={enableSmartSearch}
              />
              <SelectedValuesContainer data-testid="selected-filters">
                {hasSelectedFilters ? (
                  <SelectedValuesDisplay selectedValues={formattedValues} />
                ) : (
                  <div></div>
                )}
                <SmartSearchButtonsContainer>
                  {onSaveView && (
                    <>
                      <Button
                        variantType="link"
                        onClick={onSaveView}
                        label="Save View"
                        disabled={disableAllFields || saveViewLoading}
                        loading={saveViewLoading}
                      />
                      <CustomDivider />
                    </>
                  )}
                  {onReset && (
                    <>
                      <Button
                        variantType="link"
                        onClick={handleReset}
                        label="Reset"
                        disabled={disableAllFields}
                      />
                      <CustomDivider />
                    </>
                  )}
                  <Button
                    variantType="link"
                    onClick={handleToggleAccordion}
                    label="Collapse"
                    disabled={disableAllFields}
                  />
                  <CustomDivider />
                  {onRunFilters && (
                    <Button
                      sizeType="small"
                      onClick={handleRunFilters}
                      label="Run"
                      disabled={disableAllFields}
                    />
                  )}
                </SmartSearchButtonsContainer>
              </SelectedValuesContainer>
            </>
          }
          variant={AccordionVariant.EDITABLE}
          onReset={handleReset}
          customStyles={AccordionStyles}
          expanded={accordionExpanded}
          onToggle={handleToggleAccordion}
        />
      )}
    </SmartSearchContainer>
  );
};

export default SmartSearch;
