import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from "./ClientLayout";

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
      <body 
        className="antialiased bg-white"
        style={{ 
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" 
        }}
      >
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}