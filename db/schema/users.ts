export { user as usersTable } from "./auth";
import type { user } from "./auth";

export type User = typeof user.$inferSelect;
