import React, { useEffect, useState } from "react";
import MuiSelect from "../../common/Select/index";
import {
  TreeSelect,
  Button,
  getSessionStorageData,
  getAllMonths,
  getMonthsForQuarter,
  getCurrentFinancialYearDefault,
} from "@ui/ui-lib";
import {
  businessPerformanceFilterConfig,
  hierarchyField,
} from "../../components/BusinessPerformance/businessPerformanceConfig";
import { Grid, Typography } from "@mui/material";
import { useForm } from "react-hook-form";

const ALL_VALUE = "ALL";

interface FiltersProps {
  onRun: (
    filters: Record<string, string | number | { value: string; label: string }>
  ) => void;
  filters: Record<string, string | number | { value: string; label: string }>;
}

const Filters: React.FC<FiltersProps> = ({ onRun, filters }) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [monthOptions, setMonthOptions] = useState<
    { value: string; label: string }[]
  >([]);

  const userData = getSessionStorageData("user");

  const { control, watch, setValue, trigger } = useForm({
    defaultValues: {
      userId: String((filters.userId as any)?.value || userData?.userId || ""),
    },
  });

  // Watch userId (TreeSelect)
  useEffect(() => {
    const subscription = watch((value) => {
      handleFilterChange("userId", { value: value.userId, label: "" });
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  // Update month options when quarter changes
  useEffect(() => {
    const selectedQuarter =
      localFilters?.quarter && localFilters.quarter !== ALL_VALUE
        ? localFilters.quarter
        : null;

    let months = selectedQuarter
      ? getMonthsForQuarter(selectedQuarter as "Q1" | "Q2" | "Q3" | "Q4")
      : getAllMonths();

    months = [...months];
    setMonthOptions(months);
  }, [localFilters.quarter]);

  // Handle filter change
  const handleFilterChange = (
    key: string,
    value: string | number | { value: string; label: string },
    apiDependencies?: any
  ) => {
    const state = { ...localFilters };

    if (apiDependencies?.clearFieldsOnChange) {
      apiDependencies.clearFieldsOnChange.forEach((field: string) => {
        state[field] = ALL_VALUE;
      });
    }

    const newValue = typeof value === "object" ? value.value : value;
    state[key] = newValue;

    setLocalFilters(state);

    if (key === "quarter") {
      const months =
        newValue !== ALL_VALUE
          ? getMonthsForQuarter(newValue as "Q1" | "Q2" | "Q3" | "Q4")
          : getAllMonths();
      setMonthOptions([{ value: ALL_VALUE, label: "All" }, ...months]);
    }
  };

  // Reset filters to default
  const handleResetFilters = () => {
    const resetFilters = businessPerformanceFilterConfig.reduce(
      (acc, filter) => {
        if (filter.key === "userId") {
          acc[filter.key] = {
            value: String(userData?.userId ?? ""),
            label: userData ? `${userData.firstName} ${userData.lastName}` : "",
          };
          setValue("userId", String(userData?.userId ?? ""));
        } else if (filter.key === "financialYear") {
          acc[filter.key] = getCurrentFinancialYearDefault().value;
        } else if (filter.key === "organisationId") {
          acc[filter.key] = String(userData?.organisationId ?? "");
        } else if (filter.apiDependencies?.defaultValue) {
          acc[filter.key] = filter.apiDependencies.defaultValue;
        } else {
          acc[filter.key] = ALL_VALUE;
        }
        return acc;
      },
      {} as Record<string, string | number | { value: string; label: string }>
    );
    setLocalFilters(resetFilters);
    onRun(resetFilters);
  };

  return (
    <Grid container spacing={2}>
      {businessPerformanceFilterConfig.map((filter) => {
        return (
          <Grid
            item
            xs={12}
            sm={6}
            md={2.4}
            key={filter.key}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            {filter.key === "userId" ? (
              <TreeSelect
                field={{ ...hierarchyField, defaultValue: localFilters.userId }}
                control={control}
                watch={watch}
                setValue={setValue}
                trigger={trigger}
                onChangeValue={(val) => handleFilterChange("userId", val)}
                controlledSearchInput={false}
              />
            ) : (
              <>
                <Typography
                  variant="body2"
                  sx={{ marginBottom: 1, fontWeight: 500, color: "#1E2861B3" }}
                >
                  {filter.label}
                </Typography>
                <MuiSelect
                  value={
                    typeof localFilters[filter.key] === "object"
                      ? (localFilters[filter.key] as any).value
                      : localFilters[filter.key]
                  }
                  options={
                    filter.key === "owner"
                      ? filter.options
                      : // { label: "All", value: ALL_VALUE },
                      filter.key === "month"
                      ? monthOptions
                      : filter.options || []

                    // filter.options || []
                  }
                  apiDependencies={
                    filter?.apiDependencies?.endPoint
                      ? filter.apiDependencies
                      : undefined
                  }
                  dependentValue={
                    filter.apiDependencies?.dependentField
                      ? localFilters?.[filter.apiDependencies.dependentField]
                      : undefined
                  }
                  onChange={(e) =>
                    handleFilterChange(
                      filter.key,
                      e.target.value,
                      filter?.apiDependencies
                    )
                  }
                  disabled={
                    filter.disabled ||
                    (filter.apiDependencies?.dependentField
                      ? localFilters[filter.apiDependencies?.dependentField] ===
                        ALL_VALUE
                      : false)
                  }
                  fullWidth
                />
              </>
            )}
          </Grid>
        );
      })}
      <Grid
        item
        xs={12}
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "10px",
          marginTop: "20px",
        }}
      >
        <Button
          variantType="secondary"
          label="Reset"
          onClick={handleResetFilters}
          sx={{ width: "100px" }}
        />
        <Button
          variantType="primary"
          label="Run"
          onClick={() => onRun(localFilters)}
          sx={{ width: "100px" }}
        />
      </Grid>
    </Grid>
  );
};

export default Filters;
