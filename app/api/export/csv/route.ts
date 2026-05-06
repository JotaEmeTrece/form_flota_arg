import { db } from "@/lib/db"; // Quitamos el import de ensureSchema

function csvEscape(value: unknown) {
  const s = String(value ?? "").replace(/"/g, '""');
  return `"${s}"`;
}

export async function GET() {
  const rowsRes = await db.execute(`
    SELECT
      id, created_at, estado, nombre_apellido, edad, zona, distancia_punto_encuentro,
      estado_motivo,
      registro_profesional, categoria_registro, registro_vencimiento, experiencia_apps,
      turno_preferencia, cochera, tipo_calle, zona_segura, disponibilidad_horaria_semanal, disponibilidad_inicio
    FROM candidates
    ORDER BY id DESC
  `);
  const rows = rowsRes.rows as Array<Record<string, unknown>>;
  const headers = [
    "id","created_at","estado","estado_motivo","nombre_apellido","edad","zona","distancia_punto_encuentro",
    "registro_profesional","categoria_registro","registro_vencimiento","experiencia_apps","turno_preferencia",
    "cochera","tipo_calle","zona_segura","disponibilidad_horaria_semanal","disponibilidad_inicio"
  ];
  const body = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => csvEscape(r[h])).join(",")),
  ].join("\n");

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=candidatos.csv",
    },
  });
}