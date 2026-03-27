import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const vaultId = Number(id);

  if (session.unlockedVaults) {
    delete session.unlockedVaults[vaultId];
    await session.save();
  }

  return NextResponse.json({ message: "Vault locked." });
}
