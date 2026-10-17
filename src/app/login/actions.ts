"use server";

import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function validarLogin(email: string, pass: string) {
  try {
    // 1. Buscamos si existe un usuario con ese correo en la base de datos
    const usuario = await prisma.usuario.findUnique({
      where: { email: email }
    });

    // 2. Si el usuario no existe, o la contraseña no coincide, rebotamos
    if (!usuario || usuario.password !== pass) {
      return { exito: false, error: "El correo o la contraseña son incorrectos." };
    }

    // 3. Si todo es correcto, le damos su pase VIP (Cookie)
    // 3. Si todo es correcto, le damos su pase VIP (Cookie)
    const cookieStore = await cookies();
    cookieStore.set("crm_session", "acceso_concedido", {
      httpOnly: true, // Seguridad extrema
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // Dura 24 horas
      path: "/",
    });
    
    return { exito: true };

  } catch (error) {
    console.error("Error al validar login:", error);
    return { exito: false, error: "Error interno del servidor. Inténtalo de nuevo." };
  }
}

export async function cerrarSesion() {
  const cookieStore = await cookies();
  cookieStore.delete("crm_session"); // Destruye el pase VIP
  return { exito: true };
}