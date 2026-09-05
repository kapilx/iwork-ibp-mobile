import { useCallback, useMemo, useState } from "react";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { endPoints, useApiMutation, useApiQuery } from "@ui/ui-lib";
import { setToastMessage } from "../../redux/slice";
import { RootState } from "../../redux/store";
import DependentsAcknowledgementModal from "./DependentsAcknowledgementModal";

import DependentRulesCard from "./DependentRulesCard";
import DependentsSection from "./DependentsSection";
import { getDependentRelationConfig } from "../../utils/companyConfig";
import {
  buildConstraintsFromConfig,
  buildRelationshipsFromConfig,
  buildSelfDependent,
  DEFAULT_CONSTRAINTS,
  DEFAULT_RELATIONSHIPS,
  normalizeDependents,
  normalizeToIsoDate,
  resolveMaxDependentCountOverall,
} from "./utils";
import {
  BackButton,
  BlueStrip,
  ContentWrapper,
  DashboardGrid,
  FormActions,
  InfoBanner,
  InfoBannerIcon,
  InfoBannerText,
  PageHeader,
  PageTitle,
  PageWrapper,
  SubmitActionButton
} from "./styles";

const ManageDependents = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showAcknowledgement, setShowAcknowledgement] = useState(false);

  const { mutate: notifyAddedDependents } = useApiMutation({});

  const userDetails = JSON.parse(sessionStorage.getItem("user") || "{}");
  const employeeId = userDetails?.id;
  const companyId = userDetails?.companyId;

  const { data: employeeDetailsResponse, refetch: refetchEmployeeDetails } =
    useApiQuery({
      queryKey: ["employeeDetails", employeeId],
      url: employeeId ? endPoints.employeeDetails : "",
      enabled: Boolean(employeeId),
    });

  // Relationship options, constraints and per-group max-counts come from the
  // company's configured dependentRelationConfig when present; otherwise the
  // frontend default config applies.
  //
  // Two sources, in priority order:
  // 1. state.portalConfig.data.dependentRelationConfig — populated post-login by
  //    fetchPortalConfiguration (portalConfigSlice.ts), which is what's actually
  //    live during an authenticated session (ibp_portal_configuration in
  //    sessionStorage). This is the one that reflects real-time company config.
  // 2. getDependentRelationConfig() — reads company_config in sessionStorage,
  //    populated only by the pre-login/branding CompanyConfigInitializer flow.
  //    Kept as a fallback for any path where that initializer did run.
  const portalConfigDependentRelationConfig = useSelector(
    (state: RootState) => state.portalConfig.data?.dependentRelationConfig,
  );
  // Treat an empty `relations` the same as absent — mirrors getDependentRelationConfig()'s
  // own guard, so a future config save of `{}`/`{relations:{}}` can't silently zero out
  // every relation (childrenMax/parentsMax/spouse would all compute to 0) instead of
  // falling back to DEFAULT_RELATIONSHIPS.
  const hasConfiguredRelations =
    portalConfigDependentRelationConfig?.relations &&
    Object.keys(portalConfigDependentRelationConfig.relations).length > 0;
  const dependentRelationConfig = useMemo(
    () =>
      hasConfiguredRelations
        ? portalConfigDependentRelationConfig
        : getDependentRelationConfig(),
    [hasConfiguredRelations, portalConfigDependentRelationConfig],
  );
  const relationships = useMemo(
    () =>
      dependentRelationConfig
        ? buildRelationshipsFromConfig(dependentRelationConfig)
        : DEFAULT_RELATIONSHIPS,
    [dependentRelationConfig],
  );
  const constraints = useMemo(
    () =>
      dependentRelationConfig
        ? buildConstraintsFromConfig(dependentRelationConfig)
        : DEFAULT_CONSTRAINTS,
    [dependentRelationConfig],
  );

  const dependents = useMemo(() => {
    const payload = employeeDetailsResponse as any;
    const raw =
      payload?.data?.dependents ?? payload?.data?.data?.dependents ?? [];
    const family = normalizeDependents(raw);
    // Prefill the employee's own (Self) row at the top — read-only, mirrors the
    // enrollment flow's FamilyMembersManagement. Self is not addable via the form.
    const self = buildSelfDependent(payload);
    return self ? [self, ...family] : family;
  }, [employeeDetailsResponse]);

  const employeeGender = useMemo(() => {
    const payload = employeeDetailsResponse as any;
    const g = payload?.data?.gender ?? payload?.data?.data?.gender;
    return String(g ?? "").toLowerCase();
  }, [employeeDetailsResponse]);

  const employeeAdditionalDetails = useMemo(() => {
    const payload = employeeDetailsResponse as any;
    return payload?.data?.additionalDetails ?? payload?.data?.data?.additionalDetails;
  }, [employeeDetailsResponse]);

  // A dependent added outside a Life Event (this screen) should carry the employee's own
  // effective date, not "today" — mirrors MultiEnrollment/index.tsx's employeeEffectiveDate memo.
  // additionalDetails is company-configured free-form JSON (populated from each company's own
  // enrollment upload template), so "Effective Date" can arrive as "YYYY/MM/DD", "YYYY-MM-DD",
  // or other separators depending on how that company's sheet stored it — normalized to strict
  // "YYYY-MM-DD" here since this value flows straight into UpsertEnrollmentDependentDto's
  // effectiveDate field, which is validated with @IsDateString() (strict ISO 8601, rejects
  // slash-separated dates outright with a 400). Manual split, not `new Date(...)`, to avoid any
  // timezone-shift risk on a pure calendar date with no time component.
  const employeeEffectiveDate = normalizeToIsoDate(employeeAdditionalDetails?.["Effective Date"]) ?? null;

  // Same call Dashboard uses to decide whether to route here at all
  // (Dashboard/index.tsx:267-268) — this screen only ever shows when EVERY
  // eligible policy has `addOnlyDependents === true`, so we scope the
  // "Max Dependent Count" parameter lookup to those same policy ids only.
  const { data: employeePoliciesResponse } = useApiQuery({
    queryKey: ["employeePolicies", employeeId],
    url: employeeId ? endPoints.employeePolicies(employeeId) : "",
    enabled: Boolean(employeeId),
  });

  const addOnlyDependentsPolicyIds = useMemo(() => {
    const payload = employeePoliciesResponse as any;
    const data = payload?.data?.data ?? payload?.data ?? {};
    const all = [...(data.employeePolicies ?? []), ...(data.enrolledPolicies ?? [])];
    return new Set(
      all
        .filter((policy: any) => policy?.addOnlyDependents === true)
        .map((policy: any) => policy?.policyId),
    );
  }, [employeePoliciesResponse]);

  // Fetches parameter config only for the addOnlyDependents-true policies
  // above, purely to resolve the optional overall "Max Dependent Count"
  // parameter (see resolveMaxDependentCountOverall) — if none of those
  // policies has it configured, this resolves to undefined and the rest of
  // this screen behaves exactly as it does today.
  const { data: relationsDetailsResponse } = useApiQuery({
    queryKey: ["relationsConstraintsDependents", employeeId],
    url: employeeId ? endPoints.getRelationDetails(Number(employeeId)) : "",
    enabled: Boolean(employeeId) && addOnlyDependentsPolicyIds.size > 0,
  });

  const maxDependentCountOverall = useMemo(() => {
    if (addOnlyDependentsPolicyIds.size === 0) return undefined;
    const payload = relationsDetailsResponse as any;
    const policies = payload?.data?.data ?? payload?.data ?? [];
    if (!Array.isArray(policies)) return undefined;
    const policiesParameters = policies
      .filter((p: any) => addOnlyDependentsPolicyIds.has(p?.policyId))
      .map((p: any) => p?.configuration?.policyComponentsConfiguration?.parameters);
    return resolveMaxDependentCountOverall(policiesParameters, employeeAdditionalDetails);
  }, [relationsDetailsResponse, employeeAdditionalDetails, addOnlyDependentsPolicyIds]);

  const handleChanged = useCallback(async () => {
    await refetchEmployeeDetails();
  }, [refetchEmployeeDetails]);

  const handleSubmit = useCallback(() => {
    // Guards against pre-existing dependents (added before this parameter was
    // configured, or via a different flow) that already exceed the resolved
    // overall cap — the add-time restriction only blocks NEW additions once
    // the cap is hit, it doesn't retroactively flag an already-over-limit set.
    const dependentCount = dependents.filter((d) => !d.isSelf).length;
    if (
      maxDependentCountOverall !== undefined &&
      dependentCount > maxDependentCountOverall
    ) {
      dispatch(
        setToastMessage(
          `As per your configuration, you can only add ${maxDependentCountOverall} dependent${
            maxDependentCountOverall === 1 ? "" : "s"
          }. Please remove ${dependentCount - maxDependentCountOverall} dependent${
            dependentCount - maxDependentCountOverall === 1 ? "" : "s"
          } before submitting.`,
        ),
      );
      return;
    }

    setShowAcknowledgement(true);
    if (employeeId && dependents.length) {
      notifyAddedDependents({
        endpoint: endPoints.addedDependentsConfirmation,
        method: "POST",
        data: {
          employeeId: Number(employeeId),
          companyId: Number(companyId),
          dependents: dependents.map((dependent) => ({
            name: dependent.name,
            relation: dependent.relationship,
          })),
        },
      });
    }
  }, [
    companyId,
    dependents,
    dispatch,
    employeeId,
    navigate,
    notifyAddedDependents,
    maxDependentCountOverall,
  ]);

  return (
    <PageWrapper>
      <BlueStrip />

      <ContentWrapper>
        <PageHeader>
          <BackButton aria-label="Go back" onClick={() => navigate(-1)}>
            <ArrowBackIosNewIcon fontSize="small" />
          </BackButton>
          <PageTitle>Manage Dependents</PageTitle>
        </PageHeader>

        {/* <InfoBanner>
          <InfoBannerIcon>
            <InfoOutlinedIcon />
          </InfoBannerIcon>
          <InfoBannerText>
            Your organization's policy setup is currently in progress.{" "}
            <b>Enrollment is not available yet.</b> You can add or update your
            dependents now so they are ready when enrollment opens.
          </InfoBannerText>
        </InfoBanner> */}

        <DashboardGrid>

          <DependentsSection
            employeeId={employeeId}
            companyId={companyId}
            dependents={dependents}
            relationships={relationships}
            constraints={constraints}
            employeeGender={employeeGender}
            employeeEffectiveDate={employeeEffectiveDate}
            onChanged={handleChanged}
            maxDependentCountOverall={maxDependentCountOverall}
          />
          {/* <DependentRulesCard
            relationships={relationships}
            constraints={constraints}
            employeeGender={employeeGender}
          /> */}
        </DashboardGrid>

        <FormActions>
          <SubmitActionButton
            variant="contained"
            onClick={handleSubmit}
            disabled={showAcknowledgement}
          >
            Submit
          </SubmitActionButton>
        </FormActions>
      </ContentWrapper>

      {showAcknowledgement && (
        <DependentsAcknowledgementModal onClose={() => navigate("/")} />
      )}
    </PageWrapper>
  );
};

export default ManageDependents;
