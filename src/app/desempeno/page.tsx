"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Users, Target, BarChart3, ArrowUpRight, ArrowDownRight, CalendarDays, Loader2 } from "lucide-react";
import { obtenerMetricasDesempeno } from "./actions"; // Importamos el action

export default function DesempenoPage() {
  const [filtro, setFiltro] = useState("Últimos 30 días");
  const [cargando, setCargando] = useState(true);
  
  // Estado para almacenar los datos reales
  const [datosMetricas, setDatosMetricas] = useState({
    tasaConversion: "0.0%",
    leadsGestionados: "0",
    tiempoRespuesta: "0m",
    oportunidadesPerdidas: "0"
  });

  // Efecto que se dispara al cargar o al cambiar el filtro
  useEffect(() => {
    async function cargarDatos() {
      setCargando(true);
      const res = await obtenerMetricasDesempeno(filtro);
      if (res.exito && res.datos) {
        setDatosMetricas(res.datos);
      }
      setCargando(false);
    }
    
    cargarDatos();
  }, [filtro]);

  // Estructura visual de las tarjetas mapeada a los datos reales
  const metricas = [
    { titulo: "Tasa de Conversión", valor: datosMetricas.tasaConversion, cambio: "+1.2%", tendencia: "sube", icono: Target, color: "text-blue-500", bg: "bg-blue-50" },
    { titulo: "Leads Gestionados", valor: datosMetricas.leadsGestionados, cambio: "+12%", tendencia: "sube", icono: Users, color: "text-indigo-500", bg: "bg-indigo-50" },
    { titulo: "Tiempo Prom. Respuesta", valor: datosMetricas.tiempoRespuesta, cambio: "-2m", tendencia: "mejora", icono: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50" },
    { titulo: "Oportunidades Perdidas", valor: datosMetricas.oportunidadesPerdidas, cambio: "+5%", tendencia: "baja", icono: BarChart3, color: "text-rose-500", bg: "bg-rose-50" },
  ];

  return (
    <div className="flex-1 w-full h-full p-8 overflow-y-auto">
      
      {/* 📋 CABECERA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Desempeño Comercial</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Análisis de métricas, conversión y rendimiento del equipo.
          </p>
        </div>
        
        {/* Filtro de tiempo interactivo */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm hover:border-blue-400 transition-colors">
          <CalendarDays className="w-4 h-4 text-slate-400" />
          <select 
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="Últimos 30 días">Últimos 30 días</option>
            <option value="Este mes">Este mes</option>
            <option value="Mes anterior">Mes anterior</option>
            <option value="Este año">Este año</option>
          </select>
        </div>
      </div>

      {/* 📈 TARJETAS DE MÉTRICAS (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metricas.map((metrica, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${metrica.bg}`}>
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
            
            {/* Estado de carga individual para el valor */}
            <div className="mt-1 flex items-center h-9"> 
              {cargando ? (
                 <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
              ) : (
                 <p className="text-3xl font-black text-slate-900 animate-in fade-in slide-in-from-bottom-2 duration-300">{metrica.valor}</p>
              )}
            </div>

          </div>
        ))}
      </div>

      {/* 📊 SECCIÓN DE GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico Principal */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm min-h-[400px] flex flex-col">
          <h3 className="text-slate-800 font-bold mb-6">Evolución de Cierres vs Leads</h3>
          <div className="flex-1 border-2 border-dashed border-slate-100 rounded-xl flex items-center justify-center bg-slate-50 relative overflow-hidden">
             {cargando && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>}
            <p className="text-slate-400 font-medium text-sm text-center">
              Espacio reservado para el gráfico de líneas<br/>(Próximo paso: Integrar Recharts)
            </p>
          </div>
        </div>

        {/* Gráfico Secundario */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm min-h-[400px] flex flex-col">
          <h3 className="text-slate-800 font-bold mb-6">Conversión por Asesor</h3>
          <div className="flex-1 border-2 border-dashed border-slate-100 rounded-xl flex items-center justify-center bg-slate-50 relative overflow-hidden">
             {cargando && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>}
            <p className="text-slate-400 font-medium text-sm text-center">
              Espacio reservado para el gráfico de barras
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}