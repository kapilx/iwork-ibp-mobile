/**
 * Returns the id for a given lookup key and lookup value from the lookupValues object.
 * @param lookupValues - The lookup values object from Redux state.
 * @param lookupKey - The key/category to search in (e.g., "INDUSTRY_SEGMENT").
 * @param lookupValue - The value to match (e.g., "Insurance").
 * @returns The id if found, otherwise undefined.
 */
export const getLookupIdByValue = (
  lookupValues: Record<string, { id: number; lookUpValue: string }[]>,
  lookupKey: string,
  lookupValue: string
): number | undefined => {
  if (
    !lookupKey?.trim() ||
    !lookupValue?.trim() ||
    !lookupValues?.[lookupKey] ||
    !Array.isArray(lookupValues[lookupKey])
  ) {
    return undefined;
  }

  const found = lookupValues[lookupKey].find(
    (item) => item.lookUpValue === lookupValue
  );
  return found?.id;
};
