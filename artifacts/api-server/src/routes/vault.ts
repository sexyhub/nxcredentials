import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import bcrypt from "bcrypt";
import { db, vaultsTable, credentialsTable } from "@workspace/db";
import {
  CreateVaultBody,
  VerifyVaultBody,
  UpdateVaultBody,
  ChangeVaultPasswordBody,
  ChangeVaultPinBody,
  ListVaultsResponse,
  DeleteVaultParams,
  UpdateVaultParams,
  VerifyVaultParams,
  LockVaultParams,
  ChangeVaultPasswordParams,
  ChangeVaultPinParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

function getUnlockedVaultIds(req: any): Set<number> {
  const map: Record<number, number> = req.session.unlockedVaults || {};
  const now = Date.now();
  const DURATION = 15 * 60 * 1000;
  const active = new Set<number>();
  for (const [id, ts] of Object.entries(map)) {
    if (now - ts < DURATION) active.add(Number(id));
  }
  return active;
}

export function isVaultUnlocked(req: any, vaultId: number): boolean {
  return getUnlockedVaultIds(req).has(vaultId);
}

router.get("/vaults", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const unlockedIds = getUnlockedVaultIds(req);

  const vaults = await db
    .select({
      id: vaultsTable.id,
      name: vaultsTable.name,
      color: vaultsTable.color,
      icon: vaultsTable.icon,
      createdAt: vaultsTable.createdAt,
      credentialCount: sql<number>`cast(count(${credentialsTable.id}) as integer)`,
    })
    .from(vaultsTable)
    .leftJoin(credentialsTable, eq(vaultsTable.id, credentialsTable.vaultId))
    .where(eq(vaultsTable.userId, userId))
    .groupBy(vaultsTable.id)
    .orderBy(vaultsTable.createdAt);

  const result = vaults.map((v) => ({
    ...v,
    isUnlocked: unlockedIds.has(v.id),
  }));

  res.json(ListVaultsResponse.parse(result));
});

router.post("/vaults", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateVaultBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
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

  const userId = req.session.userId!;
  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const pinHash = await bcrypt.hash(parsed.data.pin, 10);

  const [vault] = await db
    .insert(vaultsTable)
    .values({
      name: parsed.data.name,
      passwordHash,
      pinHash,
      color: parsed.data.color || "#6366f1",
      icon: parsed.data.icon || "shield",
      userId,
    })
    .returning();

  res.status(201).json({
    id: vault.id,
    name: vault.name,
    color: vault.color,
    icon: vault.icon,
    credentialCount: 0,
    isUnlocked: false,
    createdAt: vault.createdAt.toISOString(),
  });
});

router.patch("/vaults/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateVaultParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateVaultBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = req.session.userId!;
  const [existing] = await db
    .select()
    .from(vaultsTable)
    .where(and(eq(vaultsTable.id, params.data.id), eq(vaultsTable.userId, userId)));

  if (!existing) {
    res.status(404).json({ error: "Vault not found" });
    return;
  }

  const updateData: Record<string, any> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.color !== undefined) updateData.color = parsed.data.color;
  if (parsed.data.icon !== undefined) updateData.icon = parsed.data.icon;

  const [vault] = await db
    .update(vaultsTable)
    .set(updateData)
    .where(eq(vaultsTable.id, params.data.id))
    .returning();

  const [countResult] = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(credentialsTable)
    .where(eq(credentialsTable.vaultId, vault.id));

  res.json({
    id: vault.id,
    name: vault.name,
    color: vault.color,
    icon: vault.icon,
    credentialCount: countResult?.count ?? 0,
    isUnlocked: isVaultUnlocked(req, vault.id),
    createdAt: vault.createdAt.toISOString(),
  });
});

router.delete("/vaults/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteVaultParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const userId = req.session.userId!;
  const [existing] = await db
    .select()
    .from(vaultsTable)
    .where(and(eq(vaultsTable.id, params.data.id), eq(vaultsTable.userId, userId)));

  if (!existing) {
    res.status(404).json({ error: "Vault not found" });
    return;
  }

  await db.delete(vaultsTable).where(eq(vaultsTable.id, params.data.id));
  res.sendStatus(204);
});

router.post("/vaults/:id/verify", requireAuth, async (req, res): Promise<void> => {
  const params = VerifyVaultParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = VerifyVaultBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = req.session.userId!;
  const [vault] = await db
    .select()
    .from(vaultsTable)
    .where(and(eq(vaultsTable.id, params.data.id), eq(vaultsTable.userId, userId)));

  if (!vault) {
    res.status(404).json({ error: "Vault not found" });
    return;
  }

  if (parsed.data.password) {
    const valid = await bcrypt.compare(parsed.data.password, vault.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid vault password." });
      return;
    }
    if (!req.session.unlockedVaults) req.session.unlockedVaults = {};
    req.session.unlockedVaults[vault.id] = Date.now();
    res.json({ message: "Vault unlocked." });
    return;
  }

  if (parsed.data.pin) {
    const valid = await bcrypt.compare(parsed.data.pin, vault.pinHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid vault PIN." });
      return;
    }
    if (!req.session.unlockedVaults) req.session.unlockedVaults = {};
    req.session.unlockedVaults[vault.id] = Date.now();
    res.json({ message: "Vault unlocked." });
    return;
  }

  res.status(400).json({ error: "Provide either password or PIN." });
});

router.post("/vaults/:id/lock", requireAuth, async (req, res): Promise<void> => {
  const params = LockVaultParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  if (req.session.unlockedVaults) {
    delete req.session.unlockedVaults[params.data.id];
  }
  res.json({ message: "Vault locked." });
});

router.post("/vaults/:id/change-password", requireAuth, async (req, res): Promise<void> => {
  const params = ChangeVaultPasswordParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = ChangeVaultPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = req.session.userId!;
  const [vault] = await db
    .select()
    .from(vaultsTable)
    .where(and(eq(vaultsTable.id, params.data.id), eq(vaultsTable.userId, userId)));

  if (!vault) {
    res.status(404).json({ error: "Vault not found" });
    return;
  }

  const valid = await bcrypt.compare(parsed.data.oldPassword, vault.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Old password is incorrect." });
    return;
  }

  if (parsed.data.newPassword.length < 6) {
    res.status(400).json({ error: "New password must be at least 6 characters." });
    return;
  }

  const newHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await db.update(vaultsTable).set({ passwordHash: newHash }).where(eq(vaultsTable.id, params.data.id));

  res.json({ message: "Vault password changed." });
});

router.post("/vaults/:id/change-pin", requireAuth, async (req, res): Promise<void> => {
  const params = ChangeVaultPinParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = ChangeVaultPinBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = req.session.userId!;
  const [vault] = await db
    .select()
    .from(vaultsTable)
    .where(and(eq(vaultsTable.id, params.data.id), eq(vaultsTable.userId, userId)));

  if (!vault) {
    res.status(404).json({ error: "Vault not found" });
    return;
  }

  const valid = await bcrypt.compare(parsed.data.oldPin, vault.pinHash);
  if (!valid) {
    res.status(401).json({ error: "Old PIN is incorrect." });
    return;
  }

  if (!/^\d{4,8}$/.test(parsed.data.newPin)) {
    res.status(400).json({ error: "New PIN must be 4-8 digits." });
    return;
  }

  const newHash = await bcrypt.hash(parsed.data.newPin, 10);
  await db.update(vaultsTable).set({ pinHash: newHash }).where(eq(vaultsTable.id, params.data.id));

  res.json({ message: "Vault PIN changed." });
});

export default router;
