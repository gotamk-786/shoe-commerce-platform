import type { NextFunction, Request, Response } from "express";
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";

export const requireAuth = ClerkExpressRequireAuth();

const isAdminFromClaims = (claims: Record<string, unknown> | null | undefined) => {
  if (!claims) return false;
  const publicMetadata = claims.publicMetadata as Record<string, unknown> | undefined;
  const privateMetadata = claims.privateMetadata as Record<string, unknown> | undefined;
  const role =
    (publicMetadata?.role as string | undefined) ||
    (privateMetadata?.role as string | undefined) ||
    (claims.role as string | undefined);
  return role === "admin";
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as Request & {
    auth?: {
      sessionClaims?: Record<string, unknown> | null;
    };
  };

  const bypassToken = process.env.ADMIN_BYPASS_TOKEN;
  if (process.env.NODE_ENV !== "production" && bypassToken && req.header("x-admin-bypass") === bypassToken) {
    return next();
  }

  if (req.user?.role === "admin") {
    return next();
  }

  if (!authReq.auth) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!isAdminFromClaims(authReq.auth.sessionClaims)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  return next();
};
