import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, serviceTypesTable } from "@/db";
import { getSession } from "@/lib/session";

const KEY_RE = /^[a-z0-9_-]+$/;
const COLOR_RE = /^#[0-9a-fA-F]{6}$/;

export async function GET() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const types = await db
    .select()
    .from(serviceTypesTable)
    .orderBy(serviceTypesTable.label);

  return NextResponse.json(types);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();

  if (typeof body.key !== "string" || body.key.length < 1 || body.key.length > 64 || !KEY_RE.test(body.key))
    return NextResponse.json({ error: "key must be 1-64 lowercase alphanumeric, dash or underscore characters" }, { status: 400 });
  if (typeof body.label !== "string" || body.label.length < 1 || body.label.length > 64)
    return NextResponse.json({ error: "label must be 1-64 characters" }, { status: 400 });
  if (typeof body.icon !== "string" || body.icon.length < 1 || body.icon.length > 64)
    return NextResponse.json({ error: "icon must be a valid icon name" }, { status: 400 });
  if (typeof body.color !== "string" || !COLOR_RE.test(body.color))
    return NextResponse.json({ error: "color must be a hex color like #RRGGBB" }, { status: 400 });

  const existing = await db
    .select({ id: serviceTypesTable.id })
    .from(serviceTypesTable)
    .where(eq(serviceTypesTable.key, body.key));

  if (existing.length > 0) {
    return NextResponse.json({ error: "A service type with this key already exists" }, { status: 409 });
  }

  const [created] = await db
    .insert(serviceTypesTable)
    .values({ key: body.key, label: body.label, icon: body.icon, color: body.color })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
