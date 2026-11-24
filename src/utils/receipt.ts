import type { SaleResponse, StoreSettings } from "../types";
import { formatTaxRate, groupTaxByRate } from "./tax";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Preserves the line breaks an admin typed into the address field.
function escapeMultiline(value: string): string {
  return escapeHtml(value).replace(/\r?\n/g, "<br />");
}

interface ReceiptOptions {
  // Marks the receipt as a reprint so it can't be passed off as the original.
  duplicate?: boolean;
  // Shop identity. Optional: a receipt still prints if settings can't be
  // fetched, it just falls back to the app name.
  store?: StoreSettings | null;
}

// Opens a receipt in a new window with Print / Save as PDF and Close buttons.
// Returns false if the browser blocked the pop-up.
export function openReceiptWindow(
  sale: SaleResponse,
  options: ReceiptOptions = {}
): boolean {
  const win = window.open("", "_blank", "width=380,height=640");
  if (!win) return false;

  const store = options.store ?? null;

  const shopName = store?.shopName?.trim() || "RetailFlow";

  const contactLine = [
    store?.phone,
    store?.stateCode ? `State code: ${store.stateCode}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  // Old sales have no tax snapshot, so they print exactly as before.
  const hasTaxBreakup = sale.taxAmount != null;

  // "Tax Invoice" is a legal label, so it needs a GSTIN. A shop that
  // hasn't registered still sees the breakup on its plain invoice.
  const isTaxInvoice = hasTaxBreakup && Boolean(store?.gstRegistered);

  const itemRows = sale.items
    .map((item) => {
      const meta = [
        item.hsnCode ? `HSN ${escapeHtml(item.hsnCode)}` : "",
        item.taxRate ? `${formatTaxRate(item.taxRate)}%` : "",
      ]
        .filter(Boolean)
        .join(" · ");

      return `
        <tr>
          <td style="padding:4px 0;">
            ${escapeHtml(item.productName)} × ${item.quantity}
            ${meta ? `<br /><span class="muted">${meta}</span>` : ""}
          </td>
          <td style="padding:4px 0; text-align:right; vertical-align:top;">₹${item.subtotal.toFixed(2)}</td>
        </tr>`;
    })
    .join("");

  // Grouped from the stored per-line amounts - never recomputed here.
  const taxRows = hasTaxBreakup
    ? groupTaxByRate(sale.items)
        .map(
          (group) => `
        <tr>
          <td>Taxable value (${formatTaxRate(group.rate)}%)</td>
          <td style="text-align:right;">₹${group.taxableAmount.toFixed(2)}</td>
        </tr>
        <tr>
          <td class="muted">CGST ${formatTaxRate(group.rate / 2)}%</td>
          <td style="text-align:right;">₹${group.cgstAmount.toFixed(2)}</td>
        </tr>
        <tr>
          <td class="muted">SGST ${formatTaxRate(group.rate / 2)}%</td>
          <td style="text-align:right;">₹${group.sgstAmount.toFixed(2)}</td>
        </tr>`
        )
        .join("")
    : "";

  const banners = [
    sale.voided ? "*** VOIDED - NOT A VALID RECEIPT ***" : "",
    options.duplicate ? "DUPLICATE COPY" : "",
  ]
    .filter(Boolean)
    .map((text) => `<p class="banner">${text}</p>`)
    .join("");

  win.document.write(`
    <html>
      <head>
        <title>${isTaxInvoice ? "Tax Invoice" : "Invoice"} ${escapeHtml(sale.invoiceNumber)}</title>
        <style>
          body { font-family: monospace; padding: 16px; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; }
          .total-row td { border-top: 1px dashed #000; padding-top: 6px; font-weight: bold; }
          h2 { margin: 0 0 4px 0; }
          p { margin: 2px 0; }
          .muted { color: #555; font-size: 11px; }
          .doc-title { margin-top: 6px; font-weight: bold; letter-spacing: 1px; }
          .section td { padding-top: 8px; font-weight: bold; }
          .banner { font-weight: bold; text-align: center; margin: 8px 0; }
          .actions { margin-top: 16px; display: flex; gap: 8px; }
          button {
            font-family: sans-serif;
            font-size: 13px;
            padding: 8px 16px;
            border-radius: 6px;
            border: none;
            cursor: pointer;
          }
          .print-btn { background: #2563eb; color: white; }
          .close-btn { background: #e5e7eb; color: #374151; }
          @media print { .actions { display: none; } }
        </style>
      </head>
      <body>
        <h2>${escapeHtml(shopName)}</h2>
        ${store?.address ? `<p class="muted">${escapeMultiline(store.address)}</p>` : ""}
        ${contactLine ? `<p class="muted">${escapeHtml(contactLine)}</p>` : ""}
        ${store?.gstin ? `<p class="muted">GSTIN: ${escapeHtml(store.gstin)}</p>` : ""}
        <p class="doc-title">${isTaxInvoice ? "TAX INVOICE" : "INVOICE"}</p>
        ${banners}
        <p>Invoice: ${escapeHtml(sale.invoiceNumber)}</p>
        <p>${new Date(sale.createdAt).toLocaleString()}</p>
        <hr />
        <table>
          ${itemRows}
          <tr><td colspan="2" style="padding-top:8px;"></td></tr>
          <tr><td>Subtotal</td><td style="text-align:right;">₹${sale.subtotal.toFixed(2)}</td></tr>
          <tr><td>Discount</td><td style="text-align:right;">-₹${sale.discount.toFixed(2)}</td></tr>
          ${
            hasTaxBreakup
              ? `<tr class="section"><td colspan="2">GST included</td></tr>${taxRows}`
              : ""
          }
          <tr class="total-row"><td>Total</td><td style="text-align:right;">₹${sale.total.toFixed(2)}</td></tr>
        </table>
        <p>Paid via ${escapeHtml(sale.paymentMethod)}</p>
        <div class="actions">
          <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
          <button class="close-btn" onclick="window.close()">Close</button>
        </div>
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
  return true;
}
