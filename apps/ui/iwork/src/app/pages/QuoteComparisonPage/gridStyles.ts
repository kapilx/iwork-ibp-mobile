export const QCR_SECTION_ROW_CLASS = "qcr-section-row";
export const QCR_SECTION_SPACER_ROW_CLASS = "qcr-section-spacer-row";
export const QCR_SECTION_CELL_CLASS = "qcr-section-cell";

export const qcrSectionCellClassRules = {
  [QCR_SECTION_CELL_CLASS]: (params: any) =>
    ["section", "section_spacer"].includes(params?.data?.__rowType) &&
    ["key", "parameters"].includes(params?.colDef?.field || ""),
};

export const getQcrSectionRowClass = (params: any) =>
  params?.data?.__rowType === "section"
    ? QCR_SECTION_ROW_CLASS
    : params?.data?.__rowType === "section_spacer"
      ? QCR_SECTION_SPACER_ROW_CLASS
      : undefined;
