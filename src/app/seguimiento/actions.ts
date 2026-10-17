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
    const parseBool = (val: string) => val === "Sí";

    await prisma.lead.create({
      data: {
        idLeadExcel: datos.idLeadExcel || `MANUAL-${Math.floor(Math.random()*1000)}`,
        fechaCaptacion: parseDate(datos.fechaCaptacion),
        campana: datos.campana || "Directo",
        proyecto: datos.proyecto || "General",
        fuente: datos.fuente || "Manual",
        cliente: datos.cliente,
        asesor: datos.asesor || "Sin Asignar",
        estado: datos.estado || "Nuevo",
        fechaPrimerContacto: parseDate(datos.fechaPrimerContacto),
        fechaUltimoContacto: parseDate(datos.fechaUltimoContacto),
        solicitudInfo: parseBool(datos.solicitudInfo),
        solicitudVisita: parseBool(datos.solicitudVisita),
        numInteracciones: Number(datos.numInteracciones) || 0,
        seguimientoRealizado: parseBool(datos.seguimientoRealizado),
        proximoSeguimiento: parseDate(datos.proximoSeguimiento),
        resultado: datos.resultado || "En proceso",
        fechaCierre: parseDate(datos.fechaCierre),
        puntaje: 15
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

// 🔥 NUEVA FUNCIÓN PARA ACTUALIZAR
export async function actualizarLeadSeguimiento(id: string, datos: any) {
  try {
    const parseDate = (val: string) => val && val !== "-" ? new Date(val) : null;
    const parseBool = (val: string) => val === "Sí" || val === true;

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
        estado: datos.estado,
        fechaPrimerContacto: parseDate(datos.fechaPrimerContacto),
        fechaUltimoContacto: parseDate(datos.fechaUltimoContacto),
        solicitudInfo: parseBool(datos.solicitudInfo as any),
        solicitudVisita: parseBool(datos.solicitudVisita as any),
        numInteracciones: Number(datos.numInteracciones) || 0,
        seguimientoRealizado: parseBool(datos.seguimientoRealizado as any),
        proximoSeguimiento: parseDate(datos.proximoSeguimiento),
        resultado: datos.resultado,
        fechaCierre: parseDate(datos.fechaCierre),
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


// (Mantén las funciones de obtener, crear y actualizar arriba...)

// 🔥 NUEVA FUNCIÓN PARA ELIMINAR
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

// 🔥 INYECTOR MASIVO DE EXCEL
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
      // Calculamos un puntaje inicial basado en sus interacciones del excel
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

// 🔥 FUNCIÓN PARA VACIAR TODA LA BASE DE DATOS
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