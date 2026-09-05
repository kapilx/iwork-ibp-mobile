import { useState } from "react";
import { Box, IconButton } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import {
  Button,
  CommonTextField,
  DynamicForm,
  HTTP_METHODS,
  StyledLabelTypography,
  endPoints,
  setToastMessage,
  useApiMutation,
} from "@ui/ui-lib";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { createCoverFormConfig } from "../coverFormConfig";
import { COVER_MASTER } from "../../../../constants";
import {
  ButtonRow,
  FormWrapper,
  LovActions,
  LovRow,
  LovSection,
  SectionSubtitle,
  SplitLayout,
} from "../styles";

interface CreateCoverStepProps {
  onCreated?: () => void;
}

const DEFAULT_VALUES = { inputType: "text" };

/**
 * Builds the input_lov `{ key: label }` map from label-only rows. Keys are a
 * slug of the label (unique-suffixed) since they aren't used when rendering.
 */
const buildInputLov = (labels: string[]): Record<string, string> => {
  const lov: Record<string, string> = {};
  labels
    .map((label) => label.trim())
    .filter(Boolean)
    .forEach((label, index) => {
      const base =
        label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") ||
        `option_${index + 1}`;
      let key = base;
      let suffix = 1;
      while (lov[key] !== undefined) key = `${base}_${suffix++}`;
      lov[key] = label;
    });
  return lov;
};

interface CoverLovEditorProps {
  options: string[];
  error?: string;
  onChange: (index: number, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

/**
 * Label-only editor for a dropdown cover's options (LOV). Each label becomes an
 * input_lov entry and a select option in covers_meta.
 */
const CoverLovEditor = ({
  options,
  error,
  onChange,
  onAdd,
  onRemove,
}: CoverLovEditorProps) => (
  <LovSection>
    <StyledLabelTypography variant="body2" error={Boolean(error)}>
      {`${COVER_MASTER.LABELS.OPTIONS} *`}
    </StyledLabelTypography>

    {options.map((option, index) => (
      <LovRow key={index}>
        <CommonTextField
          width="100%"
          value={option}
          placeholder={COVER_MASTER.PLACEHOLDERS.OPTION}
          error={Boolean(error)}
          onChange={(e) => onChange(index, e.target.value)}
        />
        <IconButton
          aria-label="remove option"
          color="error"
          size="small"
          disabled={options.length === 1}
          onClick={() => onRemove(index)}
        >
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      </LovRow>
    ))}

    {error && (
      <StyledLabelTypography variant="caption" error>
        {error}
      </StyledLabelTypography>
    )}

    <LovActions>
      <Button
        label={COVER_MASTER.BUTTONS.ADD_OPTION}
        variantType="secondary"
        sizeType="small"
        startIcon={<AddIcon fontSize="small" />}
        onClick={onAdd}
      />
    </LovActions>
  </LovSection>
);

/**
 * Step 1 - Create a base cover (mstr_cover) via the config-driven DynamicForm.
 * Cover Name is a freeSolo selectFieldByApi (searches the catalogue for duplicates
 * while accepting a new name). For the "dropdown" input type a label-only options
 * editor builds input_lov. The backend builds covers_meta and enforces uniqueness.
 */
const CreateCoverStep = ({ onCreated }: CreateCoverStepProps) => {
  const dispatch = useDispatch();
  const methods = useForm({ defaultValues: DEFAULT_VALUES, mode: "onBlur" });

  const [options, setOptions] = useState<string[]>([""]);
  const [optionsError, setOptionsError] = useState("");

  const isDropdown = methods.watch("inputType") === "dropdown";

  const mutation = useApiMutation({
    config: {
      onSuccess: () => {
        dispatch(setToastMessage(COVER_MASTER.MESSAGES.CREATED));
        methods.reset(DEFAULT_VALUES);
        setOptions([""]);
        setOptionsError("");
        onCreated?.();
      },
      // Errors are surfaced globally by apiRequest -> handleApiError.
    },
  });

  const handleSubmit = async () => {
    const valid = await methods.trigger();
    if (!valid) return;

    const values = methods.getValues();
    let inputLov: Record<string, string> | null = null;
    if (isDropdown) {
      inputLov = buildInputLov(options);
      if (!Object.keys(inputLov).length) {
        setOptionsError(COVER_MASTER.MESSAGES.OPTIONS_REQUIRED);
        return;
      }
    }

    mutation.mutate({
      endpoint: endPoints.masterCreate(COVER_MASTER.ENTITY),
      method: HTTP_METHODS.POST,
      data: {
        name: (values.name || "").trim(),
        description: values.description?.trim() || null,
        coverTypeLid: values.coverTypeLid ?? null,
        inputType: values.inputType || "text",
        inputLov,
      },
    });
  };

  return (
    <FormWrapper>
      <SectionSubtitle variant="body2">
        {COVER_MASTER.TITLES.CREATE_COVER_SUBTITLE}
      </SectionSubtitle>

      <SplitLayout>
        {/* Left: the cover fields */}
        <Box>
          <DynamicForm
            formConfig={createCoverFormConfig}
            externalMethods={methods}
            defaultValues={DEFAULT_VALUES}
          />
        </Box>

        {/* Right: options editor, shown only for the dropdown input type */}
        <Box>
          {isDropdown && (
            <CoverLovEditor
              options={options}
              error={optionsError}
              onChange={(index, value) => {
                setOptions((prev) =>
                  prev.map((o, i) => (i === index ? value : o))
                );
                setOptionsError("");
              }}
              onAdd={() => setOptions((prev) => [...prev, ""])}
              onRemove={(index) =>
                setOptions((prev) => prev.filter((_, i) => i !== index))
              }
            />
          )}
        </Box>
      </SplitLayout>

      <ButtonRow>
        <Button
          label={
            mutation.isPending
              ? COVER_MASTER.BUTTONS.SAVING
              : COVER_MASTER.BUTTONS.CREATE
          }
          variantType="primary"
          disabled={mutation.isPending}
          onClick={handleSubmit}
        />
      </ButtonRow>
    </FormWrapper>
  );
};

export default CreateCoverStep;
