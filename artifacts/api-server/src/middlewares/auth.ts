import { Request, Response, NextFunction } from "express";

declare module "express-session" {
  interface SessionData {
    userId?: number;
    vaultUnlockedAt?: number;
  }
}

const VAULT_SESSION_DURATION_MS = 15 * 60 * 1000;

export function isVaultSessionActive(req: Request): boolean {
  if (!req.session.vaultUnlockedAt) return false;
  return Date.now() - req.session.vaultUnlockedAt < VAULT_SESSION_DURATION_MS;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session?.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.session?.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  (req as any)._requireAdmin = true;
  next();
}
