import {
  Box,
  CircularProgress,
  IconButton,
  InputAdornment,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import { UseFormReturn } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import {
  endPoints,
  DynamicForm,
  StyledTextField,
  useApiMutation,
  useDebounce,
} from "@ui/ui-lib";
import { apiRequest } from "@ui/ui-lib/utils/apiRequest";
import { ClaimsIntimationFormValues } from "./types";
import {
  getHospitalManualFieldsConfig,
  getHospitalReadonlyFieldsConfig,
} from "./config";
import {
  HospitalSearchEmpty,
  HospitalSearchFieldWrapper,
  HospitalSearchLabel,
  RequiredAsterisk,
  HospitalManualActions,
  HospitalManualAddButton,
  HospitalManualAddPanel,
  HospitalManualAddSubtitle,
  HospitalManualAddTitle,
  HospitalMatchesLabel,
  HospitalSearchResultItem,
  HospitalSearchResultList,
  HospitalSearchResultMeta,
  HospitalSearchResultName,
  HospitalSearchResults,
  HospitalSearchSection,
  HospitalSelectionCard,
  HospitalSelectionCardGrid,
  HospitalSelectionLabel,
  HospitalSelectionValue,
} from "./styles";

type HospitalSearchSelectorProps = {
  selectedPolicyId?: string | number | null;
  hospitalPolicyIds?: (string | number)[];
  formMethods?: UseFormReturn<ClaimsIntimationFormValues>;
  claimType?: string;
};

type HospitalAddress = {
  addressLine1?: string | null;
  addressLine2?: string | null;
  landmark?: string | null;
  cityName?: string | null;
  stateName?: string | null;
  countryName?: string | null;
  pinCode?: string | null;
  phoneNumber?: string | null;
  alternatePhoneNumber?: string | null;
  email?: string | null;
};

type HospitalResult = {
  id?: number | string;
  name?: string;
  addresses?: HospitalAddress | HospitalAddress[] | null;
};

const normalizeAddress = (addresses: HospitalResult["addresses"]) => {
  if (Array.isArray(addresses)) return addresses[0] || {};
  return addresses || {};
};

const buildLocationText = (address: HospitalAddress) =>
  [
    address.addressLine1,
    address.addressLine2,
    address.landmark,
    address.cityName,
    address.stateName,
    address.pinCode,
    address.countryName,
  ]
    .filter(Boolean)
    .join(", ");

const MANUAL_HOSPITAL_ID = "manual-hospital";

const normalizeOptional = (value?: string) => {
  const trimmed = String(value || "").trim();
  return trimmed ? trimmed : undefined;
};

export const HospitalSearchSelector = ({
  selectedPolicyId,
  hospitalPolicyIds,
  formMethods,
  claimType,
}: HospitalSearchSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [isManualHospitalSaved, setIsManualHospitalSaved] = useState(false);
  const [selectedHospitalId, setSelectedHospitalId] = useState<
    string | number | null
  >(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const trimmedSearchTerm = debouncedSearchTerm.trim();
  const hasTypedSearch = trimmedSearchTerm.length > 0;

  // Check if this is a cashless claim
  const isCashlessClaim = claimType === "CASHLESS";

  useEffect(() => {
    setSearchTerm(formMethods?.getValues("hospitalName") || "");
    setIsOpen(false);
    setIsManualMode(false);
    setIsManualHospitalSaved(false);

    // Check if there's already a hospital selected in the form data
    const currentHospitalName = formMethods?.getValues("hospitalName");
    const currentHospitalLocation = formMethods?.getValues("hospitalLocation");

    if (currentHospitalName && currentHospitalLocation) {
      // If we have complete hospital data, mark it as selected
      setSelectedHospitalId("existing-hospital");
    } else {
      setSelectedHospitalId(null);
    }
  }, [formMethods, selectedPolicyId]);

  useEffect(() => {
    if (!isManualMode) return;
    void (async () => {
      try {
        const response = await apiRequest(endPoints.ibpCountriesList, { method: "GET" });
        const countries: { value: string | number; label: string }[] =
          (response?.data ?? []).map((item: { id: string | number; name: string }) => ({
            value: item.id,
            label: item.name,
          }));
        const india = countries.find((c) => c.label.toLowerCase() === "india");
        if (india) {
          formMethods?.setValue("country", india.value, { shouldValidate: false });
        }
      } catch {
        // fallback — leave country blank so user can select manually
      }
    })();
  }, [isManualMode]);

  // FF_SHOW_SYNCED_HOSPITALS: absent or "true" → show synced hospitals (default=true)
  const showSyncedHospitals = import.meta.env.VITE_FF_SHOW_SYNCED_HOSPITALS !== "false";

  const parsedSelectedPolicyId = Number(selectedPolicyId);
  const shouldFetch = showSyncedHospitals || Number.isFinite(parsedSelectedPolicyId);
  const resolvedPolicyIds =
    hospitalPolicyIds && hospitalPolicyIds.length > 0
      ? hospitalPolicyIds.map(Number).filter(Number.isFinite)
      : [parsedSelectedPolicyId];
  const searchPayload = shouldFetch
    ? {
        policyIds: resolvedPolicyIds,
        ...(isCashlessClaim ? { isNetworkHospital: true } : {}),
        ...(showSyncedHospitals ? { source: "API_SYNC" } : {}),
        ...(hasTypedSearch ? { search: trimmedSearchTerm } : {}),
        page: 1,
        limit: hasTypedSearch ? 25 : 10,
      }
    : undefined;

  const {
    mutate: fetchHospitals,
    data,
    isPending: isLoading,
  } = useApiMutation({});

  const isFetching = isLoading;

  const resolvedPolicyIdsKey = resolvedPolicyIds.join(",");
  useEffect(() => {
    if (!shouldFetch || !searchPayload) return;
    fetchHospitals({
      endpoint: endPoints.getHospitalNetworks(),
      method: "POST",
      data: searchPayload,
    });
  }, [shouldFetch, resolvedPolicyIdsKey, trimmedSearchTerm, isCashlessClaim]);

  const hospitals: HospitalResult[] = useMemo(
    () => data?.data?.data || [],
    [data]
  );

  const hasExactMatch = useMemo(
    () =>
      hospitals.some(
        (hospital) =>
          hospital?.name?.trim().toLowerCase() ===
          trimmedSearchTerm.trim().toLowerCase()
      ),
    [hospitals, trimmedSearchTerm]
  );

  // Show "Add Hospital Manually" only after API is done AND no hospitals returned
  const shouldShowManualAdd =
    hasTypedSearch && !selectedHospitalId && !isLoading && hospitals.length === 0;

  const hospitalName = formMethods?.watch("hospitalName") || "";
  const hospitalLocation = formMethods?.watch("hospitalLocation") || "";
  const hospitalNameErrorMessage =
    (formMethods?.formState?.errors?.hospitalName?.message as string) || "";

  const handleSelectHospital = (hospital: HospitalResult) => {
    const address = normalizeAddress(hospital.addresses);
    const locationText = buildLocationText(address);
    const phoneOrEmail =
      address.phoneNumber ||
      address.alternatePhoneNumber ||
      address.email ||
      "";

    setSearchTerm(hospital.name || "");
    setSelectedHospitalId(hospital.id ?? null);
    setIsManualMode(false);
    setIsManualHospitalSaved(false);
    setIsOpen(false);
    formMethods?.clearErrors(["hospitalName", "hospitalLocation"]);

    formMethods?.setValue("hospitalName", hospital.name || "", {
      shouldValidate: true,
      shouldDirty: true,
    });
    formMethods?.setValue("hospitalId", hospital.id ?? null, {
      shouldValidate: false,
      shouldDirty: true,
    });
    formMethods?.setValue("hospitalLocation", locationText, {
      shouldValidate: true,
      shouldDirty: true,
    });
    formMethods?.setValue("state", address.stateName || "", {
      shouldValidate: true,
      shouldDirty: true,
    });
    formMethods?.setValue("city", address.cityName || "", {
      shouldValidate: true,
      shouldDirty: true,
    });
    formMethods?.setValue("pincode", address.pinCode || "", {
      shouldValidate: true,
      shouldDirty: true,
    });
    formMethods?.setValue("country", address.countryName || "", {
      shouldValidate: true,
      shouldDirty: true,
    });
    formMethods?.setValue("emailOrPhoneNumber", phoneOrEmail, {
      shouldValidate: true,
      shouldDirty: true,
    });
    formMethods?.setValue("hospitalEmail", address.email || "", {
      shouldValidate: false,
      shouldDirty: true,
    });
    formMethods?.setValue(
      "hospitalPhoneNumber",
      address.phoneNumber || address.alternatePhoneNumber || "",
      {
        shouldValidate: false,
        shouldDirty: true,
      }
    );
  };

  const handleClearHospital = () => {
    setSearchTerm("");
    setSelectedHospitalId(null);
    setIsManualMode(false);
    setIsManualHospitalSaved(false);
    setIsOpen(true);
    formMethods?.clearErrors([
      "hospitalName",
      "hospitalLocation",
      "city",
      "state",
      "pincode",
    ]);

    formMethods?.setValue("hospitalName", "", {
      shouldValidate: true,
      shouldDirty: true,
    });
    formMethods?.setValue("hospitalId", null, {
      shouldValidate: false,
      shouldDirty: true,
    });
    formMethods?.setValue("hospitalLocation", "", {
      shouldValidate: true,
      shouldDirty: true,
    });
    formMethods?.setValue("state", "", {
      shouldValidate: true,
      shouldDirty: true,
    });
    formMethods?.setValue("city", "", {
      shouldValidate: true,
      shouldDirty: true,
    });
    formMethods?.setValue("pincode", "", {
      shouldValidate: true,
      shouldDirty: true,
    });
    formMethods?.setValue("country", "", {
      shouldValidate: true,
      shouldDirty: true,
    });
    formMethods?.setValue("emailOrPhoneNumber", "", {
      shouldValidate: true,
      shouldDirty: true,
    });
    formMethods?.setValue("hospitalEmail", "", {
      shouldValidate: false,
      shouldDirty: true,
    });
    formMethods?.setValue("hospitalPhoneNumber", "", {
      shouldValidate: false,
      shouldDirty: true,
    });
  };

  const handleAddHospitalManually = () => {
    const trimmedValue = searchTerm.trim();
    setIsManualMode(true);
    setIsManualHospitalSaved(false);
    setSelectedHospitalId(null);
    setIsOpen(false);
    formMethods?.setValue("hospitalName", trimmedValue, {
      shouldValidate: false,
      shouldDirty: true,
    });
    formMethods?.setValue("hospitalId", null, {
      shouldValidate: false,
      shouldDirty: true,
    });
    formMethods?.setValue("hospitalLocation", "", {
      shouldValidate: false,
      shouldDirty: true,
    });
    formMethods?.setValue("city", "", {
      shouldValidate: false,
      shouldDirty: true,
    });
    formMethods?.setValue("state", "", {
      shouldValidate: false,
      shouldDirty: true,
    });
    formMethods?.setValue("pincode", "", {
      shouldValidate: false,
      shouldDirty: true,
    });
    formMethods?.setValue("country", "", {
      shouldValidate: false,
      shouldDirty: true,
    });
    formMethods?.setValue("emailOrPhoneNumber", "", {
      shouldValidate: false,
      shouldDirty: true,
    });
    formMethods?.setValue("hospitalEmail", "", {
      shouldValidate: false,
      shouldDirty: true,
    });
    formMethods?.setValue("hospitalPhoneNumber", "", {
      shouldValidate: false,
      shouldDirty: true,
    });
    formMethods?.clearErrors([
      "hospitalName",
      "hospitalLocation",
      "city",
      "state",
      "pincode",
    ]);
  };

  const handleCancelManualHospital = () => {
    setIsManualMode(false);
    setIsManualHospitalSaved(false);
    setSelectedHospitalId(null);
    setSearchTerm("");
    setIsOpen(false);
    formMethods?.clearErrors([
      "hospitalName",
      "hospitalLocation",
      "city",
      "state",
      "pincode",
    ]);
    formMethods?.setValue("hospitalName", "", {
      shouldValidate: false,
      shouldDirty: true,
    });
    formMethods?.setValue("hospitalId", null, {
      shouldValidate: false,
      shouldDirty: true,
    });
    formMethods?.setValue("hospitalLocation", "", {
      shouldValidate: false,
      shouldDirty: true,
    });
    formMethods?.setValue("city", "", {
      shouldValidate: false,
      shouldDirty: true,
    });
    formMethods?.setValue("state", "", {
      shouldValidate: false,
      shouldDirty: true,
    });
    formMethods?.setValue("pincode", "", {
      shouldValidate: false,
      shouldDirty: true,
    });
    formMethods?.setValue("country", "", {
      shouldValidate: false,
      shouldDirty: true,
    });
    formMethods?.setValue("emailOrPhoneNumber", "", {
      shouldValidate: false,
      shouldDirty: true,
    });
    formMethods?.setValue("hospitalEmail", "", {
      shouldValidate: false,
      shouldDirty: true,
    });
    formMethods?.setValue("hospitalPhoneNumber", "", {
      shouldValidate: false,
      shouldDirty: true,
    });
  };

  const handleSaveManualHospital = () => {
    const requiredFields: Array<keyof ClaimsIntimationFormValues> = [
      "hospitalName",
      "hospitalLocation",
      "city",
      "state",
      "pincode",
    ];

    const fieldLabels: Record<string, string> = {
      hospitalName: "Hospital name",
      hospitalLocation: "Location",
      city: "City",
      state: "State",
      pincode: "Pincode",
    };

    const rawValues = formMethods?.getValues();
    let hasErrors = false;

    requiredFields.forEach((field) => {
      const value = rawValues?.[field];
      if (!String(value || "").trim()) {
        hasErrors = true;
        formMethods?.setError(field, {
          type: "required",
          message: `${fieldLabels[field]} is required`,
        });
      } else {
        formMethods?.clearErrors(field);
      }
    });

    if (hasErrors) return;

    if (!selectedPolicyId) {
      // We should never hit this on the claim flow, but guard to avoid silent failure.
      formMethods?.setError("hospitalName", {
        type: "required",
        message: "Policy is required to save hospital details",
      });
      return;
    }

    const values = (rawValues ?? formMethods?.getValues?.()) as
      | ClaimsIntimationFormValues
      | undefined;
    const email = normalizeOptional(values?.hospitalEmail);
    const phoneNumber = normalizeOptional(values?.hospitalPhoneNumber);

    // Persist manual hospital into master + policy mapping so the claim can store hospitalId.
    void (async () => {
      const response = await apiRequest(endPoints.createPolicyHospital(selectedPolicyId), {
        method: "POST",
        data: {
          hospitalName: String(values?.hospitalName || "").trim(),
          addressLine1: String(values?.hospitalLocation || "").trim(),
          city: String(values?.city || "").trim(),
          state: String(values?.state || "").trim(),
          country: String(values?.country || "India").trim(),
          pinCode: String(values?.pincode || "").trim() || undefined,
          email,
          phoneNumber,
          isNetworkHospital: false,
        },
      });

      const hospitalId = response?.data?.data?.hospitalId ?? response?.data?.hospitalId;
      if (!hospitalId) {
        formMethods?.setError("hospitalName", {
          type: "validate",
          message: "Failed to save hospital details",
        });
        return;
      }

      formMethods?.setValue("hospitalId", hospitalId, {
        shouldValidate: false,
        shouldDirty: true,
      });

      setSearchTerm(String(values?.hospitalName || "").trim());
      setSelectedHospitalId(MANUAL_HOSPITAL_ID);
      setIsManualHospitalSaved(true);
      setIsManualMode(false);
      setIsOpen(false);
    })();
  };

  const shouldShowSelectedHospitalCard = Boolean(
    selectedHospitalId &&
      (selectedHospitalId !== MANUAL_HOSPITAL_ID || isManualHospitalSaved) &&
      hospitalName.trim() &&
      hospitalLocation.trim()
  );

  return (
    <HospitalSearchSection>
      <HospitalSearchLabel>
        Hospitals Name <RequiredAsterisk>*</RequiredAsterisk>
      </HospitalSearchLabel>
      {/* <HospitalSearchHelper>
        {isCashlessClaim
          ? "Search and select a network hospital for cashless treatment."
          : "Search and select the hospital where treatment will be provided."}
      </HospitalSearchHelper> */}

      <HospitalSearchFieldWrapper>
          <StyledTextField
          value={searchTerm}
          onChange={(e) => {
            const nextValue = e.target.value;
            setSearchTerm(nextValue);
            if (selectedHospitalId && selectedHospitalId !== MANUAL_HOSPITAL_ID) {
              setSelectedHospitalId(null);
            }
            if (isManualMode) {
              setIsManualHospitalSaved(false);
              formMethods?.setValue("hospitalName", nextValue, {
                shouldValidate: false,
                shouldDirty: true,
              });
            } else {
              formMethods?.setValue("hospitalName", "", {
                shouldValidate: true,
                shouldDirty: true,
              });
              formMethods?.setValue("hospitalId", null, {
                shouldValidate: false,
                shouldDirty: true,
              });
              formMethods?.setValue("hospitalLocation", "", {
                shouldValidate: true,
                shouldDirty: true,
              });
              formMethods?.setValue("state", "", {
                shouldValidate: false,
                shouldDirty: true,
              });
              formMethods?.setValue("city", "", {
                shouldValidate: false,
                shouldDirty: true,
              });
              formMethods?.setValue("pincode", "", {
                shouldValidate: false,
                shouldDirty: true,
              });
              formMethods?.setValue("country", "", {
                shouldValidate: false,
                shouldDirty: true,
              });
              formMethods?.setValue("emailOrPhoneNumber", "", {
                shouldValidate: false,
                shouldDirty: true,
              });
              formMethods?.setValue("hospitalEmail", "", {
                shouldValidate: false,
                shouldDirty: true,
              });
              formMethods?.setValue("hospitalPhoneNumber", "", {
                shouldValidate: false,
                shouldDirty: true,
              });
            }
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setIsOpen(false), 150);
            const hasSelectedHospital =
              selectedHospitalId &&
              (selectedHospitalId !== MANUAL_HOSPITAL_ID || isManualHospitalSaved);
            if (!isManualMode && !hasSelectedHospital) {
              formMethods?.setError("hospitalName", {
                type: "required",
                message: "Please select hospital name",
              });
            }
          }}
          customStyles={{ width: "100%", mt: 1 }}
          placeholder="Search hospital name"
          data-testid="hospital-search-field"
          inputProps={{ "data-testid": "hospital-search-input" }}
          error={Boolean(hospitalNameErrorMessage)}
          helperText={hospitalNameErrorMessage}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "#6B7280" }} />
              </InputAdornment>
            ),
            endAdornment:
              searchTerm || selectedHospitalId ? (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="clear hospital selection"
                    edge="end"
                    size="small"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={handleClearHospital}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : undefined,
          }}
        />

        {isOpen && !isManualMode && (
          <HospitalSearchResults>
            {isLoading || isFetching ? (
              /* ── Loading state ── */
              <HospitalSearchEmpty
                sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}
              >
                <CircularProgress size={18} />
                {hasTypedSearch
                  ? `Searching for hospitals with "${trimmedSearchTerm}"...`
                  : "Loading hospitals..."}
              </HospitalSearchEmpty>
            ) : hospitals.length > 0 ? (
              /* ── Has results — show list only, no manual add panel ── */
              <HospitalSearchResultList>
                {hospitals.map((hospital) => {
                  const address = normalizeAddress(hospital.addresses);
                  const locationText = buildLocationText(address);
                  const isSelected = selectedHospitalId === hospital.id;
                  return (
                    <HospitalSearchResultItem
                      key={hospital.id ?? hospital.name}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        handleSelectHospital(hospital);
                      }}
                      sx={{ backgroundColor: isSelected ? "#EEF6FF" : "transparent" }}
                    >
                      <HospitalSearchResultName>
                        {hospital.name || "Unnamed hospital"}
                      </HospitalSearchResultName>
                      <HospitalSearchResultMeta>
                        {locationText || "Address not available"}
                      </HospitalSearchResultMeta>
                    </HospitalSearchResultItem>
                  );
                })}
              </HospitalSearchResultList>
            ) : shouldShowManualAdd ? (
              /* ── No results after search — show "not found" + Add Manually ── */
              <HospitalManualAddPanel>
                <HospitalManualAddTitle>
                  No hospitals found for &ldquo;{trimmedSearchTerm}&rdquo;.
                </HospitalManualAddTitle>
                <HospitalManualAddSubtitle>
                  {isCashlessClaim
                    ? "This hospital is not part of our network, but you can still proceed with a cashless claim."
                    : "This hospital is not part of our network, but you can still proceed with a reimbursement claim."}
                  {" "}Enter hospital details manually to continue.
                </HospitalManualAddSubtitle>
                <HospitalManualAddButton
                  variant="contained"
                  startIcon={<AddIcon />}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={handleAddHospitalManually}
                >
                  Add Hospital Manually
                </HospitalManualAddButton>
              </HospitalManualAddPanel>
            ) : (
              /* ── No search term yet ── */
              <HospitalSearchEmpty>No hospitals available.</HospitalSearchEmpty>
            )}
          </HospitalSearchResults>
        )}

      </HospitalSearchFieldWrapper>

      {isManualMode && (
        <>
          <DynamicForm
            formConfig={getHospitalManualFieldsConfig()}
            existingMethods={formMethods}
            renderOnlyFields
            variant="ibp"
            sx={{ marginTop: 16 }}
          />

          <HospitalManualActions>
            <HospitalManualAddButton
              variant="outlined"
              onClick={handleCancelManualHospital}
              sx={{
                backgroundColor: "#FFFFFF",
                color: "#1C67B4",
                borderColor: "#1C67B4",
                "&:hover": {
                  backgroundColor: "#EEF6FF",
                  borderColor: "#16548F",
                  color: "#16548F",
                },
              }}
            >
              Cancel
            </HospitalManualAddButton>
            <HospitalManualAddButton
              variant="contained"
              onClick={handleSaveManualHospital}
            >
              Save Hospital Details
            </HospitalManualAddButton>
          </HospitalManualActions>
        </>
      )}

      {shouldShowSelectedHospitalCard && !isManualMode && (
        <HospitalSelectionCard>
          <HospitalSelectionCardGrid>
            <Box>
              <HospitalSelectionLabel>Hospital Name</HospitalSelectionLabel>
              <HospitalSelectionValue>{hospitalName}</HospitalSelectionValue>
            </Box>
            <Box>
              <HospitalSelectionLabel>Location</HospitalSelectionLabel>
              <HospitalSelectionValue>
                {hospitalLocation}
              </HospitalSelectionValue>
            </Box>
          </HospitalSelectionCardGrid>
          <IconButton
            aria-label="remove hospital"
            onClick={handleClearHospital}
            sx={{
              color: "#EF4444",
              "&:hover": {
                backgroundColor: "rgba(239, 68, 68, 0.08)",
              },
            }}
          >
            <DeleteOutlineIcon />
          </IconButton>
        </HospitalSelectionCard>
      )}
    </HospitalSearchSection>
  );
};
