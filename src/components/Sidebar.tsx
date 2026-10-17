"use client";

import Link from "next/link";
import { LayoutDashboard, Users, Star, BarChart3, ShieldCheck } from "lucide-react";
import { usePathname } from "next/navigation";

export function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { nombre: "1. Resumen Comercial", ruta: "/dashboard", icono: LayoutDashboard },
    { nombre: "2. Seguimiento de Leads", ruta: "/seguimiento", icono: Users },
    { nombre: "3. Lead Scoring", ruta: "/lead-scoring", icono: Star, diferenciador: true },
    { nombre: "4. Desempeño Comercial", ruta: "/desempeno", icono: BarChart3 },
    { nombre: "5. Gestión de Asesores", ruta: "/asesores", icono: ShieldCheck }, // 🔥 NUEVO MÓDULO
  ];

  return (
    <aside className="w-64 bg-[#0B1120] text-white h-screen fixed flex flex-col border-r border-slate-800 z-50">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="bg-blue-600 text-white font-bold text-xl p-2 rounded-lg flex items-center justify-center w-10 h-10">GI</div>
        <div>
          <h2 className="font-bold tracking-tight text-white leading-tight">GRUPO INTERRA</h2>
          <p className="text-[10px] text-blue-400 font-semibold uppercase">Cusco Inmobiliario</p>
        </div>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <p className="text-xs text-slate-500 font-semibold mb-4 px-3 uppercase tracking-wider">Inteligencia Comercial</p>
        {menuItems.map((item) => {
          const isActive = pathname === item.ruta;
          return (
            <Link
              key={item.ruta}
              href={item.ruta}
              className={`flex items-center justify-between px-3 py-3 rounded-lg font-medium transition-all duration-200 ${
                isActive ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icono className="w-5 h-5" />
                <span className="text-sm">{item.nombre}</span>
              </div>
              {item.diferenciador && (
                <span className="bg-amber-500/20 text-amber-400 text-[10px] px-2 py-0.5 rounded uppercase font-bold">
                  Diferenciador
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}