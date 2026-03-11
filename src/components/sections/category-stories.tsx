"use client";

import { useEffect, useState } from "react";
import { Category } from "@/lib/types";
import { fetchCategories, handleApiError } from "@/lib/api";
import SectionHeading from "../ui/section-heading";
import Skeleton from "../ui/skeleton";
import Image from "next/image";

export default function CategoryStories({
  initialCategories = [],
}: {
  initialCategories?: Category[];
}) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [loading, setLoading] = useState(initialCategories.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
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
  const categoryVisuals: Record<
    string,
    { image: string; accent: string; microcopy: string; badge: string }
  > = {
    men: {
      image: "/marketing/category-men.svg",
      accent: "from-slate-950 via-slate-700 to-stone-400",
      microcopy: "Structured staples with clean finish.",
      badge: "Daily rotation",
    },
    women: {
      image: "/marketing/category-women.svg",
      accent: "from-zinc-950 via-rose-700 to-orange-300",
      microcopy: "Soft lines with a bold street edge.",
      badge: "New mood",
    },
    sneakers: {
      image: "/marketing/category-sneakers.svg",
      accent: "from-sky-950 via-indigo-700 to-cyan-300",
      microcopy: "Low tops, runners, and standout pairs.",
      badge: "Fan favorite",
    },
    unisex: {
      image: "/marketing/category-sneakers.svg",
      accent: "from-zinc-950 via-emerald-700 to-lime-300",
      microcopy: "Versatile builds for every fit.",
      badge: "Core edit",
    },
    default: {
      image: "/marketing/category-men.svg",
      accent: "from-slate-950 via-slate-700 to-amber-300",
      microcopy: "Fresh pairs selected for every day.",
      badge: "Catalog pick",
    },
  };

  useEffect(() => {
    if (initialCategories.length > 0) {
      return;
    }

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
  }, [initialCategories]);

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
          (categories.length ? categories : fallbackStories).map((category) => {
            const key = category.name.trim().toLowerCase();
            const visual =
              categoryVisuals[key] ??
              (key.includes("men")
                ? categoryVisuals.men
                : key.includes("women")
                ? categoryVisuals.women
                : key.includes("sneaker")
                ? categoryVisuals.sneakers
                : key.includes("unisex")
                ? categoryVisuals.unisex
                : categoryVisuals.default);
            const showFallbackArt = failedImages[category.id] || !category.coverImage;

            return (
            <div
              key={category.id}
              className="group relative overflow-hidden rounded-3xl border border-black/10 bg-white p-6 shadow-[0_30px_80px_rgba(12,22,44,0.08)] transition duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_36px_90px_rgba(12,22,44,0.12)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
                    {category.name}
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {category.description || "Dialed-in everyday wear with luxe intent."}
                  </p>
                </div>
                <span className="rounded-full border border-black/10 bg-black/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-gray-600">
                  {visual.badge}
                </span>
              </div>
              <div className="relative mt-6 overflow-hidden rounded-[28px]">
                <div className="absolute inset-x-4 top-4 z-10 flex items-center justify-between text-xs text-white/80">
                  <span className="rounded-full border border-white/20 bg-black/15 px-3 py-1 uppercase tracking-[0.25em] backdrop-blur-sm">
                    {category.name}
                  </span>
                  <span className="rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm">
                    {visual.microcopy}
                  </span>
                </div>
                {showFallbackArt ? (
                  <div className={`relative h-44 bg-gradient-to-br ${visual.accent}`}>
                    <div className="absolute -left-6 top-8 h-24 w-24 rounded-full bg-white/15 blur-xl" />
                    <div className="absolute right-6 top-10 h-16 w-28 animate-[drift_7s_ease-in-out_infinite] rounded-full border border-white/20 bg-white/10 backdrop-blur-sm" />
                    <div className="absolute bottom-6 left-6 h-24 w-36 rotate-[-10deg] rounded-[2rem] border border-white/20 bg-black/15" />
                    <div className="absolute bottom-5 right-5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/85 backdrop-blur-sm">
                      Explore
                    </div>
                    <div className="absolute inset-0 opacity-20 mix-blend-screen">
                      <Image
                        src={visual.image}
                        alt=""
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  </div>
                ) : (
                  <div className="relative h-44">
                  <Image
                    src={category.coverImage!}
                    alt={category.name}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    onError={() =>
                      setFailedImages((prev) => ({
                        ...prev,
                        [category.id]: true,
                      }))
                    }
                  />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute inset-x-5 bottom-4 flex items-end justify-between">
                  <p className="max-w-[70%] text-sm font-medium text-white">
                    {category.description || visual.microcopy}
                  </p>
                  <span className="text-sm font-semibold text-white">View -&gt;</span>
                </div>
              </div>
            </div>
          )})}
        {error && (
          <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 md:col-span-3">
            {error}
          </div>
        )}
      </div>
      <style jsx>{`
        @keyframes drift {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(-12px, -8px, 0);
          }
        }
      `}</style>
    </section>
  );
}
