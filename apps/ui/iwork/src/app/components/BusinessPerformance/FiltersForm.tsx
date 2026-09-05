import {
  Button,
  DynamicForm,
  FormFieldConfig,
  getSessionStorageData,
  getAllMonths,
  getMonthsForQuarter,
} from "@ui/ui-lib";
import React, { useEffect, useState } from "react";
import { Grid } from "@mui/material";
import { businessPerformanceFilterConfig } from "./businessPerformanceConfig";
import { ALL_VALUE } from "../../constants";
import { BusinessPerformanceStyles } from "./styles";

interface FiltersFormProps {
  onRun: (filters: Record<string, string | number>) => void;
  defaultValues: Record<string, string | number>;
}

const FiltersForm: React.FC<FiltersFormProps> = ({ onRun, defaultValues }) => {
  const [formMethods, setFormMethods] = useState<any>();
  const [monthOptions, setMonthOptions] = useState(getAllMonths());
  const userData = getSessionStorageData("user");

  const formConfig: FormFieldConfig[] = businessPerformanceFilterConfig.map(
    (f) => (f.key === "month" ? { ...f, options: monthOptions } : f)
  );

  useEffect(() => {
    if (!formMethods) return;

    const subscription = formMethods.watch((values: any) => {
      const selectedQuarter =
        values?.quarter && values.quarter !== ALL_VALUE ? values.quarter : null;

      // Only add "All" once, and avoid duplicates
      let months: { value: string; label: string }[] = [];
      if (selectedQuarter) {
        months = getMonthsForQuarter(
          selectedQuarter as "Q1" | "Q2" | "Q3" | "Q4"
        );
      } else {
        months = getAllMonths();
      }

      // Remove any duplicate "All" values
      const uniqueMonths = [
        { value: ALL_VALUE, label: "All" },
        ...months.filter((m) => m.value !== ALL_VALUE),
      ];

      setMonthOptions(uniqueMonths);
    });

    return () => subscription.unsubscribe();
  }, [formMethods]);
  const currentFinancialYear = new Date().getFullYear().toString();

  const handleReset = () => {
    const resetFilters = businessPerformanceFilterConfig.reduce(
      (acc, filter) => {
        if (filter.key === "userId") {
          const userName = userData?.firstName
            ? userData.lastName && userData.lastName.trim() !== ""
              ? `${userData.firstName} ${userData.lastName}`
              : userData.firstName
            : "";

          acc[filter.key] = {
            value: String(userData?.userId ?? ""),
            label: userName,
          } as any;
        } else if (filter.key === "financialYear") {
          acc[filter.key] = currentFinancialYear; // Set default to current year
        } else if (filter.key === "owner") {
          acc[filter.key] = "me+team"; // Set default to "Me+team"
        } else if (filter.apiDependencies?.defaultValue) {
          acc[filter.key] = filter.apiDependencies.defaultValue as any;
        } else {
          acc[filter.key] = ALL_VALUE;
        }
        return acc;
      },
      {} as Record<string, string | number>
    );

    formMethods?.reset(resetFilters);
    onRun(resetFilters);
  };

  const handleRun = () => {
    if (formMethods) {
      const values = formMethods.getValues();
      onRun(values);
    }
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <DynamicForm
          formConfig={formConfig}
          defaultValues={defaultValues}
          formMethods={setFormMethods}
          sx={BusinessPerformanceStyles}
        />
      </Grid>
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
          onClick={handleReset}
          sx={{ width: "100px" }}
        />
        <Button
          variantType="primary"
          label="Run"
          onClick={handleRun}
          sx={{ width: "100px" }}
        />
      </Grid>
    </Grid>
  );
};

export default FiltersForm;
