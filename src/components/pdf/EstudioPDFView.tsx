import React from "react";
import { EstudioSocioeconomico, ReferenciaLaboral } from "@/types/estudio";
import {
  LogoGestionRH,
  IconDocumentoCandidato,
  QRCodeGestionRH,
  SectionBanner,
  PageFooter,
} from "./BrandGraphics";

function CheckCell({ checked }: { checked: boolean }) {
  return (
    <div className="w-[18px] h-[16px] border border-black flex items-center justify-center bg-white mx-auto leading-none overflow-hidden select-none">
      {checked ? (
        <svg
          viewBox="0 0 24 24"
          className="w-[14px] h-[14px] text-black"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 12.5L9.5 18L20 5.5" />
        </svg>
      ) : null}
    </div>
  );
}

function RedDottedDivider({ className = "h-full" }: { className?: string }) {
  return (
    <div
      className={`w-[3px] shrink-0 ${className}`}
      style={{
        backgroundImage: "radial-gradient(#E31E24 1.5px, transparent 1.5px)",
        backgroundSize: "4px 8px",
        backgroundRepeat: "repeat-y",
      }}
    />
  );
}

function HorizontalRedDots() {
  return (
    <div
      className="flex-1 h-[4px]"
      style={{
        backgroundImage: "radial-gradient(#333 1.2px, transparent 1.2px)",
        backgroundSize: "7px 4px",
        backgroundRepeat: "repeat-x",
      }}
    />
  );
}

function PageWrapper({
  children,
  pageNumber,
}: {
  children: React.ReactNode;
  pageNumber: number;
}) {
  return (
    <div
      data-page={pageNumber}
      className="pdf-page relative bg-white w-[816px] h-[1056px] mx-auto shadow-xl print:shadow-none flex flex-col overflow-hidden text-[#1E1E1E] text-[11px] leading-snug select-text mb-8 print:mb-0"
    >
      {children}
    </div>
  );
}

function BloqueReferenciaLaboral({
  numero,
  refLab,
  part,
}: {
  numero: number;
  refLab: ReferenciaLaboral;
  part: "top" | "bottom" | "full";
}) {
  return (
    <div className="w-full text-[10.5px]">
      {(part === "top" || part === "full") && (
        <>
          <div className="bg-[#6D6E71] text-white font-bold px-3 py-1 mb-2 text-[11px]">
            {numero}.- Empresa:{" "}
            <span className="font-normal ml-1">{refLab.empresa}</span>
          </div>

          <div className="grid grid-cols-12 gap-4 mb-2">
            <div className="col-span-7">
              <div className="text-[#333] font-medium mb-0.5">Giro empresarial:</div>
              <div className="border-b border-gray-500 min-h-[18px] px-1 font-semibold">
                {refLab.giroEmpresarial}
              </div>
            </div>
            <div className="col-span-5">
              <div className="text-[#333] font-medium mb-0.5">Teléfono:</div>
              <div className="border-b border-gray-500 min-h-[18px] px-1 font-semibold">
                {refLab.telefono}
              </div>
            </div>
          </div>

          <div className="mb-2">
            <div className="text-[#333] font-medium mb-0.5">Domicilio:</div>
            <div className="border-b border-gray-500 min-h-[18px] px-1 font-semibold">
              {refLab.domicilio}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-2">
            <div>
              <div className="flex items-end gap-2">
                <span className="text-[#333] font-medium shrink-0">Fecha de ingreso:</span>
                <span className="border-b border-gray-500 flex-1 min-h-[18px] px-1 font-semibold">
                  {refLab.fechaIngreso}
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-end gap-2">
                <span className="text-[#333] font-medium shrink-0">
                  Puesto y sueldo inicial:
                </span>
                <span className="border-b border-gray-500 flex-1 min-h-[18px] px-1 font-semibold">
                  {refLab.puestoSueldoInicial}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-2">
            <div>
              <div className="flex items-end gap-2">
                <span className="text-[#333] font-medium shrink-0">Fecha de baja:</span>
                <span className="border-b border-gray-500 flex-1 min-h-[18px] px-1 font-semibold">
                  {refLab.fechaBaja}
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-end gap-2">
                <span className="text-[#333] font-medium shrink-0">
                  Puesto y sueldo final:
                </span>
                <span className="border-b border-gray-500 flex-1 min-h-[18px] px-1 font-semibold">
                  {refLab.puestoSueldoFinal}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6 mb-3">
            <div className="col-span-8">
              <div className="text-[#333] font-medium mb-0.5">Nombre del jefe directo:</div>
              <div className="border-b border-gray-500 min-h-[18px] px-1 font-semibold">
                {refLab.nombreJefeDirecto}
              </div>
            </div>
            <div className="col-span-4">
              <div className="text-[#333] font-medium mb-0.5">Sindicato</div>
              <div className="border-b border-gray-500 min-h-[18px] px-1 font-semibold">
                {refLab.sindicato}
              </div>
            </div>
          </div>

          {/* Tabla Manejo Confidencial / Equipo + Desempeño */}
          <div className="grid grid-cols-12 gap-4 items-end mb-3">
            <div className="col-span-9">
              <div className="flex justify-end pr-1 mb-0.5">
                <div className="bg-[#6D6E71] text-white font-bold text-[10px] grid grid-cols-2 w-16 text-center py-0.5">
                  <span>Si</span>
                  <span>No</span>
                </div>
              </div>
              <div className="border border-gray-400 divide-y divide-gray-400">
                <div className="flex items-center justify-between px-3 py-1">
                  <span className="text-center flex-1">
                    Manejo de información confidencial
                  </span>
                  <div className="grid grid-cols-2 w-16 gap-1">
                    <CheckCell checked={refLab.manejoInfoConfidencial === "Si"} />
                    <CheckCell checked={refLab.manejoInfoConfidencial === "No"} />
                  </div>
                </div>
                <div className="flex items-center justify-between px-3 py-1">
                  <span className="text-center flex-1">
                    Equipo tecnológico (computo, radio, etc.)
                  </span>
                  <div className="grid grid-cols-2 w-16 gap-1">
                    <CheckCell checked={refLab.equipoTecnologico === "Si"} />
                    <CheckCell checked={refLab.equipoTecnologico === "No"} />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-3">
              <div className="bg-[#6D6E71] text-white font-bold text-center py-0.5 text-[10px]">
                Desempeño
              </div>
              <div className="border border-gray-400 divide-y divide-gray-400">
                {(["Bueno", "Regular", "Malo"] as const).map((niv) => (
                  <div key={niv} className="flex items-center px-1.5 py-0.5">
                    <CheckCell checked={refLab.desempeno === niv} />
                    <span className="flex-1 text-center text-[10px]">{niv}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {(part === "bottom" || part === "full") && (
        <>
          {/* Causa de la separación y Decisión de la empresa */}
          <div className="grid grid-cols-2 gap-6 mb-3">
            <div>
              <div className="bg-[#6D6E71] text-white font-bold text-center py-1 text-[10px]">
                Causa de la separación
              </div>
              <div className="border border-gray-400 divide-y divide-gray-400">
                {(
                  [
                    "Renuncia voluntaria",
                    "Termino de contrato",
                    "Abandono de trabajo",
                    "Termino de proyecto",
                  ] as const
                ).map((c) => (
                  <div key={c} className="flex items-center px-2 py-0.5">
                    <CheckCell checked={refLab.causaSeparacion === c} />
                    <span className="flex-1 text-center text-[10px]">{c}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="bg-[#6D6E71] text-white font-bold text-center py-1 text-[10px]">
                Decisión de la empresa:
              </div>
              <div className="border border-gray-400 divide-y divide-gray-400">
                {(
                  [
                    "Falta de honestidad",
                    "Robo",
                    "Faltas injustificadas",
                    "Otra",
                  ] as const
                ).map((d) => (
                  <div key={d} className="flex items-center px-2 py-0.5">
                    <CheckCell checked={refLab.decisionEmpresa === d} />
                    <span className="flex-1 text-center text-[10px]">{d}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contrataría nuevamente + Observaciones */}
          <div className="grid grid-cols-12 gap-6 items-start mb-2">
            <div className="col-span-6">
              <div className="flex justify-end pr-1">
                <div className="bg-[#6D6E71] text-white font-bold text-[10px] grid grid-cols-2 w-16 text-center py-0.5">
                  <span>Si</span>
                  <span>No</span>
                </div>
              </div>
              <div className="border border-gray-400 divide-y divide-gray-400">
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-center flex-1 text-[10px]">
                    Contrataría nuevamente al candidato
                  </span>
                  <div className="grid grid-cols-2 w-16 gap-1">
                    <CheckCell checked={refLab.contratariaNuevamente === "Si"} />
                    <CheckCell checked={refLab.contratariaNuevamente === "No"} />
                  </div>
                </div>
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-center flex-1 text-[10px]">
                    Recomienda su contratación
                  </span>
                  <div className="grid grid-cols-2 w-16 gap-1">
                    <CheckCell checked={refLab.recomiendaContratacion === "Si"} />
                    <CheckCell checked={refLab.recomiendaContratacion === "No"} />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-6">
              <div className="text-[#333] font-medium mb-1">Observaciones:</div>
              <div className="border-b border-gray-500 min-h-[42px] text-[10px] px-1">
                {refLab.observaciones}
              </div>
            </div>
          </div>

          {/* Proporcionó información */}
          <div className="mb-2">
            <div className="font-bold text-[#333] mb-1 text-[10.5px]">
              Proporcionó información:
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-[#333] text-[10px]">Nombre:</div>
                <div className="border-b border-gray-500 min-h-[16px] font-semibold px-1">
                  {refLab.proporcionoNombre}
                </div>
              </div>
              <div>
                <div className="text-[#333] text-[10px]">Puesto:</div>
                <div className="border-b border-gray-500 min-h-[16px] font-semibold px-1">
                  {refLab.proporcionoPuesto}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function EstudioPDFView({ estudio }: { estudio: EstudioSocioeconomico }) {
  const totalEgresos = Object.values(estudio.egresosMensuales).reduce(
    (acc, val) => acc + (Number(val) || 0),
    0
  );
  const totalIngresos = estudio.ingresosHogar.reduce(
    (acc, item) => acc + (Number(item.monto) || 0),
    0
  );

  const filasEgresos: Array<{
    label: string;
    key: keyof EstudioSocioeconomico["egresosMensuales"];
  }> = [
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
    { label: "Préstamo vía Nomina", key: "prestamoNomina" },
    { label: "Pensión Alimenticia", key: "pensionAlimenticia" },
    { label: "Renta", key: "renta" },
    { label: "Ahorro mensual", key: "ahorroMensual" },
  ];

  return (
    <div id="pdf-document-root" className="flex flex-col items-center bg-gray-200 print:bg-white py-6 print:py-0">
      {/* =====================================================================
          PÁGINA 1: PORTADA Y RESUMEN EJECUTIVO
      ===================================================================== */}
      <PageWrapper pageNumber={1}>
        {/* Esquina diagonal superior derecha */}
        <div
          className="absolute right-0 top-0 w-36 h-36 bg-[#E31E24]"
          style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%)" }}
        />
        <div
          className="absolute right-0 top-0 w-28 h-28 bg-[#6D6E71]"
          style={{ clipPath: "polygon(15% 0, 100% 0, 100% 85%)" }}
        />

        <div className="px-10 pt-10 flex flex-col flex-1">
          {/* Header Título + Logos */}
          <div className="flex items-center justify-between pr-14 mb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-[29px] font-bold tracking-tight">
                <span className="text-[#2B2B2B]">Estudio </span>
                <span className="text-[#E31E24]">Socioeconómico</span>
              </h1>
              <IconDocumentoCandidato className="h-12 w-12" />
            </div>
            <LogoGestionRH />
          </div>

          {/* Fecha y Folio */}
          <div className="space-y-1.5 text-[11.5px] mb-3">
            <div className="flex items-end gap-2">
              <span>Metepec, Estado de México a</span>
              <span className="border-b border-gray-600 min-w-[230px] px-2 font-semibold">
                {estudio.fechaElaboracion}
              </span>
            </div>
            <div className="flex items-end gap-2">
              <span>Folio:</span>
              <span className="border-b border-gray-600 min-w-[280px] px-2 font-bold text-[#E31E24]">
                {estudio.folio}
              </span>
            </div>
          </div>

          {/* Párrafo de entrega */}
          <div className="text-[11.5px] leading-relaxed mb-3">
            <p>
              A continuación, hacemos entrega de los resultados generados en el estudio
              socioeconómico del
            </p>
            <div className="flex items-baseline flex-wrap gap-1 my-1">
              <span className="border-b border-gray-700 min-w-[290px] px-2 font-bold text-black">
                {(() => {
                  const raw = (
                    estudio.candidatoNombrePortada ||
                    estudio.datosGenerales.nombre ||
                    ""
                  ).trim();
                  const clean = raw.replace(/^C\.\s*/i, "");
                  return clean ? `C. ${clean}` : "C. ";
                })()}
              </span>
              <span>Llevado a cabo el día:</span>
              <span className="border-b border-gray-700 min-w-[160px] px-2 font-semibold">
                {estudio.fechaRealizacion}
              </span>
              <span>, para el</span>
            </div>
            <div className="flex items-baseline flex-wrap gap-1 my-1">
              <span>puesto:</span>
              <span className="border-b border-gray-700 min-w-[310px] px-2 font-bold text-black">
                {estudio.puestoSolicitado}
              </span>
              <span>, de acuerdo a los detalles de la investigación</span>
            </div>
            <p>
              del presente estudio socioeconómico le informamos que el candidato es
              considerado:
            </p>
          </div>

          {/* Caja de Dictamen */}
          <div className="flex justify-center my-2">
            <div
              className={`border-[1.5px] border-[#E31E24] rounded-md px-12 py-2 font-bold text-[13px] tracking-wide ${
                estudio.dictamen === "ACEPTABLE"
                  ? "text-[#1E1E1E]"
                  : estudio.dictamen === "CON RESERVAS"
                  ? "text-amber-700"
                  : "text-[#E31E24]"
              }`}
            >
              {estudio.dictamen}
            </div>
          </div>

          {/* 4 Cajas redondeadas rojas */}
          <div className="space-y-2.5 my-2">
            {[
              {
                titulo: "Reporte de la entrevista:",
                valor: estudio.reporteEntrevista,
              },
              {
                titulo: "Investigación domiciliaria:",
                valor: estudio.investigacionDomiciliaria,
              },
              {
                titulo: "Referencias vecinales:",
                valor: estudio.resumenReferenciasVecinales,
              },
              {
                titulo: "Referencias laborales:",
                valor: estudio.resumenReferenciasLaborales,
              },
            ].map((item) => (
              <div
                key={item.titulo}
                className="border border-[#E31E24] rounded-xl grid grid-cols-12 min-h-[96px] overflow-hidden"
              >
                <div className="col-span-4 border-r border-[#E31E24] flex items-center justify-center p-3 text-center font-bold text-[12px] text-black">
                  {item.titulo}
                </div>
                <div className="col-span-8 p-3 text-[10.5px] text-gray-800 whitespace-pre-line flex items-center">
                  {item.valor}
                </div>
              </div>
            ))}
          </div>

          {/* Barra roja inferior con escala de dictamen */}
          <div className="mt-2">
            <div className="relative w-full h-5 bg-[#E31E24] overflow-hidden mb-3">
              <div
                className="absolute left-0 top-0 bottom-0 w-5 bg-[#6D6E71]"
                style={{ clipPath: "polygon(0 0, 85% 0, 15% 100%, 0% 100%)" }}
              />
            </div>

            <div className="grid grid-cols-12 gap-4 items-center px-2">
              <div className="col-span-5 text-center italic font-bold text-[10.5px] space-y-2">
                <p>
                  Quedo a sus órdenes para cualquier
                  <br />
                  aclaración o comentario.
                </p>
                <p>
                  Coordinación de estudios
                  <br />
                  socioeconómicos
                </p>
              </div>

              <div className="col-span-1 flex justify-center h-20">
                <RedDottedDivider />
              </div>

              <div className="col-span-6">
                <div className="grid grid-cols-3 text-center font-bold text-[9.5px] mb-1">
                  <span className="text-[#E31E24]">NO ACEPTABLE</span>
                  <span className="text-[#6D6E71]">CON RESERVAS</span>
                  <span className="text-[#2E9E5B]">ACEPTABLE</span>
                </div>
                <div className="relative flex items-center my-1.5">
                  <span className="text-[10px] leading-none">◄</span>
                  <div className="flex-1 h-[1px] bg-gray-600" />
                  <span className="text-[10px] leading-none">►</span>
                </div>
                <div className="grid grid-cols-3 text-center text-[9px] gap-2 leading-tight">
                  <span className="text-[#E31E24] font-medium">
                    Estudio con antecedentes negativos graves
                  </span>
                  <span className="text-[#6D6E71] font-medium">
                    Estudio con antecedentes negativos no graves
                  </span>
                  <span className="text-[#2E9E5B] font-medium">
                    Estudio sin información contundente negativa
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <PageFooter variant="cover" />
      </PageWrapper>

      {/* =====================================================================
          PÁGINA 2: 1. RECONOCIMIENTO Y UBICACIÓN DEL CANDIDATO
      ===================================================================== */}
      <PageWrapper pageNumber={2}>
        <div className="px-10 pt-5 flex flex-col flex-1">
          <SectionBanner title="1. Reconocimiento y ubicación del candidato" />

          <div className="grid grid-cols-12 gap-4 flex-1 mt-1">
            {/* Columna Izquierda: 3 Fotografías */}
            <div className="col-span-7 flex flex-col justify-between pr-1">
              <div>
                <h3 className="font-bold text-[10.5px] text-center mb-1">
                  1.1 Fotografía interior - Características personales del candidato
                </h3>
                <div className="border border-[#E31E24] rounded-xl h-[240px] flex items-center justify-center overflow-hidden bg-gray-50/40">
                  {estudio.fotoInterior ? (
                    <img
                      src={estudio.fotoInterior}
                      alt="Interior / Candidato"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-400 text-xs">
                      Sin fotografía interior cargada
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-[10.5px] text-center mb-1">
                  1.2 Fotografía exterior - Características de la vivienda
                </h3>
                <div className="border border-[#E31E24] rounded-xl h-[240px] flex items-center justify-center overflow-hidden bg-gray-50/40">
                  {estudio.fotoExterior ? (
                    <img
                      src={estudio.fotoExterior}
                      alt="Exterior vivienda"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-400 text-xs">
                      Sin fotografía exterior cargada
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-[10.5px] text-center mb-1">
                  1.3 Características de la zona y servicios con los que cuenta
                </h3>
                <div className="border border-[#E31E24] rounded-xl h-[240px] flex items-center justify-center overflow-hidden bg-gray-50/40">
                  {estudio.fotoZona ? (
                    <img
                      src={estudio.fotoZona}
                      alt="Zona / Croquis"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-400 text-xs">
                      Sin fotografía de zona cargada
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Columna Derecha con línea punteada roja */}
            <div className="col-span-5 flex gap-3">
              <RedDottedDivider />

              <div className="flex-1 flex flex-col justify-between text-[10px]">
                {/* Tabla Bueno / Regular / Malo */}
                <div>
                  <div className="flex justify-end">
                    <div className="bg-[#6D6E71] text-white font-bold grid grid-cols-3 w-[138px] text-center py-1 text-[9.5px]">
                      <span>Bueno</span>
                      <span>Regular</span>
                      <span>Malo</span>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-300 border-b border-gray-300">
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
                    ).map((row) => (
                      <div key={row.key} className="flex items-center py-0.5">
                        <span className="flex-1 text-[#333] pl-1">{row.label}</span>
                        <div className="grid grid-cols-3 w-[138px]">
                          <CheckCell
                            checked={estudio.evaluacionPersonal[row.key] === "Bueno"}
                          />
                          <CheckCell
                            checked={estudio.evaluacionPersonal[row.key] === "Regular"}
                          />
                          <CheckCell
                            checked={estudio.evaluacionPersonal[row.key] === "Malo"}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-1">
                    <div className="italic text-[#333]">Comentarios Adicionales:</div>
                    <div className="border-b border-gray-400 min-h-[24px] text-[9.5px] font-medium">
                      {estudio.comentariosPersonales}
                    </div>
                  </div>
                </div>

                {/* Sección Casa / Valor / Material / Tipo */}
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-6">
                      <div className="bg-[#6D6E71] text-white font-bold text-center py-0.5">
                        Casa
                      </div>
                      <div className="border border-gray-400 divide-y divide-gray-400">
                        {(["Propia", "Prestada", "Rentada", "Otro"] as const).map(
                          (t) => (
                            <div key={t} className="flex items-center px-1 py-0.5">
                              <CheckCell checked={estudio.viviendaTenencia === t} />
                              <span className="flex-1 text-center">{t}</span>
                            </div>
                          )
                        )}
                      </div>
                      <div className="mt-0.5 text-[9px]">
                        ¿Cuál?{" "}
                        <span className="font-semibold">
                          {estudio.viviendaTenenciaCual}
                        </span>
                      </div>
                    </div>

                    <div className="col-span-6 flex flex-col justify-between text-center">
                      <div>
                        <div className="font-medium text-[#333]">Valor aproximado:</div>
                        <div className="border-b border-gray-400 min-h-[18px] font-semibold">
                          {estudio.viviendaValorAprox}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-[#333] leading-tight">
                          Tiempo viviendo en ese domicilio:
                        </div>
                        <div className="border-b border-gray-400 min-h-[18px] font-semibold">
                          {estudio.viviendaTiempoViviendo}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="bg-[#6D6E71] text-white font-bold text-center py-0.5 text-[9px] leading-tight">
                        Material utilizado
                        <br />
                        en construcción:
                      </div>
                      <div className="border border-gray-400 divide-y divide-gray-400">
                        {(
                          [
                            "Concreto",
                            "Madera",
                            "Lamina",
                            "Adobe",
                            "Cartón",
                            "Otro",
                          ] as const
                        ).map((mat) => (
                          <div key={mat} className="flex items-center px-1 py-0.5">
                            <CheckCell checked={estudio.viviendaMaterial === mat} />
                            <span className="flex-1 text-center">{mat}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-0.5 border-b border-gray-400 pb-0.5 text-[9px]">
                        ¿Cuál? {estudio.viviendaMaterialCual}
                      </div>
                    </div>

                    <div>
                      <div className="bg-[#6D6E71] text-white font-bold text-center py-1 text-[9.5px]">
                        Tipo de vivienda
                      </div>
                      <div className="border border-gray-400 divide-y divide-gray-400">
                        {(
                          [
                            "Residencial",
                            "Media Residencial",
                            "Interés Social",
                            "Vecindad",
                            "Rural",
                          ] as const
                        ).map((tipo) => (
                          <div key={tipo} className="flex items-center px-1 py-0.5">
                            <CheckCell checked={estudio.viviendaTipo === tipo} />
                            <span className="flex-1 text-center text-[9px] leading-tight">
                              {tipo}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-1 text-[9px]">
                        <div>Color de casa:</div>
                        <div className="border-b border-gray-400 min-h-[16px] font-semibold">
                          {estudio.viviendaColor}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabla Cantidad de espacios */}
                <div>
                  <div className="flex justify-end">
                    <div className="bg-[#6D6E71] text-white font-bold text-center py-0.5 w-24 text-[9.5px]">
                      Cantidad
                    </div>
                  </div>
                  <div className="border border-gray-400 divide-y divide-gray-400">
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
                      <div key={esp.key} className="flex items-center">
                        <span className="flex-1 text-center py-0.5 text-[9.5px]">
                          {esp.label}
                        </span>
                        <span className="w-24 border-l border-gray-400 text-center font-semibold py-0.5">
                          {estudio.espaciosCantidad[esp.key]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <PageFooter />
      </PageWrapper>

      {/* =====================================================================
          PÁGINA 3: SERVICIOS DE ZONA + 2. CÉDULA DEL CANDIDATO (2.1 y 2.3)
      ===================================================================== */}
      <PageWrapper pageNumber={3}>
        <div className="px-10 pt-6 flex flex-col flex-1">
          {/* 3 Tablas de Servicios de la zona */}
          <div className="grid grid-cols-3 gap-5 mb-4 text-[10px]">
            {[
              [
                { label: "Agua potable", key: "aguaPotable" },
                { label: "Drenaje", key: "drenaje" },
                { label: "Energía eléctrica", key: "energiaElectrica" },
                { label: "Alumbrado público", key: "alumbradoPublico" },
              ],
              [
                { label: "Pavimentación", key: "pavimentacion" },
                { label: "Vigilancia", key: "vigilancia" },
                { label: "Televisión de paga", key: "televisionPaga" },
                { label: "Teléfono", key: "telefono" },
              ],
              [
                { label: "Internet", key: "internet" },
                { label: "Transporte público", key: "transportePublico" },
                { label: "Se observa grafiti", key: "seObservaGrafiti" },
                { label: "Se observa Vandalismo", key: "seObservaVandalismo" },
              ],
            ].map((grupo, idx) => (
              <div key={idx}>
                <div className="flex justify-end pr-0.5">
                  <div className="bg-[#6D6E71] text-white font-bold grid grid-cols-2 w-14 text-center py-0.5">
                    <span>Si</span>
                    <span>No</span>
                  </div>
                </div>
                <div className="border border-gray-400 divide-y divide-gray-400">
                  {grupo.map((srv) => {
                    const val =
                      estudio.serviciosZona[
                        srv.key as keyof EstudioSocioeconomico["serviciosZona"]
                      ];
                    return (
                      <div key={srv.key} className="flex items-center py-0.5 px-1.5">
                        <span className="flex-1 text-center">{srv.label}</span>
                        <div className="grid grid-cols-2 w-14 gap-0.5">
                          <CheckCell checked={val === "Si"} />
                          <CheckCell checked={val === "No"} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <SectionBanner title="2. Cédula del candidato" />

          <h3 className="font-bold text-center text-[12px] my-2">
            2.1 Datos generales y de salud
          </h3>

          {/* Nombre y Edad */}
          <div className="grid grid-cols-12 gap-6 mb-3">
            <div className="col-span-9">
              <div className="text-[#333] font-medium">Nombre:</div>
              <div className="border-b border-gray-500 min-h-[20px] font-bold px-1">
                {estudio.datosGenerales.nombre || estudio.candidatoNombrePortada}
              </div>
            </div>
            <div className="col-span-3">
              <div className="text-[#333] font-medium">Edad:</div>
              <div className="border-b border-gray-500 min-h-[20px] font-semibold px-1">
                {estudio.datosGenerales.edad}
              </div>
            </div>
          </div>

          {/* Sexo y Fecha de nacimiento */}
          <div className="grid grid-cols-12 gap-4 items-center mb-3">
            <div className="col-span-5 flex items-center gap-3">
              <span className="text-[#333] font-medium">Sexo:</span>
              <div className="flex items-center gap-1.5">
                <CheckCell checked={estudio.datosGenerales.sexo === "Femenino"} />
                <span>Femenino</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCell checked={estudio.datosGenerales.sexo === "Masculino"} />
                <span>Masculino</span>
              </div>
            </div>
            <div className="col-span-7">
              <div className="flex items-baseline gap-2 border-b border-gray-500 pb-1">
                <span className="text-[#333] font-medium">Fecha de Nacimiento:</span>
                <span>Día</span>
                <span className="font-bold px-2">
                  {estudio.datosGenerales.fechaNacimientoDia}
                </span>
                <span>de</span>
                <span className="font-bold px-2">
                  {estudio.datosGenerales.fechaNacimientoMes}
                </span>
                <span>de</span>
                <span className="font-bold px-2">
                  {estudio.datosGenerales.fechaNacimientoAnio}
                </span>
              </div>
            </div>
          </div>

          {/* Lugar de nacimiento + Estado Civil */}
          <div className="grid grid-cols-12 gap-6 mb-4">
            <div className="col-span-9 space-y-2">
              <div>
                <div className="text-[#333] font-medium">Lugar de Nacimiento:</div>
                <div className="border-b border-gray-500 min-h-[18px] font-semibold px-1">
                  {estudio.datosGenerales.lugarNacimiento}
                </div>
              </div>
              <div>
                <div className="text-[#333] font-medium">
                  Lugar y fecha de matrimonio:
                </div>
                <div className="border-b border-gray-500 min-h-[18px] font-semibold px-1">
                  {estudio.datosGenerales.lugarFechaMatrimonio}
                </div>
              </div>
              <div>
                <div className="text-[#333] font-medium">No. de hijos /edad:</div>
                <div className="border-b border-gray-500 min-h-[18px] font-semibold px-1">
                  {estudio.datosGenerales.numeroHijosEdad}
                </div>
              </div>
              <div>
                <div className="text-[#333] font-medium">Ocupación actual:</div>
                <div className="border-b border-gray-500 min-h-[18px] font-semibold px-1">
                  {estudio.datosGenerales.ocupacionActual}
                </div>
              </div>
            </div>

            <div className="col-span-3">
              <div className="bg-[#6D6E71] text-white font-bold text-center py-1 text-[10px]">
                Estado civil:
              </div>
              <div className="border border-gray-400 divide-y divide-gray-400 text-[10px]">
                {(
                  [
                    "Soltero (a)",
                    "Divorciado (a)",
                    "Casado (a)",
                    "Unión Libre",
                    "Viudo (a)",
                  ] as const
                ).map((ec) => (
                  <div key={ec} className="flex items-center px-1.5 py-1">
                    <CheckCell checked={estudio.datosGenerales.estadoCivil === ec} />
                    <span className="flex-1 text-center">{ec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Peso, Salud Visual, Estatura, Salud Física, Tipo de sangre */}
          <div className="grid grid-cols-3 gap-6 mb-5 text-[10px]">
            <div className="border border-gray-400 divide-y divide-gray-400">
              <div className="grid grid-cols-2">
                <span className="bg-[#6D6E71] text-white font-bold text-center py-1">
                  Peso
                </span>
                <span className="text-center py-1 font-semibold">
                  {estudio.datosGenerales.peso}
                </span>
              </div>
              <div className="grid grid-cols-2">
                <span className="bg-[#6D6E71] text-white font-bold text-center py-1">
                  Salud Visual
                </span>
                <span className="text-center py-1 font-semibold">
                  {estudio.datosGenerales.saludVisual}
                </span>
              </div>
            </div>

            <div className="border border-gray-400 divide-y divide-gray-400">
              <div className="grid grid-cols-2">
                <span className="bg-[#6D6E71] text-white font-bold text-center py-1">
                  Estatura (Mts):
                </span>
                <span className="text-center py-1 font-semibold">
                  {estudio.datosGenerales.estatura}
                </span>
              </div>
              <div className="grid grid-cols-2">
                <span className="bg-[#6D6E71] text-white font-bold text-center py-1">
                  Salud Física:
                </span>
                <span className="text-center py-1 font-semibold">
                  {estudio.datosGenerales.saludFisica}
                </span>
              </div>
            </div>

            <div>
              <div className="border border-gray-400 grid grid-cols-2">
                <span className="bg-[#6D6E71] text-white font-bold text-center py-1">
                  Tipo de sangre:
                </span>
                <span className="text-center py-1 font-semibold">
                  {estudio.datosGenerales.tipoSangre}
                </span>
              </div>
            </div>
          </div>

          {/* 2.3 Datos de contacto del candidato */}
          <h3 className="font-bold text-center text-[12px] mb-3">
            2.3 Datos de contacto del candidato
          </h3>

          <div className="flex items-center gap-3 mb-3">
            <span className="font-bold text-[#333]">Domicilio:</span>
            <HorizontalRedDots />
          </div>

          <div className="grid grid-cols-12 gap-6 mb-3">
            <div className="col-span-7">
              <div className="text-[#333] font-medium">Calle y No:</div>
              <div className="border-b border-gray-500 min-h-[18px] font-semibold px-1">
                {estudio.datosContacto.calleYNumero}
              </div>
            </div>
            <div className="col-span-5">
              <div className="text-[#333] font-medium">Delegación o Municipio:</div>
              <div className="border-b border-gray-500 min-h-[18px] font-semibold px-1">
                {estudio.datosContacto.delegacionMunicipio}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6 mb-4">
            <div className="col-span-5">
              <div className="text-[#333] font-medium">Estado y Ciudad:</div>
              <div className="border-b border-gray-500 min-h-[18px] font-semibold px-1">
                {estudio.datosContacto.estadoCiudad}
              </div>
            </div>
            <div className="col-span-7">
              <div className="text-[#333] font-medium">Entre que calles:</div>
              <div className="border-b border-gray-500 min-h-[18px] font-semibold px-1">
                {estudio.datosContacto.entreCalles}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <span className="font-bold text-[#333]">2.3.2 Contacto:</span>
            <HorizontalRedDots />
          </div>

          <div className="grid grid-cols-3 gap-6 mb-3">
            <div>
              <div className="text-[#333] font-medium">Casa:</div>
              <div className="border-b border-gray-500 min-h-[18px] font-semibold px-1">
                {estudio.datosContacto.telefonoCasa}
              </div>
            </div>
            <div>
              <div className="text-[#333] font-medium">Recados:</div>
              <div className="border-b border-gray-500 min-h-[18px] font-semibold px-1">
                {estudio.datosContacto.telefonoRecados}
              </div>
            </div>
            <div>
              <div className="text-[#333] font-medium">Celular:</div>
              <div className="border-b border-gray-500 min-h-[18px] font-semibold px-1">
                {estudio.datosContacto.telefonoCelular}
              </div>
            </div>
          </div>

          <div>
            <div className="text-[#333] font-medium">Correo electrónico:</div>
            <div className="border-b border-gray-500 min-h-[18px] font-semibold px-1">
              {estudio.datosContacto.correoElectronico}
            </div>
          </div>
        </div>
        <PageFooter />
      </PageWrapper>

      {/* =====================================================================
          PÁGINA 4: CUESTIONARIO MÉDICO Y DE HÁBITOS
      ===================================================================== */}
      <PageWrapper pageNumber={4}>
        {/* Esquina diagonal superior derecha */}
        <div
          className="absolute right-0 top-0 w-36 h-36 bg-[#E31E24]"
          style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%)" }}
        />
        <div
          className="absolute right-0 top-0 w-28 h-28 bg-[#6D6E71]"
          style={{ clipPath: "polygon(15% 0, 100% 0, 100% 85%)" }}
        />

        <div className="px-10 pt-8 flex flex-col flex-1">
          {/* Header con logo, QR y redes sociales */}
          <div className="flex items-center justify-between pr-20 mb-6">
            <LogoGestionRH />
            <div className="flex items-center gap-4">
              <QRCodeGestionRH className="w-16 h-16" />
              <div className="flex items-center gap-2 text-[#E31E24] font-bold text-sm">
                <span>f</span>
                <span>◎</span>
                <span>♪</span>
                <span>▶</span>
                <span>𝕏</span>
                <span>in</span>
              </div>
            </div>
          </div>

          {/* Tabla Embarazada / Tatuajes */}
          <div className="grid grid-cols-12 gap-3 mb-6 text-[10.5px]">
            <div className="col-span-5">
              <div className="flex justify-end">
                <div className="bg-[#6D6E71] text-white font-bold grid grid-cols-2 w-16 text-center py-0.5">
                  <span>Si</span>
                  <span>No</span>
                </div>
              </div>
              <div className="border border-gray-400 divide-y divide-gray-400">
                <div className="flex items-center py-1.5 px-2">
                  <span className="flex-1 text-center">Embarazada:</span>
                  <div className="grid grid-cols-2 w-16 gap-1">
                    <CheckCell checked={estudio.saludHabitos.embarazada === "Si"} />
                    <CheckCell checked={estudio.saludHabitos.embarazada === "No"} />
                  </div>
                </div>
                <div className="flex items-center py-1.5 px-2">
                  <span className="flex-1 text-center">Tatuajes</span>
                  <div className="grid grid-cols-2 w-16 gap-1">
                    <CheckCell checked={estudio.saludHabitos.tatuajes === "Si"} />
                    <CheckCell checked={estudio.saludHabitos.tatuajes === "No"} />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-7">
              <div className="bg-[#6D6E71] text-white font-bold text-center py-0.5">
                Comentarios
              </div>
              <div className="border border-gray-400 divide-y divide-gray-400">
                <div className="py-1.5 px-3">
                  <span className="font-bold text-[#333]">Tiempo de embarazo: </span>
                  <span>{estudio.saludHabitos.tiempoEmbarazo}</span>
                </div>
                <div className="py-1.5 px-3">
                  <span className="font-bold text-[#333]">
                    ¿Cuántos? / ubicación corporal:{" "}
                  </span>
                  <span>{estudio.saludHabitos.tatuajesDetalle}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla principal de preguntas de salud */}
          <div className="text-[10.5px]">
            <div className="grid grid-cols-12">
              <div className="col-span-6" />
              <div className="col-span-1 bg-[#6D6E71] text-white font-bold grid grid-cols-2 text-center py-1">
                <span>Si</span>
                <span>No</span>
              </div>
              <div className="col-span-5 bg-[#6D6E71] text-white font-bold text-center py-1 border-l border-white">
                Comentarios
              </div>
            </div>

            <div className="border border-gray-400 divide-y divide-gray-400">
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
                  {
                    label: "¿Tuvo secuelas?",
                    key: "accidentesSecuelas",
                  },
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
                      "¿El candidato ha estado bajo algún tratamiento médico o psicológico:",
                    key: "tratamientoMedicoPsicologico",
                  },
                  {
                    label:
                      "¿Qué enfermedades padece con mayor frecuencia el candidato?",
                    key: "enfermedadesFrecuentes",
                  },
                  {
                    label: "¿El candidato tiene alergias?",
                    key: "alergias",
                  },
                  {
                    label: "¿El candidato fuma?",
                    key: "fuma",
                  },
                  {
                    label: "¿El candidato ingiere bebidas alcohólicas?",
                    key: "bebidasAlcoholicas",
                  },
                  {
                    label: "¿El candidato consume algún otro tipo de droga?",
                    key: "consumeDrogas",
                  },
                ] as const
              ).map((item, idx) => {
                const entry = estudio.saludHabitos[item.key];
                return (
                  <div
                    key={item.key}
                    className={`grid grid-cols-12 items-center ${
                      idx % 2 === 1 ? "bg-gray-100/70" : "bg-white"
                    }`}
                  >
                    <div className="col-span-6 py-1.5 px-3 text-center leading-tight">
                      {item.label}
                    </div>
                    <div className="col-span-1 grid grid-cols-2 py-1 border-l border-r border-gray-400">
                      <CheckCell checked={entry.respuesta === "Si"} />
                      <CheckCell checked={entry.respuesta === "No"} />
                    </div>
                    <div className="col-span-5 py-1 px-3 font-medium">
                      {entry.comentarios}
                    </div>
                  </div>
                );
              })}

              {/* Última fila: Institución médica */}
              <div className="grid grid-cols-12 items-center bg-gray-100/70">
                <div className="col-span-7 py-2 px-3 text-center">
                  ¿A qué Institución médica a la que acude a el candidato?
                </div>
                <div className="col-span-5 py-2 px-3 font-bold border-l border-gray-400">
                  {estudio.saludHabitos.institucionMedica}
                </div>
              </div>
            </div>
          </div>
        </div>
        <PageFooter />
      </PageWrapper>

      {/* =====================================================================
          PÁGINA 5: 2.2 DATOS ACADÉMICOS + 3. REFERENCIAS (EMPRESA 1 - PARTE 1)
      ===================================================================== */}
      <PageWrapper pageNumber={5}>
        <div className="px-10 pt-6 flex flex-col flex-1">
          <h3 className="font-bold text-center text-[12px] mb-3">
            2.2 Datos académicos
          </h3>

          <div className="grid grid-cols-12 gap-4 mb-3 text-[10px]">
            {/* Columna izquierda de datos académicos */}
            <div className="col-span-5 pr-2">
              <div className="font-medium text-[#333] mb-1.5">
                Nivel máximo de estudios:
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="border border-gray-400 divide-y divide-gray-400">
                  {(
                    [
                      "Preescolar",
                      "Primaria",
                      "Secundaria",
                      "Preparatoria",
                    ] as const
                  ).map((niv) => (
                    <div key={niv} className="flex items-center px-1.5 py-1">
                      <CheckCell checked={estudio.datosAcademicos.nivelMaximo === niv} />
                      <span className="flex-1 text-center">{niv}</span>
                    </div>
                  ))}
                </div>
                <div className="border border-gray-400 divide-y divide-gray-400">
                  {(
                    [
                      "Carrera técnica",
                      "Licenciatura",
                      "Maestría",
                      "Doctorado",
                    ] as const
                  ).map((niv) => (
                    <div key={niv} className="flex items-center px-1.5 py-1">
                      <CheckCell checked={estudio.datosAcademicos.nivelMaximo === niv} />
                      <span className="flex-1 text-center">{niv}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <div className="text-[#333] font-medium">Área:</div>
                  <div className="border-b border-gray-500 min-h-[18px] font-semibold px-1">
                    {estudio.datosAcademicos.area}
                  </div>
                </div>
                <div>
                  <div className="text-[#333] font-medium">
                    Escuela o Institución académica:
                  </div>
                  <div className="border-b border-gray-500 min-h-[18px] font-semibold px-1">
                    {estudio.datosAcademicos.escuelaInstitucion}
                  </div>
                </div>
                <div>
                  <div className="text-[#333] font-medium">Período escolar:</div>
                  <div className="border-b border-gray-500 min-h-[18px] font-semibold px-1">
                    {estudio.datosAcademicos.periodoEscolar}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-7 flex gap-3">
              <RedDottedDivider />
              <div className="flex-1 flex flex-col justify-between">
                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-gray-400 divide-y divide-gray-400">
                    {(
                      [
                        "Certificado",
                        "Constancia de estudios",
                        "Boleta",
                        "Título",
                        "Otro",
                      ] as const
                    ).map((doc) => (
                      <div key={doc} className="flex items-center px-1.5 py-0.5">
                        <CheckCell
                          checked={
                            estudio.datosAcademicos.documentoComprobatorio === doc
                          }
                        />
                        <span className="flex-1 text-center">{doc}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border border-gray-400 divide-y divide-gray-400">
                    {(
                      [
                        "Carta de buena conducta",
                        "Historial académico",
                        "Diploma",
                        "Cédula",
                        "Otro",
                      ] as const
                    ).map((doc, i) => (
                      <div key={`${doc}-${i}`} className="flex items-center px-1.5 py-0.5">
                        <CheckCell
                          checked={
                            estudio.datosAcademicos.documentoComprobatorio === doc
                          }
                        />
                        <span className="flex-1 text-center">{doc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="italic text-[#333]">
                    ¿Sí es otro, que documento presento?
                  </div>
                  <div className="border-b border-gray-500 min-h-[18px] font-semibold px-1">
                    {estudio.datosAcademicos.documentoOtroCual}
                  </div>
                </div>

                <div className="pl-10">
                  <div className="bg-[#6D6E71] text-white font-bold grid grid-cols-12 py-1 text-center">
                    <span className="col-span-9">Documento Presentado</span>
                    <span className="col-span-3 grid grid-cols-2">
                      <span>Si</span>
                      <span>No</span>
                    </span>
                  </div>
                  <div className="border border-gray-400 divide-y divide-gray-400">
                    <div className="grid grid-cols-12 items-center py-1.5">
                      <span className="col-span-9 text-center">Original</span>
                      <div className="col-span-3 grid grid-cols-2 px-1">
                        <CheckCell
                          checked={estudio.datosAcademicos.presentoOriginal === "Si"}
                        />
                        <CheckCell
                          checked={estudio.datosAcademicos.presentoOriginal === "No"}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-12 items-center py-1.5">
                      <span className="col-span-9 text-center">Copia</span>
                      <div className="col-span-3 grid grid-cols-2 px-1">
                        <CheckCell
                          checked={estudio.datosAcademicos.presentoCopia === "Si"}
                        />
                        <CheckCell
                          checked={estudio.datosAcademicos.presentoCopia === "No"}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <SectionBanner title="3. Referencias" />

          <h3 className="font-bold text-center text-[12px] my-2">
            3.1 Referencias laborales
          </h3>

          <BloqueReferenciaLaboral
            numero={1}
            refLab={estudio.referenciasLaborales[0]}
            part="top"
          />
        </div>
        <PageFooter />
      </PageWrapper>

      {/* =====================================================================
          PÁGINA 6: EMPRESA 1 (PARTE 2) + EMPRESA 2 (PARTE 1)
      ===================================================================== */}
      <PageWrapper pageNumber={6}>
        <div className="px-10 pt-6 flex flex-col flex-1 justify-between">
          <BloqueReferenciaLaboral
            numero={1}
            refLab={estudio.referenciasLaborales[0]}
            part="bottom"
          />

          <div className="my-1" />

          <BloqueReferenciaLaboral
            numero={2}
            refLab={estudio.referenciasLaborales[1]}
            part="top"
          />

          {/* Causa de separación de Empresa 2 al final de pág 6 igual que en el PDF */}
          <div className="grid grid-cols-2 gap-6 text-[10px]">
            <div>
              <div className="bg-[#6D6E71] text-white font-bold text-center py-1">
                Causa de la separación
              </div>
              <div className="border border-gray-400 divide-y divide-gray-400">
                {(
                  [
                    "Renuncia voluntaria",
                    "Termino de contrato",
                    "Abandono de trabajo",
                    "Termino de proyecto",
                  ] as const
                ).map((c) => (
                  <div key={c} className="flex items-center px-2 py-0.5">
                    <CheckCell
                      checked={estudio.referenciasLaborales[1].causaSeparacion === c}
                    />
                    <span className="flex-1 text-center">{c}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="bg-[#6D6E71] text-white font-bold text-center py-1">
                Decisión de la empresa:
              </div>
              <div className="border border-gray-400 divide-y divide-gray-400">
                {(
                  [
                    "Falta de honestidad",
                    "Robo",
                    "Faltas injustificadas",
                    "Otra",
                  ] as const
                ).map((d) => (
                  <div key={d} className="flex items-center px-2 py-0.5">
                    <CheckCell
                      checked={estudio.referenciasLaborales[1].decisionEmpresa === d}
                    />
                    <span className="flex-1 text-center">{d}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <PageFooter />
      </PageWrapper>

      {/* =====================================================================
          PÁGINA 7: EMPRESA 2 (CIERRE) + EMPRESA 3 (COMPLETA)
      ===================================================================== */}
      <PageWrapper pageNumber={7}>
        <div className="px-10 pt-6 flex flex-col flex-1">
          {/* Cierre de Empresa 2 */}
          <div className="text-[10.5px] mb-4">
            <div className="grid grid-cols-12 gap-6 items-start mb-2">
              <div className="col-span-6">
                <div className="flex justify-end pr-1">
                  <div className="bg-[#6D6E71] text-white font-bold text-[10px] grid grid-cols-2 w-16 text-center py-0.5">
                    <span>Si</span>
                    <span>No</span>
                  </div>
                </div>
                <div className="border border-gray-400 divide-y divide-gray-400">
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="text-center flex-1 text-[10px]">
                      Contrataría nuevamente al candidato
                    </span>
                    <div className="grid grid-cols-2 w-16 gap-1">
                      <CheckCell
                        checked={
                          estudio.referenciasLaborales[1].contratariaNuevamente === "Si"
                        }
                      />
                      <CheckCell
                        checked={
                          estudio.referenciasLaborales[1].contratariaNuevamente === "No"
                        }
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="text-center flex-1 text-[10px]">
                      Recomienda su contratación
                    </span>
                    <div className="grid grid-cols-2 w-16 gap-1">
                      <CheckCell
                        checked={
                          estudio.referenciasLaborales[1].recomiendaContratacion === "Si"
                        }
                      />
                      <CheckCell
                        checked={
                          estudio.referenciasLaborales[1].recomiendaContratacion === "No"
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-span-6">
                <div className="text-[#333] font-medium mb-1">Observaciones:</div>
                <div className="border-b border-gray-500 min-h-[42px] text-[10px] px-1">
                  {estudio.referenciasLaborales[1].observaciones}
                </div>
              </div>
            </div>

            <div>
              <div className="font-bold text-[#333] mb-1">Proporcionó información:</div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-[#333] text-[10px]">Nombre:</div>
                  <div className="border-b border-gray-500 min-h-[16px] font-semibold px-1">
                    {estudio.referenciasLaborales[1].proporcionoNombre}
                  </div>
                </div>
                <div>
                  <div className="text-[#333] text-[10px]">Puesto:</div>
                  <div className="border-b border-gray-500 min-h-[16px] font-semibold px-1">
                    {estudio.referenciasLaborales[1].proporcionoPuesto}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Empresa 3 Completa */}
          <BloqueReferenciaLaboral
            numero={3}
            refLab={estudio.referenciasLaborales[2]}
            part="full"
          />
        </div>
        <PageFooter />
      </PageWrapper>

      {/* =====================================================================
          PÁGINA 8: 3.2 REFERENCIA VECINAL + 3.3 REFERENCIAS PERSONALES
      ===================================================================== */}
      <PageWrapper pageNumber={8}>
        <div className="px-10 pt-8 flex flex-col flex-1">
          <h3 className="font-bold text-center text-[12px] mb-3">
            3.2 Referencia vecinal
          </h3>

          {/* Tabla Vecino 1 y Vecino 2 */}
          <div className="text-[10.5px] mb-4">
            <div className="grid grid-cols-12">
              <div className="col-span-2" />
              <div className="col-span-5 bg-[#6D6E71] text-white font-bold text-center py-1">
                Vecino 1
              </div>
              <div className="col-span-5 bg-[#6D6E71] text-white font-bold text-center py-1 border-l border-gray-300">
                Vecino 2
              </div>
            </div>
            <div className="border border-gray-400 divide-y divide-gray-400">
              {[
                { label: "Nombre", key: "nombre", h: "min-h-[28px]" },
                {
                  label: "Tiempo de conocerlo",
                  key: "tiempoConocerlo",
                  h: "min-h-[34px]",
                },
                {
                  label: "Opinión de su familia",
                  key: "opinionFamilia",
                  h: "min-h-[54px]",
                },
                {
                  label: "Comentarios adicionales",
                  key: "comentariosAdicionales",
                  h: "min-h-[64px]",
                },
              ].map((row) => (
                <div key={row.key} className={`grid grid-cols-12 ${row.h}`}>
                  <div className="col-span-2 flex items-center justify-center text-center p-2 border-r border-gray-400 font-medium">
                    {row.label}
                  </div>
                  <div className="col-span-5 p-2 border-r border-gray-400 flex items-center">
                    {
                      estudio.referenciasVecinales[0][
                        row.key as keyof typeof estudio.referenciasVecinales[0]
                      ]
                    }
                  </div>
                  <div className="col-span-5 p-2 flex items-center">
                    {
                      estudio.referenciasVecinales[1][
                        row.key as keyof typeof estudio.referenciasVecinales[1]
                      ]
                    }
                  </div>
                </div>
              ))}
            </div>

            {/* Recomienda contratación Vecino 1 y 2 */}
            <div className="grid grid-cols-12 mt-3">
              <div className="col-span-2" />
              <div className="col-span-5 pr-4">
                <div className="flex justify-end">
                  <div className="bg-[#6D6E71] text-white font-bold grid grid-cols-2 w-16 text-center py-0.5 text-[10px]">
                    <span>Si</span>
                    <span>No</span>
                  </div>
                </div>
                <div className="border border-gray-400 flex items-center justify-between px-3 py-1.5">
                  <span className="text-center flex-1">
                    ¿Recomienda su contratación?
                  </span>
                  <div className="grid grid-cols-2 w-16 gap-1">
                    <CheckCell
                      checked={
                        estudio.referenciasVecinales[0].recomiendaContratacion === "Si"
                      }
                    />
                    <CheckCell
                      checked={
                        estudio.referenciasVecinales[0].recomiendaContratacion === "No"
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="col-span-5 pl-4">
                <div className="flex justify-end">
                  <div className="bg-[#6D6E71] text-white font-bold grid grid-cols-2 w-16 text-center py-0.5 text-[10px]">
                    <span>Si</span>
                    <span>No</span>
                  </div>
                </div>
                <div className="border border-gray-400 flex items-center justify-between px-3 py-1.5">
                  <span className="text-center flex-1">
                    ¿Recomienda su contratación?
                  </span>
                  <div className="grid grid-cols-2 w-16 gap-1">
                    <CheckCell
                      checked={
                        estudio.referenciasVecinales[1].recomiendaContratacion === "Si"
                      }
                    />
                    <CheckCell
                      checked={
                        estudio.referenciasVecinales[1].recomiendaContratacion === "No"
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <h3 className="font-bold text-center text-[12px] my-3">
            3.3 Referencias Personales
          </h3>

          {/* Tabla Conocido 1, 2 y 3 */}
          <div className="text-[10.5px]">
            <div className="grid grid-cols-12">
              <div className="col-span-3" />
              <div className="col-span-3 bg-[#6D6E71] text-white font-bold text-center py-1">
                Conocido 1
              </div>
              <div className="col-span-3 bg-[#6D6E71] text-white font-bold text-center py-1 border-l border-gray-300">
                Conocido 2
              </div>
              <div className="col-span-3 bg-[#6D6E71] text-white font-bold text-center py-1 border-l border-gray-300">
                Conocido 3
              </div>
            </div>

            <div className="border border-gray-400 divide-y divide-gray-400">
              {[
                { label: "Nombre", key: "nombre", h: "min-h-[38px]" },
                { label: "Teléfono", key: "telefono", h: "min-h-[26px]" },
                { label: "Dirección", key: "direccion", h: "min-h-[50px]" },
                {
                  label: "¿Hace cuánto tiempo conoce al candidato?",
                  key: "tiempoConocerlo",
                  h: "min-h-[48px]",
                },
                {
                  label: "¿En qué empresas ha laborado el candidato?",
                  key: "empresasHaLaborado",
                  h: "min-h-[48px]",
                },
                {
                  label: "¿Recomienda la contratación del candidato?",
                  key: "recomiendaContratacion",
                  h: "min-h-[48px]",
                },
                {
                  label: "¿Qué opinión tiene del candidato?",
                  key: "opinionCandidato",
                  h: "min-h-[54px]",
                },
              ].map((row) => (
                <div key={row.key} className={`grid grid-cols-12 ${row.h}`}>
                  <div className="col-span-3 flex items-center justify-center text-center p-2 border-r border-gray-400 font-medium">
                    {row.label}
                  </div>
                  {[0, 1, 2].map((idx) => (
                    <div
                      key={idx}
                      className={`col-span-3 p-2 flex items-center justify-center text-center ${
                        idx < 2 ? "border-r border-gray-400" : ""
                      }`}
                    >
                      {
                        estudio.referenciasPersonales[idx][
                          row.key as keyof typeof estudio.referenciasPersonales[0]
                        ]
                      }
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
        <PageFooter />
      </PageWrapper>

      {/* =====================================================================
          PÁGINA 9: 4. ESTRUCTURA FAMILIAR Y 5. ECONOMÍA DEL HOGAR
      ===================================================================== */}
      <PageWrapper pageNumber={9}>
        <div className="px-10 pt-5 flex flex-col flex-1">
          <SectionBanner title="4. Estructura familiar" />

          {/* Tabla de 10 filas de estructura familiar */}
          <div className="mt-1 mb-3 text-[10px]">
            <div className="grid grid-cols-12 bg-[#6D6E71] text-white font-bold py-1.5 px-2 text-center items-center">
              <span className="col-span-2">Parentesco</span>
              <span className="col-span-3">Nombre</span>
              <span className="col-span-1">Edad</span>
              <span className="col-span-2">Ocupación</span>
              <span className="col-span-2">Empresa</span>
              <span className="col-span-2 leading-tight">
                Mismo
                <br />
                domicilio
              </span>
            </div>
            <div className="border border-gray-400 divide-y divide-gray-400">
              {Array.from({ length: 10 }).map((_, idx) => {
                const fam = estudio.estructuraFamiliar[idx] || {
                  parentesco: "",
                  nombre: "",
                  edad: "",
                  ocupacion: "",
                  empresa: "",
                  mismoDomicilio: "",
                };
                return (
                  <div
                    key={idx}
                    className="grid grid-cols-12 divide-x divide-gray-400 h-[23px] items-center text-center"
                  >
                    <span className="col-span-2 px-1 truncate">{fam.parentesco}</span>
                    <span className="col-span-3 px-1.5 text-left truncate font-medium">
                      {fam.nombre}
                    </span>
                    <span className="col-span-1 px-1">{fam.edad}</span>
                    <span className="col-span-2 px-1 truncate">{fam.ocupacion}</span>
                    <span className="col-span-2 px-1 truncate">{fam.empresa}</span>
                    <span className="col-span-2 px-1">{fam.mismoDomicilio}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <SectionBanner title="5. Economía del hogar" />

          {/* Tabla paralela Egresos vs Ingresos */}
          <div className="mt-1 text-[10px]">
            <div className="grid grid-cols-12 bg-[#6D6E71] text-white font-bold py-1 text-center">
              <div className="col-span-6">Egresos mensuales</div>
              <div className="col-span-6">Ingresos y aportaciones</div>
            </div>

            <div className="grid grid-cols-12 border-x border-b border-gray-400 bg-white font-bold text-[#E31E24] text-center py-1 items-center">
              <div className="col-span-4 border-r border-gray-400">Concepto</div>
              <div className="col-span-2 border-r border-gray-400">Monto mensual</div>
              <div className="col-span-4 border-r border-gray-400">
                ¿Parentesco de quién aporta?
              </div>
              <div className="col-span-2 leading-tight">
                Monto
                <br />
                mensual
              </div>
            </div>

            <div className="border-x border-gray-400 divide-y divide-gray-400">
              {filasEgresos.map((fila, idx) => {
                const montoEgreso = estudio.egresosMensuales[fila.key] || 0;
                const ingresoFila = estudio.ingresosHogar[idx] || {
                  parentesco: "",
                  monto: 0,
                };
                return (
                  <div
                    key={fila.key}
                    className="grid grid-cols-12 items-center h-[22px]"
                  >
                    <div className="col-span-4 text-center border-r border-gray-400 h-full flex items-center justify-center">
                      {fila.label}
                    </div>
                    <div className="col-span-2 px-2 border-r border-[#E31E24] border-dashed h-full flex items-center justify-between font-medium">
                      <span>$</span>
                      <span>
                        {montoEgreso > 0
                          ? montoEgreso.toLocaleString("es-MX", {
                              minimumFractionDigits: 2,
                            })
                          : "0.00"}
                      </span>
                    </div>
                    <div className="col-span-4 px-2 border-r border-gray-400 h-full flex items-center justify-center font-medium">
                      {ingresoFila.parentesco}
                    </div>
                    <div className="col-span-2 px-2 h-full flex items-center justify-between font-medium">
                      <span>$</span>
                      <span>
                        {ingresoFila.monto > 0
                          ? Number(ingresoFila.monto).toLocaleString("es-MX", {
                              minimumFractionDigits: 2,
                            })
                          : "0.00"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Barra de Totales */}
            <div className="grid grid-cols-12 bg-[#6D6E71] text-white font-bold py-1 px-2 items-center">
              <div className="col-span-4 text-center">Total de gastos</div>
              <div className="col-span-2 text-right pr-2">
                $
                {totalEgresos.toLocaleString("es-MX", {
                  minimumFractionDigits: 2,
                })}
              </div>
              <div className="col-span-4 text-center border-l border-white/40">
                Total de ingresos
              </div>
              <div className="col-span-2 text-right pr-2">
                $
                {totalIngresos.toLocaleString("es-MX", {
                  minimumFractionDigits: 2,
                })}
              </div>
            </div>
          </div>
        </div>
        <PageFooter />
      </PageWrapper>

      {/* =====================================================================
          PÁGINA 10: 6. DOCUMENTACIÓN PRESENTADA
      ===================================================================== */}
      <PageWrapper pageNumber={10}>
        <div className="px-10 pt-5 flex flex-col flex-1">
          <SectionBanner title="6. Documentación presentada" />

          <div className="mt-3 text-[10px]">
            {/* Encabezados */}
            <div className="grid grid-cols-12 items-end mb-1">
              <div className="col-span-6" />
              <div className="col-span-1 bg-[#6D6E71] text-white font-bold grid grid-cols-2 text-center py-1">
                <span>Si</span>
                <span>No</span>
              </div>
              <div className="col-span-5 text-center font-bold text-[#333] pb-1">
                Datos del documento (folios)
              </div>
            </div>

            {/* Documentos 1 al 12 */}
            <div className="space-y-0">
              {estudio.documentosPresentados.slice(0, 12).map((doc) => (
                <div key={doc.id} className="grid grid-cols-12 items-center">
                  <div className="col-span-6 border border-gray-400 py-1 px-2 text-center">
                    {doc.nombre}
                  </div>
                  <div className="col-span-1 border-y border-r border-gray-400 grid grid-cols-2 py-0.5">
                    <CheckCell checked={doc.presento === "Si"} />
                    <CheckCell checked={doc.presento === "No"} />
                  </div>
                  <div className="col-span-5 pl-4">
                    <div className="border-b border-gray-500 min-h-[20px] px-1 font-medium truncate">
                      {doc.folioDatos}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Sub-tabla A) Agua, B) Luz, C) Teléfono, D) Otro */}
            <div className="grid grid-cols-12 my-3">
              <div className="col-span-2" />
              <div className="col-span-3 border border-gray-400 divide-y divide-gray-400">
                {[
                  { label: "A) Recibo de agua", val: "Agua" },
                  { label: "B) Recibo de luz", val: "Luz" },
                  { label: "C) Recibo de teléfono", val: "Teléfono" },
                  { label: "D) Otro", val: "Otro" },
                ].map((sub) => (
                  <div
                    key={sub.val}
                    className="flex items-center justify-between px-2 py-1"
                  >
                    <span className="flex-1 text-center">{sub.label}</span>
                    <CheckCell
                      checked={estudio.comprobanteDomicilioTipo === sub.val}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Documentos 13 al 17 */}
            <div className="space-y-0">
              {estudio.documentosPresentados.slice(12, 17).map((doc) => (
                <div key={doc.id} className="grid grid-cols-12 items-center">
                  <div className="col-span-6 border border-gray-400 py-1.5 px-2 text-center leading-tight">
                    {doc.nombre}
                  </div>
                  <div className="col-span-1 border-y border-r border-gray-400 grid grid-cols-2 py-1">
                    <CheckCell checked={doc.presento === "Si"} />
                    <CheckCell checked={doc.presento === "No"} />
                  </div>
                  <div className="col-span-5 pl-4">
                    <div className="border-b border-gray-500 min-h-[20px] px-1 font-medium truncate">
                      {doc.folioDatos}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <PageFooter />
      </PageWrapper>

      {/* =====================================================================
          PÁGINA 11: ANEXOS
      ===================================================================== */}
      <PageWrapper pageNumber={11}>
        <div className="px-10 pt-8 flex flex-col flex-1">
          <h2 className="font-bold text-center text-[13px] mb-2">Anexos</h2>
          <div className="border border-gray-400 flex-1 p-4 flex flex-col gap-4 overflow-hidden">
            {estudio.anexosTexto && (
              <p className="text-[11px] text-gray-800 whitespace-pre-line">
                {estudio.anexosTexto}
              </p>
            )}

            {estudio.anexosImagenes.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 flex-1 content-start">
                {estudio.anexosImagenes.map((img) => (
                  <div
                    key={img.id}
                    className="border border-gray-300 rounded-lg p-2 flex flex-col items-center bg-gray-50"
                  >
                    <div className="h-[220px] w-full flex items-center justify-center overflow-hidden">
                      <img
                        src={img.dataUrl}
                        alt={img.titulo}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    {img.titulo && (
                      <span className="text-[10px] font-semibold text-gray-700 mt-1">
                        {img.titulo}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              !estudio.anexosTexto && (
                <div className="flex-1 flex items-center justify-center text-gray-300 text-xs">
                  Espacio para anexos fotográficos y documentales
                </div>
              )
            )}
          </div>
        </div>
        <PageFooter />
      </PageWrapper>

      {/* =====================================================================
          PÁGINA 12: AVISO DE PRIVACIDAD Y FIRMAS OFICIALES
      ===================================================================== */}
      <PageWrapper pageNumber={12}>
        <div className="px-10 pt-8 flex flex-col flex-1 text-[#1E1E1E]">
          {/* Cabecera idéntica al documento oficial */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-[26px] font-extrabold tracking-tight text-black leading-none">
                  Aviso de
                </span>
                <span className="text-[26px] font-extrabold tracking-tight text-black leading-none">
                  privacidad
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl border-2 border-[#E31E24] flex items-center justify-center p-2">
                <svg
                  viewBox="0 0 24 24"
                  className="w-full h-full text-[#E31E24]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </div>
            </div>
            <LogoGestionRH className="h-12" />
          </div>

          {/* Banner Rojo Oficial */}
          <SectionBanner title="Reclutamiento & Selección GRH" />

          {/* Línea de Lugar y Fecha */}
          <div className="text-right text-[11px] text-[#222] my-3 font-normal">
            <span className="font-semibold underline decoration-gray-400 underline-offset-4 px-2">
              {estudio.avisoPrivacidad?.lugar ||
                estudio.datosContacto.delegacionMunicipio ||
                "Metepec, Estado de México"}
            </span>
            {" a "}
            <span className="font-semibold underline decoration-gray-400 underline-offset-4 px-2">
              {estudio.avisoPrivacidad?.dia ||
                new Date().getDate().toString()}
            </span>
            {" de "}
            <span className="font-semibold underline decoration-gray-400 underline-offset-4 px-2">
              {estudio.avisoPrivacidad?.mes ||
                new Intl.DateTimeFormat("es-MX", { month: "long" }).format(
                  new Date()
                )}
            </span>
            {" de "}
            <span className="font-semibold underline decoration-gray-400 underline-offset-4 px-2">
              {estudio.avisoPrivacidad?.anio ||
                new Date().getFullYear().toString()}
            </span>
          </div>

          {/* Párrafo de Declaración Bajo Protesta */}
          <p className="text-[11px] leading-relaxed text-justify mb-4 text-[#222]">
            Yo{" "}
            <span className="font-bold underline decoration-gray-400 underline-offset-4 px-1 text-black">
              {estudio.avisoPrivacidad?.candidato ||
                estudio.candidatoNombrePortada ||
                estudio.datosGenerales.nombre ||
                "___________________________________"}
            </span>
            , manifiesto bajo protesta de decir verdad que la información
            proporcionada durante el estudio socioeconómico realizado por el
            representante de Gestión RH es verídica, completa y comprobable, y
            que podrá ser corroborada en cualquier momento para fines del
            proceso de reclutamiento y selección de personal de la empresa{" "}
            <span className="font-bold underline decoration-gray-400 underline-offset-4 px-1 text-black">
              {estudio.avisoPrivacidad?.empresa ||
                estudio.empresaSolicitante ||
                "___________________________________"}
            </span>
            , para el puesto de:{" "}
            <span className="font-bold underline decoration-gray-400 underline-offset-4 px-1 text-black">
              {estudio.avisoPrivacidad?.puesto ||
                estudio.puestoSolicitado ||
                "___________________________________"}
            </span>
            .
          </p>

          {/* FIRMA 1: Conformidad y Veracidad */}
          <div className="my-3 flex flex-col items-center justify-center">
            <div className="w-[360px] h-16 flex items-end justify-center">
              {estudio.avisoPrivacidad?.firmaConformidadUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={estudio.avisoPrivacidad.firmaConformidadUrl}
                  alt="Firma de conformidad y veracidad"
                  className="max-h-16 max-w-full object-contain mb-1"
                />
              ) : (
                <div className="h-10" />
              )}
            </div>
            <div className="w-[360px] border-b border-gray-600 mb-1" />
            <span className="text-[10.5px] text-[#333] font-normal text-center">
              Firma de conformidad y veracidad de la información
            </span>
          </div>

          {/* Texto Legal del Aviso de Privacidad */}
          <div className="text-[9.5px] leading-snug text-[#2E2E2E] space-y-2 text-justify my-1">
            <p>
              Gestión RH, con domicilio en Calle Morelos No. 12 Oriente, Colonia
              Pilares, Metepec, Estado de México, C.P. 52176, es responsable del
              uso y protección de los datos personales que recabe, en
              cumplimiento de la Ley Federal de Protección de Datos Personales en
              Posesión de los Particulares.
            </p>

            <div>
              <div className="font-bold text-black mb-0.5">
                Finalidad del tratamiento de datos
              </div>
              <p>
                Los datos personales recabados serán utilizados exclusivamente
                para:
              </p>
              <ul className="list-disc ml-5 space-y-0.5 mt-0.5">
                <li>Integrar el reporte del estudio socioeconómico.</li>
                <li>
                  Evaluar el perfil del candidato dentro del proceso de
                  reclutamiento y selección.
                </li>
                <li>
                  Transferir dicho reporte a la empresa contratante para la cual
                  el titular participa en el proceso, como requisito para su
                  posible contratación.
                </li>
              </ul>
            </div>

            <div>
              <div className="font-bold text-black mb-0.5">
                Transferencia de datos
              </div>
              <p>
                Se informa que los datos personales serán transferidos
                únicamente a la empresa solicitante del proceso de selección,
                sin que se requiera consentimiento adicional, conforme a lo
                previsto por la legislación aplicable.
              </p>
            </div>

            <div>
              <div className="font-bold text-black mb-0.5">Derechos ARCO</div>
              <p>
                El titular podrá ejercer en cualquier momento sus derechos de
                Acceso, Rectificación, Cancelación u Oposición (ARCO), así como
                conocer los terceros con quienes se comparten sus datos y las
                condiciones del tratamiento, consultando el aviso de privacidad
                integral disponible en el domicilio antes señalado.
              </p>
            </div>

            <p className="pt-0.5">
              Los datos proporcionados durante la entrevista tienen como
              finalidad validar y verificar la información, y la documentación
              entregada será devuelta al finalizar la misma.
            </p>
          </div>

          {/* FIRMA 2: Conocimiento del Aviso de Privacidad */}
          <div className="my-3 flex flex-col items-center justify-center">
            <div className="w-[360px] h-16 flex items-end justify-center">
              {estudio.avisoPrivacidad?.firmaAvisoPrivacidadUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={estudio.avisoPrivacidad.firmaAvisoPrivacidadUrl}
                  alt="Firma aviso de privacidad"
                  className="max-h-16 max-w-full object-contain mb-1"
                />
              ) : (
                <div className="h-10" />
              )}
            </div>
            <div className="w-[360px] border-b border-gray-600 mb-1" />
            <span className="text-[10.5px] text-[#333] font-normal text-center">
              Conozco el aviso de privacidad de datos personales
            </span>
          </div>

          {/* Pie de página Oficial Rojo con QR */}
          <div className="w-full mt-auto mb-4 select-none shrink-0">
            <div className="bg-[#E31E24] rounded-2xl px-6 py-2.5 flex items-center justify-between text-white shadow-sm">
              <div className="flex flex-col">
                <span className="font-bold text-lg leading-tight tracking-tight">
                  Gestión rh
                </span>
                <span className="text-[9px] text-white/90">
                  www.gestionrh.com.mx
                </span>
              </div>

              <div className="flex flex-col gap-0.5 text-[9.5px]">
                <div className="flex items-center gap-2">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-3.5 h-3.5 text-white shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <span>contacto@gestionrh.com.mx</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-3.5 h-3.5 text-white shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <span>+52 55 1949 1693</span>
                </div>
              </div>

              <div className="bg-white p-1 rounded-xl shadow-inner">
                <QRCodeGestionRH className="w-11 h-11" />
              </div>
            </div>
          </div>
        </div>
      </PageWrapper>
    </div>
  );
}
