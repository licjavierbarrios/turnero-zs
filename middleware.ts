import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
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

  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  // Refrescar sesión de Supabase (única operación permitida en Edge middleware)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Solo verificar si hay sesión activa — sin queries a la DB
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    // Si Supabase Auth no responde, fail-closed en rutas protegidas
  }

  const currentPath = request.nextUrl.pathname

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

  const isProtected = protectedPrefixes.some(prefix => currentPath.startsWith(prefix))

  if (isProtected && !user) {
    const redirectUrl = new URL('/', request.url)
    if (currentPath !== '/') {
      redirectUrl.searchParams.set('redirectTo', currentPath)
    }
    return NextResponse.redirect(redirectUrl)
  }

  // ============================================================================
  // RUTA RAÍZ / — redirigir si ya está autenticado
  // ============================================================================
  if (currentPath === '/' && user) {
    return NextResponse.redirect(new URL('/institutions/select', request.url))
  }

  return response
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
