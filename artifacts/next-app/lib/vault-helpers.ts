import type { SessionData } from "./session";

const DURATION = 15 * 60 * 1000;

export function getUnlockedVaultIds(session: SessionData): Set<number> {
  const map: Record<number, number> = session.unlockedVaults || {};
  const now = Date.now();
  const active = new Set<number>();
  for (const [id, ts] of Object.entries(map)) {
    if (now - (ts as number) < DURATION) active.add(Number(id));
  }
  return active;
}

export function isVaultUnlocked(session: SessionData, vaultId: number): boolean {
  return getUnlockedVaultIds(session).has(vaultId);
}
