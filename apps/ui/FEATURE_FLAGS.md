# UI Feature Flags

This directory contains the micro frontends for the Insurance Wellness Hub UI. Some features are toggled with feature flags so functionality can be released gradually.

## Available Flags

| Flag                           | Description                                                                                                                                                   |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FF_IWORK_POLICY_LISTING`      | Enables the new policy listing experience in the `iwork` app. When true, the sidebar entry under **Manage Placements** navigates to `/policies`.              |
| `FF_IWORK_POLICY_CONFIGURATOR` | Enables the policy configuration screen in the `iwork` app. When true, configuration buttons appear in policy details.                                        |
| `FF_IWORK_POLICY_DASHBOARD`    | Enables the policy dashboard tab in the `iwork` app.                                                                                                          |
| `FF_IWORK_DASHBOARD`           | Enables the new dashboard experience in the `iwork` app. When true, the new dashboard UI is shown instead of the embedded dashboard iframe.                   |
| `FF_IWORK_POLICY_LOCATIONS`    | Enables the Policy Locations step (step 7) in the policy configurator and the Policy Locations tab in the company form. When false, both are hidden.          |

## Naming Convention

Feature flag environment variables follow a pattern:

- Template: `VITE_FF_<module-name>_<feature-name>_<lifecycle-state>`
- `VITE` – Indicates the variable is read by the Vite build tool.
- `FF` – Short for **Feature Flag**.
- `<module-name>` – Specifies the micro frontend consuming the flag ex: `IWORK`.
- `<feature-name>` – Describes the feature being toggled ex: `POLICY_LISTING`, `POLICY_CONFIGURATOR`, or `DASHBOARD`.
- `<lifecycle-state>` – The lifecycle stage. Use `EXPERIMENTAL` while a feature is in active development and switch to `STABEL` once it becomes part of the stable release. ex: `EXPERIMENTAL` / `STABEL`

## Configuration

Flags are driven by environment variables and evaluated in `apps/ui/ui-lib/src/lib/environment.ts`:

```ts
const {
  VITE_FF_IWORK_POLICY_LISTING_EXPERIMENTAL,
  VITE_FF_IWORK_POLICY_CONFIGURATOR_EXPERIMENTAL,
  VITE_FF_IWORK_POLICY_DASHBOARD_EXPERIMENTAL,
  VITE_FF_DASHBOARD_EXPERIMENTAL,
} = import.meta.env;

export const environment = {
  featureFlag: {
    FF_IWORK_POLICY_LISTING:
      VITE_FF_IWORK_POLICY_LISTING_EXPERIMENTAL === "true",
    FF_IWORK_POLICY_CONFIGURATOR:
      VITE_FF_IWORK_POLICY_CONFIGURATOR_EXPERIMENTAL === "true",
    FF_IWORK_POLICY_DASHBOARD:
      VITE_FF_IWORK_POLICY_DASHBOARD_EXPERIMENTAL === "true",
    FF_IWORK_DASHBOARD: VITE_FF_DASHBOARD_EXPERIMENTAL === "true",
  },
};
```

Set these variables to `true` in your environment to enable the features:

```bash
VITE_FF_IWORK_POLICY_LISTING_EXPERIMENTAL=true
VITE_FF_IWORK_POLICY_CONFIGURATOR_EXPERIMENTAL=true
VITE_FF_IWORK_POLICY_DASHBOARD_EXPERIMENTAL=true
VITE_FF_DASHBOARD_EXPERIMENTAL=true
```

Once the features are considered stable, switch to the `_STABEL` variables:

```bash
VITE_FF_IWORK_POLICY_LISTING_STABEL=true
VITE_FF_IWORK_POLICY_CONFIGURATOR_STABEL=true
VITE_FF_IWORK_POLICY_DASHBOARD_STABEL=true
VITE_FF_DASHBOARD_STABEL=true
```

## Feature Flags Usage

**FF_IWORK_POLICY_LISTING**

- `apps/ui/iwork/src/app/common/SideBar/config.ts`
- `apps/ui/iwork/src/app/routes/policy.route.tsx`

**FF_IWORK_POLICY_CONFIGURATOR**

- `apps/ui/iwork/src/app/routes/policy.route.tsx`
- `apps/ui/iwork/src/app/pages/CompanyPage/PolicyDetails/index.tsx`

**FF_IWORK_POLICY_DASHBOARD**

- `apps/ui/iwork/src/app/pages/CompanyPage/PolicyDetails/detailsConfig.ts`
- `apps/ui/iwork/src/app/pages/CompanyPage/PolicyDetails/index.tsx`

**FF_IWORK_DASHBOARD**

- `apps/ui/iwork/src/app/pages/Dashboard/index.tsx`

**Version**

- `apps/ui/ui-lib/src/lib/commonComponents/SideBar/index.tsx`

These flags allow new features to be enabled or disabled without redeploying the entire application.
