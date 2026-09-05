import { useCallback, useRef } from "react";
import axios from "axios";
import { endPoints } from "@ui/ui-lib";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../redux/store";
import { fetchCompanyTemplate } from "../redux/companyTemplateSlice";

export const usePrefetchCompanyTemplate = () => {
  const dispatch = useDispatch<AppDispatch>();
  const lastCompanyIdRef = useRef<number | string | null>(null);

  return useCallback(async () => {
    try {
      const subdomain = window.location.hostname.split(".")[0];
      if (!subdomain) return;

      const response = await axios.get(
        endPoints.companyAuthConfigBySubdomain(subdomain),
      );
      const companyId =
        response?.data?.data?.companyConfig?.companyId ??
        response?.data?.data?.companyId ??
        response?.data?.companyConfig?.companyId ??
        response?.data?.companyId;
      if (!companyId) return;

      if (lastCompanyIdRef.current === companyId) {
        return;
      }
      lastCompanyIdRef.current = companyId;

      dispatch(fetchCompanyTemplate(companyId));
    } catch {
      // Intentionally silent: support login flow should continue even if prefetch fails.
    }
  }, [dispatch]);
};
