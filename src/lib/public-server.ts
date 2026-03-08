import { Category, MarketingSettings, PaginatedResponse, Product } from "./types";

const DEFAULT_API_BASE = "https://shoe-commerce-platform.onrender.com";

const resolveApiBase = () => {
  const rawBase = process.env.NEXT_PUBLIC_API_BASE || process.env.API_BASE || DEFAULT_API_BASE;
  return rawBase.replace(/\/$/, "");
};

const fetchPublicJson = async <T>(path: string, revalidate: number): Promise<T> => {
  const response = await fetch(`${resolveApiBase()}${path}`, {
    next: { revalidate },
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${path} with status ${response.status}`);
  }

  return response.json() as Promise<T>;
};

export const fetchServerFeaturedProducts = async (): Promise<Product[]> => {
  const response = await fetchPublicJson<PaginatedResponse<Product> | Product[]>(
    "/products?featured=true&limit=8",
    60,
  );
  return Array.isArray(response) ? response : response.data ?? [];
};

export const fetchServerCategories = async (): Promise<Category[]> => {
  const response = await fetchPublicJson<{ data?: Category[] } | Category[]>(
    "/categories",
    300,
  );
  return Array.isArray(response) ? response : response.data ?? [];
};

export const fetchServerMarketingSettings = async (): Promise<MarketingSettings | null> => {
  try {
    return await fetchPublicJson<MarketingSettings>("/settings/marketing", 300);
  } catch {
    return null;
  }
};

export const fetchServerProductsPage = async (params: URLSearchParams) => {
  const query = params.toString();
  return fetchPublicJson<PaginatedResponse<Product>>(
    `/products${query ? `?${query}` : ""}`,
    60,
  );
};
