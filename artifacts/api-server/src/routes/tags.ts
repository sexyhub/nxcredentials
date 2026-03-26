import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, tagsTable, credentialsTable } from "@workspace/db";
import {
  ListTagsResponse,
  CreateTagBody,
  UpdateTagParams,
  UpdateTagBody,
  UpdateTagResponse,
  DeleteTagParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/tags", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;

  const results = await db
    .select({
      id: tagsTable.id,
      name: tagsTable.name,
      color: tagsTable.color,
      credentialCount: sql<number>`cast(count(${credentialsTable.id}) as integer)`,
    })
    .from(tagsTable)
    .leftJoin(credentialsTable, eq(tagsTable.id, credentialsTable.tagId))
    .where(eq(tagsTable.userId, userId))
    .groupBy(tagsTable.id)
    .orderBy(tagsTable.name);

  res.json(ListTagsResponse.parse(results));
});

router.post("/tags", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateTagBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = req.session.userId!;

  const [tag] = await db
    .insert(tagsTable)
    .values({
      name: parsed.data.name,
      color: parsed.data.color,
      userId,
    })
    .returning();

  res.status(201).json(
    UpdateTagResponse.parse({
      ...tag,
      credentialCount: 0,
    })
  );
});

router.patch("/tags/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateTagParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateTagBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = req.session.userId!;
  const [existing] = await db
    .select()
    .from(tagsTable)
    .where(
      and(eq(tagsTable.id, params.data.id), eq(tagsTable.userId, userId))
    );

  if (!existing) {
    res.status(404).json({ error: "Tag not found" });
    return;
  }

  const updateData: Record<string, any> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.color !== undefined) updateData.color = parsed.data.color;

  const [tag] = await db
    .update(tagsTable)
    .set(updateData)
    .where(eq(tagsTable.id, params.data.id))
    .returning();

  const countResult = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(credentialsTable)
    .where(eq(credentialsTable.tagId, tag.id));

  res.json(
    UpdateTagResponse.parse({
      ...tag,
      credentialCount: countResult[0]?.count ?? 0,
    })
  );
});

router.delete("/tags/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteTagParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const userId = req.session.userId!;
  const [existing] = await db
    .select()
    .from(tagsTable)
    .where(
      and(eq(tagsTable.id, params.data.id), eq(tagsTable.userId, userId))
    );

  if (!existing) {
    res.status(404).json({ error: "Tag not found" });
    return;
  }

  await db.delete(tagsTable).where(eq(tagsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
