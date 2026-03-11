import { Router } from "express";
import { z } from "zod";
import prisma from "../prisma";
import { requireUser } from "../middleware/jwt-auth";
import { logActivity } from "../lib/activity";

const router = Router();

const addressSchema = z.object({
  label: z.string().optional(),
  fullName: z.string().min(1).optional(),
  fullAddress: z.string().min(1).optional(),
  houseNo: z.string().optional(),
  street: z.string().min(1),
  landmark: z.string().optional(),
  area: z.string().optional(),
  city: z.string().min(1),
  state: z.string().optional().default(""),
  zip: z.string().optional().default(""),
  postalCode: z.string().optional(),
  country: z.string().min(1),
  phone: z.string().min(6),
  lat: z.number().optional(),
  lng: z.number().optional(),
  placeId: z.string().optional(),
  deliveryNotes: z.string().optional(),
  isDefault: z.boolean().optional(),
});

const normalizeCreatePayload = (payload: z.infer<typeof addressSchema>) => ({
  ...payload,
  fullAddress:
    payload.fullAddress ||
    [payload.houseNo, payload.street, payload.area, payload.city, payload.state, payload.postalCode || payload.zip, payload.country]
      .filter(Boolean)
      .join(", "),
  postalCode: payload.postalCode || payload.zip,
  zip: payload.zip || payload.postalCode || "",
  state: payload.state || "",
});

const normalizeUpdatePayload = (payload: Partial<z.infer<typeof addressSchema>>) => ({
  ...payload,
  ...(payload.postalCode !== undefined && payload.zip === undefined
    ? { zip: payload.postalCode }
    : {}),
  ...(payload.zip !== undefined && payload.postalCode === undefined
    ? { postalCode: payload.zip }
    : {}),
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
    const payload = normalizeCreatePayload(addressSchema.parse(req.body));
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
    const payload = normalizeUpdatePayload(addressSchema.partial().parse(req.body));
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

router.post("/:id/default", requireUser, async (req, res, next) => {
  try {
    await prisma.address.updateMany({
      where: { userId: req.user!.id },
      data: { isDefault: false },
    });

    const address = await prisma.address.update({
      where: { id: req.params.id },
      data: { isDefault: true },
    });

    await logActivity(req.user!.id, "address", "Default address updated");
    return res.json(address);
  } catch (error) {
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
