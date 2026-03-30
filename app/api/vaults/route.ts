import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db, vaultsTable, credentialsTable } from "@/db";
import { getAuthSession } from "@/lib/auth-helpers";
import { getVaultUnlockState } from "@/lib/vault-state";
import { getUnlockedVaultIds } from "@/lib/vault-helpers";
import { hashPassword } from "@/lib/crypto";

export async function GET() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const userId = session.user.id;
  const vaultState = await getVaultUnlockState(userId);
  const unlockedIds = getUnlockedVaultIds(vaultState);

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

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();

  if (!body.password || body.password.length < 6) {
    return NextResponse.json({ error: "Vault password must be at least 6 characters." }, { status: 400 });
  }

  if (!body.pin || !/^\d{4,8}$/.test(body.pin)) {
    return NextResponse.json({ error: "PIN must be 4-8 digits." }, { status: 400 });
  }

  const userId = session.user.id;
  const passwordHash = await hashPassword(body.password);
  const pinHash = await hashPassword(body.pin);

  const [vault] = await db
    .insert(vaultsTable)
    .values({
      name: body.name,
      passwordHash,
      pinHash,
      color: body.color || "#6366f1",
      icon: body.icon || "shield",
      userId,
    })
    .returning();

  return NextResponse.json({
    id: vault.id,
    name: vault.name,
    color: vault.color,
    icon: vault.icon,
    credentialCount: 0,
    isUnlocked: false,
    createdAt: vault.createdAt.toISOString(),
  }, { status: 201 });
}
