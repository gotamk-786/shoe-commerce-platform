"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Button from "../ui/button";
import { Product, ProductVariant, VariantSize } from "@/lib/types";
import { discountPrice, formatCurrency } from "@/lib/format";
import { useAppDispatch } from "@/store/hooks";
import { addItem } from "@/store/slices/cart-slice";
import { toggleCart } from "@/store/slices/ui-slice";

type Props = {
  product: Product;
  selectedVariant?: ProductVariant;
  onVariantChange?: (variant: ProductVariant) => void;
  wishlisted?: boolean;
  onToggleWishlist?: () => void;
};

export default function ProductInfo({
  product,
  selectedVariant,
  onVariantChange,
  wishlisted,
  onToggleWishlist,
}: Props) {
  const dispatch = useAppDispatch();
  const [size, setSize] = useState<VariantSize | undefined>(() => {
    if (selectedVariant?.sizes?.length) {
      return selectedVariant.sizes[0];
    }

    if (product.sizes?.length) {
      return {
        id: product.sizes[0],
        sizeUS: product.sizes[0],
        stock: product.stock,
      };
    }

    return undefined;
  });

  const priceBase = selectedVariant?.priceOverride ?? product.price;
  const finalPrice = useMemo(
    () => discountPrice(priceBase, product.discount),
    [priceBase, product.discount],
  );

  const handleAdd = () => {
    if (selectedVariant?.sizes?.length && !size) {
      return;
    }
    dispatch(
      addItem({
        product,
        variant: selectedVariant,
        size,
      }),
    );
    dispatch(toggleCart(true));
  };

  return (
    <div className="space-y-6 rounded-3xl border border-black/10 bg-white p-6 shadow-[0_14px_60px_rgba(12,22,44,0.08)]">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
            {product.category || "Footwear"}
          </p>
          {product.condition && (
            <span className="rounded-full border border-black/10 px-3 py-1 text-[11px] font-medium text-gray-700">
              {product.condition}
            </span>
          )}
          {product.gender && (
            <span className="rounded-full border border-black/10 px-3 py-1 text-[11px] font-medium text-gray-700">
              {product.gender}
            </span>
          )}
        </div>
        <h1 className="text-3xl font-semibold text-gray-900 md:text-4xl">{product.name}</h1>
        <p className="text-sm text-gray-600">{product.description}</p>
      </div>

      <div className="flex items-end gap-3 text-2xl font-semibold text-gray-900">
        <span>{formatCurrency(finalPrice)}</span>
        {product.discount ? (
          <span className="text-base font-normal text-gray-400 line-through">
            {formatCurrency(priceBase)}
          </span>
        ) : null}
      </div>

      {product.variants?.length ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-800">Select color</p>
            <div className="flex flex-wrap gap-3">
              {product.variants.map((variant) => (
                <motion.button
                  key={variant.id}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center gap-3 rounded-2xl border px-3 py-2 text-sm ${
                    selectedVariant?.id === variant.id
                      ? "border-black bg-black text-white"
                      : "border-black/10 bg-white text-gray-800 hover:border-black/40"
                  }`}
                  onClick={() => {
                    onVariantChange?.(variant);
                    setSize(variant.sizes?.[0]);
                  }}
                >
                  <span className="relative h-8 w-8 overflow-hidden rounded-xl border border-black/10 bg-white">
                    {variant.images?.[0]?.url ? (
                      <img
                        src={variant.images[0].url}
                        alt={variant.color}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </span>
                  <span>{variant.color}</span>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-800">Select size</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {selectedVariant?.sizes?.length ? (
                selectedVariant.sizes.map((s) => {
                  const label =
                    s.sizeUS && s.sizeEU
                      ? `US ${s.sizeUS} / EU ${s.sizeEU}`
                      : s.sizeUS
                        ? `US ${s.sizeUS}`
                        : `EU ${s.sizeEU}`;
                  return (
                    <motion.button
                      key={s.id}
                      whileTap={{ scale: 0.95 }}
                      className={`rounded-2xl border px-4 py-3 text-sm ${
                        size?.id === s.id
                          ? "border-black bg-black text-white"
                          : "border-black/10 bg-white text-gray-800 hover:border-black/40"
                      }`}
                      onClick={() => setSize(s)}
                    >
                      {label}
                    </motion.button>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500">No sizes set for this color.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-800">Select size</p>
          <div className="flex flex-wrap gap-2">
            {product.sizes?.length ? (
              product.sizes.map((s) => (
                <motion.button
                  key={s}
                  whileTap={{ scale: 0.95 }}
                  className={`rounded-2xl border px-4 py-2 text-sm ${
                    size?.sizeUS === s
                      ? "border-black bg-black text-white"
                      : "border-black/10 bg-white text-gray-800 hover:border-black/40"
                  }`}
                  onClick={() => setSize({ id: s, sizeUS: s, stock: product.stock })}
                >
                  {s}
                </motion.button>
              ))
            ) : (
              <p className="text-sm text-gray-500">Sizing details will be available soon.</p>
            )}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <p className="text-sm text-gray-600">
          {(size?.stock ?? product.stock) > 0 ? `${size?.stock ?? product.stock} pairs available` : "Out of stock - get notified when it returns"}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="primary"
            className="flex-1"
            disabled={(size?.stock ?? product.stock) <= 0 || Boolean(selectedVariant?.sizes?.length && !size)}
            onClick={handleAdd}
          >
            Add to Cart
          </Button>
          <Button variant="ghost" className="flex-1" onClick={() => dispatch(toggleCart(true))}>
            View Cart
          </Button>
        </div>
        {onToggleWishlist && (
          <Button variant="ghost" onClick={onToggleWishlist}>
            {wishlisted ? "Remove from wishlist" : "Save to wishlist"}
          </Button>
        )}
      </div>
    </div>
  );
}
