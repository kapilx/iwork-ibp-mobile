import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  MobileStepper,
  Paper,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from "@mui/material";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { styled } from "@mui/material/styles";
import {
  apiRequest,
  endPoints,
  setToastMessage,
  useApiMutation,
} from "@ui/ui-lib";
import { useDispatch } from "react-redux";
import { DEACTIVATE_EMPLOYEE } from "../../../constants";
import {
  ActivityRecord,
  AssignmentMap,
  DependentRecord,
  EmployeeListValue,
  ReporteeRecord,
} from "./types";
import { ActionsRow, PageContainer } from "./styles";

// ── Server-side employee search hook ─────────────────────────────────────────
/**
 * Searches employees server-side as the user types (300 ms debounce).
 * Returns the full list for empty input (up to 50) so the dropdown is
 * immediately useful without needing to type first.
 */
function useEmployeeSearch(excludeEmployeeId?: number) {
  const [options, setOptions] = useState<EmployeeListValue[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(
    (query: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        setLoading(true);
        try {
          const params = new URLSearchParams({ page: "1", limit: "50" });
          if (query.trim()) params.set("search", query.trim());
          const url =
            `${endPoints.employeeListOfValues}?${params.toString()}`;
          const res: any = await apiRequest(url, { method: "GET" });
          const payload = res?.data ?? res;
          const raw: EmployeeListValue[] = Array.isArray(payload)
            ? payload
            : payload?.data ?? [];
          // Exclude the employee being deactivated
          setOptions(
            excludeEmployeeId
              ? raw.filter((employeeOption) => employeeOption.employeeId !== excludeEmployeeId)
              : raw
          );
        } catch {
          // silently ignore — keep previous list
        } finally {
          setLoading(false);
        }
      }, 300);
    },
    [excludeEmployeeId]
  );

  // Load initial list on mount
  useEffect(() => {
    search("");
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { options, loading, inputValue, setInputValue, search };
}

// ── Styled ────────────────────────────────────────────────────────────────────
const StepCard = styled(Paper)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  overflow: "hidden",
}));

const StepCardHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 3),
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
}));

const RecordsList = styled(Box)(() => ({
  maxHeight: 380,
  overflowY: "auto",
}));

const RecordRow = styled(Box, {
  shouldForwardProp: (p) => p !== "selected" && p !== "assigned",
})<{ selected?: boolean; assigned?: boolean }>(({ theme, selected, assigned }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  padding: theme.spacing(1, 2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  transition: "background 0.15s",
  backgroundColor: selected
    ? theme.palette.action.selected
    : assigned
    ? theme.palette.action.hover
    : "transparent",
  "&:last-child": { borderBottom: "none" },
  "&:hover": { backgroundColor: theme.palette.action.hover },
}));

const BulkAssignBar = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5, 3),
  borderTop: `2px solid ${theme.palette.primary.main}`,
  backgroundColor: theme.palette.background.paper,
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  flexWrap: "wrap",
}));

// ── Types ─────────────────────────────────────────────────────────────────────
type SectionApiType =
  | "companies-lead-crm"
  | "companies-account-manager"
  | "opportunities"
  | "policies"
  | "endorsements"
  | "activities"
  | "reportees";

interface StepDef {
  apiType: SectionApiType;
  responseKey: string;
  assignKey: string;
  label: string;
  previewCount: number;
}

interface SectionData {
  items: (DependentRecord | ActivityRecord | ReporteeRecord)[];
  loading: boolean;
  error: boolean;
  fetched: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────
const EmployeeDeactivate = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { employee, preview } = (location.state ?? {}) as {
    employee?: any;
    preview?: any;
  };
  const employeeId: number | undefined = employee?.employeeId;

  // ── Build wizard steps from preview counts ────────────────────────────────
  const steps = useMemo<StepDef[]>(() => {
    if (!preview) return [];
    const all: StepDef[] = [
      { apiType: "companies-lead-crm", responseKey: "companiesLeadCrm", assignKey: "companiesLeadCrm", label: DEACTIVATE_EMPLOYEE.COMPANIES_LEAD_CRM, previewCount: preview.companiesLeadCrm ?? 0 },
      { apiType: "companies-account-manager", responseKey: "companiesAccountManager", assignKey: "companiesAccountManager", label: DEACTIVATE_EMPLOYEE.COMPANIES_ACCOUNT_MANAGER, previewCount: preview.companiesAccountManager ?? 0 },
      { apiType: "opportunities", responseKey: "opportunities", assignKey: "opportunities", label: DEACTIVATE_EMPLOYEE.OPPORTUNITIES, previewCount: preview.opportunities ?? 0 },
      { apiType: "policies", responseKey: "policies", assignKey: "policies", label: DEACTIVATE_EMPLOYEE.POLICIES, previewCount: preview.policies ?? 0 },
      { apiType: "endorsements", responseKey: "endorsements", assignKey: "endorsements", label: DEACTIVATE_EMPLOYEE.ENDORSEMENTS, previewCount: preview.endorsements ?? 0 },
      { apiType: "activities", responseKey: "activities", assignKey: "activities", label: DEACTIVATE_EMPLOYEE.ACTIVITIES, previewCount: preview.activities ?? 0 },
      { apiType: "reportees", responseKey: "reportees", assignKey: "reportees", label: DEACTIVATE_EMPLOYEE.REPORTEES, previewCount: preview.reportees ?? 0 },
    ];
    return all.filter((stepDef) => stepDef.previewCount > 0);
  }, [preview]);

  const totalSteps = steps.length;

  // ── Wizard state ──────────────────────────────────────────────────────────
  const [activeStep, setActiveStep] = useState(0);
  const currentStep = steps[activeStep];

  // ── Section data cache ────────────────────────────────────────────────────
  const [sectionCache, setSectionCache] = useState<Record<string, SectionData>>({});
  const getSection = (key: string): SectionData =>
    sectionCache[key] ?? { items: [], loading: false, error: false, fetched: false };

  // ── Employee search (server-side, debounced) ──────────────────────────────
  const {
    options: employeeOptions,
    loading: isEmployeesLoading,
    inputValue: empInputValue,
    setInputValue: setEmpInputValue,
    search: searchEmployees,
  } = useEmployeeSearch(employeeId);

  // Accumulate every employee ever returned so assigned chips stay visible
  // even when they're not in the current search result set.
  const [resolvedMap, setResolvedMap] = useState<Map<number, EmployeeListValue>>(new Map());
  useEffect(() => {
    if (employeeOptions.length === 0) return;
    setResolvedMap((prev) => {
      const next = new Map(prev);
      employeeOptions.forEach((employeeOption) => next.set(employeeOption.userId, employeeOption));
      return next;
    });
  }, [employeeOptions]);

  const resolveEmployee = (userId: number | undefined): EmployeeListValue | undefined =>
    userId ? resolvedMap.get(userId) : undefined;

  // ── Assignments: recordKey → userId ──────────────────────────────────────
  const [assignments, setAssignments] = useState<AssignmentMap>({});

  // ── Reportees: single manager ─────────────────────────────────────────────
  const [reporteesManager, setReporteesManager] = useState<EmployeeListValue | null>(null);

  // ── Bulk-select state (per step, reset on step change) ───────────────────
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkTarget, setBulkTarget] = useState<EmployeeListValue | null>(null);
  const [bulkInputValue, setBulkInputValue] = useState("");

  // ── Fetch current step data (lazy, cached) ────────────────────────────────
  const fetchCurrentStep = useCallback(() => {
    if (!employeeId || !currentStep) return;
    const key = currentStep.assignKey;
    if (sectionCache[key]?.fetched) return;

    setSectionCache((prev) => ({
      ...prev,
      [key]: { items: [], loading: true, error: false, fetched: false },
    }));

    apiRequest(
      endPoints.employeeDeactivationRecords(employeeId, currentStep.apiType),
      { method: "GET" }
    )
      .then((res: any) => {
        const payload = res?.data ?? res;
        const items = payload?.[currentStep.responseKey] ?? [];
        setSectionCache((prev) => ({
          ...prev,
          [key]: { items, loading: false, error: false, fetched: true },
        }));
      })
      .catch(() => {
        setSectionCache((prev) => ({
          ...prev,
          [key]: { items: [], loading: false, error: true, fetched: false },
        }));
      });
  }, [employeeId, currentStep, sectionCache]);

  useEffect(() => {
    fetchCurrentStep();
    // Reset bulk selection when step changes
    setSelectedIds(new Set());
    setBulkTarget(null);
    setBulkInputValue("");
    searchEmployees(""); // refresh list for the new step
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep]);

  // ── Step completion ───────────────────────────────────────────────────────
  const isCurrentStepComplete = useMemo(() => {
    if (!currentStep) return true;
    if (currentStep.apiType === "reportees") return reporteesManager != null;
    const { items } = getSection(currentStep.assignKey);
    return (items as DependentRecord[]).every(
      (item) => assignments[`${currentStep.assignKey}-${item.id}`] != null
    );
  }, [currentStep, sectionCache, assignments, reporteesManager]);

  // ── Bulk assign ───────────────────────────────────────────────────────────
  const applyBulkAssign = () => {
    if (!bulkTarget || selectedIds.size === 0 || !currentStep) return;
    const updates: AssignmentMap = {};
    selectedIds.forEach((id) => {
      updates[`${currentStep.assignKey}-${id}`] = bulkTarget.userId;
    });
    setAssignments((prev) => ({ ...prev, ...updates }));
    setSelectedIds(new Set());
    setBulkTarget(null);
  };

  // ── Row selection helpers ─────────────────────────────────────────────────
  const toggleId = (id: number) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = (items: DependentRecord[]) => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((item) => item.id)));
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const { mutate: manualDeactivateMutate, status: manualDeactivateStatus } =
    useApiMutation({
      config: {
        onSuccess: () => {
          dispatch(setToastMessage(DEACTIVATE_EMPLOYEE.DEACTIVATE_SUCCESS));
          navigate("/employee");
        },
        onError: (error: any) => {
          const msg = Array.isArray(error?.message)
            ? error.message[0]
            : error?.message ?? DEACTIVATE_EMPLOYEE.DEACTIVATE_ERROR;
          dispatch(setToastMessage(msg));
        },
      },
    });

  const handleDeactivate = () => {
    if (!employeeId) return;
    const getItems = (key: string) =>
      (sectionCache[key]?.items as DependentRecord[]) ?? [];

    const payload = {
      reporteesNewManagerUserId: reporteesManager?.userId,
      companiesLeadCrmAssignments: getItems("companiesLeadCrm").map((companyRecord) => ({
        companyId: companyRecord.id,
        newOwnerId: assignments[`companiesLeadCrm-${companyRecord.id}`],
      })),
      companiesAccountManagerAssignments: getItems("companiesAccountManager").map((companyRecord) => ({
        companyId: companyRecord.id,
        newOwnerId: assignments[`companiesAccountManager-${companyRecord.id}`],
      })),
      opportunityAssignments: getItems("opportunities").map((opportunityRecord) => ({
        opportunityId: opportunityRecord.id,
        newOwnerId: assignments[`opportunities-${opportunityRecord.id}`],
      })),
      policyAssignments: getItems("policies").map((policyRecord) => ({
        policyId: policyRecord.id,
        newOwnerId: assignments[`policies-${policyRecord.id}`],
      })),
      endorsementAssignments: getItems("endorsements").map((endorsementRecord) => ({
        endorsementId: endorsementRecord.id,
        newCreatedById: assignments[`endorsements-${endorsementRecord.id}`],
      })),
      activityAssignments: (
        (sectionCache["activities"]?.items as ActivityRecord[]) ?? []
      ).map((activityRecord) => ({
        activityId: activityRecord.id,
        newOwnerId: assignments[`activities-${activityRecord.id}`],
      })),
    };

    manualDeactivateMutate({
      endpoint: endPoints.employeeManualDeactivate(employeeId),
      method: "POST",
      data: payload,
    });
  };

  const isSubmitting = manualDeactivateStatus === "pending";
  const isLastStep = activeStep === totalSteps - 1;

  // ── Render: generic section (bulk-select rows) ────────────────────────────
  const renderBulkSection = (
    items: DependentRecord[],
    assignKey: string,
    renderSubtitle?: (item: DependentRecord) => React.ReactNode
  ) => {
    const allSelected = items.length > 0 && selectedIds.size === items.length;
    const someSelected = selectedIds.size > 0 && !allSelected;
    const assignedCount = items.filter(
      (record) => assignments[`${assignKey}-${record.id}`] != null
    ).length;

    return (
      <Box>
        {/* Select-all header row */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            px: 2,
            py: 1,
            bgcolor: "action.hover",
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Checkbox
            size="small"
            checked={allSelected}
            indeterminate={someSelected}
            onChange={() => toggleAll(items)}
          />
          <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>
            Record ({assignedCount}/{items.length} assigned)
          </Typography>
          <Typography variant="body2" fontWeight={600} sx={{ width: 200, textAlign: "right", pr: 1 }}>
            Assigned to
          </Typography>
        </Box>

        {/* Records */}
        <RecordsList>
          {items.map((item) => {
            const key = `${assignKey}-${item.id}`;
            const assignedUserId = assignments[key];
            const assignedEmployee = resolveEmployee(assignedUserId);

            return (
              <RecordRow
                key={item.id}
                selected={selectedIds.has(item.id)}
                assigned={!selectedIds.has(item.id) && assignedUserId != null}
                onClick={() => toggleId(item.id)}
                sx={{ cursor: "pointer" }}
              >
                <Checkbox
                  size="small"
                  checked={selectedIds.has(item.id)}
                  onChange={() => toggleId(item.id)}
                  onClick={(e) => e.stopPropagation()}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" noWrap>
                    {item.name}
                  </Typography>
                  {renderSubtitle?.(item)}
                </Box>
                <Box sx={{ width: 200, textAlign: "right" }}>
                  {assignedEmployee ? (
                    <Chip
                      size="small"
                      icon={<CheckCircleOutlineIcon />}
                      label={`${assignedEmployee.firstName ?? ""}${assignedEmployee.lastName ? " " + assignedEmployee.lastName : ""}`}
                      color="success"
                      variant="outlined"
                      sx={{ maxWidth: 190 }}
                    />
                  ) : (
                    <Typography variant="caption" color="error.main">
                      Unassigned
                    </Typography>
                  )}
                </Box>
              </RecordRow>
            );
          })}
        </RecordsList>

        {/* Bulk assign bar — shown when rows are selected */}
        {selectedIds.size > 0 && (
          <BulkAssignBar>
            <Typography variant="body2" fontWeight={600} sx={{ whiteSpace: "nowrap" }}>
              {selectedIds.size} selected — assign to:
            </Typography>
            <Autocomplete
              size="small"
              sx={{ width: 300, flex: 1 }}
              options={employeeOptions}
              loading={isEmployeesLoading}
              filterOptions={(options) => options}  // server-side filtering
              getOptionLabel={(employeeOption) =>
                `${employeeOption.firstName ?? ""}${employeeOption.lastName ? " " + employeeOption.lastName : ""}`
              }
              isOptionEqualToValue={(option, value) => option.userId === value.userId}
              value={bulkTarget}
              inputValue={bulkInputValue}
              onInputChange={(_, val) => {
                setBulkInputValue(val);
                searchEmployees(val);
              }}
              onChange={(_, val) => setBulkTarget(val)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Type to search employee…"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {isEmployeesLoading && <CircularProgress size={16} />}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
            <Button
              variant="contained"
              size="small"
              disabled={!bulkTarget}
              onClick={applyBulkAssign}
              sx={{ whiteSpace: "nowrap" }}
            >
              Assign
            </Button>
            <Button
              variant="text"
              size="small"
              color="inherit"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear
            </Button>
          </BulkAssignBar>
        )}
      </Box>
    );
  };

  // ── Render: reportees step ────────────────────────────────────────────────
  const renderReporteesStep = (items: ReporteeRecord[]) => (
    <Box>
      <Box sx={{ px: 3, pt: 2, pb: 1.5 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          All <strong>{items.length}</strong> reportee
          {items.length !== 1 ? "s" : ""} will be moved to the new manager.
        </Typography>
        <Autocomplete
          size="small"
          sx={{ width: 340 }}
          options={employeeOptions}
          loading={isEmployeesLoading}
          filterOptions={(options) => options}
          getOptionLabel={(employeeOption) =>
            `${employeeOption.firstName ?? ""}${employeeOption.lastName ? " " + employeeOption.lastName : ""}`
          }
          isOptionEqualToValue={(option, value) => option.userId === value.userId}
          value={reporteesManager}
          inputValue={empInputValue}
          onInputChange={(_, val) => {
            setEmpInputValue(val);
            searchEmployees(val);
          }}
          onChange={(_, val) => setReporteesManager(val)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="New Reporting Manager"
              placeholder="Type to search employee…"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {isEmployeesLoading && <CircularProgress size={16} />}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
      </Box>
      <RecordsList sx={{ borderTop: 1, borderColor: "divider" }}>
        {items.map((reporteeRecord) => (
          <Box
            key={reporteeRecord.userId}
            sx={{
              px: 3,
              py: 1,
              borderBottom: 1,
              borderColor: "divider",
              "&:last-child": { borderBottom: 0 },
            }}
          >
            <Typography variant="body2">
              {reporteeRecord.firstName} {reporteeRecord.lastName}
            </Typography>
          </Box>
        ))}
      </RecordsList>
    </Box>
  );

  // ── Step content dispatcher ───────────────────────────────────────────────
  const renderStepContent = () => {
    if (!currentStep) return null;
    const section = getSection(currentStep.assignKey);

    if (section.loading) {
      return (
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 2, p: 4 }}
        >
          <CircularProgress size={22} />
          <Typography color="text.secondary">Loading records…</Typography>
        </Box>
      );
    }

    if (section.error) {
      return (
        <Box sx={{ p: 3 }}>
          <Alert
            severity="error"
            action={
              <Button size="small" onClick={fetchCurrentStep}>
                Retry
              </Button>
            }
          >
            Failed to load records.
          </Alert>
        </Box>
      );
    }

    if (currentStep.apiType === "reportees") {
      return renderReporteesStep(section.items as ReporteeRecord[]);
    }

    if (currentStep.apiType === "activities") {
      const items = section.items as ActivityRecord[];
      if (!items.length) {
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="body2" color="text.secondary">No records.</Typography>
          </Box>
        );
      }
      return renderBulkSection(
        items as DependentRecord[],
        "activities",
        (item) => {
          const act = item as unknown as ActivityRecord;
          return act.opportunityLabel ? (
            <Typography variant="caption" color="text.secondary">
              {act.opportunityLabel}
            </Typography>
          ) : null;
        }
      );
    }

    const items = section.items as DependentRecord[];
    if (!items.length) {
      return (
        <Box sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary">No records.</Typography>
        </Box>
      );
    }
    return renderBulkSection(items, currentStep.assignKey);
  };

  // ── Guard ─────────────────────────────────────────────────────────────────
  if (!employeeId) {
    return (
      <PageContainer>
        <Alert severity="error">
          Invalid employee. Please navigate from the employee list.
        </Alert>
      </PageContainer>
    );
  }

  // ── No dependencies ───────────────────────────────────────────────────────
  if (totalSteps === 0) {
    return (
      <PageContainer>
        <Typography variant="h5" sx={{ mb: 0.5 }}>
          {DEACTIVATE_EMPLOYEE.MANUAL_DEACTIVATE_TITLE}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {employee?.firstName} {employee?.lastName}
        </Typography>
        <Alert severity="success" sx={{ mb: 3 }}>
          No dependent records found. You can safely deactivate this employee.
        </Alert>
        <ActionsRow>
          <Button variant="outlined" onClick={() => navigate("/employee")} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeactivate}
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={16} /> : undefined}
          >
            {DEACTIVATE_EMPLOYEE.CONFIRM_DEACTIVATE}
          </Button>
        </ActionsRow>
      </PageContainer>
    );
  }

  // ── Main wizard ───────────────────────────────────────────────────────────
  return (
    <PageContainer>
      <Typography variant="h5" sx={{ mb: 0.5 }}>
        {DEACTIVATE_EMPLOYEE.MANUAL_DEACTIVATE_TITLE}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {employee?.firstName} {employee?.lastName}
      </Typography>

      {/* Step landmark overview */}
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
        {steps.map((s, idx) => (
          <Step key={s.assignKey} completed={idx < activeStep}>
            <StepLabel>{s.label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Step card */}
      <StepCard elevation={2}>
        {/* Card header */}
        <StepCardHeader>
          <Box>
            <Typography variant="h6">{currentStep?.label}</Typography>
            <Typography variant="caption" color="text.secondary">
              Step {activeStep + 1} of {totalSteps}
              {currentStep?.apiType !== "reportees" &&
                " — select records, then bulk-assign to an employee"}
            </Typography>
          </Box>
          {/* Completion badge */}
          {isCurrentStepComplete && (
            <Chip
              icon={<CheckCircleOutlineIcon />}
              label="All assigned"
              color="success"
              size="small"
            />
          )}
        </StepCardHeader>

        {/* Step body */}
        {renderStepContent()}
      </StepCard>

      {/* Navigation */}
      <MobileStepper
        variant="dots"
        steps={totalSteps}
        position="static"
        activeStep={activeStep}
        sx={{ mt: 2, borderRadius: 1 }}
        backButton={
          <Button
            size="small"
            onClick={() => setActiveStep((s) => s - 1)}
            disabled={activeStep === 0}
            startIcon={<KeyboardArrowLeft />}
          >
            Back
          </Button>
        }
        nextButton={
          isLastStep ? (
            <Button
              size="small"
              variant="contained"
              color="error"
              onClick={handleDeactivate}
              disabled={!isCurrentStepComplete || isSubmitting}
              endIcon={isSubmitting ? <CircularProgress size={14} /> : undefined}
            >
              {DEACTIVATE_EMPLOYEE.CONFIRM_DEACTIVATE}
            </Button>
          ) : (
            <Button
              size="small"
              onClick={() => setActiveStep((s) => s + 1)}
              disabled={!isCurrentStepComplete}
              endIcon={<KeyboardArrowRight />}
            >
              Next
            </Button>
          )
        }
      />

      <Box sx={{ mt: 1 }}>
        <Button
          size="small"
          variant="text"
          color="inherit"
          onClick={() => navigate("/employee")}
          disabled={isSubmitting}
        >
          ← Back to employee list
        </Button>
      </Box>
    </PageContainer>
  );
};

export default EmployeeDeactivate;
