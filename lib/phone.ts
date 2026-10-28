/**
 * Normalizes any incoming phone string to standard E.164 format (+212XXXXXXXXX)
 * Handles Moroccan national numbers (06..., 07..., 05...), international numbers without +, etc.
 */
export function normalizePhone(rawPhone: string): string {
  if (!rawPhone) return '';
  
  // Strip non-numeric characters except +
  let cleaned = rawPhone.trim().replace(/[^\d+]/g, '');

  // Handle Moroccan national format (06..., 07..., 05...)
  if (cleaned.startsWith('06') || cleaned.startsWith('07') || cleaned.startsWith('05')) {
    cleaned = '+212' + cleaned.substring(1);
  } else if (cleaned.startsWith('212')) {
    cleaned = '+' + cleaned;
  } else if (!cleaned.startsWith('+') && cleaned.length >= 9) {
    cleaned = '+' + cleaned;
  }

  return cleaned;
}
