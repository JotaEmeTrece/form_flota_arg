import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const since = searchParams.get("since");

  const rowsRes = await db.execute(`
    SELECT
      id, created_at, estado, estado_motivo, nombre_apellido, edad, zona,
      distancia_punto_encuentro, registro_profesional, categoria_registro,
      registro_vencimiento, experiencia_apps, turno_preferencia, cochera,
      tipo_calle, zona_segura, disponibilidad_horaria_semanal, disponibilidad_inicio
    FROM candidates
    ORDER BY id DESC
  `);
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

export async function DELETE(req: Request) {
  try {
    const { ids } = await req.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ ok: false, error: "No se enviaron IDs" }, { status: 400 });
    }

    const placeholders = ids.map(() => "?").join(",");
    await db.execute({
      sql: `DELETE FROM candidates WHERE id IN (${placeholders})`,
      args: ids,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}