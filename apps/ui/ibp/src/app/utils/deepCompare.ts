/**
 * Deep comparison utility functions
 */

/**
 * Checks if a value is an object (but not null or array)
 */
const isObject = (value: any): boolean => {
  return value !== null && typeof value === "object" && !Array.isArray(value);
};

/**
 * Checks if a value is an array
 */
const isArray = (value: any): boolean => {
  return Array.isArray(value);
};

/**
 * Performs deep equality comparison between two values
 * This function provides the same functionality as lodash's isEqual
 *
 * @param a - First value to compare
 * @param b - Second value to compare
 * @returns boolean - True if values are deeply equal, false otherwise
 */
export const isEqual = (a: any, b: any): boolean => {
  // Strict equality check for primitives and same reference
  if (a === b) {
    return true;
  }

  // Check for null or undefined
  if (a == null || b == null) {
    return a === b;
  }

  // Check if types are different
  if (typeof a !== typeof b) {
    return false;
  }

  // Handle Date objects
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  // Handle RegExp objects
  if (a instanceof RegExp && b instanceof RegExp) {
    return a.toString() === b.toString();
  }

  // Handle arrays
  if (isArray(a) && isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      if (!isEqual(a[i], b[i])) {
        return false;
      }
    }
    return true;
  }

  // Handle objects
  if (isObject(a) && isObject(b)) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) {
      return false;
    }

    for (const key of keysA) {
      if (!keysB.includes(key)) {
        return false;
      }
      if (!isEqual(a[key], b[key])) {
        return false;
      }
    }
    return true;
  }

  // For all other cases (primitives that aren't strictly equal)
  return false;
};

/**
 * Shallow comparison utility function
 * Compares only the first level properties of objects
 */
export const isShallowEqual = (a: any, b: any): boolean => {
  if (a === b) {
    return true;
  }

  if (a == null || b == null) {
    return a === b;
  }

  if (typeof a !== typeof b) {
    return false;
  }

  if (isArray(a) && isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  }

  if (isObject(a) && isObject(b)) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) {
      return false;
    }

    for (const key of keysA) {
      if (!keysB.includes(key) || a[key] !== b[key]) {
        return false;
      }
    }
    return true;
  }

  return false;
};
