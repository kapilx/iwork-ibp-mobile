import { endPoints } from "@ui/ui-lib/constants/endPoints";
import { useApiQuery } from "./useApiQuery";

export const useLocalization = () => {
  const rawUser = sessionStorage.getItem("user");
  // ibp employee sessions carry `userId` = the employee table's PK, not a
  // users/organisation row — org-service's /localization endpoint can only
  // resolve the latter (and ibp is not allowed to call org-service anyway),
  // so route ibp sessions to ibp-service's own /localization instead, which
  // resolves via the employee's company/country.
  let isIbpSession = false;
  try {
    isIbpSession = rawUser ? JSON.parse(rawUser)?.portal === "IBP" : false;
  } catch {
    isIbpSession = false;
  }

  const {
    data: localizationData,
    isLoading: isLocalizationLoading,
    error,
  } = useApiQuery({
    url: isIbpSession
      ? endPoints.getIbpLocalizationBasedOnUser
      : endPoints.getLocalizationBasedOnUser,
    queryKey: [isIbpSession ? "getIbpLocalizationBasedOnUser" : "getLocalizationBasedOnUser"],
    enabled: Boolean(rawUser),
  });

  return {
    localizationData,
    isLocalizationLoading,
    error,
  };
};
