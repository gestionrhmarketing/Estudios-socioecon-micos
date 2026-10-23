import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gestión rh | Sistema de Estudios Socioeconómicos 2026",
  description:
    "Plataforma web y móvil para captura, gestión y generación de Estudios Socioeconómicos oficiales de Gestión rh.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased bg-[#f4f5f7] text-[#1e1e1e]">{children}</body>
    </html>
  );
}
