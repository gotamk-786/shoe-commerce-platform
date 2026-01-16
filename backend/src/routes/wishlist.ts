import { Router } from "express";
import crypto from "crypto";
import prisma from "../prisma";
import { requireUser } from "../middleware/jwt-auth";

const router = Router();

router.get("/share/:token", async (req, res, next) => {
  try {
    const token = req.params.token;
    const share = await prisma.wishlistShare.findUnique({ where: { token } });
    if (!share) {
      return res.status(404).json({ message: "Share link not found" });
    }

    const items = await prisma.wishlistItem.findMany({
      where: { userId: share.userId },
      include: { product: true },
      orderBy: { createdAt: "desc" },
    });

    return res.json({
      ownerId: share.userId,
      data: items.map((item) => ({
        id: item.id,
        productId: item.productId,
        product: item.product,
      })),
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/", requireUser, async (req, res, next) => {
  try {
    const items = await prisma.wishlistItem.findMany({
      where: { userId: req.user!.id },
      include: { product: true },
      orderBy: { createdAt: "desc" },
    });

    return res.json({
      data: items.map((item) => ({
        id: item.id,
        productId: item.productId,
        product: item.product,
      })),
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/", requireUser, async (req, res, next) => {
  try {
    const productId = req.body?.productId as string | undefined;
    if (!productId) {
      return res.status(400).json({ message: "productId is required" });
    }

    const item = await prisma.wishlistItem.upsert({
      where: { userId_productId: { userId: req.user!.id, productId } },
      update: {},
      create: { userId: req.user!.id, productId },
    });

    return res.status(201).json(item);
  } catch (error) {
    return next(error);
  }
});

router.post("/share", requireUser, async (req, res, next) => {
  try {
    const token = crypto.randomBytes(16).toString("hex");
    const share = await prisma.wishlistShare.create({
      data: { userId: req.user!.id, token },
    });
    return res.status(201).json({ token: share.token });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:productId", requireUser, async (req, res, next) => {
  try {
    const productId = req.params.productId;
    await prisma.wishlistItem.delete({
      where: { userId_productId: { userId: req.user!.id, productId } },
    });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

export default router;
