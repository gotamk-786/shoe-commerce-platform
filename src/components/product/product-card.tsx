"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Product } from "@/lib/types";
import { discountPrice, formatCurrency } from "@/lib/format";
import Pill from "../ui/pill";
import Button from "../ui/button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addToCompare, removeFromCompare } from "@/store/slices/compare-slice";
import { fetchProductBySlug } from "@/lib/api";
import { writeProductPreview } from "@/lib/product-preview-cache";

export default function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const compared = useAppSelector((state) =>
    state.compare.items.some((item) => item.id === product.id),
  );
  const finalPrice = discountPrice(product.price, product.discount);
  const primaryImage = product.images?.[0]?.url;
  const productHref = `/product/${product.slug}`;

  useEffect(() => {
    router.prefetch(productHref);
    writeProductPreview(product);
    void fetchProductBySlug(product.slug).catch(() => undefined);
  }, [product, product.slug, productHref, router]);

  return (
    <motion.article
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ duration: 0.24, ease: [0.25, 0.1, 0.25, 1] }}
      className="group overflow-hidden rounded-3xl border border-black/10 bg-white p-5 shadow-[0_30px_80px_rgba(12,22,44,0.08)]"
    >
      <Link
        href={productHref}
        className="block space-y-4"
        prefetch
        onMouseEnter={() => {
          router.prefetch(productHref);
          writeProductPreview(product);
          void fetchProductBySlug(product.slug).catch(() => undefined);
        }}
        onTouchStart={() => {
          router.prefetch(productHref);
          writeProductPreview(product);
          void fetchProductBySlug(product.slug).catch(() => undefined);
        }}
        onClick={() => {
          writeProductPreview(product);
        }}
      >
        <div className="relative h-72 overflow-hidden rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100">
          {primaryImage ? (
            <Image
              src={primaryImage}
              alt={product.name}
              fill
              className="object-cover transition duration-500 group-hover:scale-105"
              sizes="(max-width:768px) 100vw, 33vw"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-sm text-gray-500">
              Image coming from API
            </div>
          )}
          <div className="absolute right-3 top-3 flex flex-col gap-2">
            {product.discount ? (
              <Pill className="border border-rose-700/20 bg-gradient-to-r from-rose-600 via-red-500 to-orange-500 px-3 py-1 font-semibold uppercase tracking-[0.2em] text-white shadow-[0_14px_32px_rgba(225,29,72,0.34)]">
                {product.discount}% off
              </Pill>
            ) : null}
            {product.condition && (
              <Pill className="border border-black/10 bg-white/95 px-3 py-1 font-semibold uppercase tracking-[0.2em] text-gray-900 shadow-sm backdrop-blur">
                {product.condition}
              </Pill>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold leading-tight text-gray-900">{product.name}</h3>
          <p className="text-sm text-gray-500 line-clamp-2">{product.description}</p>
          <div className="flex items-center gap-3 pt-1">
            <span className="text-lg font-semibold text-gray-900">
              {formatCurrency(finalPrice)}
            </span>
            {product.discount ? (
              <span className="text-sm text-gray-400 line-through">
                {formatCurrency(product.price)}
              </span>
            ) : null}
          </div>
          <p className="text-xs text-gray-500">
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </p>
          <div className="pt-1">
            <Button
              variant={compared ? "primary" : "ghost"}
              className="text-xs"
              onClick={(e) => {
                e.preventDefault();
                if (compared) {
                  dispatch(removeFromCompare(product.id));
                } else {
                  dispatch(addToCompare(product));
                }
              }}
            >
              {compared ? "Remove compare" : "Compare"}
            </Button>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
