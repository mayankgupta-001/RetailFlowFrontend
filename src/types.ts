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
}