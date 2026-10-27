import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  NavLink,
} from "react-router-dom";
import type { CartItem, CreateProductRequest, Product, UpdateProductRequest } from "./types";
import { createProduct, deleteProduct, getProducts, updateProduct } from "./api";
import ProductsPage from "./pages/ProductsPage";
import CheckoutPage from "./pages/CheckoutPage";
import InvoicesPage from "./pages/InvoicesPage";
import InventoryPage from "./pages/InventoryPage";
import SalesReportPage from "./pages/SalesReportPage";
import LoginPage from "./pages/LoginPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import ProtectedRoute from "./components/ProtectedRoute";
import EditProductModal from "./components/EditProductModal";
import ConfirmDialog from "./components/ConfirmDialog";
import { ToastProvider, useToast } from "./contexts/ToastContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

function AppContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<number | null>(
    null
  );

  const { showToast } = useToast();
  const { isAuthenticated, isAdmin, user, logout } = useAuth();

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
    if (isAuthenticated) {
      loadProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  async function handleAddProduct(request: CreateProductRequest) {
    await createProduct(request);
    await loadProducts();
    showToast("Product added", "success");
  }

  async function handleUpdateProduct(id: number, request: UpdateProductRequest) {
    await updateProduct(id, request);
    await loadProducts();
    showToast("Product updated", "success");
  }

  async function confirmDelete() {
    if (deletingProductId === null) return;
    try {
      await deleteProduct(deletingProductId);
      await loadProducts();
      showToast("Product deleted", "success");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to delete product",
        "error"
      );
    } finally {
      setDeletingProductId(null);
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
    showToast(`${product.name} added to cart`, "info");
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 rounded text-sm font-medium relative ${
      isActive ? "bg-blue-600 text-white" : "bg-white border text-gray-700"
    }`;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="text-2xl font-bold">RetailFlow</h1>
          <nav className="flex gap-2 flex-wrap items-center">
            <NavLink to="/products" className={navLinkClass}>
              Products
            </NavLink>
            <NavLink to="/checkout" className={navLinkClass}>
              Checkout
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </NavLink>
            <NavLink to="/invoices" className={navLinkClass}>
              Invoices
            </NavLink>
            {isAdmin && (
              <>
                <NavLink to="/inventory" className={navLinkClass}>
                  Inventory
                </NavLink>
                <NavLink to="/reports" className={navLinkClass}>
                  Sales report
                </NavLink>
                <NavLink to="/users" className={navLinkClass}>
                  Users
                </NavLink>
              </>
            )}
            <span className="text-sm text-gray-500 ml-2">
              {user?.username} ({user?.role})
            </span>
            <button
              onClick={logout}
              className="px-3 py-2 rounded text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Log out
            </button>
          </nav>
        </div>

        <Routes>
          <Route
            path="/"
            element={<Navigate to={isAdmin ? "/products" : "/checkout"} replace />}
          />
          <Route path="/login" element={<Navigate to="/" replace />} />

          {/* Open to both roles; Add/Edit/Delete are hidden for cashiers
              inside ProductsPage, and the backend enforces the same. */}
          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <ProductsPage
                  products={products}
                  loading={loading}
                  error={error}
                  onAddProduct={handleAddProduct}
                  onDeleteProduct={(id) => setDeletingProductId(id)}
                  onEditProduct={setEditingProduct}
                  onAddToCart={handleAddToCart}
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage cart={cart} setCart={setCart} products={products} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/invoices"
            element={
              <ProtectedRoute>
                <InvoicesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/inventory"
            element={
              <ProtectedRoute adminOnly>
                <InventoryPage products={products} onStockChanged={loadProducts} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedRoute adminOnly>
                <SalesReportPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/users"
            element={
              <ProtectedRoute adminOnly>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>

      <EditProductModal
        product={editingProduct}
        onClose={() => setEditingProduct(null)}
        onSave={handleUpdateProduct}
      />

      <ConfirmDialog
        open={deletingProductId !== null}
        title="Delete product"
        message="This can't be undone. Are you sure you want to delete this product?"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeletingProductId(null)}
      />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;