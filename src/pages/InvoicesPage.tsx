import { useEffect, useState } from "react";
import type { SaleResponse } from "../types";
import { lookupSales } from "../api";
import { openReceiptWindow } from "../utils/receipt";
import { useToast } from "../contexts/ToastContext";

export default function InvoicesPage() {
  const [query, setQuery] = useState("");
  const [sales, setSales] = useState<SaleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  // Debounced search: waits 300ms after the last keystroke, and ignores
  // responses from searches that have since been replaced by a newer one.
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await lookupSales(query.trim());
        if (!cancelled) setSales(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load invoices");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  function handlePrint(sale: SaleResponse) {
    if (!openReceiptWindow(sale, { duplicate: true })) {
      showToast("Pop-up blocked. Allow pop-ups to print receipts.", "error");
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Invoices</h2>

      <div className="border rounded-lg bg-white p-4 mb-4">
        <label className="block text-sm font-medium mb-1">Find an invoice</label>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type part of the invoice number, e.g. E5A1"
          className="w-full border rounded px-3 py-2 text-sm font-mono"
          autoFocus
        />
        <p className="text-xs text-gray-400 mt-1">
          Shows the 20 most recent matches. The invoice number is printed on the
          customer's receipt.
        </p>
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}
      {error && (
        <p className="text-red-600 bg-red-50 rounded p-3 mb-4">{error}</p>
      )}

      {!loading && !error && (
        <div className="border rounded-lg bg-white divide-y">
          {sales.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">No matching invoices.</p>
          ) : (
            sales.map((sale) => (
              <div
                key={sale.id}
                className="p-4 flex justify-between items-start gap-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {sale.items
                      .map((i) => `${i.productName} × ${i.quantity}`)
                      .join(", ")}
                    {sale.voided && (
                      <span className="text-red-500 font-semibold text-xs ml-2">
                        VOIDED
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 font-mono mt-1 truncate">
                    {sale.invoiceNumber}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(sale.createdAt).toLocaleString()} ·{" "}
                    {sale.paymentMethod}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="font-semibold whitespace-nowrap">
                    ₹{sale.total.toFixed(2)}
                  </span>
                  <button
                    onClick={() => handlePrint(sale)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Print / PDF
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}