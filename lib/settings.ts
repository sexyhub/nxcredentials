import { db, settingsTable } from "@/db";

export async function getOrCreateSettings() {
  const existing = await db.select().from(settingsTable);
  if (existing.length > 0) {
    return existing[0];
  }
  const [settings] = await db
    .insert(settingsTable)
    .values({})
    .returning();
  return settings;
}
