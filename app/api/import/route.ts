import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db, credentialsTable, tagsTable, spacesTable, vaultsTable } from "@/db";
import { getAuthSession } from "@/lib/auth-helpers";
import { encrypt } from "@/lib/encryption";

interface ImportCredential {
  title: string;
  email: string;
  password: string;
  tagName?: string | null;
  spaceName?: string | null;
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const userId = session.user.id;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Expected a JSON object" }, { status: 400 });
  }

  const credentials: ImportCredential[] = Array.isArray(body.credentials) ? body.credentials : (Array.isArray(body) ? body : null);
  if (!credentials) {
    return NextResponse.json({ error: "Expected 'credentials' array in import data" }, { status: 400 });
  }

  if (credentials.length === 0) {
    return NextResponse.json({ imported: 0, skipped: 0, errors: [] });
  }

  if (credentials.length > 1000) {
    return NextResponse.json({ error: "Cannot import more than 1000 credentials at once" }, { status: 400 });
  }

  const tagCache = new Map<string, number>();
  const spaceCache = new Map<string, number>();
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < credentials.length; i++) {
    const cred = credentials[i];

    if (!cred || typeof cred.title !== "string" || !cred.title.trim()) {
      errors.push(`Row ${i + 1}: missing or invalid 'title'`);
      skipped++;
      continue;
    }
    if (typeof cred.email !== "string" || !cred.email.trim()) {
      errors.push(`Row ${i + 1}: missing or invalid 'email'`);
      skipped++;
      continue;
    }
    if (typeof cred.password !== "string" || !cred.password) {
      errors.push(`Row ${i + 1}: missing or invalid 'password'`);
      skipped++;
      continue;
    }

    let tagId: number | null = null;
    if (cred.tagName) {
      if (tagCache.has(cred.tagName)) {
        tagId = tagCache.get(cred.tagName)!;
      } else {
        const [tag] = await db.select().from(tagsTable).where(and(eq(tagsTable.name, cred.tagName), eq(tagsTable.userId, userId)));
        if (tag) {
          tagId = tag.id;
          tagCache.set(cred.tagName, tag.id);
        }
      }
    }

    let spaceId: number | null = null;
    if (cred.spaceName) {
      if (spaceCache.has(cred.spaceName)) {
        spaceId = spaceCache.get(cred.spaceName)!;
      } else {
        const [space] = await db.select().from(spacesTable).where(and(eq(spacesTable.name, cred.spaceName), eq(spacesTable.userId, userId)));
        if (space) {
          spaceId = space.id;
          spaceCache.set(cred.spaceName, space.id);
        }
      }
    }

    try {
      await db.insert(credentialsTable).values({
        title: cred.title.trim(),
        email: encrypt(cred.email.trim()),
        password: encrypt(cred.password),
        tagId,
        spaceId,
        vaultId: null,
        userId,
      });
      imported++;
    } catch (e: any) {
      errors.push(`Row ${i + 1}: ${e.message ?? "insert failed"}`);
      skipped++;
    }
  }

  return NextResponse.json({ imported, skipped, errors: errors.slice(0, 20) });
}
