import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { db, usersTable } from "@workspace/db";
import {
  SetupVaultBody,
  VerifyVaultBody,
  ChangeVaultPasswordBody,
  ChangeVaultPinBody,
} from "@workspace/api-zod";
import { requireAuth, isVaultSessionActive } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/vault/status", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

  res.json({
    hasPassword: !!user.vaultPasswordHash,
    hasPin: !!user.vaultPinHash,
    isUnlocked: isVaultSessionActive(req),
  });
});

router.post("/vault/lock", requireAuth, async (req, res): Promise<void> => {
  req.session.vaultUnlockedAt = undefined;
  res.json({ message: "Vault locked." });
});

router.post("/vault/setup", requireAuth, async (req, res): Promise<void> => {
  const parsed = SetupVaultBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = req.session.userId!;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

  if (user.vaultPasswordHash || user.vaultPinHash) {
    res.status(400).json({ error: "Vault is already set up. Use change endpoints to update." });
    return;
  }

  if (parsed.data.password.length < 6) {
    res.status(400).json({ error: "Vault password must be at least 6 characters." });
    return;
  }

  if (!/^\d{4,8}$/.test(parsed.data.pin)) {
    res.status(400).json({ error: "PIN must be 4-8 digits." });
    return;
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const pinHash = await bcrypt.hash(parsed.data.pin, 10);

  await db.update(usersTable).set({
    vaultPasswordHash: passwordHash,
    vaultPinHash: pinHash,
  }).where(eq(usersTable.id, userId));

  res.json({ message: "Vault set up successfully." });
});

router.post("/vault/verify", requireAuth, async (req, res): Promise<void> => {
  const parsed = VerifyVaultBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = req.session.userId!;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

  if (!user.vaultPasswordHash || !user.vaultPinHash) {
    res.status(400).json({ error: "Vault is not set up." });
    return;
  }

  if (parsed.data.password) {
    const valid = await bcrypt.compare(parsed.data.password, user.vaultPasswordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid vault password." });
      return;
    }
    req.session.vaultUnlockedAt = Date.now();
    res.json({ message: "Vault unlocked." });
    return;
  }

  if (parsed.data.pin) {
    const valid = await bcrypt.compare(parsed.data.pin, user.vaultPinHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid vault PIN." });
      return;
    }
    req.session.vaultUnlockedAt = Date.now();
    res.json({ message: "Vault unlocked." });
    return;
  }

  res.status(400).json({ error: "Provide either password or PIN." });
});

router.post("/vault/change-password", requireAuth, async (req, res): Promise<void> => {
  const parsed = ChangeVaultPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = req.session.userId!;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

  if (!user.vaultPasswordHash) {
    res.status(400).json({ error: "Vault is not set up." });
    return;
  }

  const valid = await bcrypt.compare(parsed.data.oldPassword, user.vaultPasswordHash);
  if (!valid) {
    res.status(401).json({ error: "Old password is incorrect." });
    return;
  }

  if (parsed.data.newPassword.length < 6) {
    res.status(400).json({ error: "New password must be at least 6 characters." });
    return;
  }

  const newHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await db.update(usersTable).set({ vaultPasswordHash: newHash }).where(eq(usersTable.id, userId));

  res.json({ message: "Vault password changed." });
});

router.post("/vault/change-pin", requireAuth, async (req, res): Promise<void> => {
  const parsed = ChangeVaultPinBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = req.session.userId!;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

  if (!user.vaultPinHash) {
    res.status(400).json({ error: "Vault is not set up." });
    return;
  }

  const valid = await bcrypt.compare(parsed.data.oldPin, user.vaultPinHash);
  if (!valid) {
    res.status(401).json({ error: "Old PIN is incorrect." });
    return;
  }

  if (!/^\d{4,8}$/.test(parsed.data.newPin)) {
    res.status(400).json({ error: "New PIN must be 4-8 digits." });
    return;
  }

  const newHash = await bcrypt.hash(parsed.data.newPin, 10);
  await db.update(usersTable).set({ vaultPinHash: newHash }).where(eq(usersTable.id, userId));

  res.json({ message: "Vault PIN changed." });
});

export default router;
