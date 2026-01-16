import { Router } from "express";
import { z } from "zod";
import prisma from "../prisma";
import { requireUser, hashPassword, verifyPassword } from "../middleware/jwt-auth";
import { sendMail } from "../lib/mailer";
import { logActivity } from "../lib/activity";

const router = Router();

const verifySchema = z.object({
  code: z.string().min(6).max(6),
});

router.post("/request", requireUser, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const code = `${Math.floor(100000 + Math.random() * 900000)}`;
    const codeHash = await hashPassword(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.twoFactorToken.create({
      data: { userId: user.id, codeHash, expiresAt },
    });

    await sendMail(
      [user.email],
      "Your security code",
      `<p>Your one-time code is <strong>${code}</strong>. It expires in 10 minutes.</p>`,
    );

    await logActivity(user.id, "security", "2FA code requested");

    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

router.post("/verify", requireUser, async (req, res, next) => {
  try {
    const payload = verifySchema.parse(req.body);
    const token = await prisma.twoFactorToken.findFirst({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
    });

    if (!token || token.expiresAt < new Date()) {
      return res.status(400).json({ message: "Code expired. Request a new one." });
    }

    const ok = await verifyPassword(payload.code, token.codeHash);
    if (!ok) {
      return res.status(400).json({ message: "Invalid code." });
    }

    await prisma.user.update({
      where: { id: req.user!.id },
      data: { twoFactorEnabled: true, twoFactorMethod: "email" },
    });

    await prisma.twoFactorToken.deleteMany({ where: { userId: req.user!.id } });
    await logActivity(req.user!.id, "security", "2FA enabled");

    return res.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.flatten() });
    }
    return next(error);
  }
});

router.post("/disable", requireUser, async (req, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { twoFactorEnabled: false, twoFactorMethod: null },
    });
    await logActivity(req.user!.id, "security", "2FA disabled");
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

export default router;
