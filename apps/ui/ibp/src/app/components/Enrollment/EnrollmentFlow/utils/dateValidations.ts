export const parseDateString = (dateString?: string) => {
  if (!dateString) return null;

  if (dateString.includes("/")) {
    const [day, month, year] = dateString
      .split("/")
      .map((part) => parseInt(part, 10));
    if ([day, month, year].every((value) => !Number.isNaN(value)) && typeof year === "number") {
      return new Date(year, (month || 1) - 1, day || 1);
    }
    return null;
  }

  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
};

export const calculateAgeFromDate = (birthDate: Date) => {
  const today = new Date();
  const age =
    today.getFullYear() -
    birthDate.getFullYear() -
    (today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())
      ? 1
      : 0);

  return age;
};

export const getDateLimits = (minAge: number | null, maxAge: number | null) => {
  const today = new Date();
  let minDate: Date | null = null;
  let maxDate: Date | null = null;

  if (maxAge) {
    minDate = new Date(
      today.getFullYear() - maxAge - 1,
      today.getMonth(),
      today.getDate() + 1
    );
  }

  if (minAge) {
    maxDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
  }

  return { minDate, maxDate };
};

interface AgeConstraints {
  minAge: number | null;
  maxAge: number | null;
  relationType: string | null;
}

interface ValidateDateOfBirthOptions {
  value: string;
  relationship: string | undefined;
  getAgeConstraintsForRelationship: (relationshipName: string) => AgeConstraints;
  getRelationTypeForRelationship: (relationshipName: string) => string | null;
  parentAgeGapRequirement: number;
  childAgeGapRequirement: number;
  employeeDateOfBirth: Date | null;
  employeeAge: number | null;
}

export const validateDateOfBirth = ({
  value,
  relationship,
  getAgeConstraintsForRelationship,
  getRelationTypeForRelationship,
  parentAgeGapRequirement,
  childAgeGapRequirement,
  employeeDateOfBirth,
  employeeAge,
}: ValidateDateOfBirthOptions) => {
  if (!value) return true;

  const currentRelationship = relationship;

  if (!currentRelationship) {
    return "Please select a relationship first";
  }

  // Use parseDateString to properly handle DD/MM/YYYY format
  const birthDate = parseDateString(value);
  if (!birthDate || Number.isNaN(birthDate.getTime())) {
    return "Please enter a valid date";
  }

  const { minAge: relationMinAge, maxAge: relationMaxAge } =
    getAgeConstraintsForRelationship(currentRelationship);

  const relationType = getRelationTypeForRelationship(currentRelationship);
  const relationTypeLower = relationType?.toLowerCase();
  const age = calculateAgeFromDate(birthDate);

  if (relationMinAge && age < relationMinAge) {
    return `Minimum age for ${currentRelationship} should be ${relationMinAge} years (selected age: ${age})`;
  }

  if (relationMaxAge && age > relationMaxAge) {
    return `Maximum age for ${currentRelationship} should be ${relationMaxAge} years (selected age: ${age})`;
  }

  if (
    relationTypeLower === "parents" &&
    parentAgeGapRequirement > 0 &&
    employeeDateOfBirth &&
    employeeAge !== null
  ) {
    const employeeBirthDate = employeeDateOfBirth;
    if (birthDate >= employeeBirthDate) {
      return `Parent must be older than employee by at least ${parentAgeGapRequirement} years.`;
    }

    const ageGap = age - employeeAge;
    if (ageGap < parentAgeGapRequirement) {
      return `Parent must be at least ${parentAgeGapRequirement} years older than employee (current gap: ${ageGap}).`;
    }
  }

  if (
    relationTypeLower === "children" &&
    childAgeGapRequirement > 0 &&
    employeeDateOfBirth &&
    employeeAge !== null
  ) {
    const employeeBirthDate = employeeDateOfBirth;
    if (birthDate <= employeeBirthDate) {
      return "Child date of birth must be after employee's date of birth.";
    }

    const ageGap = employeeAge - age;
    if (ageGap < childAgeGapRequirement) {
      return `Employee must be at least ${childAgeGapRequirement} years older than child (current gap: ${ageGap}).`;
    }
  }

  return true;
};
