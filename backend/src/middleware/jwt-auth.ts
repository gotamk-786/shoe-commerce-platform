import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { NextFunction, Request, Response } from "express";
import prisma from "../prisma";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "customer";
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const jwtSecret = process.env.JWT_SECRET || "dev-secret";

export const hashPassword = async (value: string) => bcrypt.hash(value, 10);

export const verifyPassword = async (value: string, hash: string) => bcrypt.compare(value, hash);

export const signToken = (user: AuthUser) =>
  jwt.sign({ sub: user.id, email: user.email, name: user.name, role: user.role }, jwtSecret, {
    expiresIn: "7d",
  });

export const requireUser = async (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = header.replace("Bearer ", "");
  try {
    const payload = jwt.verify(token, jwtSecret) as {
      sub: string;
      email: string;
      name: string;
      role: "admin" | "customer";
    };
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (user.isBlocked) {
      return res.status(403).json({ message: "Account blocked" });
    }
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    return next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
};
