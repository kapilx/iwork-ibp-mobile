// /Users/naveen/development/vitalia/frontend/src/app/configurator/PolicyChoicesSection.tsx
import {
  Box,
  FormControlLabel,
  Stack,
  Table,
  TableBody,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import {
  CommonTextField,
  CommonCheckbox,
  formatNumberInputByLocalization,
  useLocalization,
} from "@ui/ui-lib";
import {
  isExistingPolicyChoice,
  hasExistingDefaultChoice,
} from "../utils/liveEditHelpers";
import { MAX_DECIMALS_FLAT, MAX_DECIMALS_MULTIPLE } from "../../../constants";
import RadioActiveImg from "../../../assets/svgs/radio-active-img.svg";
import RadioInactiveImg from "../../../assets/svgs/radio-inactive-icon.svg";
import {
  AVAILABLE,
  AVAILABLE_POLICY_CHOICES_HEADER,
  BASE_POLICY_AVAILABLE_ERROR,
  BASE_POLICY_DEFAULT_ERROR,
  CANNOT_BE_NEGATIVE,
  CONFIGURE_SELECTED_POLICY_CHOICE_HEADER,
  DEFAULT,
  MULTIPLE_DEFAULT_CHOICES_ERROR,
  MUST_BE_GREATER_THAN_ZERO,
  NO_POLICY_CHOICES_MESSAGE,
  POLICY_OPTION_HEADER,
  SELECT_POLICY_TO_CONFIGURE_MSG,
  SET_CHOICES,
  SI_ID_PREFIX,
} from "../../../constants";
import { usePolicyChoicesManager } from "../hooks/usePolicyChoicesManager";
import { fieldHighlightSx } from "./ConfiguratorFields"; // Import for highlighting
import {
  ConfiguredPolicyOption,
  ConfiguredPolicyParameter,
  PolicyComponent,
  PolicyConfiguration,
  PolicyOptionChoice,
  SumInsuredModel,
} from "./policytypes";
import { SectionRef } from "./sectionRef";
import {
  BodyLabelCell,
  ChoiceText,
  FadedLabel,
  HeaderTableCell,
  PlainChoiceButton,
  StyledChoiceBox,
  StyledCommonRadio,
  StyledErrorAlert,
  StyledOutlinedButton,
  StyledRadioImg,
  StyledTablePaper,
  StyledTextActionButton,
  StyledTextButton,
} from "./styles";
import React, { forwardRef, useImperativeHandle, useState } from "react";
import SuccessImg from "../../../assets/svgs/done.svg";

interface PolicyChoicesSectionProps {
  initialData: ConfiguredPolicyOption[];
  fullConfiguration: PolicyConfiguration["configuration"]; // Added fullConfiguration
  isEditable: boolean;
  showHighlights: boolean; // Added for validation highlights
  isLiveEditMode?: boolean;
  liveEditSnapshot?: ConfiguredPolicyOption[];
}

interface SelectedPolicyContext {
  configOptionId: string;
  policyBranch: "base" | "parental";
  choiceTarget: "main" | "addon";
  // If choiceTarget is 'addon', this is the policyId of the addon from PolicyOptionChoiceMeta.
  // If 'main', this is the policyId of the main component.
  policyId: string;
}

interface EditableChoiceError {
  companyContribution?: string;
  employeeContribution?: string;
}

export const PolicyChoicesSection = forwardRef<
  SectionRef,
  PolicyChoicesSectionProps
>(
  (
    {
      initialData,
      fullConfiguration,
      isEditable,
      showHighlights,
      isLiveEditMode,
      liveEditSnapshot,
    },
    ref,
  ) => {
    const { localizationData } = useLocalization();
    const localization = localizationData?.data;

    // Use the hook to manage policy options state and validation
    const {
      policyOptions,
      validateChoices,
      updateConfiguredPolicyOptionChoiceDetails,
    } = usePolicyChoicesManager(initialData, fullConfiguration);

    const [selectedPolicyContext, setSelectedPolicyContext] =
      useState<SelectedPolicyContext | null>(null);
    const [editableChoices, setEditableChoices] = useState<
      PolicyOptionChoice[]
    >([]);
    const [editableChoicesErrors, setEditableChoicesErrors] = useState<
      Record<number, EditableChoiceError>
    >({});
    // Changed to store an array of messages for the Alert
    const [topLevelActionErrorMessages, setTopLevelActionErrorMessages] =
      useState<string[]>([]);
    // Track raw input values for better decimal typing experience
    const [rawInputValues, setRawInputValues] = useState<
      Record<
        string,
        { companyContribution?: string; employeeContribution?: string }
      >
    >({});

    // Clear raw input values when policy context changes
    React.useEffect(() => {
      setRawInputValues({});
    }, [selectedPolicyContext?.configOptionId]);

    // Helper for formatting numbers with Indian style commas
    const formatNumberForDisplay = (
      value: number | undefined | null,
      maxDecimals: number = 2,
    ): string => {
      if (value === undefined || value === null || isNaN(value)) {
        return "";
      }
      return formatNumberInputByLocalization(value, localization, maxDecimals, 0);
    };

    // Helper for parsing formatted numbers
    const parseFormattedNumber = (
      formattedValue: string,
      maxDecimals: number = 2,
    ): number => {
      if (formattedValue.trim() === "") {
        return 0;
      }
      const cleaned = formattedValue.replace(/,/g, ""); // Remove commas
      const num = parseFloat(cleaned);
      const multiplier = Math.pow(10, maxDecimals);
      return isNaN(num) ? 0 : Math.round(num * multiplier) / multiplier;
    };

    // Helper for validating decimal input while typing
    const isValidDecimalInput = (
      value: string,
      maxDecimals: number = 2,
    ): boolean => {
      // Don't allow commas in input - only numbers and one optional decimal point
      if (value.includes(",")) {
        return false;
      }

      // Allow empty string
      if (value === "") return true;

      // Allow digits, one optional decimal point, and up to maxDecimals decimal places
      const decimalPattern = new RegExp(`^\\d*\\.?\\d{0,${maxDecimals}}$`);
      return decimalPattern.test(value);
    };

    // Helper to get display value (raw input if being edited, formatted otherwise)
    const getDisplayValue = (
      numericValue: number | undefined | null,
      choiceIndex: number,
      fieldType: "companyContribution" | "employeeContribution",
      maxDecimals: number = 2,
    ): string => {
      const rawValue =
        rawInputValues[
          `${selectedPolicyContext?.configOptionId}-${choiceIndex}`
        ]?.[fieldType];
      return rawValue !== undefined
        ? rawValue
        : formatNumberForDisplay(numericValue, maxDecimals);
    };

    const buildContributionLabel = (
      baseLabel: string,
      isAvailable: boolean,
    ): string => `${baseLabel}${isAvailable ? " *" : ""}`;

    const getPolicyComponent = (
      policyId: string,
    ): PolicyComponent | undefined => {
      return fullConfiguration.components.find((c) => c.id === policyId);
    };

    const selectedPolicyComponent = selectedPolicyContext
      ? getPolicyComponent(selectedPolicyContext.policyId)
      : undefined;
    const isMultipleSumInsuredModel =
      selectedPolicyComponent?.sumInsuredModel === SumInsuredModel.MULTIPLE;
    const maxDecimalsForContributions = isMultipleSumInsuredModel
      ? MAX_DECIMALS_MULTIPLE
      : MAX_DECIMALS_FLAT;
    const companyContributionLabelBase = isMultipleSumInsuredModel
      ? "Company Contribution per mille"
      : "Company Contribution";
    const employeeContributionLabelBase = isMultipleSumInsuredModel
      ? "Employee Contribution per mille"
      : "Employee Contribution";

    const getSumInsuredOptionDisplay = (
      policyId: string,
      sumInsuredId: number,
    ): string => {
      const component = getPolicyComponent(policyId);
      if (component) {
        const siOption = component.sumInsuredOptions.find(
          (sio) => sio.id === sumInsuredId,
        );
        if (siOption) {
          // Assuming siOption.value is a string representing a raw number (e.g., "500000")
          const numericValue = parseFloat(siOption.value);
          if (!isNaN(numericValue)) {
            // Determine max decimals based on sum insured model
            const maxDecimals =
              component.sumInsuredModel === SumInsuredModel.MULTIPLE
                ? MAX_DECIMALS_MULTIPLE
                : MAX_DECIMALS_FLAT;
            return formatNumberInputByLocalization(
              numericValue,
              localization,
              maxDecimals,
              0
            );
          }
        }
      }
      return `${SI_ID_PREFIX}${sumInsuredId}`;
    };

    const getEffectiveSIForChoice = (
      optionId: string,
      sumInsuredId: number,
      policyId: string,
    ): { effectiveSI: number; baseSI: number; enhancement: number } | null => {
      const option = policyOptions.find((o) => o.optionId === optionId);
      if (!option) return null;

      const dcMeta = option.optionMeta.find((meta) => {
        const param = fullConfiguration.parameters.find(
          (p: ConfiguredPolicyParameter) => p.id === meta.parameterId
        );
        return param?.type === "dependent-count";
      });
      if (!dcMeta) return null;

      const dcParam = fullConfiguration.parameters.find(
        (p: ConfiguredPolicyParameter) => p.id === dcMeta.parameterId
      ) as ConfiguredPolicyParameter | undefined;
      const band = dcParam?.dependentCountConfig?.countBands.find(
        (b) => b.id === dcMeta.parameterOptionId
      );
      if (!band) return null;

      const component = getPolicyComponent(policyId);
      const siOpt = component?.sumInsuredOptions.find((sio) => sio.id === sumInsuredId);
      const baseSI = siOpt ? parseFloat(siOpt.value) || 0 : 0;
      const enhancement = parseInt(band.siEnhancement || "0") || 0;
      return { effectiveSI: baseSI + enhancement, baseSI, enhancement };
    };

    useImperativeHandle(ref, () => ({
      async validateAndGetData() {
        const managerValidationResult = validateChoices(fullConfiguration); // Now using the hook's function
        const hasBlockingBasePolicyError =
          topLevelActionErrorMessages.length > 0;
        // Use the validation function from the hook
        const isValid = managerValidationResult && !hasBlockingBasePolicyError;

        return {
          isValid: isValid,
          data: {
            policyOptions: JSON.parse(JSON.stringify(policyOptions)), // Return a deep clone of the state
          },
        };
      },
    }));

    if (policyOptions.length === 0) {
      return (
        <Typography variant="body1">{NO_POLICY_CHOICES_MESSAGE}</Typography>
      );
    }

    return (
      <StyledTablePaper>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <HeaderTableCell>{POLICY_OPTION_HEADER}</HeaderTableCell>
              <HeaderTableCell>
                {AVAILABLE_POLICY_CHOICES_HEADER}
              </HeaderTableCell>
              <HeaderTableCell>
                {CONFIGURE_SELECTED_POLICY_CHOICE_HEADER}
              </HeaderTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {policyOptions.map((option) => (
              <TableRow key={option.optionId}>
                <BodyLabelCell>
                  <Typography variant="body2">{option.optionLabel}</Typography>
                </BodyLabelCell>
                <BodyLabelCell>
                  <Stack spacing={0.5}>
                    {/* Base Main Policy */}
                    {(() => {
                      const isSelected =
                        selectedPolicyContext?.configOptionId ===
                          option.optionId &&
                        selectedPolicyContext.policyId ===
                          option.basePolicyChoices.mainPolicyChoices.policyId;
                      const isUnconfiguredAndHighlight =
                        showHighlights &&
                        !option.basePolicyChoices.mainPolicyChoices.configured;
                      return (
                        <PlainChoiceButton
                          variant="text"
                          data-testid={"policy-choice-" + option.optionId}
                          size="small"
                          fullWidth
                          className={isSelected ? "selected" : ""}
                          onClick={() => {
                            setSelectedPolicyContext({
                              configOptionId: option.optionId,
                              policyBranch: "base",
                              choiceTarget: "main",
                              policyId:
                                option.basePolicyChoices.mainPolicyChoices
                                  .policyId,
                            });
                            setEditableChoices(
                              JSON.parse(
                                JSON.stringify(
                                  option.basePolicyChoices.mainPolicyChoices
                                    .choices,
                                ),
                              ),
                            );
                            setEditableChoicesErrors({});
                            setTopLevelActionErrorMessages([]); // Clear previous action errors
                          }}
                        >
                          <StyledCommonRadio
                            checked={isSelected}
                            activeIcon={
                              option.basePolicyChoices.mainPolicyChoices
                                .configured ? (
                                <StyledRadioImg
                                  src={SuccessImg}
                                  alt="configured"
                                />
                              ) : (
                                <StyledRadioImg
                                  src={RadioActiveImg}
                                  alt="selected"
                                />
                              )
                            }
                            inactiveIcon={
                              option.basePolicyChoices.mainPolicyChoices
                                .configured ? (
                                <StyledRadioImg
                                  src={SuccessImg}
                                  alt="configured"
                                />
                              ) : (
                                <StyledRadioImg
                                  src={RadioInactiveImg}
                                  alt="not selected"
                                />
                              )
                            }
                            disabled={!isEditable}
                          />
                          <Box component="span" style={{ flexGrow: 1 }}>
                            {getPolicyComponent(
                              option.basePolicyChoices.mainPolicyChoices
                                .policyId,
                            )?.label ||
                              option.basePolicyChoices.mainPolicyChoices
                                .policyId}{" "}
                            (Base)
                          </Box>
                        </PlainChoiceButton>
                      );
                    })()}

                    {/* Base Addons */}
                    {option.basePolicyChoices.addonChoices.map((addonMeta) =>
                      (() => {
                        const isSelected =
                          selectedPolicyContext?.configOptionId ===
                            option.optionId &&
                          selectedPolicyContext.policyId ===
                            addonMeta.policyId &&
                          selectedPolicyContext.policyBranch === "base";
                        return (
                          <StyledTextButton
                            key={`${option.optionId}-base-addon-${addonMeta.policyId}`}
                            variant="text"
                            data-testid={`${option.optionId}-base-addon-${addonMeta.policyId}`}
                            onClick={() => {
                              setSelectedPolicyContext({
                                configOptionId: option.optionId,
                                policyBranch: "base",
                                choiceTarget: "addon",
                                policyId: addonMeta.policyId,
                              });
                              setEditableChoices(
                                JSON.parse(JSON.stringify(addonMeta.choices)),
                              );
                              setEditableChoicesErrors({});
                              setTopLevelActionErrorMessages([]);
                            }}
                          >
                            <StyledCommonRadio
                              checked={isSelected}
                              activeIcon={
                                addonMeta.configured ? (
                                  <StyledRadioImg
                                    src={SuccessImg}
                                    alt="configured"
                                  />
                                ) : (
                                  <StyledRadioImg
                                    src={RadioActiveImg}
                                    alt="selected"
                                  />
                                )
                              }
                              inactiveIcon={
                                addonMeta.configured ? (
                                  <StyledRadioImg
                                    src={SuccessImg}
                                    alt="configured"
                                  />
                                ) : (
                                  <StyledRadioImg
                                    src={RadioInactiveImg}
                                    alt="not selected"
                                  />
                                )
                              }
                              disabled={!isEditable}
                            />
                            <Box component="span" sx={{ flexGrow: 1 }}>
                              {getPolicyComponent(addonMeta.policyId)?.label ||
                                addonMeta.policyId}{" "}
                              (Base Addon)
                            </Box>
                          </StyledTextButton>
                        );
                      })(),
                    )}

                    {/* Parental Main Policy (if exists) */}
                    {option.parentalPolicyChoices &&
                      (() => {
                        const isSelected =
                          selectedPolicyContext?.configOptionId ===
                            option.optionId &&
                          selectedPolicyContext.policyId ===
                            option.parentalPolicyChoices!.mainPolicyChoices
                              .policyId;
                        return (
                          <StyledTextActionButton
                            onClick={() => {
                              setSelectedPolicyContext({
                                configOptionId: option.optionId,
                                policyBranch: "parental",
                                choiceTarget: "main",
                                policyId:
                                  option.parentalPolicyChoices!
                                    .mainPolicyChoices.policyId,
                              });
                              setEditableChoices(
                                JSON.parse(
                                  JSON.stringify(
                                    option.parentalPolicyChoices!
                                      .mainPolicyChoices.choices,
                                  ),
                                ),
                              );
                              setEditableChoicesErrors({});
                              setTopLevelActionErrorMessages([]);
                            }}
                            data-testid={`parental-main-policy-${option.optionId}`}
                          >
                            <StyledCommonRadio
                              checked={isSelected}
                              activeIcon={
                                option.parentalPolicyChoices!.mainPolicyChoices
                                  .configured ? (
                                  <StyledRadioImg
                                    src={SuccessImg}
                                    alt="configured"
                                  />
                                ) : (
                                  <StyledRadioImg
                                    src={RadioActiveImg}
                                    alt="selected"
                                  />
                                )
                              }
                              inactiveIcon={
                                option.parentalPolicyChoices!.mainPolicyChoices
                                  .configured ? (
                                  <StyledRadioImg
                                    src={SuccessImg}
                                    alt="configured"
                                  />
                                ) : (
                                  <StyledRadioImg
                                    src={RadioInactiveImg}
                                    alt="not selected"
                                  />
                                )
                              }
                              disabled={!isEditable}
                            />
                            <Box component="span" sx={{ flexGrow: 1 }}>
                              {getPolicyComponent(
                                option.parentalPolicyChoices.mainPolicyChoices
                                  .policyId,
                              )?.label ||
                                option.parentalPolicyChoices.mainPolicyChoices
                                  .policyId}{" "}
                              (Parental)
                            </Box>
                          </StyledTextActionButton>
                        );
                      })()}

                    {/* Parental Addons (if exists) */}
                    {option.parentalPolicyChoices?.addonChoices.map(
                      (addonMeta) =>
                        (() => {
                          const isSelected =
                            selectedPolicyContext?.configOptionId ===
                              option.optionId &&
                            selectedPolicyContext.policyId ===
                              addonMeta.policyId &&
                            selectedPolicyContext.policyBranch === "parental";
                          return (
                            <StyledTextButton
                              key={`${option.optionId}-parental-addon-${addonMeta.policyId}`}
                              data-testid={`${option.optionId}-parental-addon-${addonMeta.policyId}`}
                              onClick={() => {
                                setSelectedPolicyContext({
                                  configOptionId: option.optionId,
                                  policyBranch: "parental",
                                  choiceTarget: "addon",
                                  policyId: addonMeta.policyId,
                                });
                                setEditableChoices(
                                  JSON.parse(JSON.stringify(addonMeta.choices)),
                                );
                                setEditableChoicesErrors({});
                                setTopLevelActionErrorMessages([]);
                              }}
                            >
                              <StyledCommonRadio
                                checked={isSelected}
                                activeIcon={
                                  addonMeta.configured ? (
                                    <StyledRadioImg
                                      src={SuccessImg}
                                      alt="configured"
                                    />
                                  ) : (
                                    <StyledRadioImg
                                      src={RadioActiveImg}
                                      alt="selected"
                                    />
                                  )
                                }
                                inactiveIcon={
                                  addonMeta.configured ? (
                                    <StyledRadioImg
                                      src={SuccessImg}
                                      alt="configured"
                                    />
                                  ) : (
                                    <StyledRadioImg
                                      src={RadioInactiveImg}
                                      alt="not selected"
                                    />
                                  )
                                }
                                disabled={!isEditable}
                              />
                              <Box component="span" sx={{ flexGrow: 1 }}>
                                {getPolicyComponent(addonMeta.policyId)
                                  ?.label || addonMeta.policyId}{" "}
                                (Parental Addon)
                              </Box>
                            </StyledTextButton>
                          );
                        })(),
                    )}
                  </Stack>
                </BodyLabelCell>
                <BodyLabelCell>
                  {selectedPolicyContext &&
                    selectedPolicyContext.configOptionId ===
                      option.optionId && (
                      <Stack
                        spacing={1.5}
                        data-testid={`policy-choices-${option.optionId}-container`}
                      >
                        <Typography variant="subtitle2" gutterBottom>
                          Configure:{" "}
                          {getPolicyComponent(selectedPolicyContext.policyId)
                            ?.label || selectedPolicyContext.policyId}
                        </Typography>
                        {topLevelActionErrorMessages.length > 0 && (
                          <StyledErrorAlert>
                            {topLevelActionErrorMessages.map((msg, idx) => (
                              <Typography key={idx} variant="body2">
                                {msg}
                              </Typography>
                            ))}
                          </StyledErrorAlert>
                        )}
                        {editableChoices.map((choice, index) => {
                          const errors =
                            editableChoicesErrors[choice.sumInsuredId] || {};

                          // Check if this choice is existing in LIVE mode
                          const isExistingChoice =
                            isLiveEditMode &&
                            selectedPolicyContext &&
                            isExistingPolicyChoice(
                              choice.sumInsuredId,
                              selectedPolicyContext.configOptionId,
                              selectedPolicyContext.policyBranch,
                              selectedPolicyContext.choiceTarget,
                              selectedPolicyContext.choiceTarget === "addon"
                                ? selectedPolicyContext.policyId
                                : undefined,
                              liveEditSnapshot,
                            );

                          // Check if there's already a default choice in the snapshot
                          const hasExistingDefault =
                            isLiveEditMode &&
                            selectedPolicyContext &&
                            hasExistingDefaultChoice(
                              selectedPolicyContext.configOptionId,
                              selectedPolicyContext.policyBranch,
                              selectedPolicyContext.choiceTarget,
                              selectedPolicyContext.choiceTarget === "addon"
                                ? selectedPolicyContext.policyId
                                : undefined,
                              liveEditSnapshot,
                            );

                          // Fields are disabled if not editable OR if it's an existing choice in LIVE mode
                          const fieldsDisabled =
                            !isEditable || isExistingChoice;

                          // Default checkbox is disabled if:
                          // 1. Choice is not available OR
                          // 2. It's an existing choice (already disabled via fieldsDisabled) OR
                          // 3. In LIVE mode, there's already a default choice and this is a NEW choice
                          const defaultCheckboxDisabled =
                            !choice.isAvailable ||
                            fieldsDisabled ||
                            (isLiveEditMode &&
                              hasExistingDefault &&
                              !isExistingChoice);
                          const defaultCheckboxTitle = isExistingChoice
                            ? "Cannot modify existing choice in LIVE mode"
                            : isLiveEditMode &&
                              hasExistingDefault &&
                              !isExistingChoice
                            ? "A default choice already exists in the LIVE configuration"
                            : "";

                          return (
                            <StyledChoiceBox>
                              <ChoiceText>
                                SI:{" "}
                                {getSumInsuredOptionDisplay(
                                  selectedPolicyContext.policyId,
                                  choice.sumInsuredId,
                                )}
                              </ChoiceText>
                              {(() => {
                                const siInfo = getEffectiveSIForChoice(
                                  selectedPolicyContext.configOptionId,
                                  choice.sumInsuredId,
                                  selectedPolicyContext.policyId,
                                );
                                if (!siInfo || siInfo.enhancement === 0) return null;
                                return (
                                  <Typography variant="caption" color="text.primary">
                                    Effective SI: ₹{formatNumberForDisplay(siInfo.effectiveSI)}
                                    {" "}(Base ₹{formatNumberForDisplay(siInfo.baseSI)} +
                                    Enhancement ₹{formatNumberForDisplay(siInfo.enhancement)})
                                  </Typography>
                                );
                              })()}
                              <FormControlLabel
                                data-testid={`policy-choice-${index}-available`}
                                control={
                                  <CommonCheckbox
                                    size="small"
                                    checked={choice.isAvailable}
                                    disabled={fieldsDisabled}
                                    title={
                                      isExistingChoice
                                        ? "Cannot modify existing choice in LIVE mode"
                                        : ""
                                    }
                                    onChange={(e) => {
                                      const newChoices = [...editableChoices];
                                      newChoices[index].isAvailable =
                                        e.target.checked;
                                      if (!e.target.checked) {
                                        // If unchecking available, also uncheck default
                                        newChoices[index].isDefault = false;
                                      }
                                      setEditableChoices(newChoices);
                                    }}
                                  />
                                }
                                label={
                                  <FadedLabel variant="caption">
                                    {AVAILABLE}
                                  </FadedLabel>
                                }
                              />
                              <FormControlLabel
                                data-testid={`policy-choice-${index}-default`}
                                control={
                                  <CommonCheckbox
                                    size="small"
                                    checked={choice.isDefault}
                                    disabled={defaultCheckboxDisabled}
                                    title={defaultCheckboxTitle}
                                    onChange={(e) => {
                                      const newChoices = editableChoices.map(
                                        (c, i) => ({
                                          ...c,
                                          isDefault:
                                            i === index
                                              ? e.target.checked
                                              : false,
                                        }),
                                      );
                                      setEditableChoices(newChoices);
                                    }}
                                  />
                                }
                                label={
                                  <FadedLabel variant="caption">
                                    {DEFAULT}
                                  </FadedLabel>
                                }
                              />
                              <CommonTextField
                                label={buildContributionLabel(
                                  companyContributionLabelBase,
                                  editableChoices[index].isAvailable,
                                )}
                                dataTestId={`policy-choice-${index}-company-contribution`}
                                value={getDisplayValue(
                                  choice.companyContribution,
                                  index,
                                  "companyContribution",
                                  maxDecimalsForContributions,
                                )}
                                onChange={(
                                  e: React.ChangeEvent<HTMLInputElement>,
                                ) => {
                                  const inputValue = e.target.value;
                                  const key = `${selectedPolicyContext?.configOptionId}-${index}`;

                                  // For copy-paste: if input has commas, clean them first
                                  let cleanedInputValue = inputValue;
                                  if (inputValue.includes(",")) {
                                    cleanedInputValue = inputValue.replace(
                                      /,/g,
                                      "",
                                    );
                                  }

                                  // Allow typing if it matches decimal pattern or is empty
                                  if (
                                    cleanedInputValue === "" ||
                                    isValidDecimalInput(
                                      cleanedInputValue,
                                      maxDecimalsForContributions,
                                    )
                                  ) {
                                    // Store cleaned raw input for immediate display
                                    setRawInputValues((prev) => ({
                                      ...prev,
                                      [key]: {
                                        ...prev[key],
                                        companyContribution: cleanedInputValue,
                                      },
                                    }));

                                    // Update the actual choice value
                                    const newChoices = [...editableChoices];
                                    newChoices[index].companyContribution =
                                      parseFormattedNumber(
                                        cleanedInputValue,
                                        maxDecimalsForContributions,
                                      );
                                    setEditableChoices(newChoices);
                                  }
                                }}
                                onBlur={() => {
                                  // Clear raw input on blur to show formatted value
                                  const key = `${selectedPolicyContext?.configOptionId}-${index}`;
                                  setRawInputValues((prev) => {
                                    const newValues = { ...prev };
                                    if (newValues[key]) {
                                      delete newValues[key].companyContribution;
                                      if (
                                        Object.keys(newValues[key]).length === 0
                                      ) {
                                        delete newValues[key];
                                      }
                                    }
                                    return newValues;
                                  });
                                }}
                                disabled={!choice.isAvailable || fieldsDisabled}
                                error={!!errors.companyContribution}
                                helperText={errors.companyContribution}
                                sx={{
                                  width: "220px",
                                  ...(showHighlights &&
                                    errors.companyContribution &&
                                    fieldHighlightSx),
                                }}
                              />
                              <CommonTextField
                                label={buildContributionLabel(
                                  employeeContributionLabelBase,
                                  editableChoices[index].isAvailable,
                                )}
                                dataTestId={`policy-choice-${index}-employee-contribution`}
                                value={getDisplayValue(
                                  choice.employeeContribution,
                                  index,
                                  "employeeContribution",
                                  maxDecimalsForContributions,
                                )}
                                onChange={(
                                  e: React.ChangeEvent<HTMLInputElement>,
                                ) => {
                                  const inputValue = e.target.value;
                                  const key = `${selectedPolicyContext?.configOptionId}-${index}`;

                                  // For copy-paste: if input has commas, clean them first
                                  let cleanedInputValue = inputValue;
                                  if (inputValue.includes(",")) {
                                    cleanedInputValue = inputValue.replace(
                                      /,/g,
                                      "",
                                    );
                                  }

                                  // Allow typing if it matches decimal pattern or is empty
                                  if (
                                    cleanedInputValue === "" ||
                                    isValidDecimalInput(
                                      cleanedInputValue,
                                      maxDecimalsForContributions,
                                    )
                                  ) {
                                    // Store cleaned raw input for immediate display
                                    setRawInputValues((prev) => ({
                                      ...prev,
                                      [key]: {
                                        ...prev[key],
                                        employeeContribution: cleanedInputValue,
                                      },
                                    }));

                                    // Update the actual choice value
                                    const newChoices = [...editableChoices];
                                    newChoices[index].employeeContribution =
                                      parseFormattedNumber(
                                        cleanedInputValue,
                                        maxDecimalsForContributions,
                                      );
                                    setEditableChoices(newChoices);
                                  }
                                }}
                                onBlur={() => {
                                  // Clear raw input on blur to show formatted value
                                  const key = `${selectedPolicyContext?.configOptionId}-${index}`;
                                  setRawInputValues((prev) => {
                                    const newValues = { ...prev };
                                    if (newValues[key]) {
                                      delete newValues[key]
                                        .employeeContribution;
                                      if (
                                        Object.keys(newValues[key]).length === 0
                                      ) {
                                        delete newValues[key];
                                      }
                                    }
                                    return newValues;
                                  });
                                }}
                                disabled={!choice.isAvailable || fieldsDisabled}
                                error={!!errors.employeeContribution}
                                helperText={errors.employeeContribution}
                                sx={{
                                  width: "220px",
                                }}
                              />
                            </StyledChoiceBox>
                          );
                        })}
                        <StyledOutlinedButton
                          variant="outlined"
                          data-testid={`set-choices-button-${option.optionId}`}
                          onClick={() => {
                            let isValid = true;
                            const newErrors: Record<
                              number,
                              EditableChoiceError
                            > = {}; // Start fresh for field-specific errors
                            const currentActionErrors: string[] = [];
                            let defaultCount = 0;
                            let availableCount = 0;

                            editableChoices.forEach((c) => {
                              if (c.isDefault) defaultCount++;
                              if (c.isAvailable) {
                                const companyContrib = c.companyContribution;
                                const employeeContrib = c.employeeContribution;

                                availableCount++;
                                if (companyContrib < 0) {
                                  if (!newErrors[c.sumInsuredId])
                                    newErrors[c.sumInsuredId] = {};
                                  newErrors[
                                    c.sumInsuredId
                                  ].companyContribution = CANNOT_BE_NEGATIVE;
                                  isValid = false;
                                }
                                if (employeeContrib < 0) {
                                  if (!newErrors[c.sumInsuredId])
                                    newErrors[c.sumInsuredId] = {};
                                  newErrors[
                                    c.sumInsuredId
                                  ].employeeContribution = CANNOT_BE_NEGATIVE;
                                  isValid = false;
                                }

                                if (
                                  companyContrib <= 0 &&
                                  employeeContrib <= 0
                                ) {
                                  currentActionErrors.push(
                                    `For SI ${getSumInsuredOptionDisplay(
                                      selectedPolicyContext.policyId,
                                      c.sumInsuredId,
                                    )}: At least one contribution must be positive if 'Available' is checked.`,
                                  );
                                  isValid = false;
                                  // Also set field-level errors to trigger highlight
                                  const fieldErrorMsg =
                                    MUST_BE_GREATER_THAN_ZERO;
                                  if (!newErrors[c.sumInsuredId])
                                    newErrors[c.sumInsuredId] = {};
                                  if (companyContrib <= 0)
                                    newErrors[
                                      c.sumInsuredId
                                    ].companyContribution =
                                      newErrors[c.sumInsuredId]
                                        ?.companyContribution || fieldErrorMsg;
                                  if (employeeContrib <= 0)
                                    newErrors[
                                      c.sumInsuredId
                                    ].employeeContribution =
                                      newErrors[c.sumInsuredId]
                                        ?.employeeContribution || fieldErrorMsg;
                                }
                              }
                            });

                            if (
                              selectedPolicyContext.policyBranch === "base" &&
                              selectedPolicyContext.choiceTarget === "main"
                            ) {
                              if (availableCount === 0) {
                                currentActionErrors.push(
                                  BASE_POLICY_AVAILABLE_ERROR,
                                );
                                isValid = false;
                              } else if (defaultCount === 0) {
                                currentActionErrors.push(
                                  BASE_POLICY_DEFAULT_ERROR,
                                );
                                isValid = false;
                              }
                            }

                            setTopLevelActionErrorMessages(currentActionErrors);
                            setEditableChoicesErrors(newErrors);

                            if (defaultCount > 1) {
                              console.error(MULTIPLE_DEFAULT_CHOICES_ERROR);
                            }

                            if (isValid && currentActionErrors.length === 0) {
                              updateConfiguredPolicyOptionChoiceDetails(
                                selectedPolicyContext.configOptionId,
                                selectedPolicyContext.policyBranch,
                                selectedPolicyContext.choiceTarget,
                                selectedPolicyContext.choiceTarget === "addon"
                                  ? selectedPolicyContext.policyId
                                  : undefined,
                                editableChoices,
                              );
                            }
                          }}
                          disabled={!isEditable}
                        >
                          <Typography>{SET_CHOICES}</Typography>
                        </StyledOutlinedButton>
                      </Stack>
                    )}
                  {!selectedPolicyContext && isEditable && (
                    <Typography variant="caption">
                      {SELECT_POLICY_TO_CONFIGURE_MSG}
                    </Typography>
                  )}
                  {/* {!isEditable && (
                  <Typography variant="caption" >
                    {CONFIGURATION_READ_ONLY_MSG}
                  </Typography>
                )} */}
                </BodyLabelCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </StyledTablePaper>
    );
  },
);

PolicyChoicesSection.displayName = "PolicyChoicesSection";
