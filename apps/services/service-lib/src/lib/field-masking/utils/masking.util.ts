import { MaskingConfig, MaskingPattern } from '../constants/masking-patterns.constants';

export function maskValue(value: string, config: MaskingConfig): string {
  if (!value) return value;

  switch (config.pattern) {
    case MaskingPattern.FULL:
      return 'x'.repeat(value.length);

    case MaskingPattern.LAST_N_VISIBLE: {
      const n = config.visibleCount;
      if (value.length <= n) return value;
      return 'x'.repeat(value.length - n) + value.slice(-n);
    }

    case MaskingPattern.FIRST_N_VISIBLE: {
      const n = config.visibleCount;
      if (value.length <= n) return value;
      return value.slice(0, n) + 'x'.repeat(value.length - n);
    }

    case MaskingPattern.EMAIL_STANDARD: {
      const atIndex = value.indexOf('@');
      if (atIndex < 0) return 'x'.repeat(value.length);
      const local = value.slice(0, atIndex);
      const domain = value.slice(atIndex + 1);
      const dotIndex = domain.lastIndexOf('.');
      const domainName = dotIndex >= 0 ? domain.slice(0, dotIndex) : domain;
      const extension = dotIndex >= 0 ? domain.slice(dotIndex) : '';
      const maskedLocal = local.length > 0 ? local[0] + '***' : '***';
      const maskedDomain = domainName.length > 0 ? domainName[0] + '***' : '***';
      return `${maskedLocal}@${maskedDomain}${extension}`;
    }

    case MaskingPattern.DIGITS_MASK:
      return value.replace(/\d/g, '*');

    case MaskingPattern.ALTERNATE_CHARS:
      return value
        .split('')
        .map((char, index) => (index % 2 === 1 ? 'x' : char))
        .join('');

    case MaskingPattern.MIDDLE_MASK: {
      const n = config.visibleEachSide ?? 1;
      if (value.length <= n * 2) return value;
      const middle = value.length - n * 2;
      return value.slice(0, n) + '*'.repeat(middle) + value.slice(value.length - n);
    }

    default:
      return value;
  }
}
