import { ProductFilters } from "@/components/product/filter-bar";
import { fetchServerCategories, fetchServerProductsPage } from "@/lib/public-server";
import CollectionClient from "./collection-client";

type CollectionPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const pickParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function CollectionPage({ searchParams }: CollectionPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const filters: ProductFilters = {
    category: pickParam(resolvedSearchParams.category),
    condition: pickParam(resolvedSearchParams.condition),
    size: pickParam(resolvedSearchParams.size),
    sort: pickParam(resolvedSearchParams.sort),
    gender: pickParam(resolvedSearchParams.gender),
    color: pickParam(resolvedSearchParams.color),
    q: pickParam(resolvedSearchParams.q),
  };

  const pageValue = Number(pickParam(resolvedSearchParams.page) || 1);
  const page = Number.isFinite(pageValue) && pageValue > 0 ? pageValue : 1;

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", "9");

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const [productsResponse, categories] = await Promise.all([
    fetchServerProductsPage(params).catch(() => ({
      data: [],
      page,
      limit: 9,
      total: 0,
    })),
    fetchServerCategories().catch(() => []),
  ]);

  return (
    <CollectionClient
      initialProducts={productsResponse.data}
      initialCategories={categories}
      initialTotal={productsResponse.total}
      initialPage={page}
      initialFilters={filters}
    />
  );
}
