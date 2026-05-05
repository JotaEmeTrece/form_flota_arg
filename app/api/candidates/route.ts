import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";

export async function GET(req: Request) {
  await ensureSchema();
  const { searchParams } = new URL(req.url);
  const since = searchParams.get("since");

  const rowsRes = await db.execute("SELECT * FROM candidates ORDER BY id DESC");
  const rows = rowsRes.rows as Array<Record<string, unknown>>;

  let newCount = rows.length;
  if (since) {
    const countRes = await db.execute({
      sql: "SELECT COUNT(1) as c FROM candidates WHERE created_at > ?",
      args: [since],
    });
    newCount = Number(countRes.rows[0]?.c || 0);
  }

  return NextResponse.json({ ok: true, items: rows, newCount });
}
