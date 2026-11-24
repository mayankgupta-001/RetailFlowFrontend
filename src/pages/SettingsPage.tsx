import { useEffect, useState } from "react";

import { BadgeCheck, Store, TriangleAlert } from "lucide-react";

import type {
  StoreSettings,
  UpdateStoreSettingsRequest,
} from "../types";

import {
  getStoreSettings,
  updateStoreSettings,
} from "../api";

import { useToast } from "../contexts/ToastContext";

interface FormState {
  shopName: string;
  address: string;
  phone: string;
  stateCode: string;
  gstin: string;
}

const emptyForm: FormState = {
  shopName: "",
  address: "",
  phone: "",
  stateCode: "",
  gstin: "",
};

// Same shape the backend validates. Kept in sync deliberately: the
// server is the authority, this only saves a round-trip on obvious
// typos.
const GSTIN_PATTERN =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

function toForm(settings: StoreSettings): FormState {
  return {
    shopName: settings.shopName,
    address: settings.address ?? "",
    phone: settings.phone ?? "",
    stateCode: settings.stateCode ?? "",
    gstin: settings.gstin ?? "",
  };
}

export default function SettingsPage() {
  const [settings, setSettings] =
    useState<StoreSettings | null>(null);

  const [form, setForm] =
    useState<FormState>(emptyForm);

  const [loading, setLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState<string | null>(null);

  const [saving, setSaving] =
    useState(false);

  const [formError, setFormError] =
    useState<string | null>(null);

  const { showToast } = useToast();

  async function loadSettings() {
    setLoading(true);
    setLoadError(null);

    try {
      const data = await getStoreSettings();
      setSettings(data);
      setForm(toForm(data));
    } catch (err) {
      setLoadError(
        err instanceof Error
          ? err.message
          : "Failed to load store settings"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    // Awaiting before touching state keeps the effect's synchronous body
    // free of setState calls (react-hooks/set-state-in-effect).
    async function load() {
      try {
        const data = await getStoreSettings();

        if (cancelled) return;

        setSettings(data);
        setForm(toForm(data));
      } catch (err) {
        if (cancelled) return;

        setLoadError(
          err instanceof Error
            ? err.message
            : "Failed to load store settings"
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  function updateForm(values: Partial<FormState>) {
    setForm((current) => ({
      ...current,
      ...values,
    }));
  }

  function validate(): string | null {
    if (!form.shopName.trim()) {
      return "Shop name is required";
    }

    if (
      form.stateCode &&
      !/^\d{2}$/.test(form.stateCode)
    ) {
      return "State code must be two digits (e.g. 19 for West Bengal)";
    }

    if (form.gstin && !GSTIN_PATTERN.test(form.gstin)) {
      return "GSTIN must be a valid 15-character number, e.g. 19AABCU9603R1ZM";
    }

    return null;
  }

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    const validationError = validate();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSaving(true);
    setFormError(null);

    const request: UpdateStoreSettingsRequest = {
      shopName: form.shopName.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
      stateCode: form.stateCode.trim(),
      gstin: form.gstin.trim(),
    };

    try {
      const updated =
        await updateStoreSettings(request);

      setSettings(updated);
      setForm(toForm(updated));

      showToast(
        "Store settings saved",
        "success"
      );
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Failed to save store settings"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
          <Store size={16} />
          Administration
        </div>

        <h1 className="rf-page-title">
          Store settings
        </h1>

        <p className="rf-page-subtitle">
          These details appear on every receipt.
          Add a GSTIN to issue tax invoices with a
          GST breakup.
        </p>
      </div>

      {loadError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p>{loadError}</p>

          <button
            type="button"
            onClick={loadSettings}
            className="mt-2 font-semibold underline"
          >
            Try again
          </button>
        </div>
      )}

      {loading && (
        <div className="rf-card animate-pulse space-y-4 p-6">
          <div className="h-4 w-40 rounded bg-slate-200" />
          <div className="h-10 w-full rounded bg-slate-100" />
          <div className="h-4 w-32 rounded bg-slate-200" />
          <div className="h-10 w-full rounded bg-slate-100" />
        </div>
      )}

      {!loading && !loadError && (
        <>
          {/* Invoice mode status */}
          <div
            className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${
              settings?.gstRegistered
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            {settings?.gstRegistered ? (
              <BadgeCheck
                size={20}
                className="mt-0.5 shrink-0"
              />
            ) : (
              <TriangleAlert
                size={20}
                className="mt-0.5 shrink-0"
              />
            )}

            <div>
              <p className="font-semibold">
                {settings?.gstRegistered
                  ? "Tax invoices enabled"
                  : "Plain invoices"}
              </p>

              <p className="mt-1">
                {settings?.gstRegistered
                  ? `Receipts print as Tax Invoice under GSTIN ${settings.gstin}.`
                  : "Add your GSTIN once you are registered — until then receipts print without GST details."}
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rf-card space-y-5 p-6"
          >
            {formError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {formError}
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Shop name
              </label>

              <input
                required
                maxLength={255}
                value={form.shopName}
                onChange={(e) =>
                  updateForm({
                    shopName: e.target.value,
                  })
                }
                placeholder="e.g. Sharma General Store"
                className="rf-input"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Address
              </label>

              <textarea
                rows={3}
                maxLength={500}
                value={form.address}
                onChange={(e) =>
                  updateForm({
                    address: e.target.value,
                  })
                }
                placeholder="Street, area, city, PIN"
                className="rf-input resize-none"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Phone
                </label>

                <input
                  maxLength={20}
                  value={form.phone}
                  onChange={(e) =>
                    updateForm({
                      phone: e.target.value,
                    })
                  }
                  placeholder="e.g. 9876543210"
                  className="rf-input"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  State code
                </label>

                <input
                  maxLength={2}
                  inputMode="numeric"
                  value={form.stateCode}
                  onChange={(e) =>
                    updateForm({
                      stateCode: e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 2),
                    })
                  }
                  placeholder="e.g. 19"
                  className="rf-input font-mono"
                />

                <p className="mt-1 text-xs text-slate-400">
                  Two-digit GST state code.
                </p>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                GSTIN
              </label>

              <input
                maxLength={15}
                value={form.gstin}
                onChange={(e) =>
                  updateForm({
                    gstin: e.target.value
                      .toUpperCase()
                      .replace(/[^0-9A-Z]/g, "")
                      .slice(0, 15),
                  })
                }
                placeholder="Leave blank until registered"
                className="rf-input font-mono tracking-wider"
              />

              <p className="mt-1 text-xs text-slate-400">
                Adding a GSTIN switches receipts to Tax
                Invoice and prints the CGST/SGST
                breakup.
              </p>
            </div>

            <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
              Selling prices are tax-inclusive. The GST
              written on an issued invoice never changes,
              even if you edit a product's rate later.
            </p>

            <div className="flex justify-end border-t border-slate-200 pt-5">
              <button
                type="submit"
                disabled={saving}
                className="rf-button-primary"
              >
                {saving
                  ? "Saving..."
                  : "Save settings"}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
