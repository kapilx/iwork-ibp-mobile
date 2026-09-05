const lookUpUtility = (data: any) => {
  if (!data?.data?.length) {
    return [{ value: "", label: "No options available" }];
  }
  return data.data.map((item) => ({
    value: item.id,
    label: item.lookUpValue,
  }));
};

// Utility to generate years from current year to past 15 years
const generateYearOptions = (): { value: string; label: string }[] => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = 0; i < 15; i++) {
    const year = currentYear - i;
    years.push({ value: year.toString(), label: year.toString() });
  }
  return years;
};


export const filterConfig = [
  {
    key: "financialYear",
    label: "Year",
    options: generateYearOptions(),
    apiDependencies: {
      defaultValue: new Date().getFullYear().toString(), // Default to current year
    },
  },

  {
    key: "timeFilter",
    label: "Quarter",
    options: [
      { value: "Q1", label: "Q1" },
      { value: "Q2", label: "Q2" },
      { value: "Q3", label: "Q3" },
      { value: "Q4", label: "Q4" },
    ],
  },
  {
    key: "selectedMonth",
    label: "Month",
    options: [],
  },
];
