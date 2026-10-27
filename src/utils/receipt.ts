import type { SaleResponse } from "../types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface ReceiptOptions {
  // Marks the receipt as a reprint so it can't be passed off as the original.
  duplicate?: boolean;
}

// Opens a receipt in a new window with Print / Save as PDF and Close buttons.
// Returns false if the browser blocked the pop-up.
export function openReceiptWindow(
  sale: SaleResponse,
  options: ReceiptOptions = {}
): boolean {
  const win = window.open("", "_blank", "width=380,height=640");
  if (!win) return false;

  const itemRows = sale.items
    .map(
      (item) => `
        <tr>
          <td style="padding:4px 0;">${escapeHtml(item.productName)} × ${item.quantity}</td>
          <td style="padding:4px 0; text-align:right;">₹${item.subtotal.toFixed(2)}</td>
        </tr>`
    )
    .join("");

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
        <title>Receipt ${escapeHtml(sale.invoiceNumber)}</title>
        <style>
          body { font-family: monospace; padding: 16px; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; }
          .total-row td { border-top: 1px dashed #000; padding-top: 6px; font-weight: bold; }
          h2 { margin: 0 0 4px 0; }
          p { margin: 2px 0; }
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
        <h2>RetailFlow</h2>
        ${banners}
        <p>Invoice: ${escapeHtml(sale.invoiceNumber)}</p>
        <p>${new Date(sale.createdAt).toLocaleString()}</p>
        <hr />
        <table>
          ${itemRows}
          <tr><td colspan="2" style="padding-top:8px;"></td></tr>
          <tr><td>Subtotal</td><td style="text-align:right;">₹${sale.subtotal.toFixed(2)}</td></tr>
          <tr><td>Discount</td><td style="text-align:right;">-₹${sale.discount.toFixed(2)}</td></tr>
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