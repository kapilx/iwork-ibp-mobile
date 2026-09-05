import bcrypt from "bcryptjs";
import {
  buildPIIRules,
  PASSWORD_COMPLEXITY_RULES,
  PASSWORD_PATTERNS,
  UserPII,
} from "../../../../../../libs/service-lib/src/lib/constants";

/**
 * Hashes a password using bcrypt.
 * @param password - The plain text password to hash.
 * @returns A promise that resolves to the hashed password.
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

export function validatePassword(
  password: string,
  user: UserPII
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const lowerPassword = password.toLowerCase();

  // Complexity rules
  PASSWORD_COMPLEXITY_RULES.forEach((rule) => {
    if (!rule.test(password)) {
      errors.push(rule.message);
    }
  });

  // PII rules
  buildPIIRules(user).forEach(({ label, value }) => {
    if (
      value &&
      value.length >= 3 &&
      lowerPassword.includes(value.toLowerCase())
    ) {
      errors.push(`Password must not contain personal information (${label})`);
    }
  });

  // Weak pattern rules
  PASSWORD_PATTERNS.forEach(({ regex, message }) => {
    if (regex.test(password)) {
      errors.push(message);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Compares a plain text password with a hashed password.
 * @param plainPassword - The plain text password.
 * @param hashedPassword - The hashed password.
 * @returns A promise that resolves to a boolean indicating if the passwords match.
 */
export async function isPasswordMatch(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
  return isMatch;
}
