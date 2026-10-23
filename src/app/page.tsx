"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  EstudioSocioeconomico,
  Dictamen,
  createEmptyEstudio,
  generateUUID,
} from "@/types/estudio";
import {
  listarEstudios,
  guardarEstudio,
  guardarEstudioInmediato,
  eliminarEstudio,
  suscribirEstudiosRealtime,
  getCatalogoEvaluadores,
  cargarCatalogoEvaluadoresSupabase,
  guardarEvaluadorEnSupabase,
} from "@/lib/storage";
import { LogoGestionRH } from "@/components/pdf/BrandGraphics";
import dynamic from "next/dynamic";

// Carga perezosa (lazy load) de componentes pesados para carga instantánea del Dashboard inicial
const EstudioFormWizard = dynamic(
  () =>
    import("@/components/wizard/EstudioFormWizard").then(
      (mod) => mod.EstudioFormWizard
    ),
  {
    loading: () => (
      <div className="flex items-center justify-center p-12 text-sm text-gray-500 font-medium">
        Cargando formulario...
      </div>
    ),
  }
);

const EstudioPDFView = dynamic(
  () =>
    import("@/components/pdf/EstudioPDFView").then((mod) => mod.EstudioPDFView),
  {
    loading: () => (
      <div className="flex items-center justify-center p-12 text-sm text-gray-500 font-medium">
        Generando vista de 11 páginas...
      </div>
    ),
  }
);

const SupabaseConfigModal = dynamic(
  () =>
    import("@/components/SupabaseConfigModal").then(
      (mod) => mod.SupabaseConfigModal
    ),
  { ssr: false }
);
import {
  Plus,
  Search,
  FileText,
  Edit3,
  Trash2,
  Printer,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowLeft,
  Download,
  FolderArchive,
  Loader2,
  User,
  Users,
} from "lucide-react";

type ViewMode = "dashboard" | "wizard" | "pdf";

export default function HomePage() {
  const [estudios, setEstudios] = useState<EstudioSocioeconomico[]>([]);
  const [selectedEstudio, setSelectedEstudio] =
    useState<EstudioSocioeconomico | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");

  // Filtros de búsqueda
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDictamen, setFilterDictamen] = useState<Dictamen | "TODOS">(
    "TODOS"
  );
  const [filterEvaluador, setFilterEvaluador] = useState<string>("TODOS");
  const [miNombreEvaluador, setMiNombreEvaluador] = useState<string>("");
  const [catalogoEvaluadores, setCatalogoEvaluadores] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  // Inicialización de capturista y catálogo desde Supabase
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("gestionrh_mi_evaluador");
      if (saved) setMiNombreEvaluador(saved);
    }
    // Cargar personas reales guardadas en Supabase
    cargarCatalogoEvaluadoresSupabase().then((lista) => {
      setCatalogoEvaluadores(lista);
    });
  }, []);

  const handleSetMiNombre = async (nombre: string) => {
    const limpio = nombre.trim();
    setMiNombreEvaluador(limpio);
    if (typeof window !== "undefined") {
      if (limpio) {
        localStorage.setItem("gestionrh_mi_evaluador", limpio);
        await guardarEvaluadorEnSupabase(limpio);
        setCatalogoEvaluadores((prev) =>
          Array.from(new Set([...prev, limpio])).sort((a, b) => a.localeCompare(b))
        );
      } else {
        localStorage.removeItem("gestionrh_mi_evaluador");
      }
    }
  };

  // Estado de almacenamiento (Supabase / Local)
  const [storageSource, setStorageSource] = useState<"supabase" | "local">(
    "local"
  );
  const [syncMessage, setSyncMessage] = useState<string>("Guardado al día");
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const cargarDatos = useCallback(async (forceRefresh = false) => {
    const res = await listarEstudios(forceRefresh);
    setEstudios(res.estudios);
    setStorageSource(res.source);
    if (res.error) {
      setSyncMessage(res.error);
    } else {
      setSyncMessage(
        res.source === "supabase"
          ? "Sincronizado con Supabase"
          : "Modo Local / Offline"
      );
    }
  }, []);

  useEffect(() => {
    cargarDatos();

    // 1. Suscripción en Tiempo Real con WebSockets de Supabase:
    // Si cualquier dispositivo agrega, actualiza o borra un estudio,
    // se refleja en todos los demás teléfonos y PCs en menos de 100ms.
    const desuscribir = suscribirEstudiosRealtime((evento) => {
      if (evento.tipo === "DELETE" && evento.idEliminado) {
        const idDel = evento.idEliminado;
        setEstudios((prev) => prev.filter((e) => e.id !== idDel));
      } else if (evento.tipo === "INSERT" && evento.estudio) {
        const nuevo = evento.estudio;
        setEstudios((prev) => {
          if (prev.some((e) => e.id === nuevo.id)) return prev;
          return [nuevo, ...prev];
        });
      } else if (evento.tipo === "UPDATE" && evento.estudio) {
        const actualizado = evento.estudio;
        setEstudios((prev) => {
          const idx = prev.findIndex((e) => e.id === actualizado.id);
          if (idx >= 0) {
            const copia = [...prev];
            copia[idx] = actualizado;
            return copia;
          }
          return [actualizado, ...prev];
        });
      }
    });

    // 2. Re-sincronización automática cuando el usuario desbloquea el teléfono o vuelve a la pestaña
    const handleReactivar = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        cargarDatos(true);
      }
    };

    if (typeof window !== "undefined") {
      document.addEventListener("visibilitychange", handleReactivar);
      window.addEventListener("focus", handleReactivar);
    }

    return () => {
      if (desuscribir) desuscribir();
      if (typeof window !== "undefined") {
        document.removeEventListener("visibilitychange", handleReactivar);
        window.removeEventListener("focus", handleReactivar);
      }
    };
  }, [cargarDatos]);

  // Autoguardado optimizado en segundo plano (Borrador local para no perder datos si se cierra la app)
  const handleUpdateEstudio = (updated: EstudioSocioeconomico) => {
    setSelectedEstudio(updated);
    setSyncMessage("Borrador guardado");

    // Actualiza el listado en memoria local sin esperar la red
    setEstudios((prev) => {
      const idx = prev.findIndex((e) => e.id === updated.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      }
      return [updated, ...prev];
    });

    // Guardado local de borrador inmediato (protección anti-cierre)
    guardarEstudio(updated, () => {
      // guardado local completado
    });
  };

  // Guardado explícito a la Base de Datos en Supabase (cuando presiona "Guardar Datos" o "Guardar y Continuar")
  const handleSaveToDatabase = async (updated: EstudioSocioeconomico) => {
    setSelectedEstudio(updated);
    setSyncMessage("Guardando en Supabase...");
    const res = await guardarEstudioInmediato(updated);
    setEstudios((prev) => {
      const idx = prev.findIndex((e) => e.id === updated.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      }
      return [updated, ...prev];
    });
    if (res.savedInSupabase) {
      setStorageSource("supabase");
      setSyncMessage("Sincronizado con Supabase");
    } else if (res.error) {
      setSyncMessage(`Local (Supabase: ${res.error})`);
    } else {
      setSyncMessage("Guardado localmente");
    }
  };

  // Estado de descarga masiva ZIP
  const [descargandoZipId, setDescargandoZipId] = useState<string | null>(null);

  // Descargar todo el expediente documental en un archivo ZIP (para oficina)
  const handleDescargarExpedienteZip = async (estudio: EstudioSocioeconomico) => {
    const adjuntos = estudio.documentosPresentados.filter((d) => d.fileUrl);
    if (adjuntos.length === 0) {
      alert("Este estudio no tiene documentos adjuntos subidos aún.");
      return;
    }

    setDescargandoZipId(estudio.id);
    try {
      // Importación dinámica bajo demanda para no inflar el bundle inicial
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      const folio = (estudio.folio || "EXPEDIENTE").replace(/[^a-zA-Z0-9_-]/g, "_");
      const folder = zip.folder(folio) || zip;

      // Descargar cada archivo y agregarlo al ZIP
      for (const doc of adjuntos) {
        if (!doc.fileUrl) continue;
        try {
          const res = await fetch(doc.fileUrl);
          if (res.ok) {
            const blob = await res.blob();
            const ext = doc.fileName?.split(".").pop() || "jpg";
            const cleanName = doc.nombre
              .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]/g, "_")
              .slice(0, 40);
            folder.file(`${doc.id}_${cleanName}.${ext}`, blob);
          }
        } catch (fetchErr) {
          console.error(`Error descargando doc ${doc.id}:`, fetchErr);
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Expediente_${folio}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error creando ZIP";
      alert(`Error al generar el ZIP: ${msg}`);
    } finally {
      setDescargandoZipId(null);
    }
  };

  // Al hacer clic en "Nuevo Estudio" NO se envía a Supabase de inmediato,
  // se abre en modo borrador y se almacena solo en el dispositivo hasta que el usuario decida guardar
  const handleCrearNuevo = () => {
    let capturista = miNombreEvaluador.trim();
    if (!capturista && nombresEvaluadoresDisponibles.length > 0) {
      const resp = window.prompt(
        `¿Quién realiza este estudio?\n(Personas guardadas: ${nombresEvaluadoresDisponibles.join(", ")})\nEscribe tu nombre o presiona Aceptar para continuar:`,
        ""
      );
      if (resp && resp.trim()) {
        capturista = resp.trim();
        handleSetMiNombre(capturista);
      }
    }
    const nuevo = createEmptyEstudio(undefined, capturista || undefined);
    handleUpdateEstudio(nuevo);
    setSelectedEstudio(nuevo);
    setViewMode("wizard");
  };

  const handleEliminar = async (id: string, nombre: string) => {
    if (
      !window.confirm(
        `¿Seguro que deseas eliminar el estudio de "${
          nombre || "Candidato sin nombre"
        }"?`
      )
    ) {
      return;
    }
    await eliminarEstudio(id);
    await cargarDatos(true);
  };

  const handleExportJSON = (estudio: EstudioSocioeconomico) => {
    const blob = new Blob([JSON.stringify(estudio, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${estudio.folio || "estudio"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(
          ev.target?.result as string
        ) as EstudioSocioeconomico;
        if (parsed && parsed.folio) {
          parsed.id = parsed.id || generateUUID();
          await guardarEstudio(parsed);
          await cargarDatos();
        }
      } catch {
        alert("El archivo JSON no tiene un formato válido.");
      }
    };
    reader.readAsText(file);
  };

  // Conteo de capturas por persona para el Dashboard
  const evaluadoresMap = estudios.reduce((acc, est) => {
    const ev = (est.evaluadorNombre || "Sin asignar").trim();
    acc[ev] = (acc[ev] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const listaEvaluadoresConEstudios = Object.keys(evaluadoresMap);

  // Lista combinada de personas (del catálogo en Supabase + quienes hayan guardado estudios)
  const nombresEvaluadoresDisponibles = Array.from(
    new Set([
      ...catalogoEvaluadores,
      ...listaEvaluadoresConEstudios.filter((n) => n !== "Sin asignar"),
    ])
  ).sort((a, b) => a.localeCompare(b));

  const estudiosFiltrados = estudios.filter((est) => {
    const nombre = (
      est.candidatoNombrePortada ||
      est.datosGenerales.nombre ||
      ""
    ).toLowerCase();
    const folio = (est.folio || "").toLowerCase();
    const puesto = (est.puestoSolicitado || "").toLowerCase();
    const evaluador = (est.evaluadorNombre || "Sin asignar").toLowerCase();
    const q = searchQuery.toLowerCase().trim();

    const matchesQuery =
      !q ||
      nombre.includes(q) ||
      folio.includes(q) ||
      puesto.includes(q) ||
      evaluador.includes(q);

    const matchesDictamen =
      filterDictamen === "TODOS" || est.dictamen === filterDictamen;

    const matchesEvaluador =
      filterEvaluador === "TODOS" ||
      (est.evaluadorNombre || "Sin asignar") === filterEvaluador;

    return matchesQuery && matchesDictamen && matchesEvaluador;
  });

  const countAceptables = estudios.filter(
    (e) => e.dictamen === "ACEPTABLE"
  ).length;
  const countReservas = estudios.filter(
    (e) => e.dictamen === "CON RESERVAS"
  ).length;
  const countNoAceptables = estudios.filter(
    (e) => e.dictamen === "NO ACEPTABLE"
  ).length;

  return (
    <div className="min-h-screen flex flex-col">
      {/* BARRA SUPERIOR (Se oculta al imprimir/exportar PDF) */}
      <header className="no-print sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200 px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            {viewMode !== "dashboard" && (
              <button
                type="button"
                onClick={() => setViewMode("dashboard")}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Panel</span>
              </button>
            )}
            <div
              onClick={() => setViewMode("dashboard")}
              className="cursor-pointer flex items-center gap-2.5"
            >
              <LogoGestionRH className="h-10" />
              <button
                type="button"
                onDoubleClick={() => setIsConfigOpen(true)}
                title="Versión 1.0.6"
                className="text-[10px] sm:text-[11px] font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 border border-gray-200 px-2 py-0.5 rounded-md tracking-wider transition select-none"
              >
                v1.0.6
              </button>
            </div>
          </div>

          {/* Controles contextuales según la vista */}
          <div className="flex items-center gap-2 sm:gap-3">
            {viewMode === "dashboard" && (
              <button
                type="button"
                onClick={handleCrearNuevo}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E31E24] text-white text-xs sm:text-sm font-bold hover:bg-[#B81419] shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Estudio</span>
              </button>
            )}

            {viewMode !== "dashboard" && selectedEstudio && (
              <>
                <div className="bg-gray-100 p-1 rounded-xl flex items-center">
                  <button
                    type="button"
                    onClick={() => setViewMode("wizard")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      viewMode === "wizard"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Captura Wizard</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("pdf")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      viewMode === "pdf"
                        ? "bg-[#E31E24] text-white shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Vista PDF (11 Págs.)</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (viewMode !== "pdf") {
                      setViewMode("pdf");
                      setTimeout(() => window.print(), 350);
                    } else {
                      window.print();
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-black shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Descargar / Imprimir PDF</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1">
        {/* ===================================================================
            VISTA 1: PANEL DE CONTROL (DASHBOARD)
        =================================================================== */}
        {viewMode === "dashboard" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
            {/* Tarjetas de métricas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                <div className="text-xs font-bold uppercase text-gray-400">
                  Total Estudios
                </div>
                <div className="text-3xl font-extrabold text-gray-900 mt-1">
                  {estudios.length}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Formato Oficial 2026
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-emerald-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-emerald-700">
                    Aceptables
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-3xl font-extrabold text-emerald-700 mt-1">
                  {countAceptables}
                </div>
                <div className="text-xs text-emerald-600/80 mt-1">
                  Sin información negativa
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-amber-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-amber-700">
                    Con Reservas
                  </span>
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-3xl font-extrabold text-amber-700 mt-1">
                  {countReservas}
                </div>
                <div className="text-xs text-amber-600/80 mt-1">
                  Antecedentes no graves
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-red-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-[#E31E24]">
                    No Aceptables
                  </span>
                  <XCircle className="w-4 h-4 text-[#E31E24]" />
                </div>
                <div className="text-3xl font-extrabold text-[#E31E24] mt-1">
                  {countNoAceptables}
                </div>
                <div className="text-xs text-red-600/80 mt-1">
                  Antecedentes graves
                </div>
              </div>
            </div>

            {/* Barra de Control de Capturistas (Solo nombres reales guardados en Supabase) */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#E31E24]" />
                  <h3 className="font-bold text-sm text-gray-900">
                    Control de Captura por Persona
                  </h3>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-semibold">
                    Base de Datos Supabase
                  </span>
                </div>

                {/* Identificación de quién está usando este dispositivo */}
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
                    Mi nombre:
                  </span>
                  <select
                    value={miNombreEvaluador}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "__OTRO__") {
                        const nuevo = window.prompt("Escribe tu nombre completo para guardarlo en la Base de Datos:");
                        if (nuevo && nuevo.trim()) {
                          handleSetMiNombre(nuevo.trim());
                        }
                      } else {
                        handleSetMiNombre(val);
                      }
                    }}
                    className="border border-gray-300 bg-white rounded-lg px-2.5 py-1 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#E31E24] min-w-[170px]"
                  >
                    <option value="">
                      {nombresEvaluadoresDisponibles.length === 0
                        ? "-- Sin personas registradas --"
                        : "-- Elige tu nombre --"}
                    </option>
                    {mounted &&
                      nombresEvaluadoresDisponibles.map((nombre) => (
                        <option key={nombre} value={nombre}>
                          {nombre}
                        </option>
                      ))}
                    {mounted &&
                      miNombreEvaluador &&
                      !nombresEvaluadoresDisponibles.includes(miNombreEvaluador) && (
                        <option value={miNombreEvaluador}>
                          {miNombreEvaluador}
                        </option>
                      )}
                    <option value="__OTRO__" className="text-[#E31E24] font-bold">
                      + Registrar nueva persona...
                    </option>
                  </select>
                </div>
              </div>

              {/* Píldoras con conteo de estudios por persona */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs font-bold text-gray-500 mr-1">
                  Filtrar por:
                </span>
                <button
                  type="button"
                  onClick={() => setFilterEvaluador("TODOS")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    filterEvaluador === "TODOS"
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <span>Todos los miembros</span>
                  <span className="bg-white/20 px-1.5 py-0.2 rounded-full text-[10px]">
                    {estudios.length}
                  </span>
                </button>

                {listaEvaluadoresConEstudios.map((evaluador) => {
                  const count = evaluadoresMap[evaluador];
                  const isSelected = filterEvaluador === evaluador;
                  return (
                    <button
                      key={evaluador}
                      type="button"
                      onClick={() => setFilterEvaluador(evaluador)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        isSelected
                          ? "bg-[#E31E24] text-white shadow-sm"
                          : "bg-red-50 text-red-900 border border-red-200 hover:bg-red-100"
                      }`}
                    >
                      <span>{evaluador}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          isSelected
                            ? "bg-white text-[#E31E24]"
                            : "bg-[#E31E24] text-white"
                        }`}
                      >
                        {count} {count === 1 ? "estudio" : "estudios"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Buscador y Filtros */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:max-w-md">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por folio, nombre del candidato o puesto..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-[#E31E24] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
                {(
                  [
                    "TODOS",
                    "ACEPTABLE",
                    "CON RESERVAS",
                    "NO ACEPTABLE",
                  ] as const
                ).map((est) => (
                  <button
                    key={est}
                    type="button"
                    onClick={() => setFilterDictamen(est)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                      filterDictamen === est
                        ? "bg-[#E31E24] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {est}
                  </button>
                ))}
              </div>
            </div>

            {/* Tabla / Tarjetas de Estudios */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {estudiosFiltrados.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto stroke-1" />
                  <div className="text-base font-bold text-gray-800">
                    No se encontraron estudios socioeconómicos
                  </div>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    Crea un nuevo estudio para iniciar la captura paso a paso o ajusta los filtros de búsqueda.
                  </p>
                  <button
                    type="button"
                    onClick={handleCrearNuevo}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E31E24] text-white text-xs font-bold hover:bg-[#B81419]"
                  >
                    <Plus className="w-4 h-4" />
                    Crear Primer Estudio
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold uppercase text-gray-500">
                        <th className="py-3.5 px-4">Folio</th>
                        <th className="py-3.5 px-4">Candidato</th>
                        <th className="py-3.5 px-4">Capturado por</th>
                        <th className="py-3.5 px-4">Puesto Solicitado</th>
                        <th className="py-3.5 px-4">Fecha Aplicación</th>
                        <th className="py-3.5 px-4 text-center">Dictamen</th>
                        <th className="py-3.5 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-sm">
                      {estudiosFiltrados.map((est) => {
                        const nombre =
                          est.candidatoNombrePortada ||
                          est.datosGenerales.nombre ||
                          "Sin nombre capturado";
                        const evaluador = est.evaluadorNombre || "Sin asignar";
                        return (
                          <tr
                            key={est.id}
                            className="hover:bg-gray-50/80 transition"
                          >
                            <td className="py-3.5 px-4 font-bold text-[#E31E24] whitespace-nowrap">
                              {est.folio}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-gray-900">
                                {nombre}
                              </div>
                              <div className="text-xs text-gray-500">
                                {est.datosContacto.delegacionMunicipio ||
                                  "Metepec"}{" "}
                                • {est.datosContacto.telefonoCelular || "Sin tel."}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold">
                                <User className="w-3 h-3 text-gray-400" />
                                {evaluador}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-gray-700 font-medium">
                              {est.puestoSolicitado || "—"}
                            </td>
                            <td className="py-3.5 px-4 text-xs text-gray-600 whitespace-nowrap">
                              {est.fechaRealizacion || est.fechaElaboracion}
                            </td>
                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                  est.dictamen === "ACEPTABLE"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : est.dictamen === "CON RESERVAS"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-red-100 text-[#E31E24]"
                                }`}
                              >
                                {est.dictamen}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedEstudio(est);
                                    setViewMode("wizard");
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold"
                                  title="Editar en Wizard"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Editar</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedEstudio(est);
                                    setViewMode("pdf");
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-[#E31E24] text-xs font-bold"
                                  title="Ver PDF Oficial de 11 páginas"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>PDF</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDescargarExpedienteZip(est)}
                                  disabled={descargandoZipId === est.id}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold disabled:opacity-50"
                                  title="Descargar todos los archivos adjuntos en un archivo ZIP"
                                >
                                  {descargandoZipId === est.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                                  ) : (
                                    <FolderArchive className="w-3.5 h-3.5" />
                                  )}
                                  <span>Descargar ZIP</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleExportJSON(est)}
                                  className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
                                  title="Respaldar JSON"
                                >
                                  <Download className="w-4 h-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleEliminar(est.id, nombre)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                                  title="Eliminar estudio"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================================================================
            VISTA 2: FORMULARIO PASO A PASO (WIZARD)
        =================================================================== */}
        {viewMode === "wizard" && selectedEstudio && (
          <div className="px-4 sm:px-8 py-6">
            <EstudioFormWizard
              estudio={selectedEstudio}
              onChange={handleUpdateEstudio}
              onSaveToDatabase={handleSaveToDatabase}
              onSwitchToPDF={() => setViewMode("pdf")}
            />
          </div>
        )}

        {/* ===================================================================
            VISTA 3: REPORTE OFICIAL PDF (11 PÁGINAS IDÉNTICAS)
        =================================================================== */}
        {viewMode === "pdf" && selectedEstudio && (
          <div>
            <div className="no-print bg-gray-800 text-white px-4 py-2.5 text-center text-xs flex flex-wrap items-center justify-center gap-4">
              <span>
                Vista previa exacta de las <strong>11 páginas</strong> del formato oficial de{" "}
                <strong>Gestión rh (2026)</strong>.
              </span>
              <span className="text-gray-300">
                Al hacer clic en <strong>&quot;Descargar / Imprimir PDF&quot;</strong>, selecciona{" "}
                <em>&quot;Guardar como PDF&quot;</em> con márgenes en <em>&quot;Ninguno&quot;</em> y{" "}
                <em>&quot;Gráficos de fondo&quot;</em> activado.
              </span>
            </div>
            <EstudioPDFView estudio={selectedEstudio} />
          </div>
        )}
      </main>

      {/* PIE DE PÁGINA CORPORATIVO */}
      <footer className="no-print mt-auto border-t border-gray-200 bg-white/70 py-4 text-center text-xs text-gray-400">
        Gestión rh · Solución Integral · Sistema de Estudios Socioeconómicos · <strong>Versión 1.0.6</strong>
      </footer>

      {/* Modal de configuración de Supabase */}
      <SupabaseConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onConfigUpdated={cargarDatos}
      />
    </div>
  );
}
