# Spec: Proper Bypass Handling for Premium-Based Inception

Status: Draft
Owner: IBP / Policy
Date: 2026-05-21

## 1. Background

Today, when a policy has the policy-details flag `isEnrolmentPremiumBased = YES` (lookup `toggleTypeYesId`), the inception/enrollment flow silently bypasses the standard policy-configuration checks. Effectively, the user can perform inception even when the policy is **not activated** — no approval of policy details, CD, covers, or configuration is enforced.

The current bypass logic lives in:

- [policy.service.ts](apps/services/policy-service/src/app/policy/policy.service.ts) → `shouldBypassPolicyConfigurationForInception()`
- [premium-calculator.util.ts](apps/services/service-lib/src/lib/utils/premium-calculator.util.ts) → `isBypassEnroll` / `isDepBypass`
- [enrollment-upload.scheduler.ts](apps/services/scheduler-service/src/app/scheduler/enrollment-upload.scheduler.ts) → directly processes bypass-mode uploads without configuration validation.

This is too permissive. Inception should still require the policy to be activated; only the configuration approval step should be bypassed for premium-based policies.

## 2. Goal

Keep `isEnrolmentPremiumBased` as the single source of truth, but change its effect so that:

1. Policy activation is **still required** before any enrollment/inception can run.
2. Within policy activation, only the **Configure Policy** step is bypassed (auto-satisfied / hidden). The other three approvals — Policy Details, Covers, CD — remain mandatory.
3. The "Inception Data Type" dropdown in Endorsement Data Upload reflects the bypass flag — the irrelevant data-type option is hidden in each mode.

## 3. Scope

### 3.1 In scope

- Frontend behaviour of the policy activation gating in [PolicyDetails/index.tsx](apps/ui/iwork/src/app/pages/CompanyPage/PolicyDetails/index.tsx).
- Frontend options list in [EndorsementDataUpload/config.ts](apps/ui/iwork/src/app/pages/EndorsementPage/EndorsementDataUpload/config.ts).
- Backend guard so that inception cannot proceed unless the policy is activated (LIVE) — only the *configuration step* part of the gate is bypassed, never the activation status itself.

### 3.2 Out of scope

- Adding a new approval-section enum value `POLICY_CONFIGURATION`. We will reuse the existing `configurationStatus` (CONFIGURATION_STATUS.LIVE / COMPLETED) and the existing `POLICY_SECTION_APPROVAL_SECTIONS` (POLICY_DETAILS, POLICY_COVERS, POLICY_CD).
- Changes to per-enrollment numeric fields `bypassPremiumAmount` / `bypassSumInsured` (still used at the row level, unchanged).

## 4. Current behaviour (as of this spec)

### 4.1 Policy activation gate

[PolicyDetails/index.tsx:1198-1228](apps/ui/iwork/src/app/pages/CompanyPage/PolicyDetails/index.tsx#L1198-L1228)

    const areRequiredSectionsApproved =
      statusKey.basicDetailsStatus === SECTION_STATUS.APPROVED &&
      statusKey.coversDetailsStatus === SECTION_STATUS.APPROVED &&
      statusKey.cdDetails === SECTION_STATUS.APPROVED;

    const isLive = configureStatus === CONFIGURATION_STATUS.LIVE;
    const isComplete = configureStatus === CONFIGURATION_STATUS.COMPLETED;

    const isActivatePolicyDisabled =
      (isGroupPolicyType && !isComplete && !isLive) ||
      !areRequiredSectionsApproved;

The activation toast pushes a 4th pending item — `CONFIGURE_POLICY_LABEL` — into the message whenever `isGroupPolicyType && !isComplete && !isLive`.

### 4.2 Bypass on inception (backend)

[policy.service.ts: shouldBypassPolicyConfigurationForInception()](apps/services/policy-service/src/app/policy/policy.service.ts) currently returns `true` if `inception === true && policy.isEnrolmentPremiumBasedLid === toggleTypeYes`, which causes downstream code to skip the policy-configuration lookup entirely — including the implicit "is policy live?" check.

### 4.3 Data type dropdown

[EndorsementDataUpload/config.ts:52-62](apps/ui/iwork/src/app/pages/EndorsementPage/EndorsementDataUpload/config.ts#L52-L62)

    options: [
      { value: TEMP_NUM, label: "Employee + Dependents Data with Insurance Benefits" },
      { value: ENROLLMENT_TEMP_NUM, label: "Only Employee Data" },
      ...(FF_IWORK_ENROLMENT_PREMIUM_BASED
        ? [{ value: BYPASS_ENROLLMENT_TEMP_NUM, label: "Employee Details with Premiums" }]
        : []),
    ]

The third option is currently feature-flagged on globally rather than driven by the policy's bypass flag.

## 5. Target behaviour

### 5.1 Policy activation gate — Configure Policy step

When `isEnrolmentPremiumBased === toggleTypeYesId`:

- The **Configure Policy** button/section in the activation flow is **hidden**.
- The "Configure Policy" pending item is **not** pushed into `pendingItems` for the activation toast.
- `isActivatePolicyDisabled` ignores the `(isGroupPolicyType && !isComplete && !isLive)` clause.
- The other three approvals (`basicDetailsStatus`, `coversDetailsStatus`, `cdDetails`) remain required.

When `isEnrolmentPremiumBased !== toggleTypeYesId`: behaviour is unchanged.

### 5.2 Backend inception guard

`shouldBypassPolicyConfigurationForInception()` is renamed semantically to mean "skip configuration validation only". The function must continue to require the policy to be **activated** (status active / LIVE) before allowing inception to proceed. Concretely:

- The caller(s) of this function in [enrollment-upload.scheduler.ts](apps/services/scheduler-service/src/app/scheduler/enrollment-upload.scheduler.ts) and [policy.service.ts](apps/services/policy-service/src/app/policy/policy.service.ts) must, before processing a bypass-mode upload, assert that `policy.headerDetails.status === "active"` (or the equivalent active status). If not active, throw a validation error matching the existing activation-required error.
- The check that previously skipped is the **policy-configuration lookup** only — relationship loading from LIVE config and premium recalculation. Activation status must still be enforced.

### 5.3 Data type dropdown

The third option (`BYPASS_ENROLLMENT_TEMP_NUM` — "Employee Details with Premiums") becomes driven by the policy's `isEnrolmentPremiumBased` flag, not by `FF_IWORK_ENROLMENT_PREMIUM_BASED` alone:

| isEnrolmentPremiumBased | Option 1 (Emp+Dep+Benefits, TEMP_NUM) | Option 2 (Only Employee Data, ENROLLMENT_TEMP_NUM) | Option 3 (Premiums, BYPASS_ENROLLMENT_TEMP_NUM) |
| ----------------------- | ------------------------------------- | -------------------------------------------------- | ----------------------------------------------- |
| NO                      | shown                                 | shown                                              | hidden                                          |
| YES                     | hidden                                | shown                                              | shown                                           |

The existing `FF_IWORK_ENROLMENT_PREMIUM_BASED` feature flag continues to gate the *availability* of the premium-based feature; once enabled, the per-policy bypass flag drives the option visibility. If the FF is off, the table behaves like the NO row (option 3 hidden) regardless of the policy flag.

## 6. Implementation plan

### Step 1 — Frontend: activation gate

File: [apps/ui/iwork/src/app/pages/CompanyPage/PolicyDetails/index.tsx](apps/ui/iwork/src/app/pages/CompanyPage/PolicyDetails/index.tsx)

- Use the existing `isEnrolmentPremiumBased` boolean (line 1222-1223) inside `isActivatePolicyDisabled` and inside `activationBlockersMessage`.
- Update `isActivatePolicyDisabled` to:

        const requiresConfigure = isGroupPolicyType && !isEnrolmentPremiumBased;
        const isActivatePolicyDisabled =
          (requiresConfigure && !isComplete && !isLive) ||
          !areRequiredSectionsApproved;

- Update `activationBlockersMessage` to push `CONFIGURE_POLICY_LABEL` only when `requiresConfigure && !isComplete && !isLive`.
- Hide the "Configure Policy" button itself in the activation card: wrap its render block in `{!isEnrolmentPremiumBased && (...)}` (button location to confirm during implementation — likely the tab/section rendered when `isGroupPolicyType && !isComplete && !isLive`).

### Step 2 — Frontend: data type dropdown

File: [apps/ui/iwork/src/app/pages/EndorsementPage/EndorsementDataUpload/config.ts](apps/ui/iwork/src/app/pages/EndorsementPage/EndorsementDataUpload/config.ts)

- Convert the static `EndorsementDataUploadConfig` into a builder function (e.g. `getEndorsementDataUploadConfig(isEnrolmentPremiumBased: boolean)`) so the `documentType.options` list is computed from the policy flag.
- Update the caller (the page that imports this config) to pass `isEnrolmentPremiumBased` derived from policy details state.
- Option logic:

        const options = [
          !isEnrolmentPremiumBased && { value: TEMP_NUM, label: "Employee + Dependents Data with Insurance Benefits" },
          { value: ENROLLMENT_TEMP_NUM, label: "Only Employee Data" },
          isEnrolmentPremiumBased && FF_IWORK_ENROLMENT_PREMIUM_BASED && {
            value: BYPASS_ENROLLMENT_TEMP_NUM,
            label: "Employee Details with Premiums",
          },
        ].filter(Boolean);

### Step 3 — Backend: enforce activation under bypass

Files:

- [apps/services/policy-service/src/app/policy/policy.service.ts](apps/services/policy-service/src/app/policy/policy.service.ts) — `shouldBypassPolicyConfigurationForInception()`
- [apps/services/scheduler-service/src/app/scheduler/enrollment-upload.scheduler.ts](apps/services/scheduler-service/src/app/scheduler/enrollment-upload.scheduler.ts) — bypass branch

Changes:

- Keep `shouldBypassPolicyConfigurationForInception()` semantics narrow: "skip configuration lookup", not "skip everything".
- Before entering the bypass branch in the scheduler, fetch the policy header status and assert active. If not active, abort the document with the same error message the UI uses for "policy not activated".
- Add a unit test for `shouldBypassPolicyConfigurationForInception()` covering: (a) bypass policy in active state → returns true; (b) bypass policy not active → throws / returns false-with-error; (c) non-bypass policy → unchanged.

### Step 4 — Tests / verification

- Frontend: render PolicyDetails page in both modes (YES/NO of `isEnrolmentPremiumBased`) and verify:
    - Configure Policy button visibility.
    - Activation toast text.
    - Activate button enabled state once the 3 sections are approved (regardless of `configureStatus`) when bypass=YES.
- Frontend: render EndorsementDataUpload with both flag values and assert the correct two options appear.
- Backend: integration test on the scheduler — uploading a `policy_employee_bypass_enrollment` document for a non-active policy must fail; for an active policy it must proceed.

## 7. Open items / risks

- `isGroupPolicyType` interaction: bypass is only meaningful for group policies (the configure step exists only there). For non-group policies the behaviour is unchanged.
- Existing in-flight uploads created before this change: if any bypass-mode policy is currently un-activated and has rows in flight, those will now fail validation. We accept this — it matches the intended invariant.
- Wording of the "policy not activated" error must match the existing UX so we do not introduce a new surface.

## 8. Rollout

Single PR covering all three steps. No feature flag; the new behaviour is the correct behaviour. The existing `FF_IWORK_ENROLMENT_PREMIUM_BASED` flag remains as the master gate for the premium-based feature.
