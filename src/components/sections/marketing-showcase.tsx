"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/button";
import { fetchMarketingSettings } from "@/lib/api";
import { MarketingSettings } from "@/lib/types";

const fallbackSettings: MarketingSettings = {
  promo: {
    enabled: true,
    text: "20% off selected drops. Limited stock.",
    linkLabel: "Shop now",
    linkHref: "/collection",
  },
  hero: {
    autoplayMs: 6000,
    slides: [
      {
        id: "hero-1",
        title: "Just dropped",
        subtitle: "Fresh silhouettes with premium comfort and bold colorways.",
        badge: "New season",
        ctaLabel: "Explore new arrivals",
        ctaHref: "/collection",
        mediaType: "image",
        mediaUrl:
          "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=1600&q=80",
      },
      {
        id: "hero-2",
        title: "Built for everyday",
        subtitle: "Comfort-first cushioning meets clean, minimal design.",
        badge: "Core collection",
        ctaLabel: "Shop essentials",
        ctaHref: "/collection",
        mediaType: "image",
        mediaUrl:
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1600&q=80",
      },
      {
        id: "hero-3",
        title: "Performance energy",
        subtitle: "Lightweight materials with fast response for long days.",
        badge: "Performance",
        ctaLabel: "See highlights",
        ctaHref: "/collection",
        mediaType: "image",
        mediaUrl:
          "https://images.unsplash.com/photo-1483721310020-03333e577078?auto=format&fit=crop&w=1600&q=80",
      },
    ],
  },
  tiles: [
    {
      id: "tile-1",
      title: "Street essentials",
      subtitle: "Everyday sneakers built to move.",
      tag: "Back to sport",
      ctaLabel: "Shop",
      ctaHref: "/collection",
      imageUrl:
        "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: "tile-2",
      title: "Speed multiplied",
      subtitle: "Performance that keeps you light.",
      tag: "Fast pack",
      ctaLabel: "Shop",
      ctaHref: "/collection",
      imageUrl:
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: "tile-3",
      title: "Strength starts here",
      subtitle: "Training-ready fits for daily reps.",
      tag: "Training",
      ctaLabel: "Shop",
      ctaHref: "/collection",
      imageUrl:
        "https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: "tile-4",
      title: "Daily comfort",
      subtitle: "Cushioned styles for every walk.",
      tag: "Everyday",
      ctaLabel: "Shop",
      ctaHref: "/collection",
      imageUrl:
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
    },
  ],
};

export default function MarketingShowcase({
  initialSettings,
}: {
  initialSettings?: MarketingSettings | null;
}) {
  const [settings, setSettings] = useState<MarketingSettings>(initialSettings ?? fallbackSettings);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [failedTileImages, setFailedTileImages] = useState<Record<string, boolean>>({});

  const slides = settings.hero.slides;
  const hasSlides = slides.length > 0;
  const safeIndex = hasSlides ? Math.min(activeIndex, slides.length - 1) : 0;
  const activeSlide = hasSlides ? slides[safeIndex] : fallbackSettings.hero.slides[0];
  const lookbook = [
    {
      id: "look-1",
      title: "Weekend uniform",
      caption: "Neutral tones with tonal layering.",
      image:
        "https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: "look-2",
      title: "Street ready",
      caption: "Contrast stitching meets bold soles.",
      image:
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: "look-3",
      title: "Studio calm",
      caption: "Soft materials for long days.",
      image:
        "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=1200&q=80",
    },
  ];
  const tileFallbacks = [
    "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=1200&q=80",
  ];

  useEffect(() => {
    if (initialSettings) {
      return;
    }

    fetchMarketingSettings()
      .then((data) => setSettings(data))
      .catch(() => {});
  }, [initialSettings]);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, settings.hero.autoplayMs || 6000);
    return () => clearInterval(timer);
  }, [paused, slides.length, settings.hero.autoplayMs]);

  const activeSlideMemo = useMemo(() => activeSlide, [activeSlide]);
  const thumbSlides = useMemo(() => slides.slice(0, 3), [slides]);

  return (
    <section className="space-y-10">
      {settings.promo.enabled && (
        <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl bg-[#0b1220] text-white shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="flex items-center gap-6 px-6 py-4">
            <span className="rounded-full border border-white/30 px-3 py-1 text-xs uppercase tracking-[0.25em] text-white/70">
              Promo
            </span>
            <div className="relative flex-1 overflow-hidden">
              <div className="flex animate-[marquee_14s_linear_infinite] items-center gap-6 whitespace-nowrap text-sm font-medium">
                <span>{settings.promo.text}</span>
                <span className="text-white/50">/</span>
                <span>{settings.promo.text}</span>
                <span className="text-white/50">/</span>
                <span>{settings.promo.text}</span>
              </div>
            </div>
            {settings.promo.linkLabel && settings.promo.linkHref && (
              <Link
                href={settings.promo.linkHref}
                className="rounded-full border border-white/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/80 transition hover:bg-white/10"
              >
                {settings.promo.linkLabel}
              </Link>
            )}
          </div>
        </div>
      )}

      <div
        className="relative mx-auto max-w-6xl overflow-hidden rounded-[36px] bg-[#0b1220] text-white shadow-[0_40px_120px_rgba(10,20,40,0.45)]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="absolute inset-0">
          {activeSlideMemo.mediaType === "video" ? (
            <video
              key={activeSlideMemo.mediaUrl}
              src={activeSlideMemo.mediaUrl}
              className="h-full w-full object-cover"
              muted
              playsInline
              autoPlay
              loop
            />
          ) : (
            <Image
              key={activeSlideMemo.mediaUrl}
              src={activeSlideMemo.mediaUrl}
              alt={activeSlideMemo.title}
              fill
              className="object-cover"
              unoptimized
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.2),_transparent_60%)]" />
        </div>

        <div className="relative z-10 flex flex-col gap-6 px-8 py-16 md:px-14 md:py-20 lg:max-w-[70%]">
          {activeSlideMemo.badge && (
            <span className="w-fit rounded-full border border-white/30 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
              {activeSlideMemo.badge}
            </span>
          )}
          <h1 className="text-balance text-4xl font-semibold tracking-[-0.04em] md:text-6xl">
            {activeSlideMemo.title}
          </h1>
          {activeSlideMemo.subtitle && (
            <p className="max-w-xl text-base text-white/80 md:text-lg">
              {activeSlideMemo.subtitle}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            {activeSlideMemo.ctaLabel && activeSlideMemo.ctaHref && (
              <Link href={activeSlideMemo.ctaHref}>
                <Button variant="primary">{activeSlideMemo.ctaLabel}</Button>
              </Link>
            )}
            <Link href="/collection">
              <Button variant="ghost">View collection</Button>
            </Link>
          </div>
        </div>

        <div className="absolute bottom-6 right-6 flex items-center gap-2">
          <button
            disabled={!hasSlides}
            className="rounded-full border border-white/30 bg-black/40 px-3 py-2 text-sm text-white transition hover:bg-black/60"
            onClick={() => {
              if (!hasSlides) return;
              setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
            }}
          >
            Prev
          </button>
          <button
            disabled={!hasSlides}
            className="rounded-full border border-white/30 bg-white/90 px-3 py-2 text-sm text-black transition hover:bg-white"
            onClick={() => {
              if (!hasSlides) return;
              setActiveIndex((prev) => (prev + 1) % slides.length);
            }}
          >
            Next
          </button>
        </div>

        <div className="absolute bottom-6 left-8 flex items-center gap-2">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              className={`h-1.5 rounded-full transition ${
                index === safeIndex ? "w-10 bg-white" : "w-5 bg-white/50"
              }`}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>
      </div>

      {thumbSlides.length > 0 && (
        <div className="mx-auto max-w-6xl px-6 pb-2">
          <div className="grid gap-4 md:grid-cols-3">
            {thumbSlides.map((slide, index) => (
              <button
                key={slide.id}
                onClick={() => setActiveIndex(index)}
                className={`group relative overflow-hidden rounded-3xl border ${
                  index === safeIndex ? "border-black/40" : "border-black/10"
                } bg-white shadow-[0_20px_50px_rgba(15,23,42,0.12)] transition`}
              >
                {slide.mediaType === "video" ? (
                  <video
                    src={slide.mediaUrl}
                    className="h-40 w-full object-cover"
                    muted
                    playsInline
                    autoPlay
                    loop
                  />
                ) : (
                  <div className="relative h-40 w-full">
                    <Image src={slide.mediaUrl} alt={slide.title} fill className="object-cover" unoptimized />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute bottom-4 left-4 text-left text-white">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/70">
                    {slide.badge ?? "Highlight"}
                  </p>
                  <p className="text-sm font-semibold">{slide.title}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mx-auto grid max-w-6xl gap-6 px-6 lg:grid-cols-12">
        {settings.tiles.map((tile, index) => {
          const layout =
            index === 0
              ? "lg:col-span-7 lg:row-span-2 h-[420px]"
              : index === 3
              ? "lg:col-span-12 h-[320px]"
              : "lg:col-span-5 h-[200px]";
          const showFallbackArt = failedTileImages[tile.id] || !tile.imageUrl;
          const fallbackImage = tileFallbacks[index % tileFallbacks.length];

          return (
            <Link
              key={tile.id}
              href={tile.ctaHref || "/collection"}
              className={`group relative overflow-hidden rounded-3xl border border-black/5 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.12)] transition duration-300 hover:-translate-y-1 ${layout}`}
            >
              {showFallbackArt ? (
                <>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.28),_transparent_28%),linear-gradient(135deg,_#091224_0%,_#1f3c88_48%,_#f56b6b_100%)]" />
                  <div className="absolute -right-10 top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl transition duration-500 group-hover:scale-110" />
                  <div className="absolute left-8 top-8 h-24 w-24 animate-[float_6s_ease-in-out_infinite] rounded-[2rem] border border-white/20 bg-white/10 backdrop-blur-sm" />
                  <div className="absolute bottom-10 right-10 h-16 w-40 rotate-[-12deg] rounded-full border border-white/15 bg-black/10" />
                  <div className="absolute inset-x-6 top-6 flex items-center justify-between text-white/75">
                    <span className="rounded-full border border-white/20 px-3 py-1 text-[11px] uppercase tracking-[0.3em]">
                      {tile.tag ?? "Featured"}
                    </span>
                    <span className="text-xs uppercase tracking-[0.3em] text-white/60">
                      Curated
                    </span>
                  </div>
                </>
              ) : (
                <Image
                  src={tile.imageUrl}
                  alt={tile.title}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                  unoptimized
                  onError={() =>
                    setFailedTileImages((prev) => ({
                      ...prev,
                      [tile.id]: true,
                    }))
                  }
                />
              )}
              {showFallbackArt && (
                <div className="absolute inset-0 opacity-20 mix-blend-screen">
                  <Image src={fallbackImage} alt="" fill className="object-cover" unoptimized />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute inset-x-6 bottom-6 text-white">
                {tile.tag && (
                  <span className="mb-2 inline-flex rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-white/80">
                    {tile.tag}
                  </span>
                )}
                <h3 className="text-2xl font-semibold tracking-tight">{tile.title}</h3>
                {tile.subtitle && <p className="mt-1 text-sm text-white/80">{tile.subtitle}</p>}
                <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-white">
                  {tile.ctaLabel ?? "Shop"} <span aria-hidden="true">-&gt;</span>
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 px-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative overflow-hidden rounded-[32px] bg-[#0b1220] text-white shadow-[0_35px_80px_rgba(10,20,40,0.35)]">
          <Image
            src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1400&q=80"
            alt="Editorial highlight"
            fill
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />
          <div className="absolute inset-8 max-w-md space-y-4">
            <span className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-white/80">
              Editorial
            </span>
            <h3 className="text-3xl font-semibold leading-tight">
              Crafted to flex with your day.
            </h3>
            <p className="text-sm text-white/80">
              The core drop blends responsive cushioning with clean lines to match every outfit.
            </p>
            <div className="flex gap-3">
              <Link href="/collection">
                <Button variant="primary">Shop the edit</Button>
              </Link>
              <Link href="/collection">
                <Button variant="ghost">View all</Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <p className="pill mb-3 inline-flex">Lookbook</p>
            <h3 className="text-2xl font-semibold text-gray-900">Style in motion</h3>
            <p className="mt-1 text-sm text-gray-600">
              A curated mix of everyday fits and bold silhouettes.
            </p>
          </div>
          <div className="space-y-4">
            {lookbook.map((look) => (
              <div
                key={look.id}
                className="group flex items-center gap-4 rounded-3xl border border-black/10 bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.1)]"
              >
                <div className="relative h-20 w-20 overflow-hidden rounded-2xl">
                  <Image src={look.image} alt={look.title} fill className="object-cover" unoptimized />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{look.title}</p>
                  <p className="text-xs text-gray-600">{look.caption}</p>
                </div>
                <span className="text-sm text-gray-500 transition group-hover:text-gray-900">-&gt;</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33%);
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </section>
  );
}
