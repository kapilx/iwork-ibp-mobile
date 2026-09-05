import {
  CircularProgress,
  FormControl,
  FormControlLabel,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from "@mui/material";
import { forwardRef, useImperativeHandle } from "react";
import {
  CommonRadio,
  CommonRadioGroup,
  CommonSelect,
  CommonSwitch,
  CommonTextField,
} from "@ui/ui-lib";
import { NO, YES } from "../../../constants";
import { usePolicyConstraintsManager } from "../hooks/usePolicyConstraintsManager";
import {
  ConfiguredPolicyConstraints,
  PolicyConfiguration,
} from "./policytypes";
import { SectionRef } from "./sectionRef";
import { ConstraintsTableCell, StyledTablePaper } from "./styles";

// Props for the PolicyConstraintsSection component
interface PolicyConstraintsSectionProps {
  initialPolicyConfig: PolicyConfiguration | null;
  isEditable: boolean;
  // Add other props needed for layout or navigation if necessary
}

export const PolicyConstraintsSection = forwardRef<
  SectionRef,
  PolicyConstraintsSectionProps
>(({ initialPolicyConfig, isEditable }, ref) => {
  const {
    constraints,
    isLoading,
    handleConstraintChange,
    getConstraintsData,
    masterConstraints,
  } = usePolicyConstraintsManager(initialPolicyConfig);

  const countryConstraints = masterConstraints?.data?.constraints || {};

  useImperativeHandle(ref, () => ({
    async validateAndGetData() {
      // For constraints, validation is typically inherent in the data types.
      // If specific validation rules were needed, they'd be checked here.
      // For now, we assume the data is valid as entered.
      return {
        isValid: true,
        data: {
          constraints: getConstraintsData(),
        },
      };
    },
  }));

  if (isLoading) {
    return <CircularProgress />;
  }

  return (
    <StyledTablePaper>
      <Table>
        <TableBody>
          {(
            Object.keys(
              countryConstraints
            ) as (keyof ConfiguredPolicyConstraints)[]
          )
            .sort((a, b) => {
              const orderA = countryConstraints[a]?.order || 0;
              const orderB = countryConstraints[b]?.order || 0;
              return orderA - orderB;
            })
            .map((key) => {
              const masterConfig = countryConstraints[key];
              const currentValue = constraints[key];

              if (
                currentValue === undefined &&
                masterConfig.defaultValue === undefined
              ) {
                console.warn(
                  `Constraint ${key} is missing a value and default after initialization.`
                );
                return null;
              }

              // Ensure currentValue has a fallback to defaultValue if it's undefined
              const valueToRender =
                currentValue !== undefined
                  ? currentValue
                  : masterConfig.defaultValue;

              return (
                <TableRow key={key}>
                  <TableCell>
                    <Typography component="label" htmlFor={`${key}-input`}>
                      {masterConfig.questionLabel}
                    </Typography>
                  </TableCell>
                  <ConstraintsTableCell>
                    {masterConfig.uiType === "boolean" && (
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        data-testid={`constraint-${key}-switch`}
                      >
                        <Typography
                          variant="body2"
                          color={
                            !Boolean(valueToRender)
                              ? "text.primary"
                              : "text.disabled"
                          }
                          sx={{
                            cursor: isEditable ? "pointer" : "default",
                          }}
                          onClick={() =>
                            isEditable && handleConstraintChange(key, false)
                          }
                        >
                          {NO}
                        </Typography>
                        <CommonSwitch
                          id={`${key}-input`}
                          checked={Boolean(valueToRender)}
                          onChange={(e) =>
                            handleConstraintChange(key, e.target.checked)
                          }
                          disabled={!isEditable}
                          size="small"
                        />
                        <Typography
                          variant="body2"
                          color={
                            Boolean(valueToRender)
                              ? "text.primary"
                              : "text.disabled"
                          }
                          sx={{
                            cursor: isEditable ? "pointer" : "default",
                          }}
                          onClick={() =>
                            isEditable && handleConstraintChange(key, true)
                          }
                        >
                          {YES}
                        </Typography>
                      </Stack>
                    )}
                    {masterConfig.uiType === "number" && (
                      <CommonTextField
                        id={`${key}-input`}
                        dataTestId={`constraint-${key}-number`}
                        type="text"
                        value={
                          valueToRender === undefined
                            ? ""
                            : String(valueToRender)
                        }
                        onChange={(e) =>
                          handleConstraintChange(
                            key,
                            e.target.value === ""
                              ? ""
                              : parseFloat(e.target.value)
                          )
                        }
                        inputProps={{
                          maxLength: 2,
                          inputMode: "numeric",
                          pattern: "[0-9]*",
                        }}
                        disabled={!isEditable}
                        size="small"
                        fullWidth
                        variant="outlined"
                        sx={{ maxWidth: "60px" }}
                      />
                    )}
                    {masterConfig.uiType === "text" && (
                      <CommonTextField
                        id={`${key}-input`}
                        dataTestId={`constraint-${key}-text`}
                        type="text"
                        value={String(valueToRender || "")}
                        onChange={(e) =>
                          handleConstraintChange(key, e.target.value)
                        }
                        disabled={!isEditable}
                        size="small"
                        fullWidth
                        multiline
                        minRows={3}
                        variant="outlined"
                        sx={{
                          maxWidth:
                            key === "customDisclaimerBeforeSubmission"
                              ? "500px"
                              : undefined,
                        }}
                      />
                    )}
                    {masterConfig.uiType === "list" && masterConfig.options && (
                      <>
                        {masterConfig.options.length === 2 && ( // Render as Switch for 2 options
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            data-testid={`constraint-${key}-switch`}
                          >
                            <Typography
                              variant="body2"
                              color={
                                String(valueToRender) ===
                                masterConfig.options[1].value
                                  ? "text.primary"
                                  : "text.disabled"
                              }
                              sx={{
                                cursor: isEditable ? "pointer" : "default",
                              }}
                              onClick={() =>
                                isEditable &&
                                handleConstraintChange(
                                  key,
                                  masterConfig.options[1].value
                                )
                              }
                            >
                              {masterConfig.options[1].label}
                            </Typography>
                            <CommonSwitch
                              id={`${key}-input`}
                              checked={
                                String(valueToRender) ===
                                masterConfig.options[0].value
                              }
                              onChange={(e) =>
                                handleConstraintChange(
                                  key,
                                  e.target.checked
                                    ? masterConfig.options[0].value
                                    : masterConfig.options[1].value
                                )
                              }
                              disabled={!isEditable}
                              size="small"
                            />
                            <Typography
                              variant="body2"
                              color={
                                String(valueToRender) ===
                                masterConfig.options[0].value
                                  ? "text.primary"
                                  : "text.disabled"
                              }
                              sx={{
                                cursor: isEditable ? "pointer" : "default",
                              }}
                              onClick={() =>
                                isEditable &&
                                handleConstraintChange(
                                  key,
                                  masterConfig.options[0].value
                                )
                              }
                            >
                              {masterConfig.options[0].label}
                            </Typography>
                          </Stack>
                        )}
                        {masterConfig.options.length >= 3 &&
                          masterConfig.options.length <= 4 && ( // Radio Group
                            <FormControl
                              component="fieldset"
                              disabled={!isEditable}
                              size="small"
                            >
                              <CommonRadioGroup
                                id={`${key}-input`}
                                row
                                data-testid={`constraint-${key}-radio`}
                                value={String(valueToRender || "")}
                                onChange={(e) =>
                                  handleConstraintChange(key, e.target.value)
                                }
                              >
                                {masterConfig.options.map((opt) => (
                                  <FormControlLabel
                                    key={opt.value}
                                    value={opt.value}
                                    control={<CommonRadio size="small" />}
                                    label={
                                      <Typography variant="body2">
                                        {opt.label}
                                      </Typography>
                                    }
                                  />
                                ))}
                              </CommonRadioGroup>
                            </FormControl>
                          )}
                        {masterConfig.options.length > 4 && ( // Select Dropdown
                          <FormControl
                            fullWidth
                            disabled={!isEditable}
                            size="small"
                            variant="outlined"
                          >
                            <CommonSelect
                              id={`${key}-input`}
                              data-testid={`constraint-${key}-select`}
                              value={String(valueToRender || "")}
                              onChange={(e) =>
                                handleConstraintChange(key, e.target.value)
                              }
                              labelId={`${key}-label`} // For accessibility, though visual label is in other cell
                            >
                              {masterConfig.options.map((opt) => (
                                <MenuItem key={opt.value} value={opt.value}>
                                  <Typography variant="body2">
                                    {opt.label}
                                  </Typography>
                                </MenuItem>
                              ))}
                            </CommonSelect>
                          </FormControl>
                        )}
                      </>
                    )}
                  </ConstraintsTableCell>
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
    </StyledTablePaper>
  );
});

PolicyConstraintsSection.displayName = "PolicyConstraintsSection";
