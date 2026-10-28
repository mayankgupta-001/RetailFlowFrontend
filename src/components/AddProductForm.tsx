import { useState } from "react";
import { Plus } from "lucide-react";
import type { CreateProductRequest } from "../types";

interface AddProductFormProps {
  onSubmit: (
    request: CreateProductRequest
  ) => Promise<void>;
}

const emptyForm: CreateProductRequest = {
  name: "",
  barcode: "",
  sellingPrice: 0,
  costPrice: undefined,
  stock: 0,
  minStock: 0,
  category: "",
};

export default function AddProductForm({
  onSubmit,
}: AddProductFormProps) {
  const [form, setForm] =
    useState<CreateProductRequest>(
      emptyForm
    );

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit(form);

      setForm(emptyForm);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to add product"
      );
    } finally {
      setSubmitting(false);
    }
  }

  function updateForm(
    values: Partial<CreateProductRequest>
  ) {
    setForm((current) => ({
      ...current,
      ...values,
    }));
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Product name
          </label>

          <input
            required
            placeholder="e.g. Wireless Mouse"
            value={form.name}
            onChange={(e) =>
              updateForm({
                name: e.target.value,
              })
            }
            className="rf-input"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Category
          </label>

          <input
            placeholder="e.g. Electronics"
            value={form.category}
            onChange={(e) =>
              updateForm({
                category: e.target.value,
              })
            }
            className="rf-input"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Barcode
          </label>

          <input
            placeholder="Leave blank to auto-generate"
            value={form.barcode}
            onChange={(e) =>
              updateForm({
                barcode: e.target.value,
              })
            }
            className="rf-input font-mono"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Selling price
          </label>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
              ₹
            </span>

            <input
              required
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={
                form.sellingPrice || ""
              }
              onChange={(e) =>
                updateForm({
                  sellingPrice:
                    parseFloat(
                      e.target.value
                    ) || 0,
                })
              }
              className="rf-input pl-8"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Cost price
          </label>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
              ₹
            </span>

            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Optional"
              value={
                form.costPrice ?? ""
              }
              onChange={(e) =>
                updateForm({
                  costPrice: e.target.value
                    ? parseFloat(
                        e.target.value
                      )
                    : undefined,
                })
              }
              className="rf-input pl-8"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Stock quantity
          </label>

          <input
            required
            type="number"
            min="0"
            placeholder="0"
            value={form.stock || ""}
            onChange={(e) =>
              updateForm({
                stock:
                  parseInt(
                    e.target.value
                  ) || 0,
              })
            }
            className="rf-input"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Low stock threshold
          </label>

          <input
            required
            type="number"
            min="0"
            placeholder="e.g. 10"
            value={
              form.minStock || ""
            }
            onChange={(e) =>
              updateForm({
                minStock:
                  parseInt(
                    e.target.value
                  ) || 0,
              })
            }
            className="rf-input"
          />
        </div>
      </div>

      <div className="flex justify-end border-t border-slate-200 pt-5">
        <button
          type="submit"
          disabled={submitting}
          className="rf-button-primary"
        >
          <Plus size={17} />

          {submitting
            ? "Adding..."
            : "Add product"}
        </button>
      </div>
    </form>
  );
}