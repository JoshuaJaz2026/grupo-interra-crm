"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, Star, BarChart3, ShieldCheck, LogOut } from "lucide-react";
import { cerrarSesion } from "@/app/login/actions"; 

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter(); 

  // 👇 El menú reordenado
  const menu = [
    { name: "1. Resumen Comercial", path: "/dashboard", icon: LayoutDashboard },
    { name: "2. Desempeño Comercial", path: "/desempeno", icon: BarChart3 },
    { name: "3. Seguimiento de Leads", path: "/seguimiento", icon: Users },
    { name: "4. Lead Scoring", path: "/lead-scoring", icon: Star, badge: "DIFERENCIADOR" },
    { name: "5. Gestión de Asesores", path: "/asesores", icon: ShieldCheck },
  ];

  const handleLogout = async () => {
    await cerrarSesion(); 
    router.push("/login"); 
  };

  return (
    <aside className="w-64 h-full bg-[#0f172a] text-slate-300 hidden md:flex flex-col shrink-0">
      {/* 🚀 LOGO INTERRA */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white text-lg shadow-lg">
          GI
        </div>
        <div>
          <h1 className="font-black text-white tracking-tight leading-none text-sm">GRUPO INTERRA</h1>
          <span className="text-[9px] text-blue-400 font-black tracking-widest">CUSCO INMOBILIARIO</span>
        </div>
      </div>

      {/* 📋 NAVEGACIÓN */}
      <div className="px-4 py-4 flex-1">
        <p className="text-[11px] font-black text-slate-500 mb-4 tracking-widest uppercase px-2">
          Inteligencia Comercial
        </p>
        <nav className="flex flex-col gap-1.5">
          {menu.map((item) => {
            const isActive = pathname.startsWith(item.path);
            return (
              <Link href={item.path} key={item.path}>
                <div
                  className={`flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer transition-all font-bold text-[13px] ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md"
                      : "hover:bg-slate-800 hover:text-white text-slate-400"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </div>
                  {item.badge && (
                    <span className="text-[8px] bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded-md tracking-widest uppercase font-black border border-amber-500/20">
                      {item.badge}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* 🚪 BOTÓN CERRAR SESIÓN */}
      <div className="p-4 mt-auto border-t border-slate-800/50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all font-bold text-[13px] hover:bg-rose-500/10 hover:text-rose-400 text-slate-400"
        >
          <LogOut className="w-5 h-5" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}