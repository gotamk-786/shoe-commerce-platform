"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import ProductGrid from "@/components/product/product-grid";
import FilterBar, { ProductFilters } from "@/components/product/filter-bar";
import SectionHeading from "@/components/ui/section-heading";
import Button from "@/components/ui/button";
import { Category, Product } from "@/lib/types";
import { fetchProducts, handleApiError } from "@/lib/api";

type CollectionClientProps = {
  initialProducts: Product[];
  initialCategories: Category[];
  initialTotal: number;
  initialPage: number;
  initialFilters: ProductFilters;
};

const buildRequestKey = (filters: ProductFilters, page: number) =>
  JSON.stringify({ page, ...filters });

export default function CollectionClient({
  initialProducts,
  initialCategories,
  initialTotal,
  initialPage,
  initialFilters,
}: CollectionClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(initialTotal);
  const initialRequestKey = useRef(buildRequestKey(initialFilters, initialPage));
  const hasSkippedInitialFetch = useRef(false);

  const filters = useMemo<ProductFilters>(() => {
    return {
      category: searchParams.get("category") || undefined,
      condition: searchParams.get("condition") || undefined,
      size: searchParams.get("size") || undefined,
      sort: searchParams.get("sort") || undefined,
      gender: searchParams.get("gender") || undefined,
      color: searchParams.get("color") || undefined,
      q: searchParams.get("q") || undefined,
    };
  }, [searchParams]);

  const page = useMemo(() => {
    const nextPage = Number(searchParams.get("page") || initialPage || 1);
    return Number.isFinite(nextPage) && nextPage > 0 ? nextPage : 1;
  }, [initialPage, searchParams]);

  const requestKey = useMemo(() => buildRequestKey(filters, page), [filters, page]);

  useEffect(() => {
    if (!hasSkippedInitialFetch.current && requestKey === initialRequestKey.current) {
      hasSkippedInitialFetch.current = true;
      return;
    }

    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchProducts({
          page,
          limit: 9,
          ...filters,
        });
        if (!active) {
          return;
        }
        setProducts(response.data);
        setTotal(response.total);
      } catch (err) {
        if (!active) {
          return;
        }
        setError(handleApiError(err));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [filters, page, requestKey]);

  const updateUrl = (nextFilters: ProductFilters, nextPage = 1) => {
    const params = new URLSearchParams();
    Object.entries(nextFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, String(value));
      }
    });
    if (nextPage > 1) {
      params.set("page", String(nextPage));
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const totalPages = Math.max(1, Math.ceil(total / 9));

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <SectionHeading
        eyebrow="Collection"
        title="Shop the collection"
        description="Browse every pair with smart filters and clean, easy navigation."
      />
      <div className="mt-6">
        <FilterBar
          categories={initialCategories}
          onChange={(nextFilters) => updateUrl(nextFilters, 1)}
          loading={loading}
          initialFilters={filters}
        />
      </div>
      <div className="mt-8">
        {error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        ) : (
          <ProductGrid products={products} loading={loading && products.length === 0} />
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
            onClick={() => updateUrl(filters, Math.max(1, page - 1))}
          >
            Previous
          </Button>
          <Button
            variant="primary"
            disabled={page >= totalPages}
            onClick={() => updateUrl(filters, Math.min(totalPages, page + 1))}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
