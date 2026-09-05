import { RootState } from "@ui/ui-lib/redux/store";
import { useSelector } from "react-redux";

export const useLookupIdByKey = (key: string): number => {
  const resolvedLookupIds = useSelector(
    (state: RootState) => state.user.resolvedLookupIds as Record<string, number>
  );
  return resolvedLookupIds?.[key];
};
