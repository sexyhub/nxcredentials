import { Router, type IRouter } from "express";
import { eq, and, ilike, or, sql } from "drizzle-orm";
import { db, credentialsTable, categoriesTable } from "@workspace/db";
import {
  ListCredentialsQueryParams,
  ListCredentialsResponse,
  CreateCredentialBody,
  UpdateCredentialParams,
  UpdateCredentialBody,
  UpdateCredentialResponse,
  DeleteCredentialParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/credentials", requireAuth, async (req, res): Promise<void> => {
  const params = ListCredentialsQueryParams.safeParse(req.query);
  const userId = req.session.userId!;

  let query = db
    .select({
      id: credentialsTable.id,
      title: credentialsTable.title,
      email: credentialsTable.email,
      password: credentialsTable.password,
      categoryId: credentialsTable.categoryId,
      categoryName: categoriesTable.name,
      categoryColor: categoriesTable.color,
      createdAt: credentialsTable.createdAt,
      updatedAt: credentialsTable.updatedAt,
    })
    .from(credentialsTable)
    .leftJoin(categoriesTable, eq(credentialsTable.categoryId, categoriesTable.id))
    .where(eq(credentialsTable.userId, userId))
    .$dynamic();

  if (params.success && params.data.category) {
    query = query.where(
      and(
        eq(credentialsTable.userId, userId),
        eq(categoriesTable.name, params.data.category)
      )
    );
  }

  if (params.success && params.data.search) {
    const search = `%${params.data.search}%`;
    query = query.where(
      and(
        eq(credentialsTable.userId, userId),
        or(
          ilike(credentialsTable.title, search),
          ilike(credentialsTable.email, search)
        )
      )
    );
  }

  const results = await query.orderBy(credentialsTable.createdAt);
  res.json(ListCredentialsResponse.parse(results));
});

router.post("/credentials", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateCredentialBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = req.session.userId!;

  const [credential] = await db
    .insert(credentialsTable)
    .values({
      title: parsed.data.title,
      email: parsed.data.email,
      password: parsed.data.password,
      categoryId: parsed.data.categoryId ?? null,
      userId,
    })
    .returning();

  let categoryName: string | null = null;
  let categoryColor: string | null = null;
  if (credential.categoryId) {
    const [cat] = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, credential.categoryId));
    if (cat) {
      categoryName = cat.name;
      categoryColor = cat.color;
    }
  }

  res.status(201).json(
    UpdateCredentialResponse.parse({
      ...credential,
      categoryName,
      categoryColor,
    })
  );
});

router.patch("/credentials/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateCredentialParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCredentialBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = req.session.userId!;
  const [existing] = await db
    .select()
    .from(credentialsTable)
    .where(
      and(eq(credentialsTable.id, params.data.id), eq(credentialsTable.userId, userId))
    );

  if (!existing) {
    res.status(404).json({ error: "Credential not found" });
    return;
  }

  const updateData: Record<string, any> = {};
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
  if (parsed.data.email !== undefined) updateData.email = parsed.data.email;
  if (parsed.data.password !== undefined) updateData.password = parsed.data.password;
  if (parsed.data.categoryId !== undefined) updateData.categoryId = parsed.data.categoryId;

  const [credential] = await db
    .update(credentialsTable)
    .set(updateData)
    .where(eq(credentialsTable.id, params.data.id))
    .returning();

  let categoryName: string | null = null;
  let categoryColor: string | null = null;
  if (credential.categoryId) {
    const [cat] = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, credential.categoryId));
    if (cat) {
      categoryName = cat.name;
      categoryColor = cat.color;
    }
  }

  res.json(
    UpdateCredentialResponse.parse({
      ...credential,
      categoryName,
      categoryColor,
    })
  );
});

router.delete("/credentials/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteCredentialParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const userId = req.session.userId!;
  const [existing] = await db
    .select()
    .from(credentialsTable)
    .where(
      and(eq(credentialsTable.id, params.data.id), eq(credentialsTable.userId, userId))
    );

  if (!existing) {
    res.status(404).json({ error: "Credential not found" });
    return;
  }

  await db.delete(credentialsTable).where(eq(credentialsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
