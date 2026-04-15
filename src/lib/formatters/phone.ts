// Celular BR = 11 dígitos (2 DDD + 9 + 8). Fixo = 10 dígitos (2 DDD + 4 + 4).
// Suporta ambos. `+55` prefixo internacional é removido junto com demais não-dígitos.
// Dígitos estrangeiros com DDI diferente de 55 são truncados; usuário verá feedback
// via regex do schema se o resultado não parsear.
export function stripPhoneMask(masked: string): string {
  return masked.replace(/\D+/g, "");
}

function stripCountryCode(digits: string): string {
  if (digits.length > 11 && digits.startsWith("55")) {
    return digits.slice(2);
  }
  return digits;
}

export function formatPhone(raw: string): string {
  const digits = stripCountryCode(stripPhoneMask(raw)).slice(0, 11);
  const len = digits.length;
  if (len === 0) return "";
  if (len < 3) return `(${digits}`;
  if (len <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (len <= 10) {
    // Fixo: (DD) XXXX-XXXX
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  // Celular: (DD) 9XXXX-XXXX
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}
