import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import dayjs from "dayjs";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { Box, IconButton } from "@mui/material";
import Typography from "@mui/material/Typography";
import DynamicForm from "@ui/ui-lib/commonComponents/FormComponent";
import { CustomModal, endPoints, useApiMutation } from "@ui/ui-lib";
import { useDispatch } from "react-redux";
import { setToastMessage } from "../../redux/slice";
import {
  AddDependentActionButton,
  DependantsActionButton,
  DependantsActionsGroup,
  DependantsSection,
  DependantsSectionHeader,
  DependantsSectionTitle,
  DependantsTableCell,
  DependantsTableHeader,
  DependantsTableHeaderCell,
  DependantsTableRow,
  DependentsEmptyText,
  DependentsFormActions,
  DependentsFormWrapper,
  DependentsSectionContainer,
} from "../../components/ProfileSection/styles";
import {
  buildAvailableRelationshipOptions,
  DisplayDependent,
  getAgeHintForRelation,
  getGenderForRelation,
  getRelationshipType,
  toApiDate,
} from "./utils";

interface DependentsSectionProps {
  employeeId?: number | string;
  companyId?: number | string;
  dependents: DisplayDependent[];
  relationships?: any;
  constraints?: any;
  employeeGender?: string;
  employeeEffectiveDate?: string | null;
  onChanged: () => Promise<void> | void;
  maxDependentCountOverall?: number;
}

const emptyValues = { name: "", relationship: "", gender: "", dateOfBirth: "" };

const DependentsSection: React.FC<DependentsSectionProps> = ({
  employeeId,
  companyId,
  dependents,
  relationships,
  constraints,
  employeeGender,
  employeeEffectiveDate,
  onChanged,
  maxDependentCountOverall,
}) => {
  const dispatch = useDispatch();
  const formRef = useRef<any>(null);
  const watchSubscriptionRef = useRef<(() => void) | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [formRenderKey, setFormRenderKey] = useState(0);
  const [selectedRelationship, setSelectedRelationship] = useState("");
  const [editingDependent, setEditingDependent] =
    useState<DisplayDependent | null>(null);
  const [formInitialValues, setFormInitialValues] = useState(emptyValues);
  const [dobVisibility, setDobVisibility] = useState<Record<string, boolean>>({});
  const [deleteTarget, setDeleteTarget] = useState<DisplayDependent | null>(
    null,
  );

  const upsertMutation = useApiMutation({});
  const deleteMutation = useApiMutation({});
  const isSaving = upsertMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  const relationshipOptions = useMemo(
    () =>
      buildAvailableRelationshipOptions(
        relationships,
        dependents
          .filter((d) => d.key !== editingDependent?.key)
          .map((d) => d.relationship),
        editingDependent?.relationship,
        constraints,
        maxDependentCountOverall,
      ),
    [relationships, dependents, editingDependent, constraints, maxDependentCountOverall],
  );

  // Mirrors FamilyMembersManagement.canAddMoreDependents: when every configured
  // relation has hit its maxCount, no options remain and Add Dependent is disabled.
  const canAddMoreDependents = relationshipOptions.length > 0;

  const dobHelperText = useMemo(() => {
    if (!selectedRelationship) return "";
    const { minAge, maxAge } = getAgeHintForRelation(
      relationships,
      selectedRelationship,
    );
    if (minAge != null && maxAge != null)
      return `Typically ${minAge}–${maxAge} years`;
    if (maxAge != null) return `Typically up to ${maxAge} years`;
    if (minAge != null) return `Typically ${minAge}+ years`;
    return "";
  }, [relationships, selectedRelationship]);

  useEffect(() => {
    return () => {
      watchSubscriptionRef.current?.();
      watchSubscriptionRef.current = null;
    };
  }, []);

  // Auto-populate gender from the selected relationship (mirrors
  // FamilyMembersManagement). Deferred a frame so the form field is mounted
  // before setValue. Ambiguous relations resolve to "", leaving the user's choice.
  useEffect(() => {
    if (!selectedRelationship || !formRef.current) return;
    requestAnimationFrame(() => {
      if (!formRef.current) return;
      const autoGender = getGenderForRelation(selectedRelationship, employeeGender);
      if (autoGender) {
        formRef.current.setValue("gender", autoGender);
        formRef.current.trigger("gender");
      }
    });
  }, [selectedRelationship, employeeGender]);

  const formConfig = useMemo(
    () => [
      {
        key: "name",
        name: "name",
        label: "Name",
        type: "text" as const,
        rules: {
          required: { value: true, message: "Name is required" },
        },
        gridColumn: 2,
        componentProps: { fullWidth: true, placeholder: "Enter dependent name" },
      },
      {
        key: "relationship",
        name: "relationship",
        label: "Relationship",
        type: "select" as const,
        options: relationshipOptions,
        rules: {
          required: { value: true, message: "Relationship is required" },
        },
        gridColumn: 2,
        componentProps: { fullWidth: true },
      },
      {
        key: "gender",
        name: "gender",
        label: "Gender",
        type: "select" as const,
        options: [
          { label: "Male", value: "male" },
          { label: "Female", value: "female" },
          { label: "Other", value: "other" },
        ],
        rules: { required: { value: true, message: "Gender is required" } },
        gridColumn: 2,
        // Relations that imply a gender (father, mother, in-laws, spouse...)
        // prefill it and lock the field; ambiguous ones stay user-editable.
        componentProps: {
          fullWidth: true,
          disabled: Boolean(
            getGenderForRelation(selectedRelationship, employeeGender),
          ),
        },
      },
      {
        key: "dateOfBirth",
        name: "dateOfBirth",
        label: "Date of Birth",
        type: "date" as const,
        rules: {
          required: { value: true, message: "Date of Birth is required" },
        },
        gridColumn: 2,
        componentProps: {
          showAge: true,
          fullWidth: true,
          format: "DD/MM/YYYY",
          maxDate: dayjs(),
          helperText: dobHelperText || undefined,
        },
      },
    ],
    [dobHelperText, employeeGender, relationshipOptions, selectedRelationship],
  );

  const handleCancel = useCallback(() => {
    setShowForm(false);
    setEditingDependent(null);
    setSelectedRelationship("");
    watchSubscriptionRef.current?.();
    watchSubscriptionRef.current = null;
    setFormInitialValues(emptyValues);
    formRef.current?.reset?.(emptyValues);
  }, []);

  const handleOpenAdd = useCallback(() => {
    setEditingDependent(null);
    setFormInitialValues(emptyValues);
    setSelectedRelationship("");
    setFormRenderKey((k) => k + 1);
    setShowForm(true);
  }, []);

  const handleEdit = useCallback((dep: DisplayDependent) => {
    setEditingDependent(dep);
    setFormInitialValues({
      name: dep.name,
      relationship: dep.relationship,
      gender: dep.rawGender || "",
      dateOfBirth: dep.dobInput,
    });
    setSelectedRelationship(dep.relationship);
    setFormRenderKey((k) => k + 1);
    setShowForm(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!formRef.current || !employeeId || !companyId) return;
    const isValid = await formRef.current.trigger();
    if (!isValid) return;

    const values = formRef.current.getValues();
    const relation = values.relationship;

    try {
      await upsertMutation.mutateAsync({
        endpoint: endPoints.upsertProfileDependents,
        method: "PUT",
        data: {
          employeeId: Number(employeeId),
          companyId: Number(companyId),
          isUpdate: true,
          dependents: [
            {
              ...(editingDependent?.id ? { id: Number(editingDependent.id) } : {}),
              name: String(values.name ?? "").trim(),
              relation,
              relationshipType: getRelationshipType(relation),
              gender: values.gender,
              dateOfBirth: toApiDate(values.dateOfBirth),
              // A dependent added here (outside a Life Event) takes the employee's own
              // effective date, not "today" — only for a brand-new dependent; an edit to an
              // existing one shouldn't overwrite whatever effective date it already has.
              ...(!editingDependent?.id && employeeEffectiveDate
                ? { effectiveDate: employeeEffectiveDate }
                : {}),
            },
          ],
        },
      });
      dispatch(
        setToastMessage(
          editingDependent
            ? "Dependent updated successfully."
            : "Dependent added successfully.",
        ),
      );
      handleCancel();
      await onChanged();
    } catch (error: any) {
      dispatch(
        setToastMessage(
          error?.response?.data?.message ||
            error?.message ||
            "Failed to save dependent.",
        ),
      );
    }
  }, [
    companyId,
    dispatch,
    editingDependent,
    employeeEffectiveDate,
    employeeId,
    handleCancel,
    onChanged,
    upsertMutation,
  ]);

  const closeDeleteModal = useCallback(() => {
    if (isDeleting) return;
    setDeleteTarget(null);
  }, [isDeleting]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget?.id || !employeeId || !companyId) return;

    const remaining = dependents
      .filter((d) => d.key !== deleteTarget.key && d.id)
      .map((d) => ({
        id: Number(d.id),
        name: d.name,
        relation: d.relationship,
        relationshipType: getRelationshipType(d.relationship),
        gender: d.rawGender,
        dateOfBirth: d.dobInput ? toApiDate(d.dobInput) : d.rawDateOfBirth || "",
      }));

    try {
      await deleteMutation.mutateAsync({
        endpoint: endPoints.updateEnrollmentData,
        method: "PUT",
        data: {
          employeeId: Number(employeeId),
          companyId: Number(companyId),
          action: "save",
          dependents: remaining,
          combinedChoices: [],
          deletedDependentIds: [Number(deleteTarget.id)],
        },
      });
      dispatch(setToastMessage("Dependent deleted successfully."));
      if (editingDependent?.key === deleteTarget.key) handleCancel();
      setDeleteTarget(null);
      await onChanged();
    } catch (error: any) {
      dispatch(
        setToastMessage(
          error?.response?.data?.message ||
            error?.message ||
            "Failed to delete dependent.",
        ),
      );
    }
  }, [
    companyId,
    dependents,
    deleteMutation,
    deleteTarget,
    dispatch,
    editingDependent,
    employeeId,
    handleCancel,
    onChanged,
  ]);

  const busy = isSaving || isDeleting;

  return (
    <>
      <DependentsSectionContainer>
        <DependantsSection>
          <DependantsSectionHeader>
            <DependantsSectionTitle>Dependents</DependantsSectionTitle>
            <AddDependentActionButton
              variant="contained"
              onClick={handleOpenAdd}
              disabled={showForm || !canAddMoreDependents}
              title={
                !canAddMoreDependents
                  ? "You've added all the dependents your policy allows."
                  : undefined
              }
            >
              Add Dependent
            </AddDependentActionButton>
          </DependantsSectionHeader>

          {showForm && (
            <DependentsFormWrapper>
              <DynamicForm
                key={formRenderKey}
                formConfig={formConfig}
                defaultValues={formInitialValues}
                formMethods={(methods: any) => {
                  formRef.current = methods;
                  if (methods?.watch) {
                    watchSubscriptionRef.current?.();
                    const subscription = methods.watch(
                      (
                        value: { relationship?: string },
                        { name }: { name?: string },
                      ) => {
                        if (name === "relationship") {
                          setSelectedRelationship(value?.relationship || "");
                        }
                      },
                    );
                    watchSubscriptionRef.current = subscription.unsubscribe;
                  }
                }}
              />
              <DependentsFormActions>
                <AddDependentActionButton
                  variant="outlined"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  Cancel
                </AddDependentActionButton>
                <AddDependentActionButton
                  variant="contained"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : editingDependent ? "Update" : "Add"}
                </AddDependentActionButton>
              </DependentsFormActions>
            </DependentsFormWrapper>
          )}

          {dependents.length > 0 ? (
            <>
              <DependantsTableHeader>
                <DependantsTableHeaderCell>Name</DependantsTableHeaderCell>
                <DependantsTableHeaderCell>Relationship</DependantsTableHeaderCell>
                <DependantsTableHeaderCell>Gender</DependantsTableHeaderCell>
                <DependantsTableHeaderCell>Date Of Birth</DependantsTableHeaderCell>
                <DependantsTableHeaderCell>Actions</DependantsTableHeaderCell>
              </DependantsTableHeader>
              {dependents.map((dep) => {
                const isDobVisible = dobVisibility[dep.key] ?? false;
                const hasDob = dep.dobLabel && dep.dobLabel !== "Not provided";
                return (
                  <DependantsTableRow key={dep.key}>
                    <DependantsTableCell>{dep.name}</DependantsTableCell>
                    <DependantsTableCell>{dep.relationship}</DependantsTableCell>
                    <DependantsTableCell>{dep.gender}</DependantsTableCell>
                    <DependantsTableCell>
                      {hasDob ? (
                        <Box
                          sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}
                        >
                          <span>{isDobVisible ? dep.dobLabel : "**********"}</span>
                          <IconButton
                            size="small"
                            onClick={() =>
                              setDobVisibility((prev) => ({
                                ...prev,
                                [dep.key]: !(prev[dep.key] ?? false),
                              }))
                            }
                            aria-label={
                              isDobVisible ? "Hide date of birth" : "Show date of birth"
                            }
                          >
                            {isDobVisible ? (
                              <VisibilityOffOutlinedIcon fontSize="small" />
                            ) : (
                              <VisibilityOutlinedIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Box>
                      ) : (
                        "--"
                      )}
                    </DependantsTableCell>
                    <DependantsTableCell>
                      {dep.isSelf ? null : (
                        <DependantsActionsGroup>
                          <DependantsActionButton
                            onClick={() => handleEdit(dep)}
                            disabled={busy}
                            aria-label={`Edit ${dep.name}`}
                          >
                            <EditOutlinedIcon fontSize="small" sx={{ color: "#2563EB" }} />
                          </DependantsActionButton>
                          <DependantsActionButton
                            onClick={() => setDeleteTarget(dep)}
                            disabled={busy}
                            aria-label={`Delete ${dep.name}`}
                          >
                            <DeleteOutlineIcon fontSize="small" sx={{ color: "#DC2626" }} />
                          </DependantsActionButton>
                        </DependantsActionsGroup>
                      )}
                    </DependantsTableCell>
                  </DependantsTableRow>
                );
              })}
            </>
          ) : (
            <DependentsEmptyText>No dependents added yet.</DependentsEmptyText>
          )}
        </DependantsSection>
      </DependentsSectionContainer>

      <CustomModal
        open={Boolean(deleteTarget)}
        handleClose={closeDeleteModal}
        heading="Delete Dependent"
        modalBoxStyles={{ width: "480px", maxWidth: "92vw" }}
        buttons={[
          {
            label: "Cancel",
            onClick: closeDeleteModal,
            variant: "secondary",
            disabled: isDeleting,
          },
          {
            label: isDeleting ? "Deleting..." : "Delete",
            onClick: handleConfirmDelete,
            variant: "primary",
            disabled: isDeleting,
          },
        ]}
      >
        <Typography sx={{ fontSize: 14, lineHeight: 1.6 }}>
          This will remove{" "}
          <Box component="span" sx={{ fontWeight: 700 }}>
            {(deleteTarget?.name || "the selected dependent").trim()}
            {deleteTarget?.relationship ? ` (${deleteTarget.relationship})` : ""}
          </Box>{" "}
          from your dependents. You can add them again anytime before enrollment
          opens.
        </Typography>
      </CustomModal>
    </>
  );
};

export default DependentsSection;
