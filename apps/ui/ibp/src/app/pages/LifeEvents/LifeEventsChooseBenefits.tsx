import React, { useMemo, useState } from 'react';
import CheckIcon from '@mui/icons-material/Check';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Box } from '@mui/material';
import {
  formatAmountWithCurrency,
  type LocalizationConfig,
  useLocalization,
} from '@ui/ui-lib';
import {
  getChooseBenefitsTitle,
  LIFE_EVENTS,
  LIFE_EVENTS_CHOOSE_BENEFITS_COPY,
  LIFE_EVENTS_STEP_ACTION_COPY,
} from './constants';
import {
  LifeEventPolicyChoice,
} from './policyChoices';
import {
  ChooseBenefitsActionGroup,
  ChooseBenefitsActions,
  ChooseBenefitsChoiceBadge,
  ChooseBenefitsChoiceCard,
  ChooseBenefitsChoiceChevron,
  ChooseBenefitsChoiceContent,
  ChooseBenefitsChoiceMetrics,
  ChooseBenefitsChoiceOptionContent,
  ChooseBenefitsChoiceOptionRow,
  ChooseBenefitsChoiceOptions,
  ChooseBenefitsChoiceOptionSelector,
  ChooseBenefitsChoiceTitle,
  ChooseBenefitsChoiceTitleGroup,
  ChooseBenefitsChoiceTopRow,
  ChooseBenefitsContinueButton,
  ChooseBenefitsEmptyState,
  ChooseBenefitsErrorText,
  ChooseBenefitsHeaderBlock,
  ChooseBenefitsMetric,
  ChooseBenefitsMetricLabel,
  ChooseBenefitsMetricValue,
  ChooseBenefitsPage,
  ChooseBenefitsSectionBody,
  ChooseBenefitsSectionCard,
  ChooseBenefitsSectionDescription,
  ChooseBenefitsSectionHeader,
  ChooseBenefitsSectionHeaderLeft,
  ChooseBenefitsSectionHeadingBlock,
  ChooseBenefitsSectionIconTile,
  ChooseBenefitsSectionTitle,
  ChooseBenefitsSections,
  ChooseBenefitsSubtitle,
  ChooseBenefitsTitle,
  ChooseBenefitsToggleButton,
  LifeEventsStepSecondaryButton,
} from './styles';
import compulsoryBenefitIcon from "../../assets/svgs/compulsory-benifits-icon.svg";
import optionalBenefitIcon from "../../assets/svgs/optional-benefits-icon.svg";

interface LifeEventsChooseBenefitsProps {
  selectedLifeEvent: string;
  availableChoices: LifeEventPolicyChoice[];
  selectedChoiceIds: string[];
  onSelectedChoiceIdsChange: (choiceIds: string[]) => void;
  selectedDependents?: Array<{ relationship?: string; relation?: string }>;
  onBack?: () => void;
  onContinue: () => void;
}

type SectionType = 'compulsory' | 'optional';

const getPolicyLabel = (choice: any) =>
  choice.policyComponentActionLabel ||
  choice.policyName ||
  LIFE_EVENTS_CHOOSE_BENEFITS_COPY.defaultPolicyLabel;

const getChoiceBadgeLabel = (choice: any, section: SectionType) => {
  if (choice.policyComponentActionType === 'base') {
    return LIFE_EVENTS_CHOOSE_BENEFITS_COPY.basePolicyBadge;
  }

  if (choice.policyComponentActionLabel) {
    return choice.policyComponentActionLabel;
  }

  return section === 'compulsory'
    ? LIFE_EVENTS_CHOOSE_BENEFITS_COPY.includedBadge
    : LIFE_EVENTS_CHOOSE_BENEFITS_COPY.optionalBadge;
};

const renderChoiceCard = (
  choices: LifeEventPolicyChoice[],
  section: SectionType,
  selectedChoiceIds: string[],
  toggleChoiceId: (choiceId: string) => void,
  localization?: LocalizationConfig
) => {
  const primaryChoice = choices[0];
  const selectedChoice =
    choices.find((choice) => selectedChoiceIds.includes(String(choice.id))) || null;
  const checked = Boolean(selectedChoice);

  return (
    <ChooseBenefitsChoiceCard
      key={primaryChoice.selectionGroupKey}
      selected={checked}
    >
      <ChooseBenefitsChoiceContent>
        <ChooseBenefitsChoiceTopRow>
          <ChooseBenefitsChoiceTitleGroup>
            <ChooseBenefitsChoiceTitle>
              {getPolicyLabel(primaryChoice)}
            </ChooseBenefitsChoiceTitle>
            <ChooseBenefitsChoiceBadge selected={checked}>
              {getChoiceBadgeLabel(primaryChoice, section)}
            </ChooseBenefitsChoiceBadge>
          </ChooseBenefitsChoiceTitleGroup>

          <ChooseBenefitsChoiceChevron>
            <KeyboardArrowDownIcon />
          </ChooseBenefitsChoiceChevron>
        </ChooseBenefitsChoiceTopRow>

        <ChooseBenefitsChoiceOptions>
          {choices.map((choice) => {
            const choiceId = String(choice.id);
            const rowSelected = selectedChoiceIds.includes(choiceId);
            const companyContribution = Number(
              choice.companyContribution ?? choice.companyPay ?? 0
            );
            const employeeContribution = Number(
              choice.employeeContribution ?? choice.employeePay ?? 0
            );
            const totalPremium = companyContribution + employeeContribution;

            return (
              <ChooseBenefitsChoiceOptionRow
                key={choiceId}
                selected={rowSelected}
                role="checkbox"
                aria-checked={rowSelected}
                tabIndex={0}
                onClick={() => toggleChoiceId(choiceId)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    toggleChoiceId(choiceId);
                  }
                }}
              >
                <ChooseBenefitsChoiceOptionSelector selected={rowSelected}>
                  <CheckIcon />
                </ChooseBenefitsChoiceOptionSelector>

                <ChooseBenefitsChoiceOptionContent>
                  <ChooseBenefitsChoiceMetrics>
                    <ChooseBenefitsMetric>
                      <ChooseBenefitsMetricLabel>
                        {LIFE_EVENTS_CHOOSE_BENEFITS_COPY.sumInsuredLabel}
                      </ChooseBenefitsMetricLabel>
                      <ChooseBenefitsMetricValue>
                        {formatAmountWithCurrency(Number(choice.sumInsured ?? 0), localization)}
                      </ChooseBenefitsMetricValue>
                    </ChooseBenefitsMetric>

                    <ChooseBenefitsMetric>
                      <ChooseBenefitsMetricLabel>
                        {LIFE_EVENTS_CHOOSE_BENEFITS_COPY.totalPremiumLabel}
                      </ChooseBenefitsMetricLabel>
                      <ChooseBenefitsMetricValue>
                        {formatAmountWithCurrency(totalPremium, localization)}
                      </ChooseBenefitsMetricValue>
                    </ChooseBenefitsMetric>

                    <ChooseBenefitsMetric>
                      <ChooseBenefitsMetricLabel>
                        {LIFE_EVENTS_CHOOSE_BENEFITS_COPY.companyContributionLabel}
                      </ChooseBenefitsMetricLabel>
                      <ChooseBenefitsMetricValue>
                        {formatAmountWithCurrency(companyContribution, localization)}
                      </ChooseBenefitsMetricValue>
                    </ChooseBenefitsMetric>

                    <ChooseBenefitsMetric>
                      <ChooseBenefitsMetricLabel>
                        {LIFE_EVENTS_CHOOSE_BENEFITS_COPY.yourContributionLabel}
                      </ChooseBenefitsMetricLabel>
                      <ChooseBenefitsMetricValue highlight>
                        {formatAmountWithCurrency(employeeContribution, localization)}
                      </ChooseBenefitsMetricValue>
                    </ChooseBenefitsMetric>
                  </ChooseBenefitsChoiceMetrics>
                </ChooseBenefitsChoiceOptionContent>
              </ChooseBenefitsChoiceOptionRow>
            );
          })}
        </ChooseBenefitsChoiceOptions>
      </ChooseBenefitsChoiceContent>
    </ChooseBenefitsChoiceCard>
  );
};

const LifeEventsChooseBenefits: React.FC<LifeEventsChooseBenefitsProps> = ({
  selectedLifeEvent,
  availableChoices,
  selectedChoiceIds,
  onSelectedChoiceIdsChange,
  selectedDependents = [],
  onBack,
  onContinue,
}) => {
  const { localizationData } = useLocalization();
  const [choiceError, setChoiceError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<SectionType[]>([]);

  const selectedLifeEventObj = LIFE_EVENTS.find(
    (event) => event.id === selectedLifeEvent
  );
  const selectedRelations = Array.from(
    new Set(
      selectedDependents
        .map((dependent) => dependent.relationship || dependent.relation || '')
        .filter(Boolean),
    ),
  );
  const fallbackRelations = selectedLifeEventObj?.requiredRelationships || [];
  const headerRelations =
    selectedRelations.length > 0 ? selectedRelations : fallbackRelations;
  const compulsoryChoices = useMemo(
    () =>
      (availableChoices || []).filter(
        (choice: LifeEventPolicyChoice) => choice.section === 'compulsory'
      ),
    [availableChoices]
  );

  const optionalChoices = useMemo(
    () =>
      (availableChoices || []).filter(
        (choice: LifeEventPolicyChoice) => choice.section === 'optional'
      ),
    [availableChoices]
  );

  const groupedCompulsoryChoices = useMemo(
    () =>
      Object.values(
        compulsoryChoices.reduce<Record<string, LifeEventPolicyChoice[]>>(
          (accumulator, choice) => {
            if (!accumulator[choice.selectionGroupKey]) {
              accumulator[choice.selectionGroupKey] = [];
            }
            accumulator[choice.selectionGroupKey].push(choice);
            return accumulator;
          },
          {},
        ),
      ),
    [compulsoryChoices],
  );

  const groupedOptionalChoices = useMemo(
    () =>
      Object.values(
        optionalChoices.reduce<Record<string, LifeEventPolicyChoice[]>>(
          (accumulator, choice) => {
            if (!accumulator[choice.selectionGroupKey]) {
              accumulator[choice.selectionGroupKey] = [];
            }
            accumulator[choice.selectionGroupKey].push(choice);
            return accumulator;
          },
          {},
        ),
      ),
    [optionalChoices],
  );

  React.useEffect(() => {
    setExpandedSection((prev) => {
      const next = prev.filter((section) =>
        section === 'compulsory'
          ? compulsoryChoices.length > 0
          : optionalChoices.length > 0
      );

      if (next.length > 0) {
        return next;
      }

      const defaults: SectionType[] = [];
      if (compulsoryChoices.length > 0) defaults.push('compulsory');
      if (optionalChoices.length > 0) defaults.push('optional');
      return defaults;
    });
  }, [compulsoryChoices.length, optionalChoices.length]);

  const toggleChoiceId = (choiceId: string) => {
    const currentChoice = availableChoices.find((choice) => choice.id === choiceId);
    if (!currentChoice) {
      return;
    }

    const sameGroupChoiceIds = availableChoices
      .filter(
        (choice) => choice.selectionGroupKey === currentChoice.selectionGroupKey,
      )
      .map((choice) => choice.id);

    const nextChoiceIds = selectedChoiceIds.filter(
      (id) => !sameGroupChoiceIds.includes(id),
    );

    if (selectedChoiceIds.includes(choiceId)) {
      onSelectedChoiceIdsChange(nextChoiceIds);
      return;
    }

    onSelectedChoiceIdsChange([...nextChoiceIds, choiceId]);
  };

  const toggleSection = (section: SectionType) => {
    setExpandedSection((prev) =>
      prev.includes(section)
        ? prev.filter((item) => item !== section)
        : [...prev, section]
    );
  };

  const hasChoices =
    groupedCompulsoryChoices.length > 0 || groupedOptionalChoices.length > 0;

  return (
    <ChooseBenefitsPage>
      <ChooseBenefitsHeaderBlock>
        <ChooseBenefitsTitle>
          {getChooseBenefitsTitle(headerRelations)}
        </ChooseBenefitsTitle>
        <ChooseBenefitsSubtitle>
          {LIFE_EVENTS_CHOOSE_BENEFITS_COPY.subtitle}
        </ChooseBenefitsSubtitle>
      </ChooseBenefitsHeaderBlock>

      {!hasChoices ? (
        <ChooseBenefitsEmptyState>
          {LIFE_EVENTS_CHOOSE_BENEFITS_COPY.noChoicesMessage}
        </ChooseBenefitsEmptyState>
      ) : (
        <ChooseBenefitsSections>
          {groupedCompulsoryChoices.length > 0 ? (
            <ChooseBenefitsSectionCard>
              <ChooseBenefitsSectionHeader>
                <ChooseBenefitsSectionHeaderLeft>
                  <ChooseBenefitsSectionIconTile variant="compulsory">
                    <img src={compulsoryBenefitIcon} alt="Compulsory Benefit" />
                  </ChooseBenefitsSectionIconTile>

                  <ChooseBenefitsSectionHeadingBlock>
                    <ChooseBenefitsSectionTitle>
                      {LIFE_EVENTS_CHOOSE_BENEFITS_COPY.compulsoryTitle}
                    </ChooseBenefitsSectionTitle>
                    <ChooseBenefitsSectionDescription>
                      {LIFE_EVENTS_CHOOSE_BENEFITS_COPY.compulsoryDescription}
                    </ChooseBenefitsSectionDescription>
                  </ChooseBenefitsSectionHeadingBlock>
                </ChooseBenefitsSectionHeaderLeft>

                <ChooseBenefitsToggleButton
                  type="button"
                  onClick={() => toggleSection('compulsory')}
                >
                  {expandedSection.includes('compulsory') ? (
                    <KeyboardArrowUpIcon />
                  ) : (
                    <KeyboardArrowDownIcon />
                  )}
                </ChooseBenefitsToggleButton>
              </ChooseBenefitsSectionHeader>

              {expandedSection.includes('compulsory') ? (
                <ChooseBenefitsSectionBody>
                  {groupedCompulsoryChoices.map((choiceGroup) =>
                    renderChoiceCard(
                      choiceGroup,
                      'compulsory',
                      selectedChoiceIds,
                      toggleChoiceId,
                      localizationData?.data
                    )
                  )}
                </ChooseBenefitsSectionBody>
              ) : null}
            </ChooseBenefitsSectionCard>
          ) : null}

          {groupedOptionalChoices.length > 0 ? (
            <ChooseBenefitsSectionCard>
              <ChooseBenefitsSectionHeader>
                <ChooseBenefitsSectionHeaderLeft>
                  <ChooseBenefitsSectionIconTile variant="optional">
                    <img src={optionalBenefitIcon} alt="Optional Benefit" />
                  </ChooseBenefitsSectionIconTile>

                  <ChooseBenefitsSectionHeadingBlock>
                    <ChooseBenefitsSectionTitle>
                      {LIFE_EVENTS_CHOOSE_BENEFITS_COPY.optionalTitle}
                    </ChooseBenefitsSectionTitle>
                    <ChooseBenefitsSectionDescription>
                      {LIFE_EVENTS_CHOOSE_BENEFITS_COPY.optionalDescription}
                    </ChooseBenefitsSectionDescription>
                  </ChooseBenefitsSectionHeadingBlock>
                </ChooseBenefitsSectionHeaderLeft>

                <ChooseBenefitsToggleButton
                  type="button"
                  onClick={() => toggleSection('optional')}
                >
                  {expandedSection.includes('optional') ? (
                    <KeyboardArrowUpIcon />
                  ) : (
                    <KeyboardArrowDownIcon />
                  )}
                </ChooseBenefitsToggleButton>
              </ChooseBenefitsSectionHeader>

              {expandedSection.includes('optional') ? (
                <ChooseBenefitsSectionBody>
                  {groupedOptionalChoices.map((choiceGroup) =>
                    renderChoiceCard(
                      choiceGroup,
                      'optional',
                      selectedChoiceIds,
                      toggleChoiceId,
                      localizationData?.data
                    )
                  )}
                </ChooseBenefitsSectionBody>
              ) : null}
            </ChooseBenefitsSectionCard>
          ) : null}
        </ChooseBenefitsSections>
      )}

      <ChooseBenefitsActions>
        <Box>
          {choiceError ? (
            <ChooseBenefitsErrorText>{choiceError}</ChooseBenefitsErrorText>
          ) : null}
        </Box>

        <ChooseBenefitsActionGroup>
          {onBack ? (
            <LifeEventsStepSecondaryButton
              type="button"
              onClick={onBack}
            >
              {LIFE_EVENTS_STEP_ACTION_COPY.backToComponents}
            </LifeEventsStepSecondaryButton>
          ) : null}

          <ChooseBenefitsContinueButton
            type="button"
            onClick={() => {
              if (selectedChoiceIds.length === 0) {
                setChoiceError(
                  LIFE_EVENTS_CHOOSE_BENEFITS_COPY.selectionRequiredError
                );
                return;
              }

              setChoiceError(null);
              onContinue();
            }}
          >
            {LIFE_EVENTS_CHOOSE_BENEFITS_COPY.continueButton}
          </ChooseBenefitsContinueButton>
        </ChooseBenefitsActionGroup>
      </ChooseBenefitsActions>
    </ChooseBenefitsPage>
  );
};

export default LifeEventsChooseBenefits;
