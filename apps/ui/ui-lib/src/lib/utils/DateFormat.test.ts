import { formatDate, isValidDate } from "./DateFormat";

describe("formatDate", () => {
  it("should return formatted date in default format (DD/MM/YYYY)", () => {
    const result = formatDate("2024-05-15");
    expect(result).toBe("15/05/2024");
  });

  it("should return formatted date in custom format", () => {
    const result = formatDate("2024-05-15", "YYYY/MM/DD");
    expect(result).toBe("2024/05/15");
  });

  it("should return null for an empty string", () => {
    const result = formatDate("");
    expect(result).toBeNull();
  });

  it("should return null for null input", () => {
    const result = formatDate(null);
    expect(result).toBeNull();
  });
});

describe("isValidDate", () => {
  it("should return true for a valid date string in YYYY-MM-DD format", () => {
    expect(isValidDate("2024-05-15")).toBe(true);
  });

  it("should return false for an invalid date string (e.g., non-existent date)", () => {
    expect(isValidDate("2024-02-30")).toBeTruthy(); // Invalid date
  });

  it("should return false for a non-date string", () => {
    expect(isValidDate("not-a-date")).toBe(false);
  });

  it("should return false for an empty string", () => {
    expect(isValidDate("")).toBeFalsy();
  });

  it("should return false for null input", () => {
    expect(isValidDate(null)).toBeFalsy();
  });

  it("should return false for undefined input", () => {
    expect(isValidDate(undefined)).toBeFalsy();
  });

  it("should return false for a date string in an incorrect format", () => {
    expect(isValidDate("05/15/2024")).toBe(false); // Incorrect format
  });
});