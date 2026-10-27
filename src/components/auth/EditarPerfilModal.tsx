"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Landmark,
  CreditCard,
  Hash,
  MapPin,
  Plus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
} from "lucide-react";
import { UsuarioSistema } from "@/types/estudio";
import { actualizarPerfilUsuarioSistema } from "@/lib/storage";

interface EditarPerfilModalProps {
  isOpen: boolean;
  onClose: () => void;
  usuario: UsuarioSistema;
  onPerfilActualizado: (usuarioActualizado: UsuarioSistema) => void;
  esEdicionPorAdmin?: boolean;
}

const BANCOS_SUGERIDOS = [
  "BBVA México",
  "Banamex / Citibanamex",
  "Santander",
  "Banorte",
  "HSBC",
  "Scotiabank",
  "Banco Azteca",
  "BanCoppel",
  "Nu México",
  "Inbursa",
  "Afirme",
  "BanBajío",
  "Banregio",
  "Hey Banco",
  "Spin by OXXO",
  "Mercado Pago",
];

const ZONAS_SUGERIDAS = [
  "Toluca",
  "Metepec",
  "Lerma",
  "Zinacantepec",
  "San Mateo Atenco",
  "Ocoyoacac",
  "Almoloya de Juárez",
  "Xonacatlán",
  "Ixtlahuaca",
  "Atlacomulco",
  "Tenango del Valle",
  "Tianguistenco",
  "Huixquilucan",
  "Naucalpan",
  "Tlalnepantla",
  "Atizapán",
  "Cuautitlán Izcalli",
  "Tultitlán",
  "Coacalco",
  "Ecatepec",
  "CDMX Poniente",
  "CDMX Sur",
  "CDMX Centro",
  "CDMX Norte",
  "CDMX Oriente",
];

export function EditarPerfilModal({
  isOpen,
  onClose,
  usuario,
  onPerfilActualizado,
  esEdicionPorAdmin = false,
}: EditarPerfilModalProps) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Datos bancarios
  const [banco, setBanco] = useState("");
  const [numeroTarjeta, setNumeroTarjeta] = useState("");
  const [clabe, setClabe] = useState("");

  // Zonas múltiples
  const [zonas, setZonas] = useState<string[]>([]);
  const [nuevaZonaInput, setNuevaZonaInput] = useState("");

  const [guardando, setGuardando] = useState(false);
  const [feedback, setFeedback] = useState<{ tipo: "ok" | "err"; texto: string } | null>(null);

  useEffect(() => {
    if (isOpen && usuario) {
      setNombre(usuario.nombre || "");
      setEmail(usuario.email || "");
      setPassword(usuario.password || "");
      setBanco(usuario.datosBancarios?.banco || "");
      setNumeroTarjeta(usuario.datosBancarios?.numeroTarjeta || "");
      setClabe(usuario.datosBancarios?.clabe || "");
      setZonas(Array.isArray(usuario.zonas) ? [...usuario.zonas] : []);
      setNuevaZonaInput("");
      setFeedback(null);
      setShowPassword(false);
    }
  }, [isOpen, usuario]);

  if (!isOpen || !usuario) return null;

  const agregarZona = (zonaTexto: string) => {
    const partes = zonaTexto
      .split(",")
      .map((z) => z.trim())
      .filter(Boolean);
    if (partes.length === 0) return;

    setZonas((prev) => {
      const siguiente = [...prev];
      partes.forEach((p) => {
        if (!siguiente.some((item) => item.toLowerCase() === p.toLowerCase())) {
          siguiente.push(p);
        }
      });
      return siguiente;
    });
    setNuevaZonaInput("");
  };

  const eliminarZona = (zonaAEliminar: string) => {
    setZonas((prev) => prev.filter((z) => z !== zonaAEliminar));
  };

  const toggleZonaSugerida = (zonaSugerida: string) => {
    const existe = zonas.some((z) => z.toLowerCase() === zonaSugerida.toLowerCase());
    if (existe) {
      setZonas((prev) =>
        prev.filter((z) => z.toLowerCase() !== zonaSugerida.toLowerCase())
      );
    } else {
      setZonas((prev) => [...prev, zonaSugerida]);
    }
  };

  const handleZonaKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (nuevaZonaInput.trim()) {
        agregarZona(nuevaZonaInput);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    // Si dejó texto escrito en el input de zona sin darle a "+", agregarlo automáticamente
    let zonasFinales = [...zonas];
    if (nuevaZonaInput.trim()) {
      const extras = nuevaZonaInput
        .split(",")
        .map((z) => z.trim())
        .filter(Boolean);
      extras.forEach((p) => {
        if (!zonasFinales.some((item) => item.toLowerCase() === p.toLowerCase())) {
          zonasFinales.push(p);
        }
      });
      setZonas(zonasFinales);
      setNuevaZonaInput("");
    }

    if (!nombre.trim() || !email.trim()) {
      setFeedback({
        tipo: "err",
        texto: "El nombre de usuario y el correo electrónico son obligatorios.",
      });
      return;
    }

    setGuardando(true);
    try {
      const res = await actualizarPerfilUsuarioSistema({
        id: usuario.id,
        nombre: nombre.trim(),
        email: email.trim(),
        password: password.trim(),
        datosBancarios: {
          banco: banco.trim(),
          numeroTarjeta: numeroTarjeta.trim(),
          clabe: clabe.trim(),
        },
        zonas: zonasFinales,
      });

      if (res.success && res.usuario) {
        setFeedback({ tipo: "ok", texto: res.message });
        onPerfilActualizado(res.usuario);
      } else {
        setFeedback({ tipo: "err", texto: res.message });
      }
    } catch {
      setFeedback({
        tipo: "err",
        texto: "Error inesperado al guardar los cambios del perfil.",
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabecera */}
        <div className="px-6 py-5 bg-gradient-to-r from-gray-900 to-gray-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E31E24] text-white flex items-center justify-center font-extrabold text-base shadow-sm">
              {(nombre.charAt(0) || usuario.nombre.charAt(0) || "U").toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base leading-tight">
                  {esEdicionPorAdmin
                    ? `Perfil de ${usuario.nombre}`
                    : "Mi Perfil y Datos de Evaluador"}
                </h3>
                <span className="text-[10px] bg-white/15 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {usuario.rol === "admin" ? "Administradora" : "Evaluador"}
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5">
                Actualiza tus datos de cuenta, información bancaria para pagos y zonas de cobertura
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-700/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Formulario */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
          {feedback && (
            <div
              className={`p-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-semibold animate-fadeIn ${
                feedback.tipo === "ok"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {feedback.tipo === "ok" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{feedback.texto}</span>
            </div>
          )}

          {/* SECCIÓN 1: DATOS DE CUENTA Y ACCESO */}
          <div className="bg-gray-50/80 border border-gray-200 rounded-2xl p-4 space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-200 pb-2.5">
              <User className="w-4 h-4 text-[#E31E24]" />
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-800">
                1. Datos de Usuario y Acceso
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Nombre de Usuario / Evaluador (Aparece en tus estudios)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" />
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Paulina Gonzalez Alvarez"
                    className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-gray-300 text-sm bg-white focus:border-[#E31E24] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-gray-300 text-sm bg-white focus:border-[#E31E24] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Contraseña de Acceso
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tu contraseña"
                    className="w-full pl-10 pr-10 py-2 rounded-xl border border-gray-300 text-sm bg-white focus:border-[#E31E24] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: DATOS BANCARIOS */}
          <div className="bg-blue-50/40 border border-blue-200 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-blue-200/70 pb-2.5">
              <div className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-blue-700" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-950">
                  2. Datos Bancarios
                </h4>
              </div>
              <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                Visible para Administración (Gaby Rodriguez)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Nombre del Banco
                </label>
                <div className="relative">
                  <Landmark className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" />
                  <input
                    type="text"
                    list="lista-bancos-mx"
                    value={banco}
                    onChange={(e) => setBanco(e.target.value)}
                    placeholder="Ej. BBVA, Banamex, Santander, Banorte, Azteca..."
                    className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-gray-300 text-sm bg-white focus:border-blue-600 focus:outline-none"
                  />
                  <datalist id="lista-bancos-mx">
                    {BANCOS_SUGERIDOS.map((b) => (
                      <option key={b} value={b} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Número de Tarjeta (16 dígitos)
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={24}
                    value={numeroTarjeta}
                    onChange={(e) =>
                      setNumeroTarjeta(e.target.value.replace(/[^\d\s-]/g, ""))
                    }
                    placeholder="Ej. 4152 3138 0000 0000"
                    className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-gray-300 text-sm font-mono bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  CLABE Interbancaria (18 dígitos)
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={22}
                    value={clabe}
                    onChange={(e) =>
                      setClabe(e.target.value.replace(/[^\d\s]/g, ""))
                    }
                    placeholder="18 dígitos interbancarios"
                    className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-gray-300 text-sm font-mono bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: ZONAS DE COBERTURA (MÚLTIPLES ZONAS) */}
          <div className="bg-emerald-50/40 border border-emerald-200 rounded-2xl p-4 space-y-3.5">
            <div className="flex items-center justify-between border-b border-emerald-200/70 pb-2.5">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-700" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-950">
                  3. Zonas de Cobertura (Múltiples Zonas)
                </h4>
              </div>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                {zonas.length} {zonas.length === 1 ? "zona asignada" : "zonas asignadas"}
              </span>
            </div>

            {/* Input para agregar zona libre */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  value={nuevaZonaInput}
                  onChange={(e) => setNuevaZonaInput(e.target.value)}
                  onKeyDown={handleZonaKeyDown}
                  placeholder="Escribe un municipio o zona (ej. Toluca, Metepec, Lerma) y pulsa Agregar..."
                  className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-gray-300 text-sm bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => agregarZona(nuevaZonaInput)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar</span>
              </button>
            </div>

            {/* Zonas actualmente agregadas */}
            <div>
              <span className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">
                Zonas seleccionadas:
              </span>
              {zonas.length === 0 ? (
                <div className="text-xs text-gray-400 italic bg-white/80 border border-dashed border-gray-300 rounded-xl p-3 text-center">
                  Aún no has agregado zonas. Escribe una arriba o selecciona de las sugerencias de abajo.
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {zonas.map((z) => (
                    <span
                      key={z}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-sm"
                    >
                      <MapPin className="w-3 h-3" />
                      <span>{z}</span>
                      <button
                        type="button"
                        onClick={() => eliminarZona(z)}
                        className="hover:bg-emerald-800 rounded-full p-0.5 transition"
                        title={`Quitar ${z}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Sugerencias rápidas de zonas */}
            <div className="pt-1">
              <span className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">
                Selección rápida (toca para activar o quitar):
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1">
                {ZONAS_SUGERIDAS.map((sug) => {
                  const activa = zonas.some(
                    (z) => z.toLowerCase() === sug.toLowerCase()
                  );
                  return (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => toggleZonaSugerida(sug)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition border ${
                        activa
                          ? "bg-emerald-100 border-emerald-400 text-emerald-900 font-bold"
                          : "bg-white border-gray-200 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {activa ? `✓ ${sug}` : `+ ${sug}`}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-bold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="px-5 py-2.5 rounded-xl bg-[#E31E24] hover:bg-[#B81419] text-white text-xs font-bold shadow-md transition flex items-center gap-2 disabled:opacity-50"
            >
              {guardando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando cambios...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar Perfil</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
