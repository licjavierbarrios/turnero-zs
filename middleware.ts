import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify, decodeJwt } from 'jose'
import { getClientCountry, getClientIP } from './lib/headers'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // ============================================================================
  // LOGGING DE SECURITY PARA ENDPOINTS /api/*
  // ============================================================================
  if (path.startsWith('/api/')) {
    const country = getClientCountry(request)
    const ip = getClientIP(request)
    console.log(`[API] ${request.method} ${path} | Country: ${country} | IP: ${ip}`)
  }

  // ============================================================================
  // PANTALLAS TV — validar cookie de sesión JWT (sin llamadas HTTP, solo crypto)
  // ============================================================================
  if (path.startsWith('/pantalla/')) {
    const token = request.cookies.get('screen_auth')?.value

    if (!token) {
      // Sin cookie → redirigir a raíz (no sabemos a qué TV pertenece)
      return NextResponse.redirect(new URL('/', request.url))
    }

    try {
      const secret = new TextEncoder().encode(process.env.SCREEN_SESSION_SECRET!)
      await jwtVerify(token, secret)
      // JWT válido → continuar
      return NextResponse.next()
    } catch {
      // JWT expirado o inválido → intentar leer tvPath del payload para redirigir al PIN
      try {
        const payload = decodeJwt(token)
        const tvPath = payload.tvPath as string | undefined
        return NextResponse.redirect(new URL(tvPath || '/', request.url))
      } catch {
        return NextResponse.redirect(new URL('/', request.url))
      }
    }
  }

  // ============================================================================
  // RUTAS DE DASHBOARD — verificar sesión Supabase
  // Leer la cookie directamente sin llamadas HTTP para evitar timeout en Edge.
  // ============================================================================
  const hasSession = request.cookies.getAll().some(
    c => c.name.startsWith('sb-qfoptekozsyxesuqzwxz') && c.value.length > 0
  )

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
    '/pantalla/:path*',
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
