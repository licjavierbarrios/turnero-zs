import { NextResponse, type NextRequest } from 'next/server'
import { getClientCountry, getClientIP } from './lib/headers'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // ============================================================================
  // LOGGING DE SECURITY PARA ENDPOINTS /api/*
  // ============================================================================
  if (path.startsWith('/api/')) {
    const country = getClientCountry(request)
    const ip = getClientIP(request)
    console.log(`[API] ${request.method} ${path} | Country: ${country} | IP: ${ip}`)
  }

  // Verificar sesión leyendo la cookie del proyecto activo directamente — sin Supabase, sin red.
  // Filtramos por el project-ref activo para evitar falsos positivos con cookies de proyectos viejos.
  const hasSession = request.cookies.getAll().some(
    c => c.name.startsWith('sb-qfoptekozsyxesuqzwxz') && c.value.length > 0
  )

  // ============================================================================
  // RUTAS PROTEGIDAS — solo verificar autenticación, el rol lo chequea la página
  // ============================================================================
  const protectedPrefixes = [
    '/super-admin',
    '/dashboard',
    '/turnos',
    '/agenda',
    '/asignaciones',
    '/profesionales',
    '/servicios',
    '/consultorios',
    '/reportes',
    '/configuracion',
    '/pantallas',
    '/usuarios',
    '/sesiones',
  ]

  const isProtected = protectedPrefixes.some(prefix => path.startsWith(prefix))

  if (isProtected && !hasSession) {
    const redirectUrl = new URL('/', request.url)
    if (path !== '/') {
      redirectUrl.searchParams.set('redirectTo', path)
    }
    return NextResponse.redirect(redirectUrl)
  }

  // ============================================================================
  // RUTA RAÍZ / — redirigir si ya está autenticado
  // ============================================================================
  if (path === '/' && hasSession) {
    return NextResponse.redirect(new URL('/institutions/select', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',
    '/super-admin/:path*',
    '/dashboard/:path*',
    '/turnos/:path*',
    '/agenda/:path*',
    '/asignaciones/:path*',
    '/profesionales/:path*',
    '/servicios/:path*',
    '/consultorios/:path*',
    '/reportes/:path*',
    '/configuracion/:path*',
    '/pantallas/:path*',
    '/usuarios/:path*',
    '/sesiones/:path*',
  ],
}
