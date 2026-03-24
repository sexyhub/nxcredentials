import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, spacesTable, credentialsTable } from "@workspace/db";
import {
  CreateSpaceBody,
  UpdateSpaceBody,
  UpdateSpaceParams,
  DeleteSpaceParams,
  ListSpacesResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/spaces", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;

  const spaces = await db
    .select({
      id: spacesTable.id,
      name: spacesTable.name,
      defaultType: spacesTable.defaultType,
      color: spacesTable.color,
      icon: spacesTable.icon,
      credentialCount: sql<number>`cast(count(${credentialsTable.id}) as integer)`,
    })
    .from(spacesTable)
    .leftJoin(credentialsTable, eq(spacesTable.id, credentialsTable.spaceId))
    .where(eq(spacesTable.userId, userId))
    .groupBy(spacesTable.id)
    .orderBy(spacesTable.createdAt);

  res.json(ListSpacesResponse.parse(spaces));
});

router.post("/spaces", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateSpaceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = req.session.userId!;

  const [space] = await db
    .insert(spacesTable)
    .values({
      name: parsed.data.name,
      defaultType: parsed.data.defaultType ?? null,
      color: parsed.data.color || "#6366f1",
      icon: parsed.data.icon || "folder",
      userId,
    })
    .returning();

  res.status(201).json({
    id: space.id,
    name: space.name,
    defaultType: space.defaultType,
    color: space.color,
    icon: space.icon,
    credentialCount: 0,
  });
});

router.patch("/spaces/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateSpaceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateSpaceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = req.session.userId!;
  const [existing] = await db
    .select()
    .from(spacesTable)
    .where(and(eq(spacesTable.id, params.data.id), eq(spacesTable.userId, userId)));

  if (!existing) {
    res.status(404).json({ error: "Space not found" });
    return;
  }

  const updateData: Record<string, any> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.defaultType !== undefined) updateData.defaultType = parsed.data.defaultType;
  if (parsed.data.color !== undefined) updateData.color = parsed.data.color;
  if (parsed.data.icon !== undefined) updateData.icon = parsed.data.icon;

  const [space] = await db
    .update(spacesTable)
    .set(updateData)
    .where(eq(spacesTable.id, params.data.id))
    .returning();

  const [countResult] = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(credentialsTable)
    .where(eq(credentialsTable.spaceId, space.id));

  res.json({
    id: space.id,
    name: space.name,
    defaultType: space.defaultType,
    color: space.color,
    icon: space.icon,
    credentialCount: countResult?.count ?? 0,
  });
});

router.delete("/spaces/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteSpaceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const userId = req.session.userId!;
  const [existing] = await db
    .select()
    .from(spacesTable)
    .where(and(eq(spacesTable.id, params.data.id), eq(spacesTable.userId, userId)));

  if (!existing) {
    res.status(404).json({ error: "Space not found" });
    return;
  }

  await db.delete(spacesTable).where(eq(spacesTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
