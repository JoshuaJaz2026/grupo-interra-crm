import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dashboard Interra UTEC",
  description: "Inteligencia Comercial y Gestión de Leads",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-slate-50 min-h-screen flex text-slate-900`}>
        {/* Barra Lateral Fija */}
        <Sidebar />
        
        {/* Contenido Principal a la Derecha */}
        <main className="flex-1 ml-64 overflow-x-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}