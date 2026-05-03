// Helpers for sanitizing phone/email search inputs.
// Strips formatting characters (space, -, (, ), +) and supports
// matching phones by the last 4 digits of the entered number.

const STRIP_CHARS_RE = /[\s\-()+]/g;

export function sanitizePhoneInput(value: string): string {
  return (value || '').replace(STRIP_CHARS_RE, '');
}

/**
 * Sanitize search input — strip phone formatting unless the value looks
 * like an email (contains '@').
 */
export function sanitizeSearchInput(value: string): string {
  if (!value) return '';
  if (value.includes('@')) return value;
  return sanitizePhoneInput(value);
}

export function digitsOnly(value: string): string {
  return (value || '').replace(/\D/g, '');
}

/**
 * Returns true if the search term matches the phone.
 * If the term (after stripping formatting) is purely digits and >= 4 chars,
 * we match phones whose digits end with the last 4 digits of the term.
 * Otherwise falls back to a substring check on the sanitized term.
 */
export function phoneMatches(phone: string | null | undefined, term: string): boolean {
  if (!phone) return false;
  const sanitizedTerm = sanitizePhoneInput(term);
  if (!sanitizedTerm) return false;
  const phoneDigits = digitsOnly(phone);
  if (/^\d+$/.test(sanitizedTerm)) {
    if (sanitizedTerm.length >= 4) {
      const last4 = sanitizedTerm.slice(-4);
      return phoneDigits.endsWith(last4) || phoneDigits.includes(last4);
    }
    return phoneDigits.includes(sanitizedTerm);
  }
  return phone.toLowerCase().includes(sanitizedTerm.toLowerCase());
}
