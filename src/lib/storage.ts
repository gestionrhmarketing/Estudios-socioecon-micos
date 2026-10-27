import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  EstudioSocioeconomico,
  createDemoEstudio,
  generateUUID,
  UsuarioSistema,
  RolUsuario,
  EstadoUsuario,
  DatosBancariosUsuario,
} from "@/types/estudio";

const LOCAL_STORAGE_KEY = "gestionrh_estudios_v1";
const SUPABASE_CONFIG_KEY = "gestionrh_supabase_config_v1";
const EVALUADORES_KEY = "gestionrh_evaluadores_catalog_v1";
const USUARIOS_KEY = "gestionrh_usuarios_sistema_v1";
const SESION_KEY = "gestionrh_usuario_activo_v1";
const PERFIL_META_PREFIX = "__PERFIL_META__:";
export const BUCKET_EXPEDIENTES = "expedientes";

export const ADMIN_DEFAULT: UsuarioSistema = {
  id: "45e20dd7-da2a-40aa-8643-86bc72ff141c",
  nombre: "Gaby Rodriguez",
  email: "seleccion@gestionrh.com.mx",
  password: "6327",
  rol: "admin",
  estado: "activo",
  createdAt: "2026-01-01T00:00:00.000Z",
};

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
            (p) =>
              !String(p).startsWith(PERFIL_META_PREFIX) &&
              !mocks.includes(String(p).trim().toLowerCase())
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

    // 1. Cargar desde tabla de evaluadores (excluyendo metadatos de perfil)
    const { data, error } = await supabase.from("evaluadores").select("nombre");
    if (!error && data) {
      data.forEach((row: { nombre: string }) => {
        if (
          row.nombre &&
          row.nombre.trim() &&
          !row.nombre.startsWith(PERFIL_META_PREFIX)
        ) {
          remotos.push(row.nombre.trim());
        }
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

// ============================================================================
// GESTIÓN DE USUARIOS Y AUTENTICACIÓN INTERNA
// ============================================================================

export function getUsuarioActivo(): UsuarioSistema | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UsuarioSistema;
  } catch {
    return null;
  }
}

export function setUsuarioActivo(user: UsuarioSistema | null): void {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      localStorage.setItem(SESION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESION_KEY);
    }
  } catch {
    // ignore
  }
}

export function cerrarSesion(): void {
  setUsuarioActivo(null);
}

export function getUsuariosLocales(): UsuarioSistema[] {
  if (typeof window === "undefined") return [ADMIN_DEFAULT];
  try {
    const raw = localStorage.getItem(USUARIOS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Asegurar que siempre esté Gaby Rodriguez
        if (!parsed.some((u) => u.email.toLowerCase() === ADMIN_DEFAULT.email.toLowerCase())) {
          parsed.unshift(ADMIN_DEFAULT);
        }
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  const inicial = [ADMIN_DEFAULT];
  try {
    localStorage.setItem(USUARIOS_KEY, JSON.stringify(inicial));
  } catch {
    // ignore
  }
  return inicial;
}

export function setUsuariosLocales(users: UsuarioSistema[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(USUARIOS_KEY, JSON.stringify(users));
  } catch {
    // ignore
  }
}

interface MetaPerfilPayload {
  userId: string;
  email: string;
  datosBancarios?: DatosBancariosUsuario;
  zonas?: string[];
}

async function guardarMetaPerfilEnSupabase(usuario: UsuarioSistema): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    const payload: MetaPerfilPayload = {
      userId: usuario.id,
      email: usuario.email.toLowerCase(),
      datosBancarios: usuario.datosBancarios || {
        banco: "",
        numeroTarjeta: "",
        clabe: "",
      },
      zonas: usuario.zonas || [],
    };
    const encoded = `${PERFIL_META_PREFIX}${usuario.id}:${JSON.stringify(payload)}`;
    await supabase
      .from("evaluadores")
      .delete()
      .like("nombre", `${PERFIL_META_PREFIX}${usuario.id}:%`);
    await supabase.from("evaluadores").insert({ nombre: encoded });
  } catch (err) {
    console.warn("Aviso al guardar metadatos de perfil en Supabase:", err);
  }
}

async function cargarMetaPerfilesDesdeSupabase(): Promise<{
  byId: Record<string, MetaPerfilPayload>;
  byEmail: Record<string, MetaPerfilPayload>;
}> {
  const byId: Record<string, MetaPerfilPayload> = {};
  const byEmail: Record<string, MetaPerfilPayload> = {};
  const supabase = getSupabaseClient();
  if (!supabase) return { byId, byEmail };

  try {
    const { data } = await supabase
      .from("evaluadores")
      .select("nombre")
      .like("nombre", `${PERFIL_META_PREFIX}%`);

    if (data) {
      data.forEach((row: { nombre: string }) => {
        try {
          const withoutPrefix = row.nombre.slice(PERFIL_META_PREFIX.length);
          const colonIdx = withoutPrefix.indexOf(":");
          if (colonIdx !== -1) {
            const jsonStr = withoutPrefix.slice(colonIdx + 1);
            const parsed = JSON.parse(jsonStr) as MetaPerfilPayload;
            if (parsed.userId) byId[parsed.userId] = parsed;
            if (parsed.email) byEmail[parsed.email.toLowerCase()] = parsed;
          }
        } catch {
          // ignore malformed
        }
      });
    }
  } catch {
    // ignore
  }
  return { byId, byEmail };
}

export async function cargarUsuariosSistema(): Promise<UsuarioSistema[]> {
  const local = getUsuariosLocales();
  const supabase = getSupabaseClient();
  if (!supabase) return local;

  try {
    const [{ data, error }, metaMap] = await Promise.all([
      supabase
        .from("usuarios_sistema")
        .select("id, nombre, email, password, rol, estado, created_at, updated_at"),
      cargarMetaPerfilesDesdeSupabase(),
    ]);

    if (error) {
      return local;
    }

    if (data && data.length > 0) {
      const remotos: UsuarioSistema[] = data.map((row) => {
        const localMatch = local.find(
          (l) =>
            l.id === row.id ||
            l.email.toLowerCase() === String(row.email || "").toLowerCase()
        );
        const meta =
          metaMap.byId[row.id] ||
          metaMap.byEmail[String(row.email || "").toLowerCase()];

        return {
          id: row.id,
          nombre: row.nombre,
          email: row.email,
          password: row.password,
          rol: (row.rol || "evaluador") as RolUsuario,
          estado: (row.estado || "pendiente") as EstadoUsuario,
          createdAt: row.created_at || new Date().toISOString(),
          updatedAt: row.updated_at,
          datosBancarios: meta?.datosBancarios || localMatch?.datosBancarios || {
            banco: "",
            numeroTarjeta: "",
            clabe: "",
          },
          zonas: meta?.zonas || localMatch?.zonas || [],
        };
      });

      // Combinar asegurando que el admin principal siempre esté presente
      const combinados = [...remotos];
      if (!combinados.some((u) => u.rol === "admin" || u.email.toLowerCase() === ADMIN_DEFAULT.email.toLowerCase())) {
        combinados.unshift(ADMIN_DEFAULT);
        supabase.from("usuarios_sistema").upsert({
          id: ADMIN_DEFAULT.id,
          nombre: ADMIN_DEFAULT.nombre,
          email: ADMIN_DEFAULT.email,
          password: ADMIN_DEFAULT.password,
          rol: ADMIN_DEFAULT.rol,
          estado: ADMIN_DEFAULT.estado,
        }).then(() => {});
      }

      // Auto-sincronizar solicitudes creadas localmente en este dispositivo que aún no estén en Supabase
      const localesNoSincronizados = local.filter(
        (loc) =>
          loc.email.toLowerCase() !== ADMIN_DEFAULT.email.toLowerCase() &&
          !combinados.some((rem) => rem.email.toLowerCase() === loc.email.toLowerCase())
      );
      for (const missing of localesNoSincronizados) {
        try {
          await supabase.from("usuarios_sistema").insert({
            id: missing.id,
            nombre: missing.nombre,
            email: missing.email,
            password: missing.password,
            rol: missing.rol,
            estado: missing.estado,
          });
          if (missing.datosBancarios || (missing.zonas && missing.zonas.length > 0)) {
            await guardarMetaPerfilEnSupabase(missing);
          }
          combinados.push(missing);
        } catch {
          // ignore
        }
      }

      setUsuariosLocales(combinados);

      // Si el usuario con sesión activa está en la lista, sincronizar sus datos en sesión
      const activoActual = getUsuarioActivo();
      if (activoActual) {
        const actualizadoActivo = combinados.find(
          (u) =>
            u.id === activoActual.id ||
            u.email.toLowerCase() === activoActual.email.toLowerCase()
        );
        if (actualizadoActivo) {
          setUsuarioActivo(actualizadoActivo);
        }
      }

      return combinados;
    } else {
      // Si la tabla remota existe pero está vacía, sembrar la cuenta de Gaby
      await supabase.from("usuarios_sistema").upsert({
        id: ADMIN_DEFAULT.id,
        nombre: ADMIN_DEFAULT.nombre,
        email: ADMIN_DEFAULT.email,
        password: ADMIN_DEFAULT.password,
        rol: ADMIN_DEFAULT.rol,
        estado: ADMIN_DEFAULT.estado,
      });

      // Sincronizar usuarios locales a la tabla remota recién inicializada
      const localesNoSincronizados = local.filter(
        (loc) => loc.email.toLowerCase() !== ADMIN_DEFAULT.email.toLowerCase()
      );
      for (const missing of localesNoSincronizados) {
        try {
          await supabase.from("usuarios_sistema").insert({
            id: missing.id,
            nombre: missing.nombre,
            email: missing.email,
            password: missing.password,
            rol: missing.rol,
            estado: missing.estado,
          });
        } catch {
          // ignore
        }
      }

      return local;
    }
  } catch {
    return local;
  }
}

export async function verificarEstadoTablaUsuarios(): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { ok: false, error: "Supabase no está configurado." };
  try {
    const { error } = await supabase.from("usuarios_sistema").select("id").limit(1);
    if (error) {
      return {
        ok: false,
        error: error.message || error.code || "Tabla public.usuarios_sistema no encontrada",
      };
    }
    return { ok: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al conectar con Supabase";
    return { ok: false, error: msg };
  }
}

export function limpiarSolicitudPendienteLocal(email?: string): void {
  const local = getUsuariosLocales();
  if (!email) {
    setUsuariosLocales([ADMIN_DEFAULT]);
    return;
  }
  const filtrados = local.filter(
    (u) =>
      u.email.toLowerCase() !== email.toLowerCase() ||
      u.email.toLowerCase() === ADMIN_DEFAULT.email.toLowerCase()
  );
  setUsuariosLocales(filtrados);
}

export async function crearUsuarioManualPorAdmin(
  nombre: string,
  email: string,
  password: string,
  rol: RolUsuario = "evaluador",
  estado: EstadoUsuario = "activo"
): Promise<{ success: boolean; message: string; usuario?: UsuarioSistema }> {
  const limpioNombre = nombre.trim();
  const limpioEmail = email.trim().toLowerCase();
  const limpioPass = password.trim();

  if (!limpioNombre || !limpioEmail || !limpioPass) {
    return { success: false, message: "Todos los campos son obligatorios." };
  }

  const usuarios = await cargarUsuariosSistema();
  const existente = usuarios.find((u) => u.email.toLowerCase() === limpioEmail);

  if (existente) {
    const res = await actualizarEstadoUsuarioSistema(existente.id, estado, rol);
    if (res.success) {
      return {
        success: true,
        message: `El usuario "${limpioNombre}" ya existía y fue actualizado a estado ${estado.toUpperCase()}.`,
      };
    }
    return { success: false, message: res.error || "Error al actualizar usuario existente." };
  }

  const nuevoUsuario: UsuarioSistema = {
    id: generateUUID(),
    nombre: limpioNombre,
    email: limpioEmail,
    password: limpioPass,
    rol,
    estado,
    createdAt: new Date().toISOString(),
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error: insertError } = await supabase.from("usuarios_sistema").insert({
        id: nuevoUsuario.id,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        password: nuevoUsuario.password,
        rol: nuevoUsuario.rol,
        estado: nuevoUsuario.estado,
      });
      if (insertError) {
        return { success: false, message: `Error en Supabase: ${insertError.message}` };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error de conexión con Supabase";
      return { success: false, message: msg };
    }
  }

  const listaActualizada = [...usuarios, nuevoUsuario];
  setUsuariosLocales(listaActualizada);
  guardarEvaluadorEnSupabase(limpioNombre);

  return {
    success: true,
    message: `Evaluador "${limpioNombre}" registrado con éxito. Estado: ${estado.toUpperCase()}.`,
    usuario: nuevoUsuario,
  };
}

export async function registrarUsuarioSistema(
  nombre: string,
  email: string,
  password: string
): Promise<{ success: boolean; message: string; usuario?: UsuarioSistema }> {
  const limpioNombre = nombre.trim();
  const limpioEmail = email.trim().toLowerCase();
  const limpioPass = password.trim();

  if (!limpioNombre || !limpioEmail || !limpioPass) {
    return { success: false, message: "Todos los campos son obligatorios." };
  }

  // Traer usuarios existentes
  const usuarios = await cargarUsuariosSistema();
  const existente = usuarios.find((u) => u.email.toLowerCase() === limpioEmail);

  if (existente) {
    if (existente.estado === "pendiente") {
      return {
        success: false,
        message: "Ya existe una solicitud pendiente con este correo. Espera a que la administradora la autorice.",
      };
    }
    return {
      success: false,
      message: "Ya existe una cuenta registrada con este correo electrónico.",
    };
  }

  // Si es la cuenta principal de Gaby Rodriguez, registrar como admin activo
  const esAdmin = limpioEmail === ADMIN_DEFAULT.email.toLowerCase();

  const nuevoUsuario: UsuarioSistema = {
    id: generateUUID(),
    nombre: limpioNombre,
    email: limpioEmail,
    password: limpioPass,
    rol: esAdmin ? "admin" : "evaluador",
    estado: esAdmin ? "activo" : "pendiente",
    createdAt: new Date().toISOString(),
  };

  // Guardar en Supabase si está disponible
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error: insertError } = await supabase.from("usuarios_sistema").insert({
        id: nuevoUsuario.id,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        password: nuevoUsuario.password,
        rol: nuevoUsuario.rol,
        estado: nuevoUsuario.estado,
      });

      if (insertError) {
        console.error("Error al registrar en Supabase:", insertError);
        if (insertError.code === "PGRST205" || insertError.message?.includes("usuarios_sistema")) {
          return {
            success: false,
            message: "La base de datos central en Supabase aún no tiene la tabla de usuarios creada. Pide a la administración que ejecute el script SQL en Supabase para habilitar registros.",
          };
        }
        return {
          success: false,
          message: `No se pudo enviar la solicitud al servidor (${insertError.message || insertError.code}). Por favor intenta de nuevo.`,
        };
      }
    } catch (err) {
      console.warn("Aviso: no se pudo sincronizar usuario en Supabase inmediatamente:", err);
      return {
        success: false,
        message: "No se pudo conectar con el servidor central para enviar tu solicitud. Verifica tu conexión a internet.",
      };
    }
  }

  const listaActualizada = [...usuarios, nuevoUsuario];
  setUsuariosLocales(listaActualizada);

  // Registrar también en el catálogo de evaluadores
  guardarEvaluadorEnSupabase(limpioNombre);

  return {
    success: true,
    message: esAdmin
      ? "Cuenta de administrador lista para iniciar sesión."
      : "Tu solicitud de registro ha sido enviada con éxito. La administradora (Gaby Rodriguez) revisará y autorizará tu cuenta.",
    usuario: nuevoUsuario,
  };
}

export async function iniciarSesionSistema(
  email: string,
  password: string
): Promise<{ success: boolean; message: string; usuario?: UsuarioSistema }> {
  const limpioEmail = email.trim().toLowerCase();
  const limpioPass = password.trim();

  const usuarios = await cargarUsuariosSistema();
  const usuario = usuarios.find((u) => u.email.toLowerCase() === limpioEmail);

  if (usuario) {
    if (usuario.password !== limpioPass) {
      return { success: false, message: "Correo o contraseña incorrectos." };
    }

    if (usuario.estado === "pendiente") {
      return {
        success: false,
        message:
          "Tu solicitud de registro está pendiente de aprobación por la administradora (Gaby Rodriguez). Te notificaremos cuando tu acceso sea autorizado.",
      };
    }

    if (usuario.estado === "rechazado") {
      return {
        success: false,
        message:
          "Tu solicitud de acceso fue rechazada por la administración. Comunícate a seleccion@gestionrh.com.mx para mayor información.",
      };
    }

    setUsuarioActivo(usuario);
    return { success: true, message: `Bienvenido(a), ${usuario.nombre}`, usuario };
  }

  // Acceso de emergencia o respaldo para Gaby Rodriguez si no estuviera en la tabla
  if (
    limpioEmail === ADMIN_DEFAULT.email.toLowerCase() &&
    limpioPass === ADMIN_DEFAULT.password
  ) {
    setUsuarioActivo(ADMIN_DEFAULT);
    return { success: true, message: "Bienvenida Gaby Rodriguez", usuario: ADMIN_DEFAULT };
  }

  return { success: false, message: "Correo o contraseña incorrectos." };
}

export interface ActualizarPerfilInput {
  id: string;
  nombre: string;
  email: string;
  password?: string;
  datosBancarios: DatosBancariosUsuario;
  zonas: string[];
}

export async function actualizarPerfilUsuarioSistema(
  input: ActualizarPerfilInput
): Promise<{ success: boolean; message: string; usuario?: UsuarioSistema }> {
  const limpioNombre = input.nombre.trim();
  const limpioEmail = input.email.trim().toLowerCase();
  const limpioPass = input.password ? input.password.trim() : "";

  if (!limpioNombre || !limpioEmail) {
    return {
      success: false,
      message: "El nombre de usuario y el correo electrónico son obligatorios.",
    };
  }

  const usuarios = await cargarUsuariosSistema();
  let idx = usuarios.findIndex((u) => u.id === input.id);
  if (idx === -1) {
    // Fallback por correo o si era la sesión anterior de admin
    const activo = getUsuarioActivo();
    if (activo) {
      idx = usuarios.findIndex(
        (u) => u.email.toLowerCase() === activo.email.toLowerCase()
      );
    }
  }
  if (idx === -1) {
    return { success: false, message: "No se encontró el usuario para actualizar." };
  }

  const usuarioAnterior = usuarios[idx];

  // Verificar que el nuevo correo no pertenezca a otro usuario distinto
  const duplicado = usuarios.find(
    (u, i) => i !== idx && u.email.toLowerCase() === limpioEmail
  );
  if (duplicado) {
    return {
      success: false,
      message: "Este correo electrónico ya está registrado por otro usuario.",
    };
  }

  const zonasLimpias = Array.from(
    new Set((input.zonas || []).map((z) => z.trim()).filter(Boolean))
  );

  const datosBancariosLimpios: DatosBancariosUsuario = {
    banco: (input.datosBancarios?.banco || "").trim(),
    numeroTarjeta: (input.datosBancarios?.numeroTarjeta || "").trim(),
    clabe: (input.datosBancarios?.clabe || "").trim(),
  };

  const actualizado: UsuarioSistema = {
    ...usuarioAnterior,
    nombre: limpioNombre,
    email: limpioEmail,
    password: limpioPass ? limpioPass : usuarioAnterior.password,
    datosBancarios: datosBancariosLimpios,
    zonas: zonasLimpias,
    updatedAt: new Date().toISOString(),
  };

  usuarios[idx] = actualizado;
  setUsuariosLocales(usuarios);

  // Si es el usuario con sesión activa en este navegador, actualizar sesión inmediatamente
  const activoActual = getUsuarioActivo();
  if (
    activoActual &&
    (activoActual.id === usuarioAnterior.id ||
      activoActual.email.toLowerCase() === usuarioAnterior.email.toLowerCase())
  ) {
    setUsuarioActivo(actualizado);
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error: updateErr } = await supabase
        .from("usuarios_sistema")
        .update({
          nombre: actualizado.nombre,
          email: actualizado.email,
          ...(limpioPass ? { password: actualizado.password } : {}),
          updated_at: actualizado.updatedAt,
        })
        .eq("id", actualizado.id);

      if (updateErr) {
        return {
          success: false,
          message: `Error al actualizar en Supabase: ${updateErr.message}`,
        };
      }

      // Guardar datos bancarios y zonas en la tabla sincronizada en la nube
      await guardarMetaPerfilEnSupabase(actualizado);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al guardar en la nube";
      return { success: false, message: msg };
    }
  }

  // Si cambió su nombre, registrar el nuevo nombre en el catálogo y actualizar sus estudios previos
  const nombrePrevio = usuarioAnterior.nombre.trim();
  if (nombrePrevio.toLowerCase() !== limpioNombre.toLowerCase()) {
    guardarEvaluadorEnSupabase(limpioNombre);
    try {
      const estudiosLocales = getLocalEstudios();
      let huboCambios = false;
      for (const est of estudiosLocales) {
        if ((est.evaluadorNombre || "").trim().toLowerCase() === nombrePrevio.toLowerCase()) {
          est.evaluadorNombre = limpioNombre;
          huboCambios = true;
          if (supabase) {
            supabase
              .from("estudios_socioeconomicos")
              .update({
                data: est,
                updated_at: new Date().toISOString(),
              })
              .eq("id", est.id)
              .then(() => {});
          }
        }
      }
      if (huboCambios) {
        setLocalEstudios(estudiosLocales);
        invalidarCacheLectura();
      }
    } catch {
      // ignore
    }
  }

  return {
    success: true,
    message: "Perfil, datos bancarios y zonas actualizados correctamente.",
    usuario: actualizado,
  };
}

export async function actualizarEstadoUsuarioSistema(
  id: string,
  nuevoEstado: EstadoUsuario,
  nuevoRol?: RolUsuario
): Promise<{ success: boolean; error?: string }> {
  const usuarios = await cargarUsuariosSistema();
  const idx = usuarios.findIndex((u) => u.id === id);
  if (idx === -1) return { success: false, error: "Usuario no encontrado" };

  usuarios[idx] = {
    ...usuarios[idx],
    estado: nuevoEstado,
    ...(nuevoRol ? { rol: nuevoRol } : {}),
    updatedAt: new Date().toISOString(),
  };

  setUsuariosLocales(usuarios);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase
        .from("usuarios_sistema")
        .update({
          estado: nuevoEstado,
          ...(nuevoRol ? { rol: nuevoRol } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al actualizar usuario";
      return { success: false, error: msg };
    }
  }

  return { success: true };
}

export async function eliminarUsuarioSistema(
  id: string
): Promise<{ success: boolean; error?: string }> {
  let usuarios = await cargarUsuariosSistema();
  const target = usuarios.find((u) => u.id === id);
  if (!target) return { success: false, error: "Usuario no encontrado" };

  if (target.rol === "admin" && target.email.toLowerCase() === ADMIN_DEFAULT.email.toLowerCase()) {
    return {
      success: false,
      error: "No se puede eliminar la cuenta principal de administración.",
    };
  }

  usuarios = usuarios.filter((u) => u.id !== id);
  setUsuariosLocales(usuarios);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from("usuarios_sistema").delete().eq("id", id);
      await supabase
        .from("evaluadores")
        .delete()
        .like("nombre", `${PERFIL_META_PREFIX}${id}:%`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al eliminar usuario";
      return { success: false, error: msg };
    }
  }

  return { success: true };
}

export function suscribirUsuariosRealtime(
  onCambio: () => void
): () => void {
  const supabase = getSupabaseClient();
  if (!supabase) return () => {};

  try {
    const channel = supabase
      .channel("usuarios_realtime_broadcast")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "usuarios_sistema",
        },
        () => {
          onCambio();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "evaluadores",
        },
        () => {
          onCambio();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch {
    return () => {};
  }
}
