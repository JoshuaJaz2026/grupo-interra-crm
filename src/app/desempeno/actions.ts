"use server";

import prisma from "@/lib/prisma";

export async function obtenerMetricasDesempeno(filtroTiempo: string = "Últimos 30 días") {
  try {
    // 1. Determinar el rango de fechas basado en el filtro
    let fechaInicio = new Date();
    const hoy = new Date();

    switch (filtroTiempo) {
      case "Este mes":
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        break;
      case "Mes anterior":
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
        break;
      case "Este año":
        fechaInicio = new Date(hoy.getFullYear(), 0, 1);
        break;
      case "Últimos 30 días":
      default:
        fechaInicio.setDate(fechaInicio.getDate() - 30);
        break;
    }

    // 2. Consulta a la base de datos: Total de Leads en el rango
    const totalLeads = await prisma.lead.count({
      where: {
        fechaCaptacion: { // <- Corregido aquí
          gte: fechaInicio,
        },
      },
    });

    // 3. Consulta: Leads "Cerrados" (Ganados/Vendidos)
    const leadsCerrados = await prisma.lead.count({
      where: {
        estado: "Vendido", 
        fechaCaptacion: { // <- Corregido aquí
          gte: fechaInicio,
        },
      },
    });

    // 4. Consulta: Oportunidades Perdidas
    const leadsPerdidos = await prisma.lead.count({
      where: {
        estado: "Perdido",
        fechaCaptacion: { // <- Corregido aquí
          gte: fechaInicio,
        },
      },
    });

    // 5. Cálculo: Tasa de Conversión
    const tasaConversion = totalLeads > 0 ? ((leadsCerrados / totalLeads) * 100).toFixed(1) : "0.0";

    // 6. Preparar los datos para enviarlos a la interfaz
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
    console.error("Error al obtener métricas de desempeño:", error);
    return {
      exito: false,
      error: "No se pudieron cargar las métricas comerciales.",
      datos: null
    };
  }
}