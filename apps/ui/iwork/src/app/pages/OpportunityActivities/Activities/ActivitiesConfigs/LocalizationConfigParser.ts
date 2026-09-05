/**
 * Types (for reference):
 * Config = Array<Section>
 * Section = {
 *   key: string,
 *   config: Array<Field>,
 *   ...sectionProps
 * }
 * Field = {
 *   key: string,                // unique within section (assumed)
 *   activityOrder: number,      // unique within section (assumed)
 *   ...otherFieldProps
 * }
 *
 * Change sets:
 * replacedFields: Array<{ section: string, fields: Field[] }>
 * newlyAddedFields: Array<{ section: string, fields: Field[] }>
 * removedFields: Array<{ section: string, activityOrders: number[] }>
 */

function deepCloneWithFunctions(value, seen = new WeakMap()) {
  if (typeof value !== "object" || value === null) return value;
  if (seen.has(value)) return seen.get(value);

  const cloned = Array.isArray(value) ? [] : {};
  seen.set(value, cloned);

  for (const [key, val] of Object.entries(value)) {
    if (typeof val === "function") {
      cloned[key] = val; // reuse function reference
    } else {
      cloned[key] = deepCloneWithFunctions(val, seen);
    }
  }

  return cloned;
}

export const buildConfigV2 = ({
  configV1,
  replacedFields = [],
  newlyAddedFields = [],
  removedFields = [],
}) => {
  // const clone = (obj) => JSON.parse(JSON.stringify(obj));
  const result = deepCloneWithFunctions(configV1);

  // Build quick access map: sectionKey -> sectionRef
  const sectionMap = new Map();
  for (const section of result || []) sectionMap.set(section.key, section);

  // --- helpers ---------------------------------------------------------------

  const getOrCreateSection = (sectionKey) => {
    if (!sectionMap.has(sectionKey)) {
      const newSection = { key: sectionKey, config: [] };
      result.push(newSection);
      sectionMap.set(sectionKey, newSection);
    }
    return sectionMap.get(sectionKey);
  };

  const indexSection = (section) => {
    const byKey = new Map();
    const byOrder = new Map();
    for (const f of section.config || []) {
      if (f.key) byKey.set(f.key, f);
      if (typeof f.activityOrder === "number") byOrder.set(f.activityOrder, f);
    }
    return { byKey, byOrder };
  };

  const upsertField = (section, newField) => {
    const { byKey, byOrder } = indexSection(section);

    if (newField.key && byKey.has(newField.key)) {
      const idx = section.config.findIndex((f) => f.key === newField.key);
      section.config[idx] = newField;
      return;
    }

    if (
      typeof newField.activityOrder === "number" &&
      byOrder.has(newField.activityOrder)
    ) {
      const idx = section.config.findIndex(
        (f) => f.activityOrder === newField.activityOrder
      );
      section.config[idx] = newField;
      return;
    }

    section.config.push(newField);
  };

  const insertField = (section, newField) => {
    upsertField(section, newField);
  };

  const removeByActivityOrders = (section, ordersToRemove) => {
    if (!ordersToRemove?.length) return;
    const orderSet = new Set(ordersToRemove);
    section.config = (section.config || []).filter(
      (f) => !orderSet.has(Number(f.activityOrder))
    );
  };

  const sortByActivityOrder = (section) => {
    section.config = (section.config || []).slice().sort((a, b) => {
      const ao = Number(a.activityOrder);
      const bo = Number(b.activityOrder);
      if (Number.isNaN(ao) && Number.isNaN(bo)) return 0;
      if (Number.isNaN(ao)) return 1;
      if (Number.isNaN(bo)) return -1;
      return ao - bo;
    });
  };

  // --- 1) REMOVALS -----------------------------------------------------------
  for (const rem of removedFields) {
    const section = getOrCreateSection(rem.section);
    removeByActivityOrders(section, rem.activityOrders);
  }

  // --- 2) REPLACEMENTS -------------------------------------------------------
  for (const rep of replacedFields) {
    const section = getOrCreateSection(rep.section);
    for (const field of rep.fields || []) {
      upsertField(section, field);
    }
  }

  // --- 3) ADDITIONS ----------------------------------------------------------
  for (const add of newlyAddedFields) {
    const section = getOrCreateSection(add.section);
    for (const field of add.fields || []) {
      insertField(section, field);
    }
  }

  // --- 4) SORT BY ACTIVITY ORDER --------------------------------------------
  for (const section of result) sortByActivityOrder(section);

  const finalResult = result.filter(
    (section) =>
      (Array.isArray(section.config) && section.config.length > 0) ||
      section.isCoversRequired
  );

  return finalResult;
};

/* ---------------------------------- USAGE -----------------------------------

const configV2 = buildConfigV2({
  configV1,
  replacedFields: [
    { section: "premiumReceiptDetailsSection", fields: [ /* replaced field objects * / ] },
    { section: "remarksSection", fields: [ /* ... * / ] },
    { section: "documents", fields: [ /* ... * / ] },
  ],
  newlyAddedFields: [
    { section: "premiumReceiptDetailsSection", fields: [ /* new-only * / ] },
  ],
  removedFields: [
    { section: "premiumReceiptDetailsSection", activityOrders: [10, 18, 19] },
  ],
});

------------------------------------------------------------------------------- */

// flags.ts
export function computeRequireFollowups(formValues, dynamicvalues) {
  const YES = dynamicvalues?.TOGGLE_YES;
  const isDeviationRequired =
    formValues?.placementSlipDeviationsSection?.placementSlipDeviationsLid ===
    YES;

  const isDeviationAddressed =
    formValues?.deviationsAddressedSection?.deviationsAddressedLid === YES;

  const isRevisedHeldCoverNoteYes =
    formValues?.deviationsAddressedSection?.revisedHeldCoverNoteLid === YES;

  return Boolean(
    isDeviationRequired && isDeviationAddressed && isRevisedHeldCoverNoteYes
  );
}

export function computeRequireFieldsPlacementSlip(formValues, dynamicvalues) {
  const isInstallmentRequired =
    formValues?.policyDetails?.isPremiumInstallmentBased ===
    dynamicvalues?.TOGGLE_YES;

  return Boolean(isInstallmentRequired);
}
export function computeRequiredFieldsPolicyConfirmation(
  formValues,
  dynamicvalues
) {
  const isDeviationRequired =
    formValues?.policyDataWrongSection?.policyDataWrongLid ===
    dynamicvalues?.TOGGLE_YES;

  const isPolicyRectified =
    formValues?.policyDataRectifiedSection?.policyDataRectifiedLid ===
    dynamicvalues?.TOGGLE_YES;

  return { isDeviationRequired, isPolicyRectified };
}

export function computeRequiredFieldsPolicyHardCopy(formValues, dynamicvalues) {
  const deviationCoverageValue =
    formValues?.deviationsAddressedSection?.deviationCoveragesLid;
  const hasAnyDeviation = deviationCoverageValue === dynamicvalues?.TOGGLE_YES;

  const isDeviationAddressed =
    hasAnyDeviation &&
    formValues?.deviationsAddressedSection?.deviationsAddressedLid ===
      dynamicvalues?.TOGGLE_YES;

  const isDeviationRequired =
    isDeviationAddressed &&
    formValues?.deviationSection?.deviationsLid === dynamicvalues?.TOGGLE_YES;

  return { hasAnyDeviation, isDeviationRequired, isDeviationAddressed };
}
