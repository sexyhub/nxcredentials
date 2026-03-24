import { Router, type IRouter } from "express";
import { eq, sql, gte, and } from "drizzle-orm";
import { db, credentialsTable, categoriesTable } from "@workspace/db";
import { GetStatsResponse } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/stats", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;

  const totalCreds = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(credentialsTable)
    .where(eq(credentialsTable.userId, userId));

  const totalCats = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(categoriesTable)
    .where(eq(categoriesTable.userId, userId));

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentCreds = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(credentialsTable)
    .where(
      and(
        eq(credentialsTable.userId, userId),
        gte(credentialsTable.createdAt, sevenDaysAgo)
      )
    );

  const breakdown = await db
    .select({
      name: categoriesTable.name,
      color: categoriesTable.color,
      count: sql<number>`cast(count(${credentialsTable.id}) as integer)`,
    })
    .from(categoriesTable)
    .leftJoin(
      credentialsTable,
      and(
        eq(categoriesTable.id, credentialsTable.categoryId),
        eq(credentialsTable.userId, userId)
      )
    )
    .where(eq(categoriesTable.userId, userId))
    .groupBy(categoriesTable.id)
    .orderBy(categoriesTable.name);

  res.json(
    GetStatsResponse.parse({
      totalCredentials: totalCreds[0]?.count ?? 0,
      totalCategories: totalCats[0]?.count ?? 0,
      recentlyAdded: recentCreds[0]?.count ?? 0,
      categoryBreakdown: breakdown,
    })
  );
});

export default router;
