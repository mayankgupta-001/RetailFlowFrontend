import type { Product } from "../types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

interface ProductListProps {
  products: Product[];
  onDelete: (id: number) => void;
  onAddToCart: (product: Product) => void;
}

export default function ProductList({
  products,
  onDelete,
  onAddToCart,
}: ProductListProps) {
  if (products.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8">
        No products yet — add one to get started.
      </p>
    );
  }

  function handlePrint(productId: number) {
    const url = `${BASE_URL}/api/products/${productId}/barcode-image`;
    const printWindow = window.open(url, "_blank");
    printWindow?.addEventListener("load", () => printWindow.print());
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product) => (
        <div
          key={product.id}
          className="border rounded-lg p-4 shadow-sm bg-white flex flex-col gap-2"
        >
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-lg">{product.name}</h3>
            {product.stock <= product.minStock && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                Low stock
              </span>
            )}
          </div>

          <p className="text-sm text-gray-500">{product.category ?? "Uncategorized"}</p>

          <img
            src={`${BASE_URL}/api/products/${product.id}/barcode-image`}
            alt={`Barcode ${product.barcode}`}
            className="w-full h-auto border rounded bg-white"
          />
          <p className="text-xs text-gray-400 text-center">{product.barcode}</p>

          <div className="flex justify-between items-center mt-2">
            <span className="font-bold text-lg">
              ₹{product.sellingPrice.toFixed(2)}
            </span>
            <span className="text-sm text-gray-500">
              Stock: {product.stock}
            </span>
          </div>

          <div className="flex gap-2 mt-2">
            <button
              onClick={() => onAddToCart(product)}
              disabled={product.stock === 0}
              className="flex-1 bg-blue-600 text-white rounded px-3 py-2 text-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Add to cart
            </button>
            <button
              onClick={() => handlePrint(product.id)}
              className="bg-gray-100 text-gray-700 rounded px-3 py-2 text-sm hover:bg-gray-200"
            >
              Print
            </button>
            <button
              onClick={() => onDelete(product.id)}
              className="bg-red-50 text-red-600 rounded px-3 py-2 text-sm hover:bg-red-100"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}