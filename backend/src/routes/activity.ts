import { Router } from "express";
import prisma from "../prisma";
import { requireUser } from "../middleware/jwt-auth";

const router = Router();

router.get("/", requireUser, async (req, res, next) => {
  try {
    const logs = await prisma.activityLog.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return res.json({ data: logs });
  } catch (error) {
    return next(error);
  }
});

export default router;
