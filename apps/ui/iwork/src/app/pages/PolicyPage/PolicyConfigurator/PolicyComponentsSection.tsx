import {
  FormControl,
  Stack,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from "@mui/material";
import { CommonCheckbox, CommonSwitch, CommonTextField } from "@ui/ui-lib";
import React, { forwardRef, useEffect, useImperativeHandle } from "react";
import addIcon from "../../../assets/svgs/add-card.svg";
import removeIcon from "../../../assets/svgs/remove-card.svg";
import {
  POLICY_COMPONENTS,
  MAX_DECIMALS_FLAT,
  MAX_DECIMALS_MULTIPLE,
} from "../../../constants";
import { usePolicyComponentsManager } from "../hooks/usePolicyComponentsManager";
import {
  formatIndianNumbering,
  formatInternationalNumbering,
} from "../utils/formatters";
import { fieldHighlightSx, SumInsuredInputField } from "./ConfiguratorFields";
import {
  COMMA_FORMATTING,
  COMMA_SEPARATOR,
  PolicyComponent,
  PolicyComponentTypeMaster,
  SumInsuredModel,
} from "./policytypes";
import { SectionRef } from "./sectionRef";
import {
  AddIcon,
  RemoveIcon,
  StyledAddOptionalComponentButton,
  StyledAddParentalPolicyButton,
  StyledAddSumInsuredIconButton,
  StyledCommonSwitchTypography,
  StyledComponentTypeTypography,
  StyledFixedTable,
  StyledFormControlDiv,
  StyledFormControlForCompanyContribution,
  StyledNoPolicyComponentsText,
  StyledRemoveIconButton,
  StyledRowStack,
  StyledSpacingStack,
  StyledStackConatiner,
  StyledStackForConfigDetails,
  StyledStackForSwitch,
  StyledSumInsuredBox,
  StyledTableCell,
  StyledTableHead,
  StyledTablePaper,
} from "./styles";
import {
  isExistingComponent,
  isExistingSumInsured,
} from "../utils/liveEditHelpers";

interface FormErrors {
  [componentId: string]: {
    label?: string;
    siMultipleLabel?: string;
  };
}

interface PolicyComponentsSectionProps {
  initialData: PolicyComponent[];
  isEditable: boolean;
  showHighlights: boolean;
  onFocusChange?: (id: string | null) => void;
  isLiveEditMode?: boolean;
  liveEditSnapshot?: PolicyComponent[];
}

export const PolicyComponentsSection = forwardRef<
  SectionRef,
  PolicyComponentsSectionProps
>(
  (
    {
      initialData,
      isEditable,
      showHighlights,
      onFocusChange,
      isLiveEditMode,
      liveEditSnapshot,
    },
    ref,
  ) => {
    const {
      policyComponents: internalPolicyComponents,
      formErrors: internalFormErrors,
      focusTargetId, // from manager
      setFocusTargetId, // from manager
      handleAddSumInsured,
      handleRemoveSumInsured,
      handleSumInsuredValueChange,
      getLabelError,
      // updateLabelErrorState, // We'll rely on getLabelError for display and validateComponents for logic
      handleComponentLabelChange,
      handleRemoveParentalPolicy,
      handleAddParentalPolicy,
      handleAddOptionalComponent,
      handleRemoveComponent,
      handleSumInsuredModelChange,
      handleSiMultipleLabelChange,
      handleSiMultipleMinChange,
      handleSiMultipleMaxChange,
      handleShowCompanyContributionChange,
      handleProRationEnabledChange,
      handleAcceptRelationsFromParentChange,
      handlePremiumPerLifeChange,
      handleSumInsuredPerLifeChange,
      handleIsBenefitComponentChange,
      handleIsOptionalChange,
      initializePolicyComponents,
    } = usePolicyComponentsManager();

    useEffect(() => {
      initializePolicyComponents(initialData);
    }, [initialData, initializePolicyComponents]);

    useEffect(() => {
      if (onFocusChange && focusTargetId) {
        onFocusChange(focusTargetId);
        setFocusTargetId(null); // Reset after consuming
      }
    }, [focusTargetId, onFocusChange, setFocusTargetId]);

    const validateComponents = (): boolean => {
      let allValid = true;
      // The usePolicyComponentsManager's getLabelError and internal logic should
      // be sufficient for validation. We just need to iterate and check.
      // The manager should ideally expose a comprehensive validation function or update its formErrors state.
      // For now, we'll re-check labels here.
      const currentErrors: FormErrors = {};
      internalPolicyComponents.forEach((comp) => {
        const labelError = getLabelError(comp.label || "", comp.id, comp.type);
        if (labelError) {
          if (!currentErrors[comp.id]) currentErrors[comp.id] = {};
          currentErrors[comp.id].label = labelError;
          allValid = false;
        }
        if (
          !comp.sumInsuredOptions.every((opt) => {
            const num = parseFloat(opt.value.replace(/,/g, ""));
            // FR-054: SI=0 is accepted for any optional component, not just benefit components.
            // A blank value on an optional component is treated as 0 — also valid.
            const allowZero = comp.type === "optional";
            const isBlank = opt.value.trim() === "";
            if (allowZero) {
              return isBlank || (!isNaN(num) && num >= 0);
            }
            return !isBlank && !isNaN(num) && num > 0;
          })
        ) {
          allValid = false; // Rely on SumInsuredInputField visual cues for this
        }
        if (
          comp.sumInsuredModel === SumInsuredModel.MULTIPLE &&
          !comp.siMultipleLabel?.trim()
        ) {
          if (!currentErrors[comp.id]) currentErrors[comp.id] = {};
          currentErrors[comp.id].siMultipleLabel =
            "Label for 'Multiple of' is required.";
          allValid = false;
        }
        if (comp.label?.trim() === "") {
          if (!currentErrors[comp.id]) currentErrors[comp.id] = {};
          currentErrors[comp.id].label = "Label is required.";
          allValid = false;
        }
      });
      // The manager should ideally update its own formErrors state.
      // If not, we might need a setFormErrors in the manager.
      // For now, this validation primarily determines the `isValid` flag.
      // The `internalFormErrors` from the hook should reflect errors upon interaction.
      return allValid;
    };

    useImperativeHandle(ref, () => ({
      async validateAndGetData() {
        const isValid = validateComponents(); // This should ideally trigger error state updates in the manager
        // or the manager provides a validate function that does so.
        if (isValid) {
          return {
            isValid: true,
            data: {
              components: JSON.parse(JSON.stringify(internalPolicyComponents)),
            },
          };
        }
        // If not valid, the internalFormErrors from the hook should be up-to-date
        // due to onBlur/onChange handlers calling updateLabelErrorState.
        return { isValid: false, data: null };
      },
    }));

    return (
      <>
        {isEditable && (
          <StyledStackConatiner>
            {!internalPolicyComponents.find((c) => c.type === "parental") && (
              <StyledAddParentalPolicyButton
                variant="outlined"
                size="small"
                onClick={handleAddParentalPolicy}
              >
                {POLICY_COMPONENTS.ADD_PARENTAL_POLICY}
              </StyledAddParentalPolicyButton>
            )}

            <StyledAddOptionalComponentButton
              onClick={handleAddOptionalComponent}
              variant="outlined"
              size="small"
              // startIcon={<AddIcon src={addIcon} alt="Add" />}
            >
              {POLICY_COMPONENTS.ADD_OPTIONAL_COMPONENT}
            </StyledAddOptionalComponentButton>
          </StyledStackConatiner>
        )}
        <StyledTablePaper>
          <StyledFixedTable size="small">
            <StyledTableHead>
              <TableRow>
                <StyledTableCell cellwidth="7%">
                  {POLICY_COMPONENTS.TABLE_HEADER.ACTION}
                </StyledTableCell>
                <StyledTableCell cellwidth="13%">
                  {POLICY_COMPONENTS.TABLE_HEADER.TYPE}
                </StyledTableCell>
                <StyledTableCell cellwidth="38%">
                  {POLICY_COMPONENTS.TABLE_HEADER.CONFIGURATION_DETAILS}
                </StyledTableCell>
                <StyledTableCell cellwidth="42%">
                  {POLICY_COMPONENTS.TABLE_HEADER.SUM_INSURED_OPTIONS}
                </StyledTableCell>
              </TableRow>
            </StyledTableHead>
            <TableBody>
              {internalPolicyComponents.map((comp) => (
                <TableRow key={comp.id}>
                  <PolicyComponentRow
                    comp={comp}
                    isEditable={isEditable}
                    showHighlights={showHighlights}
                    componentErrors={
                      (internalFormErrors as { [key: string]: FormErrors })[
                        comp.id
                      ] || {}
                    }
                    getLabelError={getLabelError} // Pass this down for onBlur validation in row
                    onRemoveComponent={
                      comp.type === "parental"
                        ? handleRemoveParentalPolicy
                        : () => handleRemoveComponent(comp.id)
                    }
                    onComponentLabelChange={handleComponentLabelChange}
                    onAddSumInsured={handleAddSumInsured}
                    onRemoveSumInsured={handleRemoveSumInsured}
                    onSumInsuredValueChange={handleSumInsuredValueChange}
                    onSumInsuredModelChange={handleSumInsuredModelChange}
                    onSiMultipleLabelChange={handleSiMultipleLabelChange}
                    onSiMultipleMinChange={handleSiMultipleMinChange}
                    onSiMultipleMaxChange={handleSiMultipleMaxChange}
                    onShowCompanyContributionChange={
                      handleShowCompanyContributionChange
                    }
                    onProRationEnabledChange={handleProRationEnabledChange}
                    onAcceptRelationsFromParentChange={
                      handleAcceptRelationsFromParentChange
                    }
                    onPremiumPerLifeChange={handlePremiumPerLifeChange}
                    onSumInsuredPerLifeChange={handleSumInsuredPerLifeChange}
                    onIsBenefitComponentChange={handleIsBenefitComponentChange}
                    onIsOptionalChange={handleIsOptionalChange}
                    isLiveEditMode={isLiveEditMode}
                    liveEditSnapshot={liveEditSnapshot}
                  />
                </TableRow>
              ))}
            </TableBody>
          </StyledFixedTable>
          {internalPolicyComponents.filter((c) => c.type === "optional")
            .length === 0 &&
            !internalPolicyComponents.find((c) => c.type === "parental") &&
            !isEditable && (
              <StyledNoPolicyComponentsText variant="body1">
                {POLICY_COMPONENTS.ADDITIONAL_POLICY_COMPONENT_ERROR}
              </StyledNoPolicyComponentsText>
            )}
        </StyledTablePaper>
      </>
    );
  },
);

PolicyComponentsSection.displayName = "PolicyComponentsSection";

interface PolicyComponentRowProps {
  comp: PolicyComponent;
  isEditable: boolean;
  showHighlights: boolean;
  componentErrors: { label?: string; siMultipleLabel?: string };
  getLabelError: (
    label: string,
    componentId: string,
    componentType: string,
  ) => string | undefined;
  onRemoveComponent: () => void;
  onComponentLabelChange: (componentId: string, newLabel: string) => void;
  onAddSumInsured: (componentId: string) => void;
  onRemoveSumInsured: (componentId: string, optionId: number) => void;
  onSumInsuredValueChange: (
    componentId: string,
    optionId: number,
    value: string,
  ) => void;
  onSumInsuredModelChange: (
    componentId: string,
    model: SumInsuredModel,
  ) => void;
  onSiMultipleLabelChange: (componentId: string, label: string) => void;
  onSiMultipleMinChange: (componentId: string, min: string) => void;
  onSiMultipleMaxChange: (componentId: string, max: string) => void;
  onShowCompanyContributionChange: (componentId: string, show: boolean) => void;
  onProRationEnabledChange: (componentId: string, enabled: boolean) => void;
  onAcceptRelationsFromParentChange: (
    componentId: string,
    accept: boolean,
  ) => void;
  onPremiumPerLifeChange: (componentId: string, perLife: boolean) => void;
  onSumInsuredPerLifeChange: (componentId: string, perLife: boolean) => void;
  onIsBenefitComponentChange: (componentId: string, checked: boolean) => void;
  onIsOptionalChange: (componentId: string, checked: boolean) => void;
  isLiveEditMode?: boolean;
  liveEditSnapshot?: PolicyComponent[];
}

const PolicyComponentRow: React.FC<PolicyComponentRowProps> = ({
  comp,
  isEditable,
  showHighlights,
  componentErrors,
  getLabelError, // For onBlur validation
  onRemoveComponent,
  onComponentLabelChange,
  onAddSumInsured,
  onRemoveSumInsured,
  onSumInsuredValueChange,
  onSumInsuredModelChange,
  onSiMultipleLabelChange,
  onSiMultipleMinChange,
  onSiMultipleMaxChange,
  onShowCompanyContributionChange,
  onProRationEnabledChange,
  onAcceptRelationsFromParentChange,
  onPremiumPerLifeChange,
  onSumInsuredPerLifeChange,
  onIsBenefitComponentChange,
  onIsOptionalChange,
  isLiveEditMode,
  liveEditSnapshot,
}) => {
  const [localLabel, setLocalLabel] = React.useState(comp.label || "");
  const [localMinSI, setLocalMinSI] = React.useState<string>("");
  const [localMaxSI, setLocalMaxSI] = React.useState<string>("");
  const [labelErrorText, setLabelErrorText] = React.useState<
    string | undefined
  >(undefined);

  const formatNumberForDisplay = (value: number | undefined): string => {
    if (value === undefined || value === null || isNaN(value)) {
      return "";
    }
    if (COMMA_FORMATTING === "CRORE") {
      return formatIndianNumbering(String(value), COMMA_SEPARATOR);
    }
    if (COMMA_FORMATTING === "MILLION") {
      return formatInternationalNumbering(String(value), COMMA_SEPARATOR);
    }
    return String(value);
  };

  useEffect(() => {
    setLocalLabel(comp.label || "");
    setLabelErrorText(componentErrors.label); // Sync with errors from manager
  }, [comp.label, componentErrors.label]);

  useEffect(() => {
    setLocalMinSI(formatNumberForDisplay(comp.siMultipleMin));
  }, [comp.siMultipleMin]);

  useEffect(() => {
    setLocalMaxSI(formatNumberForDisplay(comp.siMultipleMax));
  }, [comp.siMultipleMax]);

  const masterTypeInfo = PolicyComponentTypeMaster.find(
    (m) => m.type === comp.type,
  );

  const handleLabelBlur = () => {
    onComponentLabelChange(comp.id, localLabel || "");
    // Trigger validation in the manager hook, which should update formErrors
    // This might involve calling `updateLabelErrorState` from the manager if it's exposed
    // or relying on the manager's internal logic.
    // For immediate feedback in the row:
    const error = getLabelError(localLabel || "", comp.id, comp.type);
    setLabelErrorText(error);
  };

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9.,]/g, "");
    val = val.replace(/[^0-9.]/g, "");
    const parts = val.split(".");

    // Ensure only one decimal point
    if (parts.length > 2) {
      val = parts[0] + "." + parts.slice(1).join("");
    }

    // Determine max decimal places based on sumInsuredModel
    const maxDecimals =
      comp.sumInsuredModel === SumInsuredModel.MULTIPLE
        ? MAX_DECIMALS_MULTIPLE
        : MAX_DECIMALS_FLAT;

    // Limit decimal places based on sumInsuredModel
    if (parts.length === 2) {
      const integerPart = parts[0];
      const decimalPart = parts[1];

      if (decimalPart.length > maxDecimals) {
        val = integerPart + "." + decimalPart.substring(0, maxDecimals);
      }
    }

    setLocalMinSI(val);
  };

  const handleMinBlur = () => {
    onSiMultipleMinChange(comp.id, localMinSI);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9.,]/g, "");
    val = val.replace(/[^0-9.]/g, "");
    const parts = val.split(".");

    // Ensure only one decimal point
    if (parts.length > 2) {
      val = parts[0] + "." + parts.slice(1).join("");
    }

    // Determine max decimal places based on sumInsuredModel
    const maxDecimals =
      comp.sumInsuredModel === SumInsuredModel.MULTIPLE
        ? MAX_DECIMALS_MULTIPLE
        : MAX_DECIMALS_FLAT;

    // Limit decimal places based on sumInsuredModel
    if (parts.length === 2) {
      const integerPart = parts[0];
      const decimalPart = parts[1];

      if (decimalPart.length > maxDecimals) {
        val = integerPart + "." + decimalPart.substring(0, maxDecimals);
      }
    }

    setLocalMaxSI(val);
  };

  const handleMaxBlur = () => {
    onSiMultipleMaxChange(comp.id, localMaxSI);
  };

  const handleSumInsuredModelChange = (newModel: SumInsuredModel) => {
    // Reset min and max SI values when switching models
    onSiMultipleMinChange(comp.id, "");
    onSiMultipleMaxChange(comp.id, "");
    // Clear all sum insured option values
    comp.sumInsuredOptions.forEach((option) => {
      onSumInsuredValueChange(comp.id, option.id, "");
    });
    // Update the sum insured model
    onSumInsuredModelChange(comp.id, newModel);
  };

  // Check if component can be deleted
  const canDeleteComponent = !(
    isLiveEditMode && isExistingComponent(comp.id, liveEditSnapshot)
  );

  // Check if this is an existing component - if yes, disable certain fields
  const isExistingComp =
    isLiveEditMode && isExistingComponent(comp.id, liveEditSnapshot);
  const canEditComponentConfig = !isExistingComp;

  return (
    <React.Fragment>
      <TableCell>
        {isEditable && comp.type !== "base" && canDeleteComponent && (
          <StyledRemoveIconButton
            onClick={() => onRemoveComponent()}
            size="small"
            aria-label={`remove ${comp.type} component`}
          >
            <RemoveIcon src={removeIcon} />
          </StyledRemoveIconButton>
        )}
      </TableCell>
      <TableCell>
        <StyledComponentTypeTypography
          variant="body1"
          isBase={comp.type === "base"}
        >
          {masterTypeInfo?.label || comp.type}
        </StyledComponentTypeTypography>
      </TableCell>
      <TableCell>
        <StyledStackForConfigDetails>
          <CommonTextField
            id={`${comp.id}-label`}
            label="Display Label *"
            dataTestId={`${comp.id}-policy-input`}
            value={localLabel}
            onChange={(e) => setLocalLabel(e.target.value)}
            onBlur={handleLabelBlur}
            error={!!labelErrorText || (showHighlights && !comp.label?.trim())}
            helperText={labelErrorText}
            fullWidth
            disabled={!isEditable || isExistingComp}
            maxWidth={"360px"}
            sx={{
              ...(showHighlights && !comp.label?.trim() && !labelErrorText
                ? fieldHighlightSx
                : {}),
            }}
          />
          <FormControl
            component="fieldset"
            fullWidth
            disabled={!isEditable || isExistingComp}
            size="small"
            data-testid={`${comp.id}-sum-insured-model-switch`}
          >
            <StyledSumInsuredBox>
              {POLICY_COMPONENTS.SUM_INSURED_MODEL}
            </StyledSumInsuredBox>
            <StyledStackForSwitch>
              <StyledCommonSwitchTypography
                variant="body2"
                isActive={comp.sumInsuredModel === SumInsuredModel.FLAT}
                onClick={() =>
                  isEditable &&
                  canEditComponentConfig &&
                  handleSumInsuredModelChange(SumInsuredModel.FLAT)
                }
              >
                {POLICY_COMPONENTS.SWITCH_LEFT_TEXT_SUM_INSURED}
              </StyledCommonSwitchTypography>
              <CommonSwitch
                checked={comp.sumInsuredModel === SumInsuredModel.MULTIPLE}
                disabled={!isEditable || isExistingComp}
                onChange={(e) =>
                  handleSumInsuredModelChange(
                    e.target.checked
                      ? SumInsuredModel.MULTIPLE
                      : SumInsuredModel.FLAT,
                  )
                }
                size="small"
                inputProps={{ "aria-label": "sum insured model switch" }}
              />
              <StyledCommonSwitchTypography
                variant="body2"
                isActive={comp.sumInsuredModel === SumInsuredModel.MULTIPLE}
                onClick={() =>
                  isEditable &&
                  canEditComponentConfig &&
                  handleSumInsuredModelChange(SumInsuredModel.MULTIPLE)
                }
              >
                {POLICY_COMPONENTS.SWITCH_RIGHT_TEXT_SUM_INSURED}
              </StyledCommonSwitchTypography>
            </StyledStackForSwitch>
          </FormControl>

          {comp.sumInsuredModel === SumInsuredModel.MULTIPLE && (
            <>
              <Stack direction="row" spacing={2}>
                <CommonTextField
                  id={`${comp.id}-si-multiple-label`}
                  dataTestId={`${comp.id}-sum-multiple-label`}
                  label="Multiple of..."
                  value={comp.siMultipleLabel}
                  onChange={(e) =>
                    onSiMultipleLabelChange(comp.id, e.target.value)
                  }
                  error={
                    !!componentErrors.siMultipleLabel ||
                    (showHighlights &&
                      comp.sumInsuredModel === SumInsuredModel.MULTIPLE &&
                      !comp.siMultipleLabel?.trim())
                  }
                  helperText={componentErrors.siMultipleLabel}
                  disabled={!isEditable || isExistingComp}
                  required
                  sx={{
                    width: "110px",
                    ...(showHighlights &&
                    comp.sumInsuredModel === SumInsuredModel.MULTIPLE &&
                    !componentErrors.siMultipleLabel &&
                    !comp.siMultipleLabel?.trim()
                      ? fieldHighlightSx
                      : {}),
                  }}
                />
                <CommonTextField
                  id={`${comp.id}-si-multiple-min`}
                  dataTestId={`${comp.id}-sum-multiple-min`}
                  label="Min SI"
                  type="text"
                  value={localMinSI}
                  onChange={handleMinChange}
                  onBlur={handleMinBlur}
                  disabled={!isEditable || isExistingComp}
                  sx={{ width: "120px" }}
                />
                <CommonTextField
                  id={`${comp.id}-si-multiple-max`}
                  dataTestId={`${comp.id}-sum-multiple-max`}
                  label="Max SI"
                  type="text"
                  value={localMaxSI}
                  onChange={handleMaxChange}
                  onBlur={handleMaxBlur}
                  disabled={!isEditable || isExistingComp}
                  sx={{ width: "120px" }}
                />
              </Stack>
            </>
          )}
        </StyledStackForConfigDetails>
      </TableCell>
      <TableCell>
        <StyledSpacingStack>
          <StyledRowStack>
            {comp.sumInsuredOptions.map((option) => (
              <SumInsuredInputField
                key={`${comp.id}-${option.id}`}
                option={option}
                component={comp}
                label={
                  // Corrected label logic
                  comp.sumInsuredModel === SumInsuredModel.MULTIPLE
                    ? `${comp.siMultipleLabel || "CTC"} Multiple *`
                    : "SI Amount *"
                }
                onChangeCallback={(optId, val) =>
                  onSumInsuredValueChange(comp.id, optId, val)
                }
                onRemoveCallback={(optId) => onRemoveSumInsured(comp.id, optId)}
                showHighlight={showHighlights}
                isReviewMode={!isEditable}
                isLiveEditMode={isLiveEditMode}
                liveEditSnapshot={liveEditSnapshot}
                isExistingComponent={isExistingComp}
              />
            ))}
            {isEditable && (
              <StyledAddSumInsuredIconButton
                onClick={() => onAddSumInsured(comp.id)}
                size="small"
                color="primary"
                hasOptions={comp.sumInsuredOptions.length > 0}
              >
                <AddIcon src={addIcon} alt="Add" />
              </StyledAddSumInsuredIconButton>
            )}
          </StyledRowStack>

          <Stack direction="column" spacing={3}>
            <StyledFormControlForCompanyContribution
              data-testid={`${comp.id}-policy-show-company-contribution`}
              control={
                <CommonCheckbox
                  checked={comp.showCompanyContribution}
                  onChange={(e) =>
                    onShowCompanyContributionChange(comp.id, e.target.checked)
                  }
                  disabled={!isEditable || isExistingComp}
                  size="small"
                />
              }
              label={
                <Typography variant="body2">
                  {POLICY_COMPONENTS.SHOW_COMPANY_CONTRIBUTION}
                </Typography>
              }
              disabled={!isEditable || isExistingComp}
            />
            {/* New field for pro-ration */}
            <StyledFormControlForCompanyContribution
              data-testid={`${comp.id}-policy-pro-ration-enabled`}
              control={
                <CommonCheckbox
                  checked={comp.proRationEnabled ?? true}
                  onChange={(e) =>
                    onProRationEnabledChange(comp.id, e.target.checked)
                  }
                  disabled={!isEditable || isExistingComp}
                  size="small"
                />
              }
              label={
                <Typography variant="body2">
                  {POLICY_COMPONENTS.PRO_RATION_ENABLED}
                </Typography>
              }
              disabled={!isEditable || isExistingComp}
            />
            {/* Accept relations from parent component — UI-only flag, stored in JSONB */}
            <StyledFormControlForCompanyContribution
              data-testid={`${comp.id}-accept-relations-from-parent`}
              control={
                <CommonCheckbox
                  checked={comp.acceptRelationsFromParent ?? false}
                  onChange={(e) =>
                    onAcceptRelationsFromParentChange(
                      comp.id,
                      e.target.checked,
                    )
                  }
                  disabled={!isEditable || isExistingComp}
                  size="small"
                />
              }
              label={
                <Typography variant="body2">
                  {POLICY_COMPONENTS.ACCEPT_RELATIONS_FROM_PARENT}
                </Typography>
              }
              disabled={!isEditable || isExistingComp}
            />

            {/* Benefit / Waiver Component — only for optional add-on components */}
            {comp.type === "optional" && (
              <StyledFormControlForCompanyContribution
                data-testid={`${comp.id}-is-benefit-component`}
                control={
                  <CommonCheckbox
                    checked={comp.isBenefitComponent ?? false}
                    onChange={(e) =>
                      onIsBenefitComponentChange(comp.id, e.target.checked)
                    }
                    disabled={!isEditable || isExistingComp}
                    size="small"
                  />
                }
                label={
                  <Typography variant="body2">
                    {POLICY_COMPONENTS.IS_BENEFIT_COMPONENT}
                  </Typography>
                }
                disabled={!isEditable || isExistingComp}
              />
            )}

            {/* Optional component — when checked, IBP renders this under the
                Optional accordion instead of the Compulsory dropdown, so enrolment
                can complete without selecting it. Offered on base and parental,
                the two types that are compulsory by default; `optional` components
                are already in that bucket and `flex` is bucketed separately. */}
            {(comp.type === "base" || comp.type === "parental") && (
              <StyledFormControlForCompanyContribution
                data-testid={`${comp.id}-is-optional`}
                control={
                  <CommonCheckbox
                    checked={comp.isOptional ?? false}
                    onChange={(e) =>
                      onIsOptionalChange(comp.id, e.target.checked)
                    }
                    disabled={!isEditable || isExistingComp}
                    size="small"
                  />
                }
                label={
                  <Typography variant="body2">
                    {POLICY_COMPONENTS.IS_OPTIONAL}
                  </Typography>
                }
                disabled={!isEditable || isExistingComp}
              />
            )}

            <StyledFormControlDiv disabled={!isEditable || isExistingComp}>
              <StyledStackForSwitch
                data-testid={`${comp.id}-premium-calculation-switch`}
              >
                <Typography variant="body2">Premium Calculation -</Typography>
                <StyledCommonSwitchTypography
                  variant="body2"
                  isActive={!comp.premiumPerLife}
                  onClick={() =>
                    isEditable &&
                    canEditComponentConfig &&
                    onPremiumPerLifeChange(comp.id, false)
                  }
                >
                  {POLICY_COMPONENTS.SWITCH_LEFT_TEXT_COMPANY_CONTRIBUTION}
                </StyledCommonSwitchTypography>
                <CommonSwitch
                  checked={comp.premiumPerLife}
                  onChange={(e) =>
                    onPremiumPerLifeChange(comp.id, e.target.checked)
                  }
                  disabled={!isEditable || isExistingComp}
                  size="small"
                  inputProps={{
                    "aria-label": "premium calculation type switch",
                  }}
                />
                <StyledCommonSwitchTypography
                  variant="body2"
                  isActive={comp.premiumPerLife}
                  onClick={() =>
                    isEditable &&
                    canEditComponentConfig &&
                    onPremiumPerLifeChange(comp.id, true)
                  }
                >
                  {POLICY_COMPONENTS.SWITCH_RIGHT_TEXT_COMPANY_CONTRIBUTION}
                </StyledCommonSwitchTypography>
              </StyledStackForSwitch>
            </StyledFormControlDiv>
            <StyledFormControlDiv disabled={!isEditable || isExistingComp}>
              <StyledStackForSwitch
                data-testid={`${comp.id}-sum-insured-calculation-switch`}
              >
                <Typography variant="body2">Sum Insured -</Typography>
                <StyledCommonSwitchTypography
                  variant="body2"
                  isActive={!comp.sumInsuredPerLife}
                  onClick={() =>
                    isEditable &&
                    canEditComponentConfig &&
                    onSumInsuredPerLifeChange(comp.id, false)
                  }
                >
                  {POLICY_COMPONENTS.SWITCH_LEFT_TEXT_COMPANY_CONTRIBUTION}
                </StyledCommonSwitchTypography>
                <CommonSwitch
                  checked={!!comp.sumInsuredPerLife}
                  onChange={(e) =>
                    onSumInsuredPerLifeChange(comp.id, e.target.checked)
                  }
                  disabled={!isEditable || isExistingComp}
                  size="small"
                  slotProps={{ input: { "aria-label": "sum insured calculation type switch" } }}
                />
                <StyledCommonSwitchTypography
                  variant="body2"
                  isActive={!!comp.sumInsuredPerLife}
                  onClick={() =>
                    isEditable &&
                    canEditComponentConfig &&
                    onSumInsuredPerLifeChange(comp.id, true)
                  }
                >
                  {POLICY_COMPONENTS.SWITCH_RIGHT_TEXT_COMPANY_CONTRIBUTION}
                </StyledCommonSwitchTypography>
              </StyledStackForSwitch>
            </StyledFormControlDiv>
          </Stack>
        </StyledSpacingStack>
      </TableCell>
    </React.Fragment>
  );
};
