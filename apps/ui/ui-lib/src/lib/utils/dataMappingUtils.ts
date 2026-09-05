type GetData = Record<string, any>;

const mapGetDataToFormData = (getData: GetData, allowedKeys: string[]): any => {
  return allowedKeys.reduce((acc: Record<string, any>, key) => {
    // If the field is nested and has an id property, extract the id
    if (getData[key] && typeof getData[key] === "object" && getData[key].id) {
      acc[key] = getData[key].id;
    } else {
      acc[key] = getData[key];
    }
    return acc;
  }, {});
};

export default mapGetDataToFormData;

//before submitting data, we are converting empty strings to null.
export const normalizePayload = <T>(input: T): T => {
  if (Array.isArray(input)) {
    const normalizedArray = input
      .map((item) =>
        typeof item === "object" && item !== null
          ? normalizePayload(item)
          : item
      )
      .filter((item) => {
        // Remove object if all its values are null (only within arrays)
        if (typeof item === "object" && item !== null && !Array.isArray(item)) {
          const values = Object.values(item);
          return values.some((val) => val !== null);
        }
        return true;
      });

    return normalizedArray as T;
  }

  if (typeof input === "object" && input !== null) {
    if (Object.keys(input).length === 0) return null as T;

    const newObj: Record<string, unknown> = {};
    Object.keys(input).forEach((key) => {
      const value = normalizePayload((input as Record<string, unknown>)[key]);
      newObj[key] = value;
    });

    return newObj as T;
  }

  return input === "" ? (null as T) : input;
};
