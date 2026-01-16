import { Router } from "express";
import { z } from "zod";
import prisma from "../prisma";
import { requireUser } from "../middleware/jwt-auth";
import { logActivity } from "../lib/activity";

const router = Router();

const returnSchema = z.object({
  orderId: z.string().min(1),
  reason: z.string().min(5),
});

const getReturnWindowDays = () => Number(process.env.RETURN_WINDOW_DAYS ?? 14);

router.get("/", requireUser, async (req, res, next) => {
  try {
    const items = await prisma.returnRequest.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ data: items });
  } catch (error) {
    return next(error);
  }
});

router.post("/", requireUser, async (req, res, next) => {
  try {
    const payload = returnSchema.parse(req.body);
    const order = await prisma.order.findFirst({
      where: { id: payload.orderId, userId: req.user!.id },
    });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    const windowDays = getReturnWindowDays();
    const deadline = new Date(order.placedAt.getTime() + windowDays * 24 * 60 * 60 * 1000);
    if (new Date() > deadline) {
      return res.status(400).json({ message: "Return window expired" });
    }
    const request = await prisma.returnRequest.create({
      data: {
        userId: req.user!.id,
        orderId: payload.orderId,
        reason: payload.reason,
      },
    });
    await logActivity(req.user!.id, "returns", `Return requested ${request.id}`);
    return res.status(201).json(request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.flatten() });
    }
    return next(error);
  }
});

export default router;
