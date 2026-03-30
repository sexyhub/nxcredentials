import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db, vaultsTable } from "@/db";
import { getAuthSession } from "@/lib/auth-helpers";
import { hashPassword, verifyPassword } from "@/lib/crypto";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const vaultId = Number(id);
  const body = await req.json();
  const userId = session.user.id;

  const [vault] = await db
    .select()
    .from(vaultsTable)
    .where(and(eq(vaultsTable.id, vaultId), eq(vaultsTable.userId, userId)));

  if (!vault) {
    return NextResponse.json({ error: "Vault not found" }, { status: 404 });
  }

  const valid = await verifyPassword(body.oldPassword, vault.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Old password is incorrect." }, { status: 401 });
  }

  if (!body.newPassword || body.newPassword.length < 6) {
    return NextResponse.json({ error: "New password must be at least 6 characters." }, { status: 400 });
  }

  const newHash = await hashPassword(body.newPassword);
  await db.update(vaultsTable).set({ passwordHash: newHash }).where(eq(vaultsTable.id, vaultId));

  return NextResponse.json({ message: "Vault password changed." });
}
