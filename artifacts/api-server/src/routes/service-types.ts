import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, serviceTypesTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

const KEY_RE = /^[a-z0-9_-]+$/;
const COLOR_RE = /^#[0-9a-fA-F]{6}$/;

function validateCreate(body: any): string | null {
  if (typeof body.key !== "string" || body.key.length < 1 || body.key.length > 64 || !KEY_RE.test(body.key))
    return "key must be 1-64 lowercase alphanumeric, dash or underscore characters";
  if (typeof body.label !== "string" || body.label.length < 1 || body.label.length > 64)
    return "label must be 1-64 characters";
  if (typeof body.icon !== "string" || body.icon.length < 1 || body.icon.length > 64)
    return "icon must be a valid icon name";
  if (typeof body.color !== "string" || !COLOR_RE.test(body.color))
    return "color must be a hex color like #RRGGBB";
  return null;
}

function validateUpdate(body: any): string | null {
  if (body.label !== undefined && (typeof body.label !== "string" || body.label.length < 1 || body.label.length > 64))
    return "label must be 1-64 characters";
  if (body.icon !== undefined && (typeof body.icon !== "string" || body.icon.length < 1 || body.icon.length > 64))
    return "icon must be a valid icon name";
  if (body.color !== undefined && (typeof body.color !== "string" || !COLOR_RE.test(body.color)))
    return "color must be a hex color like #RRGGBB";
  return null;
}

router.get("/service-types", requireAuth, async (_req, res): Promise<void> => {
  const types = await db
    .select()
    .from(serviceTypesTable)
    .orderBy(serviceTypesTable.label);

  res.json(types);
});

router.post("/service-types", requireAuth, async (req, res): Promise<void> => {
  const error = validateCreate(req.body);
  if (error) {
    res.status(400).json({ error });
    return;
  }

  const { key, label, icon, color } = req.body;

  const existing = await db
    .select({ id: serviceTypesTable.id })
    .from(serviceTypesTable)
    .where(eq(serviceTypesTable.key, key));

  if (existing.length > 0) {
    res.status(409).json({ error: "A service type with this key already exists" });
    return;
  }

  const [created] = await db
    .insert(serviceTypesTable)
    .values({ key, label, icon, color })
    .returning();

  res.status(201).json(created);
});

router.patch("/service-types/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const error = validateUpdate(req.body);
  if (error) {
    res.status(400).json({ error });
    return;
  }

  const [existing] = await db
    .select()
    .from(serviceTypesTable)
    .where(eq(serviceTypesTable.id, id));

  if (!existing) {
    res.status(404).json({ error: "Service type not found" });
    return;
  }

  const updateData: Record<string, string> = {};
  if (req.body.label !== undefined) updateData.label = req.body.label;
  if (req.body.icon !== undefined) updateData.icon = req.body.icon;
  if (req.body.color !== undefined) updateData.color = req.body.color;

  const [updated] = await db
    .update(serviceTypesTable)
    .set(updateData)
    .where(eq(serviceTypesTable.id, id))
    .returning();

  res.json(updated);
});

router.delete("/service-types/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [existing] = await db
    .select()
    .from(serviceTypesTable)
    .where(eq(serviceTypesTable.id, id));

  if (!existing) {
    res.status(404).json({ error: "Service type not found" });
    return;
  }

  await db.delete(serviceTypesTable).where(eq(serviceTypesTable.id, id));
  res.sendStatus(204);
});

export default router;
