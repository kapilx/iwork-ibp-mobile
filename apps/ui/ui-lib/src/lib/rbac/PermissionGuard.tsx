// components/PermissionGuard.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { FeatureKey } from "./permissionMap";
import useHasPermission from "./useHasPermission";

const PermissionGuard = ({
  feature,
  children,
}: {
  feature: FeatureKey;
  children: React.ReactElement;
}) => {
  const hasPermission = useHasPermission(feature);

  if (!hasPermission) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default PermissionGuard;
