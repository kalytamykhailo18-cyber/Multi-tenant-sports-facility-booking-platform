// Currency utility functions

// Supported currencies
export const CURRENCIES = {
  ARS: { code: 'ARS', symbol: '$', name: 'Peso Argentino', locale: 'es-AR' },
  USD: { code: 'USD', symbol: 'US$', name: 'Dólar Estadounidense', locale: 'en-US' },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

/**
 * Format amount with currency symbol
 * @param amount - Amount to format
 * @param currencyCode - Currency code (ARS, USD)
 */
export function formatCurrency(
  amount: number | string,
  currencyCode: CurrencyCode = 'ARS'
): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const currency = CURRENCIES[currencyCode];

  return new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
}

/**
 * Format amount without currency symbol (for inputs)
 * @param amount - Amount to format
 */
export function formatAmount(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
}

/**
 * Parse currency string to number
 * @param value - String value with currency formatting
 */
export function parseCurrency(value: string): number {
  // Remove currency symbols and thousands separators
  const cleaned = value
    .replace(/[^0-9,.-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  return parseFloat(cleaned) || 0;
}

/**
 * Calculate percentage of an amount
 * @param amount - Base amount
 * @param percentage - Percentage to calculate (0-100)
 */
export function calculatePercentage(amount: number, percentage: number): number {
  return (amount * percentage) / 100;
}

/**
 * Calculate deposit amount based on percentage
 * @param totalAmount - Total booking amount
 * @param depositPercentage - Deposit percentage (0-100)
 */
export function calculateDeposit(totalAmount: number, depositPercentage: number): number {
  return Math.round(calculatePercentage(totalAmount, depositPercentage) * 100) / 100;
}

/**
 * Calculate remaining balance after deposit
 * @param totalAmount - Total booking amount
 * @param depositAmount - Deposit amount paid
 */
export function calculateBalance(totalAmount: number, depositAmount: number): number {
  return Math.max(0, totalAmount - depositAmount);
}

/**
 * Get currency symbol
 * @param currencyCode - Currency code
 */
export function getCurrencySymbol(currencyCode: CurrencyCode = 'ARS'): string {
  return CURRENCIES[currencyCode].symbol;
}
