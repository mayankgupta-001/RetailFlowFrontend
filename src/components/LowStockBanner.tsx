import type { Product } from "../types";

interface LowStockBannerProps {
  products: Product[];
}

export default function LowStockBanner({ products }: LowStockBannerProps) {
  const lowStock = products.filter((p) => p.stock <= p.minStock);

  if (lowStock.length === 0) return null;

  return (
    <div className="border border-amber-300 bg-amber-50 rounded-lg p-4 mb-4">
      <p className="font-medium text-amber-800 mb-2">
        {lowStock.length} product{lowStock.length > 1 ? "s" : ""} running low
        on stock
      </p>
      <div className="flex flex-wrap gap-2">
        {lowStock.map((p) => (
          <span
            key={p.id}
            className="text-sm bg-white border border-amber-200 text-amber-800 rounded px-2 py-1"
          >
            {p.name} — {p.stock} left
          </span>
        ))}
      </div>
    </div>
  );
}