export const buildInsurerDetailsValue = (
  existingDetails: any,
  rows: any[]
) => {
  if (Array.isArray(existingDetails)) {
    return rows;
  }
  if (
    existingDetails &&
    typeof existingDetails === "object" &&
    Array.isArray((existingDetails as any).retArray)
  ) {
    return {
      ...(existingDetails as any),
      retArray: rows,
    };
  }
  return rows;
};

export const clearInsurerDetailsNumericFields = (
  rows: any[],
  isSinglePlacement: boolean,
  leadParticipationType: any,
  coParticipationType: any
) => {
  if (!Array.isArray(rows)) {
    return [];
  }

  const fieldsToClear = [
    "sharePercentage",
    "shareAmount",
    "brokeragePercentage",
    "brokerageAmount",
    "terrorismSharePercentage",
    "terrorismShareAmount",
    "terrorismBrokeragePercentage",
    "terrorismBrokerageAmount",
    "totalBrokerageAmount",
  ];

  return rows.map((row, index) => {
    const nextRow = { ...(row || {}) };
    fieldsToClear.forEach((field) => {
      nextRow[field] = null;
    });
    nextRow.sharePercentage = isSinglePlacement ? 100 : null;
    if (nextRow.isLeadInsurer == null) {
      nextRow.isLeadInsurer =
        index === 0 ? leadParticipationType : coParticipationType;
    }
    return nextRow;
  });
};
