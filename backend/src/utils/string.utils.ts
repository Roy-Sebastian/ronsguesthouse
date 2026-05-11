/**
 * Converts a string to Title Case.
 * Handles multiple spaces, hyphenated names, and mixed casing.
 *
 * Examples:
 *   "budi santoso"    → "Budi Santoso"
 *   "BUDI SANTOSO"    → "Budi Santoso"
 *   "muhammad al-amin" → "Muhammad Al-Amin"
 */
export function toTitleCase(str: string): string {
  if (!str) return str;
  return str
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
