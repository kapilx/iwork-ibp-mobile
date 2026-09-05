import { LoaderOverlay, fetchEmployeePolicies } from "@ui/ui-lib";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { AppDispatch, RootState } from "../../redux/store";
import CommonLoader from "../../common/CommonLoader";
import { fetchPortalConfiguration } from "../../redux/portalConfigSlice";
import { getCompanyId as getConfiguredCompanyId } from "../../utils/companyConfig";

const SESSION_EXPIRED_MESSAGE_KEY = "auth:session-expired-message";
const SESSION_EXPIRED_MESSAGE = "Session expired. Please login to continue.";

const getCompanyIdFromUser = (): number | null => {
  try {
    const user = JSON.parse(sessionStorage.getItem("user") || "{}");
    const companyId =
      user?.companyId ||
      user?.company?.id ||
      user?.employeeCompanyId ||
      user?.employeeDetails?.companyId;

    return companyId ? Number(companyId) : null;
  } catch {
    return null;
  }
};

const usePoliciesInitializer = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [initialLoading, setInitialLoading] = useState(true);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      dispatch(fetchEmployeePolicies()).finally(() => setInitialLoading(false));
    }
  }, [dispatch]);

  return { showInitialLoader: initialLoading };
};

const usePortalConfigInitializer = () => {
  const dispatch = useDispatch<AppDispatch>();
  const hasFetchedRef = useRef(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const portalConfig = useSelector(
    (state: RootState) => state.portalConfig.data
  );
  const portalConfigLoading = useSelector(
    (state: RootState) => state.portalConfig.loading
  );

  useEffect(() => {
    const companyId =
      getCompanyIdFromUser() ?? getConfiguredCompanyId() ?? null;
    // Deliberately NOT skipped when `portalConfig` is already set: it is seeded
    // from the sessionStorage cache, so a cached payload short-circuited the
    // fetch and made a stale/partial config (e.g. a null dependentRelationConfig
    // written by a failed auth-config call) permanent for the session.
    // hasFetchedRef still keeps this to one fetch per mount; the cached value is
    // used for first paint, then refreshed.
    if (!companyId || hasFetchedRef.current) {
      return;
    }

    hasFetchedRef.current = true;
    setInitialLoading(true);
    dispatch(fetchPortalConfiguration(companyId)).finally(() =>
      setInitialLoading(false)
    );
  }, [dispatch, portalConfig]);

  const showInitialLoader =
    !portalConfig && (portalConfigLoading || initialLoading);

  return { showInitialLoader };
};

const getSessionTimeoutMs = (): number | null => {
  try {
    const user = JSON.parse(sessionStorage.getItem("user") || "{}");
    const accessToken = user?.accessToken?.accessToken;
    if (!accessToken) {
      return null;
    }
    const decoded = jwtDecode<{ iat?: number; exp?: number }>(accessToken);
    if (!decoded?.iat || !decoded?.exp || decoded.exp <= decoded.iat) {
      return null;
    }
    const timeoutMs = (decoded.exp - decoded.iat) * 1000;
    return timeoutMs > 0 ? timeoutMs : null;
  } catch {
    return null;
  }
};

const useIbpIdleAutoLogout = () => {
  const navigate = useNavigate();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeoutMsRef = useRef<number | null>(null);

  useEffect(() => {
    const timeoutMs = getSessionTimeoutMs();
    timeoutMsRef.current = timeoutMs;
    if (!timeoutMs) {
      return;
    }

    const logoutForIdleTimeout = () => {
      localStorage.setItem(SESSION_EXPIRED_MESSAGE_KEY, SESSION_EXPIRED_MESSAGE);
      sessionStorage.clear();
      localStorage.removeItem("user");
      navigate("/landing", { replace: true });
    };

    const resetIdleTimer = () => {
      if (!timeoutMsRef.current) return;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(logoutForIdleTimeout, timeoutMsRef.current);
    };

    const activityEvents: Array<keyof WindowEventMap> = [
      "mousemove",
      "keydown",
      "click",
      "scroll",
      "touchstart",
    ];

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, resetIdleTimer, { passive: true });
    });

    resetIdleTimer();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, resetIdleTimer);
      });
    };
  }, [navigate]);
};

const ComponentMount = ({ children }) => {
  const { showInitialLoader } = usePoliciesInitializer();
  const { showInitialLoader: showPortalConfigLoader } =
    usePortalConfigInitializer();
  useIbpIdleAutoLogout();

  if (showInitialLoader || showPortalConfigLoader) {
    return (
      <LoaderOverlay data-testid="pre-mount-loader">
        <CommonLoader />
      </LoaderOverlay>
    );
  }

  return <>{children}</>;
};

export default ComponentMount;
