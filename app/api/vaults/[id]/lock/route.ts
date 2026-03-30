import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-helpers";
import { lockVault } from "@/lib/vault-state";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const vaultId = Number(id);

  const userId = session.user.id;
  await lockVault(userId, vaultId);
  return NextResponse.json({ message: "Vault locked." });
}
