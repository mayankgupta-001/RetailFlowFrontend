export interface Product {
  id: number;
  name: string;
  barcode: string;
  sellingPrice: number;
  costPrice: number | null;
  stock: number;
  minStock: number;
  category: string | null;
  // GST rate baked into the tax-inclusive sellingPrice, plus the HSN
  // code printed on tax invoices. Rates default to 0 (no GST).
  taxRate: number;
  hsnCode: string | null;
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
  taxRate?: number;
  hsnCode?: string;
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
  // Snapshot taken at checkout. Null on sales recorded before GST
  // support existed, which is why the receipt skips the tax block.
  taxRate: number | null;
  hsnCode: string | null;
  taxableAmount: number | null;
  taxAmount: number | null;
  cgstAmount: number | null;
  sgstAmount: number | null;
}

export interface SaleResponse {
  id: number;
  invoiceNumber: string;
  subtotal: number;
  discount: number;
  total: number;
  taxableAmount: number | null;
  taxAmount: number | null;
  cgstAmount: number | null;
  sgstAmount: number | null;
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
  // Omitting taxRate keeps the stored rate on the backend, so an older
  // client can't silently zero a product's GST.
  taxRate?: number;
  hsnCode?: string;
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

// Store identity printed on receipts. gstRegistered is derived by the
// backend from GSTIN presence, so the UI never re-implements that rule.
export interface StoreSettings {
  id: number;
  shopName: string;
  address: string | null;
  phone: string | null;
  stateCode: string | null;
  gstin: string | null;
  gstRegistered: boolean;
  updatedAt: string;
}

export interface UpdateStoreSettingsRequest {
  shopName: string;
  address?: string;
  phone?: string;
  stateCode?: string;
  gstin?: string;
}