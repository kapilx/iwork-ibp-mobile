import { Alert, Box, FormControlLabel, Typography } from "@mui/material";
import { CommonCheckbox, CommonSwitch } from "@ui/ui-lib";
import { forwardRef, useEffect, useImperativeHandle } from "react";
import { POLICY_TEMPLATE } from "../../../constants";
import { usePolicyTemplateManager } from "../hooks/usePolicyTemplateManager";
import { isExistingAddonSelection } from "../utils/liveEditHelpers";
import {
  GroupPolicyTemplateConfig,
  PolicyBranch,
  PolicyComponent,
  PolicyRelationshipsSummary,
  PolicyTemplateConfigTypeMaster,
} from "./policytypes";
import { SectionRef } from "./sectionRef";
import {
  StyledAddonDivider,
  StyledAddonEligibleRelationsTitle,
  StyledAddonFormControlLabel,
  StyledAddonRowStack,
  StyledClubSumInsuredContainer,
  StyledClubSumInsuredLabel,
  StyledCommonSwitchTypography,
  StyledEligibleRelationsBox,
  StyledEligibleRelationsContainer,
  StyledEligibleRelationsTitle,
  StyledErrorCaption,
  StyledErrorText,
  StyledFlexTextField,
  StyledFormGroupForBasePolicy,
  StyledFormGroupForParentalPolicy,
  StyledHeaderCell,
  StyledHeaderStack,
  StyledNoAddonText,
  StyledParentalPolicyRowStack,
  StyledParentPolicyComponentBox,
  StyledPolicyComponentBox,
  StyledPolicyComponentLabel,
  StyledPolicyContainer,
  StyledPolicyFieldsColumnContainer,
  StyledPolicyRowStack,
  StyledRelationErrorText,
  StyledRelationItemBox,
  StyledRelationTypeLabel,
  StyledSequenceBox,
  StyledSequenceTextField,
  StyledTablePaper,
  StyledTextFieldsContainer,
} from "./styles";

interface PolicyTemplateSectionProps {
  initialData?: GroupPolicyTemplateConfig;
  policyComponents: PolicyComponent[];
  isEditable: boolean;
  relationships?: PolicyRelationshipsSummary;
  isLiveEditMode?: boolean;
  liveEditSnapshot?: GroupPolicyTemplateConfig;
}

type PolicyNumberField =
  | "provisionPolicyNumber"
  | "insurerPolicyNumber"
  | "iirmPolicyNumber";

const renderPolicyNumberFields = (
  values: {
    provisionPolicyNumber?: string;
    insurerPolicyNumber?: string;
    iirmPolicyNumber?: string;
  },
  onChange: (field: PolicyNumberField, value: string) => void,
  disabled: boolean,
  dataTestIdPrefix: string,
  eligibleRelations?: {
    eligibleRelations: string[] | undefined;
    enabledPolicyRelations: PolicyRelationshipsSummary["enabledPolicyRelations"];
    onToggle: (relationType: string) => void;
    title?: string;
    isAddon?: boolean;
    isParentalPolicy?: boolean;
    error?: string; // Error message for addon relations
  },
  sequenceControl?: React.ReactNode
) => (
  <StyledPolicyFieldsColumnContainer>
    <StyledTextFieldsContainer>
      {sequenceControl}
      <StyledFlexTextField
        label={PolicyTemplateConfigTypeMaster.provisionPolicyNumber.label}
        dataTestId={`${dataTestIdPrefix}-provision-number-text-field`}
        {...({ value: values.provisionPolicyNumber || "" } as any)}
        onChange={(e: any) => onChange("provisionPolicyNumber", e.target.value)}
        disabled={disabled}
        placeholder="Provisional Number"
      />
      <StyledFlexTextField
        label={PolicyTemplateConfigTypeMaster.insurerPolicyNumber.label}
        dataTestId={`${dataTestIdPrefix}-insurer-number-text-field`}
        {...({ value: values.insurerPolicyNumber || "" } as any)}
        onChange={(e: any) => onChange("insurerPolicyNumber", e.target.value)}
        disabled={disabled}
        placeholder="Insurer Number"
      />
      <StyledFlexTextField
        label={PolicyTemplateConfigTypeMaster.iirmPolicyNumber.label}
        dataTestId={`${dataTestIdPrefix}-iirm-number-text-field`}
        {...({ value: values.iirmPolicyNumber || "" } as any)}
        onChange={(e: any) => onChange("iirmPolicyNumber", e.target.value)}
        disabled={disabled}
        placeholder="IIRM Number"
      />
    </StyledTextFieldsContainer>
    {eligibleRelations && (
      <StyledEligibleRelationsContainer>
        {eligibleRelations.isAddon ? (
          <StyledAddonEligibleRelationsTitle variant="body2">
            {eligibleRelations.title || "Eligible Relations:"}
          </StyledAddonEligibleRelationsTitle>
        ) : (
          <StyledEligibleRelationsTitle variant="body2">
            {eligibleRelations.title || "Eligible Relations:"}
          </StyledEligibleRelationsTitle>
        )}
        {renderEligibleRelationsCheckboxes(
          eligibleRelations.eligibleRelations,
          eligibleRelations.enabledPolicyRelations,
          eligibleRelations.onToggle,
          disabled,
          dataTestIdPrefix,
          eligibleRelations.isParentalPolicy,
          eligibleRelations.isAddon
        )}
        {eligibleRelations.error && (
          <StyledRelationErrorText variant="caption">
            {eligibleRelations.error}
          </StyledRelationErrorText>
        )}
      </StyledEligibleRelationsContainer>
    )}
  </StyledPolicyFieldsColumnContainer>
);

const renderEligibleRelationsCheckboxes = (
  eligibleRelations: string[] | undefined,
  enabledPolicyRelations: PolicyRelationshipsSummary["enabledPolicyRelations"],
  onToggle: (relationType: string) => void,
  disabled: boolean,
  dataTestIdPrefix: string,
  isParentalPolicy?: boolean,
  isAddon?: boolean
) => {
  const relations = eligibleRelations || [];

  // Filter enabled relation types
  let relevantRelationTypes = enabledPolicyRelations.filter(
    (rel) => rel.enabled
  );

  // For parental policies, only show "parents" relation type
  if (isParentalPolicy) {
    relevantRelationTypes = relevantRelationTypes.filter(
      (rel) => rel.type.toLowerCase() === "parents"
    );
  }

  // Collect all enabled individual options from all relevant relation types
  const individualOptions: Array<{ name: string; relationType: string }> = [];
  relevantRelationTypes.forEach((relType) => {
    relType.configuredOptions
      .filter((opt) => opt.enabled)
      .forEach((opt) => {
        individualOptions.push({ name: opt.name, relationType: relType.type });
      });
  });

  if (individualOptions.length === 0) {
    return null;
  }

  const isBasePolicyMain = !isParentalPolicy && !isAddon;

  return (
    <StyledEligibleRelationsBox>
      {individualOptions.map((option) => {
        const isSelfRelation = option.name.toLowerCase() === "self";

        // Only auto-check and disable "Self" for base policy main
        const isChecked =
          isBasePolicyMain && isSelfRelation
            ? true
            : relations.includes(option.name);
        const isDisabled = isBasePolicyMain && isSelfRelation ? true : disabled;

        return (
          <StyledRelationItemBox key={option.name}>
            <FormControlLabel
              data-testid={`${dataTestIdPrefix}-relation-${option.name
                .toLowerCase()
                .replace(/\//g, "-")
                .replace(/\s/g, "-")}`}
              control={
                <CommonCheckbox
                  size="small"
                  checked={isChecked}
                  disabled={isDisabled}
                  onChange={() => onToggle(option.name)}
                />
              }
              label={
                <StyledRelationTypeLabel variant="body2">
                  {option.name}
                </StyledRelationTypeLabel>
              }
              sx={{ marginLeft: 0 }}
            />
          </StyledRelationItemBox>
        );
      })}
    </StyledEligibleRelationsBox>
  );
};

export const PolicyTemplateSection = forwardRef<
  SectionRef,
  PolicyTemplateSectionProps
>(
  (
    {
      initialData,
      policyComponents,
      isEditable,
      relationships,
      isLiveEditMode,
      liveEditSnapshot,
    },
    ref
  ) => {
    const {
      templateConfig,
      formErrors,
      initializeData,
      handleBaseAddonChange,
      handleParentalAddonChange,
      validateTemplate,
      handleMainPolicyNumberChange,
      handleAddonPolicyNumberChange,
      handleMainPolicyRelationToggle,
      handleAddonPolicyRelationToggle,
      handleClubSumInsuredToggle,
      handleAddonSequenceChange,
    } = usePolicyTemplateManager();

    const renderSequenceControl = (params: {
      sequence: number;
      onChange: (value: string) => void;
      disabled: boolean;
      duplicate: boolean;
      dataTestId: string;
    }) => (
      <StyledSequenceBox>
        <StyledSequenceTextField
          type="number"
          size="small"
          label={POLICY_TEMPLATE.SEQUENCE_LABEL}
          value={params.sequence || ""}
          onChange={(e: any) => params.onChange(e.target.value)}
          disabled={params.disabled}
          error={params.duplicate}
          dataTestId={params.dataTestId}
        />
      </StyledSequenceBox>
    );

    const isParentsRelationEnabled = relationships
      ? relationships.enabledPolicyRelations?.some(
          (relation) =>
            relation.type?.toLowerCase() === "parents" && relation.enabled
        ) ?? false
      : true;

    useEffect(() => {
      initializeData(initialData, policyComponents, isParentsRelationEnabled);
    }, [
      initialData,
      policyComponents,
      initializeData,
      isParentsRelationEnabled,
    ]);

    useImperativeHandle(ref, () => ({
      async validateAndGetData() {
        const isValid = validateTemplate(
          policyComponents,
          isParentsRelationEnabled
        );
        if (isValid) {
          return {
            isValid: true,
            data: {
              policyTemplate: JSON.parse(JSON.stringify(templateConfig)),
            },
          };
        }
        return { isValid: false, data: null };
      },
    }));

    const basePolicyComponent = policyComponents.find(
      (pc) => pc.type === "base"
    );
    const parentalPolicyComponent = policyComponents.find(
      (pc) => pc.type === "parental"
    );
    const addonCandidateComponentsForBase = policyComponents.filter(
      (pc) => pc.type === "optional"
    );
    const addonCandidateComponentsForParental = policyComponents.filter(
      (pc) => pc.type === "optional"
    );

    if (!basePolicyComponent) {
      return <Alert severity="error">{POLICY_TEMPLATE.ALERT_ERROR}</Alert>;
    }

    return (
      <StyledTablePaper>
        <StyledHeaderStack direction="row" spacing={1}>
          <StyledHeaderCell variant="subtitle2" cellwidth="40%">
            {POLICY_TEMPLATE.POLICY_COMPONENT}
          </StyledHeaderCell>
          {/* <StyledHeaderCell variant="subtitle2" cellwidth="200px">
          {PolicyTemplateConfigTypeMaster.provisionPolicyNumber.label}
        </StyledHeaderCell>
        <StyledHeaderCell variant="subtitle2" cellwidth="200px">
          {PolicyTemplateConfigTypeMaster.insurerPolicyNumber.label}
        </StyledHeaderCell>
        <StyledHeaderCell variant="subtitle2" cellwidth="200px">
          {PolicyTemplateConfigTypeMaster.iirmPolicyNumber.label}
        </StyledHeaderCell> */}
        </StyledHeaderStack>

        <StyledPolicyContainer>
          <StyledPolicyRowStack>
            <StyledPolicyComponentBox>
              <StyledPolicyComponentLabel variant="body1">
                {basePolicyComponent?.label || "Base Policy (Not found)"}
              </StyledPolicyComponentLabel>
              {formErrors.basePolicy?.mainPolicyId && (
                <StyledErrorText variant="caption">
                  {formErrors.basePolicy.mainPolicyId}
                </StyledErrorText>
              )}
            </StyledPolicyComponentBox>
            {renderPolicyNumberFields(
              templateConfig.basePolicy,
              (field, value) =>
                handleMainPolicyNumberChange(PolicyBranch.BASE, field, value),
              !isEditable || (isLiveEditMode && !!liveEditSnapshot?.basePolicy),
              "base-policy",
              relationships && relationships.enabledPolicyRelations
                ? {
                    eligibleRelations:
                      templateConfig.basePolicy.eligibleRelations,
                    enabledPolicyRelations:
                      relationships.enabledPolicyRelations,
                    onToggle: (relationType) =>
                      handleMainPolicyRelationToggle(PolicyBranch.BASE, relationType),
                    title: "Eligible Relations:",
                    isAddon: false,
                  }
                : undefined
            )}
          </StyledPolicyRowStack>

          {addonCandidateComponentsForBase.length > 0 && <StyledAddonDivider />}

          {/* <StyledSectionLabelForBasePolicy variant="subtitle2">
          {POLICY_TEMPLATE.BASE_POLICY_ADDON_LABEL}
        </StyledSectionLabelForBasePolicy> */}

          <StyledFormGroupForBasePolicy>
            {addonCandidateComponentsForBase.length > 0 ? (
              addonCandidateComponentsForBase.map((comp, index) => {
                const currentAddon = templateConfig.basePolicy.addonIds.find(
                  (addon) => addon.optionId === comp.id
                );
                const isChecked = !!currentAddon;
                const isExistingAddon =
                  isLiveEditMode &&
                  isExistingAddonSelection(comp.id, liveEditSnapshot, PolicyBranch.BASE);
                const canToggleAddon = !isExistingAddon; // Cannot uncheck existing addons

                return (
                  <Box key={`base-addon-${comp.id}`}>
                    {index > 0 && <StyledAddonDivider />}
                    <StyledAddonRowStack>
                      <StyledAddonFormControlLabel
                        data-testid={`base-addon-checkbox-${index}`}
                        control={
                          <CommonCheckbox
                            size="small"
                            checked={isChecked}
                            onChange={(e) =>
                              handleBaseAddonChange(comp.id, e.target.checked)
                            }
                            disabled={
                              !isEditable || (isChecked && !canToggleAddon)
                            }
                            title={
                              isChecked && !canToggleAddon
                                ? "Cannot uncheck existing addon in LIVE mode"
                                : ""
                            }
                          />
                        }
                        label={
                          <Typography variant="body2" fontWeight="bold">
                            {`${comp.label} (${comp.type})`}
                          </Typography>
                        }
                      />
                      {renderPolicyNumberFields(
                        currentAddon || {
                          provisionPolicyNumber: "",
                          insurerPolicyNumber: "",
                          iirmPolicyNumber: "",
                        },
                        (field, value) =>
                          handleAddonPolicyNumberChange(
                            PolicyBranch.BASE,
                            comp.id,
                            field,
                            value
                          ),
                        !isEditable || !isChecked || isExistingAddon,
                        `base-addon-${index}`,
                        relationships && relationships.enabledPolicyRelations
                          ? {
                              eligibleRelations:
                                currentAddon?.eligibleRelations,
                              enabledPolicyRelations:
                                relationships.enabledPolicyRelations,
                              onToggle: (relationType) =>
                                handleAddonPolicyRelationToggle(
                                  PolicyBranch.BASE,
                                  comp.id,
                                  relationType
                                ),
                              title: "Eligible Relations:",
                              isAddon: true,
                              error:
                                formErrors.basePolicy?.addonRelations?.[
                                  comp.id
                                ] || "",
                            }
                          : undefined,
                        renderSequenceControl({
                          sequence: currentAddon?.sequence ?? 0,
                          onChange: (value) =>
                            handleAddonSequenceChange(
                              PolicyBranch.BASE,
                              comp.id,
                              value
                            ),
                          disabled:
                            !isEditable || !isChecked || isExistingAddon,
                          duplicate:
                            !!formErrors.basePolicy?.sequenceDuplicateRows?.[
                              comp.id
                            ],
                          dataTestId: `base-addon-${index}-sequence`,
                        })
                      )}
                    </StyledAddonRowStack>
                  </Box>
                );
              })
            ) : (
              <StyledNoAddonText variant="body2">
                {POLICY_TEMPLATE.BASE_POLICY_NO_ADDON_LABEL}
              </StyledNoAddonText>
            )}
          </StyledFormGroupForBasePolicy>
          {formErrors.basePolicy?.addonIds && (
            <StyledErrorCaption color="error" variant="caption">
              {formErrors.basePolicy.addonIds}
            </StyledErrorCaption>
          )}
          {formErrors.basePolicy?.sequenceDuplicate && (
            <StyledErrorCaption color="error" variant="caption">
              {formErrors.basePolicy.sequenceDuplicate}
            </StyledErrorCaption>
          )}

          {/* Club Sum Insured at bottom */}
          <StyledClubSumInsuredContainer>
            <StyledClubSumInsuredLabel variant="body2">
              Club Sum Insured:
            </StyledClubSumInsuredLabel>
            <StyledCommonSwitchTypography
              variant="body2"
              isActive={!templateConfig.basePolicy.clubSumInsured}
              // clickable={isEditable}
              onClick={() =>
                isEditable &&
                !(isLiveEditMode && !!liveEditSnapshot?.basePolicy) &&
                templateConfig.basePolicy.addonIds.length > 0 &&
                handleClubSumInsuredToggle(PolicyBranch.BASE)
              }
            >
              No
            </StyledCommonSwitchTypography>
            <CommonSwitch
              checked={Boolean(templateConfig.basePolicy.clubSumInsured)}
              onChange={() => handleClubSumInsuredToggle(PolicyBranch.BASE)}
              disabled={
                !isEditable ||
                templateConfig.basePolicy.addonIds.length === 0 ||
                (isLiveEditMode && !!liveEditSnapshot?.basePolicy)
              }
              size="small"
              data-testid="base-policy-club-sum-insured-switch"
              sx={{
                ...(templateConfig.basePolicy.addonIds.length === 0 && {
                  filter: "grayscale(1)",
                  opacity: 0.6,
                }),
              }}
            />
            <StyledCommonSwitchTypography
              variant="body2"
              isActive={templateConfig.basePolicy.clubSumInsured}
              // clickable={isEditable}
              onClick={() =>
                isEditable &&
                !(isLiveEditMode && !!liveEditSnapshot?.basePolicy) &&
                templateConfig.basePolicy.addonIds.length > 0 &&
                handleClubSumInsuredToggle(PolicyBranch.BASE)
              }
            >
              Yes
            </StyledCommonSwitchTypography>
          </StyledClubSumInsuredContainer>
        </StyledPolicyContainer>

        {parentalPolicyComponent &&
          isParentsRelationEnabled &&
          templateConfig.parentalPolicy && (
            <StyledPolicyContainer>
              <StyledParentalPolicyRowStack>
                <StyledParentPolicyComponentBox>
                  <StyledPolicyComponentLabel variant="body1">
                    {parentalPolicyComponent?.label ||
                      "Parental Policy (Not found)"}
                  </StyledPolicyComponentLabel>
                  {formErrors.parentalPolicy?.mainPolicyId && (
                    <StyledErrorText variant="caption">
                      {formErrors.parentalPolicy.mainPolicyId}
                    </StyledErrorText>
                  )}
                </StyledParentPolicyComponentBox>
                {renderPolicyNumberFields(
                  templateConfig.parentalPolicy,
                  (field, value) =>
                    handleMainPolicyNumberChange(PolicyBranch.PARENTAL, field, value),
                  !isEditable ||
                    !templateConfig.parentalPolicy ||
                    (isLiveEditMode && !!liveEditSnapshot?.parentalPolicy),
                  "parental-policy",
                  relationships && relationships.enabledPolicyRelations
                    ? {
                        eligibleRelations:
                          templateConfig.parentalPolicy.eligibleRelations,
                        enabledPolicyRelations:
                          relationships.enabledPolicyRelations,
                        onToggle: (relationType) =>
                          handleMainPolicyRelationToggle(
                            PolicyBranch.PARENTAL,
                            relationType
                          ),
                        title: "Eligible Relations:",
                        isAddon: false,
                        isParentalPolicy: true,
                      }
                    : undefined
                )}
              </StyledParentalPolicyRowStack>

              {addonCandidateComponentsForParental.length > 0 && (
                <StyledAddonDivider />
              )}

              {/* <StyledSectionLabelForParentalPolicy variant="subtitle2">
              {POLICY_TEMPLATE.SELECT_ADDON_POLICY_FOR_PARENT}
            </StyledSectionLabelForParentalPolicy> */}

              <StyledFormGroupForParentalPolicy>
                {addonCandidateComponentsForParental.length > 0 ? (
                  addonCandidateComponentsForParental.map((comp, index) => {
                    const currentAddon =
                      templateConfig.parentalPolicy?.addonIds.find(
                        (addon) => addon.optionId === comp.id
                      );
                    const isChecked = !!currentAddon;
                    const isExistingAddon =
                      isLiveEditMode &&
                      isExistingAddonSelection(
                        comp.id,
                        liveEditSnapshot,
                        PolicyBranch.PARENTAL
                      );
                    const canToggleAddon = !isExistingAddon; // Cannot uncheck existing addons

                    return (
                      <Box key={`parental-addon-${comp.id}`}>
                        {index > 0 && <StyledAddonDivider />}
                        <StyledAddonRowStack>
                          <StyledAddonFormControlLabel
                            data-testid={`parental-addon-checkbox-${index}`}
                            control={
                              <CommonCheckbox
                                size="small"
                                checked={isChecked}
                                onChange={(e) =>
                                  handleParentalAddonChange(
                                    comp.id,
                                    e.target.checked
                                  )
                                }
                                disabled={
                                  !isEditable || (isChecked && !canToggleAddon)
                                }
                                title={
                                  isChecked && !canToggleAddon
                                    ? "Cannot uncheck existing addon in LIVE mode"
                                    : ""
                                }
                              />
                            }
                            label={
                              <Typography variant="body2" fontWeight="bold">
                                {`${comp.label} (${comp.type})`}
                              </Typography>
                            }
                          />
                          {renderPolicyNumberFields(
                            currentAddon || {
                              provisionPolicyNumber: "",
                              insurerPolicyNumber: "",
                              iirmPolicyNumber: "",
                            },
                            (field, value) =>
                              handleAddonPolicyNumberChange(
                                PolicyBranch.PARENTAL,
                                comp.id,
                                field,
                                value
                              ),
                            !isEditable || !isChecked || isExistingAddon,
                            `parental-addon-${index}`,
                            relationships &&
                              relationships.enabledPolicyRelations
                              ? {
                                  eligibleRelations:
                                    currentAddon?.eligibleRelations,
                                  enabledPolicyRelations:
                                    relationships.enabledPolicyRelations,
                                  onToggle: (relationType) =>
                                    handleAddonPolicyRelationToggle(
                                      PolicyBranch.PARENTAL,
                                      comp.id,
                                      relationType
                                    ),
                                  title: "Eligible Relations:",
                                  isAddon: true,
                                  isParentalPolicy: true,
                                  error:
                                    formErrors.parentalPolicy?.addonRelations?.[
                                      comp.id
                                    ] || "",
                                }
                              : undefined,
                            renderSequenceControl({
                              sequence: currentAddon?.sequence ?? 0,
                              onChange: (value) =>
                                handleAddonSequenceChange(
                                  PolicyBranch.PARENTAL,
                                  comp.id,
                                  value
                                ),
                              disabled:
                                !isEditable || !isChecked || isExistingAddon,
                              duplicate:
                                !!formErrors.parentalPolicy
                                  ?.sequenceDuplicateRows?.[comp.id],
                              dataTestId: `parental-addon-${index}-sequence`,
                            })
                          )}
                        </StyledAddonRowStack>
                      </Box>
                    );
                  })
                ) : (
                  <Typography variant="body2">
                    {POLICY_TEMPLATE.NO_OPTIONAL_COMPONENTS_AVAILABLE}
                  </Typography>
                )}
              </StyledFormGroupForParentalPolicy>
              {formErrors.parentalPolicy?.addonIds && (
                <StyledErrorCaption variant="caption">
                  {formErrors.parentalPolicy.addonIds}
                </StyledErrorCaption>
              )}
              {formErrors.parentalPolicy?.sequenceDuplicate && (
                <StyledErrorCaption color="error" variant="caption">
                  {formErrors.parentalPolicy.sequenceDuplicate}
                </StyledErrorCaption>
              )}

              {/* Club Sum Insured at bottom */}
              <StyledClubSumInsuredContainer>
                <StyledClubSumInsuredLabel variant="body2">
                  Club Sum Insured:
                </StyledClubSumInsuredLabel>
                <StyledCommonSwitchTypography
                  variant="body2"
                  isActive={!templateConfig.parentalPolicy.clubSumInsured}
                  // clickable={isEditable}
                  onClick={() =>
                    isEditable &&
                    !(isLiveEditMode && !!liveEditSnapshot?.parentalPolicy) &&
                    (templateConfig.parentalPolicy?.addonIds.length ?? 0) > 0 &&
                    handleClubSumInsuredToggle(PolicyBranch.PARENTAL)
                  }
                >
                  No
                </StyledCommonSwitchTypography>
                <CommonSwitch
                  checked={Boolean(
                    templateConfig.parentalPolicy.clubSumInsured
                  )}
                  onChange={() => handleClubSumInsuredToggle(PolicyBranch.PARENTAL)}
                  disabled={
                    !isEditable ||
                    templateConfig.parentalPolicy.addonIds.length === 0 ||
                    (isLiveEditMode && !!liveEditSnapshot?.parentalPolicy)
                  }
                  size="small"
                  data-testid="parental-policy-club-sum-insured-switch"
                  sx={{
                    ...(templateConfig.parentalPolicy.addonIds.length === 0 && {
                      filter: "grayscale(1)",
                      opacity: 0.6,
                    }),
                  }}
                />
                <StyledCommonSwitchTypography
                  variant="body2"
                  isActive={templateConfig.parentalPolicy.clubSumInsured}
                  // clickable={isEditable}
                  onClick={() =>
                    isEditable &&
                    !(isLiveEditMode && !!liveEditSnapshot?.parentalPolicy) &&
                    (templateConfig.parentalPolicy?.addonIds.length ?? 0) > 0 &&
                    handleClubSumInsuredToggle(PolicyBranch.PARENTAL)
                  }
                >
                  Yes
                </StyledCommonSwitchTypography>
              </StyledClubSumInsuredContainer>
            </StyledPolicyContainer>
          )}
      </StyledTablePaper>
    );
  }
);

PolicyTemplateSection.displayName = "PolicyTemplateSection";

export default PolicyTemplateSection;
