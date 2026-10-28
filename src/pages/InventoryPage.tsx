import {
  useEffect,
  useState,
} from "react";

import {
  Boxes,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCcw,
} from "lucide-react";

import type {
  InventoryLogResponse,
  InventoryTransactionType,
  Product,
} from "../types";

import {
  adjustStock,
  getInventoryLogs,
} from "../api";

import {
  useToast,
} from "../contexts/ToastContext";

interface InventoryPageProps {
  products: Product[];
  onStockChanged: () => void;
}

export default function InventoryPage({
  products,
  onStockChanged,
}: InventoryPageProps) {
  const [
    selectedProductId,
    setSelectedProductId,
  ] = useState<number | null>(
    products[0]?.id ?? null
  );

  const [logs, setLogs] =
    useState<InventoryLogResponse[]>(
      []
    );

  const [
    loadingLogs,
    setLoadingLogs,
  ] = useState(false);

  const [type, setType] =
    useState<InventoryTransactionType>(
      "STOCK_IN"
    );

  const [quantity, setQuantity] =
    useState<number>(0);

  const [reason, setReason] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const { showToast } =
    useToast();

  const selectedProduct =
    products.find(
      (product) =>
        product.id ===
        selectedProductId
    );

  useEffect(() => {
    if (selectedProductId === null) {
      return;
    }

    loadLogs(selectedProductId);
  }, [selectedProductId]);

  useEffect(() => {
    if (
      selectedProductId === null &&
      products.length > 0
    ) {
      setSelectedProductId(
        products[0].id
      );
    }
  }, [products]);

  async function loadLogs(
    productId: number
  ) {
    setLoadingLogs(true);

    try {
      const data =
        await getInventoryLogs(
          productId
        );

      setLogs(data);
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : "Failed to load inventory logs",
        "error"
      );
    } finally {
      setLoadingLogs(false);
    }
  }

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (
      selectedProductId === null ||
      quantity <= 0
    ) {
      return;
    }

    setSubmitting(true);

    try {
      await adjustStock({
        productId:
          selectedProductId,
        type,
        quantity,
        reason:
          reason || undefined,
      });

      showToast(
        "Stock updated successfully",
        "success"
      );

      setQuantity(0);
      setReason("");

      await loadLogs(
        selectedProductId
      );

      onStockChanged();
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : "Failed to adjust stock",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  }

  const totalProducts =
    products.length;

  const lowStockCount =
    products.filter(
      (product) =>
        product.stock <=
        product.minStock
    ).length;

  const outOfStockCount =
    products.filter(
      (product) =>
        product.stock === 0
    ).length;

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
          <Boxes size={16} />
          Stock management
        </div>

        <h1 className="rf-page-title">
          Inventory
        </h1>

        <p className="rf-page-subtitle">
          Track stock levels and manage
          inventory adjustments.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rf-card p-5">
          <p className="text-sm text-slate-500">
            Total products
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {totalProducts}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Products in catalogue
          </p>
        </div>

        <div className="rf-card p-5">
          <p className="text-sm text-slate-500">
            Low stock
          </p>

          <p className="mt-2 text-3xl font-bold text-amber-600">
            {lowStockCount}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Need attention
          </p>
        </div>

        <div className="rf-card p-5">
          <p className="text-sm text-slate-500">
            Out of stock
          </p>

          <p className="mt-2 text-3xl font-bold text-red-600">
            {outOfStockCount}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Currently unavailable
          </p>
        </div>
      </div>

      {/* Product selector */}
      <div className="rf-card p-5">
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Select product
        </label>

        <select
          value={
            selectedProductId ?? ""
          }
          onChange={(e) =>
            setSelectedProductId(
              parseInt(
                e.target.value
              )
            )
          }
          className="rf-input"
        >
          {products.map(
            (product) => (
              <option
                key={product.id}
                value={product.id}
              >
                {product.name} —{" "}
                current stock:{" "}
                {product.stock}
              </option>
            )
          )}
        </select>
      </div>

      {selectedProduct && (
        <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
          {/* Adjustment */}
          <form
            onSubmit={
              handleSubmit
            }
            className="rf-card p-5"
          >
            <div className="mb-6">
              <h2 className="font-bold text-slate-900">
                Adjust stock
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Update the inventory for{" "}
                <span className="font-semibold text-slate-700">
                  {
                    selectedProduct.name
                  }
                </span>
                .
              </p>
            </div>

            <div className="mb-5 rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-400">
                Current stock
              </p>

              <p className="mt-1 text-3xl font-bold text-slate-900">
                {
                  selectedProduct.stock
                }
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Adjustment type
                </label>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setType(
                        "STOCK_IN"
                      )
                    }
                    className={`rounded-xl border px-2 py-3 text-xs font-semibold ${
                      type ===
                      "STOCK_IN"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Stock in
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setType(
                        "STOCK_OUT"
                      )
                    }
                    className={`rounded-xl border px-2 py-3 text-xs font-semibold ${
                      type ===
                      "STOCK_OUT"
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Stock out
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setType(
                        "ADJUSTMENT"
                      )
                    }
                    className={`rounded-xl border px-2 py-3 text-xs font-semibold ${
                      type ===
                      "ADJUSTMENT"
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Correction
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Quantity
                </label>

                <input
                  type="number"
                  min="1"
                  value={
                    quantity || ""
                  }
                  onChange={(e) =>
                    setQuantity(
                      parseInt(
                        e.target.value
                      ) || 0
                    )
                  }
                  className="rf-input"
                  placeholder="Enter quantity"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Reason
                </label>

                <input
                  value={reason}
                  onChange={(e) =>
                    setReason(
                      e.target.value
                    )
                  }
                  placeholder="e.g. New shipment"
                  className="rf-input"
                />
              </div>

              <button
                type="submit"
                disabled={
                  submitting ||
                  quantity <= 0
                }
                className="rf-button-primary w-full"
              >
                {submitting
                  ? "Saving..."
                  : "Apply adjustment"}
              </button>
            </div>
          </form>

          {/* History */}
          <div className="rf-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="font-bold text-slate-900">
                  Inventory history
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Recent changes for this
                  product.
                </p>
              </div>

              <RefreshCcw
                size={18}
                className="text-slate-400"
              />
            </div>

            {loadingLogs ? (
              <div className="space-y-3 p-5">
                {[1, 2, 3].map(
                  (item) => (
                    <div
                      key={item}
                      className="animate-pulse rounded-xl bg-slate-100 p-5"
                    >
                      <div className="h-4 w-32 rounded bg-slate-200" />

                      <div className="mt-2 h-3 w-48 rounded bg-slate-200" />
                    </div>
                  )
                )}
              </div>
            ) : logs.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <p className="text-sm text-slate-500">
                  No stock changes recorded
                  yet.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {logs.map(
                  (log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between gap-4 p-5"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                            log.type ===
                            "STOCK_IN"
                              ? "bg-emerald-50 text-emerald-600"
                              : log.type ===
                                "STOCK_OUT"
                              ? "bg-red-50 text-red-600"
                              : "bg-indigo-50 text-indigo-600"
                          }`}
                        >
                          {log.type ===
                          "STOCK_IN" ? (
                            <ArrowDownToLine
                              size={17}
                            />
                          ) : log.type ===
                            "STOCK_OUT" ? (
                            <ArrowUpFromLine
                              size={17}
                            />
                          ) : (
                            <RefreshCcw
                              size={17}
                            />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800">
                            {
                              log.type
                            }{" "}
                            ·{" "}
                            {
                              log.quantity
                            }
                          </p>

                          <p className="mt-1 truncate text-xs text-slate-500">
                            {new Date(
                              log.createdAt
                            ).toLocaleString()}
                            {log.reason &&
                              ` · ${log.reason}`}
                          </p>
                        </div>
                      </div>

                      <span className="shrink-0 text-sm font-semibold text-slate-600">
                        {
                          log.previousStock
                        }{" "}
                        →{" "}
                        {
                          log.newStock
                        }
                      </span>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}