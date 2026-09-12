import { useEffect, useState } from "react";
import type { CartItem, CreateProductRequest, Product } from "./types";
import { createProduct, deleteProduct, getProducts } from "./api";
import ProductList from "./components/ProductList";
import AddProductForm from "./components/AddProductForm";
import CheckoutPage from "./pages/CheckoutPage";

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeTab, setActiveTab] = useState<"products" | "checkout">(
    "products"
  );

  async function loadProducts() {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function handleAddProduct(request: CreateProductRequest) {
    await createProduct(request);
    await loadProducts();
  }

  async function handleDeleteProduct(id: number) {
    try {
      await deleteProduct(id);
      await loadProducts();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete product");
    }
  }

  function handleAddToCart(product: Product) {
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">RetailFlow</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("products")}
              className={`px-4 py-2 rounded text-sm font-medium ${
                activeTab === "products"
                  ? "bg-blue-600 text-white"
                  : "bg-white border text-gray-700"
              }`}
            >
              Products
            </button>
            <button
              onClick={() => setActiveTab("checkout")}
              className={`px-4 py-2 rounded text-sm font-medium relative ${
                activeTab === "checkout"
                  ? "bg-blue-600 text-white"
                  : "bg-white border text-gray-700"
              }`}
            >
              Checkout
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {activeTab === "products" ? (
          <>
            <AddProductForm onSubmit={handleAddProduct} />

            {loading && <p className="text-gray-500">Loading products...</p>}
            {error && (
              <p className="text-red-600 bg-red-50 rounded p-3 mb-4">
                {error}
              </p>
            )}

            {!loading && !error && (
              <ProductList
                products={products}
                onDelete={handleDeleteProduct}
                onAddToCart={handleAddToCart}
              />
            )}
          </>
        ) : (
          <CheckoutPage cart={cart} setCart={setCart} />
        )}
      </div>
    </div>
  );
}

export default App;