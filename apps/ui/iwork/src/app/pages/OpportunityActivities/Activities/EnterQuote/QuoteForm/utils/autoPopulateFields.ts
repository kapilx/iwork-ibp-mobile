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

      const updates: Record<string, any> = {};

      normalizedConfigs.forEach(({ target, fields, compute }) => {
        const { section } = target;

        // ⭐ FIX 1 — skip update if section not yet mounted
        if (!values[section]) {
          return;
        }

        const fieldStates = fields.map((field) => getFieldState(values, field));

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
            values,
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

        const currentValue = getValueAtPath(values, target);

        if (valuesAreEqual(nextValue, currentValue)) {
          return;
        }

        updates[target.section] = updates[target.section] ?? {};
        assignNestedValue(updates[target.section], target.field, nextValue);
      });

      if (Object.keys(updates).length > 0) {
        skipNextChangeRef.current = true;

        // ⭐ FIX 2 — defer setValues to avoid RHF remount crash
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
