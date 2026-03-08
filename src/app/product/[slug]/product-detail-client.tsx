"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProductGallery from "@/components/product/product-gallery";
import ProductInfo from "@/components/product/product-info";
import ProductGrid from "@/components/product/product-grid";
import { Product, ProductVariant, ReviewSummary } from "@/lib/types";
import {
  addWishlist,
  fetchProducts,
  fetchReviews,
  fetchWishlist,
  handleApiError,
  removeWishlist,
  submitReview,
} from "@/lib/api";
import SectionHeading from "@/components/ui/section-heading";
import { useAppSelector } from "@/store/hooks";
import Button from "@/components/ui/button";

type Props = {
  product: Product | null;
  relatedProducts: Product[];
  initialReviews: ReviewSummary | null;
  errorMessage?: string;
};

export default function ProductDetailClient({
  product,
  relatedProducts,
  initialReviews,
  errorMessage,
}: Props) {
  const [variant, setVariant] = useState<ProductVariant | undefined>(product?.variants?.[0]);
  const [related, setRelated] = useState<Product[]>(relatedProducts);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<ReviewSummary | null>(initialReviews);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [reviewStatus, setReviewStatus] = useState({ loading: false, error: "" });
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [wishlisted, setWishlisted] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const token = useAppSelector((state) => state.user.token);

  useEffect(() => {
    setVariant(product?.variants?.[0]);
    setRelated(relatedProducts);
    setReviews(initialReviews);
  }, [initialReviews, product, relatedProducts]);

  useEffect(() => {
    if (!product) {
      return;
    }

    let active = true;

    const hydratePage = async () => {
      try {
        if (relatedProducts.length === 0) {
          setRelatedLoading(true);
          const relatedData = await fetchProducts({
            category: product.categoryId ?? product.category,
            limit: 4,
            exclude: product.id,
          });
          if (active) {
            setRelated(relatedData.data || []);
          }
        }

        if (!initialReviews) {
          const reviewData = await fetchReviews(product.id);
          if (active) {
            setReviews(reviewData);
          }
        }

        if (token) {
          const wishlist = await fetchWishlist();
          if (active) {
            setWishlisted(
              wishlist.some((item: { productId: string }) => item.productId === product.id),
            );
          }
        } else if (active) {
          setWishlisted(false);
        }
      } catch (err) {
        if (active) {
          setError(handleApiError(err));
        }
      } finally {
        if (active) {
          setRelatedLoading(false);
        }
      }
    };

    void hydratePage();

    return () => {
      active = false;
    };
  }, [initialReviews, product, relatedProducts.length, token]);

  useEffect(() => {
    if (!product) return;
    const storageKey = "thrifty_recently_viewed";
    const entry: Product = {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      price: product.price,
      discount: product.discount,
      condition: product.condition,
      gender: product.gender,
      category: product.category,
      categoryId: product.categoryId,
      stock: product.stock,
      featured: product.featured,
      images: product.images,
      tags: product.tags,
      metadata: product.metadata,
      variants: product.variants,
    };
    const raw = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
    let list: Product[] = [];
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          list = parsed;
        }
      } catch {
        list = [];
      }
    }
    const nextList = [entry, ...list.filter((item) => item.id !== product.id)].slice(0, 8);
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, JSON.stringify(nextList));
    }
    setRecentlyViewed(nextList.filter((item) => item.id !== product.id));
  }, [product]);

  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <p className="text-lg font-semibold text-gray-900">Product unavailable</p>
        <p className="mt-2 text-sm text-gray-600">
          {errorMessage || error || "We could not fetch this product. Try again or browse the collection."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <ProductGallery images={variant?.images?.length ? variant.images : product.images} />
        <ProductInfo
          key={`${product.id}-${variant?.id ?? "base"}`}
          product={product}
          selectedVariant={variant}
          onVariantChange={setVariant}
          wishlisted={wishlisted}
          onToggleWishlist={
            token
              ? async () => {
                  if (wishlisted) {
                    await removeWishlist(product.id);
                    setWishlisted(false);
                  } else {
                    await addWishlist(product.id);
                    setWishlisted(true);
                  }
                }
              : undefined
          }
        />
      </div>

      <div className="mt-14">
        <SectionHeading
          eyebrow="Related"
          title="Curated for you"
          description="Recommendations from the same category to keep the journey going."
        />
        <div className="mt-6">
          <ProductGrid products={related} loading={relatedLoading} />
        </div>
      </div>

      {recentlyViewed.length > 0 && (
        <div className="mt-14">
          <SectionHeading
            eyebrow="Recently viewed"
            title="Keep browsing"
            description="Your latest product views, ready when you are."
          />
          <div className="mt-6">
            <ProductGrid products={recentlyViewed} />
          </div>
        </div>
      )}

      <div className="mt-14">
        <SectionHeading
          eyebrow="Reviews"
          title="Customer feedback"
          description="Ratings and comments from verified shoppers."
        />
        <div className="mt-6 grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
          <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_14px_60px_rgba(12,22,44,0.08)]">
            <p className="text-sm text-gray-600">Average rating</p>
            <div className="mt-2 flex items-end gap-3">
              <p className="text-3xl font-semibold text-gray-900">
                {reviews ? reviews.average.toFixed(1) : "0.0"}
              </p>
              <div className="flex items-center gap-1 text-sm text-amber-500">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <span key={idx}>{idx < Math.round(reviews?.average ?? 0) ? "★" : "☆"}</span>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-500">{reviews?.count ?? 0} reviews</p>
            <div className="mt-4 space-y-2">
              {[5, 4, 3, 2, 1].map((value) => {
                const count =
                  reviews?.data?.filter((review) => review.rating === value).length ?? 0;
                const percent = reviews?.count ? Math.round((count / reviews.count) * 100) : 0;
                return (
                  <div key={value} className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="w-8">{value}★</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-gray-900"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="w-8 text-right">{percent}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_14px_60px_rgba(12,22,44,0.08)]">
            {token ? (
              <form
                className="space-y-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    setReviewStatus({ loading: true, error: "" });
                    await submitReview({
                      productId: product.id,
                      rating: reviewForm.rating,
                      comment: reviewForm.comment,
                    });
                    const updated = await fetchReviews(product.id);
                    setReviews(updated);
                    setReviewForm({ rating: 5, comment: "" });
                    setReviewStatus({ loading: false, error: "" });
                  } catch (err) {
                    setReviewStatus({ loading: false, error: handleApiError(err) });
                  }
                }}
              >
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Your rating</p>
                  <div className="flex items-center gap-2 text-2xl text-amber-500">
                    {Array.from({ length: 5 }).map((_, idx) => {
                      const value = idx + 1;
                      const active = (hoverRating ?? reviewForm.rating) >= value;
                      return (
                        <button
                          type="button"
                          key={value}
                          onMouseEnter={() => setHoverRating(value)}
                          onMouseLeave={() => setHoverRating(null)}
                          onClick={() =>
                            setReviewForm((prev) => ({ ...prev, rating: value }))
                          }
                          className="transition"
                        >
                          {active ? "★" : "☆"}
                        </button>
                      );
                    })}
                    <span className="ml-2 text-sm text-gray-500">{reviewForm.rating} / 5</span>
                  </div>
                </div>
                <textarea
                  className="min-h-[90px] w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-gray-900 shadow-[0_12px_40px_rgba(12,22,44,0.06)] outline-none"
                  placeholder="Share your thoughts..."
                  value={reviewForm.comment}
                  onChange={(e) =>
                    setReviewForm((prev) => ({ ...prev, comment: e.target.value }))
                  }
                />
                {reviewStatus.error && <p className="text-sm text-rose-500">{reviewStatus.error}</p>}
                <Button variant="primary" disabled={reviewStatus.loading}>
                  {reviewStatus.loading ? "Posting..." : "Post review"}
                </Button>
              </form>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">Log in to leave a review.</p>
                <Link href="/login">
                  <Button variant="primary">Go to login</Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {reviews?.data?.length ? (
            reviews.data.map((review) => (
              <div
                key={review.id}
                className="rounded-2xl border border-black/10 bg-white px-4 py-4 text-sm shadow-[0_12px_40px_rgba(12,22,44,0.06)]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white">
                      {review.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{review.user.name}</p>
                      <p className="text-xs text-emerald-600">Verified buyer</p>
                    </div>
                  </div>
                  <span className="text-xs text-amber-500">
                    {"★".repeat(review.rating)}
                    <span className="text-gray-300">
                      {"☆".repeat(Math.max(0, 5 - review.rating))}
                    </span>
                  </span>
                </div>
                {review.comment && <p className="mt-2 text-gray-600">{review.comment}</p>}
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-600">No reviews yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
