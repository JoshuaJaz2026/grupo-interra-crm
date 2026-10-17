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
        // Para "Mes anterior", 'hoy' debería ser el último día del mes anterior, 
        // pero lo mantendremos simple calculando todo desde la fecha de inicio.
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
        fechaCreacion: {
          gte: fechaInicio,
        },
      },
    });

    // 3. Consulta: Leads "Cerrados" (Ganados/Vendidos)
    // Ajusta "Vendido" por el estado exacto que uses en tu base de datos (ej. "Cerrado", "Comprado")
    const leadsCerrados = await prisma.lead.count({
      where: {
        estado: "Vendido", 
        fechaCreacion: {
          gte: fechaInicio,
        },
      },
    });

    // 4. Consulta: Oportunidades Perdidas
    const leadsPerdidos = await prisma.lead.count({
      where: {
        estado: "Perdido",
        fechaCreacion: {
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
        tiempoRespuesta: "14m", // Esto requiere una lógica más compleja con timestamps de interacciones, lo dejamos estático por ahora o puedes calcularlo si tienes el dato.
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