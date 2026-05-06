import { db } from "@/lib/db";

function csvEscape(value: unknown) {
  const s = String(value ?? "").replace(/"/g, '""');
  return `"${s}"`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const idsParam = searchParams.get("ids");

  let query = `
    SELECT
      id, created_at, estado, nombre_apellido, edad, zona, distancia_punto_encuentro,
      estado_motivo, registro_profesional, categoria_registro, registro_vencimiento, experiencia_apps,
      turno_preferencia, cochera, tipo_calle, zona_segura, disponibilidad_horaria_semanal, disponibilidad_inicio
    FROM candidates
  `;
  let args: string[] = [];

  // Si pasamos IDs por la URL, filtramos. Si no, trae todos.
  if (idsParam) {
    const ids = idsParam.split(",").filter(Boolean);
    if (ids.length > 0) {
      query += ` WHERE id IN (${ids.map(() => "?").join(",")})`;
      args = ids;
    }
  }
  query += " ORDER BY id DESC";

  const rowsRes = await db.execute({ sql: query, args });
  const rows = rowsRes.rows as Array<Record<string, unknown>>;
  
  const headers = [
    "id","created_at","estado","estado_motivo","nombre_apellido","edad","zona","distancia_punto_encuentro",
    "registro_profesional","categoria_registro","registro_vencimiento","experiencia_apps","turno_preferencia",
    "cochera","tipo_calle","zona_segura","disponibilidad_horaria_semanal","disponibilidad_inicio"
  ];

  // Agregamos el BOM (\uFEFF) para que Excel reconozca los acentos y las ñ
  const bom = "\uFEFF";
  // Usamos Punto y Coma (;) para que Excel en español separe bien las columnas
  const body = rows.map((r) => headers.map((h) => csvEscape(r[h])).join(";"));
  
  const csvContent = bom + headers.join(";") + "\n" + body.join("\n");

  return new Response(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=candidatos.csv",
    },
  });
}