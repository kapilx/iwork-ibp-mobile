import { RootState } from "@ui/ui-lib/redux/store";
import { useMemo } from "react";
import { useSelector } from "react-redux";

export const useLookupIdsByKeys = (keys: readonly string[]): Set<number> => {
  const resolvedLookupIds = useSelector(
    (state: RootState) => state.user.resolvedLookupIds as Record<string, number>
  );
  return useMemo(
    () =>
      new Set(
        keys
          .map((k) => resolvedLookupIds?.[k])
          .filter((v): v is number => v != null)
      ),
    // keys is always a module-level constant — stable reference
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resolvedLookupIds]
  );
};
