// Returns checklist items for UI guidelines, including explicit disallowed char rows
export function buildPasswordGuidelineRows(password: string, rules: any[], validatePassword: (password: string, rules: any[]) => { rule: string; message: string }[], mainLabelKey: string = 'errorMessage') {
  const rows: Array<{ key: string; label: string; passed: boolean }> = [];
  const hasInput = password && password.length > 0;
  rules.forEach((rule, idx) => {
    let isDisallowedCharRule = rule.disallowedChars && typeof rule.disallowedChars === 'string' && rule.disallowedChars.length > 0;
    // Disallowed chars rows
    if (isDisallowedCharRule) {
      let chars: string[] = [];
      if (rule.disallowedChars.includes(',')) {
        chars = rule.disallowedChars.split(',').map((c: string) => c.trim()).filter(Boolean);
      } else {
        chars = rule.disallowedChars.split('');
      }
      chars.forEach((char: string, cidx: number) => {
        const charPassed = hasInput ? !password.includes(char) : false;
        rows.push({
          key: idx + '-disallowed-' + char + '-' + cidx,
          label: `Password cannot contain the character: ${char}`,
          passed: charPassed
        });
      });
      // Only show main rule row if errorMessage is not just a disallowed char message
      if (rule[mainLabelKey] && rule[mainLabelKey].trim() && rule[mainLabelKey] !== `Password cannot contain the character: ${chars[0]}`) {
        let passed = true;
        if (hasInput) {
          const errors = validatePassword(password, [rule]);
          passed = errors.length === 0;
        } else {
          passed = false;
        }
        rows.push({
          key: idx + '-main',
          label: rule[mainLabelKey] || '',
          passed
        });
      }
    } else {
      // Main rule row for non-disallowed char rules
      let passed = true;
      if (hasInput) {
        const errors = validatePassword(password, [rule]);
        passed = errors.length === 0;
      } else {
        passed = false;
      }
      rows.push({
        key: idx + '-main',
        label: rule[mainLabelKey] || '',
        passed
      });
    }
  });
  return rows;
}
// Utility to build password rule checklist items
// Usage: buildPasswordChecklistItems(password, rules, validatePasswordAll)

export interface PasswordChecklistItem {
  key: string;
  satisfied: boolean;
  label: string;
}

export function buildPasswordChecklistItems(password: string, rules: any[], validatePasswordAll: (password: string, rules: any[]) => { rule: string; message: string }[]): PasswordChecklistItem[] {
  const errors = validatePasswordAll(password, rules);
  const errorMap = new Map(errors.map(e => [e.rule, e]));
  const hasInput = password && password.length > 0;
  const containsChar = (pwd: string, char: string) => pwd.includes(char);
  const checklistItems: PasswordChecklistItem[] = [];
  rules.forEach(rule => {
    if (rule.disallowedChars && typeof rule.disallowedChars === 'string' && rule.disallowedChars.length > 0) {
      let chars: string[] = [];
      if (rule.disallowedChars.includes(',')) {
        chars = rule.disallowedChars.split(',').map((c: string) => c.trim()).filter(Boolean);
      } else {
        chars = rule.disallowedChars.split('');
      }
      chars.forEach((char: string, idx: number) => {
        const satisfied = !!(hasInput ? !containsChar(password, char) : false);
        checklistItems.push({
          key: `${rule.id}-disallowed-${char}-${idx}`,
          satisfied,
          label: `Password cannot contain the character: ${char}`
        });
      });
      if (rule.errorMessage && rule.errorMessage.trim() && rule.errorMessage !== `Password cannot contain the character: ${chars[0]}`) {
        const satisfied = !!(hasInput && !errorMap.has(rule.name));
        checklistItems.push({
          key: `${rule.id}-main`,
          satisfied,
          label: rule.errorMessage
        });
      }
    } else {
      const satisfied = !!(hasInput && !errorMap.has(rule.name));
      checklistItems.push({
        key: `${rule.id}-main`,
        satisfied,
        label: rule.errorMessage
      });
    }
  });
  return checklistItems;
}
