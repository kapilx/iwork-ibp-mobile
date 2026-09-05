export const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
};

export const formatIndianNumbering = (
  value: string,
  separator: string
): string => {
  const numStr = String(value).replace(
    new RegExp(escapeRegExp(separator), "g"),
    ""
  );
  if (numStr === "" || isNaN(parseFloat(numStr))) return value;

  const x = numStr.split(".");
  const intPart = x[0];
  const decPart = x.length > 1 ? "." + x[1] : "";

  if (intPart.length <= 3) return intPart + decPart;

  const lastThree = intPart.substring(intPart.length - 3);
  const otherNumbers = intPart.substring(0, intPart.length - 3);
  const formattedOtherNumbers = otherNumbers.replace(
    /\B(?=(\d{2})+(?!\d))/g,
    separator
  );

  return formattedOtherNumbers + separator + lastThree + decPart;
};

export const formatInternationalNumbering = (
  value: string,
  separator: string
): string => {
  const numStr = String(value).replace(
    new RegExp(escapeRegExp(separator), "g"),
    ""
  );
  if (numStr === "" || isNaN(parseFloat(numStr))) return value;

  const x = numStr.split(".");
  const intPart = x[0];
  const decPart = x.length > 1 ? "." + x[1] : "";

  const formattedIntPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  return formattedIntPart + decPart;
};

// Helper to deeply sort object keys
export const deepSortObjectKeys = (obj: any): any => {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(deepSortObjectKeys);

  const sortedKeys = Object.keys(obj).sort();
  const result: Record<string, any> = {};
  sortedKeys.forEach((key) => {
    result[key] = deepSortObjectKeys(obj[key]);
  });
  return result;
};

// Helper to compare objects with sorted keys
export const areDeepEqual = (a: any, b: any): boolean => {
  return (
    JSON.stringify(deepSortObjectKeys(a)) ===
    JSON.stringify(deepSortObjectKeys(b))
  );
};
