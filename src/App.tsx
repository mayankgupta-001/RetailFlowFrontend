import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import type {
  CartItem,
  CreateProductRequest,
  Product,
  UpdateProductRequest,
} from "./types";

import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from "./api";

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
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";

import {
  ToastProvider,
  useToast,
} from "./contexts/ToastContext";

import {
  AuthProvider,
  useAuth,
} from "./contexts/AuthContext";

function AppContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);

  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [deletingProductId, setDeletingProductId] =
    useState<number | null>(null);

  const { showToast } = useToast();

  const {
    isAuthenticated,
  } = useAuth();

  async function loadProducts() {
    try {
      setLoading(true);

      const data = await getProducts();

      setProducts(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load products"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadProducts();
    }
  }, [isAuthenticated]);

  async function handleAddProduct(
    request: CreateProductRequest
  ) {
    await createProduct(request);

    await loadProducts();

    showToast(
      "Product added successfully",
      "success"
    );
  }

  async function handleUpdateProduct(
    id: number,
    request: UpdateProductRequest
  ) {
    await updateProduct(id, request);

    await loadProducts();

    showToast(
      "Product updated successfully",
      "success"
    );
  }

  async function confirmDelete() {
    if (deletingProductId === null) return;

    try {
      await deleteProduct(deletingProductId);

      await loadProducts();

      showToast(
        "Product deleted successfully",
        "success"
      );
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : "Failed to delete product",
        "error"
      );
    } finally {
      setDeletingProductId(null);
    }
  }

  function handleAddToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find(
        (item) => item.product.id === product.id
      );

      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
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

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <Sidebar cartCount={cart.length} />

      {/* Main Content */}
      <div className="lg:pl-64">
        <Topbar />

        <main className="rf-page">
          <Routes>
            <Route
              path="/"
              element={
                <Navigate
                  to="/products"
                  replace
                />
              }
            />

            <Route
              path="/login"
              element={
                <Navigate
                  to="/products"
                  replace
                />
              }
            />

            {/* Products */}
            <Route
              path="/products"
              element={
                <ProtectedRoute>
                  <ProductsPage
                    products={products}
                    loading={loading}
                    error={error}
                    onAddProduct={handleAddProduct}
                    onDeleteProduct={(id) =>
                      setDeletingProductId(id)
                    }
                    onEditProduct={setEditingProduct}
                    onAddToCart={handleAddToCart}
                  />
                </ProtectedRoute>
              }
            />

            {/* Checkout */}
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <CheckoutPage
                    cart={cart}
                    setCart={setCart}
                    products={products}
                  />
                </ProtectedRoute>
              }
            />

            {/* Invoices */}
            <Route
              path="/invoices"
              element={
                <ProtectedRoute>
                  <InvoicesPage />
                </ProtectedRoute>
              }
            />

            {/* Inventory */}
            <Route
              path="/inventory"
              element={
                <ProtectedRoute adminOnly>
                  <InventoryPage
                    products={products}
                    onStockChanged={loadProducts}
                  />
                </ProtectedRoute>
              }
            />

            {/* Reports */}
            <Route
              path="/reports"
              element={
                <ProtectedRoute adminOnly>
                  <SalesReportPage />
                </ProtectedRoute>
              }
            />

            {/* Users */}
            <Route
              path="/users"
              element={
                <ProtectedRoute adminOnly>
                  <AdminUsersPage />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route
              path="*"
              element={
                <Navigate
                  to="/products"
                  replace
                />
              }
            />
          </Routes>
        </main>
      </div>

      {/* Edit Product */}
      <EditProductModal
        product={editingProduct}
        onClose={() =>
          setEditingProduct(null)
        }
        onSave={handleUpdateProduct}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={
          deletingProductId !== null
        }
        title="Delete product"
        message="This can't be undone. Are you sure you want to delete this product?"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() =>
          setDeletingProductId(null)
        }
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