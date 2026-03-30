import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { user } from "./auth";
import { tagsTable } from "./tags";
import { vaultsTable } from "./vaults";
import { spacesTable } from "./spaces";

export const credentialsTable = pgTable("credentials", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  email: text("email").notNull(),
  password: text("password").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  tagId: integer("tag_id").references(() => tagsTable.id, { onDelete: "set null" }),
  vaultId: integer("vault_id").references(() => vaultsTable.id, { onDelete: "cascade" }),
  spaceId: integer("space_id").references(() => spacesTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCredentialSchema = createInsertSchema(credentialsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCredential = z.infer<typeof insertCredentialSchema>;
export type Credential = typeof credentialsTable.$inferSelect;
