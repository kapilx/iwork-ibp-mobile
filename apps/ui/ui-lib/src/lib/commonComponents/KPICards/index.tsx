import {
  CurrencyDisplayMode,
  LocalizationConfig,
  NUMBER_FORMAT_PATTERNS,
  FULL_PRECISION_FRACTION_DIGITS,
  formatCurrencyByLocalization,
  formatLargeCurrency,
  formatNumberByLocalization,
  formatNumberShort,
} from "../../utils";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useLocalization } from "../../hooks/useLocalization";
import {
  CardCount,
  CardTitle,
  ExactDecimals,
  ExactValue,
  KPIContent,
  KpiStyledCard,
  KPIContainer,
} from "./styles";

export type KPI = {
  title: string;
  count: number;
  percentage: number;
  backgroundColor: string;
  textColor: string;
  isFloatable?: boolean;
  // Exact, unrounded value for the hover tooltip. Needed whenever `count` is
  // itself pre-rounded/compacted by the caller (e.g. a "1.2Cr (500)" string)
  // and the true source number isn't recoverable from that string.
  originalValue?: number | string;
};

interface KPICardsProps {
  data: KPI[];
  showPercentage?: boolean;
  localization?: LocalizationConfig;
}

const KPICards: React.FC<KPICardsProps> = ({
  data,
  showPercentage = false,
  localization,
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const currencyDisplayMode = useSelector(
    (state: any) =>
      (state?.user?.currencyDisplayMode as CurrencyDisplayMode) ??
      CurrencyDisplayMode.INDIAN
  );
  const { localizationData } = useLocalization();
  const resolvedLocalization: LocalizationConfig | undefined =
    localization ?? localizationData?.data;
  const effectiveLocalization = {
    ...(resolvedLocalization || {}),
    numberFormat:
      resolvedLocalization?.numberFormat ??
      (currencyDisplayMode === CurrencyDisplayMode.INTERNATIONAL
        ? NUMBER_FORMAT_PATTERNS.international
        : NUMBER_FORMAT_PATTERNS.indian),
  };
  const normalizeCompactSegments = (text: string): string =>
    text.replace(
      // Longer alternatives first so "Qn" isn't consumed as "Q"; the trailing
      // \b would force a backtrack anyway, but the order makes the intent plain.
      /-?\d[\d,]*(?:\.\d+)?\s?(?:crores|crore|cr|lakh|lac|l|k|mn|m|bn|b|t|qn|q)\b/gi,
      (token) => {
        const formatted = formatNumberShort(
          token.replace(/\s+/g, ""),
          effectiveLocalization
        );
        return formatted === "--" ? token : formatted;
      }
    );

  const handleCardClick = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <KPIContainer data-testid="kpi-cards">
      {data.map((kpi, index) => {
        let formattedCount: string | number;
        if (kpi.isFloatable) {
          const value = Number(kpi.count);
          formattedCount = isNaN(value)
            ? "00"
            : formatLargeCurrency(value, effectiveLocalization).trim();
        } else if (typeof kpi.count === "string") {
          formattedCount = normalizeCompactSegments(kpi.count);
        } else {
          // Plain counts (e.g. Total ROs / Total Companies): comma-grouped full
          // number instead of the raw integer.
          formattedCount = formatNumberByLocalization(
            kpi.count,
            effectiveLocalization
          );
        }

        let originalValue: string;
        if (kpi.originalValue != null) {
          // Caller supplied the true source value directly (needed when
          // `count` is already a pre-rounded/compacted string).
          originalValue =
            typeof kpi.originalValue === "number"
              ? formatNumberByLocalization(
                  kpi.originalValue,
                  effectiveLocalization,
                  FULL_PRECISION_FRACTION_DIGITS
                )
              : kpi.originalValue;
        } else if (kpi.isFloatable) {
          const value = Number(kpi.count);
          originalValue = isNaN(value)
            ? "00"
            : formatCurrencyByLocalization(
                value,
                effectiveLocalization,
                FULL_PRECISION_FRACTION_DIGITS
              );
        } else if (typeof kpi.count === "string") {
          originalValue = kpi.count;
        } else {
          originalValue = formatNumberByLocalization(
            kpi.count,
            effectiveLocalization,
            FULL_PRECISION_FRACTION_DIGITS
          );
        }

        const backgroundColor = kpi.backgroundColor;
        const textColor = kpi.textColor;
        const safePercentage =
          typeof kpi.percentage === "number" && !isNaN(kpi.percentage)
            ? kpi.percentage
            : 0;

        const dotIndex = originalValue.lastIndexOf(".");
        const exactWhole =
          dotIndex === -1 ? originalValue : originalValue.slice(0, dotIndex);
        const exactFraction =
          dotIndex === -1 ? "" : originalValue.slice(dotIndex);

        return (
          <KpiStyledCard
            key={index}
            onClick={() => handleCardClick(index)}
            data-testid={kpi.title.replace(" ", "-").toLowerCase() + "-card"}
            backgroundColor={backgroundColor}
            textColor={textColor}
            isMultipleCards={data.length > 1}
          >
            <KPIContent>
              <CardCount>{formattedCount}</CardCount>
              <CardTitle>
                {showPercentage === true
                  ? `${kpi.title} (${safePercentage}%)`
                  : kpi.title}
              </CardTitle>
              <ExactValue className="kpi-exact">
                {originalValue !== String(formattedCount) && (
                  <>
                    {exactWhole}
                    {exactFraction && (
                      <ExactDecimals>{exactFraction}</ExactDecimals>
                    )}
                  </>
                )}
              </ExactValue>
            </KPIContent>
          </KpiStyledCard>
        );
      })}
    </KPIContainer>
  );
};

export default KPICards;
