import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "vault_unlock_state";

function getSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET environment variable is required");
  }
  return secret;
}

function sign(data: string): string {
  return crypto.createHmac("sha256", getSecret()).update(data).digest("hex");
}

interface VaultState {
  userId: string;
  unlocks: Record<number, number>;
}

function encode(state: VaultState): string {
  const json = JSON.stringify(state);
  const sig = sign(json);
  return Buffer.from(json).toString("base64") + "." + sig;
}

function decode(value: string): VaultState | null {
  const parts = value.split(".");
  if (parts.length !== 2) return null;
  const [b64, sig] = parts;
  try {
    const json = Buffer.from(b64, "base64").toString();
    if (sign(json) !== sig) return null;
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export async function getVaultUnlockState(userId: string): Promise<Record<number, number>> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return {};
  const state = decode(raw);
  if (!state || state.userId !== userId) return {};
  return state.unlocks;
}

export async function setVaultUnlockState(userId: string, unlocks: Record<number, number>): Promise<void> {
  const cookieStore = await cookies();
  const state: VaultState = { userId, unlocks };
  cookieStore.set(COOKIE_NAME, encode(state), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });
}

export async function unlockVault(userId: string, vaultId: number): Promise<void> {
  const unlocks = await getVaultUnlockState(userId);
  unlocks[vaultId] = Date.now();
  await setVaultUnlockState(userId, unlocks);
}

export async function lockVault(userId: string, vaultId: number): Promise<void> {
  const unlocks = await getVaultUnlockState(userId);
  delete unlocks[vaultId];
  await setVaultUnlockState(userId, unlocks);
}

export async function clearVaultUnlockState(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}
