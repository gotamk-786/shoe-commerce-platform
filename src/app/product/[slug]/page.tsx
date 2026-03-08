"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Skeleton from "@/components/ui/skeleton";
import { Product, ReviewSummary } from "@/lib/types";
import {
  fetchProductBySlug,
  fetchProducts,
  fetchReviews,
  handleApiError,
} from "@/lib/api";
import ProductDetailClient from "./product-detail-client";

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchProductBySlug(params.slug);
        if (!active) {
          return;
        }

        setProduct(data);
        setLoading(false);

        const [relatedResponse, reviewData] = await Promise.allSettled([
          fetchProducts({
            category: data.categoryId ?? data.category,
            limit: 4,
            exclude: data.id,
          }),
          fetchReviews(data.id),
        ]);

        if (!active) {
          return;
        }

        if (relatedResponse.status === "fulfilled") {
          setRelatedProducts(relatedResponse.value.data || []);
        }

        if (reviewData.status === "fulfilled") {
          setReviews(reviewData.value);
        }
      } catch (err) {
        if (!active) {
          return;
        }
        setError(handleApiError(err));
        setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [params.slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-2">
          <Skeleton className="h-[420px] rounded-3xl" />
          <Skeleton className="h-[420px] rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <ProductDetailClient
      product={product}
      relatedProducts={relatedProducts}
      initialReviews={reviews}
      errorMessage={error}
    />
  );
}
