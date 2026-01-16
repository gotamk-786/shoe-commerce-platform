import { Router } from "express";
import prisma from "../prisma";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
    return res.json({ data: categories });
  } catch (error) {
    return next(error);
  }
});

export default router;
