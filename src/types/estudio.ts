export type Dictamen = "ACEPTABLE" | "CON RESERVAS" | "NO ACEPTABLE";
export type EvaluacionNivel = "Bueno" | "Regular" | "Malo" | "";
export type SiNo = "Si" | "No" | "";

export type RolUsuario = "admin" | "evaluador";
export type EstadoUsuario = "activo" | "pendiente" | "rechazado";

export interface DatosBancariosUsuario {
  banco: string;
  numeroTarjeta: string;
  clabe: string;
}

export interface UsuarioSistema {
  id: string;
  nombre: string;
  email: string;
  password?: string;
  rol: RolUsuario;
  estado: EstadoUsuario;
  createdAt: string;
  updatedAt?: string;
  datosBancarios?: DatosBancariosUsuario;
  zonas?: string[];
}

export interface ReferenciaLaboral {
  empresa: string;
  giroEmpresarial: string;
  telefono: string;
  domicilio: string;
  fechaIngreso: string;
  fechaBaja: string;
  puestoSueldoInicial: string;
  puestoSueldoFinal: string;
  nombreJefeDirecto: string;
  sindicato: string;
  manejoInfoConfidencial: SiNo;
  equipoTecnologico: SiNo;
  desempeno: EvaluacionNivel;
  causaSeparacion: "Renuncia voluntaria" | "Termino de contrato" | "Abandono de trabajo" | "Termino de proyecto" | "";
  decisionEmpresa: "Falta de honestidad" | "Robo" | "Faltas injustificadas" | "Otra" | "";
  contratariaNuevamente: SiNo;
  recomiendaContratacion: SiNo;
  observaciones: string;
  proporcionoNombre: string;
  proporcionoPuesto: string;
}

export interface ReferenciaVecinal {
  nombre: string;
  tiempoConocerlo: string;
  opinionFamilia: string;
  comentariosAdicionales: string;
  recomiendaContratacion: SiNo;
}

export interface ReferenciaPersonal {
  nombre: string;
  telefono: string;
  direccion: string;
  tiempoConocerlo: string;
  empresasHaLaborado: string;
  recomiendaContratacion: SiNo;
  opinionCandidato: string;
}

export interface MiembroFamiliar {
  parentesco: string;
  nombre: string;
  edad: string;
  ocupacion: string;
  empresa: string;
  mismoDomicilio: string;
}

export interface IngresoHogar {
  parentesco: string;
  monto: number;
}

export interface DocumentoItem {
  id: number;
  nombre: string;
  presento: SiNo;
  folioDatos: string;
  // Archivo adjunto (PDF, foto, comprobante)
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
}

export interface AnexoImagen {
  id: string;
  titulo: string;
  dataUrl: string;
}

export interface EstudioSocioeconomico {
  id: string;
  createdAt: string;
  updatedAt: string;

  // Control de estado de guardado
  isDraft?: boolean;

  // Metadata interna para Dashboard / Equipo (NO se imprime en el PDF oficial)
  evaluadorNombre?: string;

  // Página 1: Carátula y Resumen
  fechaElaboracion: string;
  folio: string;
  candidatoNombrePortada: string;
  empresaSolicitante?: string;
  fechaRealizacion: string;
  puestoSolicitado: string;
  dictamen: Dictamen;
  reporteEntrevista: string;
  investigacionDomiciliaria: string;
  resumenReferenciasVecinales: string;
  resumenReferenciasLaborales: string;

  // Página 2 y 3 (sup): 1. Reconocimiento y ubicación del candidato
  fotoInterior: string; // Base64 o URL
  evaluacionPersonal: {
    aspectoFisico: EvaluacionNivel;
    limpieza: EvaluacionNivel;
    cabello: EvaluacionNivel;
    vestimenta: EvaluacionNivel;
    disposicion: EvaluacionNivel;
    puntualidad: EvaluacionNivel;
    interes: EvaluacionNivel;
    lenguaje: EvaluacionNivel;
    comportamiento: EvaluacionNivel;
  };
  comentariosPersonales: string;

  fotoExterior: string; // Base64 o URL
  viviendaTenencia: "Propia" | "Prestada" | "Rentada" | "Otro" | "";
  viviendaTenenciaCual: string;
  viviendaValorAprox: string;
  viviendaTiempoViviendo: string;
  viviendaMaterial: "Concreto" | "Madera" | "Lamina" | "Adobe" | "Cartón" | "Otro" | "";
  viviendaMaterialCual: string;
  viviendaTipo: "Residencial" | "Media Residencial" | "Interés Social" | "Vecindad" | "Rural" | "";
  viviendaColor: string;

  fotoZona: string; // Base64 o URL
  espaciosCantidad: {
    recamaras: string;
    banos: string;
    sala: string;
    cocina: string;
    comedor: string;
    patioPosterior: string;
    patioEstacionamiento: string;
  };
  serviciosZona: {
    aguaPotable: SiNo;
    drenaje: SiNo;
    energiaElectrica: SiNo;
    alumbradoPublico: SiNo;
    pavimentacion: SiNo;
    vigilancia: SiNo;
    televisionPaga: SiNo;
    telefono: SiNo;
    internet: SiNo;
    transportePublico: SiNo;
    seObservaGrafiti: SiNo;
    seObservaVandalismo: SiNo;
  };

  // Página 3 (inf), 4 y 5 (sup): 2. Cédula del candidato
  datosGenerales: {
    nombre: string;
    edad: string;
    sexo: "Femenino" | "Masculino" | "";
    fechaNacimientoDia: string;
    fechaNacimientoMes: string;
    fechaNacimientoAnio: string;
    lugarNacimiento: string;
    lugarFechaMatrimonio: string;
    numeroHijosEdad: string;
    ocupacionActual: string;
    estadoCivil: "Soltero (a)" | "Divorciado (a)" | "Casado (a)" | "Unión Libre" | "Viudo (a)" | "";
    peso: string;
    saludVisual: string;
    estatura: string;
    saludFisica: string;
    tipoSangre: string;
  };
  datosContacto: {
    calleYNumero: string;
    delegacionMunicipio: string;
    estadoCiudad: string;
    entreCalles: string;
    telefonoCasa: string;
    telefonoRecados: string;
    telefonoCelular: string;
    correoElectronico: string;
  };
  saludHabitos: {
    embarazada: SiNo;
    tiempoEmbarazo: string;
    tatuajes: SiNo;
    tatuajesDetalle: string;
    practicaEjercicio: { respuesta: SiNo; comentarios: string };
    accidentes: { respuesta: SiNo; comentarios: string };
    accidentesHaceCuanto: { respuesta: SiNo; comentarios: string };
    accidentesSecuelas: { respuesta: SiNo; comentarios: string };
    intervencionesQuirurgicas: { respuesta: SiNo; comentarios: string };
    intervencionesSecuelas: { respuesta: SiNo; comentarios: string };
    sigueEnTratamiento: { respuesta: SiNo; comentarios: string };
    enfermedadHereditaria: { respuesta: SiNo; comentarios: string };
    tratamientoMedicoPsicologico: { respuesta: SiNo; comentarios: string };
    enfermedadesFrecuentes: { respuesta: SiNo; comentarios: string };
    alergias: { respuesta: SiNo; comentarios: string };
    fuma: { respuesta: SiNo; comentarios: string };
    bebidasAlcoholicas: { respuesta: SiNo; comentarios: string };
    consumeDrogas: { respuesta: SiNo; comentarios: string };
    institucionMedica: string;
  };
  datosAcademicos: {
    nivelMaximo: "Preescolar" | "Primaria" | "Secundaria" | "Preparatoria" | "Carrera técnica" | "Licenciatura" | "Maestría" | "Doctorado" | "";
    documentoComprobatorio: "Certificado" | "Constancia de estudios" | "Boleta" | "Título" | "Otro" | "Carta de buena conducta" | "Historial académico" | "Diploma" | "Cédula" | "";
    documentoOtroCual: string;
    area: string;
    escuelaInstitucion: string;
    periodoEscolar: string;
    presentoOriginal: SiNo;
    presentoCopia: SiNo;
  };

  // Página 5 (inf), 6, 7 y 8: 3. Referencias
  referenciasLaborales: [ReferenciaLaboral, ReferenciaLaboral, ReferenciaLaboral];
  referenciasVecinales: [ReferenciaVecinal, ReferenciaVecinal];
  referenciasPersonales: [ReferenciaPersonal, ReferenciaPersonal, ReferenciaPersonal];

  // Página 9: 4. Estructura familiar y 5. Economía del hogar
  estructuraFamiliar: MiembroFamiliar[]; // 10 filas
  egresosMensuales: {
    alimentos: number;
    transportePublico: number;
    gastosAuto: number;
    luz: number;
    gas: number;
    celular: number;
    telefonoCasa: number;
    cable: number;
    escuela: number;
    creditoBancario: number;
    creditoInfonavit: number;
    prestamoNomina: number;
    pensionAlimenticia: number;
    renta: number;
    ahorroMensual: number;
  };
  ingresosHogar: IngresoHogar[]; // 15 filas paralelas a la tabla

  // Página 10: 6. Documentación presentada
  documentosPresentados: DocumentoItem[];
  comprobanteDomicilioTipo: "Agua" | "Luz" | "Teléfono" | "Otro" | "";

  // Página 11: Anexos
  anexosTexto: string;
  anexosImagenes: AnexoImagen[];

  // Página 12: Aviso de Privacidad y Firmas
  avisoPrivacidad?: AvisoPrivacidad;
}

export interface AvisoPrivacidad {
  lugar?: string;
  dia?: string;
  mes?: string;
  anio?: string;
  candidato?: string;
  empresa?: string;
  puesto?: string;
  firmaConformidadUrl?: string; // Firma 1: conformidad y veracidad
  firmaAvisoPrivacidadUrl?: string; // Firma 2: aviso de privacidad
  fechaFirmaConformidad?: string;
  fechaFirmaAviso?: string;
}

export const DOCUMENTOS_CATALOGO: Array<{ id: number; nombre: string }> = [
  { id: 1, nombre: "1.- Acta de Nacimiento" },
  { id: 2, nombre: "2.- Certificado de Estudios" },
  { id: 3, nombre: "3.- Folio de Credencial de Elector" },
  { id: 4, nombre: "4.- Clave de elector Credencial de Elector" },
  { id: 5, nombre: "5.- Domicilio de Credencial de Elector" },
  { id: 6, nombre: "6.- Curp" },
  { id: 7, nombre: "7.- Pasaporte" },
  { id: 8, nombre: "8.- Carta de recomendación personal" },
  { id: 9, nombre: "9. Carta de recomendación laboral" },
  { id: 10, nombre: "10. Informe de carta de antecedentes no penales" },
  { id: 11, nombre: "11.- RFC con Homoclave" },
  { id: 12, nombre: "12.- Comprobante de domicilio reciente (anotar la dirección)" },
  { id: 13, nombre: "13.- Pensión Alimenticia, que tipo de documento (anotar número folio, monto)" },
  { id: 14, nombre: "14.- Alta del IMSS (credencial del IMSS, número de afiliación u hoja de asignación de seguridad social)" },
  { id: 15, nombre: "15.- Aviso de crédito INFONAVIT" },
  { id: 16, nombre: "16.- Reporte de semanas cotizadas al IMSS" },
  { id: 17, nombre: "17.- Recibo de nómina" },
];

export function createEmptyReferenciaLaboral(): ReferenciaLaboral {
  return {
    empresa: "",
    giroEmpresarial: "",
    telefono: "",
    domicilio: "",
    fechaIngreso: "",
    fechaBaja: "",
    puestoSueldoInicial: "",
    puestoSueldoFinal: "",
    nombreJefeDirecto: "",
    sindicato: "",
    manejoInfoConfidencial: "",
    equipoTecnologico: "",
    desempeno: "",
    causaSeparacion: "",
    decisionEmpresa: "",
    contratariaNuevamente: "",
    recomiendaContratacion: "",
    observaciones: "",
    proporcionoNombre: "",
    proporcionoPuesto: "",
  };
}

export function createEmptyReferenciaVecinal(): ReferenciaVecinal {
  return {
    nombre: "",
    tiempoConocerlo: "",
    opinionFamilia: "",
    comentariosAdicionales: "",
    recomiendaContratacion: "",
  };
}

export function createEmptyReferenciaPersonal(): ReferenciaPersonal {
  return {
    nombre: "",
    telefono: "",
    direccion: "",
    tiempoConocerlo: "",
    empresasHaLaborado: "",
    recomiendaContratacion: "",
    opinionCandidato: "",
  };
}

export function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID();
    } catch {
      // Fallback
    }
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function createEmptyEstudio(id?: string, evaluadorNombre?: string): EstudioSocioeconomico {
  const now = new Date().toISOString();
  const folioNum = Math.floor(1000 + Math.random() * 9000);
  return {
    id: id || generateUUID(),
    createdAt: now,
    updatedAt: now,
    isDraft: true,
    evaluadorNombre: evaluadorNombre || "",
    fechaElaboracion: new Date().toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
    folio: `ESE-2026-${folioNum}`,
    candidatoNombrePortada: "",
    empresaSolicitante: "",
    fechaRealizacion: new Date().toISOString().split("T")[0],
    puestoSolicitado: "",
    dictamen: "ACEPTABLE",
    reporteEntrevista: "",
    investigacionDomiciliaria: "",
    resumenReferenciasVecinales: "",
    resumenReferenciasLaborales: "",
    fotoInterior: "",
    evaluacionPersonal: {
      aspectoFisico: "Bueno",
      limpieza: "Bueno",
      cabello: "Bueno",
      vestimenta: "Bueno",
      disposicion: "Bueno",
      puntualidad: "Bueno",
      interes: "Bueno",
      lenguaje: "Bueno",
      comportamiento: "Bueno",
    },
    comentariosPersonales: "",
    fotoExterior: "",
    viviendaTenencia: "Propia",
    viviendaTenenciaCual: "",
    viviendaValorAprox: "",
    viviendaTiempoViviendo: "",
    viviendaMaterial: "Concreto",
    viviendaMaterialCual: "",
    viviendaTipo: "Media Residencial",
    viviendaColor: "",
    fotoZona: "",
    espaciosCantidad: {
      recamaras: "2",
      banos: "1",
      sala: "1",
      cocina: "1",
      comedor: "1",
      patioPosterior: "1",
      patioEstacionamiento: "1",
    },
    serviciosZona: {
      aguaPotable: "Si",
      drenaje: "Si",
      energiaElectrica: "Si",
      alumbradoPublico: "Si",
      pavimentacion: "Si",
      vigilancia: "No",
      televisionPaga: "Si",
      telefono: "Si",
      internet: "Si",
      transportePublico: "Si",
      seObservaGrafiti: "No",
      seObservaVandalismo: "No",
    },
    datosGenerales: {
      nombre: "",
      edad: "",
      sexo: "",
      fechaNacimientoDia: "",
      fechaNacimientoMes: "",
      fechaNacimientoAnio: "",
      lugarNacimiento: "",
      lugarFechaMatrimonio: "",
      numeroHijosEdad: "",
      ocupacionActual: "",
      estadoCivil: "Soltero (a)",
      peso: "",
      saludVisual: "Buena",
      estatura: "",
      saludFisica: "Buena",
      tipoSangre: "",
    },
    datosContacto: {
      calleYNumero: "",
      delegacionMunicipio: "",
      estadoCiudad: "Estado de México",
      entreCalles: "",
      telefonoCasa: "",
      telefonoRecados: "",
      telefonoCelular: "",
      correoElectronico: "",
    },
    saludHabitos: {
      embarazada: "No",
      tiempoEmbarazo: "",
      tatuajes: "No",
      tatuajesDetalle: "",
      practicaEjercicio: { respuesta: "Si", comentarios: "" },
      accidentes: { respuesta: "No", comentarios: "" },
      accidentesHaceCuanto: { respuesta: "No", comentarios: "" },
      accidentesSecuelas: { respuesta: "No", comentarios: "" },
      intervencionesQuirurgicas: { respuesta: "No", comentarios: "" },
      intervencionesSecuelas: { respuesta: "No", comentarios: "" },
      sigueEnTratamiento: { respuesta: "No", comentarios: "" },
      enfermedadHereditaria: { respuesta: "No", comentarios: "" },
      tratamientoMedicoPsicologico: { respuesta: "No", comentarios: "" },
      enfermedadesFrecuentes: { respuesta: "No", comentarios: "Ninguna" },
      alergias: { respuesta: "No", comentarios: "Ninguna" },
      fuma: { respuesta: "No", comentarios: "" },
      bebidasAlcoholicas: { respuesta: "No", comentarios: "Socialmente / Ocasional" },
      consumeDrogas: { respuesta: "No", comentarios: "" },
      institucionMedica: "IMSS",
    },
    datosAcademicos: {
      nivelMaximo: "Licenciatura",
      documentoComprobatorio: "Título",
      documentoOtroCual: "",
      area: "",
      escuelaInstitucion: "",
      periodoEscolar: "",
      presentoOriginal: "Si",
      presentoCopia: "Si",
    },
    referenciasLaborales: [
      createEmptyReferenciaLaboral(),
      createEmptyReferenciaLaboral(),
      createEmptyReferenciaLaboral(),
    ],
    referenciasVecinales: [
      createEmptyReferenciaVecinal(),
      createEmptyReferenciaVecinal(),
    ],
    referenciasPersonales: [
      createEmptyReferenciaPersonal(),
      createEmptyReferenciaPersonal(),
      createEmptyReferenciaPersonal(),
    ],
    estructuraFamiliar: Array.from({ length: 10 }, () => ({
      parentesco: "",
      nombre: "",
      edad: "",
      ocupacion: "",
      empresa: "",
      mismoDomicilio: "",
    })),
    egresosMensuales: {
      alimentos: 0,
      transportePublico: 0,
      gastosAuto: 0,
      luz: 0,
      gas: 0,
      celular: 0,
      telefonoCasa: 0,
      cable: 0,
      escuela: 0,
      creditoBancario: 0,
      creditoInfonavit: 0,
      prestamoNomina: 0,
      pensionAlimenticia: 0,
      renta: 0,
      ahorroMensual: 0,
    },
    ingresosHogar: Array.from({ length: 15 }, () => ({
      parentesco: "",
      monto: 0,
    })),
    documentosPresentados: DOCUMENTOS_CATALOGO.map((doc) => ({
      id: doc.id,
      nombre: doc.nombre,
      presento: "",
      folioDatos: "",
    })),
    comprobanteDomicilioTipo: "Luz",
    anexosTexto: "",
    anexosImagenes: [],
    avisoPrivacidad: {
      lugar: "Metepec, Estado de México",
      dia: new Date().getDate().toString(),
      mes: new Intl.DateTimeFormat("es-MX", { month: "long" }).format(new Date()),
      anio: new Date().getFullYear().toString(),
      candidato: "",
      empresa: "",
      puesto: "",
      firmaConformidadUrl: "",
      firmaAvisoPrivacidadUrl: "",
      fechaFirmaConformidad: "",
      fechaFirmaAviso: "",
    },
  };
}

export function createDemoEstudio(): EstudioSocioeconomico {
  const base = createEmptyEstudio("demo-estudio-2026-001", "Lic. Claudia Morales");
  return {
    ...base,
    isDraft: false,
    folio: "ESE-2026-0142",
    fechaElaboracion: "20 de octubre de 2026",
    candidatoNombrePortada: "Carlos Eduardo Ramírez Mendoza",
    fechaRealizacion: "2026-10-19",
    puestoSolicitado: "Coordinador de Logística y Operaciones",
    dictamen: "ACEPTABLE",
    reporteEntrevista:
      "El candidato se mostró puntual, cordial y con excelente disposición durante toda la entrevista. Presentó la totalidad de su documentación original para cotejo. Su discurso es estructurado y congruente con la trayectoria laboral declarada en su CV.",
    investigacionDomiciliaria:
      "Vivienda ubicada en zona urbana consolidada de Metepec con todos los servicios municipales. El inmueble se observa en óptimas condiciones de higiene, orden y mantenimiento. Cuenta con espacio suficiente para los 3 habitantes del hogar.",
    resumenReferenciasVecinales:
      "Se entrevistó a dos vecinos colindantes quienes confirman conocer al candidato y su familia desde hace más de 6 años, refiriéndolos como personas tranquilas, respetuosas y sin conflictos vecinales.",
    resumenReferenciasLaborales:
      "Las referencias laborales validadas confirman las fechas de ingreso, baja y puestos desempeñados. Sus exjefes directos destacan su responsabilidad, apego a procesos y manejo ético de recursos e información, recomendando ampliamente su contratación.",
    comentariosPersonales: "Excelente presentación personal, trato profesional y comunicación asertiva.",
    viviendaTenencia: "Propia",
    viviendaValorAprox: "$1,850,000 MXN",
    viviendaTiempoViviendo: "7 años",
    viviendaMaterial: "Concreto",
    viviendaTipo: "Media Residencial",
    viviendaColor: "Blanco con detalles en gris oxford",
    datosGenerales: {
      nombre: "Carlos Eduardo Ramírez Mendoza",
      edad: "32 años",
      sexo: "Masculino",
      fechaNacimientoDia: "14",
      fechaNacimientoMes: "Mayo",
      fechaNacimientoAnio: "1994",
      lugarNacimiento: "Toluca, Estado de México",
      lugarFechaMatrimonio: "Metepec, Méx. - 18/06/2021",
      numeroHijosEdad: "1 hijo (3 años)",
      ocupacionActual: "Ingeniero en Logística",
      estadoCivil: "Casado (a)",
      peso: "76 kg",
      saludVisual: "Buena",
      estatura: "1.75",
      saludFisica: "Buena",
      tipoSangre: "O+",
    },
    datosContacto: {
      calleYNumero: "Av. Estado de México #412 Int. 4",
      delegacionMunicipio: "Metepec",
      estadoCiudad: "Estado de México",
      entreCalles: "Calle Benito Juárez y Av. Tecnológico",
      telefonoCasa: "722 234 5678",
      telefonoRecados: "722 876 5432",
      telefonoCelular: "722 391 8475",
      correoElectronico: "carlos.ramirez.log@email.com",
    },
    datosAcademicos: {
      nivelMaximo: "Licenciatura",
      documentoComprobatorio: "Título",
      documentoOtroCual: "",
      area: "Ingeniería Industrial y de Sistemas",
      escuelaInstitucion: "Instituto Tecnológico de Toluca",
      periodoEscolar: "2012 - 2017",
      presentoOriginal: "Si",
      presentoCopia: "Si",
    },
    referenciasLaborales: [
      {
        empresa: "Distribuidora Industrial del Valle S.A. de C.V.",
        giroEmpresarial: "Logística y Distribución",
        telefono: "722 198 4400",
        domicilio: "Parque Industrial Toluca 2000, Calle 3 Sur #110",
        fechaIngreso: "Marzo 2022",
        fechaBaja: "Septiembre 2026",
        puestoSueldoInicial: "Supervisor de Almacén - $18,000",
        puestoSueldoFinal: "Jefe de Tráfico y Rutas - $24,500",
        nombreJefeDirecto: "Ing. Roberto Sánchez Vega",
        sindicato: "No aplica",
        manejoInfoConfidencial: "Si",
        equipoTecnologico: "Si",
        desempeno: "Bueno",
        causaSeparacion: "Renuncia voluntaria",
        decisionEmpresa: "",
        contratariaNuevamente: "Si",
        recomiendaContratacion: "Si",
        observaciones: "Colaborador puntual, redujo mermas en un 18% durante su gestión.",
        proporcionoNombre: "Lic. Mariana Torres (Recursos Humanos)",
        proporcionoPuesto: "Generalista de RH",
      },
      {
        empresa: "Transportes y Carga Mexiquense",
        giroEmpresarial: "Autotransporte Federal",
        telefono: "722 310 9281",
        domicilio: "Blvd. Aeropuerto #805, Lerma, Méx.",
        fechaIngreso: "Enero 2019",
        fechaBaja: "Febrero 2022",
        puestoSueldoInicial: "Analista de Inventarios - $13,500",
        puestoSueldoFinal: "Coordinador de Embarques - $16,800",
        nombreJefeDirecto: "Lic. Fernando Ochoa",
        sindicato: "No aplica",
        manejoInfoConfidencial: "Si",
        equipoTecnologico: "Si",
        desempeno: "Bueno",
        causaSeparacion: "Renuncia voluntaria",
        decisionEmpresa: "",
        contratariaNuevamente: "Si",
        recomiendaContratacion: "Si",
        observaciones: "Excelente desempeño y trato con operadores.",
        proporcionoNombre: "Lic. Claudia Gómez",
        proporcionoPuesto: "Coordinadora de Capital Humano",
      },
      createEmptyReferenciaLaboral(),
    ],
    referenciasVecinales: [
      {
        nombre: "Sra. Patricia Hernández López",
        tiempoConocerlo: "7 años",
        opinionFamilia: "Familia muy educada, tranquila y participativa en el mantenimiento de la privada.",
        comentariosAdicionales: "Siempre saludan cordialmente y respetan el reglamento vecinal.",
        recomiendaContratacion: "Si",
      },
      {
        nombre: "Sr. Jorge Alberto Morales",
        tiempoConocerlo: "6 años",
        opinionFamilia: "Personas trabajadoras, hogareñas y muy respetuosas.",
        comentariosAdicionales: "Sin ningún problema desde que llegaron a vivir aquí.",
        recomiendaContratacion: "Si",
      },
    ],
    referenciasPersonales: [
      {
        nombre: "Ing. Alejandro Domínguez",
        telefono: "722 415 8890",
        direccion: "Col. Ciprés, Toluca, Méx.",
        tiempoConocerlo: "10 años",
        empresasHaLaborado: "Distribuidora Industrial del Valle, Transportes Mexiquense",
        recomiendaContratacion: "Si",
        opinionCandidato: "Persona íntegra, dedicada a su familia y sumamente comprometida con su trabajo.",
      },
      {
        nombre: "Lic. Sofía Castellanos",
        telefono: "55 4892 1034",
        direccion: "San Mateo Atenco, Méx.",
        tiempoConocerlo: "8 años",
        empresasHaLaborado: "Distribuidora Industrial del Valle",
        recomiendaContratacion: "Si",
        opinionCandidato: "Muy responsable, puntual y honesto en todos los aspectos.",
      },
      {
        nombre: "Arq. Daniel Villaseñor",
        telefono: "722 509 3321",
        direccion: "Metepec, Estado de México",
        tiempoConocerlo: "5 años",
        empresasHaLaborado: "Distribuidora Industrial del Valle",
        recomiendaContratacion: "Si",
        opinionCandidato: "Gran compañero y amigo, totalmente confiable.",
      },
    ],
    estructuraFamiliar: [
      {
        parentesco: "Esposa",
        nombre: "Laura Elena Flores García",
        edad: "30",
        ocupacion: "Contadora Pública",
        empresa: "Despacho Contable Fiscal SC",
        mismoDomicilio: "Sí",
      },
      {
        parentesco: "Hijo",
        nombre: "Mateo Ramírez Flores",
        edad: "3",
        ocupacion: "Maternal / Preescolar",
        empresa: "N/A",
        mismoDomicilio: "Sí",
      },
      {
        parentesco: "Padre",
        nombre: "Eduardo Ramírez Soto",
        edad: "61",
        ocupacion: "Jubilado",
        empresa: "CFE",
        mismoDomicilio: "No",
      },
      {
        parentesco: "Madre",
        nombre: "Rosa María Mendoza",
        edad: "58",
        ocupacion: "Hogar",
        empresa: "N/A",
        mismoDomicilio: "No",
      },
      ...Array.from({ length: 6 }, () => ({
        parentesco: "",
        nombre: "",
        edad: "",
        ocupacion: "",
        empresa: "",
        mismoDomicilio: "",
      })),
    ],
    egresosMensuales: {
      alimentos: 6500,
      transportePublico: 400,
      gastosAuto: 2200,
      luz: 380,
      gas: 550,
      celular: 599,
      telefonoCasa: 0,
      cable: 650,
      escuela: 2800,
      creditoBancario: 0,
      creditoInfonavit: 4200,
      prestamoNomina: 0,
      pensionAlimenticia: 0,
      renta: 0,
      ahorroMensual: 3500,
    },
    ingresosHogar: [
      { parentesco: "Candidato (Sueldo base)", monto: 24500 },
      { parentesco: "Esposa (Aportación mensual)", monto: 14000 },
      ...Array.from({ length: 13 }, () => ({ parentesco: "", monto: 0 })),
    ],
    documentosPresentados: DOCUMENTOS_CATALOGO.map((doc) => ({
      id: doc.id,
      nombre: doc.nombre,
      presento: [7, 13, 17].includes(doc.id) ? "No" : "Si",
      folioDatos:
        doc.id === 1
          ? "Oficialía 01 Toluca, Libro 4, Acta 892"
          : doc.id === 2
          ? "Cédula Profesional 11489203"
          : doc.id === 3
          ? "IDMEX2194850291"
          : doc.id === 4
          ? "RMMN94051415H200"
          : doc.id === 5
          ? "Av. Estado de México #412, Metepec"
          : doc.id === 6
          ? "RAMC940514HMC..."
          : doc.id === 11
          ? "RAMC9405148J2"
          : doc.id === 12
          ? "CFE Recibo Septiembre 2026 - Coincide domicilio"
          : doc.id === 14
          ? "NSS: 44129405812"
          : doc.id === 15
          ? "Crédito No. 1520948123"
          : doc.id === 16
          ? "412 semanas cotizadas verificadas"
          : "N/A",
    })),
    comprobanteDomicilioTipo: "Luz",
  };
}
