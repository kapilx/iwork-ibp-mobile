// Shared password validation logic (no NestJS / React dependencies).
// Frontend copy for the UI apps — mirrors the backend service-lib util so the
// frontend can import it from @ui/ui-lib instead of reaching into service-lib.
export interface PasswordRuleDefinition {
  id?: number;
  name: string;
  isRequired?: boolean;
  minChars?: number;
  maxChars?: number;
  regex?: string;
  disallowedChars?: string;
  errorMessage?: string;
}
export interface ValidationError {
  rule: string;
  message: string;
}

export class PasswordValidationUiUtil {
  static validatePassword(password: string, rules: PasswordRuleDefinition[]): ValidationError[] {
    const errors: ValidationError[] = [];
    const sortedRules = [...rules].sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
    for (const rule of sortedRules) {
      const error = PasswordValidationUiUtil.validateAgainstRule(password, rule);
      if (error) {
        return [error];
      }
    }
    return errors;
  }

  static validateAgainstRule(password: string, rule: PasswordRuleDefinition): ValidationError | null {
    if (rule.name.toLowerCase() === 'length') {
      if (rule.minChars && password.length < rule.minChars) {
        return { rule: rule.name, message: rule.errorMessage || `Password must be at least ${rule.minChars} characters long` };
      }
      if (rule.maxChars && password.length > rule.maxChars) {
        return { rule: rule.name, message: rule.errorMessage || `Password cannot exceed ${rule.maxChars} characters` };
      }
      return null;
    }
    if (rule.regex && rule.regex.startsWith('^(?!') && rule.isRequired) {
      const regex = new RegExp(rule.regex);
      const matches = regex.test(password);
      if (!matches) {
        return { rule: rule.name, message: rule.errorMessage || `Password does not meet ${rule.name} requirements` };
      }
      return null;
    }
    if (rule.regex && /\\1/.test(rule.regex)) {
      if (rule.regex) {
        const regex = new RegExp(rule.regex);
        const matches = regex.test(password);
        if (!matches) {
          return { rule: rule.name, message: rule.errorMessage || `Password contains repeating characters` };
        }
      }
      return null;
    }
    if (rule.regex && rule.isRequired) {
      const regex = new RegExp(rule.regex);
      const matchesRequirement = regex.test(password);
      if (!matchesRequirement) {
        return {
          rule: rule.name,
          message:
            rule.errorMessage ||
            `Password does not meet ${rule.name} requirements`,
        };
      }

      const globalRegex = new RegExp(rule.regex, 'g');
      const matches = password.match(globalRegex);
      const matchCount = matches ? matches.length : 0;
      if (rule.disallowedChars && rule.disallowedChars.length > 0) {
        if (rule.disallowedChars.startsWith('[') && rule.disallowedChars.endsWith(']')) {
          const disallowedRegex = new RegExp(rule.disallowedChars);
          const disallowedMatch = password.match(disallowedRegex);
          if (disallowedMatch) {
            return { rule: rule.name, message: `Password contains disallowed characters: ${disallowedMatch[0]}` };
          }
        } else {
          for (const disallowedChar of rule.disallowedChars) {
            if (password.includes(disallowedChar)) {
              return { rule: rule.name, message: `Password cannot contain the character: ${disallowedChar}` };
            }
          }
        }
      }
      if (rule.minChars && matchCount < rule.minChars) {
        return { rule: rule.name, message: rule.errorMessage || `Password must contain at least ${rule.minChars} ${rule.name.toLowerCase()}` };
      }
      if (rule.maxChars && matchCount > rule.maxChars) {
        return { rule: rule.name, message: rule.errorMessage || `Password cannot contain more than ${rule.maxChars} ${rule.name.toLowerCase()}` };
      }
    }
    return null;
  }

  static isPasswordValid(password: string, rules: PasswordRuleDefinition[]): boolean {
    const errors = PasswordValidationUiUtil.validatePassword(password, rules);
    return errors.length === 0;
  }

  static validatePasswordOrThrow(password: string, rules: PasswordRuleDefinition[]): void {
    const errors = PasswordValidationUiUtil.validatePassword(password, rules);
    if (errors.length > 0) {
      throw new Error(errors[0].message);
    }
  }

  // Return all errors for all rules (for checklist display)
  static validatePasswordAll(password: string, rules: PasswordRuleDefinition[]): ValidationError[] {
    const errors: ValidationError[] = [];
    const sortedRules = [...rules].sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
    for (const rule of sortedRules) {
      const error = PasswordValidationUiUtil.validateAgainstRule(password, rule);
      if (error) {
        errors.push(error);
      }
    }
    return errors;
  }
}
