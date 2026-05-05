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

export function computeEstado(input: CandidateInput): "No Apto" | "Revisar" | "Apto" {
  const mins = extractMinutes(input.distancia_punto_encuentro || "");
  if (mins !== null && mins > 30) return "No Apto";
  return "Revisar";
}

export async function createCandidate(input: CandidateInput) {
  await ensureSchema();
  const estado = computeEstado(input);
  const now = new Date().toISOString();
  await db.execute({
    sql: `
      INSERT INTO candidates (
        created_at, estado, nombre_apellido, edad, zona, distancia_punto_encuentro,
        registro_profesional, categoria_registro, registro_vencimiento, experiencia_apps,
        turno_preferencia, cochera, tipo_calle, zona_segura, disponibilidad_horaria_semanal,
        disponibilidad_inicio, dni_frente, dni_dorso, registro_frente, registro_dorso
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      now,
      estado,
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
      input.documentos?.dni_frente || "",
      input.documentos?.dni_dorso || "",
      input.documentos?.registro_frente || "",
      input.documentos?.registro_dorso || "",
    ],
  });

  const idRow = await db.execute("SELECT last_insert_rowid() as id");
  const id = idRow.rows[0]?.id ?? null;
  return { id, estado };
}
