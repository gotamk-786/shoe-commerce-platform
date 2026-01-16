import { Router } from "express";
import { z } from "zod";
import prisma from "../prisma";
import { requireUser } from "../middleware/jwt-auth";
import { logActivity } from "../lib/activity";

const router = Router();

const preferenceSchema = z.object({
  sizeUS: z.string().optional(),
  sizeEU: z.string().optional(),
  brands: z.array(z.string()).optional(),
});

router.get("/", requireUser, async (req, res, next) => {
  try {
    const pref = await prisma.userPreference.findUnique({
      where: { userId: req.user!.id },
    });
    return res.json(pref ?? { sizeUS: "", sizeEU: "", brands: [] });
  } catch (error) {
    return next(error);
  }
});

router.patch("/", requireUser, async (req, res, next) => {
  try {
    const payload = preferenceSchema.parse(req.body);
    const pref = await prisma.userPreference.upsert({
      where: { userId: req.user!.id },
      update: {
        sizeUS: payload.sizeUS,
        sizeEU: payload.sizeEU,
        brands: payload.brands ?? [],
      },
      create: {
        userId: req.user!.id,
        sizeUS: payload.sizeUS,
        sizeEU: payload.sizeEU,
        brands: payload.brands ?? [],
      },
    });
    await logActivity(req.user!.id, "preferences", "Preferences updated");
    return res.json(pref);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.flatten() });
    }
    return next(error);
  }
});

export default router;
