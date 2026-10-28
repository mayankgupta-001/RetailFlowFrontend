import {
  ShoppingCart,
  Pencil,
  Printer,
  Trash2,
  PackageOpen,
} from "lucide-react";

import type { Product } from "../types";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL as string;

interface ProductListProps {
  products: Product[];
  onDelete: (id: number) => void;
  onAddToCart: (product: Product) => void;
  onEdit: (product: Product) => void;
}

export default function ProductList({
  products,
  onDelete,
  onAddToCart,
  onEdit,
}: ProductListProps) {
  function handlePrint(productId: number) {
    const url = `${BASE_URL}/api/products/${productId}/barcode-image`;

    const printWindow =
      window.open(url, "_blank");

    printWindow?.addEventListener(
      "load",
      () => printWindow.print()
    );
  }

  if (products.length === 0) {
    return (
      <div className="rf-card flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <PackageOpen size={26} />
        </div>

        <h3 className="font-semibold text-slate-900">
          No products found
        </h3>

        <p className="mt-1 max-w-sm text-sm text-slate-500">
          Try changing your search or
          category filter.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => {
        const lowStock =
          product.stock <= product.minStock;

        const outOfStock =
          product.stock === 0;

        return (
          <div
            key={product.id}
            className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            {/* Product info */}
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {product.category ||
                      "Uncategorized"}
                  </p>

                  <h3 className="truncate text-lg font-bold text-slate-900">
                    {product.name}
                  </h3>
                </div>

                {outOfStock ? (
                  <span className="rf-badge-danger shrink-0">
                    Out of stock
                  </span>
                ) : lowStock ? (
                  <span className="rf-badge-warning shrink-0">
                    Low stock
                  </span>
                ) : (
                  <span className="rf-badge-success shrink-0">
                    In stock
                  </span>
                )}
              </div>

              {/* Price / stock */}
              <div className="mt-6 flex items-end justify-between">
                <div>
                  <p className="text-xs text-slate-400">
                    Selling price
                  </p>

                  <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                    ₹
                    {product.sellingPrice.toFixed(
                      2
                    )}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-400">
                    Available
                  </p>

                  <p
                    className={`mt-1 text-lg font-bold ${
                      lowStock
                        ? "text-amber-600"
                        : "text-slate-700"
                    }`}
                  >
                    {product.stock}
                  </p>
                </div>
              </div>
            </div>

            {/* Barcode */}
            <div className="border-y border-slate-100 bg-slate-50 p-4">
              <img
                src={`${BASE_URL}/api/products/${product.id}/barcode-image`}
                alt={`Barcode ${product.barcode}`}
                className="h-20 w-full object-contain"
              />

              <p className="mt-2 text-center font-mono text-xs text-slate-400">
                {product.barcode}
              </p>
            </div>

            {/* Actions */}
            <div className="mt-auto flex flex-wrap gap-2 p-4">
              <button
                type="button"
                onClick={() =>
                  onAddToCart(product)
                }
                disabled={outOfStock}
                className="rf-button-primary min-w-0 flex-1"
              >
                <ShoppingCart size={16} />

                <span className="hidden sm:inline">
                  Add to cart
                </span>

                <span className="sm:hidden">
                  Add
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onEdit(product)
                }
                className="rf-button-secondary px-3"
                title="Edit"
              >
                <Pencil size={16} />
              </button>

              <button
                type="button"
                onClick={() =>
                  handlePrint(product.id)
                }
                className="rf-button-secondary px-3"
                title="Print barcode"
              >
                <Printer size={16} />
              </button>

              <button
                type="button"
                onClick={() =>
                  onDelete(product.id)
                }
                className="rf-button-danger px-3"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}