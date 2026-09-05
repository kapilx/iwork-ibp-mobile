import {
  formatCurrencyByLocalization,
  formatNumberByLocalization,
} from "@ui/ui-lib/utils";
import {
  CardContainer,
  CardLabelTypography,
  CardValueTypography,
  ContentContainer,
  HeaderContainer,
  IconContainer,
  MainContainer,
  TitleTypography,
  WarningIconImg,
} from "./styles";
import React from "react";
import WarningIcon from "../../assets/svgs/warning-xs.svg";
import {
  CD_BALANCE_INSUFFICIENT_TOOLTIP,
  CommonTooltip,
  theme,
} from "@ui/ui-lib";

export type EndorsementSummaryCardsDataType = {
  label?: string;
  value?: string;
  valueColor?: string;
};

export interface EndorsementSummaryProps {
  title?: string;
  Icon?: any;
  styling?: React.CSSProperties;
  cardData?: any;
  creationLabel?: string;
  isGroupPolicyType?: boolean;
}

const summaryObjKeys = {
  TOTAL_EMPLOYEES: "totalEmployees",
  TOTAL_DEPENDENTS: "totalDependents",
  TOTAL_LIVES: "totalLives",
  ADDITION_COUNT: "additionCount",
  DELETION_COUNT: "deletionCount",
  CD_BALANCE: "cdBalance",
  NET_PREMIUM: "netPremium",
  GROSS_PREMIUM: "grossPremium",
  TOTAL_ASSETS: "totalAssets",
  TOTAL_SUB_ASSETS: "totalSubAssets",
  TOTAL: "total",
  ASSET_ADDITION_COUNT: "assetAdditionCount",
  ASSET_DELETION_COUNT: "assetDeletionCount",
  SUB_ASSET_ADDITION_COUNT: "subAssetAdditionCount",
  SUB_ASSET_DELETION_COUNT: "subAssetDeletionCount",
  NOT_STARTED_COUNT: "notStartedCount",
  IN_PROGRESS_COUNT: "inProgressCount",
  COMPLETED_COUNT: "completedCount",
};
const maxFractionDigits = 2;

const EndorsementSummary: React.FC<EndorsementSummaryProps> = ({
  title,
  Icon,
  styling,
  cardData,
  creationLabel,
  isGroupPolicyType,
}) => {
  // Allow cardData to be provided either as an array (legacy) or an object (new requirement)
  const isArrayData = Array.isArray(cardData);

  // When an object is provided, convert its entries into a normalized array structure
  let normalizedCards = React.useMemo(() => {
    if (isArrayData) return cardData || [];
    if (!cardData || typeof cardData !== "object") return [];

    // Define a preferred display order for known keys; fall back to remaining keys afterward
    const preferredOrder = [
      summaryObjKeys.TOTAL_EMPLOYEES,
      summaryObjKeys.TOTAL_DEPENDENTS,
      summaryObjKeys.TOTAL_LIVES,
      summaryObjKeys.ADDITION_COUNT,
      summaryObjKeys.DELETION_COUNT,
      summaryObjKeys.CD_BALANCE,
      summaryObjKeys.NET_PREMIUM,
      summaryObjKeys.GROSS_PREMIUM,
      summaryObjKeys.NOT_STARTED_COUNT,
      summaryObjKeys.IN_PROGRESS_COUNT,
      summaryObjKeys.COMPLETED_COUNT,
    ];
    const nonGroupPriorityOrder = [
      summaryObjKeys.TOTAL,
      summaryObjKeys.TOTAL_ASSETS,
      summaryObjKeys.TOTAL_SUB_ASSETS,
      summaryObjKeys.ADDITION_COUNT,
      summaryObjKeys.DELETION_COUNT,
      summaryObjKeys.ASSET_ADDITION_COUNT,
      summaryObjKeys.ASSET_DELETION_COUNT,
      summaryObjKeys.SUB_ASSET_ADDITION_COUNT,
      summaryObjKeys.SUB_ASSET_DELETION_COUNT,
      summaryObjKeys.CD_BALANCE,
      summaryObjKeys.NET_PREMIUM,
      summaryObjKeys.GROSS_PREMIUM,
    ];

    const labelMap: Record<string, string> = {
      [summaryObjKeys.TOTAL_EMPLOYEES]: "Total employees",
      [summaryObjKeys.TOTAL_DEPENDENTS]: "Total dependents",
      [summaryObjKeys.TOTAL_LIVES]: "Total lives",
      [summaryObjKeys.ADDITION_COUNT]: "Additions",
      [summaryObjKeys.DELETION_COUNT]: "Deletions",
      [summaryObjKeys.CD_BALANCE]: "CD balance",
      [summaryObjKeys.NET_PREMIUM]: "Net premium",
      [summaryObjKeys.GROSS_PREMIUM]: "Gross premium",
      [summaryObjKeys.NOT_STARTED_COUNT]: "Not started",
      [summaryObjKeys.IN_PROGRESS_COUNT]: "In progress",
      [summaryObjKeys.COMPLETED_COUNT]: "Completed",
    };

    const nonGroupLabelMap: Record<string, string> = {
      [summaryObjKeys.TOTAL]: "Total",
      [summaryObjKeys.TOTAL_ASSETS]: "Total assets",
      [summaryObjKeys.TOTAL_SUB_ASSETS]: "Total sub-assets",
      [summaryObjKeys.ADDITION_COUNT]: "Additions",
      [summaryObjKeys.DELETION_COUNT]: "Deletions",
      [summaryObjKeys.ASSET_ADDITION_COUNT]: "Asset additions",
      [summaryObjKeys.ASSET_DELETION_COUNT]: "Asset deletions",
      [summaryObjKeys.SUB_ASSET_ADDITION_COUNT]: "Sub-asset additions",
      [summaryObjKeys.SUB_ASSET_DELETION_COUNT]: "Sub-asset deletions",
      [summaryObjKeys.CD_BALANCE]: "CD balance",
      [summaryObjKeys.NET_PREMIUM]: "Net premium",
      [summaryObjKeys.GROSS_PREMIUM]: "Gross premium",
    };

    const entries = Object.entries(cardData as Record<string, any>);
    const ordered: [string, any][] = [];

    if (!isGroupPolicyType) {
      nonGroupPriorityOrder.forEach((key) => {
        const found = entries.find(([k]) => k === key);
        if (found) ordered.push(found);
      });
    } else {
      preferredOrder.forEach((key) => {
        const found = entries.find(([k]) => k === key);
        if (found) ordered.push(found);
      });
    }

    // Add any remaining keys not in preferred order (avoid duplicates)
    entries.forEach((pair) => {
      if (!ordered.some(([k]) => k === pair[0])) ordered.push(pair);
    });

    return ordered.map(([key, value]) => {
      let formattedValue = value ?? "0";
      if (
        key === summaryObjKeys.TOTAL_EMPLOYEES ||
        key === summaryObjKeys.TOTAL_DEPENDENTS ||
        key === summaryObjKeys.TOTAL_LIVES ||
        key === summaryObjKeys.ADDITION_COUNT ||
        key === summaryObjKeys.DELETION_COUNT
      ) {
        formattedValue = formatNumberByLocalization(
          typeof value === "number" ? value : Number(value)
        );
      } else if (
        key === summaryObjKeys.NET_PREMIUM ||
        key === summaryObjKeys.CD_BALANCE ||
        key === summaryObjKeys.GROSS_PREMIUM
      ) {
        formattedValue = formatCurrencyByLocalization(
          typeof value === "number" ? value : Number(value),
          undefined,
          maxFractionDigits
        );
      }
      return {
        label: isGroupPolicyType ? labelMap[key] : nonGroupLabelMap[key],
        value: formattedValue,
        rawKey: key,
      };
    });
  }, [cardData, isArrayData]);

  // Remove cards with undefined label to avoid rendering them
  normalizedCards = normalizedCards.filter((card) => card.label !== undefined);

  // Compute warning condition (only meaningful when object data supplied)
  const showWarning = React.useMemo(() => {
    if (!cardData) return false;
    const cdBalance = Number((cardData as any)?.cdBalance ?? 0);
    const grossPremium = Number((cardData as any)?.grossPremium ?? 0);
    return cdBalance < grossPremium;
  }, [cardData]);

  return (
    <MainContainer styling={styling} data-testid="inception-summary">
      <HeaderContainer>
        {Icon && <IconContainer src={Icon} alt="Header Icon" />}
        <TitleTypography>{title}</TitleTypography>
      </HeaderContainer>
      <ContentContainer>
        {normalizedCards?.map((card: any, index: number) => {
          return (
            <CardContainer key={index} data-testid="card-container">
              <CardLabelTypography>{card.label}</CardLabelTypography>
              <CardValueTypography valueColor={card?.valueColor ?? ""}>
                {card.value}
                {showWarning && card.rawKey === summaryObjKeys.CD_BALANCE && (
                  <CommonTooltip
                    title={
                      (creationLabel || "").toLowerCase() === "inception"
                        ? CD_BALANCE_INSUFFICIENT_TOOLTIP.INCEPTION
                        : CD_BALANCE_INSUFFICIENT_TOOLTIP.ENDORSEMENT
                    }
                    tooltipSx={{
                      color: theme.palette.background.default,
                      fontSize: theme.typography.fontSizes.sm,
                    }}
                  >
                    <WarningIconImg
                      src={WarningIcon}
                      alt="CD balance insufficient"
                    />
                  </CommonTooltip>
                )}
              </CardValueTypography>
            </CardContainer>
          );
        })}
      </ContentContainer>
    </MainContainer>
  );
};

export default EndorsementSummary;
