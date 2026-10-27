import { useEffect, useState } from "react";
import type { SaleResponse } from "../types";
import { getSalesBetween, voidSale } from "../api";
import { useToast } from "../contexts/ToastContext";
import ConfirmDialog from "../components/ConfirmDialog";

type RangePreset = "today" | "month" | "custom";

function getPresetRange(preset: "today" | "month"): { from: Date; to: Date } {
  const now = new Date();
  if (preset === "today") {
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const to = new Date(from);
    to.setDate(to.getDate() + 1);
    to.setMilliseconds(-1);
    return { from, to };
  }
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  to.setMilliseconds(-1);
  return { from, to };
}

function toDateInputValue(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export default function SalesReportPage() {
  const [preset, setPreset] = useState<RangePreset>("today");
  const [customFrom, setCustomFrom] = useState(toDateInputValue(new Date()));
  const [customTo, setCustomTo] = useState(toDateInputValue(new Date()));
  const [sales, setSales] = useState<SaleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoiceQuery, setInvoiceQuery] = useState("");
  const [voidTargetId, setVoidTargetId] = useState<number | null>(null);
  const { showToast } = useToast();

  function getActiveRange(): { from: Date; to: Date } {
    if (preset === "custom") {
      const from = new Date(customFrom + "T00:00:00");
      const to = new Date(customTo + "T23:59:59");
      return { from, to };
    }
    return getPresetRange(preset);
  }

  async function loadSales() {
    setLoading(true);
    setError(null);
    try {
      const { from, to } = getActiveRange();
      const data = await getSalesBetween(from, to);
      setSales(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sales");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, customFrom, customTo]);

  const activeSales = sales.filter((s) => !s.voided);

  const totalRevenue = activeSales.reduce((sum, s) => sum + s.total, 0);
  const saleCount = activeSales.length;

  const productTotals = new Map<string, number>();
  for (const sale of activeSales) {
    for (const item of sale.items) {
      productTotals.set(
        item.productName,
        (productTotals.get(item.productName) ?? 0) + item.quantity
      );
    }
  }
  const topProducts = [...productTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  function handleExportCsv() {
    const rows = [
      ["Invoice", "Date", "Items", "Subtotal", "Discount", "Total", "Payment Method", "Voided"],
      ...sales.map((s) => [
        s.invoiceNumber,
        new Date(s.createdAt).toLocaleString(),
        s.items.map((i) => `${i.productName} x${i.quantity}`).join("; "),
        s.subtotal.toFixed(2),
        s.discount.toFixed(2),
        s.total.toFixed(2),
        s.paymentMethod,
        s.voided ? "Yes" : "No",
      ]),
    ];
    const csvContent = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `retailflow-sales-${toDateInputValue(new Date())}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleVoidConfirmed() {
    if (voidTargetId === null) return;
    try {
      await voidSale(voidTargetId);
      showToast("Sale voided and stock restored", "success");
      await loadSales();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to void sale", "error");
    } finally {
      setVoidTargetId(null);
    }
  }

  const filteredForSearch = sales.filter((s) =>
    s.invoiceNumber.toLowerCase().includes(invoiceQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-xl font-bold">Sales report</h2>
        <div className="flex gap-2 items-center flex-wrap">
          <button
            onClick={() => setPreset("today")}
            className={`px-3 py-1.5 rounded text-sm font-medium ${
              preset === "today" ? "bg-blue-600 text-white" : "bg-white border text-gray-700"
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setPreset("month")}
            className={`px-3 py-1.5 rounded text-sm font-medium ${
              preset === "month" ? "bg-blue-600 text-white" : "bg-white border text-gray-700"
            }`}
          >
            This month
          </button>
          <button
            onClick={() => setPreset("custom")}
            className={`px-3 py-1.5 rounded text-sm font-medium ${
              preset === "custom" ? "bg-blue-600 text-white" : "bg-white border text-gray-700"
            }`}
          >
            Custom
          </button>
          <button
            onClick={handleExportCsv}
            disabled={sales.length === 0}
            className="px-3 py-1.5 rounded text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-300"
          >
            Export CSV
          </button>
        </div>
      </div>

      {preset === "custom" && (
        <div className="flex gap-3 items-center mb-4 bg-white border rounded-lg p-3">
          <label className="text-sm font-medium">From</label>
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          />
          <label className="text-sm font-medium">To</label>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          />
        </div>
      )}

      <div className="border rounded-lg bg-white p-4 mb-6">
        <label className="block text-sm font-medium mb-1">Search invoice number</label>
        <input
          value={invoiceQuery}
          onChange={(e) => setInvoiceQuery(e.target.value)}
          placeholder="INV-E5..."
          className="w-full border rounded px-3 py-2 text-sm font-mono"
        />
        {invoiceQuery && (
          <div className="border rounded-lg mt-2 divide-y max-h-56 overflow-y-auto">
            {filteredForSearch.length === 0 ? (
              <p className="p-3 text-sm text-gray-500">No matching invoices</p>
            ) : (
              filteredForSearch.map((sale) => (
                <div key={sale.id} className="p-3 text-sm">
                  <p className="font-mono text-xs text-gray-500">{sale.invoiceNumber}</p>
                  <p className="font-medium mt-1">
                    {sale.items.map((item) => `${item.productName} × ${item.quantity}`).join(", ")}
                  </p>
                  <div className="flex justify-between text-gray-500 mt-1">
                    <span>
                      {new Date(sale.createdAt).toLocaleString()} · {sale.paymentMethod}
                      {sale.voided && <span className="text-red-500 font-medium"> · VOIDED</span>}
                    </span>
                    <span className="font-semibold text-gray-800">₹{sale.total.toFixed(2)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-600 bg-red-50 rounded p-3 mb-4">{error}</p>}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="border rounded-lg bg-white p-4">
              <p className="text-sm text-gray-500">Total revenue</p>
              <p className="text-2xl font-bold">₹{totalRevenue.toFixed(2)}</p>
            </div>
            <div className="border rounded-lg bg-white p-4">
              <p className="text-sm text-gray-500">Sales</p>
              <p className="text-2xl font-bold">{saleCount}</p>
            </div>
          </div>

          <div className="border rounded-lg bg-white p-4 mb-6">
            <h3 className="font-semibold mb-3">Top products</h3>
            {topProducts.length === 0 ? (
              <p className="text-sm text-gray-500">No sales in this period.</p>
            ) : (
              <div className="space-y-2">
                {topProducts.map(([name, qty]) => (
                  <div key={name} className="flex justify-between text-sm">
                    <span>{name}</span>
                    <span className="text-gray-500">{qty} sold</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border rounded-lg bg-white divide-y">
            <h3 className="font-semibold p-4 pb-2">Individual sales</h3>
            {sales.length === 0 ? (
              <p className="text-sm text-gray-500 p-4 pt-0">No sales in this period.</p>
            ) : (
              sales.map((sale) => (
                <div
                  key={sale.id}
                  className={`p-4 flex justify-between items-start gap-4 ${
                    sale.voided ? "opacity-50" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {sale.items.map((item) => `${item.productName} × ${item.quantity}`).join(", ")}
                      {sale.voided && (
                        <span className="text-red-500 font-semibold text-xs ml-2">VOIDED</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 font-mono mt-1 truncate">
                      {sale.invoiceNumber}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(sale.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      · {sale.paymentMethod}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-semibold whitespace-nowrap">
                      ₹{sale.total.toFixed(2)}
                    </span>
                    {!sale.voided && (
                      <button
                        onClick={() => setVoidTargetId(sale.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Void
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      <ConfirmDialog
        open={voidTargetId !== null}
        title="Void this sale"
        message="This restores the stock for every item in this sale and marks it as voided. This can't be undone."
        confirmLabel="Void sale"
        onConfirm={handleVoidConfirmed}
        onCancel={() => setVoidTargetId(null)}
      />
    </div>
  );
}