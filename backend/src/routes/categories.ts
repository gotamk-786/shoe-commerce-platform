import { Router } from "express";
import prisma from "../prisma";
import { getCachedResponse, setCachedResponse } from "../lib/response-cache";

const router = Router();
const CATEGORIES_CACHE_KEY = "categories:all";
const CATEGORIES_TTL_MS = 5 * 60 * 1000;

router.get("/", async (_req, res, next) => {
  try {
    res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=900");
    const cached = getCachedResponse<{ data: unknown[] }>(CATEGORIES_CACHE_KEY);
    if (cached) {
      return res.json(cached);
    }

    const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
    const payload = { data: categories };
    setCachedResponse(CATEGORIES_CACHE_KEY, payload, CATEGORIES_TTL_MS);
    return res.json(payload);
  } catch (error) {
    return next(error);
  }
});

export default router;
