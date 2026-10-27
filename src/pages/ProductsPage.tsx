import { useState } from "react";
import type { CreateProductRequest, Product } from "../types";
import AddProductForm from "../components/AddProductForm";
import ProductList from "../components/ProductList";
import ProductSearchBar from "../components/ProductSearchBar";
import LowStockBanner from "../components/LowStockBanner";
import { useAuth } from "../contexts/AuthContext";

interface ProductsPageProps {
  products: Product[];
  loading: boolean;
  error: string | null;
  onAddProduct: (request: CreateProductRequest) => Promise<void>;
  onDeleteProduct: (id: number) => void;
  onEditProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export default function ProductsPage({
  products,
  loading,
  error,
  onAddProduct,
  onDeleteProduct,
  onEditProduct,
  onAddToCart,
}: ProductsPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const { isAdmin } = useAuth();

  const categories = [
    "All",
    ...Array.from(
      new Set(products.map((p) => p.category?.trim() || "Uncategorized"))
    ).sort(),
  ];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.category ?? "").toLowerCase().includes(searchQuery.toLowerCase());

    if (searchQuery) return matchesSearch;

    const productCategory = p.category?.trim() || "Uncategorized";
    return selectedCategory === "All" || productCategory === selectedCategory;
  });

  return (
    <>
      {/* Only admins can create products; cashiers get a read-only catalogue. */}
      {isAdmin && <AddProductForm onSubmit={onAddProduct} />}

      {loading && <p className="text-gray-500">Loading products...</p>}
      {error && (
        <p className="text-red-600 bg-red-50 rounded p-3 mb-4">{error}</p>
      )}

      {!loading && !error && (
        <>
          <LowStockBanner products={products} />
          <ProductSearchBar value={searchQuery} onChange={setSearchQuery} />

          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white"
                    : "bg-white border text-gray-700 hover:bg-gray-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <ProductList
            products={filteredProducts}
            onDelete={onDeleteProduct}
            onAddToCart={onAddToCart}
            onEdit={onEditProduct}
          />
        </>
      )}
    </>
  );
}