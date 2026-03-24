import { pgTable, text, serial, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  registrationEnabled: boolean("registration_enabled").notNull().default(true),
  siteTitle: text("site_title").notNull().default("Credential Vault"),
  siteLogo: text("site_logo").notNull().default(""),
  siteFavicon: text("site_favicon").notNull().default(""),
});

export const insertSettingsSchema = createInsertSchema(settingsTable).omit({ id: true });
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settingsTable.$inferSelect;
