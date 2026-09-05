import {
  Alert,
  Button,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import {
  ADD,
  CommonCheckbox,
  CommonSelect,
  CommonTextField,
  Button as CoustomButton,
  formatNumberInputByLocalization,
  useLocalization,
} from "@ui/ui-lib";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import addIcon from "../../../assets/svgs/add-card.svg";
import {
  AddIcon,
  ParametersContainer,
  ParametersInfoText,
  ParametersTable,
  PolicyConfiguratorStyledFormControl,
  RelationGroupDetailItemContainer,
  StyledAddIcon,
  StyledConfigurationCell,
  StyledDetailGridContainer,
  StyledDetailGridItem,
  StyledDisplayNameCell,
  StyledFamilyMaxGrid,
  StyledFamilyMaxTypography,
  StyledFlexCenterBox,
  StyledFlexEndBox,
  StyledMarginBottomBox,
  StyledMarginTopBox,
  StyledRelationNameTypography,
  StyledRowStackWithMargin,
  StyledTableHead,
  StyledTablePaper,
  StyledTableRow,
} from "./styles";

import { fieldHighlightSx } from "./ConfiguratorFields";
import {
  ConfiguredPolicyParameter,
  DependentAttributeDetailConfig,
  DependentAttributeListOption,
  DependentAttributeRangeBand,
  DependentCountBandConfig,
  DependentCountDetailConfig,
  MaxDependentCountDetailConfig,
  MaxDependentCountOption,
  LovDetailConfig,
  PolicyParameterMaster,
  RangeDetailConfig,
  RelationGroupDetailConfig,
  RelationTypeConfig,
} from "./policytypes";
import { SectionRef } from "./sectionRef";

import removeIcon from "../../../assets/svgs/remove-card.svg";
import {
  ADD_COUNT_BAND,
  ADD_OPTION,
  ADD_RANGE_SET,
  ADD_RELATION_GROUP,
  CONFIGRATION_TEXT,
  NO_POLICY_PARAMETER,
  PARAMETERS_DISPLAYNAME,
  PARAMETERS_TEXT,
  POLICY_PARAMETERS,
  POLICY_RELATIONSHIPS,
  SELECT_PARAMETER_TEXT,
  UNKNOWN_PARAMETER_TEXT,
} from "../../../constants";
import {
  PolicyParameterFormErrors,
  usePolicyParametersManager,
} from "../hooks/usePolicyParametersManager";
import { getErrorHelperTextContainer } from "./PolicyRelationshipsSection";
import { RemoveIcon } from "./styles";

const dataTestIdFormat = (
  start: string,
  text: string,
  end: string = ""
): string => {
  return `${start}${text.replace(" ", "-").toLowerCase()}${end}`;
};

interface PolicyParametersSectionProps {
  initialData?: ConfiguredPolicyParameter[];
  enabledPolicyRelations: RelationTypeConfig[];
  isEditable: boolean;
  showHighlights: boolean;
}
// Pass initialData prop to the hook
export const PolicyParametersSection = forwardRef<
  SectionRef,
  PolicyParametersSectionProps
>(
  (
    { initialData, enabledPolicyRelations, isEditable, showHighlights },
    ref
  ) => {
    const {
      configuredParameters,
      selectedMasterParamNameToAdd,
      setSelectedMasterParamNameToAdd,
      formErrors,
      handleAddConfiguredParameterWithSelection,
      onRemoveConfiguredParameter,
      onConfiguredParameterDisplayNameChange,
      onAddRangeDetail,
      onRemoveRangeDetail,
      onRangeDetailChange,
      onAddLovDetail,
      onRemoveLovDetail,
      onLovDetailChange,
      onAddRelationGroupDetail,
      onRemoveRelationGroupDetail,
      onRelationGroupDisplayNameChange,
      onRelationSelectionChange,
      onRelationMaxCountChange,
      onRelationGroupFamilyMaxCountChange,
      clearRelationGroupParameters,
      validateParameters,
      onApplyToDependentsChange,
      onTargetCategoryChange,
      onAddCountBand,
      onRemoveCountBand,
      onCountBandChange,
      onAddMaxDependentCountOption,
      onRemoveMaxDependentCountOption,
      onMaxDependentCountOptionChange,
      onDependentAttributeTargetCategoryChange,
      onDependentAttributeKindChange,
      onDependentAttributeNameChange,
      onAddDependentAttributeRangeBand,
      onAddDependentAttributeListOption,
      onDependentAttributeBandChange,
      onDependentAttributeOptionChange,
      onRemoveDependentAttributeBand,
      onRemoveDependentAttributeOption,
    } = usePolicyParametersManager(initialData);

    const prevEnabledPolicyRelationsRef = useRef<RelationTypeConfig[]>([]);

    useEffect(() => {
      if (
        prevEnabledPolicyRelationsRef.current &&
        JSON.stringify(prevEnabledPolicyRelationsRef.current) !==
          JSON.stringify(enabledPolicyRelations) &&
        isEditable
      ) {
        // clearRelationGroupParameters();
        // After clearing, new relation groups will be added with the new set of enabledPolicyRelations.
        // Existing parameters of type 'relation' might need to have a default group re-added if all were cleared.
        // This re-adding logic, if needed, should be carefully placed to avoid new loops,
        // possibly within the hook or triggered differently.
      }
      prevEnabledPolicyRelationsRef.current = enabledPolicyRelations;
    }, [enabledPolicyRelations, clearRelationGroupParameters, isEditable]);

    useImperativeHandle(ref, () => ({
      async validateAndGetData() {
        const isValid = validateParameters();
        if (isValid) {
          return {
            isValid: true,
            data: {
              parameters: JSON.parse(JSON.stringify(configuredParameters)),
            },
          };
        }
        return { isValid: false, data: null };
      },
    }));

    const handleAddParameter = () => {
      if (selectedMasterParamNameToAdd) {
        handleAddConfiguredParameterWithSelection(
          selectedMasterParamNameToAdd,
          enabledPolicyRelations
        );
        setSelectedMasterParamNameToAdd(""); // Reset selection
      }
    };

    return (
      <>
        <ParametersContainer>
          <ParametersInfoText>{PARAMETERS_TEXT}</ParametersInfoText>
          <StyledFlexEndBox>
            <PolicyConfiguratorStyledFormControl disabled={!isEditable}>
              <CommonSelect
                value={selectedMasterParamNameToAdd}
                data-testid="policy-parameters-select"
                height={40}
                width={340}
                onChange={(e) =>
                  setSelectedMasterParamNameToAdd(e.target.value)
                }
                MenuProps={{
                  transitionDuration: 0, // Removes animation delay
                }}
              >
                <MenuItem value="">
                  <em>Select Parameter</em>
                </MenuItem>
                {PolicyParameterMaster.filter((master) => {
                  const isRepeatable =
                    master.name === "Custom Range" ||
                    master.name === "Custom List" ||
                    master.name === "Dependent Count" ||
                    master.name === "Dependent Attribute";
                  if (isRepeatable) return true;
                  return !configuredParameters.some(
                    (p) => p.parameterMasterName === master.name
                  );
                }).map((master) => (
                  <MenuItem key={master.name} value={master.name}>
                    {master.name}
                  </MenuItem>
                ))}
              </CommonSelect>
            </PolicyConfiguratorStyledFormControl>
            {isEditable && (
              <CoustomButton
                onClick={handleAddParameter}
                variantType="primary"
                sizeType="small"
                data-testid="policy-parameters-add-btn"
                disabled={!selectedMasterParamNameToAdd || !isEditable}
              >
                {ADD}
              </CoustomButton>
            )}
          </StyledFlexEndBox>
        </ParametersContainer>

        {configuredParameters.length > 0 && (
          <StyledTablePaper>
            <ParametersTable>
              <StyledTableHead>
                <TableRow>
                  {isEditable && <TableCell></TableCell>}
                  <StyledDisplayNameCell>
                    {PARAMETERS_DISPLAYNAME}
                  </StyledDisplayNameCell>
                  <StyledConfigurationCell>
                    {CONFIGRATION_TEXT}
                  </StyledConfigurationCell>
                </TableRow>
              </StyledTableHead>
              <TableBody>
                {configuredParameters.map((param, index) => {
                  const masterEntry = PolicyParameterMaster.find(
                    (m) => m.name === param.parameterMasterName // policyParameterMasterList is not a prop anymore
                  );
                  const parameterType = masterEntry?.type;

                  return (
                    <StyledTableRow>
                      {isEditable && (
                        <TableCell padding="checkbox">
                          <IconButton
                            onClick={() =>
                              onRemoveConfiguredParameter(param.id)
                            }
                            data-testid={`remove-configured-parameter-btn-${index}`}
                          >
                            <RemoveIcon src={removeIcon} />
                          </IconButton>
                        </TableCell>
                      )}
                      <TableCell>
                        <CommonTextField
                          label="Display Name *"
                          value={param.displayName}
                          data-testid={dataTestIdFormat(
                            "policy-display-name-",
                            param.displayName
                          )}
                          onChange={(e) =>
                            onConfiguredParameterDisplayNameChange(
                              param.id,
                              e.target.value
                            )
                          }
                          fullWidth
                          size="small"
                          helperText={getErrorHelperTextContainer(
                            !!formErrors[param.id]?.displayName ||
                              (showHighlights && !param.displayName?.trim()),
                            "Display Name is required.",
                            "18px"
                          )}
                          variant="outlined"
                          disabled={!isEditable}
                          error={
                            !!formErrors[param.id]?.displayName ||
                            (showHighlights && !param.displayName?.trim())
                          }
                        />

                        {/* Apply to Dependents toggle — hidden for Dependent Attribute (FR-059),
                            for Dependent Count (its own per-dependent counting makes this redundant),
                            and for Max Dependent Count (a total-family cap, not a per-life attribute) */}
                        {param.parameterMasterName !== "Relationship Group" &&
                          param.type !== "dependent-attribute" &&
                          param.type !== "dependent-count" &&
                          param.type !== "max-dependent-count" && (
                          <FormControlLabel
                            data-testid={`${param.id}-apply-to-dependents`}
                            control={
                              <CommonCheckbox
                                checked={param.applyToDependents ?? false}
                                onChange={(e) =>
                                  onApplyToDependentsChange(param.id, e.target.checked)
                                }
                                disabled={!isEditable}
                                size="small"
                              />
                            }
                            label={
                              <Typography variant="body2">
                                {POLICY_PARAMETERS.APPLY_TO_DEPENDENTS}
                              </Typography>
                            }
                            sx={{ mt: 1, ml: 0 }}
                          />
                        )}

                        {/* Advisory for employee-level-only params */}
                        {(param.applyToDependents ?? false) &&
                          isEmployeeLevelOnlyParam(param) && (
                            <Alert
                              severity="info"
                              variant="outlined"
                              sx={{ mt: 0.5, mb: 1 }}
                            >
                              {POLICY_PARAMETERS.APPLY_TO_DEPENDENTS_ADVISORY}
                            </Alert>
                          )}
                      </TableCell>
                      <TableCell>
                        {parameterType === "range" && (
                          <>
                            {param.rangeDetails.map((detail) => (
                              <RangeDetailItem
                                key={detail.id}
                                paramId={param.id}
                                detail={detail}
                                parameterMasterName={param.parameterMasterName}
                                isEditable={isEditable}
                                showHighlights={showHighlights}
                                showRangeErrors={
                                  param.parameterMasterName === "Age" || true
                                }
                                formErrors={
                                  formErrors[param.id]?.rangeDetails?.[
                                    detail.id
                                  ] || {}
                                }
                                onRangeDetailChange={onRangeDetailChange}
                                onRemoveRangeDetail={onRemoveRangeDetail}
                                canRemove={param.rangeDetails.length > 1}
                              />
                            ))}
                            {isEditable && (
                              <Button
                                startIcon={<AddIcon src={addIcon} alt="Add" />}
                                onClick={() => onAddRangeDetail(param.id)}
                                size="small"
                                sx={{
                                  color: " #0A73E9",
                                  fontWeight: "300",
                                }}
                                data-testid={`add-range-set-btn-${param.id}`}
                              >
                                {ADD_RANGE_SET}
                              </Button>
                            )}
                          </>
                        )}

                        {parameterType === "list" && (
                          <>
                            {param.lovDetails.map((detail) => (
                              <LovDetailItem
                                key={detail.id}
                                paramId={param.id}
                                detail={detail}
                                isEditable={isEditable}
                                showHighlights={showHighlights}
                                formErrors={
                                  formErrors[param.id]?.lovDetails?.[
                                    detail.id
                                  ] || {}
                                } // Passed value is correct
                                onLovDetailChange={onLovDetailChange}
                                onRemoveLovDetail={onRemoveLovDetail}
                              />
                            ))}
                            {isEditable && (
                              <Button
                                startIcon={<AddIcon src={addIcon} alt="Add" />}
                                onClick={() => onAddLovDetail(param.id)}
                                size="small"
                                sx={{
                                  color: " #0A73E9",
                                  fontWeight: "300",
                                }}
                                data-testid={`add-lov-detail-btn-${param.id}`}
                              >
                                {ADD_OPTION}
                              </Button>
                            )}
                          </>
                        )}

                        {parameterType === "relation" &&
                          param.parameterMasterName && (
                            <RelationGroupDetailItemContainer>
                              {param.relationGroupDetails.map((groupDetail) => (
                                <RelationGroupDetailItem
                                  key={groupDetail.id}
                                  paramId={param.id}
                                  groupDetail={groupDetail}
                                  isEditable={isEditable}
                                  showHighlights={showHighlights} // Pass errors for the specific groupDetail
                                  formErrors={
                                    formErrors[param.id]
                                      ?.relationGroupDetails?.[
                                      groupDetail.id
                                    ] || {}
                                  }
                                  onRemoveRelationGroupDetail={
                                    onRemoveRelationGroupDetail
                                  }
                                  onRelationGroupDisplayNameChange={
                                    onRelationGroupDisplayNameChange
                                  }
                                  onRelationSelectionChange={
                                    onRelationSelectionChange
                                  }
                                  onRelationMaxCountChange={
                                    onRelationMaxCountChange
                                  }
                                  onRelationGroupFamilyMaxCountChange={
                                    onRelationGroupFamilyMaxCountChange
                                  }
                                />
                              ))}
                              {isEditable && (
                                <Button
                                  startIcon={
                                    <StyledAddIcon src={addIcon} alt="Add" />
                                  }
                                  onClick={() =>
                                    onAddRelationGroupDetail(
                                      param.id,
                                      enabledPolicyRelations
                                    )
                                  }
                                  sx={{
                                    color: " #0A73E9",
                                    fontWeight: "300",
                                  }}
                                >
                                  {ADD_RELATION_GROUP}
                                </Button>
                              )}
                            </RelationGroupDetailItemContainer>
                          )}

                        {parameterType === "dependent-count" &&
                          param.dependentCountConfig && (
                            <DependentCountDetailItem
                              paramId={param.id}
                              config={param.dependentCountConfig}
                              isEditable={isEditable}
                              showHighlights={showHighlights}
                              enabledPolicyRelations={enabledPolicyRelations}
                              onTargetCategoryChange={onTargetCategoryChange}
                              onAddCountBand={onAddCountBand}
                              onRemoveCountBand={onRemoveCountBand}
                              onCountBandChange={onCountBandChange}
                            />
                          )}

                        {parameterType === "dependent-attribute" &&
                          param.dependentAttributeConfig && (
                            <DependentAttributeDetailItem
                              paramId={param.id}
                              config={param.dependentAttributeConfig}
                              isEditable={isEditable}
                              showHighlights={showHighlights}
                              enabledPolicyRelations={enabledPolicyRelations}
                              formErrors={formErrors[param.id]?.dependentAttributeConfig}
                              onTargetCategoryChange={onDependentAttributeTargetCategoryChange}
                              onAttributeKindChange={onDependentAttributeKindChange}
                              onAttributeNameChange={onDependentAttributeNameChange}
                              onAddRangeBand={onAddDependentAttributeRangeBand}
                              onAddListOption={onAddDependentAttributeListOption}
                              onBandChange={onDependentAttributeBandChange}
                              onOptionChange={onDependentAttributeOptionChange}
                              onRemoveBand={onRemoveDependentAttributeBand}
                              onRemoveOption={onRemoveDependentAttributeOption}
                            />
                          )}

                        {parameterType === "max-dependent-count" &&
                          param.maxDependentCountConfig && (
                            <MaxDependentCountDetailItem
                              paramId={param.id}
                              config={param.maxDependentCountConfig}
                              isEditable={isEditable}
                              showHighlights={showHighlights}
                              formErrors={formErrors[param.id]?.maxDependentCountConfig}
                              onAddOption={onAddMaxDependentCountOption}
                              onRemoveOption={onRemoveMaxDependentCountOption}
                              onOptionChange={onMaxDependentCountOptionChange}
                            />
                          )}

                        {!parameterType && param.parameterMasterName && (
                          <Typography variant="body2">
                            {UNKNOWN_PARAMETER_TEXT}
                          </Typography>
                        )}
                        {!param.parameterMasterName && (
                          <Typography variant="body2">
                            {SELECT_PARAMETER_TEXT}
                          </Typography>
                        )}
                      </TableCell>
                    </StyledTableRow>
                  );
                })}
              </TableBody>
            </ParametersTable>
          </StyledTablePaper>
        )}
        <StyledMarginTopBox>
          {configuredParameters.length === 0 && !isEditable && (
            <Typography variant="body1">{NO_POLICY_PARAMETER}</Typography>
          )}
        </StyledMarginTopBox>
      </>
    );
  }
);

PolicyParametersSection.displayName = "PolicyParametersSection";

// Returns true for parameters whose attribute is employee-level only (no per-dependent lookup)
const isEmployeeLevelOnlyParam = (param: ConfiguredPolicyParameter): boolean =>
  !["Age", "Gender"].includes(param.parameterMasterName ?? "");

// Sub-component for DependentCountDetail
interface DependentCountDetailItemProps {
  paramId: string;
  config: DependentCountDetailConfig;
  isEditable: boolean;
  showHighlights: boolean;
  enabledPolicyRelations: RelationTypeConfig[];
  onTargetCategoryChange: (paramId: string, category: string) => void;
  onAddCountBand: (paramId: string) => void;
  onRemoveCountBand: (paramId: string, bandId: string) => void;
  onCountBandChange: (
    paramId: string,
    bandId: string,
    field: keyof DependentCountBandConfig,
    value: string | null
  ) => void;
}

const DependentCountDetailItem: React.FC<DependentCountDetailItemProps> = ({
  paramId,
  config,
  isEditable,
  showHighlights,
  enabledPolicyRelations,
  onTargetCategoryChange,
  onAddCountBand,
  onRemoveCountBand,
  onCountBandChange,
}) => {
  // "All" is a meta-option (counts every enrolled life), not a real relation.
  // The rest come from the policy's own enabled relations — "Self" is always
  // enabled and isn't a valid dependent-count target, so it's excluded.
  const relationCategories = [
    "All",
    ...enabledPolicyRelations
      .filter((relation) => relation.type !== "Self")
      .map((relation) => relation.type),
  ];

  return (
  <Stack spacing={2} sx={{ mt: 1 }}>
    <CommonSelect
      label="Target Relation Category *"
      value={config.targetRelationCategory}
      onChange={(e) => onTargetCategoryChange(paramId, e.target.value)}
      disabled={!isEditable}
      height={40}
      width={240}
      error={showHighlights && !config.targetRelationCategory}
      data-testid={`${paramId}-target-category`}
    >
      {relationCategories.map((cat) => (
        <MenuItem key={cat} value={cat}>
          {cat}
        </MenuItem>
      ))}
    </CommonSelect>

    {config.targetRelationCategory === "All" && (
      <Alert severity="info" variant="outlined" sx={{ mt: 0.5, mb: 1 }}>
        Counts all enrolled lives (employee + all dependents). Use this for
        family-floater raters where the SI slab depends on total enrolled headcount.
      </Alert>
    )}

    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Band Name</TableCell>
          <TableCell>Min Count</TableCell>
          <TableCell>Max Count (blank = unlimited)</TableCell>
          <TableCell>SI Enhancement (₹)</TableCell>
          {isEditable && config.countBands.length > 1 && <TableCell />}
        </TableRow>
      </TableHead>
      <TableBody>
        {config.countBands.map((band, idx) => (
          <TableRow key={band.id}>
            <TableCell>
              <CommonTextField
                value={band.displayName}
                onChange={(e) =>
                  onCountBandChange(paramId, band.id, "displayName", e.target.value)
                }
                disabled={!isEditable}
                size="small"
                error={showHighlights && !band.displayName?.trim()}
                data-testid={`${paramId}-band-${band.id}-name`}
              />
            </TableCell>
            <TableCell>
              <CommonTextField
                type="number"
                value={band.minCount}
                onChange={(e) =>
                  onCountBandChange(paramId, band.id, "minCount", e.target.value)
                }
                disabled={!isEditable || idx === 0}
                size="small"
                inputProps={{ min: 0 }}
                data-testid={`${paramId}-band-${band.id}-min`}
              />
            </TableCell>
            <TableCell>
              <CommonTextField
                type="number"
                value={band.maxCount ?? ""}
                placeholder="Unlimited"
                onChange={(e) =>
                  onCountBandChange(
                    paramId,
                    band.id,
                    "maxCount",
                    e.target.value === "" ? null : e.target.value
                  )
                }
                disabled={!isEditable}
                size="small"
                inputProps={{ min: 0 }}
                data-testid={`${paramId}-band-${band.id}-max`}
              />
            </TableCell>
            <TableCell>
              <CommonTextField
                type="number"
                value={band.siEnhancement}
                onChange={(e) =>
                  onCountBandChange(paramId, band.id, "siEnhancement", e.target.value)
                }
                disabled={!isEditable}
                size="small"
                inputProps={{ min: 0 }}
                data-testid={`${paramId}-band-${band.id}-enhancement`}
              />
            </TableCell>
            {isEditable && config.countBands.length > 1 && (
              <TableCell>
                <IconButton
                  size="small"
                  onClick={() => onRemoveCountBand(paramId, band.id)}
                  data-testid={`${paramId}-band-${band.id}-remove`}
                >
                  <RemoveIcon src={removeIcon} />
                </IconButton>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>

    {isEditable && (
      <Button
        startIcon={<AddIcon src={addIcon} alt="Add" />}
        onClick={() => onAddCountBand(paramId)}
        size="small"
        sx={{ color: "#0A73E9", fontWeight: "300" }}
        data-testid={`add-count-band-btn-${paramId}`}
      >
        {ADD_COUNT_BAND}
      </Button>
    )}
  </Stack>
  );
};

// Sub-component for MaxDependentCountDetail
interface MaxDependentCountDetailItemProps {
  paramId: string;
  config: MaxDependentCountDetailConfig;
  isEditable: boolean;
  showHighlights: boolean;
  formErrors?: {
    general?: string;
    options?: {
      [optionId: string]: {
        label?: string;
        max?: string;
      };
    };
  };
  onAddOption: (paramId: string) => void;
  onRemoveOption: (paramId: string, optionId: string) => void;
  onOptionChange: (
    paramId: string,
    optionId: string,
    field: keyof MaxDependentCountOption,
    value: string
  ) => void;
}

const MaxDependentCountDetailItem: React.FC<MaxDependentCountDetailItemProps> = ({
  paramId,
  config,
  isEditable,
  showHighlights,
  formErrors,
  onAddOption,
  onRemoveOption,
  onOptionChange,
}) => {
  return (
    <Stack spacing={2} sx={{ mt: 1 }}>
      <Alert severity="info" variant="outlined">
        {POLICY_PARAMETERS.MAX_DEPENDENT_COUNT_INFO}
      </Alert>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Option Label</TableCell>
            <TableCell>Max</TableCell>
            {isEditable && config.options.length > 1 && <TableCell />}
          </TableRow>
        </TableHead>
        <TableBody>
          {config.options.map((option) => {
            const optErr = formErrors?.options?.[option.id];
            return (
              <TableRow key={option.id}>
                <TableCell>
                  <CommonTextField
                    value={option.label}
                    onChange={(e) =>
                      onOptionChange(paramId, option.id, "label", e.target.value)
                    }
                    disabled={!isEditable}
                    size="small"
                    error={
                      !!optErr?.label ||
                      (showHighlights && !option.label?.trim())
                    }
                    helperText={getErrorHelperTextContainer(
                      !!optErr?.label || (showHighlights && !option.label?.trim()),
                      optErr?.label || "Label is required.",
                      "18px"
                    )}
                    data-testid={`${paramId}-max-dependent-count-${option.id}-label`}
                  />
                </TableCell>
                <TableCell>
                  <CommonTextField
                    type="number"
                    value={option.max}
                    onChange={(e) =>
                      onOptionChange(paramId, option.id, "max", e.target.value)
                    }
                    disabled={!isEditable}
                    size="small"
                    inputProps={{ min: 0 }}
                    error={!!optErr?.max}
                    helperText={getErrorHelperTextContainer(
                      !!optErr?.max,
                      optErr?.max,
                      "18px"
                    )}
                    data-testid={`${paramId}-max-dependent-count-${option.id}-max`}
                  />
                </TableCell>
                {isEditable && config.options.length > 1 && (
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => onRemoveOption(paramId, option.id)}
                      data-testid={`${paramId}-max-dependent-count-${option.id}-remove`}
                    >
                      <RemoveIcon src={removeIcon} />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {isEditable && (
        <Button
          startIcon={<AddIcon src={addIcon} alt="Add" />}
          onClick={() => onAddOption(paramId)}
          size="small"
          sx={{ color: "#0A73E9", fontWeight: "300" }}
          data-testid={`add-max-dependent-count-option-btn-${paramId}`}
        >
          Add Option
        </Button>
      )}
    </Stack>
  );
};

// Sub-component for DependentAttributeDetail
interface DependentAttributeDetailItemProps {
  paramId: string;
  config: DependentAttributeDetailConfig;
  isEditable: boolean;
  showHighlights: boolean;
  enabledPolicyRelations: RelationTypeConfig[];
  formErrors?: {
    targetRelationCategory?: string;
    attributeKind?: string;
    targetAttributeName?: string;
    rangeBands?: { [bandId: string]: { displayName?: string; min?: string; general?: string; companyAdditionalPremium?: string; employeeAdditionalPremium?: string } };
    listOptions?: { [optId: string]: { value?: string; companyAdditionalPremium?: string; employeeAdditionalPremium?: string } };
  };
  onTargetCategoryChange: (paramId: string, category: string) => void;
  onAttributeKindChange: (paramId: string, kind: "range" | "list") => void;
  onAttributeNameChange: (paramId: string, name: string) => void;
  onAddRangeBand: (paramId: string) => void;
  onAddListOption: (paramId: string) => void;
  onBandChange: (paramId: string, bandId: string, field: keyof Omit<DependentAttributeRangeBand, "id">, value: string | null) => void;
  onOptionChange: (paramId: string, optId: string, field: keyof Omit<DependentAttributeListOption, "id">, value: string) => void;
  onRemoveBand: (paramId: string, bandId: string) => void;
  onRemoveOption: (paramId: string, optId: string) => void;
}

const DependentAttributeDetailItem: React.FC<DependentAttributeDetailItemProps> = ({
  paramId, config, isEditable, showHighlights, enabledPolicyRelations, formErrors,
  onTargetCategoryChange, onAttributeKindChange, onAttributeNameChange,
  onAddRangeBand, onAddListOption, onBandChange, onOptionChange,
  onRemoveBand, onRemoveOption,
}) => {
  // "All" is a meta-option (applies to every enrolled dependent), not a real
  // relation. "Self" is always enabled and isn't a valid dependent-attribute
  // target — the rest come from the policy's own enabled relations.
  const relationCategories = [
    "All",
    ...enabledPolicyRelations
      .filter((relation) => relation.type !== "Self")
      .map((relation) => relation.type),
  ];

  return (
  <Stack spacing={2} sx={{ mt: 1 }}>
    <Stack direction="row" spacing={2} flexWrap="wrap">
      <CommonSelect
        label="Target Relation Category *"
        value={config.targetRelationCategory}
        onChange={(e) => onTargetCategoryChange(paramId, e.target.value)}
        disabled={!isEditable}
        height={40}
        width={220}
        error={(showHighlights && !config.targetRelationCategory) || !!formErrors?.targetRelationCategory}
        data-testid={`${paramId}-da-target-category`}
      >
        {relationCategories.map((cat) => (
          <MenuItem key={cat} value={cat}>{cat}</MenuItem>
        ))}
      </CommonSelect>

      <CommonSelect
        label="Attribute Kind *"
        value={config.attributeKind}
        onChange={(e) => onAttributeKindChange(paramId, e.target.value as "range" | "list")}
        disabled={!isEditable}
        height={40}
        width={140}
        error={(showHighlights && !config.attributeKind) || !!formErrors?.attributeKind}
        data-testid={`${paramId}-da-attribute-kind`}
      >
        <MenuItem value="range">Range</MenuItem>
        <MenuItem value="list">List</MenuItem>
      </CommonSelect>

      <CommonTextField
        label="Attribute Name *"
        value={config.targetAttributeName}
        onChange={(e) => onAttributeNameChange(paramId, e.target.value)}
        disabled={!isEditable}
        size="small"
        error={(showHighlights && !config.targetAttributeName?.trim()) || !!formErrors?.targetAttributeName}
        helperText={getErrorHelperTextContainer(!!formErrors?.targetAttributeName, formErrors?.targetAttributeName, "18px")}
        sx={{ width: 180 }}
        data-testid={`${paramId}-da-attribute-name`}
      />
    </Stack>

    {config.targetRelationCategory === "All" && (
      <Alert severity="info" variant="outlined" sx={{ mt: 0.5, mb: 1 }}>
        Applies this attribute-based premium adjustment to every enrolled dependent,
        irrespective of relation category.
      </Alert>
    )}

    {config.attributeKind === "range" && (
      <>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Band Name</TableCell>
              <TableCell>Min Value</TableCell>
              <TableCell>Max Value (blank = unlimited)</TableCell>
              <TableCell>Company Premium (₹)</TableCell>
              <TableCell>Employee Premium (₹)</TableCell>
              {isEditable && <TableCell />}
            </TableRow>
          </TableHead>
          <TableBody>
            {config.rangeBands.map((band) => {
              const bandErr = formErrors?.rangeBands?.[band.id] ?? {};
              return (
                <TableRow key={band.id}>
                  <TableCell>
                    <CommonTextField
                      value={band.displayName}
                      onChange={(e) => onBandChange(paramId, band.id, "displayName", e.target.value)}
                      disabled={!isEditable}
                      size="small"
                      error={(showHighlights && !band.displayName?.trim()) || !!bandErr.displayName}
                      data-testid={`${paramId}-da-band-${band.id}-name`}
                    />
                  </TableCell>
                  <TableCell>
                    <CommonTextField
                      type="number"
                      value={band.min}
                      onChange={(e) => onBandChange(paramId, band.id, "min", e.target.value)}
                      disabled={!isEditable}
                      size="small"
                      error={(showHighlights && !band.min?.trim()) || !!bandErr.min || !!bandErr.general}
                      data-testid={`${paramId}-da-band-${band.id}-min`}
                    />
                  </TableCell>
                  <TableCell>
                    <CommonTextField
                      type="number"
                      value={band.max ?? ""}
                      placeholder="Unlimited"
                      onChange={(e) => onBandChange(paramId, band.id, "max", e.target.value === "" ? null : e.target.value)}
                      disabled={!isEditable}
                      size="small"
                      data-testid={`${paramId}-da-band-${band.id}-max`}
                    />
                  </TableCell>
                  <TableCell>
                    <CommonTextField
                      type="number"
                      value={band.companyAdditionalPremium}
                      onChange={(e) => onBandChange(paramId, band.id, "companyAdditionalPremium", e.target.value)}
                      disabled={!isEditable}
                      size="small"
                      inputProps={{ min: 0 }}
                      error={!!bandErr.companyAdditionalPremium}
                      data-testid={`${paramId}-da-band-${band.id}-company`}
                    />
                  </TableCell>
                  <TableCell>
                    <CommonTextField
                      type="number"
                      value={band.employeeAdditionalPremium}
                      onChange={(e) => onBandChange(paramId, band.id, "employeeAdditionalPremium", e.target.value)}
                      disabled={!isEditable}
                      size="small"
                      inputProps={{ min: 0 }}
                      error={!!bandErr.employeeAdditionalPremium}
                      data-testid={`${paramId}-da-band-${band.id}-employee`}
                    />
                  </TableCell>
                  {isEditable && (
                    <TableCell>
                      <IconButton size="small" onClick={() => onRemoveBand(paramId, band.id)} data-testid={`${paramId}-da-band-${band.id}-remove`}>
                        <RemoveIcon src={removeIcon} />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {isEditable && (
          <Button startIcon={<AddIcon src={addIcon} alt="Add" />} onClick={() => onAddRangeBand(paramId)} size="small" sx={{ color: "#0A73E9", fontWeight: "300" }} data-testid={`add-da-band-btn-${paramId}`}>
            Add Band
          </Button>
        )}
      </>
    )}

    {config.attributeKind === "list" && (
      <>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Option Value</TableCell>
              <TableCell>Company Premium (₹)</TableCell>
              <TableCell>Employee Premium (₹)</TableCell>
              {isEditable && <TableCell />}
            </TableRow>
          </TableHead>
          <TableBody>
            {config.listOptions.map((opt) => {
              const optErr = formErrors?.listOptions?.[opt.id] ?? {};
              return (
                <TableRow key={opt.id}>
                  <TableCell>
                    <CommonTextField
                      value={opt.value}
                      onChange={(e) => onOptionChange(paramId, opt.id, "value", e.target.value)}
                      disabled={!isEditable}
                      size="small"
                      error={(showHighlights && !opt.value?.trim()) || !!optErr.value}
                      data-testid={`${paramId}-da-opt-${opt.id}-value`}
                    />
                  </TableCell>
                  <TableCell>
                    <CommonTextField
                      type="number"
                      value={opt.companyAdditionalPremium}
                      onChange={(e) => onOptionChange(paramId, opt.id, "companyAdditionalPremium", e.target.value)}
                      disabled={!isEditable}
                      size="small"
                      inputProps={{ min: 0 }}
                      error={!!optErr.companyAdditionalPremium}
                      data-testid={`${paramId}-da-opt-${opt.id}-company`}
                    />
                  </TableCell>
                  <TableCell>
                    <CommonTextField
                      type="number"
                      value={opt.employeeAdditionalPremium}
                      onChange={(e) => onOptionChange(paramId, opt.id, "employeeAdditionalPremium", e.target.value)}
                      disabled={!isEditable}
                      size="small"
                      inputProps={{ min: 0 }}
                      error={!!optErr.employeeAdditionalPremium}
                      data-testid={`${paramId}-da-opt-${opt.id}-employee`}
                    />
                  </TableCell>
                  {isEditable && (
                    <TableCell>
                      <IconButton size="small" onClick={() => onRemoveOption(paramId, opt.id)} data-testid={`${paramId}-da-opt-${opt.id}-remove`}>
                        <RemoveIcon src={removeIcon} />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {isEditable && (
          <Button startIcon={<AddIcon src={addIcon} alt="Add" />} onClick={() => onAddListOption(paramId)} size="small" sx={{ color: "#0A73E9", fontWeight: "300" }} data-testid={`add-da-option-btn-${paramId}`}>
            Add Option
          </Button>
        )}
      </>
    )}
  </Stack>
  );
};

// Sub-component for RangeDetail
interface RangeDetailItemProps {
  paramId: string;
  detail: RangeDetailConfig;
  parameterMasterName: string;
  isEditable: boolean;
  showHighlights: boolean;
  showRangeErrors: boolean;
  formErrors: NonNullable<
    PolicyParameterFormErrors[string]["rangeDetails"]
  >[string];
  onRangeDetailChange: (
    parameterId: string,
    rangeDetailId: string,
    field: keyof Omit<RangeDetailConfig, "id">,
    value: string
  ) => void;
  onRemoveRangeDetail: (parameterId: string, rangeDetailId: string) => void;
  canRemove: boolean;
}

const RangeDetailItem: React.FC<RangeDetailItemProps> = ({
  paramId,
  detail,
  parameterMasterName,
  isEditable,
  showHighlights,
  showRangeErrors,
  formErrors,
  onRangeDetailChange,
  onRemoveRangeDetail,
  canRemove,
}) => {
  const isCustomRangeParam = parameterMasterName === "Custom Range";
  const { localizationData } = useLocalization();
  const localization = localizationData?.data;

  // Track raw input values for better decimal typing experience
  const [rawInputValues, setRawInputValues] = React.useState<
    Record<string, { min?: string; max?: string }>
  >({});

  // Helper for formatting numbers with up to 3 decimal places
  const formatNumberForDisplay = (value: string | undefined | null): string => {
    if (!value || value.trim() === "") {
      return "";
    }
    const num = parseFloat(value.replace(/,/g, ""));
    if (isNaN(num)) {
      return value; // Return as is if not a valid number
    }
    return isCustomRangeParam
      ? formatNumberInputByLocalization(num, localization, 3, 0)
      : formatNumberInputByLocalization(num, localization, 0, 0);
  };

  // Helper for parsing formatted numbers
  const parseFormattedNumber = (formattedValue: string): string => {
    if (formattedValue.trim() === "") {
      return "";
    }
    const cleaned = formattedValue.replace(/,/g, ""); // Remove commas
    const num = parseFloat(cleaned);
    if (isNaN(num)) {
      return formattedValue; // Return as is if not valid
    }
    return isCustomRangeParam
      ? (Math.round(num * 1000) / 1000).toString() // Round to 3 decimal places
      : Math.round(num).toString(); // Round to integer
  };

  // Helper for validating decimal input while typing
  const isValidDecimalInput = (value: string): boolean => {
    // Don't allow commas in input - only numbers and one optional decimal point
    if (value.includes(",")) {
      return false;
    }

    // Allow empty string
    if (value === "") return true;

    if (isCustomRangeParam) {
      // Allow digits, one optional decimal point, and up to 3 decimal places
      const decimalPattern = /^\d*\.?\d{0,3}$/;
      return decimalPattern.test(value);
    } else {
      // Allow only digits for non-custom range parameters
      const integerPattern = /^\d*$/;
      return integerPattern.test(value);
    }
  };

  // Helper to get display value (raw input if being edited, formatted otherwise)
  const getDisplayValue = (
    storedValue: string | undefined,
    fieldType: "min" | "max"
  ): string => {
    const key = `${paramId}-${detail.id}`;
    const rawValue = rawInputValues[key]?.[fieldType];
    return rawValue !== undefined
      ? rawValue
      : formatNumberForDisplay(storedValue);
  };
  return (
    <StyledRowStackWithMargin
      direction="row"
      spacing={1}
      alignItems="flex-start"
    >
      <CommonTextField
        label="Range Display Name *"
        value={detail.rangeDisplayName}
        dataTestId={dataTestIdFormat("range-detail-", detail.rangeDisplayName)}
        onChange={(e) =>
          onRangeDetailChange(
            paramId,
            detail.id,
            "rangeDisplayName",
            e.target.value
          )
        }
        size="small"
        required // Assuming it's mandatory for highlighting example
        error={
          !!formErrors?.rangeDisplayName ||
          (showHighlights && !detail.rangeDisplayName?.trim())
        }
        helperText={getErrorHelperTextContainer(
          !!formErrors?.rangeDisplayName ||
            (showHighlights && !detail.rangeDisplayName?.trim()),
          formErrors?.rangeDisplayName,
          "18px"
        )}
        sx={{
          width: "180px",
        }}
        disabled={!isEditable}
        variant="outlined"
      />
      <CommonTextField
        label="Min *"
        dataTestId={`range-detail-${paramId}-${detail.id}-min`}
        value={getDisplayValue(detail.min, "min")}
        type="text"
        inputMode={isCustomRangeParam ? "decimal" : "numeric"}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          const inputValue = e.target.value;
          const key = `${paramId}-${detail.id}`;

          // For copy-paste: if input has commas, clean them first
          let cleanedInputValue = inputValue;
          if (inputValue.includes(",")) {
            cleanedInputValue = inputValue.replace(/,/g, "");
          }

          // Allow typing if it matches pattern or is empty
          if (
            cleanedInputValue === "" ||
            isValidDecimalInput(cleanedInputValue)
          ) {
            // Store cleaned raw input for immediate display
            setRawInputValues((prev) => ({
              ...prev,
              [key]: {
                ...prev[key],
                min: cleanedInputValue,
              },
            }));

            // Update the actual value
            onRangeDetailChange(
              paramId,
              detail.id,
              "min",
              parseFormattedNumber(cleanedInputValue)
            );
          }
        }}
        onBlur={() => {
          // Clear raw input on blur to show formatted value
          const key = `${paramId}-${detail.id}`;
          setRawInputValues((prev) => {
            const newValues = { ...prev };
            if (newValues[key]) {
              delete newValues[key].min;
              if (Object.keys(newValues[key]).length === 0) {
                delete newValues[key];
              }
            }
            return newValues;
          });
        }}
        helperText={
          showRangeErrors
            ? getErrorHelperTextContainer(
                !!(
                  showHighlights &&
                  (!detail.min.trim() || formErrors?.min || formErrors?.general)
                ),
                formErrors?.min,
                "18px"
              )
            : undefined
        }
        disabled={!isEditable}
        error={
          showRangeErrors &&
          showHighlights &&
          (!detail.min.trim() || formErrors?.min || formErrors?.general)
        }
        variant="outlined"
        required
      />
      {/* Debugging line */}
      <CommonTextField
        label="Max *"
        dataTestId={`range-detail-${paramId}-${detail.id}-max`}
        value={getDisplayValue(detail.max, "max")}
        type="text"
        inputMode={isCustomRangeParam ? "decimal" : "numeric"}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          const inputValue = e.target.value;
          const key = `${paramId}-${detail.id}`;

          // For copy-paste: if input has commas, clean them first
          let cleanedInputValue = inputValue;
          if (inputValue.includes(",")) {
            cleanedInputValue = inputValue.replace(/,/g, "");
          }

          // Allow typing if it matches pattern or is empty
          if (
            cleanedInputValue === "" ||
            isValidDecimalInput(cleanedInputValue)
          ) {
            // Store cleaned raw input for immediate display
            setRawInputValues((prev) => ({
              ...prev,
              [key]: {
                ...prev[key],
                max: cleanedInputValue,
              },
            }));

            // Update the actual value
            onRangeDetailChange(
              paramId,
              detail.id,
              "max",
              parseFormattedNumber(cleanedInputValue)
            );
          }
        }}
        onBlur={() => {
          // Clear raw input on blur to show formatted value
          const key = `${paramId}-${detail.id}`;
          setRawInputValues((prev) => {
            const newValues = { ...prev };
            if (newValues[key]) {
              delete newValues[key].max;
              if (Object.keys(newValues[key]).length === 0) {
                delete newValues[key];
              }
            }
            return newValues;
          });
        }}
        helperText={
          showRangeErrors
            ? getErrorHelperTextContainer(
                !!(showHighlights && (!detail.max.trim() || formErrors?.max)),
                showHighlights ? formErrors?.max || formErrors?.general : "",
                "18px"
              )
            : undefined
        }
        disabled={!isEditable}
        error={
          showRangeErrors &&
          showHighlights &&
          (!detail.max.trim() || formErrors?.max)
        }
        variant="outlined"
        required
      />
      {isEditable && canRemove && (
        <IconButton
          onClick={() => onRemoveRangeDetail(paramId, detail.id)}
          size="small"
          aria-label="remove range set"
          data-testid={`range-detail-${paramId}-${detail.id}-remove-btn`}
        >
          <RemoveIcon src={removeIcon} />
        </IconButton>
      )}
    </StyledRowStackWithMargin>
  );
};

// Sub-component for LovDetail
interface LovDetailItemProps {
  paramId: string;
  detail: LovDetailConfig;
  isEditable: boolean;
  showHighlights: boolean;
  formErrors: NonNullable<
    PolicyParameterFormErrors[string]["lovDetails"]
  >[string];
  onLovDetailChange: (
    parameterId: string,
    lovDetailId: string,
    value: string
  ) => void;
  onRemoveLovDetail: (parameterId: string, lovDetailId: string) => void;
}
const LovDetailItem: React.FC<LovDetailItemProps> = ({
  paramId,
  detail,
  isEditable,
  showHighlights,
  formErrors,
  onLovDetailChange,
  onRemoveLovDetail,
}) => {
  return (
    <StyledRowStackWithMargin direction="row" spacing={1} alignItems="center">
      <CommonTextField
        label={detail.isDefault ? "Default Value *" : "Added Value *"}
        value={detail.value}
        dataTestId={dataTestIdFormat("lov-detail-", detail.value)}
        onChange={(e) => onLovDetailChange(paramId, detail.id, e.target.value)}
        size="small"
        error={!!formErrors?.value || (showHighlights && !detail.value?.trim())}
        helperText={getErrorHelperTextContainer(
          !!formErrors?.value || (showHighlights && !detail.value?.trim()),
          formErrors?.value,
          "18px"
        )}
        sx={{
          width: "180px",
        }}
        disabled={!isEditable} // Allow editing default values if the section is editable
      />
      {isEditable && ( // Allow removing any value if editable, including defaults
        <IconButton
          onClick={() => onRemoveLovDetail(paramId, detail.id)}
          size="small"
          aria-label="remove lov option"
          data-testid={dataTestIdFormat(
            "lov-detail-",
            detail.value,
            "-remove-btn"
          )}
        >
          <RemoveIcon src={removeIcon} />
        </IconButton>
      )}
    </StyledRowStackWithMargin>
  );
};

// Sub-component for RelationGroupDetail
interface RelationGroupDetailItemProps {
  paramId: string;
  groupDetail: RelationGroupDetailConfig;
  isEditable: boolean;
  showHighlights: boolean;
  formErrors: NonNullable<
    PolicyParameterFormErrors[string]["relationGroupDetails"]
  >[string];
  onRemoveRelationGroupDetail: (
    parameterId: string,
    groupDetailId: string
  ) => void;
  onRelationGroupDisplayNameChange: (
    parameterId: string,
    groupDetailId: string,
    newName: string
  ) => void;
  onRelationSelectionChange: (
    parameterId: string,
    groupDetailId: string,
    relationName: string,
    isSelected: boolean
  ) => void;
  onRelationMaxCountChange: (
    parameterId: string,
    groupDetailId: string,
    relationName: string,
    count: string
  ) => void;
  onRelationGroupFamilyMaxCountChange: (
    parameterId: string,
    groupDetailId: string,
    count: string
  ) => void;
}
const RelationGroupDetailItem: React.FC<RelationGroupDetailItemProps> = ({
  paramId,
  groupDetail,
  isEditable,
  showHighlights,
  formErrors,
  onRemoveRelationGroupDetail,
  onRelationGroupDisplayNameChange,
  onRelationSelectionChange,
  onRelationMaxCountChange,
  onRelationGroupFamilyMaxCountChange,
}) => {
  return (
    <StyledMarginBottomBox key={groupDetail.id}>
      <StyledRowStackWithMargin direction="row" spacing={3} alignItems="center">
        <CommonTextField
          label="Group Name *"
          value={groupDetail.groupDisplayName}
          dataTestId={dataTestIdFormat(
            "relation-group-",
            groupDetail.groupDisplayName
          )}
          onChange={(e) =>
            onRelationGroupDisplayNameChange(
              paramId,
              groupDetail.id,
              e.target.value
            )
          }
          size="small"
          variant="outlined"
          disabled={!isEditable}
          error={
            !!formErrors?.groupDisplayName ||
            (showHighlights && !groupDetail.groupDisplayName?.trim())
          }
          helperText={getErrorHelperTextContainer(
            !!formErrors?.groupDisplayName ||
              (showHighlights && !groupDetail.groupDisplayName?.trim()),
            !!formErrors?.groupDisplayName ||
              !groupDetail.groupDisplayName?.trim()
              ? formErrors?.groupDisplayName || ""
              : "",
            "18px"
          )}
          sx={{
            maxWidth: "300px",
            flexGrow: 1,
            mr: 1,
          }}
        />
        {isEditable && (
          <IconButton
            onClick={() => onRemoveRelationGroupDetail(paramId, groupDetail.id)}
            size="small"
            aria-label="remove relation group"
            data-testid={dataTestIdFormat(
              "relation-group-",
              groupDetail.groupDisplayName,
              "-remove-btn"
            )}
          >
            <RemoveIcon src={removeIcon} />
          </IconButton>
        )}
      </StyledRowStackWithMargin>
      <StyledDetailGridContainer container>
        {groupDetail.selectedRelations.map((relOption) => {
          const isSelfRelation = relOption.name === "Self";
          return (
            <StyledDetailGridItem key={relOption.name}>
              <FormControlLabel
                data-testid={dataTestIdFormat(
                  "relation-checkbox-",
                  `${groupDetail.groupDisplayName}-${relOption.name}`
                )}
                control={
                  <CommonCheckbox
                    checked={relOption.selected}
                    onChange={(e) =>
                      onRelationSelectionChange(
                        paramId,
                        groupDetail.id,
                        relOption.name,
                        e.target.checked
                      )
                    }
                    size="small"
                    disabled={!isEditable || isSelfRelation}
                  />
                }
                label={
                  <StyledRelationNameTypography variant="body2">
                    {relOption.name}
                  </StyledRelationNameTypography>
                }
                sx={{ mb: 0.5, ml: 0, mr: 0 }}
              />
              <CommonTextField
                label={relOption.selected ? "Max Count *" : "Max Count"}
                dataTestId={dataTestIdFormat(
                  `relation-max-count`,
                  `-${groupDetail.groupDisplayName}-${relOption.name}`
                )}
                value={relOption.maxCount}
                onChange={(e) =>
                  onRelationMaxCountChange(
                    paramId,
                    groupDetail.id,
                    relOption.name,
                    e.target.value
                  )
                }
                size="small"
                variant="outlined"
                type="text" // Keep as text
                disabled={!relOption.selected || !isEditable || isSelfRelation}
                inputProps={{
                  min: 1,
                  style: {
                    fontSize: "0.875rem",
                    textAlign: "center",
                    padding: "8.5px 4px",
                  },
                }}
                // Add error/helperText for individual maxCount if formErrors structure supports it
                // error={!!formErrors?.selectedRelations?.[relOption.name]?.maxCount}
                // helperText={formErrors?.selectedRelations?.[relOption.name]?.maxCount}
                sx={{
                  width: "50px",
                  "& .MuiInputLabel-root": {
                    fontSize: "0.8rem",
                    lineHeight: "1.2",
                  },
                  "& .MuiFormHelperText-root": { display: "none" },
                  ...(showHighlights &&
                  relOption.selected &&
                  relOption.name !== "Self" &&
                  !relOption.maxCount?.trim()
                    ? // && !formErrors?.selectedRelations?.[relOption.name]?.maxCount
                      fieldHighlightSx
                    : {}),
                }}
                InputLabelProps={{ shrink: true }}
                error={
                  showHighlights &&
                  relOption.selected &&
                  relOption.name !== "Self" &&
                  !relOption.maxCount?.trim()
                }
              />
            </StyledDetailGridItem>
          );
        })}
        <StyledFamilyMaxGrid key="family-max-group">
          <StyledFlexCenterBox>
            <StyledFamilyMaxTypography variant="body2">
              {POLICY_RELATIONSHIPS.FAMILY_MAX}
            </StyledFamilyMaxTypography>
          </StyledFlexCenterBox>
          <CommonTextField
            label="Total"
            dataTestId={dataTestIdFormat(
              "relation-family-max",
              `-${groupDetail.groupDisplayName}`,
              "-total"
            )}
            value={groupDetail.familyMaxCount}
            onChange={(e) =>
              onRelationGroupFamilyMaxCountChange(
                paramId,
                groupDetail.id,
                e.target.value
              )
            }
            size="small"
            variant="outlined"
            type="text"
            disabled
            error={!!formErrors?.familyMaxCount}
            helperText={`${formErrors?.familyMaxCount}`}
            inputProps={{
              min: 1,
              style: {
                fontSize: "0.875rem",
                textAlign: "center",
                padding: "8.5px 4px",
              },
            }}
            sx={{
              width: "60px",
              "& .MuiInputLabel-root": {
                fontSize: "0.8rem",
                lineHeight: "1.2",
              },
              "& .MuiFormHelperText-root": { display: "none" },
              ...(showHighlights &&
              !groupDetail.familyMaxCount?.trim() &&
              !formErrors?.familyMaxCount
                ? fieldHighlightSx
                : {}),
            }}
            InputLabelProps={{ shrink: true }}
          />
        </StyledFamilyMaxGrid>
      </StyledDetailGridContainer>
    </StyledMarginBottomBox>
  );
};
