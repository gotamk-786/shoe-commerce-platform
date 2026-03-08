import ProductDetailClient from "./product-detail-client";
import {
  fetchServerProductBySlug,
  fetchServerProductsPage,
  fetchServerReviews,
} from "@/lib/public-server";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await fetchServerProductBySlug(slug).catch(() => null);

  if (!product) {
    return <ProductDetailClient product={null} relatedProducts={[]} initialReviews={null} />;
  }

  const relatedParams = new URLSearchParams({
    limit: "4",
    exclude: product.id,
  });

  if (product.categoryId ?? product.category) {
    relatedParams.set("category", String(product.categoryId ?? product.category));
  }

  const [relatedResponse, reviews] = await Promise.all([
    fetchServerProductsPage(relatedParams).catch(() => ({
      data: [],
      page: 1,
      limit: 4,
      total: 0,
    })),
    fetchServerReviews(product.id).catch(() => null),
  ]);

  return (
    <ProductDetailClient
      product={product}
      relatedProducts={relatedResponse.data}
      initialReviews={reviews}
    />
  );
}
