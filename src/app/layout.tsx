import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "./ClientLayout";

// 🔥 Importamos la fuente profesional Inter
const inter = Inter({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "900"] 
});

export const metadata: Metadata = {
  title: "Grupo Interra CRM",
  description: "Plataforma de Inteligencia Comercial y Gestión de Leads",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      {/* Aplicamos la fuente a todo el sistema */}
      <body className={`${inter.className} antialiased bg-white`}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}