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

// 🔥 ALGORITMO MAESTRO DE LEAD SCORING (Basado estrictamente en la Tabla 5)
function calcularPuntajeLead(lead: any) {
  let score = 0;

  // 1. Interacciones (+5 puntos por cada vez que interactuó)
  score += (Number(lead.numInteracciones) || 0) * 5;

  // 2. Solicitud de Visita e Información
  if (lead.solicitudVisita === true || lead.solicitudVisita === "Sí") score += 30;
  if (lead.solicitudInfo === true || lead.solicitudInfo === "Sí") score += 10;

  // 3. Estado de la oportunidad comercial (Pipeline)
  const estado = (lead.estado || "").toLowerCase();
  switch (estado) {
    case "negociación":
    case "negociacion":
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
    case "ganado":
      return 100; // Si ya se vendió, puntaje perfecto.
    case "perdido":
      return 0; // Si se perdió, puntaje cero.
  }

  // 4. Seguimiento reciente
  if (lead.seguimientoRealizado === true || lead.seguimientoRealizado === "Sí") {
    score += 10; 
  }

  // 5. Tiempo sin contacto (Evaluamos si está caliente o se enfrió)
  if (lead.fechaUltimoContacto && lead.fechaUltimoContacto !== "-") {
    const hoy = new Date();
    const diasSinContacto = (hoy.getTime() - new Date(lead.fechaUltimoContacto).getTime()) / (1000 * 3600 * 24);
    
    if (diasSinContacto <= 3) {
      score += 10; // Bono: Interacción muy reciente
    } else if (diasSinContacto > 7) {
      score -= 15; // Penalización: Ya pasó más de una semana sin hablarle
    }
  }

  // Aseguramos límites: ni menos de 0, ni más de 100.
  score = Math.max(0, score);
  score = Math.min(100, score);
  
  return score;
}

export async function obtenerLeadsSeguimiento() {
  noStore();
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { creadoEn: 'desc' }
    });
    return { exito: true, datos: leads };
  } catch (error) {
    console.error("Error al obtener leads:", error);
    return { exito: false, datos: [] };
  }
}

export async function crearLeadSeguimiento(datos: any) {
  try {
    const parseDate = (val: string) => val ? new Date(val) : null;
    const parseBool = (val: any) => val === "Sí" || val === true;

    const solInfo = parseBool(datos.solicitudInfo);
    const solVisita = parseBool(datos.solicitudVisita);
    const estado = datos.estado || "Nuevo";

    // Llamamos a la fórmula maestra
    const scoreCalculado = calcularPuntajeLead({
      ...datos,
      solicitudInfo: solInfo,
      solicitudVisita: solVisita,
      estado: estado
    });

    await prisma.lead.create({
      data: {
        idLeadExcel: datos.idLeadExcel || `MANUAL-${Math.floor(Math.random()*1000)}`,
        fechaCaptacion: parseDate(datos.fechaCaptacion),
        campana: datos.campana || "Directo",
        proyecto: datos.proyecto || "General",
        fuente: datos.fuente || "Manual",
        cliente: datos.cliente,
        asesor: datos.asesor || "Sin Asignar",
        estado: estado,
        fechaPrimerContacto: parseDate(datos.fechaPrimerContacto),
        fechaUltimoContacto: parseDate(datos.fechaUltimoContacto),
        solicitudInfo: solInfo,
        solicitudVisita: solVisita,
        numInteracciones: Number(datos.numInteracciones) || 0,
        seguimientoRealizado: parseBool(datos.seguimientoRealizado),
        proximoSeguimiento: parseDate(datos.proximoSeguimiento),
        resultado: datos.resultado || "En proceso",
        fechaCierre: parseDate(datos.fechaCierre),
        puntaje: scoreCalculado 
      }
    });
    revalidatePath('/seguimiento');
    revalidatePath('/dashboard');
    return { exito: true };
  } catch (error) {
    console.error(error);
    return { exito: false, error: "No se pudo guardar el lead." };
  }
}

export async function actualizarLeadSeguimiento(id: string, datos: any) {
  try {
    const parseDate = (val: string) => val && val !== "-" ? new Date(val) : null;
    const parseBool = (val: any) => val === "Sí" || val === true;

    const solInfo = parseBool(datos.solicitudInfo);
    const solVisita = parseBool(datos.solicitudVisita);
    const estado = datos.estado || "Nuevo";

    // Llamamos a la fórmula maestra
    const scoreCalculado = calcularPuntajeLead({
      ...datos,
      solicitudInfo: solInfo,
      solicitudVisita: solVisita,
      estado: estado
    });

    await prisma.lead.update({
      where: { id },
      data: {
        idLeadExcel: datos.idLeadExcel,
        fechaCaptacion: parseDate(datos.fechaCaptacion),
        campana: datos.campana,
        proyecto: datos.proyecto,
        fuente: datos.fuente,
        cliente: datos.cliente,
        asesor: datos.asesor,
        estado: estado,
        fechaPrimerContacto: parseDate(datos.fechaPrimerContacto),
        fechaUltimoContacto: parseDate(datos.fechaUltimoContacto),
        solicitudInfo: solInfo,
        solicitudVisita: solVisita,
        numInteracciones: Number(datos.numInteracciones) || 0,
        seguimientoRealizado: parseBool(datos.seguimientoRealizado),
        proximoSeguimiento: parseDate(datos.proximoSeguimiento),
        resultado: datos.resultado,
        fechaCierre: parseDate(datos.fechaCierre),
        puntaje: scoreCalculado
      }
    });
    revalidatePath('/seguimiento');
    revalidatePath('/dashboard');
    return { exito: true };
  } catch (error) {
    console.error(error);
    return { exito: false, error: "No se pudo actualizar el lead." };
  }
}

export async function eliminarLeadSeguimiento(id: string) {
  try {
    await prisma.lead.delete({
      where: { id }
    });
    revalidatePath('/seguimiento');
    revalidatePath('/dashboard');
    return { exito: true };
  } catch (error) {
    console.error(error);
    return { exito: false, error: "No se pudo eliminar el lead." };
  }
}

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

      const scoreCalculado = calcularPuntajeLead(leadBase);

      return {
        ...leadBase,
        puntaje: scoreCalculado 
      };
    });

    await prisma.lead.createMany({
      data: leadsFormateados,
      skipDuplicates: true, 
    });

    revalidatePath('/seguimiento');
    revalidatePath('/dashboard');
    return { exito: true };
  } catch (error) {
    console.error("Error en carga masiva:", error);
    return { exito: false, error: "Error interno al inyectar los leads a la base de datos." };
  }
}

export async function eliminarTodosLosLeads() {
  try {
    await prisma.lead.deleteMany({});
    revalidatePath('/seguimiento');
    revalidatePath('/dashboard');
    return { exito: true };
  } catch (error) {
    console.error("Error al vaciar la tabla:", error);
    return { exito: false, error: "Ocurrió un error al intentar vaciar la base de datos." };
  }
}

// 🔥 FUNCIÓN DEL BOTÓN DORADO "CALCULAR SCORES"
export async function recalcularScoresMasivo() {
  try {
    const leads = await prisma.lead.findMany();
    let actualizados = 0;

    for (const lead of leads) {
      // 1. Tomamos cada cliente de la base de datos
      // 2. Lo pasamos por el algoritmo
      const nuevoScore = calcularPuntajeLead(lead);

      // 3. Si el puntaje cambió, lo actualizamos
      if (lead.puntaje !== nuevoScore) {
        await prisma.lead.update({
          where: { id: lead.id },
          data: { puntaje: nuevoScore } 
        });
        actualizados++;
      }
    }

    revalidatePath('/seguimiento');
    revalidatePath('/dashboard');
    return { exito: true, mensaje: `¡Excelente! Se analizaron las interacciones y se actualizaron los puntajes de ${actualizados} clientes en tiempo real.` };
  } catch (error) {
    console.error("Error recalculando scores:", error);
    return { exito: false, error: "Ocurrió un error al recalcular los puntajes en la base de datos." };
  }
}