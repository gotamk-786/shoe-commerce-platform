"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import SectionHeading from "@/components/ui/section-heading";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import {
  adminUploadAsset,
  fetchMarketingSettings,
  handleApiError,
  updateMarketingSettings,
} from "@/lib/api";
import { MarketingSettings } from "@/lib/types";

const createId = () => `mk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

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
        "https://images.unsplash.com/photo-1518544887878-4f6d9b5c0cb3?auto=format&fit=crop&w=1200&q=80",
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

export default function AdminMarketingPage() {
  const [settings, setSettings] = useState<MarketingSettings | null>(null);
  const [status, setStatus] = useState<{ loading: boolean; error?: string; saved?: boolean }>({
    loading: false,
  });
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  useEffect(() => {
    fetchMarketingSettings()
      .then((data) => setSettings(data))
      .catch(() => setSettings(fallbackSettings));
  }, []);

  const slides = settings?.hero.slides ?? [];
  const tiles = settings?.tiles ?? [];

  const updateSlide = (index: number, next: Partial<MarketingSettings["hero"]["slides"][number]>) =>
    setSettings((prev) => {
      if (!prev) return prev;
      const updated = [...prev.hero.slides];
      updated[index] = { ...updated[index], ...next };
      return { ...prev, hero: { ...prev.hero, slides: updated } };
    });

  const updateTile = (index: number, next: Partial<MarketingSettings["tiles"][number]>) =>
    setSettings((prev) => {
      if (!prev) return prev;
      const updated = [...prev.tiles];
      updated[index] = { ...updated[index], ...next };
      return { ...prev, tiles: updated };
    });

  const handleUpload = async (
    file: File,
    target: "slide" | "tile",
    index: number,
  ) => {
    try {
      setUploadingKey(`${target}-${index}`);
      const { url } = await adminUploadAsset(file);
      if (target === "slide") {
        updateSlide(index, { mediaUrl: url, mediaType: file.type.startsWith("video/") ? "video" : "image" });
      } else {
        updateTile(index, { imageUrl: url });
      }
    } catch (error) {
      setStatus({ loading: false, error: handleApiError(error) });
    } finally {
      setUploadingKey(null);
    }
  };

  const canAddSlide = slides.length < 5;

  const missingSettings = useMemo(() => settings === null, [settings]);

  if (missingSettings) {
    return (
      <div className="space-y-6 text-white">
        <SectionHeading tone="dark"
          eyebrow="Marketing"
          title="Homepage storytelling"
          description="Load marketing settings..."
        />
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">Loading…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white">
      <SectionHeading tone="dark"
        eyebrow="Marketing"
        title="Homepage storytelling"
        description="Manage hero, promo strip, and campaign tiles."
      />

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
        <p className="text-sm font-semibold">Promo strip</p>
        <div className="mt-4 grid gap-4 md:grid-cols-[140px_1fr_1fr]">
          <label className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/80">
            <span>Enabled</span>
            <input
              type="checkbox"
              checked={settings?.promo.enabled}
              onChange={(e) =>
                setSettings((prev) =>
                  prev ? { ...prev, promo: { ...prev.promo, enabled: e.target.checked } } : prev,
                )
              }
            />
          </label>
          <Input
            label="Text"
            value={settings?.promo.text ?? ""}
            onChange={(e) =>
              setSettings((prev) =>
                prev ? { ...prev, promo: { ...prev.promo, text: e.target.value } } : prev,
              )
            }
          />
          <Input
            label="Link label"
            value={settings?.promo.linkLabel ?? ""}
            onChange={(e) =>
              setSettings((prev) =>
                prev ? { ...prev, promo: { ...prev.promo, linkLabel: e.target.value } } : prev,
              )
            }
          />
          <Input
            label="Link href"
            value={settings?.promo.linkHref ?? ""}
            onChange={(e) =>
              setSettings((prev) =>
                prev ? { ...prev, promo: { ...prev.promo, linkHref: e.target.value } } : prev,
              )
            }
          />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold">Hero carousel</p>
          <div className="flex items-center gap-3">
            <Input
              label="Autoplay (ms)"
              type="number"
              min={2000}
              max={15000}
              value={settings?.hero.autoplayMs ?? 6000}
              onChange={(e) =>
                setSettings((prev) =>
                  prev
                    ? { ...prev, hero: { ...prev.hero, autoplayMs: Number(e.target.value) || 6000 } }
                    : prev,
                )
              }
              className="w-40"
            />
            <Button
              variant="ghost"
              disabled={!canAddSlide}
              onClick={() =>
                setSettings((prev) =>
                  prev
                    ? {
                        ...prev,
                        hero: {
                          ...prev.hero,
                          slides: [
                            ...prev.hero.slides,
                            {
                              id: createId(),
                              title: "New drop",
                              subtitle: "Add a new slide description here.",
                              badge: "Featured",
                              ctaLabel: "Shop now",
                              ctaHref: "/collection",
                              mediaType: "image",
                              mediaUrl:
                                "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1600&q=80",
                            },
                          ],
                        },
                      }
                    : prev,
                )
              }
            >
              Add slide
            </Button>
          </div>
        </div>

        <div className="mt-4 space-y-6">
          {slides.map((slide, index) => (
            <div key={slide.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
                <div className="space-y-3">
                  <Input
                    label="Badge"
                    value={slide.badge ?? ""}
                    onChange={(e) => updateSlide(index, { badge: e.target.value })}
                  />
                  <Input
                    label="Title"
                    value={slide.title}
                    onChange={(e) => updateSlide(index, { title: e.target.value })}
                  />
                  <label className="flex w-full flex-col gap-2 text-sm text-gray-200">
                    <span className="text-sm font-medium text-white">Subtitle</span>
                    <textarea
                      className="min-h-[90px] rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white shadow-[0_12px_40px_rgba(0,0,0,0.2)] outline-none"
                      value={slide.subtitle ?? ""}
                      onChange={(e) => updateSlide(index, { subtitle: e.target.value })}
                    />
                  </label>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input
                      label="CTA label"
                      value={slide.ctaLabel ?? ""}
                      onChange={(e) => updateSlide(index, { ctaLabel: e.target.value })}
                    />
                    <Input
                      label="CTA href"
                      value={slide.ctaHref ?? ""}
                      onChange={(e) => updateSlide(index, { ctaHref: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-medium">Media</p>
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                    {slide.mediaType === "video" ? (
                      <video
                        src={slide.mediaUrl}
                        className="h-48 w-full object-cover"
                        muted
                        playsInline
                        autoPlay
                        loop
                      />
                    ) : (
                      <div className="relative h-48 w-full">
                        <Image src={slide.mediaUrl} alt={slide.title} fill className="object-cover" unoptimized />
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        void handleUpload(file, "slide", index);
                      }
                    }}
                  />
                  {uploadingKey === `slide-${index}` && (
                    <p className="text-xs text-white/70">Uploading...</p>
                  )}
                  <div className="flex flex-wrap gap-2 text-xs text-white/70">
                    <span>Type: {slide.mediaType}</span>
                    <span>•</span>
                    <span>Recommended: 1600x900</span>
                  </div>
                </div>
              </div>
              {slides.length > 1 && (
                <div className="mt-3 flex justify-end">
                  <Button
                    variant="ghost"
                    onClick={() =>
                      setSettings((prev) => {
                        if (!prev) return prev;
                        const updated = prev.hero.slides.filter((_, idx) => idx !== index);
                        return { ...prev, hero: { ...prev.hero, slides: updated } };
                      })
                    }
                  >
                    Remove slide
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
        <p className="text-sm font-semibold">Campaign tiles (2x2)</p>
        <div className="mt-4 grid gap-5 md:grid-cols-2">
          {tiles.map((tile, index) => (
            <div key={tile.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="space-y-3">
                <Input
                  label="Tag"
                  value={tile.tag ?? ""}
                  onChange={(e) => updateTile(index, { tag: e.target.value })}
                />
                <Input
                  label="Title"
                  value={tile.title}
                  onChange={(e) => updateTile(index, { title: e.target.value })}
                />
                <Input
                  label="Subtitle"
                  value={tile.subtitle ?? ""}
                  onChange={(e) => updateTile(index, { subtitle: e.target.value })}
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    label="CTA label"
                    value={tile.ctaLabel ?? ""}
                    onChange={(e) => updateTile(index, { ctaLabel: e.target.value })}
                  />
                  <Input
                    label="CTA href"
                    value={tile.ctaHref ?? ""}
                    onChange={(e) => updateTile(index, { ctaHref: e.target.value })}
                  />
                </div>
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                  <div className="relative h-40 w-full">
                    <Image src={tile.imageUrl} alt={tile.title} fill className="object-cover" unoptimized />
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      void handleUpload(file, "tile", index);
                    }
                  }}
                />
                {uploadingKey === `tile-${index}` && (
                  <p className="text-xs text-white/70">Uploading...</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-white/70">
          {status.error ? <span className="text-rose-300">{status.error}</span> : null}
          {status.saved ? <span className="text-emerald-300">Saved.</span> : null}
        </div>
        <Button
          variant="primary"
          disabled={status.loading}
          onClick={async () => {
            try {
              if (!settings) return;
              setStatus({ loading: true });
              await updateMarketingSettings(settings);
              setStatus({ loading: false, saved: true });
            } catch (error) {
              setStatus({ loading: false, error: handleApiError(error) });
            }
          }}
        >
          {status.loading ? "Saving..." : "Save marketing"}
        </Button>
      </div>
    </div>
  );
}

