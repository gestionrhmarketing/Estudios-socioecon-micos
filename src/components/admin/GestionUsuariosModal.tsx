"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Users,
  UserCheck,
  UserX,
  Clock,
  Shield,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { UsuarioSistema, EstadoUsuario, RolUsuario } from "@/types/estudio";
import {
  cargarUsuariosSistema,
  actualizarEstadoUsuarioSistema,
  eliminarUsuarioSistema,
  ADMIN_DEFAULT,
} from "@/lib/storage";

interface GestionUsuariosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUsuariosUpdated?: () => void;
}

export function GestionUsuariosModal({
  isOpen,
  onClose,
  onUsuariosUpdated,
}: GestionUsuariosModalProps) {
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([]);
  const [loading, setLoading] = useState(true);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);
  const [filtroTab, setFiltroTab] = useState<"pendientes" | "activos" | "todos">("pendientes");
  const [mensajeFeedback, setMensajeFeedback] = useState<{ tipo: "ok" | "err"; texto: string } | null>(null);

  const recargar = async () => {
    setLoading(true);
    try {
      const data = await cargarUsuariosSistema();
      setUsuarios(data);
      if (onUsuariosUpdated) onUsuariosUpdated();
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      recargar();
      setMensajeFeedback(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const pendientes = usuarios.filter((u) => u.estado === "pendiente");
  const activos = usuarios.filter((u) => u.estado === "activo");

  const handleCambiarEstado = async (
    id: string,
    nuevoEstado: EstadoUsuario,
    nombre: string
  ) => {
    setProcesandoId(id);
    setMensajeFeedback(null);
    try {
      const res = await actualizarEstadoUsuarioSistema(id, nuevoEstado);
      if (res.success) {
        setMensajeFeedback({
          tipo: "ok",
          texto:
            nuevoEstado === "activo"
              ? `Acceso autorizado para "${nombre}". Ya puede iniciar sesión.`
              : `Solicitud de "${nombre}" rechazada.`,
        });
        await recargar();
      } else {
        setMensajeFeedback({ tipo: "err", texto: res.error || "No se pudo actualizar el estado." });
      }
    } catch {
      setMensajeFeedback({ tipo: "err", texto: "Error al procesar la acción." });
    } finally {
      setProcesandoId(null);
    }
  };

  const handleEliminar = async (id: string, nombre: string) => {
    if (!window.confirm(`¿Estás segura de eliminar la cuenta de "${nombre}"?`)) return;
    setProcesandoId(id);
    try {
      const res = await eliminarUsuarioSistema(id);
      if (res.success) {
        setMensajeFeedback({ tipo: "ok", texto: `Cuenta de "${nombre}" eliminada.` });
        await recargar();
      } else {
        setMensajeFeedback({ tipo: "err", texto: res.error || "No se pudo eliminar." });
      }
    } catch {
      setMensajeFeedback({ tipo: "err", texto: "Error al eliminar usuario." });
    } finally {
      setProcesandoId(null);
    }
  };

  const listaFiltrada =
    filtroTab === "pendientes"
      ? pendientes
      : filtroTab === "activos"
      ? activos
      : usuarios;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabecera del Modal */}
        <div className="px-6 py-5 bg-gradient-to-r from-gray-900 to-gray-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#E31E24]/20 border border-[#E31E24]/40 text-[#ff4d53]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base leading-tight">
                  Control de Evaluadores y Acceso
                </h3>
                <span className="text-[10px] bg-red-600/80 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Admin: Gaby Rodriguez
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5">
                Autoriza o rechaza solicitudes de nuevos usuarios para capturar estudios
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-700/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas de Filtrado y Contador */}
        <div className="px-6 pt-4 pb-2 border-b border-gray-100 flex items-center justify-between gap-3 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFiltroTab("pendientes")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                filtroTab === "pendientes"
                  ? "bg-[#E31E24] text-white shadow-sm"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pendientes</span>
              {pendientes.length > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    filtroTab === "pendientes"
                      ? "bg-white text-[#E31E24]"
                      : "bg-amber-100 text-amber-900"
                  }`}
                >
                  {pendientes.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setFiltroTab("activos")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                filtroTab === "activos"
                  ? "bg-gray-900 text-white shadow-sm"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Activos ({activos.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setFiltroTab("todos")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filtroTab === "todos"
                  ? "bg-gray-200 text-gray-900 font-bold"
                  : "bg-white text-gray-500 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              Todos ({usuarios.length})
            </button>
          </div>

          <button
            type="button"
            onClick={recargar}
            disabled={loading}
            className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-white rounded-lg transition"
            title="Recargar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Notificación de feedback */}
        {mensajeFeedback && (
          <div
            className={`mx-6 mt-3 p-3 rounded-xl flex items-center gap-2 text-xs font-medium animate-fadeIn ${
              mensajeFeedback.tipo === "ok"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {mensajeFeedback.tipo === "ok" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{mensajeFeedback.texto}</span>
          </div>
        )}

        {/* Lista de Usuarios */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {loading && usuarios.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-gray-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#E31E24]" />
              <span className="text-xs">Cargando lista de usuarios...</span>
            </div>
          ) : listaFiltrada.length === 0 ? (
            <div className="text-center p-12 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold text-gray-600">
                {filtroTab === "pendientes"
                  ? "No hay solicitudes pendientes en este momento"
                  : "No se encontraron usuarios en esta categoría"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Cuando alguien intente registrarse, aparecerá aquí para ser autorizado.
              </p>
            </div>
          ) : (
            listaFiltrada.map((u) => {
              const esGaby = u.email.toLowerCase() === ADMIN_DEFAULT.email.toLowerCase();
              const esPendiente = u.estado === "pendiente";
              const esActivo = u.estado === "activo";
              const esRechazado = u.estado === "rechazado";
              const procesandoEste = procesandoId === u.id;

              return (
                <div
                  key={u.id}
                  className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    esPendiente
                      ? "bg-amber-50/70 border-amber-200"
                      : esActivo
                      ? "bg-white border-gray-200 hover:border-gray-300"
                      : "bg-red-50/40 border-red-200 opacity-70"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-bold shrink-0 ${
                        esGaby
                          ? "bg-red-100 text-[#E31E24] border border-red-200"
                          : esPendiente
                          ? "bg-amber-200 text-amber-900"
                          : esActivo
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {esGaby ? <Shield className="w-5 h-5 text-[#E31E24]" /> : u.nombre.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-900">{u.nombre}</span>
                        {esGaby && (
                          <span className="text-[10px] font-extrabold bg-[#E31E24] text-white px-2 py-0.5 rounded-full">
                            Admin Principal
                          </span>
                        )}
                        {esPendiente && (
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            Pendiente
                          </span>
                        )}
                        {esRechazado && (
                          <span className="text-[10px] font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                            Rechazado
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-gray-500 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>{u.email}</span>
                        <span>•</span>
                        <span className="text-gray-400 text-[11px]">
                          Registrado: {new Date(u.createdAt).toLocaleDateString("es-MX")}
                        </span>
                        {!esGaby && (
                          <>
                            <span>•</span>
                            <span className="text-gray-400 text-[11px]">
                              Rol: <strong>{u.rol === "admin" ? "Administrador" : "Evaluador"}</strong>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Acciones para el usuario */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {esPendiente && (
                      <>
                        <button
                          type="button"
                          disabled={procesandoEste}
                          onClick={() => handleCambiarEstado(u.id, "activo", u.nombre)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm transition disabled:opacity-50"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Autorizar Acceso</span>
                        </button>

                        <button
                          type="button"
                          disabled={procesandoEste}
                          onClick={() => handleCambiarEstado(u.id, "rechazado", u.nombre)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition disabled:opacity-50"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Rechazar</span>
                        </button>
                      </>
                    )}

                    {esActivo && !esGaby && (
                      <>
                        <button
                          type="button"
                          disabled={procesandoEste}
                          onClick={() => handleCambiarEstado(u.id, "pendiente", u.nombre)}
                          className="px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 text-xs hover:bg-gray-100 transition"
                          title="Suspender acceso temporalmente"
                        >
                          Suspender
                        </button>
                        <button
                          type="button"
                          disabled={procesandoEste}
                          onClick={() => handleEliminar(u.id, u.nombre)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Eliminar usuario definitivamente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {esRechazado && (
                      <>
                        <button
                          type="button"
                          disabled={procesandoEste}
                          onClick={() => handleCambiarEstado(u.id, "activo", u.nombre)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition"
                        >
                          Reconsiderar y Activar
                        </button>
                        <button
                          type="button"
                          disabled={procesandoEste}
                          onClick={() => handleEliminar(u.id, u.nombre)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pie del modal */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>Solo los usuarios con estado Activo pueden iniciar sesión y capturar estudios.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-black text-white font-bold transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
