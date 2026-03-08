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
        const previewRelatedRequest = preview
          ? fetchProducts({
              category: preview.categoryId ?? preview.category,
              limit: 4,
              exclude: preview.id,
            })
          : null;
        const previewReviewRequest = preview ? fetchReviews(preview.id) : null;

        const [productResult, relatedResponse, reviewData] = await Promise.allSettled([
          fetchProductBySlug(params.slug),
          previewRelatedRequest,
          previewReviewRequest,
        ]);

        if (!active) {
          return;
        }

        if (productResult.status === "rejected") {
          throw productResult.reason;
        }

        const data = productResult.value;
        setProduct(data);
        setLoading(false);

        if (relatedResponse.status === "fulfilled" && relatedResponse.value) {
          setRelatedProducts(relatedResponse.value.data || []);
        }

        if (reviewData.status === "fulfilled" && reviewData.value) {
          setReviews(reviewData.value);
        }

        if (relatedResponse.status !== "fulfilled" || !relatedResponse.value) {
          const relatedFallback = await fetchProducts({
            category: data.categoryId ?? data.category,
            limit: 4,
            exclude: data.id,
          });
          if (active) {
            setRelatedProducts(relatedFallback.data || []);
          }
        }

        if (reviewData.status !== "fulfilled" || !reviewData.value) {
          const reviewFallback = await fetchReviews(data.id);
          if (active) {
            setReviews(reviewFallback);
          }
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
