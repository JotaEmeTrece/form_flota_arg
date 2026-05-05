import { NextResponse } from "next/server";
import { createCandidate } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    if (!payload?.nombre_apellido || !payload?.edad || !payload?.distancia_punto_encuentro) {
      return NextResponse.json({ ok: false, error: "Faltan campos obligatorios" }, { status: 400 });
    }

    const result = await createCandidate(payload);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
