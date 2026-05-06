import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  throw new Error("Faltan TURSO_DATABASE_URL o TURSO_AUTH_TOKEN en variables de entorno.");
}

export const db = createClient({ url, authToken });

let initialized = false;

export async function ensureSchema() {
  if (initialized) return;
  await db.execute(`
CREATE TABLE IF NOT EXISTS candidates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  estado TEXT NOT NULL,
  estado_motivo TEXT NOT NULL DEFAULT '',
  nombre_apellido TEXT NOT NULL,
  edad TEXT NOT NULL,
  zona TEXT NOT NULL,
  distancia_punto_encuentro TEXT NOT NULL,
  registro_profesional TEXT NOT NULL,
  categoria_registro TEXT,
  registro_vencimiento TEXT,
  experiencia_apps TEXT,
  turno_preferencia TEXT,
  cochera TEXT,
  tipo_calle TEXT,
  zona_segura TEXT,
  disponibilidad_horaria_semanal TEXT,
  disponibilidad_inicio TEXT,
  dni_frente TEXT,
  dni_dorso TEXT,
  registro_frente TEXT,
  registro_dorso TEXT
);
`);
  const colsRes = await db.execute("PRAGMA table_info(candidates)");
  const colNames = new Set((colsRes.rows || []).map((r) => String((r as Record<string, unknown>).name || "")));
  if (!colNames.has("estado_motivo")) {
    await db.execute("ALTER TABLE candidates ADD COLUMN estado_motivo TEXT NOT NULL DEFAULT ''");
  }
  initialized = true;
}

export type CandidateInput = {
  nombre_apellido: string;
  edad: string | number;
  zona: string;
  distancia_punto_encuentro: string;
  registro_profesional: string;
  categoria_registro?: string;
  registro_vencimiento?: string;
  experiencia_apps?: string;
  turno_preferencia?: string;
  cochera?: string;
  tipo_calle?: string;
  zona_segura?: string;
  disponibilidad_horaria_semanal?: string;
  disponibilidad_inicio?: string;
  documentos?: {
    dni_frente?: string;
    dni_dorso?: string;
    registro_frente?: string;
    registro_dorso?: string;
  };
};

function extractMinutes(value: string): number | null {
  const m = String(value || "").match(/(\d{1,3})/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function docsCount(input: CandidateInput): number {
  let n = 0;
  if (input.documentos?.dni_frente) n++;
  if (input.documentos?.dni_dorso) n++;
  if (input.documentos?.registro_frente) n++;
  if (input.documentos?.registro_dorso) n++;
  return n;
}

export function computeEstado(input: CandidateInput): "No Apto" | "Revisar" | "Apto" {
  const mins = extractMinutes(input.distancia_punto_encuentro || "");
  if (mins !== null && mins > 30) return "No Apto";
  return docsCount(input) >= 4 ? "Apto" : "Revisar";
}

export function computeEstadoMotivo(input: CandidateInput, estado: "No Apto" | "Revisar" | "Apto"): string {
  const count = docsCount(input);
  if (estado === "No Apto") return "No apto: Vive a mas de 30 min de distancia.";
  if (estado === "Revisar") {
    if (count === 0) return "Revisar: Cumple con todos los requisitos aunque no cargo documentos.";
    return "Revisar: Cumple requisitos, pero no cargo toda la documentacion.";
  }
  return "Apto: Cumple en su totalidad con los requisitos y cargo documentos.";
}

export async function createCandidate(input: CandidateInput) {
  // Aca quitamos el await ensureSchema()
  const estado = computeEstado(input);
  const estadoMotivo = computeEstadoMotivo(input, estado);
  const now = new Date().toISOString();
  
  // Usamos RETURNING id para hacerlo todo en una sola query rapida
  const result = await db.execute({
    sql: `
      INSERT INTO candidates (
        created_at, estado, estado_motivo, nombre_apellido, edad, zona, distancia_punto_encuentro,
        registro_profesional, categoria_registro, registro_vencimiento, experiencia_apps,
        turno_preferencia, cochera, tipo_calle, zona_segura, disponibilidad_horaria_semanal,
        disponibilidad_inicio, dni_frente, dni_dorso, registro_frente, registro_dorso
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id
    `,
    args: [
      now,
      estado,
      estadoMotivo,
      input.nombre_apellido || "",
      String(input.edad ?? ""),
      input.zona || "",
      input.distancia_punto_encuentro || "",
      input.registro_profesional || "",
      input.categoria_registro || "",
      input.registro_vencimiento || "",
      input.experiencia_apps || "",
      input.turno_preferencia || "",
      input.cochera || "",
      input.tipo_calle || "",
      input.zona_segura || "",
      input.disponibilidad_horaria_semanal || "",
      input.disponibilidad_inicio || "",
      "",
      "",
      "",
      "",
    ],
  });

  const id = result.rows[0]?.id ?? null;
  return { id, estado };
}