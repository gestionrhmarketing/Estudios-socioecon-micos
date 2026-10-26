"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Pen, Trash2, Check, X, RotateCcw } from "lucide-react";

interface SignaturePadModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
  initialDataUrl?: string;
}

export function SignaturePadModal({
  isOpen,
  title,
  subtitle,
  onClose,
  onSave,
  initialDataUrl,
}: SignaturePadModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Inicializar canvas y cargar firma previa si existe
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Retina display support
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#111827"; // Color tinta oscura profesional

    // Fondo transparente para PNG limpio
    ctx.clearRect(0, 0, rect.width, rect.height);

    if (initialDataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasDrawn(true);
      };
      img.src = initialDataUrl;
    } else {
      setHasDrawn(false);
    }
  }, [initialDataUrl]);

  useEffect(() => {
    if (isOpen) {
      // Pequeño timeout para asegurar que el modal se renderizó y tiene dimensiones
      const timer = setTimeout(() => {
        initCanvas();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initCanvas]);

  if (!isOpen) return null;

  // Obtener coordenadas normalizadas
  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ("touches" in e) {
      if (e.touches.length > 0) {
        return {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top,
        };
      }
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
    return { x: 0, y: 0 };
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.closePath();
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    setHasDrawn(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Exportar como PNG con fondo transparente
    const dataUrl = canvas.toDataURL("image/png");
    onSave(dataUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Cabecera del Modal */}
        <div className="px-5 py-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#E31E24]/20 border border-[#E31E24]/40 text-[#ff4d53]">
              <Pen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">{title}</h3>
              <p className="text-xs text-gray-300">
                {subtitle || "Dibuja la firma con tu dedo o ratón"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Área del Canvas */}
        <div className="p-5 bg-gray-50 flex flex-col items-center">
          <div className="relative w-full h-[220px] bg-white rounded-xl border-2 border-dashed border-gray-300 shadow-inner overflow-hidden flex items-center justify-center">
            <canvas
              ref={canvasRef}
              className="w-full h-full cursor-crosshair touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />

            {/* Guía visual para firmar */}
            <div className="pointer-events-none absolute bottom-8 left-10 right-10 border-b border-gray-300 flex justify-between text-[11px] text-gray-400 px-2 pb-1">
              <span>Línea de firma</span>
              <span>X</span>
            </div>

            {!hasDrawn && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-gray-400 text-sm font-medium gap-2">
                <Pen className="w-4 h-4 opacity-50" />
                <span>Traza tu firma aquí</span>
              </div>
            )}
          </div>

          <div className="w-full flex items-center justify-between mt-3 text-xs text-gray-500">
            <span>Compatible con celular, tablet y mouse</span>
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar trazo</span>
            </button>
          </div>
        </div>

        {/* Pie de acciones */}
        <div className="px-5 py-3.5 bg-white border-t border-gray-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasDrawn}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E31E24] text-white text-xs font-bold hover:bg-[#B81419] shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" />
            <span>Aceptar y Guardar Firma</span>
          </button>
        </div>
      </div>
    </div>
  );
}
