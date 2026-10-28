import {
  useEffect,
  useState,
} from "react";

import {
  Search,
  Printer,
  Receipt,
} from "lucide-react";

import type {
  SaleResponse,
} from "../types";

import {
  lookupSales,
} from "../api";

import {
  openReceiptWindow,
} from "../utils/receipt";

import {
  useToast,
} from "../contexts/ToastContext";

export default function InvoicesPage() {
  const [query, setQuery] =
    useState("");

  const [sales, setSales] =
    useState<SaleResponse[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const { showToast } =
    useToast();

  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(
      async () => {
        setLoading(true);
        setError(null);

        try {
          const data =
            await lookupSales(
              query.trim()
            );

          if (!cancelled) {
            setSales(data);
          }
        } catch (err) {
          if (!cancelled) {
            setError(
              err instanceof Error
                ? err.message
                : "Failed to load invoices"
            );
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      },
      300
    );

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  function handlePrint(
    sale: SaleResponse
  ) {
    if (
      !openReceiptWindow(
        sale,
        { duplicate: true }
      )
    ) {
      showToast(
        "Pop-up blocked. Allow pop-ups to print receipts.",
        "error"
      );
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
          <Receipt size={16} />
          Sales
        </div>

        <h1 className="rf-page-title">
          Invoices
        </h1>

        <p className="rf-page-subtitle">
          Search previous transactions and
          print receipts.
        </p>
      </div>

      {/* Search */}
      <div className="rf-card p-5">
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Find an invoice
        </label>

        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={query}
            onChange={(e) =>
              setQuery(e.target.value)
            }
            placeholder="Type part of the invoice number..."
            className="rf-input pl-10 font-mono"
            autoFocus
          />
        </div>

        <p className="mt-2 text-xs text-slate-400">
          Shows the 20 most recent matching
          invoices.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="rf-card divide-y divide-slate-100">
          {[1, 2, 3, 4].map(
            (item) => (
              <div
                key={item}
                className="animate-pulse p-5"
              >
                <div className="h-4 w-48 rounded bg-slate-200" />

                <div className="mt-2 h-3 w-32 rounded bg-slate-200" />

                <div className="mt-2 h-3 w-40 rounded bg-slate-200" />
              </div>
            )
          )}
        </div>
      )}

      {!loading && !error && (
        <div className="rf-card overflow-hidden">
          {sales.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Receipt size={25} />
              </div>

              <h3 className="mt-4 font-semibold text-slate-800">
                No invoices found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Try searching for another
                invoice number.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-5 py-4 font-semibold text-slate-600">
                      Invoice
                    </th>

                    <th className="px-5 py-4 font-semibold text-slate-600">
                      Items
                    </th>

                    <th className="px-5 py-4 font-semibold text-slate-600">
                      Payment
                    </th>

                    <th className="px-5 py-4 font-semibold text-slate-600">
                      Date
                    </th>

                    <th className="px-5 py-4 text-right font-semibold text-slate-600">
                      Total
                    </th>

                    <th className="px-5 py-4 text-right font-semibold text-slate-600">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {sales.map(
                    (sale) => (
                      <tr
                        key={sale.id}
                        className={`transition hover:bg-slate-50 ${
                          sale.voided
                            ? "opacity-50"
                            : ""
                        }`}
                      >
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-mono text-xs font-semibold text-slate-700">
                              {
                                sale.invoiceNumber
                              }
                            </p>

                            {sale.voided && (
                              <span className="mt-1 inline-flex rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600">
                                VOIDED
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="max-w-xs px-5 py-4">
                          <p className="truncate text-sm text-slate-700">
                            {sale.items
                              .map(
                                (
                                  item
                                ) =>
                                  `${item.productName} × ${item.quantity}`
                              )
                              .join(
                                ", "
                              )}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                            {
                              sale.paymentMethod
                            }
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                          {new Date(
                            sale.createdAt
                          ).toLocaleString()}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-right font-bold text-slate-900">
                          ₹
                          {sale.total.toFixed(
                            2
                          )}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              handlePrint(
                                sale
                              )
                            }
                            className="rf-button-secondary px-3 py-2"
                          >
                            <Printer
                              size={15}
                            />

                            <span className="hidden sm:inline">
                              Print
                            </span>
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}