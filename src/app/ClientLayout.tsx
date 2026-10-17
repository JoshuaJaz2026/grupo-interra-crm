"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar"; 

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const esLogin = pathname === "/login" || pathname === "/";

  if (esLogin) {
    return <main className="w-full min-h-screen bg-white">{children}</main>;
  }

  return (
    <div className="flex h-screen w-full bg-[#0f172a] overflow-hidden">
      
      {/* El menú lateral entra de forma normal */}
      <Sidebar />

      {/* 
        🫧 EL EFECTO BURBUJA OPTIMIZADO
        Usamos las clases nativas de Tailwind (animate-in fade-in zoom-in-95).
        Como están en el Layout principal, el efecto SOLO ocurrirá una vez 
        al saltar del Login al Dashboard. Al navegar entre secciones, será instantáneo.
      */}
      <main 
        className="flex-1 flex flex-col h-screen overflow-auto bg-[#f8fafc] sm:rounded-tl-[32px] origin-center animate-in fade-in zoom-in-[0.97] duration-1000 ease-out"
      >
        {children}
      </main>
      
    </div>
  );
}