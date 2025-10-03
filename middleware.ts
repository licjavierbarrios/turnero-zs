import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { UserRole } from './lib/types'

export async function middleware(request: NextRequest) {
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
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // ============================================================================
  // PROTECCIÓN DE RUTAS /super-admin/*
  // ============================================================================
  if (path.startsWith('/super-admin')) {
    // Si no hay usuario, redirigir a login
    if (!user) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirectTo', path)
      return NextResponse.redirect(redirectUrl)
    }

    // Verificar si el usuario tiene rol super_admin
    const { data: memberships } = await supabase
      .from('membership')
      .select('role, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)

    const isSuperAdmin = memberships?.some(
      (m) => m.role === 'super_admin' && m.is_active
    )

    // Si no es super admin, redirigir a dashboard normal
    if (!isSuperAdmin) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Super admin tiene acceso, continuar
    return response
  }

  // ============================================================================
  // PROTECCIÓN DE RUTAS /dashboard/*
  // ============================================================================
  if (path.startsWith('/dashboard')) {
    // Si no hay usuario, redirigir a login
    if (!user) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirectTo', path)
      return NextResponse.redirect(redirectUrl)
    }

    // Usuario autenticado tiene acceso al dashboard
    return response
  }

  // ============================================================================
  // RUTA /login
  // ============================================================================
  if (path === '/login') {
    // Si ya está autenticado, redirigir según su rol
    if (user) {
      // Verificar si es super admin
      const { data: memberships } = await supabase
        .from('membership')
        .select('role, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)

      const isSuperAdmin = memberships?.some(
        (m) => m.role === 'super_admin' && m.is_active
      )

      if (isSuperAdmin) {
        return NextResponse.redirect(new URL('/super-admin/zonas', request.url))
      }

      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/super-admin/:path*',
    '/dashboard/:path*',
    '/login',
  ],
}
