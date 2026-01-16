export type ProductImage = {
  url: string;
  alt?: string;
};

export type VariantSize = {
  id: string;
  sizeUS?: string;
  sizeEU?: string;
  stock: number;
};

export type ProductVariant = {
  id: string;
  color: string;
  priceOverride?: number;
  images: ProductImage[];
  sizes: VariantSize[];
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  price: number;
  discount?: number;
  condition?: "new" | "used" | "refurbished";
  gender?: "men" | "women" | "unisex";
  category?: string;
  categoryId?: string;
  sizes?: string[];
  stock: number;
  featured?: boolean;
  images: ProductImage[];
  tags?: string[];
  metadata?: Record<string, string | number | string[]>;
  variants?: ProductVariant[];
};

export type Category = {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
};

export type CartItem = {
  id: string;
  productId: string;
  variantId?: string;
  slug: string;
  name: string;
  price: number;
  discount?: number;
  sizeUS?: string;
  sizeEU?: string;
  color?: string;
  quantity: number;
  image?: string;
  stock?: number;
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  coverUrl?: string;
  twoFactorEnabled?: boolean;
  twoFactorMethod?: string;
  role?: "admin" | "customer";
};

export type Address = {
  id: string;
  label?: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  isDefault: boolean;
};

export type PaymentMethod = {
  id: string;
  provider: string;
  label: string;
  maskedNumber: string;
  isDefault: boolean;
};

export type NotificationPreference = {
  emailEnabled: boolean;
  smsEnabled: boolean;
  phone?: string;
};

export type OrderLine = {
  id: string;
  productId: string;
  variantId?: string;
  color?: string;
  sizeUS?: string;
  sizeEU?: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
};

export type Order = {
  id: string;
  status: "processing" | "paid" | "shipped" | "delivered" | "cancelled";
  subTotal?: number;
  discountTotal?: number;
  total: number;
  placedAt: string;
  courierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  items: OrderLine[];
};

export type Review = {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  user: { name: string };
};

export type ReviewSummary = {
  average: number;
  count: number;
  data: Review[];
};

export type Coupon = {
  id: string;
  code: string;
  type: "percent" | "flat";
  value: number;
  active: boolean;
  usageLimit?: number;
  usedCount: number;
  expiresAt?: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  page: number;
  limit: number;
  total: number;
};

export type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  sellPrice: number;
  costPrice: number;
  discount?: number;
  stock: number;
  active?: boolean;
  featured: boolean;
  images: ProductImage[];
  condition?: "new" | "used" | "refurbished";
  gender?: "men" | "women" | "unisex";
  variants?: ProductVariant[];
};

export type AdminOrder = {
  id: string;
  status: "processing" | "paid" | "shipped" | "delivered" | "cancelled";
  total: number;
  placedAt: string;
  customer: { name: string; email: string };
};

export type AdminReturn = {
  id: string;
  orderId: string;
  reason: string;
  status: string;
  createdAt: string;
  customer: { name: string; email: string };
  order?: { id: string; total: number; placedAt: string };
};

export type AdminCustomer = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "customer";
  isBlocked: boolean;
  orders: number;
  createdAt: string;
};

export type ProfitOrderItem = {
  id: string;
  orderId: string;
  orderStatus: string;
  placedAt: string;
  productId: string;
  name: string;
  quantity: number;
  soldPrice: number;
  costPriceAtSale: number;
  profitPerUnit: number;
  profitTotal: number;
  createdAt: string;
};

export type ProfitSummaryBucket = {
  period: string;
  revenue: number;
  cost: number;
  profit: number;
  orderItems: number;
};

export type MarketingSlide = {
  id: string;
  title: string;
  subtitle?: string | null;
  badge?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  mediaType: "image" | "video";
  mediaUrl: string;
};

export type MarketingTile = {
  id: string;
  title: string;
  subtitle?: string | null;
  tag?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  imageUrl: string;
};

export type MarketingSettings = {
  promo: {
    enabled: boolean;
    text: string;
    linkLabel?: string | null;
    linkHref?: string | null;
  };
  hero: {
    autoplayMs: number;
    slides: MarketingSlide[];
  };
  tiles: MarketingTile[];
};
