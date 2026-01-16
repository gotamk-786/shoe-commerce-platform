import { Router } from "express";
import { z } from "zod";
import prisma from "../prisma";
import { requireUser } from "../middleware/jwt-auth";
import { logActivity } from "../lib/activity";

const router = Router();

const paymentSchema = z.object({
  provider: z.string().min(1),
  label: z.string().min(1),
  maskedNumber: z.string().min(4),
  isDefault: z.boolean().optional(),
});

router.get("/", requireUser, async (req, res, next) => {
  try {
    const methods = await prisma.paymentMethod.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ data: methods });
  } catch (error) {
    return next(error);
  }
});

router.post("/", requireUser, async (req, res, next) => {
  try {
    const payload = paymentSchema.parse(req.body);
    if (payload.isDefault) {
      await prisma.paymentMethod.updateMany({
        where: { userId: req.user!.id },
        data: { isDefault: false },
      });
    }
    const method = await prisma.paymentMethod.create({
      data: {
        ...payload,
        userId: req.user!.id,
        isDefault: payload.isDefault ?? false,
      },
    });
    await logActivity(req.user!.id, "payment", "Payment method added");
    return res.status(201).json(method);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.flatten() });
    }
    return next(error);
  }
});

router.patch("/:id", requireUser, async (req, res, next) => {
  try {
    const payload = paymentSchema.partial().parse(req.body);
    if (payload.isDefault) {
      await prisma.paymentMethod.updateMany({
        where: { userId: req.user!.id },
        data: { isDefault: false },
      });
    }
    const method = await prisma.paymentMethod.update({
      where: { id: req.params.id },
      data: payload,
    });
    await logActivity(req.user!.id, "payment", "Payment method updated");
    return res.json(method);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.flatten() });
    }
    return next(error);
  }
});

router.delete("/:id", requireUser, async (req, res, next) => {
  try {
    await prisma.paymentMethod.delete({ where: { id: req.params.id } });
    await logActivity(req.user!.id, "payment", "Payment method deleted");
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

export default router;
