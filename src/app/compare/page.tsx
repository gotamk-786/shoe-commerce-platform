"use client";

import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearCompare, removeFromCompare } from "@/store/slices/compare-slice";
import { formatCurrency } from "@/lib/format";
import Button from "@/components/ui/button";

const buildColors = (product: any) =>
  product.variants?.map((v: any) => v.color).filter(Boolean).join(", ") || "—";

const buildSizes = (product: any) => {
  const sizes = new Set<string>();
  product.variants?.forEach((variant: any) => {
    variant.sizes?.forEach((s: any) => {
      if (s.sizeUS) sizes.add(`US ${s.sizeUS}`);
      if (s.sizeEU) sizes.add(`EU ${s.sizeEU}`);
    });
  });
  return sizes.size ? Array.from(sizes).join(", ") : "—";
};

export default function ComparePage() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.compare.items);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <p className="text-lg font-semibold text-gray-900">No products to compare</p>
        <p className="mt-2 text-sm text-gray-600">
          Add products from the collection to compare them here.
        </p>
        <Link href="/collection">
          <Button variant="primary" className="mt-4">
            Browse collection
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="pill mb-2 inline-block text-gray-700">Compare</p>
          <h1 className="text-2xl font-semibold text-gray-900">Side-by-side specs</h1>
        </div>
        <Button variant="ghost" onClick={() => dispatch(clearCompare())}>
          Clear all
        </Button>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-black/10 bg-white shadow-[0_16px_50px_rgba(12,22,44,0.08)]">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Feature</th>
              {items.map((item) => (
                <th key={item.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span>{item.name}</span>
                    <button
                      className="text-xs text-gray-500 underline"
                      onClick={() => dispatch(removeFromCompare(item.id))}
                    >
                      Remove
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            <tr>
              <td className="px-4 py-3 font-medium">Price</td>
              {items.map((item) => (
                <td key={item.id} className="px-4 py-3">
                  {formatCurrency(item.price)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium">Discount</td>
              {items.map((item) => (
                <td key={item.id} className="px-4 py-3">
                  {item.discount ? `${item.discount}%` : "—"}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium">Condition</td>
              {items.map((item) => (
                <td key={item.id} className="px-4 py-3">
                  {item.condition || "—"}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium">Gender</td>
              {items.map((item) => (
                <td key={item.id} className="px-4 py-3">
                  {item.gender || "—"}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium">Colors</td>
              {items.map((item) => (
                <td key={item.id} className="px-4 py-3">
                  {buildColors(item)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium">Sizes</td>
              {items.map((item) => (
                <td key={item.id} className="px-4 py-3">
                  {buildSizes(item)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium">Stock</td>
              {items.map((item) => (
                <td key={item.id} className="px-4 py-3">
                  {item.stock ?? "—"}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
