/** Normalize Saudi mobile numbers to E.164 (+966…). */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("966") && digits.length === 12) {
    return `+${digits}`;
  }
  if (digits.startsWith("05") && digits.length === 10) {
    return `+966${digits.slice(1)}`;
  }
  if (digits.startsWith("5") && digits.length === 9) {
    return `+966${digits}`;
  }
  if (input.startsWith("+") && digits.length >= 10) {
    return `+${digits}`;
  }
  return null;
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function splitName(fullName: string): { en: string; ar: string } {
  const trimmed = fullName.trim();
  const first = trimmed.split(/\s+/)[0] ?? trimmed;
  return { en: trimmed, ar: trimmed };
}
