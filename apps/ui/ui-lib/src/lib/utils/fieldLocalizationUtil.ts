// import { FormFieldConfig } from "../common/FormComponent/types";

interface LocalizationField {
  fieldKey: string;
  fieldLabel: string;
  metaData?: Record<string, any>;
}

export interface LocalizationResponse {
  fields: LocalizationField[];
}

export const localizeFields = (
  formConfig: FormFieldConfig[],
  localizationData: LocalizationResponse
): FormFieldConfig[] => {
  const fieldMap = new Map(
    localizationData?.data?.fields?.map((field) => [field.fieldKey, field])
  );

  return formConfig
    .map((field) => {
      if (field.localizationKey) {
        const localizedField = fieldMap.get(field.localizationKey);
        if (localizedField) {
          const { fieldLabel, metaData } = localizedField;
          let updatedField: FormFieldConfig = {
            ...field,
            label: fieldLabel,
          };
          if (metaData?.regex) {
            const existingMessage = field.rules?.pattern?.message;
            updatedField = {
              ...updatedField,
              rules: {
                ...field.rules,
                pattern: {
                  value: new RegExp(metaData.regex),
                  message: existingMessage,
                },
              },
            };
          }
          return updatedField;
        }
        return null;
      }
      return field; // keep it if no localization required
    })
    .filter((field): field is FormFieldConfig => field !== null);
};
