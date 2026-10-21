"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Download, Plus, Calendar, User, FileText, CheckCircle2, ChevronLeft, ChevronRight, Edit, Loader2, Trash2, X, Save, AlertTriangle, UploadCloud, Star } from "lucide-react";
import * as XLSX from "xlsx";
import { obtenerLeadsSeguimiento, crearLeadSeguimiento, actualizarLeadSeguimiento, eliminarLeadSeguimiento, cargarLeadsMasivos, eliminarTodosLosLeads, recalcularScoresMasivo } from "./actions";

const formatearFecha = (fecha: Date | string | null) => {
  if (!fecha) return "";
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split('T')[0];
};

function ModalConfirmacion({ visible, onConfirm, onCancel, mensaje, cargando }: { visible: boolean, onConfirm: () => void, onCancel: () => void, mensaje: string, cargando: boolean }) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300 p-4">
      <div className="bg-white rounded-[24px] p-8 max-w-sm w-full shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-100 animate-in zoom-in-95 duration-300 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-rose-500"></div>
        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner border border-rose-100">
          <Trash2 className="w-8 h-8 text-rose-500 animate-pulse" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">¿Estás seguro?</h3>
        <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">{mensaje}</p>
        <div className="flex flex-col gap-3">
          <button onClick={onConfirm} disabled={cargando} className="w-full h-12 bg-rose-500 hover:bg-rose-600 text-white text-[15px] font-black rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 hover:-translate-y-0.5">
            {cargando ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sí, eliminar ahora"}
          </button>
          <button onClick={onCancel} disabled={cargando} className="w-full h-12 bg-white hover:bg-slate-50 text-slate-600 text-[15px] font-bold rounded-xl transition-colors disabled:opacity-50 border border-slate-200">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalAlerta({ visible, mensaje, tipo, onClose }: { visible: boolean, mensaje: string, tipo: 'error' | 'exito', onClose: () => void }) {
  if (!visible) return null;
  const isError = tipo === 'error';
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/30 backdrop-blur-sm animate-in fade-in duration-300 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] border border-slate-100 animate-in zoom-in-95 duration-300 flex flex-col items-center text-center relative overflow-hidden">
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${isError ? 'bg-orange-500' : 'bg-emerald-500'}`}></div>
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner border ${isError ? 'bg-orange-50 border-orange-100' : 'bg-emerald-50 border-emerald-100'}`}>
          {isError ? <AlertTriangle className="w-8 h-8 text-orange-500" /> : <CheckCircle2 className="w-8 h-8 text-emerald-500" />}
        </div>
        <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">
          {isError ? 'Acción Requerida' : '¡Excelente!'}
        </h3>
        <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">{mensaje}</p>
        <button onClick={onClose} className="w-full h-12 bg-[#0f172a] hover:bg-slate-800 text-white text-[15px] font-black rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
          Entendido
        </button>
      </div>
    </div>
  );
}

export default function SeguimientoPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 20;

  const [importando, setImportando] = useState(false);

  const [modalBorrar, setModalBorrar] = useState({ visible: false, id: "", cargando: false });
  const [modalBorrarTodo, setModalBorrarTodo] = useState({ visible: false, cargando: false });
  
  const [alerta, setAlerta] = useState<{visible: boolean, mensaje: string, tipo: 'error' | 'exito'}>({ visible: false, mensaje: "", tipo: 'error' });
  const [modalForm, setModalForm] = useState<{ visible: boolean, modo: 'crear' | 'editar', cargando: boolean, datos: any }>({ 
    visible: false, modo: 'crear', cargando: false, 
    datos: { idLeadExcel: "", fechaCaptacion: "", campana: "", proyecto: "", fuente: "", cliente: "", asesor: "", estado: "Nuevo", fechaPrimerContacto: "", fechaUltimoContacto: "", solicitudInfo: "No", solicitudVisita: "No", numInteracciones: "0", seguimientoRealizado: "No", proximoSeguimiento: "", resultado: "En proceso", fechaCierre: "", puntaje: 0 } 
  });

  const cargarDatos = async () => {
    setCargando(true);
    const res = await obtenerLeadsSeguimiento();
    if (res.exito) setLeads(res.datos);
    setCargando(false);
  };

  useEffect(() => { cargarDatos(); }, []);

  // CERRAR VENTANAS CON ESCAPE
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setModalForm(prev => ({ ...prev, visible: false }));
        setModalBorrar({ visible: false, id: "", cargando: false });
        setModalBorrarTodo({ visible: false, cargando: false });
        setAlerta(prev => ({ ...prev, visible: false }));
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const handleRecalcularScores = async () => {
    setCargando(true);
    const res = await recalcularScoresMasivo();
    if (res.exito) {
      setAlerta({ visible: true, mensaje: res.mensaje || "Puntajes actualizados correctamente.", tipo: 'exito' });
      await cargarDatos(); 
    } else {
      setAlerta({ visible: true, mensaje: res.error || "Ocurrió un error al calcular los puntajes.", tipo: 'error' });
      setCargando(false);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case "ganado": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "perdido": return "bg-rose-100 text-rose-700 border-rose-200";
      case "negociación": return "bg-amber-100 text-amber-700 border-amber-200";
      case "visita solicitada": return "bg-purple-100 text-purple-700 border-purple-200";
      case "interesado": return "bg-blue-100 text-blue-700 border-blue-200";
      case "nuevo": return "bg-slate-100 text-slate-600 border-slate-200";
      default: return "bg-slate-50 text-slate-500 border-slate-200";
    }
  };

  const handleImportarExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportando(true);
    
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary", cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);
        
        const datosLimpios = JSON.parse(JSON.stringify(data));
        const res = await cargarLeadsMasivos(datosLimpios);
        
        if (res.exito) {
           setAlerta({ visible: true, mensaje: `¡Éxito total! Se importaron ${data.length} leads masivamente.`, tipo: 'exito' });
           await cargarDatos();
        } else {
           setAlerta({ visible: true, mensaje: res.error || "Ocurrió un error al importar los leads.", tipo: 'error' });
        }
      } catch (error) {
        setAlerta({ visible: true, mensaje: "El archivo Excel no tiene el formato correcto o está corrupto.", tipo: 'error' });
      } finally {
        setImportando(false);
        e.target.value = ""; 
      }
    };
    reader.readAsBinaryString(file);
  };

  const abrirConfirmacionBorrado = (id: string) => setModalBorrar({ visible: true, id, cargando: false });
  
  const procesarBorradoSeguro = async () => {
    setModalBorrar(prev => ({ ...prev, cargando: true }));
    const res = await eliminarLeadSeguimiento(modalBorrar.id);
    if (res.exito) {
      await cargarDatos();
      setModalBorrar({ visible: false, id: "", cargando: false });
      setAlerta({ visible: true, mensaje: "El lead ha sido eliminado correctamente.", tipo: "exito" });
    } else {
      setModalBorrar(prev => ({ ...prev, cargando: false }));
      setAlerta({ visible: true, mensaje: res.error || "Ocurrió un error al eliminar.", tipo: "error" });
    }
  };

  const procesarBorradoMasivoSeguro = async () => {
    setModalBorrarTodo(prev => ({ ...prev, cargando: true }));
    const res = await eliminarTodosLosLeads();
    if (res.exito) {
      await cargarDatos();
      setModalBorrarTodo({ visible: false, cargando: false });
      setAlerta({ visible: true, mensaje: "La base de datos ha sido vaciada exitosamente.", tipo: "exito" });
    } else {
      setModalBorrarTodo(prev => ({ ...prev, cargando: false }));
      setAlerta({ visible: true, mensaje: res.error || "Error al vaciar la tabla.", tipo: "error" });
    }
  };

  const abrirFormCrear = () => {
    setModalForm({
      visible: true, modo: 'crear', cargando: false,
      datos: { idLeadExcel: "", fechaCaptacion: "", campana: "", proyecto: "", fuente: "", cliente: "", asesor: "", estado: "Nuevo", fechaPrimerContacto: "", fechaUltimoContacto: "", solicitudInfo: "No", solicitudVisita: "No", numInteracciones: "0", seguimientoRealizado: "No", proximoSeguimiento: "", resultado: "En proceso", fechaCierre: "", puntaje: 0 }
    });
  };

  const abrirFormEditar = (lead: any) => {
    setModalForm({
      visible: true, modo: 'editar', cargando: false,
      datos: {
        ...lead,
        fechaCaptacion: formatearFecha(lead.fechaCaptacion),
        fechaPrimerContacto: formatearFecha(lead.fechaPrimerContacto),
        fechaUltimoContacto: formatearFecha(lead.fechaUltimoContacto),
        proximoSeguimiento: formatearFecha(lead.proximoSeguimiento),
        fechaCierre: formatearFecha(lead.fechaCierre),
        solicitudInfo: lead.solicitudInfo ? "Sí" : "No",
        solicitudVisita: lead.solicitudVisita ? "Sí" : "No",
        seguimientoRealizado: lead.seguimientoRealizado ? "Sí" : "No",
        puntaje: lead.puntaje || 0 
      }
    });
  };

  const guardarFormulario = async () => {
    if (!modalForm.datos.cliente || !modalForm.datos.campana) {
      setAlerta({ visible: true, mensaje: "El Nombre del Cliente y la Campaña Origen son obligatorios.", tipo: 'error' });
      return;
    }

    setModalForm(prev => ({ ...prev, cargando: true }));
    
    let res;
    if (modalForm.modo === 'crear') {
      res = await crearLeadSeguimiento(modalForm.datos);
    } else {
      res = await actualizarLeadSeguimiento(modalForm.datos.id, modalForm.datos);
    }

    if (res.exito) {
      await cargarDatos();
      setModalForm(prev => ({ ...prev, visible: false, cargando: false }));
      setAlerta({ visible: true, mensaje: `El lead fue ${modalForm.modo === 'crear' ? 'registrado' : 'actualizado'} con éxito.`, tipo: "exito" });
    } else {
      setModalForm(prev => ({ ...prev, cargando: false }));
      setAlerta({ visible: true, mensaje: res.error || "Ocurrió un error al guardar.", tipo: "error" });
    }
  };

  const filtrados = leads.filter(l => 
    l.cliente.toLowerCase().includes(busqueda.toLowerCase()) || 
    (l.idLeadExcel && l.idLeadExcel.toLowerCase().includes(busqueda.toLowerCase())) ||
    l.proyecto.toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalPaginas = Math.ceil(filtrados.length / itemsPorPagina) || 1;
  const indiceInicio = (paginaActual - 1) * itemsPorPagina;
  const leadsPaginados = filtrados.slice(indiceInicio, indiceInicio + itemsPorPagina);

  const inputFormClass = "w-full h-12 px-4 bg-slate-50 focus:bg-white rounded-xl outline-none text-[15px] font-bold text-slate-700 transition-all border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 shadow-sm";
  const labelClass = "text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 block";

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-700 w-full h-screen bg-[#f8fafc] flex flex-col overflow-hidden relative">
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
        .hide-scroll::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 8px; }
        .hide-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 8px; }
        .hide-scroll:hover::-webkit-scrollbar-thumb { background: #94a3b8; }
      `}} />

      <ModalAlerta visible={alerta.visible} mensaje={alerta.mensaje} tipo={alerta.tipo} onClose={() => setAlerta({ ...alerta, visible: false })} />
      <ModalConfirmacion visible={modalBorrar.visible} cargando={modalBorrar.cargando} onConfirm={procesarBorradoSeguro} onCancel={() => setModalBorrar({ visible: false, id: "", cargando: false })} mensaje="Esta acción borrará al cliente y todo su historial de interacción de forma permanente." />
      <ModalConfirmacion 
        visible={modalBorrarTodo.visible} 
        cargando={modalBorrarTodo.cargando} 
        onConfirm={procesarBorradoMasivoSeguro} 
        onCancel={() => setModalBorrarTodo({ visible: false, cargando: false })} 
        mensaje="¡ALERTA CRÍTICA! Esta acción eliminará ABSOLUTAMENTE TODOS los leads de la base de datos. Esta operación es irreversible." 
      />

      {modalForm.visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300 p-4">
          <div className="bg-white rounded-[32px] w-full max-w-4xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
            <div className="flex items-center justify-between p-6 md:p-8 border-b border-slate-100 bg-white z-10 shrink-0">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{modalForm.modo === 'crear' ? 'Registrar Nuevo Lead' : 'Editar Información del Lead'}</h2>
                <p className="text-slate-500 text-sm font-medium mt-1">Completa los datos del cliente para el flujo comercial.</p>
              </div>
              <button onClick={() => setModalForm(prev => ({ ...prev, visible: false }))} className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto hide-scroll flex-1 bg-slate-50/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="col-span-1 md:col-span-2 bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
                  <h3 className="col-span-1 md:col-span-2 text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-2"><User className="w-5 h-5 text-blue-500"/> Información Principal</h3>
                  <div><label className={labelClass}>Nombre del Cliente *</label><input type="text" placeholder="Ej. Juan Pérez" className={inputFormClass} value={modalForm.datos.cliente} onChange={e => setModalForm(prev => ({...prev, datos: {...prev.datos, cliente: e.target.value}}))} /></div>
                  <div><label className={labelClass}>Campaña Origen *</label><input type="text" placeholder="Ej. Meta Ads - Chinchero" className={inputFormClass} value={modalForm.datos.campana} onChange={e => setModalForm(prev => ({...prev, datos: {...prev.datos, campana: e.target.value}}))} /></div>
                  <div><label className={labelClass}>Proyecto de Interés</label><input type="text" className={inputFormClass} value={modalForm.datos.proyecto} onChange={e => setModalForm(prev => ({...prev, datos: {...prev.datos, proyecto: e.target.value}}))} /></div>
                  <div><label className={labelClass}>Asesor Responsable</label><input type="text" className={inputFormClass} value={modalForm.datos.asesor} onChange={e => setModalForm(prev => ({...prev, datos: {...prev.datos, asesor: e.target.value}}))} /></div>
                  <div><label className={labelClass}>ID Lead (Opcional)</label><input type="text" placeholder="L-000" className={inputFormClass} value={modalForm.datos.idLeadExcel} onChange={e => setModalForm(prev => ({...prev, datos: {...prev.datos, idLeadExcel: e.target.value}}))} /></div>
                  <div><label className={labelClass}>Fuente / Red Social</label><input type="text" placeholder="Facebook, Google..." className={inputFormClass} value={modalForm.datos.fuente} onChange={e => setModalForm(prev => ({...prev, datos: {...prev.datos, fuente: e.target.value}}))} /></div>
                </div>

                <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-6">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-2"><Calendar className="w-5 h-5 text-amber-500"/> Estado y Tiempos</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Estado Actual</label>
                      <select className={inputFormClass} value={modalForm.datos.estado} onChange={e => setModalForm(prev => ({...prev, datos: {...prev.datos, estado: e.target.value}}))}>
                        <option value="Nuevo">Nuevo</option><option value="Contactado">Contactado</option><option value="Interesado">Interesado</option><option value="Visita solicitada">Visita solicitada</option><option value="Negociación">Negociación</option><option value="Ganado">Ganado</option><option value="Perdido">Perdido</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Ajuste de Score (Métricas)</label>
                      <select 
                        className={`${inputFormClass} bg-amber-50 border-amber-200 focus:border-amber-500 text-sm`} 
                        value={modalForm.datos.puntaje} 
                        onChange={e => setModalForm(prev => ({...prev, datos: {...prev.datos, puntaje: Number(e.target.value)}}))}
                      >
                        <option value={0}>Calculado automáticamente (0)</option>
                        <option value={15}>+15 pts - Consulta precios / info</option>
                        <option value={20}>+20 pts - Interacción registrada</option>
                        <option value={30}>+30 pts - Lead interesado</option>
                        <option value={40}>+40 pts - Solicita visita comercial</option>
                        <option value={50}>+50 pts - Etapa de negociación</option>
                        <option value={100}>100 pts - Cierre Ganado</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className={labelClass}>F. Captación</label><input type="date" className={inputFormClass} value={modalForm.datos.fechaCaptacion} onChange={e => setModalForm(prev => ({...prev, datos: {...prev.datos, fechaCaptacion: e.target.value}}))} /></div>
                    <div><label className={labelClass}>F. Cierre</label><input type="date" className={inputFormClass} value={modalForm.datos.fechaCierre} onChange={e => setModalForm(prev => ({...prev, datos: {...prev.datos, fechaCierre: e.target.value}}))} /></div>
                    <div><label className={labelClass}>1er Contacto</label><input type="date" className={inputFormClass} value={modalForm.datos.fechaPrimerContacto} onChange={e => setModalForm(prev => ({...prev, datos: {...prev.datos, fechaPrimerContacto: e.target.value}}))} /></div>
                    <div><label className={labelClass}>Últ. Contacto</label><input type="date" className={inputFormClass} value={modalForm.datos.fechaUltimoContacto} onChange={e => setModalForm(prev => ({...prev, datos: {...prev.datos, fechaUltimoContacto: e.target.value}}))} /></div>
                  </div>
                </div>

                <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-6">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-2"><CheckCircle2 className="w-5 h-5 text-emerald-500"/> Acciones Comerciales</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className={labelClass}>Sol. Info</label><select className={inputFormClass} value={modalForm.datos.solicitudInfo} onChange={e => setModalForm(prev => ({...prev, datos: {...prev.datos, solicitudInfo: e.target.value}}))}><option value="Sí">Sí</option><option value="No">No</option></select></div>
                    <div><label className={labelClass}>Sol. Visita</label><select className={inputFormClass} value={modalForm.datos.solicitudVisita} onChange={e => setModalForm(prev => ({...prev, datos: {...prev.datos, solicitudVisita: e.target.value}}))}><option value="Sí">Sí</option><option value="No">No</option></select></div>
                    <div><label className={labelClass}>N° Interacc.</label><input type="number" className={inputFormClass} value={modalForm.datos.numInteracciones} onChange={e => setModalForm(prev => ({...prev, datos: {...prev.datos, numInteracciones: e.target.value}}))} /></div>
                    <div><label className={labelClass}>Seg. Realizado</label><select className={inputFormClass} value={modalForm.datos.seguimientoRealizado} onChange={e => setModalForm(prev => ({...prev, datos: {...prev.datos, seguimientoRealizado: e.target.value}}))}><option value="Sí">Sí</option><option value="No">No</option></select></div>
                  </div>
                  <div><label className={labelClass}>Próximo Seguimiento</label><input type="date" className={inputFormClass} value={modalForm.datos.proximoSeguimiento} onChange={e => setModalForm(prev => ({...prev, datos: {...prev.datos, proximoSeguimiento: e.target.value}}))} /></div>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 border-t border-slate-100 bg-white flex flex-col sm:flex-row justify-end gap-3 shrink-0">
              <button onClick={() => setModalForm(prev => ({ ...prev, visible: false }))} className="px-8 py-3.5 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancelar</button>
              <button onClick={guardarFormulario} disabled={modalForm.cargando} className="px-10 py-3.5 font-black text-white bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5 rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2">
                {modalForm.cargando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Guardar Lead
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 CABECERA PRINCIPAL */}
      <div className="shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Seguimiento de Leads <span className="bg-blue-500/10 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase shadow-sm border border-blue-500/20">Operativo</span>
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1.5">Matriz maestra de gestión comercial e interacciones.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64 group hidden md:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input type="text" placeholder="Buscar cliente o ID..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-full text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all shadow-sm" />
          </div>
          
          <button onClick={handleRecalcularScores} className="cursor-pointer bg-amber-50 hover:bg-amber-100 text-amber-600 px-5 py-2.5 rounded-full font-bold shadow-sm transition-all text-sm flex items-center gap-2 border border-amber-200">
            <Star className="w-4 h-4" />
            <span className="hidden md:inline">Calcular Scores</span>
          </button>

          <button onClick={() => setModalBorrarTodo({ visible: true, cargando: false })} className="cursor-pointer bg-rose-50 hover:bg-rose-100 text-rose-600 px-5 py-2.5 rounded-full font-bold shadow-sm transition-all text-sm flex items-center gap-2 border border-rose-200">
            <Trash2 className="w-4 h-4" />
            <span className="hidden md:inline">Vaciar Tabla</span>
          </button>

          <label className={`cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-600 px-5 py-2.5 rounded-full font-bold shadow-sm transition-all text-sm flex items-center gap-2 border border-blue-200 ${importando ? 'opacity-50 pointer-events-none' : ''}`}>
            {importando ? <Loader2 className="w-4 h-4 animate-spin"/> : <UploadCloud className="w-4 h-4" />}
            <span className="hidden md:inline">Importar Excel</span>
            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImportarExcel} />
          </label>

          <button onClick={abrirFormCrear} className="bg-[#0f172a] hover:bg-slate-800 text-white px-5 py-2.5 rounded-full font-bold shadow-md hover:shadow-xl transition-all hover:-translate-y-0.5 text-sm flex items-center gap-2 border border-slate-700"><Plus className="w-4 h-4" /> Nuevo Lead</button>
        </div>
      </div>

      {/* 📋 DATA GRID HORIZONTAL */}
      <div className="flex-1 bg-white border border-slate-200 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col overflow-hidden min-h-0 mt-2">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 flex-shrink-0">
          <h2 className="font-black text-sm uppercase tracking-widest text-slate-500 flex items-center gap-2"><FileText className="w-5 h-5 text-slate-400" /> Base de Datos Completa</h2>
          <button className="text-blue-600 hover:text-blue-700 font-bold text-sm flex items-center gap-1.5 transition-colors"><Download className="w-4 h-4" /> Exportar CSV</button>
        </div>
        
        <div className="flex-1 overflow-auto bg-white block hide-scroll">
          <table className="w-full text-left table-auto">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 sticky top-0 z-20 whitespace-nowrap">
              <tr>
                <th className="py-5 px-4 font-black text-xs uppercase tracking-widest text-center min-w-[120px] whitespace-nowrap">ID Lead</th>
                <th className="py-5 px-4 font-black text-xs uppercase tracking-widest text-center min-w-[120px] whitespace-nowrap">Score</th>
                <th className="py-5 px-4 font-black text-xs uppercase tracking-widest min-w-[160px] whitespace-nowrap">Captación</th>
                <th className="py-5 px-4 font-black text-xs uppercase tracking-widest min-w-[260px] whitespace-nowrap">Campaña</th>
                <th className="py-5 px-4 font-black text-xs uppercase tracking-widest min-w-[220px] whitespace-nowrap">Proyecto</th>
                <th className="py-5 px-4 font-black text-xs uppercase tracking-widest min-w-[160px] whitespace-nowrap">Fuente</th>
                <th className="py-5 px-4 font-black text-xs uppercase tracking-widest min-w-[220px] whitespace-nowrap">Cliente</th>
                <th className="py-5 px-4 font-black text-xs uppercase tracking-widest min-w-[200px] whitespace-nowrap">Asesor</th>
                <th className="py-5 px-4 font-black text-xs uppercase tracking-widest text-center min-w-[160px] whitespace-nowrap">Estado</th>
                <th className="py-5 px-4 font-black text-xs uppercase tracking-widest text-center min-w-[140px] whitespace-nowrap">1er Contacto</th>
                <th className="py-5 px-4 font-black text-xs uppercase tracking-widest text-center min-w-[140px] whitespace-nowrap">Últ. Contacto</th>
                <th className="py-5 px-2 font-black text-xs uppercase tracking-widest text-center min-w-[100px] whitespace-nowrap">Sol. Info</th>
                <th className="py-5 px-2 font-black text-xs uppercase tracking-widest text-center min-w-[100px] whitespace-nowrap">Sol. Visita</th>
                <th className="py-5 px-2 font-black text-xs uppercase tracking-widest text-center min-w-[100px] whitespace-nowrap">Interac.</th>
                <th className="py-5 px-2 font-black text-xs uppercase tracking-widest text-center min-w-[100px] whitespace-nowrap">Seguim.</th>
                <th className="py-5 px-4 font-black text-xs uppercase tracking-widest text-center min-w-[140px] whitespace-nowrap">Próx. Seg.</th>
                <th className="py-5 px-4 font-black text-xs uppercase tracking-widest text-center min-w-[180px] whitespace-nowrap">Resultado</th>
                <th className="py-5 px-4 font-black text-xs uppercase tracking-widest text-center min-w-[140px] whitespace-nowrap">Cierre</th>
                <th className="py-5 px-4 text-center font-black text-xs uppercase tracking-widest min-w-[120px] whitespace-nowrap sticky right-0 bg-slate-50 border-l border-slate-200 shadow-[-5px_0_10px_rgba(0,0,0,0.02)] z-30">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600 bg-white">
              {cargando ? (
                <tr><td colSpan={19} className="py-16 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" /></td></tr>
              ) : leadsPaginados.length === 0 ? (
                <tr><td colSpan={19} className="py-16 text-center text-slate-400 font-bold text-lg">No hay leads registrados aún.</td></tr>
              ) : (
                leadsPaginados.map((lead) => (
                  <tr key={lead.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="py-5 px-4 text-center font-black text-blue-600 text-[15px] whitespace-nowrap">{lead.idLeadExcel || "N/A"}</td>
                    <td className="py-5 px-4 text-center whitespace-nowrap">
                      <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-1.5 rounded-lg font-black text-sm shadow-sm">
                        {lead.puntaje || 0} pts
                      </span>
                    </td>
                    <td className="py-5 px-4 font-bold text-slate-700 text-[15px] whitespace-nowrap">{formatearFecha(lead.fechaCaptacion) ? <><Calendar className="w-4 h-4 inline mr-1 text-slate-400"/> {formatearFecha(lead.fechaCaptacion)}</> : "-"}</td>
                    <td className="py-5 px-4 font-bold text-slate-900 text-[15px] whitespace-nowrap">{lead.campana}</td>
                    <td className="py-5 px-4 font-bold text-slate-600 text-[15px] whitespace-nowrap">{lead.proyecto}</td>
                    <td className="py-5 px-4 font-medium text-slate-500 text-[15px] whitespace-nowrap">{lead.fuente || "-"}</td>
                    <td className="py-5 px-4 font-black text-slate-800 text-[16px] whitespace-nowrap">{lead.cliente}</td>
                    <td className="py-5 px-4 font-bold text-slate-700 text-[15px] whitespace-nowrap"><User className="w-4 h-4 inline mr-1 text-slate-400"/> {lead.asesor}</td>
                    <td className="py-5 px-4 text-center whitespace-nowrap"><span className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest shadow-sm border ${getEstadoColor(lead.estado)}`}>{lead.estado}</span></td>
                    <td className="py-5 px-4 text-center font-medium text-slate-600 text-[15px] whitespace-nowrap">{formatearFecha(lead.fechaPrimerContacto) || "-"}</td>
                    <td className="py-5 px-4 text-center font-medium text-slate-600 text-[15px] whitespace-nowrap">{formatearFecha(lead.fechaUltimoContacto) || "-"}</td>
                    <td className="py-5 px-2 text-center font-black text-slate-700 text-[15px] whitespace-nowrap">{lead.solicitudInfo ? "Sí" : "No"}</td>
                    <td className="py-5 px-2 text-center font-black text-slate-700 text-[15px] whitespace-nowrap">{lead.solicitudVisita ? "Sí" : "No"}</td>
                    <td className="py-5 px-2 text-center font-black text-blue-600 text-[16px] whitespace-nowrap">{lead.numInteracciones}</td>
                    <td className="py-5 px-2 text-center whitespace-nowrap">{lead.seguimientoRealizado ? <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto"/> : <span className="text-slate-300 font-bold text-lg">-</span>}</td>
                    <td className="py-5 px-4 text-center font-bold text-amber-600 text-[15px] whitespace-nowrap">{formatearFecha(lead.proximoSeguimiento) || "-"}</td>
                    <td className="py-5 px-4 text-center font-bold text-slate-700 text-[15px] whitespace-nowrap">{lead.resultado || "-"}</td>
                    <td className="py-5 px-4 text-center font-medium text-slate-500 text-[15px] whitespace-nowrap">{formatearFecha(lead.fechaCierre) || "-"}</td>
                    
                    {/* 🔥 BOTONES DE ACCIÓN 100% VISIBLES EN TODO MOMENTO */}
                    <td className="py-5 px-4 text-center sticky right-0 bg-white group-hover:bg-[#f8fafc] border-l border-slate-100 transition-colors whitespace-nowrap z-10">
                       <div className="flex items-center justify-center gap-2">
                         <button onClick={() => abrirFormEditar(lead)} className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200 hover:border-blue-600 rounded-xl transition-all shadow-sm" title="Editar Lead">
                            <Edit className="w-4 h-4" />
                         </button>
                         <button onClick={() => abrirConfirmacionBorrado(lead.id)} className="p-2.5 bg-rose-50 text-rose-500 hover:bg-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 rounded-xl transition-all shadow-sm" title="Eliminar Lead">
                            <Trash2 className="w-4 h-4" />
                         </button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
          <span className="text-sm font-bold text-slate-500">Mostrando {filtrados.length === 0 ? 0 : indiceInicio + 1} a {Math.min(indiceInicio + itemsPorPagina, filtrados.length)} de {filtrados.length} leads</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))} disabled={paginaActual === 1 || filtrados.length === 0} className="flex items-center gap-1 px-4 py-2 border border-slate-200 bg-white rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-sm disabled:opacity-50"><ChevronLeft className="w-4 h-4" /> Anterior</button>
            <span className="px-5 py-2 text-sm font-black text-blue-600 bg-blue-50 rounded-xl border border-blue-100 shadow-sm">Página {paginaActual} de {totalPaginas}</span>
            <button onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))} disabled={paginaActual === totalPaginas || filtrados.length === 0} className="flex items-center gap-1 px-4 py-2 border border-slate-200 bg-white rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-sm disabled:opacity-50">Siguiente <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}