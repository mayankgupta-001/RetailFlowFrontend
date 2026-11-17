export interface Product {
  id: number;
  name: string;
  barcode: string;
  sellingPrice: number;
  costPrice: number | null;
  stock: number;
  minStock: number;
  category: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  name: string;
  barcode?: string;
  sellingPrice: number;
  costPrice?: number;
  stock: number;
  minStock: number;
  category?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type PaymentMethod = "CASH" | "UPI" | "CARD";

export interface SaleItemResponse {
  id: number;
  productId: number;
  productName: string;
  barcode: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface SaleResponse {
  id: number;
  invoiceNumber: string;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  createdAt: string;
  items: SaleItemResponse[];
  voided: boolean;
}

// Shape returned by paginated backend endpoints (e.g. GET /api/sales).
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export type DiscountType = "FIXED" | "PERCENTAGE";

// Scheduled discount managed by admins. A discount is applicable only
// when active is true and now is within [startAt, endAt].
export interface Discount {
  id: number;
  name: string;
  type: DiscountType;
  value: number;
  startAt: string;
  endAt: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDiscountRequest {
  name: string;
  type: DiscountType;
  value: number;
  startAt: string;
  endAt: string;
  active?: boolean;
}

export interface UpdateProductRequest {
  name: string;
  sellingPrice: number;
  costPrice?: number;
  minStock: number;
  category?: string;
}

export type InventoryTransactionType = "STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT";

export interface StockAdjustmentRequest {
  productId: number;
  type: InventoryTransactionType;
  quantity: number;
  reason?: string;
}

export interface InventoryLogResponse {
  id: number;
  productId: number;
  type: InventoryTransactionType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string | null;
  createdAt: string;
}

export type Role = "ADMIN" | "CASHIER";

export interface AuthUser {
  username: string;
  role: Role;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  role: Role;
}

export interface RegisterRequest {
  username: string;
  password: string;
  role: Role;
}