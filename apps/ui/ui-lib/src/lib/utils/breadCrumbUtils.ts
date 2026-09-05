import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Crumb as Breadcrumb } from "../commonComponents/Breadcrumbs";

type BreadcrumbState = Record<string, unknown> | undefined;

type BreadcrumbContainer = {
  breadcrumbs?: Breadcrumb[];
};

const sanitizeState = (state: BreadcrumbState) => {
  if (!state) {
    return undefined;
  }

  const { breadcrumbs, ...rest } = state as BreadcrumbState &
    BreadcrumbContainer;
  if (Object.keys(rest as Record<string, unknown>).length === 0) {
    return undefined;
  }

  return { ...(rest as Record<string, unknown>) };
};

const sanitizeBreadcrumb = (crumb: Breadcrumb): Breadcrumb => {
  const sanitizedState = sanitizeState(crumb.state as BreadcrumbState);

  if (sanitizedState) {
    return { ...crumb, state: sanitizedState };
  }

  const { state, ...rest } = crumb;
  return rest;
};

const breadcrumbsAreEqual = (a: Breadcrumb, b: Breadcrumb) =>
  JSON.stringify(a) === JSON.stringify(b);

export const createBreadcrumbEntry = (crumb: Breadcrumb): Breadcrumb =>
  sanitizeBreadcrumb(crumb);

export const getBreadcrumbsFromState = (state: unknown): Breadcrumb[] => {
  if (state && typeof state === "object") {
    const typedState = state as BreadcrumbContainer;
    if (Array.isArray(typedState.breadcrumbs)) {
      return typedState.breadcrumbs as Breadcrumb[];
    }
  }

  return [];
};

export const buildBreadcrumbState = ({
  breadcrumbs,
  crumb,
  state,
}: {
  breadcrumbs: Breadcrumb[];
  crumb: Breadcrumb;
  state?: Record<string, unknown>;
}) => {
  const sanitizedState = sanitizeState(state);
  const sanitizedCrumb = sanitizeBreadcrumb({
    ...crumb,
    state: crumb.state ?? sanitizedState,
  });

  //   // Check if a breadcrumb with the same path exists
  const existingIndex = breadcrumbs.findIndex(
    (item) => item.path === sanitizedCrumb.path
  );

  let updatedBreadcrumbs: Breadcrumb[];
  if (existingIndex !== -1) {
    // Replace the existing breadcrumb
    updatedBreadcrumbs = [
      ...breadcrumbs.slice(0, existingIndex),
      sanitizedCrumb,
      ...breadcrumbs.slice(existingIndex + 1),
    ];
  } else {
    // Add the new breadcrumb
    updatedBreadcrumbs = [...breadcrumbs, sanitizedCrumb];
  }
  return {
    ...(sanitizedState ?? {}),
    // breadcrumbs: [...breadcrumbs, sanitizedCrumb],
    breadcrumbs: updatedBreadcrumbs,
  };
};

export const useBreadcrumbTrail = (crumb: Breadcrumb) => {
  const location = useLocation();
  const navigate = useNavigate();

  const sanitizedCrumb = useMemo(() => sanitizeBreadcrumb(crumb), [crumb]);
  const crumbSignature = useMemo(
    () => JSON.stringify(sanitizedCrumb),
    [sanitizedCrumb]
  );

  useEffect(() => {
    const currentBreadcrumbs = getBreadcrumbsFromState(location.state);
    const existingIndex = currentBreadcrumbs.findIndex(
      (item) => item.path === sanitizedCrumb.path
    );

    const matchesExisting =
      existingIndex !== -1 &&
      breadcrumbsAreEqual(currentBreadcrumbs[existingIndex], sanitizedCrumb);

    if (matchesExisting) {
      return;
    }

    const updatedBreadcrumbs =
      existingIndex === -1
        ? [...currentBreadcrumbs, sanitizedCrumb]
        : [
            ...currentBreadcrumbs.slice(0, existingIndex),
            sanitizedCrumb,
            ...currentBreadcrumbs.slice(existingIndex + 1),
          ];

    navigate(".", {
      replace: true,
      state: {
        ...(location.state ? { ...location.state } : {}),
        breadcrumbs: updatedBreadcrumbs,
      },
    });
  }, [crumbSignature, location.key, navigate, sanitizedCrumb]);
};
