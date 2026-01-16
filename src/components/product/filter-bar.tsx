"use client";

import { useState } from "react";
import { Category } from "@/lib/types";
import Button from "../ui/button";

export type ProductFilters = {
  category?: string;
  condition?: string;
  size?: string;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
  gender?: string;
  color?: string;
  q?: string;
};

export default function FilterBar({
  categories,
  onChange,
  loading,
}: {
  categories: Category[];
  onChange: (filters: ProductFilters) => void;
  loading?: boolean;
}) {
  const [filters, setFilters] = useState<ProductFilters>({});

  const update = (next: Partial<ProductFilters>) => {
    const merged = { ...filters, ...next };
    setFilters(merged);
    onChange(merged);
  };

  return (
    <div className="glass fade-border flex flex-col gap-3 rounded-3xl px-4 py-3 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search products"
          className="pill bg-white text-sm"
          value={filters.q ?? ""}
          onChange={(e) => update({ q: e.target.value || undefined })}
          disabled={loading}
        />
        <select
          className="pill bg-white text-sm"
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
          className="pill bg-white text-sm"
          value={filters.condition ?? ""}
          onChange={(e) => update({ condition: e.target.value || undefined })}
          disabled={loading}
        >
          <option value="">All conditions</option>
          <option value="new">New</option>
          <option value="used">Used</option>
          <option value="refurbished">Refurbished</option>
        </select>
        <input
          type="text"
          placeholder="Size"
          className="pill bg-white text-sm"
          value={filters.size ?? ""}
          onChange={(e) => update({ size: e.target.value || undefined })}
          disabled={loading}
        />
        <input
          type="text"
          placeholder="Color"
          className="pill bg-white text-sm"
          value={filters.color ?? ""}
          onChange={(e) => update({ color: e.target.value || undefined })}
          disabled={loading}
        />
        <select
          className="pill bg-white text-sm"
          value={filters.gender ?? ""}
          onChange={(e) => update({ gender: e.target.value || undefined })}
          disabled={loading}
        >
          <option value="">All</option>
          <option value="men">Men</option>
          <option value="women">Women</option>
          <option value="unisex">Unisex</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          placeholder="Min"
          className="pill bg-white text-sm w-24"
          value={filters.minPrice ?? ""}
          onChange={(e) =>
            update({ minPrice: e.target.value ? Number(e.target.value) : undefined })
          }
          disabled={loading}
        />
        <input
          type="number"
          placeholder="Max"
          className="pill bg-white text-sm w-24"
          value={filters.maxPrice ?? ""}
          onChange={(e) =>
            update({ maxPrice: e.target.value ? Number(e.target.value) : undefined })
          }
          disabled={loading}
        />
        <select
          className="pill bg-white text-sm"
          value={filters.sort ?? ""}
          onChange={(e) => update({ sort: e.target.value || undefined })}
          disabled={loading}
        >
          <option value="">Featured</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="newest">Newest</option>
        </select>
        <Button variant="ghost" onClick={() => update({})}>
          Reset
        </Button>
      </div>
    </div>
  );
}
