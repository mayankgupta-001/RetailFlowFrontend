import { useEffect, useState } from "react";
import type {
  InventoryLogResponse,
  InventoryTransactionType,
  Product,
} from "../types";
import { adjustStock, getInventoryLogs } from "../api";
import { useToast } from "../contexts/ToastContext";

interface InventoryPageProps {
  products: Product[];
  onStockChanged: () => void;
}

export default function InventoryPage({
  products,
  onStockChanged,
}: InventoryPageProps) {
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    products[0]?.id ?? null
  );
  const [logs, setLogs] = useState<InventoryLogResponse[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [type, setType] = useState<InventoryTransactionType>("STOCK_IN");
  const [quantity, setQuantity] = useState<number>(0);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  useEffect(() => {
    if (selectedProductId === null) return;
    loadLogs(selectedProductId);
  }, [selectedProductId]);

  async function loadLogs(productId: number) {
    setLoadingLogs(true);
    try {
      const data = await getInventoryLogs(productId);
      setLogs(data);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to load inventory logs",
        "error"
      );
    } finally {
      setLoadingLogs(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedProductId === null || quantity <= 0) return;

    setSubmitting(true);
    try {
      await adjustStock({
        productId: selectedProductId,
        type,
        quantity,
        reason: reason || undefined,
      });
      showToast("Stock updated", "success");
      setQuantity(0);
      setReason("");
      await loadLogs(selectedProductId);
      onStockChanged();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to adjust stock",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Inventory</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Product</label>
        <select
          value={selectedProductId ?? ""}
          onChange={(e) => setSelectedProductId(parseInt(e.target.value))}
          className="w-full border rounded px-3 py-2 text-sm"
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — current stock: {p.stock}
            </option>
          ))}
        </select>
      </div>

      {selectedProduct && (
        <form
          onSubmit={handleSubmit}
          className="border rounded-lg bg-white p-4 mb-6 space-y-3"
        >
          <h3 className="font-semibold">Adjust stock</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Type
              </label>
              <select
                value={type}
                onChange={(e) =>
                  setType(e.target.value as InventoryTransactionType)
                }
                className="w-full border rounded px-3 py-2 text-sm"
              >
                <option value="STOCK_IN">Stock in (restock)</option>
                <option value="STOCK_OUT">Stock out (remove)</option>
                <option value="ADJUSTMENT">Adjustment (correction)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={quantity || ""}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Reason (optional)
            </label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. New shipment, damaged goods, stock count correction"
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={submitting || quantity <= 0}
            className="bg-blue-600 text-white rounded px-4 py-2 text-sm hover:bg-blue-700 disabled:bg-gray-300"
          >
            {submitting ? "Saving..." : "Apply adjustment"}
          </button>
        </form>
      )}

      <div className="border rounded-lg bg-white">
        <h3 className="font-semibold p-4 pb-2">History</h3>
        {loadingLogs ? (
          <p className="text-sm text-gray-500 p-4 pt-0">Loading...</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-gray-500 p-4 pt-0">
            No stock changes recorded yet for this product.
          </p>
        ) : (
          <div className="divide-y">
            {logs.map((log) => (
              <div key={log.id} className="p-4 flex justify-between text-sm">
                <div>
                  <p className="font-medium">
                    {log.type === "STOCK_IN" && "+ "}
                    {log.type === "STOCK_OUT" && "− "}
                    {log.type} · {log.quantity}
                  </p>
                  <p className="text-gray-500">
                    {new Date(log.createdAt).toLocaleString()}
                    {log.reason && ` · ${log.reason}`}
                  </p>
                </div>
                <span className="text-gray-500">
                  {log.previousStock} → {log.newStock}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}