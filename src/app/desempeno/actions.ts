"use server";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { unstable_noStore as noStore } from "next/cache";

// Usamos la misma conexión directa y segura que en la tabla de Seguimiento
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function obtenerMetricasDesempeno(
  filtroTiempo: string = "Últimos 30 días",
  fechaInicioCustom?: string,
  fechaFinCustom?: string
) {
  noStore(); // Evita que Next.js se cuelgue intentando guardar caché de esta consulta

  try {
    console.log("Consultando métricas en la base de datos...");

    // 🔥 PRUEBA: Contamos TODOS los leads sin importar la fecha
    const totalLeads = await prisma.lead.count();
    console.log(`¡Éxito! Se encontraron ${totalLeads} leads en total.`);
    
    const leadsCerrados = await prisma.lead.count({ 
      where: { 
        estado: { in: ["Ganado", "Vendido", "GANADO"] } 
      } 
    });
    
    const leadsPerdidos = await prisma.lead.count({ 
      where: { 
        estado: { in: ["Perdido", "PERDIDO"] }
      } 
    });

    const tasaConversion = totalLeads > 0 ? ((leadsCerrados / totalLeads) * 100).toFixed(1) : "0.0";

    return {
      exito: true,
      datos: {
        tasaConversion: `${tasaConversion}%`,
        leadsGestionados: totalLeads.toString(),
        tiempoRespuesta: "14m", 
        oportunidadesPerdidas: leadsPerdidos.toString(),
      }
    };

  } catch (error) {
    console.error("Error crítico al obtener métricas:", error);
    return { exito: false, error: "No se pudieron cargar las métricas.", datos: null };
  }
}