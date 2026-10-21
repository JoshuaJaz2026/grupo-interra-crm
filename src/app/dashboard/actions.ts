"use server";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { unstable_noStore as noStore } from "next/cache";
import { revalidatePath } from "next/cache";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

// 🔥 NUEVA FUNCIÓN: (Le quitamos el 'export' para que Next.js no falle)
function calcularPuntajeLead(lead: any) {
  let score = 0;

  score += (Number(lead.numInteracciones) || 0) * 5;

  if (lead.solicitudVisita) score += 30;
  if (lead.solicitudInfo) score += 10;

  const estado = (lead.estado || "").toLowerCase();
  switch (estado) {
    case "negociación":
      score += 25; 
      break;
    case "visita solicitada":
      score += 20;
      break;
    case "interesado":
      score += 15;
      break;
    case "contactado":
      score += 5;
      break;
  }

  if (lead.seguimientoRealizado) {
    score += 10; 
  }

  if (lead.fechaUltimoContacto) {
    const hoy = new Date();
    const diasSinContacto = (hoy.getTime() - new Date(lead.fechaUltimoContacto).getTime()) / (1000 * 3600 * 24);
    
    if (diasSinContacto <= 3) {
      score += 10; 
    } else if (diasSinContacto > 7) {
      score -= 15; 
    }
  }

  return Math.max(0, score);
}

// 1. EXTRAER MATEMÁTICAS PARA EL DASHBOARD
export async function obtenerEstadisticasDashboard() {
  noStore();
  try {
    const leads = await prisma.lead.findMany();
    
    if (leads.length === 0) {
      return { exito: true, datos: { total: 0, ganados: 0, perdidos: 0, scorePromedio: 0, leadsViejos: 0, campanas: [], estados: [] } };
    }

    const total = leads.length;
    const ganados = leads.filter(l => l.estado?.toLowerCase() === "ganado" || l.resultado?.toLowerCase() === "ganado").length;
    const perdidos = leads.filter(l => l.estado?.toLowerCase() === "perdido" || l.resultado?.toLowerCase() === "perdido").length;
    
    const puntajeTotal = leads.reduce((acc, curr) => acc + (curr.puntaje || 0), 0);
    const scorePromedio = total > 0 ? (puntajeTotal / total).toFixed(1) : 0;

    const hoy = new Date();
    const leadsViejos = leads.filter(l => {
      const estado = l.estado?.toLowerCase() || "";
      if (estado === "ganado" || estado === "perdido") return false; 

      if (!l.seguimientoRealizado) return true;
      if (l.proximoSeguimiento && new Date(l.proximoSeguimiento) < hoy) return true;
      
      if (l.fechaUltimoContacto && !l.proximoSeguimiento) {
        const diasSinContacto = (hoy.getTime() - new Date(l.fechaUltimoContacto).getTime()) / (1000 * 3600 * 24);
        if (diasSinContacto > 3) return true;
      }
      return false;
    }).length;

    const conteoCampanas: Record<string, number> = {};
    leads.forEach(l => {
      const camp = l.campana || "Sin Campaña";
      const proy = l.proyecto || "General";
      const llave = `${camp} (${proy})`;
      conteoCampanas[llave] = (conteoCampanas[llave] || 0) + 1;
    });
    const graficaCampanas = Object.keys(conteoCampanas)
      .map(key => ({ name: key, leads: conteoCampanas[key] }))
      .sort((a, b) => b.leads - a.leads) 
      .slice(0, 5); 

    const conteoEstados: Record<string, number> = {};
    leads.forEach(l => {
      const est = l.estado || "Desconocido";
      conteoEstados[est] = (conteoEstados[est] || 0) + 1;
    });
    const graficaEstados = Object.keys(conteoEstados).map(key => ({ name: key, value: conteoEstados[key] }));

    return { 
      exito: true, 
      datos: { 
        total, ganados, perdidos,
        scorePromedio,
        leadsViejos, 
        campanas: graficaCampanas, 
        estados: graficaEstados 
      } 
    };
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    return { exito: false, datos: null };
  }
}

// 2. INYECTOR BAZOOKA DE EXCEL A POSTGRESQL
export async function cargarLeadsMasivos(leadsExcel: any[]) {
  try {
    const parseDate = (val: any) => {
      if (!val || val === "-" || val === "") return null;
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    };

    const parseBool = (val: any) => {
      if (typeof val === 'string') return val.toLowerCase().includes('sí') || val.toLowerCase().includes('si') || val.toLowerCase() === 'true';
      return Boolean(val);
    };

    const leadsFormateados = leadsExcel.map(row => {
      const leadBase = {
        idLeadExcel: String(row["ID Lead"] || `EXT-${Math.floor(Math.random() * 10000)}`),
        fechaCaptacion: parseDate(row["Fecha captación"]),
        campana: String(row["Campaña"] || "Orgánico"),
        proyecto: String(row["Proyecto"] || "General"),
        fuente: String(row["Fuente"] || ""),
        cliente: String(row["Cliente"] || "Desconocido"),
        asesor: String(row["Asesor responsable"] || "Sin Asignar"),
        estado: String(row["Estado del lead"] || "Nuevo"),
        fechaPrimerContacto: parseDate(row["Fecha primer contacto"]),
        fechaUltimoContacto: parseDate(row["Fecha último contacto"]),
        solicitudInfo: parseBool(row["Solicitud información"]),
        solicitudVisita: parseBool(row["Solicitud visita"]),
        numInteracciones: Number(row["N° interacciones"]) || 0,
        seguimientoRealizado: parseBool(row["Seguimiento realizado"]),
        proximoSeguimiento: parseDate(row["Próximo seguimiento"]),
        resultado: String(row["Resultado"] || "En proceso"),
        fechaCierre: parseDate(row["Fecha cierre"])
      };

      const score = calcularPuntajeLead(leadBase);

      return {
        ...leadBase,
        puntaje: score
      };
    });

    await prisma.lead.createMany({
      data: leadsFormateados,
      skipDuplicates: true,
    });

    revalidatePath('/dashboard');
    revalidatePath('/seguimiento');
    return { exito: true };
  } catch (error) {
    console.error("Error en carga masiva:", error);
    return { exito: false, error: "Error interno al inyectar los leads a la base de datos." };
  }
}