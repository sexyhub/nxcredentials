import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcrypt";
import { db, vaultsTable } from "@/db";
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

  if (body.password) {
    const valid = await bcrypt.compare(body.password, vault.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid vault password." }, { status: 401 });
    }
    if (!session.unlockedVaults) session.unlockedVaults = {};
    session.unlockedVaults[vault.id] = Date.now();
    await session.save();
    return NextResponse.json({ message: "Vault unlocked." });
  }

  if (body.pin) {
    const valid = await bcrypt.compare(body.pin, vault.pinHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid vault PIN." }, { status: 401 });
    }
    if (!session.unlockedVaults) session.unlockedVaults = {};
    session.unlockedVaults[vault.id] = Date.now();
    await session.save();
    return NextResponse.json({ message: "Vault unlocked." });
  }

  return NextResponse.json({ error: "Provide either password or PIN." }, { status: 400 });
}
