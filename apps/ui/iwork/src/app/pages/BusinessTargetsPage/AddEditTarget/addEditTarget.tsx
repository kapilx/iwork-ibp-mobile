import React, { useEffect, useState } from "react";
import { Box, CircularProgress } from "@mui/material";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { useDispatch } from "react-redux";
import {
  CommonBreadcrumb,
  FormSection,
  FormActionsContainer,
  Button,
  BUTTON_VARIANTS,
  BUTTON_TYPE,
  DynamicForm,
  Loader,
  apiRequest,
  endPoints,
  setToastMessage,
  VALIDATION_ERROR_MESSAGE,
} from "@ui/ui-lib";
import {
  targetFormFields,
  initialTargetValues,
  getTargetBreadcrumbs,
} from "./formConfig";

// Server stores the target month as the first of the month (YYYY-MM-01); the
// monthYear picker holds "MMM YYYY", so translate at both edges.
const MONTH_PICKER_FORMAT = "MMM YYYY";

const AddEditTarget: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  // Edit mode is driven by a row passed via navigation state (the report's
  // row-click / Edit action) — mirrors how other screens hand off a record.
  const targetRow = location.state?.target ?? null;
  const isEditMode = Boolean(targetRow?.id);

  const [formMethods, setFormMethods] =
    useState<ReturnType<typeof useForm>>();
  const [loading, setLoading] = useState(false);

  const defaultValues = React.useMemo(() => {
    if (!targetRow) return initialTargetValues;
    return {
      // {value,label} to match how the field stores a selection: keys are
      // String(userId) (convertToTreeData) and the label is what the input
      // renders, so the row's teamMember name shows instead of the raw id.
      userId:
        targetRow.userId != null
          ? {
              value: String(targetRow.userId),
              label: targetRow.teamMember ?? String(targetRow.userId),
            }
          : "",
      month: targetRow.month
        ? dayjs(targetRow.month).format(MONTH_PICKER_FORMAT)
        : "",
      entityType: targetRow.entityType ?? initialTargetValues.entityType,
      kpi: targetRow.kpi ?? initialTargetValues.kpi,
      typeOfTarget: targetRow.typeOfTarget ?? initialTargetValues.typeOfTarget,
      valueOfTarget: targetRow.valueOfTarget ?? "",
    };
  }, [targetRow]);

  useEffect(() => {
    if (formMethods) formMethods.reset(defaultValues);
  }, [formMethods, defaultValues]);

  const goToReport = () => navigate("/business-targets-report");

  const handleSubmit = async () => {
    if (!formMethods) return;
    const isValid = await formMethods.trigger();
    if (!isValid) {
      dispatch(setToastMessage(VALIDATION_ERROR_MESSAGE));
      return;
    }
    const values = formMethods.getValues();
    const monthDate = dayjs(values.month, MONTH_PICKER_FORMAT);
    const payload = {
      ...(isEditMode && { id: targetRow.id }),
      // The tree stores the selected option, not a bare id — unwrap before
      // coercing, otherwise Number({value,label}) is NaN.
      userId: Number(values.userId?.value ?? values.userId),
      month: monthDate.isValid()
        ? monthDate.startOf("month").format("YYYY-MM-01")
        : values.month,
      entityType: values.entityType,
      kpi: values.kpi,
      typeOfTarget: values.typeOfTarget,
      valueOfTarget: Number(values.valueOfTarget),
    };

    setLoading(true);
    try {
      await apiRequest(endPoints.businessTargetUpsert, {
        method: "POST",
        data: payload,
      });
      dispatch(setToastMessage("Target saved successfully"));
      goToReport();
    } catch (error: any) {
      const message = Array.isArray(error?.message)
        ? error.message[0]
        : error?.message ?? "Something went wrong";
      dispatch(setToastMessage(message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ padding: "16px" }}>
      {/* mb so the breadcrumb clears the form card below it — CommonBreadcrumb
          is shared and carries no bottom margin of its own. */}
      <Box sx={{ mb: 4 }}>
        <CommonBreadcrumb crumbs={getTargetBreadcrumbs(isEditMode)} />
      </Box>

      {loading && (
        <Loader data-testid="loader">
          <CircularProgress />
        </Loader>
      )}

      <FormSection title={isEditMode ? "Edit target" : "Add target"}>
        <DynamicForm
          formConfig={targetFormFields()}
          defaultValues={defaultValues}
          formMethods={setFormMethods}
          isEditMode={isEditMode}
        />
      </FormSection>

      <FormActionsContainer>
        <Button
          variantType={BUTTON_VARIANTS.SECONDARY}
          onClick={goToReport}
          label="Cancel"
        />
        <Button
          type={BUTTON_TYPE.BUTTON}
          variantType={BUTTON_VARIANTS.PRIMARY}
          onClick={handleSubmit}
          role="submit"
          data-testid="submit-button"
          loading={loading}
          label={loading ? "" : "Submit"}
        />
      </FormActionsContainer>
    </Box>
  );
};

export default AddEditTarget;
