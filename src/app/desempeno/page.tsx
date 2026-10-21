"use client";

import { useState, useEffect, useRef } from "react";
import { TrendingUp, Users, Target, BarChart3, ArrowUpRight, ArrowDownRight, CalendarDays, Loader2, ChevronDown, Check } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { obtenerMetricasDesempeno } from "./actions"; 

export default function DesempenoPage() {
  const [filtro, setFiltro] = useState("Últimos 30 días");
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [fechasCustom, setFechasCustom] = useState({ inicio: "", fin: "" });
  const [cargando, setCargando] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Añadimos espacios para los arreglos de datos de los gráficos
  const [datosMetricas, setDatosMetricas] = useState({
    tasaConversion: "0.0%",
    leadsGestionados: "0",
    tiempoRespuesta: "0m",
    oportunidadesPerdidas: "0",
    graficoEvolucion: [] as any[],
    graficoAsesores: [] as any[]
  });

  const opcionesFiltro = [
    { label: "Rápidos", items: ["Últimos 30 días", "Este mes", "Mes anterior", "Este año"] },
    { label: "Años Históricos", items: ["2026", "2025", "2024"] },
    { label: "Avanzado", items: ["Personalizado"] }
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMenuAbierto(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function cargarDatos() {
      if (filtro === "Personalizado" && (!fechasCustom.inicio || !fechasCustom.fin)) return; 
      
      setCargando(true);
      const res = await obtenerMetricasDesempeno(filtro, fechasCustom.inicio, fechasCustom.fin);
      if (res.exito && res.datos) {
        setDatosMetricas(res.datos as any);
      }
      setCargando(false);
    }
    cargarDatos();
  }, [filtro, fechasCustom]);

  const seleccionarOpcion = (opcion: string) => {
    setFiltro(opcion);
    if (opcion !== "Personalizado") setFechasCustom({ inicio: "", fin: "" });
    setMenuAbierto(false);
  };

  const metricas = [
    { titulo: "Tasa de Conversión", valor: datosMetricas.tasaConversion, cambio: "+1.2%", tendencia: "sube", icono: Target, color: "text-blue-500", bg: "bg-blue-50" },
    { titulo: "Leads Gestionados", valor: datosMetricas.leadsGestionados, cambio: "+12%", tendencia: "sube", icono: Users, color: "text-indigo-500", bg: "bg-indigo-50" },
    { titulo: "Tiempo Prom. Respuesta", valor: datosMetricas.tiempoRespuesta, cambio: "-2m", tendencia: "mejora", icono: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50" },
    { titulo: "Oportunidades Perdidas", valor: datosMetricas.oportunidadesPerdidas, cambio: "+5%", tendencia: "baja", icono: BarChart3, color: "text-rose-500", bg: "bg-rose-50" },
  ];

  return (
    <div className="flex-1 w-full h-full p-8 overflow-y-auto bg-[#f8fafc]">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Desempeño Comercial</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Análisis de métricas, conversión y rendimiento del equipo.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 relative" ref={dropdownRef}>
          {filtro === "Personalizado" && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
              <input 
                type="date" 
                className="h-10 bg-white border border-slate-200 px-3 rounded-xl text-sm font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all cursor-pointer"
                value={fechasCustom.inicio}
                onChange={(e) => setFechasCustom({ ...fechasCustom, inicio: e.target.value })}
              />
              <span className="text-slate-400 font-bold">-</span>
              <input 
                type="date" 
                className="h-10 bg-white border border-slate-200 px-3 rounded-xl text-sm font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all cursor-pointer"
                value={fechasCustom.fin}
                onChange={(e) => setFechasCustom({ ...fechasCustom, fin: e.target.value })}
              />
            </div>
          )}

          <div className="relative">
            <button 
              onClick={() => setMenuAbierto(!menuAbierto)}
              className="h-10 flex items-center gap-2.5 bg-white border border-slate-200 px-4 rounded-xl shadow-sm hover:border-blue-400 hover:shadow transition-all group"
            >
              <CalendarDays className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
              <span className="text-sm font-bold text-slate-700">{filtro}</span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${menuAbierto ? 'rotate-180' : ''}`} />
            </button>

            {menuAbierto && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] p-2 z-50 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200 origin-top-right">
                {opcionesFiltro.map((grupo, idx) => (
                  <div key={idx} className="mb-2 last:mb-0">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-1.5">{grupo.label}</h4>
                    <div className="flex flex-col gap-0.5">
                      {grupo.items.map(opcion => (
                        <button
                          key={opcion}
                          onClick={() => seleccionarOpcion(opcion)}
                          className={`flex items-center justify-between w-full px-3 py-2 text-sm font-bold rounded-xl transition-all ${
                            filtro === opcion 
                            ? 'bg-blue-50 text-blue-600' 
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          {opcion}
                          {filtro === opcion && <Check className="w-4 h-4 text-blue-500" />}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metricas.map((metrica, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${metrica.bg} group-hover:scale-110 transition-transform duration-300`}>
                <metrica.icono className={`w-6 h-6 ${metrica.color}`} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${
                metrica.tendencia === "baja" ? "text-rose-600 bg-rose-50" : "text-emerald-600 bg-emerald-50"
              }`}>
                {metrica.tendencia === "baja" ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                {metrica.cambio}
              </div>
            </div>
            <h3 className="text-slate-500 text-sm font-bold">{metrica.titulo}</h3>
            <div className="mt-1 flex items-center h-10"> 
              {cargando ? (
                 <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
              ) : (
                 <p className="text-3xl font-black text-slate-900 tracking-tight animate-in fade-in slide-in-from-bottom-2 duration-300">{metrica.valor}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 🚀 ZONA DE GRÁFICOS REALES CON RECHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* GRÁFICO DE LÍNEAS (EVOLUCIÓN) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm min-h-[400px] flex flex-col">
          <h3 className="text-slate-800 font-bold mb-6">Evolución de Cierres vs Leads</h3>
          <div className="flex-1 w-full h-full relative">
            {cargando && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            )}
            
            {datosMetricas.graficoEvolucion.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={datosMetricas.graficoEvolucion} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                    cursor={{ stroke: '#f1f5f9', strokeWidth: 2 }}
                  />
                  {/* 🔥 AHORA LOS PUNTOS TIENEN RELLENO SÓLIDO PARA MAYOR VISIBILIDAD */}
                  <Line type="monotone" dataKey="leads" name="Leads Entrantes" stroke="#818cf8" strokeWidth={3} dot={{ r: 6, strokeWidth: 2, fill: "#818cf8" }} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="cierres" name="Cierres Ganados" stroke="#34d399" strokeWidth={3} dot={{ r: 6, strokeWidth: 2, fill: "#34d399" }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50">
                <p className="text-slate-400 font-medium text-sm">No hay datos suficientes para este período.</p>
              </div>
            )}
          </div>
        </div>

        {/* GRÁFICO DE BARRAS HORIZONTALES (ASESORES) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm min-h-[400px] flex flex-col">
          <h3 className="text-slate-800 font-bold mb-6">Conversión por Asesor</h3>
          <div className="flex-1 w-full h-full relative">
            {cargando && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            )}
            
            {datosMetricas.graficoAsesores.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={datosMetricas.graficoAsesores} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} hide />
                  <YAxis dataKey="nombre" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} width={80} />
                  <RechartsTooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                    formatter={(value: any) => [`${value}%`, 'Efectividad (Ganados/Total)']}
                  />
                  <Bar dataKey="conversion" radius={[0, 4, 4, 0]} barSize={32}>
                    {datosMetricas.graficoAsesores.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#cbd5e1'} /> 
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50">
                <p className="text-slate-400 font-medium text-sm text-center">Sin actividad de asesores.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}