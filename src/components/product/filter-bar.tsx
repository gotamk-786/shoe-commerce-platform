"use client";

import { useEffect, useState } from "react";
import { Category } from "@/lib/types";
import Button from "../ui/button";

export type ProductFilters = {
  category?: string;
  condition?: string;
  size?: string;
  sort?: string;
  gender?: string;
  q?: string;
};

const sizeOptions = [
  "EU 36",
  "EU 37",
  "EU 38",
  "EU 39",
  "EU 40",
  "EU 41",
  "EU 42",
  "EU 43",
  "EU 44",
  "EU 45",
];

export default function FilterBar({
  categories,
  onChange,
  loading,
  initialFilters = {},
}: {
  categories: Category[];
  onChange: (filters: ProductFilters) => void;
  loading?: boolean;
  initialFilters?: ProductFilters;
}) {
  const [filters, setFilters] = useState<ProductFilters>(initialFilters);

  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const update = (next: Partial<ProductFilters>) => {
    const merged = { ...filters, ...next };
    setFilters(merged);
    onChange(merged);
  };

  const controlClass =
    "w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-gray-900 shadow-[0_12px_40px_rgba(12,22,44,0.06)] outline-none transition focus:border-black/25";

  return (
    <div className="glass fade-border rounded-3xl px-4 py-4">
      <div className="grid gap-3">
        <input
          type="text"
          placeholder="Search products"
          className={controlClass}
          value={filters.q ?? ""}
          onChange={(e) => update({ q: e.target.value || undefined })}
          disabled={loading}
        />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <select
            className={controlClass}
            value={filters.category ?? ""}
            onChange={(e) => update({ category: e.target.value || undefined })}
            disabled={loading}
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            className={controlClass}
            value={filters.condition ?? ""}
            onChange={(e) => update({ condition: e.target.value || undefined })}
            disabled={loading}
          >
            <option value="">All conditions</option>
            <option value="new">New</option>
            <option value="used">Used</option>
            <option value="refurbished">Refurbished</option>
          </select>
          <select
            className={controlClass}
            value={filters.size ?? ""}
            onChange={(e) => update({ size: e.target.value || undefined })}
            disabled={loading}
          >
            <option value="">All sizes</option>
            {sizeOptions.map((size) => (
              <option key={size} value={size.replace("EU ", "")}>
                {size}
              </option>
            ))}
          </select>
          <select
            className={controlClass}
            value={filters.gender ?? ""}
            onChange={(e) => update({ gender: e.target.value || undefined })}
            disabled={loading}
          >
            <option value="">All</option>
            <option value="men">Men</option>
            <option value="women">Women</option>
            <option value="unisex">Unisex</option>
          </select>
          <select
            className={controlClass}
            value={filters.sort ?? ""}
            onChange={(e) => update({ sort: e.target.value || undefined })}
            disabled={loading}
          >
            <option value="">Featured</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="newest">Newest</option>
          </select>
        </div>
        <div className="flex justify-end">
          <Button
            variant="ghost"
            onClick={() => {
              setFilters({});
              onChange({});
            }}
          >
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}
