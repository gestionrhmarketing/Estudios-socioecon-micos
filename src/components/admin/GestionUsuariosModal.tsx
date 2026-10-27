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
  AlertTriangle,
  Loader2,
  RefreshCw,
  UserPlus,
  Copy,
  Check,
  Landmark,
  CreditCard,
  MapPin,
  Edit3,
} from "lucide-react";
import { UsuarioSistema, EstadoUsuario, RolUsuario } from "@/types/estudio";
import {
  cargarUsuariosSistema,
  actualizarEstadoUsuarioSistema,
  eliminarUsuarioSistema,
  verificarEstadoTablaUsuarios,
  crearUsuarioManualPorAdmin,
  ADMIN_DEFAULT,
} from "@/lib/storage";
import { EditarPerfilModal } from "../auth/EditarPerfilModal";

const SQL_SCRIPT_SUPABASE = `-- TABLA DE USUARIOS DEL SISTEMA Y CONTROL DE ACCESO
create table if not exists public.usuarios_sistema (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  email text unique not null,
  password text not null,
  rol text not null default 'evaluador',
  estado text not null default 'pendiente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Admin principal Gaby Rodriguez
insert into public.usuarios_sistema (nombre, email, password, rol, estado)
values ('Gaby Rodriguez', 'seleccion@gestionrh.com.mx', '6327', 'admin', 'activo')
on conflict (email) do update 
set rol = 'admin', estado = 'activo', password = '6327';

alter table public.usuarios_sistema enable row level security;

drop policy if exists "Permitir acceso completo a usuarios_sistema" on public.usuarios_sistema;
create policy "Permitir acceso completo a usuarios_sistema"
  on public.usuarios_sistema for all
  using (true)
  with check (true);

alter table public.usuarios_sistema replica identity full;
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'usuarios_sistema'
  ) then
    alter publication supabase_realtime add table public.usuarios_sistema;
  end if;
end $$;

-- CATÁLOGO DE EVALUADORES
create table if not exists public.evaluadores (
  id uuid primary key default gen_random_uuid(),
  nombre text unique not null,
  created_at timestamptz not null default now()
);

alter table public.evaluadores enable row level security;

drop policy if exists "Permitir acceso completo a evaluadores" on public.evaluadores;
create policy "Permitir acceso completo a evaluadores"
  on public.evaluadores for all
  using (true)
  with check (true);

alter table public.evaluadores replica identity full;
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'evaluadores'
  ) then
    alter publication supabase_realtime add table public.evaluadores;
  end if;
end $$;
`;

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

  // Advertencia de tabla faltante en Supabase
  const [dbError, setDbError] = useState<string | null>(null);
  const [copiadoSQL, setCopiadoSQL] = useState(false);

  // Copiar datos bancarios al portapapeles
  const [datoCopiadoKey, setDatoCopiadoKey] = useState<string | null>(null);

  // Editar perfil de un usuario desde el panel de Gaby
  const [usuarioEnEdicion, setUsuarioEnEdicion] = useState<UsuarioSistema | null>(null);

  // Formulario de alta manual por el admin
  const [mostrarAltaManual, setMostrarAltaManual] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoEmail, setNuevoEmail] = useState("");
  const [nuevoPass, setNuevoPass] = useState("");
  const [nuevoRol] = useState<RolUsuario>("evaluador");
  const [nuevoEstado, setNuevoEstado] = useState<EstadoUsuario>("activo");
  const [guardandoManual, setGuardandoManual] = useState(false);

  const recargar = async () => {
    setLoading(true);
    try {
      const estadoDb = await verificarEstadoTablaUsuarios();
      if (!estadoDb.ok) {
        setDbError(estadoDb.error || "Tabla no encontrada");
      } else {
        setDbError(null);
      }

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
      setMostrarAltaManual(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const pendientes = usuarios.filter((u) => u.estado === "pendiente");
  const activos = usuarios.filter((u) => u.estado === "activo");

  const handleCopiarSQL = async () => {
    try {
      await navigator.clipboard.writeText(SQL_SCRIPT_SUPABASE);
      setCopiadoSQL(true);
      setTimeout(() => setCopiadoSQL(false), 3000);
    } catch {
      alert("Copia el script desde la documentación o el archivo schema.sql");
    }
  };

  const handleCopiarDato = async (texto: string, key: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      setDatoCopiadoKey(key);
      setTimeout(() => setDatoCopiadoKey(null), 2000);
    } catch {
      // ignore
    }
  };

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

  const handleCrearManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim() || !nuevoEmail.trim() || !nuevoPass.trim()) {
      setMensajeFeedback({ tipo: "err", texto: "Por favor llena todos los campos requeridos." });
      return;
    }
    setGuardandoManual(true);
    setMensajeFeedback(null);
    try {
      const res = await crearUsuarioManualPorAdmin(
        nuevoNombre,
        nuevoEmail,
        nuevoPass,
        nuevoRol,
        nuevoEstado
      );
      if (res.success) {
        setMensajeFeedback({ tipo: "ok", texto: res.message });
        setNuevoNombre("");
        setNuevoEmail("");
        setNuevoPass("");
        setMostrarAltaManual(false);
        await recargar();
      } else {
        setMensajeFeedback({ tipo: "err", texto: res.message });
      }
    } catch {
      setMensajeFeedback({ tipo: "err", texto: "Error al registrar el evaluador." });
    } finally {
      setGuardandoManual(false);
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
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabecera del Modal */}
        <div className="px-6 py-5 bg-gradient-to-r from-gray-900 to-gray-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#E31E24]/20 border border-[#E31E24]/40 text-[#ff4d53]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base leading-tight">
                  Control de Evaluadores, Datos Bancarios y Zonas
                </h3>
                <span className="text-[10px] bg-red-600/80 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Admin: Gaby Rodriguez
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5">
                Autoriza solicitudes, consulta datos bancarios (tarjeta y CLABE) y zonas de cobertura de cada evaluador
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

        {/* ALERTA: Si la tabla no está creada en Supabase */}
        {dbError && (
          <div className="mx-6 mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-sm text-amber-950 mb-1">
                  Atención: La tabla de usuarios no está creada en Supabase
                </p>
                <p className="leading-relaxed mb-2.5 text-amber-800">
                  Por este motivo, las solicitudes que envían los evaluadores desde otros dispositivos (como celulares) no se pueden sincronizar en la nube.
                  Para activarla de inmediato, ejecuta este script en el SQL Editor de tu proyecto de Supabase.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopiarSQL}
                    className="px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 text-xs"
                  >
                    {copiadoSQL ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>¡Código SQL Copiado al portapapeles!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Script SQL para Supabase</span>
                      </>
                    )}
                  </button>
                  <span className="text-[11px] text-amber-700">
                    Pégalo en <strong>supabase.com &gt; SQL Editor &gt; Run</strong>.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pestañas de Filtrado y Botón de Alta Manual */}
        <div className="px-6 pt-4 pb-2 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-gray-50/50">
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

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMostrarAltaManual(!mostrarAltaManual)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                mostrarAltaManual
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{mostrarAltaManual ? "Ocultar Alta" : "+ Alta de Evaluador"}</span>
            </button>

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
        </div>

        {/* Panel Desplegable: Alta Manual de Evaluador por Admin */}
        {mostrarAltaManual && (
          <form
            onSubmit={handleCrearManual}
            className="mx-6 mt-3 p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl animate-fadeIn space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-emerald-700" />
                Registrar y dar acceso inmediato a un evaluador
              </span>
              <span className="text-[10px] text-emerald-700">Control de Administrador</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase mb-0.5">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="Ej. Paulina Gonzalez Alvarez"
                  className="w-full px-3 py-1.5 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-emerald-600 bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase mb-0.5">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  value={nuevoEmail}
                  onChange={(e) => setNuevoEmail(e.target.value)}
                  placeholder="Ej. paugoval@hotmail.com"
                  className="w-full px-3 py-1.5 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-emerald-600 bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase mb-0.5">
                  Contraseña de Acceso
                </label>
                <input
                  type="text"
                  required
                  value={nuevoPass}
                  onChange={(e) => setNuevoPass(e.target.value)}
                  placeholder="Contraseña inicial"
                  className="w-full px-3 py-1.5 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-emerald-600 bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="estadoManual"
                    checked={nuevoEstado === "activo"}
                    onChange={() => setNuevoEstado("activo")}
                    className="text-emerald-600"
                  />
                  <span className="font-semibold text-gray-800">Activo (Puede iniciar sesión ya)</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="estadoManual"
                    checked={nuevoEstado === "pendiente"}
                    onChange={() => setNuevoEstado("pendiente")}
                    className="text-amber-600"
                  />
                  <span className="text-gray-600">Dejar como Pendiente</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={guardandoManual}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {guardandoManual ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Guardar y Habilitar</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

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
        <div className="p-6 overflow-y-auto flex-1 space-y-3.5">
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
              const esGaby = u.rol === "admin" || u.email.toLowerCase() === ADMIN_DEFAULT.email.toLowerCase();
              const esPendiente = u.estado === "pendiente";
              const esActivo = u.estado === "activo";
              const esRechazado = u.estado === "rechazado";
              const procesandoEste = procesandoId === u.id;

              const tieneBanco =
                Boolean(u.datosBancarios?.banco) ||
                Boolean(u.datosBancarios?.numeroTarjeta) ||
                Boolean(u.datosBancarios?.clabe);
              const listaZonas = Array.isArray(u.zonas) ? u.zonas : [];

              return (
                <div
                  key={u.id}
                  className={`p-4 rounded-2xl border transition flex flex-col gap-3 ${
                    esPendiente
                      ? "bg-amber-50/70 border-amber-200"
                      : esActivo
                      ? "bg-white border-gray-200 hover:border-gray-300 shadow-xs"
                      : "bg-red-50/40 border-red-200 opacity-75"
                  }`}
                >
                  {/* Fila superior: Identidad y Botones de acción */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                        {esGaby ? (
                          <Shield className="w-5 h-5 text-[#E31E24]" />
                        ) : (
                          u.nombre.charAt(0).toUpperCase()
                        )}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
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
                          {esActivo && !esGaby && (
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                              Activo
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
                        </div>
                      </div>
                    </div>

                    {/* Acciones para el usuario */}
                    <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => setUsuarioEnEdicion(u)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold transition"
                        title="Ver o editar perfil, datos bancarios y zonas"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-gray-500" />
                        <span>Editar Perfil</span>
                      </button>

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
                            className="px-2.5 py-1.5 rounded-xl border border-gray-200 text-gray-600 text-xs hover:bg-gray-100 transition"
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
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition"
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

                  {/* Fila inferior: Datos Bancarios y Zonas de Cobertura visibles para Gaby */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2.5 border-t border-gray-100 text-xs">
                    {/* Bloque: Datos Bancarios */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                        <Landmark className="w-3.5 h-3.5 text-blue-600" />
                        <span>Datos Bancarios</span>
                      </div>

                      {tieneBanco ? (
                        <div className="space-y-1 text-[11px]">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Banco:</span>
                            <span className="font-bold text-gray-900">
                              {u.datosBancarios?.banco || "No especificado"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <span className="text-gray-500 flex items-center gap-1">
                              <CreditCard className="w-3 h-3 text-gray-400" />
                              Tarjeta:
                            </span>
                            {u.datosBancarios?.numeroTarjeta ? (
                              <div className="flex items-center gap-1">
                                <span className="font-mono font-bold text-gray-800">
                                  {u.datosBancarios.numeroTarjeta}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopiarDato(
                                      u.datosBancarios!.numeroTarjeta,
                                      `card-${u.id}`
                                    )
                                  }
                                  className="p-0.5 text-blue-600 hover:bg-blue-50 rounded"
                                  title="Copiar número de tarjeta"
                                >
                                  {datoCopiadoKey === `card-${u.id}` ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">Sin capturar</span>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <span className="text-gray-500">CLABE:</span>
                            {u.datosBancarios?.clabe ? (
                              <div className="flex items-center gap-1">
                                <span className="font-mono font-bold text-gray-800">
                                  {u.datosBancarios.clabe}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopiarDato(
                                      u.datosBancarios!.clabe,
                                      `clabe-${u.id}`
                                    )
                                  }
                                  className="p-0.5 text-blue-600 hover:bg-blue-50 rounded"
                                  title="Copiar CLABE interbancaria"
                                >
                                  {datoCopiadoKey === `clabe-${u.id}` ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">Sin capturar</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-gray-400 italic">
                          Sin datos bancarios registrados aún.
                        </p>
                      )}
                    </div>

                    {/* Bloque: Zonas de Cobertura */}
                    <div className="bg-emerald-50/40 border border-emerald-200/70 rounded-xl p-2.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Zonas de Cobertura</span>
                        </div>
                        {listaZonas.length > 0 && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-full">
                            {listaZonas.length}
                          </span>
                        )}
                      </div>

                      {listaZonas.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {listaZonas.map((zona) => (
                            <span
                              key={zona}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-emerald-300 text-emerald-900 text-[11px] font-semibold shadow-2xs"
                            >
                              <MapPin className="w-2.5 h-2.5 text-emerald-600" />
                              <span>{zona}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-gray-400 italic">
                          Sin zonas de cobertura asignadas aún.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pie del modal */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>
            Cada evaluador puede actualizar sus datos bancarios y zonas desde su botón &ldquo;Mi Perfil&rdquo;.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-black text-white font-bold transition"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Modal secundario para que Gaby edite el perfil de un usuario si lo requiere */}
      {usuarioEnEdicion && (
        <EditarPerfilModal
          isOpen={Boolean(usuarioEnEdicion)}
          onClose={() => setUsuarioEnEdicion(null)}
          usuario={usuarioEnEdicion}
          esEdicionPorAdmin={true}
          onPerfilActualizado={async () => {
            await recargar();
            setUsuarioEnEdicion(null);
            setMensajeFeedback({
              tipo: "ok",
              texto: "Perfil del evaluador actualizado correctamente.",
            });
          }}
        />
      )}
    </div>
  );
}
