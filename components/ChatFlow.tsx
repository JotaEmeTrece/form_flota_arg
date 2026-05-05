"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Opcion = { label: string; value: string };
type CampoTipo = "text" | "number" | "date" | "file" | "options" | "select";

type DocsState = {
  dni_frente: File | null;
  dni_dorso: File | null;
  registro_frente: File | null;
  registro_dorso: File | null;
};

type FormDataState = {
  nombre_apellido: string;
  edad: string;
  zona: string;
  distancia_punto_encuentro: string;
  registro_profesional: string;
  categoria_registro: string;
  categoria_registro_otra: string;
  registro_vencimiento: string;
  experiencia_apps: string;
  experiencia_otra_app: string;
  turno_preferencia: string;
  cochera: string;
  tipo_calle: string;
  zona_segura: string;
  disponibilidad_horaria_semanal: string;
  disponibilidad_inicio: string;
  documentos: DocsState;
};

type Campo = {
  key: keyof FormDataState;
  pregunta: string;
  tipo: CampoTipo;
  placeholder?: string;
  opciones?: Opcion[];
  required?: boolean;
  dependsOnRegistroSi?: boolean;
};

type ChatMessage = {
  from: "bot" | "user";
  text: string;
};

const GAS_WEBHOOK_URL = process.env.NEXT_PUBLIC_GAS_WEBHOOK_URL || "";

const CAMPOS: Campo[] = [
  { key: "nombre_apellido", pregunta: "¿Cual es tu nombre y apellido?", tipo: "text", placeholder: "Nombre completo", required: true },
  { key: "edad", pregunta: "¿Que edad tenes?", tipo: "number", placeholder: "Ej: 34", required: true },
  { key: "zona", pregunta: "¿En que zona vivis? (Partido y localidad)", tipo: "select", opciones: [
    { label: "La Matanza - San Justo", value: "La Matanza - San Justo" },
    { label: "La Matanza - Ramos Mejia", value: "La Matanza - Ramos Mejia" },
    { label: "Moron - Moron", value: "Moron - Moron" },
    { label: "Tres de Febrero - Caseros", value: "Tres de Febrero - Caseros" },
    { label: "Lomas de Zamora - Banfield", value: "Lomas de Zamora - Banfield" },
    { label: "Quilmes - Quilmes", value: "Quilmes - Quilmes" },
    { label: "Avellaneda - Avellaneda", value: "Avellaneda - Avellaneda" },
    { label: "CABA - Caballito", value: "CABA - Caballito" },
    { label: "CABA - Palermo", value: "CABA - Palermo" },
    { label: "Otro", value: "Otro" }
  ], required: true },
  { key: "distancia_punto_encuentro", pregunta: "¿A que distancia estas en colectivo del punto de encuentro?", tipo: "text", placeholder: "Ej: 40 min en colectivo", required: true },
  { key: "registro_profesional", pregunta: "¿Tenes registro de conducir profesional vigente?", tipo: "options", opciones: [{ label: "Si", value: "Si" }, { label: "No", value: "No" }], required: true },
  { key: "categoria_registro", pregunta: "¿Que categoria de registro tenes?", tipo: "select", opciones: [
    { label: "D1", value: "D1" },
    { label: "D2", value: "D2" },
    { label: "D3", value: "D3" },
    { label: "D4", value: "D4" },
    { label: "B1", value: "B1" },
    { label: "B2", value: "B2" },
    { label: "Otra", value: "Otra" }
  ], required: true },
  { key: "registro_vencimiento", pregunta: "¿Cuando vence tu registro?", tipo: "date", required: true },
  { key: "experiencia_apps", pregunta: "¿Tenes experiencia como chofer en Cabify, Uber, DiDi u otra app?", tipo: "select", opciones: [{ label: "Uber", value: "Uber" }, { label: "Cabify", value: "Cabify" }, { label: "DiDi", value: "DiDi" }, { label: "InDrive", value: "InDrive" }, { label: "Ninguna", value: "Ninguna" }, { label: "Otra app", value: "Otra app" }], required: true },
  { key: "turno_preferencia", pregunta: "¿Que turno queres trabajar?", tipo: "options", opciones: [{ label: "Dia", value: "Dia" }, { label: "Noche", value: "Noche" }, { label: "Indistinto", value: "Indistinto" }], required: true },
  { key: "cochera", pregunta: "¿Tenes cochera o lugar seguro para guardar el auto?", tipo: "options", opciones: [{ label: "Si", value: "Si" }, { label: "No", value: "No" }], required: true },
  { key: "tipo_calle", pregunta: "¿La calle donde dormiria el auto es de asfalto o tierra?", tipo: "options", opciones: [{ label: "Asfalto", value: "Asfalto" }, { label: "Tierra", value: "Tierra" }], required: true },
  { key: "zona_segura", pregunta: "¿Consideras que la zona es segura?", tipo: "options", opciones: [{ label: "Si", value: "Si" }, { label: "No", value: "No" }, { label: "Dudosa", value: "Dudosa" }], required: true },
  { key: "disponibilidad_horaria_semanal", pregunta: "¿Cual es tu disponibilidad horaria semanal?", tipo: "text", placeholder: "Ej: Lunes a sabado de 18 a 6", required: true },
  { key: "disponibilidad_inicio", pregunta: "¿Podes empezar pronto? ¿Desde cuando?", tipo: "text", placeholder: "Ej: Si, desde la semana que viene", required: true },
  { key: "documentos", pregunta: "Subi las 4 fotos requeridas: DNI frente y dorso + Registro frente y dorso.", tipo: "file", required: true, dependsOnRegistroSi: true }
];

const INITIAL_FORM: FormDataState = {
  nombre_apellido: "", edad: "", zona: "", distancia_punto_encuentro: "", registro_profesional: "", categoria_registro: "", categoria_registro_otra: "", registro_vencimiento: "", experiencia_apps: "", experiencia_otra_app: "", turno_preferencia: "", cochera: "", tipo_calle: "", zona_segura: "", disponibilidad_horaria_semanal: "", disponibilidad_inicio: "",
  documentos: { dni_frente: null, dni_dorso: null, registro_frente: null, registro_dorso: null }
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function normalizeChoice(value: string): string {
  const raw = value.trim().toLowerCase();
  if (raw === "si" || raw === "sí") return "si";
  return raw;
}

function extractMinutes(value: string): number | null {
  const m = String(value || "").match(/(\d{1,3})/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function getNextStep(currentStep: number, form: FormDataState): number {
  let idx = currentStep + 1;
  while (idx < CAMPOS.length) {
    const c = CAMPOS[idx];
    if (!c.dependsOnRegistroSi) return idx;
    if (normalizeChoice(form.registro_profesional) === "si") return idx;
    idx += 1;
  }
  return idx;
}

export default function ChatFlow() {
  const [form, setForm] = useState<FormDataState>(INITIAL_FORM);
  const [step, setStep] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { from: "bot", text: "Hola, ¿como estas? Soy Roberto, administrador de la flota. Para avanzar con la entrevista confirmame:" },
    { from: "bot", text: CAMPOS[0].pregunta }
  ]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLDivElement | null>(null);

  const campoActual = CAMPOS[step];
  const isMobile = /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(
    typeof navigator !== "undefined" ? navigator.userAgent : ""
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    composerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, step]);

  const canContinue = useMemo(() => {
    if (!campoActual) return false;
    if (campoActual.tipo === "options") return true;
    if (campoActual.tipo === "select") return true;
    if (campoActual.tipo === "file") {
      const d = form.documentos;
      return Boolean(d.dni_frente && d.dni_dorso && d.registro_frente && d.registro_dorso);
    }
    return inputValue.trim().length > 0;
  }, [campoActual, form.documentos, inputValue]);

  const pushUserAndNext = (respuesta: string, nextStep: number) => {
    const nextMessages: ChatMessage[] = [...messages, { from: "user", text: respuesta }];
    if (nextStep < CAMPOS.length) nextMessages.push({ from: "bot", text: CAMPOS[nextStep].pregunta });
    setMessages(nextMessages);
  };

  const avanzar = async (forcedValue?: string | unknown) => {
    if (!campoActual || loading) return;
    setError("");
    const safeForcedValue = typeof forcedValue === "string" ? forcedValue : undefined;

    if (campoActual.tipo === "options") {
      const value = String(safeForcedValue || "").trim();
      if (!value) return;
      const newForm = { ...form, [campoActual.key]: value } as FormDataState;
      setForm(newForm);
      if (campoActual.key === "experiencia_apps" && value === "Otra app") {
        setInputValue("");
        return;
      }
      const nextStep = getNextStep(step, newForm);
      pushUserAndNext(value, nextStep);
      if (nextStep >= CAMPOS.length) await enviarFormulario(newForm);
      else setStep(nextStep);
      return;
    }

    if (campoActual.tipo === "select") {
      const value = String(safeForcedValue || "").trim();
      if (!value) return;
      const newForm = { ...form, [campoActual.key]: value } as FormDataState;
      setForm(newForm);
      if (campoActual.key === "categoria_registro" && value === "Otra") {
        setInputValue("");
        return;
      }
      if (campoActual.key === "experiencia_apps" && value === "Otra app") {
        setInputValue("");
        return;
      }
      const nextStep = getNextStep(step, newForm);
      pushUserAndNext(value, nextStep);
      if (nextStep >= CAMPOS.length) await enviarFormulario(newForm);
      else setStep(nextStep);
      return;
    }

    if (campoActual.tipo === "file") {
      const nextStep = getNextStep(step, form);
      pushUserAndNext("Documentacion cargada", nextStep);
      if (nextStep >= CAMPOS.length) await enviarFormulario(form);
      else setStep(nextStep);
      return;
    }

    const value = inputValue.trim();
    if (campoActual.required && !value) {
      setError("Este dato es obligatorio.");
      return;
    }

    const newForm = { ...form, [campoActual.key]: value } as FormDataState;

    if (campoActual.key === "edad") {
      const n = Number(value);
      if (Number.isNaN(n) || n < 18 || n > 85) {
        setError("Ingresa una edad valida entre 18 y 85 anos.");
        return;
      }
    }

    if (campoActual.key === "distancia_punto_encuentro") {
      const mins = extractMinutes(value);
      if (mins !== null && mins > 30) {
        pushUserAndNext(value, CAMPOS.length);
        setForm(newForm);
        setInputValue("");
        await enviarFormulario(newForm);
        return;
      }
    }

    const nextStep = getNextStep(step, newForm);
    pushUserAndNext(value, nextStep);
    setForm(newForm);
    setInputValue("");

    if (nextStep >= CAMPOS.length) await enviarFormulario(newForm);
    else setStep(nextStep);
  };

  const enviarFormulario = async (snapshot: FormDataState) => {
    setLoading(true);
    setError("");
    try {
      if (!GAS_WEBHOOK_URL) throw new Error("Configuracion pendiente: falta NEXT_PUBLIC_GAS_WEBHOOK_URL en .env.local");

      const registroSi = normalizeChoice(snapshot.registro_profesional) === "si";
      let docsPayload = { dni_frente: "", dni_dorso: "", registro_frente: "", registro_dorso: "" };

      if (registroSi) {
        const docs = snapshot.documentos;
        if (!docs.dni_frente || !docs.dni_dorso || !docs.registro_frente || !docs.registro_dorso) {
          throw new Error("Faltan fotos obligatorias de documentacion.");
        }
        const [dniFrente64, dniDorso64, regFrente64, regDorso64] = await Promise.all([
          fileToBase64(docs.dni_frente), fileToBase64(docs.dni_dorso), fileToBase64(docs.registro_frente), fileToBase64(docs.registro_dorso)
        ]);
        docsPayload = { dni_frente: dniFrente64, dni_dorso: dniDorso64, registro_frente: regFrente64, registro_dorso: regDorso64 };
      }

      const payload = {
        nombre_apellido: snapshot.nombre_apellido,
        edad: Number(snapshot.edad) || snapshot.edad,
        registro_profesional: snapshot.registro_profesional,
        categoria_registro:
          snapshot.categoria_registro === "Otra" && snapshot.categoria_registro_otra.trim()
            ? snapshot.categoria_registro_otra.trim()
            : snapshot.categoria_registro,
        categoria_registro_otra: snapshot.categoria_registro_otra || "",
        registro_vencimiento: snapshot.registro_vencimiento,
        zona: snapshot.zona,
        cochera: snapshot.cochera,
        tipo_calle: snapshot.tipo_calle,
        zona_segura: snapshot.zona_segura,
        turno_preferencia: snapshot.turno_preferencia,
        experiencia_apps:
          snapshot.experiencia_apps === "Otra app" && snapshot.experiencia_otra_app.trim()
            ? `Otra app: ${snapshot.experiencia_otra_app.trim()}`
            : snapshot.experiencia_apps,
        distancia_punto_encuentro: snapshot.distancia_punto_encuentro,
        disponibilidad_horaria_semanal: snapshot.disponibilidad_horaria_semanal,
        disponibilidad_inicio: snapshot.disponibilidad_inicio,
        documentos: docsPayload
      };

      const res = await fetch(GAS_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("No se pudo enviar el formulario.");
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <section className="mx-auto w-full max-w-2xl rounded-2xl bg-white p-6 shadow-lg">
        <h1 className="text-2xl font-semibold text-slate-900">Postulacion enviada</h1>
        <p className="mt-2 text-slate-600">Gracias por completar la preseleccion. En breve el equipo de flota se va a contactar con vos.</p>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-2xl bg-white shadow-lg sm:my-4 sm:rounded-2xl">
      <header className="bg-slate-900 px-5 py-4 text-slate-100 sm:rounded-t-2xl">
        <h1 className="text-lg font-semibold">Preseleccion de Choferes</h1>
        <p className="text-sm text-slate-300">Completa el formulario conversacional</p>
      </header>

      <div className="space-y-3 overflow-y-auto p-4 max-h-[58dvh] sm:max-h-[60vh]">
        {messages.map((msg, i) => (
          <div key={`${msg.from}-${i}`} className={`max-w-[90%] rounded-2xl px-4 py-2 text-sm ${msg.from === "bot" ? "bg-slate-100 text-slate-800" : "ml-auto bg-indigo-600 text-white"}`}>
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div ref={composerRef} className="border-t border-slate-200 bg-white p-4">
        {campoActual?.tipo === "options" ? (
          <div className="grid grid-cols-2 gap-2">
            {campoActual.opciones?.map((op) => (
              <button key={op.value} type="button" onClick={() => avanzar(op.value)} disabled={loading} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">
                {op.label}
              </button>
            ))}
          </div>
        ) : campoActual?.tipo === "select" ? (
          <>
            <div className="flex gap-2">
              <select
                defaultValue=""
                onChange={(e) => {
                  const value = e.target.value;
                  if (value) avanzar(value);
                }}
                disabled={loading}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
              >
                <option value="" disabled>
                  Selecciona una opcion
                </option>
                {campoActual.opciones?.map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>
            </div>
            {campoActual.key === "categoria_registro" && form.categoria_registro === "Otra" && (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Especifica la categoria"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={async () => {
                    const otra = inputValue.trim();
                    if (!otra) {
                      setError("Especifica la categoria.");
                      return;
                    }
                    const updated = { ...form, categoria_registro_otra: otra };
                    setForm(updated);
                    setInputValue("");
                    setError("");
                    const nextStep = getNextStep(step, updated);
                    pushUserAndNext(`Otra categoria: ${otra}`, nextStep);
                    if (nextStep >= CAMPOS.length) await enviarFormulario(updated);
                    else setStep(nextStep);
                  }}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Continuar
                </button>
              </div>
            )}
            {campoActual.key === "experiencia_apps" && form.experiencia_apps === "Otra app" && (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="¿Que otra app?"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={async () => {
                    const otra = inputValue.trim();
                    if (!otra) {
                      setError("Especifica la otra app.");
                      return;
                    }
                    const updated = { ...form, experiencia_otra_app: otra };
                    setForm(updated);
                    setInputValue("");
                    setError("");
                    const nextStep = getNextStep(step, updated);
                    pushUserAndNext(`Otra app: ${otra}`, nextStep);
                    if (nextStep >= CAMPOS.length) await enviarFormulario(updated);
                    else setStep(nextStep);
                  }}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Continuar
                </button>
              </div>
            )}
          </>
        ) : campoActual?.tipo === "file" ? (
          <>
            {!isMobile ? (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                La carga de documentacion solo esta habilitada desde celular.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InputFile label="DNI frente" onChange={(f) => setForm((p) => ({ ...p, documentos: { ...p.documentos, dni_frente: f } }))} />
                  <InputFile label="DNI dorso" onChange={(f) => setForm((p) => ({ ...p, documentos: { ...p.documentos, dni_dorso: f } }))} />
                  <InputFile label="Registro frente" onChange={(f) => setForm((p) => ({ ...p, documentos: { ...p.documentos, registro_frente: f } }))} />
                  <InputFile label="Registro dorso" onChange={(f) => setForm((p) => ({ ...p, documentos: { ...p.documentos, registro_dorso: f } }))} />
                </div>
                <p className="mt-2 text-xs text-slate-500">Tenes que cargar las 4 fotos para continuar.</p>
                <button type="button" onClick={() => avanzar()} disabled={!canContinue || loading} className="mt-3 w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                  {loading ? "Enviando..." : "Finalizar y enviar"}
                </button>
              </>
            )}
          </>
        ) : (
          <div className="flex gap-2">
            <input type={campoActual?.tipo || "text"} value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder={campoActual?.placeholder || "Escribi tu respuesta"} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500" disabled={loading} />
            <button type="button" onClick={() => avanzar()} disabled={!canContinue || loading} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {loading ? "Enviando..." : "Enviar"}
            </button>
          </div>
        )}

        {error && <p className="mt-3 text-sm text-amber-700">{error}</p>}
      </div>
    </section>
  );
}

function InputFile({ label, onChange }: { label: string; onChange: (file: File | null) => void }) {
  const cameraRef = useRef<HTMLInputElement | null>(null);
  const galleryRef = useRef<HTMLInputElement | null>(null);
  const [selectedName, setSelectedName] = useState("");

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onChange(file);
    setSelectedName(file ? file.name : "");
  };

  return (
    <div className="rounded-xl border border-slate-300 p-3 text-sm text-slate-700">
      <span className="mb-2 block font-medium">{label}</span>
      <div className="grid grid-cols-1 gap-2">
        <button type="button" onClick={() => cameraRef.current?.click()} className="rounded-lg border border-slate-300 px-3 py-2 text-left text-xs font-medium text-slate-700">
          Sacar foto
        </button>
        <button type="button" onClick={() => galleryRef.current?.click()} className="rounded-lg border border-slate-300 px-3 py-2 text-left text-xs font-medium text-slate-700">
          Subir desde el dispositivo
        </button>
      </div>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={onPick} className="hidden" />
      <input ref={galleryRef} type="file" accept="image/*" onChange={onPick} className="hidden" />
      {selectedName ? <p className="mt-2 text-xs text-emerald-700">Archivo cargado: {selectedName}</p> : null}
    </div>
  );
}
