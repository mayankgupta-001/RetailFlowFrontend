import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Camera,
  ScanBarcode,
  Search,
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  Printer,
  RotateCcw,
} from "lucide-react";

import type {
  CartItem,
  PaymentMethod,
  Product,
  SaleResponse,
} from "../types";

import {
  getProductByBarcode,
  checkout,
} from "../api";

import CameraScanner from "../components/CameraScanner";
import ProductSearchBar from "../components/ProductSearchBar";

import {
  openReceiptWindow,
} from "../utils/receipt";

import {
  useToast,
} from "../contexts/ToastContext";

interface CheckoutPageProps {
  cart: CartItem[];
  setCart: React.Dispatch<
    React.SetStateAction<CartItem[]>
  >;
  products: Product[];
}

export default function CheckoutPage({
  cart,
  setCart,
  products,
}: CheckoutPageProps) {
  const [barcodeInput, setBarcodeInput] =
    useState("");

  const [scanError, setScanError] =
    useState<string | null>(null);

  const [discount, setDiscount] =
    useState(0);

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("CASH");

  const [submitting, setSubmitting] =
    useState(false);

  const [checkoutError, setCheckoutError] =
    useState<string | null>(null);

  const [receipt, setReceipt] =
    useState<SaleResponse | null>(null);

  const inputRef =
    useRef<HTMLInputElement>(null);

  const [cameraEnabled, setCameraEnabled] =
    useState(false);

  const [searchQuery, setSearchQuery] =
    useState("");

  const { showToast } = useToast();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find(
        (item) =>
          item.product.id === product.id
      );

      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity:
                  item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...prev,
        {
          product,
          quantity: 1,
        },
      ];
    });

    showToast(
      `${product.name} added to cart`,
      "info"
    );
  }

  async function lookupAndAddByBarcode(
    barcode: string
  ) {
    const trimmed =
      barcode.trim();

    if (!trimmed) return;

    try {
      const product =
        await getProductByBarcode(
          trimmed
        );

      if (product.stock <= 0) {
        setScanError(
          `${product.name} is out of stock`
        );
      } else {
        addToCart(product);
        setScanError(null);
      }
    } catch (err) {
      setScanError(
        err instanceof Error
          ? err.message
          : "No product found for that barcode"
      );
    }
  }

  async function handleScan(
    e: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (e.key !== "Enter") {
      return;
    }

    e.preventDefault();

    await lookupAndAddByBarcode(
      barcodeInput
    );

    setBarcodeInput("");

    inputRef.current?.focus();
  }

  function handleCameraScan(
    code: string
  ) {
    lookupAndAddByBarcode(code);
  }

  function handlePrintReceipt() {
    if (!receipt) return;

    if (!openReceiptWindow(receipt)) {
      showToast(
        "Pop-up blocked. Allow pop-ups to print receipts.",
        "error"
      );
    }
  }

  function updateQuantity(
    productId: number,
    quantity: number
  ) {
    if (quantity <= 0) {
      setCart((prev) =>
        prev.filter(
          (item) =>
            item.product.id !==
            productId
        )
      );

      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity,
            }
          : item
      )
    );
  }

  function removeItem(
    productId: number
  ) {
    setCart((prev) =>
      prev.filter(
        (item) =>
          item.product.id !==
          productId
      )
    );
  }

  const subtotal = cart.reduce(
    (sum, item) =>
      sum +
      item.product.sellingPrice *
        item.quantity,
    0
  );

  const total = Math.max(
    subtotal - discount,
    0
  );

  async function handleCheckout() {
    if (cart.length === 0) {
      return;
    }

    setSubmitting(true);
    setCheckoutError(null);

    try {
      const result =
        await checkout(
          cart.map((item) => ({
            productId:
              item.product.id,
            quantity:
              item.quantity,
          })),
          discount,
          paymentMethod
        );

      setReceipt(result);
      setCart([]);
      setDiscount(0);
    } catch (err) {
      setCheckoutError(
        err instanceof Error
          ? err.message
          : "Checkout failed"
      );
    } finally {
      setSubmitting(false);
    }
  }

  /* ---------------- Receipt ---------------- */

  if (receipt) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <ShoppingCart size={26} />
          </div>

          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            Sale complete
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Invoice{" "}
            <span className="font-mono font-semibold text-slate-700">
              {receipt.invoiceNumber}
            </span>
          </p>
        </div>

        <div className="rf-card overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 p-5">
            <h2 className="font-bold text-slate-900">
              Receipt
            </h2>
          </div>

          <div className="divide-y divide-slate-100">
            {receipt.items.map(
              (item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 p-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {item.productName}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {item.quantity} × ₹
                      {(
                        item.subtotal /
                        item.quantity
                      ).toFixed(2)}
                    </p>
                  </div>

                  <p className="font-semibold text-slate-900">
                    ₹
                    {item.subtotal.toFixed(
                      2
                    )}
                  </p>
                </div>
              )
            )}
          </div>

          <div className="space-y-3 border-t border-slate-200 p-5">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">
                Subtotal
              </span>

              <span className="font-medium text-slate-800">
                ₹
                {receipt.subtotal.toFixed(
                  2
                )}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-slate-500">
                Discount
              </span>

              <span className="font-medium text-emerald-600">
                -₹
                {receipt.discount.toFixed(
                  2
                )}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 pt-3">
              <span className="font-semibold text-slate-700">
                Total
              </span>

              <span className="text-2xl font-bold text-slate-900">
                ₹
                {receipt.total.toFixed(
                  2
                )}
              </span>
            </div>

            <p className="text-sm text-slate-500">
              Paid via{" "}
              <span className="font-semibold text-slate-700">
                {receipt.paymentMethod}
              </span>
            </p>
          </div>

          <div className="flex gap-3 border-t border-slate-200 bg-slate-50 p-5">
            <button
              type="button"
              onClick={
                handlePrintReceipt
              }
              className="rf-button-secondary flex-1"
            >
              <Printer size={17} />
              Print receipt
            </button>

            <button
              type="button"
              onClick={() =>
                setReceipt(null)
              }
              className="rf-button-primary flex-1"
            >
              <RotateCcw size={17} />
              New sale
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- Checkout ---------------- */

  return (
    <div className="space-y-6">
      <div>
        <h1 className="rf-page-title">
          Checkout
        </h1>

        <p className="rf-page-subtitle">
          Scan products, review the order
          and complete payment.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        {/* Left */}
        <section className="space-y-6">
          {/* Barcode scanner */}
          <div className="rf-card p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-slate-900">
                  Scan product
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Scan a barcode or search
                  manually.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setCameraEnabled(
                    (value) => !value
                  )
                }
                className={
                  cameraEnabled
                    ? "rf-button-danger"
                    : "rf-button-secondary"
                }
              >
                <Camera size={17} />

                {cameraEnabled
                  ? "Disable camera"
                  : "Camera"}
              </button>
            </div>

            {cameraEnabled && (
              <div className="mb-5 overflow-hidden rounded-xl border border-slate-200">
                <CameraScanner
                  enabled={
                    cameraEnabled
                  }
                  onScan={
                    handleCameraScan
                  }
                />
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Barcode
              </label>

              <div className="relative">
                <ScanBarcode
                  size={19}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  ref={inputRef}
                  value={barcodeInput}
                  onChange={(e) =>
                    setBarcodeInput(
                      e.target.value
                    )
                  }
                  onKeyDown={
                    handleScan
                  }
                  placeholder="Scan or type barcode and press Enter"
                  className="rf-input pl-10"
                  autoFocus
                />
              </div>

              {scanError && (
                <p className="mt-2 rounded-lg bg-red-50 p-2 text-sm text-red-600">
                  {scanError}
                </p>
              )}
            </div>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />

              <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                or
              </span>

              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Search products
              </label>

              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <div className="[&_input]:pl-10">
                  <ProductSearchBar
                    value={searchQuery}
                    onChange={
                      setSearchQuery
                    }
                  />
                </div>
              </div>

              {searchQuery && (
                <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white">
                  {products
                    .filter(
                      (product) =>
                        product.name
                          .toLowerCase()
                          .includes(
                            searchQuery.toLowerCase()
                          ) ||
                        (
                          product.category ||
                          ""
                        )
                          .toLowerCase()
                          .includes(
                            searchQuery.toLowerCase()
                          ) ||
                        product.barcode
                          .toLowerCase()
                          .includes(
                            searchQuery.toLowerCase()
                          )
                    )
                    .slice(0, 8)
                    .map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => {
                          if (
                            product.stock >
                            0
                          ) {
                            addToCart(
                              product
                            );

                            setSearchQuery(
                              ""
                            );
                          }
                        }}
                        disabled={
                          product.stock ===
                          0
                        }
                        className="flex w-full items-center justify-between gap-4 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-slate-50 disabled:opacity-40"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {product.name}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {product.category ||
                              "Uncategorized"}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold text-slate-800">
                            ₹
                            {product.sellingPrice.toFixed(
                              2
                            )}
                          </p>

                          <p className="text-xs text-slate-400">
                            {product.stock}{" "}
                            available
                          </p>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Cart */}
          <div className="rf-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="font-bold text-slate-900">
                  Cart
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {cart.length}{" "}
                  product
                  {cart.length === 1
                    ? ""
                    : "s"}{" "}
                  in order
                </p>
              </div>

              <ShoppingCart
                size={20}
                className="text-indigo-500"
              />
            </div>

            {cart.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <ShoppingCart
                    size={25}
                  />
                </div>

                <h3 className="mt-4 font-semibold text-slate-800">
                  Your cart is empty
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Scan a product or search
                  for one to begin.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {cart.map((item) => (
                  <div
                    key={
                      item.product.id
                    }
                    className="p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-800">
                          {
                            item.product
                              .name
                          }
                        </h3>

                        <p className="mt-1 text-xs text-slate-400">
                          ₹
                          {item.product.sellingPrice.toFixed(
                            2
                          )}{" "}
                          each
                        </p>
                      </div>

                      <p className="font-bold text-slate-900">
                        ₹
                        {(
                          item.product
                            .sellingPrice *
                          item.quantity
                        ).toFixed(2)}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center rounded-xl border border-slate-200">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.product
                                .id,
                              item.quantity -
                                1
                            )
                          }
                          className="p-2 text-slate-500 hover:bg-slate-50"
                        >
                          <Minus
                            size={15}
                          />
                        </button>

                        <span className="min-w-10 text-center text-sm font-semibold text-slate-700">
                          {
                            item.quantity
                          }
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.product
                                .id,
                              item.quantity +
                                1
                            )
                          }
                          className="p-2 text-slate-500 hover:bg-slate-50"
                        >
                          <Plus
                            size={15}
                          />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removeItem(
                            item.product
                              .id
                          )
                        }
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600"
                      >
                        <Trash2
                          size={14}
                        />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Right */}
        <aside className="rf-card h-fit xl:sticky xl:top-24">
          <div className="border-b border-slate-200 p-5">
            <h2 className="font-bold text-slate-900">
              Order summary
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Review payment details.
            </p>
          </div>

          <div className="space-y-5 p-5">
            {/* Discount */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Discount
              </label>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                  ₹
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    discount || ""
                  }
                  onChange={(e) =>
                    setDiscount(
                      parseFloat(
                        e.target.value
                      ) || 0
                    )
                  }
                  className="rf-input pl-8"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Payment */}
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">
                Payment method
              </p>

              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    [
                      "CASH",
                      "Cash",
                    ],
                    ["UPI", "UPI"],
                    [
                      "CARD",
                      "Card",
                    ],
                  ] as const
                ).map(
                  ([
                    value,
                    label,
                  ]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setPaymentMethod(
                          value
                        )
                      }
                      className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                        paymentMethod ===
                        value
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {label}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-3 border-t border-slate-200 pt-5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">
                  Subtotal
                </span>

                <span className="font-medium text-slate-800">
                  ₹
                  {subtotal.toFixed(
                    2
                  )}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-500">
                  Discount
                </span>

                <span className="font-medium text-emerald-600">
                  -₹
                  {discount.toFixed(
                    2
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                <span className="text-sm font-semibold text-slate-600">
                  Total payable
                </span>

                <span className="text-3xl font-bold tracking-tight text-slate-900">
                  ₹
                  {total.toFixed(
                    2
                  )}
                </span>
              </div>
            </div>

            {checkoutError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {checkoutError}
              </div>
            )}

            <button
              type="button"
              onClick={
                handleCheckout
              }
              disabled={
                cart.length === 0 ||
                submitting
              }
              className="flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:bg-slate-300 disabled:shadow-none"
            >
              {submitting
                ? "Processing..."
                : "Complete sale"}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}