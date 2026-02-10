import { Router } from "express";
import { z } from "zod";
import prisma from "../prisma";
import { hashPassword, signToken, verifyPassword, requireUser } from "../middleware/jwt-auth";
import { logActivity } from "../lib/activity";
import { mailerReady, sendMail } from "../lib/mailer";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const router = Router();

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const requestOtpSchema = z.object({
  email: z.string().email(),
});

const verifyOtpSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  code: z.string().min(4).max(10),
});

const generateOtp = () => `${Math.floor(100000 + Math.random() * 900000)}`;
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const GOOGLE_STATE_TTL_MS = 10 * 60 * 1000;

const jwtSecret = process.env.JWT_SECRET || "dev-secret";
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleRedirectUrl = process.env.GOOGLE_REDIRECT_URL;
const googleAuthUrl = "https://accounts.google.com/o/oauth2/v2/auth";
const googleTokenUrl = "https://oauth2.googleapis.com/token";
const googleUserInfoUrl = "https://openidconnect.googleapis.com/v1/userinfo";

const buildGoogleState = (payload: { redirect: string; nonce: string }) =>
  jwt.sign(payload, jwtSecret, { expiresIn: Math.floor(GOOGLE_STATE_TTL_MS / 1000) });

const parseGoogleState = (token: string) =>
  jwt.verify(token, jwtSecret) as { redirect: string; nonce: string };

router.post("/register/request-otp", async (req, res, next) => {
  try {
    const payload = requestOtpSchema.parse(req.body);
    const email = payload.email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "Email already registered." });
    }

    if (!mailerReady) {
      return res.status(500).json({ message: "Email service is not configured." });
    }

    const existingToken = await prisma.emailVerificationToken.findUnique({ where: { email } });
    if (existingToken?.lastSentAt) {
      const elapsed = Date.now() - existingToken.lastSentAt.getTime();
      if (elapsed < OTP_RESEND_COOLDOWN_MS) {
        const retryAfter = Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000);
        return res.status(429).json({
          message: "Please wait before requesting another OTP.",
          retryAfter,
        });
      }
    }

    const code = generateOtp();
    const codeHash = await hashPassword(code);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);
    const lastSentAt = new Date();

    await prisma.emailVerificationToken.upsert({
      where: { email },
      update: { codeHash, expiresAt, lastSentAt, attempts: 0 },
      create: { email, codeHash, expiresAt, lastSentAt, attempts: 0 },
    });

    await sendMail(
      [email],
      "Your Thrifty Shoes verification code",
      `<p>Your verification code is <strong>${code}</strong>. It expires in 10 minutes.</p>`,
    );

    return res.json({ ok: true, expiresIn: Math.floor(OTP_TTL_MS / 1000) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.flatten() });
    }
    return next(error);
  }
});

router.post("/register/verify-otp", async (req, res, next) => {
  try {
    const payload = verifyOtpSchema.parse(req.body);
    const email = payload.email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "Email already registered." });
    }

    const token = await prisma.emailVerificationToken.findUnique({ where: { email } });
    if (!token || token.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired. Request a new code." });
    }

    if (token.attempts >= OTP_MAX_ATTEMPTS) {
      return res.status(429).json({ message: "Too many failed attempts. Request a new OTP." });
    }

    const ok = await verifyPassword(payload.code, token.codeHash);
    if (!ok) {
      await prisma.emailVerificationToken.update({
        where: { email },
        data: { attempts: { increment: 1 } },
      });
      return res.status(401).json({ message: "Invalid OTP code." });
    }

    const passwordHash = await hashPassword(payload.password);
    const user = await prisma.user.create({
      data: {
        name: payload.name,
        email,
        passwordHash,
      },
    });

    await prisma.emailVerificationToken.delete({ where: { email } });

    const jwt = signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    await logActivity(user.id, "account", "Account created");

    return res.status(201).json({
      token: jwt,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl ?? undefined,
        coverUrl: user.coverUrl ?? undefined,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.flatten() });
    }
    return next(error);
  }
});

router.post("/register", async (req, res, next) => {
  try {
    registerSchema.parse(req.body);
    return res.status(400).json({ message: "Use OTP verification to create an account." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.flatten() });
    }
    return next(error);
  }
});

router.get("/google/start", (req, res) => {
  if (!googleClientId || !googleRedirectUrl) {
    return res.status(500).json({ message: "Google login is not configured." });
  }

  const redirect = typeof req.query.redirect === "string"
    ? req.query.redirect
    : "http://localhost:3000/auth/google/callback";
  const state = buildGoogleState({ redirect, nonce: crypto.randomBytes(8).toString("hex") });
  const params = new URLSearchParams({
    client_id: googleClientId,
    redirect_uri: googleRedirectUrl,
    response_type: "code",
    scope: "openid email profile",
    prompt: "select_account",
    state,
  });
  return res.redirect(`${googleAuthUrl}?${params.toString()}`);
});

router.get("/google/callback", async (req, res, next) => {
  try {
    if (!googleClientId || !googleClientSecret || !googleRedirectUrl) {
      return res.status(500).json({ message: "Google login is not configured." });
    }

    const code = typeof req.query.code === "string" ? req.query.code : null;
    const stateToken = typeof req.query.state === "string" ? req.query.state : null;
    if (!code || !stateToken) {
      return res.status(400).json({ message: "Invalid Google callback." });
    }

    const state = parseGoogleState(stateToken);

    const tokenResponse = await fetch(googleTokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uri: googleRedirectUrl,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      return res.status(401).json({ message: "Google token exchange failed." });
    }

    const tokenPayload = (await tokenResponse.json()) as { access_token?: string };
    if (!tokenPayload.access_token) {
      return res.status(401).json({ message: "Google access token missing." });
    }

    const profileResponse = await fetch(googleUserInfoUrl, {
      headers: { Authorization: `Bearer ${tokenPayload.access_token}` },
    });
    if (!profileResponse.ok) {
      return res.status(401).json({ message: "Google profile fetch failed." });
    }

    const profile = (await profileResponse.json()) as {
      email?: string;
      email_verified?: boolean;
      name?: string;
      picture?: string;
    };

    if (!profile.email || profile.email_verified === false) {
      return res.status(401).json({ message: "Google email not verified." });
    }

    const email = profile.email.toLowerCase();
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const passwordHash = await hashPassword(crypto.randomBytes(32).toString("hex"));
      user = await prisma.user.create({
        data: {
          name: profile.name || email.split("@")[0],
          email,
          passwordHash,
          avatarUrl: profile.picture,
        },
      });
      await logActivity(user.id, "account", "Account created via Google");
    }

    const appToken = signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const redirectUrl = new URL(state.redirect);
    redirectUrl.searchParams.set("token", appToken);
    return res.redirect(redirectUrl.toString());
  } catch (error) {
    return next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: payload.email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }
    if (user.isBlocked) {
      return res.status(403).json({ message: "Account blocked" });
    }

    const ok = await verifyPassword(payload.password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    await logActivity(user.id, "account", "Signed in");

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl ?? undefined,
        coverUrl: user.coverUrl ?? undefined,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.flatten() });
    }
    return next(error);
  }
});

router.post("/forgot-password", (_req, res) => {
  return res.status(200).json({ ok: true });
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

router.post("/change-password", requireUser, async (req, res, next) => {
  try {
    const payload = changePasswordSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.user?.id } });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const ok = await verifyPassword(payload.currentPassword, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }

    const passwordHash = await hashPassword(payload.newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    await logActivity(user.id, "security", "Password updated");

    return res.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.flatten() });
    }
    return next(error);
  }
});

export default router;
