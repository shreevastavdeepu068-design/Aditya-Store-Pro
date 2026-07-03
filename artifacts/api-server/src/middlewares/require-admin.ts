import type { NextFunction, Request, Response } from "express";
import { verifyAdminToken } from "../lib/admin-auth";

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.header("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;

  if (!verifyAdminToken(token)) {
    res.status(401).json({ error: "Admin authentication required" });
    return;
  }

  next();
}
