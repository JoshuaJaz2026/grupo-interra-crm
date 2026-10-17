"use client";

import { useState, useEffect } from "react";
import { Users, Clock, Target, AlertTriangle, Star, CheckCircle2, Zap, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import * as XLSX from "xlsx";
import { obtenerEstadisticasDashboard, cargarLeadsMasivos } from "./actions";

const COLORS = ['#8b5cf6', '#f59e0b', '#10b981', '#3b82f6', '#f43f5e', '#64748b', '#0ea5e9'];

export default function DashboardPage() {
  const [estaCargando, setEstaCargando] = useState(false);
  const [cargandoPantalla, setCargandoPantalla] = useState(true);
  
  const [metricas, setMetricas] = useState({
    total: 0, ganados: 0, perdidos: 0, scorePromedio: 0, leadsViejos: 0,
    campanas: [], estados: []
  });

  const recargarTablero = async () => {
    setCargandoPantalla(true);
    const res = await obtenerEstadisticasDashboard();
    if (res.exito && res.datos) {
      setMetricas(res.datos as any);
    }
    setCargandoPantalla(false);
  };

  useEffect(() => {
    recargarTablero();
  }, []);

  // Motor para leer Excel e inyectar directo a Neon DB
  const handleCargarExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEstaCargando(true);
    
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        // cellDates: true salva la vida convirtiendo los códigos raros de fecha de Excel a fechas reales
        const wb = XLSX.read(bstr, { type: "binary", cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);
        
        console.log("Datos capturados del Excel:", data);
        
        // Disparo masivo a PostgreSQL
        const res = await cargarLeadsMasivos(data);
        if (res.exito) {
           alert(`¡Éxito total! Se inyectaron ${data.length} leads a la base de datos.`);
           await recargarTablero(); // Los gráficos se dibujarán solos
        } else {
           alert(res.error);
        }
      } catch (error) {
        console.error("Error al procesar el Excel", error);
        alert("Ocurrió un error al procesar el archivo Excel.");
      } finally {
        setEstaCargando(false);
        // Resetea el input para poder subir el mismo archivo si es necesario
        e.target.value = ""; 
      }
    };
    reader.readAsBinaryString(file);
  };

  if (cargandoPantalla) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 w-full">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <p className="font-bold text-slate-500 animate-pulse">Analizando Inteligencia Comercial...</p>
        </div>
      </div>
    );
  }

  const tasaConversion = metricas.total > 0 ? ((metricas.ganados / metricas.total) * 100).toFixed(1) : "0.0";

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 min-h-screen w-full bg-[#f8fafc]">
      
      {/* 🚀 CABECERA Y BOTÓN EXCEL */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Inteligencia Comercial <span className="text-blue-600 bg-blue-500/10 px-3 py-1 rounded-xl text-sm tracking-widest uppercase shadow-sm border border-blue-500/20">Modo Real</span>
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-2">
            Monitoreo en tiempo real del flujo de leads y conversión.
          </p>
        </div>
        
        <label className={`cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-black shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm flex items-center gap-2 ${estaCargando ? "opacity-50 pointer-events-none" : ""}`}>
          {estaCargando ? <><Loader2 className="w-4 h-4 animate-spin"/> Procesando...</> : "Cargar Excel (.xlsx)"}
          <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleCargarExcel} />
        </label>
      </div>

      {/* 📐 ESTRUCTURA DE DOS COLUMNAS */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        <div className="flex flex-col gap-8 bg-white p-6 rounded-[24px] border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <h2 className="text-lg font-black text-slate-800 mb-2">Resumen Ejecutivo</h2>

          {/* 1. KPIs CIRCULARES */}
          <div className="flex flex-wrap gap-8 mb-4">
            <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 rounded-full border-[4px] border-blue-500 flex items-center justify-center bg-blue-50 shadow-[0_0_15px_rgba(59,130,246,0.15)] relative">
                <span className="text-blue-600 font-black text-2xl">{metricas.total}</span>
              </div>
              <span className="text-[11px] uppercase tracking-widest text-slate-500 font-bold">Total Leads</span>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 rounded-full border-[4px] border-emerald-500 flex items-center justify-center bg-emerald-50 shadow-[0_0_15px_rgba(16,185,129,0.15)] relative">
                <span className="text-emerald-500 font-black text-xl">{tasaConversion}%</span>
              </div>
              <span className="text-[11px] uppercase tracking-widest text-slate-500 font-bold">Conversión</span>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 rounded-full border-[4px] border-purple-500 flex items-center justify-center bg-purple-50 shadow-[0_0_15px_rgba(168,85,247,0.15)] relative">
                <span className="text-purple-600 font-black text-2xl">{metricas.scorePromedio}</span>
              </div>
              <span className="text-[11px] uppercase tracking-widest text-slate-500 font-bold">Score Prom.</span>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              Panel de Alertas Comerciales Críticas
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-orange-50/50 border border-orange-100 p-3 rounded-xl">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-orange-700">Leads Sin Seguimiento Reciente</span>
                  <span className="text-[10px] text-orange-600/70 uppercase font-bold tracking-wider mt-0.5">Prospectos activos descuidados</span>
                </div>
                <span className="text-xs font-black bg-orange-200 text-orange-800 px-3 py-1 rounded-lg shadow-sm">
                  {metricas.leadsViejos} detectados
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex-1">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Rendimiento por Campaña Activa
            </h3>
            <div className="overflow-auto max-h-48 border border-slate-100 rounded-xl hide-scroll">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 sticky top-0">
                  <tr className="border-b border-slate-200 text-[10px] uppercase tracking-widest text-slate-400">
                    <th className="py-3 px-4 font-bold">Campaña Meta Ads</th>
                    <th className="py-3 px-4 font-bold text-center">Volumen</th>
                    <th className="py-3 px-4 font-bold text-right">Efectividad</th>
                  </tr>
                </thead>
                <tbody className="text-slate-600">
                  {metricas.campanas.map((camp: any, i: number) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-black text-slate-700">{camp.name}</td>
                      <td className="py-3 px-4 text-center font-black text-blue-600">{camp.leads}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-500">
                        {metricas.total > 0 ? ((camp.leads / metricas.total) * 100).toFixed(0) : 0}%
                      </td>
                    </tr>
                  ))}
                  {metricas.campanas.length === 0 && (
                     <tr><td colSpan={3} className="py-6 text-center text-slate-400 font-bold">Sube un Excel para ver el rendimiento</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8 bg-white p-6 rounded-[24px] border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-black text-slate-800">Leads por Campaña Meta Ads</h2>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md">Volumen</span>
            </div>

            <div className="h-64 w-full">
              {metricas.campanas.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metricas.campanas} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} angle={-20} textAnchor="end" />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontWeight: 'bold', fontSize: '12px' }} />
                    <Bar dataKey="leads" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                   <p className="text-sm font-bold text-slate-400">Sin datos para graficar</p>
                </div>
              )}
            </div>
          </div>

          <div className="h-0 border-t border-slate-100"></div>

          <div className="flex-1">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-black text-slate-800">Distribución por Estado</h2>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md">Pipeline</span>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 h-64">
              <div className="w-1/2 h-full">
                {metricas.estados.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={metricas.estados} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                        {metricas.estados.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontWeight: 'bold', fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full rounded-full border-8 border-slate-100 flex items-center justify-center">
                    <span className="text-xs font-bold text-slate-300">Vacío</span>
                  </div>
                )}
              </div>

              <div className="w-1/2 flex flex-col justify-center gap-2 overflow-auto max-h-56 hide-scroll">
                {metricas.estados.map((estado: any, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                    <div className="flex-1 flex justify-between items-center text-xs">
                      <span className="text-slate-600 font-bold truncate">{estado.name}</span>
                      <span className="font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded ml-2">{estado.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}