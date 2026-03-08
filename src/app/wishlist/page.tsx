"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button";
import SectionHeading from "@/components/ui/section-heading";
import ProductGrid from "@/components/product/product-grid";
import { createWishlistShare, fetchWishlist, handleApiError, removeWishlist } from "@/lib/api";
import { Product } from "@/lib/types";
import { useAppSelector } from "@/store/hooks";

export default function WishlistPage() {
  const router = useRouter();
  const token = useAppSelector((state) => state.user.token);
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState({ loading: true, error: "" });
  const [shareLink, setShareLink] = useState("");

  useEffect(() => {
    if (!token) return;
    fetchWishlist()
      .then((items) => {
        setProducts(items.map((item: { product: Product }) => item.product));
        setStatus({ loading: false, error: "" });
      })
      .catch((error) => {
        setStatus({ loading: false, error: handleApiError(error) });
      });
  }, [token]);

  if (!token) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <p className="text-lg font-semibold text-gray-900">Your wishlist is waiting</p>
        <p className="mt-2 text-sm text-gray-600">Log in to save products across devices.</p>
        <div className="mt-4 flex justify-center gap-3">
          <Button variant="primary" onClick={() => router.push("/login")}>
            Log in
          </Button>
          <Button variant="ghost" onClick={() => router.push("/register")}>
            Create account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <SectionHeading
        eyebrow="Wishlist"
        title="Saved pairs"
        description="Keep track of the shoes you want next."
      />
      {products.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            variant="ghost"
            onClick={async () => {
              try {
                const data = await createWishlistShare();
                const url = `${window.location.origin}/wishlist/shared/${data.token}`;
                setShareLink(url);
              } catch (error) {
                setStatus({ loading: false, error: handleApiError(error) });
              }
            }}
          >
            Create share link
          </Button>
          {shareLink && (
            <Button
              variant="primary"
              onClick={() => {
                navigator.clipboard.writeText(shareLink);
              }}
            >
              Copy link
            </Button>
          )}
          {shareLink && <span className="text-sm text-gray-600">{shareLink}</span>}
        </div>
      )}
      {status.error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {status.error}
        </div>
      )}
      <div className="mt-6">
        <ProductGrid products={products} loading={status.loading} />
      </div>
      {products.length > 0 && (
        <div className="mt-6 text-sm text-gray-500">
          Tip: open a product page to remove it from your wishlist.
        </div>
      )}
      {products.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-3">
          {products.map((product) => (
            <Button
              key={product.id}
              variant="ghost"
              onClick={async () => {
                await removeWishlist(product.id);
                setProducts((prev) => prev.filter((p) => p.id !== product.id));
              }}
            >
              Remove {product.name}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
