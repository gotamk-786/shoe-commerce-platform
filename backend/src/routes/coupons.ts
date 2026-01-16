import { Router } from "express";
import { z } from "zod";
import prisma from "../prisma";
import { requireAdmin } from "../middleware/auth";

const router = Router();

router.get("/validate", async (req, res, next) => {
  try {
    const code = req.query.code ? String(req.query.code).toUpperCase() : "";
    const subtotal = req.query.subtotal ? Number(req.query.subtotal) : 0;

    if (!code) {
      return res.status(400).json({ message: "Coupon code is required" });
    }

    const coupon = await prisma.coupon.findUnique({ where: { code } });
    if (!coupon || !coupon.active) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return res.status(400).json({ message: "Coupon expired" });
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ message: "Coupon limit reached" });
    }

    const discount = coupon.type === "percent"
      ? Math.floor(subtotal * (coupon.value / 100))
      : coupon.value;

    return res.json({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discount: Math.min(discount, subtotal),
    });
  } catch (error) {
    return next(error);
  }
});

const createSchema = z.object({
  code: z.string().min(2),
  type: z.enum(["percent", "flat"]),
  value: z.number().int().positive(),
  usageLimit: z.number().int().positive().optional(),
  expiresAt: z.string().datetime().optional(),
  active: z.boolean().optional(),
});

router.post("/", requireAdmin, async (req, res, next) => {
  try {
    const payload = createSchema.parse(req.body);
    const coupon = await prisma.coupon.create({
      data: {
        code: payload.code.toUpperCase(),
        type: payload.type,
        value: payload.value,
        usageLimit: payload.usageLimit,
        expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : undefined,
        active: payload.active ?? true,
      },
    });
    return res.status(201).json(coupon);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.flatten() });
    }
    return next(error);
  }
});

router.get("/", requireAdmin, async (_req, res, next) => {
  try {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
    return res.json({ data: coupons });
  } catch (error) {
    return next(error);
  }
});

router.patch("/:id", requireAdmin, async (req, res, next) => {
  try {
    const payload = createSchema.partial().parse(req.body);
    const coupon = await prisma.coupon.update({
      where: { id: req.params.id },
      data: {
        code: payload.code ? payload.code.toUpperCase() : undefined,
        type: payload.type,
        value: payload.value,
        usageLimit: payload.usageLimit,
        expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : undefined,
        active: payload.active,
      },
    });
    return res.json(coupon);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.flatten() });
    }
    return next(error);
  }
});

router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    await prisma.coupon.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

export default router;
