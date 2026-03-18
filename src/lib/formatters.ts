/**
 * Brazilian data formatting utilities
 */

// ── CPF / CNPJ ──────────────────────────────────────────────
export function maskCpfCnpj(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 11) {
    // CPF: 000.000.000-00
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  // CNPJ: 00.000.000/0000-00
  return digits
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

export function formatCpfCnpj(value: string): string {
  return maskCpfCnpj(value);
}

// ── Phone ───────────────────────────────────────────────────
export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    // Fixo: (00) 0000-0000
    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  }
  // Celular: (00) 00000-0000
  return digits
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

// ── CEP ─────────────────────────────────────────────────────
export function maskCep(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.replace(/(\d{5})(\d{1,3})$/, "$1-$2");
}

// ── Placa ───────────────────────────────────────────────────
export function maskPlate(value: string): string {
  // Aceita Mercosul (ABC1D23) e antiga (ABC-1234)
  const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
  if (clean.length <= 3) return clean;
  return clean.slice(0, 3) + "-" + clean.slice(3);
}

// ── Currency (R$) ───────────────────────────────────────────
export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "R$ 0,00";
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/** Formats a number input with Brazilian decimal (comma) — for display only */
export function formatDecimalBR(value: number | null | undefined, decimals = 2): string {
  if (value == null) return "0";
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// ── KM ──────────────────────────────────────────────────────
export function formatKm(value: number | null | undefined): string {
  if (value == null) return "0 km";
  return `${value.toLocaleString("pt-BR")} km`;
}

// ── Tonnage ─────────────────────────────────────────────────
export function formatTonnage(value: number | null | undefined): string {
  if (value == null) return "0 t";
  return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} t`;
}

// ── Helpers ─────────────────────────────────────────────────
/** Strip all non-digit characters */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

// ── Currency input mask ─────────────────────────────────────
/**
 * Masks a raw string into Brazilian currency format (without R$ prefix).
 * E.g. "657" → "6,57", "158600" → "1.586,00", "" → ""
 */
export function maskCurrencyInput(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const cents = parseInt(digits, 10);
  if (isNaN(cents)) return "";
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Parses a Brazilian-formatted number string back to a JS number.
 * E.g. "1.586,00" → 1586, "6,57" → 6.57, "" → 0
 */
export function parseBRNumber(value: string): number {
  if (!value) return 0;
  // Remove dots (thousand sep), replace comma with dot (decimal sep)
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
}

/**
 * Converts a number to a Brazilian-formatted string for display in inputs.
 * E.g. 1586 → "1.586,00", 6.57 → "6,57"
 */
export function numberToBRString(value: number | null | undefined): string {
  if (value == null || value === 0) return "";
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
