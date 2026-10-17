"use client";

import { useState, useEffect } from "react";
import { UserPlus, Search, Edit, Trash2, Mail, Loader2, CheckCircle2, AlertTriangle, ChevronLeft, ChevronRight, User, Key, Phone, X } from "lucide-react";
import { obtenerAsesores, crearAsesor, eliminarAsesor } from "./actions";

function ModalConfirmacion({ visible, onConfirm, onCancel, mensaje, cargando }: { visible: boolean, onConfirm: () => void, onCancel: () => void, mensaje: string, cargando: boolean }) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-rose-500"></div>
        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
          <Trash2 className="w-8 h-8 text-rose-500 animate-pulse" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">¿Eliminar Asesor?</h3>
        <p className="text-slate-500 font-medium mb-8 leading-relaxed">
          {mensaje}
        </p>
        <div className="flex flex-col gap-3">
          <button 
            onClick={onConfirm} disabled={cargando} 
            className="w-full h-12 bg-rose-500 hover:bg-rose-600 text-white text-[15px] font-black rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {cargando ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sí, eliminar ahora"}
          </button>
          <button 
            onClick={onCancel} disabled={cargando} 
            className="w-full h-12 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[15px] font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AsesoresPage() {
  const [asesores, setAsesores] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 8;
  
  const [modalBorrar, setModalBorrar] = useState({ visible: false, id: "", cargando: false });

  const [filaEdicion, setFilaEdicion] = useState<{
    modo: 'ninguno' | 'crear' | 'editar',
    id?: string,
    nombres: string, apellidos: string, correo: string, telefono: string, contrasena: string,
    procesando: boolean, guardado: boolean, advertencia: boolean
  }>({
    modo: 'ninguno', nombres: "", apellidos: "", correo: "", telefono: "", contrasena: "",
    procesando: false, guardado: false, advertencia: false
  });

  const cargarDatos = async () => {
    setCargando(true);
    const res = await obtenerAsesores();
    if (res.exito) setAsesores(res.datos);
    setCargando(false);
  };

  useEffect(() => { cargarDatos(); }, []);

  const iniciarCreacion = () => {
    setFilaEdicion({
      modo: 'crear', nombres: "", apellidos: "", correo: "", telefono: "", contrasena: "",
      procesando: false, guardado: false, advertencia: false
    });
  };

  const iniciarEdicion = (asesor: any) => {
    setFilaEdicion({
      modo: 'editar', id: asesor.id, nombres: asesor.nombres, apellidos: asesor.apellidos, 
      correo: asesor.correo, telefono: asesor.telefono || "", contrasena: "", 
      procesando: false, guardado: false, advertencia: false
    });
  };

  const intentarAutoGuardado = async () => {
    if (filaEdicion.modo === 'ninguno' || filaEdicion.procesando || filaEdicion.guardado) return;

    if (!filaEdicion.nombres.trim() || !filaEdicion.apellidos.trim() || !filaEdicion.correo.trim() || (filaEdicion.modo === 'crear' && !filaEdicion.contrasena.trim())) {
      const hayAlgunDato = filaEdicion.nombres.trim() || filaEdicion.apellidos.trim() || filaEdicion.correo.trim();
      if (hayAlgunDato) {
          setFilaEdicion(prev => ({ ...prev, advertencia: true }));
      }
      return;
    }

    setFilaEdicion(prev => ({ ...prev, procesando: true, advertencia: false }));

    let res;
    if (filaEdicion.modo === 'crear') {
      res = await crearAsesor({
        nombres: filaEdicion.nombres, apellidos: filaEdicion.apellidos,
        correo: filaEdicion.correo, telefono: filaEdicion.telefono, contrasena: filaEdicion.contrasena
      });
    } else {
      alert("⚠️ Función de actualización pendiente de conectar en backend");
      setFilaEdicion(prev => ({ ...prev, procesando: false, modo: 'ninguno' }));
      return;
    }

    if (res.exito) {
      setFilaEdicion(prev => ({ ...prev, procesando: false, guardado: true }));
      setTimeout(async () => {
        await cargarDatos();
        setFilaEdicion(prev => ({ ...prev, modo: 'ninguno', guardado: false }));
      }, 1200);
    } else {
      setFilaEdicion(prev => ({ ...prev, procesando: false }));
      alert("⚠️ Error: " + res.error);
    }
  };

  const abrirConfirmacionBorrado = (id: string) => {
    setModalBorrar({ visible: true, id, cargando: false });
  };

  const procesarBorradoSeguro = async () => {
    setModalBorrar(prev => ({ ...prev, cargando: true }));
    await eliminarAsesor(modalBorrar.id);
    await cargarDatos();
    setModalBorrar({ visible: false, id: "", cargando: false });
  };

  const filtrados = asesores.filter(a => 
    a.nombres.toLowerCase().includes(busqueda.toLowerCase()) || 
    a.correo.toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalPaginas = Math.ceil(filtrados.length / itemsPorPagina) || 1;
  const indiceInicio = (paginaActual - 1) * itemsPorPagina;
  const asesoresPaginados = filtrados.slice(indiceInicio, indiceInicio + itemsPorPagina);

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-700 w-full h-screen bg-slate-50/50 flex flex-col overflow-hidden">
      
      <ModalConfirmacion 
        visible={modalBorrar.visible}
        cargando={modalBorrar.cargando}
        onConfirm={procesarBorradoSeguro}
        onCancel={() => setModalBorrar({ visible: false, id: "", cargando: false })}
        mensaje="Esta acción es irreversible y el vendedor perderá acceso al sistema inmediatamente."
      />

      <div className="shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Gestión de Asesores 
            <span className="bg-blue-500/10 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase shadow-sm border border-blue-500/20">Directorio</span>
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1.5">Control de acceso y métricas del equipo comercial.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" placeholder="Buscar asesor..." 
              value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-full text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all shadow-sm"
            />
          </div>
          <button 
            onClick={iniciarCreacion}
            className="bg-[#0f172a] hover:bg-slate-800 text-white px-6 py-2.5 rounded-full font-bold shadow-md hover:shadow-xl transition-all hover:-translate-y-0.5 text-sm flex items-center gap-2 shrink-0 border border-slate-700"
          >
            <UserPlus className="w-4 h-4" /> Agregar Asesor
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white border border-slate-200 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col overflow-hidden min-h-0 mt-2">
        <div className="flex-1 overflow-auto bg-white block scrollbar-none">
          <table className="w-full text-left table-fixed min-w-[900px]">
            <thead className="bg-white border-b border-slate-100 text-slate-500 sticky top-0 z-20 whitespace-nowrap">
              <tr>
                <th className="py-5 px-8 font-black text-[11px] uppercase tracking-widest text-slate-400 w-[32%]">Nombres Completos</th>
                <th className="py-5 px-4 font-black text-[11px] uppercase tracking-widest text-slate-400 w-[24%]">Datos de Contacto</th>
                <th className="py-5 px-4 font-black text-[11px] uppercase tracking-widest text-center w-[11%] text-slate-400">Leads</th>
                <th className="py-5 px-4 font-black text-[11px] uppercase tracking-widest text-center w-[11%] text-slate-400">Ventas</th>
                <th className="py-5 px-4 font-black text-[11px] uppercase tracking-widest text-center w-[11%] text-slate-400">Conversión</th>
                <th className="py-5 px-4 font-black text-[11px] uppercase tracking-widest text-center w-[11%] text-slate-400">Estado</th>
                <th className="py-5 px-6 font-black text-[11px] uppercase tracking-widest text-center w-[12%] text-slate-400">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700 bg-white">
              
              {/* FILA DE CREACIÓN */}
              {filaEdicion.modo === 'crear' && (
                <tr className={`group relative transition-colors ${filaEdicion.advertencia ? 'bg-orange-50/30' : 'bg-blue-50/10 hover:bg-blue-50/20'}`}>
                  
                  {filaEdicion.procesando && (
                    <td colSpan={7} className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                      <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                    </td>
                  )}

                  {filaEdicion.guardado && (
                    <td colSpan={7} className="absolute inset-0 bg-emerald-50/90 backdrop-blur-[1px] flex items-center justify-center z-20 animate-in fade-in duration-300">
                      <div className="flex items-center gap-3 text-emerald-600 font-bold px-8 py-3 rounded-full shadow-sm border border-emerald-200 text-base bg-white">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        ¡Guardado Automáticamente!
                      </div>
                    </td>
                  )}

                  <td className="py-6 px-6 align-top">
                    <div className="flex items-start gap-4 w-full">
                      <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0 mt-1">
                        <UserPlus className="w-6 h-6" />
                      </div>
                      <div className="flex flex-col w-full gap-3 min-w-0">
                        <input type="text" placeholder="Nombres..." autoComplete="off" value={filaEdicion.nombres} onChange={e => setFilaEdicion({...filaEdicion, nombres: e.target.value})} onBlur={intentarAutoGuardado} className={`w-full h-[46px] px-4 bg-white hover:bg-white focus:bg-white rounded-xl outline-none text-[15px] font-bold text-slate-700 transition-all shadow-sm border ${filaEdicion.advertencia && !filaEdicion.nombres ? 'border-orange-400 ring-2 ring-orange-200' : 'border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'}`} />
                        <input type="text" placeholder="Apellidos..." autoComplete="off" value={filaEdicion.apellidos} onChange={e => setFilaEdicion({...filaEdicion, apellidos: e.target.value})} onBlur={intentarAutoGuardado} className={`w-full h-[46px] px-4 bg-white hover:bg-white focus:bg-white rounded-xl outline-none text-[15px] font-bold text-slate-700 transition-all shadow-sm border ${filaEdicion.advertencia && !filaEdicion.apellidos ? 'border-orange-400 ring-2 ring-orange-200' : 'border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'}`} />
                      </div>
                    </div>
                  </td>

                  <td className="py-6 px-3 align-top min-w-0">
                    <div className="flex flex-col gap-3 pt-1 w-full min-w-0">
                      <input type="email" placeholder="Correo (@interra.pe)" autoComplete="off" value={filaEdicion.correo} onChange={e => setFilaEdicion({...filaEdicion, correo: e.target.value})} onBlur={intentarAutoGuardado} className={`w-full h-[46px] px-4 bg-white hover:bg-white focus:bg-white rounded-xl outline-none text-[15px] font-bold text-slate-700 transition-all shadow-sm border truncate ${filaEdicion.advertencia && !filaEdicion.correo ? 'border-orange-400 ring-2 ring-orange-200' : 'border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'}`} />
                      <div className="flex gap-3 w-full min-w-0">
                        <input type="tel" placeholder="Teléfono" autoComplete="off" value={filaEdicion.telefono} onChange={e => setFilaEdicion({...filaEdicion, telefono: e.target.value})} onBlur={intentarAutoGuardado} className="w-1/2 h-[46px] px-4 bg-white hover:bg-white focus:bg-white rounded-xl outline-none text-[15px] font-bold text-slate-700 transition-all shadow-sm border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 truncate" />
                        <input type="password" placeholder="Contraseña" autoComplete="new-password" value={filaEdicion.contrasena} onChange={e => setFilaEdicion({...filaEdicion, contrasena: e.target.value})} onBlur={intentarAutoGuardado} className={`w-1/2 h-[46px] px-4 bg-white hover:bg-white focus:bg-white rounded-xl outline-none text-[15px] font-bold text-slate-700 transition-all shadow-sm border truncate ${filaEdicion.advertencia && !filaEdicion.contrasena ? 'border-orange-400 ring-2 ring-orange-200' : 'border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'}`} />
                      </div>
                    </div>
                  </td>

                  <td className="py-6 px-4 text-center align-middle">
                    <span className="text-[14px] font-black text-slate-400">0</span>
                  </td>
                  <td className="py-6 px-4 text-center align-middle">
                    <span className="text-[14px] font-black text-slate-400">0</span>
                  </td>
                  <td className="py-6 px-4 text-center align-middle">
                    <span className="bg-slate-100/50 text-slate-400 px-4 py-1.5 rounded-full font-bold text-[13px] border border-slate-100">0%</span>
                  </td>

                  <td className="py-6 px-4 text-center align-middle">
                    <span className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 border border-slate-200 shadow-sm flex items-center justify-center w-fit mx-auto">
                      NUEVO
                    </span>
                  </td>

                  <td className="py-6 px-4 text-center align-middle whitespace-nowrap">
                    <div className="flex flex-col items-center justify-center gap-3">
                       {filaEdicion.advertencia && (
                         <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-orange-600 bg-orange-100 px-3 py-1 rounded shadow-sm border border-orange-200 mb-1">
                           <AlertTriangle className="w-3.5 h-3.5"/> Faltan datos
                         </span>
                       )}
                       <button onClick={() => setFilaEdicion(prev => ({...prev, modo: 'ninguno', advertencia: false}))} className="p-3 bg-white text-rose-400 hover:bg-rose-50 hover:text-rose-600 border border-rose-100 rounded-xl transition-all shadow-sm hover:shadow-md" title="Descartar">
                         <X className="w-5 h-5" />
                       </button>
                    </div>
                  </td>
                </tr>
              )}

              {/* FILAS DE USUARIOS GUARDADOS */}
              {cargando ? (
                <tr><td colSpan={7} className="py-16 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" /></td></tr>
              ) : asesoresPaginados.length === 0 && filaEdicion.modo !== 'crear' ? (
                <tr><td colSpan={7} className="py-16 text-center text-slate-400 font-bold text-lg">No se encontraron asesores registrados.</td></tr>
              ) : (
                asesoresPaginados.map((asesor, i) => {
                  
                  // FILA EN MODO EDICIÓN
                  if (filaEdicion.modo === 'editar' && filaEdicion.id === asesor.id) {
                    return (
                      <tr key={asesor.id} className="bg-amber-50/40 group relative transition-colors">
                        {filaEdicion.procesando && (
                          <td colSpan={7} className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                            <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                          </td>
                        )}
                        <td className="py-6 px-6 align-top">
                          <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0 mt-1">
                              <Edit className="w-6 h-6" />
                            </div>
                            <div className="flex flex-col w-full gap-3 min-w-0">
                              <input type="text" placeholder="Nombres..." autoComplete="off" value={filaEdicion.nombres} onChange={e => setFilaEdicion({...filaEdicion, nombres: e.target.value})} onBlur={intentarAutoGuardado} className="w-full h-[46px] px-4 bg-white hover:bg-white focus:bg-white rounded-xl outline-none text-[15px] font-bold text-slate-700 transition-all shadow-sm border border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 truncate" />
                              <input type="text" placeholder="Apellidos..." autoComplete="off" value={filaEdicion.apellidos} onChange={e => setFilaEdicion({...filaEdicion, apellidos: e.target.value})} onBlur={intentarAutoGuardado} className="w-full h-[46px] px-4 bg-white hover:bg-white focus:bg-white rounded-xl outline-none text-[15px] font-bold text-slate-700 transition-all shadow-sm border border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 truncate" />
                            </div>
                          </div>
                        </td>
                        <td className="py-6 px-3 align-top min-w-0">
                          <div className="flex flex-col gap-3 pt-1 w-full">
                            <input type="email" placeholder="Correo (@interra.pe)" autoComplete="off" value={filaEdicion.correo} onChange={e => setFilaEdicion({...filaEdicion, correo: e.target.value})} onBlur={intentarAutoGuardado} className="w-full h-[46px] px-4 bg-white hover:bg-white focus:bg-white rounded-xl outline-none text-[15px] font-bold text-slate-700 transition-all shadow-sm border border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 truncate" />
                            <div className="flex gap-3">
                              <input type="tel" placeholder="Teléfono" autoComplete="off" value={filaEdicion.telefono} onChange={e => setFilaEdicion({...filaEdicion, telefono: e.target.value})} onBlur={intentarAutoGuardado} className="w-1/2 h-[46px] px-4 bg-white hover:bg-white focus:bg-white rounded-xl outline-none text-[15px] font-bold text-slate-700 transition-all shadow-sm border border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 truncate" />
                              <input type="password" placeholder="Nueva Clave" autoComplete="new-password" value={filaEdicion.contrasena} onChange={e => setFilaEdicion({...filaEdicion, contrasena: e.target.value})} onBlur={intentarAutoGuardado} className="w-1/2 h-[46px] px-4 bg-white hover:bg-white focus:bg-white rounded-xl outline-none text-[15px] font-bold text-slate-700 transition-all shadow-sm border border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 truncate" />
                            </div>
                          </div>
                        </td>
                        <td className="py-6 px-4 text-center align-middle font-bold text-slate-500 text-[16px]">{asesor.leadsAsignados}</td>
                        <td className="py-6 px-4 text-center align-middle font-black text-slate-800 text-[18px]">{asesor.leadsGanados}</td>
                        <td className="py-6 px-4 text-center align-middle"><span className="bg-slate-100 text-slate-700 px-4 py-1.5 rounded-full font-bold text-[14px] border border-slate-200">{asesor.tasaConversion}%</span></td>
                        <td className="py-6 px-4 text-center align-middle">
                          <span className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-600 border border-amber-200 shadow-sm flex items-center justify-center w-fit mx-auto">
                            EDITANDO
                          </span>
                        </td>
                        <td className="py-6 px-4 text-center align-middle whitespace-nowrap">
                          <button onClick={() => setFilaEdicion(prev => ({...prev, modo: 'ninguno'}))} className="p-3 bg-white text-rose-400 hover:bg-rose-50 hover:text-rose-500 border border-rose-100 rounded-xl transition-all shadow-sm hover:shadow-md" title="Descartar Cambios">
                            <X className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  }

                  // MODO VISUALIZACIÓN NORMAL
                  return (
                  <tr key={asesor.id} className="hover:bg-slate-50/80 transition-all duration-300 group relative z-10 hover:z-20 border-b border-slate-50 last:border-0">
                    <td className="py-5 px-8">
                      <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-[18px] font-black shadow-sm uppercase shrink-0
                          ${i % 3 === 0 ? 'bg-blue-100 text-blue-700 border border-blue-200' : 
                            i % 3 === 1 ? 'bg-purple-100 text-purple-700 border border-purple-200' : 
                            'bg-emerald-100 text-emerald-700 border border-emerald-200'}
                        `}>
                          {asesor.nombres.charAt(0)}{asesor.apellidos.charAt(0)}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-black text-slate-900 text-[18px] tracking-tight truncate w-full">{asesor.nombres} {asesor.apellidos}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-4 text-left min-w-0">
                      <div className="flex flex-col gap-1.5 w-full">
                        <span className="text-[14px] text-slate-600 font-bold flex items-center gap-2 truncate w-full"><Mail className="w-4 h-4 text-slate-400 shrink-0" /> <span className="truncate">{asesor.correo}</span></span>
                        <span className="text-[13px] text-slate-400 font-medium flex items-center gap-2 truncate w-full"><Phone className="w-4 h-4 shrink-0" /> <span className="truncate">{asesor.telefono || "Sin registrar"}</span></span>
                      </div>
                    </td>
                    <td className="py-5 px-4 text-center font-bold text-slate-500 text-[18px]">{asesor.leadsAsignados}</td>
                    <td className="py-5 px-4 text-center font-black text-slate-800 text-[20px]">{asesor.leadsGanados}</td>
                    <td className="py-5 px-4 text-center">
                      <span className="bg-slate-100 text-slate-700 px-4 py-1.5 rounded-full font-bold text-[14px] border border-slate-200">
                        {asesor.tasaConversion}%
                      </span>
                    </td>
                    <td className="py-5 px-4 text-center">
                      <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm flex items-center justify-center gap-1.5 w-fit mx-auto">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        {asesor.estado}
                      </span>
                    </td>
                    
                    <td className="py-5 px-6 text-center">
                      <div className="flex items-center justify-center gap-2 transition-opacity duration-300">
                        <button onClick={() => iniciarEdicion(asesor)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-slate-100 rounded-xl transition-all hover:scale-105 shadow-sm" title="Editar Asesor">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => abrirConfirmacionBorrado(asesor.id)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-100 rounded-xl transition-all hover:scale-105 shadow-sm" title="Eliminar Asesor">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
          <span className="text-sm font-bold text-slate-500">
            Mostrando {filtrados.length === 0 ? 0 : indiceInicio + 1} a {Math.min(indiceInicio + itemsPorPagina, filtrados.length)} de {filtrados.length} asesores
          </span>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
              disabled={paginaActual === 1 || filtrados.length === 0}
              className="flex items-center gap-1 px-4 py-2 border border-slate-200 bg-white rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>
            <span className="px-5 py-2 text-sm font-black text-blue-600 bg-blue-50 rounded-xl border border-blue-100 shadow-sm">
              Página {paginaActual} de {totalPaginas}
            </span>
            <button 
              onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
              disabled={paginaActual === totalPaginas || filtrados.length === 0}
              className="flex items-center gap-1 px-4 py-2 border border-slate-200 bg-white rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              Siguiente <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}