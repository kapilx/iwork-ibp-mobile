// /Users/naveen/development/vitalia/frontend/src/app/configurator/PolicyRelationshipsSection.tsx
import { TableBody, TableCell, TableRow, Typography } from "@mui/material";
import { forwardRef, useEffect, useImperativeHandle } from "react";
import { CommonCheckbox, CommonTextField } from "@ui/ui-lib";
import { fieldHighlightSx } from "./ConfiguratorFields";
import { SectionRef } from "./sectionRef";

import { POLICY_RELATIONSHIPS } from "../../../constants";
import {
  PolicyRelationshipsData,
  usePolicyRelationshipsManager,
} from "../hooks/usePolicyRelationshipsManager";
import {
  ErrorTextContainer,
  ErrorTextSpan,
  FadedLabelForRelationshipComponent,
  StyledCheckboxLabelBox,
  StyledCompactTable,
  StyledFamilyMaxTableRow,
  StyledFlexBox,
  StyledMediumTypography,
  StyledPermittedRelationOptionBox,
  StyledPermittedRelationOptionInnerBox,
  StyledPermittedRelationsBox,
  StyledRelationshipTableCell,
  StyledRelationshipTableHeader,
  StyledRelationshipTableRow,
  StyledTableHead,
  StyledTablePaper,
} from "./styles";

interface PolicyRelationshipsSectionProps {
  initialData?: PolicyRelationshipsData; // Make optional if it can be undefined for a new config
  isEditable: boolean;
  showHighlights: boolean;
}

// Define a styled Typography for faded labels

// Common helperText component
export const getErrorHelperTextContainer = (
  show: boolean,
  content: React.ReactNode,
  height?: string
) => {
  return (
    <ErrorTextContainer height={height}>
      <ErrorTextSpan show={show}>{content}</ErrorTextSpan>
    </ErrorTextContainer>
  );
};

export const PolicyRelationshipsSection = forwardRef<
  SectionRef,
  PolicyRelationshipsSectionProps
>(({ initialData, isEditable, showHighlights }, ref) => {
  const {
    policyRelationsData,
    familyMaxPolicyLevel,
    familyMaxPolicyLevelError,
    // familyMaxManuallySet, // This is internal to the hook now
    handleRelationTypeToggle,
    handleMaxCountChange,
    handleRelationOptionToggle,
    handleAgeChange,
    handleFamilyMaxPolicyLevelChange,
    setFamilyMaxManuallySet, // Still needed for onFocus interaction
    initializeData,
    policyRelationshipsSummary,
    validateRelationships,
  } = usePolicyRelationshipsManager();

  useEffect(() => {
    initializeData(initialData);
  }, [initialData, initializeData]);

  useImperativeHandle(ref, () => ({
    async validateAndGetData() {
      const isValid = validateRelationships();
      if (isValid) {
        return {
          isValid: true,
          data: { relationships: policyRelationshipsSummary },
        };
      }
      return { isValid: false, data: null };
    },
  }));

  // Local state for input fields to allow typing before blur/validation
  // This is a common pattern if direct state updates on every keystroke are too slow or cause issues.
  // However, the usePolicyRelationshipsManager already handles this by updating its internal state on blur.
  // So, we can directly use values from the hook for TextField `value` prop and call hook's handlers on `onChange` or `onBlur`.
  // For simplicity and to align with the manager handling state, we'll remove local state here for now.
  // If performance issues arise with many fields, local state for inputs can be reintroduced.

  return (
    <StyledTablePaper>
      <StyledCompactTable>
        <StyledTableHead>
          <TableRow>
            {/* Remove the checkbox header cell */}
            <StyledRelationshipTableHeader>
              {POLICY_RELATIONSHIPS.TABLE_HEADER.RELATIONSHIP_TYPE}
            </StyledRelationshipTableHeader>
            <StyledRelationshipTableHeader>
              {POLICY_RELATIONSHIPS.TABLE_HEADER.MAX_NO}
            </StyledRelationshipTableHeader>
            <StyledRelationshipTableHeader>
              {
                POLICY_RELATIONSHIPS.TABLE_HEADER
                  .PERMITTED_RELATIONS_AND_AGE_LIMIT
              }
            </StyledRelationshipTableHeader>
          </TableRow>
        </StyledTableHead>
        <TableBody>
          {policyRelationsData.map((relation) => (
            <StyledRelationshipTableRow key={relation.type}>
              {/* Merge checkbox and relationship type */}
              <TableCell>
                <StyledCheckboxLabelBox
                  data-testid={`relation-checkbox-${relation.type.toLowerCase()}`}
                >
                  <CommonCheckbox
                    size="small"
                    checked={relation.enabled}
                    onChange={() => handleRelationTypeToggle(relation.type)}
                    disabled={!isEditable || relation.type === "Self"}
                    sx={{ mr: 1 }}
                  />
                  <Typography variant="body2">{relation.type}</Typography>
                </StyledCheckboxLabelBox>
              </TableCell>
              <TableCell>
                <CommonTextField
                  type="text"
                  dataTestId={`max-count-text-field-${relation.type}`}
                  value={relation.maxCount || ""}
                  onChange={(e) =>
                    handleMaxCountChange(relation, e.target.value)
                  }
                  onFocus={() => setFamilyMaxManuallySet(false)}
                  disabled={
                    !relation.enabled || !isEditable || relation.type === "Self"
                  }
                  variant="outlined"
                  error={!!relation.maxCountError}
                  helperText={getErrorHelperTextContainer(
                    !!relation.maxCount,
                    relation.maxCountError,
                    "18px"
                  )}
                  inputProps={{
                    maxLength: 2,
                    inputMode: "numeric",
                    pattern: "[0-9]*",
                  }}
                  fullWidthPx={62}
                  sx={{
                    ...(showHighlights &&
                    relation.enabled &&
                    (!relation.maxCount?.trim() || relation.maxCountError)
                      ? fieldHighlightSx
                      : {}),
                  }}
                />
              </TableCell>
              <StyledRelationshipTableCell>
                {relation.enabled && (
                  <StyledPermittedRelationsBox>
                    {relation.configuredOptions.map((option) => (
                      <StyledPermittedRelationOptionBox key={option.name}>
                        <StyledPermittedRelationOptionInnerBox
                          data-testid={`permitted-relations-checkbox-${option.name
                            .replace(" ", "-")
                            .toLowerCase()}`}
                        >
                          <CommonCheckbox
                            size="small"
                            checked={option.enabled}
                            onChange={() =>
                              handleRelationOptionToggle(
                                relation.type,
                                option.name
                              )
                            }
                            disabled={
                              !relation.enabled ||
                              !isEditable ||
                              (relation.type === "Self" &&
                                option.name === "Self")
                            }
                            sx={{
                              p: 0,
                              mr: 0.5,
                            }}
                            errorState={
                              showHighlights &&
                              relation.enabled &&
                              !relation.configuredOptions.some(
                                (o) => o.enabled
                              ) &&
                              isEditable
                            }
                          />
                          <FadedLabelForRelationshipComponent variant="body2">
                            {option.name}
                          </FadedLabelForRelationshipComponent>
                        </StyledPermittedRelationOptionInnerBox>
                        <StyledFlexBox>
                          {" "}
                          {/* Removed pl: "25px" */}
                          <CommonTextField
                            label={option.enabled ? "Min Age *" : "Min Age"}
                            dataTestId={`permitted-relations-${option.name
                              .replace(" ", "-")
                              .toLowerCase()}-min`}
                            type="text"
                            value={option.minAge || ""}
                            onChange={(e) =>
                              handleAgeChange(
                                relation.type,
                                option.name,
                                "minAge",
                                e.target.value
                              )
                            }
                            disabled={
                              !relation.enabled ||
                              !option.enabled ||
                              !isEditable
                            }
                            variant="outlined"
                            helperText={getErrorHelperTextContainer(
                              showHighlights &&
                                relation.enabled &&
                                option.enabled,
                              option.minAgeError,
                              "18px"
                            )}
                            inputProps={{
                              maxLength: 3,
                              inputMode: "numeric",
                              pattern: "[0-9]*",
                            }}
                            fullWidthPx={64}
                            sx={{
                              mr: 0.5,
                              "& .MuiInputBase-input": { fontSize: "0.875rem" },
                              "& .MuiInputLabel-root": { fontSize: "0.875rem" },
                              ...(showHighlights &&
                              relation.enabled &&
                              option.enabled &&
                              (!option.minAge?.trim() || option.minAgeError)
                                ? fieldHighlightSx
                                : {}),
                            }}
                            InputLabelProps={{ shrink: true }}
                            error={
                              showHighlights &&
                              relation.enabled &&
                              option.enabled &&
                              (!option.minAge?.trim() || option.minAgeError)
                            }
                          />
                          <CommonTextField
                            label={option.enabled ? "Max Age *" : "Max Age"}
                            type="text"
                            dataTestId={`permitted-relations-${option.name
                              .replace(" ", "-")
                              .toLowerCase()}-max`}
                            value={option.maxAge || ""}
                            onChange={(e) =>
                              handleAgeChange(
                                relation.type,
                                option.name,
                                "maxAge",
                                e.target.value
                              )
                            }
                            disabled={
                              !relation.enabled ||
                              !option.enabled ||
                              !isEditable
                            }
                            variant="outlined"
                            helperText={getErrorHelperTextContainer(
                              showHighlights &&
                                relation.enabled &&
                                option.enabled,
                              option.maxAgeError,
                              "18px"
                            )}
                            inputProps={{
                              maxLength: 3,
                              inputMode: "numeric",
                              pattern: "[0-9]*",
                            }}
                            fullWidthPx={64}
                            sx={{
                              "& .MuiInputBase-input": { fontSize: "0.875rem" },
                              "& .MuiInputLabel-root": { fontSize: "0.875rem" },
                              ...(showHighlights &&
                              relation.enabled &&
                              option.enabled &&
                              (!option.maxAge?.trim() || option.maxAgeError)
                                ? fieldHighlightSx
                                : {}),
                            }}
                            error={
                              showHighlights &&
                              relation.enabled &&
                              option.enabled &&
                              (!option.maxAge?.trim() || option.maxAgeError)
                            }
                            InputLabelProps={{ shrink: true }}
                          />
                        </StyledFlexBox>
                      </StyledPermittedRelationOptionBox>
                    ))}
                  </StyledPermittedRelationsBox>
                )}
              </StyledRelationshipTableCell>
            </StyledRelationshipTableRow>
          ))}
          {/* Family Max Row */}
          <StyledFamilyMaxTableRow hover>
            {/* Merge checkbox and label */}
            <TableCell>
              <StyledFlexBox data-testid="family-max-checkbox">
                <CommonCheckbox
                  size="small"
                  checked={true}
                  disabled={true}
                  sx={{ mr: 1 }}
                />
                <StyledMediumTypography variant="body2">
                  {POLICY_RELATIONSHIPS.FAMILY_MAX}
                </StyledMediumTypography>
              </StyledFlexBox>
            </TableCell>
            <TableCell>
              <CommonTextField
                type="text"
                dataTestId="family-max-text-field"
                value={familyMaxPolicyLevel}
                onChange={(e) =>
                  handleFamilyMaxPolicyLevelChange(e.target.value)
                }
                onFocus={() => setFamilyMaxManuallySet(true)}
                disabled
                variant="outlined"
                error={!!familyMaxPolicyLevelError}
                helperText={getErrorHelperTextContainer(
                  !!familyMaxPolicyLevel,
                  familyMaxPolicyLevelError,
                  "18px"
                )}
                inputProps={{
                  maxLength: 2,
                  inputMode: "numeric",
                  pattern: "[0-9]*",
                }}
                fullWidthPx={62}
                sx={{
                  "& .MuiInputBase-input": { fontSize: "0.875rem" },
                  ...(showHighlights &&
                  (!familyMaxPolicyLevel?.trim() || familyMaxPolicyLevelError)
                    ? fieldHighlightSx
                    : {}),
                }}
              />
            </TableCell>
            <TableCell></TableCell>
          </StyledFamilyMaxTableRow>
        </TableBody>
      </StyledCompactTable>
    </StyledTablePaper>

    // Unsude code removed
  );
});

PolicyRelationshipsSection.displayName = "PolicyRelationshipsSection";
