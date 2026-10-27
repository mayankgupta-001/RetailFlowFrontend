import { useEffect, useRef, useState } from "react";
import type { CartItem, PaymentMethod, Product, SaleResponse } from "../types";
import { getProductByBarcode, checkout } from "../api";
import CameraScanner from "../components/CameraScanner";
import ProductSearchBar from "../components/ProductSearchBar";
import { openReceiptWindow } from "../utils/receipt";
import { useToast } from "../contexts/ToastContext";

interface CheckoutPageProps {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  products: Product[];
}

export default function CheckoutPage({ cart, setCart, products }: CheckoutPageProps) {
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scanError, setScanError] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<SaleResponse | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  async function lookupAndAddByBarcode(barcode: string) {
    const trimmed = barcode.trim();
    if (!trimmed) return;

    try {
      const product = await getProductByBarcode(trimmed);
      if (product.stock <= 0) {
        setScanError(`${product.name} is out of stock`);
      } else {
        addToCart(product);
        setScanError(null);
      }
    } catch (err) {
      setScanError(
        err instanceof Error ? err.message : "No product found for that barcode"
      );
    }
  }

  async function handleScan(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    await lookupAndAddByBarcode(barcodeInput);
    setBarcodeInput("");
    inputRef.current?.focus();
  }

  function handleCameraScan(code: string) {
    lookupAndAddByBarcode(code);
  }

  function handlePrintReceipt() {
    if (!receipt) return;
    if (!openReceiptWindow(receipt)) {
      showToast("Pop-up blocked. Allow pop-ups to print receipts.", "error");
    }
  }

  function updateQuantity(productId: number, quantity: number) {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.product.id !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  }

  function removeItem(productId: number) {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }

  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.sellingPrice * item.quantity,
    0
  );
  const total = Math.max(subtotal - discount, 0);

  async function handleCheckout() {
    if (cart.length === 0) return;
    setSubmitting(true);
    setCheckoutError(null);
    try {
      const result = await checkout(
        cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        discount,
        paymentMethod
      );
      setReceipt(result);
      setCart([]);
      setDiscount(0);
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (receipt) {
    return (
      <div className="max-w-md mx-auto bg-white border rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-2">Sale complete</h2>
        <p className="text-sm text-gray-500 mb-4">
          Invoice: {receipt.invoiceNumber}
        </p>
        <div className="divide-y">
          {receipt.items.map((item) => (
            <div key={item.id} className="flex justify-between py-2 text-sm">
              <span>
                {item.productName} × {item.quantity}
              </span>
              <span>₹{item.subtotal.toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₹{receipt.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Discount</span>
            <span>-₹{receipt.discount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
            <span>Total</span>
            <span>₹{receipt.total.toFixed(2)}</span>
          </div>
          <p className="text-gray-500 pt-1">Paid via {receipt.paymentMethod}</p>
        </div>
        <div className="mt-6 flex gap-2">
          <button
            onClick={handlePrintReceipt}
            className="flex-1 bg-gray-100 text-gray-700 rounded px-3 py-2 text-sm hover:bg-gray-200"
          >
            Print receipt
          </button>
          <button
            onClick={() => setReceipt(null)}
            className="flex-1 bg-blue-600 text-white rounded px-3 py-2 text-sm hover:bg-blue-700"
          >
            New sale
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Checkout</h2>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Camera scanning</span>
          <button
            onClick={() => setCameraEnabled((v) => !v)}
            className={`px-3 py-1.5 rounded text-sm font-medium ${
              cameraEnabled
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {cameraEnabled ? "Disable camera" : "Enable camera"}
          </button>
        </div>

        <CameraScanner enabled={cameraEnabled} onScan={handleCameraScan} />
        <label className="block text-sm font-medium mb-1">Scan barcode</label>
        <input
          ref={inputRef}
          value={barcodeInput}
          onChange={(e) => setBarcodeInput(e.target.value)}
          onKeyDown={handleScan}
          placeholder="Scan or type a barcode and press Enter"
          className="w-full border rounded px-3 py-3 text-lg"
          autoFocus
        />
        {scanError && <p className="text-sm text-red-600 mt-1">{scanError}</p>}

        <div className="mb-4 mt-4">
          <label className="block text-sm font-medium mb-1">
            Or search manually
          </label>
          <ProductSearchBar value={searchQuery} onChange={setSearchQuery} />
          {searchQuery && (
            <div className="border rounded-lg bg-white divide-y max-h-48 overflow-y-auto">
              {products
                .filter(
                  (p) =>
                    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (p.category ?? "")
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase())
                )
                .slice(0, 8)
                .map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      if (p.stock > 0) {
                        addToCart(p);
                        setSearchQuery("");
                      }
                    }}
                    disabled={p.stock === 0}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex justify-between disabled:opacity-40"
                  >
                    <span>{p.name}</span>
                    <span className="text-gray-500">
                      ₹{p.sellingPrice.toFixed(2)} · {p.stock} left
                    </span>
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      {cart.length === 0 ? (
        <p className="text-gray-500 text-center py-8 border rounded-lg bg-white">
          Cart is empty — scan a product to begin.
        </p>
      ) : (
        <div className="border rounded-lg bg-white divide-y mb-4">
          {cart.map((item) => (
            <div
              key={item.product.id}
              className="flex items-center justify-between p-3"
            >
              <div>
                <p className="font-medium">{item.product.name}</p>
                <p className="text-sm text-gray-500">
                  ₹{item.product.sellingPrice.toFixed(2)} each
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) =>
                    updateQuantity(
                      item.product.id,
                      parseInt(e.target.value) || 0
                    )
                  }
                  className="w-16 border rounded px-2 py-1 text-sm text-center"
                />
                <span className="w-20 text-right font-medium">
                  ₹{(item.product.sellingPrice * item.quantity).toFixed(2)}
                </span>
                <button
                  onClick={() => removeItem(item.product.id)}
                  className="text-red-600 text-sm hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="border rounded-lg bg-white p-4 space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium">Discount (₹)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={discount || ""}
            onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
            className="w-28 border rounded px-2 py-1 text-sm text-right"
          />
        </div>

        <div className="flex justify-between items-center">
          <label className="text-sm font-medium">Payment method</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="CASH">Cash</option>
            <option value="UPI">UPI</option>
            <option value="CARD">Card</option>
          </select>
        </div>

        <div className="flex justify-between text-sm pt-2 border-t">
          <span>Subtotal</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>₹{total.toFixed(2)}</span>
        </div>

        {checkoutError && (
          <p className="text-sm text-red-600 bg-red-50 rounded p-2">
            {checkoutError}
          </p>
        )}

        <button
          onClick={handleCheckout}
          disabled={cart.length === 0 || submitting}
          className="w-full bg-green-600 text-white rounded px-3 py-3 text-base font-medium hover:bg-green-700 disabled:bg-gray-300"
        >
          {submitting ? "Processing..." : "Complete sale"}
        </button>
      </div>
    </div>
  );
}