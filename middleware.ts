import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { UserRole } from './lib/types'
import { getClientCountry, getClientIP } from './lib/headers'

export async function middleware(request: NextRequest) {
  // ============================================================================
  // LOGGING DE SECURITY PARA ENDPOINTS /api/*
  // ============================================================================
  const path = request.nextUrl.pathname
  if (path.startsWith('/api/')) {
    const country = getClientCountry(request)
    const ip = getClientIP(request)
    const method = request.method

    // Log de todos los requests a API (útil para debugging y auditoría)
    console.log(`[API] ${method} ${path} | Country: ${country} | IP: ${ip}`)
  }
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Obtener sesión del usuario
  // Envuelto en try/catch para evitar 504 si Supabase no responde en el Edge Runtime
  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user'] = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    // Si Supabase no responde, dejamos pasar el request (fail-open)
    // Las rutas protegidas verifican sesión nuevamente en el servidor
    return response
  }

  // Variables locales para protección de rutas
  const currentPath = request.nextUrl.pathname

  // ============================================================================
  // PROTECCIÓN DE RUTAS /super-admin/*
  // ============================================================================
  if (currentPath.startsWith('/super-admin')) {
    // TEMPORAL: Permitir acceso sin verificación para debugging
    console.log('🔍 Middleware: Acceso a /super-admin, usuario:', user?.id)
    return response
  }

  // ============================================================================
  // PROTECCIÓN DE RUTAS DEL DASHBOARD
  // ============================================================================
  // Rutas del dashboard (con o sin prefijo /dashboard)
  const dashboardRoutes = [
    '/dashboard',
    '/turnos',
    '/agenda',
    '/asignaciones',
    '/profesionales',
    '/servicios',
    '/consultorios',
    '/reportes',
    '/configuracion',
  ]

  const isDashboardRoute = dashboardRoutes.some(route => currentPath.startsWith(route))

  if (isDashboardRoute) {
    // Si no hay usuario, redirigir a login (página principal)
    if (!user) {
      const redirectUrl = new URL('/', request.url)
      redirectUrl.searchParams.set('redirectTo', currentPath)
      return NextResponse.redirect(redirectUrl)
    }

    // Usuario autenticado tiene acceso al dashboard
    return response
  }

  // ============================================================================
  // RUTA RAÍZ / (LOGIN)
  // ============================================================================
  if (currentPath === '/') {
    // Si ya está autenticado, redirigir según su rol
    if (user) {
      // Verificar si es super admin
      const { data: memberships } = await supabase
        .from('membership')
        .select('role, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)

      const isSuperAdmin = memberships?.some(
        (m: any) => m.role === 'super_admin' && m.is_active
      )

      if (isSuperAdmin) {
        return NextResponse.redirect(new URL('/super-admin', request.url))
      }

      return NextResponse.redirect(new URL('/institutions/select', request.url))
    }
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
  ],
}
