import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const gasUrl = process.env.GAS_WEBHOOK_URL || process.env.NEXT_PUBLIC_GAS_WEBHOOK_URL;
    if (!gasUrl) {
      return NextResponse.json(
        { ok: false, error: "Falta configurar GAS_WEBHOOK_URL en variables de entorno." },
        { status: 500 }
      );
    }

    const payload = await req.json();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);

    const gasRes = await fetch(gasUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const text = await gasRes.text();
    let data: unknown = text;
    try {
      data = JSON.parse(text);
    } catch {}

    if (!gasRes.ok) {
      return NextResponse.json(
        { ok: false, error: "Error al enviar al webhook de Google Apps Script", details: data },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    const timedOut = details.toLowerCase().includes("aborted");
    return NextResponse.json(
      {
        ok: false,
        error: timedOut ? "Timeout al enviar al webhook de Google Apps Script." : "Error interno en el endpoint de envio",
        details,
      },
      { status: 500 }
    );
  }
}
