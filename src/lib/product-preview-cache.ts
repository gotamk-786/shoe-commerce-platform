import { Product } from "./types";

const STORAGE_PREFIX = "thrifty_product_preview:";

export const readProductPreview = (slug: string): Product | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(`${STORAGE_PREFIX}${slug}`);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Product;
  } catch {
    window.sessionStorage.removeItem(`${STORAGE_PREFIX}${slug}`);
    return null;
  }
};

export const writeProductPreview = (product: Product) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(`${STORAGE_PREFIX}${product.slug}`, JSON.stringify(product));
  } catch {
    // ignore cache write failures
  }
};
