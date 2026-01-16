import { Router } from "express";
import { z } from "zod";
import prisma from "../prisma";
import { requireUser } from "../middleware/jwt-auth";
import { logActivity } from "../lib/activity";

const router = Router();

const addressSchema = z.object({
  label: z.string().optional(),
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().min(1),
  country: z.string().min(1),
  phone: z.string().min(6),
  isDefault: z.boolean().optional(),
});

router.get("/", requireUser, async (req, res, next) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ data: addresses });
  } catch (error) {
    return next(error);
  }
});

router.post("/", requireUser, async (req, res, next) => {
  try {
    const payload = addressSchema.parse(req.body);
    if (payload.isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user!.id },
        data: { isDefault: false },
      });
    }
    const address = await prisma.address.create({
      data: {
        ...payload,
        userId: req.user!.id,
        isDefault: payload.isDefault ?? false,
      },
    });
    await logActivity(req.user!.id, "address", "Address added");
    return res.status(201).json(address);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.flatten() });
    }
    return next(error);
  }
});

router.patch("/:id", requireUser, async (req, res, next) => {
  try {
    const payload = addressSchema.partial().parse(req.body);
    if (payload.isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user!.id },
        data: { isDefault: false },
      });
    }
    const address = await prisma.address.update({
      where: { id: req.params.id },
      data: payload,
    });
    await logActivity(req.user!.id, "address", "Address updated");
    return res.json(address);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.flatten() });
    }
    return next(error);
  }
});

router.delete("/:id", requireUser, async (req, res, next) => {
  try {
    await prisma.address.delete({ where: { id: req.params.id } });
    await logActivity(req.user!.id, "address", "Address deleted");
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

export default router;
