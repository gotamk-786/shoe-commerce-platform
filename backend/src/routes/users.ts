import { Router } from "express";
import { z } from "zod";
import prisma from "../prisma";
import { requireUser } from "../middleware/jwt-auth";

const router = Router();

router.get("/me", requireUser, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user?.id } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl ?? undefined,
      coverUrl: user.coverUrl ?? undefined,
      twoFactorEnabled: user.twoFactorEnabled,
      twoFactorMethod: user.twoFactorMethod ?? undefined,
    });
  } catch (error) {
    return next(error);
  }
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  avatarUrl: z.string().url().optional(),
  coverUrl: z.string().url().optional(),
});

router.patch("/me", requireUser, async (req, res, next) => {
  try {
    const payload = updateSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.user?.id },
      data: { name: payload.name, avatarUrl: payload.avatarUrl, coverUrl: payload.coverUrl },
    });

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl ?? undefined,
      coverUrl: user.coverUrl ?? undefined,
      twoFactorEnabled: user.twoFactorEnabled,
      twoFactorMethod: user.twoFactorMethod ?? undefined,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.flatten() });
    }
    return next(error);
  }
});

export default router;
