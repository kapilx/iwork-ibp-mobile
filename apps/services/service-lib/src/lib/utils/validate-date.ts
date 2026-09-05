import { BadRequestException } from "@nestjs/common";

export const validatePastDate = (
  value: string | null,
  fieldName: string
): string | null => {
  if (value === null || value === undefined) {
    return value;
  }

  const date = new Date(value);
  const isValidDate =
    date instanceof Date &&
    !isNaN(date.getTime()) &&
    value === date.toISOString().split("T")[0];

  if (!isValidDate) {
    throw new BadRequestException(
      `The ${fieldName} is invalid. Please provide a valid date in the format YYYY-MM-DD.`
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of the day

  if (date >= today) {
    throw new BadRequestException(
      `The ${fieldName} cannot be a future date. Please provide a valid past date.`
    );
  }

  return value;
};
