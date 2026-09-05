import { useMemo } from "react";

interface UseResolvedConfigProps {
  config: any;
  data: any;
  documentPath: string;
  configTransformer?: (config: any, data: any) => any;
}

/**
 * Custom hook to resolve document configuration for step components
 * @param config - The original configuration array
 * @param data - API response data containing documents
 * @param documentPath - Path to documents in the data structure (e.g., "claimPayment", "voucherToInsurer")
 * @param configTransformer - Optional function to transform config before applying document resolution
 * @returns Resolved configuration with documents injected into documentupload fields
 */
export const useResolvedConfig = ({
  config,
  data,
  documentPath,
  configTransformer,
}: UseResolvedConfigProps) => {
  return useMemo(() => {
    if (!config) return null;

    // Apply custom transformation if provided
    let transformedConfig = config;
    if (configTransformer) {
      transformedConfig = configTransformer(config, data);
    }

    const documents =
      data?.data?.data?.[0]?.data?.[documentPath]?.documents || [];

    return transformedConfig.map((group: any) => {
      if (!Array.isArray(group.config)) return group;
      return {
        ...group,
        config: group.config.map((field: any) => {
          if (field.type === "documentupload") {
            return {
              ...field,
              componentProps: {
                ...(field.componentProps || {}),
                documents,
              },
            };
          }
          return field;
        }),
      };
    });
  }, [config, data?.data?.data, documentPath, configTransformer]);
};
