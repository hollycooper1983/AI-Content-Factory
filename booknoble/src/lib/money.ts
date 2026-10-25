import type { Invoice } from './types';

export function formatMoney(cents: number, currency = 'USD'): string {
  if (cents === 0) return 'Free';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function formatMoneyExact(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
}

/** Parses "45", "45.5", "$1,200.00" into cents; returns null when not a number. */
export function parseMoney(input: string): number | null {
  const clean = input.replace(/[$,\s]/g, '');
  if (clean === '') return 0;
  if (!/^\d+(\.\d{0,2})?$/.test(clean)) return null;
  return Math.round(parseFloat(clean) * 100);
}

export function centsToInput(cents: number): string {
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2);
}

export function invoiceTotals(inv: Pick<Invoice, 'lines' | 'taxRateBps'>) {
  const subtotal = inv.lines.reduce((s, l) => s + Math.round(l.quantity * l.unitCents), 0);
  const tax = Math.round((subtotal * inv.taxRateBps) / 10_000);
  return { subtotal, tax, total: subtotal + tax };
}
