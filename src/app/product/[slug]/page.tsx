"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Product, ReviewSummary } from "@/lib/types";
import {
  fetchProductBySlug,
  fetchProducts,
  fetchReviews,
  handleApiError,
} from "@/lib/api";
import { readProductPreview } from "@/lib/product-preview-cache";
import ProductDetailClient from "./product-detail-client";

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const initialPreview = readProductPreview(params.slug);
  const [product, setProduct] = useState<Product | null>(initialPreview);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(!initialPreview);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const preview = readProductPreview(params.slug);

    const load = async () => {
      try {
        if (preview) {
          setProduct(preview);
          setLoading(false);
        } else {
          setLoading(true);
        }
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
    return null;
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
