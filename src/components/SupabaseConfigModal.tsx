"use client";

import React, { useState } from "react";
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  getSupabaseClient,
} from "@/lib/storage";
import { Database, X, CheckCircle2, AlertCircle, Copy, Check } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated: () => void;
}

const SQL_SNIPPET = `create table if not exists public.estudios_socioeconomicos (
  id uuid primary key default gen_random_uuid(),
  folio text not null,
  candidato_nombre text not null default '',
  puesto text not null default '',
  dictamen text not null default 'ACEPTABLE',
  fecha_realizacion text not null default '',
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.estudios_socioeconomicos enable row level security;

create policy "Permitir acceso completo a estudios_socioeconomicos"
  on public.estudios_socioeconomicos for all using (true) with check (true);`;

export function SupabaseConfigModal({
  isOpen,
  onClose,
  onConfigUpdated,
}: Props) {
  const current = getSupabaseConfig();
  const [url, setUrl] = useState(current?.url || "");
  const [anonKey, setAnonKey] = useState(current?.anonKey || "");
  const [status, setStatus] = useState<{
    type: "idle" | "testing" | "ok" | "error";
    msg?: string;
  }>({ type: "idle" });
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSaveAndTest = async () => {
    if (!url.trim() || !anonKey.trim()) {
      saveSupabaseConfig(null);
      onConfigUpdated();
      onClose();
      return;
    }

    setStatus({ type: "testing", msg: "Verificando conexión con Supabase..." });
    saveSupabaseConfig({ url: url.trim(), anonKey: anonKey.trim() });

    const client = getSupabaseClient();
    if (!client) {
      setStatus({ type: "error", msg: "URL de Supabase inválida." });
      return;
    }

    const { error } = await client
      .from("estudios_socioeconomicos")
      .select("id")
      .limit(1);

    if (error) {
      setStatus({
        type: "error",
        msg: `Conectado al proyecto, pero falta crear la tabla: ${error.message}`,
      });
    } else {
      setStatus({
        type: "ok",
        msg: "¡Conexión exitosa! Sincronización en la nube activada.",
      });
      setTimeout(() => {
        onConfigUpdated();
        onClose();
      }, 900);
    }
  };

  const copySql = () => {
    navigator.clipboard.writeText(SQL_SNIPPET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">
              Configuración de Base de Datos en la Nube (Supabase)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          <p className="text-xs text-gray-600 leading-relaxed">
            La aplicación guarda automáticamente en tu dispositivo y sincroniza en tiempo real con{" "}
            <span className="font-bold text-gray-900">Supabase</span>. Ingresa tu{" "}
            <code className="bg-gray-100 px-1.5 py-0.5 rounded">Project URL</code> y{" "}
            <code className="bg-gray-100 px-1.5 py-0.5 rounded">anon public key</code>{" "}
            (o configúralas en <code className="bg-gray-100 px-1.5 py-0.5 rounded">.env.local</code>).
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                Supabase Project URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm font-mono focus:border-[#E31E24] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                Supabase Anon / Public Key
              </label>
              <input
                type="password"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm font-mono focus:border-[#E31E24] focus:outline-none"
              />
            </div>
          </div>

          {status.type !== "idle" && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                status.type === "ok"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : status.type === "error"
                  ? "bg-red-50 text-red-800 border border-red-200"
                  : "bg-blue-50 text-blue-800 border border-blue-200"
              }`}
            >
              {status.type === "ok" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{status.msg}</span>
            </div>
          )}

          {/* SQL Script para crear la tabla en 1 clic */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-700">
                SQL para inicializar la tabla en Supabase (SQL Editor):
              </span>
              <button
                type="button"
                onClick={copySql}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar SQL</span>
                  </>
                )}
              </button>
            </div>
            <pre className="text-[11px] font-mono bg-gray-900 text-gray-200 p-3 rounded-lg overflow-x-auto leading-relaxed">
              {SQL_SNIPPET}
            </pre>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setUrl("");
              setAnonKey("");
              saveSupabaseConfig(null);
              onConfigUpdated();
              onClose();
            }}
            className="text-xs font-semibold text-gray-500 hover:text-red-600"
          >
            Usar solo almacenamiento local
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveAndTest}
              className="px-5 py-2 rounded-xl bg-[#E31E24] text-white text-xs font-bold hover:bg-[#B81419]"
            >
              Guardar y Conectar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
