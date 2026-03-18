/**
 * CNPJ validation and formatting utilities
 */

// Remove all non-numeric characters
export function cleanCNPJ(cnpj: string): string {
  return cnpj.replace(/\D/g, "");
}

// Format CNPJ with mask: XX.XXX.XXX/XXXX-XX
export function formatCNPJ(cnpj: string): string {
  const cleaned = cleanCNPJ(cnpj);
  
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 5) return `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`;
  if (cleaned.length <= 8) return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5)}`;
  if (cleaned.length <= 12) return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8)}`;
  return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12, 14)}`;
}

// Validate CNPJ check digits
export function validateCNPJ(cnpj: string): boolean {
  const cleaned = cleanCNPJ(cnpj);
  
  // Must have exactly 14 digits
  if (cleaned.length !== 14) return false;
  
  // Check for known invalid patterns (all same digits)
  if (/^(\d)\1+$/.test(cleaned)) return false;
  
  // Validate first check digit
  let sum = 0;
  let weight = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned[i]) * weight[i];
  }
  
  let remainder = sum % 11;
  let firstDigit = remainder < 2 ? 0 : 11 - remainder;
  
  if (parseInt(cleaned[12]) !== firstDigit) return false;
  
  // Validate second check digit
  sum = 0;
  weight = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned[i]) * weight[i];
  }
  
  remainder = sum % 11;
  let secondDigit = remainder < 2 ? 0 : 11 - remainder;
  
  if (parseInt(cleaned[13]) !== secondDigit) return false;
  
  return true;
}

/**
 * WhatsApp/Phone validation and formatting utilities
 */

// Remove all non-numeric characters
export function cleanPhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

// Format phone with mask: (XX) XXXXX-XXXX or (XX) XXXX-XXXX
export function formatPhone(phone: string): string {
  const cleaned = cleanPhone(phone);
  
  if (cleaned.length <= 2) return cleaned.length > 0 ? `(${cleaned}` : "";
  if (cleaned.length <= 6) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  if (cleaned.length <= 10) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
}

// Validate Brazilian phone number
export function validatePhone(phone: string): boolean {
  const cleaned = cleanPhone(phone);
  
  // Must have 10 or 11 digits (landline or mobile)
  if (cleaned.length < 10 || cleaned.length > 11) return false;
  
  // First two digits must be a valid DDD (11-99)
  const ddd = parseInt(cleaned.slice(0, 2));
  if (ddd < 11 || ddd > 99) return false;
  
  // If 11 digits, first digit after DDD should be 9 (mobile)
  if (cleaned.length === 11 && cleaned[2] !== "9") return false;
  
  return true;
}
