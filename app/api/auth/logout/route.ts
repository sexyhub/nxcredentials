import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { clearVaultUnlockState } from "@/lib/vault-state";

export async function POST(req: NextRequest) {
  await clearVaultUnlockState();

  const response = await auth.api.signOut({
    headers: req.headers,
    asResponse: true,
  });

  return response;
}
