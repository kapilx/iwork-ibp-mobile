import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Box, Button, Typography } from "@mui/material";
import {
  apiRequest,
  endPoints,
  environment,
  formatAmountWithCurrency,
  useApiQuery,
  useLocalization,
} from "@ui/ui-lib";
import { setToastMessage } from "../../redux/slice";
import { usePoliciesFlags } from "../../hooks/usePoliciesFlags";
import ClaimSummary from "../../components/Dashboard/ClaimSummary";
import NoDataPage from "../../common/NoData";
import {
  ClaimsCornerContainer,
  HeaderRow,
  Heading,
  Section,
  SectionHeader,
  NoDataText,
  LifeEventCard,
  LifeEventImage,
  LifeEventContent,
  LifeEventTitle,
  LifeEventDescription,
  LifeEventButton,
  AddOnsGrid,
  AddOnCard,
  AddOnTitle,
  AddOnAmountRow,
  AddOnLabel,
  PremiumSummaryCard,
  PremiumRow,
  PremiumValue,
  PremiumImageContainer,
  InnerSectionHeader,
  DetailsContainer,
  AddOnSubTitle,
  AddOnCardContainer,
  ParentImg,
  Titlecontainer,
  CancelButton,
  FormButtonsContainer,
  SubmitButton,
  ClaimsCornerImage,
  HeaderSection,
  PolicyCard,
  NoPageContainer,
} from "./styles";
import ClaimsCornerIcon from "../../../assets/svgs/claims-corner-icon.svg";
import CommonLoader from "../../common/CommonLoader";
import LifeImage from "../../../assets/svgs/claims-banner-image.svg";
import PremiumImage from "../../assets/svgs/premium-calculator-card.svg";
import ArrowIcon from "../../../assets/svgs/updatenow-icon.svg";
import FamilyIcon from "../../../assets/svgs/family-icon.svg";
type PolicyType = "GMC" | "GPA" | "GTL" | string;

type ClaimsCornerPolicy = {
  policyId: number;
  policyType: PolicyType;
  policyName: string;
  policyNumber?: string | null;
  policyExpiry?: string | null;
  sumInsured?: number;
  claimsStatusCounts?: {
    total?: number;
    approved?: number;
    pending?: number;
    actionRequired?: number;
    settled?: number;
    inProgress?: number;
  };
  coverage?: {
    claimed?: number;
    available?: number;
  };
  claims?: {
    memberName: string;
    relation?: string | null;
    claimNumber: string;
    claimDate?: string | null;
    updatedAt?: string | null;
    claimAmount?: number;
    documentsLabel?: string | null;
    status?: string | null;
  }[];
  familyMembersCovered?: {
    name: string;
    relation: string;
  }[];
  lifeEventCta?: {
    show?: boolean;
    title?: string;
    description?: string;
    ctaPath?: string;
  };
  addOns?: {
    [key: string]: {
      title?: string;
      subTitle?: string;
      totalCoverage?: number;
      claimed?: number;
      available?: number;
      perDayLimit?: number;
      icon?: string;
    };
  };
  premiumSummary?: {
    totalPremium: number;
    companyContribution: number;
    employeeContribution: number;
    tax: number;
  };
  basePolicy?: {
    claims?: {
      memberName: string;
      relation?: string | null;
      claimNumber: string;
      claimDate?: string | null;
      updatedAt?: string | null;
      claimAmount?: number;
      documentsLabel?: string | null;
      status?: string | null;
    }[];
  };
};

type ClaimsCornerResponse = {
  policyTabs: { policyType: PolicyType; label: string }[];
  policies: ClaimsCornerPolicy[];
  lastSyncedAt?: string | null;
  totals: {
    totalPremium: number;
    companyContribution: number;
    employeeContribution: number;
    tax: number;
  };
};

// ─── TPA Live Claims ─────────────────────────────────────────────────────────

const MONTH_MAP: Record<string, string> = {
  Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
  Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
};

const parseExpiryToDate = (s: string | null | undefined): Date | null => {
  if (!s) return null;
  const parts = s.trim().split(" ");
  if (parts.length === 3) {
    const [dd, mon, yyyy] = parts;
    return new Date(Number(yyyy), Number(MONTH_MAP[mon ?? ""] ?? "01") - 1, Number(dd));
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

const toDDMMYYYY = (d: Date): string => {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${d.getFullYear()}`;
};

// Converts TPA date strings (DD/MM/YYYY or DD-MM-YYYY) to ISO YYYY-MM-DD
const parseTpaDate = (s: string | null | undefined): string | null => {
  if (!s) return null;
  const parts = s.trim().split(/[\/\-]/);
  if (parts.length === 3 && parts[0].length <= 2) {
    const [dd, mm, yyyy] = parts;
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }
  return s;
};

// Maps a single TPA claim object → internal claim shape used by ClaimSummary
const mapTpaClaim = (c: any) => ({
  memberName: c.PATIENT_NAME || c.EMPLOYEE_NAME || "—",
  relation: c.PATIENT_RELATION
    ? c.PATIENT_RELATION.charAt(0).toUpperCase() + c.PATIENT_RELATION.slice(1).toLowerCase()
    : "—",
  claimNumber: String(c.CLAIM_ID || c.PRE_AUTH_NO || "—"),
  claimDate: parseTpaDate(c.CLAIM_REG_DATE) || null,
  updatedAt: parseTpaDate(c.APPROVED_DATE || c.SETTLED_DATE || c.PRE_AUTH_STATUS_DATE) || null,
  claimAmount: Number(c.CLAIM_AMOUNT) || 0,
  claimSettledAmount: Number(c.APPROVED_AMOUNT) || 0,
  status: (c.CLAIM_STATUS || c.PRE_AUTH_STATUS || "—").toUpperCase(),
  claimDescription:
    [c.AILMENT, c.PROCEDURE_NAME].filter(Boolean).join(", ") || null,
  documentsLabel: c.DOCUMENT_REQUIRED || null,
});

// Builds the full ClaimsCornerPolicy from TPA raw claims + original policy shell
const mapTpaToPolicy = (
  tpaClaims: any[],
  policy: ClaimsCornerPolicy
): ClaimsCornerPolicy => {
  const mapped = tpaClaims.map(mapTpaClaim);
  const sumInsured = Number(tpaClaims[0]?.SUM_INSURED) || policy.sumInsured || 0;
  const balanceSI = Number(tpaClaims[0]?.BALANCE_SUM_INSURED) || sumInsured;
  const totalClaimed = mapped.reduce((s, c) => s + c.claimAmount, 0);
  const totalSettled = mapped
    .filter((c) => c.status === "SETTLED")
    .reduce((s, c) => s + c.claimSettledAmount, 0);

  return {
    ...policy,
    basePolicy: {
      coverage: {
        sumInsured,
        claimed: totalClaimed,
        settled: totalSettled,
        available: balanceSI,
      },
      claimsStatusCounts: {
        total: mapped.length,
        settled: mapped.filter((c) => c.status === "SETTLED").length,
        inProgress: mapped.filter((c) => c.status !== "SETTLED").length,
      },
      claims: mapped,
    },
  };
};

const TpaClaimsSection: React.FC<{
  policy: ClaimsCornerPolicy;
  employeeId?: number | string;
  onSyncStart?: () => void;
  onSyncEnd?: () => void;
  onClaimsFound?: () => void; // called when TPA returns claims — triggers overview refetch
}> = ({ policy, employeeId, onSyncStart, onSyncEnd, onClaimsFound }) => {
  const [tpaPolicy, setTpaPolicy] = useState<ClaimsCornerPolicy | null>(null);
  // const [loading, setLoading] = useState(false); // TPA sync disabled
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current || !policy.policyNumber) return;
    const expiry = parseExpiryToDate(policy.policyExpiry);
    if (!expiry) return;

    const endDate = toDDMMYYYY(expiry);
    const startD = new Date(expiry);
    startD.setFullYear(startD.getFullYear() - 1);
    startD.setDate(startD.getDate() + 1);
    const startDate = toDDMMYYYY(startD);

    fetched.current = true;
    // TPA sync temporarily disabled — caused prolonged loading times
    // setLoading(true);
    // onSyncStart?.();
    //
    // const doSync = (retryCount = 0) => {
    //   apiRequest(endPoints.tpaClaimsSync(policy.policyNumber, startDate, endDate, employeeId), {
    //     method: "GET",
    //   })
    //     .then((res) => {
    //       const result = (res as any)?.data ?? {};
    //       const list: any[] = result.claims ?? [];
    //       const isRefreshing: boolean = result.refreshing === true;
    //
    //       if (list.length > 0) {
    //         setTpaPolicy(mapTpaToPolicy(list, policy));
    //         setLoading(false);
    //         onSyncEnd?.();
    //         onClaimsFound?.();
    //       } else if (isRefreshing && retryCount < 20) {
    //         setTimeout(() => doSync(retryCount + 1), 15_000);
    //       } else {
    //         setLoading(false);
    //         onSyncEnd?.();
    //       }
    //     })
    //     .catch(() => { setLoading(false); onSyncEnd?.(); });
    // };
    //
    // doSync();
  }, [policy]);

  if (!policy.policyNumber) return null;

  // TPA sync loader disabled
  // if (loading) { return (<Section>...sync banner...</Section>); }

  if (!tpaPolicy) return null;

  return (
    <Section>
      <SectionHeader>TPA Live Claims</SectionHeader>
      <ClaimSummary
        summary={{ policies: [tpaPolicy] }}
        hideCoverToggle
        isTitleRequired={false}
      />
    </Section>
  );
};

// Claims raised via a MULTI-step TPA (FHPL, Health India) sit as INTIMATED until the
// user submits bills/bank details. Previously surfaced as a separate "Continue
// Submission" section (looked disconnected from the actual claim card) — now shown
// as a "Submit Claim" button directly on the claim's own card inside ClaimSummary,
// keyed off status === "Intimated" (see ClaimSummary/index.tsx).

const ClaimsCornerPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { localizationData } = useLocalization();
  // TPA sync disabled — loader/banner hidden
  // const [tpaSyncState, setTpaSyncState] = useState<"idle" | "syncing" | "done">("idle");
  // const handleSyncStart = useCallback(() => setTpaSyncState("syncing"), []);
  // const handleSyncEnd = useCallback(() => setTpaSyncState((s) => s === "syncing" ? "done" : s), []);
  // const isSyncingTpa = tpaSyncState === "syncing" || tpaSyncState === "idle";

  const userDetails = useMemo(
    () => JSON.parse(sessionStorage.getItem("user") || "{}"),
    [],
  );
  const employeeId = userDetails?.id;

  const { hasGMCPolicyForLifeEvents: hasGmcEnrolled, hasAnyPolicyForLifeEvents } = usePoliciesFlags();
  const {
    data: claimsOverviewResponse,
    isLoading,
    isFetching,
    refetch: refetchOverview,
  } = useApiQuery({
    queryKey: ["claimsCorner", employeeId],
    url: employeeId ? endPoints.employeeClaimsOverview(employeeId) : "",
    enabled: Boolean(employeeId),
  });
  // When background TPA fetch completes with claims, refresh the overview
  // so the sync banner clears and the claims become visible
  const handleClaimsFound = useCallback(() => {
    void refetchOverview();
  }, [refetchOverview]);

  const { data: employeePoliciesData } = useApiQuery({
    queryKey: ["employeePoliciesForClaims", employeeId],
    url: employeeId ? endPoints.employeePolicies(employeeId) : "",
    enabled: Boolean(employeeId),
  });


  const isEnrollmentWindowOpen = useMemo(() => {
    const policiesPayload =
      (employeePoliciesData as any)?.data?.data ??
      (employeePoliciesData as any)?.data ??
      null;
    const allPolicies: any[] = [
      ...(policiesPayload?.employeePolicies ?? []),
      ...(policiesPayload?.enrolledPolicies ?? []),
    ];
    if (!allPolicies.length) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return allPolicies.some((policy: any) => {
      const endDate = policy?.enrollmentEndDate ? new Date(policy.enrollmentEndDate) : null;
      if (!endDate || isNaN(endDate.getTime())) return false;
      const isWindowOpen = today <= endDate;
      const isEnrolled = policy?.employeeEnrollmentStatusKey === "EMPLOYEE_ENROLLMENT_STATUS_ENROLLED";
      return isWindowOpen || !isEnrolled;
    });
  }, [employeePoliciesData]);

  const { refetch: fetchTpaPortalSso, isFetching: isSsoFetching } = useApiQuery({
    queryKey: ["tpaPortalSso", employeeId],
    url: employeeId ? endPoints.employeeTpaPortalSso(employeeId) : "",
    enabled: false,
    config: { retry: 0 },
  });

  const handleTpaPortalClick = async () => {
    try {
      const result = await fetchTpaPortalSso();
      const redirectUrl = (result?.data as any)?.data?.redirectUrl ?? (result?.data as any)?.redirectUrl;
      if (redirectUrl) {
        window.open(redirectUrl, "_blank", "noopener,noreferrer");
      } else {
        const msg = (result?.failureReason as any)?.message ?? "TPA portal is not available.";
        dispatch(setToastMessage({ message: msg, type: "error" }));
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? "TPA portal is not available.";
      dispatch(setToastMessage({ message: msg, type: "error" }));
    }
  };

  const claimsCornerData: ClaimsCornerResponse | undefined =
    (claimsOverviewResponse as any)?.data?.data ??
    (claimsOverviewResponse as any)?.data;


  if ((isLoading || isFetching) && !claimsCornerData) {
    return (
      <ClaimsCornerContainer>
        <CommonLoader />
      </ClaimsCornerContainer>
    );
  }

  if (!claimsCornerData?.policies || claimsCornerData.policies.length === 0) {
    return (
      <NoDataPage
        breadcrumbText="Claims Corner"
        title="No claims were found. Glad to know you and your family are healthy."
        subtitle="You don't have any claims at the moment. When you do, they will appear here for easy tracking and management."
        onBreadcrumbClick={() => navigate("/dashboard")}
      />
    );
  }

  // Check if enrolledPolicies has policyTypeKey that includes POLICY_TYPE_GMC (covers GMC and TOP-UP)
  // const GMC_POLICY_TYPE_KEY = "POLICY_TYPE_GMC";
  // const enrolledPolicies = Array.isArray(policiesData?.data?.enrolledPolicies)
  //   ? policiesData.data.enrolledPolicies
  //   : [];
  // const hasGmcEnrolled = enrolledPolicies.some((p: any) => p.policyTypeKey?.includes(GMC_POLICY_TYPE_KEY));
  // Check if all policies have no claims (in both policy.claims and policy.basePolicy.claims)
  const allPoliciesNoClaims = claimsCornerData?.policies?.every(
    (policy) => {
      const claims = Array.isArray(policy.claims) ? policy.claims : [];
      const baseClaims = policy.basePolicy && Array.isArray(policy.basePolicy.claims) ? policy.basePolicy.claims : [];
      return claims.length === 0 && baseClaims.length === 0;
    }
  );

  // TPA sync banner + hidden sections disabled
  if (allPoliciesNoClaims) {
    return (
      <ClaimsCornerContainer>
        <HeaderSection>
          <HeaderRow onClick={() => navigate(-1)}>
            <ClaimsCornerImage src={ClaimsCornerIcon} alt="Claims Corner" />
            <Heading>Claims Corner</Heading>
          </HeaderRow>
          <FormButtonsContainer>
            <CancelButton variant="outlined" onClick={handleTpaPortalClick} disabled={isSsoFetching || isEnrollmentWindowOpen}>
              {isSsoFetching ? "Redirecting..." : "TPA Portal"}
            </CancelButton>
            <SubmitButton variant="contained" onClick={() => navigate("/claims-intimation")} disabled={isEnrollmentWindowOpen}>
              Claim Submission
            </SubmitButton>
          </FormButtonsContainer>
        </HeaderSection>
        <NoPageContainer>
          <NoDataPage
            title="No claims found"
            subtitle="You and your family haven't made any claims yet. Glad to know everyone is doing well! Your claim history will appear here once a claim is submitted."
            showFlyingBirds={true}
            showDivider={true}
            compactView={true}
          />
        </NoPageContainer>
        {/* TPA sync hidden sections disabled
        <div style={{ display: "none" }}>
          {claimsCornerData?.policies?.map((policy) => (
            <TpaClaimsSection
              key={policy.policyId}
              policy={policy}
              employeeId={employeeId}
              onSyncStart={handleSyncStart}
              onSyncEnd={handleSyncEnd}
              onClaimsFound={handleClaimsFound}
            />
          ))}
        </div>
        */}
      </ClaimsCornerContainer>
    );
  }

  return (
    <ClaimsCornerContainer>
      <HeaderSection>
        <HeaderRow onClick={() => navigate(-1)}>
          <ClaimsCornerImage src={ClaimsCornerIcon} alt="Claims Corner" />
          <Heading>Claims Corner</Heading>
          {claimsCornerData?.lastSyncedAt && (() => {
            const d = new Date(claimsCornerData.lastSyncedAt!);
            return !isNaN(d.getTime()) ? (
              <span style={{ fontSize: 13, color: "#6B7280", fontWeight: 400, marginLeft: 10, whiteSpace: "nowrap" }}>
                Last synced at:{" "}
                {d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })},{" "}
                {d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }).toUpperCase()}
              </span>
            ) : null;
          })()}
        </HeaderRow>
        <FormButtonsContainer>
          <CancelButton
            variant="outlined"
            onClick={handleTpaPortalClick}
            disabled={isSsoFetching || isEnrollmentWindowOpen}
          >
            {isSsoFetching ? "Redirecting..." : "TPA Portal"}
          </CancelButton>
          <SubmitButton
            variant="contained"
            onClick={() => navigate("/claims-intimation")}
            disabled={isEnrollmentWindowOpen}
          >
            Claim Submission
          </SubmitButton>
        </FormButtonsContainer>
      </HeaderSection>

      {allPoliciesNoClaims ? (
        <NoPageContainer>
          <NoDataPage
            title="No claims found"
            subtitle="You and your family haven't made any claims yet. Glad to know everyone is doing well! Your claim history will appear here once a claim is submitted."
            showFlyingBirds={true}
            showDivider={true}
            compactView={true}
          />
        </NoPageContainer>
      ) : (
        <>
          {claimsCornerData?.policies?.map((policy) => {
            const summaryData = { policies: [policy] };

            return (
              <PolicyCard key={policy.policyId}>
                {/* Hide policy name if basePolicy.claims is empty array */}
                {!(
                  policy.basePolicy &&
                  Array.isArray(policy.basePolicy.claims) &&
                  policy.basePolicy.claims.length === 0
                ) && (
                  <>
                  {/* <PolicyHeaderRow>
                    <PolicyBadge gradient={policyIconData.gradient}>
                      {policyIconData.initials}
                    </PolicyBadge>
                    <PolicyName>{policy.policyName}</PolicyName>
                  </PolicyHeaderRow> */}
                

                <Section>
                  {summaryData ? (
                    <ClaimSummary
                      summary={summaryData}
                      hideCoverToggle
                      isTitleRequired={false}
                      employeeId={employeeId}
                      onRefresh={() => void refetchOverview()}
                      isRefreshing={isFetching}
                    />
                  ) : (
                    <NoDataText>
                      No data available for the selected policy.
                    </NoDataText>
                  )}
                </Section>

                {/* TPA sync disabled: <TpaClaimsSection policy={policy} employeeId={employeeId} onSyncStart={handleSyncStart} onSyncEnd={handleSyncEnd} onClaimsFound={handleClaimsFound} /> */}
                </>
)}
                {policy.addOns && Object.keys(policy.addOns).length > 0 && (
                  <Section>
                    <SectionHeader>Add-on Coverage</SectionHeader>
                    <AddOnsGrid>
                      {Object.entries(policy.addOns).map(([addOnKey, addOn]) => (
                        <AddOnCard key={addOnKey}>
                          <AddOnCardContainer>
                            <ParentImg
                              src={addOn.icon ?? FamilyIcon}
                              alt={`${addOn.title} Icon`}
                            />
                            <Titlecontainer>
                              <AddOnTitle>{addOn.title}</AddOnTitle>
                              <AddOnSubTitle>{addOn.subTitle}</AddOnSubTitle>
                            </Titlecontainer>
                          </AddOnCardContainer>
                          <DetailsContainer>
                            <AddOnAmountRow>
                              <PremiumValue>
                                {addOn.perDayLimit
                                  ? `${formatAmountWithCurrency(addOn.perDayLimit, localizationData?.data)}/day`
                                  : `${formatAmountWithCurrency(addOn.totalCoverage ?? 0, localizationData?.data)}`}
                              </PremiumValue>
                              <AddOnLabel>Total Coverage</AddOnLabel>
                            </AddOnAmountRow>
                            <AddOnAmountRow>
                              <PremiumValue>
                                {formatAmountWithCurrency(addOn.claimed ?? 0, localizationData?.data)}
                              </PremiumValue>
                              <AddOnLabel>Claimed Amount</AddOnLabel>
                            </AddOnAmountRow>
                            <AddOnAmountRow>
                              <PremiumValue>
                                {formatAmountWithCurrency(addOn.available ?? 0, localizationData?.data)}
                              </PremiumValue>
                              <AddOnLabel>Available</AddOnLabel>
                            </AddOnAmountRow>
                          </DetailsContainer>
                        </AddOnCard>
                      ))}
                    </AddOnsGrid>
                  </Section>
                )}

                {policy.premiumSummary && (
                  <Section>
                    <PremiumSummaryCard>
                      <PremiumImageContainer>
                        <img src={PremiumImage} alt="Premium Design" />
                      </PremiumImageContainer>
                      <InnerSectionHeader>Total Premium Summary</InnerSectionHeader>
                      <PremiumRow>
                        <PremiumValue>
                          {formatAmountWithCurrency(policy.premiumSummary.totalPremium ?? 0, localizationData?.data)}
                        </PremiumValue>
                        <AddOnLabel>Total Premium</AddOnLabel>
                      </PremiumRow>
                      <PremiumRow>
                        <PremiumValue>
                          {formatAmountWithCurrency(
                            policy.premiumSummary.companyContribution ?? 0,
                            localizationData?.data,
                          )}
                        </PremiumValue>
                        <AddOnLabel>Company Contribution</AddOnLabel>
                      </PremiumRow>
                      <PremiumRow>
                        <PremiumValue>
                          {formatAmountWithCurrency(
                            policy.premiumSummary.employeeContribution ?? 0,
                            localizationData?.data,
                          )}
                        </PremiumValue>
                        <AddOnLabel>Your Contribution</AddOnLabel>
                      </PremiumRow>
                      <PremiumRow>
                        <PremiumValue>
                          {formatAmountWithCurrency(policy.premiumSummary.tax ?? 0, localizationData?.data)}
                        </PremiumValue>
                        <AddOnLabel>Total Tax</AddOnLabel>
                      </PremiumRow>
                    </PremiumSummaryCard>
                  </Section>
                )}
              </PolicyCard>
            );
          })}
        </>
      )}

      {/* Show Life Event section only if GMC policy is present and has at least one claim */}
      {/* {gmcPolicy && ( */}
        <Section>
          <LifeEventCard>
            <LifeEventImage>
              <img src={LifeImage} alt="Life Event" />
            </LifeEventImage>
            <LifeEventContent>
              <LifeEventTitle>
                Had a recent life event? Update your insurance coverage now.
              </LifeEventTitle>
              <LifeEventDescription>
                You can update your dependents under the Group Mediclaim Policy in
                case of life events such as: Birth of a child, Marriage, Loss of a
                family member
              </LifeEventDescription>
              {/* <LifeEventContainer> */}
                <LifeEventButton
                  onClick={() => {
                    if (!environment.featureFlag.FF_LIFE_EVENT_DEPENDENT_MANAGEMENT || !hasAnyPolicyForLifeEvents) {
                      dispatch(setToastMessage({ message: "The Life Events feature can be accessed only after the enrolment period is completed.", type: "error" }));
                      return;
                    }
                    navigate("/life-events");
                  }}
                >
                  Update now
                </LifeEventButton>
              {/* </LifeEventContainer> */}
            </LifeEventContent>
          </LifeEventCard>
        </Section>
      {/* )} */}

    </ClaimsCornerContainer>
  );
};

export default ClaimsCornerPage;
