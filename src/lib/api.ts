import axios from "axios";
import {
  AdminProduct,
  CartItem,
  Order,
  PaginatedResponse,
  Product,
  Category,
  ProfitOrderItem,
  ProfitSummaryBucket,
  ReviewSummary,
  UserProfile,
  AdminOrder,
  Address,
  PaymentMethod,
  NotificationPreference,
  MarketingSettings,
  AdminReturn,
  AdminCustomer,
} from "./types";

const DEFAULT_API_BASE = "https://shoe-commerce-platform.onrender.com";

const resolveApiBase = (rawBase?: string) => {
  if (!rawBase) return DEFAULT_API_BASE;
  const cleaned = rawBase.replace(/\/$/, "");
  try {
    const parsed = new URL(cleaned);
    const isLocal =
      parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    // Prevent accidental localhost usage in deployed browsers.
    if (
      typeof window !== "undefined" &&
      isLocal &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1"
    ) {
      return DEFAULT_API_BASE;
    }
    return cleaned;
  } catch {
    return DEFAULT_API_BASE;
  }
};

const baseURL = resolveApiBase(process.env.NEXT_PUBLIC_API_BASE);

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
});

const buildUploadHeaders = () => {
  const headers = new Headers();
  if (typeof window === "undefined") return headers;

  const token = localStorage.getItem("thrifty_token");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const adminBypass = process.env.NEXT_PUBLIC_ADMIN_BYPASS;
  if (adminBypass) {
    headers.set("x-admin-bypass", adminBypass);
  }

  return headers;
};

const uploadMultipartImage = async (
  path: string,
  file: File,
): Promise<{ url: string; publicId: string }> => {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`${baseURL}${path}`, {
    method: "POST",
    body: formData,
    credentials: "include",
    headers: buildUploadHeaders(),
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : { message: await response.text() };

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload
        ? String(payload.message)
        : `Upload failed with status ${response.status}.`;
    throw new Error(message);
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    !("url" in payload) ||
    !("publicId" in payload) ||
    typeof payload.url !== "string" ||
    typeof payload.publicId !== "string"
  ) {
    throw new Error("Upload succeeded but server response was invalid.");
  }

  return {
    url: payload.url,
    publicId: payload.publicId,
  };
};

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("thrifty_token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    const adminBypass = process.env.NEXT_PUBLIC_ADMIN_BYPASS;
    if (adminBypass) {
      config.headers = config.headers || {};
      config.headers["x-admin-bypass"] = adminBypass;
    }
  }
  return config;
});

export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return "Network issue while contacting server. Please try again.";
    }
    const rawMessage = (error.response?.data as { message?: string })?.message;
    const normalizedMessage = rawMessage?.trim().toLowerCase();
    if (
      normalizedMessage === "invalid credentials." ||
      normalizedMessage === "invalid credentials" ||
      normalizedMessage === "invalid admin credentials." ||
      normalizedMessage === "invalid admin credentials"
    ) {
      return "Incorrect email or password.";
    }

    const fallback = "We hit a snag while talking to the server.";
    return rawMessage || error.message || fallback;
  }
  if (error instanceof Error) {
    const normalizedMessage = error.message.trim().toLowerCase();
    if (
      normalizedMessage.includes("failed to fetch") ||
      normalizedMessage.includes("network") ||
      normalizedMessage.includes("load failed")
    ) {
      return "Network issue while contacting server. Please try again.";
    }
    return error.message || "Unexpected error. Please try again.";
  }
  return "Unexpected error. Please try again.";
};

export const fetchProducts = async (
  params?: Record<string, string | number | boolean | undefined>,
): Promise<PaginatedResponse<Product>> => {
  const { data } = await apiClient.get("/products", { params });
  return data;
};

export const fetchFeaturedProducts = async (): Promise<Product[]> => {
  const { data } = await apiClient.get("/products", {
    params: { featured: true, limit: 8 },
  });
  return data?.data ?? data;
};

export const fetchProductBySlug = async (slug: string): Promise<Product> => {
  const { data } = await apiClient.get(`/products/${slug}`);
  return data;
};

export const fetchCategories = async (): Promise<Category[]> => {
  const { data } = await apiClient.get("/categories");
  return data?.data ?? data;
};

export const authenticate = async (payload: {
  email: string;
  password: string;
}): Promise<{ token: string; user: UserProfile }> => {
  const { data } = await apiClient.post("/auth/login", payload);
  return data;
};

export const registerAccount = async (payload: {
  name: string;
  email: string;
  password: string;
}): Promise<{ token: string; user: UserProfile }> => {
  const { data } = await apiClient.post("/auth/register", payload);
  return data;
};

export const requestRegisterOtp = async (email: string): Promise<{ ok: boolean; expiresIn: number }> => {
  const { data } = await apiClient.post("/auth/register/request-otp", { email });
  return data;
};

export const verifyRegisterOtp = async (payload: {
  name: string;
  email: string;
  password: string;
  code: string;
}): Promise<{ token: string; user: UserProfile }> => {
  const { data } = await apiClient.post("/auth/register/verify-otp", payload);
  return data;
};

export const buildGoogleAuthUrl = (redirect: string) => {
  const base = resolveApiBase(process.env.NEXT_PUBLIC_API_BASE);
  const params = new URLSearchParams({ redirect });
  return `${base}/auth/google/start?${params.toString()}`;
};

export const requestPasswordReset = async (email: string): Promise<void> => {
  await apiClient.post("/auth/forgot-password", { email });
};

export const fetchProfile = async (): Promise<UserProfile> => {
  const { data } = await apiClient.get("/users/me");
  return data;
};

export const updateProfile = async (
  payload: Partial<UserProfile>,
): Promise<UserProfile> => {
  const { data } = await apiClient.patch("/users/me", payload);
  return data;
};

export const fetchAddresses = async (): Promise<Address[]> => {
  const { data } = await apiClient.get("/users/addresses");
  return data?.data ?? data;
};

export const createAddress = async (payload: Omit<Address, "id">) => {
  const { data } = await apiClient.post("/users/addresses", payload);
  return data;
};

export const updateAddress = async (id: string, payload: Partial<Address>) => {
  const { data } = await apiClient.patch(`/users/addresses/${id}`, payload);
  return data;
};

export const deleteAddress = async (id: string) => {
  await apiClient.delete(`/users/addresses/${id}`);
};

export const fetchPaymentMethods = async (): Promise<PaymentMethod[]> => {
  const { data } = await apiClient.get("/users/payment-methods");
  return data?.data ?? data;
};

export const createPaymentMethod = async (payload: Omit<PaymentMethod, "id">) => {
  const { data } = await apiClient.post("/users/payment-methods", payload);
  return data;
};

export const updatePaymentMethod = async (id: string, payload: Partial<PaymentMethod>) => {
  const { data } = await apiClient.patch(`/users/payment-methods/${id}`, payload);
  return data;
};

export const deletePaymentMethod = async (id: string) => {
  await apiClient.delete(`/users/payment-methods/${id}`);
};

export const fetchNotifications = async (): Promise<NotificationPreference> => {
  const { data } = await apiClient.get("/users/notifications");
  return data;
};

export const updateNotifications = async (payload: Partial<NotificationPreference>) => {
  const { data } = await apiClient.patch("/users/notifications", payload);
  return data;
};

export const changePassword = async (payload: {
  currentPassword: string;
  newPassword: string;
}) => {
  const { data } = await apiClient.post("/auth/change-password", payload);
  return data;
};

export const fetchPreferences = async (): Promise<{
  sizeUS?: string;
  sizeEU?: string;
  brands?: string[];
}> => {
  const { data } = await apiClient.get("/users/preferences");
  return data;
};

export const updatePreferences = async (payload: {
  sizeUS?: string;
  sizeEU?: string;
  brands?: string[];
}) => {
  const { data } = await apiClient.patch("/users/preferences", payload);
  return data;
};

export const fetchTickets = async (): Promise<
  { id: string; subject: string; message: string; status: string; createdAt: string }[]
> => {
  const { data } = await apiClient.get("/users/tickets");
  return data?.data ?? data;
};

export const createTicket = async (payload: { subject: string; message: string }) => {
  const { data } = await apiClient.post("/users/tickets", payload);
  return data;
};

export const fetchReturns = async (): Promise<
  { id: string; orderId: string; reason: string; status: string; createdAt: string }[]
> => {
  const { data } = await apiClient.get("/users/returns");
  return data?.data ?? data;
};

export const createReturn = async (payload: { orderId: string; reason: string }) => {
  const { data } = await apiClient.post("/users/returns", payload);
  return data;
};

export const fetchActivity = async (): Promise<
  { id: string; type: string; message: string; createdAt: string }[]
> => {
  const { data } = await apiClient.get("/users/activity");
  return data?.data ?? data;
};

export const requestTwoFactor = async () => {
  const { data } = await apiClient.post("/users/2fa/request");
  return data;
};

export const verifyTwoFactor = async (code: string) => {
  const { data } = await apiClient.post("/users/2fa/verify", { code });
  return data;
};

export const disableTwoFactor = async () => {
  const { data } = await apiClient.post("/users/2fa/disable");
  return data;
};

export const fetchPaymentSettings = async (): Promise<{
  paymentRequired: boolean;
  allowCod: boolean;
  allowDummy: boolean;
}> => {
  const { data } = await apiClient.get("/settings/payment");
  return data;
};

export const updatePaymentSettings = async (payload: {
  paymentRequired: boolean;
  allowCod: boolean;
  allowDummy: boolean;
}) => {
  const { data } = await apiClient.patch("/settings/payment", payload);
  return data;
};

export const fetchMarketingSettings = async (): Promise<MarketingSettings> => {
  const { data } = await apiClient.get("/settings/marketing");
  return data;
};

export const updateMarketingSettings = async (payload: MarketingSettings) => {
  const { data } = await apiClient.patch("/settings/marketing", payload);
  return data;
};

export const fetchOrders = async (): Promise<Order[]> => {
  const { data } = await apiClient.get("/orders");
  return data?.data ?? data;
};

export const fetchOrderById = async (orderId: string): Promise<Order> => {
  const { data } = await apiClient.get(`/orders/${orderId}`);
  return data;
};

export const downloadInvoice = async (orderId: string): Promise<Blob> => {
  const { data } = await apiClient.get(`/orders/${orderId}/invoice`, {
    responseType: "blob",
  });
  return data;
};

export const fetchOrderStats = async (): Promise<{
  totalOrders: number;
  totalRevenue: number;
  pending: number;
  delivered: number;
}> => {
  const { data } = await apiClient.get("/orders/stats");
  return data;
};

export const createOrder = async (payload: {
  items: CartItem[];
  shipping: Record<string, string>;
  paymentMethod: string;
  couponCode?: string;
}): Promise<Order> => {
  const { data } = await apiClient.post("/orders", payload);
  return data;
};

export const adminCreateProduct = async (payload: Partial<Product>) => {
  const { data } = await apiClient.post("/admin/products", payload);
  return data;
};

export const adminUpdateStock = async (productId: string, stock: number) => {
  const { data } = await apiClient.patch(`/admin/products/${productId}/stock`, { stock });
  return data;
};

export const adminUpdateDiscount = async (productId: string, discount: number) => {
  const { data } = await apiClient.patch(`/admin/products/${productId}/discount`, {
    discount,
  });
  return data;
};

export const adminFetchProducts = async (): Promise<AdminProduct[]> => {
  const { data } = await apiClient.get("/admin/products");
  return data?.data ?? data;
};

export const adminCreateFullProduct = async (payload: {
  name: string;
  slug: string;
  description?: string;
  sellPrice: number;
  costPrice: number;
  stock: number;
  featured?: boolean;
  images?: { url: string; alt?: string }[];
  gender?: "men" | "women" | "unisex";
  condition?: "new" | "used" | "refurbished";
  variants?: {
    color: string;
    priceOverride?: number;
    images?: { url: string; alt?: string }[];
    sizes: { sizeUS?: string; sizeEU?: string; stock: number }[];
  }[];
}): Promise<AdminProduct> => {
  const { data } = await apiClient.post("/admin/products", payload);
  return data;
};

export const adminUpdateProduct = async (
  productId: string,
  payload: Partial<{
    name: string;
    slug: string;
    description?: string;
    sellPrice: number;
    costPrice: number;
    stock: number;
    active: boolean;
    featured: boolean;
    images: { url: string; alt?: string }[];
    gender: "men" | "women" | "unisex";
    condition: "new" | "used" | "refurbished";
    variants: {
      color: string;
      priceOverride?: number;
      images?: { url: string; alt?: string }[];
      sizes: { sizeUS?: string; sizeEU?: string; stock: number }[];
    }[];
  }>,
): Promise<AdminProduct> => {
  const { data } = await apiClient.patch(`/admin/products/${productId}`, payload);
  return data;
};

export const adminDeleteProduct = async (productId: string) => {
  await apiClient.delete(`/admin/products/${productId}`);
};

export const adminFetchProfitOrders = async (params?: {
  from?: string;
  to?: string;
}): Promise<ProfitOrderItem[]> => {
  const { data } = await apiClient.get("/admin/profit/orders", { params });
  return data?.data ?? data;
};

export const adminFetchProfitSummary = async (params?: {
  from?: string;
  to?: string;
  period?: "daily" | "weekly" | "monthly";
}): Promise<{ period: string; from: string; to: string; data: ProfitSummaryBucket[] }> => {
  const { data } = await apiClient.get("/admin/profit/summary", { params });
  return data;
};

export const adminFetchOrders = async (): Promise<AdminOrder[]> => {
  const { data } = await apiClient.get("/admin/orders");
  return data?.data ?? data;
};

export const adminFetchCustomers = async (): Promise<AdminCustomer[]> => {
  const { data } = await apiClient.get("/admin/customers");
  return data?.data ?? data;
};

export const adminUpdateCustomerStatus = async (id: string, isBlocked: boolean) => {
  const { data } = await apiClient.patch(`/admin/customers/${id}`, { isBlocked });
  return data;
};

export const adminUpdateOrderStatus = async (
  orderId: string,
  status: AdminOrder["status"],
) => {
  const { data } = await apiClient.patch(`/admin/orders/${orderId}`, { status });
  return data;
};

export const adminUpdateOrderTracking = async (orderId: string, payload: {
  courierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
}) => {
  const { data } = await apiClient.patch(`/admin/orders/${orderId}/tracking`, payload);
  return data;
};

export const validateCoupon = async (code: string, subtotal: number) => {
  const { data } = await apiClient.get("/coupons/validate", {
    params: { code, subtotal },
  });
  return data as { code: string; type: string; value: number; discount: number };
};

export const adminFetchLowStock = async () => {
  const { data } = await apiClient.get("/admin/inventory/low");
  return data as {
    variantSizes: {
      id: string;
      stock: number;
      sizeUS?: string;
      sizeEU?: string;
      color: string;
      productId: string;
      productName: string;
    }[];
    products: { id: string; stock: number; name: string }[];
  };
};

export const adminFetchReturns = async (): Promise<AdminReturn[]> => {
  const { data } = await apiClient.get("/admin/returns");
  return data?.data ?? data;
};

export const adminUpdateReturn = async (id: string, status: string) => {
  const { data } = await apiClient.patch(`/admin/returns/${id}`, { status });
  return data;
};

export const fetchReviews = async (productId: string): Promise<ReviewSummary> => {
  const { data } = await apiClient.get("/reviews", { params: { productId } });
  return data;
};

export const submitReview = async (payload: {
  productId: string;
  rating: number;
  comment?: string;
}) => {
  const { data } = await apiClient.post("/reviews", payload);
  return data;
};

export const fetchWishlist = async () => {
  const { data } = await apiClient.get("/wishlist");
  return data?.data ?? data;
};

export const addWishlist = async (productId: string) => {
  const { data } = await apiClient.post("/wishlist", { productId });
  return data;
};

export const removeWishlist = async (productId: string) => {
  await apiClient.delete(`/wishlist/${productId}`);
};

export const createWishlistShare = async (): Promise<{ token: string }> => {
  const { data } = await apiClient.post("/wishlist/share");
  return data;
};

export const fetchSharedWishlist = async (token: string) => {
  const { data } = await apiClient.get(`/wishlist/share/${token}`);
  return data?.data ?? data;
};

export const adminFetchCoupons = async () => {
  const { data } = await apiClient.get("/coupons");
  return data?.data ?? data;
};

export const adminCreateCoupon = async (payload: {
  code: string;
  type: "percent" | "flat";
  value: number;
  usageLimit?: number;
  expiresAt?: string;
  active?: boolean;
}) => {
  const { data } = await apiClient.post("/coupons", payload);
  return data;
};

export const adminUpdateCoupon = async (
  couponId: string,
  payload: Partial<{
    code: string;
    type: "percent" | "flat";
    value: number;
    usageLimit?: number;
    expiresAt?: string;
    active?: boolean;
  }>,
) => {
  const { data } = await apiClient.patch(`/coupons/${couponId}`, payload);
  return data;
};

export const adminDeleteCoupon = async (couponId: string) => {
  await apiClient.delete(`/coupons/${couponId}`);
};

export const adminUploadImage = async (file: File): Promise<{ url: string; publicId: string }> => {
  return uploadMultipartImage("/admin/uploads", file);
};

export const adminUploadAsset = async (file: File): Promise<{ url: string; publicId: string }> => {
  return adminUploadImage(file);
};

export const uploadAvatar = async (file: File): Promise<{ url: string; publicId: string }> => {
  return uploadMultipartImage("/uploads", file);
};
