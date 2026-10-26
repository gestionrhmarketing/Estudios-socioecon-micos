"use client";

import React, { useState } from "react";
import {
  EstudioSocioeconomico,
  EvaluacionNivel,
  SiNo,
  ReferenciaLaboral,
  generateUUID,
} from "@/types/estudio";
import {
  FileText,
  Home,
  User,
  Briefcase,
  Users,
  FolderCheck,
  Image as ImageIcon,
  Camera,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  Save,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  Upload,
  Download,
  Eye,
  File,
  Loader2,
  MapPin,
  PenLine,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { subirArchivoExpediente } from "@/lib/storage";
import { SignaturePadModal } from "@/components/SignaturePadModal";

interface Props {
  estudio: EstudioSocioeconomico;
  onChange: (updated: EstudioSocioeconomico) => void;
  onSaveToDatabase: (updated: EstudioSocioeconomico) => void;
  onSwitchToPDF: () => void;
}

const STEPS = [
  { id: 0, title: "Dictamen y Portada", short: "Portada", icon: FileText },
  { id: 1, title: "1. Reconocimiento y Vivienda", short: "1. Vivienda", icon: Home },
  { id: 2, title: "2. Cédula, Salud y Estudios", short: "2. Cédula", icon: User },
  { id: 3, title: "3. Referencias (Lab/Vec/Per)", short: "3. Referencias", icon: Briefcase },
  { id: 4, title: "4 y 5. Familia y Economía", short: "4-5. Economía", icon: Users },
  { id: 5, title: "6. Documentos Presentados", short: "6. Documentos", icon: FolderCheck },
  { id: 6, title: "Anexos Fotográficos", short: "Anexos", icon: ImageIcon },
  { id: 7, title: "Aviso de Privacidad y Firmas", short: "Privacidad y Firmas", icon: PenLine },
];

export function EstudioFormWizard({
  estudio,
  onChange,
  onSaveToDatabase,
  onSwitchToPDF,
}: Props) {
  const [activeStep, setActiveStep] = useState(0);
  const [activeEmpresaTab, setActiveEmpresaTab] = useState<0 | 1 | 2>(0);
  const [subiendoDocId, setSubiendoDocId] = useState<number | null>(null);
  const [signatureModal, setSignatureModal] = useState<"conformidad" | "aviso" | null>(null);

  // Compresión ultraligera de imágenes:
  // Una foto de celular de 8MB-12MB se comprime a ~70KB-90KB con nitidez perfecta para hoja tamaño Carta.
  // Permite almacenar miles de estudios en Supabase ocupando una fracción minúscula de almacenamiento.
  const handleImageUpload = (
    file: File | undefined,
    callback: (dataUrl: string) => void
  ) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        // 800px es el ancho exacto del marco fotográfico en el PDF de 11 páginas
        const maxDim = 800;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, w, h);
          // Calidad 0.70 optimizada: peso menor a 85KB por imagen sin perder detalle visible
          callback(canvas.toDataURL("image/jpeg", 0.70));
        }
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const updateRefLaboral = (
    idx: 0 | 1 | 2,
    patch: Partial<ReferenciaLaboral>
  ) => {
    const next = [...estudio.referenciasLaborales] as [
      ReferenciaLaboral,
      ReferenciaLaboral,
      ReferenciaLaboral
    ];
    next[idx] = { ...next[idx], ...patch };
    onChange({ ...estudio, referenciasLaborales: next });
  };

  const handleSaveAndNext = () => {
    // Si es borrador, lo marcamos como guardado oficial y lo sincronizamos a Supabase
    const saved = { ...estudio, isDraft: false };
    onSaveToDatabase(saved);
    if (activeStep < STEPS.length - 1) {
      setActiveStep((s) => s + 1);
    }
  };

  const totalEgresos = Object.values(estudio.egresosMensuales).reduce(
    (acc, val) => acc + (Number(val) || 0),
    0
  );
  const totalIngresos = estudio.ingresosHogar.reduce(
    (acc, item) => acc + (Number(item.monto) || 0),
    0
  );
  const balanceMensual = totalIngresos - totalEgresos;

  const autogenerarResumenPortada = () => {
    const nombre =
      estudio.candidatoNombrePortada ||
      estudio.datosGenerales.nombre ||
      "el candidato";
    const vivTipo = estudio.viviendaTipo || "urbana";
    const vivTenencia = estudio.viviendaTenencia.toLowerCase() || "propia";
    const emp1 = estudio.referenciasLaborales[0]?.empresa;

    onChange({
      ...estudio,
      reporteEntrevista:
        estudio.reporteEntrevista ||
        `Durante la entrevista, ${nombre} mostró buena disposición, puntualidad y claridad en sus respuestas. Presentó documentación original para cotejo.`,
      investigacionDomiciliaria:
        estudio.investigacionDomiciliaria ||
        `El candidato habita en vivienda ${vivTenencia} de tipo ${vivTipo.toLowerCase()}, construida en ${estudio.viviendaMaterial.toLowerCase()}, en buenas condiciones de orden e higiene y con servicios básicos completos.`,
      resumenReferenciasVecinales:
        estudio.resumenReferenciasVecinales ||
        `Los vecinos entrevistados confirman conocer al candidato y a su familia en el domicilio actual, refiriéndolos como personas tranquilas, respetuosas y recomendables.`,
      resumenReferenciasLaborales:
        estudio.resumenReferenciasLaborales ||
        (emp1
          ? `Se validaron referencias laborales (incluyendo ${emp1}), confirmando antigüedad, puestos desempeñados y buen desempeño general.`
          : `Se validaron las referencias laborales declaradas, confirmando periodos laborados y desempeño satisfactorio.`),
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Navegador de Pasos (Wizard) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2 mb-6 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isActive = activeStep === step.id;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStep(step.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-[#E31E24] text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{step.short}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenedor del paso activo */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-8">
        {/* ===================================================================
            PASO 0: PORTADA Y RESUMEN EJECUTIVO (PÁGINA 1)
        =================================================================== */}
        {activeStep === 0 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Carátula y Dictamen Ejecutivo (Página 1)
                </h2>
                <p className="text-sm text-gray-500">
                  Datos de identificación del estudio, semáforo de resultado y síntesis ejecutiva.
                </p>
              </div>
              <button
                type="button"
                onClick={autogenerarResumenPortada}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 text-[#E31E24] hover:bg-red-100 text-xs font-semibold transition"
              >
                <Sparkles className="w-4 h-4" />
                Autocompletar síntesis sugerida
              </button>
            </div>

            {/* Responsable de captura (fijo con el nombre del usuario registrado, no editable) */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-bold text-gray-700">
                  Responsable de captura (control interno):
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 w-full sm:w-auto shadow-sm">
                <span className="text-xs font-bold text-gray-800">
                  {estudio.evaluadorNombre || "Sin asignar"}
                </span>
                <span className="text-[10px] bg-gray-100 text-gray-500 font-semibold px-2 py-0.5 rounded-full">
                  Fijo (No editable)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Folio del Estudio
                </label>
                <input
                  type="text"
                  value={estudio.folio}
                  onChange={(e) =>
                    onChange({ ...estudio, folio: e.target.value })
                  }
                  placeholder="Ej. ESE-2026-0142"
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm font-semibold focus:border-[#E31E24] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Fecha de entrega (Metepec, Méx. a)
                </label>
                <input
                  type="text"
                  value={estudio.fechaElaboracion}
                  onChange={(e) =>
                    onChange({ ...estudio, fechaElaboracion: e.target.value })
                  }
                  placeholder="20 de octubre de 2026"
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-[#E31E24] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Llevado a cabo el día
                </label>
                <input
                  type="date"
                  value={estudio.fechaRealizacion}
                  onChange={(e) =>
                    onChange({ ...estudio, fechaRealizacion: e.target.value })
                  }
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-[#E31E24] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Nombre completo del Candidato
                </label>
                <input
                  type="text"
                  value={estudio.candidatoNombrePortada}
                  onChange={(e) =>
                    onChange({
                      ...estudio,
                      candidatoNombrePortada: e.target.value,
                      datosGenerales: {
                        ...estudio.datosGenerales,
                        nombre: e.target.value,
                      },
                    })
                  }
                  placeholder="Nombre y apellidos del candidato"
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm font-semibold focus:border-[#E31E24] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Empresa solicitante / Cliente
                </label>
                <input
                  type="text"
                  value={estudio.empresaSolicitante || ""}
                  onChange={(e) =>
                    onChange({ ...estudio, empresaSolicitante: e.target.value })
                  }
                  placeholder="Ej. Grupo Industrial del Centro S.A."
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-[#E31E24] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Puesto solicitado
                </label>
                <input
                  type="text"
                  value={estudio.puestoSolicitado}
                  onChange={(e) =>
                    onChange({ ...estudio, puestoSolicitado: e.target.value })
                  }
                  placeholder="Ej. Coordinador de Operaciones"
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-[#E31E24] focus:outline-none"
                />
              </div>
            </div>

            {/* Selector de Dictamen */}
            <div>
              <label className="block text-xs font-bold uppercase text-gray-600 mb-2">
                Dictamen Final del Candidato
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    val: "ACEPTABLE" as const,
                    sub: "Estudio sin información contundente negativa",
                    icon: CheckCircle2,
                    activeClass:
                      "border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/30",
                  },
                  {
                    val: "CON RESERVAS" as const,
                    sub: "Estudio con antecedentes negativos no graves",
                    icon: AlertTriangle,
                    activeClass:
                      "border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-500/30",
                  },
                  {
                    val: "NO ACEPTABLE" as const,
                    sub: "Estudio con antecedentes negativos graves",
                    icon: XCircle,
                    activeClass:
                      "border-[#E31E24] bg-red-50 text-red-900 ring-2 ring-red-500/30",
                  },
                ].map((opt) => {
                  const Icon = opt.icon;
                  const selected = estudio.dictamen === opt.val;
                  return (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => onChange({ ...estudio, dictamen: opt.val })}
                      className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${
                        selected
                          ? opt.activeClass
                          : "border-gray-200 hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-sm">{opt.val}</div>
                        <div className="text-xs opacity-80 mt-0.5">{opt.sub}</div>
                  </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4 Bloques de Resumen */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Reporte de la entrevista
                </label>
                <textarea
                  rows={3}
                  value={estudio.reporteEntrevista}
                  onChange={(e) =>
                    onChange({ ...estudio, reporteEntrevista: e.target.value })
                  }
                  placeholder="Resumen de actitud, puntualidad y congruencia durante la entrevista..."
                  className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-[#E31E24] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Investigación domiciliaria
                </label>
                <textarea
                  rows={3}
                  value={estudio.investigacionDomiciliaria}
                  onChange={(e) =>
                    onChange({
                      ...estudio,
                      investigacionDomiciliaria: e.target.value,
                    })
                  }
                  placeholder="Condiciones del inmueble, servicios de la zona y habitantes..."
                  className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-[#E31E24] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Referencias vecinales (Resumen)
                </label>
                <textarea
                  rows={3}
                  value={estudio.resumenReferenciasVecinales}
                  onChange={(e) =>
                    onChange({
                      ...estudio,
                      resumenReferenciasVecinales: e.target.value,
                    })
                  }
                  placeholder="Síntesis de los comentarios obtenidos con vecinos..."
                  className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-[#E31E24] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Referencias laborales (Resumen)
                </label>
                <textarea
                  rows={3}
                  value={estudio.resumenReferenciasLaborales}
                  onChange={(e) =>
                    onChange({
                      ...estudio,
                      resumenReferenciasLaborales: e.target.value,
                    })
                  }
                  placeholder="Síntesis de validación de empleos anteriores y recomendación..."
                  className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-[#E31E24] focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            PASO 1: 1. RECONOCIMIENTO Y UBICACIÓN DEL CANDIDATO (PÁGS. 2 y 3 SUP)
        =================================================================== */}
        {activeStep === 1 && (
          <div className="space-y-8">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-xl font-bold text-gray-900">
                1. Reconocimiento, Vivienda y Servicios (Páginas 2 y 3)
              </h2>
              <p className="text-sm text-gray-500">
                Fotografías de visita domiciliaria, aspecto personal del candidato, características del inmueble y servicios.
              </p>
            </div>

            {/* 3 Fotografías (Interior, Exterior, Zona) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  label: "1.1 Fotografía interior (Candidato / Sala)",
                  key: "fotoInterior" as const,
                },
                {
                  label: "1.2 Fotografía exterior (Fachada vivienda)",
                  key: "fotoExterior" as const,
                },
                {
                  label: "1.3 Características de la zona / Calle",
                  key: "fotoZona" as const,
                },
              ].map((foto) => (
                <div
                  key={foto.key}
                  className="border-2 border-dashed border-gray-300 rounded-2xl p-4 flex flex-col items-center justify-between bg-gray-50"
                >
                  <span className="text-xs font-bold text-gray-700 text-center mb-2">
                    {foto.label}
                  </span>

                  {estudio[foto.key] ? (
                    <div className="relative w-full h-44 rounded-xl overflow-hidden border border-gray-200 bg-white mb-2">
                      <img
                        src={estudio[foto.key]}
                        alt={foto.label}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => onChange({ ...estudio, [foto.key]: "" })}
                        className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-lg shadow hover:bg-red-700"
                        title="Eliminar foto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                  </div>
                  ) : (
                    <div className="w-full h-44 flex flex-col items-center justify-center text-gray-400">
                      <Camera className="w-10 h-10 mb-1 stroke-1" />
                      <span className="text-xs">Tomar o subir fotografía</span>
                  </div>
                  )}

                  <label className="w-full cursor-pointer inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition">
                    <Camera className="w-4 h-4 text-[#E31E24]" />
                    <span>{estudio[foto.key] ? "Cambiar foto" : "Seleccionar imagen"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) =>
                        handleImageUpload(e.target.files?.[0], (dataUrl) =>
                          onChange({ ...estudio, [foto.key]: dataUrl })
                        )
                      }
                    />
                  </label>
                </div>
              ))}
            </div>

            {/* 1.1 Características personales del candidato */}
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
              <h3 className="font-bold text-sm text-gray-900 mb-3">
                1.1 Evaluación de características personales del candidato
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(
                  [
                    { label: "Aspecto Físico", key: "aspectoFisico" },
                    { label: "Limpieza", key: "limpieza" },
                    { label: "Cabello", key: "cabello" },
                    { label: "Vestimenta", key: "vestimenta" },
                    { label: "Disposición", key: "disposicion" },
                    { label: "Puntualidad", key: "puntualidad" },
                    { label: "Interés", key: "interes" },
                    { label: "Lenguaje", key: "lenguaje" },
                    { label: "Comportamiento", key: "comportamiento" },
                  ] as const
                ).map((item) => (
                  <div
                    key={item.key}
                    className="bg-white p-3 rounded-xl border border-gray-200 flex items-center justify-between"
                  >
                    <span className="text-xs font-semibold text-gray-700">
                      {item.label}
                    </span>
                    <div className="flex gap-1">
                      {(["Bueno", "Regular", "Malo"] as EvaluacionNivel[]).map(
                        (niv) => (
                          <button
                            key={niv}
                            type="button"
                            onClick={() =>
                              onChange({
                                ...estudio,
                                evaluacionPersonal: {
                                  ...estudio.evaluacionPersonal,
                                  [item.key]: niv,
                                },
                              })
                            }
                            className={`px-2 py-1 rounded text-[11px] font-bold transition ${
                              estudio.evaluacionPersonal[item.key] === niv
                                ? "bg-[#E31E24] text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            {niv[0]}
                          </button>
                        )
                      )}
                  </div>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Comentarios adicionales (1.1)
                </label>
                <input
                  type="text"
                  value={estudio.comentariosPersonales}
                  onChange={(e) =>
                    onChange({ ...estudio, comentariosPersonales: e.target.value })
                  }
                  placeholder="Observaciones sobre la presentación del candidato..."
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm"
                />
              </div>
            </div>

            {/* 1.2 Características de la vivienda */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 space-y-4">
                <h3 className="font-bold text-sm text-gray-900">
                  1.2 Características de la Vivienda
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">
                      Tenencia de la Casa
                    </label>
                    <select
                      value={estudio.viviendaTenencia}
                      onChange={(e) =>
                        onChange({
                          ...estudio,
                          viviendaTenencia: e.target
                            .value as EstudioSocioeconomico["viviendaTenencia"],
                        })
                      }
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="Propia">Propia</option>
                      <option value="Prestada">Prestada</option>
                      <option value="Rentada">Rentada</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">
                      Si es Otro, ¿Cuál?
                    </label>
                    <input
                      type="text"
                      value={estudio.viviendaTenenciaCual}
                      onChange={(e) =>
                        onChange({
                          ...estudio,
                          viviendaTenenciaCual: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">
                      Valor aproximado
                    </label>
                    <input
                      type="text"
                      value={estudio.viviendaValorAprox}
                      onChange={(e) =>
                        onChange({ ...estudio, viviendaValorAprox: e.target.value })
                      }
                      placeholder="Ej. $1,500,000"
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">
                      Tiempo viviendo ahí
                    </label>
                    <input
                      type="text"
                      value={estudio.viviendaTiempoViviendo}
                      onChange={(e) =>
                        onChange({
                          ...estudio,
                          viviendaTiempoViviendo: e.target.value,
                        })
                      }
                      placeholder="Ej. 5 años"
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">
                      Material de construcción
                    </label>
                    <select
                      value={estudio.viviendaMaterial}
                      onChange={(e) =>
                        onChange({
                          ...estudio,
                          viviendaMaterial: e.target
                            .value as EstudioSocioeconomico["viviendaMaterial"],
                        })
                      }
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="Concreto">Concreto</option>
                      <option value="Madera">Madera</option>
                      <option value="Lamina">Lámina</option>
                      <option value="Adobe">Adobe</option>
                      <option value="Cartón">Cartón</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">
                      Tipo de vivienda
                    </label>
                    <select
                      value={estudio.viviendaTipo}
                      onChange={(e) =>
                        onChange({
                          ...estudio,
                          viviendaTipo: e.target
                            .value as EstudioSocioeconomico["viviendaTipo"],
                        })
                      }
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="Residencial">Residencial</option>
                      <option value="Media Residencial">Media Residencial</option>
                      <option value="Interés Social">Interés Social</option>
                      <option value="Vecindad">Vecindad</option>
                      <option value="Rural">Rural</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Color de casa / Fachada
                  </label>
                  <input
                    type="text"
                    value={estudio.viviendaColor}
                    onChange={(e) =>
                      onChange({ ...estudio, viviendaColor: e.target.value })
                    }
                    placeholder="Ej. Blanca con portón negro"
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Cantidad de espacios */}
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                <h3 className="font-bold text-sm text-gray-900 mb-3">
                  Distribución / Cantidad de Espacios
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      { label: "Recámaras", key: "recamaras" },
                      { label: "Baños", key: "banos" },
                      { label: "Sala", key: "sala" },
                      { label: "Cocina", key: "cocina" },
                      { label: "Comedor", key: "comedor" },
                      { label: "Patio posterior", key: "patioPosterior" },
                      {
                        label: "Patio de estacionamiento",
                        key: "patioEstacionamiento",
                      },
                    ] as const
                  ).map((esp) => (
                    <div key={esp.key}>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        {esp.label}
                      </label>
                      <input
                        type="text"
                        value={estudio.espaciosCantidad[esp.key]}
                        onChange={(e) =>
                          onChange({
                            ...estudio,
                            espaciosCantidad: {
                              ...estudio.espaciosCantidad,
                              [esp.key]: e.target.value,
                            },
                          })
                        }
                        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold"
                      />
                  </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 1.3 Servicios públicos de la zona */}
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
              <h3 className="font-bold text-sm text-gray-900 mb-3">
                1.3 Servicios públicos y entorno de la zona (Página 3 superior)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(
                  [
                    { label: "Agua potable", key: "aguaPotable" },
                    { label: "Drenaje", key: "drenaje" },
                    { label: "Energía eléctrica", key: "energiaElectrica" },
                    { label: "Alumbrado público", key: "alumbradoPublico" },
                    { label: "Pavimentación", key: "pavimentacion" },
                    { label: "Vigilancia", key: "vigilancia" },
                    { label: "Televisión de paga", key: "televisionPaga" },
                    { label: "Teléfono", key: "telefono" },
                    { label: "Internet", key: "internet" },
                    { label: "Transporte público", key: "transportePublico" },
                    { label: "Se observa grafiti", key: "seObservaGrafiti" },
                    { label: "Se observa Vandalismo", key: "seObservaVandalismo" },
                  ] as const
                ).map((srv) => (
                  <div
                    key={srv.key}
                    className="bg-white p-3 rounded-xl border border-gray-200 flex items-center justify-between"
                  >
                    <span className="text-xs font-semibold text-gray-700">
                      {srv.label}
                    </span>
                    <div className="flex gap-1">
                      {(["Si", "No"] as SiNo[]).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            onChange({
                              ...estudio,
                              serviciosZona: {
                                ...estudio.serviciosZona,
                                [srv.key]: opt,
                              },
                            })
                          }
                          className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                            estudio.serviciosZona[srv.key] === opt
                              ? "bg-[#E31E24] text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                  </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            PASO 2: 2. CÉDULA DEL CANDIDATO, SALUD Y ACADÉMICOS (PÁGS. 3, 4 y 5)
        =================================================================== */}
        {activeStep === 2 && (
          <div className="space-y-8">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-xl font-bold text-gray-900">
                2. Cédula del Candidato, Salud y Estudios (Páginas 3, 4 y 5)
              </h2>
              <p className="text-sm text-gray-500">
                Datos personales, domicilio y contacto, historial médico/hábitos y escolaridad.
              </p>
            </div>

            {/* 2.1 Datos Generales */}
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 space-y-4">
              <h3 className="font-bold text-sm text-gray-900">
                2.1 Datos Generales y Somatometría
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    value={estudio.datosGenerales.nombre}
                    onChange={(e) =>
                      onChange({
                        ...estudio,
                        candidatoNombrePortada: e.target.value,
                        datosGenerales: {
                          ...estudio.datosGenerales,
                          nombre: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Edad
                  </label>
                  <input
                    type="text"
                    value={estudio.datosGenerales.edad}
                    onChange={(e) =>
                      onChange({
                        ...estudio,
                        datosGenerales: {
                          ...estudio.datosGenerales,
                          edad: e.target.value,
                        },
                      })
                    }
                    placeholder="Ej. 32 años"
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Sexo
                  </label>
                  <select
                    value={estudio.datosGenerales.sexo}
                    onChange={(e) =>
                      onChange({
                        ...estudio,
                        datosGenerales: {
                          ...estudio.datosGenerales,
                          sexo: e.target
                            .value as EstudioSocioeconomico["datosGenerales"]["sexo"],
                        },
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Masculino">Masculino</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Día Nacimiento
                  </label>
                  <input
                    type="text"
                    value={estudio.datosGenerales.fechaNacimientoDia}
                    onChange={(e) =>
                      onChange({
                        ...estudio,
                        datosGenerales: {
                          ...estudio.datosGenerales,
                          fechaNacimientoDia: e.target.value,
                        },
                      })
                    }
                    placeholder="14"
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Mes Nacimiento
                  </label>
                  <input
                    type="text"
                    value={estudio.datosGenerales.fechaNacimientoMes}
                    onChange={(e) =>
                      onChange({
                        ...estudio,
                        datosGenerales: {
                          ...estudio.datosGenerales,
                          fechaNacimientoMes: e.target.value,
                        },
                      })
                    }
                    placeholder="Mayo"
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Año Nacimiento
                  </label>
                  <input
                    type="text"
                    value={estudio.datosGenerales.fechaNacimientoAnio}
                    onChange={(e) =>
                      onChange({
                        ...estudio,
                        datosGenerales: {
                          ...estudio.datosGenerales,
                          fechaNacimientoAnio: e.target.value,
                        },
                      })
                    }
                    placeholder="1994"
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Estado Civil
                  </label>
                  <select
                    value={estudio.datosGenerales.estadoCivil}
                    onChange={(e) =>
                      onChange({
                        ...estudio,
                        datosGenerales: {
                          ...estudio.datosGenerales,
                          estadoCivil: e.target
                            .value as EstudioSocioeconomico["datosGenerales"]["estadoCivil"],
                        },
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="Soltero (a)">Soltero (a)</option>
                    <option value="Divorciado (a)">Divorciado (a)</option>
                    <option value="Casado (a)">Casado (a)</option>
                    <option value="Unión Libre">Unión Libre</option>
                    <option value="Viudo (a)">Viudo (a)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Lugar de Nacimiento
                  </label>
                  <input
                    type="text"
                    value={estudio.datosGenerales.lugarNacimiento}
                    onChange={(e) =>
                      onChange({
                        ...estudio,
                        datosGenerales: {
                          ...estudio.datosGenerales,
                          lugarNacimiento: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Lugar y fecha de matrimonio
                  </label>
                  <input
                    type="text"
                    value={estudio.datosGenerales.lugarFechaMatrimonio}
                    onChange={(e) =>
                      onChange({
                        ...estudio,
                        datosGenerales: {
                          ...estudio.datosGenerales,
                          lugarFechaMatrimonio: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    No. de hijos / edad
                  </label>
                  <input
                    type="text"
                    value={estudio.datosGenerales.numeroHijosEdad}
                    onChange={(e) =>
                      onChange({
                        ...estudio,
                        datosGenerales: {
                          ...estudio.datosGenerales,
                          numeroHijosEdad: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Ocupación actual
                  </label>
                  <input
                    type="text"
                    value={estudio.datosGenerales.ocupacionActual}
                    onChange={(e) =>
                      onChange({
                        ...estudio,
                        datosGenerales: {
                          ...estudio.datosGenerales,
                          ocupacionActual: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { label: "Peso", key: "peso", ph: "74 kg" },
                  { label: "Estatura (Mts)", key: "estatura", ph: "1.72" },
                  { label: "Salud Visual", key: "saludVisual", ph: "Buena" },
                  { label: "Salud Física", key: "saludFisica", ph: "Buena" },
                  { label: "Tipo de sangre", key: "tipoSangre", ph: "O+" },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="block text-xs font-bold text-gray-600 mb-1">
                      {f.label}
                    </label>
                    <input
                      type="text"
                      placeholder={f.ph}
                      value={
                        estudio.datosGenerales[
                          f.key as keyof EstudioSocioeconomico["datosGenerales"]
                        ]
                      }
                      onChange={(e) =>
                        onChange({
                          ...estudio,
                          datosGenerales: {
                            ...estudio.datosGenerales,
                            [f.key]: e.target.value,
                          },
                        })
                      }
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 2.3 Datos de Contacto */}
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 space-y-4">
              <h3 className="font-bold text-sm text-gray-900">
                2.3 Datos de Contacto del Candidato
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Calle y Número
                  </label>
                  <input
                    type="text"
                    value={estudio.datosContacto.calleYNumero}
                    onChange={(e) =>
                      onChange({
                        ...estudio,
                        datosContacto: {
                          ...estudio.datosContacto,
                          calleYNumero: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Delegación o Municipio
                  </label>
                  <input
                    type="text"
                    value={estudio.datosContacto.delegacionMunicipio}
                    onChange={(e) =>
                      onChange({
                        ...estudio,
                        datosContacto: {
                          ...estudio.datosContacto,
                          delegacionMunicipio: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Estado y Ciudad
                  </label>
                  <input
                    type="text"
                    value={estudio.datosContacto.estadoCiudad}
                    onChange={(e) =>
                      onChange({
                        ...estudio,
                        datosContacto: {
                          ...estudio.datosContacto,
                          estadoCiudad: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Entre qué calles
                  </label>
                  <input
                    type="text"
                    value={estudio.datosContacto.entreCalles}
                    onChange={(e) =>
                      onChange({
                        ...estudio,
                        datosContacto: {
                          ...estudio.datosContacto,
                          entreCalles: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Teléfono Casa
                  </label>
                  <input
                    type="text"
                    value={estudio.datosContacto.telefonoCasa}
                    onChange={(e) =>
                      onChange({
                        ...estudio,
                        datosContacto: {
                          ...estudio.datosContacto,
                          telefonoCasa: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Teléfono Recados
                  </label>
                  <input
                    type="text"
                    value={estudio.datosContacto.telefonoRecados}
                    onChange={(e) =>
                      onChange({
                        ...estudio,
                        datosContacto: {
                          ...estudio.datosContacto,
                          telefonoRecados: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Celular
                  </label>
                  <input
                    type="text"
                    value={estudio.datosContacto.telefonoCelular}
                    onChange={(e) =>
                      onChange({
                        ...estudio,
                        datosContacto: {
                          ...estudio.datosContacto,
                          telefonoCelular: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    value={estudio.datosContacto.correoElectronico}
                    onChange={(e) =>
                      onChange({
                        ...estudio,
                        datosContacto: {
                          ...estudio.datosContacto,
                          correoElectronico: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Página 4: Salud y Hábitos */}
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 space-y-4">
              <h3 className="font-bold text-sm text-gray-900">
                Cuestionario de Salud y Hábitos (Página 4)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-xl border border-gray-200 flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-700 w-28">
                    Embarazada:
                  </span>
                  <div className="flex gap-1">
                    {(["Si", "No"] as SiNo[]).map((o) => (
                      <button
                        key={o}
                        type="button"
                        onClick={() =>
                          onChange({
                            ...estudio,
                            saludHabitos: {
                              ...estudio.saludHabitos,
                              embarazada: o,
                            },
                          })
                        }
                        className={`px-2.5 py-1 rounded text-xs font-bold ${
                          estudio.saludHabitos.embarazada === o
                            ? "bg-[#E31E24] text-white"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Tiempo de embarazo"
                    value={estudio.saludHabitos.tiempoEmbarazo}
                    onChange={(e) =>
                      onChange({
                        ...estudio,
                        saludHabitos: {
                          ...estudio.saludHabitos,
                          tiempoEmbarazo: e.target.value,
                        },
                      })
                    }
                    className="flex-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs"
                  />
                </div>

                <div className="bg-white p-3 rounded-xl border border-gray-200 flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-700 w-28">
                    Tatuajes:
                  </span>
                  <div className="flex gap-1">
                    {(["Si", "No"] as SiNo[]).map((o) => (
                      <button
                        key={o}
                        type="button"
                        onClick={() =>
                          onChange({
                            ...estudio,
                            saludHabitos: {
                              ...estudio.saludHabitos,
                              tatuajes: o,
                            },
                          })
                        }
                        className={`px-2.5 py-1 rounded text-xs font-bold ${
                          estudio.saludHabitos.tatuajes === o
                            ? "bg-[#E31E24] text-white"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="¿Cuántos? / ubicación corporal"
                    value={estudio.saludHabitos.tatuajesDetalle}
                    onChange={(e) =>
                      onChange({
                        ...estudio,
                        saludHabitos: {
                          ...estudio.saludHabitos,
                          tatuajesDetalle: e.target.value,
                        },
                      })
                    }
                    className="flex-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                {(
                  [
                    {
                      label: "¿El candidato práctica ejercicio?",
                      key: "practicaEjercicio",
                    },
                    {
                      label: "¿El candidato ha tenido accidentes?",
                      key: "accidentes",
                    },
                    {
                      label: "¿Hace, cuanto tiempo?",
                      key: "accidentesHaceCuanto",
                    },
                    { label: "¿Tuvo secuelas?", key: "accidentesSecuelas" },
                    {
                      label:
                        "¿El candidato ha sido sometido a intervenciones quirúrgicas?",
                      key: "intervencionesQuirurgicas",
                    },
                    {
                      label: "¿Tiene alguna secuela?",
                      key: "intervencionesSecuelas",
                    },
                    {
                      label: "¿Sigue en tratamiento médico?",
                      key: "sigueEnTratamiento",
                    },
                    {
                      label:
                        "¿El candidato tiene familiares con alguna enfermedad hereditaria?",
                      key: "enfermedadHereditaria",
                    },
                    {
                      label:
                        "¿El candidato ha estado bajo algún tratamiento médico o psicológico?",
                      key: "tratamientoMedicoPsicologico",
                    },
                    {
                      label:
                        "¿Qué enfermedades padece con mayor frecuencia el candidato?",
                      key: "enfermedadesFrecuentes",
                    },
                    { label: "¿El candidato tiene alergias?", key: "alergias" },
                    { label: "¿El candidato fuma?", key: "fuma" },
                    {
                      label: "¿El candidato ingiere bebidas alcohólicas?",
                      key: "bebidasAlcoholicas",
                    },
                    {
                      label: "¿El candidato consume algún otro tipo de droga?",
                      key: "consumeDrogas",
                    },
                  ] as const
                ).map((item) => {
                  const val = estudio.saludHabitos[item.key];
                  return (
                    <div
                      key={item.key}
                      className="bg-white p-2.5 rounded-xl border border-gray-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                    >
                      <span className="sm:col-span-5 text-xs font-medium text-gray-800">
                        {item.label}
                      </span>
                      <div className="sm:col-span-2 flex gap-1">
                        {(["Si", "No"] as SiNo[]).map((o) => (
                          <button
                            key={o}
                            type="button"
                            onClick={() =>
                              onChange({
                                ...estudio,
                                saludHabitos: {
                                  ...estudio.saludHabitos,
                                  [item.key]: { ...val, respuesta: o },
                                },
                              })
                            }
                            className={`px-3 py-1 rounded text-xs font-bold ${
                              val.respuesta === o
                                ? "bg-[#E31E24] text-white"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {o}
                          </button>
                        ))}
                  </div>
                      <input
                        type="text"
                        placeholder="Comentarios / especificación..."
                        value={val.comentarios}
                        onChange={(e) =>
                          onChange({
                            ...estudio,
                            saludHabitos: {
                              ...estudio.saludHabitos,
                              [item.key]: {
                                ...val,
                                comentarios: e.target.value,
                              },
                            },
                          })
                        }
                        className="sm:col-span-5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs"
                      />
                  </div>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  ¿A qué Institución médica acude el candidato?
                </label>
                <input
                  type="text"
                  value={estudio.saludHabitos.institucionMedica}
                  onChange={(e) =>
                    onChange({
                      ...estudio,
                      saludHabitos: {
                        ...estudio.saludHabitos,
                        institucionMedica: e.target.value,
                      },
                    })
                  }
                  placeholder="Ej. IMSS, ISSSTE, Médico Particular..."
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm"
                />
              </div>
            </div>

            {/* 2.2 Datos Académicos */}
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 space-y-4">
              <h3 className="font-bold text-sm text-gray-900">
                2.2 Datos Académicos (Página 5 superior)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Nivel máximo de estudios
                  </label>
                  <select
                    value={estudio.datosAcademicos.nivelMaximo}
                    onChange={(e) =>
                      onChange({
                        ...estudio,
                        datosAcademicos: {
                          ...estudio.datosAcademicos,
                          nivelMaximo: e.target
                            .value as EstudioSocioeconomico["datosAcademicos"]["nivelMaximo"],
                        },
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Preescolar">Preescolar</option>
                    <option value="Primaria">Primaria</option>
                    <option value="Secundaria">Secundaria</option>
                    <option value="Preparatoria">Preparatoria</option>
                    <option value="Carrera técnica">Carrera técnica</option>
                    <option value="Licenciatura">Licenciatura</option>
                    <option value="Maestría">Maestría</option>
                    <option value="Doctorado">Doctorado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Documento comprobatorio
                  </label>
                  <select
                    value={estudio.datosAcademicos.documentoComprobatorio}
                    onChange={(e) =>
                      onChange({
                        ...estudio,
                        datosAcademicos: {
                          ...estudio.datosAcademicos,
                          documentoComprobatorio: e.target
                            .value as EstudioSocioeconomico["datosAcademicos"]["documentoComprobatorio"],
                        },
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Certificado">Certificado</option>
                    <option value="Constancia de estudios">
                      Constancia de estudios
                    </option>
                    <option value="Boleta">Boleta</option>
                    <option value="Título">Título</option>
                    <option value="Carta de buena conducta">
                      Carta de buena conducta
                    </option>
                    <option value="Historial académico">
                      Historial académico
                    </option>
                    <option value="Diploma">Diploma</option>
                    <option value="Cédula">Cédula</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    ¿Si es otro, qué documento presentó?
                  </label>
                  <input
                    type="text"
                    value={estudio.datosAcademicos.documentoOtroCual}
                    onChange={(e) =>
                      onChange({
                        ...estudio,
                        datosAcademicos: {
                          ...estudio.datosAcademicos,
                          documentoOtroCual: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Área / Carrera
                  </label>
                  <input
                    type="text"
                    value={estudio.datosAcademicos.area}
                    onChange={(e) =>
                      onChange({
                        ...estudio,
                        datosAcademicos: {
                          ...estudio.datosAcademicos,
                          area: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Escuela o Institución académica
                  </label>
                  <input
                    type="text"
                    value={estudio.datosAcademicos.escuelaInstitucion}
                    onChange={(e) =>
                      onChange({
                        ...estudio,
                        datosAcademicos: {
                          ...estudio.datosAcademicos,
                          escuelaInstitucion: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Período escolar
                  </label>
                  <input
                    type="text"
                    value={estudio.datosAcademicos.periodoEscolar}
                    onChange={(e) =>
                      onChange({
                        ...estudio,
                        datosAcademicos: {
                          ...estudio.datosAcademicos,
                          periodoEscolar: e.target.value,
                        },
                      })
                    }
                    placeholder="Ej. 2015 - 2020"
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            PASO 3: 3. REFERENCIAS LABORALES, VECINALES Y PERSONALES (PÁGS. 5 A 8)
        =================================================================== */}
        {activeStep === 3 && (
          <div className="space-y-8">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-xl font-bold text-gray-900">
                3. Referencias Laborales, Vecinales y Personales (Páginas 5 a 8)
              </h2>
              <p className="text-sm text-gray-500">
                Captura las 3 referencias laborales, 2 referencias vecinales y 3 referencias personales.
              </p>
            </div>

            {/* 3.1 Referencias Laborales con pestañas para Empresa 1, 2 y 3 */}
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-bold text-sm text-gray-900">
                  3.1 Referencias Laborales (3 Empresas)
                </h3>
                <div className="flex gap-2">
                  {([0, 1, 2] as const).map((idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveEmpresaTab(idx)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                        activeEmpresaTab === idx
                          ? "bg-[#E31E24] text-white"
                          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                      }`}
                    >
                      {idx + 1}.- Empresa{" "}
                      {estudio.referenciasLaborales[idx].empresa
                        ? `(${estudio.referenciasLaborales[idx].empresa.slice(0, 14)}...)`
                        : ""}
                    </button>
                  ))}
                </div>
              </div>

              {(() => {
                const ref = estudio.referenciasLaborales[activeEmpresaTab];
                return (
                  <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">
                          {activeEmpresaTab + 1}.- Nombre de la Empresa
                        </label>
                        <input
                          type="text"
                          value={ref.empresa}
                          onChange={(e) =>
                            updateRefLaboral(activeEmpresaTab, {
                              empresa: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm font-semibold"
                        />
                  </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">
                          Giro empresarial
                        </label>
                        <input
                          type="text"
                          value={ref.giroEmpresarial}
                          onChange={(e) =>
                            updateRefLaboral(activeEmpresaTab, {
                              giroEmpresarial: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                        />
                  </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">
                          Teléfono
                        </label>
                        <input
                          type="text"
                          value={ref.telefono}
                          onChange={(e) =>
                            updateRefLaboral(activeEmpresaTab, {
                              telefono: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                        />
                  </div>
                  </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">
                        Domicilio de la empresa
                      </label>
                      <input
                        type="text"
                        value={ref.domicilio}
                        onChange={(e) =>
                          updateRefLaboral(activeEmpresaTab, {
                            domicilio: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                      />
                  </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">
                          Fecha de ingreso
                        </label>
                        <input
                          type="text"
                          value={ref.fechaIngreso}
                          onChange={(e) =>
                            updateRefLaboral(activeEmpresaTab, {
                              fechaIngreso: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                        />
                  </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">
                          Fecha de baja
                        </label>
                        <input
                          type="text"
                          value={ref.fechaBaja}
                          onChange={(e) =>
                            updateRefLaboral(activeEmpresaTab, {
                              fechaBaja: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                        />
                  </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">
                          Puesto y sueldo inicial
                        </label>
                        <input
                          type="text"
                          value={ref.puestoSueldoInicial}
                          onChange={(e) =>
                            updateRefLaboral(activeEmpresaTab, {
                              puestoSueldoInicial: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                        />
                  </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">
                          Puesto y sueldo final
                        </label>
                        <input
                          type="text"
                          value={ref.puestoSueldoFinal}
                          onChange={(e) =>
                            updateRefLaboral(activeEmpresaTab, {
                              puestoSueldoFinal: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                        />
                  </div>
                  </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">
                          Nombre del jefe directo
                        </label>
                        <input
                          type="text"
                          value={ref.nombreJefeDirecto}
                          onChange={(e) =>
                            updateRefLaboral(activeEmpresaTab, {
                              nombreJefeDirecto: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                        />
                  </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">
                          Sindicato
                        </label>
                        <input
                          type="text"
                          value={ref.sindicato}
                          onChange={(e) =>
                            updateRefLaboral(activeEmpresaTab, {
                              sindicato: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                        />
                  </div>
                  </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">
                          Manejo info. confidencial
                        </label>
                        <select
                          value={ref.manejoInfoConfidencial}
                          onChange={(e) =>
                            updateRefLaboral(activeEmpresaTab, {
                              manejoInfoConfidencial: e.target.value as SiNo,
                            })
                          }
                          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                        >
                          <option value="">-</option>
                          <option value="Si">Sí</option>
                          <option value="No">No</option>
                        </select>
                  </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">
                          Equipo tecnológico
                        </label>
                        <select
                          value={ref.equipoTecnologico}
                          onChange={(e) =>
                            updateRefLaboral(activeEmpresaTab, {
                              equipoTecnologico: e.target.value as SiNo,
                            })
                          }
                          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                        >
                          <option value="">-</option>
                          <option value="Si">Sí</option>
                          <option value="No">No</option>
                        </select>
                  </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">
                          Desempeño
                        </label>
                        <select
                          value={ref.desempeno}
                          onChange={(e) =>
                            updateRefLaboral(activeEmpresaTab, {
                              desempeno: e.target.value as EvaluacionNivel,
                            })
                          }
                          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                        >
                          <option value="">-</option>
                          <option value="Bueno">Bueno</option>
                          <option value="Regular">Regular</option>
                          <option value="Malo">Malo</option>
                        </select>
                  </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">
                          Causa de separación
                        </label>
                        <select
                          value={ref.causaSeparacion}
                          onChange={(e) =>
                            updateRefLaboral(activeEmpresaTab, {
                              causaSeparacion: e.target
                                .value as ReferenciaLaboral["causaSeparacion"],
                            })
                          }
                          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                        >
                          <option value="">-</option>
                          <option value="Renuncia voluntaria">
                            Renuncia voluntaria
                          </option>
                          <option value="Termino de contrato">
                            Término de contrato
                          </option>
                          <option value="Abandono de trabajo">
                            Abandono de trabajo
                          </option>
                          <option value="Termino de proyecto">
                            Término de proyecto
                          </option>
                        </select>
                  </div>
                  </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">
                          Decisión de la empresa
                        </label>
                        <select
                          value={ref.decisionEmpresa}
                          onChange={(e) =>
                            updateRefLaboral(activeEmpresaTab, {
                              decisionEmpresa: e.target
                                .value as ReferenciaLaboral["decisionEmpresa"],
                            })
                          }
                          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                        >
                          <option value="">No aplica</option>
                          <option value="Falta de honestidad">
                            Falta de honestidad
                          </option>
                          <option value="Robo">Robo</option>
                          <option value="Faltas injustificadas">
                            Faltas injustificadas
                          </option>
                          <option value="Otra">Otra</option>
                        </select>
                  </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">
                          ¿Contrataría nuevamente?
                        </label>
                        <select
                          value={ref.contratariaNuevamente}
                          onChange={(e) =>
                            updateRefLaboral(activeEmpresaTab, {
                              contratariaNuevamente: e.target.value as SiNo,
                            })
                          }
                          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                        >
                          <option value="">-</option>
                          <option value="Si">Sí</option>
                          <option value="No">No</option>
                        </select>
                  </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">
                          ¿Recomienda contratación?
                        </label>
                        <select
                          value={ref.recomiendaContratacion}
                          onChange={(e) =>
                            updateRefLaboral(activeEmpresaTab, {
                              recomiendaContratacion: e.target.value as SiNo,
                            })
                          }
                          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                        >
                          <option value="">-</option>
                          <option value="Si">Sí</option>
                          <option value="No">No</option>
                        </select>
                  </div>
                  </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">
                          Proporcionó info (Nombre)
                        </label>
                        <input
                          type="text"
                          value={ref.proporcionoNombre}
                          onChange={(e) =>
                            updateRefLaboral(activeEmpresaTab, {
                              proporcionoNombre: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                        />
                  </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">
                          Puesto de quien informa
                        </label>
                        <input
                          type="text"
                          value={ref.proporcionoPuesto}
                          onChange={(e) =>
                            updateRefLaboral(activeEmpresaTab, {
                              proporcionoPuesto: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                        />
                  </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">
                          Observaciones
                        </label>
                        <input
                          type="text"
                          value={ref.observaciones}
                          onChange={(e) =>
                            updateRefLaboral(activeEmpresaTab, {
                              observaciones: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                        />
                  </div>
                  </div>
                  </div>
                );
              })()}
            </div>

            {/* 3.2 Referencia Vecinal (Vecino 1 y 2) */}
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 space-y-4">
              <h3 className="font-bold text-sm text-gray-900">
                3.2 Referencias Vecinales (Vecino 1 y Vecino 2)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {([0, 1] as const).map((idx) => {
                  const vec = estudio.referenciasVecinales[idx];
                  return (
                    <div
                      key={idx}
                      className="bg-white p-4 rounded-xl border border-gray-200 space-y-3"
                    >
                      <div className="font-bold text-xs text-[#E31E24] uppercase">
                        Vecino {idx + 1}
                  </div>
                      <input
                        type="text"
                        placeholder="Nombre del vecino"
                        value={vec.nombre}
                        onChange={(e) => {
                          const next = [...estudio.referenciasVecinales] as typeof estudio.referenciasVecinales;
                          next[idx] = { ...vec, nombre: e.target.value };
                          onChange({ ...estudio, referenciasVecinales: next });
                        }}
                        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Tiempo de conocerlo"
                        value={vec.tiempoConocerlo}
                        onChange={(e) => {
                          const next = [...estudio.referenciasVecinales] as typeof estudio.referenciasVecinales;
                          next[idx] = { ...vec, tiempoConocerlo: e.target.value };
                          onChange({ ...estudio, referenciasVecinales: next });
                        }}
                        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                      />
                      <textarea
                        rows={2}
                        placeholder="Opinión de su familia"
                        value={vec.opinionFamilia}
                        onChange={(e) => {
                          const next = [...estudio.referenciasVecinales] as typeof estudio.referenciasVecinales;
                          next[idx] = { ...vec, opinionFamilia: e.target.value };
                          onChange({ ...estudio, referenciasVecinales: next });
                        }}
                        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                      />
                      <textarea
                        rows={2}
                        placeholder="Comentarios adicionales"
                        value={vec.comentariosAdicionales}
                        onChange={(e) => {
                          const next = [...estudio.referenciasVecinales] as typeof estudio.referenciasVecinales;
                          next[idx] = {
                            ...vec,
                            comentariosAdicionales: e.target.value,
                          };
                          onChange({ ...estudio, referenciasVecinales: next });
                        }}
                        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                      />
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs font-semibold text-gray-600">
                          ¿Recomienda su contratación?
                        </span>
                        <div className="flex gap-1">
                          {(["Si", "No"] as SiNo[]).map((o) => (
                            <button
                              key={o}
                              type="button"
                              onClick={() => {
                                const next = [
                                  ...estudio.referenciasVecinales,
                                ] as typeof estudio.referenciasVecinales;
                                next[idx] = { ...vec, recomiendaContratacion: o };
                                onChange({
                                  ...estudio,
                                  referenciasVecinales: next,
                                });
                              }}
                              className={`px-3 py-1 rounded text-xs font-bold ${
                                vec.recomiendaContratacion === o
                                  ? "bg-[#E31E24] text-white"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {o}
                            </button>
                          ))}
                  </div>
                  </div>
                  </div>
                  );
                })}
              </div>
            </div>

            {/* 3.3 Referencias Personales (Conocido 1, 2 y 3) */}
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 space-y-4">
              <h3 className="font-bold text-sm text-gray-900">
                3.3 Referencias Personales (Conocidos 1, 2 y 3)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {([0, 1, 2] as const).map((idx) => {
                  const con = estudio.referenciasPersonales[idx];
                  return (
                    <div
                      key={idx}
                      className="bg-white p-4 rounded-xl border border-gray-200 space-y-2.5"
                    >
                      <div className="font-bold text-xs text-[#E31E24] uppercase">
                        Conocido {idx + 1}
                  </div>
                      <input
                        type="text"
                        placeholder="Nombre"
                        value={con.nombre}
                        onChange={(e) => {
                          const next = [
                            ...estudio.referenciasPersonales,
                          ] as typeof estudio.referenciasPersonales;
                          next[idx] = { ...con, nombre: e.target.value };
                          onChange({ ...estudio, referenciasPersonales: next });
                        }}
                        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Teléfono"
                        value={con.telefono}
                        onChange={(e) => {
                          const next = [
                            ...estudio.referenciasPersonales,
                          ] as typeof estudio.referenciasPersonales;
                          next[idx] = { ...con, telefono: e.target.value };
                          onChange({ ...estudio, referenciasPersonales: next });
                        }}
                        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Dirección"
                        value={con.direccion}
                        onChange={(e) => {
                          const next = [
                            ...estudio.referenciasPersonales,
                          ] as typeof estudio.referenciasPersonales;
                          next[idx] = { ...con, direccion: e.target.value };
                          onChange({ ...estudio, referenciasPersonales: next });
                        }}
                        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="¿Hace cuánto lo conoce?"
                        value={con.tiempoConocerlo}
                        onChange={(e) => {
                          const next = [
                            ...estudio.referenciasPersonales,
                          ] as typeof estudio.referenciasPersonales;
                          next[idx] = { ...con, tiempoConocerlo: e.target.value };
                          onChange({ ...estudio, referenciasPersonales: next });
                        }}
                        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="¿En qué empresas ha laborado?"
                        value={con.empresasHaLaborado}
                        onChange={(e) => {
                          const next = [
                            ...estudio.referenciasPersonales,
                          ] as typeof estudio.referenciasPersonales;
                          next[idx] = {
                            ...con,
                            empresasHaLaborado: e.target.value,
                          };
                          onChange({ ...estudio, referenciasPersonales: next });
                        }}
                        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="¿Recomienda su contratación? (Sí/No)"
                        value={con.recomiendaContratacion}
                        onChange={(e) => {
                          const next = [
                            ...estudio.referenciasPersonales,
                          ] as typeof estudio.referenciasPersonales;
                          next[idx] = {
                            ...con,
                            recomiendaContratacion: e.target.value as SiNo,
                          };
                          onChange({ ...estudio, referenciasPersonales: next });
                        }}
                        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs"
                      />
                      <textarea
                        rows={2}
                        placeholder="¿Qué opinión tiene del candidato?"
                        value={con.opinionCandidato}
                        onChange={(e) => {
                          const next = [
                            ...estudio.referenciasPersonales,
                          ] as typeof estudio.referenciasPersonales;
                          next[idx] = {
                            ...con,
                            opinionCandidato: e.target.value,
                          };
                          onChange({ ...estudio, referenciasPersonales: next });
                        }}
                        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs"
                      />
                  </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            PASO 4: 4. ESTRUCTURA FAMILIAR Y 5. ECONOMÍA DEL HOGAR (PÁGINA 9)
        =================================================================== */}
        {activeStep === 4 && (
          <div className="space-y-8">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-xl font-bold text-gray-900">
                4. Estructura Familiar y 5. Economía del Hogar (Página 9)
              </h2>
              <p className="text-sm text-gray-500">
                Integrantes del grupo familiar y balance automático de ingresos vs. egresos mensuales.
              </p>
            </div>

            {/* 4. Estructura Familiar */}
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
              <h3 className="font-bold text-sm text-gray-900 mb-3">
                4. Estructura Familiar (Hasta 10 integrantes)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#6D6E71] text-white">
                      <th className="p-2 text-left rounded-tl-lg">Parentesco</th>
                      <th className="p-2 text-left">Nombre</th>
                      <th className="p-2 text-center w-20">Edad</th>
                      <th className="p-2 text-left">Ocupación</th>
                      <th className="p-2 text-left">Empresa</th>
                      <th className="p-2 text-center rounded-tr-lg w-28">
                        Mismo domicilio
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {Array.from({ length: 10 }).map((_, idx) => {
                      const row = estudio.estructuraFamiliar[idx] || {
                        parentesco: "",
                        nombre: "",
                        edad: "",
                        ocupacion: "",
                        empresa: "",
                        mismoDomicilio: "",
                      };
                      const updateRow = (
                        field: keyof typeof row,
                        val: string
                      ) => {
                        const next = [...estudio.estructuraFamiliar];
                        next[idx] = { ...row, [field]: val };
                        onChange({ ...estudio, estructuraFamiliar: next });
                      };
                      return (
                        <tr key={idx}>
                          <td className="p-1">
                            <input
                              type="text"
                              placeholder="Ej. Esposa"
                              value={row.parentesco}
                              onChange={(e) =>
                                updateRow("parentesco", e.target.value)
                              }
                              className="w-full border border-gray-200 rounded px-2 py-1"
                            />
                          </td>
                          <td className="p-1">
                            <input
                              type="text"
                              placeholder="Nombre completo"
                              value={row.nombre}
                              onChange={(e) => updateRow("nombre", e.target.value)}
                              className="w-full border border-gray-200 rounded px-2 py-1"
                            />
                          </td>
                          <td className="p-1">
                            <input
                              type="text"
                              placeholder="Edad"
                              value={row.edad}
                              onChange={(e) => updateRow("edad", e.target.value)}
                              className="w-full border border-gray-200 rounded px-2 py-1 text-center"
                            />
                          </td>
                          <td className="p-1">
                            <input
                              type="text"
                              placeholder="Ocupación"
                              value={row.ocupacion}
                              onChange={(e) =>
                                updateRow("ocupacion", e.target.value)
                              }
                              className="w-full border border-gray-200 rounded px-2 py-1"
                            />
                          </td>
                          <td className="p-1">
                            <input
                              type="text"
                              placeholder="Empresa"
                              value={row.empresa}
                              onChange={(e) => updateRow("empresa", e.target.value)}
                              className="w-full border border-gray-200 rounded px-2 py-1"
                            />
                          </td>
                          <td className="p-1">
                            <input
                              type="text"
                              placeholder="Sí / No"
                              value={row.mismoDomicilio}
                              onChange={(e) =>
                                updateRow("mismoDomicilio", e.target.value)
                              }
                              className="w-full border border-gray-200 rounded px-2 py-1 text-center"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 5. Economía del Hogar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Egresos */}
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                <h3 className="font-bold text-sm text-gray-900 mb-3">
                  5.1 Egresos Mensuales ($)
                </h3>
                <div className="space-y-2">
                  {(
                    [
                      { label: "Alimentos", key: "alimentos" },
                      { label: "Transporte público", key: "transportePublico" },
                      { label: "Gastos de auto", key: "gastosAuto" },
                      { label: "Luz", key: "luz" },
                      { label: "Gas", key: "gas" },
                      { label: "Celular", key: "celular" },
                      { label: "Teléfono de casa", key: "telefonoCasa" },
                      { label: "Cable", key: "cable" },
                      { label: "Escuela", key: "escuela" },
                      { label: "Crédito Bancario", key: "creditoBancario" },
                      { label: "Crédito INFONAVIT", key: "creditoInfonavit" },
                      { label: "Préstamo vía Nómina", key: "prestamoNomina" },
                      { label: "Pensión Alimenticia", key: "pensionAlimenticia" },
                      { label: "Renta", key: "renta" },
                      { label: "Ahorro mensual", key: "ahorroMensual" },
                    ] as const
                  ).map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-gray-200"
                    >
                      <span className="text-xs font-medium text-gray-700">
                        {item.label}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">$</span>
                        <input
                          type="number"
                          min="0"
                          step="50"
                          value={estudio.egresosMensuales[item.key] || ""}
                          onChange={(e) =>
                            onChange({
                              ...estudio,
                              egresosMensuales: {
                                ...estudio.egresosMensuales,
                                [item.key]: parseFloat(e.target.value) || 0,
                              },
                            })
                          }
                          placeholder="0.00"
                          className="w-28 text-right text-xs font-bold border border-gray-200 rounded px-2 py-1"
                        />
                  </div>
                  </div>
                  ))}
                </div>
              </div>

              {/* Ingresos y Resumen Financiero */}
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                  <h3 className="font-bold text-sm text-gray-900 mb-3">
                    5.2 Ingresos y Aportaciones al Hogar
                  </h3>
                  <div className="space-y-2">
                    {Array.from({ length: 8 }).map((_, idx) => {
                      const ing = estudio.ingresosHogar[idx] || {
                        parentesco: "",
                        monto: 0,
                      };
                      const updateIng = (
                        patch: Partial<{ parentesco: string; monto: number }>
                      ) => {
                        const next = [...estudio.ingresosHogar];
                        next[idx] = { ...ing, ...patch };
                        onChange({ ...estudio, ingresosHogar: next });
                      };
                      return (
                        <div
                          key={idx}
                          className="grid grid-cols-12 gap-2 bg-white p-2 rounded-lg border border-gray-200 items-center"
                        >
                          <input
                            type="text"
                            placeholder="¿Parentesco de quién aporta?"
                            value={ing.parentesco}
                            onChange={(e) =>
                              updateIng({ parentesco: e.target.value })
                            }
                            className="col-span-7 text-xs border border-gray-200 rounded px-2.5 py-1.5"
                          />
                          <div className="col-span-5 flex items-center gap-1">
                            <span className="text-xs text-gray-400">$</span>
                            <input
                              type="number"
                              min="0"
                              step="100"
                              placeholder="0.00"
                              value={ing.monto || ""}
                              onChange={(e) =>
                                updateIng({
                                  monto: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-full text-right text-xs font-bold border border-gray-200 rounded px-2 py-1.5"
                            />
                  </div>
                  </div>
                      );
                    })}
                  </div>
                </div>

                {/* Tarjeta de Balance Automático */}
                <div className="bg-gray-900 text-white rounded-2xl p-5 space-y-3">
                  <div className="text-xs uppercase tracking-wider text-gray-400 font-bold">
                    Balance Económico Mensual Calculado
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-white/10 rounded-xl p-3">
                      <div className="text-[11px] text-gray-300">Total Ingresos</div>
                      <div className="text-base font-bold text-emerald-400">
                        ${totalIngresos.toLocaleString("es-MX")}
                  </div>
                  </div>
                    <div className="bg-white/10 rounded-xl p-3">
                      <div className="text-[11px] text-gray-300">Total Gastos</div>
                      <div className="text-base font-bold text-red-400">
                        ${totalEgresos.toLocaleString("es-MX")}
                  </div>
                  </div>
                    <div className="bg-white/10 rounded-xl p-3">
                      <div className="text-[11px] text-gray-300">Remanente</div>
                      <div
                        className={`text-base font-bold ${
                          balanceMensual >= 0 ? "text-emerald-300" : "text-amber-400"
                        }`}
                      >
                        ${balanceMensual.toLocaleString("es-MX")}
                  </div>
                  </div>
                  </div>
                  {balanceMensual < 0 && (
                    <p className="text-xs text-amber-300">
                      Nota: Los egresos declarados superan a los ingresos en $
                      {Math.abs(balanceMensual).toLocaleString("es-MX")}.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            PASO 5: 6. DOCUMENTACIÓN PRESENTADA (PÁGINA 10)
        =================================================================== */}
        {activeStep === 5 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  6. Documentación Presentada y Folios (Página 10)
                </h2>
                <p className="text-sm text-gray-500">
                  Cotejo de los 17 documentos oficiales y captura de folios o números de acta/seguridad social.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...estudio,
                    documentosPresentados: estudio.documentosPresentados.map(
                      (d) => ({ ...d, presento: d.presento || "Si" })
                    ),
                  })
                }
                className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700"
              >
                Marcar pendientes como &quot;Sí&quot;
              </button>
            </div>

            <div className="space-y-2.5">
              {estudio.documentosPresentados.map((doc, idx) => (
                <React.Fragment key={doc.id}>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <span className="sm:col-span-5 text-xs font-semibold text-gray-800">
                      {doc.nombre}
                    </span>
                    <div className="sm:col-span-2 flex gap-1">
                      {(["Si", "No"] as SiNo[]).map((o) => (
                        <button
                          key={o}
                          type="button"
                          onClick={() => {
                            const next = [...estudio.documentosPresentados];
                            next[idx] = { ...doc, presento: o };
                            onChange({ ...estudio, documentosPresentados: next });
                          }}
                          className={`px-3 py-1 rounded text-xs font-bold ${
                            doc.presento === o
                              ? "bg-[#E31E24] text-white"
                              : "bg-white border border-gray-300 text-gray-600"
                          }`}
                        >
                          {o}
                        </button>
                      ))}
                  </div>
                    <input
                      type="text"
                      placeholder="Datos del documento (folio, clave, dirección o nota)..."
                      value={doc.folioDatos}
                      onChange={(e) => {
                        const next = [...estudio.documentosPresentados];
                        next[idx] = { ...doc, folioDatos: e.target.value };
                        onChange({ ...estudio, documentosPresentados: next });
                      }}
                      className="sm:col-span-5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium"
                    />

                    {/* Subida y descarga de archivo adjunto (Optimizado para Celular y PC) */}
                    <div className="sm:col-span-12 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-200/80 text-xs mt-1">
                      <div className="flex items-center gap-2">
                        {doc.fileUrl ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                            <File className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="truncate max-w-[200px]">
                              {doc.fileName || "Archivo adjunto"}
                            </span>
                            {doc.fileSize && (
                              <span className="text-[10px] text-emerald-600 font-normal">
                                ({(doc.fileSize / 1024).toFixed(0)} KB)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">
                            Sin archivo digital adjunto
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {doc.fileUrl && (
                          <>
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-semibold text-xs"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-600" />
                              <span>Ver</span>
                            </a>
                            <a
                              href={doc.fileUrl}
                              download={doc.fileName || `doc_${doc.id}.pdf`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-semibold text-xs"
                            >
                              <Download className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Descargar</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                const next = [...estudio.documentosPresentados];
                                next[idx] = {
                                  ...doc,
                                  fileUrl: undefined,
                                  fileName: undefined,
                                  fileSize: undefined,
                                };
                                onChange({ ...estudio, documentosPresentados: next });
                              }}
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                              title="Quitar archivo adjunto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs shadow-xs">
                          {subiendoDocId === doc.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E31E24]" />
                              <span>Subiendo a la nube...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-3.5 h-3.5 text-[#E31E24]" />
                              <span>
                                {doc.fileUrl ? "Reemplazar archivo" : "Adjuntar archivo/foto"}
                              </span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            disabled={subiendoDocId !== null}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setSubiendoDocId(doc.id);
                              try {
                                let archivoASubir: File | Blob = file;
                                // Si es foto, compresión cliente ultra-optimizada a WebP/JPEG
                                if (file.type.startsWith("image/")) {
                                  archivoASubir = await new Promise<Blob>((resolve) => {
                                    const reader = new FileReader();
                                    reader.onload = (ev) => {
                                      const img = new window.Image();
                                      img.onload = () => {
                                        const canvas = document.createElement("canvas");
                                        const maxDim = 1200;
                                        let w = img.width;
                                        let h = img.height;
                                        if (w > maxDim || h > maxDim) {
                                          if (w > h) {
                                            h = Math.round((h * maxDim) / w);
                                            w = maxDim;
                                          } else {
                                            w = Math.round((w * maxDim) / h);
                                            h = maxDim;
                                          }
                                        }
                                        canvas.width = w;
                                        canvas.height = h;
                                        const ctx = canvas.getContext("2d");
                                        if (ctx) {
                                          ctx.drawImage(img, 0, 0, w, h);
                                          canvas.toBlob(
                                            (b) => resolve(b || file),
                                            "image/jpeg",
                                            0.75
                                          );
                                        } else {
                                          resolve(file);
                                        }
                                      };
                                      img.src = ev.target?.result as string;
                                    };
                                    reader.readAsDataURL(file);
                                  });
                                }

                                const res = await subirArchivoExpediente(
                                  estudio.folio,
                                  doc.id,
                                  archivoASubir,
                                  file.name
                                );

                                if (res.url) {
                                  const next = [...estudio.documentosPresentados];
                                  next[idx] = {
                                    ...doc,
                                    presento: "Si",
                                    fileUrl: res.url,
                                    fileName: file.name,
                                    fileSize: archivoASubir.size,
                                  };
                                  onChange({
                                    ...estudio,
                                    documentosPresentados: next,
                                  });
                                } else if (res.error) {
                                  alert(`Error al subir archivo a Supabase Storage: ${res.error}`);
                                }
                              } finally {
                                setSubiendoDocId(null);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Selector A) Agua, B) Luz, C) Teléfono, D) Otro justo debajo del doc 12 */}
                  {doc.id === 12 && (
                    <div className="ml-4 sm:ml-10 p-3 bg-red-50/60 border border-red-200 rounded-xl flex flex-wrap items-center gap-3">
                      <span className="text-xs font-bold text-[#E31E24]">
                        Tipo de comprobante de domicilio (Inciso 12):
                      </span>
                      {(["Agua", "Luz", "Teléfono", "Otro"] as const).map(
                        (tipo) => (
                          <button
                            key={tipo}
                            type="button"
                            onClick={() =>
                              onChange({
                                ...estudio,
                                comprobanteDomicilioTipo: tipo,
                              })
                            }
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                              estudio.comprobanteDomicilioTipo === tipo
                                ? "bg-[#E31E24] text-white"
                                : "bg-white text-gray-700 border border-gray-300"
                            }`}
                          >
                            Recibo de {tipo}
                          </button>
                        )
                      )}
                  </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* ===================================================================
            PASO 6: ANEXOS (PÁGINA 11)
        =================================================================== */}
        {activeStep === 6 && (
          <div className="space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Anexos Fotográficos y Documentales (Página 11)
              </h2>
              <p className="text-sm text-gray-500">
                Agrega notas finales o imágenes de documentos escaneados (INE, constancia de semanas cotizadas, croquis, etc.).
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                Notas o descripción en página de Anexos
              </label>
              <textarea
                rows={3}
                value={estudio.anexosTexto}
                onChange={(e) =>
                  onChange({ ...estudio, anexosTexto: e.target.value })
                }
                placeholder="Observaciones adicionales o listado de anexos incluidos..."
                className="w-full rounded-xl border border-gray-300 p-3 text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase text-gray-600">
                  Imágenes en Anexos ({estudio.anexosImagenes.length})
                </span>
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E31E24] text-white text-xs font-bold hover:bg-[#B81419] transition">
                  <Plus className="w-4 h-4" />
                  <span>Agregar imagen a Anexos</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      handleImageUpload(e.target.files?.[0], (dataUrl) => {
                        onChange({
                          ...estudio,
                          anexosImagenes: [
                            ...estudio.anexosImagenes,
                            {
                              id: generateUUID(),
                              titulo: `Anexo ${estudio.anexosImagenes.length + 1}`,
                              dataUrl,
                            },
                          ],
                        });
                      })
                    }
                  />
                </label>
              </div>

              {estudio.anexosImagenes.length === 0 ? (
                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center text-gray-400 text-sm">
                  Aún no has cargado imágenes en la página de Anexos.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {estudio.anexosImagenes.map((img, idx) => (
                    <div
                      key={img.id}
                      className="border border-gray-200 rounded-xl p-3 bg-gray-50 space-y-2"
                    >
                      <div className="h-40 bg-white rounded-lg overflow-hidden flex items-center justify-center border border-gray-200">
                        <img
                          src={img.dataUrl}
                          alt={img.titulo}
                          className="max-h-full max-w-full object-contain"
                        />
                  </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={img.titulo}
                          onChange={(e) => {
                            const next = [...estudio.anexosImagenes];
                            next[idx] = { ...img, titulo: e.target.value };
                            onChange({ ...estudio, anexosImagenes: next });
                          }}
                          placeholder="Título del anexo"
                          className="flex-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            onChange({
                              ...estudio,
                              anexosImagenes: estudio.anexosImagenes.filter(
                                (item) => item.id !== img.id
                              ),
                            })
                          }
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                  </div>
                  </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================================================================
            PASO 7: AVISO DE PRIVACIDAD Y FIRMAS DIGITALES (PÁGINA 12)
        =================================================================== */}
        {activeStep === 7 && (
          <div className="space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2 text-[#E31E24] font-semibold text-xs uppercase tracking-wider mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Página 12 Oficial de Cierre</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Aviso de Privacidad y Firmas Digitales
              </h2>
              <p className="text-sm text-gray-500">
                Este apartado se autocompleta con los datos generales del estudio y permite al candidato trazar las 2 firmas electrónicas requeridas por ley.
              </p>
            </div>

            {/* Tarjeta de Datos Autocompletados */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Datos vinculados automáticamente desde el estudio
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Candidato / Titular:</label>
                  <input
                    type="text"
                    value={
                      estudio.avisoPrivacidad?.candidato ??
                      (estudio.candidatoNombrePortada || estudio.datosGenerales.nombre || "")
                    }
                    onChange={(e) =>
                      onChange({
                        ...estudio,
                        avisoPrivacidad: {
                          ...estudio.avisoPrivacidad,
                          candidato: e.target.value,
                        },
                      })
                    }
                    placeholder="Nombre completo del candidato"
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-800"
                  />
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Empresa Solicitante:</label>
                  <input
                    type="text"
                    value={
                      estudio.avisoPrivacidad?.empresa ??
                      (estudio.empresaSolicitante || "")
                    }
                    onChange={(e) =>
                      onChange({
                        ...estudio,
                        empresaSolicitante: e.target.value,
                        avisoPrivacidad: {
                          ...estudio.avisoPrivacidad,
                          empresa: e.target.value,
                        },
                      })
                    }
                    placeholder="Empresa contratante"
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-800"
                  />
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Puesto Solicitado:</label>
                  <input
                    type="text"
                    value={
                      estudio.avisoPrivacidad?.puesto ??
                      (estudio.puestoSolicitado || "")
                    }
                    onChange={(e) =>
                      onChange({
                        ...estudio,
                        puestoSolicitado: e.target.value,
                        avisoPrivacidad: {
                          ...estudio.avisoPrivacidad,
                          puesto: e.target.value,
                        },
                      })
                    }
                    placeholder="Puesto del candidato"
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-800"
                  />
                </div>
              </div>

              {/* Ajuste de Lugar y Fecha de Firma */}
              <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold uppercase text-slate-600">
                      Lugar / Municipio
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Autocompletado del estudio
                    </span>
                  </div>
                  <input
                    type="text"
                    value={
                      estudio.avisoPrivacidad?.lugar ??
                      (estudio.datosContacto.delegacionMunicipio || "Metepec, Estado de México")
                    }
                    onChange={(e) =>
                      onChange({
                        ...estudio,
                        avisoPrivacidad: {
                          ...estudio.avisoPrivacidad,
                          lugar: e.target.value,
                        },
                      })
                    }
                    placeholder="Ej. Metepec, Estado de México"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold"
                  />
                  <span className="text-[10.5px] text-slate-400 mt-1 block">
                    Toma en automático la delegación o municipio capturada en el Paso 2 (o Metepec, Edo. Méx.).
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                    Día
                  </label>
                  <input
                    type="text"
                    value={
                      estudio.avisoPrivacidad?.dia ??
                      new Date().getDate().toString()
                    }
                    onChange={(e) =>
                      onChange({
                        ...estudio,
                        avisoPrivacidad: {
                          ...estudio.avisoPrivacidad,
                          dia: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                    Mes
                  </label>
                  <input
                    type="text"
                    value={
                      estudio.avisoPrivacidad?.mes ??
                      new Intl.DateTimeFormat("es-MX", { month: "long" }).format(new Date())
                    }
                    onChange={(e) =>
                      onChange({
                        ...estudio,
                        avisoPrivacidad: {
                          ...estudio.avisoPrivacidad,
                          mes: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 1: DECLARACIÓN Y FIRMA 1 */}
            <div className="bg-white border-2 border-red-100 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-full bg-[#E31E24] text-white flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <h3 className="font-bold text-gray-900 text-base">
                  Firma de conformidad y veracidad de la información
                </h3>
              </div>

              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 leading-relaxed mb-5">
                <p>
                  Yo <strong>{estudio.candidatoNombrePortada || estudio.datosGenerales.nombre || "____________________"}</strong>, manifiesto bajo protesta de decir verdad que la información proporcionada durante el estudio socioeconómico realizado por el representante de Gestión RH es verídica, completa y comprobable, y que podrá ser corroborada en cualquier momento para fines del proceso de reclutamiento y selección de personal de la empresa <strong>{estudio.empresaSolicitante || "____________________"}</strong>, para el puesto de: <strong>{estudio.puestoSolicitado || "____________________"}</strong>.
                </p>
              </div>

              {/* Botón / Área de Firma 1 */}
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                {estudio.avisoPrivacidad?.firmaConformidadUrl ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="bg-white p-3 rounded-xl border border-gray-300 shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={estudio.avisoPrivacidad.firmaConformidadUrl}
                        alt="Firma 1 Conformidad"
                        className="h-24 max-w-xs object-contain"
                      />
                    </div>
                    <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Firma 1 capturada y guardada con éxito</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => setSignatureModal("conformidad")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-sm"
                      >
                        <PenLine className="w-3.5 h-3.5 text-blue-600" />
                        <span>Volver a firmar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onChange({
                            ...estudio,
                            avisoPrivacidad: {
                              ...estudio.avisoPrivacidad,
                              firmaConformidadUrl: "",
                            },
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-xs font-semibold text-red-600 hover:bg-red-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar firma</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-3">
                    <p className="text-xs text-gray-500">
                      El candidato debe plasmar su firma digital de conformidad sobre los datos proporcionados.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSignatureModal("conformidad")}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#E31E24] text-white text-sm font-bold hover:bg-[#B81419] shadow transition transform active:scale-95"
                    >
                      <PenLine className="w-4 h-4" />
                      <span>✍️ Dibujar Firma 1 (Conformidad)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* SECCIÓN 2: LECTURA LEGAL Y FIRMA 2 */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <h3 className="font-bold text-gray-900 text-base">
                  Conozco el aviso de privacidad de datos personales
                </h3>
              </div>

              {/* Resumen del Aviso Legal */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-[11px] text-slate-700 space-y-2 mb-5">
                <p>
                  <strong>Gestión RH</strong>, con domicilio en Calle Morelos No. 12 Oriente, Colonia Pilares, Metepec, Estado de México, C.P. 52176, es responsable del uso y protección de los datos personales que recabe, en cumplimiento de la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.
                </p>
                <div>
                  <strong className="text-slate-900">Finalidad del tratamiento:</strong> Integrar el reporte del estudio socioeconómico, evaluar perfil del candidato y transferir a la empresa solicitante.
                </div>
                <div>
                  <strong className="text-slate-900">Derechos ARCO:</strong> El titular podrá ejercer en cualquier momento sus derechos de Acceso, Rectificación, Cancelación u Oposición consultando el aviso en el domicilio señalado.
                </div>
              </div>

              {/* Botón / Área de Firma 2 */}
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                {estudio.avisoPrivacidad?.firmaAvisoPrivacidadUrl ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="bg-white p-3 rounded-xl border border-gray-300 shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={estudio.avisoPrivacidad.firmaAvisoPrivacidadUrl}
                        alt="Firma 2 Aviso Privacidad"
                        className="h-24 max-w-xs object-contain"
                      />
                    </div>
                    <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Firma 2 capturada y guardada con éxito</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => setSignatureModal("aviso")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-sm"
                      >
                        <PenLine className="w-3.5 h-3.5 text-blue-600" />
                        <span>Volver a firmar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onChange({
                            ...estudio,
                            avisoPrivacidad: {
                              ...estudio.avisoPrivacidad,
                              firmaAvisoPrivacidadUrl: "",
                            },
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-xs font-semibold text-red-600 hover:bg-red-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar firma</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-3">
                    <p className="text-xs text-gray-500">
                      Firma de conocimiento y aceptación de las políticas de privacidad y derechos ARCO.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSignatureModal("aviso")}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#E31E24] text-white text-sm font-bold hover:bg-[#B81419] shadow transition transform active:scale-95"
                    >
                      <PenLine className="w-4 h-4" />
                      <span>✍️ Dibujar Firma 2 (Aviso de Privacidad)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal para dibujar firmas interactivas */}
        <SignaturePadModal
          isOpen={signatureModal !== null}
          title={
            signatureModal === "conformidad"
              ? "Firma 1: Conformidad y veracidad de la información"
              : "Firma 2: Conozco el aviso de privacidad de datos personales"
          }
          subtitle={
            signatureModal === "conformidad"
              ? "Manifiesto bajo protesta de decir verdad que la información proporcionada es verídica"
              : "Acepto el tratamiento de datos personales conforme a la ley"
          }
          initialDataUrl={
            signatureModal === "conformidad"
              ? estudio.avisoPrivacidad?.firmaConformidadUrl
              : estudio.avisoPrivacidad?.firmaAvisoPrivacidadUrl
          }
          onClose={() => setSignatureModal(null)}
          onSave={(dataUrl) => {
            if (signatureModal === "conformidad") {
              onChange({
                ...estudio,
                avisoPrivacidad: {
                  ...estudio.avisoPrivacidad,
                  firmaConformidadUrl: dataUrl,
                  fechaFirmaConformidad: new Date().toISOString(),
                },
              });
            } else if (signatureModal === "aviso") {
              onChange({
                ...estudio,
                avisoPrivacidad: {
                  ...estudio.avisoPrivacidad,
                  firmaAvisoPrivacidadUrl: dataUrl,
                  fechaFirmaAviso: new Date().toISOString(),
                },
              });
            }
          }}
        />

        {/* Barra de navegación inferior del Wizard */}
        <div className="mt-8 pt-5 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            disabled={activeStep === 0}
            onClick={() => setActiveStep((s) => Math.max(0, s - 1))}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-medium">
              Paso {activeStep + 1} de {STEPS.length}
            </span>
            {estudio.isDraft && (
              <span className="text-[11px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                Borrador local
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Botón explícito para Guardar datos en Supabase */}
            <button
              type="button"
              onClick={() => {
                const saved = { ...estudio, isDraft: false };
                onSaveToDatabase(saved);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 text-sm font-bold shadow-sm"
              title="Guardar datos ahora en Supabase"
            >
              <Save className="w-4 h-4 text-emerald-600" />
              <span>Guardar Datos</span>
            </button>

            {activeStep < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={handleSaveAndNext}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E31E24] text-white text-sm font-bold hover:bg-[#B81419] shadow-sm"
              >
                <span>Guardar y Continuar</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const saved = { ...estudio, isDraft: false };
                  onSaveToDatabase(saved);
                  onSwitchToPDF();
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 shadow-sm"
              >
                <FileText className="w-4 h-4" />
                Guardar y Ver PDF (12 Págs.)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
