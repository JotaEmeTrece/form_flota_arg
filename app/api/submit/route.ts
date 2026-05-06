import { NextResponse } from "next/server";
import { createCandidate, type CandidateInput } from "@/lib/db";
import { uploadDocumentToCloudinary } from "@/lib/storage";

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let payload: Record<string, unknown>;
    let files: Record<string, File | null> = {
      dni_frente: null,
      dni_dorso: null,
      registro_frente: null,
      registro_dorso: null,
    };

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const raw = String(formData.get("payload") || "{}");
      payload = JSON.parse(raw);
      files = {
        dni_frente: (formData.get("dni_frente") as File | null) || null,
        dni_dorso: (formData.get("dni_dorso") as File | null) || null,
        registro_frente: (formData.get("registro_frente") as File | null) || null,
        registro_dorso: (formData.get("registro_dorso") as File | null) || null,
      };
    } else {
      payload = await req.json();
    }

    if (!payload?.nombre_apellido || !payload?.edad || !payload?.distancia_punto_encuentro) {
      return NextResponse.json({ ok: false, error: "Faltan campos obligatorios" }, { status: 400 });
    }

    const candidateName = String(payload.nombre_apellido || "candidato");
    const [dniFrenteUrl, dniDorsoUrl, regFrenteUrl, regDorsoUrl] = await Promise.all([
      files.dni_frente ? uploadDocumentToCloudinary(files.dni_frente, { candidateName, field: "dni_frente" }) : Promise.resolve(""),
      files.dni_dorso ? uploadDocumentToCloudinary(files.dni_dorso, { candidateName, field: "dni_dorso" }) : Promise.resolve(""),
      files.registro_frente ? uploadDocumentToCloudinary(files.registro_frente, { candidateName, field: "registro_frente" }) : Promise.resolve(""),
      files.registro_dorso ? uploadDocumentToCloudinary(files.registro_dorso, { candidateName, field: "registro_dorso" }) : Promise.resolve(""),
    ]);

    const candidateInput: CandidateInput = {
      nombre_apellido: String(payload.nombre_apellido || ""),
      edad: String(payload.edad || ""),
      zona: String(payload.zona || ""),
      distancia_punto_encuentro: String(payload.distancia_punto_encuentro || ""),
      registro_profesional: String(payload.registro_profesional || ""),
      categoria_registro: String(payload.categoria_registro || ""),
      registro_vencimiento: String(payload.registro_vencimiento || ""),
      experiencia_apps: String(payload.experiencia_apps || ""),
      turno_preferencia: String(payload.turno_preferencia || ""),
      cochera: String(payload.cochera || ""),
      tipo_calle: String(payload.tipo_calle || ""),
      zona_segura: String(payload.zona_segura || ""),
      disponibilidad_horaria_semanal: String(payload.disponibilidad_horaria_semanal || ""),
      disponibilidad_inicio: String(payload.disponibilidad_inicio || ""),
      documentos: {
        dni_frente: dniFrenteUrl,
        dni_dorso: dniDorsoUrl,
        registro_frente: regFrenteUrl,
        registro_dorso: regDorsoUrl,
      },
    };

    const result = await createCandidate(candidateInput);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}