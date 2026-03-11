import "dotenv/config";
import express from "express";
import cors from "cors";
import { ClerkExpressWithAuth } from "@clerk/clerk-sdk-node";
import productsRouter from "./routes/products";
import ordersRouter from "./routes/orders";
import adminRouter from "./routes/admin";
import webhooksRouter from "./routes/webhooks";
import authRouter from "./routes/auth";
import usersRouter from "./routes/users";
import categoriesRouter from "./routes/categories";
import uploadsRouter from "./routes/uploads";
import userUploadsRouter from "./routes/user-uploads";
import reviewsRouter from "./routes/reviews";
import wishlistRouter from "./routes/wishlist";
import couponsRouter from "./routes/coupons";
import addressesRouter from "./routes/addresses";
import paymentMethodsRouter from "./routes/payment-methods";
import notificationsRouter from "./routes/notifications";
import settingsRouter from "./routes/settings";
import preferencesRouter from "./routes/preferences";
import ticketsRouter from "./routes/tickets";
import returnsRouter from "./routes/returns";
import activityRouter from "./routes/activity";
import twofactorRouter from "./routes/twofactor";
import deliveryRouter from "./routes/delivery";

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN?.split(",") ?? ["http://localhost:3000"])
  .map((origin) => origin.trim())
  .filter(Boolean);

const isAllowedOrigin = (origin: string) => {
  if (allowedOrigins.includes(origin)) return true;
  try {
    const { hostname, protocol } = new URL(origin);
    // Allow Vercel preview/production domains without editing env on every deploy URL.
    if (hostname.endsWith(".vercel.app")) return true;
    // Allow local dev.
    if (origin.startsWith("http://localhost")) return true;
    // Allow custom HTTPS frontend domains by default.
    return protocol === "https:";
  } catch {
    return false;
  }
};

app.use(
  cors({
    origin: (origin, callback) => {
      // Non-browser/server-side requests may not send Origin.
      if (!origin) return callback(null, true);
      return callback(null, isAllowedOrigin(origin));
    },
    credentials: true,
  }),
);

// Webhooks need the raw body for signature validation.
app.use("/webhooks", express.raw({ type: "application/json" }));

app.use(express.json());

// Attach Clerk auth context to requests when available.
if (process.env.CLERK_SECRET_KEY) {
  app.use(ClerkExpressWithAuth());
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/products", productsRouter);
app.use("/categories", categoriesRouter);
app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/users/addresses", addressesRouter);
app.use("/users/payment-methods", paymentMethodsRouter);
app.use("/users/notifications", notificationsRouter);
app.use("/users/preferences", preferencesRouter);
app.use("/users/tickets", ticketsRouter);
app.use("/users/returns", returnsRouter);
app.use("/users/activity", activityRouter);
app.use("/users/2fa", twofactorRouter);
app.use("/orders", ordersRouter);
app.use("/delivery", deliveryRouter);
app.use("/reviews", reviewsRouter);
app.use("/wishlist", wishlistRouter);
app.use("/coupons", couponsRouter);
app.use("/admin", adminRouter);
app.use("/admin/uploads", uploadsRouter);
app.use("/uploads", userUploadsRouter);
app.use("/webhooks", webhooksRouter);
app.use("/settings", settingsRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  void _next;
  res.status(500).json({ message: "Internal server error" });
});

export default app;
