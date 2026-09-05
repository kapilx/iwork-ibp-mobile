export const buildSectionAwareCoverConfig = (coversMetaData: any): any[] => {
  const renderFromSectionPlan = (blocks: any[]): any[] => {
    const sectionAwareConfig: any[] = [];

    blocks.forEach((block: any, index: number) => {
      const blockFields = Array.isArray(block?.fields) ? block.fields : [];
      if (!blockFields.length) {
        return;
      }

      if (block?.type === "section" && block?.sectionId != null) {
        sectionAwareConfig.push({
          type: "title",
          name: `cover_section_title_${block.sectionId}_${index}`,
          key: `cover_section_title_${block.sectionId}_${index}`,
          label: block.sectionName || block.sectionKey || "Section",
          gridColumn: 12,
          componentProps: {
            isBold: true,
            variant: "subtitle1",
            sectionBox: true,
          },
        });
        sectionAwareConfig.push(...blockFields);
        return;
      }

      sectionAwareConfig.push(
        ...blockFields.map((field: any) => ({
          ...field,
          componentProps: {
            ...(field.componentProps || {}),
            outsideSectionBox: true,
          },
        }))
      );
    });

    return sectionAwareConfig;
  };

  const flatFormConfig = Array.isArray(coversMetaData?.formConfig)
    ? coversMetaData.formConfig
    : [];
  const sectionRenderPlanBlocks = Array.isArray(
    coversMetaData?.sectionRenderPlan?.blocks
  )
    ? coversMetaData.sectionRenderPlan.blocks
    : [];

  if (sectionRenderPlanBlocks.length) {
    const fromPlan = renderFromSectionPlan(sectionRenderPlanBlocks);
    return fromPlan.length ? fromPlan : flatFormConfig;
  }

  return flatFormConfig;
};
