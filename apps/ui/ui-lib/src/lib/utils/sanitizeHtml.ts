import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks
 * Uses DOMPurify with default settings to remove malicious scripts while preserving safe formatting
 *
 * @param dirty - The potentially unsafe HTML string
 * @returns Sanitized HTML string safe for rendering
 */
export const sanitizeHtml = (dirty: string): string => {
  if (!dirty) return '';

  return DOMPurify.sanitize(dirty);
};
