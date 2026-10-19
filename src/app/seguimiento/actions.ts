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
    const parseBool = (val: any) => val === "Sí" || val === true; // <- Evitamos el choque de tipos

    const interacciones = Number(datos.numInteracciones) || 0;
    const solInfo = parseBool(datos.solicitudInfo);
    const solVisita = parseBool(datos.solicitudVisita);
    const estado = datos.estado || "Nuevo";

    let scoreCalculado = interacciones * 5;
    if (solInfo) scoreCalculado += 20;
    if (solVisita) scoreCalculado += 40;
    
    switch (estado.toLowerCase()) {
      case "contactado": scoreCalculado += 5; break;
      case "interesado": scoreCalculado += 15; break;
      case "negociación": 
      case "negociacion": scoreCalculado += 30; break;
      case "ganado": scoreCalculado = 100; break;
      case "perdido": scoreCalculado = 0; break;
    }
    if (scoreCalculado > 100) scoreCalculado = 100;

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
        numInteracciones: interacciones,
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

    const interacciones = Number(datos.numInteracciones) || 0;
    const solInfo = parseBool(datos.solicitudInfo);
    const solVisita = parseBool(datos.solicitudVisita);
    const estado = datos.estado || "Nuevo";

    let scoreCalculado = interacciones * 5;
    if (solInfo) scoreCalculado += 20;
    if (solVisita) scoreCalculado += 40;
    
    switch (estado.toLowerCase()) {
      case "contactado": scoreCalculado += 5; break;
      case "interesado": scoreCalculado += 15; break;
      case "negociación": 
      case "negociacion": scoreCalculado += 30; break;
      case "ganado": scoreCalculado = 100; break;
      case "perdido": scoreCalculado = 0; break;
    }
    if (scoreCalculado > 100) scoreCalculado = 100;

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
        numInteracciones: interacciones,
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
      const interacciones = Number(row["N° interacciones"]) || 0;
      const solInfo = parseBool(row["Solicitud información"]);
      const solVisita = parseBool(row["Solicitud visita"]);
      const estado = String(row["Estado del lead"] || "Nuevo");

      let calcScore = (interacciones * 5) + (solVisita ? 40 : 0) + (solInfo ? 20 : 0);
      switch (estado.toLowerCase()) {
        case "contactado": calcScore += 5; break;
        case "interesado": calcScore += 15; break;
        case "negociación": 
        case "negociacion": calcScore += 30; break;
        case "ganado": calcScore = 100; break; 
      }
      if (calcScore > 100) calcScore = 100;

      return {
        idLeadExcel: String(row["ID Lead"] || `EXT-${Math.floor(Math.random() * 10000)}`),
        fechaCaptacion: parseDate(row["Fecha captación"]),
        campana: String(row["Campaña"] || "Orgánico"),
        proyecto: String(row["Proyecto"] || "General"),
        fuente: String(row["Fuente"] || ""),
        cliente: String(row["Cliente"] || "Desconocido"),
        asesor: String(row["Asesor responsable"] || "Sin Asignar"),
        estado: estado,
        fechaPrimerContacto: parseDate(row["Fecha primer contacto"]),
        fechaUltimoContacto: parseDate(row["Fecha último contacto"]),
        solicitudInfo: solInfo,
        solicitudVisita: solVisita,
        numInteracciones: interacciones,
        seguimientoRealizado: parseBool(row["Seguimiento realizado"]),
        proximoSeguimiento: parseDate(row["Próximo seguimiento"]),
        resultado: String(row["Resultado"] || "En proceso"),
        fechaCierre: parseDate(row["Fecha cierre"]),
        puntaje: calcScore 
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

export async function recalcularScoresMasivo() {
  try {
    const leads = await prisma.lead.findMany();
    let actualizados = 0;

    for (const lead of leads) {
      let nuevoScore = 0;

      const interacciones = parseInt(lead.numInteracciones?.toString() || "0");
      nuevoScore += interacciones * 5;

      // Solución TS2367: Prisma ya nos entrega booleanos puros, comparamos directamente
      if (lead.solicitudInfo) nuevoScore += 20; 
      if (lead.solicitudVisita) nuevoScore += 40; 

      const estado = (lead.estado || "").toLowerCase();
      switch (estado) {
        case "contactado": nuevoScore += 5; break;
        case "interesado": nuevoScore += 15; break;
        case "negociación": 
        case "negociacion": nuevoScore += 30; break;
        case "ganado": nuevoScore = 100; break; 
        case "perdido": nuevoScore = 0; break;  
      }

      if (nuevoScore > 100) nuevoScore = 100;

      await prisma.lead.update({
        where: { id: lead.id },
        data: { puntaje: nuevoScore } 
      });
      
      actualizados++;
    }

    return { exito: true, mensaje: `¡Se recalcularon los puntajes de ${actualizados} prospectos!` };
  } catch (error) {
    console.error("Error recalculando scores:", error);
    return { exito: false, error: "Ocurrió un error al recalcular los puntajes en la base de datos." };
  }
}