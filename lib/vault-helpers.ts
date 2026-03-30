const DURATION = 15 * 60 * 1000;

export function getUnlockedVaultIds(vaultState: Record<number, number>): Set<number> {
  const now = Date.now();
  const active = new Set<number>();
  for (const [id, ts] of Object.entries(vaultState)) {
    if (now - (ts as number) < DURATION) active.add(Number(id));
  }
  return active;
}

export function isVaultUnlocked(vaultState: Record<number, number>, vaultId: number): boolean {
  return getUnlockedVaultIds(vaultState).has(vaultId);
}
