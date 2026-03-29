import { NextRequest, NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { db, vaultsTable, credentialsTable } from "@/db";
import { getSession } from "@/lib/session";
import { isVaultUnlocked } from "@/lib/vault-helpers";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const vaultId = Number(id);
  const body = await req.json();
  const userId = session.userId;

  const [existing] = await db
    .select()
    .from(vaultsTable)
    .where(and(eq(vaultsTable.id, vaultId), eq(vaultsTable.userId, userId)));

  if (!existing) {
    return NextResponse.json({ error: "Vault not found" }, { status: 404 });
  }

  const updateData: Record<string, any> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.color !== undefined) updateData.color = body.color;
  if (body.icon !== undefined) updateData.icon = body.icon;

  const [vault] = await db
    .update(vaultsTable)
    .set(updateData)
    .where(eq(vaultsTable.id, vaultId))
    .returning();

  const [countResult] = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(credentialsTable)
    .where(eq(credentialsTable.vaultId, vault.id));

  return NextResponse.json({
    id: vault.id,
    name: vault.name,
    color: vault.color,
    icon: vault.icon,
    credentialCount: countResult?.count ?? 0,
    isUnlocked: isVaultUnlocked(session, vault.id),
    createdAt: vault.createdAt.toISOString(),
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const vaultId = Number(id);
  const userId = session.userId;

  const [existing] = await db
    .select()
    .from(vaultsTable)
    .where(and(eq(vaultsTable.id, vaultId), eq(vaultsTable.userId, userId)));

  if (!existing) {
    return NextResponse.json({ error: "Vault not found" }, { status: 404 });
  }

  await db.delete(vaultsTable).where(eq(vaultsTable.id, vaultId));
  return new NextResponse(null, { status: 204 });
}
