"use client";

import { useState, useEffect } from "react";
import { Calculator, Target, Zap, TrendingDown, Info, ShieldAlert, CheckCircle2, Trash2, Loader2, Plus, AlertTriangle, ChevronLeft, ChevronRight, Edit, X } from "lucide-react";
import { obtenerReglasScoring, crearReglaScoring, eliminarReglaScoring, actualizarReglaScoring } from "./actions";

function ModalConfirmacion({ visible, onConfirm, onCancel, mensaje, cargando }: { visible: boolean, onConfirm: () => void, onCancel: () => void, mensaje: string, cargando: boolean }) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="bg-white rounded-[24px] p-8 max-w-sm w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-rose-500"></div>
        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner border border-rose-100">
          <Trash2 className="w-8 h-8 text-rose-500 animate-pulse" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">¿Eliminar Regla?</h3>
        <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
          {mensaje}
        </p>
        <div className="flex flex-col gap-3">
          <button 
            onClick={onConfirm} disabled={cargando} 
            className="w-full h-12 bg-rose-500 hover:bg-rose-600 text-white text-[15px] font-black rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 hover:-translate-y-0.5"
          >
            {cargando ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sí, eliminar ahora"}
          </button>
          <button 
            onClick={onCancel} disabled={cargando} 
            className="w-full h-12 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[15px] font-bold rounded-xl transition-colors disabled:opacity-50 border border-slate-200"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LeadScoringPage() {
  const [reglas, setReglas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 10;
  
  const [modalBorrar, setModalBorrar] = useState({ visible: false, id: 0, cargando: false });

  const [filasNuevas, setFilasNuevas] = useState<any[]>([]);

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [datosEdicion, setDatosEdicion] = useState<any>(null);
  const [procesandoEdicion, setProcesandoEdicion] = useState(false);
  const [guardadoEdicion, setGuardadoEdicion] = useState(false);

  useEffect(() => {
    const borradoresGuardados = localStorage.getItem('ls_drafts');
    if (borradoresGuardados) {
      try {
        const parsed = JSON.parse(borradoresGuardados);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.map((p: any) => ({...p, procesando: false, guardado: false, advertencia: false}));
          setFilasNuevas(cleaned);
        }
      } catch(e) {}
    } else {
      setFilasNuevas([{
        idTemp: Date.now(), categoria: "Estado del lead", condicion: "", puntaje: "", justificacion: "", tipo: "positivo", procesando: false, guardado: false, advertencia: false
      }]);
    }
    cargarReglas();
  }, []);

  const cargarReglas = async () => {
    const res = await obtenerReglasScoring();
    if (res.exito) {
      setReglas(res.datos);
    }
    setCargando(false);
  };

  const intentarAutoGuardadoNueva = async (index: number) => {
    const fila = filasNuevas[index];
    if (!fila.condicion.trim() && !fila.justificacion.trim()) return;

    if (!fila.condicion.trim() || !fila.justificacion.trim()) {
      setFilasNuevas(prev => {
        const nuevas = [...prev];
        nuevas[index].advertencia = true;
        return nuevas;
      });
      return; 
    }

    if (fila.procesando || fila.guardado) return;

    setFilasNuevas(prev => {
      const nuevas = [...prev];
      nuevas[index].procesando = true;
      nuevas[index].advertencia = false;
      return nuevas;
    });

    const res = await crearReglaScoring({
      categoria: fila.categoria, condicion: fila.condicion,
      puntaje: Number(fila.puntaje) || 0, justificacion: fila.justificacion, tipo: fila.tipo
    });

    if (res.exito) {
      setFilasNuevas(prev => {
        const actualizadas = [...prev];
        actualizadas[index].procesando = false;
        actualizadas[index].guardado = true;
        return actualizadas;
      });

      setTimeout(async () => {
        await cargarReglas();
        setFilasNuevas(prev => {
          const filasRestantes = prev.filter((_, i) => i !== index);
          localStorage.setItem('ls_drafts', JSON.stringify(filasRestantes));
          return filasRestantes;
        });
      }, 1200);
    } else {
      setFilasNuevas(prev => {
        const filasError = [...prev];
        filasError[index].procesando = false;
        return filasError;
      });
    }
  };

  const intentarAutoGuardadoEdicion = async () => {
    if (!editandoId || !datosEdicion || procesandoEdicion || guardadoEdicion) return;

    if (!datosEdicion.condicion.trim() || !datosEdicion.justificacion.trim()) {
      setDatosEdicion({ ...datosEdicion, advertencia: true });
      return;
    }

    setProcesandoEdicion(true);
    setDatosEdicion({ ...datosEdicion, advertencia: false });

    const res = await actualizarReglaScoring(editandoId, {
      categoria: datosEdicion.categoria,
      condicion: datosEdicion.condicion,
      puntaje: Number(datosEdicion.puntaje) || 0,
      justificacion: datosEdicion.justificacion,
      tipo: datosEdicion.tipo
    });

    if (res.exito) {
      setProcesandoEdicion(false);
      setGuardadoEdicion(true);
      setTimeout(async () => {
        await cargarReglas();
        setEditandoId(null);
        setGuardadoEdicion(false);
      }, 1200);
    } else {
      setProcesandoEdicion(false);
      alert("⚠️ Error: " + res.error);
    }
  };

  const iniciarEdicion = (regla: any) => {
    setEditandoId(regla.id);
    setDatosEdicion({
      categoria: regla.categoria, condicion: regla.condicion,
      puntaje: regla.puntaje, justificacion: regla.justificacion, tipo: regla.tipo, advertencia: false
    });
  };

  const actualizarFilaNueva = (index: number, campo: string, valor: any) => {
    setFilasNuevas(prev => {
      const nuevasFilas = [...prev];
      nuevasFilas[index] = { ...nuevasFilas[index], [campo]: valor, advertencia: false };
      localStorage.setItem('ls_drafts', JSON.stringify(nuevasFilas));
      return nuevasFilas;
    });
  };

  const abrirConfirmacionBorrado = (id: number) => {
    setModalBorrar({ visible: true, id, cargando: false });
  };

  const procesarBorradoSeguro = async () => {
    setModalBorrar(prev => ({ ...prev, cargando: true }));
    const res = await eliminarReglaScoring(modalBorrar.id);
    if (res.exito) {
      await cargarReglas();
      setModalBorrar({ visible: false, id: 0, cargando: false });
    } else {
      alert("⚠️ Error del servidor: " + res.error);
      setModalBorrar(prev => ({ ...prev, cargando: false }));
    }
  };

  const handleAgregarFila = () => {
    setFilasNuevas(prev => {
      const nuevas = [...prev, { idTemp: Date.now(), categoria: "Estado del lead", condicion: "", puntaje: "", justificacion: "", tipo: "positivo", procesando: false, guardado: false, advertencia: false }];
      localStorage.setItem('ls_drafts', JSON.stringify(nuevas));
      return nuevas;
    });
  };

  const handleQuitarFilaVacia = (index: number) => {
    setFilasNuevas(prev => {
      const restantes = prev.filter((_, i) => i !== index);
      localStorage.setItem('ls_drafts', JSON.stringify(restantes));
      return restantes;
    });
  };

  const totalPaginas = Math.ceil(reglas.length / itemsPorPagina) || 1;
  const indiceInicio = (paginaActual - 1) * itemsPorPagina;
  const reglasPaginadas = reglas.slice(indiceInicio, indiceInicio + itemsPorPagina);

  const puntajeMaximo = reglas.filter(r => r.tipo === 'positivo').reduce((acc, curr) => acc + curr.puntaje, 0);
  const penalizacionMaxima = reglas.filter(r => r.tipo === 'negativo').reduce((acc, curr) => acc + curr.puntaje, 0);

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-700 w-full h-screen bg-[#f8fafc] flex flex-col overflow-hidden">
      
      <ModalConfirmacion 
        visible={modalBorrar.visible}
        cargando={modalBorrar.cargando}
        onConfirm={procesarBorradoSeguro}
        onCancel={() => setModalBorrar({ visible: false, id: 0, cargando: false })}
        mensaje="Esta acción es irreversible y los algoritmos dejarán de considerar esta regla."
      />

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scroll::-webkit-scrollbar { width: 4px; height: 4px; }
        .hide-scroll::-webkit-scrollbar-track { background: transparent; }
        .hide-scroll::-webkit-scrollbar-thumb { background: transparent; }
        .hide-scroll:hover::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
      `}} />

      {/* 🔥 CABECERA MINIMALISTA */}
      <div className="flex-shrink-0 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Motor de Lead Scoring</h1>
            <span className="bg-orange-50 text-orange-500 border border-orange-200 px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase shadow-sm flex items-center gap-1">
              <Zap className="w-3 h-3" /> Activo
            </span>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <div className="bg-emerald-50/50 border border-emerald-100 px-4 py-2 rounded-2xl flex items-center gap-3 flex-1 md:flex-none shadow-sm">
              <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center shrink-0 shadow-sm"><Target className="w-4 h-4" /></div>
              <div>
                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Max Posible</p>
                <h3 className="text-lg font-black text-emerald-700 leading-none mt-0.5">{puntajeMaximo > 0 ? `+${puntajeMaximo}` : 0}</h3>
              </div>
            </div>
            
            <div className="bg-rose-50/50 border border-rose-100 px-4 py-2 rounded-2xl flex items-center gap-3 flex-1 md:flex-none shadow-sm">
              <div className="w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center shrink-0 shadow-sm"><TrendingDown className="w-4 h-4" /></div>
              <div>
                <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest">Penalización</p>
                <h3 className="text-lg font-black text-rose-700 leading-none mt-0.5">{penalizacionMaxima}</h3>
              </div>
            </div>

            <div className="bg-blue-50/50 border border-blue-100 px-4 py-2 rounded-2xl flex items-center gap-3 flex-1 md:flex-none shadow-sm">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shrink-0 shadow-sm"><Info className="w-4 h-4" /></div>
              <div>
                <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Criterios</p>
                <h3 className="text-lg font-black text-blue-700 leading-none mt-0.5">{reglas.length}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🔥 TABLA CON CABECERA OSCURA */}
      <div className="flex-1 bg-white border border-slate-200 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col overflow-hidden min-h-0 mt-2">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-[#0f172a] text-white flex-shrink-0">
          <h2 className="font-bold text-xs uppercase tracking-widest flex items-center gap-2">
            <Calculator className="w-4 h-4 text-blue-400" /> 
            Matriz de Priorización
          </h2>
          <button 
            onClick={handleAgregarFila}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" /> Agregar Fila Vacía
          </button>
        </div>
        
        <div className="flex-1 overflow-auto bg-white block scrollbar-none">
          <table className="w-full text-left text-sm table-fixed min-w-[900px]">
            <thead className="bg-white border-b border-slate-100 text-slate-400 sticky top-0 z-20 whitespace-nowrap">
              <tr>
                <th className="py-4 px-6 font-black text-[11px] uppercase tracking-widest text-center w-[6%]">ID</th>
                <th className="py-4 px-4 font-black text-[11px] uppercase tracking-widest w-[20%]">Criterio Evaluado</th>
                <th className="py-4 px-4 font-black text-[11px] uppercase tracking-widest w-[30%]">Condición del Lead</th>
                <th className="py-4 px-4 font-black text-[11px] uppercase tracking-widest text-center w-[10%]">Tipo</th>
                <th className="py-4 px-4 font-black text-[11px] uppercase tracking-widest text-center w-[8%]">Pts.</th>
                <th className="py-4 px-4 font-black text-[11px] uppercase tracking-widest w-[20%]">Justificación</th>
                <th className="py-4 px-6 font-black text-[11px] uppercase tracking-widest text-center w-[9%]">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-600 bg-white">
              
              {cargando ? (
                <tr><td colSpan={7} className="py-16 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" /></td></tr>
              ) : (
                reglasPaginadas.map((regla, index) => {
                  
                  // MODO EDICIÓN
                  if (editandoId === regla.id && datosEdicion) {
                    return (
                      <tr key={regla.id} className="bg-amber-50/40 group relative transition-colors">
                        {procesandoEdicion && (
                          <td colSpan={7} className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-lg">
                            <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                          </td>
                        )}
                        {guardadoEdicion && (
                          <td colSpan={7} className="absolute inset-0 bg-emerald-50/90 backdrop-blur-[1px] flex items-center justify-center z-20 animate-in fade-in duration-300">
                            <div className="flex items-center gap-3 text-emerald-600 font-bold px-8 py-3 rounded-full shadow-sm border border-emerald-200 text-base bg-white">
                              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                              ¡Guardado Automáticamente!
                            </div>
                          </td>
                        )}

                        <td className="py-4 px-6 text-center align-top pt-5">
                           {datosEdicion.advertencia ? (
                             <AlertTriangle className="w-5 h-5 text-orange-500 mx-auto" />
                           ) : (
                             <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-100 px-2.5 py-1 rounded-md shadow-sm border border-amber-200">EDIT</span>
                           )}
                        </td>
                        
                        <td className="py-4 px-3 align-top">
                          <select 
                            value={datosEdicion.categoria} onChange={e => setDatosEdicion({...datosEdicion, categoria: e.target.value})} onBlur={intentarAutoGuardadoEdicion}
                            className={`w-full h-[48px] px-3 bg-white hover:bg-white focus:bg-white rounded-xl outline-none text-[14px] font-bold text-slate-700 transition-all shadow-sm border border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 cursor-pointer`}
                          >
                            <option value="Estado del lead">Estado del lead</option>
                            <option value="Solicitud de información">Solicitud de información</option>
                            <option value="Solicitud de visita">Solicitud de visita</option>
                            <option value="Interacción registrada">Interacción registrada</option>
                            <option value="Seguimiento reciente">Seguimiento reciente</option>
                            <option value="Tiempo sin contacto">Tiempo sin contacto</option>
                          </select>
                        </td>
                        <td className="py-4 px-3 align-top">
                          <textarea 
                            placeholder="Escribe la condición..." value={datosEdicion.condicion} onChange={e => setDatosEdicion({...datosEdicion, condicion: e.target.value})} onBlur={intentarAutoGuardadoEdicion}
                            className={`w-full h-[48px] px-3 py-3 bg-white hover:bg-white focus:bg-white rounded-xl outline-none text-[14px] font-medium text-slate-700 transition-all shadow-sm border resize-none overflow-y-auto hide-scroll ${datosEdicion.advertencia && !datosEdicion.condicion.trim() ? 'border-orange-400 ring-2 ring-orange-200' : 'border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100'}`}
                          />
                        </td>
                        <td className="py-4 px-3 align-top">
                          <select 
                            value={datosEdicion.tipo} onChange={e => setDatosEdicion({...datosEdicion, tipo: e.target.value})} onBlur={intentarAutoGuardadoEdicion}
                            className={`w-full h-[48px] px-3 bg-white hover:bg-white focus:bg-white rounded-xl outline-none text-[14px] font-bold text-slate-700 transition-all shadow-sm border border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 cursor-pointer`}
                          >
                            <option value="positivo">Pos (+)</option>
                            <option value="negativo">Neg (-)</option>
                          </select>
                        </td>
                        <td className="py-4 px-3 align-top">
                          <input 
                            type="number" placeholder="0" value={datosEdicion.puntaje} onChange={e => setDatosEdicion({...datosEdicion, puntaje: e.target.value})} onBlur={intentarAutoGuardadoEdicion}
                            className={`w-full h-[48px] px-3 bg-white hover:bg-white focus:bg-white rounded-xl outline-none text-[15px] font-black text-center text-slate-700 transition-all shadow-sm border border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100`}
                          />
                        </td>
                        <td className="py-4 px-3 align-top">
                          <textarea 
                            placeholder="Escribe la justificación..." value={datosEdicion.justificacion} onChange={e => setDatosEdicion({...datosEdicion, justificacion: e.target.value})} onBlur={intentarAutoGuardadoEdicion}
                            className={`w-full h-[48px] px-3 py-3 bg-white hover:bg-white focus:bg-white rounded-xl outline-none text-[14px] font-medium text-slate-700 transition-all shadow-sm border resize-none overflow-y-auto hide-scroll ${datosEdicion.advertencia && !datosEdicion.justificacion.trim() ? 'border-orange-400 ring-2 ring-orange-200' : 'border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100'}`}
                          />
                        </td>
                        <td className="py-4 px-6 text-center align-top whitespace-nowrap pt-4">
                          <button onClick={() => setEditandoId(null)} className="p-2.5 bg-white text-rose-400 hover:bg-rose-50 hover:text-rose-500 border border-rose-100 rounded-full transition-all shadow-sm hover:shadow-md hover:scale-105" title="Descartar">
                            <X className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  }

                  // 🔥 MODO VISUALIZACIÓN NORMAL (Con textos grandes y botones activos permanentemente)
                  return (
                    <tr key={regla.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-6 px-6 text-center font-black text-slate-400 text-sm whitespace-nowrap">{indiceInicio + index + 1}</td>
                      <td className="py-6 px-4 font-black text-slate-900 whitespace-nowrap truncate text-[15px]">{regla.categoria}</td>
                      <td className="py-6 px-4 text-slate-600 whitespace-pre-wrap break-words text-[14px] font-medium leading-relaxed">{regla.condicion}</td>
                      <td className="py-6 px-4 text-center whitespace-nowrap">
                        <span className={`text-[11px] font-black uppercase px-3 py-1.5 rounded-md shadow-sm ${regla.tipo === 'positivo' ? 'text-emerald-600 bg-emerald-100 border border-emerald-200' : 'text-rose-600 bg-rose-100 border border-rose-200'}`}>
                          {regla.tipo === 'positivo' ? 'POS (+)' : 'NEG (-)'}
                        </span>
                      </td>
                      <td className="py-6 px-4 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center justify-center px-4 py-2 rounded-xl text-[16px] font-black shadow-sm ${regla.tipo === 'positivo' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'}`}>
                          {regla.puntaje > 0 && regla.tipo === 'positivo' ? `+${regla.puntaje}` : regla.puntaje}
                        </span>
                      </td>
                      <td className="py-6 px-4 text-[14px] text-slate-500 whitespace-pre-wrap break-words leading-relaxed">{regla.justificacion}</td>
                      
                      <td className="py-6 px-6 text-center whitespace-nowrap">
                        {/* 🔥 BOTONES SIEMPRE VISIBLES Y COLORIDOS */}
                        <div className="flex items-center justify-center gap-2 transition-all duration-300">
                          <button onClick={() => iniciarEdicion(regla)} className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 border border-blue-200 rounded-xl transition-all shadow-sm hover:shadow-md hover:scale-105" title="Editar Regla">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => abrirConfirmacionBorrado(regla.id)} className="p-2.5 bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 border border-rose-200 rounded-xl transition-all shadow-sm hover:shadow-md hover:scale-105" title="Eliminar Regla">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}

              {/* 🔥 FILAS NUEVAS INLINE PARA CREACIÓN */}
              {filasNuevas.map((fila, index) => (
                <tr key={fila.idTemp} className={`group relative transition-colors ${fila.advertencia ? 'bg-orange-50/20' : 'bg-blue-50/10 hover:bg-blue-50/20'}`}>
                  
                  {fila.procesando && (
                    <td colSpan={7} className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-lg">
                      <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                    </td>
                  )}

                  {fila.guardado && (
                    <td colSpan={7} className="absolute inset-0 bg-emerald-50/90 backdrop-blur-[1px] flex items-center justify-center z-20 animate-in fade-in duration-300">
                      <div className="flex items-center gap-3 text-emerald-600 font-bold px-8 py-3 rounded-full shadow-sm border border-emerald-200 text-base bg-white">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        ¡Guardado Automáticamente!
                      </div>
                    </td>
                  )}

                  <td className="py-4 px-6 text-center align-top pt-5 relative group/tooltip">
                    {fila.advertencia ? (
                      <AlertTriangle className="w-5 h-5 text-orange-500 mx-auto" />
                    ) : (
                      <span className="text-[10px] font-black text-blue-500 bg-blue-100 px-2 py-1 rounded-md uppercase border border-blue-200 shadow-sm">NUEVA</span>
                    )}
                  </td>
                  
                  <td className="py-4 px-3 align-top">
                    <select 
                      value={fila.categoria} onChange={(e) => actualizarFilaNueva(index, 'categoria', e.target.value)} onBlur={() => intentarAutoGuardadoNueva(index)}
                      className={`w-full h-[48px] px-3 bg-white hover:bg-white focus:bg-white rounded-xl outline-none text-[14px] font-bold text-slate-700 transition-all shadow-sm border focus:border-blue-400 focus:ring-2 focus:ring-blue-100 cursor-pointer ${fila.advertencia ? 'border-orange-300' : 'border-slate-200'}`}
                    >
                      <option value="Estado del lead">Estado del lead</option>
                      <option value="Solicitud de información">Solicitud de información</option>
                      <option value="Solicitud de visita">Solicitud de visita</option>
                      <option value="Interacción registrada">Interacción registrada</option>
                      <option value="Seguimiento reciente">Seguimiento reciente</option>
                      <option value="Tiempo sin contacto">Tiempo sin contacto</option>
                    </select>
                  </td>
                  <td className="py-4 px-3 align-top">
                    <textarea 
                      placeholder="Escribe la condición..." value={fila.condicion} onChange={(e) => actualizarFilaNueva(index, 'condicion', e.target.value)} onBlur={() => intentarAutoGuardadoNueva(index)}
                      className={`w-full h-[48px] px-3 py-3 bg-white hover:bg-white focus:bg-white rounded-xl outline-none text-[14px] font-medium text-slate-700 transition-all shadow-sm border resize-none overflow-y-auto hide-scroll ${fila.advertencia && !fila.condicion.trim() ? 'border-orange-400 ring-2 ring-orange-200' : 'border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'}`}
                    />
                  </td>
                  <td className="py-4 px-3 align-top">
                    <select 
                      value={fila.tipo} onChange={(e) => actualizarFilaNueva(index, 'tipo', e.target.value)} onBlur={() => intentarAutoGuardadoNueva(index)}
                      className={`w-full h-[48px] px-3 bg-white hover:bg-white focus:bg-white rounded-xl outline-none text-[14px] font-bold text-slate-700 transition-all shadow-sm border focus:border-blue-400 focus:ring-2 focus:ring-blue-100 cursor-pointer ${fila.advertencia ? 'border-orange-300' : 'border-slate-200'}`}
                    >
                      <option value="positivo">Pos (+)</option>
                      <option value="negativo">Neg (-)</option>
                    </select>
                  </td>
                  <td className="py-4 px-3 align-top">
                    <input 
                      type="number" placeholder="0" value={fila.puntaje} onChange={(e) => actualizarFilaNueva(index, 'puntaje', e.target.value)} onBlur={() => intentarAutoGuardadoNueva(index)}
                      className={`w-full h-[48px] px-3 bg-white hover:bg-white focus:bg-white rounded-xl outline-none text-[15px] font-black text-center text-slate-700 transition-all shadow-sm border focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ${fila.advertencia ? 'border-orange-300' : 'border-slate-200'}`}
                    />
                  </td>
                  <td className="py-4 px-3 align-top">
                    <textarea 
                      placeholder="Escribe justificación..." value={fila.justificacion} onChange={(e) => actualizarFilaNueva(index, 'justificacion', e.target.value)} onBlur={() => intentarAutoGuardadoNueva(index)}
                      className={`w-full h-[48px] px-3 py-3 bg-white hover:bg-white focus:bg-white rounded-xl outline-none text-[14px] font-medium text-slate-700 transition-all shadow-sm border resize-none overflow-y-auto hide-scroll ${fila.advertencia && !fila.justificacion.trim() ? 'border-orange-400 ring-2 ring-orange-200' : 'border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'}`}
                    />
                  </td>
                  <td className="py-4 px-6 text-center align-top whitespace-nowrap pt-4">
                    <button onClick={() => handleQuitarFilaVacia(index)} className="p-2.5 bg-white text-rose-400 hover:bg-rose-50 hover:text-rose-500 border border-rose-100 rounded-full transition-all shadow-sm hover:shadow-md hover:scale-105" title="Descartar Fila">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
          <span className="text-sm font-bold text-slate-400">
            Mostrando {reglas.length === 0 ? 0 : indiceInicio + 1} a {Math.min(indiceInicio + itemsPorPagina, reglas.length)} de {reglas.length} reglas
          </span>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
              disabled={paginaActual === 1 || reglas.length === 0}
              className="flex items-center gap-1 px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>
            <span className="px-5 py-2 text-sm font-black text-blue-600 bg-blue-50 rounded-lg border border-blue-100 shadow-sm">
              Página {paginaActual} de {totalPaginas}
            </span>
            <button 
              onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
              disabled={paginaActual === totalPaginas || reglas.length === 0}
              className="flex items-center gap-1 px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              Siguiente <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}