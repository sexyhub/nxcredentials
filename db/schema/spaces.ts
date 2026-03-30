import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { user } from "./auth";

export const spacesTable = pgTable("spaces", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  defaultType: text("default_type"),
  color: text("color").notNull().default("#6366f1"),
  icon: text("icon").notNull().default("folder"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSpaceSchema = createInsertSchema(spacesTable).omit({ id: true, createdAt: true });
export type InsertSpace = z.infer<typeof insertSpaceSchema>;
export type Space = typeof spacesTable.$inferSelect;
