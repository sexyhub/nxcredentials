import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { username, password } = body;

  const response = await auth.api.signInUsername({
    body: { username, password },
    headers: req.headers,
    asResponse: true,
  });

  return response;
}
