import { Router } from "express";
import { Webhook } from "svix";

const router = Router();

router.post("/clerk", (req, res) => {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return res.status(500).json({ message: "Webhook secret not configured" });
  }

  const payload = req.body;
  const headers = req.headers;

  const svixHeaders = {
    "svix-id": headers["svix-id"] as string,
    "svix-timestamp": headers["svix-timestamp"] as string,
    "svix-signature": headers["svix-signature"] as string,
  };

  try {
    const wh = new Webhook(secret);
    const event = wh.verify(payload.toString(), svixHeaders) as {
      type: string;
      data: Record<string, unknown>;
    };

    // Handle Clerk events if needed, e.g., sync roles or users to your DB.
    console.log(`Clerk webhook received: ${event.type}`);

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook verification failed", error);
    return res.status(400).json({ message: "Invalid signature" });
  }
});

export default router;
