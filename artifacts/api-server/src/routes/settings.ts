import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, settingsTable } from "@workspace/db";
import {
  GetSettingsResponse,
  UpdateSettingsBody,
  UpdateSettingsResponse,
  GetRegistrationStatusResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import { getOrCreateSettings } from "../lib/settings";

const router: IRouter = Router();

router.get("/settings/registration-status", async (_req, res): Promise<void> => {
  const settings = await getOrCreateSettings();
  res.json(GetRegistrationStatusResponse.parse({ enabled: settings.registrationEnabled }));
});

router.get("/settings", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.session.userId!));

  if (!user?.isAdmin) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  const settings = await getOrCreateSettings();
  res.json(
    GetSettingsResponse.parse({
      registrationEnabled: settings.registrationEnabled,
      siteTitle: settings.siteTitle,
      siteLogo: settings.siteLogo,
      siteFavicon: settings.siteFavicon,
    })
  );
});

router.patch("/settings", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.session.userId!));

  if (!user?.isAdmin) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const settings = await getOrCreateSettings();

  const updateData: Record<string, any> = {};
  if (parsed.data.registrationEnabled !== undefined)
    updateData.registrationEnabled = parsed.data.registrationEnabled;
  if (parsed.data.siteTitle !== undefined)
    updateData.siteTitle = parsed.data.siteTitle;
  if (parsed.data.siteLogo !== undefined)
    updateData.siteLogo = parsed.data.siteLogo;
  if (parsed.data.siteFavicon !== undefined)
    updateData.siteFavicon = parsed.data.siteFavicon;

  const [updated] = await db
    .update(settingsTable)
    .set(updateData)
    .where(eq(settingsTable.id, settings.id))
    .returning();

  res.json(
    UpdateSettingsResponse.parse({
      registrationEnabled: updated.registrationEnabled,
      siteTitle: updated.siteTitle,
      siteLogo: updated.siteLogo,
      siteFavicon: updated.siteFavicon,
    })
  );
});

export default router;
