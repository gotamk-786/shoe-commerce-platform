import { Router } from "express";
import { z } from "zod";
import prisma from "../prisma";
import { requireUser } from "../middleware/jwt-auth";
import { logActivity } from "../lib/activity";

const router = Router();

const ticketSchema = z.object({
  subject: z.string().min(3),
  message: z.string().min(5),
});

router.get("/", requireUser, async (req, res, next) => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ data: tickets });
  } catch (error) {
    return next(error);
  }
});

router.post("/", requireUser, async (req, res, next) => {
  try {
    const payload = ticketSchema.parse(req.body);
    const ticket = await prisma.supportTicket.create({
      data: {
        userId: req.user!.id,
        subject: payload.subject,
        message: payload.message,
      },
    });
    await logActivity(req.user!.id, "support", `Support ticket created ${ticket.id}`);
    return res.status(201).json(ticket);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.flatten() });
    }
    return next(error);
  }
});

export default router;
