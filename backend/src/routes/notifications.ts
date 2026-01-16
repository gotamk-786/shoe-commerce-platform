import { Router } from "express";
import { z } from "zod";
import prisma from "../prisma";
import { requireUser } from "../middleware/jwt-auth";
import { logActivity } from "../lib/activity";

const router = Router();

const notificationSchema = z.object({
  emailEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  phone: z.string().optional(),
});

router.get("/", requireUser, async (req, res, next) => {
  try {
    const pref = await prisma.notificationPreference.findUnique({
      where: { userId: req.user!.id },
    });
    return res.json(
      pref
        ? {
            emailEnabled: pref.emailEnabled,
            smsEnabled: pref.smsEnabled,
            phone: pref.phone ?? "",
          }
        : { emailEnabled: true, smsEnabled: false, phone: "" },
    );
  } catch (error) {
    return next(error);
  }
});

router.patch("/", requireUser, async (req, res, next) => {
  try {
    const payload = notificationSchema.parse(req.body);
    const pref = await prisma.notificationPreference.upsert({
      where: { userId: req.user!.id },
      update: payload,
      create: {
        userId: req.user!.id,
        emailEnabled: payload.emailEnabled ?? true,
        smsEnabled: payload.smsEnabled ?? false,
        phone: payload.phone,
      },
    });
    await logActivity(req.user!.id, "notifications", "Notification preferences updated");
    return res.json({
      emailEnabled: pref.emailEnabled,
      smsEnabled: pref.smsEnabled,
      phone: pref.phone ?? "",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.flatten() });
    }
    return next(error);
  }
});

export default router;
