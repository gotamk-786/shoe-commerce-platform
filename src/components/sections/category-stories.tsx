"use client";

import { useEffect, useState } from "react";
import { Category } from "@/lib/types";
import { fetchCategories, handleApiError } from "@/lib/api";
import SectionHeading from "../ui/section-heading";
import Skeleton from "../ui/skeleton";
import Image from "next/image";

export default function CategoryStories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fallbackStories = [
    {
      id: "story-1",
      name: "Men",
      description: "Engineered cushioning and sharp silhouettes for daily wear.",
      coverImage:
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: "story-2",
      name: "Women",
      description: "Lightweight builds with premium lines and responsive feel.",
      coverImage:
        "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: "story-3",
      name: "Unisex",
      description: "Minimal, versatile pairs that anchor every rotation.",
      coverImage:
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
    },
  ];

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchCategories();
        setCategories(data || []);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
      <SectionHeading
        eyebrow="Categories"
        title="Stories in every silhouette"
        description="Explore each lane of the catalog and find the right style for your day."
      />
      <div className="mt-10 grid gap-7 md:grid-cols-3">
        {loading &&
          Array.from({ length: 3 }).map((_, idx) => <Skeleton key={idx} className="h-64" />)}
        {!loading &&
          !error &&
          (categories.length ? categories : fallbackStories).map((category) => (
            <div
              key={category.id}
              className="group relative overflow-hidden rounded-3xl border border-black/10 bg-white p-6 shadow-[0_30px_80px_rgba(12,22,44,0.08)] transition duration-200 ease-out"
            >
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
                  {category.name}
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {category.description || "Dialed-in everyday wear with luxe intent."}
                </p>
              </div>
              {category.coverImage ? (
                <div className="relative mt-6 h-32 overflow-hidden rounded-2xl">
                  <Image
                    src={category.coverImage}
                    alt={category.name}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-black/10 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                  Fresh visuals for this category are coming soon.
                </div>
              )}
            </div>
          ))}
        {error && (
          <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 md:col-span-3">
            {error}
          </div>
        )}
      </div>
    </section>
  );
}
