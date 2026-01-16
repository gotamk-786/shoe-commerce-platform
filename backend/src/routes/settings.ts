import { Router } from "express";
import { z } from "zod";
import prisma from "../prisma";
import { requireAdmin } from "../middleware/auth";

const router = Router();

const paymentSchema = z.object({
  paymentRequired: z.boolean(),
  allowCod: z.boolean(),
  allowDummy: z.boolean(),
});

const marketingSlideSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().optional().nullable(),
  badge: z.string().optional().nullable(),
  ctaLabel: z.string().optional().nullable(),
  ctaHref: z.string().optional().nullable(),
  mediaType: z.enum(["image", "video"]),
  mediaUrl: z.string().url(),
});

const marketingTileSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().optional().nullable(),
  tag: z.string().optional().nullable(),
  ctaLabel: z.string().optional().nullable(),
  ctaHref: z.string().optional().nullable(),
  imageUrl: z.string().url(),
});

const marketingSchema = z.object({
  promo: z.object({
    enabled: z.boolean(),
    text: z.string().min(1),
    linkLabel: z.string().optional().nullable(),
    linkHref: z.string().optional().nullable(),
  }),
  hero: z.object({
    autoplayMs: z.number().int().min(2000).max(15000),
    slides: z.array(marketingSlideSchema).min(1).max(6),
  }),
  tiles: z.array(marketingTileSchema).length(4),
});

const defaultMarketing = {
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

const getSetting = async (key: string, fallback: string) => {
  const entry = await prisma.appSetting.findUnique({ where: { key } });
  return entry ? entry.value : fallback;
};

const setSetting = async (key: string, value: string) => {
  await prisma.appSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
};

router.get("/payment", async (_req, res, next) => {
  try {
    const paymentRequired = (await getSetting("paymentRequired", "false")) === "true";
    const allowCod = (await getSetting("allowCod", "true")) === "true";
    const allowDummy = (await getSetting("allowDummy", "true")) === "true";
    return res.json({ paymentRequired, allowCod, allowDummy });
  } catch (error) {
    return next(error);
  }
});

router.patch("/payment", requireAdmin, async (req, res, next) => {
  try {
    const payload = paymentSchema.parse(req.body);
    await Promise.all([
      setSetting("paymentRequired", String(payload.paymentRequired)),
      setSetting("allowCod", String(payload.allowCod)),
      setSetting("allowDummy", String(payload.allowDummy)),
    ]);
    return res.json(payload);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.flatten() });
    }
    return next(error);
  }
});

router.get("/marketing", async (_req, res, next) => {
  try {
    const raw = await getSetting("marketingHome", "");
    if (!raw) {
      return res.json(defaultMarketing);
    }
    const parsed = JSON.parse(raw);
    return res.json(marketingSchema.parse(parsed));
  } catch (error) {
    return next(error);
  }
});

router.patch("/marketing", requireAdmin, async (req, res, next) => {
  try {
    const payload = marketingSchema.parse(req.body);
    await setSetting("marketingHome", JSON.stringify(payload));
    return res.json(payload);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.flatten() });
    }
    return next(error);
  }
});

export default router;
