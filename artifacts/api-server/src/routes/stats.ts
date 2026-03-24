import { Router, type IRouter } from "express";
import { eq, sql, gte, and, min, avg } from "drizzle-orm";
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

  const vaultCreds = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(credentialsTable)
    .where(
      and(
        eq(credentialsTable.userId, userId),
        eq(credentialsTable.isVault, true)
      )
    );

  const uniqueTypesResult = await db
    .select({ count: sql<number>`cast(count(distinct ${credentialsTable.title}) as integer)` })
    .from(credentialsTable)
    .where(eq(credentialsTable.userId, userId));

  const ageStats = await db
    .select({
      oldest: sql<number>`cast(coalesce(extract(epoch from (now() - min(${credentialsTable.createdAt}))) / 86400, 0) as integer)`,
      avgAge: sql<number>`cast(coalesce(avg(extract(epoch from (now() - ${credentialsTable.createdAt})) / 86400), 0) as integer)`,
    })
    .from(credentialsTable)
    .where(eq(credentialsTable.userId, userId));

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

  const typeBreakdown = await db
    .select({
      type: credentialsTable.title,
      count: sql<number>`cast(count(*) as integer)`,
    })
    .from(credentialsTable)
    .where(eq(credentialsTable.userId, userId))
    .groupBy(credentialsTable.title)
    .orderBy(sql`count(*) desc`);

  const totalCount = totalCreds[0]?.count ?? 0;
  const oldestDays = totalCount > 0 ? (ageStats[0]?.oldest ?? null) : null;

  res.json(
    GetStatsResponse.parse({
      totalCredentials: totalCount,
      totalCategories: totalCats[0]?.count ?? 0,
      recentlyAdded: recentCreds[0]?.count ?? 0,
      vaultCredentials: vaultCreds[0]?.count ?? 0,
      uniqueTypes: uniqueTypesResult[0]?.count ?? 0,
      oldestCredentialDays: oldestDays,
      averageAgeDays: ageStats[0]?.avgAge ?? 0,
      categoryBreakdown: breakdown,
      typeBreakdown: typeBreakdown,
    })
  );
});

export default router;
