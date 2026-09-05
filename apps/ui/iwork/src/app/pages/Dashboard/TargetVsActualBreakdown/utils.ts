const formatNumber = (value: number) => {
  if (Number.isInteger(value)) {
    return value.toLocaleString("en-IN");
  }

  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
};

export const valueWithUnit = (value: number, unit: string) => {
  if (unit === "%") {
    return `${Math.round(value)}%`;
  }

  return `${formatNumber(value)} ${unit}`;
};
