import type { CreateProductRequest, PaymentMethod, Product, SaleResponse } from "./types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = await response.json();
      if (body?.error) message = body.error;
    } catch {
      // response body wasn't JSON — keep the default message
    }
    throw new Error(message);
  }
  // 204 No Content has no body to parse
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function getProducts(): Promise<Product[]> {
  const res = await fetch(`${BASE_URL}/api/products`);
  return handleResponse<Product[]>(res);
}

export async function createProduct(
  request: CreateProductRequest
): Promise<Product> {
  const res = await fetch(`${BASE_URL}/api/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  return handleResponse<Product>(res);
}

export async function deleteProduct(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/products/${id}`, {
    method: "DELETE",
  });
  return handleResponse<void>(res);
}

export async function checkout(
  items: { productId: number; quantity: number }[],
  discount: number,
  paymentMethod: PaymentMethod
): Promise<SaleResponse> {
  const res = await fetch(`${BASE_URL}/api/sales/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items, discount, paymentMethod }),
  });
  return handleResponse<SaleResponse>(res);
}

export async function getProductByBarcode(barcode: string): Promise<Product> {
  const res = await fetch(
    `${BASE_URL}/api/products/barcode/${encodeURIComponent(barcode)}`
  );
  return handleResponse<Product>(res);
}