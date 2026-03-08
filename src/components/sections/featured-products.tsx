"use client";

import { useEffect, useState } from "react";
import { fetchFeaturedProducts, handleApiError } from "@/lib/api";
import { Product } from "@/lib/types";
import ProductGrid from "../product/product-grid";
import SectionHeading from "../ui/section-heading";

export default function FeaturedProducts({
  initialProducts = [],
}: {
  initialProducts?: Product[];
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(initialProducts.length === 0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialProducts.length > 0) {
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchFeaturedProducts();
        setProducts(data || []);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [initialProducts]);

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
      <SectionHeading
        eyebrow="Featured"
        title="Flagship drops"
        description="Handpicked favorites, refreshed regularly."
      />
      <div className="mt-10">
        {error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        ) : (
          <ProductGrid products={products} loading={loading} />
        )}
      </div>
    </section>
  );
}

