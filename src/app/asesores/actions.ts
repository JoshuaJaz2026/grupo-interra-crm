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

export async function obtenerAsesores() {
  noStore();
  try {
    const asesores = await prisma.asesor.findMany({
      orderBy: { creadoEn: 'desc' }
    });
    return { exito: true, datos: asesores };
  } catch (error) {
    console.error("Error al obtener asesores:", error);
    return { exito: false, datos: [] };
  }
}

export async function crearAsesor(datos: {
  nombres: string; apellidos: string; correo: string; telefono: string; contrasena: string;
}) {
  try {
    const existe = await prisma.asesor.findUnique({ where: { correo: datos.correo } });
    if (existe) return { exito: false, error: "El correo ya está registrado." };

    const nuevoAsesor = await prisma.asesor.create({ data: datos });
    revalidatePath('/asesores');
    return { exito: true, asesor: nuevoAsesor };
  } catch (error) {
    console.error("Error al crear asesor:", error);
    return { exito: false, error: "No se pudo registrar al asesor." };
  }
}

export async function eliminarAsesor(id: string) {
  try {
    await prisma.asesor.delete({ where: { id } });
    revalidatePath('/asesores');
    return { exito: true };
  } catch (error) {
    return { exito: false, error: "No se pudo eliminar al asesor." };
  }
}