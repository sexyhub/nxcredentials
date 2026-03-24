import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, categoriesTable, credentialsTable } from "@workspace/db";
import {
  ListCategoriesResponse,
  CreateCategoryBody,
  UpdateCategoryParams,
  UpdateCategoryBody,
  UpdateCategoryResponse,
  DeleteCategoryParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/categories", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;

  const results = await db
    .select({
      id: categoriesTable.id,
      name: categoriesTable.name,
      color: categoriesTable.color,
      credentialCount: sql<number>`cast(count(${credentialsTable.id}) as integer)`,
    })
    .from(categoriesTable)
    .leftJoin(credentialsTable, eq(categoriesTable.id, credentialsTable.categoryId))
    .where(eq(categoriesTable.userId, userId))
    .groupBy(categoriesTable.id)
    .orderBy(categoriesTable.name);

  res.json(ListCategoriesResponse.parse(results));
});

router.post("/categories", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = req.session.userId!;

  const [category] = await db
    .insert(categoriesTable)
    .values({
      name: parsed.data.name,
      color: parsed.data.color,
      userId,
    })
    .returning();

  res.status(201).json(
    UpdateCategoryResponse.parse({
      ...category,
      credentialCount: 0,
    })
  );
});

router.patch("/categories/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = req.session.userId!;
  const [existing] = await db
    .select()
    .from(categoriesTable)
    .where(
      and(eq(categoriesTable.id, params.data.id), eq(categoriesTable.userId, userId))
    );

  if (!existing) {
    res.status(404).json({ error: "Category not found" });
    return;
  }

  const updateData: Record<string, any> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.color !== undefined) updateData.color = parsed.data.color;

  const [category] = await db
    .update(categoriesTable)
    .set(updateData)
    .where(eq(categoriesTable.id, params.data.id))
    .returning();

  const countResult = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(credentialsTable)
    .where(eq(credentialsTable.categoryId, category.id));

  res.json(
    UpdateCategoryResponse.parse({
      ...category,
      credentialCount: countResult[0]?.count ?? 0,
    })
  );
});

router.delete("/categories/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const userId = req.session.userId!;
  const [existing] = await db
    .select()
    .from(categoriesTable)
    .where(
      and(eq(categoriesTable.id, params.data.id), eq(categoriesTable.userId, userId))
    );

  if (!existing) {
    res.status(404).json({ error: "Category not found" });
    return;
  }

  await db.delete(categoriesTable).where(eq(categoriesTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
