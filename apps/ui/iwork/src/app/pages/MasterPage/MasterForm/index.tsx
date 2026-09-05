import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  Button,
  CardBackground,
  StyledLabelTypography,
  StyledPickerLabelContainer,
  StyledPickerFormController,
  AutocompleteStyles,
  endPoints,
  useApiQuery,
  apiRequest,
  isCopyPasteAllowedForOrg,
  setToastMessage,
} from "@ui/ui-lib";
import { Box, CircularProgress, TextField } from "@mui/material";
import { MASTER_POLICY_TYPE_ENTITY, MASTER_LOOKUP_VALUE_KEY_PATTERN } from "../../../constants/index";
import { ValidationErrors } from "../../../constants/errors";

type FormFieldConfig = {
  dataType: string;
  fieldType: string; // input | dropdown | datepicker
  optionType: string | null; // Raw | Query | API
  option: any; // array or url/query
  validation: { max?: number; min?: number };
  readOnly?: boolean;
  readOnlyOnEdit?: boolean;
  hidden?: boolean;
  uppercase?: boolean;
};

type FormConfig = Record<string, FormFieldConfig>;

// Deduplicate IIRM options by lookUpValueKey — multiple DB rows exist per org for the same policy type
const dedupeIirmRecords = (records: any[]): { value: number; label: string }[] => {
  const seen = new Set<string>();
  const result: { value: number; label: string }[] = [];
  for (const r of records) {
    const key = r.lookUpValueKey || r.lookUpKey || String(r.id);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ value: r.id, label: r.lookUpValue || r.lookUpKey || String(r.id) });
  }
  return result;
};

const MasterForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { entity, id } = useParams();
  const mode: "create" | "edit" | "view" = id
    ? window.location.pathname.endsWith("/edit") ? "edit" : "view"
    : "create";

  const { data: metadata, isLoading: loadingMeta } = useApiQuery({
    url: entity ? endPoints.masterEntityMetadata(entity) : "",
    queryKey: ["masterEntityMetadata", entity],
    enabled: !!entity,
  });

  const formConfig: FormConfig = metadata?.data?.formConfig || {};
  const fieldNames = useMemo(() => Object.keys(formConfig), [formConfig]);
  // Maintain a map between labels and field keys (reverse lookup based on label -> key inference)
  const labelToKey = useMemo(() => {
    // Attempt to infer original key from label by matching lowercase and removing spaces
    const map: Record<string, string> = {};
    // we don't have original keys; infer by matching when unique ignoring case/spaces
    Object.entries(formConfig).forEach(([label, cfg]) => {
      // naive: generate candidate key by camelCase of label
      const candidate = label
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\s+([a-zA-Z])/g, (_, c) => c.toUpperCase())
        .replace(/^./, (c) => c.toLowerCase());
      map[label] = candidate;
    });
    return map;
  }, [formConfig]);

  const [values, setValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [dropdownOptions, setDropdownOptions] = useState<Record<string, any[]>>({});

  // IIRM and IRDAI policy type selectors — only for POLICY_TYPE entity
  const [iirmOptions, setIirmOptions] = useState<{ value: number; label: string }[]>([]);
  const [selectedIirmId, setSelectedIirmId] = useState<number | null>(null);
  const [irdaiOptions, setIrdaiOptions] = useState<{ value: number; label: string }[]>([]);
  const [selectedIirdaiId, setSelectedIirdaiId] = useState<number | null>(null);
  // Associate policy type — shown in edit when status changes to Inactive
  const [associateOptions, setAssociateOptions] = useState<{ value: number; label: string }[]>([]);
  const [selectedAssocId, setSelectedAssocId] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      if (mode === "edit" && entity && id) {
        setLoading(true);
        try {
          const res = await apiRequest(endPoints.masterRecordById(entity, id), { method: "GET" });
          const data = res?.data?.data || res?.data || {};
          // Map response fields directly
          setValues(data);

          // Pre-fill linked IIRM/IRDAI/associate from segregation data
          if (entity === MASTER_POLICY_TYPE_ENTITY) {
            if (data.iirmPolicyTypeLid != null) setSelectedIirmId(Number(data.iirmPolicyTypeLid));
            if (data.irdaiPolicyTypeLid != null) setSelectedIirdaiId(Number(data.irdaiPolicyTypeLid));
            if (data.assocActivePolicyTypeLid != null) setSelectedAssocId(Number(data.assocActivePolicyTypeLid));
          }
        } finally {
          setLoading(false);
        }
      } else {
        // Pre-fill Status = Active (1) for POLICY_TYPE create
        setValues(entity === MASTER_POLICY_TYPE_ENTITY ? { status: 1 } : {});
        setSelectedIirmId(null);
        setSelectedIirdaiId(null);
      }
    };
    load();
  }, [mode, entity, id]);

  // Load IIRM, IRDAI, and associate (active POLICY_TYPE) options
  useEffect(() => {
    if (entity !== MASTER_POLICY_TYPE_ENTITY) return;
    const loadOptions = async () => {
      try {
        const [iirmRes, irdaiRes, assocRes] = await Promise.all([
          apiRequest(`${endPoints.masterList("IIRM_POLICY_TYPES")}?page=1&limit=1000`, { method: "GET" }),
          apiRequest(`${endPoints.masterList("IRDAI_POLICY_TYPES")}?page=1&limit=1000`, { method: "GET" }),
          apiRequest(`${endPoints.masterList(MASTER_POLICY_TYPE_ENTITY)}?page=1&limit=1000`, { method: "GET" }),
        ]);
        setIirmOptions(dedupeIirmRecords(iirmRes?.data?.data || iirmRes?.data || []));
        setIrdaiOptions(dedupeIirmRecords(irdaiRes?.data?.data || irdaiRes?.data || []));
        const assocRecords: any[] = assocRes?.data?.data || assocRes?.data || [];
        setAssociateOptions(
          assocRecords.map((r: any) => ({ value: r.id, label: r.lookUpValue || r.lookUpKey || String(r.id) }))
        );
      } catch {
        setIirmOptions([]);
        setIrdaiOptions([]);
        setAssociateOptions([]);
      }
    };
    loadOptions();
  }, [entity]);

  // Load dropdown options for fields with optionType API and array for RAW
  useEffect(() => {
    const loadOptions = async () => {
      if (!entity) return;
      const entries = Object.entries(formConfig).filter(
        ([, cfg]) => cfg.fieldType === "dropdown"
      );
      const newOpts: Record<string, any[]> = {};
      for (const [label, cfg] of entries) {
        const key = (cfg as any).fieldName || labelToKey[label];
        if (cfg.optionType === "Raw" && Array.isArray(cfg.option)) {
          newOpts[key] = cfg.option;
        } else if (cfg.optionType === "API" && typeof cfg.option === "string") {
          try {
            const url = cfg.option.startsWith("/")
              ? `${endPoints.masterList("").replace(/\/master\/$/, "")}${cfg.option}`
              : cfg.option;
            const res = await apiRequest(url, { method: "GET" });
            const data = res?.data?.data || res?.data || [];
            newOpts[key] = (data || []).map((item: any) => ({
              value: item.id ?? item.key ?? item.value,
              label: item.name ?? item.label ?? String(item.value ?? item.id ?? ""),
            }));
          } catch {
            // option load errors are non-fatal
          }
        }
      }
      setDropdownOptions(newOpts);
    };
    loadOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formConfig, entity]);

  const handleChange = (key: string, val: any) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async () => {
    if (!entity) return;
    setLoading(true);
    try {
      // prepare payload limited to known form fields (avoid id/metadata)
      const payload: Record<string, any> = {};
      Object.entries(formConfig).forEach(([label, cfg]) => {
        const key = (cfg as any).fieldName || labelToKey[label];
        if (key) payload[key] = values[key];
      });

      if (entity === MASTER_POLICY_TYPE_ENTITY) {
        // Validate lookUpValueKey: uppercase letters, digits and _ only, no spaces
        if (mode === "create") {
          const valueKey: string = (payload.lookUpValueKey || "").trim();
          const lookUpValue: string = (payload.lookUpValue || "").trim();
          const description: string = (payload.description || "").trim();
          const hasOrg = payload.organisationId != null && payload.organisationId !== "";

          // All fields must be filled
          if (!valueKey || !lookUpValue || !description || !hasOrg || !selectedIirdaiId || !selectedIirmId) {
            dispatch(setToastMessage(ValidationErrors.MASTER_FILL_ALL_DETAILS));
            return;
          }

          // lookUpValueKey format check
          if (!MASTER_LOOKUP_VALUE_KEY_PATTERN.test(valueKey)) {
            dispatch(setToastMessage(ValidationErrors.MASTER_LOOKUP_VALUE_KEY_FORMAT));
            return;
          }
        }

        // IRDAI and IIRM are required in both create and edit
        if (!selectedIirdaiId || !selectedIirmId) {
          dispatch(setToastMessage(ValidationErrors.MASTER_FILL_ALL_DETAILS));
          return;
        }

        // Associate Policy Type is required when marking a record as Inactive
        if (mode === "edit" && Number(values.status) === 0 && !selectedAssocId) {
          dispatch(setToastMessage(ValidationErrors.MASTER_FILL_ALL_DETAILS));
          return;
        }

        // Include linked IRDAI and IIRM policy types + associate
        payload.irdaiPolicyTypeLid = selectedIirdaiId;
        payload.iirmPolicyTypeLid = selectedIirmId;
        payload.assocActivePolicyTypeLid = selectedAssocId ?? null;
        // Status always Active on create; lookUpName always POLICY_TYPE
        if (mode === "create") payload.status = 1;
        payload.lookUpName = MASTER_POLICY_TYPE_ENTITY;
        // Flag so backend routes to POLICY_TYPE-specific update logic
        if (mode === "edit") payload.isPolicyTypeUpdate = true;
      }

      try {
        if (mode === "create") {
          await apiRequest(endPoints.masterCreate(entity), { method: "POST", data: payload });
        } else if (id) {
          await apiRequest(endPoints.masterUpdate(entity, id), { method: "PUT", data: payload });
        }
        navigate("/master", { replace: false });
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          ValidationErrors.MASTER_SAVE_FAILED;
        dispatch(setToastMessage(msg));
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingMeta || loading) {
    return (
      <Box p={4} display="flex" justifyContent="center" alignItems="center" minHeight={300}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={4}>
      <CardBackground>
        <StyledPickerLabelContainer>
          <StyledLabelTypography variant="h6">
            {mode === "create" ? "Add New Record" : "Edit Record"}
            {entity ? ` - ${entity}` : ""}
          </StyledLabelTypography>
        </StyledPickerLabelContainer>
        <Box display="flex" flexWrap="wrap" gap={2} mt={2}>
          {fieldNames.map((label) => {
            const cfg = formConfig[label] as any;
            const key = cfg?.fieldName || labelToKey[label];

            if (!cfg || key === "id" || cfg.hidden) return null;

            const value = values[key] ?? "";
            // For POLICY_TYPE: status is disabled only in create mode (always Active)
            const isPolicyTypeStatusField = entity === MASTER_POLICY_TYPE_ENTITY && key === "status" && mode === "create";
            const isDisabled =
              mode === "view" ||
              cfg.readOnly === true ||
              isPolicyTypeStatusField ||
              (mode === "edit" && cfg.readOnlyOnEdit === true);

            return (
              <Box key={label} sx={{ minWidth: 300, marginBottom: 2 }}>
                <StyledPickerLabelContainer sx={{ minWidth: 300 }}>
                  <StyledLabelTypography variant="body1" sx={{ minWidth: 300, wordBreak: "break-word" }}>
                    {label}{" "}
                    {mode !== "view" && (
                      <span style={{ color: "#e53935", fontWeight: 400, fontSize: "0.85em" }}>*</span>
                    )}
                  </StyledLabelTypography>
                </StyledPickerLabelContainer>
                <StyledPickerFormController fullWidth>
                  {cfg.fieldType === "dropdown" ? (
                    <AutocompleteStyles
                      options={dropdownOptions[key] || []}
                      getOptionLabel={(option: any) => option.label || option.value || String(option)}
                      isOptionEqualToValue={(option: any, val: any) =>
                        option.value === val?.value || option === val
                      }
                      value={dropdownOptions[key]?.find((opt: any) => opt.value === value) || null}
                      onChange={(_, val: any) => handleChange(key, val ? val.value : "")}
                      disabled={isDisabled}
                      renderInput={(params) => (
                        <TextField {...params} placeholder={`Select ${label}`} size="small" />
                      )}
                      sx={{ width: 300 }}
                    />
                  ) : cfg.fieldType === "datepicker" ? (
                    // Date field (same as view page)
                    <TextField
                      type="date"
                      size="small"
                      value={value ? String(value).slice(0, 10) : ""}
                      onChange={(e) => handleChange(key, e.target.value)}
                      disabled={isDisabled}
                      sx={{ width: 300 }}
                    />
                  ) : cfg.dataType === "number" || cfg.dataType === "float" ? (
                    // Number field (same as view page)
                    <TextField
                      type="number"
                      placeholder={label}
                      size="small"
                      value={value}
                      onChange={(e) => handleChange(key, e.target.value)}
                      onPaste={(e) => { if (!isCopyPasteAllowedForOrg()) e.preventDefault(); }}
                      disabled={isDisabled}
                      inputProps={{ max: cfg.validation?.max, min: cfg.validation?.min }}
                      sx={{ width: 300 }}
                    />
                  ) : (
                    <TextField
                      placeholder={label}
                      size="small"
                      value={value}
                      onChange={(e) => {
                        const val = cfg.uppercase
                          ? e.target.value.toUpperCase()
                          : e.target.value;
                        handleChange(key, val);
                      }}
                      onPaste={(e) => { if (!isCopyPasteAllowedForOrg()) e.preventDefault(); }}
                      disabled={isDisabled}
                      inputProps={{ maxLength: cfg.validation?.max }}
                      sx={{ width: 300 }}
                    />
                  )}
                </StyledPickerFormController>
              </Box>
            );
          })}

          {/* Associate Policy Type — edit mode only, shown when status is Inactive */}
          {entity === MASTER_POLICY_TYPE_ENTITY && mode === "edit" && Number(values.status) === 0 && (
            <Box sx={{ minWidth: 300, marginBottom: 2 }}>
              <StyledPickerLabelContainer sx={{ minWidth: 300 }}>
                <StyledLabelTypography variant="body1" sx={{ minWidth: 300, wordBreak: "break-word" }}>
                  Associate Policy Type{" "}
                  <span style={{ fontWeight: 400, fontSize: "0.8em", color: "#e53935" }}>*</span>
                </StyledLabelTypography>
              </StyledPickerLabelContainer>
              <StyledPickerFormController fullWidth>
                <AutocompleteStyles
                  options={associateOptions.filter((o) => o.value !== Number(id))}
                  getOptionLabel={(option: any) => option.label || String(option.value)}
                  isOptionEqualToValue={(option: any, val: any) => option.value === val?.value}
                  value={associateOptions.find((o) => o.value === selectedAssocId) || null}
                  onChange={(_, val: any) => setSelectedAssocId(val ? val.value : null)}
                  renderInput={(params) => (
                    <TextField {...params} placeholder="Select Associate Policy Type" size="small" />
                  )}
                  sx={{ width: 300 }}
                />
              </StyledPickerFormController>
            </Box>
          )}

          {/* IRDAI and IIRM selectors — inside the same flex-wrap so they match all other fields */}
          {entity === MASTER_POLICY_TYPE_ENTITY && mode !== "view" && (
            <>
              {(["irdai", "iirm"] as const).map((type) => {
                const label = type === "irdai" ? "Select IRDAI Policy Type" : "Select IIRM Policy Type";
                const options = type === "irdai" ? irdaiOptions : iirmOptions;
                const selectedId = type === "irdai" ? selectedIirdaiId : selectedIirmId;
                const setSelected = type === "irdai" ? setSelectedIirdaiId : setSelectedIirmId;
                const setOptions = type === "irdai" ? setIrdaiOptions : setIirmOptions;
                const endpoint = type === "irdai" ? "IRDAI_POLICY_TYPES" : "IIRM_POLICY_TYPES";
                return (
                  <Box key={type} sx={{ minWidth: 300, marginBottom: 2 }}>
                    <StyledPickerLabelContainer sx={{ minWidth: 300 }}>
                      <StyledLabelTypography variant="body1" sx={{ minWidth: 300, wordBreak: "break-word" }}>
                        {label}{" "}
                        <span style={{ fontWeight: 400, fontSize: "0.8em", color: "#e53935" }}>*</span>
                      </StyledLabelTypography>
                    </StyledPickerLabelContainer>
                    <StyledPickerFormController fullWidth>
                      <AutocompleteStyles
                        options={options}
                        getOptionLabel={(option: any) => option.label || String(option.value)}
                        isOptionEqualToValue={(option: any, val: any) => option.value === val?.value}
                        value={options.find((o) => o.value === selectedId) || null}
                        onChange={(_, val: any) => setSelected(val ? val.value : null)}
                        onInputChange={async (_, inputVal, reason) => {
                          if (reason !== "input") return;
                          try {
                            const searchParam = inputVal
                              ? `&searchBy=lookUpValue&search=${encodeURIComponent(inputVal)}`
                              : "";
                            const res = await apiRequest(
                              `${endPoints.masterList(endpoint)}?page=1&limit=50${searchParam}`,
                              { method: "GET" }
                            );
                            setOptions(dedupeIirmRecords(res?.data?.data || res?.data || []));
                          } catch { /* non-fatal */ }
                        }}
                        renderInput={(params) => (
                          <TextField {...params} placeholder={label} size="small" />
                        )}
                        sx={{ width: 300 }}
                      />
                    </StyledPickerFormController>
                  </Box>
                );
              })}
            </>
          )}
        </Box>

        {mode !== "view" ? (
          <Box display="flex" gap={2} mt={3}>
            <Button label={mode === "create" ? "Create" : "Update"} variantType="primary" onClick={handleSubmit} />
            <Button label="Cancel" variantType="secondary" onClick={() => navigate(-1)} />
          </Box>
        ) : (
          <Box display="flex" gap={2} mt={3}>
            <Button label="Back" variantType="secondary" onClick={() => navigate(-1)} />
          </Box>
        )}
      </CardBackground>
    </Box>
  );
};

export default MasterForm;