"use client";

import { useEffect, useMemo, useState } from "react";

type Candidate = {
  id: number;
  created_at: string;
  estado: string;
  estado_motivo: string;
  nombre_apellido: string;
  edad: string;
  zona: string;
};

export default function AdminCandidatosPage() {
  const [items, setItems] = useState<Candidate[]>([]);
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    const lastSeen = localStorage.getItem("candidates_last_seen") || "";
    fetch(`/api/candidates${lastSeen ? `?since=${encodeURIComponent(lastSeen)}` : ""}`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok) {
          setItems(d.items || []);
          setNewCount(Number(d.newCount || 0));
        }
      })
      .finally(() => {
        localStorage.setItem("candidates_last_seen", new Date().toISOString());
      });
  }, []);

  const badge = useMemo(
    () => (newCount > 0 ? `${newCount} nuevos candidatos` : "Sin nuevos candidatos"),
    [newCount]
  );

  return (
    <main className="mx-auto max-w-5xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Candidatos</h1>
        <a href="/api/export/csv" className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          Descargar Excel (CSV)
        </a>
      </div>
      <div className="mb-4 rounded border border-slate-200 bg-slate-50 p-3 text-sm">{badge}</div>
      <div className="overflow-x-auto rounded border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-2 text-left">Fecha</th>
              <th className="p-2 text-left">Estado</th>
              <th className="p-2 text-left">Nombre</th>
              <th className="p-2 text-left">Edad</th>
              <th className="p-2 text-left">Zona</th>
              <th className="p-2 text-left">Motivo</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-t border-slate-200">
                <td className="p-2">{new Date(it.created_at).toLocaleString()}</td>
                <td className="p-2">{it.estado}</td>
                <td className="p-2">{it.nombre_apellido}</td>
                <td className="p-2">{it.edad}</td>
                <td className="p-2">{it.zona}</td>
                <td className="p-2">{it.estado_motivo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
