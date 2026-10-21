"use server";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { unstable_noStore as noStore } from "next/cache";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

export async function obtenerMetricasDesempeno(
  filtroTiempo: string = "Últimos 30 días",
  fechaInicioCustom?: string,
  fechaFinCustom?: string
) {
  noStore(); 

  try {
    let fechaInicio = new Date();
    let fechaFin = new Date();

    const esUnAnoExacto = /^\d{4}\$/.test(filtroTiempo);

    if (esUnAnoExacto) {
      const anoNum = parseInt(filtroTiempo);
      fechaInicio = new Date(anoNum, 0, 1);
      fechaFin = new Date(anoNum, 11, 31, 23, 59, 59);
    } else {
      switch (filtroTiempo) {
        case "Este mes":
          fechaInicio = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth(), 1);
          break;
        case "Mes anterior":
          fechaInicio = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth() - 1, 1);
          fechaFin = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth(), 0, 23, 59, 59);
          break;
        case "Este año":
          fechaInicio = new Date(fechaInicio.getFullYear(), 0, 1);
          break;
        case "Personalizado":
          if (fechaInicioCustom && fechaFinCustom) {
            const [yI, mI, dI] = fechaInicioCustom.split('-').map(Number);
            const [yF, mF, dF] = fechaFinCustom.split('-').map(Number);
            fechaInicio = new Date(yI, mI - 1, dI, 0, 0, 0);
            fechaFin = new Date(yF, mF - 1, dF, 23, 59, 59);
          }
          break;
        case "Últimos 30 días":
        default:
          fechaInicio.setDate(fechaInicio.getDate() - 30);
          break;
      }
    }

    const rangoFechas = {
      creadoEn: {
        gte: fechaInicio,
        lte: fechaFin,
      },
    };

    const totalLeads = await prisma.lead.count({ where: rangoFechas });
    
    const leadsCerrados = await prisma.lead.count({ 
      where: { 
        estado: { in: ["Ganado", "Vendido", "GANADO"] }, 
        ...rangoFechas 
      } 
    });
    
    const leadsPerdidos = await prisma.lead.count({ 
      where: { 
        estado: { in: ["Perdido", "PERDIDO"] }, 
        ...rangoFechas 
      } 
    });

    const tasaConversion = totalLeads > 0 ? ((leadsCerrados / totalLeads) * 100).toFixed(1) : "0.0";

    // Extraemos fechas para el KPI de Tiempo de Respuesta Real
    const leadsParaGraficos = await prisma.lead.findMany({
      where: rangoFechas,
      select: { 
        creadoEn: true, 
        estado: true, 
        asesor: true,
        fechaCaptacion: true,
        fechaPrimerContacto: true // Dato crucial según Tabla 5
      },
      orderBy: { creadoEn: 'asc' } 
    });

    const evolucionMap = new Map();
    const asesoresMap = new Map();

    // Variables para calcular el Tiempo Promedio de Respuesta
    let tiempoTotalMinutos = 0;
    let leadsConTiempo = 0;

    leadsParaGraficos.forEach(lead => {
      // 1. Agrupar para el Gráfico de Evolución (Líneas)
      const fechaLocal = new Date(lead.creadoEn);
      const diaMes = `${fechaLocal.getDate().toString().padStart(2, '0')}/${(fechaLocal.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!evolucionMap.has(diaMes)) {
        evolucionMap.set(diaMes, { leads: 0, cierres: 0 });
      }
      const evo = evolucionMap.get(diaMes);
      evo.leads++;
      if (["ganado", "vendido"].includes((lead.estado || "").toLowerCase())) {
        evo.cierres++;
      }

      // 2. Agrupar para el Gráfico de Asesores (Barras)
      const asesor = lead.asesor || "Sin Asignar";
      if (!asesoresMap.has(asesor)) {
        asesoresMap.set(asesor, { total: 0, ganados: 0 });
      }
      const ase = asesoresMap.get(asesor);
      ase.total++;
      if (["ganado", "vendido"].includes((lead.estado || "").toLowerCase())) {
        ase.ganados++;
      }

      // 3. 🔥 KPI REAL: Tiempo de Respuesta Comercial
      if (lead.fechaPrimerContacto) {
        // Tomamos fechaCaptacion; si no hay, la fecha en que se creó en base de datos
        const fechaIngreso = lead.fechaCaptacion ? new Date(lead.fechaCaptacion) : new Date(lead.creadoEn);
        const fechaContacto = new Date(lead.fechaPrimerContacto);
        
        const diffMilisegundos = fechaContacto.getTime() - fechaIngreso.getTime();
        
        // Solo sumamos si la fecha de contacto fue lógicamente después de la captación
        if (diffMilisegundos >= 0) { 
          tiempoTotalMinutos += diffMilisegundos / (1000 * 60); // Convertimos a minutos
          leadsConTiempo++;
        }
      }
    });

    // Formatear inteligentemente los minutos a "h m" o "días"
    let tiempoRespuestaStr = "0m";
    if (leadsConTiempo > 0) {
      const promMinutos = Math.round(tiempoTotalMinutos / leadsConTiempo);
      if (promMinutos >= 60) {
         const horas = Math.floor(promMinutos / 60);
         const mins = promMinutos % 60;
         
         if (horas >= 24) { // Si tardan más de un día en contestar
           const dias = Math.floor(horas / 24);
           const horasRestantes = horas % 24;
           tiempoRespuestaStr = `${dias}d ${horasRestantes}h`;
         } else {
           tiempoRespuestaStr = `${horas}h ${mins}m`;
         }
      } else {
         tiempoRespuestaStr = `${promMinutos}m`;
      }
    }

    const graficoEvolucion = Array.from(evolucionMap.entries()).map(([fecha, datos]) => ({
      fecha,
      leads: datos.leads,
      cierres: datos.cierres
    }));

    const graficoAsesores = Array.from(asesoresMap.entries()).map(([nombre, datos]) => ({
      nombre,
      conversion: datos.total > 0 ? Math.round((datos.ganados / datos.total) * 100) : 0
    })).sort((a, b) => b.conversion - a.conversion); 

    return {
      exito: true,
      datos: {
        tasaConversion: `${tasaConversion}%`,
        leadsGestionados: totalLeads.toString(),
        tiempoRespuesta: tiempoRespuestaStr, // ¡A partir de ahora será 100% dinámico!
        oportunidadesPerdidas: leadsPerdidos.toString(),
        graficoEvolucion, 
        graficoAsesores   
      }
    };

  } catch (error) {
    console.error("Error crítico al obtener métricas:", error);
    return { exito: false, error: "No se pudieron cargar las métricas.", datos: null };
  }
}