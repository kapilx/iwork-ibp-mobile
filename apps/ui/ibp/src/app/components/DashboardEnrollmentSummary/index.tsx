import DashboardAccordion from "../../common/DashboardAccordian";
import CalculateIcon from "../../assets/svgs/calculator.svg";
import PremiumCalculatorNoContentBg from "../../assets/svgs/premium-calculator-no-content-bg.svg";
import {
  EnrollmentSummaryContainer,
  SummaryTitle,
  HeaderWrapper,
  AccordionsWrapper,
  AccordionHeaderWrapper,
  AccordionTitle,
  AccordionContentWrapper,
  AccordionItemRow,
  AccordionItemLabel,
  AccordionItemValue,
  SummarySectionWrapper,
  SummaryRowWrapper,
  SummaryLabel,
  SummaryValue,
  AccordianAmountContainer,
  AccordianTotalPremiumText,
  AccordionAmount,
  YourTotalPay,
  StyledAccordianWrapperContainer,
  EmptyStateWrapper,
  EmptyStateIllustration,
  EmptyStateText,
} from "./styles";
import { useState } from "react";
import {
  useLocalization,
  formatAmountWithCurrency,
  getTaxLabel,
  type LocalizationConfig,
} from "@ui/ui-lib";

type SummaryRowProps = {
  label: string;
  value: string | number;
  bold?: boolean;
  color?: boolean;
};

const formatAmount = (
  value: number | string | undefined,
  localization?: LocalizationConfig,
) => {
  if (value === null || value === undefined) return "--";

  const rawValue =
    typeof value === "string" ? value.replace(/[^0-9.-]/g, "") : value;

  const numericValue = Number(rawValue);

  if (Number.isNaN(numericValue) || rawValue === "") {
    return String(value);
  }

  return `${formatAmountWithCurrency(numericValue, localization, 2)}`;
};

const normalizePolicyTypeKey = (value?: string | null): string => {
  const raw = String(value ?? "")
    .trim()
    .toUpperCase();
  if (!raw) return "";
  if (raw === "GMC" || raw.endsWith("_GMC")) return "GMC";
  if (raw === "GPA" || raw.endsWith("_GPA")) return "GPA";
  if (raw === "GTL" || raw.endsWith("_GTL")) return "GTL";
  if (raw.includes("MEDICLAIM") || raw.includes("HEALTH")) return "GMC";
  if (raw.includes("ACCIDENT") || raw.includes("PERSONAL")) return "GPA";
  if (raw.includes("TERM") || raw.includes("LIFE")) return "GTL";
  return raw;
};

const SummaryRow = ({ label, value, bold, color }: SummaryRowProps) => {
  return (
    <SummaryRowWrapper>
      <SummaryLabel bold={bold}>{label}</SummaryLabel>
      <SummaryValue bold={bold} color={color}>
        {value}
      </SummaryValue>
    </SummaryRowWrapper>
  );
};

const defaultLabels = {
  employeeContribution: "Employee Contribution",
  companyContribution: "Company Contribution",
  collapsedEmployeeContribution: "Employee Contribution",
  totalContribution: "Your Total Contribution",
  totalContributionNoGst: "Your Total Contribution",
  totalContributionInclGst: "Your Total Contribution (incl.GST)",
  totalContributionExclGst: "Your Total Contribution (excl.GST)",
};

const EnrollmentAccordionContent = ({ details, labels }: any) => {
  const { localizationData } = useLocalization();

  return (
    <AccordionContentWrapper>
      {details?.enhancedCoverage !== null && (
        <AccordionItemRow>
          <AccordionItemLabel>Sum Insured</AccordionItemLabel>
          <AccordionItemValue>
            {formatAmount(details.enhancedCoverage, localizationData?.data)}
          </AccordionItemValue>
        </AccordionItemRow>
      )}

      {details?.youPay !== null && (
        <AccordionItemRow>
          <AccordionItemLabel>{labels.employeeContribution}</AccordionItemLabel>
          <AccordionItemValue>
            {formatAmount(details.youPay, localizationData?.data)}
          </AccordionItemValue>
        </AccordionItemRow>
      )}

      {details?.companyPay !== null && (
        <AccordionItemRow>
          <AccordionItemLabel>{labels.companyContribution}</AccordionItemLabel>
          <AccordionItemValue>
            {formatAmount(details.companyPay, localizationData?.data)}
          </AccordionItemValue>
        </AccordionItemRow>
      )}
    </AccordionContentWrapper>
  );
};

const DashboardEnrollmentSummary = ({ enrollmentSummaryData, labels: labelsProp }: any) => {
  const { localizationData } = useLocalization();
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const taxLabel = getTaxLabel(localizationData?.data);
  const labels = {
    ...defaultLabels,
    totalContributionInclGst: `Your Total Contribution (incl.${taxLabel})`,
    totalContributionExclGst: `Your Total Contribution (excl.${taxLabel})`,
    ...(labelsProp || {}),
  };

  const defaultData = {
    sections: [],
    summary: {
      user: { base: 0, gst: 0, total: 0 },
      company: { base: 0, gst: 0, total: 0 },
      totalCoverage: 0,
    },
    gstConfig: {
      applicable: true,
      showToEmployee: true,
      rate: 0.18,
    },
  };

  const dataToDisplay = enrollmentSummaryData || defaultData;

  const policyTypeOrder: Record<string, number> = {
    GMC: 1,
    GPA: 2,
    GTL: 3,
  };

  const coverageTypeOrder: Record<string, number> = {
    base: 1,
    parental: 2,
    optional: 3,
    addon: 3,
  };

  const sections = dataToDisplay.sections || [];

  // STEP 1: GROUP BY POLICY
  const grouped: Record<string, any[]> = {};

  sections.forEach((item: any) => {
    const key = normalizePolicyTypeKey(item.policyTypeKey);
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(item);
  });

  // STEP 2: SORT EACH GROUP (base → parental → optional)
  Object.keys(grouped).forEach((key) => {
    grouped[key].sort((a: any, b: any) => {
      const aType = a.policyType?.toLowerCase() || "";
      const bType = b.policyType?.toLowerCase() || "";

      return (
        (coverageTypeOrder[aType] || 999) - (coverageTypeOrder[bType] || 999)
      );
    });
  });

  // STEP 3: SORT GROUP KEYS (GMC → GPA → GTL)
  const sortedKeys = Object.keys(grouped).sort(
    (a, b) => (policyTypeOrder[a] || 999) - (policyTypeOrder[b] || 999)
  );

  // STEP 4: FLATTEN BACK
  const sortedSections = sortedKeys.flatMap((key) => grouped[key]);

  const { summary } = dataToDisplay;
  const gstConfig = dataToDisplay?.gstConfig ?? defaultData.gstConfig;
  const shouldApplyGst = gstConfig?.applicable !== false;
  const shouldShowGstLine = shouldApplyGst && gstConfig?.showToEmployee !== false;
  const totalContributionLabel = !shouldApplyGst
    ? labels.totalContributionNoGst
    : shouldShowGstLine
    ? labels.totalContributionInclGst
    : labels.totalContribution;
  const hasSections = sortedSections.length > 0;
  const payrollInstallments = dataToDisplay?.payrollInstallments;
  const totalContribution = Number(summary?.user?.total) || 0;
  const showPaymentSchedule =
    payrollInstallments > 1 && totalContribution > 0;
  const monthlyAmount = showPaymentSchedule
    ? Number.parseFloat((totalContribution / payrollInstallments).toFixed(2))
    : 0;

  const handleAccordionChange =
    (id: string) => (_: any, isExpanded: boolean) => {
      setExpandedIds((prev) =>
        isExpanded ? [...prev, id] : prev.filter((item) => item !== id)
      );
    };

  const isExpanded = (id: string) => expandedIds.includes(id);

  return (
    <EnrollmentSummaryContainer hasContent={hasSections}>
      <HeaderWrapper>
        <SummaryTitle>Premium Calculator</SummaryTitle>
        <img
          src={CalculateIcon}
          alt="Calculator"
          style={{ width: 28, height: 28 }}
        />
      </HeaderWrapper>
      {hasSections ? (
        <>
          <StyledAccordianWrapperContainer>
            <AccordionsWrapper>
              {sortedSections.map((section: any) => {
                const expanded =
                  isExpanded(section.id) ||
                  (expandedIds.length === 0 && Boolean(section.defaultExpanded));

                return (
                  <DashboardAccordion
                    key={section.id}
                    defaultExpanded={section.defaultExpanded}
                    onChange={handleAccordionChange(section.id)}
                    header={
                      <AccordionHeaderWrapper>
                        <AccordionTitle>{section.title}</AccordionTitle>

                        {!expanded && section.details?.youPay != null && (
                          <AccordianAmountContainer>
                            <AccordianTotalPremiumText>
                              {labels.collapsedEmployeeContribution}
                            </AccordianTotalPremiumText>
                            <AccordionAmount>
                              {formatAmount(section.details.youPay, localizationData?.data)}
                            </AccordionAmount>
                          </AccordianAmountContainer>
                        )}
                      </AccordionHeaderWrapper>
                    }
                    content={
                      <EnrollmentAccordionContent details={section.details} labels={labels} />
                    }
                  />
                );
              })}
            </AccordionsWrapper>

            <SummarySectionWrapper>
              <SummaryRow
                label={labels.totalContribution}
                value={formatAmount(summary.user.base, localizationData?.data)}
              />
              {shouldShowGstLine ? (
                <SummaryRow
                  label={`${taxLabel}@${Math.round((gstConfig?.rate ?? 0.18) * 100)}%`}
                  value={formatAmount(summary.user.gst, localizationData?.data)}
                />
              ) : null}
            </SummarySectionWrapper>
          </StyledAccordianWrapperContainer>
          <YourTotalPay>
            <SummaryRow
              label={totalContributionLabel}
              value={formatAmount(summary.user.total, localizationData?.data)}
              bold
              color
            />
          </YourTotalPay>
          {showPaymentSchedule && (
            <div style={{ padding: '10px 14px 16px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ fontSize: '15px', fontWeight: 400, color: '#666', lineHeight: '20px', flex: 1 }}>
                  Your contribution will be deducted in <b style={{color: '#187FE2'}}>{payrollInstallments}</b> <b>equal instalments</b> from your monthly salary
                </div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#187FE2', whiteSpace: 'nowrap', width: '115px', height: '80px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', border: '1px solid #187FE2'}}>
                  <div>{formatAmount(monthlyAmount, localizationData?.data)}</div> <div>per month</div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <EmptyStateWrapper>
          <EmptyStateIllustration
            src={PremiumCalculatorNoContentBg}
            alt="Choose your coverage to see premium calculator details"
          />
          <EmptyStateText>
            Choose your coverage to instantly see your premium and employer
            contribution.
          </EmptyStateText>
        </EmptyStateWrapper>
      )}
    </EnrollmentSummaryContainer>
  );
};

export default DashboardEnrollmentSummary;
