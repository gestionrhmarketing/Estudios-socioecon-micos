import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { EstudioSocioeconomico, createDemoEstudio, generateUUID } from "@/types/estudio";

const LOCAL_STORAGE_KEY = "gestionrh_estudios_v1";
const SUPABASE_CONFIG_KEY = "gestionrh_supabase_config_v1";
const EVALUADORES_KEY = "gestionrh_evaluadores_catalog_v1";
export const BUCKET_EXPEDIENTES = "expedientes";

const EVALUADORES_DEFAULT: string[] = [];

export function getCatalogoEvaluadores(): string[] {
  let list: string[] = [];
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(EVALUADORES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const mocks = [
            "lic. claudia morales",
            "abrahán garcía",
            "abraham garcia",
            "lic. andrea romero",
            "lic. roberto sánchez",
            "lic. roberto sanchez",
          ];
          list = parsed.filter(
            (p) => !mocks.includes(String(p).trim().toLowerCase())
          );
        }
      }
    } catch {
      // ignore
    }

    try {
      const localEstudios = getLocalEstudios();
      localEstudios.forEach((est) => {
        if (est.evaluadorNombre && est.evaluadorNombre.trim()) {
          const nom = est.evaluadorNombre.trim();
          if (!list.some((item) => item.toLowerCase() === nom.toLowerCase())) {
            list.push(nom);
          }
        }
      });
    } catch {
      // ignore
    }
  }

  return list.sort((a, b) => a.localeCompare(b));
}

export function registrarNuevoEvaluador(nombre: string): string[] {
  const limpio = nombre.trim();
  if (!limpio) return getCatalogoEvaluadores();
  const actual = getCatalogoEvaluadores();
  const existe = actual.some(
    (item) => item.toLowerCase() === limpio.toLowerCase()
  );
  if (!existe) {
    const actualizado = [...actual, limpio].sort((a, b) => a.localeCompare(b));
    if (typeof window !== "undefined") {
      localStorage.setItem(EVALUADORES_KEY, JSON.stringify(actualizado));
    }
    // Guardar también en Supabase de forma asíncrona
    guardarEvaluadorEnSupabase(limpio);
    return actualizado;
  }
  return actual;
}

/**
 * Carga el catálogo de personas / evaluadores desde Supabase
 * (de la tabla evaluadores y de los estudios registrados)
 */
export async function cargarCatalogoEvaluadoresSupabase(): Promise<string[]> {
  const local = getCatalogoEvaluadores();
  const supabase = getSupabaseClient();
  if (!supabase) return local;

  try {
    let remotos: string[] = [];

    // 1. Cargar desde tabla de evaluadores
    const { data, error } = await supabase.from("evaluadores").select("nombre");
    if (!error && data) {
      data.forEach((row: { nombre: string }) => {
        if (row.nombre && row.nombre.trim()) remotos.push(row.nombre.trim());
      });
    }

    // 2. Extraer de los estudios existentes en Supabase
    const { data: estudiosData } = await supabase
      .from("estudios_socioeconomicos")
      .select("data")
      .limit(300);

    if (estudiosData) {
      estudiosData.forEach((row: { data?: { evaluadorNombre?: string } }) => {
        const nom = row.data?.evaluadorNombre?.trim();
        if (nom) remotos.push(nom);
      });
    }

    const mocks = [
      "lic. claudia morales",
      "abrahán garcía",
      "abraham garcia",
      "lic. andrea romero",
      "lic. roberto sánchez",
      "lic. roberto sanchez",
    ];

    const combinados = Array.from(
      new Set([...local, ...remotos].filter((n) => !mocks.includes(n.toLowerCase())))
    ).sort((a, b) => a.localeCompare(b));

    if (typeof window !== "undefined") {
      localStorage.setItem(EVALUADORES_KEY, JSON.stringify(combinados));
    }
    return combinados;
  } catch {
    return local;
  }
}

/**
 * Persiste una persona / evaluador en la base de datos de Supabase
 */
export async function guardarEvaluadorEnSupabase(nombre: string): Promise<void> {
  const limpio = nombre.trim();
  if (!limpio) return;
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    await supabase.from("evaluadores").upsert(
      { nombre: limpio },
      { onConflict: "nombre" }
    );
  } catch {
    // Si la tabla evaluadores aún no se ha creado con SQL, se guardará en los registros de estudios
  }
}

export interface SupabaseRuntimeConfig {
  url: string;
  anonKey: string;
}

export function getSupabaseConfig(): SupabaseRuntimeConfig | null {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (envUrl && envKey && envUrl.startsWith("http")) {
    return { url: envUrl, anonKey: envKey };
  }

  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(SUPABASE_CONFIG_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as SupabaseRuntimeConfig;
        if (parsed.url && parsed.anonKey && parsed.url.startsWith("http")) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
  }
  return null;
}

export function saveSupabaseConfig(config: SupabaseRuntimeConfig | null) {
  if (typeof window === "undefined") return;
  if (!config || !config.url || !config.anonKey) {
    localStorage.removeItem(SUPABASE_CONFIG_KEY);
  } else {
    localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(config));
  }
}

let cachedClient: SupabaseClient | null = null;
let cachedConfigKey = "";

export function getSupabaseClient(): SupabaseClient | null {
  const cfg = getSupabaseConfig();
  if (!cfg) return null;
  const key = `${cfg.url}_${cfg.anonKey}`;
  if (cachedClient && cachedConfigKey === key) {
    return cachedClient;
  }
  try {
    cachedClient = createClient(cfg.url, cfg.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    cachedConfigKey = key;
    return cachedClient;
  } catch {
    return null;
  }
}

function getLocalEstudios(): EstudioSocioeconomico[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      // Si ya hay configuración de Supabase, no auto-generar estudios demo para evitar re-subidas fantasma
      const cfg = getSupabaseConfig();
      if (cfg) {
        return [];
      }
      const demo = createDemoEstudio();
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([demo]));
      return [demo];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setLocalEstudios(list: EstudioSocioeconomico[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error("Error guardando en LocalStorage:", err);
  }
}

// -------------------------------------------------------------
// CACHÉ EN MEMORIA PARA PREVENIR CONSUMO EXCESIVO DE PETICIONES
// -------------------------------------------------------------
let memoryListCache: {
  estudios: EstudioSocioeconomico[];
  timestamp: number;
} | null = null;
const CACHE_TTL_MS = 15000; // 15 segundos de caché de lectura

export function invalidarCacheLectura() {
  memoryListCache = null;
}

/**
 * Listado optimizado:
 * - Trae solo columnas esenciales para el dashboard (evita transferir megabytes de fotos en cada listado)
 * - Usa caché en memoria de 15 segundos para no agotar la cuota de peticiones
 */
export async function listarEstudios(forceRefresh = false): Promise<{
  estudios: EstudioSocioeconomico[];
  source: "supabase" | "local";
  error?: string;
}> {
  const localList = getLocalEstudios();

  if (
    !forceRefresh &&
    memoryListCache &&
    Date.now() - memoryListCache.timestamp < CACHE_TTL_MS
  ) {
    return { estudios: memoryListCache.estudios, source: "supabase" };
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return { estudios: localList, source: "local" };
  }

  try {
    // Consulta ligera: traemos data y updated_at pero si hay muchos registros es rápido y sin bloqueos
    const { data, error } = await supabase
      .from("estudios_socioeconomicos")
      .select("data, updated_at")
      .order("updated_at", { ascending: false })
      .limit(100);

    if (error) {
      return {
        estudios: localList,
        source: "local",
        error: `Supabase: ${error.message}`,
      };
    }

    if (data) {
      const remoteEstudios = data.map(
        (row: { data: EstudioSocioeconomico }) => row.data
      );

      // Solo preservamos borradores locales activos que se estén creando en este dispositivo (isDraft: true)
      // y que aún no han sido guardados en Supabase.
      // Los estudios finalizados o eliminados de Supabase se limpian del LocalStorage local.
      const localDrafts = localList.filter(
        (local) =>
          local.isDraft === true &&
          !remoteEstudios.some((r) => r.id === local.id)
      );

      const combined = [...remoteEstudios, ...localDrafts].sort(
        (a, b) =>
          new Date(b.updatedAt || 0).getTime() -
          new Date(a.updatedAt || 0).getTime()
      );

      setLocalEstudios(combined);
      memoryListCache = { estudios: combined, timestamp: Date.now() };
      return { estudios: combined, source: "supabase" };
    }

    return { estudios: [], source: "supabase" };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error de red";
    return { estudios: localList, source: "local", error: message };
  }
}

/**
 * Obtener un estudio específico por ID (a nivel de fila individual).
 * Esto evita bloqueos concurrentes porque cada encuestador solo bloquea o edita su propio registro.
 */
export async function obtenerEstudioPorId(
  id: string
): Promise<EstudioSocioeconomico | null> {
  const localList = getLocalEstudios();
  const foundLocal = localList.find((e) => e.id === id) || null;

  const supabase = getSupabaseClient();
  if (!supabase) return foundLocal;

  try {
    const { data, error } = await supabase
      .from("estudios_socioeconomicos")
      .select("data")
      .eq("id", id)
      .single();

    if (!error && data?.data) {
      const remote = data.data as EstudioSocioeconomico;
      // Actualizar en local
      const idx = localList.findIndex((e) => e.id === id);
      if (idx >= 0) localList[idx] = remote;
      else localList.push(remote);
      setLocalEstudios(localList);
      return remote;
    }
  } catch {
    // fallback
  }
  return foundLocal;
}

// -------------------------------------------------------------
// COLA Y DEBOUNCE PARA GUARDADO CONCURRENTE SIN SATURAR SUPABASE
// -------------------------------------------------------------
const debounceTimers: Record<string, NodeJS.Timeout> = {};

/**
 * Guarda el estudio en Supabase de forma inmediata (por fila única: id).
 * Gracias al upsert basado en UUID independiente por estudio, 3 o más personas
 * pueden estar llenando estudios distintos sin pisarse ni bloquearse jamás.
 */
export async function guardarEstudioInmediato(
  estudio: EstudioSocioeconomico
): Promise<{ savedInSupabase: boolean; error?: string }> {
  const updated: EstudioSocioeconomico = {
    ...estudio,
    updatedAt: new Date().toISOString(),
  };

  // 1. Guardar en LocalStorage instantáneo (garantía anti-pérdida offline)
  const localList = getLocalEstudios();
  const idx = localList.findIndex((e) => e.id === updated.id);
  if (idx >= 0) {
    localList[idx] = updated;
  } else {
    localList.unshift(updated);
  }
  setLocalEstudios(localList);

  // Invalida la caché de listado para que el dashboard vea la última versión
  invalidarCacheLectura();

  const supabase = getSupabaseClient();
  if (!supabase) {
    return { savedInSupabase: false };
  }

  try {
    const payload = {
      id: updated.id,
      folio: updated.folio || "SIN-FOLIO",
      candidato_nombre:
        updated.candidatoNombrePortada || updated.datosGenerales.nombre || "",
      puesto: updated.puestoSolicitado || "",
      dictamen: updated.dictamen || "ACEPTABLE",
      fecha_realizacion: updated.fechaRealizacion || "",
      data: updated,
      updated_at: updated.updatedAt,
    };

    // Upsert aislado por ID de estudio: evita lock de tabla en PostgreSQL
    const { error } = await supabase
      .from("estudios_socioeconomicos")
      .upsert(payload, { onConflict: "id" });

    if (error) {
      return { savedInSupabase: false, error: error.message };
    }
    return { savedInSupabase: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error de conexión";
    return { savedInSupabase: false, error: msg };
  }
}

/**
 * Guardado con DEBOUNCE (1 segundo):
 * Cuando un usuario teclea rápido en el formulario, en vez de mandar 20 peticiones
 * por segundo a Supabase (lo que gastaría las consultas del plan), agrupa los cambios
 * y envía una sola actualización final.
 */
export function guardarEstudio(
  estudio: EstudioSocioeconomico,
  onFinish?: (res: { savedInSupabase: boolean; error?: string }) => void
): void {
  // Guardado local inmediato para que la UI no se trabe
  const updated: EstudioSocioeconomico = {
    ...estudio,
    updatedAt: new Date().toISOString(),
  };
  const localList = getLocalEstudios();
  const idx = localList.findIndex((e) => e.id === updated.id);
  if (idx >= 0) {
    localList[idx] = updated;
  } else {
    localList.unshift(updated);
  }
  setLocalEstudios(localList);

  if (debounceTimers[estudio.id]) {
    clearTimeout(debounceTimers[estudio.id]);
  }

  debounceTimers[estudio.id] = setTimeout(async () => {
    delete debounceTimers[estudio.id];
    const res = await guardarEstudioInmediato(updated);
    if (onFinish) onFinish(res);
  }, 1000); // 1000ms debounce
}

export async function eliminarEstudio(id: string): Promise<boolean> {
  // 1. Cancelar cualquier guardado en segundo plano pendiente para este id
  if (debounceTimers[id]) {
    clearTimeout(debounceTimers[id]);
    delete debounceTimers[id];
  }

  // 2. Limpiar inmediatamente de la memoria local y caché
  const localList = getLocalEstudios().filter((e) => e.id !== id);
  setLocalEstudios(localList);
  invalidarCacheLectura();

  // 3. Eliminar de Supabase de inmediato
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase
        .from("estudios_socioeconomicos")
        .delete()
        .eq("id", id);
      if (error) {
        console.error("Error eliminando en Supabase:", error.message);
        return false;
      }
    } catch (err) {
      console.error("Error eliminando en Supabase:", err);
      return false;
    }
  }
  return true;
}

/**
 * Subida optimizada de archivo a Supabase Storage:
 * - Acepta archivos de imagen (comprimidos en el cliente a JPEG/WebP) o PDF
 * - Organiza por carpeta de folio del expediente
 * - Retorna la URL pública directa para visualización y descarga
 */
export async function subirArchivoExpediente(
  folio: string,
  docId: number,
  file: File | Blob,
  nombreOriginal: string
): Promise<{ url: string; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { url: "", error: "Sin conexión a Supabase" };
  }

  try {
    const ext = nombreOriginal.split(".").pop()?.toLowerCase() || "jpg";
    const folioLimpio = (folio || "SIN_FOLIO").replace(/[^a-zA-Z0-9_-]/g, "_");
    const path = `${folioLimpio}/doc_${docId}_${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_EXPEDIENTES)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      return { url: "", error: uploadError.message };
    }

    const { data } = supabase.storage
      .from(BUCKET_EXPEDIENTES)
      .getPublicUrl(path);

    return { url: data.publicUrl };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al subir archivo";
    return { url: "", error: msg };
  }
}

/**
 * Suscripción en Tiempo Real (WebSockets de Supabase):
 * Cuando cualquier computadora o celular agregue, modifique o elimine un estudio,
 * todos los demás teléfonos y computadoras conectados reciben el cambio en milisegundos
 * sin necesidad de recargar la página.
 */
export function suscribirEstudiosRealtime(
  onEvento: (evento: {
    tipo: "INSERT" | "UPDATE" | "DELETE";
    estudio?: EstudioSocioeconomico;
    idEliminado?: string;
  }) => void
): () => void {
  const supabase = getSupabaseClient();
  if (!supabase) return () => {};

  try {
    const channel = supabase
      .channel("estudios_realtime_broadcast")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "estudios_socioeconomicos",
        },
        (payload) => {
          invalidarCacheLectura();
          if (payload.eventType === "INSERT") {
            const raw = (payload.new as { data?: EstudioSocioeconomico })?.data;
            if (raw) {
              onEvento({ tipo: "INSERT", estudio: raw });
            }
          } else if (payload.eventType === "UPDATE") {
            const raw = (payload.new as { data?: EstudioSocioeconomico })?.data;
            if (raw) {
              onEvento({ tipo: "UPDATE", estudio: raw });
            }
          } else if (payload.eventType === "DELETE") {
            const idEliminado = (payload.old as { id?: string })?.id;
            if (idEliminado) {
              onEvento({ tipo: "DELETE", idEliminado });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.error("Error al suscribirse a Realtime:", err);
    return () => {};
  }
}
