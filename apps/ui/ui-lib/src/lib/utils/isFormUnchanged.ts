// utils.ts

export const areObjectsEqual = (
  obj1: Record<string, any>,
  obj2: Record<string, any>
): boolean => {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    if (!obj2.hasOwnProperty(key)) {
      return false;
    }

    const value1 = obj1[key];
    const value2 = obj2[key];

    // Special handling for "Invalid Date" objects
    if (value1 instanceof Date && isNaN(value1.getTime()) && value2 === null) {
      continue; // Treat Invalid Date as equal to empty string
    }
    if (value2 instanceof Date && isNaN(value2.getTime()) && value1 === null) {
      continue; // Treat Invalid Date as equal to empty string
    }
    if (value1 !== value2) {
      return false;
    }
  }

  return true;
};

export const isFormUnchanged = (
  defaultValues: Record<string, any>,
  submittedValues: Record<string, any>
): boolean => {
  return areObjectsEqual(defaultValues, submittedValues);
};

export const validateFalseyPayloadValues = (value: string) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }
  return value;
};

export const convertToNumber = (value?: string): number | undefined => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }
  return Number(value);
};
