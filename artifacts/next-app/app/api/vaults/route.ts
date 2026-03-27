import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcrypt";
import { db, vaultsTable, credentialsTable } from "@workspace/db";
import { getSession } from "@/lib/session";
import { getUnlockedVaultIds } from "@/lib/vault-helpers";

export async function GET() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const userId = session.userId;
  const unlockedIds = getUnlockedVaultIds(session);

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
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();

  if (!body.password || body.password.length < 6) {
    return NextResponse.json({ error: "Vault password must be at least 6 characters." }, { status: 400 });
  }

  if (!body.pin || !/^\d{4,8}$/.test(body.pin)) {
    return NextResponse.json({ error: "PIN must be 4-8 digits." }, { status: 400 });
  }

  const userId = session.userId;
  const passwordHash = await bcrypt.hash(body.password, 10);
  const pinHash = await bcrypt.hash(body.pin, 10);

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
