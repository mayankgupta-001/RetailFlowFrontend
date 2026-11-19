import { useEffect, useState } from "react";

import { Percent, Pencil, Plus, Trash2, Power } from "lucide-react";

import type {
  CreateDiscountRequest,
  Discount,
  DiscountType,
} from "../types";

import {
  createDiscount,
  deleteDiscount,
  listDiscounts,
  setDiscountStatus,
  updateDiscount,
} from "../api";

import ConfirmDialog from "../components/ConfirmDialog";

import { useToast } from "../contexts/ToastContext";

type EditingState = {
  id: number | null; // null = creating
  name: string;
  type: DiscountType;
  value: string;
  startAt: string; // datetime-local value
  endAt: string;
  active: boolean;
};

const emptyForm: EditingState = {
  id: null,
  name: "",
  type: "FIXED",
  value: "",
  startAt: "",
  endAt: "",
  active: true,
};

function toDatetimeLocalValue(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// The backend stores LocalDateTime and interprets it as local
// wall-clock time (IST). Sending ISO with a UTC offset (toISOString)
// would shift every discount window by the timezone offset, so we
// build the local-time string explicitly — same approach as
// formatLocalDateTime in api.ts for the sales report.
function toLocalDateTimeString(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
    date.getSeconds()
  )}`;
}

function discountState(discount: Discount): {
  label: string;
  className: string;
} {
  if (!discount.active) {
    return { label: "Disabled", className: "bg-slate-100 text-slate-500" };
  }

  const now = new Date();
  const start = new Date(discount.startAt);
  const end = new Date(discount.endAt);

  if (now < start) {
    return { label: "Scheduled", className: "bg-blue-50 text-blue-600" };
  }

  if (now > end) {
    return { label: "Expired", className: "bg-orange-50 text-orange-600" };
  }

  return { label: "Active", className: "bg-emerald-50 text-emerald-600" };
}

function formatValue(discount: Discount): string {
  return discount.type === "PERCENTAGE"
    ? `${discount.value}% off`
    : `₹${discount.value.toFixed(2)} off`;
}

function formatWindow(discount: Discount): string {
  return `${new Date(discount.startAt).toLocaleString()}  →  ${new Date(
    discount.endAt
  ).toLocaleString()}`;
}

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<EditingState | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const { showToast } = useToast();

  async function loadDiscounts() {
    setLoading(true);
    setError(null);

    try {
      setDiscounts(await listDiscounts());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load discounts"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDiscounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave() {
    if (!form) return;

    if (!form.name.trim()) {
      setFormError("Discount name is required");
      return;
    }

    const value = parseFloat(form.value);
    if (isNaN(value) || value < 0) {
      setFormError("Enter a valid discount value");
      return;
    }

    if (form.type === "PERCENTAGE" && value > 100) {
      setFormError("Percentage discount cannot exceed 100%");
      return;
    }

    if (!form.startAt || !form.endAt) {
      setFormError("Start and end dates are required");
      return;
    }

    const request: CreateDiscountRequest = {
      name: form.name.trim(),
      type: form.type,
      value,
      startAt: toLocalDateTimeString(new Date(form.startAt)),
      endAt: toLocalDateTimeString(new Date(form.endAt)),
      active: form.active,
    };

    setSaving(true);
    setFormError(null);

    try {
      if (form.id === null) {
        await createDiscount(request);
        showToast("Discount created", "success");
      } else {
        await updateDiscount(form.id, request);
        showToast("Discount updated", "success");
      }

      setForm(null);
      await loadDiscounts();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to save discount"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(discount: Discount) {
    try {
      await setDiscountStatus(discount.id, !discount.active);
      showToast(
        discount.active ? "Discount disabled" : "Discount enabled",
        "success"
      );
      await loadDiscounts();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to update discount",
        "error"
      );
    }
  }

  async function handleDeleteConfirmed() {
    if (deleteTargetId === null) return;

    try {
      await deleteDiscount(deleteTargetId);
      showToast("Discount deleted", "success");
      await loadDiscounts();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to delete discount",
        "error"
      );
    } finally {
      setDeleteTargetId(null);
    }
  }

  function startEdit(discount: Discount) {
    setFormError(null);
    setForm({
      id: discount.id,
      name: discount.name,
      type: discount.type,
      value: String(discount.value),
      startAt: toDatetimeLocalValue(discount.startAt),
      endAt: toDatetimeLocalValue(discount.endAt),
      active: discount.active,
    });
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold">Discounts</h2>

          <p className="text-sm text-slate-500">
            Scheduled promotions applied automatically during their
            window.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormError(null);
            setForm({ ...emptyForm });
          }}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          <span className="inline-flex items-center gap-2">
            <Plus size={16} />
            New discount
          </span>
        </button>
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-red-600">{error}</p>
      )}

      {!loading && !error && discounts.length === 0 && (
        <div className="rounded-lg border bg-white p-8 text-center">
          <p className="text-sm text-gray-500">
            No discounts yet. Create one to run a promotion.
          </p>
        </div>
      )}

      {!loading && !error && discounts.length > 0 && (
        <div className="divide-y rounded-lg border bg-white">
          {discounts.map((discount) => {
            const state = discountState(discount);

            return (
              <div
                key={discount.id}
                className="flex items-start justify-between gap-4 p-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-800">
                      {discount.name}
                    </p>

                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${state.className}`}
                    >
                      {state.label}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-slate-600">
                    {formatValue(discount)}
                    {discount.type === "PERCENTAGE" && (
                      <span className="text-slate-400">
                        {" "}
                        (capped at checkout)
                      </span>
                    )}
                  </p>

                  <p className="mt-1 text-xs text-slate-400 font-mono">
                    {formatWindow(discount)}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(discount)}
                    title={discount.active ? "Disable" : "Enable"}
                    className={`rounded-lg p-2 transition ${
                      discount.active
                        ? "text-emerald-600 hover:bg-emerald-50"
                        : "text-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    <Power size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => startEdit(discount)}
                    title="Edit"
                    className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-50"
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteTargetId(discount.id)}
                    title="Delete"
                    className="rounded-lg p-2 text-red-500 transition hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / edit form */}
      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-2">
              <Percent size={18} className="text-indigo-600" />

              <h3 className="text-lg font-bold">
                {form.id === null ? "New discount" : "Edit discount"}
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Name
                </label>

                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  placeholder="e.g. Diwali Sale"
                  className="rf-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Type
                  </label>

                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        type: e.target.value as DiscountType,
                      })
                    }
                    className="rf-input"
                  >
                    <option value="FIXED">Fixed amount (₹)</option>
                    <option value="PERCENTAGE">Percentage (%)</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    {form.type === "PERCENTAGE" ? "Percent" : "Amount (₹)"}
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    max={form.type === "PERCENTAGE" ? "100" : undefined}
                    value={form.value}
                    onChange={(e) =>
                      setForm({ ...form, value: e.target.value })
                    }
                    placeholder={form.type === "PERCENTAGE" ? "10" : "25.00"}
                    className="rf-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Starts at
                  </label>

                  <input
                    type="datetime-local"
                    value={form.startAt}
                    onChange={(e) =>
                      setForm({ ...form, startAt: e.target.value })
                    }
                    className="rf-input"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Ends at
                  </label>

                  <input
                    type="datetime-local"
                    value={form.endAt}
                    onChange={(e) =>
                      setForm({ ...form, endAt: e.target.value })
                    }
                    className="rf-input"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) =>
                    setForm({ ...form, active: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-slate-300"
                />
                Enabled (applicable only during its window)
              </label>

              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setForm(null)}
                  className="rounded-lg border px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:bg-slate-300"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteTargetId !== null}
        title="Delete discount"
        message="This can't be undone. Are you sure you want to delete this discount?"
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
