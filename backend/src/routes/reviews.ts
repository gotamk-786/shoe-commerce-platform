import { Router } from "express";
import { z } from "zod";
import prisma from "../prisma";
import { requireUser } from "../middleware/jwt-auth";
import { logActivity } from "../lib/activity";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const productId = req.query.productId ? String(req.query.productId) : undefined;
    if (!productId) {
      return res.status(400).json({ message: "productId is required" });
    }

    const reviews = await prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } },
    });

    const average =
      reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : 0;

    return res.json({
      average,
      count: reviews.length,
      data: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        user: { name: review.user.name },
      })),
    });
  } catch (error) {
    return next(error);
  }
});

const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

router.post("/", requireUser, async (req, res, next) => {
  try {
    const payload = reviewSchema.parse(req.body);
    const review = await prisma.review.upsert({
      where: { userId_productId: { userId: req.user!.id, productId: payload.productId } },
      update: { rating: payload.rating, comment: payload.comment },
      create: {
        userId: req.user!.id,
        productId: payload.productId,
        rating: payload.rating,
        comment: payload.comment,
      },
    });

    await logActivity(req.user!.id, "review", `Review posted for ${payload.productId}`);

    return res.status(201).json(review);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.flatten() });
    }
    return next(error);
  }
});

export default router;
