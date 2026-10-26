"use client";

import React, { useState } from "react";
import {
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Clock,
  Shield,
  Loader2,
} from "lucide-react";
import { LogoGestionRH } from "../pdf/BrandGraphics";
import { UsuarioSistema } from "@/types/estudio";
import {
  iniciarSesionSistema,
  registrarUsuarioSistema,
  ADMIN_DEFAULT,
} from "@/lib/storage";

interface AuthLoginViewProps {
  onLoginSuccess: (usuario: UsuarioSistema) => void;
}

export function AuthLoginView({ onLoginSuccess }: AuthLoginViewProps) {
  const [tab, setTab] = useState<"login" | "registro">("login");

  // Formulario Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Formulario Registro
  const [regNombre, setRegNombre] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Estados de carga y feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await iniciarSesionSistema(loginEmail, loginPassword);
      if (res.success && res.usuario) {
        onLoginSuccess(res.usuario);
      } else {
        setErrorMsg(res.message);
      }
    } catch {
      setErrorMsg("Ocurrió un error al intentar iniciar sesión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegistroSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await registrarUsuarioSistema(regNombre, regEmail, regPassword);
      if (res.success) {
        setSuccessMsg(res.message);
        // Limpiar campos de registro
        setRegNombre("");
        setRegEmail("");
        setRegPassword("");
      } else {
        setErrorMsg(res.message);
      }
    } catch {
      setErrorMsg("Error al registrar la solicitud. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const cargarCredencialesAdmin = () => {
    setLoginEmail(ADMIN_DEFAULT.email);
    setLoginPassword(ADMIN_DEFAULT.password || "6327");
    setErrorMsg("");
    setSuccessMsg("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden flex flex-col">
        {/* Cabecera Corporativa */}
        <div className="p-8 text-center bg-white border-b border-gray-100 flex flex-col items-center">
          <div className="mb-3">
            <LogoGestionRH className="h-14" />
          </div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
            Estudios Socioeconómicos
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Plataforma de captura, dictamen y reportes oficiales
          </p>

          {/* Selector de Pestañas (Iniciar Sesión / Registro) */}
          <div className="grid grid-cols-2 bg-gray-100 p-1 rounded-2xl w-full mt-6 border border-gray-200">
            <button
              type="button"
              onClick={() => {
                setTab("login");
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`py-2 text-xs font-bold rounded-xl transition ${
                tab === "login"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("registro");
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`py-2 text-xs font-bold rounded-xl transition ${
                tab === "registro"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Registrarse
            </button>
          </div>
        </div>

        {/* Mensajes de Alerta */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span className="leading-snug">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-800 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold block mb-0.5">¡Solicitud recibida!</span>
              <span>{successMsg}</span>
            </div>
          </div>
        )}

        {/* Formulario 1: Iniciar Sesión */}
        {tab === "login" && (
          <form onSubmit={handleLoginSubmit} className="p-8 space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="ej. seleccion@gestionrh.com.mx"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-[#E31E24] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type={showLoginPassword ? "text" : "password"}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Tu contraseña interna"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-[#E31E24] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showLoginPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-[#E31E24] hover:bg-[#B81419] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validando credenciales...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Ingresar al Sistema</span>
                </>
              )}
            </button>

            {/* Acceso Rápido para Admin */}
            <div className="pt-4 border-t border-gray-100 flex flex-col items-center gap-1.5 text-center">
              <span className="text-[11px] text-gray-400">
                ¿Eres la Administradora del Sistema?
              </span>
              <button
                type="button"
                onClick={cargarCredencialesAdmin}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-600 hover:text-[#E31E24] bg-gray-50 hover:bg-gray-100 px-3 py-1 rounded-lg border border-gray-200 transition"
              >
                <Shield className="w-3 h-3 text-[#E31E24]" />
                <span>Autollenar acceso Gaby Rodriguez</span>
              </button>
            </div>
          </form>
        )}

        {/* Formulario 2: Registro de Nuevo Evaluador */}
        {tab === "registro" && (
          <form onSubmit={handleRegistroSubmit} className="p-8 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 text-xs text-blue-800 flex items-start gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                Al registrarte, tu solicitud será enviada a la administradora (Gaby Rodriguez) para ser autorizada antes de poder ingresar.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Nombre Completo (como aparecerá en tus estudios)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={regNombre}
                  onChange={(e) => setRegNombre(e.target.value)}
                  placeholder="Ej. Gerardo Garcia o Sergio Soto"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-[#E31E24] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="tucorreo@ejemplo.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-[#E31E24] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Crea una Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type={showRegPassword ? "text" : "password"}
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-[#E31E24] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showRegPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enviando solicitud...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Enviar Solicitud de Registro</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Pie con versión y derechos */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 text-center text-[11px] text-gray-400">
          <span>Gestión rh • Sistema Interno de Validación v1.0.9</span>
        </div>
      </div>
    </div>
  );
}
