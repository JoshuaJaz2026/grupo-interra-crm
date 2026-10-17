"use server";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { unstable_noStore as noStore } from "next/cache";
import { revalidatePath } from "next/cache";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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
    
    // Promedio de Score de todo el equipo
    const puntajeTotal = leads.reduce((acc, curr) => acc + (curr.puntaje || 0), 0);
    const scorePromedio = total > 0 ? (puntajeTotal / total).toFixed(1) : 0;

    // Alerta de "Leads Viejos": Leads que no se les ha hecho seguimiento y siguen vivos
    const leadsViejos = leads.filter(l => !l.seguimientoRealizado && l.estado?.toLowerCase() !== "ganado" && l.estado?.toLowerCase() !== "perdido").length;

    // Gráfico 1: Top 5 Campañas Meta Ads
    const conteoCampanas: Record<string, number> = {};
    leads.forEach(l => {
      const camp = l.campana || "Sin Campaña";
      conteoCampanas[camp] = (conteoCampanas[camp] || 0) + 1;
    });
    const graficaCampanas = Object.keys(conteoCampanas)
      .map(key => ({ name: key, leads: conteoCampanas[key] }))
      .sort((a, b) => b.leads - a.leads) // Ordenar de mayor a menor
      .slice(0, 5); // Tomar solo el Top 5 para que el gráfico no colapse

    // Gráfico 2: Dona de Estados (Pipeline)
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
      // Simulación de Lead Scoring dinámico basado en tu Excel
      const interacciones = Number(row["N° interacciones"]) || 0;
      const score = (interacciones * 5) + (parseBool(row["Solicitud visita"]) ? 30 : 0) + (parseBool(row["Solicitud información"]) ? 10 : 0);

      return {
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
        numInteracciones: interacciones,
        seguimientoRealizado: parseBool(row["Seguimiento realizado"]),
        proximoSeguimiento: parseDate(row["Próximo seguimiento"]),
        resultado: String(row["Resultado"] || "En proceso"),
        fechaCierre: parseDate(row["Fecha cierre"]),
        puntaje: score
      };
    });

    // Inserción múltiple
    await prisma.lead.createMany({
      data: leadsFormateados,
      skipDuplicates: true, // Si subes el mismo Excel dos veces, no duplicará a los clientes
    });

    // Avisarle a Next.js que debe recargar el Dashboard y la tabla de Seguimiento en vivo
    revalidatePath('/dashboard');
    revalidatePath('/seguimiento');
    return { exito: true };
  } catch (error) {
    console.error("Error en carga masiva:", error);
    return { exito: false, error: "Error interno al inyectar los leads a la base de datos." };
  }
}