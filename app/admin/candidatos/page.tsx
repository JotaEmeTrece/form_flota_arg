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
  // --- ESTADOS DE AUTENTICACIÓN ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);

  // --- ESTADOS DE DATOS ---
  const [items, setItems] = useState<Candidate[]>([]);
  const [newCount, setNewCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Si ya se había logueado en esta sesión, lo dejamos pasar directo
    if (sessionStorage.getItem("admin_auth") === "true") {
      setIsAuthenticated(true);
      fetchData();
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // AQUÍ CAMBIAS EL PIN (Actualmente es 1234)
    if (pin === "6202") { 
      sessionStorage.setItem("admin_auth", "true");
      setIsAuthenticated(true);
      setPinError(false);
      fetchData();
    } else {
      setPinError(true);
      setPin("");
    }
  };

  const fetchData = () => {
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
  };

  const badge = useMemo(
    () => (newCount > 0 ? `${newCount} nuevos candidatos` : "Panel actualizado"),
    [newCount]
  );

  const toggleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((it) => it.id)));
    }
  };

  const toggleSelect = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleDownload = () => {
    let url = "/api/export/csv";
    if (selectedIds.size > 0) {
      url += `?ids=${Array.from(selectedIds).join(",")}`;
    }
    window.location.href = url;
  };

  const handleDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm("¿Seguro que quieres borrar los candidatos seleccionados?")) return;
    
    setLoading(true);
    const res = await fetch("/api/candidates", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selectedIds) }),
    });

    if (res.ok) {
      setSelectedIds(new Set());
      fetchData(); // Recarga la tabla
    } else {
      alert("Error al borrar");
    }
    setLoading(false);
  };

  // --- PANTALLA DE LOGIN SI NO ESTÁ AUTENTICADO ---
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm border border-slate-200">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Acceso Privado</h1>
            <p className="text-sm text-slate-500 mt-2">Solo personal autorizado</p>
          </div>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Ingresa el PIN"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 mb-3 text-center text-lg tracking-widest outline-none focus:border-indigo-500 transition-colors"
            autoFocus
          />
          {pinError && <p className="text-red-500 text-sm mb-3 text-center font-medium">PIN incorrecto</p>}
          <button type="submit" className="w-full bg-slate-900 text-white rounded-xl px-4 py-3 font-semibold hover:bg-slate-800 transition-colors">
            Ingresar
          </button>
        </form>
      </main>
    );
  }

  // --- PANTALLA DEL PANEL SI ESTÁ AUTENTICADO ---
  return (
    <main className="mx-auto max-w-5xl p-4">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Candidatos</h1>
        
        <div className="flex flex-wrap gap-2">
          {selectedIds.size > 0 && (
            <button 
              onClick={handleDelete}
              disabled={loading}
              className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              Borrar seleccionados ({selectedIds.size})
            </button>
          )}
          <button 
            onClick={handleDownload}
            className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {selectedIds.size > 0 ? `Descargar Excel (${selectedIds.size})` : "Descargar Todos"}
          </button>
        </div>
      </div>
      
      <div className="mb-4 rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
        {badge}
      </div>
      
      <div className="overflow-x-auto rounded border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm text-slate-800">
          <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
            <tr>
              <th className="p-3 text-left w-10">
                <input 
                  type="checkbox" 
                  checked={items.length > 0 && selectedIds.size === items.length}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-300 w-4 h-4"
                />
              </th>
              <th className="p-3 text-left">Fecha</th>
              <th className="p-3 text-left">Estado</th>
              <th className="p-3 text-left">Nombre</th>
              <th className="p-3 text-left">Edad</th>
              <th className="p-3 text-left">Zona</th>
              <th className="p-3 text-left hidden sm:table-cell">Motivo</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-4 text-center text-slate-500">
                  No hay candidatos registrados aún.
                </td>
              </tr>
            ) : (
              items.map((it) => (
                <tr key={it.id} className="border-t border-slate-100 hover:bg-slate-50 transition">
                  <td className="p-3">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(it.id)}
                      onChange={() => toggleSelect(it.id)}
                      className="rounded border-slate-300 w-4 h-4"
                    />
                  </td>
                  <td className="p-3">{new Date(it.created_at).toLocaleDateString()}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium
                      ${it.estado === 'Apto' ? 'bg-emerald-100 text-emerald-800' : 
                        it.estado === 'Revisar' ? 'bg-amber-100 text-amber-800' : 
                        'bg-red-100 text-red-800'}`}>
                      {it.estado}
                    </span>
                  </td>
                  <td className="p-3 font-medium">{it.nombre_apellido}</td>
                  <td className="p-3">{it.edad}</td>
                  <td className="p-3">{it.zona}</td>
                  <td className="p-3 text-xs text-slate-500 hidden sm:table-cell">{it.estado_motivo}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}