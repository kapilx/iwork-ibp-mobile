import { useMemo, useRef } from "react";
import type { RefObject } from "react";
import { NestedGroupedDataCollectionHandle } from "@ui/ui-lib";

type FieldIdentifier = string | FieldPath;

interface FieldPath {
  section: string;
  field: string;
}

interface AutoPopulateContext {
  numericValues: number[];
  rawValues: unknown[];
  values: Record<string, any>;
}

export interface AutoPopulateConfig {
  target: FieldIdentifier;
  fields: FieldIdentifier[];
  compute?: (
    context: AutoPopulateContext
  ) => number | string | null | undefined;
}

const normalizeCountryName = (value?: string): string =>
  (value || "").toLowerCase().replace(/\s+/g, "");

const isSriLankaUser = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const storedUser = window.sessionStorage.getItem("user");
    if (!storedUser) {
      return false;
    }

    const parsedUser = JSON.parse(storedUser);
    const countryName = parsedUser?.country?.name;

    if (!countryName) {
      return false;
    }

    const normalizedCountry = normalizeCountryName(countryName);

    return normalizedCountry === normalizeCountryName("Sri Lanka");
  } catch (_error) {
    return false;
  }
};

export const useAutoPopulateCalculatedFields = (
  formRef: RefObject<NestedGroupedDataCollectionHandle>,
  configs: AutoPopulateConfig[],
  options: { onBeforeSetValues?: () => void; forceEnable?: boolean } = {}
) => {
  const { onBeforeSetValues, forceEnable = false } = options;
  const skipNextChangeRef = useRef(false);

  return useMemo(() => {
    // Only return empty function if not forced and not Sri Lankan user
    if (!forceEnable && !isSriLankaUser()) {
      return () => {};
    }

    const normalizedConfigs = configs.map((config) => ({
      target: normalizeFieldIdentifier(config.target),
      fields: config.fields.map(normalizeFieldIdentifier),
      compute: config.compute,
    }));

    return (values: Record<string, any>) => {
      if (skipNextChangeRef.current) {
        return;
      }

      if (!formRef.current?.setValues || !values) {
        return;
      }

      const mergeValuesWithUpdates = (
        baseValues: Record<string, any>,
        updates: Record<string, any>
      ) => {
        if (!updates || Object.keys(updates).length === 0) {
          return baseValues;
        }

        const merged = { ...baseValues };

        Object.entries(updates).forEach(([section, sectionUpdates]) => {
          if (
            sectionUpdates &&
            typeof sectionUpdates === "object" &&
            !Array.isArray(sectionUpdates)
          ) {
            const existingSection =
              baseValues?.[section] && typeof baseValues[section] === "object"
                ? baseValues[section]
                : {};
            merged[section] = {
              ...existingSection,
              ...sectionUpdates,
            };
          } else {
            merged[section] = sectionUpdates;
          }
        });

        return merged;
      };

      const buildPassUpdates = (
        baseValues: Record<string, any>
      ): Record<string, any> => {
        const nextUpdates: Record<string, any> = {};

        normalizedConfigs.forEach(({ target, fields, compute }) => {
          const { section } = target;

          if (!baseValues[section]) {
            return;
          }

          const fieldStates = fields.map((field) =>
            getFieldState(baseValues, field)
          );
          const anyFieldExists = fieldStates.some((state) => state.exists);
          if (!anyFieldExists) {
            return;
          }

          const hasAnyValue = fieldStates.some((state) => state.hasValue);
          const numericValues = fieldStates.map((state) => state.numericValue);
          const rawValues = fieldStates.map((state) => state.value);

          let nextValue: number | string | "" | null | undefined;

          if (!hasAnyValue) {
            nextValue = "";
          } else if (compute) {
            nextValue = compute({
              numericValues,
              rawValues,
              values: baseValues,
            });
          } else {
            nextValue = numericValues.reduce(
              (total, current) => total + current,
              0
            );
          }

          if (nextValue === undefined) {
            return;
          }

          if (
            nextValue === null ||
            (typeof nextValue === "number" && !isFinite(nextValue))
          ) {
            nextValue = "";
          }

          if (typeof nextValue === "number") {
            nextValue = Number.isFinite(nextValue) ? nextValue : "";
          }

          const currentValue = getValueAtPath(baseValues, target);
          if (valuesAreEqual(nextValue, currentValue)) {
            return;
          }

          nextUpdates[target.section] = nextUpdates[target.section] ?? {};
          assignNestedValue(nextUpdates[target.section], target.field, nextValue);
        });

        return nextUpdates;
      };

      let updates: Record<string, any> = {};
      let mergedValues = values;
      const maxPasses = Math.max(2, normalizedConfigs.length);

      for (let pass = 0; pass < maxPasses; pass += 1) {
        const passUpdates = buildPassUpdates(mergedValues);
        if (Object.keys(passUpdates).length === 0) {
          break;
        }
        updates = mergeValuesWithUpdates(updates, passUpdates);
        mergedValues = mergeValuesWithUpdates(mergedValues, passUpdates);
      }

      if (Object.keys(updates).length > 0) {
        // Skip the upcoming onValuesChange
        skipNextChangeRef.current = true;

        // ⭐ FIX 2: Defer setValues to avoid RHF remount crash
        queueMicrotask(() => {
          try {
            onBeforeSetValues?.();
            if (formRef.current?.setValues) {
              formRef.current.setValues(updates);
            }
          } catch (err) {
            console.warn("Auto populate failed to setValues", err);
          } finally {
            skipNextChangeRef.current = false;
          }
        });
      }
    };
  }, [configs, formRef]);
};

const normalizeFieldIdentifier = (identifier: FieldIdentifier): FieldPath => {
  if (typeof identifier !== "string") {
    return identifier;
  }

  const [section, ...fieldParts] = identifier.split(".");

  if (!section || fieldParts.length === 0) {
    throw new Error(
      `Invalid field identifier "${identifier}". Expected format "section.fieldPath".`
    );
  }

  return {
    section,
    field: fieldParts.join("."),
  };
};

const getFieldState = (values: Record<string, any>, field: FieldPath) => {
  const { value, exists } = getValueWithPresence(values, field);
  const hasValue =
    value !== null && value !== undefined && !isEmptyString(value);
  const numericValue = toNumericValue(value);

  return {
    value,
    exists,
    hasValue,
    numericValue: numericValue ?? 0,
  };
};

const getValueWithPresence = (
  values: Record<string, any>,
  field: FieldPath
) => {
  const sectionValue = values?.[field.section];

  if (!sectionValue || typeof sectionValue !== "object") {
    return { value: undefined, exists: false };
  }

  const pathParts = field.field.split(".");
  let current: any = sectionValue;

  for (let index = 0; index < pathParts.length; index++) {
    const part = pathParts[index];
    if (part === "__proto__" || part === "constructor" || part === "prototype") {
      return { value: undefined, exists: false };
    }
    if (
      current &&
      typeof current === "object" &&
      Object.prototype.hasOwnProperty.call(current, part)
    ) {
      current = current[part];
    } else {
      return { value: undefined, exists: false };
    }
  }

  return { value: current, exists: true };
};

const getValueAtPath = (values: Record<string, any>, field: FieldPath) => {
  return getValueWithPresence(values, field).value;
};

const assignNestedValue = (
  target: Record<string, any>,
  path: string,
  value: unknown
) => {
  const parts = path.split(".");
  let current = target;

  parts.forEach((part, index) => {
    if (part === "__proto__" || part === "constructor" || part === "prototype") {
      return;
    }
    if (index === parts.length - 1) {
      current[part] = value;
      return;
    }

    if (!current[part] || typeof current[part] !== "object") {
      current[part] = {};
    }

    current = current[part];
  });
};

const toNumericValue = (value: unknown): number | null => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const parsed = Number(trimmed.replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const valuesAreEqual = (nextValue: unknown, currentValue: unknown) => {
  if (isEmptyValue(nextValue) && isEmptyValue(currentValue)) {
    return true;
  }

  if (typeof nextValue === "number") {
    const numericCurrent = toNumericValue(currentValue);
    return (
      numericCurrent !== null && Math.abs(numericCurrent - nextValue) < 1e-6
    );
  }

  return nextValue === currentValue;
};

const isEmptyValue = (value: unknown) => {
  return value === null || value === undefined || isEmptyString(value);
};

const isEmptyString = (value: unknown) =>
  typeof value === "string" && value.trim() === "";

export const parseNumericInput = (value: any): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const parsed =
    typeof value === "string"
      ? parseFloat(value.replace(/,/g, ""))
      : Number(value);
  return isNaN(parsed) ? null : parsed;
};

export const autoPopulateFieldInArray = ({
  updates,
  values,
  prevValues,
  sourceSection,
  sourceField,
  targetSection,
  targetField,
}: {
  updates: any;
  values: any;
  prevValues: any;
  sourceSection: string;
  sourceField: string;
  targetSection: string;
  targetField: string;
}) => {
  const getArrayData = (data: any, section: string) =>
    Array.isArray(data?.[section]) ? data[section] : [];

  const baseArray =
    updates[targetSection] && Array.isArray(updates[targetSection])
      ? updates[targetSection]
      : getArrayData(values, targetSection);

  const currentSourceValue = parseNumericInput(
    values?.[sourceSection]?.[sourceField]
  );
  const previousSourceValue = parseNumericInput(
    prevValues?.[sourceSection]?.[sourceField]
  );

  if (currentSourceValue !== null && baseArray.length > 0) {
    const previousArray = getArrayData(prevValues, targetSection);
    updates[targetSection] = baseArray.map((item, i) => {
      const [curr, prev] = [
        parseNumericInput(item?.[targetField]),
        parseNumericInput(previousArray[i]?.[targetField]),
      ];
      const shouldUpdate =
        !item?.[targetField]?.toString().trim() ||
        curr === null ||
        curr === 0 ||
        (previousSourceValue !== null &&
          prev !== null &&
          Math.abs(prev - previousSourceValue) < 0.01 &&
          (curr === null || Math.abs(curr - prev) < 0.01));
      return shouldUpdate
        ? { ...item, [targetField]: currentSourceValue }
        : item;
    });
    return true;
  }

  return false;
};
