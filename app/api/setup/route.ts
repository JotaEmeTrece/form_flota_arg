import { NextResponse } from "next/server";
import { ensureSchema } from "@/lib/db";

export async function GET() {
  try {
    await ensureSchema();
    return NextResponse.json({ 
      ok: true, 
      message: "Base de datos creada y configurada correctamente. Ya puedes borrar este archivo si quieres." 
    });
  } catch (error) {
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}