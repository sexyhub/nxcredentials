import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcrypt";
import { db, vaultsTable } from "@workspace/db";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const vaultId = Number(id);
  const body = await req.json();
  const userId = session.userId;

  const [vault] = await db
    .select()
    .from(vaultsTable)
    .where(and(eq(vaultsTable.id, vaultId), eq(vaultsTable.userId, userId)));

  if (!vault) {
    return NextResponse.json({ error: "Vault not found" }, { status: 404 });
  }

  const valid = await bcrypt.compare(body.oldPin, vault.pinHash);
  if (!valid) {
    return NextResponse.json({ error: "Old PIN is incorrect." }, { status: 401 });
  }

  if (!body.newPin || !/^\d{4,8}$/.test(body.newPin)) {
    return NextResponse.json({ error: "New PIN must be 4-8 digits." }, { status: 400 });
  }

  const newHash = await bcrypt.hash(body.newPin, 10);
  await db.update(vaultsTable).set({ pinHash: newHash }).where(eq(vaultsTable.id, vaultId));

  return NextResponse.json({ message: "Vault PIN changed." });
}
