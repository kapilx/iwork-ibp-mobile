import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, CircularProgress } from "@mui/material";
import { UseFormReturn } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  BUTTON_LABELS,
  BUTTON_TYPE,
  BUTTON_VARIANTS,
  CommonBreadcrumb,
  DynamicForm,
  endPoints,
  FormActionsContainer,
  FormSection,
  Loader,
  normalizePayload,
  apiRequest,
  setToastMessage,
  SUCCESS_MESSAGE,
  ERROR_MESSAGE,
  VALIDATION_ERROR_MESSAGE,
  useLookupIdByKey,
} from "@ui/ui-lib";
import { LookUpValues } from "../../../constants/lookupValues";
import {
  ADD_INSURER,
  EXISTING_INSURER,
  GO_BACK,
  GST_NUMBER_EXISTS,
  INSURER_DISPLAY_FIELDS,
  MANAGE_INSURER,
  NEW_INSURER,
  NEW_INSURER_FIELDS,
} from "../../../constants";
import {
  defaultAddress as insurerDefaultAddress,
  getBranchTopFields,
  getBranchAddressFields,
  buildInsurerSectionConfig,
} from "./formConfig";
import {
  StyledCrumbContainer,
  StyledFormContainer,
  StyledNextButton,
  StyledPageContainer,
} from "./styles";

const CRUMBS = [
  { key: "manage-insurer", label: MANAGE_INSURER, path: "/insurer" },
  { key: "add-insurer", label: ADD_INSURER },
];

// Map the (dirty) `insurer*` section fields to the insurer-update payload keys.
// Only user-edited fields are echoed back, so prefilled values don't overwrite
// existing data. Shared by the create (existing-insurer) and edit submit paths.
const buildInsurerUpdateFields = (
  dirty: Record<string, any>,
  values: Record<string, any>
) => ({
  ...(dirty.insurerDisplayName ? { displayName: values.insurerDisplayName } : {}),
  ...(dirty.insurerIsLifeLid ? { isLifeLid: values.insurerIsLifeLid } : {}),
  ...(dirty.insurerCompanyTypeLid
    ? { companyTypeLid: values.insurerCompanyTypeLid }
    : {}),
  ...(dirty.insurerCompanyTagLid
    ? { companyTagLid: values.insurerCompanyTagLid }
    : {}),
  ...(dirty.insurerInsureCode ? { insureCode: values.insurerInsureCode } : {}),
  ...(dirty.insurerWebsite ? { website: values.insurerWebsite } : {}),
});

const AddInsurerBranch: React.FC = () => {
  const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { entityType, id: insurerIdParam, addressId } = useParams();
  const isEdit = Boolean(addressId);
  const insurerId = Number(insurerIdParam);
  const backPath = isEdit ? `/${entityType}/${insurerId}` : "/insurer";
  const [editPrefill, setEditPrefill] = useState<{
    branch: Record<string, any>;
    address: Record<string, any>;
    insurerSection: Record<string, any>;
    contactId: number | null;
    stateGstDetailId: number | null;
  } | null>(null);
  // Every address id on this insurer, so an edit PUT can send the complete list
  // (modifyInsurer deletes any branch mapping omitted from an id-bearing array).
  const [allAddressIds, setAllAddressIds] = useState<number[]>([]);

  const [branchFormMethods, setBranchFormMethods] = useState<UseFormReturn<any> | undefined>();
  const [insurerSectionFormMethods, setInsurerSectionFormMethods] = useState<UseFormReturn<any> | undefined>();
  const [addressFormMethods, setAddressFormMethods] = useState<UseFormReturn<any> | undefined>();

  const [isHqSelected, setIsHqSelected] = useState(false);
  const [insurerSelected, setInsurerSelected] = useState(false);
  const [isNewInsurer, setIsNewInsurer] = useState(false);
  const [loading, setLoading] = useState(false);

  const inlineCreatedInsurerIdRef = useRef<number | null>(null);

  const contactRecordTypeLid = useLookupIdByKey(LookUpValues.INSURER_CONTACT);
  const hqBranchTypeLid = useLookupIdByKey(LookUpValues.INSURER_BRANCH_TYPE_HQ);
  const companyTagCompanyId = useLookupIdByKey(LookUpValues.COMPANY_TAG_COMPANY);

  // Form configs
  const branchTopConfig = useMemo(() => getBranchTopFields(userData), [userData]);
  const addressConfig = useMemo(() => getBranchAddressFields(userData), [userData]);
  const insurerSectionConfig = useMemo(() => {
    const base = buildInsurerSectionConfig(
      userData,
      isHqSelected,
      // in edit the insurer is known, so its detail fields are always enabled
      isEdit ? true : insurerSelected,
      isNewInsurer,
    );
    if (!isEdit) return base;
    // Edit: the insurer is fixed — drop the existing/new toggle and lock the
    // insurer selector. Parent-branch required logic is left as-is so it matches
    // add-insurer (required for non-HQ branches via buildInsurerSectionConfig).
    return base
      .filter((f) => f.name !== "insurerSelectionMode")
      .map((f) => {
        // Insurer selector is locked; company tag stays "Company" (prefilled +
        // disabled) exactly like insurer creation.
        if (f.name === "principalInsurerId" || f.name === "insurerCompanyTagLid") {
          return { ...f, componentProps: { ...f.componentProps, disabled: true } };
        }
        return f;
      });
  }, [userData, isHqSelected, insurerSelected, isNewInsurer, isEdit]);

  const insurerSectionDefaultValues = useMemo(
    () => ({
      insurerSelectionMode: EXISTING_INSURER,
      principalInsurerId: "",
      parentBranchId: "",
      ...Object.fromEntries(INSURER_DISPLAY_FIELDS.map((f) => [f, ""])),
      ...Object.fromEntries(NEW_INSURER_FIELDS.map((f) => [f, ""])),
      companyTagLid: companyTagCompanyId || "",
      countryId: userData?.country?.id || "",
    }),
    [userData, companyTagCompanyId],
  );

  // Restore companyTagLid default once the lookup resolves
  useEffect(() => {
    if (companyTagCompanyId && insurerSectionFormMethods) {
      insurerSectionFormMethods.setValue("companyTagLid", companyTagCompanyId);
    }
  }, [companyTagCompanyId, insurerSectionFormMethods]);

  // Watch branch form — detect HQ selection
  useEffect(() => {
    if (!branchFormMethods) return;
    const sub = branchFormMethods.watch((values, { name }) => {
      if (name !== "branchTypeLid") return;
      const isHq =
        hqBranchTypeLid != null &&
        Number(values.branchTypeLid) === Number(hqBranchTypeLid);
      setIsHqSelected(isHq);
      if (isHq) insurerSectionFormMethods?.setValue("parentBranchId", "");
    });
    return () => sub.unsubscribe();
  }, [branchFormMethods, hqBranchTypeLid, insurerSectionFormMethods]);

  // Watch insurer section form — prefill on insurer selection, clear on mode switch
  useEffect(() => {
    if (!insurerSectionFormMethods) return;
    const sub = insurerSectionFormMethods.watch(async (values, { name }) => {
      if (name === "insurerSelectionMode") {
        const mode = (values as any).insurerSelectionMode as string;
        setInsurerSelected(false);
        setIsNewInsurer(mode === NEW_INSURER);
        inlineCreatedInsurerIdRef.current = null;

        if (mode === EXISTING_INSURER) {
          // Clear new-insurer fields
          NEW_INSURER_FIELDS.forEach((f) =>
            insurerSectionFormMethods.setValue(f, ""),
          );
        } else {
          // Clear existing-insurer fields
          insurerSectionFormMethods.setValue("principalInsurerId", "");
          insurerSectionFormMethods.setValue("parentBranchId", "");
          INSURER_DISPLAY_FIELDS.forEach((f) =>
            insurerSectionFormMethods.setValue(f, ""),
          );
          // Restore defaults for new insurer
          insurerSectionFormMethods.setValue(
            "companyTagLid",
            companyTagCompanyId || "",
          );
          insurerSectionFormMethods.setValue(
            "countryId",
            userData?.country?.id || "",
          );
        }
      }

      if (name === "principalInsurerId") {
        const id = (values as any).principalInsurerId as number | "";
        // Clear display fields and reset enabled state
        INSURER_DISPLAY_FIELDS.forEach((f) =>
          insurerSectionFormMethods.setValue(f, ""),
        );
        insurerSectionFormMethods.setValue("parentBranchId", "");
        setInsurerSelected(false);
        if (!id) return;

        try {
          const res = await apiRequest(endPoints.insurerById(Number(id)), {
            method: "GET",
          });
          const data = res?.data;
          if (!data) return;
          // API returns: isLife:{id,lookUpValue}, companyTypeLid:number,
          // companyTagLid:number, countryId:number — set the plain IDs so each
          // disabled select can match its loaded options and show the correct label.
          insurerSectionFormMethods.setValue(
            "insurerDisplayName",
            data.displayName || "",
          );
          insurerSectionFormMethods.setValue(
            "insurerIsLifeLid",
            data.isLife?.id ?? "",
          );
          // API returns both a raw `companyTypeLid` number and a mapped
          // `companyType: { id, lookUpValue }` object. Use the mapped object
          // — the raw number can be stale/incorrect.
          insurerSectionFormMethods.setValue(
            "insurerCompanyTypeLid",
            data.companyType?.id ?? "",
          );
          insurerSectionFormMethods.setValue(
            "insurerCompanyTagLid",
            data.companyTag?.id ?? "",
          );
          insurerSectionFormMethods.setValue(
            "insurerCountryId",
            data.countryId ?? "",
          );
          insurerSectionFormMethods.setValue(
            "insurerInsureCode",
            data.insureCode || "",
          );
          insurerSectionFormMethods.setValue(
            "insurerWebsite",
            data.website || "",
          );
          // Enable all detail fields for editing now that data is prefilled
          setInsurerSelected(true);
        } catch {
          // silent — display fields remain empty
        }
      }
    });
    return () => sub.unsubscribe();
  }, [insurerSectionFormMethods, companyTagCompanyId, userData]);

  // ── Edit mode: fetch the branch and prefill ─────────────────────────────────

  useEffect(() => {
    if (!isEdit || !insurerId || !addressId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiRequest(endPoints.insurerById(insurerId), {
          method: "GET",
        });
        const insurer = res?.data;
        const addresses: any[] = insurer?.insurerAddresses ?? [];
        const addr = addresses.find(
          (a) => Number(a.id) === Number(addressId)
        );
        if (!addr || cancelled) return;
        setAllAddressIds(
          addresses.map((a) => Number(a.id)).filter((n) => !Number.isNaN(n))
        );
        setInsurerSelected(true);
        setEditPrefill({
          branch: {
            branchTypeLid: addr.branchTypeLid ?? "",
            branchCode: addr.branchCode ?? "",
            branchName: addr.branchName ?? "",
          },
          address: {
            address1: addr.address1 ?? "",
            address2: addr.address2 ?? "",
            area: addr.area ?? "",
            countryId: addr.countryId?.id ?? userData?.country?.id ?? "",
            stateId: addr.stateId?.id ?? "",
            cityId: addr.cityId?.id ?? "",
            pinCode: addr.pinCode ?? "",
            firstName: addr.contactDetails?.firstName ?? "",
            lastName: addr.contactDetails?.lastName ?? "",
            displayName: addr.contactDetails?.displayName ?? "",
            phoneNumber: addr.phoneNumber ?? "",
            email: addr.email ?? "",
            alternatePhoneNumber: addr.alternatePhoneNumber ?? "",
            supportNumber: addr.supportNumber ?? "",
            registrationNo: addr.registrationNo ?? "",
            tanNumber: addr.tanNumber ?? "",
            panCardNo: addr.panCardNo ?? "",
            gstStateId: addr.gstDetails?.gstStateId ?? "",
            gstCategoryLid: addr.gstDetails?.gstCategoryLid ?? "",
            gstNumber: addr.gstDetails?.gstNumber ?? "",
          },
          insurerSection: {
            insurerSelectionMode: EXISTING_INSURER,
            principalInsurerId: insurerId,
            parentBranchId: addr.parentBranchId ?? "",
            insurerDisplayName: insurer?.displayName ?? "",
            insurerIsLifeLid: insurer?.isLife?.id ?? "",
            insurerCompanyTypeLid: insurer?.companyType?.id ?? "",
            insurerCompanyTagLid: insurer?.companyTag?.id ?? "",
            insurerCountryId: insurer?.countryId ?? userData?.country?.id ?? "",
            insurerInsureCode: insurer?.insureCode ?? "",
            insurerWebsite: insurer?.website ?? "",
          },
          contactId: addr.contactDetails?.id ?? addr.contactId ?? null,
          stateGstDetailId: addr.stateGstDetailId ?? addr.gstDetails?.id ?? null,
        });
      } catch {
        dispatch(setToastMessage(ERROR_MESSAGE));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEdit, insurerId, addressId]);

  useEffect(() => {
    if (isEdit && editPrefill && branchFormMethods) {
      branchFormMethods.reset(editPrefill.branch);
    }
  }, [isEdit, editPrefill, branchFormMethods]);

  useEffect(() => {
    if (isEdit && editPrefill && addressFormMethods) {
      addressFormMethods.reset(editPrefill.address);
    }
  }, [isEdit, editPrefill, addressFormMethods]);

  useEffect(() => {
    if (isEdit && editPrefill && insurerSectionFormMethods) {
      insurerSectionFormMethods.reset(editPrefill.insurerSection);
    }
  }, [isEdit, editPrefill, insurerSectionFormMethods]);

  // ── Submit ─────────────────────────────────────────────────────────────────

  // Save a branch's contact: update the existing one's name in place, or create
  // a new one linked to the address (which sets insurer_address.contactId so it
  // shows on the branch card). Shared by the create and edit paths.
  const saveBranchContact = async (opts: {
    existingContactId?: number | null;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    companyId: number;
    cityId: any;
    addressId: number;
  }) => {
    const { existingContactId, firstName, lastName, displayName, companyId, cityId, addressId: addrId } = opts;
    const resolvedDisplayName =
      displayName?.trim() ||
      `${firstName?.trim() ?? ""} ${lastName?.trim() ?? ""}`.trim();

    if (existingContactId) {
      await apiRequest(endPoints.contactById(Number(existingContactId)), {
        method: "PUT",
        data: normalizePayload({
          firstName: firstName?.trim(),
          lastName: lastName?.trim(),
          displayName: resolvedDisplayName,
        }),
      });
    } else if (firstName?.trim() && contactRecordTypeLid) {
      await apiRequest(endPoints.allContacts, {
        method: "POST",
        data: normalizePayload({
          firstName: firstName.trim(),
          lastName: lastName?.trim() ?? firstName.trim(),
          displayName: resolvedDisplayName,
          companyLocationId: cityId,
          companyId,
          contactRecordTypeLid,
          communicationDetails: [],
          existingAddressIds: [addrId],
        }),
      });
    }
  };

  const handleEditSubmit = async () => {
    if (!branchFormMethods || !addressFormMethods || !insurerSectionFormMethods)
      return;

    const [branchValid, addressValid, insurerValid] = await Promise.all([
      branchFormMethods.trigger(),
      addressFormMethods.trigger(),
      insurerSectionFormMethods.trigger(),
    ]);
    if (!branchValid || !addressValid || !insurerValid) {
      dispatch(setToastMessage(VALIDATION_ERROR_MESSAGE));
      return;
    }

    const branchValues = branchFormMethods.getValues();
    const {
      firstName,
      lastName,
      displayName: contactDisplayName,
      ...restAddress
    } = addressFormMethods.getValues();

    // Insurer section: parent branch goes on the address; the insurer's own
    // detail fields are sent only when the user actually edited them (dirty).
    const insurerValues = insurerSectionFormMethods.getValues();
    const insurerUpdateFields = buildInsurerUpdateFields(
      insurerSectionFormMethods.formState.dirtyFields,
      insurerValues
    );

    // The edited branch — carries its id, all address/branch/KYC fields, GST,
    // and the (editable) parent branch. GST + parentBranch persist only through
    // the insurer PUT, so the branch edit goes through it.
    const editedAddress = {
      ...branchValues,
      ...restAddress,
      id: Number(addressId),
      ...(insurerValues.parentBranchId
        ? { parentBranchId: insurerValues.parentBranchId }
        : {}),
      ...(editPrefill?.stateGstDetailId
        ? { stateGstDetailId: editPrefill.stateGstDetailId }
        : {}),
    };

    // Send EVERY other address as a bare { id } so modifyInsurer's full-list
    // semantics keep them intact (a no-op update) instead of deleting them.
    const siblings = allAddressIds
      .filter((id) => id !== Number(addressId))
      .map((id) => ({ id }));

    setLoading(true);
    try {
      await apiRequest(endPoints.insurerById(insurerId), {
        method: "PUT",
        data: normalizePayload({
          ...insurerUpdateFields,
          address: [...siblings, editedAddress],
        }),
      });

      await saveBranchContact({
        existingContactId: editPrefill?.contactId,
        firstName,
        lastName,
        displayName: contactDisplayName,
        companyId: insurerId,
        cityId: restAddress.cityId,
        addressId: Number(addressId),
      });

      dispatch(setToastMessage(SUCCESS_MESSAGE));
      navigate(backPath);
    } catch (error: any) {
      const raw = Array.isArray(error?.message)
        ? error.message[0]
        : error?.message ?? ERROR_MESSAGE;
      dispatch(
        setToastMessage(raw.includes("gst_number") ? GST_NUMBER_EXISTS : raw)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (isEdit) return handleEditSubmit();
    if (!branchFormMethods || !insurerSectionFormMethods || !addressFormMethods)
      return;

    const [branchValid, insurerValid, addressValid] = await Promise.all([
      branchFormMethods.trigger(),
      insurerSectionFormMethods.trigger(),
      addressFormMethods.trigger(),
    ]);

    if (!branchValid || !insurerValid || !addressValid) {
      dispatch(setToastMessage(VALIDATION_ERROR_MESSAGE));
      return;
    }

    const insurerValues = insurerSectionFormMethods.getValues();
    const {
      insurerSelectionMode,
      principalInsurerId,
      parentBranchId,
      // new-insurer fields (existing-insurer edits are read via buildInsurerUpdateFields)
      insurerName,
      displayName: newInsurerDisplayName,
      isLifeLid,
      companyTypeLid,
      companyTagLid,
      countryId,
      insureCode,
      website,
    } = insurerValues;

    let resolvedInsurerId: number = Number(principalInsurerId);

    if (insurerSelectionMode === NEW_INSURER) {
      if (inlineCreatedInsurerIdRef.current) {
        resolvedInsurerId = inlineCreatedInsurerIdRef.current;
      } else {
        setLoading(true);
        try {
          const newInsurerPayload = normalizePayload({
            insurerName,
            displayName: newInsurerDisplayName,
            isLifeLid,
            companyTypeLid,
            companyTagLid,
            countryId,
            insureCode,
            website,
          });
          const res = await apiRequest(endPoints.allInsurers, {
            method: "POST",
            data: newInsurerPayload,
          });
          const newId = res?.data?.id;
          if (!newId) throw new Error("Failed to create insurer");
          inlineCreatedInsurerIdRef.current = newId;
          resolvedInsurerId = newId;
        } catch (error: any) {
          const msg = Array.isArray(error?.message)
            ? error.message[0]
            : error?.message ?? ERROR_MESSAGE;
          dispatch(setToastMessage(msg));
          setLoading(false);
          return;
        }
      }
    }

    const branchValues = branchFormMethods.getValues();
    const addressValues = addressFormMethods.getValues();
    const {
      firstName,
      lastName,
      displayName: contactDisplayName,
      contactId: _cid,
      // These live in the branch form — exclude them so they don't override branchValues
      branchTypeLid: _bt,
      branchCode: _bc,
      branchName: _bn,
      parentBranchId: _pb,
      ...restAddressFields
    } = addressValues;

    const addressPayload = {
      ...branchValues,
      ...restAddressFields,
      ...(parentBranchId ? { parentBranchId } : {}),
    };

    // Only send insurer detail fields that the user explicitly edited.
    // Prefilled values (set via setValue) are not "dirty", so they won't be
    // echoed back — this prevents stale / invalid existing data from causing
    // a 400 when the PUT validates lookup IDs.
    const insurerUpdateFields =
      insurerSelectionMode === EXISTING_INSURER
        ? buildInsurerUpdateFields(
            insurerSectionFormMethods.formState.dirtyFields,
            insurerValues
          )
        : {};

    const normalizedPayload = normalizePayload({
      ...insurerUpdateFields,
      address: [addressPayload],
    });

    if (!loading) setLoading(true);
    try {
      const response = await apiRequest(
        endPoints.insurerById(resolvedInsurerId),
        { method: "PUT", data: normalizedPayload },
      );

      if (firstName?.trim() && contactRecordTypeLid) {
        const savedAddresses: any[] = response?.data?.address ?? [];
        const matched = savedAddresses.find(
          (a: any) =>
            a?.address1 === restAddressFields.address1 &&
            (a?.cityId?.id ?? a?.cityId) === restAddressFields.cityId,
        );
        if (matched?.id) {
          await saveBranchContact({
            firstName,
            lastName,
            displayName: contactDisplayName,
            companyId: resolvedInsurerId,
            cityId: restAddressFields.cityId,
            addressId: matched.id,
          });
        }
      }

      dispatch(setToastMessage(response?.message ?? SUCCESS_MESSAGE));
      navigate("/insurer");
    } catch (error: any) {
      const raw = Array.isArray(error?.message)
        ? error.message[0]
        : error?.message ?? ERROR_MESSAGE;
      dispatch(
        setToastMessage(raw.includes("gst_number") ? GST_NUMBER_EXISTS : raw),
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <StyledPageContainer>
      <StyledCrumbContainer>
        <CommonBreadcrumb
          crumbs={
            isEdit
              ? [
                  { key: "manage-insurer", label: MANAGE_INSURER, path: "/insurer" },
                  { key: "insurer", label: "Insurer", path: backPath },
                  { key: "edit-branch", label: "Edit branch" },
                ]
              : CRUMBS
          }
        />
      </StyledCrumbContainer>

      {loading && (
        <Loader data-testid="loader">
          <CircularProgress />
        </Loader>
      )}

      {/* Branch Details */}
      <Box sx={{ mt: 9 }}>
        <FormSection title="Branch details">
          <DynamicForm
            formConfig={branchTopConfig}
            defaultValues={{ branchTypeLid: "", branchCode: "", branchName: "" }}
            formMethods={setBranchFormMethods}
          />
        </FormSection>
      </Box>

      {/* Insurer Details — insurer is locked in edit; only its details + parent branch are editable */}
      <FormSection title="Insurer details">
        <DynamicForm
          formConfig={insurerSectionConfig}
          defaultValues={insurerSectionDefaultValues}
          formMethods={setInsurerSectionFormMethods}
        />
      </FormSection>

      {/* Address / Contact / KYC / GST */}
      <StyledFormContainer>
        <FormSection showHeader={false}>
          <DynamicForm
            formConfig={addressConfig}
            defaultValues={insurerDefaultAddress(userData)}
            formMethods={setAddressFormMethods}
          />
        </FormSection>
      </StyledFormContainer>

      <FormActionsContainer>
        <StyledNextButton
          variantType={BUTTON_VARIANTS.SECONDARY}
          onClick={() => navigate(backPath)}
          label={GO_BACK}
        />
        <StyledNextButton
          type={BUTTON_TYPE.BUTTON}
          variantType={BUTTON_VARIANTS.PRIMARY}
          onClick={handleSubmit}
          disabled={loading}
          label={BUTTON_LABELS.SUBMIT}
        />
      </FormActionsContainer>
    </StyledPageContainer>
  );
};

export default AddInsurerBranch;
