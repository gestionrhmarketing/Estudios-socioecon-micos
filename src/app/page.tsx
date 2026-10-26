"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  EstudioSocioeconomico,
  Dictamen,
  createEmptyEstudio,
  generateUUID,
  UsuarioSistema,
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
  getUsuarioActivo,
  setUsuarioActivo,
  cerrarSesion,
  cargarUsuariosSistema,
  suscribirUsuariosRealtime,
} from "@/lib/storage";
import { LogoGestionRH } from "@/components/pdf/BrandGraphics";
import { AuthLoginView } from "@/components/auth/AuthLoginView";
import { GestionUsuariosModal } from "@/components/admin/GestionUsuariosModal";
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
        Generando vista de 12 páginas...
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
  LogOut,
  ShieldCheck,
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

  // Sistema de autenticación interno y control de usuarios
  const [usuarioActual, setUsuarioActual] = useState<UsuarioSistema | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isGestionUsuariosOpen, setIsGestionUsuariosOpen] = useState(false);
  const [usuariosPendientesCount, setUsuariosPendientesCount] = useState(0);

  const actualizarConteoPendientes = useCallback(async () => {
    try {
      const usuarios = await cargarUsuariosSistema();
      const pend = usuarios.filter((u) => u.estado === "pendiente");
      setUsuariosPendientesCount(pend.length);
    } catch {
      // ignore
    }
  }, []);

  // Inicialización de sesión y sincronización de usuarios
  useEffect(() => {
    setMounted(true);
    const sesion = getUsuarioActivo();
    if (sesion && sesion.estado === "activo") {
      setUsuarioActual(sesion);
      setMiNombreEvaluador(sesion.nombre);
    }
    setAuthLoading(false);

    actualizarConteoPendientes();

    // Cargar catálogo de evaluadores desde Supabase
    cargarCatalogoEvaluadoresSupabase().then((lista) => {
      setCatalogoEvaluadores(lista);
    });

    // Suscripción en tiempo real para cambios de usuarios y solicitudes
    const unsubscribe = suscribirUsuariosRealtime(() => {
      actualizarConteoPendientes();
    });

    return () => {
      unsubscribe();
    };
  }, [actualizarConteoPendientes]);

  const handleLogout = () => {
    if (window.confirm("¿Deseas cerrar tu sesión?")) {
      cerrarSesion();
      setUsuarioActual(null);
      setViewMode("dashboard");
      setSelectedEstudio(null);
    }
  };

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

  // Estado para el modal de eliminación segura con confirmación por palabra 'eliminar'
  const [estudioAEliminar, setEstudioAEliminar] = useState<{
    id: string;
    nombre: string;
    folio: string;
  } | null>(null);
  const [palabraConfirmacion, setPalabraConfirmacion] = useState("");
  const [eliminandoEnProceso, setEliminandoEnProceso] = useState(false);

  const solicitarEliminar = (estudio: EstudioSocioeconomico, nombreCandidato: string) => {
    setEstudioAEliminar({
      id: estudio.id,
      nombre: nombreCandidato,
      folio: estudio.folio || "Sin folio",
    });
    setPalabraConfirmacion("");
  };

  const confirmarEliminacionDefinitiva = async () => {
    if (!estudioAEliminar) return;
    if (palabraConfirmacion.trim().toLowerCase() !== "eliminar") return;

    const idAEliminar = estudioAEliminar.id;
    setEliminandoEnProceso(true);

    // 1. Eliminación optimista instantánea (desaparece de inmediato al 1er clic sin tener que picar varias veces)
    setEstudios((prev) => prev.filter((e) => e.id !== idAEliminar));

    // 2. Ejecutar borrado permanente en Supabase y LocalStorage
    await eliminarEstudio(idAEliminar);

    // 3. Cerrar modal y resetear estado
    setEliminandoEnProceso(false);
    setEstudioAEliminar(null);
    setPalabraConfirmacion("");

    // 4. Refresco silencioso de sincronización
    await cargarDatos(true);
  };

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

  // Al hacer clic en "Nuevo Estudio", se vincula de inmediato al usuario autenticado
  // (sin preguntar "¿quién eres?" ya que la persona ha iniciado sesión)
  const handleCrearNuevo = () => {
    const capturista = usuarioActual?.nombre || miNombreEvaluador.trim() || "Evaluador";
    const nuevo = createEmptyEstudio(undefined, capturista);
    nuevo.evaluadorNombre = capturista;
    handleUpdateEstudio(nuevo);
    setSelectedEstudio(nuevo);
    setViewMode("wizard");
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

  const esAdmin = usuarioActual?.rol === "admin";

  // Control estricto de visibilidad por rol solicitado:
  // - Administradora (Gaby Rodriguez): ve y audita los estudios de todos.
  // - Evaluadores (Gerardo Garcia, Sergio Soto, etc.): ven ÚNICAMENTE sus propios registros.
  const estudiosVisibles = estudios.filter((est) => {
    if (esAdmin) return true;
    if (!usuarioActual) return false;
    const autorEstudio = (est.evaluadorNombre || "").trim().toLowerCase();
    const miNombre = (usuarioActual.nombre || "").trim().toLowerCase();
    return autorEstudio === miNombre;
  });

  const estudiosFiltrados = estudiosVisibles.filter((est) => {
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

  const countAceptables = estudiosVisibles.filter(
    (e) => e.dictamen === "ACEPTABLE"
  ).length;
  const countReservas = estudiosVisibles.filter(
    (e) => e.dictamen === "CON RESERVAS"
  ).length;
  const countNoAceptables = estudiosVisibles.filter(
    (e) => e.dictamen === "NO ACEPTABLE"
  ).length;

  // Gate de autenticación: Si aún está verificando sesión o no hay sesión activa
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-slate-100 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#E31E24] mb-3" />
        <span className="text-sm font-semibold text-gray-700">
          Iniciando sistema de Gestión RH...
        </span>
      </div>
    );
  }

  if (!usuarioActual) {
    return (
      <AuthLoginView
        onLoginSuccess={(user) => {
          setUsuarioActual(user);
          setMiNombreEvaluador(user.nombre);
          actualizarConteoPendientes();
          cargarDatos(true);
        }}
      />
    );
  }

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
                title="Versión 1.1.0"
                className="text-[10px] sm:text-[11px] font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 border border-gray-200 px-2 py-0.5 rounded-md tracking-wider transition select-none"
              >
                v1.1.0
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
                    <span>Vista PDF (12 Págs.)</span>
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

            {/* Perfil del Usuario Activo */}
            {usuarioActual && (
              <div className="flex items-center gap-2 border-l border-gray-200 pl-2 sm:pl-3 ml-1">
                {esAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsGestionUsuariosOpen(true)}
                    className="relative inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition shadow-sm"
                    title="Administrar usuarios y solicitudes de acceso"
                  >
                    <Users className="w-3.5 h-3.5 text-gray-700" />
                    <span className="hidden sm:inline">Usuarios</span>
                    {usuariosPendientesCount > 0 && (
                      <span className="bg-[#E31E24] text-white text-[10px] px-1.5 py-0.2 rounded-full font-extrabold animate-pulse">
                        {usuariosPendientesCount}
                      </span>
                    )}
                  </button>
                )}

                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-xl">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      esAdmin
                        ? "bg-[#E31E24] text-white"
                        : "bg-blue-600 text-white"
                    }`}
                  >
                    {esAdmin ? "G" : (usuarioActual.nombre.charAt(0) || "U").toUpperCase()}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-gray-800 leading-tight truncate max-w-[100px] sm:max-w-[150px]">
                      {usuarioActual.nombre}
                    </span>
                    <span className="text-[9px] text-gray-400 font-semibold leading-none">
                      {esAdmin ? "Administradora" : "Evaluador"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
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
                  {esAdmin ? "Total Estudios (Todos)" : "Mis Estudios"}
                </div>
                <div className="text-3xl font-extrabold text-gray-900 mt-1">
                  {estudiosVisibles.length}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {esAdmin ? "Vista Administrador" : `Capturados por ${usuarioActual.nombre}`}
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

            {/* SECCIÓN 1: VISTA PARA ADMINISTRADOR (GABY RODRIGUEZ) */}
            {esAdmin ? (
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#E31E24]" />
                    <h3 className="font-bold text-sm text-gray-900">
                      Control General de Captura por Persona
                    </h3>
                    <span className="text-xs bg-red-50 text-[#E31E24] px-2 py-0.5 rounded-full font-bold">
                      Vista Administradora
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsGestionUsuariosOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition shadow-sm"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Gestionar Evaluadores</span>
                    {usuariosPendientesCount > 0 && (
                      <span className="bg-[#E31E24] text-white text-[10px] px-1.5 py-0.2 rounded-full font-extrabold">
                        {usuariosPendientesCount} pendientes
                      </span>
                    )}
                  </button>
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
                    <span>Todos los evaluadores</span>
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
            ) : (
              /* SECCIÓN 2: BANNER PERSONALIZADO PARA EL EVALUADOR (SOLO VE SUS ESTUDIOS) */
              <div className="bg-white rounded-2xl p-5 border border-blue-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-extrabold text-base">
                    {(usuarioActual.nombre.charAt(0) || "U").toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-gray-900">
                        Mis Estudios Socioeconómicos
                      </h3>
                      <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                        Acceso Privado
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Sesión activa como <strong className="text-gray-900">{usuarioActual.nombre}</strong>. Solo tú tienes acceso a tus registros.
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-gray-900">
                    {estudiosVisibles.length}
                  </span>
                  <span className="block text-[11px] text-gray-400 font-semibold">
                    {estudiosVisibles.length === 1 ? "estudio tuyo" : "estudios tuyos"}
                  </span>
                </div>
              </div>
            )}

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
                                  title="Ver PDF Oficial de 12 páginas"
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
                                  onClick={() => solicitarEliminar(est, nombre)}
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
            VISTA 3: REPORTE OFICIAL PDF (12 PÁGINAS IDÉNTICAS)
        =================================================================== */}
        {viewMode === "pdf" && selectedEstudio && (
          <div>
            <div className="no-print bg-gray-800 text-white px-4 py-2.5 text-center text-xs flex flex-wrap items-center justify-center gap-4">
              <span>
                Vista previa exacta de las <strong>12 páginas</strong> del formato oficial de{" "}
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
        Gestión rh · Solución Integral · Sistema de Estudios Socioeconómicos · <strong>Versión 1.1.0</strong>
      </footer>

      {/* Modal de configuración de Supabase */}
      <SupabaseConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onConfigUpdated={cargarDatos}
      />

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN SEGURA */}
      {estudioAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-red-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-[#E31E24]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 leading-tight">
                  ¿Eliminar estudio definitivamente?
                </h3>
                <span className="text-xs font-semibold text-[#E31E24]">
                  Folio: {estudioAEliminar.folio || "Sin folio"}
                </span>
              </div>
            </div>

            <div className="bg-red-50/80 border border-red-200/80 rounded-xl p-3.5 text-xs text-red-900 leading-relaxed">
              <p className="font-bold mb-1 flex items-center gap-1.5">
                <span>⚠️</span>
                <span>Se perderá toda la información de forma irreversible:</span>
              </p>
              <p className="text-red-800">
                Se eliminarán permanentemente todos los datos, respuestas, fotografías y documentos adjuntos del expediente de{" "}
                <strong>&quot;{estudioAEliminar.nombre || "Candidato sin nombre"}&quot;</strong>.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">
                Para confirmar, escribe la palabra <span className="text-[#E31E24] font-mono font-extrabold text-sm">&quot;eliminar&quot;</span> abajo:
              </label>
              <input
                type="text"
                autoFocus
                value={palabraConfirmacion}
                onChange={(e) => setPalabraConfirmacion(e.target.value)}
                placeholder="escribe eliminar"
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    palabraConfirmacion.trim().toLowerCase() === "eliminar" &&
                    !eliminandoEnProceso
                  ) {
                    confirmarEliminacionDefinitiva();
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-900 focus:outline-none focus:border-[#E31E24] focus:ring-2 focus:ring-red-100 placeholder:text-gray-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={eliminandoEnProceso}
                onClick={() => {
                  setEstudioAEliminar(null);
                  setPalabraConfirmacion("");
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={
                  palabraConfirmacion.trim().toLowerCase() !== "eliminar" ||
                  eliminandoEnProceso
                }
                onClick={confirmarEliminacionDefinitiva}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#E31E24] hover:bg-[#B81419] disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
              >
                {eliminandoEnProceso ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar Definitivamente</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Gestión de Usuarios y Solicitudes (Exclusivo Administrador) */}
      {esAdmin && (
        <GestionUsuariosModal
          isOpen={isGestionUsuariosOpen}
          onClose={() => setIsGestionUsuariosOpen(false)}
          onUsuariosUpdated={actualizarConteoPendientes}
        />
      )}
    </div>
  );
}
