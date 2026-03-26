import { Router, type IRouter } from "express";
import { eq, and, ilike, or, sql, isNull } from "drizzle-orm";
import { db, credentialsTable, tagsTable, spacesTable } from "@workspace/db";
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
import { isVaultUnlocked } from "./vault";

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
      tagId: credentialsTable.tagId,
      tagName: tagsTable.name,
      tagColor: tagsTable.color,
      vaultId: credentialsTable.vaultId,
      spaceId: credentialsTable.spaceId,
      spaceName: spacesTable.name,
      createdAt: credentialsTable.createdAt,
      updatedAt: credentialsTable.updatedAt,
    })
    .from(credentialsTable)
    .leftJoin(tagsTable, eq(credentialsTable.tagId, tagsTable.id))
    .leftJoin(spacesTable, eq(credentialsTable.spaceId, spacesTable.id))
    .where(eq(credentialsTable.userId, userId))
    .$dynamic();

  if (params.success && params.data.tag) {
    query = query.where(
      and(
        eq(credentialsTable.userId, userId),
        eq(tagsTable.name, params.data.tag)
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

  if (params.success && params.data.spaceId !== undefined) {
    const sid = Number(params.data.spaceId);
    query = query.where(
      and(
        eq(credentialsTable.userId, userId),
        eq(credentialsTable.spaceId, sid)
      )
    );
  }

  if (params.success && params.data.vaultId !== undefined) {
    const vid = Number(params.data.vaultId);
    query = query.where(
      and(
        eq(credentialsTable.userId, userId),
        eq(credentialsTable.vaultId, vid)
      )
    );
  }

  const results = await query.orderBy(credentialsTable.createdAt);

  const masked = results.map((cred) => {
    if (cred.vaultId && !isVaultUnlocked(req, cred.vaultId)) {
      return { ...cred, email: "••••••••", password: "••••••••" };
    }
    return cred;
  });

  res.json(ListCredentialsResponse.parse(masked));
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
      tagId: parsed.data.tagId ?? null,
      vaultId: parsed.data.vaultId ?? null,
      spaceId: parsed.data.spaceId ?? null,
      userId,
    })
    .returning();

  let tagName: string | null = null;
  let tagColor: string | null = null;
  if (credential.tagId) {
    const [t] = await db
      .select()
      .from(tagsTable)
      .where(eq(tagsTable.id, credential.tagId));
    if (t) {
      tagName = t.name;
      tagColor = t.color;
    }
  }

  let spaceName: string | null = null;
  if (credential.spaceId) {
    const [sp] = await db.select().from(spacesTable).where(eq(spacesTable.id, credential.spaceId));
    if (sp) spaceName = sp.name;
  }

  res.status(201).json(
    UpdateCredentialResponse.parse({
      ...credential,
      tagName,
      tagColor,
      spaceName,
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
  if (parsed.data.tagId !== undefined) updateData.tagId = parsed.data.tagId;
  if (parsed.data.vaultId !== undefined) updateData.vaultId = parsed.data.vaultId;
  if (parsed.data.spaceId !== undefined) updateData.spaceId = parsed.data.spaceId;

  const [credential] = await db
    .update(credentialsTable)
    .set(updateData)
    .where(eq(credentialsTable.id, params.data.id))
    .returning();

  let tagName: string | null = null;
  let tagColor: string | null = null;
  if (credential.tagId) {
    const [t] = await db
      .select()
      .from(tagsTable)
      .where(eq(tagsTable.id, credential.tagId));
    if (t) {
      tagName = t.name;
      tagColor = t.color;
    }
  }

  let spaceName: string | null = null;
  if (credential.spaceId) {
    const [sp] = await db.select().from(spacesTable).where(eq(spacesTable.id, credential.spaceId));
    if (sp) spaceName = sp.name;
  }

  res.json(
    UpdateCredentialResponse.parse({
      ...credential,
      tagName,
      tagColor,
      spaceName,
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
