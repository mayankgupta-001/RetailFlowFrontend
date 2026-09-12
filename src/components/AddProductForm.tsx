import { useState } from "react";
import type { CreateProductRequest } from "../types";

interface AddProductFormProps {
  onSubmit: (request: CreateProductRequest) => Promise<void>;
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

export default function AddProductForm({ onSubmit }: AddProductFormProps) {
  const [form, setForm] = useState<CreateProductRequest>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(form);
      setForm(emptyForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add product");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border rounded-lg p-4 bg-white shadow-sm grid grid-cols-2 gap-3 mb-6"
    >
      <h2 className="col-span-2 font-semibold text-lg">Add product</h2>

      {error && (
        <p className="col-span-2 text-sm text-red-600 bg-red-50 rounded p-2">
          {error}
        </p>
      )}

      <input
        required
        placeholder="Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="border rounded px-3 py-2 text-sm"
      />
      <input
        placeholder="Barcode (leave blank to auto-generate)"
        value={form.barcode}
        onChange={(e) => setForm({ ...form, barcode: e.target.value })}
        className="border rounded px-3 py-2 text-sm"
    />
      <input
        required
        type="number"
        step="0.01"
        min="0.01"
        placeholder="Selling price"
        value={form.sellingPrice || ""}
        onChange={(e) =>
          setForm({ ...form, sellingPrice: parseFloat(e.target.value) })
        }
        className="border rounded px-3 py-2 text-sm"
      />
      <input
        type="number"
        step="0.01"
        min="0"
        placeholder="Cost price (optional)"
        value={form.costPrice ?? ""}
        onChange={(e) =>
          setForm({
            ...form,
            costPrice: e.target.value ? parseFloat(e.target.value) : undefined,
          })
        }
        className="border rounded px-3 py-2 text-sm"
      />
      <input
        required
        type="number"
        min="0"
        placeholder="Stock"
        value={form.stock || ""}
        onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) })}
        className="border rounded px-3 py-2 text-sm"
      />
      <input
        required
        type="number"
        min="0"
        placeholder="Min stock (low-stock threshold)"
        value={form.minStock || ""}
        onChange={(e) =>
          setForm({ ...form, minStock: parseInt(e.target.value) })
        }
        className="border rounded px-3 py-2 text-sm"
      />
      <input
        placeholder="Category (optional)"
        value={form.category}
        onChange={(e) => setForm({ ...form, category: e.target.value })}
        className="border rounded px-3 py-2 text-sm col-span-2"
      />

      <button
        type="submit"
        disabled={submitting}
        className="col-span-2 bg-green-600 text-white rounded px-3 py-2 text-sm hover:bg-green-700 disabled:bg-gray-300"
      >
        {submitting ? "Adding..." : "Add product"}
      </button>
    </form>
  );
}