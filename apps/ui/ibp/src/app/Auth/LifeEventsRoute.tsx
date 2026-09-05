import { Navigate, Outlet } from "react-router-dom";
import { environment } from "@ui/ui-lib";
import { useCompanyConfig } from "../hooks/useCompanyConfig";

export function LifeEventsRoute() {
    const { portalDashboardConfig, loading } = useCompanyConfig();

    // Feature flag off blocks Life Events entirely (no config fetch needed).
    if (!environment.featureFlag.FF_LIFE_EVENT_DEPENDENT_MANAGEMENT) {
        return <Navigate to="/" replace />;
    }

    // Wait for the company config before deciding — avoids a flash-redirect.
    if (loading) return null;

    // Company-level gate: an explicit false blocks Life Events entirely,
    // including direct URL access.
    if (portalDashboardConfig?.enableLifeEvents === false) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}

export default LifeEventsRoute;
