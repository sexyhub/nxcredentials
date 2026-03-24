import { Router, type IRouter } from "express";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  RegisterBody,
  LoginBody,
  LoginResponse,
  GetMeResponse,
  LogoutResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import { getOrCreateSettings } from "../lib/settings";

const router: IRouter = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const settings = await getOrCreateSettings();
  const existingUsers = await db.select().from(usersTable);

  if (existingUsers.length > 0 && !settings.registrationEnabled) {
    res.status(403).json({ error: "Registration is currently disabled" });
    return;
  }

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, parsed.data.username));

  if (existing.length > 0) {
    res.status(400).json({ error: "Username already taken" });
    return;
  }

  if (parsed.data.password.length < 4) {
    res.status(400).json({ error: "Password must be at least 4 characters" });
    return;
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const isFirstUser = existingUsers.length === 0;

  const [user] = await db
    .insert(usersTable)
    .values({
      username: parsed.data.username,
      passwordHash,
      isAdmin: isFirstUser,
    })
    .returning();

  req.session.userId = user.id;

  res.status(201).json(
    LoginResponse.parse({
      user: {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin,
      },
    })
  );
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, parsed.data.username));

  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  if (parsed.data.rememberMe) {
    req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
  }

  req.session.userId = user.id;

  res.json(
    LoginResponse.parse({
      user: {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin,
      },
    })
  );
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.session.userId!));

  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  res.json(
    GetMeResponse.parse({
      id: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
    })
  );
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy(() => {
    res.json(LogoutResponse.parse({ message: "Logged out" }));
  });
});

export default router;
