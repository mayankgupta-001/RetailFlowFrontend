import type { SaleItemResponse } from "../types";

// Rates are stored as decimals (18.00). Printing "18" instead of
// "18.00" keeps thermal receipts short.
export function formatTaxRate(
  rate: number | null | undefined
): string {
  if (rate == null) return "0";
  return rate.toFixed(2).replace(/\.?0+$/, "");
}

export interface TaxGroup {
  rate: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  taxAmount: number;
}

// Summarises the STORED per-line amounts by rate. Nothing is recomputed
// here: the backend already decided the tax split, and recalculating in
// the browser would drift by a paisa on rounded lines.
export function groupTaxByRate(
  items: SaleItemResponse[]
): TaxGroup[] {
  const groups = new Map<number, TaxGroup>();

  for (const item of items) {
    if (item.taxAmount == null) continue;

    const rate = item.taxRate ?? 0;
    const group = groups.get(rate) ?? {
      rate,
      taxableAmount: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      taxAmount: 0,
    };

    group.taxableAmount += item.taxableAmount ?? 0;
    group.cgstAmount += item.cgstAmount ?? 0;
    group.sgstAmount += item.sgstAmount ?? 0;
    group.taxAmount += item.taxAmount;

    groups.set(rate, group);
  }

  return [...groups.values()].sort((a, b) => a.rate - b.rate);
}
