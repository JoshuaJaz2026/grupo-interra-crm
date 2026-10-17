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

export async function obtenerReglasScoring() {
  noStore();
  try {
    const reglas = await prisma.reglaScoring.findMany({
      orderBy: { id: 'asc' }
    });
    return { exito: true, datos: reglas };
  } catch (error) {
    console.error("Error al obtener reglas de scoring:", error);
    return { exito: false, datos: [] };
  }
}

export async function crearReglaScoring(datos: {
  categoria: string;
  condicion: string;
  puntaje: number;
  justificacion: string;
  tipo: string;
}) {
  try {
    const nuevaRegla = await prisma.reglaScoring.create({
      data: datos
    });
    revalidatePath('/lead-scoring');
    return { exito: true, regla: nuevaRegla };
  } catch (error: any) {
    console.error("Error al crear regla de scoring:", error);
    return { exito: false, error: "No se pudo registrar la regla." };
  }
}

export async function eliminarReglaScoring(id: number) {
  try {
    console.log(`🗑️ [NEON DELETE] Intentando eliminar la regla con ID: ${id}`);
    
    await prisma.reglaScoring.delete({
      where: { id: Number(id) } // Forzamos el tipo número por seguridad
    });
    
    console.log(`✅ [NEON SUCCESS] Regla ${id} aniquilada de la base de datos.`);
    revalidatePath('/lead-scoring');
    return { exito: true };
    
  } catch (error) {
    console.error("❌ [NEON ERROR] No se pudo eliminar la regla:", error);
    return { exito: false, error: "Fallo en la base de datos. Mira la terminal." };
  }
}

export async function actualizarReglaScoring(id: number, datos: {
  categoria: string;
  condicion: string;
  puntaje: number;
  justificacion: string;
  tipo: string;
}) {
  try {
    const reglaActualizada = await prisma.reglaScoring.update({
      where: { id: Number(id) },
      data: datos
    });
    revalidatePath('/lead-scoring');
    return { exito: true, regla: reglaActualizada };
  } catch (error) {
    console.error("❌ [NEON ERROR] No se pudo actualizar la regla:", error);
    return { exito: false, error: "No se pudo actualizar la regla en la base de datos." };
  }
}