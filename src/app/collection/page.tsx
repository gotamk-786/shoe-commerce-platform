"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import ProductGrid from "@/components/product/product-grid";
import FilterBar, { ProductFilters } from "@/components/product/filter-bar";
import SectionHeading from "@/components/ui/section-heading";
import Button from "@/components/ui/button";
import { Category, Product } from "@/lib/types";
import { fetchCategories, fetchProducts, handleApiError } from "@/lib/api";

function CollectionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(() => Number(searchParams.get("page") || 1));
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<ProductFilters>({});

  const paramsFromUrl = useMemo(() => {
    return {
      category: searchParams.get("category") || undefined,
      condition: searchParams.get("condition") || undefined,
      size: searchParams.get("size") || undefined,
      sort: searchParams.get("sort") || undefined,
      gender: searchParams.get("gender") || undefined,
      color: searchParams.get("color") || undefined,
      minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
      maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
      q: searchParams.get("q") || undefined,
    };
  }, [searchParams]);

  useEffect(() => {
    setFilters(paramsFromUrl);
  }, [paramsFromUrl]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchProducts({
          page,
          limit: 9,
          ...filters,
        });
        setProducts(response.data);
        setTotal(response.total);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page, filters]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchCategories();
        setCategories(data || []);
      } catch (err) {
        // ignore category errors to keep collection usable
        console.warn(err);
      }
    };
    loadCategories();
  }, []);

  const updateUrl = (nextFilters: ProductFilters, nextPage = 1) => {
    const params = new URLSearchParams();
    Object.entries(nextFilters).forEach(([key, value]) => {
      if (value) params.set(key, String(value));
    });
    if (nextPage > 1) params.set("page", String(nextPage));
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const onFilterChange = (next: ProductFilters) => {
    setFilters(next);
    setPage(1);
    updateUrl(next, 1);
  };

  const totalPages = Math.max(1, Math.ceil(total / 9));

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <SectionHeading
        eyebrow="Collection"
        title="Live inventory"
        description="All products flow from the API with filters, sorting, and paginated browsing."
      />
      <div className="mt-6">
        <FilterBar categories={categories} onChange={onFilterChange} loading={loading} />
      </div>
      <div className="mt-8">
        {error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        ) : (
          <ProductGrid products={products} loading={loading} />
        )}
      </div>
      <div className="mt-10 flex items-center justify-between rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-gray-700">
        <span>
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            disabled={page <= 1}
            onClick={() => {
              const next = Math.max(1, page - 1);
              setPage(next);
              updateUrl(filters, next);
            }}
          >
            Previous
          </Button>
          <Button
            variant="primary"
            disabled={page >= totalPages}
            onClick={() => {
              const next = Math.min(totalPages, page + 1);
              setPage(next);
              updateUrl(filters, next);
            }}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CollectionPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-6 py-12">
          <SectionHeading
            eyebrow="Collection"
            title="Live inventory"
            description="Loading products..."
          />
        </div>
      }
    >
      <CollectionContent />
    </Suspense>
  );
}
