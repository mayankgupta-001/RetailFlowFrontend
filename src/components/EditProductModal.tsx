import { useState } from "react";
import type { Product, UpdateProductRequest } from "../types";

interface EditProductModalProps {
  product: Product | null;
  onClose: () => void;
  onSave: (id: number, request: UpdateProductRequest) => Promise<void>;
}

export default function EditProductModal({
  product,
  onClose,
  onSave,
}: EditProductModalProps) {
  const [form, setForm] = useState<UpdateProductRequest | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset local form state whenever a different product is opened.
  if (product && form === null) {
    setForm({
      name: product.name,
      sellingPrice: product.sellingPrice,
      costPrice: product.costPrice ?? undefined,
      minStock: product.minStock,
      category: product.category ?? "",
    });
  }
  if (!product && form !== null) {
    setForm(null);
  }

  if (!product || !form) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSave(product!.id, form!);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update product");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4 space-y-3"
      >
        <h3 className="font-semibold text-lg mb-2">Edit product</h3>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Name
          </label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Selling price
            </label>
            <input
              required
              type="number"
              step="0.01"
              min="0.01"
              value={form.sellingPrice}
              onChange={(e) =>
                setForm({ ...form, sellingPrice: parseFloat(e.target.value) })
              }
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Cost price
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.costPrice ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  costPrice: e.target.value
                    ? parseFloat(e.target.value)
                    : undefined,
                })
              }
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Minimum stock (low-stock threshold)
          </label>
          <input
            required
            type="number"
            min="0"
            value={form.minStock}
            onChange={(e) =>
              setForm({ ...form, minStock: parseInt(e.target.value) })
            }
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Category
          </label>
          <input
            value={form.category ?? ""}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>

        <p className="text-xs text-gray-400">
          Barcode and current stock can't be changed here — barcode is fixed
          at creation, and stock only changes through sales or inventory
          adjustments.
        </p>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded text-sm border text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300"
          >
            {submitting ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}