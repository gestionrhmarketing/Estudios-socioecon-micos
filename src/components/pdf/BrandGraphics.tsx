import React from "react";

export function LogoGestionRH({ className = "h-12" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Esfera estilizada con líneas de onda */}
      <svg
        viewBox="0 0 64 64"
        className="h-10 w-10 shrink-0"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="32" cy="32" r="28" fill="#8C8D90" />
        <path
          d="M6 26C18 22 30 28 44 42C50 48 54 50 58 50"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M4 34C16 30 28 36 42 50C46 54 50 56 54 56"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M8 42C18 39 28 44 38 56"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M14 50C21 48 27 52 33 59"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
      <div className="flex flex-col leading-none">
        <div className="flex items-baseline tracking-tight text-[24px]">
          <span className="font-light text-[#6D6E71]">Gestión</span>
          <span className="font-bold text-[#E31E24] ml-1">rh</span>
          <span className="text-[#8C8D90] text-xs ml-0.5">.</span>
        </div>
        <div className="w-full h-[1.5px] bg-[#8C8D90] my-0.5" />
        <span className="text-[7.5px] tracking-[0.22em] text-[#6D6E71] font-medium uppercase text-right">
          SOLUCIÓN INTEGRAL
        </span>
      </div>
    </div>
  );
}

export function IconDocumentoCandidato({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="8"
        y="6"
        width="36"
        height="48"
        rx="4"
        stroke="#E31E24"
        strokeWidth="4"
        fill="white"
      />
      <line x1="16" y1="18" x2="36" y2="18" stroke="#E31E24" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="16" y1="27" x2="32" y2="27" stroke="#E31E24" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="16" y1="36" x2="28" y2="36" stroke="#E31E24" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="44" cy="38" r="7" fill="white" stroke="#E31E24" strokeWidth="3.5" />
      <path
        d="M32 56C32 49.5 37.5 46 44 46C50.5 46 56 49.5 56 56"
        stroke="#E31E24"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="white"
      />
    </svg>
  );
}

export function QRCodeGestionRH({ className = "w-20 h-20" }: { className?: string }) {
  // QR estilizado en SVG limpio apuntando visualmente al sitio oficial
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="#111111"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="100" height="100" fill="white" />
      {/* Esquina sup izq */}
      <path d="M8,8 h26 v26 h-26 z M13,13 v16 h16 v-16 z M17,17 h8 v8 h-8 z" />
      {/* Esquina sup der */}
      <path d="M66,8 h26 v26 h-26 z M71,13 v16 h16 v-16 z M75,17 h8 v8 h-8 z" />
      {/* Esquina inf izq */}
      <path d="M8,66 h26 v26 h-26 z M13,71 v16 h16 v-16 z M17,75 h8 v8 h-8 z" />
      {/* Módulos internos decorativos de alta densidad */}
      <rect x="38" y="8" width="5" height="5" />
      <rect x="48" y="8" width="5" height="10" />
      <rect x="58" y="13" width="4" height="5" />
      <rect x="38" y="18" width="10" height="5" />
      <rect x="53" y="23" width="8" height="5" />
      <rect x="38" y="28" width="5" height="6" />
      <rect x="8" y="38" width="5" height="5" />
      <rect x="18" y="38" width="10" height="5" />
      <rect x="33" y="38" width="5" height="10" />
      <rect x="43" y="38" width="15" height="5" />
      <rect x="63" y="38" width="5" height="10" />
      <rect x="73" y="38" width="10" height="5" />
      <rect x="87" y="38" width="5" height="10" />
      <rect x="13" y="48" width="5" height="10" />
      <rect x="23" y="48" width="5" height="5" />
      <rect x="38" y="48" width="10" height="10" />
      <rect x="53" y="48" width="5" height="5" />
      <rect x="68" y="48" width="10" height="5" />
      <rect x="8" y="58" width="10" height="4" />
      <rect x="28" y="53" width="5" height="9" />
      <rect x="48" y="58" width="10" height="5" />
      <rect x="63" y="53" width="5" height="10" />
      <rect x="78" y="53" width="9" height="5" />
      <rect x="38" y="66" width="5" height="10" />
      <rect x="48" y="68" width="10" height="5" />
      <rect x="63" y="68" width="15" height="5" />
      <rect x="83" y="66" width="9" height="5" />
      <rect x="43" y="78" width="5" height="14" />
      <rect x="53" y="78" width="10" height="5" />
      <rect x="68" y="78" width="5" height="10" />
      <rect x="78" y="76" width="14" height="5" />
      <rect x="38" y="87" width="5" height="5" />
      <rect x="58" y="87" width="5" height="5" />
      <rect x="73" y="87" width="10" height="5" />
      <rect x="87" y="85" width="5" height="7" />
    </svg>
  );
}

export function SectionBanner({ title }: { title: string }) {
  return (
    <div className="relative w-full h-10 bg-[#E31E24] flex items-center justify-center overflow-hidden my-2 shrink-0">
      {/* Esquina superior izquierda gris con corte diagonal blanco como en el PDF */}
      <div
        className="absolute left-0 top-0 bottom-0 w-10 bg-[#6D6E71]"
        style={{ clipPath: "polygon(0 0, 85% 0, 15% 100%, 0% 100%)" }}
      />
      <div
        className="absolute left-0 top-0 bottom-0 w-11 bg-white"
        style={{ clipPath: "polygon(78% 0, 90% 0, 22% 100%, 10% 100%)" }}
      />
      <h2 className="text-white font-bold text-[15px] tracking-wide z-10 px-8 text-center">
        {title}
      </h2>
    </div>
  );
}

export function PageFooter({ variant = "standard" }: { variant?: "cover" | "standard" }) {
  if (variant === "cover") {
    return (
      <div className="relative w-full pt-3 pb-4 px-8 mt-auto overflow-hidden select-none shrink-0">
        {/* Esquina roja e izquierda gris oscura de la portada */}
        <div
          className="absolute left-0 bottom-0 w-44 h-36 bg-[#E31E24]"
          style={{ clipPath: "polygon(0 0, 100% 100%, 0 100%)" }}
        />
        <div
          className="absolute left-0 bottom-0 w-36 h-28 bg-[#3C3C3B]"
          style={{ clipPath: "polygon(0 15%, 88% 100%, 0 100%)" }}
        />
        {/* Esfera blanca en la esquina */}
        <div className="absolute left-5 bottom-3 z-10">
          <svg viewBox="0 0 64 64" className="h-11 w-11" fill="none">
            <circle cx="32" cy="32" r="28" fill="white" />
            <path d="M6 26C18 22 30 28 44 42C50 48 54 50 58 50" stroke="#3C3C3B" strokeWidth="2.5" />
            <path d="M4 34C16 30 28 36 42 50C46 54 50 56 54 56" stroke="#3C3C3B" strokeWidth="2.2" />
            <path d="M8 42C18 39 28 44 38 56" stroke="#3C3C3B" strokeWidth="2" />
          </svg>
        </div>

        <div className="relative z-10 ml-32 flex items-center justify-between text-[10px] text-[#3C3C3B]">
          <div>
            <div className="font-bold text-[13px] text-black">Contacto</div>
            <div className="text-[#555]">contacto@gestionrh.com.mx</div>
            <div className="text-[#999] tracking-wider">+52 55 1949 1693</div>
          </div>

          <div className="h-8 w-[1.5px] bg-[#E31E24]" />

          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full border border-[#E31E24] flex items-center justify-center text-[7px] text-[#E31E24] font-bold">
              rh
            </div>
            <span className="text-[#E31E24] font-bold text-lg">rh</span>
          </div>

          <div className="h-8 w-[1.5px] bg-[#E31E24]" />

          <div>
            <div className="font-semibold text-black">gestionrh.com.mx</div>
            <div className="text-[#555]">Metepec, Estado de Méx.</div>
          </div>

          <div className="h-8 w-[1.5px] bg-[#E31E24]" />

          <div className="text-[#999] text-sm font-light tracking-widest">2026</div>

          <QRCodeGestionRH className="w-16 h-16" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mt-auto pt-2 select-none shrink-0">
      <div className="border-t border-gray-300 mx-8 pt-2 pb-1.5 flex items-center justify-between text-[9.5px] text-[#3C3C3B]">
        <div className="font-bold text-[13px] text-black">Contacto</div>

        <div>
          <div className="text-[#444]">contacto@gestionrh.com.mx</div>
          <div className="text-[#999] tracking-wider">+52 55 1949 1693</div>
        </div>

        <div className="h-7 w-[1px] bg-[#E31E24]" />

        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full border border-[#E31E24] flex items-center justify-center text-[6px] text-[#E31E24] font-bold">
            rh
          </div>
          <span className="text-[#E31E24] font-bold text-base">rh</span>
        </div>

        <div className="h-7 w-[1px] bg-[#E31E24]" />

        <div>
          <div className="font-semibold text-black">gestionrh.com.mx</div>
          <div className="text-[#555]">Metepec, Estado de Méx.</div>
        </div>

        <div className="h-7 w-[1px] bg-[#E31E24]" />

        <div className="text-[#999] text-xs font-light tracking-widest">2026</div>

        <QRCodeGestionRH className="w-14 h-14" />
      </div>
      <div className="w-full h-3 bg-[#E31E24]" />
    </div>
  );
}
