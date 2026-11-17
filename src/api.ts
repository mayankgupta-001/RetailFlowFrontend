import type {
  CreateProductRequest,
  CreateDiscountRequest,
  Discount,
  InventoryLogResponse,
  LoginRequest,
  LoginResponse,
  PageResponse,
  PaymentMethod,
  Product,
  RegisterRequest,
  SaleResponse,
  StockAdjustmentRequest,
  UpdateProductRequest,
} from "./types";
import { clearSession, getToken } from "./auth/tokenStorage";

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearSession();
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }

  return res;
}

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
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

// ---- Auth ----

export async function login(request: LoginRequest): Promise<LoginResponse> {
  const res = await apiFetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  return handleResponse<LoginResponse>(res);
}

export async function register(request: RegisterRequest): Promise<void> {
  const res = await apiFetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  return handleResponse<void>(res);
}

// ---- Products ----

export async function getProducts(): Promise<Product[]> {
  const res = await apiFetch("/api/products");
  return handleResponse<Product[]>(res);
}

export async function createProduct(request: CreateProductRequest): Promise<Product> {
  const res = await apiFetch("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  return handleResponse<Product>(res);
}

export async function updateProduct(
  id: number,
  request: UpdateProductRequest
): Promise<Product> {
  const res = await apiFetch(`/api/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  return handleResponse<Product>(res);
}

export async function deleteProduct(id: number): Promise<void> {
  const res = await apiFetch(`/api/products/${id}`, { method: "DELETE" });
  return handleResponse<void>(res);
}

export async function getProductByBarcode(barcode: string): Promise<Product> {
  const res = await apiFetch(`/api/products/barcode/${encodeURIComponent(barcode)}`);
  return handleResponse<Product>(res);
}

// ---- Inventory ----

export async function adjustStock(request: StockAdjustmentRequest): Promise<void> {
  const res = await apiFetch("/api/inventory/adjust", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  return handleResponse<void>(res);
}

export async function getInventoryLogs(productId: number): Promise<InventoryLogResponse[]> {
  const res = await apiFetch(`/api/inventory/logs/product/${productId}`);
  return handleResponse<InventoryLogResponse[]>(res);
}

// ---- Discounts ----

// Reads are open to any logged-in user (the checkout screen lists
// applicable discounts); mutations are ADMIN-only and will 403 for
// cashiers.
export async function listDiscounts(): Promise<Discount[]> {
  const res = await apiFetch("/api/discounts");
  return handleResponse<Discount[]>(res);
}

export async function createDiscount(
  request: CreateDiscountRequest
): Promise<Discount> {
  const res = await apiFetch("/api/discounts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  return handleResponse<Discount>(res);
}

export async function updateDiscount(
  id: number,
  request: CreateDiscountRequest
): Promise<Discount> {
  const res = await apiFetch(`/api/discounts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  return handleResponse<Discount>(res);
}

export async function setDiscountStatus(
  id: number,
  active: boolean
): Promise<Discount> {
  const res = await apiFetch(`/api/discounts/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ active }),
  });
  return handleResponse<Discount>(res);
}

export async function deleteDiscount(id: number): Promise<void> {
  const res = await apiFetch(`/api/discounts/${id}`, { method: "DELETE" });
  if (!res.ok) {
    throw new Error("Failed to delete discount");
  }
}

// ---- Sales ----
export async function checkout(
  items: { productId: number; quantity: number }[],
  discount: number,
  paymentMethod: PaymentMethod,
  discountId?: number
): Promise<SaleResponse> {
  // A scheduled discount is referenced by ID and the backend resolves
  // its value; a manual discount is a plain amount. The two are
  // mutually exclusive (the backend rejects combining them).
  const body: Record<string, unknown> = {
    items,
    discount,
    paymentMethod,
  };

  if (discountId !== undefined) {
    body.discountId = discountId;
  }

  const res = await apiFetch("/api/sales/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return handleResponse<SaleResponse>(res);
}

export async function getSaleByInvoiceNumber(invoiceNumber: string): Promise<SaleResponse> {
  const res = await apiFetch(`/api/sales/invoice/${encodeURIComponent(invoiceNumber)}`);
  return handleResponse<SaleResponse>(res);
}

// Open to ADMIN and CASHIER. Returns the 20 newest sales whose invoice number
// contains the query (an empty query returns the 20 most recent sales).
export async function lookupSales(query: string): Promise<SaleResponse[]> {
  const params = new URLSearchParams({ query });
  const res = await apiFetch(`/api/sales/lookup?${params.toString()}`);
  return handleResponse<SaleResponse[]>(res);
}

function formatLocalDateTime(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

// ADMIN only. The backend paginates this endpoint (each request is
// bounded), so we fetch every page and return one flat array. This
// keeps the report totals (revenue, sale count, top products, CSV
// export) complete without any changes to SalesReportPage.
export async function getSalesBetween(from: Date, to: Date): Promise<SaleResponse[]> {
  const allSales: SaleResponse[] = [];

  let page = 0;
  let totalPages = 1;

  while (page < totalPages) {
    const params = new URLSearchParams({
      from: formatLocalDateTime(from),
      to: formatLocalDateTime(to),
      page: String(page),
      size: "100",
    });

    const res = await apiFetch(`/api/sales?${params.toString()}`);
    const data = await handleResponse<PageResponse<SaleResponse>>(res);

    allSales.push(...data.content);
    totalPages = data.totalPages;
    page += 1;
  }

  return allSales;
}

// ADMIN only.
export async function voidSale(id: number): Promise<SaleResponse> {
  const res = await apiFetch(`/api/sales/${id}/void`, { method: "POST" });
  return handleResponse<SaleResponse>(res);
}