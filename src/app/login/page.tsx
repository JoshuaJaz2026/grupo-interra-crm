"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // 👈 Importamos el enrutador
import { Mail, Lock, ArrowRight, Loader2, Building2, ShieldCheck, CheckCircle2, Database, Server, Cloud } from "lucide-react";
import { validarLogin } from "./actions";

export default function LoginPage() {
  const router = useRouter(); // 👈 Inicializamos el enrutador para el salto fluido

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [montado, setMontado] = useState(false);
  
  // Estados para la transición a pantalla completa
  const [exitoLogin, setExitoLogin] = useState(false);
  const [progreso, setProgreso] = useState(0);

  useEffect(() => {
    setMontado(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError("");

    const res = await validarLogin(email, password);

    if (res.exito) {
      // 1. Activamos la pantalla completa de carga
      setExitoLogin(true);
      
      // 2. Llenamos la barra de progreso
      setTimeout(() => setProgreso(100), 100); 
      
      // 3. Teletransportación al dashboard (Viaje sin recarga de navegador)
      setTimeout(() => {
        router.push("/dashboard"); 
      }, 8000);
      
    } else {
      setError(res.error || "Credenciales inválidas.");
      setCargando(false);
    }
  };

  return (
    <>
      {/* 🚀 PANTALLA PRINCIPAL DE LOGIN */}
      <div className={`min-h-screen w-full flex bg-white overflow-hidden selection:bg-blue-500/30 transition-opacity duration-700 ${exitoLogin ? 'opacity-0 pointer-events-none absolute' : 'opacity-100 relative'}`}>
        
        {/* 🌌 PANEL IZQUIERDO: Branding */}
        <div className="hidden lg:flex w-1/2 bg-[#0f172a] relative items-center justify-center p-12 overflow-hidden">
          <div className="absolute top-[-20%] left-[-10%] w-125 h-125 bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen animate-pulse"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-125 h-125 bg-emerald-500/10 blur-[120px] rounded-full mix-blend-screen"></div>
          
          <div className={`relative z-10 text-center transition-all duration-1000 ease-out transform ${montado ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="bg-white/10 w-24 h-24 rounded-3xl backdrop-blur-md flex items-center justify-center mx-auto mb-8 border border-white/10 shadow-2xl transition-transform duration-500 hover:scale-110 hover:rotate-3 cursor-default">
              <Building2 className="w-12 h-12 text-blue-400" />
            </div>
            <h1 className="text-5xl font-black text-white tracking-tight mb-4 drop-shadow-lg">Grupo Interra</h1>
            <p className="text-lg text-slate-400 font-medium max-w-sm mx-auto leading-relaxed">
              Plataforma de Inteligencia Comercial y Gestión de Leads.
            </p>
            
            <div className="mt-12 flex items-center justify-center gap-3 text-slate-400 text-sm font-bold bg-white/5 w-max mx-auto px-6 py-3 rounded-full border border-white/5 shadow-inner">
              <ShieldCheck className="w-5 h-5 text-emerald-400" /> Acceso Restringido
            </div>
          </div>
        </div>

        {/* 🔐 PANEL DERECHO: Formulario de Login */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 bg-white relative">
          <div className={`w-full max-w-md transition-all duration-1000 delay-150 ease-out transform ${montado ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
            
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="bg-[#0f172a] w-12 h-12 rounded-xl flex items-center justify-center shadow-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Grupo Interra</h1>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Iniciar Sesión</h2>
              <p className="text-slate-500 font-medium mb-10 text-[15px]">Ingresa tus credenciales administrativas para acceder al sistema.</p>

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {error && (
                  <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-[14px] font-bold border border-rose-100 flex items-center gap-3 transition-all duration-300 animate-in shake">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0"></span> {error}
                  </div>
                )}

                <div className="space-y-2 group">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-blue-600">Correo Electrónico</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors duration-300" />
                    <input 
                      type="email" 
                      required
                      placeholder="admin@grupointerra.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-2xl text-[15px] font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all duration-300 shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2 group">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-blue-600">Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors duration-300" />
                    <input 
                      type="password" 
                      required
                      placeholder="••••••••" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-2xl text-[15px] font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all duration-300 shadow-sm"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={cargando}
                  className="group w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[15px] shadow-[0_10px_20px_-10px_rgba(37,99,235,0.5)] hover:shadow-[0_15px_25px_-10px_rgba(37,99,235,0.6)] transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {cargando ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Ingresar al Panel <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" /></>}
                </button>
                
              </form>
            </div>
            
            <p className="text-center text-[11px] font-bold text-slate-400 mt-12 tracking-wide">
              © {new Date().getFullYear()} Grupo Interra CRM. Todos los derechos reservados.
            </p>

          </div>
        </div>
      </div>

      {/* 🚀 PANTALLA COMPLETA DE TRANSICIÓN (CUBRE TODO) */}
      {exitoLogin && (
        <div className="fixed inset-0 z-50 bg-[#0f172a] flex flex-col items-center justify-center overflow-hidden animate-in fade-in duration-500">
          
          {/* Luces de fondo estilo servidor */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 blur-[100px] rounded-full mix-blend-screen animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/20 blur-[100px] rounded-full mix-blend-screen animate-pulse delay-700"></div>

          <div className="relative z-10 w-full max-w-xl px-8 flex flex-col items-center animate-in zoom-in-95 duration-700 delay-300">
            
            {/* Contenedor de múltiples iconos técnicos animándose a la vez */}
            <div className="flex items-center gap-6 mb-12">
              <div className="flex flex-col items-center gap-2 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-[400ms]">
                <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/50 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                  <ShieldCheck className="w-8 h-8 animate-pulse" />
                </div>
                <span className="text-[10px] text-slate-400 font-black tracking-widest uppercase">Seguridad</span>
              </div>
              
              <div className="w-8 h-[2px] bg-slate-700 rounded-full animate-in fade-in duration-1000 delay-[500ms]">
                <div className="h-full bg-blue-500 rounded-full w-full animate-[pulse_1s_ease-in-out_infinite]"></div>
              </div>

              <div className="flex flex-col items-center gap-2 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-[600ms]">
                <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/50 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                  <Database className="w-8 h-8 animate-pulse" />
                </div>
                <span className="text-[10px] text-slate-400 font-black tracking-widest uppercase">Datos</span>
              </div>

              <div className="w-8 h-[2px] bg-slate-700 rounded-full animate-in fade-in duration-1000 delay-[700ms]">
                <div className="h-full bg-indigo-500 rounded-full w-full animate-[pulse_1s_ease-in-out_infinite] delay-150"></div>
              </div>

              <div className="flex flex-col items-center gap-2 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-[800ms]">
                <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/50 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                  <Cloud className="w-8 h-8 animate-pulse" />
                </div>
                <span className="text-[10px] text-slate-400 font-black tracking-widest uppercase">Entorno</span>
              </div>
            </div>

            <h3 className="text-3xl font-black text-white tracking-tight text-center mb-3">Estableciendo Conexión</h3>
            <p className="text-slate-400 font-medium text-[16px] text-center mb-12 animate-pulse">
              Encriptando sesión y cargando entorno de trabajo...
            </p>
            
            {/* Barra de progreso gigante a pantalla completa */}
            <div className="w-full h-3 bg-slate-800/50 backdrop-blur-sm rounded-full overflow-hidden border border-slate-700/50 shadow-inner relative">
              {/* Brillo que viaja por la barra */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full h-full -translate-x-full animate-[shimmer_2s_infinite]"></div>
              
              {/* La barra llenándose de manera suave y progresiva durante 7.5 segundos */}
              <div 
                className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-400 rounded-full transition-all duration-[7500ms] ease-out relative"
                style={{ width: `${progreso}%` }}
              >
                {/* Check final que aparece exactamente cuando la barra llega al final */}
                {progreso > 0 && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-8 h-8 bg-emerald-500 rounded-full border-4 border-[#0f172a] flex items-center justify-center animate-in zoom-in duration-300 delay-[7500ms]">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="w-full flex justify-between mt-3 px-1">
              <span className="text-[10px] text-slate-500 font-black tracking-widest uppercase">0%</span>
              <span className="text-[10px] text-slate-500 font-black tracking-widest uppercase">100%</span>
            </div>

          </div>
        </div>
      )}
    </>
  );
}