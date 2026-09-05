import {
  AppDispatch,
  CurrencyDisplayMode,
  RootState,
  applyRegexLocalization,
  endPoints,
  fetchPermissions,
  fetchUserDefaultConfig,
  isIndianNumberFormat,
  selectPermissions,
  setLookupValues,
  setResolvedLookupIds,
  setCurrencyDisplayMode,
  updateUserDefaultConfig,
  useApiMutation,
  useApiQuery,
  useLocalization,
  useLookupIdByKey,
  useInactivityTimeout,
  environment,
} from "@ui/ui-lib";
import { ReactNode, useEffect, useCallback, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CircularProgress } from "@mui/material";
import { LoaderOverlay, Loader } from "../NotificationsDrawer/styles";
import { useAuth } from "../../providers/AuthProvider";
import { useNavigate } from "react-router-dom";

interface LookupItem {
  lookUpKey: string;
  id: number;
}

interface LookupValuesState {
  data?: Record<string, LookupItem[]>;
}

const useLookupInitializer = () => {
  const dispatch = useDispatch();
  const lookupValues = useSelector(
    (state: RootState) => state.user.lookupValues as LookupValuesState
  );
  const lookupReady = useSelector((state: RootState) => state.user.lookupReady);
  const lookupData = lookupValues?.data ?? {};

  const [loading, setLoading] = useState<boolean>(false);

  const { mutate: fetchLookups } = useApiMutation({
    config: {
      onSuccess: (response) => {
        dispatch(setLookupValues(response));
        setLoading(false);
      },
      onError: (error) => {
        console.error("Failed to fetch lookups", error);
        setLoading(false);
      },
    },
  });

  useEffect(() => {
    if (!lookupReady) {
      setLoading(true);
      fetchLookups({
        endpoint: endPoints.lookUpValuesByName,
        method: "POST",
        data: {
          lookupNames: [
            "MEETING_TYPE",
            "TOGGLE_TYPE",
            "SELECT_MEETING",
            "CONTACT_RECORD_TYPE",
            "GROUP_COMPANY",
            "COMPANY_TAG",
            "POLICY_PLACED_TYPE",
            "PAYMENT_TOGGLE",
            "CD_ACCOUNT_TOGGLE",
            "OPPORTUNITY_TYPE",
            "COMPANY_STATUS",
            "AGENT_ADDRESS_TYPE",
            "POLICY_CONFIGURATION_STATUS",
            "SERVICE_LEVEL",
            "POLICY_STATUS",
            "IS_POLICY_MINED",
            "CONTACT_TYPE",
            "ADDRESS_TYPE",
            "MEETING_LOCATION",
            "COMPENSATION_TYPE",
            "DOCUMENT_TYPE",
            "BALANCE_TRANSACTION",
            "TRANSACTION_TYPE",
            "POLICY_TYPE",
            "INSURER_PARTICIPATION_TYPE",
            "TASK_TYPE_SELECTION",
            "TASK_TYPE",
            "TASK_STATUS",
            "MARTIAL_STATUS",
            "INSURER_BRANCH_TYPE"
          ],
        },
      });
    }
  }, [lookupReady]);

  useEffect(() => {
    if (!lookupReady || Object.keys(lookupData).length === 0) return;

    const resolved = Object.entries(lookupData).reduce((acc, [_, items]) => {
      items.forEach(({ lookUpKey, id }) => {
        acc[lookUpKey] = id;
      });
      return acc;
    }, {} as Record<string, number>);
    dispatch(setResolvedLookupIds(resolved));
  }, [lookupReady, lookupData]);

  return { loading: !lookupReady || loading };
};

const usePermissionInitializer = () => {
  const userDetails = sessionStorage.getItem("user");
  const dispatch = useDispatch<AppDispatch>();
  const permissions = useSelector(selectPermissions);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user && permissions === null && Boolean(userDetails)) {
      dispatch(fetchPermissions());
    }
  }, [authLoading, user, permissions, dispatch]);

  const loading = authLoading || !user || permissions === null;

  return { loading };
};

const useFilterPersitanceInitializer = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchUserDefaultConfig());
  }, []);

  const filterLoading = useSelector((state: any) => state.user.buttonLoading);

  return { loading: filterLoading };
};

const useSessionTimeout = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const resolveTimeoutMinutes = useCallback(() => {
    const fromEnv = environment.iworkSessionTimeoutMinutes;
    if (typeof fromEnv === "number" && fromEnv > 0) {
      return fromEnv;
    }

    const directEnv = Number(
      (import.meta as any)?.env?.VITE_IWORK_SESSION_TIMEOUT_MINUTES
    );
    if (!Number.isNaN(directEnv) && directEnv > 0) {
      return directEnv;
    }

    const fromStorage = Number(localStorage.getItem("sessionTimeoutMinutes"));
    if (!Number.isNaN(fromStorage) && fromStorage > 0) {
      return fromStorage;
    }

    console.warn(
      "[iWork] Inactivity timeout not configured; timer will not start."
    );
    return null;
  }, []);

  const handleTimeout = useCallback(() => {
    localStorage.removeItem("user");
    signOut();
    navigate("/login");
  }, [navigate, signOut]);

  useInactivityTimeout({
    timeoutMinutes: resolveTimeoutMinutes(),
    onTimeout: handleTimeout,
  });
};

interface ComponentMountProps {
  children: ReactNode;
}
const ComponentMount = ({ children }: ComponentMountProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading: lookupLoading } = useLookupInitializer();
  const { localizationData, isLocalizationLoading } = useLocalization();
  const { loading: permissionLoading } = usePermissionInitializer();
  const { loading: filterLoading } = useFilterPersitanceInitializer();
   useSessionTimeout();
  const hasInitializedCurrencyMode = useRef(false);

  const persistedCurrencyMode = useSelector(
    (state: RootState) =>
      (state.user.userDefaultConfig as any)?.smartSearchValues
        ?.LOCALIZATION_PREFERENCE?.currencyDisplayMode
  );

  const loading = lookupLoading || isLocalizationLoading || permissionLoading;

  useEffect(() => {
    if (hasInitializedCurrencyMode.current) return;
    if (filterLoading || isLocalizationLoading) return;
    if (persistedCurrencyMode) {
      hasInitializedCurrencyMode.current = true;
      return;
    }

    // Uses the formatters' own classifier so the mode persisted here always
    // matches the grouping the country's numberFormat would have produced.
    const numberFormat = String(
      localizationData?.data?.numberFormat || ""
    ).replace(/\s+/g, "");

    // A missing numberFormat stays INDIAN, matching the formatters' own
    // fallback — isIndianNumberFormat("") is false, so it can't be relied on
    // to make that call by itself.
    const inferredMode: CurrencyDisplayMode =
      numberFormat && !isIndianNumberFormat(numberFormat)
        ? CurrencyDisplayMode.INTERNATIONAL
        : CurrencyDisplayMode.INDIAN;

    hasInitializedCurrencyMode.current = true;
    dispatch(setCurrencyDisplayMode(inferredMode));
    dispatch(
      updateUserDefaultConfig({
        entityKey: "LOCALIZATION_PREFERENCE",
        selectedFilterValues: { currencyDisplayMode: inferredMode },
        columns: [],
      }) as any
    );
  }, [
    dispatch,
    filterLoading,
    isLocalizationLoading,
    localizationData,
    persistedCurrencyMode,
  ]);

  if (localizationData?.data) {
    applyRegexLocalization(localizationData.data);
  }

  if (loading) {
    return (
      <LoaderOverlay data-testid="pre-mount-loader">
        <CircularProgress />
      </LoaderOverlay>
    );
  }

  return (
    <>
      {filterLoading && (
        <Loader data-testid="loader">
          <CircularProgress />
        </Loader>
      )}
      {children}
    </>
  );
};

export default ComponentMount;
