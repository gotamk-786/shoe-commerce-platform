"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import SectionHeading from "@/components/ui/section-heading";
import ProductGrid from "@/components/product/product-grid";
import { fetchSharedWishlist, handleApiError } from "@/lib/api";
import { Product } from "@/lib/types";

export default function SharedWishlistPage() {
  const params = useParams<{ token: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState({ loading: true, error: "" });

  useEffect(() => {
    if (!params.token) return;
    fetchSharedWishlist(params.token)
      .then((items) => {
        setProducts(items.map((item: { product: Product }) => item.product));
        setStatus({ loading: false, error: "" });
      })
      .catch((error) => {
        setStatus({ loading: false, error: handleApiError(error) });
      });
  }, [params.token]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <SectionHeading
        eyebrow="Shared wishlist"
        title="Someone shared their picks"
        description="Browse curated favorites in one place."
      />
      {status.error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {status.error}
        </div>
      )}
      <div className="mt-6">
        <ProductGrid products={products} loading={status.loading} />
      </div>
      {!status.loading && !products.length && !status.error && (
        <div className="mt-6 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-gray-600">
          No products in this wishlist.
        </div>
      )}
    </div>
  );
}
