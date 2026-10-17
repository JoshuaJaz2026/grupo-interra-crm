import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. Preguntamos si el usuario tiene la cookie VIP
  const tieneSesion = request.cookies.get('crm_session');
  const rutaActual = request.nextUrl.pathname;

  // 2. Definimos cuáles son las rutas privadas
  const esRutaPrivada = rutaActual.startsWith('/dashboard') || 
                        rutaActual.startsWith('/seguimiento') || 
                        rutaActual.startsWith('/lead-scoring') || 
                        rutaActual.startsWith('/asesores');

  // 3. Si quiere ir a una ruta privada y NO tiene sesión -> Patada al Login
  if (esRutaPrivada && !tieneSesion) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 4. Si ya está logueado y trata de ir a la página de Login -> Patada al Dashboard
  if (rutaActual === '/login' && tieneSesion) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 5. Caso especial: Si entra a la ruta raíz "/" y no tiene sesión, mandarlo al login
  if (rutaActual === '/' && !tieneSesion) {
    return NextResponse.redirect(new URL('/login', request.url));
  } else if (rutaActual === '/' && tieneSesion) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// Configuración para que el Middleware solo vigile estas rutas y no gaste recursos
export const config = {
  matcher: ['/', '/login', '/dashboard/:path*', '/seguimiento/:path*', '/lead-scoring/:path*', '/asesores/:path*'],
};