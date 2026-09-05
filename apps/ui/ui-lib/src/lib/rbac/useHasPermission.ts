import { useSelector } from "react-redux";
import { selectHasPermission } from "@ui/ui-lib/redux/permissionSlice";
import { FeatureKey } from "./permissionMap";
import { RootState } from "@ui/ui-lib/redux/store";

const useHasPermission = (feature: FeatureKey) => {
  return useSelector((state: RootState) => selectHasPermission(feature)(state));
};

export default useHasPermission;
